---
title: "Static Bundle → Astro Native: 3 Prompts, 106 Tool Calls, 14 Components"
project: "portfolio-site"
date: 2026-04-22
lang: en
pair: "2026-04-22-portfolio-site-ko"
tags: [claude-code, astro, react, portfolio, refactoring, home-design]
description: "Three vague one-liners sent Claude Code on a 3h26m autonomous rebuild — diagnosing stack incompatibility, pivoting without being asked, and shipping 14 native Astro/React components."
---

Three prompts. 106 tool calls. 3 hours and 26 minutes. Fourteen components rebuilt from scratch.

**TL;DR** The goal was to port an existing Vite+React static bundle into an Astro portfolio. The stacks are structurally incompatible — a static bundle has no path to Astro's Content Collections, shared components, or build pipeline. Claude Code diagnosed this, proposed a native rebuild, and executed it. The user typed three lines total.

## "Apply Everything in the Deploy Folder to Jidonglab"

The full user input for the session:

> "apply everything in the deploy folder to jidonglab"

> "show me the preview"

> "just do whatever you recommend"

No file paths. No component list. No architecture guidance. Before touching a single file, Claude had to parse what each of those sentences actually meant.

The first move was finding the `deploy` folder. It wasn't in the expected location. Several Bash calls across different directory paths later, it surfaced: a self-contained Vite+React static bundle with six files, ~103KB total.

```
deploy/
├── app.jsx
├── data.js
├── index.html
├── styles.css
├── tech.jsx
└── thumbnails.jsx
```

Then mapping the target. "Jidonglab" resolved to `~/portfolio/portfolio-site/` — the codebase behind `jidonglab.com`. A structure scan returned: Astro 4 + React + Tailwind, with Content Collections wired up for `build-logs`, `tips`, `ai-news`, and `projects`.

Before writing anything, Claude surfaced a warning:

> "Replacing the existing index.astro (19.2KB of Astro-native home page) with a simple redirect is pretty destructive."

With a clean git working tree confirmed, it ran a safe first attempt anyway — copied the six bundle files into `public/jidonglab-home/` and replaced `src/pages/index.astro` with a 580-byte redirect. Easy to validate, easy to revert.

## Why a Static Bundle Hits a Wall in Astro

"Show me the preview" triggered a local HTTP server, headless Chrome launch, and a screenshot.

The hero section rendered. The rest of the homepage didn't connect to anything.

The issue isn't configuration. A Vite+React static bundle is a fully standalone application. Its `index.html` imports JSX files directly. Its build output assumes its own bundler pipeline. Transplanting it into Astro via redirect means it runs in a completely separate rendering context from the Astro project:

- **Content Collections are unreachable.** `build-logs`, `tips`, and `ai-news` exist only inside Astro's build-time pipeline. A static bundle served from `public/` has no mechanism to query them.
- **Shared components can't be imported.** Existing `PostCard`, `ProjectCard`, and layout components are Astro/React files processed by Astro's compiler. A separate Vite app can't import them.
- **Tailwind tokens don't transfer.** The bundle's own `styles.css` scopes styles independently. No design-system alignment with the rest of the site.
- **Any dynamic data needs a separate fetch layer.** Which defeats the entire point of having Content Collections in the first place.

The result of keeping the bundle would be two unrelated applications sharing a domain — the static bundle as the homepage, the Astro app for everything else — with no shared state, components, or data access. It's not a port; it's a parallel deployment hiding behind a redirect.

## The Pivot Claude Made Without Being Asked

When "just do whatever you recommend" arrived, Claude had everything it needed to make the call:

> "The deploy bundle is a static package. Using it as-is completely isolates it from Content Collections. We need to reimplement it natively on the Astro stack."

This is the session's defining moment. The user gave zero architectural direction. Claude evaluated the tradeoffs — keep the bundle (fast, but isolated) versus native rebuild (correct integration, significantly more work) — and chose the rebuild. Then executed it.

The output wasn't a proposal. No "here are three options." It was a decision followed by implementation.

## 14 Files, Built in Astro-Native

`src/components/home/` was created from scratch. Components split along a single axis: static rendering vs. interactivity.

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

Hardcoded data moved to `src/data/home.ts`. `src/pages/index.astro` became a composition page — assembling these components — rather than a redirect.

The Astro vs React division is load-bearing. Astro components ship zero JavaScript by default. React only enters the bundle where interactivity is required — hero animations, gallery interactions, thumbnail behavior — with `client:load`. Everything else: Astro.

`ShipLog.astro` and `Writing.astro` read directly from Content Collections at build time. That's functionality the original static bundle had no path to.

## Where 106 Tool Calls Actually Went

| Tool | Count | Purpose |
|---|---|---|
| Bash | 40 | Folder discovery, local server, headless screenshots |
| Read | 17 | Existing components and schemas |
| Write | 15 | New components and data files |
| TaskUpdate | 14 | Progress tracking |
| TaskCreate | 7 | Subtask decomposition |
| ToolSearch | 4 | Tool schema resolution |
| Glob + Grep | 6 | File traversal |

**Edit count: 0.** Every output file was a fresh `Write` — no diffs applied to existing code. `index.astro` went through three complete rewrites across the session:

1. 580-byte redirect pointing to the static bundle
2. Empty composition scaffold (components imported but unstyled)
3. Final rebuilt home page

Each transition was a full `Write`, not a patch. When direction changed, the file got replaced entirely.

The 40 Bash calls break down roughly as: ~15 for folder and repo discovery concentrated in the first 20 minutes, ~15 for dev server management and headless screenshot capture, ~10 for miscellaneous file checks. There's a failed attempt in the screenshot bucket — Claude tried scroll-capture via Chrome DevTools Protocol, hit permission issues, fell back to viewport-only.

## Three Prompts, Five Decisions

The session exposes a specific pattern in how Claude Code handles vague input.

"Apply everything in the deploy folder to jidonglab" required five sequential decisions before a file was written:

1. Where is the deploy folder?
2. Where is the jidonglab repo?
3. What does the current `index.astro` look like?
4. Are these stacks compatible?
5. If not — what's the alternative, and how should it be built?

A more precise prompt might have pre-answered some of these. It also would have constrained the solution space. If the user had specified "port the deploy bundle by wrapping it in an Astro page component," Claude would have built exactly that — broken Content Collections integration and all.

"Just do whatever you recommend" handed over the architecture decision entirely. The 14-component structure, the Astro/React split, where data lives — all of it was Claude's judgment. The user reviewed the output and accepted it.

Short prompts aren't sloppy. They're a deliberate tradeoff in how Claude Code gets used as an AI automation layer:

> Set the direction. Delegate the decisions. Short prompts raise the tool call count — and raise the decision-making speed.

The exploration overhead — roughly 20 of 40 Bash calls, concentrated in the first 20 minutes — is the cost of keeping the prompt ambiguous. The benefit is not having to write a spec, not having to make stack decisions upfront, and getting an architecture that fits the actual constraints of the codebase rather than the constraints of a prompt written before anyone looked at the code.

106 tool calls across 3.5 hours for a 14-component rebuild isn't inefficiency. It's what Claude Code's autonomous execution looks like when input is intentionally sparse.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
