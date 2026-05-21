---
title: "Claude Code + Codex 4라운드 교차검증: jidonglab.com 명함화 리디자인 전 과정"
project: "portfolio-site"
date: 2026-05-22
lang: ko
tags: [claude-code, astro, seo, portfolio, redesign, codex, i18n]
description: "jidonglab.com을 포트폴리오 명함으로 바꾸는 과정에서 Codex가 카피 사실 오류, 모순 문장, robots.txt 규칙 충돌을 잡아냈다. 10세션, 164 tool calls, 교차검증 4라운드 전 과정."
---

Codex 교차검증이 코드 버그를 0개 잡고 카피 오류를 3개 잡았다. "Every commit diff becomes a Korean/English build log." — 빌드는 통과하고 타입 에러도 없지만 사실이 아닌 문장이다. 이런 건 자동 검증이 잡을 수 없다.

**TL;DR** jidonglab.com 홈페이지를 포트폴리오 명함으로 전면 재작업했다. 10세션, 164 tool calls, Codex 4라운드 교차검증. 코드 버그보다 카피 오류와 i18n 누락이 더 많이 나왔다.

## 시작: "어떤 걸 하시는 분이에요?"

지인에게 jidonglab.com 링크를 보냈는데 이 질문이 돌아왔다. AI 뉴스가 매일 올라오고, 프로젝트는 스크롤 아래에, Hero 카피는 모호했다. 사이트가 포트폴리오 역할을 못 하고 있었다.

작업 목표를 하나로 정했다. 낯선 사람이 URL만 받아도 Jidong이 뭘 만드는 사람인지 3초 안에 파악할 수 있을 것. 기술 스택은 건드리지 않고 카피와 섹션 구조만 바꾼다.

Claude는 `Hero.tsx`, `About.astro`, `Projects.tsx`, `index.astro`, `home.css`를 Read 12번으로 파악한 뒤 Edit 11번으로 처리했다. 이 세션에서 새로 생긴 파일이 `src/components/home/Capabilities.astro`다. AI 자동화, 풀스택 개발, 치과 광고 운영, 빌드 로그 작성 네 카드. `data-ko`/`data-en` 속성으로 언어 전환을 달고, `.do-grid` CSS 클래스로 모바일 1열 fallback도 처리했다.

Hermes max_turns 제한으로 세션이 중단되는 일이 반복됐다. 같은 작업 내용이 10개 유효 세션에 분산된 이유다.

## Codex 1라운드: self-contained하지 않은 diff

첫 Codex 교차검증이 돌아왔다.

> "`src/pages/index.astro` imports/uses `src/components/home/Capabilities.astro`, but the file is untracked. Do not leave the tracked diff non-self-contained."

`index.astro`는 이미 `Capabilities.astro`를 import하는데, 파일 자체가 커밋에 없었다. max_turns 중단 후 스테이징이 빠진 것. 파일을 추가하면서 `Projects.tsx` 카피도 같이 잡았다. "지금 운영 중인 것들"이 섹션 제목인데 목록에 개발 중인 프로젝트가 섞여 있었다. 운영 중 / 개발 중을 구분하는 표현으로 교체했다.

## Codex 2라운드: 빌드가 통과하는 거짓말

두 번째 라운드에서 더 흥미로운 것이 나왔다.

> `Capabilities.astro`: "Every commit diff becomes a Korean/English build log." — 이건 사실이 아니다.

모든 커밋에 한영 빌드 로그가 붙지 않는다. 코드 버그도, 타입 에러도 아니다. `npm run build`는 통과한다. 자동 검증이 구조적으로 잡을 수 없는 영역이다.

수정 전후:
- KO: `"커밋 diff를 한국어·영어 빌드 로그로 매일 쌓는다."` → `"진행 중인 작업을 한국어·영어 빌드 로그로 꾸준히 남긴다."`
- EN: `"Every commit diff becomes a Korean/English build log."` → `"Progress gets documented as bilingual build logs."`

절대값("every", "매일")을 방향성("꾸준히", "documented")으로 바꿨다. 의미는 같고, 사실이 된다.

## Codex 3라운드: 모순 문장

