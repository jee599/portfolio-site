---
title: "1,199 Tool Calls in 48 Hours: Shipping 5 Projects with Claude Code Fable 5"
project: "portfolio-site"
date: 2026-06-13
lang: en
pair: "2026-06-13-portfolio-site-ko"
tags: [claude-code, fable-5, multi-agent, workflow, authentication, paypal, coffeechat, spoonai]
description: "7 Claude Code Fable 5 sessions over June 11–12: 1,199 tool calls, 61 files modified, 115 created. Saju redesign, full-stack auth + PayPal, 57-program startup audit, P0 fix."
---

532 tool calls. One session. 27 hours and 48 minutes.

That number belongs to the coffeechat project — email/password auth, JWT session cookies, PayPal payments across three endpoints, OpenAI TTS, next-intl with 7 locales, an admin dashboard, and a full design QA pass. All from a single Claude Code session with Fable 5.

**TL;DR** — Over June 11–12, I ran 7 Claude Code sessions with Fable 5. Total: 1,199 tool calls, 61 files modified, 115 files created. Work covered: a saju site full redesign (25h, 356 calls), coffeechat full-stack auth + payments (27h, 532 calls), a dental marketing report and slide deck, a 57-program startup accelerator survey via 5 parallel agents, and a P0 bug fix shipped in 22 minutes.

## Why a Coffeechat Session Ends Up at 532 Tool Calls

The original request was a single sentence.

> "Let admins log in per user with email/password. Show token usage. Add all the ops tooling we need."

"All the ops tooling" turned out to be everything. Here's what one session ended up building end-to-end:

- **Turso DB layer** — SQLite-over-HTTP, schema and migrations
- **Email/password auth + JWT session cookies** — registration, login, middleware, token refresh
- **Credit calculation module** — usage tracking per user, rolling time windows
- **PayPal payment flow** — three endpoints: `/api/pay/paypal/create-order`, `/capture`, `/webhook`
- **Admin panel** — user list, detail view, individual action pages
- **i18n routing** — next-intl with 7 locales wired through the entire app
- **OpenAI TTS** — `/api/tts` endpoint with streaming audio response
- **Portfolio deep-dive UI** — interactive section with animated breakdowns
- **Resume import, template, and export** — file parsing, template selection, PDF export

Tool breakdown: `Bash` 190 calls, `Edit` 136, `Write` 66.

The pattern that kept the single session from collapsing under its own weight: parallel subagents. Midway through, I spawned three independent agents — one for the portfolio UI, one for the resume import/export system, one for design QA. They ran concurrently and reported back via task notifications. The main context handled orchestration only; actual implementation happened in subagents working in parallel.

Right before pushing to production, Vercel blocked the commit:

```
The deployment was blocked because the commit author email 
(jidong@jidongui-iMac.local) is not valid.
```

`git config user.email` was set to the iMac's local hostname — a configuration detail that had never mattered locally. After 25 hours of work, this was the final blocker. Fixed the email, recommitted, deployed.

## The Payment Platform Problem Nobody Tells You About for Fortune-Telling Products

The saju (Korean fortune-telling) project surfaced the most interesting strategic decision of the two days, and it had nothing to do with code.

The question came from the client: "If we position it as traditional fortune-telling, won't payment platforms reject us anyway?"

I had field data from a June 11 deep research session already sitting in the project memory files. An 'AI Reading' Etsy storefront ran for a full month — zero sales. A human persona shop called Yeonhwa Mansin had 464 sales and 130 reviews over a year. The data was one input; the payment processor angle was another.

Payment platform reviewers don't read landing page copy. They look at **service category**. Whether your homepage says "AI-powered birth chart report" or "traditional saju reading by a master," if you're collecting birth dates and selling a destiny report, the review outcome is identical. The category is fortune-telling, and that's what gets flagged.

Strategic conclusion: don't reframe the copy, migrate to a payment rail that actually allows divination services — Paddle and Lemon Squeezy both have more permissive category policies than Stripe. The prior session's research fed directly into this decision without re-explaining any context, because the memory files loaded automatically at session start.

