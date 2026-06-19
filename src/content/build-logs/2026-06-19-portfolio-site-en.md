---
title: "Real Payment, Zero Credits: Tracing a PayApp Webhook Bug Through Vercel Runtime Logs"
project: "portfolio-site"
date: 2026-06-19
lang: en
pair: "2026-06-19-portfolio-site-ko"
tags: [claude-code, payment, debugging, nextjs, multi-agent]
description: "461 tool calls, 4 sessions: repo rebrand, three payment pivots, and a production webhook bug traced to one wrong environment variable."
---

The payment notification fired. The charge cleared the user's account. The webhook hit production. No exception was thrown anywhere. And the credit balance didn't move.

That's how Session 4 started — with a silent failure in a production payment flow. No stack trace, no 4xx, no alert. Just a user who paid and got nothing. Tracking it down required pulling Vercel runtime logs through MCP in-session, which surfaced two webhook attempts with two different failure signatures. The root cause was a single environment variable whose value didn't match what PayApp actually sends.

But to understand how we got to a PayApp integration in the first place, you need to start at Session 1, which began with a repo rename and ended with three payment modules built in one sitting.

**TL;DR:** 4 sessions, 461 tool calls, 29 hours 47 minutes. Rebranded a repo from `coffeechat` to `preterview` across GitHub, local git, and Vercel. Pivoted from KakaoPay to PayApp after hitting a merchant review wall. Traced a production webhook bug to a `PAYAPP_LINKVAL` mismatch using Vercel MCP runtime logs. Added date-axis graphs to a dental clinic dashboard. Built a reports page and interview flow fix the app was missing.

## One Prompt, Three Infrastructure Layers

Session 1's opening prompt: *"Rename everything coffeechat-related to preterview — repo and git."*

The application code was already updated. `package.json` name field, brand text in components, meta tags — all said `preterview`. What remained was the infrastructure layer: GitHub, local git, and Vercel.

Three steps in sequence:

```bash
gh repo rename preterview
git remote set-url origin git@github.com:jee599/preterview.git
```

Then the Vercel side. The Vercel CLI doesn't have a `project rename` command — it's just not there. So we hit the REST API directly:

```bash
curl -X PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "preterview"}'
```

The auth token stayed in a subshell variable. It never touched terminal output or a log file.

Mid-rebranding, a different bug surfaced: *"After finishing one interview and getting the report, I can't start the next one."* A dynamic workflow traced through `app/[locale]/interview/page.tsx`. The client-side state machine wasn't resetting after report delivery — it stayed locked in a terminal completed state and refused to reinitialize. Fixed with a state reset on report receipt, but it flagged a broader pattern: state persistence bugs that only appear after a full flow completion. That pattern would surface again with payments.

## The KakaoPay Merchant Review Wall

Payments were the main work of Session 1. KakaoPay app registration was done. API keys were issued. Then the production blocker appeared: **merchant review**.

This is a common pain point in the Korean PG ecosystem. KakaoPay, TossPayments, and most Korean payment providers require a merchant audit before issuing production credentials. The audit checks that your site has legally required pages: terms of service, privacy policy, and refund policy. Without them, you don't get a live key, regardless of technical integration quality.

A four-lens dynamic workflow audited the compliance requirements simultaneously:

- **전자상거래법 표시의무** — E-Commerce Act display obligations (business registration number, address, contact)
- **청약철회 / 환불** — withdrawal rights and refund policy compliance under Korean consumer protection law
- **PG 가맹 심사 사이트 요건** — PG provider-specific site requirements
- **통신판매업 등록** — mail-order sales registration requirements

12 mandatory checklist items. Multiple gaps across the first three categories. The remediation:

```typescript
// lib/business.ts
export const BUSINESS_INFO = {
  registrationNumber: "719-08-03709",
  mailOrderNumber: "2026-성남분당A-0452",
  // ...
};
```

Three new legal pages created: `/terms`, `/privacy`, `/refund`. Merchant application filed. Timeline: unknown — days to weeks. The immediate question became whether there was a payment option that worked *today*.

## Three Payment Modules in One Session

*"Is there anything cheaper and faster?"*

A parallel research workflow evaluated six Korean payment options against the same criteria — merchant review required, integration complexity, fee, time to live:

| Provider | Merchant Review | Fee (small biz) | Time to Live |
|---|---|---|---|
| KakaoPay direct | Required | ~1.5% | 1–2 weeks |
| TossPayments widget | Required | ~1.4% | 3–7 days |
| NaverPay | Required | ~1.5% | 1–2 weeks |
| NICE / Inicis | Required | ~1.6% | 1–2 weeks |
| Payple | Required | ~1.8% | 2–5 days |
| **PayApp** | **None** | **1.9%** | **Same day** |

PayApp won on one criterion: no merchant review. It's a link-based payment service — generate a payment link, user pays, PayApp sends a feedback webhook. The 1.9% fee at small business tier is slightly higher than major PG providers, but the tradeoff is that it works immediately without waiting on a review queue.

By end of Session 1, the payment layer looked like this:

```
lib/payments/
  kakao.ts          # built, waiting for merchant approval
  payapp.ts         # active
app/api/pay/
  kakao/ready/      # KakaoPay init
  kakao/approve/    # KakaoPay callback
  payapp/ready/     # PayApp init
  payapp/feedback/  # PayApp webhook handler — the one that would cause problems later
components/
  KakaoBuy.tsx
  PayAppBuy.tsx
```

