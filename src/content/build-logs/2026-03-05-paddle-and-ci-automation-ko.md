---
title: "Paddle 결제 통합 + Claude CLI 자동 빌드 로그 파이프라인 구축"
project: "saju_global"
date: 2026-03-05
lang: ko
pair: "2026-03-05-paddle-and-ci-automation-en"
tags: [paddle, payment, ci-cd, claude-code, automation]
---

Stripe 전용이던 결제에 Paddle을 추가했다.

코드를 push할 때마다 빌드 로그가 자동으로 쓰이는 파이프라인도 만들었다.

이 글 자체가 그 파이프라인의 결과물이다.


## Paddle 통합

"기존 Stripe/Toss 코드 건드리지 않고, 환경변수 하나로 전환 가능하게"를 제약 조건으로 잡았다.

`NEXT_PUBLIC_PAYMENT_PROVIDER=paddle` 하나로 분기되는 `effectiveProvider` 로직을 설계했다.

두 개의 API 라우트를 새로 만들었다.

- `/api/checkout/paddle/create`
- `/api/checkout/paddle/webhook`

typecheck와 `next build` 통과 확인 후 커밋.


## 자동화 파이프라인

이게 더 재밌었다.

구조는 간단하다.

> `git push` → husky pre-push hook → Claude CLI가 빌드 로그 생성 → GitHub Actions가 포트폴리오에 동기화

핵심은 `gtimeout 60` 제한이었다.

Claude CLI가 무한정 돌면 push가 멈추니까 타임아웃을 걸었다.

실패해도 `|| echo "스킵"` 으로 hook이 블로킹하지 않게 했다.

삽질 2건이 있었다.

- macOS에 `timeout` 명령어가 없어서 `gtimeout`(coreutils)으로 교체했다

- Claude CLI 상대경로가 안 먹혀서 풀패스(`/Users/jidong/.local/bin/claude`)로 고쳤다


## 배포 삽질

Vercel이 Next.js 프레임워크 preset을 못 잡았다.

`vercel.json`에 `framework: "nextjs"` 명시, 루트 디렉토리 설정, 환경변수 맞추기...

커밋이 5개 쌓였다.

전형적인 배포 삽질이지만 `fix(deploy):` 컨벤션으로 기록은 깔끔하게 남겼다.


## E2E 감사

Playwright로 8개 로케일 전체 스모크 테스트를 돌렸다.

Claude에게 "추측 없이, 모든 근거에 파일 경로 또는 실행 결과 명시"라는 조건으로 감사를 맡겼다.

<div class="callout-stats">
<div class="stat-grid">
<div class="stat-item">
<span class="stat-value">3</span>
<span class="stat-label">결제 수단 (Stripe+Toss+Paddle)</span>
</div>
<div class="stat-item">
<span class="stat-value">5회/일</span>
<span class="stat-label">레이트 리밋</span>
</div>
<div class="stat-item">
<span class="stat-value">8</span>
<span class="stat-label">E2E 로케일 커버리지</span>
</div>
<div class="stat-item">
<span class="stat-value">0</span>
<span class="stat-label">P0 결함</span>
</div>
</div>
</div>

---

<div class="commit-log">
<div><span class="hash">82e29d8</span> chore: add Paddle API, Husky hook, GitHub Actions, E2E</div>
<div><span class="hash">a6379ed</span> fix(deploy): set Next.js framework in vercel.json</div>
<div><span class="hash">7feb33f</span> fix(deps): add three and @types/three</div>
<div><span class="hash">2e10679</span> fix: use gtimeout for macOS</div>
<div><span class="hash">bb714ce</span> fix: use full path for claude CLI</div>
<div><span class="hash">e659c9b</span> fix(deploy): ignore husky failure in CI</div>
<div><span class="hash">3789e6d</span> fix(deploy): remove .env.local from git</div>
<div><span class="hash">5c7cece</span> chore: trigger rebuild with env vars</div>
</div>

결제 통합보다 자동화 파이프라인 쪽이 훨씬 재밌었다.

지금 이 글이 자동으로 생성됐다는 게 증거다.
