---
title: "Claude Code 병렬 에이전트 5개로 커피챗 시안 뽑고 Codex가 SRI 버그 걸러낸 과정 (79 tool calls)"
project: "portfolio-site"
date: 2026-05-10
lang: ko
tags: [claude-code, design, parallel-agents, codex, automation]
description: "Claude Code frontend-implementer 5개 병렬 디스패치로 커피챗 리디자인 시안을 동시 생성. '다 별로야' 피드백 후 방향 전환. Codex 교차검증이 SRI 해시 불일치를 잡아냈다. 79 tool calls."
---

커피챗 사이트 리디자인 요청이 들어왔다. 사용자가 처음 준 건 URL 하나뿐이었다.

**TL;DR** `frontend-implementer`를 5개 병렬로 던져서 리디자인 시안을 동시 생성했다. "다 별로야"라는 피드백 후 방향을 틀어서 교육 플랫폼 톤으로 재설계했다. Codex 교차검증에서 SRI 해시 불일치 버그가 나왔고 즉시 수정했다. 79 tool calls.

## 정보 없이 시작했을 때 생기는 문제

첫 프롬프트는 "커피챗 사이트 리디자인할거야. 최소 5가지 결과물을 내고 내가 고를 수 있게 해줘"였다. URL도 없고, 대상 유저도 없고, 원하는 무드도 없었다.

이 상태로 바로 5개 시안을 뽑으면 generic 디자인 템플릿이 나온다. `coffeechat.it.kr`을 `WebFetch`로 분석하고 나서야 실체가 보였다. 게임 업계 멘토링 플랫폼이었다. 게임 회사 현직자와 1:1 커피챗, 이력서 리뷰, 모의면접이 핵심 서비스였다.

이 컨텍스트를 `plan.md`에 담아 `general-purpose` 에이전트에 먼저 위임했다. 5가지 디자인 무드를 정의하고 — Editorial Magazine, Soft Brutalist, Premium Dark, Retro Arcade, Neo-Minimal — 각 변주 스펙을 문서화한 뒤 `frontend-implementer` 5개를 병렬 디스패치했다.

## "다 별로야" — 방향 전환

5개 시안이 나왔는데 사용자 반응은 냉정했다. "다 별로야 하나도 전문성이 없어보여. 인프런이나 다른 교육기관 봐봐."

문제는 명확했다. 디자인 트렌드 변주만 5가지를 만든 거지, 전문 교육 서비스의 신뢰감이 없었다. 인프런·클래스101·패스트캠퍼스 같은 교육 플랫폼의 톤은 트렌디함보다 신뢰와 구조감이 우선이다. 게임 업계 정체성에 집중하느라 방문자가 느껴야 할 신뢰도를 빠뜨렸다.

complexity를 재분류하고 plan을 다시 세웠다. 교육 서비스의 신뢰감을 기준으로 5개 변주를 새로 정의하고 `frontend-implementer`를 다시 5개 병렬로 돌렸다.

## Codex가 잡아낸 SRI 버그

구현 후 `design-reviewer`로 리뷰를 돌리고, 이어서 Codex 교차검증(`codex-cross-verify`)을 붙였다. 여기서 치명적인 버그가 나왔다.

V2/V3/V4/V5가 `react.production.min.js`를 로드하는데 SRI(Subresource Integrity) 해시는 `.development.js`용이었다. 브라우저에서 SRI 검증이 실패하면 스크립트 로드 자체가 차단된다. 시각적으로는 완성된 시안인데 실제 브라우저에서는 React가 뜨지 않는 상황이었다.

```html
<!-- 버그: production 파일에 development 해시 -->
<script src="react.production.min.js"
  integrity="sha384-[development용 해시]"></script>
```

`code-verifier`는 이걸 잡지 못했다. lint/typecheck 레벨에서는 SRI 해시 불일치가 걸리지 않기 때문이다. Codex가 파일을 읽고 cross-reference를 돌리는 과정에서 나온 발견이었다. 즉시 4개 파일의 해시를 production 버전으로 교체했다.

## 도구 사용 패턴

79 tool calls 중 `Agent`가 28회로 가장 많았다. 5개 병렬 구현 디스패치가 각각 Agent 호출을 쓰고, plan-orchestrator·design-reviewer·codex-cross-verify까지 더해지면 금방 쌓인다. `Bash`는 26회였는데 `diff.patch` 생성과 state 업데이트가 주를 이뤘다. `TaskUpdate`·`TaskCreate`가 13회로 단계별 상태 추적에 썼다.

결과물은 `/Users/jidong/coffee-chat-redesign/`에 비교 캔버스 포함 5개 시안으로 저장됐다. 시안 카드에서 "보기 →"를 클릭하면 새 탭으로 열리는 구조다.

## 치과 광고 자동화 — 23 tool calls, 7분

같은 날 다른 세션에서는 치과 광고 리서치 일일 업데이트를 돌렸다. 크론 에이전트가 `medical_dental_ads_daily_goal.md`를 읽고 5개 마크다운 파일 업데이트와 HTML 보고서 생성까지 7분 만에 끝냈다.

`Read` 9회, `Edit` 8회, `Bash` 3회, `Write` 2회. 이미 패턴이 확립된 반복 작업은 tool call 수가 적다. 23번 만에 산출물 6개를 만들었다.

## 두 세션에서 확인한 패턴

컨텍스트가 없으면 generic이 나온다. URL 하나만 줬는데 좋은 시안을 기대하는 건 어렵다. 사이트 분석 단계를 명시적으로 넣어야 한다.

병렬 에이전트는 반복 작업에 효과적이다. 5개 시안을 순차적으로 만들면 컨텍스트가 쌓여서 후반부 품질이 떨어진다. 병렬로 나누면 각각 깨끗한 컨텍스트에서 시작한다. 조건은 `plan.md`가 구체적이어야 한다는 것이다. "V3은 floating gradient blobs, 배경 `#0a0a0f`" 수준으로 적어야 에이전트가 독립 실행된다.

Codex 교차검증은 `code-verifier`와 역할이 다르다. verifier는 테스트·lint 레벨이고 Codex는 파일 간 논리적 일관성을 본다. SRI 해시 불일치처럼 도구적으로 걸리지 않는 버그는 Codex 레벨에서 나온다.

> 피드백 "다 별로야"가 방향 전환의 트리거였다. 거절이 나왔을 때 방어하지 않고 근거를 물어보는 게 빠르다.
