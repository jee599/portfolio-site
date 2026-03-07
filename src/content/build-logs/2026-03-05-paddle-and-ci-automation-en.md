---
title: "Paddle payment integration + Claude-powered auto build log pipeline"
project: "saju_global"
date: 2026-03-05
lang: en
pair: "2026-03-05-paddle-and-ci-automation-ko"
tags: [paddle, payment, ci-cd, claude-code, automation]
---

Added Paddle as a first-class payment provider alongside the existing Stripe/Toss setup.

A single runtime env var controls which provider activates.

Then wired up a pipeline where every `git push` triggers Claude CLI to generate a build log.

Which is exactly what you're reading right now.


## Paddle integration

The hard constraint: don't touch the existing Stripe/Toss code.

The solution was an `effectiveProvider` runtime flag in `paywall/page.tsx`.

Set `NEXT_PUBLIC_PAYMENT_PROVIDER=paddle` and all non-KR traffic routes to Paddle. Unset it and you get the country-default behavior.

New API routes:

| Endpoint | Role |
|----------|------|
| `/api/checkout/paddle/create` | Create checkout session |
| `/api/checkout/paddle/webhook` | Handle payment callback |

Passed typecheck and `next build` clean.


## The automation pipeline

This was the more interesting story.

```
git push
  → husky pre-push hook
  → Claude CLI generates build log markdown
  → GitHub Actions syncs to portfolio repo
```

The key design decision was `gtimeout 60` wrapping the Claude CLI call.

If it hangs, the push shouldn't block. Failure exits gracefully with `|| echo "skip"`.

Two bugs burned time:

- macOS doesn't have `timeout`. Had to install `coreutils` for `gtimeout`.

- The Claude CLI path failed with a relative reference. Hardcoded to `/Users/jidong/.local/bin/claude`.


## Deploy thrash

Five consecutive fix commits just to get the Vercel deployment working.

The monorepo root needed to point at `apps/web`.

The framework preset had to be `nextjs` explicitly in `vercel.json`.

Env vars had to be set before the build could succeed.

Classic deploy thrash. But at least each commit is cleanly labeled `fix(deploy):`.


## Launch readiness audit

Prompted with: *"No guessing — every claim needs a file path or an actual HTTP response."*

Claude ran `pnpm dev:web`, hit every API endpoint, tested rate limits to exhaustion.

Confirmed 429 on the 5th request.

Checked all 8 locales on desktop and iPhone 12 viewport.

Zero P0 issues found.


---

### Commit log

| Hash | Message |
|------|---------|
| `82e29d8` | chore: add Paddle API, Husky hook, GitHub Actions, E2E |
| `a6379ed` | fix(deploy): set Next.js framework in vercel.json |
| `7feb33f` | fix(deps): add three and @types/three |
| `2e10679` | fix: use gtimeout for macOS |
| `bb714ce` | fix: use full path for claude CLI |
| `e659c9b` | fix(deploy): ignore husky failure in CI |
| `3789e6d` | fix(deploy): remove .env.local from git |
| `5c7cece` | chore: trigger rebuild with env vars |

### Result summary

| Item | Value |
|------|-------|
| Payment providers | Stripe + Toss + Paddle |
| Rate limit | 5/day |
| E2E locale coverage | 8 |
| P0 defects | 0 |

The automation pipeline was way more fun than the payment integration.

This post being auto-generated is the proof.
