---
title: "1,237 Tool Calls Across 7 Sessions: Reference Design Limits and 5 Projects in Parallel"
project: "portfolio-site"
date: 2026-06-16
lang: en
pair: "2026-06-16-portfolio-site-ko"
tags: [claude-code, opus-4-8, dynamic-workflow, multi-agent, ai-automation]
description: "7 sessions, 71 hours, 1,237 tool calls. What I learned running a credit system, GTM strategy, dental redesign, and more in parallel with Claude Code Opus 4.8."
---

7 sessions. 71 hours. 1,237 tool calls. One day of work with Claude Code Opus 4.8 that spanned a SaaS credit pricing system, a fortune-telling app exit strategy, a dental clinic redesign, and Pokemon card arbitrage analysis.

The last session was the most clarifying — I finally diagnosed *why* reference-based design keeps failing, and what the actual fix looks like.

**TL;DR** Parallel Dynamic Workflow makes a real difference when work units are independent. Feeding browser screenshots as design references only captures color palette. Actual CSS parsing is required for layout and typography fidelity.

## 25 Hours to Design a Credit Pricing System via Prompt

The heaviest session this period was CoffeeChat — an AI interview SaaS. 25 hours 48 minutes, 365 tool calls.

Starting prompt: *"Check the current state of the CoffeeChat project and outstanding work. Also think through mobile UI."*

The audit scope was broad enough to warrant parallel agents. Eight ran concurrently: build/health check, feature completeness, and mobile UI across six surfaces (navigation, landing, resume, portfolio, interview, and account/payment/admin). While results came in, I rendered the dev server at 390px mobile width and cross-checked against the agent findings.

Once the audit wrapped, the real work started: credit unit pricing.

```
"What does it cost to run resume / portfolio / interview at 20/30 turns with Sonnet vs Opus?"
→ "I want 30 turns to land around ₩7,000."
→ "Adjust the bonus to ~300 and lock 30 turns at 900 credits."
```

The chain was: API cost → credit conversion → user-facing price, worked backward. At a 5× margin, 30 turns came out to 900 credits = $9 = ₩12,000. That overshot the ₩7,000 target by ₩5,000.

Claude suggested prompt caching unprompted. The system prompt is static, so repeated calls can cut per-turn compute cost by up to 90%. Caching logic went into `lib/credits.ts` and the 900 credits = ₩7,000 target was hit.

The same session also shipped `lib/audit.ts`, `app/api/track/route.ts`, an admin dashboard, Resend email verification, and PortOne payment integration. PortOne over Toss Pay for one clear reason: Toss blocks international cards; PortOne handles both domestic PG and foreign cards through a single SDK.

## Five Parallel Agents to Evaluate Whether to Sell a Fortune-Telling App

FortuneLab session: 142 tool calls, 14 hours 49 minutes.

First move was to pull real numbers from `STATUS.md`:

- 30 total paid orders — all KR Toss, 0 PayPal
- 87 sessions in April
- Production had been undeployed for 44 consecutive days

The request: *"I want to sell this. Give me a realistic strategy."* Five agents ran in parallel: KR market analysis, unit economics (CAC/LTV), product diagnostic, channel research, and acquisition valuation. All five converged on the same conclusion: traction is too thin. Selling now means selling cheap. Better to collect Korean user feedback first.

So instead, we built a scheduled X (Twitter) bot. Seven modules under `lib/xbot/`: `cohorts.ts`, `formats.ts`, `viral.ts`, `voices.ts`, `rotate.ts`, `xClient.ts`, `generate.ts`. Vercel Cron fires every six hours. Account branding images were generated in three batches using `gpt-image-2`.

## The Dental Redesign Is Where Reference Fidelity First Broke Down

Dongbaek UDental redesign: 274 tool calls, 8 hours 2 minutes. `mcp__claude-in-chrome__computer` fired 64 times — this session was browser-heavy by a wide margin.

Goal: *"Make it look as good as a top-tier dental clinic in Korea. No AI aesthetic."* Went in via the Open Design route. Researched actual top Korean dental sites as references, catalogued 13 local photos (exterior, waiting room, treatment rooms, hallway).

A pattern kept repeating:

1. Screenshot a reference dental site
2. Review output → *"Looks AI," "fonts inconsistent," "background too static"*
3. Research another reference

The color palette was close. But structure, font stack, and layout kept diverging from the reference. I didn't understand why yet — that came in session 7.

## Browser Automation Made Pokemon Card Arbitrage Tractable

Session 5 (104 tool calls, 2 hours 22 minutes) was a Buyee search for sealed Pokemon card boxes.

11,803 listings. Manual filtering is not viable. What Claude did:

