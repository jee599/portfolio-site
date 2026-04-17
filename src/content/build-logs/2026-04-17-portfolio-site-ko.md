---
title: "하루 9세션·1,000 tool calls — Claude Code로 무슨 일이 있었나"
project: "portfolio-site"
date: 2026-04-17
lang: ko
tags: [claude-code, opus-4-7, spoonai, contextzip, telegram, multi-agent]
description: "4월 16일 하루 동안 9개 세션, 1,008번의 tool call이 발생했다. Opus 4.7 출시 당일 분석부터 spoonai 전면 리팩토링, contextzip 고도화까지 압축한다."
---

4월 16일 하루 동안 Claude Code 세션이 9개 열렸고, tool call 총합이 1,008번이었다. 6시간 넘는 작업이 단일 날짜에 집중됐다.

**TL;DR** Opus 4.7 출시 당일 system card 분석 → DEV.to 아티클 발행 → spoonai 전면 디자인 리팩 → contextzip 병렬 에이전트 검증까지. 하루치 작업치고 밀도가 높았다.

## Opus 4.7 출시 당일에 system card를 읽었다

첫 세션은 232페이지짜리 Claude Opus 4.7 System Card PDF 분석이었다. 오늘 자 문서를 바로 다운로드해서 핵심 섹션을 분할 독취했다. tool call 6번, 4분.

발견한 내용 중 가장 실질적인 breaking change는 `budget_tokens` 파라미터 동작 변경이었다. Opus 4.7부터 `extended_thinking`의 `type: "enabled"` + `budget_tokens`를 조합하면 **Adaptive thinking** 모드로 전환된다. 기존 `type: "enabled"` 단독 동작과 달라서 마이그레이션 포인트가 생겼다.

이걸 바탕으로 세 번째 세션에서 DEV.to 아티클 2개를 병렬로 작성했다.

```
Post 1: "Opus 4.7 just killed budget_tokens: what broke and how to migrate"
Post 2: "OpenAI's Duct Tape Models: What We Know"
```

`auto-publish` 스킬로 spoonai.me(한국어+영어) + DEV.to + Hashnode 4개 파일을 에이전트 2명이 병렬 작성했다. 세션 3은 1시간 1분, Bash 74 + Edit 8 + WebFetch 8.

## Vercel env에 개행문자가 붙어 있었다

사주 프로젝트 admin 로그인이 비밀번호 맞아도 401 뜨는 문제가 있었다. 코드 버그가 아니었다.

```
ADMIN_PASSWORD="920802\n"
```

Vercel 대시보드에서 직접 환경변수를 입력하면 뒤에 `\n`이 붙는 경우가 있다. 사용자가 `920802`를 입력해도 서버는 `920802\n`과 비교하니 `!==`가 뜬다. `.env.vercel-check`로 확인했더니 `ADMIN_SESSION_SECRET`도 같은 상태였다. 코드 12줄 안 고치고 Bash 10번으로 끝난 디버깅이었다.

## spoonai 디자인 리팩 — 383 tool calls, 3시간 6분

세션 7이 가장 무거웠다. spoonai.me 전면 디자인 리팩토링.

시작 프롬프트는 짧았다: "spoonai 디자인 리팩토링해 모바일 웹 둘 다". `brainstorming` 스킬로 방향을 잡은 다음 `frontend-design`, `ui-ux-pro-max`, `audit` 스킬을 순차 투입했다.

디자인 방향은 여러 라운드를 거쳤다. 첫 라운드는 "너무 AI 목업틱"이라는 피드백으로 폐기됐다. Mystic Luxe / Soft Pastel / Modern Utility / Asia-Pop — 4개 방향을 HTML 목업으로 브라우저에 띄웠는데 다 클리셰였다. 별, 이모지, "VIRAL 2.4M" 배지 같은 것들.

두 번째 라운드에서 에이전트 10명을 병렬 디스패치해서 각자 다른 디자인 콘셉트를 HTML로 뽑았다.

```
01 Bento grid          06 Netflix shelf cinema
02 Masonry (Pinterest)  07 Y2K chrome retro
03 Neo-brutalism        08 Dashboard ticker
04 Swiss tabular        09 Japanese kinfolk
05 (reserved)          10 (reserved)
```

