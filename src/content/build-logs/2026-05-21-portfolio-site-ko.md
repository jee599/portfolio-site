---
title: "jidonglab 전면 리디자인: 거부당한 시안에서 Codex 검수 통과까지 14개 컴포넌트"
project: "portfolio-site"
date: 2026-05-21
lang: ko
tags: [claude-code, redesign, astro, tailwind, codex, portfolio]
description: "Apple 클론 시안이 거부된 후 처음부터 다시. 14개 컴포넌트 재작성, Codex 2라운드 검수, 카피 7번 수정. Claude Code로 jidonglab.com 홈을 '개인 연구실 logbook'으로 바꾼 과정."
---

이전 시안은 한 번 거부됐다. 흰 여백, 큰 글자, 카드 그리드. "Apple 클론"이었다.

**TL;DR** 14개 컴포넌트를 새로 짜고, Codex 교차검증을 2라운드 통과하고, 카피를 7번 다듬었다. 가장 오래 걸린 건 코드가 아니라 "뭘 보여줄 것인가"를 결정하는 일이었다.

## 방향은 한 줄로 정했다

설계 논쟁은 없었다. 프롬프트에 배경이 명확히 있었기 때문이다.

> "지동랩은 제품 하나 파는 랜딩이 아니라 개인 빌더/랩/프로젝트 운영체계 사이트다. 디자인은 '개발자 연구실 + 개인 출판 + 운영 로그 + 프로젝트 인덱스'가 느껴져야 한다."

거기서 도출된 방향은 **"개인 연구실 logbook"**이었다. 에이전시 랜딩이 아니라 1인 연구실의 운영 현황판. 정보 밀도가 typography spectacle보다 우선한다. section kicker, status, date, project metadata는 mono 폰트. body는 IBM Plex Sans KR.

이전 시안의 Space Grotesk 104px serif, cream/acid 배경, 거대한 hero 문구는 전부 버렸다.

## 14개 컴포넌트를 한 세션에

`src/components/home/` 아래 컴포넌트들을 전면 재작성했다. 세션 하나에 57 tool calls, 17분.

새로 생성하거나 전면 재작성한 파일:

- `Hero.tsx` — 이름, 한 줄 소개, status strip
- `Topbar.astro` — nav
- `NowStrip.astro` — 지금 뭘 하고 있나
- `Projects.tsx` — featured(1) + active grid + indexed archive
- `ShipLog.astro` — 최근 커밋 기반 활동 로그
- `Writing.astro` — 글 목록
- `About.astro` — 짧은 자기소개
- `Footer.astro` — 바닥
- `src/styles/home.css` — 전면 재작성

CSS는 Tailwind utility를 wrapping하는 방식이 아니라 CSS custom property 기반으로 짰다. `--color-accent: #00c471`, mono spine 규칙을 토큰으로 정의하고 컴포넌트들이 참조하는 구조.

`npm run build`는 첫 번째 시도에서 통과했다.

## Codex 1차: request-changes

빌드 통과 직후 Codex 교차검증을 돌렸다.

verdict: **request-changes**.

blocking은 하나였다. `Projects.tsx`의 모바일 그리드 불일치. `.desc`와 `.stack` 클래스를 960px 이하에서 숨기도록 CSS가 되어 있었는데, header span에는 같은 클래스가 없었다. 결과적으로 헤더 셀 수와 row 셀 수가 어긋났다.

수정 방향은 간단했다. header span에 row와 동일한 클래스를 붙이거나, CSS를 `nth-child` 기준으로 맞추는 것. 전자를 택했다.

non-blocking도 같이 처리했다.

- `prefers-reduced-motion` 미대응 pulse animation → `@media (prefers-reduced-motion: reduce)` 블록 추가
- `Hero.tsx`의 빈 `data-ko="."` span → 의미 없는 마침표 제거
- `ShipLog.astro`의 `<p>` 안 `<strong>` 중첩 언어 스크립트 충돌 가능성 → 구조 정리

## Codex 2차: approve

재검증 결과 모든 blocking이 해소됐다. verdict: **approve**.

빌드도 통과. `git diff --check` 클린.

## 사용자 피드백: "디자인은 좋은데"

코드 검수가 끝난 후 사용자 피드백이 왔다.

> "좋아 디자인 자체는 좋은데 번역 투랑 불필요한 정보 / 심플함이나 각 프로젝트별 이미지가 있으면 좋겠어"

세 가지였다. 번역투 제거, 정보량 다이어트, 프로젝트 이미지.

