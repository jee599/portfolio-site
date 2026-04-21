---
title: "Static 번들 → Astro 네이티브 홈 리빌드 — 프롬프트 3개, 106 tool calls, 14개 컴포넌트"
project: "portfolio-site"
date: 2026-04-22
lang: ko
tags: [claude-code, astro, react, portfolio, refactoring, home-design]
description: "3줄짜리 프롬프트로 시작한 홈 리디자인이 14개 Astro/React 컴포넌트 전면 재건으로 끝났다. Static 번들이 왜 Astro 스택에 그대로 쓸 수 없는지, Claude가 어떻게 방향을 전환했는지 106 tool calls 기록."
---

프롬프트 3개가 106번의 tool call을 만들었다. 세션 시간은 3시간 26분. 결과물은 홈 컴포넌트 14개 전면 재건이다.

**TL;DR** 기존 deploy 번들(React + Vite 스태틱)을 portfolio-site Astro 스택에 그대로 얹으려다 막혔다. Claude가 스스로 방향을 전환해 `src/components/home/`에 Astro + React 네이티브 컴포넌트 12개를 새로 짰다.

## "deploy 폴더에 있는 거 다 적용해줘"

세션 내내 사용자 프롬프트는 세 줄이 전부였다.

> "deploy 폴더에 있ㄴㄴ거 jidonglab에 다 적용해줘"

> "예시 화면 보여줘"

> "너추천대로해"

구체적인 지시가 없다. Claude는 먼저 `deploy` 폴더를 찾는 것부터 시작했다. 홈 디렉터리에 없었다. Bash 여러 회로 다른 위치도 확인해서 찾았다. 6개 파일(`app.jsx`, `data.js`, `index.html`, `styles.css`, `tech.jsx`, `thumbnails.jsx` — 약 103KB)로 구성된 Vite + React 스태틱 번들이었다.

다음으로 "jidonglab"이 어디 있는지 파악해야 했다. `~/portfolio/portfolio-site/`가 `jidonglab.com` 레포였다. 구조 확인 결과 Astro 4 + React + Tailwind 스택으로, Content Collections까지 물고 있었다.

여기서 Claude가 먼저 경고를 띄웠다.

> "기존 index.astro(19.2K의 Astro 네이티브 홈)를 간단한 redirect로 덮어쓰는 거라 꽤 파괴적이야."

git 워킹트리가 클린 상태임을 확인한 뒤 1차 적용을 진행했다. `public/jidonglab-home/`에 번들 파일 6개를 그대로 넣고, `src/pages/index.astro`를 580B짜리 redirect로 교체했다.

## Static 번들의 벽

"예시 화면 보여줘"가 들어왔다. 로컬 HTTP 서버를 띄우고 헤드리스 Chrome으로 스크린샷을 찍었다. 히어로 섹션은 렌더링됐다. 그런데 구조적인 문제가 있었다.

deploy 번들은 독립적인 스태틱 앱이다. `index.html`이 직접 JSX를 불러오고, 빌드 결과물도 자체 번들링을 전제로 한다. portfolio-site의 Astro build 파이프라인과 맞물리지 않는다. Content Collections(`build-logs`, `tips`, `ai-news`)에 접근할 방법이 없다. 기존 `PostCard`, `ProjectCard` 컴포넌트도 쓸 수 없다.

그래서 Claude가 세 번째 프롬프트 "너추천대로해"에 대한 답으로 방향을 전환했다.

> "deploy 번들은 static 묶음이라 그대로 쓰면 콘텐츠 컬렉션이랑 완전히 분리됨. jidonglab의 Astro 스택 위에 네이티브로 다시 구현해야지."

## 14개 파일, Astro + React 네이티브 재건

`src/components/home/`을 새로 만들고 컴포넌트를 섹션별로 분리했다.

| 파일 | 종류 | 역할 |
|---|---|---|
| `Hero.tsx` | React | 히어로 섹션 (인터랙티브) |
| `Lab.tsx` | React | 프로젝트 갤러리 |
| `Projects.tsx` | React | 사이드 프로젝트 리스트 |
| `Thumbnails.tsx` | React | 썸네일 그리드 |
| `TechBlock.tsx` | React | 기술 스택 블록 |
| `About.astro` | Astro | About 섹션 |
| `Footer.astro` | Astro | 푸터 |
| `NowStrip.astro` | Astro | 현재 작업 중 표시 |
| `ShipLog.astro` | Astro | 빌드 로그 최근 목록 |
| `Topbar.astro` | Astro | 상단 네비게이션 |
| `Wordmark.astro` | Astro | 로고 마크 |
| `Writing.astro` | Astro | 포스트 목록 섹션 |

`src/data/home.ts`에 하드코딩 데이터를 분리했다. `src/pages/index.astro`는 redirect 대신 이 컴포넌트들을 조합하는 페이지로 새로 작성했다.

Astro 컴포넌트는 정적 HTML 렌더링, React 컴포넌트는 인터랙션이 필요한 섹션만 담당하는 구조다. `client:load` 없이 번들에 포함되지 않도록 Astro 컴포넌트 비중을 높였다.

## tool call 분포

총 106 tool calls.

| 도구 | 횟수 | 용도 |
|---|---|---|
| Bash | 40 | 폴더 탐색, 로컬 서버, 스크린샷 |
| Read | 17 | 기존 컴포넌트·스키마 파악 |
| Write | 15 | 신규 컴포넌트·데이터 파일 생성 |
| TaskUpdate | 14 | 진행 추적 |
| TaskCreate | 7 | 하위 작업 분해 |
| ToolSearch | 4 | 도구 스키마 확인 |
| Glob + Grep | 6 | 파일 탐색 |

Edit이 0회다. 기존 파일을 수정한 게 아니라 전부 신규 Write로 만들었기 때문이다. `index.astro`는 redirect → 빈 조합 페이지 → 최종 재건 세 단계를 거쳤는데, 매번 Write로 전체를 교체했다.

Bash 40회 중 상당수가 폴더 위치 확인(세션 초반)과 로컬 서버 실행, 헤드리스 스크린샷 캡처다. Chrome DevTools Protocol로 스크롤 캡처를 시도했다가 권한 문제로 실패한 과정도 포함된다.

## 프롬프트가 짧을수록 탐색 비용이 올라간다

이 세션의 핵심 패턴이다. "deploy 폴더에 있는 거 다 적용해줘"라는 한 줄이 Claude에게는 다음을 의미했다.

1. deploy 폴더가 어디 있는지 찾아라 (Bash 여러 회)
2. jidonglab 레포가 어디 있는지 찾아라
3. 현재 `index.astro`가 어떤 구조인지 파악해라
4. 두 스택이 호환되는지 판단해라
5. 안 된다면 대안을 제시하고 실행해라

짧은 프롬프트가 나쁜 건 아니다. 탐색 비용(tool calls)을 Claude가 부담하는 구조로, 사용자는 방향만 잡고 구체적인 판단은 위임하는 방식이다. "너추천대로해" 한 마디가 14개 컴포넌트 아키텍처 결정으로 이어졌다.

> 방향만 잡고, 판단은 위임한다. 짧은 프롬프트는 탐색 비용을 올리지만 의사결정 속도를 올린다.
