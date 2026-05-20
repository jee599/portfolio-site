---
title: "Rejected Apple Clone to Codex Approval: Redesigning a Dev Portfolio in 27 Sessions (350+ Tool Calls)"
project: "portfolio-site"
date: 2026-05-20
lang: en
pair: "2026-05-20-portfolio-site-ko"
tags: [claude-code, redesign, astro, react, tailwind, codex]
description: "Apple-style mock rejected, 10 home components rewritten from scratch, 2 Codex cross-validation passes, and 5 rounds of copy editing to kill the AI-generated feel."
---

The previous design got rejected before a single line of implementation code was written.

"Apple-style white space, oversized type, card-based layout" — that was the verdict. jidonglab isn't a product landing page. It's the operational log of a solo builder. A generic AI template feel was exactly what it couldn't be.

**TL;DR** Rewrote 10 home components from scratch, ran Codex cross-validation twice, and spent more rounds on copy than on code. The two recurring feedback notes: "remove translated-sounding phrases" and "stop exposing internal toolchain details in public copy."

## The Mock That Got Rejected

The previous session produced a Swiss-studio cream/acid aesthetic: 104px serif headline, Instrument Serif italic, Space Grotesk display. It looked like an agency landing page. The user rejected it explicitly and listed three requirements instead:

- "Developer lab + personal publishing + operational log + project index" feel
- No generic AI templates, excessive 3D, or hollow hero copy
- Information density beats type spectacle

First step: understand the codebase. Read through `src/components/home/` for existing components, `src/data/home.ts` for data structure, `src/styles/home.css` for styles. The existing code was far enough from the new direction that a full rewrite was effectively necessary.

Design system declaration before touching any component. JetBrains Mono for section kickers, status labels, dates, and project metadata. IBM Plex Sans KR for body text. Green `#00c471` as accent, but never decorative. Section separators via 1px border + monospace kicker.

## 57 Tool Calls, 10 Components Rewritten

Started with `home.css` — wiped the existing styles and rebuilt from the new design system. Then rewrote components one by one:

- `Hero.tsx` — short identity statement + current active status
- `NowStrip.astro` — three live status indicators (last commit, build status, active project)
- `Projects.tsx` — featured (1) + active grid (3) + indexed archive (rest)
- `ShipLog.astro` — last 3 build logs
- `Writing.astro` — recent posts list
- `About.astro`, `Footer.astro`, `Topbar.astro`, `Lab.tsx` — created new

`Projects.tsx` took the most work. Featured project renders large with a visual. Active projects sit in a 2×2 grid. The rest appear as a monospace index. All data is centrally managed in `src/data/home.ts`.

The session hit max turns mid-way. After reconnecting, ran `git diff` to assess state, then continued and finished the remaining components through build validation:

```bash
npm run build
# ✓ Built in 8.23s
```

## First Codex Pass: 4 Issues Found, 1 Blocking

After implementation, ran Codex CLI for cross-validation. Result: `request-changes`.

One blocking issue. In `Projects.tsx`, mobile CSS hid elements by targeting `.desc` and `.stack` classes — but the header `<span>` elements didn't carry those classes. Below 960px, the header column count misaligned with the row grid. Fix: add the same classes to header spans.

Three non-blocking issues, addressed at the same time:

- Added `prefers-reduced-motion` media query to `home.css` (pulse animation)
- Removed empty `data-ko="."` span in `Hero.tsx`
- Restructured `<strong>` inside `<p>` in `ShipLog.astro` — nesting conflicted with the language-switching script

Second Codex pass: `approve`. No blocking issues, build passed, `git diff --check` clean.

## Five Rounds to Kill the AI-Generated Voice

After build validation, user feedback: "Design is solid. But the copy reads like a translation and has information I don't want public."

Looking at actual sentences confirmed it. Words like "operations index," "AI builder," and "experiments" showed up repeatedly. Abstract, slightly inflated phrasing — the kind that's characteristic of generated copy. Five rounds to fix it.

**Round 1** — Direction change across all copy. Shorter. More concrete. Delete if not necessary.

**Round 2** — Add project images. Found 8 screenshots in `public/images/projects/`. Added a `PROJECT_IMAGE` mapping to `src/data/home.ts` and rendered via `<img>` tags in `Projects.tsx`. Projects without images fall back to a CSS-based color swatch. Codex caught a bug during review: `PROJECT_IMAGE` was added to `home.ts` but never imported in `Projects.tsx`, so images weren't rendering at all.

**Round 3** — Remove the Lab section. There was a section marketing the internal Claude Code skills, hooks, and pipelines as features. User request: "Take out the daily toolchain stuff." Removed `<Lab>` import and component from `src/pages/index.astro`.

**Round 4** — Jargon sweep across all public pages. Cleaned `about.astro`, `ai-news/index.astro`, and `public/llms.txt`. Removed phrases like "Claude Code skills," "multi-agent orchestration," and "daily 08:00 KST cron" — internal implementation details that don't belong in public copy. Rewrote `llms.txt` entirely as an understated portfolio/build-log archive description.

**Round 5** — Metadata cleanup. Removed "AI agent," "MCP server," and "Built with Claude Code" from schema.org, footer, and default description in `src/layouts/Base.astro`.

## .gitignore Cleanup (Codex Flagged It)

Separate Codex note: several untracked local directories weren't in `.gitignore`, which meant they could accidentally end up in production commits.

Added `.claude/agent-memory/`, `.claude/worktrees/`, and `.wrangler/`. Deduplicated a redundant `.vercel/` entry. Kept `.vercelignore` as a deployment safety net and included it in the commit.

## What This Build Taught Me

**Copy takes more rounds than code.** The component rewrite finished in one session. Copy editing ran five rounds. "Remove translated-sounding phrases" doesn't work as a single instruction — you have to look at actual sentences and remove them one by one. Prompts with specific examples ("change this phrase to that") resolved faster than abstract direction.

**Don't expose internal implementation in public copy.** "Auto-generated daily by Claude Code" is technically true. But making it a marketing point is odd. Public pages describe what users experience, not what CLI tools built it.

**Cross-validation finds bugs that familiarity hides.** The missing `PROJECT_IMAGE` import and the mobile header misalignment were both caught by Codex, not during the main implementation session. Running a separate pass against a diff catches the things you stop seeing after hours in the same codebase.

Tool call breakdown: Session 8 (core implementation) — Bash 22×, Read 20×, Write 10×, Edit 5×. Copy editing sessions were Read- and Edit-heavy. Total across 27 sessions: 350+ tool calls.

> The design took a day. Making the copy sound like a person took the rest of the time.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
