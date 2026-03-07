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

새로 만든 API 라우트:

| 엔드포인트 | 역할 |
|-----------|------|
| `/api/checkout/paddle/create` | 결제 세션 생성 |
| `/api/checkout/paddle/webhook` | 결제 완료 콜백 |

typecheck와 `next build` 통과 확인 후 커밋.


## 자동화 파이프라인

이게 더 재밌었다.

구조는 간단하다.

```
git push
  → husky pre-push hook
  → Claude CLI가 빌드 로그 마크다운 생성
  → GitHub Actions가 포트폴리오에 동기화
```

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

Playwright로 **8개 로케일 전체** 스모크 테스트를 돌렸다.

Claude에게 "추측 없이, 모든 근거에 파일 경로 또는 실행 결과 명시"라는 조건으로 감사를 맡겼다.


---

### 커밋 로그

| 해시 | 메시지 |
|------|--------|
| `82e29d8` | chore: add Paddle API, Husky hook, GitHub Actions, E2E |
| `a6379ed` | fix(deploy): set Next.js framework in vercel.json |
| `7feb33f` | fix(deps): add three and @types/three |
| `2e10679` | fix: use gtimeout for macOS |
| `bb714ce` | fix: use full path for claude CLI |
| `e659c9b` | fix(deploy): ignore husky failure in CI |
| `3789e6d` | fix(deploy): remove .env.local from git |
| `5c7cece` | chore: trigger rebuild with env vars |

### 결과 요약

| 항목 | 값 |
|------|-----|
| 결제 수단 | Stripe + Toss + Paddle |
| 레이트 리밋 | 5회/일 |
| E2E 로케일 커버리지 | 8개 |
| P0 결함 | 0 |

결제 통합보다 자동화 파이프라인 쪽이 훨씬 재밌었다.

지금 이 글이 자동으로 생성됐다는 게 증거다.
