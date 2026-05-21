---
title: "jidonglab 홈페이지 포트폴리오 명함으로 전환: Codex 교차검증 3회, GA4·AEO까지"
project: "portfolio-site"
date: 2026-05-21
lang: ko
tags: [claude-code, portfolio, seo, aeo, redesign, codex]
description: "jidonglab.com을 URL 하나로 내가 하는 일을 전달하는 포트폴리오 명함으로 바꿨다. 세션 20개, Codex 교차검증 3회, GA4·AEO·robots.txt까지 하루 만에 완료."
---

URL 하나를 받았을 때 "이 사람이 뭘 하는 사람인지"를 3초 안에 알 수 없다면 포트폴리오가 아니다. 지인에게 `jidonglab.com`을 보내고 "어떤 걸 하세요?"라는 질문을 받은 순간 그걸 깨달았다.

**TL;DR** 홈페이지를 포트폴리오 명함 페이지로 전면 개편했다. `Capabilities.astro` 신규 추가, Hero/About/Projects 카피 리샤프, 한국어 톤 정비, SEO/AEO 인프라(JSON-LD 3종, `llms.txt`, GA4)까지 같은 날 끝냈다. Codex 교차검증 3회를 돌리면서 카피 사실 오류도 잡았다.

## "URL 하나면 충분해야 한다"는 프롬프트

출발점은 이 문장이었다.

> "Redesign jidonglab.com so it works like a personal business card / portfolio sales page. If someone only receives this site URL, they should immediately understand what Jidong does and why they might work with him."

Hermes가 릴레이한 프롬프트였지만 방향은 명확했다. Hero 카피 샤프닝, "내가 하는 일" 섹션 신규 추가, About 톤 현재진행형으로 전환.

Claude는 먼저 기존 상태를 훑었다. `Hero.tsx`, `About.astro`, `Projects.tsx`, `index.astro`, `home.css`를 읽고 파악한 다음 실행했다. Read를 12번 쓴 후 Edit 11번으로 처리했다. Bash로 빌드와 타입체크를 돌려서 통과를 확인하고 세션을 끝냈다.

이 세션에서 생긴 파일이 `src/components/home/Capabilities.astro`다. "내가 하는 일" 섹션 — 자동화, 에이전트 오케스트레이션, 치과 광고 운영, 빌드 로그 작성 네 카드를 한국어·영어 이중 언어로 보여주는 컴포넌트다. `.do-grid`, `.do-card` CSS 클래스로 모바일 대응 1열 fallback까지 처리했다.

## max_turns 이후의 잔재 처리

첫 번째 문제는 세션이 도중에 끊긴 것이었다. Hermes의 max_turns 제한이 걸려서 `Capabilities.astro`가 untracked 상태로 남았다. `index.astro`는 이미 import하고 있는데 파일 자체는 커밋에 없는 상태.

Codex가 이걸 잡았다. 교차검증 1회차 리뷰 결과:

> "`src/pages/index.astro` imports/uses `src/components/home/Capabilities.astro`, but the file is untracked. Do not leave the tracked diff non-self-contained."

Codex 리뷰를 Claude에 다시 넘겼고, 빠진 파일을 스테이징하고 `Projects.tsx` 카피도 함께 정리했다. `Projects.tsx`는 섹션 제목 "지금 운영 중인 것들"이 실제 목록과 맞지 않는 문제도 있었다. 개발 중인 프로젝트도 섞여 있어서 운영 중 + 개발 중을 아우르는 표현으로 교체했다.

## "Every commit diff becomes a bilingual build log"는 거짓말이다

교차검증 2회차에서 또 잡혔다. `Capabilities.astro`의 영문 카피.

> "Every commit diff becomes a Korean/English build log." — 이건 사실이 아니다. 모든 커밋에 한영 빌드 로그가 생기는 게 아니기 때문이다.

이 종류의 오류는 코드 리뷰에서 잘 안 잡힌다. 로직 버그가 아니라 카피 사실 오류이기 때문이다. Codex가 외부 시선으로 읽어줬기 때문에 잡혔다.

수정:
- 한국어: `"커밋 diff를 한국어·영어 빌드 로그로 매일 쌓는다."` → `"진행 중인 작업을 한국어·영어 빌드 로그로 꾸준히 남긴다."`
- 영어: `"Every commit diff becomes a Korean/English build log."` → `"Progress gets documented as bilingual build logs."`

절대값 표현("every", "매일")을 방향성 표현("꾸준히", "captured")으로 바꿨다. 카피 검증에 외부 모델을 쓰는 이유가 이것이다. **표현이 사실과 부합하는지**를 다른 모델이 판단하면 구현자 혼자서는 놓치는 것들이 나온다.

