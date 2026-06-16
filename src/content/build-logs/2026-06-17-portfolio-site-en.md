---
title: "From 'AI Developer' to One-Man Studio: Repositioning a Portfolio with Claude Code"
project: "portfolio-site"
date: 2026-06-17
lang: en
pair: "2026-06-17-portfolio-site-ko"
tags: [claude-code, portfolio, positioning, case-study, astro, react]
description: "10 files, 418 lines: rebuilt Hero copy, project cards, and capabilities to shift from tech showcase to client-facing case studies with Claude Code."
---

The old H1 said "I build AI products, fix them, and run them every day."

Every word was accurate. None of it mattered to someone deciding whether to work with me.

10 files, 418 net lines later — almost none of it adding features. This was a rewrite of how the portfolio *presents* work, not what work it shows. The data model changed. The component structure changed. The positioning changed. The CSS followed.

**TL;DR**: Shifted the frame from "here's what I know how to do" to "here's a business problem I solved and what I shipped." Doing that right meant touching `home.ts` first, then `Projects.tsx`, then Hero copy, then Capabilities — in that order, because each layer depends on the previous.

## The Original H1 Lied (By Omission)

"I build AI products, fix them, and run them every day" is a statement about my activities. The reader translates it as: *so what?*

The replacement:

> **I turn small business problems into AI products, automation, reports, and web MVPs.**

That's the same thing, described from the other direction. Same work. Different angle of entry.

The byline got replaced too. The old version read like a dev diary: *"I build LLM services, ops automation, and small web products solo, end-to-end. Code I wrote yesterday is running today, and I log it all here."* — technically accurate, functionally a journal entry.

New version: *"Jidong builds solo. LLM services, ad and content automation, diagnostic HTML/PDF reports, landing pages, and ops tools. Not a platform — a small system you can actually use right now."*

The `role` metadata line changed from `solo AI builder` → `AI product studio`. The `stack` line got replaced entirely with `output`: `Products · Automation · Reports`. Tech stack belongs on a resume. A portfolio should show deliverables.

## Why Project Cards Are Usually Just Tech-Stack Resumes

The previous card layout: title + tagline + stack badges. It answers "what did you build?" It doesn't answer "why did you build it?" or "did it work?"

That structure is how most developer portfolios read — a curated list of things you know how to do. That's fine for job hunting. It's not a sales document.

The replacement adds two fields per project: `problem` and `output`. Six new fields landed in `home.ts`:

```ts
caseStatus?: CaseStatus;   // 'operating' | 'verifying' | 'experimenting' | 'on hold'
problemKo?: string;
problem?: string;          // One-line business problem
didKo?: string;
did?: string;              // What I actually did
outputKo?: string;
output?: string;           // What shipped
```

These are optional — existing projects keep working without them. But every active project got filled in.

`Projects.tsx` picked up a `p-case` block that renders the problem and output side by side inside each card. Grid dropped from 3 columns to 2 — more content per card means cells can't be narrow.

The concrete entries:

```ts
// FortuneLab (Korean astrology web app)
problem: 'Feeding raw prompts to an LLM mixes date calculation with interpretation — you get hallucinated birthdates.'
did:     'Hardcoded the calendar math in code; LLM touches the interpretation layer only.'
output:  'Web service · Payment conversion in validation'

// ContextZip (Rust CLI tool)
problem: 'Agent tasks were burning context budget on terminal noise — build output, test logs, irrelevant stderr.'
did:     'Built a Rust filter that sits before the Claude Code hook and strips it.'
output:  'Rust CLI · OSS'
```

"What problem? How did you solve it? What shipped?" — three questions, three lines. That's what turns a portfolio into something a client reads differently than a resume.

## Status Badges That Actually Mean Something

The old status options were `live / oss / dev / beta`. "Beta" means nothing. It's a hedge that signals low confidence without communicating anything actionable.

The new `CaseStatus` type has four values:

- `operating` — it's live and running
- `verifying` — shipped, watching real-world response
- `experimenting` — testing an idea in code
- `on hold` — paused intentionally

These map to what's actually true. You can look at a card and immediately understand the project's state.

`Projects.tsx` has a `cardMeta` function that reads `caseStatus` and converts it to a CSS class (`StatusTone`). `home.css` got three color tokens:

```css
/* verifying → amber warning */
.status-verify { color: var(--warn); }

/* experimenting → muted gold */
.status-lab { color: #6f5a1f; }

/* on hold → tertiary ink */
.status-hold { color: var(--ink3); }
```

Operating projects get the default accent green. Verifying gets amber — it's real but unproven. Lab gets a desaturated gold — active but experimental. On hold gets ink-tertiary — it exists, it's just not moving.

## Rebuilding Capabilities: What I Ship, Not What I Know

The previous four capability items: *AI products, automation, web product, writing.*

"Writing" was the most obviously wrong. Build logs are artifacts, not services. Listing "writing" as a capability is like a chef listing "tasting food."

The replacement four:

**AI MVP** — Narrow the problem → ship LLM + auth + payments + UI + deploy in one pass.

**Automation** — Ad research, news digests, content pipelines, recurring checks: script + agent, not headcount.

**Diagnostic Reports** — HTML/PDF deliverables. Not fake dashboards — decision-support output you can actually hand to someone.

**Web / Landing / Ops Tools** — Design, deploy, domain, analytics — bundled, not piecemeal.

"Diagnostic Reports" replaced "writing" specifically because it has a tangible form: a dental clinic diagnostic (HTML/PDF, real findings, delivered as a file) is a service. A blog post isn't.

## What Three Concurrent Projects Had in Common

This rewrite came out of two days of working on three separate projects simultaneously: a coffeechat AI interview SaaS, FortuneLab (Korean astrology), and a dental clinic ad campaign.

The through-line was visible only in retrospect: in every case, the business problem came before the technical implementation. Not in a process-diagram sense — in the sense that getting the problem definition wrong made the technical choices irrelevant.

For the interview SaaS, the first real work was pricing math: API cost → margin → user price, working backward from sustainable unit economics before writing a single route.

For the dental clinic, the brief was "top-tier quality without looking AI-generated." Tech choices followed that constraint — they didn't define it.

For FortuneLab's GTM analysis, the conclusion was that traction signals were too thin for the current monetization plan. That changed the strategy, which changed the roadmap.

A portfolio that leads with "I know TypeScript + LLM APIs" doesn't communicate any of that. A portfolio that leads with "here's a pricing problem I solved in a SaaS, here's a content quality constraint I designed around" — that one does.

## The Change Log

| File | What changed |
|---|---|
| `src/data/home.ts` | `caseStatus` type + problem/did/output 6-field schema, filled in for all projects |
| `src/components/home/Projects.tsx` | `StatusTone` type, `p-case` block, 2-column grid, `primaryLabel` dynamic |
| `src/components/home/Hero.tsx` | H1 copy, byline, role/output metadata rows |
| `src/components/home/Capabilities.astro` | All four capability items replaced |
| `src/styles/home.css` | verify/lab/hold status colors, `f-case` 3-col grid, `p-case` block styles |

Tool breakdown: mostly `Edit`. Schema change → component update → CSS addition — sequential dependencies, so no parallel agents. Data model has to stabilize before component can reference the new fields; component has to exist before CSS selectors have anything to target.

Total: 10 files, 418 net lines. No new routes, no new APIs, no new dependencies. Just positioning work that happened to require a schema change to express correctly.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
