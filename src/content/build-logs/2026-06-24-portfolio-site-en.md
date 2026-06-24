---
title: "924 Tool Calls: When 'It Doesn't Work' Becomes Your Best Feature Spec"
project: "portfolio-site"
date: 2026-06-24
lang: en
pair: "2026-06-24-portfolio-site-ko"
tags: [claude-code, preterview, paddle, multi-agent, automation, logging]
description: "10 sessions, 924 tool calls in 3 days: how a bug I couldn't reproduce triggered a logging system, Paddle payments, competitor analysis, and ad pixels."
---

924 tool calls across 10 sessions. That's what Claude Code logged while I spent three days working from a single user report I couldn't reproduce — and ended up shipping a client-side logging system, Paddle payment integration, competitor analysis, ad pixel infrastructure, government grant research, and somewhere in the middle, a moving checklist app.

**TL;DR** A "it doesn't work" feedback became the forcing function for a proper logging system — because I couldn't reproduce the bug without one. The rest of the sprint ran on a consistent pattern: Dynamic Workflow multi-agent fan-out handles research, Claude handles implementation directly. Total: 10 sessions, 924 tool calls, 100+ hours elapsed.

## The Bug That Refused to Show Itself

Session 4 (22 hours 37 minutes, 168 tool calls) started with a user report: resume and portfolio uploads weren't working for a specific user. Claude tested it directly. It worked. Then the follow-up came:

> "The user said there was supposed to be a login alert, but it never appeared?"

"Try it yourself." Claude tried. This time it failed — the upload button triggered nothing. No error, no toast, no network request visible. And because there was zero logging on the client side, there was no way to trace where the flow had died. It was one specific user's failure path, and the stack was completely silent.

The direction locked in at that point. Not "fix the bug" — first build the logging system so we can see what's actually happening. You can't fix what you can't see.

A workflow ran to spec the architecture. Design conclusion: `client-log` API route paired with an `action-logger.tsx` component. Every button click, file selection, API call success, and API call failure writes to the database. An admin panel makes it queryable. The spec was intentionally minimal — write-only from the client, read-only from admin, no real-time streaming.

Generated files:
- `app/api/client-log/route.ts`
- `components/action-logger.tsx`
- `lib/clientEvents.ts`
- `app/admin/logs/page.tsx`
- `app/api/admin/logs/export/route.ts`

Right before commit, the stop hook fired:

```
Found 1 debug/TODO leftover(s) in working tree.
```

This hook runs on every pre-commit and blocks until debug residue is cleaned. After cleanup, the follow-up ask: "Check that nothing related to your work is causing unexpected side effects." Claude ran a second workflow — adversarial review of whether the logging system hit any existing API routes, affected middleware behavior, or added meaningful bundle weight. Finding: the logging implementation was clean. Side note surfaced: `feat/paddle-checkout` was still unmerged to main, so nothing was touching prod anyway.

The original bug got reproducible once logging was live. It turned out the authentication check was failing silently because a token refresh edge case wasn't surfacing errors to the UI — it was swallowing them. Logging showed the exact call where it died. That's the only reason the fix was trustworthy: the trail existed.

The takeaway here isn't specific to Claude Code — it's that "can't reproduce" is often really "no instrumentation." The logging system existed before the bug fix, not after it.

## Paddle Payments: 67 Browser Operations Inside the Implementation Loop

The heaviest session of the sprint by tool calls — 23 hours 40 minutes elapsed, 271 total — was Paddle payment integration.

Preterview already had geo-routed payments: Korean users go through PayApp (KRW), international users through PayPal (USD). The goal was replacing the international leg with Paddle. The core reason: Paddle is a Merchant of Record, which means it handles cross-border tax compliance automatically — VAT registration, invoicing, filing — none of which a solo founder wants to manage manually across 100+ countries.

Before writing any code, Claude validated the current Paddle integration approach against live documentation. The stated rationale: "Paddle Billing API changes frequently, and getting webhook signature verification wrong is catastrophic — a bad verification implementation means any attacker can trigger purchase confirmations." That doc-first validation pass took a non-trivial chunk of the session, but it's the right call when the alternative is building on stale assumptions.

The generated output:
- `lib/payments/paddle.ts` — SDK wrapper and type definitions
- `app/api/pay/paddle/create/route.ts` — checkout session creation
- `app/api/pay/paddle/webhook/route.ts` — event handler with signature verification
- `app/api/pay/paddle/confirm/route.ts` — post-payment credit allocation
- `components/pricing/PaddleBuy.tsx` — frontend checkout component
- `docs/paddle-setup.md` — implementation reference

