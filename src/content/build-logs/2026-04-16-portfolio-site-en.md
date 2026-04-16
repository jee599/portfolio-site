---
title: "10 Parallel Claude Agents, 139 Tool Calls, Zero Code Written: AI Design Brainstorming at Scale"
project: "portfolio-site"
date: 2026-04-16
lang: en
pair: "2026-04-16-portfolio-site-ko"
tags: [claude-code, brainstorming, parallel-agents, ui-design, spoonai]
description: "How I used Claude Code's brainstorming skill + 10 parallel agents to generate design variants in 1 hour, with a live local preview server for real-time comparison."
---

2 sessions. 139 tool calls. 10 design variants. And almost no time actually writing code — the majority went into figuring out what the design should even be.

**TL;DR** — I automated design brainstorming using Claude Code's `brainstorming` skill combined with the parallel agent pattern. 10 HTML mockups were generated simultaneously, served on a local dev server, and compared in real time before committing to a direction.

## Session 1: Diagnose Before You Fix

Session 1 ran 61 tool calls — mostly `Read(12)` + `Bash(9)` + `Edit(16)`. The prompt I gave was blunt:

```
fix the overall design and it's broken on mobile
```

Instead of jumping straight into edits, Claude diagnosed first. Reading `lib/content.ts` and `lib/types.ts` revealed the actual cause of the broken archive images: the `ArchiveEntry` type didn't have an `image` field at all, and `getArchiveEntries()` was silently discarding `meta.image`. The images weren't "not showing" — the render path for them simply didn't exist.

If I'd skipped this diagnostic step and jumped to "fix the design," I would've restyled components without ever touching the actual bug. Reading `lib/types.ts` before `ArchiveList.tsx` made the difference.

From there it went in order: `lib/types.ts` → `lib/content.ts` → redesign `ArchiveList.tsx` → add warm neutral design tokens to `globals.css`. The agreed direction was "Editorial Tech Magazine" — warm gray palette swapped in for Tailwind's default `slate`/`zinc`.

## Session 2: The Brainstorming Skill Changes the Game

Session 2: 78 tool calls. What stands out is `TaskCreate(11)` + `Agent(10)` — that combination is where the session got interesting.

Prompt:

```
redesign spoonai for both mobile and web
```

Claude loaded the `brainstorming` skill and proposed **Visual Companion**: spin up a local server (`http://localhost:54423`), render mockups as HTML, and compare them directly in a browser. It started by generating 3 mood options as HTML and serving them live.

The first two rounds? "Not feeling any of these."

```
all of these are bad, find a design skill
```

Claude loaded `ui-ux-pro-max` — a skill with 50+ design styles and 161 color palettes. That's when the direction shifted. A single prompt line changed the quality of the output.

```
try something completely different, find 10 options, make sure images show per article
```

## Running 10 Agents in Parallel

This is the core of the session. Claude didn't generate mockups one by one — it dispatched 10 independent agents simultaneously.

Each agent owned a distinct design concept:

- **Bento grid** — soft `#f5f5f7`, Apple-inspired
- **Masonry Pinterest** — warm cream `#faf7ee` + orange accent
- **Neo-brutalism** — hot pink `#ff5470` + electric yellow
- **Swiss tabular** — pure white + ink `#0a0a0a`
- **Japanese kinfolk** — paper `#f7f4ee`
- **Netflix shelf cinema** — near-black `#0b0b10`
- **Y2K chrome retro**
- **Dashboard ticker** — phosphor green `#22ff88`

Each agent wrote its output as a standalone HTML file under `.superpowers/brainstorm/`. Because they ran in parallel, generating 8+ mockups took a fraction of the time a sequential run would have. `TaskCreate(11)` in the tool call log captures this orchestration.

## The Navigation Problem (and a Quick Fix)

The parallel-generated HTML files were isolated — to view each one you had to navigate files manually.

```
how do i even see the different designs?
make a button at the top to cycle through them
```

Claude created `/tmp/__nav-inject.html` and injected it into the local server as a fixed top-bar navigator. One click to move between all 10 mockups in sequence. A small thing, but exactly the kind of friction that derails a comparison session if you have to solve it yourself.

## Tool Call Breakdown

Out of 139 total tool calls, actual code modifications (`Edit`) happened 16 times — 11.5% of the session. The rest was understanding, planning, and generating mockups. `TaskUpdate(27)` + `TaskCreate(17)` = 44 calls, or 32% of the entire session, was pure agent orchestration.

| Tool | Count | Purpose |
|------|-------|---------|
| TaskUpdate | 27 | Progress tracking |
| Bash | 24 | Local server, git, file checks |
| Read | 24 | Code understanding, type inspection |
| TaskCreate | 17 | Parallel agent dispatch |
| Edit | 16 | Actual code changes |
| Agent | 10 | Independent design agents |
| Write | 8 | HTML mockup generation |
| ToolSearch | 5 | Skill discovery |

## Three Patterns That Held Up

**Diagnose before touching anything.** The image bug was invisible until the code was actually read. A direct "just fix it" prompt would've missed `ArchiveEntry` entirely and landed changes in the wrong file. Reading types before components is a habit worth enforcing.

**Parallel agents belong in the exploration phase.** Design is exactly the kind of work where you need to evaluate multiple directions before committing. Parallel agents compress that exploration non-linearly — time saved scales with the number of variants. Once the implementation direction is locked, there's no reason to parallelize.

**Skills have to be explicitly loaded.** Without `ui-ux-pro-max`, the output would've relied on Claude's default aesthetic sense. After loading the skill, the specificity of suggestions jumped noticeably — named color values, distinct visual references, not vague adjectives. The prompt `"find a design skill"` was the actual leverage point for the session's quality shift.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
