---
title: "1,212 Tool Calls in 72 Hours: Running 5 Projects in Parallel with Claude Code and Fable 5"
project: portfolio-site
date: 2026-06-13
lang: en
pair: 2026-06-13-portfolio-site-ko
tags: [claude-code, fable-5, ultracode, workflow, multi-agent, paypal, coffeechat]
description: "How a multi-agent Claude Code workflow racked up 1,212 tool calls across 10 sessions in 72 hours — building auth, PayPal, TTS, i18n, and an admin dashboard in a single 27h 48min session, redesigning a saju app, and shipping a P0 fix in 22 minutes. Real numbers, real blockers, real patterns."
---

532 tool calls in a single session. That's what it took to ship CoffeeChat from a blank slate to a full-stack app with auth, PayPal payments, TTS, i18n across seven locales, and an admin dashboard — all in 27 hours and 48 minutes. That number doesn't include the other four projects running in parallel during the same 72-hour window: 356 calls for a full saju app redesign, 82 for a dental clinic pitch deck, 62 for a startup program sweep across 57 programs, and 56 for a P0 hotfix that went from diagnosis to live deploy in 22 minutes. Total across 10 sessions: 1,212 tool calls.

**TL;DR** — June 11–13, 10 sessions, 1,212 tool calls, five projects running concurrently under claude-fable-5 via Claude Code. The bottleneck was never model speed. It was context separation.

## A 22-Minute Session and a 27-Hour Session Ran the Same Week

Before digging into any individual project, here's the full session breakdown:

| Session | Duration | Tool calls | Main work |
|---|---|---|---|
| CoffeeChat full-stack | 27h 48min | 532 | auth + PayPal + TTS + i18n + admin |
| Saju redesign | 25h 26min | 356 | open-design + gpt-image-2 |
| AEO cold-email strategy | 24h 48min | 105 | strategy + Hermes engine implementation |
| Dental clinic report | 9h 57min | 62 | deep research + HTML report |
| Dental clinic PPT | 7h 6min | 82 | 9-slide owner briefing deck |
| SpoonAI P0 fix | 22min | 56 | bug fix + live deploy |
| Daemoon status check | 5min | 6 | status audit |
| Model error session | 2min | 0 | claude-fable-5 inaccessible |

The short sessions have the highest tool-call density. SpoonAI ran 56 calls in 22 minutes — 2.5 per minute. The long sessions include agent wait time: sub-agents running in parallel while the main context idles.

That variance tells you something. When scope is locked tight upfront, the AI automation pipeline runs hot. When scope is open-ended, the session length is dominated by orchestration gaps, not model latency.

## What "All-in-One" Actually Looks Like at 532 Calls

The initial prompt for CoffeeChat was deceptively short:

> "Let users log in to the admin site with email and password, per user. Show token usage. Add all the ops tooling you'd need. Payments too. Global."

"All the ops tooling" turned out to have no natural stopping point. The session expanded through: Turso DB layer, JWT session cookie auth, credit calculation module, PayPal across three endpoints (`create-order`, `capture`, `webhook`), admin user list and detail views with bulk actions, next-intl wired for seven locales, OpenAI TTS, a portfolio deep-dive interactive UI, resume import and template export. Over 70 files were created or modified.

The multi-agent workflow pattern used here was functional decomposition: sub-agents ran in parallel for the portfolio enhancement UI, the resume import/template/export UI, and design QA. Each reported back via task notification. The main context handled only orchestration — routing decisions, reviewing outputs, resolving conflicts between parallel work streams.

This is the practical shape of a multi-agent workflow at this scale. It's not about parallelizing compute. It's about isolating concerns so that a design QA agent doesn't need to know anything about the PayPal webhook implementation, and vice versa.

Then, right before deploy, Vercel blocked the commit:

```
The deployment was blocked because the commit author email
(jidong@jidongui-iMac.local) is not valid.
```

`git config user.email` was set to the iMac's local hostname. After 25 hours of work, that's the blocker. One line fixed it — `git config --global user.email "jd@jidonglab.com"` — but it's a reminder that Claude Code can't fix environment-level configuration problems on your behalf. These always surface at the worst moment.

## The Saju Redesign Started with a Payment Strategy Decision

The saju project session opened with a strategic question before a single design file was touched: "If we go with traditional saju framing, won't payment platforms reject it?"

The answer was already in memory from a deep research pass on June 11. An Etsy natural experiment: a shop that led with "AI Reading" branding did zero sales in one month. A shop using a human persona — a Korean mudang named Yeonhwa — ran for a year with 464 sales, 130 reviews, and a $34 average order value. Payment platform reviewers don't evaluate landing page copy. They evaluate **service category**. Whether you call it "AI report" or "traditional saju reading," you're selling a divination product, and that's how the underwriters classify it.

The real fix isn't rebranding. It's switching to a payment rail that actually permits divination products. That conclusion went into the memory file (`project_saju_paypal.md`) immediately, because getting this wrong would mean shipping a beautifully redesigned checkout flow onto a payment processor that would ban the account.

With that resolved, the redesign proceeded under the "Midnight Almanac" concept: deep ink indigo, gold hairline accents, Fraunces serif. The cosmic 3D background was ported from a live Three.js component on another project, with star colors shifted to a gold tint and drift speed reduced. The version progression was v1 (static, no animation) → v2 (3D + parallax) → v3 (gpt-image-2 photorealistic imagery).

