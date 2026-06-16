---
title: "365 Tool Calls in One Session: Claude Code Opus 4.8 Across 4 Projects in a Day"
project: "portfolio-site"
date: 2026-06-16
lang: en
pair: "2026-06-16-portfolio-site-ko"
tags: [claude-code, opus-4-8, multi-agent, workflow, saas, automation]
description: "643 tool calls across 4 sessions in one day — credit pricing, X bot, clinic redesign. The longest session ran 25 hours 48 minutes with 365 tool calls."
---

643 tool calls in a single day. One session alone ran for 25 hours 48 minutes.

Four projects, four Claude Code Opus 4.8 sessions. The heaviest — CoffeeChat, an AI job prep SaaS — clocked 365 tool calls: mobile UI audits, a credit pricing system, admin pages, payment integration, email auth, and a global GTM analysis. All in one continuous session.

**TL;DR** — Working out credit pricing from first principles took a full hour. Parallel multi-agent workflows are genuinely faster when units are independent (market analysis, UI surface audits, reference research). For sequential reasoning chains — cost → margin → credit price → bonus — direct conversation beats orchestration. The dental clinic redesign started with reference research and direction selection before a single line of code was touched.

## The Session That Wouldn't End: 8 Parallel Agents at Kickoff

The CoffeeChat session started with: "Check the current state of the project, remaining tasks, and think through mobile UI."

A full-codebase audit situation calls for a workflow. 2 status-check agents (build health + feature completeness) + 6 mobile UI audit agents covering distinct surfaces (global/nav, landing, resume, portfolio, interview, account/payment/dashboard/admin) = 8 agents in parallel.

While the audit ran, a dev server spun up in the background for live cross-validation at 390px mobile width. Static code analysis and real render results simultaneously — let agents do the breadth work while you verify against the actual thing in a browser.

The audit surfaced a real backlog. What followed was the actually heavy work: credit system, admin, global GTM — in that order.

## Working Out Credit Pricing From Scratch Takes an Hour

The core question: how much should 30 interview turns cost?

> "If I run resume / portfolio / 20-turn or 30-turn interviews and reports using Sonnet and Opus respectively, what's the API cost — and how many internal credits does that consume?"

The chain: API cost → credit conversion → user-facing price. With a 5× margin, 30 interview turns landed at 900 credits.

> "I want 30 turns to come out to around ₩7,000."

At 100 credits = $1, 900 credits = $9. With exchange rate, that's roughly ₩12,000 — ₩5,000 over target.

The fix: Anthropic prompt caching. The system prompt is static across all interview turns, so repeated calls cut the per-turn API cost by up to 90%. Caching logic went into `lib/credits.ts`, and the 30-turn × 900-credit calculation now hits the ₩7,000 target.

The bonus credit amount bounced: 200 → 300 → back to 200. Without `lib/constants.ts` centralizing that value, the number would have been hardcoded in a dozen places across the codebase.

## Admin Dashboard, Email Auth, and the Payment Provider Decision

> "Where did you put the admin page? I want per-user API cost, visitor counts, and feature usage rates all in one view."

`lib/audit.ts` was built fresh, paired with `app/api/track/route.ts` — every feature call logs usage. The admin view now shows per-user credit consumption, raw API cost, and feature utilization rates in one screen.

Visitor tracking needed separate infrastructure. Resend API handled email verification (`app/api/auth/signup/route.ts`); `page-tracker.tsx` covers page views.

For payments: PortOne over Toss Payments. Toss blocks international cards; PortOne handles Korean PG and international cards through a single SDK.

The global GTM analysis came out of the same session: `~/reports/posts/2026-06-15-coffeechat-global-gtm.html`. Main finding: expand domestically across job verticals before going English-first.

## FortuneLab: 5 Parallel Market Analysts, Then an X Bot

The second-heaviest session — FortuneLab, a Korean fortune-telling SaaS — ran 142 tool calls over 14 hours 49 minutes.

First, pull the actual state from `~/saju_global/STATUS.md`:

- 30 total paid orders (all Korean via Toss; international PayPal: 0)
- 87 sessions in April
- Production deployment had been broken for 44 consecutive days

The ask: "I need to sell this. Build me a strategy."

Five agents ran in parallel: KR market analysis, unit economics, product diagnosis, channel analysis, asset sale strategy. All five converged on the same conclusion: current traction is too thin to monetize aggressively.

So instead of a sales push, an X bot.

> "What about posting fortune readings in English on X every 6 hours, targeting a specific audience?"

`lib/xbot/` got seven modules: `cohorts.ts`, `formats.ts`, `viral.ts`, `voices.ts`, `rotate.ts`, `xClient.ts`, `generate.ts`. A Vercel Cron job at `/api/cron/x-post/route.ts` fires every 6 hours.

Branding images went through `gpt-image-2` in three rounds — avatar, banner, persona in multiple styles — compared side-by-side in `x-brand/avatar-preview.html`.

## Claude Code Research → HTML Report on GitHub Pages

58 tool calls, 13 hours 11 minutes (including idle time). Direct file edits: 3.

Three parallel agents researched Claude Code Opus 4.8 best practices: one on official docs, one on the GitHub ecosystem, one on community patterns. Synthesis went through `report-builder` and published to GitHub Pages.

Published at: `~/reports/posts/2026-06-15-claude-code-opus-48-best-practices.html`

A follow-up came in to go deeper on Dynamic Workflows specifically. Two more agents ran additional research and added a dedicated section to the existing report.

## Uddental Redesign: Research Before a Single Code Edit

Session four: 1 hour 3 minutes, 78 tool calls. Most distinctive stat: `mcp__claude-in-chrome__computer` called 33 times — more than Edit (9) and Bash (8) combined. Most of this session was browser capture and navigation.

The ask: "Make it look indistinguishable from a top-tier Korean dental clinic — or better."

Jumping straight to code edits would've been the wrong call. Open Design route: direction first, codebase second. Strategy: home page first → full rollout; premium photo-forward + sans-serif modern aesthetic (no Ming typeface, no AI-generated look).

First, inventory the actual Uddental assets — 13 photos covering exterior, waiting room, treatment rooms, corridors. Then two parallel agents researching top Korean dental clinic sites. The deliverables at this stage: `home-preview.html` and `directions-preview.html` — HTML mockups rendered in a browser for comparison. Codebase edits came after direction was locked.

## When Parallel Workflows Help (and When They Don't)

Looking across all four sessions, the pattern is clear. Parallel agents delivered real speed gains for: full-codebase audits (CoffeeChat's 8 mobile surfaces), independent market analysis (FortuneLab's 5 axes), and reference research (dental site's 2 branches). The common thread: each unit had no dependency on any other.

Credit pricing was sequential and had to be. API cost → margin rate → credit price → bonus adjustment: each step's output was the next step's input. Workflow orchestration adds overhead here. Direct conversation is faster.

Different session characters produce different tool distributions:

| Session | Tool Calls | Dominant Tools |
|---|---|---|
| CoffeeChat | 365 | Bash 113, Edit 81, Read 76 |
| FortuneLab | 142 | Bash 35, Read 24, Write 19, Edit 17 |
| Uddental | 78 | Chrome 33, Edit 9, Bash 8 |
| Claude Research | 58 | Bash 38, Agent 5, Read 3 |

Totals across 4 sessions: Bash 194, Edit 110, Read 108, Write 41. Files modified: 41. Files created: 36.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
