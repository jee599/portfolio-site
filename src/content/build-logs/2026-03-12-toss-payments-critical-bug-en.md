---
title: "Building the Toss Payments Pipeline — and How Korean Checkout Was Silently Broken for 12 Hours"
project: FateSaju
date: 2026-03-12
lang: en
pair: claude-sonnet-4-6
tags: [toss-payments, webhook, email, i18n, production-bug, debugging]
---

The session started at 00:35 UTC. The goal was straightforward: wire up Toss Payments end-to-end. Checkout widget, server-side verification, webhook, receipt email — all in one shot.

Twelve hours later, Korean checkout was completely dead.

<hr class=section-break>

## The Toss Pipeline: Three Hours at Midnight

The entire payment pipeline from widget to confirmation email needed to be built from scratch. Each step designed to fail independently without corrupting order state.

The `/checkout/toss` page is a thin wrapper around `@tosspayments/tosspayments-sdk`. On completion, it redirects to a success page which fires a server-side verification request. The webhook handles Toss's async confirmation event with HMAC-SHA-256 signature verification — if this gets missed, orders stay `pending` forever.

```
POST /api/checkout/toss/confirm  (browser → server, synchronous)
POST /api/checkout/toss/webhook  (Toss → server, async, HMAC-verified)
```

The receipt email (`sendReceiptEmail.ts`) packs all 8 locales into one file. 310 lines, but the actual rendering logic is shared — only the string tables differ.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>2c58ca3</span> <span class=msg>feat: add Toss Payments integration and business info footer</span></div>
<div class=commit-row><span class=hash>eb3b125</span> <span class=msg>feat: add Toss webhook, payment receipt email (8-locale i18n)</span></div>
<div class=commit-row><span class=hash>5f7ef27</span> <span class=msg>feat: add coming-soon confirmation email, fix checkout test</span></div>
<div class=commit-row><span class=hash>6646720</span> <span class=msg>디자인 시스템 통일 및 이메일 업데이트</span></div>
</div>

<div class=callout-stats>
<div class=stat-grid>
<div class=stat-item><span class=stat-value>3</span><span class=stat-label>new email types</span></div>
<div class=stat-item><span class=stat-value>8</span><span class=stat-label>locales supported</span></div>
<div class=stat-item><span class=stat-value>523</span><span class=stat-label>lines added (webhook + receipt)</span></div>
</div>
</div>

<hr class=section-break>

## Design System Cleanup

01:27 UTC. More CSS than code.

`globals.css` had four fonts: Pretendard, Sora, Manrope, Italiana. They accumulated from different sessions, each engineer (or AI) dropping in whatever felt right at the time. Reduced to two: Pretendard for body, Outfit for display headings.

Button `border-radius` was scattered — 8px here, 12px there, 16px somewhere else. Unified to 14px. Card glassmorphism effects had no consistent shadow scale. Each component felt subtly different from the next, and that inconsistency erodes user trust without them knowing why.

<div class=change-summary>
<table>
<thead><tr><th>Item</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td class=label>Font count</td><td class=before>4 (Pretendard, Sora, Manrope, Italiana)</td><td class=after>2 (Pretendard, Outfit)</td></tr>
<tr><td class=label>Button radius</td><td class=before>8px / 12px / 16px mixed</td><td class=after>14px unified</td></tr>
<tr><td class=label>Contact email</td><td class=before>different across 8 locales</td><td class=after>dbswn428@gmail.com unified</td></tr>
</tbody>
</table>
</div>

<hr class=section-break>

## The Critical Bug: Korean Checkout Silent-Failed for 12 Hours

12:20 UTC. Any Korean user who tried to pay during those 12 hours got a 500 error.

The cause was a single line in `packages/shared/src/config/countries.ts`:

```ts
paymentProvider: "paddle",  // wrong. Korea must use toss.
```

During the midnight Toss integration work, the Korean market's `paymentProvider` had been silently flipped from `"toss"` to `"paddle"`. Paddle has no production API key. So every Korean checkout attempt hit `/api/checkout/paddle/create`, which threw `PADDLE_API_KEY is not set`, which returned a generic 500.

**The debugging path is worth noting.** The first assumption was a DB connection issue — because the error message was useless.

```ts
// before commit 9d5e4e9
message: 'Checkout creation failed.'

// after
const errMsg = err instanceof Error ? err.message : String(err);
message: `Checkout creation failed: ${errMsg}`
```

Exposing the actual error string immediately surfaced `PADDLE_API_KEY is not set`. From there: add a Paddle fallback to Toss when the key is missing, then trace back to find the root cause in `countries.ts`.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>9d5e4e9</span> <span class=msg>debug: expose checkout error message for diagnosing DB connection issue</span></div>
<div class=commit-row><span class=hash>099a202</span> <span class=msg>fix: fallback to Toss when Paddle API key not configured</span></div>
<div class=commit-row><span class=hash>8704207</span> <span class=msg>fix: restore Korean paymentProvider to toss (critical)</span></div>
</div>

Debugging time: 34 minutes. 3 commits. Root cause: 1 line.

<hr class=section-break>

## What This Session Showed

A file named `countries.ts` looks like configuration. It doesn't feel critical. But it's actually the branching point for the entire payment routing logic — one wrong string and every Korean user hits a wall. This file needs a test.

Generic error messages double debugging time. `Checkout creation failed.` tells you nothing about whether the problem is a DB connection, a missing API key, or a network timeout. Even if you don't expose details to users, server-side error messages need to be specific.

<ul class=feature-list>
<li><span class=feat-title>Toss checkout widget</span><span class=feat-desc>Korean-market `/checkout/toss` page with SDK widget integration</span></li>
<li><span class=feat-title>Toss webhook</span><span class=feat-desc>HMAC-SHA-256 signature verification, async order confirmation</span></li>
<li><span class=feat-title>Receipt email</span><span class=feat-desc>Auto-sent on payment completion, 8-locale i18n</span></li>
<li><span class=feat-title>Coming-soon email</span><span class=feat-desc>Feature launch notification with early-bird discount promise</span></li>
<li><span class=feat-title>Paddle fallback</span><span class=feat-desc>Auto-routes to Toss when Paddle API key is absent — safety net during global rollout</span></li>
</ul>
