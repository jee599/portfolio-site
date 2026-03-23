---
title: "AgentCrow 4개 병렬 디스패치, 39분 만에 6개 기능 추가하고 롤백한 이유"
project: "portfolio-site"
date: 2026-03-23
lang: ko
tags: [claude-code, agentcrow, parallel-agents, portfolio, build-log]
description: "AgentCrow로 4개 에이전트를 병렬 디스패치해 최신 웹 기술 6개를 추가했다. 총 223 tool calls, 2개 세션. 그리고 전부 롤백했다."
---

4개 에이전트가 동시에 돌아가고 있었다. Aurora 배경 CSS, 커서 이펙트 컴포넌트, 스크롤 애니메이션, FeatureToggle 패널. 에이전트들이 작업하는 동안 나는 GSAP 설치와 Bento Grid CSS를 준비했다. 39분 후, 6개 기능이 전부 `index.astro`에 통합됐다. 그리고 바로 롤백했다.

**TL;DR** AgentCrow로 4개 에이전트를 병렬 디스패치해 최신 웹 기술 6개를 추가했다. 근데 실제로 보니 사이트 컨셉과 안 맞았다. 롤백 결정까지 포함해서 2개 세션, 223 tool calls.

## 세션 1: 155번의 도구 호출, admin 페이지 디버깅

`jidonglab.com/admin`의 Projects 탭에서 GitHub 프로젝트 목록이 최신화가 안 됐다.

```
아니 그게 아니라 지금 이미 jidonglab project 목록 받아오는 로직이 있지않아?
```

Claude가 `src/pages/admin.astro`, `src/pages/api/admin-projects.ts`, `src/lib/projects.ts`를 차례로 뒤졌다. 결국 찾은 건 `github-repos.json` — 빌드타임에 생성되는 static 파일이라, 마지막 빌드 이후 추가된 리포는 반영이 안 됐다. 문제가 코드가 아니라 아키텍처에 있었다.

URL 입력 이슈도 있었다. 저장 버튼이 없어서 포커스 아웃 시에만 업데이트되는 구조였다. "저장 버튼을 만들던지 해줘 제대로 바로 적용이 안돼. 그리고 저기서 저장 버튼 누르면 사이트들 전부 다 미리보기 화면 캡쳐 다시 떠줘"라고 했더니 Save 버튼 추가 + 저장 시 스크린샷 재캡처 트리거까지 한 번에 붙었다.

미리보기 이미지는 `thum.io` 실시간 캡처를 붙였다. 그러다가 "응 그래야 스크롤도 되지 다른 프로젝트들처럼"이라는 말 한 마디로 방향이 바뀌었다. 각 사이트마다 이미지 높이가 달라 스크롤 속도가 상대적으로 계산되는 문제도 잡았다. 최종적으로 스크롤 속도는 2초로 고정.

이 세션에서 Bash를 78번, Read를 35번, Edit을 15번 썼다. Bash가 압도적으로 많다. 실행 → 확인 → 재실행 사이클이 코드 수정보다 훨씬 자주 돌았다는 뜻이다. 155 tool calls 중 절반이 Bash였다.

## 세션 2: AgentCrow 4개 병렬, 6개 기능 39분 만에 완성

다음 세션은 brainstorming 스킬로 시작했다. "jidonglab.com에 최신 웹 기술을 많이 사용하고 싶어"라는 요청에 Claude가 현재 사이트 상태를 파악하고 6가지를 제안했다.

1. Astro View Transitions
2. CSS Scroll-Driven Animations
3. Aurora 배경 효과
4. 커서 트래킹 + 카드 틸트
5. GSAP 애니메이션
6. Bento Grid 레이아웃

"일단 다 해줘 버튼 하나 6개 만들어서 각각의 기능을 껐다 켰다 할 수 있게 + 내가 각각 롤백할 수도 있게"라고 했더니 AgentCrow가 디스패치 계획을 세웠다.

```
━━━ 🐦 AgentCrow ━━━━━━━━━━━━━━━━━━━━━
Dispatching 4 agents:

🖥️ @toggle-panel → FeatureToggle.tsx 컨트롤 패널 컴포넌트 생성
🖥️ @cursor-effect → CursorEffect.tsx 커서 추적 + 카드 틸트 컴포넌트 생성
🎨 @aurora-css → aurora 배경 CSS 생성
🎨 @scroll-css → CSS Scroll-Driven Animations CSS 생성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

4개 에이전트가 동시에 돌았다. 각 에이전트는 독립적인 파일을 만들기 때문에 충돌이 없다. 에이전트들이 작업하는 동안 메인 Claude는 GSAP 설치와 Bento Grid CSS를 준비했다.

에이전트 결과물:

- `src/styles/aurora.css` — `[data-ft-aurora="on"]` 속성으로 on/off
- `src/components/FeatureToggle.tsx` — 우하단 고정 토글 패널, z-index 관리
- `src/components/CursorEffect.tsx` — 커서 글로우 40px + 카드 틸트 효과
- `src/styles/scroll-animations.css` — 스크롤 진행 바 + 요소 등장 애니메이션

모두 완료되면 통합 단계가 온다. `Base.astro`에 CSS 임포트, `index.astro`에 컴포넌트 마운트. TaskUpdate로 각 에이전트 완료를 추적하면서 순서를 맞췄다. 이 세션에서 TaskUpdate를 12번, TaskCreate를 6번 사용했다. 에이전트 관리용 오버헤드만 18번이다.

## 롤백을 결정한 순간

통합까지 다 됐다. 배포해도 됐다. 그런데 "그냥 다 롤백해줘"라고 했다.

이유는 단순했다. `jidonglab.com`은 1인 개발자가 만든 것들을 투명하게 공개하는 사이트다. Aurora 글로우 효과와 커서 트래킹은 그 분위기가 아니었다. 기술적으로는 잘 됐지만, 맥락과 안 맞으면 필요 없다.

```
c0bb51e Revert "feat: add 6 modern web features with toggle control panel"
71bf179 feat: add 6 modern web features with toggle control panel
```

커밋 두 개가 나란히 붙어 있다. 구현 39분, 롤백 결정 몇 초.

## 병렬 에이전트 패턴에서 배운 것

병렬 에이전트는 파일이 겹치지 않는 독립 작업에 효과적이다. CSS 파일 2개 + 컴포넌트 2개를 순차적으로 만들었으면 39분보다 훨씬 걸렸을 것이다.

근데 병렬 속도가 빠를수록 검토 타이밍을 놓친다. 에이전트들이 만드는 동안 "이게 정말 필요한가"를 생각할 틈이 없었다. 다 만들어놓고 보고 나서야 아니다 싶었다.

> 파일 수정이 겹치지 않는 독립적인 작업은 병렬 에이전트로 분배한다. 단, 방향 확인은 먼저 한다.

이번 실수는 브레인스토밍 단계에서 "이게 우리 사이트에 맞는가"를 충분히 검토하지 않고 구현으로 넘어간 것이다. Claude가 6가지를 제안하면 전부 해보고 싶어진다. 그게 함정이다.

총 2개 세션, 223 tool calls. 남은 건 스크린샷 스크롤 2초 고정과 롤백 커밋 두 개다.
