---
title: "Static 번들 붙였다가 다 뜯어낸 이유 — 홈페이지 리디자인 204 tool calls"
project: "portfolio-site"
date: 2026-04-23
lang: ko
tags: [claude-code, astro, portfolio, design, refactoring]
description: "deploy 폴더 static 번들을 그대로 적용했다가 Content Collections 단절 문제로 Astro 네이티브 재구현. Claude Design 시스템 프롬프트 역공학 후 2차 리디자인까지, 총 204 tool calls."
---

deploy 폴더에 있던 React 번들을 `index.astro`에 그대로 붙였다. 3초 후에 문제를 발견했다 — 빌드 로그도, 블로그 포스트도, AI 뉴스 피드도 전부 날아간 홈페이지였다.

**TL;DR** Static 번들 적용 → Content Collections 단절 발견 → Astro 네이티브 12개 컴포넌트 재구현 → Claude Design 시스템 프롬프트 역공학 → 2차 리디자인. 총 2개 세션, 204 tool calls, 17개 파일 생성.

## "그냥 붙이면 되지" — 이렇게 시작됐다

프롬프트는 단순했다. "deploy 폴더에 있는 거 jidonglab에 다 적용해줘."

deploy 폴더 안에는 `app.jsx`, `data.js`, `index.html`, `styles.css`, `tech.jsx`, `thumbnails.jsx` — 약 103KB의 React 컴포넌트 묶음이 있었다. 잘 만들어진 홈 디자인이었고, 그대로 얹으면 된다고 생각했다.

Claude는 `src/pages/index.astro`(19.2KB의 기존 홈)를 580B짜리 redirect로 덮어쓰고, `public/jidonglab-home/`에 static 번들을 넣었다. "예시 화면 보여줘"로 스크린샷을 요청했다. 히어로 섹션은 깔끔하게 렌더링됐다.

문제는 그 다음이었다. 빌드 로그 목록이 없었다. 포스트 카드가 없었다. deploy 번들은 Astro Content Collections와 완전히 단절된 static 묶음이었다 — 빌드 시점에 데이터를 읽지 못하는 구조. 껍데기만 남은 홈페이지였다.

## 106 tool calls로 12개 컴포넌트 다시 짠 과정

"너 추천대로 해"로 방향을 위임했다.

Claude가 설계를 분석했다. deploy 번들을 그대로 쓰면 Content Collections를 포기해야 한다. Astro 네이티브로 재구현하는 것 외에 선택지가 없었다.

작업 순서: 기존 `index.astro` 분석으로 필요한 데이터 파악 → `src/data/home.ts`로 데이터 레이어 분리 → `src/components/home/` 아래 컴포넌트 구현. React 클라이언트 컴포넌트 5개(`Hero.tsx`, `Lab.tsx`, `Projects.tsx`, `TechBlock.tsx`, `Thumbnails.tsx`)와 Astro 서버 컴포넌트 7개(`About.astro`, `Footer.astro`, `NowStrip.astro`, `ShipLog.astro`, `Topbar.astro`, `Wordmark.astro`, `Writing.astro`)로 나눴다. Content Collections는 `ShipLog.astro`에서 직접 읽는다.

도구 사용 내역: Bash 40회, Read 17회, Write 15회, TaskUpdate 14회, TaskCreate 7회. 3시간 26분에 106 tool calls.

## Claude Design 시스템 프롬프트를 역공학한 이유

2차 리디자인은 다른 경로에서 시작됐다. "claude design 코드 유출된 거 찾아줘"가 발단이었다.

Claude Design은 2026-04-17에 출시된 Anthropic Labs 제품이다. `claude.ai/design`에서 접근하고 Pro 이상 구독이 필요하다. 출시 당일 시스템 프롬프트가 외부에 공개됐다 — [elder-plinius/CL4R1T4S](https://github.com/elder-plinius/CL4R1T4S) 레포에 422라인, 약 73KB짜리 프롬프트 + 툴 스키마가 통째로 올라왔다.

이걸 분석해서 핵심만 추출했다. Claude Design의 구조: HTML이 유일한 네이티브 출력 포맷이고, 사용자에게 먼저 질문을 던져 컨텍스트를 수집한 뒤 디자인을 생성한다. "질문 기법"과 "AI-slop 가드"가 핵심이었다.

이걸 로컬 스킬로 이식했다. `~/.claude/skills/claude-design-lite/SKILL.md` — Live preview·Tweaks·Design Mode 같은 호스트 의존 기능은 버리고, 질문 기법·컨텍스트 수집·변주 생성만 로컬에서 돌리는 워크플로우다. WebSearch 없이 시스템 프롬프트 분석만으로 제품의 핵심 메커니즘을 복제할 수 있었다.

## 4개 디자인 변형, 1개 방향

스킬을 발동하고 jidonglab.com 리디자인을 요청했다. 컨텍스트 수집 질문 10개가 왔다 — 정체성, 타겟 오디언스, 컬러 팔레트, 레퍼런스 스타일 등. 답을 넘겼다: 테크 포트폴리오, 한국/글로벌 둘 다, 토스 그린 계열, 심플하고 트렌디하게.

4개 변형이 만들어졌다: `v1-notebook.html`(서체 중심), `v2-pro.html`(다크 테크 포트폴리오), `v2-studio.html`(카드 그리드), `v3-labos.html`(미니멀 시스템 UI). v2-pro 방향이 가장 좋다는 피드백이 나왔고, 거기에 activity heatmap 아이디어가 붙었다. 사용자 프롬프트 그대로:

> "매일, 기록한다. 1년치 커밋·포스트·빌드로그를 한 화면에. 놀았던 날도, 폭주한 날도 숨기지 않는다."

GitHub 잔디 UI를 가져오되, 커밋만이 아니라 블로그 포스트와 빌드 로그까지 합산하는 개념이었다. 화면에는 "누적 2,847건, 최장 연속 41일"이 표시됐는데 "진짜야?"라는 질문이 왔다. 아니었다. 시각 목업용 placeholder였다. 실제 GitHub API와 Content Collections를 연결하는 작업이 남아있다.

## 세션 통계

| 세션 | 소요 시간 | tool calls | 주요 작업 |
|---|---|---|---|
| 홈페이지 네이티브 재구현 | 3h 26min | 106 | 12개 컴포넌트 생성 |
| Claude Design 역공학 + 리디자인 | 2h 5min | 98 | 스킬 생성 + 4개 변형 |

총 생성 파일 17개, 수정 파일 1개. Bash(64회), Edit(37회), Write(26회)가 도구 사용의 대부분을 차지했다.

Static 번들을 그냥 붙이는 게 왜 안 되는지 이번 세션에서 몸으로 배웠다.

> 디자인은 데이터에서 분리되는 순간 껍데기가 된다.
