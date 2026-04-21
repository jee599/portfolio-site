---
title: "3 Prompts, 106 Tool Calls, 14 Components: How Claude Code Rebuilt a Portfolio Homepage"
project: "portfolio-site"
date: 2026-04-22
lang: en
pair: "2026-04-22-portfolio-site-ko"
tags: [claude-code, astro, react, portfolio, refactoring, home-design]
description: "Three one-liners triggered a full Astro-native home rebuild. What 106 tool calls and 3h26m of Claude Code actually look like."
---

Three prompts. 106 tool calls. 3 hours and 26 minutes. Fourteen components rebuilt from scratch.

**TL;DR** — I tried to port an existing Vite+React static bundle into an Astro-based portfolio site. Claude hit a structural incompatibility, recognized the mismatch, and pivoted to rebuilding everything natively inside `src/components/home/`. I typed three lines the whole session.

## "Apply Everything in the Deploy Folder to Jidonglab"

That was the first prompt. The complete user input for the session was:

> "apply everything in the deploy folder to jidonglab"

> "show me the preview"

> "just do whatever you recommend"

No spec. No component list. No architecture instructions. Claude had to figure out what "deploy folder," "jidonglab," and "whatever you recommend" actually meant before touching a single file.

The first move was locating the deploy folder — it wasn't in the obvious place. Several Bash calls later, it turned up: a self-contained Vite+React static bundle with six files.

```
deploy/
├── app.jsx
├── data.js
├── index.html
├── styles.css
├── tech.jsx
└── thumbnails.jsx
```

Total: ~103KB. A standalone SPA that builds independently and serves itself.

Next was finding "jidonglab." That resolved to `~/portfolio/portfolio-site/` — the codebase behind `jidonglab.com`. A structure scan revealed Astro 4 + React + Tailwind, with Content Collections wired up for `build-logs`, `tips`, and `ai-news`.

Before touching anything, Claude surfaced a warning:

> "Replacing the existing index.astro (19.2KB of Astro-native home page) with a simple redirect is pretty destructive."

With a clean git working tree confirmed, it ran the first attempt anyway: copied the six bundle files into `public/jidonglab-home/` and swapped `src/pages/index.astro` with a 580-byte redirect.

## Why the Static Bundle Hit a Wall

"Show me the preview" triggered a local HTTP server and a headless Chrome screenshot. The hero section rendered. But the structural problem was clear.

The deploy bundle is a standalone app. Its `index.html` loads JSX directly. Its build output assumes its own bundler. None of that connects to Astro's build pipeline. Specifically:

- No path to Content Collections (`build-logs`, `tips`, `ai-news`)
- Can't reuse existing `PostCard`, `ProjectCard`, or layout components
- CSS lives in its own scope, disconnected from Tailwind
- Any dynamic data would require a separate fetch layer

Dropping a Vite bundle into an Astro project via redirect means running two parallel worlds that never talk to each other. The existing Astro infrastructure — Content Collections, shared components, Tailwind tokens — becomes unreachable from the new homepage.

## "Just Do Whatever You Recommend"

That third prompt was the pivot. Claude's response:

> "The deploy bundle is a static package. Using it as-is completely isolates it from Content Collections. We need to reimplement it natively on the Astro stack."

It created `src/components/home/` and split the UI into 12 components by section.

## The 14-File Rebuild

`src/components/home/` — one component per homepage section:

| File | Type | Role |
|---|---|---|
| `Hero.tsx` | React | Hero section (interactive) |
| `Lab.tsx` | React | Project gallery |
| `Projects.tsx` | React | Side project list |
| `Thumbnails.tsx` | React | Thumbnail grid |
| `TechBlock.tsx` | React | Tech stack display |
| `About.astro` | Astro | About section |
| `Footer.astro` | Astro | Site footer |
| `NowStrip.astro` | Astro | Current work indicator |
| `ShipLog.astro` | Astro | Recent build log entries |
| `Topbar.astro` | Astro | Top navigation |
| `Wordmark.astro` | Astro | Logo mark |
| `Writing.astro` | Astro | Post list section |

Plus `src/data/home.ts` for extracted data, and a rebuilt `src/pages/index.astro` that composes these components instead of redirecting.

The Astro vs React split is deliberate. Static sections (navigation, footer, post lists, about) are Astro components — zero JS in the bundle. Interactive sections (hero, gallery, thumbnails) are React with `client:load`. The goal was to keep client-side JS minimal while preserving interactivity where it matters.

## Tool Call Breakdown

106 calls across the session:

| Tool | Count | What it was doing |
|---|---|---|
| Bash | 40 | Folder discovery, local server, screenshots |
| Read | 17 | Parsing existing components and schemas |
| Write | 15 | Creating new components and data files |
| TaskUpdate | 14 | Progress tracking |
| TaskCreate | 7 | Breaking down subtasks |
| ToolSearch | 4 | Resolving tool schemas |
| Glob + Grep | 6 | File traversal |

**Edit: 0.** Everything was a fresh Write — no in-place modifications. `index.astro` went through three full rewrites: redirect → empty composition shell → final rebuild. Each was a complete file replacement.

The 40 Bash calls break down roughly as: ~15 for folder and repo discovery in the first third of the session, ~15 for running the local dev server and capturing screenshots, ~10 for miscellaneous checks. There's a failed attempt in there — Claude tried to capture a full-page scroll via Chrome DevTools Protocol, ran into permission issues, and fell back to viewport-only screenshots.

## Short Prompts Shift Exploration Cost to the Agent

This is the session's main pattern. "Apply everything in the deploy folder to jidonglab" is seven words. For Claude, those seven words meant:

1. Find the deploy folder
2. Find the jidonglab repo
3. Read the current `index.astro` structure
4. Assess stack compatibility
5. Identify the mismatch
6. Propose an alternative
7. Execute the rebuild

That's the exploration cost that ambiguous prompts carry. The user provides direction; Claude handles every decision in between. "Just do whatever you recommend" delegated an entire architecture call — which components to build, how to split Astro vs React, where data lives — to the agent.

It's not a worse way to work. It's a different allocation:

> Ambiguous prompts lower decision overhead and raise tool call count. Precise prompts do the opposite.

Neither is free. The tradeoff is where the time goes — and who makes the calls.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
