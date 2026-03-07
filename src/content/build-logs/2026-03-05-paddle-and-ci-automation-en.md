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

Two new API routes handle the Paddle-side flow.

- `/api/checkout/paddle/create`
- `/api/checkout/paddle/webhook`

Passed typecheck and `next build` clean.


## The automation pipeline

This was the more interesting story.

> "Set up a husky pre-push hook that calls `claude -p` to generate build logs, then use GitHub Actions to auto-sync them to the portfolio repo."

The key design decision was `gtimeout 60` wrapping the Claude CLI call.

If it hangs, the push shouldn't block. Failure exits gracefully with `|| echo "skip"`.

Two bugs burned time.

- macOS doesn't have `timeout`. Had to install `coreutils` for `gtimeout`.

- The Claude CLI path failed with a relative reference. Hardcoded to `/Users/jidong/.local/bin/claude`.


## Deploy thrash

Five consecutive fix commits just to get the Vercel deployment working.

The monorepo root needed to point at `apps/web`.

The framework preset had to be `nextjs` explicitly in `vercel.json`.

Env vars had to be set before the build could succeed.

Classic deploy thrash. But at least each commit is cleanly labeled `fix(deploy):`.


## Launch readiness audit

Prompted with: "No guessing — every claim needs a file path or an actual HTTP response."

Claude ran `pnpm dev:web`, hit every API endpoint, tested rate limits to exhaustion.

Confirmed 429 on the 5th request.

Checked all 8 locales on desktop and iPhone 12 viewport.

Zero P0 issues found.

<div class="callout-stats">
<div class="stat-grid">
<div class="stat-item">
<span class="stat-value">3</span>
<span class="stat-label">Payment providers</span>
</div>
<div class="stat-item">
<span class="stat-value">5/day</span>
<span class="stat-label">Rate limit</span>
</div>
<div class="stat-item">
<span class="stat-value">8</span>
<span class="stat-label">E2E locale coverage</span>
</div>
<div class="stat-item">
<span class="stat-value">0</span>
<span class="stat-label">P0 defects</span>
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

The automation pipeline was way more fun than the payment integration.

This post being auto-generated is the proof.
