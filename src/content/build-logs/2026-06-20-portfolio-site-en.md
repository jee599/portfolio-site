---
title: "Zero Credits After Payment — Catching a PayApp linkval Mismatch in Vercel Runtime Logs"
project: "portfolio-site"
date: 2026-06-20
lang: en
pair: "2026-06-20-portfolio-site-ko"
tags: [claude-code, preterview, payment, payapp, debugging, vercel]
description: "Real payment succeeded but credits showed 0. One Vercel runtime log line exposed a PayApp linkval validation bug — 9h 49m, 60 Bash calls, 22 edits."
---

The notification read: *"0 credits have been added to your account."* The payment went through. The receipt was real. The account balance didn't move.

**TL;DR** The PayApp webhook `linkval` validation logic assumed a static environment variable when PayApp actually generates a per-request signature. Production secrets weren't available locally, so the fix came from reading Vercel runtime logs via MCP — one error line pointed straight to the mismatch.

## The Payment Succeeded. The Credits Didn't.

[preterview.com](https://preterview.com) is an AI interview simulator. You buy credits, run interview sessions. The payment layer is PayApp — a Korean PG that works without merchant certification, which made it attractive while KakaoPay merchant review was pending.

After connecting PayApp the day before, the first real transaction exposed the bug immediately. Test account, real purchase, instant result:

```
0 credits have been added!
```

That string isn't a typo in the bug report — it was the actual notification. The UI confirmed a successful payment, then credited zero. Handed the situation to Claude with the simplest description:

```
just did a payment test — credits aren't coming through after a real payment
```

## No Production Secrets Locally

First thing Claude checked was `.env.local`. Contents:

```
APP_ORIGIN=https://preterview.com
```

No Turso connection string. No PayApp secrets. Production credentials live exclusively in Vercel environment variables. The real transaction data lives in the production Turso database. There was no path to direct diagnosis from a local shell.

Claude pivoted to the Vercel MCP and started pulling runtime logs — `mcp__claude_ai_Vercel__get_runtime_logs` ran five times across the relevant deployment.

## Two Patterns in the Logs

Filtering for payment-related errors surfaced two distinct failure signatures.

**17:49** — `feedback validation failed (potential forgery)` — the `linkkey`/`userid` first-pass check rejected the request. At that timestamp, the `/ready` endpoint was returning 401. This was an earlier failed attempt.

**19:19 (most recent real payment)** — `feedback linkval mismatch` — first-pass validation succeeded, but `PAYAPP_LINKVAL` (the environment variable value) didn't match the `linkval` field PayApp actually sent in the feedback request.

Two failures, two different root causes, separated by about 90 minutes of iteration.

## What linkval Actually Is

The `linkval` field is a per-request signature PayApp generates and includes in every feedback (webhook) call. It's not a static secret you configure once. The code was comparing it against a value stored in `.env` as if it were a fixed token — which is how many PG integrations work, but not how PayApp works.

The official PayApp documentation doesn't make this distinction explicit. Development-mode testing doesn't trigger real feedback requests, so there's no way to observe the actual field value until a real payment happens.

The fix was straightforward once the pattern was clear: replace the static comparison in `app/api/pay/payapp/feedback/route.ts` with the correct validation logic that accounts for PayApp's actual per-request behavior.

## Other Bugs That Surfaced in the Same Session

With the payment issue resolved, a UI gap became obvious.

Preterview generates an interview report when a session ends. There was no page to view past reports. Sessions would complete and the data would exist in the database, but users had no way to access it.

```
where do I check the interview report for a session that's already finished? there's nowhere to go
```

Built `/reports` as a new page (`app/[locale]/reports/page.tsx`). While touching the account page, the credit usage history was showing fully expanded by default, which cluttered the view — extracted a `Collapsible.tsx` component and set it to collapsed by default.

Performance came up next. Initial page load felt slow. On inspection, the first render was blocked by serial database queries. Restructured the queries to run in parallel and added edge cache configuration to `vercel.json`. The difference was immediately noticeable — not a "benchmark says it's faster" situation, a "this obviously feels faster" one.

Session total: 9 hours 49 minutes — 60 Bash calls, 24 Read calls, 22 Edit calls.

## The Day Before: Why PayApp?

PayApp wasn't the original choice. The session the previous day started with KakaoPay.

KakaoPay REST API `ready`/`approve` endpoints were implemented, `KakaoBuy.tsx` component was built. Then the merchant certification requirement surfaced. Business registration existed, but the review timeline didn't fit.

Evaluated alternatives on fee structure:

| Service | SMB rate | Merchant review | Notes |
|---|---|---|---|
| PayApp | 1.9% | None | Instant link-based payments |
| Toss Payments | 0.5–1.5% | Required | Cheapest but gated |
| KakaoPay | 1.5% | Required | Already in review |

PayApp was the only option that could go live that day. The fee premium was real, but waiting weeks for merchant approval wasn't viable.

`PayAppBuy.tsx` and `lib/payments/payapp.ts` were built in that session. `linkval` validation logic was written based on the documentation and reasonable assumptions about how PG integrations typically work.

The webhook behavior that broke the assumption only revealed itself when a real payment triggered a real feedback request.

## Payment Modules Only Validate on Real Transactions

This is the part that doesn't have a clean solution. External PG integrations have a category of behavior that's invisible in development mode — fields that only appear in live feedback requests, signature schemes that only activate on real transactions, timing behavior that staging environments don't replicate.

PayApp's `linkval` falls squarely in that category. No amount of local testing would have caught the mismatch before the first real payment.

The practical approach that worked: ship to production quickly, make a real purchase with a test account, read the runtime logs. Vercel's runtime logs were the difference between a fast fix and a multi-day debugging session. Without the `feedback linkval mismatch` error line, reproducing the exact failure condition locally would have required either getting production secrets or reverse-engineering the expected `linkval` format.

A diagnostic script (`scripts/diag-payapp.mjs`) came out of this session. Next time there's a payment issue, local simulation of PayApp feedback fields is possible without needing a real transaction.

The broader pattern: payment integrations need a fast path to production and a way to observe runtime behavior. Vercel runtime logs via MCP turned a production black box into a debuggable system.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
