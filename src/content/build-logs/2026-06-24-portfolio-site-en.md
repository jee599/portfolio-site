---
title: "PayPal to Paddle in 271 Tool Calls — 8 Sessions, 933 Total, One Week of Claude Code"
project: "portfolio-site"
date: 2026-06-24
lang: en
pair: "2026-06-24-portfolio-site-ko"
tags: [claude-code, preterview, paddle, cold-email, multi-agent, workflow]
description: "One inverted boolean in geo.ts, 23h 40m to find it. What 933 Claude Code tool calls across 8 sessions produces: Paddle migration, competitor teardown, 185 cold emails."
---

The week started with a screenshot and a message: "Isn't this supposed to show Paddle, not PayPal?"

That single screenshot launched Session 2 — 23 hours, 40 minutes, 271 tool calls to track down a payment gateway swap that wasn't fully working. By the end of the week, 8 sessions and 933 total tool calls had shipped: a Paddle integration, a 4-agent competitor teardown with one refuted claim, 42 government grant programs live-verified (then re-verified two days later), a moving checklist web app, and a cold email pipeline covering 185 universities with per-institution personalization.

**TL;DR**
- Session 2 (23h 40m, 271 tool calls): PayPal → Paddle migration; the bug was an inverted boolean in `lib/geo.ts`
- Session 4 (22h 37m, 168 tool calls): 4 parallel agents on Codeit Ascent + a client logging system from scratch
- Sessions 5 & 7: 42 government grants validated, then re-validated two days later because grant status moves fast
- Session 8 (27h 53m, 290 tool calls): 185 university cold email automation, each one personalized
- Pattern across all 8: delegate research to dynamic workflows, implement directly

## The Screenshot That Took 23 Hours to Resolve

preterview already had geo-routed payments wired up: Korean users go to PayApp (KRW), international users go to PayPal (USD). The goal was replacing PayPal with Paddle. The operational reason is specific — Paddle is a Merchant of Record, meaning Paddle handles VAT, GST, and tax compliance in every country it supports. For a solo founder selling internationally, that eliminates an entire compliance surface area.

Before writing a single file, Claude read through Paddle Billing's official documentation with a concrete concern: "Paddle Billing API changes frequently, and getting webhook signature verification wrong is catastrophic — a bad implementation lets anyone fake a purchase confirmation." Three things were locked down first:

