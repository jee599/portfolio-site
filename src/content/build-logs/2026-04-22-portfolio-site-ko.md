---
title: "홈페이지 리디자인, 프롬프트 3줄로 끝냈다 — 14개 Astro 컴포넌트 자동 생성"
project: "portfolio-site"
date: 2026-04-22
lang: ko
tags: [claude-code, astro, home-design, refactoring]
description: "deploy 폴더 하나 던졌더니 Claude가 14개 Astro 컴포넌트를 만들었다. 사용자 입력 3줄, 도구 호출 106번, 3시간 26분. 정적 번들을 Astro 네이티브로 변환하는 과정을 기록한다."
---

"deploy 폴더에 있는 거 jidonglab에 다 적용해줘"

이게 이 세션의 첫 번째 프롬프트 전문이다. 오타도 있다. 3시간 26분 뒤, 14개 파일이 새로 생겼다.

**TL;DR** 정적 deploy 번들을 그대로 이식하는 대신 Astro 네이티브로 재구현했다. 사용자 프롬프트는 3줄, Claude의 도구 호출은 106번이었다.

## 프롬프트가 짧을수록 Claude는 더 많이 탐색한다

첫 프롬프트에 맥락이 없었다. `deploy` 폴더가 어디 있는지, `jidonglab`이 어떤 경로인지 — 아무것도 없다. Claude는 탐색부터 시작했다.

홈 디렉토리를 뒤지고, 다른 경로도 확인하고, 결국 `deploy` 폴더를 찾았다. 내용물은 정적 HTML/CSS/JS 번들이었다. `index.html`, `app.jsx`, `styles.css`, `data.js`, `tech.jsx`, `thumbnails.jsx` — 약 103KB짜리 React 기반 홈페이지 프로토타입.

`jidonglab`은 이 `portfolio-site` 레포였다. `src/pages/index.astro`에 19.2KB짜리 Astro 네이티브 홈이 있었다. Content Collections 로직, PostCard, ProjectCard, build-logs/tips/ai-news 리스팅이 전부 거기 들어있었다.

Claude의 첫 번째 판단은 단순했다. `index.astro`를 리다이렉트로 덮고, 정적 번들을 `public/` 아래에 올리는 것.

그게 첫 번째 실수였다.

## 파괴적 접근을 먼저 시도했다

Claude는 기존 `index.astro`(19.2KB)를 580바이트짜리 리다이렉트 코드로 덮어썼다. `public/jidonglab-home/`에 정적 파일 6개를 통째로 복사했다.

워킹트리는 깨끗했고, 타겟 폴더는 비어있었다. 기술적으로 막히는 건 없었다. 그래서 진행했다.

두 번째 프롬프트가 왔다.

```
예시 화면 보여줘
```

Claude는 로컬 HTTP 서버를 올리고 스크린샷을 시도했다. Chrome이 read-tier라 직접 스크롤이 안 됐다. 헤드리스 Chrome으로 전체 페이지를 찍었다. 히어로 섹션은 렌더링이 됐다.

문제는 그 다음이었다. 정적 번들은 Astro의 Content Collections와 완전히 분리된다. `build-logs`, `tips`, `ai-news` — 사이트의 핵심 콘텐츠 레이어가 전부 사라지는 구조였다.

## "너 추천대로 해"

세 번째 프롬프트다.

```
너 추천대로 해
```

Claude는 이 한 줄로 방향을 결정했다. 정적 번들을 버리고 Astro 네이티브로 재구현하는 것.

`public/jidonglab-home/`의 디자인을 분석하고, 각 섹션을 Astro/TSX 컴포넌트로 분해했다. deploy 번들의 `data.js`를 타입스크립트로 옮기고, React 컴포넌트는 `.tsx`로, Astro 전용 레이아웃은 `.astro`로 나눴다.

`Bash` 40번, `Read` 17번, `Write` 15번, `TaskUpdate` 14번, `TaskCreate` 7번. 총 106번의 도구 호출이 이 과정에서 나왔다.

## 14개 파일, 한 세션에 생성

결과물은 이렇다.

인터랙션이 필요한 섹션은 `.tsx`로 분리했다. `Hero.tsx`, `Lab.tsx`, `Projects.tsx`, `TechBlock.tsx`, `Thumbnails.tsx` — 클라이언트 사이드 상태가 필요한 컴포넌트들이다. 레이아웃과 리스팅은 `.astro`로 유지했다. `About.astro`, `Footer.astro`, `NowStrip.astro`, `ShipLog.astro`, `Topbar.astro`, `Wordmark.astro`, `Writing.astro`.

`src/data/home.ts`에는 deploy 번들의 `data.js`를 타입 정의와 함께 옮겼다. 최종 `src/pages/index.astro`는 이 컴포넌트들을 조합한다. Content Collections 연결은 `ShipLog.astro`와 `Writing.astro`가 담당한다.

수정된 파일은 0개, 생성된 파일은 14개다.

## 삽질의 실제 비용

초기 파괴적 접근(리다이렉트 + 정적 번들 복사)은 커밋되지 않았다. 워킹트리가 깨끗한 상태에서 진행했고, 방향을 틀었을 때 되돌리는 건 어렵지 않았다.

하지만 시간은 들었다. 헤드리스 스크린샷 시도, 서버 실행, 스크롤 불가 문제 파악 — 이 루프가 돌아가는 동안 Claude는 `Bash`를 40번 실행했다. 프롬프트가 더 구체적이었다면 이 탐색 비용이 줄었을 것이다.

반대로, 모호한 프롬프트 덕분에 Claude가 선택지를 직접 평가하고 더 나은 방향을 골랐다는 해석도 가능하다. "너 추천대로 해"가 결국 Content Collections와 통합된 Astro 네이티브 구현으로 이어졌으니까. 처음부터 구체적인 지시를 줬다면 정적 번들 이식이라는 더 빠른 길로 갔을 수도 있다.

## 모델: claude-opus-4-7

이 세션은 `claude-opus-4-7`로 실행됐다. 탐색 → 시도 → 평가 → 재설계 → 구현까지 한 세션에서 처리하는 건 컨텍스트를 길게 유지해야 하는 작업이다. 106번의 도구 호출이 그걸 보여준다.

3h 26min 세션, 14개 파일, 프롬프트 3줄. 이게 이번 작업의 전체 숫자다.