`"혼자 같이 만든다."` 혼자인데 같이? 의도는 읽히지만 한국어로 모순처럼 읽힌다.

`"AI와 함께, 실제로 혼자 만든다."` / `"Building alone, but with AI as co-pilot."` 으로 교체했다. 같은 의미인데 읽힐 때 선명해진다.

Codex 3라운드 누적: 코드 버그 0개, 카피 사실 오류 2개, 모순 문장 1개.

## "한글 맨트 톤이 이상해"

리디자인 직후 피드백이 왔다.

> "좋은데 언어별 대응이랑 한글 문구들이 이상해 한글 맨트 톤?"

원인이 두 가지였다. 하나는 카피가 직역체였다. 더 근본적인 문제는 `data-ko`/`data-en` 언어 토글 스크립트가 홈페이지에 없었다는 것.

`Base.astro`를 쓰는 서브페이지에는 토글 스크립트가 있다. 그런데 `index.astro`는 독립 레이아웃을 쓰기 때문에 스크립트 자체가 로드되지 않았다. 언어 전환 버튼을 눌러도 아무 일이 안 일어나고 있었다.

파악 세션은 Read 13번 + Grep 3번만 쓰고 수정을 못 했다. 실제 수정은 별도 세션에서 `Hero.tsx`, `Capabilities.astro`, `Projects.tsx`, `ShipLog.astro` 네 파일, Read 7번 Edit 5번.

## sitemap 404 버그와 SEO/AEO 인프라

SEO/AEO 작업에서 현황 감사를 먼저 했다.

오래된 버그가 나왔다. `Base.astro`와 기존 `robots.txt`가 가리키는 sitemap 경로는 `/sitemap-index.xml`인데, 실제 Astro 라우트는 `/sitemap.xml`다. 모든 서브페이지에서 `<link rel="sitemap">` 태그가 404를 가리키고 있었다. 언제부터인지 모른다.

JSON-LD도 없었다. 구조화 데이터 없이 개인 사이트는 Google에 맥락 없이 뜬다.

한 세션에서 처리했다.

- `src/components/Analytics.astro` 신규 — `PUBLIC_GA_MEASUREMENT_ID` 환경변수 없으면 GA 스니펫을 emit하지 않는다. 로컬 개발에서 빌드가 터지지 않는다.
- `src/pages/index.astro` — JSON-LD Person + WebSite + ProfilePage 삽입, OG 태그 강화
- `src/layouts/Base.astro` — sitemap 경로 `/sitemap-index.xml` → `/sitemap.xml`, Analytics 컴포넌트 연결
- `public/robots.txt` 신규 — AI 크롤러 13개 그룹(GPTBot, ClaudeBot, PerplexityBot 등) 명시
- `public/llms.txt` 신규 — AEO 엔티티 컨텍스트 작성

도구: Read 14번, Bash 6번, Edit 6번, Grep 3번, Write 3번.

## Codex 4라운드: robots.txt 규칙 충돌

```
User-agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /admin
```

`Allow: /`가 있으면 아래 `Disallow` 규칙이 무효화될 수 있다. robots.txt 명세가 rule 우선순위를 명확히 정하지 않아서, 크롤러 구현마다 해석이 다르기 때문이다.

GPTBot, ClaudeBot, PerplexityBot, GoogleOther, Google-Extended, ChatGPT-User 등 13개 크롤러 블록 각각에 `Disallow: /api/`와 `Disallow: /admin`을 명시적으로 추가했다. `Allow: /`는 콘텐츠 크롤링을 허용한다는 뜻이고, API 엔드포인트 차단은 별개로 처리해야 한다.

## 전체 통계

유효 세션 10개 (Hermes max_turns로 중복 분산된 것 제외), tool calls 약 164회. Bash 54회, Read 64회, Edit 31회, Write 4회.

수정 파일 9개, 신규 파일 4개(`Capabilities.astro`, `Analytics.astro`, `robots.txt`, `llms.txt`). Codex 교차검증 4라운드.

> Codex가 코드 버그보다 카피 오류를 더 많이 잡았다. 자동 검증이 닿지 않는 영역이 있다.
