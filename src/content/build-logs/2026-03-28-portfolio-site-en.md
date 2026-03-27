---
title: "The Translation Button Was Backwards: Claude Code Found 47 i18n Bugs in 24 Minutes"
project: "portfolio-site"
date: 2026-03-28
lang: en
pair: "2026-03-28-portfolio-site-ko"
tags: [claude-code, i18n, astro, debugging]
description: "One prompt about a broken toggle button. Claude Code scanned 6 files, found 47 translation gaps, and fixed them all in 24 minutes — half a day of manual work."
---

The site was live. The translation button said `EN`. Clicking it switched the page *to* English — the opposite of what it should do.

The default language was supposed to be English. The button should show `KO` (meaning "switch to Korean"). Instead, a hardcoded `var lang = 'ko'` had shipped to production, and every user visiting the English version of the site was getting Korean by default.

**TL;DR** One hardcoded line caused cascading i18n failures across 6 files. Claude Code found and fixed all 47 issues in 24 minutes with zero back-and-forth.

## How It Was Caught

The prompt was casual:

> "The translation button isn't working right. The site should be English by default, and the English translation needs to be complete across all sections."

That's it. No file names, no line numbers, no stack trace.

Claude Code started by reading `Base.astro` to understand the translation system. The problem was immediately visible:

```javascript
// Base.astro — initial state
var lang = localStorage.getItem('lang') || 'ko';  // defaults to Korean
```

And it wasn't just that one line. `<html lang="ko">` was hardcoded. The button's initial text was `EN`, which is backwards — if English is default, you should see a `KO` button (the option to *switch*). The whole mental model was inverted.

## What Claude Code Actually Did

The execution log looked like this:

```
Read(13)   → understood current translation architecture
Grep       → mapped every data-ko and data-en attribute across the codebase
Bash(12)   → verified translation coverage per file
Edit(12)   → applied fixes
Agent(8)   → validated translation quality
```

47 tool calls total. 24 minutes. A human doing this manually — opening files one by one, searching for every `data-ko` and `data-en` attribute — would've spent half a day.

Three categories of changes:

**1. Default language flip**

```diff
- <html lang="ko">
+ <html lang="en">

- var lang = localStorage.getItem('lang') || 'ko';
+ var lang = localStorage.getItem('lang') || 'en';
```

**2. Button label inversion**

With English as default, the toggle button needs to say `KO` — showing the *other* option. The initial text was reversed.

**3. Static HTML content defaulting to English**

Before JavaScript runs, the raw HTML is visible for a brief moment. Every element with `data-ko`/`data-en` attributes was rendering its initial content in Korean. Each one needed to default to the English string.

## The Agent(8) Verification Pass

After the fixes, 8 subagents ran a translation quality audit:

> "Check all English translations — accuracy, fluency, typos."

This is where the deeper bugs surfaced. The agents found that `formatDateKo()` in `PostLayout.astro` — a date formatting function — always returned Korean-formatted dates regardless of the current language setting. The function name was a hint that nobody had questioned. `blog/[slug].astro` also had hardcoded Korean strings that the initial scan had missed.

Final scope:

- `src/layouts/Base.astro`
- `src/layouts/PostLayout.astro`
- `src/pages/blog/[slug].astro`

More files than expected going in.

## Why There Was No Back-and-Forth

Most i18n work has a predictable rhythm: fix one thing, discover three more. This session didn't.

The reason: Claude Code spent more time *exploring* than *editing*. Before touching a single line, it ran `Glob(2)` to map the file structure, `Read(13)` to build context, and `Grep` to locate every `data-ko`/`data-en` usage site-wide. The exploration phase was longer than the fix phase.

That's the structural difference from manual work. A human would've opened `Base.astro`, changed the default, and called it done. The `formatDateKo` bug in `PostLayout.astro` would've been caught in QA — or not caught at all.

## The Other Sessions That Day

This was one of 8 sessions running that day, most across different projects:

- **spoonai i18n** — 55 tool calls
- **saju_global Lemon Squeezy payment integration** — 16 tool calls
- **refmade reference site** — 186 tool calls, 30 parallel agents
- **AgentCrow enhancements** — 598 tool calls, 6h 29min

The refmade session deserves a mention. 30 agents ran simultaneously, each tasked with rebuilding a different reference site — Stripe, Linear, Notion, Vercel, Arc, Raycast — from screenshots. One agent implemented, another verified pixel-accuracy against the original (target: 95%+ match).

```
Agent("Rebuild 074-stripe reference HTML")  → completed
Agent("Rebuild 075-linear reference HTML")  → completed
Agent("Rebuild 077-notion reference HTML")  → completed
... 27 more
```

That's the pattern: decompose independent work, dispatch in parallel, collect results. AgentCrow handles the orchestration.

## Does the Productivity Gain Actually Hold Up?

The math isn't complicated. 24 minutes vs. half a day for this session. 6h 29min vs. multiple days for the AgentCrow session. The absolute time savings scale with task complexity.

The caveat worth knowing: Claude Code errs toward broad scope. It finds more than you asked for and fixes more than you specified. Most of the time that's useful. Occasionally it introduces changes you didn't intend.

The `console.log` rule in `CLAUDE.md` exists for exactly this reason — debug code left during exploration was committed once. A written rule prevents it from happening twice.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
