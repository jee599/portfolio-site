---
title: "1,316 Tool Calls Across 5 Projects: Running Parallel Claude Code Sessions for 48 Hours"
project: portfolio-site
date: 2026-06-13
lang: en
pair: 2026-06-13-portfolio-site-ko
tags: [claude-code, claude-fable-5, multi-agent, workflow, automation]
description: "11 sessions, 1,316 tool calls, 5 concurrent projects over 48 hours — how async subagents, memory files, and tight scope made solo-dev parallelism practical. Real numbers, real blockers."
---

532 tool calls in a single session. That's what it took to ship CoffeeChat from a blank prompt to a full-stack app with auth, PayPal payments, TTS, i18n across seven locales, and an admin dashboard — all in 27 hours and 48 minutes. The other four projects running in parallel that week: 356 calls for a complete saju app redesign, 117 for a CoffeeChat animation overhaul, 82 for a dental clinic pitch deck, and 56 for a P0 hotfix that went from bug report to live deploy in 22 minutes. Total across 11 sessions: 1,316 tool calls. All on `claude-fable-5`.

**TL;DR** — June 11–13, 11 sessions, 1,316 tool calls, five projects running concurrently. The bottleneck was never model speed. It was context separation and scope definition.

## A 22-Minute Session and a 27-Hour Session in the Same Week

Here's the full breakdown before getting into individual projects:

| Session | Duration | Tool calls | Main work |
|---|---|---|---|
| CoffeeChat fullstack | 27h 48min | **532** | auth + PayPal + TTS + i18n + admin |
| Saju redesign | 25h 26min | **356** | open-design + gpt-image-2 |
| AEO cold-email strategy | 24h 48min | 105 | strategy research + Hermes engine |
| CoffeeChat UI polish | 9h 5min | 117 | main animation overhaul |
| Dental ad report | 9h 57min | 62 | deep research + HTML report |
| Dental clinic PPT | 7h 6min | 82 | 9-slide owner briefing deck |
| SpoonAI P0 | 22min | 56 | bug fixes + live deploy |
| Daemoon status check | 5min | 6 | current state audit |
| Model error session | 2min | 0 | claude-fable-5 inaccessible |

Short sessions have the highest tool-call density. SpoonAI ran 56 calls in 22 minutes — 2.5 per minute. Longer sessions include async agent wait time, which inflates elapsed hours without adding tool calls.

The variance here is the point. When scope is locked tight, the pipeline runs hot. When scope is open-ended, session length is dominated by orchestration gaps rather than model latency.

## What "All the Ops Tooling" Actually Means at 532 Calls

The initial CoffeeChat prompt was short:

> "Let users log in to the admin site with email and password, per user. Show token usage. Add all the ops tooling you'd need. Payments too. Global."

"All the ops tooling" had no natural stopping point. The session expanded through: Turso DB layer → JWT session cookie auth → credit calculation module → PayPal across three endpoints (`create-order`, `capture`, `webhook`) → admin user list and detail views with bulk actions → next-intl for seven locales → OpenAI TTS → portfolio deep-dive interactive UI → resume import, template system, and PDF export. Over 70 files created or modified.

The pattern: functional decomposition into parallel subagents. Portfolio enhancement UI, resume import/template/export, and design QA agents ran concurrently, each reporting back via task notification. The main context handled only orchestration — routing decisions, reviewing outputs, resolving conflicts. No feature work in the main thread.

This is what multi-agent workflows actually look like at this scale. Not parallelizing compute — isolating concerns so a design QA agent has no dependency on the PayPal webhook implementation, and neither blocks the other.

Then, after 25 hours of work, Vercel blocked the deploy:

```
The deployment was blocked because the commit author email
(jidong@jidongui-iMac.local) is not valid.
```

`git config user.email` was set to the iMac's local hostname. One line fixed it:

```bash
git config --global user.email "jd@jidonglab.com"
```

But this is the category of blocker Claude Code can't reach — environment state outside the repository. These always surface at the worst moment. The only defense is checking `git config` explicitly before starting a long session.

## 57 Programs Audited in 30 Minutes via Dynamic Fan-Out

One session included a research request with undefined scale: "Find programs comparable to Primer — solid funding opportunities for our situation."

The approach:

> "Spinning up 5 parallel search agents across 5 categories: government programs, private accelerators, corporate and bank open innovation, AI-focused and global programs, and rolling-admission programs."

Five agents running concurrently. 209 searches and validations across all five categories. 57 programs audited and categorized.

Output: a deadline-sorted table filtered by three criteria — solo-founder eligible, AI automation B2B focus, and minimum traction required.

The manual version of this is dozens of Google searches, reading each program announcement individually, building a spreadsheet. The structured result arrived in under 30 minutes.

This is where the fan-out model shows its clearest advantage. Research across disjoint search spaces has no data dependency between categories — government program results don't gate accelerator searches. Independent verification per agent also means one agent's stale result doesn't contaminate the others.

## A Redesign That Started With a Payment Processor Audit