Both modules live in the same codebase. When KakaoPay review clears, switching is a config change — no code rewrite.

Session 1 stats: 212 tool calls, 11 hours 27 minutes — 46% of the entire 4-session run.

## Dental Dashboard Detour

Session 2 shifted to `dongbaek-uddental`, a separate dental clinic marketing project. The request: *"Show key metrics with date-axis graphs in the dashboard."*

The first thing that needed fixing was a filter bug in `_tracker/build.py`. The `next_actions` filter was doing exact string comparison:

```python
# Before — silently missed anything like "계획 중" or "진행 예정"
if item["status"] == "계획" or item["status"] == "진행":
    next_actions.append(item)

# After — substring match catches all status variants
if "계획" in item["status"] or "진행" in item["status"]:
    next_actions.append(item)
```

Tasks with descriptive status strings had been invisible in the dashboard for who knows how long. After the filter fix, date-axis graphs were added to `_tracker/index.html`. The artifact list view was also restructured: same artifact type shows the latest version first, with older revisions collapsed underneath — reduces noise when the same deliverable has gone through multiple iterations.

The blog generation side also got updated. Korean medical law (의료법) restricts direct promotional claims for healthcare, but informational framing is allowed. The skill was updated to place one image per FAQ section, add visual emphasis to key content blocks, and track compliance metadata in `04-블로그-제작리포트.html` — word count, image count, SEO/AEO techniques applied, and how each section handled the medical law constraint.

## Production Payment Cleared. Credits Didn't Update. No Error.

Session 4 opened with: *"Made a real payment but credits didn't come in."*

The debug environment was constrained from the start. `.env.local` only contained `APP_ORIGIN` — production secrets live exclusively in Vercel. No local DB access, no way to query what the webhook handler received. The only path to root cause was through production runtime logs.

Vercel MCP pulled the logs for `/api/pay/payapp/feedback`. Two payment attempts appeared:

**Attempt 1 (17:49):**
```
feedback verification failed (possibly forged) — linkkey validation rejected
```
The webhook handler validates `linkkey` first — a PayApp-provided field that proves the callback came from PayApp and not an external actor. This attempt failed at that step. No credit logic ran.

**Attempt 2 (19:19):**
```
feedback linkval mismatch — expected: [stored value], received: [actual value]
```
This attempt cleared `linkkey` validation. It reached the secondary check: comparing the `PAYAPP_LINKVAL` environment variable (stored in Vercel) against the `linkval` field in PayApp's feedback callback. They didn't match.

The validation chain is: `linkkey` (anti-forgery) → `linkval` (merchant identifier) → credit update. The second attempt passed the forgery check but failed the merchant identifier check because the environment variable value and the actual value PayApp sends had diverged at some point during initial setup.

Not a code bug. A configuration bug.

Fix: update `PAYAPP_LINKVAL` in Vercel to match the value PayApp actually sends, redeploy. The credit update ran correctly on the next test payment.

Left this for next time:

```javascript
// scripts/diag-payapp.mjs
// Run after a failed webhook to see which fields mismatched
// instead of requiring another production log excavation
```

Without Vercel MCP, this debug path looks like: add logging → deploy → make another real payment → wait → check logs → repeat. With in-session log access, the two-attempt pattern was visible immediately. The 90-minute gap between attempts (17:49 → 19:19) shows the user tried twice with real money. The second attempt's error message pointed directly at the environment variable without requiring a third payment to reproduce.

## The Missing Reports Page

After resolving the credit bug, a follow-up appeared: *"Where do I check past interview reports?"*

The page didn't exist. `app/[locale]/reports/page.tsx` was created to list completed sessions with associated reports. The account page usage history section was converted from an always-expanded list to a `Collapsible.tsx` component — collapsed by default, which made the page less overwhelming for accounts with multiple sessions on record.

## 4 Sessions: By the Numbers

| Metric | Value |
|---|---|
| Total sessions | 4 |
| Total tool calls | 461 |
| Total time | 29h 47m |
| Session 1 (heaviest) | 212 calls, 11h 27m (46% of total) |
| Dynamic workflows run | 3 |

**Tool breakdown:**

| Tool | Count |
|---|---|
| Bash | 186 |
| Edit | 95 |
| Read | 77 |
| Write | 22 |

**Three dynamic workflows:**

1. **Interview state machine trace** — parallel lens analysis of client state flow in `interview/page.tsx`, identified the terminal-state lock bug
2. **KakaoPay security audit** — reviewed key handling, webhook signature verification, replay attack surface
3. **PG merchant requirements audit** — 12-item legal checklist across 4 compliance categories, structured JSON output per category

## What All Four Sessions Had in Common

Production systems don't always give you errors. Sometimes they give you silence.

The interview state machine didn't throw — it just stopped accepting new input. The webhook didn't return a 500 — it just didn't credit anything. The merchant review didn't block the integration — it just introduced a timeline that didn't fit the deadline.

In each case, the resolution required context that lived outside the codebase: Vercel runtime logs, Korean PG compliance requirements, parallel evaluation of payment providers. Multi-agent tool use — dynamic workflows for parallel research, Vercel MCP for log access — made that context accessible within the same session rather than requiring a context switch to a browser and back.

461 tool calls. One wrong environment variable. The work was finding it.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
