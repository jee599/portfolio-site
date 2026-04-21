---
title: "One Prompt, 106 Tool Calls: A Claude Code Homepage Redesign Breakdown"
project: "portfolio-site"
date: 2026-04-22
lang: en
pair: "2026-04-22-portfolio-site-ko"
tags: [claude-code, astro, homepage, refactor, agent-orchestration]
description: "One vague prompt kicked off 106 tool calls and a 3h26m Claude Code session. Breaking down what happened, what cost time, and what I'd do differently."
---

One line. 106 tool calls. 3 hours and 26 minutes.

That's what it cost to turn "apply the deploy folder to jidonglab" into a working homepage redesign. This is a post-mortem of where the time went, what the agent got right, and what I'd change.

**TL;DR** — Merged files from `~/portfolio/deploy/` into `portfolio-site`. Created `src/components/home/`, `src/data/home.ts`, and `src/styles/home.css`. Refactored `index.astro` from a 19.2KB monolith into a clean composition layer. 30% of tool calls were pure exploration that better upfront context would have eliminated.

## The Two Ambiguities I Embedded in One Sentence

The prompt was:

```
"deploy 폴더에 있는거 jidonglab에 다 적용해줘."
("apply everything in the deploy folder to jidonglab")
```

Two resolvable-but-not-obvious references packed into seven words:

1. **Where is `deploy`?** Not inside the project directory. It was sitting at `~/portfolio/deploy/` — a sibling of the repo, not a subdirectory of it.
2. **What is `jidonglab`?** An alias I use for the project. The actual repo name is `portfolio-site`.

The agent had to explore before touching a single file. It traversed my home directory, located the folder, then mapped the alias to the real repo path:

```bash
# Simplified version of what the agent actually ran
find ~/ -name "deploy" -type d 2>/dev/null
# → ~/portfolio/deploy found

ls ~/portfolio/portfolio-site/src/pages/index.astro
# → 19,200 bytes confirmed
```

That discovery phase alone burned through multiple `Bash` and `Glob` calls. A prompt written with full paths:

```
"Apply ~/portfolio/deploy/ to ~/portfolio/portfolio-site/"
```

…would have cut the first 10 minutes before any real work started. The agent *can* resolve ambiguity — but you're paying for every step of that resolution.

## What Was Wrong with the Existing index.astro

The homepage was a single `index.astro` file. 19.2KB. Everything inline: markup, logic, hardcoded strings, component-specific styles. No extraction, no separation of concerns. The kind of structure that's totally reasonable when you're shipping fast and completely painful when you want to maintain it.

The specific problem it creates with AI-assisted development: the agent needs to read and comprehend the full file before safely modifying any part of it. A 19KB Astro file has a lot of surface area to hold in context simultaneously. Every re-read adds latency and cost.

The agent asked whether to:
- **Option A**: Paste the new sections directly into the existing structure
- **Option B**: Extract components and restructure before integrating new content

I answered: "do it however you recommend."

## How the Agent Decided — and Why It Was Right

The answer came from reading the `deploy` folder, not from any explicit instruction.

The folder wasn't a dump of raw HTML. It had structure: named files for each homepage section, a separate data file, a CSS file scoped to the homepage. The intent was legible from the organization alone. The agent read that structure as a signal that componentization was the intended end state.

The resulting architecture:

**`src/components/home/`** — one `.astro` component per homepage section. Hero, about, projects, skills, contact — each a self-contained unit with its own props interface.

**`src/data/home.ts`** — all hardcoded strings and data objects extracted into a typed TypeScript module. Want to update the homepage headline? Edit one file, don't touch markup.

**`src/styles/home.css`** — styles that are specific to the homepage and would pollute global scope if left inline. Imported in `index.astro`, not in the global stylesheet.

**`index.astro`** — reduced to imports and layout composition. The file that was 19.2KB became a thin orchestration layer.

This is the right architecture for a content site. `home.ts` becomes the single source of truth for homepage content — a copywriter could update it without ever opening a component. Components stay focused and independently testable.

The key point: delegating structural decisions to the agent works when the codebase already shows intent. The organized `deploy` folder gave the agent evidence to reason from. If I'd handed over a single mixed HTML blob, the agent would have had to guess at the intended structure — and guesses are less reliable than evidence.

## 106 Tool Calls: Where the Time Actually Went

**Exploration — ~30 calls (~28%)**

Reading the `deploy` folder structure. Reading `index.astro` in sections. Checking `src/content/config.ts` for schema patterns. Looking at `tailwind.config.mjs` for design tokens. Reading existing components to understand naming conventions.

This phase is necessary — the agent needs context to make good decisions — but it's compressible. With an explicit context block at the start of the prompt, a meaningful chunk of this could be front-loaded.

**Writing — ~40 calls (~38%)**

Creating each component under `src/components/home/`. Writing `home.ts` with TypeScript interfaces. Creating `home.css`. Iteratively editing `index.astro` as components were extracted and the import list grew.

