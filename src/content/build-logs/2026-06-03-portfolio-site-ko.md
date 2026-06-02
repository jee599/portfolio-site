---
title: "홈페이지 전면 리디자인: 로그북에서 포트폴리오로, 18개 세션의 기록"
project: "portfolio-site"
date: 2026-06-03
lang: ko
tags: [claude-code, astro, redesign, worktree, codex-review]
description: "18개 세션, 도구 호출 500회 이상. Jidong Lab 홈페이지를 개인 로그북에서 클라이언트용 포트폴리오로 리디자인한 과정. Git worktree로 원본을 건드리지 않고 비교 브랜치를 운용한 방법."
---

18개 세션, 500회 이상의 도구 호출. 그 결과물이 지금 보고 있는 이 화면이다.

**TL;DR** Git worktree로 격리된 비교 브랜치를 만들고, Claude Code로 전체 홈페이지를 리디자인했다. Codex 리뷰를 통과한 뒤 프로덕션에 배포했다.

## 시작: "로그북"에서 "포트폴리오"로

기존 홈페이지는 개인 빌드 로그 형태였다. 문서가 쌓이는 방식. 프로젝트를 나열하는 방식. 개발자 개인의 작업 흔적을 보여주기엔 적합했지만, 처음 방문한 사람이 "이 사람이 뭘 하는 사람인지" 30초 안에 파악하기는 어려운 구조였다.

리디자인 목표는 명확했다: 포트폴리오 사이트이자 비즈니스 카드처럼 동작하게. 기존 Astro/React/Tailwind 컨벤션과 KO/EN 이중 언어 지원은 유지한다. 프로젝트 데이터와 기존 콘텐츠 라우트도 그대로 살린다.

## Worktree로 격리한 이유

가장 먼저 한 결정이 worktree였다. 리디자인이 실패하면 롤백이 즉시 가능해야 했다. 프로덕션 `main`을 직접 건드리지 않고 `claude/jidonglab-redesign-compare` 브랜치를 별도 worktree(`portfolio-site-claude-redesign/`)에서 운용했다.

```bash
git worktree add ../portfolio-site-claude-redesign claude/jidonglab-redesign-compare
```

이 구조 덕분에 원본이 계속 살아있는 상태에서 실험이 가능했다. 세션 도중 실수가 생겨도 `main`에는 영향이 없었다.

## 구현: 112번의 도구 호출

핵심 구현 세션은 세션 12/13이었다. 단일 세션에서 Edit 33회, Bash 31회, Read 29회. 총 112회 도구 호출이었다.

수정 파일 목록:
- `src/components/home/Hero.tsx` — 완전 재작성
- `src/components/home/About.astro`, `Capabilities.astro`, `Footer.astro`, `ShipLog.astro`, `Topbar.astro`, `Projects.tsx`
- `src/data/home.ts` — 데이터 레이어
- `src/pages/index.astro`, `src/styles/home.css`

신규 생성:
- `src/components/home/Contact.astro` — 연락처/CTA 섹션
- `src/components/home/Method.astro` — 작업 방식 소개

기존 컴포넌트를 수정하는 것보다 새 컴포넌트를 추가하는 쪽이 회귀를 줄이는 방법이었다. `Contact.astro`와 `Method.astro`는 기존 흐름을 깨지 않으면서 페이지에 맥락을 추가했다.

## 삽질: node_modules가 없는 worktree

`npm run build`를 처음 실행했을 때 실패했다. worktree는 git 관점에서 별도 체크아웃이라 `node_modules`가 없는 상태였다. `npm ci`로 의존성을 설치해야 했다.

```bash
cd ~/portfolio/portfolio-site-claude-redesign
npm ci
npm run build
```

빌드가 통과한 것을 확인한 뒤에야 커밋을 준비했다. 검증 없이 커밋하면 의미가 없다.

## Codex 크로스 리뷰

Claude Code 구현 이후 Codex로 블로커 온리 리뷰를 돌렸다. 결과: **APPROVE**. 블로킹 이슈 없음.

단 하나의 논블로킹 지적이 있었다: `Contact.astro`에 `https://dev.to/jee599`가 하드코딩됐는데 실제 프로필은 `https://dev.to/ji_ai`였다. `Footer.astro`에도 동일한 오래된 URL이 있었다.

프로덕션 폴리시 패스에서 이를 수정했다. 관련 없는 변경은 하지 않았다. 수정 후 `npm run build`를 다시 돌려 확인했다.

## 배포 후 확인

배포 완료 후 백그라운드 태스크로 `jidonglab.com`에 폴링을 걸어 실제 서빙을 확인했다. Cloudflare Pages가 `claude/jidonglab-redesign-compare` 브랜치를 프리뷰로 먼저 서빙했고, 이후 `main`으로 머지됐다.

현재 이 포스트를 보고 있는 홈페이지가 그 결과물이다.

## 구조적으로 배운 것

**1. 리디자인은 worktree부터 시작한다.** 실험 브랜치를 별도 디렉토리에 격리하면 rollback이 git checkout 한 줄이다. 원본 대비 diff도 명확하게 보인다.

**2. 빌드 검증은 커밋 전에 한다.** worktree에서 `npm ci && npm run build`가 통과해야 커밋할 수 있다. 로컬에서 깨진 빌드를 프로덕션에 올리면 Cloudflare Pages 배포도 깨진다.

**3. 크로스 리뷰는 실제로 효과가 있다.** Codex가 잡은 DEV.to URL 불일치는 Claude Code가 스스로 발견하지 못한 거였다. URL 하나지만 프로덕션에서는 신뢰도 문제다.

**4. 새 컴포넌트 추가 > 기존 컴포넌트 수정.** 기능을 추가할 때 기존 파일을 건드리면 회귀 범위가 넓어진다. `Contact.astro`, `Method.astro`처럼 새 파일로 분리하면 기존 동작에 영향을 최소화할 수 있다.

---

세션 요약으로 보면 숫자가 크다. 18개 세션, 500회 이상 도구 호출. 하지만 실제로 홈페이지에 변경이 생긴 건 세션 12/13 하나뿐이었다. 나머지는 분석, 탐색, 리서치였다. Claude Code를 활용한 작업에서 "준비"에 쓰이는 비용이 얼마나 되는지 보여주는 데이터다.