The existing PayPal integration stayed in the codebase but got hidden from the UI — a clean failover without removing working code.

What made this session architecturally unusual: `mcp__claude-in-chrome__computer` was called 67 times. Claude operated the Paddle dashboard directly. That means: creating products, configuring three price tiers, issuing API keys, generating webhook secrets, registering the webhook endpoint URL, running sandbox payment tests, and verifying that credit allocation triggered correctly on the backend.

Browser automation wasn't a post-implementation step — it was woven into the implementation loop. Generate the route, register the endpoint in the dashboard, test it, check the response, fix the route, test again. The full cycle without switching contexts.

Mid-session, I spotted something wrong: "Wait — the checkout is still showing PayPal, not Paddle."

Claude took a browser screenshot, confirmed the `PaddleBuy` component wasn't rendering, traced it to `lib/geo.ts` where the routing condition was resolving to the wrong branch, and fixed it. The feedback loop between live browser state and code was what made this debuggable in-session rather than in a separate pass.

One more thing came out of this session — a user-facing improvement: "It'd probably be better if users land on a confirmation page after a credit purchase, right?" — `app/[locale]/pricing/success/page.tsx` got built the same session.

## Dissecting a Competitor That Launched Six Days Ago

Codeit launched Ascent — an AI mock interview product — on June 18th. I found out on June 24th, six days later. Session 4 handled this alongside the logging work.

"Codeit released something that looks similar to my preterview. Compare them based on current state."

The workflow fanned out across four parallel tracks:
1. Detailed product investigation of Ascent — features, UX flows, pricing
2. Codeit company and strategy context — what they've been acquiring and building
3. Domestic competitive landscape — who else is in the AI mock interview space
4. Adversarial cross-verification — five key claims audited for accuracy

The verification stage produced one important refutation worth naming explicitly: the initial claim that "Ascent has GitHub/portfolio URL analysis" came back refuted. It doesn't exist. The feature appeared in some coverage but wasn't in the actual product.

What was confirmed through actual testing: Ascent supports video and audio interaction in both directions, covers all job categories with approximately 113 company-specific interview profiles, and is Korean-only. That's fundamentally different positioning from Preterview's developer-focused, English-capable, GitHub-integrated product. Adjacent market, not head-to-head competition.

The follow-up question arrived immediately: "What would we need to do to actually outperform and outsell them?"

Second workflow. This one ran: Preterview codebase gap analysis, global competitor mapping (Final Round AI, interviewing.io), GTM channel and pricing research, then assembled a draft. The draft then went through a three-lens self-critique: is this obvious / can a solo founder actually execute this / will this move purchase decisions. Result: an 8-week execution plan built around the hypothesis of hitting the first N paying international customers, not around feature parity with Ascent.

The speed of this analysis matters. Manual competitive research for a product you didn't know about until this morning would realistically take a full day with uncertain depth. Adversarial verification built into the workflow means findings arrive with explicit confidence levels — which claims were tested against the actual product vs. which came from coverage that might be inaccurate.

## Naver Ad Copy in 15 Characters Flat

Session 7 (23 hours 25 minutes, 76 tool calls) had a progressively narrowing structure. Each question became more specific than the last, and three sequential workflow runs tracked the scope down.

**First workflow:** "Is Instagram better for preterview? Find objective benchmarks on which channel and targeting gets the best ROI — domestic and global." → 24 agents, approximately 880k tokens, 245 web tool calls. Thirteen major data points were revised or refuted after adversarial verification. The verified conclusion: Naver PowerLink has meaningfully higher intent-to-purchase signal for the Korean developer interview preparation market than Meta or Instagram.

**Second workflow:** Naver PowerLink account setup guide, three Reddit ad creatives, and a pixel implementation checklist — QA'd against actual platform constraints before finalizing.

**Third workflow:** "Let's cap the budget at ₩500,000 (~$360 USD)." → Per-channel projected reach funnel model at the ₩500K budget level, broken out by impressions, clicks, estimated conversions.

After the channel decision narrowed to Naver, a fourth workflow pulled real monthly search volume and CPC data, ranking keyword groups by cost efficiency. The output: Naver PowerLink ad copy within the 15-character headline constraint, organized by keyword group:

- 면접말버릇 (interview filler-word habits)
- 면접습관교정 (interview habit correction)
- AI면접 (AI interview)
- 개발자면접 (developer interview)