Session 2 opened with a strategic question before any design file was touched: "If we use traditional saju framing, won't payment processors reject the account?"

The answer was already in memory from a deep research run on June 11. The relevant data: an Etsy natural experiment. A shop leading with "AI Reading" had 0 sales after one month. A shop with a human-persona presentation (a Korean fortune teller named Yeonhwa) ran for a year with 464 sales, 130 reviews, and a $34 average order value.

More importantly: payment processor reviewers evaluate **service category**, not landing page copy. Whether you call it "AI report" or "traditional saju consultation," it's a divination product — that's the classification that matters. Repackaging doesn't solve the problem. Moving to a payment rail that permits divination services does.

With that settled, the redesign moved forward under the "Midnight Almanac" concept: deep ink indigo + gold hairline accents + Fraunces serif headings. The 3D background was ported from a live Three.js component on another project, with star colors shifted to gold tint and drift velocity reduced.

Iteration path: v1 (static layout, validates typography) → v2 (3D starfield + parallax, tests atmosphere) → v3 (gpt-image-2 photorealistic hero assets).

The gpt-image-2 generation ran as a background `Task` while v3 HTML was being built. When the generation notification arrived, images dropped in. This is where parallel processing saved actual wall-clock time — image generation is pure latency, and it ran concurrently with layout work.

Feedback at v2: "The rotating saju chart looks tacky. More trendy and technical."

Every SVG chart got stripped. That's the value of iterating to a real artifact before requesting feedback — you need something concrete to react to.

## SpoonAI P0: Two Bugs, 22 Minutes, One Deploy

The tightest, highest-density session of the cycle. Two bugs surfaced during a state audit:

1. Newly registered subscribers were permanently excluded from email sends
2. `/unsubscribe` returned 404

The subscriber list logic in `scripts/send-email.js` had a query gap that filtered out users registered after a certain cutoff. Fix: rewrite to pull all active subscribers regardless of registration date.

For unsubscribe: `GET /api/unsubscribe` was immediately deleting records without a confirmation step. Changed to a 302 redirect, then built the missing pages:

```
/unsubscribe → 200 ✓
/feedback → 200 ✓
/api/unsubscribe GET → 302 → /unsubscribe?email=... ✓
```

Commit `4a3c598`, deployed, live verified. Total time: 22 minutes.

The speed came from scope clarity, not model speed. During the state audit, the first output was: "New subscribers are permanently excluded from email sends + unsubscribe endpoint returns 404." Two P0s identified before any fix work began. No exploration, no open questions. Locked scope compresses execution time more reliably than any other variable.

Compare to CoffeeChat: "all necessary ops tools" left scope undefined. 532 tool calls and 70+ modified files later, expected features like 2FA didn't make it in, and unrequested features like Usage CSV export appeared. Open prompts let the model define scope — sometimes that's fine, often it's not. The non-scope list matters as much as the scope itself.

## The Session That Died in 2 Minutes

Session 9 ended with 0 tool calls and 2 minutes elapsed. `claude-fable-5` became inaccessible and fell back to a `<synthetic>` model state:

```
There's an issue with the selected model (claude-fable-5[1m]).
It may not exist or you may not have access to it.
```

One environment configuration issue voids the entire session. Model access problems don't always surface at startup — they can appear when the model is first invoked. The habit to build: run `/model` to verify active model before any substantive work. If the first two exchanges feel wrong, stop and check before spending more prompts.

## Memory Files Are the Infrastructure Between Sessions

All 11 sessions started with `/clear`. Context was restored from per-project memory files — `MEMORY.md` plus individual topic files. Dental project: `~/dental-promo/{slug}/clinic.json`. Fortune-telling: `project_saju_paypal.md`. CoffeeChat: `project_coffeechat_jobprep.md`.

The June 11 deep research was what grounded the June 12 payment processor decision. The session boundary didn't break the reasoning chain — it was in a file.

Two failure modes to track:

**Stale assumptions.** Memory files are snapshots. They don't self-update when live results contradict cached claims. Any experiment that invalidates a stored assumption needs an immediate file update. Stale data gets cited with the same confidence as fresh data.

**Open scope.** Vague prompts let the model define what "all the tools" means. For any large request, spelling out what's not in scope matters as much as what is. CoffeeChat taught this the hard way.

## What 1,316 Tool Calls Actually Shows

The number itself isn't the useful metric. What matters: how many parallel work streams ran without interfering with each other, and which bottlenecks remained.

Work that compresses well with this model: independent feature development, broad research across disjoint search spaces, iterative design with fast feedback cycles, background generation workloads.

Work that doesn't compress: environment debugging. Git config, model access, deployment configuration — these are one-line fixes when caught, but they require manual discovery. No amount of parallel agents helps here.

If the solo dev bottleneck is context-switching overhead between projects, or blocking on serial research and generation latency, async subagents directly address those. If the bottleneck is unclear requirements or environment state, they don't. The distinction is worth being precise about.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
