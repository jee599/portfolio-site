---
title: "에이전트로 에이전트를 만들다 — AgentCrow + refmade, 808 tool calls"
project: "portfolio-site"
date: 2026-03-28
lang: ko
tags: [claude-code, agentcrow, refmade, parallel-agents, cli-refactor]
description: "하루 두 세션, 808번의 도구 호출. AgentCrow CLI 리팩토링과 refmade UI 레퍼런스 병렬 구현을 에이전트가 에이전트를 만드는 방식으로 해결한 기록."
---

하루에 두 프로젝트, 총 808번의 도구 호출. AgentCrow는 에이전트 디스패처인데, 그 AgentCrow를 Claude Code 에이전트로 만들었다. 메타가 따로 없다.

**TL;DR** AgentCrow CLI 전면 리팩토링(598 tool calls, 6h 29min)과 refmade UI 레퍼런스 병렬 구현(210 tool calls, 3h 26min)을 한 세션씩 진행했다. 에이전트를 병렬로 최대 5개 돌리는 방식이 핵심이었다.

## "다 해줘" 한 마디로 CLI 전체를 뒤집다

AgentCrow는 Claude Code 에이전트 자동 디스패치 도구다. `npm`에 퍼블리시된 v3.4.3이었는데, 프로젝트를 전체 파악시키고 "수정할 부분이나 보완 / 더 구현해야할 부분 모든 분야에서"라고 물었다.

분석 결과가 나왔다. `VERSION`이 `cli.ts:33`과 `package.json`에 이중으로 관리되고 있었고, `src/cli.ts` 하나에 모든 커맨드가 뭉쳐 있었다. 74개 테스트가 통과하고 있었지만 구조 자체가 확장 불가한 상태였다.

"다 해줘"라고 했다.

결과적으로 `src/cli.ts`가 12개 파일로 쪼개졌다.

```
src/
  cli.ts              — main + arg parsing만
  commands/
    init.ts
    agents.ts
    compose.ts
    lifecycle.ts
    doctor.ts
    update.ts
    uninstall.ts
    ...
  utils/
    constants.ts      — VERSION 단일 관리
    hooks.ts
    history.ts
    ...
```

테스트는 74개에서 86개로 늘었다. 기존 `cli.test.ts`가 구 구조에 의존하고 있어서 통째로 업데이트해야 했다. 수정 파일 28개, 신규 파일 31개. 한 세션에서 처리한 규모치고는 크다.

## 에이전트를 검증하는 에이전트

AgentCrow의 핵심 기능은 에이전트 페르소나 자동 주입이다. 프롬프트를 분해해서 역할에 맞는 에이전트를 `agent teams`에 넘기는 방식인데, 9개의 builtin 에이전트 YAML이 있었다.

영문 에이전트를 추가하면서 "에이전트들 품질 검증해줘"라고 했다. 그러자 Claude가 두 에이전트를 병렬로 디스패치했다.

- **Research best agent personas on GitHub**: 경쟁 에이전트 프레임워크 조사
- **Audit builtin agent quality**: 로컬 YAML 14개 스키마 일관성 검사

GitHub 조사 에이전트가 `awesome-claude-code-subagents`, `agency-agents` 등 주요 레포를 뒤지는 동안, 감사 에이전트는 로컬 YAML 14개를 읽고 `output_format`, `example` 필드 누락 여부를 체크했다. 두 작업이 동시에 끝났다.

이후 `output_format`과 `example` 섹션을 9개 에이전트에 추가하는 작업, 영문/한국어/다국어 README 동기화도 에이전트 3개씩 병렬로 돌렸다.

## Rate Limit 벽

세션 중반에 한 번 막혔다. "You've hit your limit · resets 4am (Asia/Seoul)"

한 세션에 `<synthetic>` 모델로 598 tool calls를 다 써버린 것이다. 세션 2는 기록이 없다. "agentcrow 적용됐어?"라는 질문에 limit 메시지만 돌아왔다.

다음 날 새 세션(`claude-opus-4-6`)에서 다시 시작했다. 매번 반복되는 패턴인데, 대용량 작업을 한 세션에 밀어넣기보다 체크포인트를 잘 남기는 게 낫다. AgentCrow 세션이 끝날 때 "새 세션에서 이렇게 말하면 된다"는 안내 메시지를 남겨뒀기 때문에 이어가는 데 문제가 없었다.

## 병렬 에이전트로 UI 레퍼런스 83개 구현

refmade는 실제 서비스 사이트(Stripe, Linear, Supabase, Arc, Vercel 등)를 HTML로 재현하는 프로젝트다. 레퍼런스 사진이 있고, 그걸 보고 구현한 다음 원본과 비교해서 9점 이상이면 PASS 처리한다.

미완료 레퍼런스가 83개 남아있었다. 세션 초반에 5개 에이전트를 동시에 디스패치했다.

각 에이전트는 독립적으로 작업했다. 원본 스크린샷을 읽고, 기존 HTML을 파악하고, 수정하거나 재작성하고, Playwright로 구현 스크린샷을 캡처하고, 원본과 비교해서 자체 점수를 매겼다.

에이전트 중 몇 개는 작업 도중 rate limit에 걸렸다. task output에 "You've hit your limit · resets 11pm (Asia/Seoul)"만 달랑 들어왔다. 그 에이전트들은 "다시 진행해"로 재디스패치했다.

3시간 26분, 210 tool calls로 056~083 구간 대부분을 마쳤다. 배치당 평균 점수는 9.0~9.3/10. Stripe, Linear, Vercel, Supabase, Arc, Raycast, Notion, Clerk 전부 9점 이상으로 통과했다.

## 도구 사용 통계

| 도구 | 횟수 | 비중 |
|------|------|------|
| Read | 214 | 26% |
| Bash | 197 | 24% |
| Edit | 124 | 15% |
| TaskUpdate | 83 | 10% |
| Agent | 72 | 9% |
| TaskCreate | 45 | 6% |
| Write | 34 | 4% |
| Grep | 22 | 3% |
| 기타 | 17 | 2% |

`Read`가 1위다. 모르는 코드에 손대기 전에 반드시 읽는다. 덕분에 "이미 있는 코드를 통째로 다시 쓰는" 실수를 줄일 수 있다.

`Agent`가 72회다. 파일 수정이 겹치지 않는 작업은 전부 병렬 에이전트로 분배했다. 한 에이전트가 GitHub를 뒤지는 동안 다른 에이전트가 로컬 파일을 감사하고, 또 다른 에이전트가 README를 번역한다.

## 병렬 에이전트 쓸 수 있는 조건

병렬 디스패치는 파일 충돌이 없을 때만 쓴다. 같은 파일을 두 에이전트가 동시에 건드리면 충돌이 난다. 레퍼런스마다 독립된 HTML 파일 하나씩 담당하는 refmade 구조가 병렬에 딱 맞았다.

AgentCrow 세션에서도 명확히 나뉘었다. Research 에이전트와 Audit 에이전트가 건드리는 파일이 겹치지 않는다. README 번역 에이전트들도 각각 언어별로 다른 파일을 담당했다.

반대로 `cli.ts` 리팩토링은 순차로 진행했다. 파일 구조 자체를 바꾸는 작업이라 에이전트 하나가 끝난 다음 빌드와 테스트를 확인하고 다음으로 넘어갔다. 순서가 있는 작업에 병렬을 쓰면 꼬인다.