번역투는 예상보다 많았다. "운영 인덱스", "AI 빌더", "실험 중인 것들" 같은 표현이 곳곳에 있었다. Claude가 영어로 설계하고 한국어로 옮긴 흔적이었다. 이걸 한국어 원어민이 쓴 것처럼 다듬는 작업이 세 세션에 걸쳐 진행됐다.

이미지는 `public/images/projects/`에 있는 스크린샷 8개를 쓰기로 했다. 나머지 프로젝트는 CSS/토큰 기반 visual fallback. `src/data/home.ts`에 `PROJECT_IMAGE` 매핑을 추가하고, `Projects.tsx`에서 import해서 카드에 붙이는 구조.

한 가지 삽질이 있었다. Codex가 "이미지가 렌더링되지 않는다"고 지적했는데, 원인은 `PROJECT_IMAGE` 매핑은 `home.ts`에 추가됐지만 `Projects.tsx`가 실제로 import하지 않았기 때문이었다. 데이터 레이어와 컴포넌트가 연결되지 않은 상태로 빌드가 통과한 것이다. `Thumbnails.tsx`도 no-op 상태였다.

수정: `Projects.tsx`에서 이미지 경로를 받아서 `<img>` 태그로 렌더링하게 수정. fallback은 CSS `background`로 처리.

## "매일 굴리는 툴체인"을 지우다

이 작업이 예상보다 여러 라운드에 걸렸다.

사용자 요청은 "실제에 적용해주고 매일 굴리는 툴체인 빼주고 전체적으로 말투 수정해줘"였다.

문제는 cron 스케줄, 내부 파이프라인, Claude Code 스킬 이름이 공개 카피에 노출돼 있었다는 것이다. `Lab` 섹션이 특히 심했다. "매일 08:00 KST 자동 실행", "Claude Code 훅", "멀티에이전트 오케스트레이션" 같은 표현들이 사이트 전면에 있었다.

지운 것들:

- `Lab` 섹션 전체 (`src/pages/index.astro`에서 import 제거)
- `NowStrip`의 `매일 08:00 KST` 시간 표기
- `src/data/home.ts`의 `spoonai` 프로젝트 설명에서 "AI 뉴스 자동 발행 파이프라인" → "AI 뉴스 아카이브"
- `src/pages/about.astro`의 "모든 프로젝트는 Claude Code로 빌드됩니다" 문구
- `public/llms.txt`에서 MCP 서버, 멀티에이전트 오케스트레이션, 훅 관련 내용
- `src/layouts/Base.astro` footer의 "Built with Claude Code"

공개 카피에서 내부 인프라를 보여주는 건 나쁜 신호다. 사이트를 처음 보는 사람은 cron 스케줄이 얼마나 정교한지 알고 싶은 게 아니라, 이 사람이 뭘 만들었는지가 궁금하다.

## .gitignore도 고쳤다

Codex가 마지막으로 지적한 것. `.claude/agent-memory/`, `.claude/worktrees/`, `.wrangler/`가 untracked 상태로 있었는데, `.gitignore`에 없었다. production commit에 로컬 상태 디렉토리가 딸려가는 상황을 방지하기 위해 추가했다. 기존 `.vercel/` 항목도 중복이 있어서 정리했다.

## 도구 사용 통계

전체 리디자인 과정에서 집계한 수치 (중복 세션 제외):

- 총 세션 수: 10개 이상 (초기 설계부터 최종 카피 패스까지)
- Bash: ~70회 (빌드 검증, git diff, dev 서버)
- Read: ~65회 (기존 컴포넌트 파악, 카피 확인)
- Edit: ~40회 (카피 수정, 버그 픽스)
- Write: ~15회 (새 컴포넌트, CSS, 데이터 파일)

Codex 교차검증: 2라운드. 1차 request-changes → 수정 → 2차 approve.

코드보다 카피 수정에 더 많은 라운드가 들었다는 게 흥미롭다. CSS 그리드 버그 수정은 한 세션. "번역투를 없애고 내부 툴체인 냄새를 지우는 것"은 6~7 세션.

## 남은 것

로컬에서 Cloudflare Pages 환경(`wrangler pages dev`)으로 preview를 돌려봤다. Cloudflare adapter는 `astro preview`를 지원 안 한다. `dist/`를 직접 serve해야 한다.

공개 preview URL이 필요했지만, Cloudflare API 토큰이 없고 Vercel MCP도 권한 미승인 상태였다. 로컬 preview로 확인하고 진행했다.

프로덕션 배포는 이후 main 브랜치 merge + Cloudflare Pages 자동 빌드로 진행할 예정이다.

> 코드보다 "이걸 왜 보여주나"를 결정하는 게 더 어렵다. 그 판단이 결정되면 Claude는 빠르게 따라온다.
