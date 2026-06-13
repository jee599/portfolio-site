---
title: "Claude Fable 5 × Ultracode: 9개 세션, 5개 프로젝트, 1,000+ tool calls의 결과"
project: "portfolio-site"
date: 2026-06-14
lang: ko
tags: [claude-code, ultracode, workflow, fable-5, multi-project]
description: "Fable 5와 ultracode 플래그를 켜고 18세션을 돌린 결과. 단일 세션에서 532 tool calls, 28시간 연속 작업이 실제로 어떻게 돌아가는지."
---

532번의 tool call, 28시간 연속 세션. 커피챗 프로젝트 하나에 어드민·결제·다국어·TTS·이력서 빌더까지 단일 세션에서 다 박았다. 모델은 `claude-fable-5`, 플래그는 `ultracode`.

**TL;DR** 6월 11~13일 사이 9개 세션에서 5개 프로젝트를 동시 진행했다. ultracode는 단순히 "더 빠른 Claude"가 아니라 fan-out 워크플로를 자동으로 켜는 스위치다.

## 세션 길이가 왜 이렇게 길어?

일반 Claude Code 세션은 30분~2시간이 평균이다. 이번 주는 달랐다.

| 세션 | 길이 | tool calls | 프로젝트 |
|------|------|------------|---------|
| 세션 4 | 25h 26min | 356 | 사주 글로벌 리디자인 |
| 세션 5 | 27h 48min | 532 | 커피챗 어드민/결제 |
| 세션 6 | 24h 48min | 105 | AEO 아웃리치 엔진 |

이게 가능한 이유가 있다. `/goal` 훅을 쓰면 조건이 충족될 때까지 Claude가 세션을 끊지 않는다. 세션 5에서 쓴 goal은 "커피챗에 유저별 어드민 + 토큰 사용량 추적 + 결제 + 글로벌 다국어 다 붙이기"였다. 조건이 넓으면 세션이 길어진다. 534개 tool call이 다 한 goal을 향해서 달린다.

문제는 세션이 너무 길면 컨텍스트가 압축되면서 초반 결정이 희미해진다. `/clear` + `/goal` 재설정으로 방향을 다시 잡는 패턴이 생겼다.

## ultracode가 실제로 하는 일

`/effort ultracode`를 실행하면 설정 메시지에 "xhigh + dynamic workflow orchestration"이 붙는다. 이게 뭘 바꾸는지 세션에서 확인한 패턴:

세션 2에서 "프라이머급 시드투자·지원금 프로그램 전수 조사"를 넣으니 5개 카테고리로 검색 에이전트를 fan-out했다. 57개 프로그램을 209번의 검색·검증으로 걸러서 1인 창업자 조건에 맞는 7개 추천까지 나왔다. 직접 하면 이틀 걸릴 작업이다.

세션 9에서 "JDLab Dynamic Outreach Failure Audit"을 넣으니 Gmail 접근 권한을 먼저 정찰하고, 쿼터 DSN 메시지를 찾아서 원인을 진단했다. 핵심은 에이전트가 정찰을 먼저 해서 워크플로 구조를 스스로 결정한다는 것이다. 내가 "이렇게 병렬로 나눠라"를 지시하는 게 아니다.

## 프로젝트별 삽질과 해결

### 사주 글로벌 — 결제 플랫폼 포지셔닝 딜레마

"전통 사주로 바꾸면 결제가 안 붙지 않아?" 라는 질문에서 시작했다. 실측 데이터가 반대였다.

Etsy 자연실험: 'AI Reading' 전면에 내세운 샵은 입점 1개월 판매 0건, 인간 페르소나 샵(연화 만신)은 464건·리뷰 130개·$34 평균가. 결제 플랫폼 심사는 랜딩 카피가 아니라 **서비스 카테고리**를 본다. 'AI 사주'라고 써도 생년월일시 넣고 운세 파는 서비스면 동일하게 점술 카테고리다. 포지셔닝 변경이 심사 우회가 아니라는 걸 데이터로 확인하고, 전통 포지셔닝을 유지하면서 결제 레일을 따로 풀었다.