The gpt-image-2 ink-wash images came back and didn't fit the dark background. After the feedback "the spinning saju chart looks cheap — make it more technical and contemporary," the SVG chart components were cut entirely. Image generation ran as a background Task while v3 HTML was built in the foreground. When the generation notification came in, the images were inserted. That's where the parallel processing actually saved time in a measurable way — background generation overlapped with foreground HTML work, and the two streams converged cleanly.

## What 57 Programs and 209 Searches Looks Like With Dynamic Workflow

The startup program research task was the first session where I ran `/effort ultracode` and let the dynamic workflow expand fully. The ask was a comprehensive sweep of Korean and global accelerator programs for a Primer seed application.

Five search agents ran in parallel across categories: government programs (DIPS Link-up and equivalents), private accelerators, large-enterprise open innovation, AI-focused and global programs, and rolling admissions. 209 searches and verifications. 57 programs measured.

After filtering for solo founders, AI automation B2B, and evidence of real traction as a selection criterion: 7 immediately actionable cards, 2 to monitor for upcoming deadlines.

The structural advantage of the AI automation fan-out here isn't speed — it's independence. Each agent independently verified current application status from official sources as of June 2026. Sequential searching by hand would take a day. The parallel approach compresses that to a session. But more importantly, independent verification per agent means one agent's stale result doesn't contaminate the others.

## SpoonAI P0: The 22-Minute Blueprint

This was the tightest, most replicable session of the 72-hour window. Two bugs:

1. New subscribers couldn't receive emails — permanently, not just for the first send
2. `/unsubscribe` returned 404

`scripts/send-email.js` had a subscriber list query that excluded newly registered users. The `/api/unsubscribe` GET endpoint was performing an immediate hard delete instead of redirecting to a confirmation page. The fix: update the subscriber query, change the GET to a 302 redirect, and create the `/unsubscribe` and `/feedback` pages that were missing.

```
/unsubscribe → 200 ✓
/feedback → 200 ✓  
/api/unsubscribe GET → 302 → /unsubscribe?email=... ✓
```

Commit `4a3c598`, deployed, live verified: 22 minutes.

The reason this session ran at 2.5 tool calls per minute while the CoffeeChat session averaged far less is purely scope definition. No open-ended "what should we build?" No exploration phase. Two P0 bugs, both with clear reproduction steps. The Claude Code multi-agent workflow infrastructure doesn't do anything magical here — tight scope definition is just faster, and that's a constraint the developer sets before the first prompt.

## The Session That Lasted Two Minutes and Produced Nothing

Session 8 ended at 2 minutes with zero tool calls. `claude-fable-5` had switched to the `<synthetic>` model indicator and the session was incoherent from the start:

```
There's an issue with the selected model (claude-fable-5[1m]).
It may not exist or you may not have access to it.
```

A single inaccessible environment variable can void an entire session. The fix is procedural: run `/model` to confirm model access before starting any substantive work. If the model isn't responding correctly in the first two exchanges, stop and verify before spending time on prompts that won't execute.

This is the Fable 5 failure mode to watch for. Model access can change between sessions without notice, and detecting it at minute 2 is much better than detecting it at minute 60.

## Memory Files Are the Continuity Layer Between Sessions

All 10 sessions started with `/clear`. Each session re-read project memory files to reconstruct context: `MEMORY.md` plus individual project files. Dental clinic projects use `~/dental-promo/{slug}/clinic.json`. The saju project uses `project_saju_paypal.md`. CoffeeChat uses `project_coffeechat_jobprep.md`.

This is what makes multi-session AI automation coherent rather than repetitive. The June 11 deep research results were the basis for the June 12 payment strategy decision. The sessions are disconnected at the model level, but the memory layer creates continuity at the project level.

The risk is staleness. Memory files accumulate assumptions, and the older they get, the higher the chance that a fact they assert has been superseded by new information. Any empirical result that contradicts a memory file assumption needs to be written back immediately — this happened once during this cycle, when the Etsy payment data forced an update to `project_saju_paypal.md`. The workflow to verify and update memory files is just as important as the workflow to read them.

The session-based model has one other important property: it forces explicit scope. Because `/clear` resets the context, each session has to declare what it's doing. That constraint turns out to be a forcing function for tighter work — you can't casually drift into adjacent features when you have to justify the session's focus from the first prompt.

## What the Numbers Actually Tell You

1,212 tool calls across 10 sessions in 72 hours is a throughput number, but it's not the useful metric. The useful metric is how many parallel work streams ran without interfering with each other.

The CoffeeChat session at 532 calls and the SpoonAI session at 56 calls represent opposite ends of the same spectrum. One was open scope that expanded through orchestration. The other was surgical scope that ran hot from start to finish. Both worked. The difference is in what the developer chose before the first prompt — not in anything the Claude Code model did differently.

The parallel execution model — sub-agents for isolated concerns, background tasks for generation workloads, main context for orchestration — consistently reduced wall time on the design-heavy sessions. Image generation running in parallel with HTML construction is the concrete example: the Fable 5 multi-agent workflow doesn't just let you do more, it lets you avoid blocking on async work that doesn't depend on what you're currently building.

The model error session is a useful reminder that this infrastructure depends on clean environment state. Fable 5 access, git config, Vercel account email — these are preconditions that the AI automation layer can't fix unilaterally. Pre-flight checks before long sessions pay for themselves.

Next cycle: saju payment rail migration, CoffeeChat Vercel deploy, SpoonAI subscriber growth experiments.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