1. Webhook signature verification method (HMAC-SHA256 against Paddle's public key)
2. `Paddle.js` v2 initialization pattern — differs from v1 in how the checkout overlay is constructed
3. Idempotent credit grant pattern — prevent double-crediting when Paddle retries webhook delivery on transient failures

After that confirmation pass, implementation started:

```
lib/payments/paddle.ts                       — configure/create/capture/verifyWebhook
app/api/pay/paddle/create/route.ts           — checkout session creation
app/api/pay/paddle/webhook/route.ts          — event handler with signature verification
app/api/pay/paddle/confirm/route.ts          — post-payment credit allocation
components/pricing/PaddleBuy.tsx             — frontend checkout component
app/[locale]/pricing/success/page.tsx        — post-payment confirmation page
docs/paddle-setup.md                         — implementation reference
```

Everything appeared complete. The `PaddleBuy` component was mounted. Then the screenshot arrived: PayPal buttons still rendering.

Root cause: the conditional in `lib/geo.ts` was inverted. International traffic was still routing to `paypal`. One flipped boolean. The logic reads correctly in isolation — the condition itself is backwards. The kind of bug that survives code review because it looks right.

After fixing the condition, the full payment flow was verified directly via Chrome automation — not unit tests, not mocks: sandbox checkout → webhook delivery → credit granted. Claude operated the Paddle sandbox UI directly using `mcp__claude-in-chrome__computer`.

Two stop hooks fired before wrapping up:

```
Found 2 debug/T​ODO leftover(s) in working tree.
```

After cleanup, the follow-up prompt: "Check that all related functionality works — look for side issues from multiple angles." A workflow ran an adversarial review of how the Paddle changes affected the existing PayApp integration, admin refund flows, and the payments table schema. Conclusion: `feat/paddle-checkout` wasn't merged to main yet. Production was clean.

Session 2 breakdown: 68 Bash calls, 67 Chrome manipulations, 36 file edits across 23 hours 40 minutes.

## 4 Agents in Parallel: Tearing Down a Competitor

Session 4 opened with: "Codeit seems to have something similar to preterview — compare them on current state."

Codeit Ascent: an AI mock interview service launched six days before this session. One of Korea's largest developer education platforms entering directly adjacent territory.

Four workflow branches ran simultaneously:

- **Ascent product deep-dive**: full feature inventory, UX flows, pricing model, capability limits
- **Codeit company strategy**: why they built this, how it fits their existing subscription ecosystem
- **Domestic competitive landscape**: who else is active in the AI mock interview space
- **Cross-validation of 5 key claims**: adversarial verification of findings from the first three branches

Cross-validation surfaced one refuted claim: "Ascent supports GitHub and portfolio URL analysis." Live check against the actual product: it doesn't. The feature appears in some media coverage — it doesn't exist in the product.

Confirmed facts after verification:
- Video and audio bidirectional simultaneously (both directions active at once, not turn-based)
- ~113 company-specific interview sets across all job categories
- Korean-only — no multilingual or English support
- Bundled into Codeit's existing subscription tier, not a standalone product

The overlap with preterview: voice-based bidirectional conversation + multidimensional feedback report. The divergence: preterview focuses on technical interview simulation for developers; Ascent covers all job categories with shallower per-category depth. Not a direct collision — adjacent market, broader audience.

Immediate follow-up: "How do we make it better and actually get paying users?"

Second workflow: global competitor mapping (Final Round AI, interviewing.io, Interviewer.AI) + GTM channel analysis + pricing benchmarks → initial draft → 3-lens self-critique:
1. Is this too obvious to be actionable?
2. Can one founder actually execute this at current scale?
3. Will paying customers materialize from this specific plan?

Output: a hypothesis-driven execution plan targeting first paying users within 8 weeks.

Same session, different problem: a client logging system. The trigger — "is resume and portfolio upload actually working? I heard it wasn't." Claude tested it directly. It worked. Then: "but users said it was broken." Re-test. Failed. No server-side logs meant no visibility into where the request died.

A design workflow ran first to spec the system. Then:

```
app/api/client-log/route.ts          — log ingestion endpoint
components/action-logger.tsx         — client-side event wrapper
lib/clientEvents.ts                  — event type definitions
app/admin/logs/page.tsx              — admin log viewer with filters
app/api/admin/logs/export/route.ts   — CSV export
```

Button clicks, file selection events, API success and failure — all written to DB, queryable from admin, exportable to CSV. The kind of observability that should have been there from day one.

## 42 Grant Programs. Then 42 Again Two Days Later.

Session 5 (2h 44m, 51 tool calls): "Find all government and private grants that fit preterview or the dental advertising project — links and realistic pass probability."

A master report already existed in `~/funding/` from June 21st. Instead of ignoring it, 18 agents fanned out and live-verified all 42 programs against the current date — checking solo-founder eligibility requirements, confirming deadlines hadn't shifted, verifying application URLs actually resolved to open submissions.

Near-deadline programs flagged:
- Primer 29th cohort: June 28
- K-Global Startup Competition: June 30
- NPU (Next Platform Universe): June 29

Session 7, two days later (2h 52m, 67 tool calls): "Simple update, objective, current state."

Grant status changes faster than expected. 18 agents ran again — 14 re-verifications of prior entries, 4 gap sweeps for newly opened programs. Two material changes:
- Pangyo Value-Up: confirmed non-fit for the dental advertising project (industry restrictions)
- Microsoft AI Voucher: confirmed as excluding marketing agencies

The finding that held across both sessions: for a zero-traction solo founder, the realistic win rate concentrates in no-equity programs — mentoring, cloud infrastructure credits, government-backed loans, and subsidies. Pass rates 40–85%. Equity-based seed programs and accelerators: single-digit acceptance rates, with traction expectations incompatible with the current stage.

## 185 Cold Emails, Each One Different

Session 8 was the largest by tool calls: 27h 53m, 290 tool calls.

The goal: build a cold email pipeline to sell preterview to IT education institutions. 72 domestic + 113 overseas = 185 total targets. Constraint: no guessed emails. Every address had to be publicly verifiable — found on an institution's official site or a publicly indexed contact directory. If no public address existed, mark as `noEmail`.

The personalization requirement was the substantive challenge. A cold email to Samsung Software Academy (SSAFY) needs to reference their specific curriculum structure and career placement statistics. An email to MIT CSAIL requires a research-lab framing, not a corporate sales approach. Yonsei University's career development center responds to different signals than an independent coding bootcamp. Same product, entirely different positioning per target institution.

Final output: a single CSV with institution name, verified public email, domestic/overseas flag, personalized subject line, and the full personalized body for each of the 185 targets.

One blocker repeated mid-session: the "▶ 30-second demo — click to play" button kept failing in email clients. Most major email clients (Gmail, Outlook, Apple Mail) block video autoplay and frequently strip embed code entirely. Multiple implementation attempts, all the same result.

Final solution: GIF preview showing the first few seconds of the demo, link to the full hosted video. Universally compatible without modification per client.

Delivery throttle: a cron job configuration capped at 30 sends per day. Bulk-sending 185 cold emails at once destroys domain reputation. The throttle completes the outreach over roughly six days while keeping the sending domain out of spam filters.

## Sidebar: Moving Apartments with Claude Code

Session 3 (1h 3m, 79 tool calls) had nothing to do with software products. It was about merging two apartments into one.

Three CSVs: an appliance decision table (31 items — refrigerator, washing machine, air conditioners, TVs), a furniture decision table, and an administrative/telecom checklist (40 items: ISP transfer, address change notifications, government registrations). Then: "turn this into a deployable site."

A single-page HTML app: Keep, Sell, and Toss tabs that update item counts in real time, with state persisting to `localStorage`. Vercel Blob API for server-side sync so two people coordinating the move see the same state from different devices.

A solo operation blurs the line between personal and professional. Claude Code doesn't maintain that distinction.

## What 933 Tool Calls Distributes To

Tool call breakdown across the 8 sessions:
- **Bash**: 176+ calls — the dominant category
- **Chrome direct manipulation** (`mcp__claude-in-chrome__computer`): 90+ calls — Paddle dashboard, Gmail, email client testing, grant application page verification
- **Edit**: 36+ calls in Session 2 alone

The pattern that repeated across every session without exception: delegate research to dynamic workflows, implement directly. While a workflow was fanning out across 4–18 parallel agents, either the next implementation task was being set up or a question from a different context was being handled. Research and implementation phases ran concurrently rather than sequentially.

Dynamic workflows handle fan-out with adversarial cross-validation built in — one branch explicitly tasked with refuting the other branches' findings before those findings inform implementation. Claude handles the actual code with verified, grounded context rather than unvalidated web-scraped claims.

| Session | Duration | Tool Calls | Core Work |
|---------|----------|------------|-----------|
| 1 | 14m | 2 | Dental clinic metrics (subagent delegation) |
| 2 | 23h 40m | 271 | Paddle payment integration |
| 3 | 1h 3m | 79 | Apartment moving app |
| 4 | 22h 37m | 168 | Competitor analysis + client logging |
| 5 | 2h 44m | 51 | 42 grant programs live-verified |
| 6 | 7m | 5 | Threads marketing strategy |
| 7 | 2h 52m | 67 | Grant re-verification + preterview IR |
| 8 | 27h 53m | 290 | Cold email automation (185 universities) |
| **Total** | — | **933** | |

The throughput isn't high because any single task runs fast. It's because the workflow separation means research results are ready when implementation starts, implementation runs while the next research batch is queued, and nothing blocks on sequentially gathering context before beginning to build.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