open-design 스킬을 거쳐서 `landing-midnight.html` v1→v2→v3 순서로 빌드했다. gpt-image-2로 이미지를 백그라운드에서 생성하는 동안 v3 코드를 짰다. 이미지 생성이 bottleneck이 되는 걸 병렬 실행으로 회피한 패턴이다.

### 커피챗 — Git 이메일 차단

배포가 이런 이유로 막혔다:

```
The deployment was blocked because the commit author email
(jidong@jidongui-iMac.local) is not valid.
```

로컬 머신 호스트명이 git config에 그대로 박혀 있었다. `.gitconfig`에서 이메일을 수동으로 고치고 재커밋했다. Claude가 `git config`는 건드리지 않으니(보안 정책) 직접 수정이 필요했다.

532 tool call 중 `Bash(190)`, `Edit(136)`, `Write(66)` 순서였다. 새로 생긴 파일이 70개가 넘는다. 이 규모에서 세션 하나로 끝내려면 중간에 `/clear`를 치지 않는 게 중요하다 — 컨텍스트를 살려둬야 의존성을 추적한다.

### spoonai — P0 버그 먼저

"어떻게 팔아야 하는지"를 물었더니 먼저 P0 진단이 나왔다. 신규 구독자가 메일을 영구히 못 받는 버그 + 수신거부 404가 그대로였다. 파는 것보다 고치는 게 먼저라는 결론이었다.

`/unsubscribe`, `/feedback` 페이지 추가, `/api/unsubscribe` GET이 삭제 대신 확인 페이지로 302 리다이렉트하도록 수정. 커밋 `4a3c598`로 spoonai.me 라이브 배포 후 라이브 URL 응답 코드까지 검증했다. 이 흐름은 56 tool call로 22분 만에 끝났다.

## design-gate 훅의 실제 효과

CLAUDE.md에 "HTML 산출물은 Open Design 또는 동등한 디자인시스템 패스 없이 불가" 규칙이 있다. `hooks/design-gate.sh`가 `.html` 파일 작성 시도를 차단한다.

세션 6에서 report-builder 스킬을 실행할 때 이 훅을 먼저 통과시켜야 했다:

```bash
bash ~/.claude/hooks/design-pass.sh "report-builder 디자인시스템 패스"
```

처음엔 귀찮게 느껴졌다. 근데 이 강제 패스 덕분에 Stripe·Notion·Linear 3개 디자인시스템 중 뭘 쓸지 결정이 선행됐고, 비교 페이지(`_theme-directions.html`)가 생겼다. 훅이 없었으면 즉흥 CSS를 썼을 가능성이 높다.

## 세션 사이 인수인계

9개 세션이 각각 독립적으로 시작했는데, 메모리 시스템이 없었으면 매번 컨텍스트를 다시 설명해야 했다. `~/.claude/projects/-Users-jidong/memory/`에 프로젝트별 메모리가 있고, 세션 시작 시 관련 메모리를 자동으로 읽는다.

세션 3(데이문 사이트, 6 tool calls, 5분)이 이 패턴의 극단 사례다. "남은 작업 뭐야?"에 바로 Vercel Blob 스토리지 흐름과 어드민 3탭 구조를 답했다. 이전 세션에서 쌓인 메모리가 있었기 때문이다.

## 다음 주 할 것

커피챗 Turso DB 연결과 PayPal webhook 실환경 테스트가 남아 있다. 사주 글로벌 v3 랜딩은 코드가 완성됐지만 Next.js 앱에 아직 통합 안 됐다. AEO 아웃리치 엔진(`hermes-dashboard/aeo-engine`)은 구조만 있고 실제 프로스펙트 파이프라인 미연결 상태다.

세션 8에서 모델이 `claude-fable-5[1m]`를 찾지 못했다 — "It may not exist or you may not have access." 모델 이름은 세션 시작 전에 `/model`로 확인하는 습관이 필요하다.
