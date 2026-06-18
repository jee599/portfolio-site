---
title: "Rebranding + Payment Debugging in 3 Claude Code Sessions: 371 Tool Calls"
project: "portfolio-site"
date: 2026-06-19
lang: en
pair: "2026-06-19-portfolio-site-ko"
tags: [claude-code, nextjs, payment, debugging, rebranding]
description: "coffeechat became preterview, KakaoPay merchant review blocked us, PayApp went live, then a 7-minute session killed a credit webhook bug."
---

Real payment went through. Credits didn't arrive. Seven minutes later, after pulling Vercel runtime logs through Claude Code's MCP connection, the cause was a single environment variable mismatch: `PAYAPP_LINKVAL` didn't match what PayApp's server actually sent.

That was the follow-up session. The day before: an 11-hour session that crammed rebranding, three payment modules, and three legal pages into one context window. 3 sessions total, 371 tool calls.

**TL;DR** Renamed the GitHub repo and Vercel project, fixed a stuck interview state machine, got blocked by KakaoPay's merchant review process, built PayApp in parallel, then patched a webhook env var bug the next morning in under 10 minutes.

## Why "coffeechat" Had to Go

The starting prompt was short: "Rename everything related to the repo and git to preterview."

The product is an AI interview prep service. The name `coffeechat` made no sense anymore — `preterview` (Pre + Interview) was the right fit. Code internals (`package.json`, README, brand copy) already used `preterview`. The problem was infrastructure.

`git remote` still pointed at `github.com/jee599/coffeechat`. Vercel project was still named `coffeechat`. One `gh repo rename` call handled GitHub — GitHub automatically sets up redirects from the old URL, so existing webhooks don't break. Vercel was harder.

The Vercel CLI has no `project rename` command. Claude Code hit that dead end, pivoted immediately, and called the Vercel REST API directly — `PATCH /v9/projects/{id}` with the auth token kept in a subshell variable so it never appeared in output. One API call, project renamed.

While that was wrapping up, a separate bug surfaced: "after getting the interview report, I can't start a new interview." Claude traced the client-side state machine in `app/[locale]/interview/page.tsx` — the interview state wasn't resetting after report delivery, just locking into a terminal state. Fixed with a targeted state reset on report receipt.

## The KakaoPay Wall

The main work for the session was payment integration. KakaoPay first: app registration, API key generation, sandbox testing. Then the actual blocker appeared — **merchant review**.

Having a business registration isn't enough. KakaoPay requires a terms of service page, privacy policy, and refund policy before approving a PG merchant account. These aren't optional — they're checked during review.

Claude Code ran a four-lens compliance audit, surfacing 12 gaps against Korean e-commerce disclosure requirements (전자상거래법 표시의무). The business registration number (`2026-성남분당A-0452`) and business registration ID went directly into `lib/business.ts`. Three new legal pages got built: `/terms`, `/privacy`, `/refund`.

That covered the KakaoPay requirements, but review takes time. "Is there a cheaper payment option?" came up mid-session.

## PayApp in Parallel

Claude Code scanned Korean PG providers for options with lower fees and faster onboarding. **PayApp** came out on top: 3.3% fee, instant approval for registered businesses, no waiting for merchant review.

The KakaoPay work stayed in place. PayApp got added alongside it in the same session:

- `lib/payments/kakao.ts` — KakaoPay client
- `lib/payments/payapp.ts` — PayApp client
- `/api/pay/kakao/ready` and `/api/pay/kakao/approve` — KakaoPay flow
- `/api/pay/payapp/ready` and `/api/pay/payapp/feedback` — PayApp webhook handler
- Two payment UI components

Both modules live in the same codebase. When KakaoPay review clears, the switch is a config change — no code rewrite needed.

## 7 Minutes to Root Cause

Next day. Short session. "Real payment went through but credits weren't added."

`.env.local` only had `APP_ORIGIN`. Production secrets live in Vercel — no direct DB access from local. Claude Code pulled runtime logs via Vercel MCP. Two payment attempts showed up in the logs:

- **17:49** — `feedback verification failed (forgeable)` → rejected at `linkkey`/`userid` validation
- **19:19** — `feedback linkval mismatch` → passed first validation, but `PAYAPP_LINKVAL` didn't match the `linkval` PayApp actually sent in the webhook body

The `confirmPayappFeedback` handler compares incoming `linkval` against the env var. The registered value was wrong. Root cause identified in under 10 tool calls: 2 `Bash` calls for log retrieval, 5 `Read` calls to trace the handler code, 3 more to confirm the env var path.

A diagnostic script at `scripts/diag-payapp.mjs` documents the verification flow for future debugging.

## Tool Call Breakdown Across 3 Sessions

| Tool | Count | What it did |
|------|-------|-------------|
| `Bash` | 152 | Repo ops, Vercel API calls, log parsing |
| `Edit` | 82 | State machine fix, payment routes, legal pages |
| `Read` | 65 | Code exploration, env var tracing |
| `Write` | 20 | 17 new files created |
| **Total** | **371** | |

Session 1 hit `AskUserQuestion` five times — business registration number format, address display style, email field consolidation. Decisions that couldn't be inferred from the codebase, so Claude asked.

## What This Shows

Rebranding finished at the infrastructure layer without touching application code. Payment integration ran two PG providers in parallel while waiting on KakaoPay's review process — hedging against approval delays. The webhook bug was an env var mismatch that only showed up after a live payment, in production logs that required MCP tooling to access.

The 11-hour session worked through compression — holding the full scope of rename, payments, and legal compliance in a single context. The 7-minute session was sharper by constraint: one reported symptom, one log source, one variable out of place.

Shorter sessions often run cleaner. Not because they're easier, but because the scope is already locked before they start.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
