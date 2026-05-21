---
title: "jidonglab.com 명함화 리디자인: 33세션 581 tool calls, Codex 4라운드"
project: "portfolio-site"
date: 2026-05-21
lang: ko
tags: [claude-code, astro, seo, portfolio, redesign, codex]
description: "AI 뉴스 피드처럼 보이던 jidonglab.com을 URL 하나로 포지셔닝이 읽히는 포트폴리오 명함으로 바꿨다. Capabilities 신설, 한국어 톤 교정, SEO/GA4/robots.txt까지 581 tool calls."
---

지인에게 jidonglab.com 링크를 보냈다가 "어떤 걸 하시는 분이에요?"라는 질문을 받은 적 있다. AI 뉴스가 매일 올라오고, 프로젝트 탭은 스크롤 아래에 있고, Hero 카피는 모호했다. 포트폴리오가 포트폴리오 역할을 못 하고 있었다.

**TL;DR** 홈페이지를 포트폴리오 명함으로 전면 재작업했다. `Capabilities.astro` 신설, Hero/About/Projects 카피 리샤프, 한국어 톤 정비, JSON-LD 3종 + GA4 + robots.txt까지 같은 날 완료. 33세션, 581 tool calls, Codex 교차검증 4라운드.

## "URL 하나면 충분해야 한다"

리포지셔닝 목표는 하나였다. 낯선 사람이 URL만 받아도 Jidong이 뭘 만드는 사람인지 3초 안에 파악할 수 있어야 한다.

작업 범위를 처음부터 좁게 잡았다. Hero 카피 교정, "내가 하는 일" 섹션 신설, About 어조 전환, nav 정리. 기술 스택은 건드리지 않는다.

Claude는 `Hero.tsx`, `About.astro`, `Projects.tsx`, `index.astro`, `home.css`를 Read 12번으로 파악한 다음 Edit 11번으로 처리했다. 이 세션에서 생긴 파일이 `src/components/home/Capabilities.astro`다. AI 자동화, 풀스택 개발, 치과 광고 운영, 빌드 로그 작성 네 카드를 `data-ko`/`data-en` 속성으로 이중 언어 전환과 함께 보여준다. `.do-grid` CSS 클래스로 모바일 1열 fallback도 처리했다.

빌드 통과, 타입체크 통과. Hermes max_turns 제한으로 세션이 중단되는 일이 반복됐다. 같은 작업 내용이 33세션에 분산된 이유다.

## Codex 1라운드: untracked 파일이 tracked diff에 포함됐다

첫 번째 Codex 교차검증 결과.

> "`src/pages/index.astro` imports/uses `src/components/home/Capabilities.astro`, but the file is untracked. Do not leave the tracked diff non-self-contained."

`index.astro`는 이미 `Capabilities.astro`를 import하는데, 파일 자체가 커밋에 없는 상태였다. max_turns 중단 후 스테이징이 빠진 것이다. 파일을 추가하면서 `Projects.tsx` 카피 문제도 같이 처리했다. "지금 운영 중인 것들"이 섹션 제목인데 목록에는 개발 중인 프로젝트도 섞여 있었다. 운영 중과 개발 중을 구분하는 표현으로 교체했다.

## Codex 2라운드: 카피가 거짓말을 한다

두 번째 라운드에서 더 재미있는 것이 나왔다.

> `Capabilities.astro`: "Every commit diff becomes a Korean/English build log." — 이건 사실이 아니다.

모든 커밋에 한영 빌드 로그가 붙는 건 아니다. 코드 버그가 아니라 카피 사실 오류다. 빌드는 통과하고 타입 에러도 없다. 자동 검증이 잡을 수 없는 영역이다.

수정 전후:
- 한국어: `"커밋 diff를 한국어·영어 빌드 로그로 매일 쌓는다."` → `"진행 중인 작업을 한국어·영어 빌드 로그로 꾸준히 남긴다."`
- 영어: `"Every commit diff becomes a Korean/English build log."` → `"Progress gets documented as bilingual build logs."`

