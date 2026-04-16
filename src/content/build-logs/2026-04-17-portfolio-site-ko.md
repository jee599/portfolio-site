---
title: "Opus 4.7 출시일, Claude Code로 한 것들: 시스템 카드 분석·DEV.to 발행·10개 목업 병렬 생성"
project: "portfolio-site"
date: 2026-04-17
lang: ko
tags: [claude-code, claude-opus-4-7, design, multi-agent, debugging]
description: "Opus 4.7 릴리스 당일, 232페이지 시스템 카드를 읽고 DEV.to 아티클을 발행했다. 같은 날 spoonai 디자인 목업 10개를 병렬 에이전트로 뽑고, 텔레그램 봇 멀티프로세스 충돌도 디버깅했다. 10세션, 1,000+ tool call 기록."
---

4월 16일, Claude Opus 4.7이 공개됐다. `adaptive thinking`이 유일한 thinking 모드가 되면서 기존 `budget_tokens` API가 조용히 깨졌다. 이걸 릴리스 당일에 파악하고 마이그레이션 가이드를 DEV.to에 올렸다.

같은 날 10개 세션, 1,000번 넘는 tool call. 프로젝트 4개를 동시에 다뤘다.

**TL;DR** Opus 4.7 출시일에 시스템 카드를 직접 읽고, 깨진 API를 분석해 기사를 발행했다. spoonai 디자인은 10개 목업을 병렬로 뽑아 비교했고, 텔레그램 봇은 멀티프로세스 충돌을 추적해 원인을 찾았다.

## Opus 4.7 릴리스 당일 워크플로

Anthropic이 공식 시스템 카드(232페이지)를 올렸고, `WebFetch`로 PDF를 직접 내려받아 읽었다. 모델 ID는 `claude-opus-4-7`, 가격은 4.6과 동일($5/$25 per MTok), 1M 컨텍스트. 가장 중요한 변화는 thinking 모드였다.

4.6까지는 `budget_tokens`를 `thinking` 블록에 직접 넣었다. 4.7은 `type: "enabled"` 방식의 adaptive thinking만 지원한다. `budget_tokens`를 그대로 넣으면 **400 에러**. 조용한 breaking change였다.

```typescript
// 4.6 방식 — 4.7에서 400 에러
{
  thinking: { type: "enabled", budget_tokens: 5000 }
}

// 4.7 방식 — budget_tokens 제거
{
  thinking: { type: "enabled" }
}
```

이걸 캐치해서 기사 제목을 잡았다: *"Opus 4.7 just killed budget_tokens: what broke and how to migrate"*. The Information 단독 리크(4/14)부터 공식 릴리스까지 타임라인을 정리하고, `auto-publish` 스킬로 DEV.to + Hashnode에 동시 발행했다. OpenAI duct-tape 이미지 모델 건도 묶어서 2개 아티클을 병렬 에이전트가 각각 전담해 작성했다.

세션 4 기준: Bash 74회, WebFetch 8회, Edit 8회, TaskUpdate 10회.

## 10개 디자인 목업을 병렬로 뽑은 이유

spoonai 디자인 리팩토링은 3시간짜리 세션이었다(세션 8, tool call 383회). 문제는 두 가지였다. 아카이브 페이지에서 이미지가 안 보였고, 모바일 레이아웃이 깨졌다.

이미지 문제는 코드를 읽자마자 원인이 보였다. `ArchiveEntry` 타입에 `image` 필드 자체가 없었다. `getArchiveEntries()`가 `date/title/summary`만 담고 `meta.image`를 버리고 있었다. "이미지가 안 보이는" 게 아니라 애초에 렌더링 안 한 거였다.

디자인 방향은 단일 제안 대신 10개 목업을 병렬 에이전트로 뽑아 비교했다.

```
agent 1 → bento-grid
agent 2 → masonry (pinterest)
agent 3 → neo-brutalism
agent 4 → swiss tabular
agent 5 → japanese kinfolk
agent 6 → netflix cinema
agent 7 → Y2K chrome
agent 8 → dashboard ticker
...
```

각 에이전트가 HTML 파일로 목업을 생성하고 로컬 서버에 띄워서 비교했다. "다 별로"라는 피드백이 돌아왔을 때 이미 방향 선택에 소요되는 시간은 0에 가까웠다. 결국 masonry 스타일로 결정하고 `ArticleCard`, `HomeContent`, `SubscribeForm`, `globals.css`를 순서대로 수정했다.

