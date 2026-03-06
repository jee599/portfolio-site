---
title: "Paddle 결제 통합 + Claude CLI 자동 빌드 로그 파이프라인 구축"
project: "saju_global"
date: 2026-03-05
lang: ko
pair: "2026-03-05-paddle-and-ci-automation-en"
tags: [paddle, payment, ci-cd, claude-code, automation]
---

## 뭘 했나

- Stripe 전용이던 결제 시스템에 **Paddle을 1차 결제 수단으로 추가**
- Playwright로 **8개 로케일 E2E 스모크 테스트** 실행
- husky pre-push 훅 → Claude CLI → 빌드 로그 자동 생성 → GitHub Actions로 **포트폴리오/블로그 동기화 파이프라인** 완성

## 어떻게 구현했나

### Paddle 결제 통합

제약 조건을 먼저 명시했다: **"기존 Stripe/Toss 코드 건드리지 않고, 환경변수 하나로 전환 가능하게."**

- `NEXT_PUBLIC_PAYMENT_PROVIDER=paddle` 하나로 분기되는 `effectiveProvider` 로직 설계
- `/api/checkout/paddle/create`, `/api/checkout/paddle/webhook` 두 라우트 신규 생성
- typecheck + `next build` 통과 확인 후 커밋

### 자동화 파이프라인

Claude가 생성한 코드를 push할 때마다 Claude가 빌드 로그까지 써준다 — 이 문서가 바로 그 결과물이다.

> "husky pre-push 훅에서 `claude -p`로 빌드 로그를 생성하고, GitHub Actions에서 포트폴리오 레포와 블로그 레포로 자동 동기화해줘. 커밋 5개 이상이면 블로그 초안도 만들어줘."

핵심 설계 결정:

- **`gtimeout 60` 제한** — Claude CLI가 무한정 돌면 push가 멈추므로 타임아웃 설정
- 실패해도 `|| echo "⚠️ 스킵"`으로 hook이 블로킹하지 않게 처리

### 삽질 기록

1. macOS에 `timeout`이 없어서 `gtimeout`(coreutils)으로 교체
2. Claude CLI 경로가 상대경로로 안 먹혀서 풀패스(`/Users/jidong/.local/bin/claude`)로 수정
3. Vercel 배포에서 Next.js framework preset을 못 잡음 → `vercel.json`에 `framework: "nextjs"` 명시 + 루트 디렉토리 `apps/web` 설정

### 런칭 전 감사

Claude에게 실제 파일 탐색 + `pnpm dev:web` + HTTP 요청 테스트를 요청했다. 조건: **"추측 없이, 모든 근거에 파일 경로 또는 실행 결과 명시."**

- 레이트 리밋 5회 한도 실측 PASS
- 8개 로케일 paywall 접근 전부 PASS
- P0 결함 없음

## 커밋 로그

- `82e29d8` chore: add automation setup (Paddle API, Husky hook, GitHub Actions, E2E, 감사 문서)
- `a6379ed` fix(deploy): set Next.js framework in vercel.json
- `7feb33f` fix(deps): add three and @types/three to web package
- `2e10679` fix: use gtimeout for macOS
- `bb714ce` fix: use full path for claude CLI
- `e659c9b` fix(deploy): ignore husky failure in CI environment
- `3789e6d` fix(deploy): remove .env.local from git tracking
- `5c7cece` chore: trigger rebuild with env vars configured

## 결과

| 항목 | Before | After |
|------|--------|-------|
| 결제 수단 | Stripe + Toss | Stripe + Toss + **Paddle** (환경변수 전환) |
| 레이트 리밋 | 없음 | 5회/일 (LLM 엔드포인트) |
| E2E 커버리지 | 0 | 8개 로케일 × 핵심 플로우 |
| 빌드 로그 | 수동 작성 | push 시 Claude CLI 자동 생성 |