절대값 표현("every", "매일")을 방향성 표현("꾸준히", "documented")으로 바꿨다.

## Codex 3라운드: "혼자 같이 만든다"

`Capabilities.astro`에 `"혼자 같이 만든다."`라는 문장이 들어갔다. 혼자인데 같이? 의도는 이해되지만 한국어로 모순처럼 읽힌다.

`"AI와 함께, 실제로 혼자 만든다."` 영문도 `"Building alone, but with AI as co-pilot."` 으로 정렬했다. 같은 말인데 읽혔을 때 의미가 선명해진다.

Codex 3라운드 누적 결과: 코드 버그 0개, 카피 사실 오류 2개, 모순 문장 1개. 빌드는 세 번 모두 통과.

## "한글 문구 톤이 이상해"

리디자인 직후 피드백이 왔다. "좋은데 언어별 대응이랑 한글 문구들이 이상해 한글 맨트 톤?"

원인이 두 가지였다. 첫째, `data-ko`/`data-en` 언어 토글 스크립트가 홈페이지에 없었다. `Base.astro`를 쓰는 서브페이지에는 있지만 `index.astro`는 독립 레이아웃을 써서 토글 스크립트 자체가 로드되지 않았다. 둘째, 카피가 직역체였다.

첫 번째 세션은 파악에만 Read 13번 + Grep 3번을 썼다. 실제 수정은 두 번째 세션에서 했다. `Hero.tsx`, `Capabilities.astro`, `Projects.tsx`, `ShipLog.astro` 네 파일, Read 7번 Edit 5번.

## sitemap 404와 SEO/AEO 인프라

SEO/AEO 작업에서 현황 감사를 먼저 했다.

오래된 버그가 나왔다. `Base.astro`와 `robots.txt`가 가리키는 sitemap 경로가 `/sitemap-index.xml`인데 실제 Astro 라우트는 `/sitemap.xml`이다. 모든 서브페이지에서 `<link rel="sitemap">` 태그가 404를 가리키고 있었다.

JSON-LD도 없었다. 구조화 데이터 없이 개인 사이트는 Google에 맥락 없이 뜬다.

한 세션에서 처리했다.

- `src/components/Analytics.astro` 신규 — `PUBLIC_GA_MEASUREMENT_ID` 환경변수 없으면 GA 스니펫 자체를 emit하지 않음. 미설정 로컬에서도 빌드가 터지지 않는다.
- `src/pages/index.astro` — JSON-LD Person + WebSite + ProfilePage 삽입, OG 태그 강화
- `src/layouts/Base.astro` — sitemap 경로 `/sitemap-index.xml` → `/sitemap.xml` 수정, Analytics 연결
- `public/robots.txt` 신규 — AI 크롤러 13개 그룹 명시
- `public/llms.txt` 신규 — AEO 엔티티 컨텍스트

도구: Read 14번, Bash 6번, Edit 6번, Grep 3번, Write 3번.

## Codex 4라운드: robots.txt AI 크롤러 규칙 충돌

```
User-agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /admin
```

`Allow: /`가 있으면 아래 `Disallow` 규칙이 무효화될 수 있다. 크롤러 구현마다 rule 우선순위 해석이 다르기 때문이다. GPTBot, ClaudeBot, PerplexityBot 등 13개 크롤러 블록 각각에 `Disallow: /api/`와 `Disallow: /admin`을 명시적으로 추가했다.

## 전체 통계

세션 33개 (Hermes max_turns로 쪼개진 중복 포함), tool calls 581회. 도구별: Bash 251회, Read 177회, Edit 83회, Write 23회.

수정 파일 13개, 신규 파일 13개. Codex 교차검증 4라운드.

> 포트폴리오 명함의 기준은 하나다. 낯선 사람이 URL 하나만 받았을 때, 전화를 걸 이유가 생기는지.
