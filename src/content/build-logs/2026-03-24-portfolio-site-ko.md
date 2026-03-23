---
title: "AgentCrow 4개 병렬로 최신 웹 기술 6가지 구현, 그리고 전부 롤백한 이유"
project: "portfolio-site"
date: 2026-03-24
lang: ko
tags: [claude-code, agentcrow, parallel-agents, portfolio, admin]
description: '"일단 다 해줘"라는 프롬프트 하나로 AgentCrow가 4개 에이전트를 동시에 돌렸다. Aurora, 커서 효과, 스크롤 애니메이션, Bento Grid. 그리고 39분 뒤 전부 롤백했다.'
---

"일단 다 해줘." 이 한 마디에 AgentCrow가 4개 에이전트를 병렬로 띄웠다. 39분 뒤 전부 롤백했다.

**TL;DR** Admin 페이지 개선(155 tool calls, 1h 41min)과 최신 웹 기술 6종 구현 실험(68 tool calls, 39min)을 같은 날 돌렸다. 에이전트 병렬 처리의 속도는 증명됐고, 배포 직전에 방향을 바꾸는 게 얼마나 쉬운지도 확인했다.

## Admin, 지금 뭐가 안 되는 거야

`jidonglab.com/admin` Projects 탭에서 GitHub 리포 목록이 최신 상태가 아니었다. `github-repos.json`이 빌드 타임에 생성되는 static 파일이라, 마지막 빌드 이후 새로 올린 리포가 반영이 안 됐다.

세션 4에서 이걸 고치는 데 155 tool calls를 썼다. Bash가 78회로 절반이었다. `api/admin-projects.ts`에서 GitHub API를 실시간으로 호출하도록 바꾸고, 프로젝트 카드에 URL 인풋이 제대로 작동하지 않던 문제도 잡았다.

`refmade`라는 프로젝트가 admin에서 `defmade`로 표시되고 있었다. 원인은 단순한 타이포였는데 찾는 데 시간이 걸렸다. `aidesiner.yaml`에 잘못 입력된 URL이 프로젝트 카드 링크를 오염시키고 있었다.

스크린샷 미리보기도 이 세션에서 추가했다. 로컬 이미지가 없는 프로젝트는 `thum.io`로 실시간 캡처를 붙이는 방식이었는데, 사용자가 "실시간 캡쳐야?" 라고 물었다. "응, 그래야 스크롤도 되지 다른 프로젝트들처럼"이라는 피드백이 왔고 그게 맞았다.

스크롤 속도도 세 번에 걸쳐 조정했다. 처음 상대값 → 동일하게 → 2배 빠르게 → 2배 더 빠르게 → 2초. 이런 UX 튜닝은 Claude한테 방향만 주고 숫자를 조금씩 올리는 게 가장 빨랐다.

## "일단 다 해줘"가 AgentCrow를 트리거했다

세션 7에서 질문 하나로 시작됐다. "jidonglab.com에 최신 웹 기술을 많이 사용하고 싶어. 어떤 거 사용할 수 있을까."

Claude가 6가지를 제안했다. View Transitions API, Aurora 배경, 커서 트래킹 + 카드 틸트, Scroll-Driven Animations, GSAP, Bento Grid.

"일단 다 해줘 버튼 하나 6개 만들어서 각각의 기능을 껐다 켰다 할 수 있게 + 내가 각각 롤백할 수도 있게"

이 프롬프트가 AgentCrow를 발동했다.

```
━━━ 🐦 AgentCrow ━━━━━━━━━━━━━━━━━━━━━
Dispatching 4 agents:

🖥️ @toggle-panel → FeatureToggle.tsx 컨트롤 패널 컴포넌트 생성
🖥️ @cursor-effect → CursorEffect.tsx 커서 추적 + 카드 틸트 컴포넌트 생성
🎨 @aurora-css → aurora 배경 CSS 생성
🎨 @scroll-css → CSS Scroll-Driven Animations 생성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

4개 에이전트가 동시에 돌아가는 동안 메인 스레드는 GSAP 설치와 Bento Grid CSS 준비를 병행했다. 68 tool calls 중 TaskCreate가 6회, TaskUpdate가 12회였다. 에이전트 디스패치 + 추적 오버헤드다.

에이전트들이 완료 알림을 보내왔다.

- `aurora.css` — `[data-ft-aurora="on"]` 속성으로 활성화되는 그라데이션 배경
- `FeatureToggle.tsx` — 화면 우하단 고정 패널, 각 피처를 localStorage로 on/off
- `CursorEffect.tsx` — 40px 글로우 커서, 카드 hover 시 3D 틸트
- `scroll-animations.css` — 스크롤 진행 바 + `@keyframes` 기반 reveal 효과

각 에이전트가 독립적인 파일을 담당해서 충돌이 없었다. `Base.astro`와 `index.astro` 통합은 메인 스레드가 마지막에 한 번에 처리했다.

## 배포 직전, 전부 롤백

"그냥 너가 배포까지 하면 되잖아"

Claude가 Cloudflare Pages 배포를 시도했다. `wrangler` CLI를 통해 인증까지 됐다. 그런데 사용자가 방향을 바꿨다. "그냥 다 롤백해줘."

이유는 세션 기록에서 명확하게 나오지 않는다. 하지만 결과는 명확했다. 만들어진 파일을 다 되돌렸다.

롤백 비용은 거의 없었다. 에이전트들이 신규 파일을 생성하는 방식이었기 때문에 git에서 파일만 지우면 됐다. 기존 코드를 직접 수정했다면 diff를 추적하는 게 훨씬 복잡했을 거다.

> 에이전트가 새 파일을 만드는 방식으로 작업하면 롤백이 간단해진다. 기존 파일을 직접 패치하는 방식과 다르다.

## 이 세션에서 배운 것

총 223 tool calls, 약 2시간 20분. 두 세션에 걸쳐 admin 개선과 웹 기술 실험을 동시에 돌렸다.

"다 해줘"라는 모호한 프롬프트가 나왔을 때 AgentCrow는 스스로 작업을 나눠 4개 에이전트에 분배했다. 사용자가 어떤 에이전트를 어떻게 쪼개야 하는지 지정하지 않았다. CLAUDE.md에 AgentCrow 규칙이 명시되어 있어서 가능한 구조다.

에이전트 4개 병렬이 순서대로 작업하는 것보다 얼마나 빠른지는 명확하게 측정하지 않았다. 다만 6개 피처를 39분 안에 전부 구현한 건 수동으로는 불가능한 속도다.

스크롤 속도 튜닝을 세 번 반복한 건 숫자를 명확하게 주지 않은 탓이다. "2배 빠르게", "2배 더 빠르게"보다 "duration: 2000ms"가 한 번에 맞는다.