1. Searched "ポケモンカード BOX", filtered to sealed + buy-now conditions
2. Calculated Korea landed price = item price + proxy fee (¥800) + domestic shipping (¥1,000) + EMS (¥3,500)
3. Ran expected value (EV) analysis across 13 boxes in parallel

The EV workflow fired twice — first for retail/market validation (10 boxes), then for opened EV vs. sealed price comparison (13 boxes). Output was an HTML comparison table. Abyss Eye had the lowest sealed price relative to EV — best arbitrage efficiency.

One customs question came up: *"If I split the order into two shipments, can I dodge duty?"* No. All Buyee shipments share the same declared sender, so customs aggregates them. And intentional splitting is a customs law violation.

## CoffeeChat Icons Got Rebuilt Three Times

Session 6 (210 tool calls, 3 hours 28 minutes) was a full replacement of CoffeeChat's icons, favicon, and OG images.

Started by tracking down a reported bug: resume/portfolio input fields were missing from the mock interview setup. Turned out they weren't missing — `InterviewSetupForm.tsx` had moved them to step 3. Commit `c6dd46e` only restructured step 0 (job role). Not a bug.

The real work was icon design. Prompt: *"Reference a major Korean education platform. Nothing that reads as AI-generated."* Used Inflearn as the benchmark.

Same issue as the dental session surfaced immediately:

> "These all look like the same low-quality AI output with different colors. None of them actually match the reference."

Switched approaches: generate directly with `gpt-image-2` rather than approximating via HTML/CSS. `scripts/gen-assets.mjs` handled batch generation of favicon, OG, and icons. `scripts/finalize-assets.mjs` ran post-processing. Final assets locked in after three generation batches.

Resume and portfolio field structure also got reworked. They're now treated symmetrically — if a field isn't provided, it's omitted cleanly. `InterviewInfoModal.tsx` is the main file for this change.

## Why Reference Design Keeps Failing — Root Cause Analysis

Session 7 (84 tool calls, 4 hours 14 minutes) addressed the pattern that repeated across both the dental and CoffeeChat sessions.

Reproduced the failure: specified Inflearn as the reference, generated output, compared directly.

Two root causes:

**1. Screenshot resolution is too coarse for design tokens**
When Claude screenshots a page, it receives a 1280px full-page image. Visual feature extraction from that image picks up rough patterns — "mint tones + rounded buttons." Actual CSS custom properties, font-family, font-weight, and spacing values are not readable from a screenshot.

**2. Layout gets reinvented during reproduction**
When approximating a reference layout, Claude invents new structure. It doesn't transplant the original grid and component hierarchy — it builds a new one that looks vaguely similar at a glance but diverges in all the specifics that make design feel intentional.

The fix is `extract-reference.mjs`: parse the target site's CSS to extract real tokens into `reference-tokens.json`, bind those directly into `:root` CSS variables, then validate with `compare-tokens.mjs` that fidelity is ≥70%.

This pipeline was already wired into `.claude/hooks/design-gate.sh`. When a reference URL is detected, `extract-reference.mjs` runs before any HTML generation is allowed. I knew this existed — session 7 was when I saw firsthand *why* it's necessary.

## Session Breakdown

| Session | Work | Tool Calls | Duration |
|---|---|---|---|
| 1 | Claude Code research report | 58 | 13h 11m |
| 2 | FortuneLab GTM + X bot | 142 | 14h 49m |
| 3 | CoffeeChat credits/payment/email | 365 | 25h 48m |
| 4 | UDental redesign | 274 | 8h 02m |
| 5 | Pokemon card sourcing | 104 | 2h 22m |
| 6 | CoffeeChat icons/favicon | 210 | 3h 28m |
| 7 | Reference design analysis | 84 | 4h 14m |
| **Total** | | **1,237** | **~71h 54m** |

Tool distribution: Bash 260+, Edit 200+, Read 140+, Chrome browser 140+. The high Chrome count comes from the dental and CoffeeChat sessions repeatedly running live browser render checks.

## When Parallelism Works and When It Doesn't

The pattern clarified across these seven sessions.

**Parallel workflow is genuinely faster when**: analysis units are independent. FortuneLab's five-market analysis, CoffeeChat's eight-surface mobile audit, Pokemon card EV across 13 boxes — all fit this pattern. Wall clock time equals the slowest single agent, regardless of how many run simultaneously.

**Sequential conversation is correct when**: each output determines the next input. Credit cost → margin → price → bonus adjustment had to be sequential. Running a workflow here adds overhead without benefit — real-time conversation is faster.

**Reference design extraction** fit neither category. It wasn't a sequencing problem or a parallelism opportunity. It was a technical constraint: screenshots don't carry the data you need. CSS parsing does.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
