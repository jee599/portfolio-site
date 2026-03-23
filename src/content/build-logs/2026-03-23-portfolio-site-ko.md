---
title: "AgentCrow 4개 병렬 배포 → 전부 롤백: 포트폴리오 사이트 실험 기록"
project: "portfolio-site"
date: 2026-03-23
lang: ko
tags: [claude-code, agentcrow, parallel-agents, rollback, astro]
description: "AgentCrow로 aurora, cursor effect, bento grid, scroll animation을 병렬 구현했다가 전부 롤백한 이야기. 155 tool calls, 68 tool calls, 두 세션의 삽질 기록."
---

어제 포트폴리오 사이트에서 두 번의 큰 세션을 돌렸다. 하나는 admin 대시보드 GitHub 연동, 다른 하나는 최신 웹 기술 6가지를 한 번에 때려넣는 실험. 결과는 롤백이었다.

**TL;DR** GitHub API 409 충돌, thum.io 실시간 캡처 발견, AgentCrow 4개 에이전트 병렬 → 전체 롤백까지. 295 tool calls로 돌아온 자리.

## Admin 패널: GitHub 리포 목록이 왜 최신이 아닐까

첫 번째 세션(1h 41min, 155 tool calls)은 `jidonglab.com/admin`에서 시작했다. 프로젝트 목록이 최신 리포를 반영하지 않는다는 문제였다.

원인은 단순했다. `github-repos.json`은 **빌드타임 정적 파일**이라 마지막 빌드 이후 추가된 리포가 반영이 안 됐다. 당연한 거였는데 한참 헤맸다.

리포 등록 과정에서 GitHub API 409 에러도 터졌다.

```
GitHub API error: {"message":"src/content/projects/cleantech.yaml does not match
7a85c7d8e4e3f27db8fc39d836a457bc0b98ef49","documentation_url":"...","status":"409"}
```

파일 sha 불일치였다. PUT 요청에 현재 파일의 sha를 같이 보내야 하는데, 캐시된 값을 쓰다가 충돌이 났다. GET으로 최신 sha를 먼저 가져오는 로직을 추가해서 해결했다.

프로젝트 미리보기 이미지 문제도 있었다. 로컬 스크린샷이 없는 프로젝트는 그냥 빈 공간이었다. 여기서 thum.io를 발견했다.

```
thum.io/get/width/400/https://refmade.com
```

URL 하나만 넘기면 실시간으로 사이트 스크린샷을 캡처해준다. 정적 이미지를 직접 관리할 필요가 없어졌다. `screenshotMap`에 없는 프로젝트는 자동으로 thum.io URL로 폴백하도록 수정했다.

스크롤 속도 조정 프롬프트가 세 번 반복됐다. "동일하게", "2배 빠르게", "2배 더 빠르게", "2초로". 결국 `animation-duration: 2s`로 고정했다. 수치를 미리 제안했으면 왕복을 줄일 수 있었을 텐데.

## AgentCrow 실험: 6가지 최신 기술을 하루에

두 번째 세션(39min, 68 tool calls)은 "최신 웹 기술을 많이 사용하고 싶어"로 시작했다.

현재 사이트를 분석하니 인라인 스타일이 많고 애니메이션은 기본 `fadeIn`뿐이었다. 적용 가능한 기술 목록을 뽑았다: Astro View Transitions, CSS Scroll-Driven Animations, Aurora/Mesh Gradient 배경, 커스텀 커서 + 카드 틸트, Bento Grid 레이아웃, GSAP 애니메이션.

"일단 다 해줘 버튼 하나 6개 만들어서 각각의 기능을 껐다 켰다 할 수 있게"라는 요청이 왔다. AgentCrow로 4개 에이전트를 병렬 디스패치했다.

```
━━━ 🐦 AgentCrow ━━━━━━━━━━━━━━━━━━━━━
Dispatching 4 agents:

🖥️ @toggle-panel  → FeatureToggle.tsx 컨트롤 패널 컴포넌트 생성
🖥️ @cursor-effect → CursorEffect.tsx 커서 추적 + 카드 틸트 컴포넌트 생성
🎨 @aurora-css    → aurora 배경 CSS 생성
🎨 @scroll-css    → CSS Scroll-Driven Animations CSS 생성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

4개 에이전트가 병렬로 돌아가는 동안 메인 스레드에서는 GSAP 설치와 Bento Grid CSS를 준비했다. 에이전트들은 10분 안에 전부 완료했다. `aurora.css`는 `[data-ft-aurora="on"]` data attribute로 토글 제어, `CursorEffect.tsx`는 40px 커서 글로우 + 카드 mousemove 틸트, `FeatureToggle.tsx`는 우측 하단 고정 6개 토글 버튼 구조였다.

통합까지 마쳤다. 그런데 배포 시도에서 막혔다.

> "그냥 너가 배포까지 하면 되잖아"

Cloudflare Pages는 git push가 트리거다. 로컬 wrangler로 직접 배포할 수 없는 구조라 그냥 push했다. 그리고 결정적인 한 마디.

> "그냥 다 롤백해줘"

시각적으로 흥미롭긴 했지만 사이트의 toss.tech 클린 톤과 안 맞았다. 롤백 커밋 하나로 정리됐다.

## 병렬 에이전트가 빠른 이유

AgentCrow의 핵심은 파일 충돌이 없는 작업의 병렬 처리다. `aurora.css`, `CursorEffect.tsx`, `FeatureToggle.tsx`, `scroll-animations.css`는 각각 독립적인 파일이라 동시 진행이 가능했다. 4개를 순차로 처리했으면 각 에이전트 시간이 직렬로 쌓였을 텐데, 병렬이면 가장 오래 걸리는 에이전트 시간만큼만 기다리면 된다.

롤백했지만 시도 자체는 의미 있었다. 4개 컴포넌트가 제대로 동작하는 걸 확인했고, 나중에 필요할 때 꺼내 쓸 수 있는 레퍼런스가 생겼다.

## 도구 사용 통계

세션 1 (Admin 연동): 1h 41min, 155 tool calls — Bash 78회, Read 35회, Edit 15회. 세션 2 (최신 기술 실험): 39min, 68 tool calls — Bash 18회, Read 14회, TaskCreate 6회. 두 세션 합계 295 tool calls. 롤백으로 net change는 admin 패널 개선과 thum.io 연동이 전부다. 실험 비용이라고 생각하면 나쁘지 않다.
