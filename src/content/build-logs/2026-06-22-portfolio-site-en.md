---
title: "6 Sessions, 388 Tool Calls: Running 4 Projects in One Day with Claude Code and Multi-Agent Workflows"
project: "portfolio-site"
date: 2026-06-22
lang: en
pair: "2026-06-22-portfolio-site-ko"
tags: [claude-code, multi-agent, workflow, ai-automation]
description: "6 Claude Code sessions, 388 tool calls, 4 projects: i18n debugging, 12-agent business plans, and funding analysis with adversarial verification in one day."
---

388 tool calls. 6 sessions. 4 separate projects — all in one day. The breakdown reveals something non-obvious about where multi-agent AI actually earns its keep.

**TL;DR** Multi-agent workflows compress large-text work — reports, business plans, funding analysis — dramatically. For code tracing and bug hunting, a tight Read + Bash + Edit loop beats spawning agents. Model quality matters: Opus 4.8 follows agent instructions reliably; weaker models drift.

## 116 Bash Calls to Find a Bug That Wasn't What It Looked Like

Session 2 was the longest single-thread session of the day. The symptom: interview UI buttons rendering raw i18n keys like `interview.room.endInterview` instead of translated text.

First guess — missing translations — was wrong. Both `en.json` and `ko.json` had the keys. The call site was `tr("room.endInterview")`, exactly correct. Still: raw keys in the UI.

Rephrasing the prompt changed the trajectory:

```
Follow the next-intl message loading path and find out why raw keys are being rendered
```

Claude traced through `i18n/request.ts` and found `scopeClientMessages(await getMessages(), strippedPath)` — an optimization function that selects which i18n namespaces to send to the client, keyed off the `x-cc-pathname` header. When the header was empty, `strippedPath` fell back to `/`, which excluded the `interview` and `portfolio` namespaces entirely from the client payload. One buried infrastructure function, silently starving the client of translations.

The fix was targeted. Getting there took 116 Bash calls — spinning up the dev server, confirming raw keys in the actual rendered HTML, patching, re-checking. The session also added `playwright.config.ts`, fixed a 320px mobile header overflow, and resolved button text wrapping on small screens.

The lesson: when a bug doesn't match its symptoms, stop grepping for the symptom and trace the data path from source to render.

## Turning "Medium/High/Low" Into Actual Pass Probabilities

Session 4 started with `/effort ultracode`. The goal: take a government funding program shortlist and produce defensible, numerical pass-probability estimates — not qualitative tiers.

The existing report had evaluations like "upper-medium / medium / low." That's useless when you're deciding where to spend proposal-writing time. The prompt:

```
For preterview and dental, give me the programs with the best fit and highest probability,
how much they pay, and a blunt pass probability. Simple report format.
```

Single-point estimates carry bias. Claude launched a dynamic workflow on its own judgment: 13 programs × business units through independent estimation, then piped into an adversarial recalibration pass — a skeptical agent whose job is to argue down optimistic numbers. Output landed at `~/reports/funding-conclusion-2026-06-22.md`.

The same session designed the first payment path for preterview. Six acquisition lenses evaluated in parallel: Reddit/niche-forum, Product Hunt, direct outreach, and others. Ranked by expected value. Conclusion: Paddle as Merchant of Record. No corporate entity, $0 budget, solo operator — Paddle absorbs tax and VAT overhead that would otherwise block international sales at this stage.

## 12 Agents, 1.27M Tokens, 34 Minutes

Session 6 was the headline of the day. The ask: write technically and commercially strong business plans for two ventures — dental marketing automation and preterview — covering both Korean government PSST grants and private VC/accelerator IR.

Claude scaffolded a working directory at `~/funding/bizplan-2026-06-21/` and launched 12 agents across three phases:

**Foundation (6 parallel)**
- Product profile × 2 (one per venture)
- Government/public non-equity programs research
- Private VC and accelerator landscape
- PSST grant winning blueprint
- Private IR winning formula

**Plans (2 parallel, high effort)**
- Full business plan per venture: PSST + IR narrative + 3-year financials + unit economics + technical architecture

**Sequential finish**
- Strategy synthesis → adversarial critique → final assembly

34 minutes. ~1.27M tokens. `REPORT.md` at 7,747 words. Output went through `md2report/report.py` — a Pretendard-font, print-optimized renderer — for HTML and PDF.

What made this work wasn't raw parallelism. The PSST blueprint and IR formula agents ran while product profiles were still being written. The adversarial critique had full visibility across both business plans before synthesizing. No single context could hold all of that concurrently. Sequential execution would have taken hours.

## One Sentence Triggered Three File Changes

Session 3 — saju_global X bot — is the shortest and cleanest case.

The triggering message: "The bot posting feels off." That's it.

Diagnosis: not a spam bot by structure — the cron posted once every 6 hours via the official X API. The problem was predictability and format. Fixed 6-hour intervals are easy to fingerprint as automation. Thread-format posts look like automated spam regardless of content quality.

Three targeted patches:

**`rotate.ts`** — removed `slotCounter` (the fixed 6h logic), replaced with 4 irregular daily slots that rotate based on date. Same posting frequency, unpredictable timing.

**`formats.ts`** — added `ACTIVE_FORMATS` config and a thread-format kill switch. Threads off.

**`generate.ts`** — tightened AI-language scrub patterns, upgraded the model.

`vercel.json` cron changed from `20 */6 * * *` to `*/15 * * * *`. Cron fires every 15 minutes; the actual publish decision is gated internally by the slot schedule. This separates trigger cadence from publish logic — easier to tune without touching cron syntax again.

25 Bash calls, 13 Reads, 10 Edits. One `AskUserQuestion` mid-session where intent was ambiguous. Lightweight work, but the clarity came from one sharp diagnostic pass before touching any code.

## What 388 Tool Calls Actually Says

Tool breakdown: Bash 210 (54%), Read 63 (16%), Edit 45 (12%).

Bash dominance has two sources. First, verification-heavy work: running dev servers, checking rendered HTML, running Playwright. Second, multi-agent workflows — each agent issues multiple Bash calls independently, so the count compounds.

Where dynamic workflows paid off most: the business plan and funding analysis. These map naturally to pipeline → adversarial verify. Many independent research angles feed a synthesis that needs cross-item comparison. Parallelism isn't the goal — running the skeptic pass while generators are still working is.

Where a direct loop outperformed agents: the i18n bug hunt. Tracing a data path through `i18n/request.ts` required tight feedback between reading code and running the server. Context switching into subagents would have broken that loop. 116 Bash calls, but each one purposeful — and it found the root cause.

Tool call volume isn't a proxy for work quality. The i18n session used 116 Bash calls to find a single root cause. The business plan session used fewer per agent but produced 7,747 words of structured output. Task structure determines the right approach. That's not a subtle insight — but it's the one that actually changes how you allocate sessions.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