모바일 고려는 처음부터 포함했다. 에이전트 브리핑에 "데스크톱·폰 프레임 둘 다 렌더링"을 명시했다.

## Vercel env 개행문자 버그

사주 프로젝트 관리자 로그인이 안 된다는 이슈(세션 3). 비밀번호 `920802`가 맞는데 401이 반복됐다.

`.env`는 맞았다. Vercel 대시보드에서 환경변수를 확인하니 `ADMIN_PASSWORD="920802\n"`으로 저장돼 있었다. 뒤에 개행문자가 붙은 거다. 사용자가 `920802`를 입력하면 서버는 `920802\n`과 비교해서 `!==`. 코드 버그가 아니라 입력 단계 문제였다.

진단까지 Bash 10회, Read 5회. 코드를 건드릴 필요 없이 Vercel 대시보드에서 값을 다시 입력하는 걸로 끝났다.

## 텔레그램 봇 멀티프로세스 충돌

세션 5와 9를 합쳐 두 번 디버깅했다. 증상은 Claude에서 텔레그램으로 보내는 건 됐는데, 텔레그램에서 Claude로 오는 메시지가 현재 세션에 안 닿는 거였다.

원인은 멀티프로세스 충돌이었다. Claude 세션이 여러 개 떠있을 때 각 세션이 자체 `bun server.ts`를 띄운다. Telegram long polling은 토큰당 하나만 가능한데(`getUpdates`는 동시 호출 시 409 Conflict), 죽은 세션의 프로세스가 폴링 락을 잡고 있으면 살아있는 세션으로 메시지가 안 온다.

```bash
# 확인 명령
ps aux | grep "server.ts" | grep -v grep
# → PID 15622 (3시간 된 구 프로세스)
# → PID 31885 (신 프로세스, 다른 세션 담당)
```

해결책은 단순했다. 모든 server.ts 프로세스를 종료하고 `/reload-plugins`로 현재 세션이 봇을 새로 잡게 한다. 단, Claude 세션이 여러 개 열려있으면 이 문제는 계속 재발한다.

## contextzip 자기 개선

세션 10은 contextzip 자체를 고도화하는 작업이었다(tool call 249회). contextzip은 git/npm 같은 일반 CLI 명령을 가로채서 불필요한 출력을 필터링하고 Claude 컨텍스트 토큰을 아끼는 프록시 도구다.

기존 소스를 업스트림 레포에서 최신 버전으로 업데이트하고, 여기에 추가 기능을 올렸다. 구현 검증은 서브에이전트 4개를 병렬로 돌렸다.

```
agent → playwright_cmd 검증
agent → 새 필터 효과 분석
agent → DSL 확장 타당성 검토
agent → context-history 레이어 구조 검토
```

서브에이전트가 각자 코드를 읽고 punch-list 형태로 결과를 반환했다. 직접 검증하는 것보다 시간과 컨텍스트를 아낀다.

## Harness × Hermes 리서치

세션 6에서 "Claude Code 하네스 디자인"과 "Hermes 에이전트 프레임워크"를 각각 서브에이전트 2명씩 배치해 병렬 딥리서치를 돌렸다.

핵심 발견은 두 가지였다. Anthropic 공식 권고는 하네스 **최소주의** — 관찰된 실패 이후에만 추가. 그런데 당시 `~/.claude/`는 CLAUDE.md 82줄 + MEMORY 92KB + 스킬 20개 이상으로 이미 무거운 상태였다. 두 번째는 `~/.claude/agents`의 심볼릭 링크가 깨져 있어서 커스텀 서브에이전트 로딩이 안 되고 있었다는 것.

리서치 결과를 바탕으로 hooks 4개(`commit-cleanliness.sh`, `protect-files.sh`, `sticky-rules.sh`, `trajectory-log.sh`)와 에이전트 파일 2개, 커맨드 3개를 생성했다.

## 숫자로 보기

| | 수치 |
|---|---|
| 세션 수 | 10 |
| 총 tool call | ~1,060 |
| 가장 긴 세션 | 세션 8 (3h 6min, 383 calls) |
| 병렬 디자인 목업 | 10개 |
| 병렬 리서치 에이전트 | 4명 |
| 수정된 파일 | 40개+ |

하루에 프로젝트 4개를 동시에 다루는 건 Claude Code 없이는 불가능한 페이스다. 에이전트 병렬화와 스킬 시스템이 없었다면 디자인 목업 비교만 반나절이 걸렸을 것이다.