최종 선택은 Masonry(#2)였다. 이후 `SubscribeForm`, `ArticleCard`, `ScrollProgress`, `CountUp`, `FloatingSubscribe` 컴포넌트를 수정하거나 새로 만들었다. 변경 파일이 15개 넘었다.

이미지 없는 카드 문제도 이때 잡았다. `content.ts` 308-354 구간 daily/weekly 엔트리에 `image` 필드가 빠져있어서 아카이브 썸네일이 안 뜨던 버그였다.

Edit 106 + Bash 87 + TaskCreate 30 + TaskUpdate 63.

## Telegram 봇이 두 세션에 걸쳐 안 됐던 이유

세션 4와 세션 8에서 같은 문제를 디버깅했다. Claude에서 Telegram으로 메시지 송신은 됐는데 수신이 안 됐다.

원인은 **봇 프로세스 충돌**이었다. Claude Code 세션을 여러 개 열면 각 세션이 자체 `bun server.ts`를 띄운다. Telegram getUpdates는 long polling 방식이라 하나만 락을 잡을 수 있다. `bot.pid`가 락 관리를 하는데, 구 세션이 죽지 않으면 새 세션이 폴링을 못 이어받는다.

```bash
ps aux | grep "server.ts" | grep -v grep
# PID 15622 (3시간 된 것): 폴링 불가
# PID 31885 (21초 된 것): 폴링 중이지만 다른 세션으로 배달
```

해결 패턴은 이렇다: 모든 `server.ts` 프로세스 종료 → `bot.pid` 제거 → `/reload-plugins`. 이렇게 하면 현재 세션이 새로 띄우면서 락을 잡는다. 같은 증상으로 두 세션 합쳐서 Bash 107번을 썼다.

## Claude 하네스 구조 재설계 — 에이전트 4명 병렬 리서치

세션 5는 Claude Code 하네스 디자인 원리 + Hermes 에이전트 프레임워크를 같이 분석하는 세션이었다. 서브에이전트 4명을 동시 디스패치했다.

```
에이전트 1 — Harness 이론 (Claude Code 하네스 설계 원칙)
에이전트 2 — Hermes 정체성 (NousResearch 프레임워크)
에이전트 3 — 하네스 실전 (실제 적용 패턴)
에이전트 4 — Hermes 응용 (로컬 구현 방법)
```

리서치 결과를 합쳐서 `~/.claude/plans/harness-hermes-meeting.md`에 회의록을 작성했다. 핵심 결론은 **최소주의**였다 — Anthropic 공식 원칙도 "관찰된 실패 이후에만 추가"다. 기존 `~/.claude/`는 CLAUDE.md 82줄 + MEMORY 92KB + 스킬 20개 이상으로 이미 무거웠다.

이걸 바탕으로 hooks 4개, agents 2개, commands 3개를 새로 만들고 CLAUDE.md를 다이어트했다. TaskCreate 14 + Write 13 + Bash 28.

## contextzip 병렬 검증

세션 9는 contextzip(Claude Code 토큰 절감 CLI 프록시) 고도화였다. 구현 완료 후 검증 단계에서 서브에이전트 5명을 병렬 투입했다.

```
Track 2 — punch-list 검증
Track 3 — 새 필터 검증
Track 4 — context-history 레이어 검증
Track 5 — DSL extension 검증
+ README 후킹 분석 + v0.2 홍보 전략
```

커밋/push도 이 세션에서 했다. git config에 `jidong@jidongui-iMac.local`로 자동 추론된 이메일이 있어서 `jee599@naver.com`으로 수정한 다음 push했다. 총 249 tool calls, 1시간 7분.

## 반복적으로 나타난 패턴

하루치 세션을 돌아보면 몇 가지가 반복됐다.

**스킬 체이닝이 많아졌다.** `brainstorming` → `frontend-design` → `audit` 순서로 스킬을 이어붙이면 각 단계에서 맥락이 누적된다. 단일 스킬로 한 번에 처리하는 것보다 결과물 품질이 달랐다.

**병렬 에이전트가 검증에 효과적이다.** 구현 후 검증을 서브에이전트 5명에게 각자 다른 트랙으로 맡기면, 메인 컨텍스트를 오염시키지 않으면서 다각도 리뷰가 가능하다.

**Telegram 멀티세션 충돌은 구조적 문제다.** 단순히 재시작으로 해결되는 게 아니라 `bot.pid` 락 관리 로직이 세션 간 충돌을 막아야 한다. 같은 디버깅을 두 번 했다는 건 근본 수정이 필요하다는 신호다.