Fifteen Korean characters is a brutal headline constraint. A single word can burn six characters. Every syllable gets weighed against click intent.

Pixel implementation was direct code work — no workflow:
- `components/marketing/analytics-scripts.tsx` — Naver Click Choice + Google gtag loading
- `lib/marketing/consent.ts` — GDPR consent state management
- `lib/marketing/conversions.ts` — conversion event definitions
- `lib/marketing/track.ts` — event wrapper layer

GA4 measurement ID `G-ES6SENFGM2` connected to the Paddle payment success page. The funnel from ad click through to credit purchase now has full tracking coverage across both channels.

## 42 Government Grants, Verified Twice Two Days Apart

Sessions 5 and 8 were directly linked — a research task with a built-in expiration date.

**Session 5** (2 hours 44 minutes, 51 tool calls): "Find all government and private grants currently suitable for Preterview and the dental ad project." A master report from June 21st already existed in `~/funding/`. A workflow used it as base context and ran live verification on 42 grants — checking whether each was still open, whether the deadline had shifted, whether the eligibility criteria matched the current product stage.

Three deadline-critical items surfaced: Primer 29th cohort closes June 28th, K-Global closes June 29th, Samsung C-Lab closes June 26th.

**Session 8** (1 hour 36 minutes, 5 tool calls), two days later: "Simple current-status search — links, close dates, rough probability estimate."

Grant listings change within days. An application page can go dark without any announcement. Eighteen agents fanned out: 14 re-verified grants from the prior list, 4 swept for newly opened programs that fit. Direction: "Don't re-research everything — filter to what's still alive as of June 24th and re-sort by priority."

The pattern here: research that has a short shelf life needs explicit reverification cadence. The multi-agent setup makes reverification fast enough that it's worth running again rather than assuming 48-hour-old data is still accurate.

## Moving Apartments Is Also a Software Problem

Session 3 (1 hour 3 minutes, 79 tool calls) had nothing to do with startups. I'm combining two apartments — a 24-pyeong and a 32-pyeong unit — into a single 34-pyeong place. I needed a tool to track what to keep, sell, and throw away across 70+ items.

"Build it as a site and deploy it. Make sure it saves state."

Three CSVs first: appliance decision table (31 items), furniture decision table, utilities and admin checklist (40 items). Then an interactive app — keep/sell/toss tabs, live aggregate counts per category, localStorage auto-save so nothing gets lost between sessions.

The design gate triggered, as it always does when an HTML artifact gets generated. Cleared after specifying the OD-equivalent design pass rationale. Vercel Blob API got wired in afterward for server-side state sync — so the checklist persists across devices.

This is a real characteristic of solo founder Claude Code usage: personal context and work context blend in the same session without ceremony. The tool doesn't care about the domain boundary. The overhead of spinning up a dedicated tool for a one-off personal project approaches zero when the assistant is already open and context-loaded.

## The Full Picture

| Session | Elapsed | Tool Calls | Core Work |
|---------|---------|------------|-----------|
| 1 | 14 min | 2 | Dongbaek UDI dental monitoring delegation |
| 2 | 23h 40m | 271 | Paddle payment integration |
| 3 | 1h 3m | 79 | Moving checklist app |
| 4 | 22h 37m | 168 | Codeit competitor analysis + behavior logging |
| 5 | 2h 44m | 51 | Government grants — 42 verified |
| 6 | 7 min | 5 | Threads marketing strategy |
| 7 | 23h 25m | 76 | Ad pixels + Naver/Google setup |
| 8 | 1h 36m | 5 | Grants re-verification |
| 9 | 27h 35m | 267 | Cold email + sales page + GA4 |
| **Total** | **100h+** | **924** | |

Top tools by call count: Bash 195 · Edit 103 · Read 57. `mcp__claude-in-chrome__computer` crossed 90 — used to operate the Paddle dashboard, Naver Ads account, and Google Analytics directly from inside the Claude session.

The pattern that repeated across every substantive session: complex research goes to Dynamic Workflow, implementation is handled directly. While a workflow runs in the background, Claude processes the next implementation task or user question. When the `<task-notification>` returns, synthesis happens and the next cycle starts.

This separation is what made three days absorb what would normally take a full work week. Research and implementation run in parallel rather than sequentially. Multi-agent AI automation isn't a single fast assistant — it's a team structure where different tasks run simultaneously.

924 individual sequential prompts would have taken a month. 924 tool calls across coordinated multi-agent workflows took three days. That's the number worth holding onto.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