The redesign itself ran through the open-design skill. Concept: **Midnight Almanac**. Visual system: deep ink indigo (#0D0F1A), gold hairline accents, Fraunces serif for display text. The `CosmicBackground` three.js component from the live site was ported unchanged — stars tinted gold, drift speed reduced. `gpt-image-2` generated photorealistic imagery; SVG shape charts were removed entirely. Three iterations shipped:

- **v1** — static layout, no animation, full type system established
- **v2** — 3D cosmic background + parallax scroll behavior
- **v3** — gpt-image-2 photorealistic hero and section images

Total: 356 tool calls across 25 hours and 26 minutes.

## Surveying 57 Startup Programs with 5 Parallel Search Agents

When the question came in about whether to apply to Primer Seed Accelerator (deadline June 28, ₩100M investment, ~10% equity), I dispatched a dynamic workflow instead of searching manually.

5 parallel search agents, each assigned a category:

1. Government-backed programs (DIPS, Link-up Korea, etc.)
2. Private accelerators
3. Large corporate open innovation programs
4. AI-focused and global accelerators
5. Rolling or always-open applications

209 searches and verifications. 57 programs surveyed. Each agent independently checked current recruitment status against official sources — no cross-agent sharing until synthesis. Filters applied post-collection: solo founder, AI automation B2B, with real revenue or usage traction.

Result: 7 immediately actionable programs, 2 worth monitoring for imminent announcements.

The cross-reference verification step is what made this useful. A program that appears in a VC's blog post from 2024 but has no current recruitment page gets dropped. One that appears across multiple independent government databases with a live application portal stays. The workflow applied this logic consistently across all 57, in parallel.

Post-synthesis verdict: applying to Primer costs essentially one 1-minute video pitch. Acceptance rate aside, the application-to-upside ratio is high enough to just do it.

## The 22-Minute P0 Fix

Session 7 was 22 minutes. It had the highest tool call density of the week — `Bash` 25, `Read` 13, `Write` 8, `Edit` 7 — roughly 2.5 calls per minute sustained.

**Bug 1**: New subscribers weren't receiving any emails, ever.  
**Bug 2**: The unsubscribe link returned 404.

Root cause for Bug 1: `scripts/send-email.js` built its recipient list with a query that excluded users registered after a certain date boundary. New subscribers were invisible to the mailer.

Root cause for Bug 2: the `/api/unsubscribe` GET endpoint was calling the database deletion immediately on click, with no confirmation step. The route existed in the API layer but had no corresponding page, so direct navigation returned 404.

Fixes applied:

- Corrected the subscriber query to include all confirmed registrations
- Changed `/api/unsubscribe` to issue a `302` redirect to a confirmation page instead of performing immediate deletion
- Created `/unsubscribe` — confirmation UI with one-click confirm action
- Created `/feedback` — optional post-unsubscribe feedback form

Commit `4a3c598`. Deployed. Live verification done. 22 minutes total.

## Session Stats Across 7 Runs

| Session | Duration | Tool Calls | Main Work |
|---|---|---|---|
| Coffeechat full-stack | 27h 48min | 532 | auth + PayPal + TTS + i18n |
| Saju redesign | 25h 26min | 356 | open-design + gpt-image-2 |
| AEO cold email | 24h 48min | 105 | strategy + engine implementation |
| Dental PPT | 7h 6min | 82 | 9-slide clinic director briefing |
| Dental ad report | 9h 57min | 62 | deep research + HTML report |
| spoonai P0 | 22min | 56 | bug fix + deploy |
| Daemoon status check | 5min | 6 | current state review |

The pattern holds across sessions: shorter runs have higher tool call density. Longer sessions include wall-clock time where parallel subagents are executing — the main loop is idle while implementation happens elsewhere.

The two longest sessions (coffeechat and saju) both relied heavily on parallel subagents. Strip out the wait time, and the effective single-threaded work in those sessions is probably closer to 8–10 hours each.

## Memory Files as the Layer That Connects Sessions

All 7 sessions ran on Fable 5. The most consistently useful pattern across all of them wasn't a specific feature — it was the `~/.claude/projects/.../memory/` directory.

The Etsy field data collected during the June 11 deep research session was available in June 12's saju strategy session without any manual context-passing. The memory file loaded at session start, the model referenced it during reasoning, and the decision was better for it.

This matters most for projects that span multiple days. A session that ends mid-investigation doesn't lose its findings — they're written to memory and available next time. The saju payment strategy, the Primer accelerator evaluation, the coffeechat Turso schema decisions — all of it persists across session boundaries.

The caveat: memory files get stale. During these two days, `project_saju_paypal.md` was updated once — to clear out an assumption that field data had overturned. Stale memory is worse than no memory because it provides false confidence. The discipline is updating the file when ground truth changes, not just when adding new information.

7 sessions. 1,199 tool calls. The next cycle continues from exactly where this one stopped: saju payment rail migration and coffeechat Vercel deployment.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
