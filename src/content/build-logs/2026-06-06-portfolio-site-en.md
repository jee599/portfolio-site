---
title: "48 Claude Code Sessions in One Day: ultraplan's 785K Tokens, a Design Gate Race Condition, and a PayPal Bug Codex Caught"
project: "portfolio-site"
date: 2026-06-06
lang: en
pair: "2026-06-06-portfolio-site-ko"
tags: [claude-code, paypal, workflow, ultraplan, saju-global, design-gate]
description: "48 sessions, 695 tool calls, one day. How ultraplan spawned 10 parallel agents, why Codex caught a PayPal 25-char limit, and a design gate race condition explained."
---

48 Claude Code sessions. 695 tool calls. One day.

That's what 2026-06-05 looked like: 4 projects, 8 HTML reports, 10 PayPal API modules, 38 modified files in a Next.js monorepo — and one design gate bug that only surfaces when you're running sessions in parallel.

**TL;DR** The Codex-as-read-only-reviewer workflow works in practice. ultraplan ran 10 parallel agents, consumed 785K tokens, and turned a full audit request into a 4-hour session with 195 tool calls. Codex caught a PayPal invoice number overflow that Claude's dry-run tests missed.

## The PayPal Bug Codex Found Before It Reached Production

PayPal Invoicing v2 enforces a 25-character limit on the `invoice_number` field. Session 4 implemented the PayPal integration and tested against the dry-run path. The dry-run invoice number was `JDLAB-MADEINN-VT-20260605` — exactly 25 characters.

That passed. The live path didn't.

Live invoices append a `HHMMSS` timestamp suffix: `JDLAB-MADEINN-VT-20260605-114827`. That's 32 characters. Silent failure at the API boundary.

Session 5 started with Codex flagging this in a read-only review pass and forwarding a fix brief to Claude. The fix was straightforward — compress the prefix, encode the timestamp as base36 epoch milliseconds to fit in 7 characters:

```js
// Before: JDLAB-MADEINN-VT-20260605-114827  (32 chars)
// After:  JL-VT-20260605-3K7Z2A             (22 chars)
```

Tests were updated alongside — a batch assertion verifying every generated number stays under 25 characters. 6 Edit calls, 5 Read, 5 Bash. Session wall time: 4 minutes.

This is the Codex-Claude split working as intended. Claude focuses on implementation; Codex runs read-only and looks for edge cases. The same agent doing both tends to develop tunnel vision toward the happy path it already built.

## What Happens When Two Sessions Race for the Same Design Gate

`hooks/design-gate.sh` blocks writes to `.html/.htm` files. The gate releases only after `hooks/design-pass.sh` confirms an Open Design-equivalent pass has occurred. The ack is recorded in `design-gate.ok` with the current session ID.

Session 6 was writing a funnel report HTML. The gate blocked — even though this session had already acknowledged. Checking the log revealed the issue: a concurrent `jidonglab-site` session (`a45e846e`) had written its own session ID into `design-gate.ok`, overwriting this session's ack.

The workaround was a re-ack and retry. But the root cause is structural: the design gate uses a single shared file for state. Two concurrent sessions create a race condition. The more parallel sessions you run, the higher the collision probability.

The eventual fix direction is to store gate state per session in a tempfile keyed by session ID rather than checking a single shared value. Not implemented yet — filed and noted.

## ultraplan: 10 Agents, 785K Tokens, 4 Hours

Session 14 opened with `/ultraplan`. The brief: full audit of `saju_global` — a Next.js monorepo targeting global sales — covering payments, i18n, legal compliance, and channel economics.

The repo had no local git remote configured, so the remote session path failed. The workflow ran locally instead.

Workflow structure:

**Phase 1 (parallel)** — 4 agents directly exploring the codebase:
- Payment logic and webhook handling
- Fortune engine and saju calculation accuracy
- i18n coverage and legal requirements by region
- Funnel UX and conversion gaps

**Phase 2 (parallel)** — 5 agents sourced research:
- Global market entry economics
- Japan-specific channel breakdown
- Southeast Asia and India/Greater China
- Western market positioning

**Phase 3** — synthesis into a 30-day revenue maximization plan

Result: 10 agents, ~785K tokens, 161K characters of output. Session wall time: 3 hours 49 minutes, 195 tool calls.

Concrete issues surfaced:

- PayPal webhook signature verification missing — any POST to the webhook endpoint would be accepted
- Korean payment processor (Toss) still present in code after global pivot decision; needs removal
- No GDPR/DPDPA cookie consent component
- Japan `特定商取引法` disclosure page incomplete

38 files modified, 19 new files created in this session alone. Bash 79 calls, Read 49, Edit 46, Write 18.

Without the `ultraplan` opt-in keyword, this fan-out wouldn't have started. The keyword is an explicit authorization to run a workflow at this scale. The cost is real — but faster than reading 38 files sequentially and synthesizing across them manually.

## Why the PayPal Product Image Took 4 Sessions

Sessions 10–13 were all building product images for the PayPal payment link. Four iterations, same pipeline, evolving brief.

- **Session 10**: Initial image. Placeholder domain (`yourstore.com`), blue accent.
- **Session 11**: jidonglab.com brand applied. Green accent, Pretendard font, real site copy.
- **Session 12**: English deliverable details added. What the buyer receives, listed inside the image.
- **Session 13**: "Dense report" aesthetic. Sections, table of contents, data tables packed in.

Each session used the same Python generator (`build.py`) — SVG generation, Chrome headless rasterization to PNG. What changed was content and layout density.

Four iterations because the brief arrived in stages: "use the jidonglab brand" → "add English deliverable description" → "make it look like a thick report." If all three requirements had been in the initial brief, one session would have been enough.

The constraint that was always there but stated late: PayPal product images render as thumbnails. At 96px, price and title need to be legible. That's a layout constraint that should anchor the brief from the first session — not surface in session 13.

## Cross-Session Context Relay at 48-Session Scale

Most of the 48 sessions started by referencing output from a previous session. The orchestration pattern: Hermes handles cross-session relay, Claude Code handles implementation inside each session.

The upside is that each session has a narrow, well-defined target. The downside is that every inter-session handoff requires a brief that accurately summarizes the prior state. When the brief undersells prior context, Claude makes decisions that contradict earlier work.

Sessions 7–9 show the cost of this. Session 7 corrected a price to `$149`. Session 9 finalized the structure at `$79/$299`. Pricing wasn't decided in one place — it was refined across sessions, each correcting the previous.

After session 9, the full price alignment across `src/paypal/leads.js`, `config/paypal-hot-leads.example.json`, `test/paypal.test.js`, `docs/paypal-integration.md`, and `docs/jdlab-paid-offers.md` was done in a single session: 12 Edit calls, 9 Bash.

The takeaway: multi-session workflows produce drift on decisions that span sessions. The fix is front-loading the decision in a single session, then propagating the canonical answer — not iterating across sessions until it converges.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