## "혼자 같이 만든다"는 모순

교차검증 3회차. 이번엔 다른 카피.

`Capabilities.astro`에 `"혼자 같이 만든다."`라는 문장이 들어갔다. 혼자인데 같이? 의도는 이해할 수 있지만 한국어로는 모순처럼 읽힌다.

Claude가 고쳤다: `"AI와 함께, 실제로 혼자 만든다."` 영문도 `"Building alone, but with AI as co-pilot."` 으로 정렬했다. 같은 말인데 읽혔을 때 의미가 선명해진다.

Codex 교차검증 3회 사이클에서 잡힌 것: 코드 버그 0개, 카피 사실 오류 2개, 모순 문장 1개. 빌드는 세 번 모두 통과했다.

## "한글 맨트 톤이 이상해"

리디자인 후 사용자 피드백이 왔다.

> "좋은데 언어별 대응이랑 한글 문구들이 이상해 한글 맨트 톤?"

문제가 두 가지였다. 첫째, `data-ko`/`data-en` 어트리뷰트 기반 언어 토글 스크립트가 홈페이지에 없었다. `Base.astro`를 쓰는 서브페이지에는 토글이 있지만, `index.astro`는 독립 레이아웃을 써서 토글 스크립트가 로드되지 않았다. 둘째, 한국어 카피가 너무 직역체였다.

세션을 두 번 돌렸다. 첫 번째 세션은 파악만 하고 Read 13번 + Grep 3번으로 끝났다. 실제 수정은 두 번째 세션에서 이뤄졌다. `Hero.tsx`, `Capabilities.astro`, `Projects.tsx`, `ShipLog.astro` 네 파일을 건드렸다. Read 7번, Edit 5번.

## sitemap 경로 불일치와 SEO/AEO 인프라

SEO/AEO 작업으로 넘어가면서 먼저 현황을 감사했다.

발견한 것: `Base.astro`가 가리키는 sitemap 경로가 `/sitemap-index.xml`이었는데, 실제 Astro sitemap 라우트는 `/sitemap.xml`이다. 모든 서브페이지에서 sitemap link가 404를 가리키고 있던 셈이다.

JSON-LD도 없었다. Google에 사람을 설명하는 구조화 데이터가 없으면 검색 결과에서 개인 사이트는 맥락 없이 뜬다.

한 세션에서 한꺼번에 처리했다.

- `src/components/Analytics.astro` 신규 생성 — `PUBLIC_GA_MEASUREMENT_ID` 환경변수가 없으면 GA 스니펫을 아예 emit하지 않도록 gate 처리. 미설정 상태에서도 빌드가 터지지 않는다.
- `src/pages/index.astro` — JSON-LD 3종(Person + WebSite + ProfilePage) 삽입, OG 태그 강화
- `src/layouts/Base.astro` — sitemap 경로 `/sitemap-index.xml` → `/sitemap.xml` 수정, Analytics 컴포넌트 연결
- `public/robots.txt` 신규 생성 — AI 크롤러 13개 그룹 명시적 Allow, `/api/`·`/admin` 전역 차단
- `public/llms.txt` 신규 생성 — AEO용 엔티티 컨텍스트

도구 사용: Read 14번, Bash 6번, Edit 6번, Grep 3번, Write 3번.

## robots.txt의 함정

Codex가 `robots.txt`에서 한 가지 더 잡았다.

AI 크롤러 그룹(GPTBot, ClaudeBot 등)에 `Allow: /`를 넣으면 같은 그룹 내의 `Disallow: /api/`가 무효화될 수 있다. 크롤러 구현마다 rule 우선순위 해석이 다르기 때문이다. 안전하게 각 AI 크롤러 그룹에 `Disallow: /api/`와 `Disallow: /admin`을 명시적으로 추가했다. 13개 그룹 전부.

## 변경 파일 정리

수정: `Hero.tsx`, `About.astro`, `Projects.tsx`, `ShipLog.astro`, `Topbar.astro`, `home.ts`, `index.astro`, `home.css`, `Base.astro`, `.env.example`

신규 생성: `Capabilities.astro`, `Analytics.astro`, `public/robots.txt`, `public/llms.txt`

총 세션: 20개 (Hermes max_turns로 쪼개진 중복 포함). Codex 교차검증: 3회 사이클.

> 포트폴리오 명함의 기준은 하나다. 낯선 사람이 URL 하나만 받았을 때, 전화를 걸 이유가 생기는지. 오늘 작업은 그 기준에 더 가까워졌다.