This is the actual work. Hard to compress further — each `Write` or `Edit` call is doing real output.

**Build verification — ~20 calls (~19%)**

After each significant change: `astro check`. Type errors in the freshly written `home.ts` — a few `string | undefined` cases that needed explicit narrowing. Import path corrections. One case where a component expected a prop shape that didn't match what `home.ts` was exporting.

The iterative build-check-fix cycle is expected in any refactor of this size. The Astro compiler is strict enough that you're going to hit type errors when moving data across module boundaries.

**Subtask delegation — ~15 calls (~14%)**

`Agent` calls for work chunks that could run independently: reading the deploy folder structure while simultaneously reading the existing codebase, cross-referencing Tailwind classes against the design token file.

The 30% exploration figure is the one worth optimizing. In a session where I front-load the relevant file paths and a brief description of current state, that percentage should drop to 12–15%.

## The Week in Context: 600 Tool Calls Across Six Sessions

This homepage work was the last of six sessions spanning April 17–21. The others ran in parallel, on separate codebases.

**Session 2 — DEV.to Auto-Publish Pipeline (148 tool calls)**

Built a `launchd` plist + modified GitHub Actions to auto-publish posts on a 6-hour schedule. The critical change was `publish.yml:205` — a hardcoded `"published": False` that was preventing the automation from actually publishing anything. Replacing it with a `should_publish` variable reference was one line. Finding *why* posts weren't publishing took longer.

**Session 3 — spoonai.me Bug Fix (162 tool calls)**

`ArticleCard.tsx:148` was rendering the full article title as the source label instead of the publisher name. A `post.source.title` was pulling the wrong field. The fix touched two locations in the skill spec, plus a batch replacement across 24 existing Markdown files where domain strings needed to become publisher names.

**Session 4 — Dental Ad Research (182 tool calls)**

12 agents running in parallel. Each produced a 2,500–4,500 word report covering a different segment of the Korean dental advertising market. Output landed across ~10 files in `dentalad/ads-research/reports/`. This session is the clearest example of what multi-agent orchestration actually makes possible: a research task that would have taken a full day of manual work completed in a single session, with cross-referenced findings across agents.

**Sessions 5 and 6** — smaller tasks, ~80 tool calls combined.

Total for the week: roughly 600 tool calls. Solo, this is a week of work. With Claude Code, it's five parallel evenings.

## What Actually Works in Prompts

### Works: delegating structural decisions when intent is in the code

```
"do it however you recommend"
```

When the codebase shows clear intent — organized files, consistent naming, existing patterns — this works reliably. The agent reads the evidence and makes a defensible choice. You review the output, not the reasoning process.

This breaks down when the codebase is contradictory or ambiguous. If you have three different component patterns and no clear winner, you'll get an arbitrary pick. Fix the codebase ambiguity before delegating decisions about it.

### Doesn't work: aliases and missing paths

```
"apply the deploy folder to jidonglab"
```

Aliases are for humans. The agent can resolve them, but resolution has a cost. Every alias is a search operation. Every ambiguous path is an exploration branch. Rule: all file paths in prompts should be absolute. All project names should be actual repo names.

### A pattern that's starting to work consistently

A short upfront context block before any multi-file session:

```
Working dirs:
  source: ~/portfolio/deploy/
  target: ~/portfolio/portfolio-site/

Relevant files:
  - src/pages/index.astro (current homepage, 19.2KB monolith)
  - src/content/config.ts (schema reference)
  - tailwind.config.mjs (design tokens)

Goal: extract homepage sections into src/components/home/,
      content data into src/data/home.ts,
      homepage styles into src/styles/home.css
```

That's 12 lines. It costs ~30 seconds to write and probably eliminates 20+ exploration calls. The payoff is asymmetric.

## The Files That Changed

```
M  src/pages/index.astro        # reduced from 19.2KB to import shell
?? src/components/home/         # new: per-section components
?? src/data/home.ts             # new: extracted content data
?? src/styles/home.css          # new: scoped homepage styles
```

Still uncommitted. Waiting on `astro build` clean pass before pushing.

## What I'd Do Differently

**Use absolute paths, always.** No aliases, no shorthand. The 2-second investment of typing a full path saves a multi-call search.

**Front-load a context block.** 10–12 lines describing working directories, key files, and the goal. This makes the exploration phase much shorter because the agent starts with a map instead of building one.

**Separate "read + plan" from "execute" for large refactors.** For a change involving 40+ write operations, a checkpoint to review the plan before execution starts would catch structural decisions that are hard to reverse mid-session.

**Match the organization of input files to the intended output structure.** The `deploy` folder was already organized the way I wanted the output to be organized. That's why the agent made good structural decisions. Garbage-in on the input side means more ambiguity for the agent to navigate.

The result of this session is clean. But the 106 calls for what should have been a 60-call job signals that my prompting for file-system operations still has room to improve.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
