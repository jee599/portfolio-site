---
title: "457 Tool Calls Across 3 Projects: Credit Pricing, Fortune App Exit, and a Viral X Bot"
project: "portfolio-site"
date: 2026-06-16
lang: en
pair: "2026-06-16-portfolio-site-ko"
tags: [claude-code, saas, credits, multi-agent, xbot, coffeechat, fortunelab]
description: "How I designed SaaS credit pricing, built an admin audit system, drafted an exit strategy for a fortune-telling app, and shipped an X bot — 457 tool calls across 3 sessions."
---

457 tool calls. 3 sessions. 15 hours. Bash 151×, Read 92×, Edit 75×, Write 36×.

The longest session ran 12 hours 24 minutes and consumed 307 tool calls — designing a credit system for CoffeeChat (an AI mock interview SaaS), building an admin dashboard, and producing a global GTM report. Then a 52-minute research sprint on Claude Code Opus 4.8 best practices. Then an exit strategy for a Korean fortune-telling app plus a viral X bot, built from scratch in the same day.

**TL;DR** — Pricing a single credit tier took 10+ calculation rounds. Parallel multi-agent workflows cut a 5-part market analysis from sequential to near-simultaneous. Sequential calculation chains (cost → margin → price) are still faster as direct conversation. Different session types produce radically different tool distributions.

## It Took an Hour to Price One Credit Tier

CoffeeChat is an AI mock interview SaaS — three AI panelists running parallel interviews, plus resume review and portfolio analysis. The core question: how much should 30 interview turns cost?

First, raw API costs for Claude Opus 4.8. Three panelists responding simultaneously — not simple multiplication. The prompt:

> "What does it actually cost — in API dollars and internal credits — to run a resume analysis, portfolio review, and 20/30 interview turns with Sonnet vs Opus?"

The chain: API cost → credit conversion → user-facing price. At 5× margin, 30 turns came out to 900 credits. Then:

> "I want 30 turns to cost around ₩7,000."

At 100 credits = $1, that's 900 credits = $9 ≈ ₩12,000 at current exchange rates. 71% over target. Options: shrink the margin, downgrade the model, or cut costs via caching.

The answer was Anthropic prompt caching. System prompts are static across sessions — caching cuts repeated-call costs by up to 90%. Implemented in `lib/credits.ts`. Hit the ₩7,000 target at 900 credits for 30 turns.

## The Admin Page Needed Full Audit Trails from the Start

> "Where's the admin page? I need per-user API cost tracking, feature usage rates, visitor counts — the whole picture."

The admin scaffolding existed but had no API cost tracking. Built `lib/audit.ts` from scratch and added `app/api/track/route.ts` to log usage on every feature call.

Visitor tracking required separate infrastructure. Connected Resend API for email auth (`app/api/auth/signup/route.ts`) and added `page-tracker.tsx` for pageview tracking. End result: a single admin screen showing per-user credit consumption, raw API costs, and per-feature usage rates.

## One Report to Decide the Global Strategy

> "Give me a single report on how to take this service global."

CoffeeChat was built for Korean job markets. Interview culture, industry verticals, and price sensitivity all shift across regions. Ran a `report-builder` multi-agent workflow against these questions.

The report at `~/reports/posts/2026-06-15-coffeechat-global-gtm.html` landed on one clear conclusion: diversify domestic job categories before going global. Expand from dev/design into business, marketing, and finance in Korea first. Global is step two.

Payment: PortOne. Toss Pay blocks international transactions; PortOne handles both domestic PG and overseas cards through a single SDK, no integration fee.

## Session Two: Researching How to Use Claude Code Well

52 minutes. 41 tool calls. Three parallel research streams: official docs, GitHub ecosystem, and community trends.

Five agents ran simultaneously — Anthropic official docs, the Claude Code GitHub repo, recent Reddit/Hacker News threads, and real-world usage patterns. Consolidated output into a single HTML report via `report-builder`.

The most practically significant recent change: Dynamic Workflow. Triggered a second deeper research pass — parallel searches across the official docs track and hands-on examples — and merged the findings as a new section into the existing report.

Report path: `~/reports/posts/2026-06-15-claude-code-opus-48-best-practices.html`

## Session Three: Exit Strategy for a Fortune App + Shipping the X Bot

1 hour 57 minutes. 109 tool calls. The session with the most Write calls (19).

Started with a status check. Pulled real metrics from `~/saju_global/STATUS.md`:

- 30 total paid orders (all Korean via Toss Pay; international PayPal: 0)
- 87 sessions in April
- Production deployment broken for 44 consecutive days
- First international payment: still zero

Request: "I need to sell this. Build the strategy."

Spun up 5 parallel analysis agents: Korean market sizing, unit economics, product diagnosis, channel analysis, and asset sale strategy.

The Korean fortune-telling market is estimated at ~₩1.4 trillion (InnoForest/Magazine Hankyung). The global spiritual apps market is projected at 10% CAGR through 2027. Big numbers. The problem: actual user base was too thin to command a meaningful valuation.

All five analyses converged on the same conclusion: **traction first**.

So I built the X bot.

> "What if we post saju (四柱) readings in English on X every 6 hours, targeting a specific demographic?"

Target by birth year/month cohort, publish fortune analysis automatically to X. Created 7 modules under `lib/xbot/`:

- `cohorts.ts` — target cohort definitions
- `formats.ts` — post format templates
- `viral.ts` — viral optimization logic
- `voices.ts` — persona voices
- `rotate.ts` — format rotation
- `xClient.ts` — X API client
- `generate.ts` — content generation

Added `/api/cron/x-post/route.ts` to Vercel Cron for automatic posting every 6 hours.

Account branding: generated images with `gpt-image-2` across three script iterations (`genimg-x-brand.py`, `genimg-x-brand2.py`, `genimg-x-brand3.py`) — avatar, banner, and persona images in multiple styles, compared via `x-brand/avatar-preview.html`.

## When Parallel AI Automation Actually Saves Time

Fan-out workflows were fast when analysis units were independent. The saju project's Korean market sizing, unit economics, channel analysis, and exit strategy don't feed into each other — 5 concurrent agents converge to roughly 1/5 the wall-clock time of sequential execution.

Credit pricing was sequential. API cost → margin rate → credit price → bonus adjustment — each result determines the next input. Direct conversation was faster than a workflow here.

Different session types produce very different tool distributions. Here's the full 3-session breakdown:

| Metric | Count |
|---|---|
| Total tool calls | 457 |
| Bash | 151 |
| Read | 92 |
| Edit | 75 |
| Write | 36 |
| Agent (workflow) | 23 |
| Files modified | 34 |
| Files created | 32 |
| Total session time | ~15 hours |

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
