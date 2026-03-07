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

<ul class="feature-list">
<li>
<span class="feat-title">/api/checkout/paddle/create</span>
<span class="feat-desc">Creates a Paddle checkout session.</span>
</li>
<li>
<span class="feat-title">/api/checkout/paddle/webhook</span>
<span class="feat-desc">Handles payment completion callbacks.</span>
</li>
</ul>

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


<hr class="section-break">

<div class="commit-log">
<div class="commit-row"><span class="hash">82e29d8</span> <span class="msg">chore: add Paddle API, Husky hook, GitHub Actions, E2E</span></div>
<div class="commit-row"><span class="hash">a6379ed</span> <span class="msg">fix(deploy): set Next.js framework in vercel.json</span></div>
<div class="commit-row"><span class="hash">7feb33f</span> <span class="msg">fix(deps): add three and @types/three</span></div>
<div class="commit-row"><span class="hash">2e10679</span> <span class="msg">fix: use gtimeout for macOS</span></div>
<div class="commit-row"><span class="hash">bb714ce</span> <span class="msg">fix: use full path for claude CLI</span></div>
<div class="commit-row"><span class="hash">e659c9b</span> <span class="msg">fix(deploy): ignore husky failure in CI</span></div>
<div class="commit-row"><span class="hash">3789e6d</span> <span class="msg">fix(deploy): remove .env.local from git</span></div>
<div class="commit-row"><span class="hash">5c7cece</span> <span class="msg">chore: trigger rebuild with env vars</span></div>
</div>

<div class="callout-stats">
<div class="stat-grid">
<div class="stat-item"><span class="stat-value">3</span><span class="stat-label">Payment providers</span></div>
<div class="stat-item"><span class="stat-value">5/day</span><span class="stat-label">Rate limit</span></div>
<div class="stat-item"><span class="stat-value">8</span><span class="stat-label">E2E locales</span></div>
<div class="stat-item"><span class="stat-value">0</span><span class="stat-label">P0 defects</span></div>
</div>
</div>

The automation pipeline was way more fun than the payment integration.

This post being auto-generated is the proof.
