---
title: "Why I Ripped Out a Static Bundle After 3 Seconds — Homepage Redesign in 204 Tool Calls"
project: "portfolio-site"
date: 2026-04-23
lang: en
pair: "2026-04-23-portfolio-site-ko"
tags: [claude-code, astro, portfolio, design, refactoring]
description: "A static bundle killed Content Collections. 204 Claude Code tool calls to fix it: native rebuild, reverse-engineered Claude Design prompt, full redesign."
---

204 tool calls. 17 files. Two sessions adding up to over five hours. All because I told Claude to "just paste the deploy folder in."

Three seconds after the redirect landed, the build logs were gone. Scroll further — no recent posts. No AI news feed. What remained was a clean hero section sitting above a void. The static bundle had severed every Content Collections connection on the homepage.

This is what happened, and why it took two full sessions to get back to a functioning page that also looked better than what I started with.

**TL;DR** Pasted a React bundle into `index.astro` → Content Collections severed → rebuilt 12 Astro-native components (106 tool calls, 3h 26min) → reverse-engineered Claude Design's leaked system prompt → second redesign session with 4 variants (98 tool calls, 2h 5min). Total: 204 Claude Code tool calls, 17 new files.

## The Decision That Seemed Fine for Three Seconds

The prompt was short: "Apply everything in the deploy folder to jidonglab."

The `deploy/` folder had been built as a standalone prototype — six files totaling around 103KB: `app.jsx`, `data.js`, `index.html`, `styles.css`, `tech.jsx`, `thumbnails.jsx`. A proper home page design with a hero section, project thumbnails, tech stack block, and a footer. The intention was to promote it from prototype to production.

Claude's approach: replace `src/pages/index.astro` (the existing 19.2KB homepage) with a 580-byte redirect pointing to `public/jidonglab-home/index.html`, and drop the bundle into the public directory. The hero section rendered. The screenshot looked fine.

The problem surfaced on scroll. The homepage had been showing:
- Recent build logs from Content Collections
- Latest blog posts
- AI news feed entries
- A "now playing" strip with recent activity

All gone. Not broken with errors — just absent. The static bundle had no mechanism to read from Astro Content Collections. Those collections are resolved at Astro's build phase; a file sitting in `public/` is served as-is, completely outside that pipeline. The bundle was self-contained by design — built to be previewed directly in a browser — which made it useless as a live data-connected component.

The only real options: (a) keep the static bundle and permanently lose dynamic content, or (b) rebuild the design as Astro-native components. Option (a) wasn't a real option.

## 106 Tool Calls to Rebuild 12 Components

I handed back the decision: "Do whatever you recommend."

The first step was reading the original `index.astro` to map everything the homepage needed: build logs (latest N entries, filtered by `lang`), blog posts (recent, with titles and dates), project entries, tech stack items, and the activity strip.

Data extraction first. Rather than scattering queries across components, Claude centralized static data in `src/data/home.ts` — project metadata, tech items, anything that didn't come from Content Collections. This kept Astro components focused on layout and presentation.

The component split:

**React client components** (interactive or stateful):
- `Hero.tsx` — animated headline, CTA
- `Lab.tsx` — project lab section
- `Projects.tsx` — project cards with hover states
- `TechBlock.tsx` — tech stack visualization
- `Thumbnails.tsx` — project thumbnail grid

**Astro server components** (data-fetching, static):
- `ShipLog.astro` — reads from Content Collections directly, renders recent build logs
- `Writing.astro` — recent blog posts
- `About.astro`, `Footer.astro`, `NowStrip.astro`, `Topbar.astro`, `Wordmark.astro` — layout/structure

`ShipLog.astro` is the critical piece. It calls `getCollection('build-logs')`, filters by language, sorts by date, and passes entries to the template. This is what static bundles categorically cannot do — it runs at Astro's build phase, not in the browser.

Tool usage for this session:

| Tool | Calls |
|---|---|
| Bash | 40 |
| Read | 17 |
| Write | 15 |
| TaskUpdate | 14 |
| TaskCreate | 7 |
| **Total** | **106** |

Time elapsed: 3 hours 26 minutes.

The rebuild covered the same surface area as the deploy bundle, but wired into the actual data model. The lesson isn't complicated: if you build a prototype outside the environment it'll live in, reintegration is a full rebuild. There's no shortcut that preserves both the design and the data connections.

## The Claude Design System Prompt That Leaked on Launch Day

Session two started from a different angle: "Find the leaked Claude Design code."

[Claude Design](https://claude.ai/design) launched April 17, 2026 as an Anthropic Labs experiment. Pro subscription required. On launch day, the full system prompt was posted publicly — the [elder-plinius/CL4R1T4S](https://github.com/elder-plinius/CL4R1T4S) repository had 422 lines of prompt text plus tool schema definitions, approximately 73KB total.

The prompt revealed Claude Design's core architecture:

1. **HTML as the only native output** — Claude Design doesn't generate React or components; it outputs raw HTML/CSS/JS. The host environment handles rendering.
2. **Pre-generation question phase** — before generating anything, the model fires a structured set of questions to gather context: purpose, audience, visual references, constraints.
3. **AI-slop guard** — explicit instructions to avoid generic "AI aesthetic" patterns: excessive gradients, over-rounded corners, hollow icons, overly symmetrical layouts.
4. **Variant generation** — produces multiple distinct design directions rather than a single output.

Live Preview, Tweaks panel, and Design Mode are host-environment features, not model behaviors. Not reproducible locally.

What was reproducible: the question technique and the variant generation workflow.

I ported these into a local Claude Code skill: `~/.claude/skills/claude-design-lite/SKILL.md`. The skill triggers context collection (10 questions), then generates 4 design variants as HTML files with the AI-slop guards applied. No WebSearch, no special access — just the system prompt analysis and a `SKILL.md` file.

This generalizes: leaked or documented system prompts are behavioral specifications. You can replicate the core mechanic without replicating the host environment. The interesting part of Claude Design wasn't the web UI — it was the context collection flow and the variance generation discipline.

## Four Variants and the Heatmap Concept

With the skill running, I submitted a jidonglab.com redesign request. Context collection fired first — 10 questions covering site purpose, primary audience, visual tone, color constraints, and content priorities.

Answers: tech portfolio, Korean and global audiences, toss-green (`#00c471`) as accent, simple and opinionated, no decorative elements.

Four variants generated:
- **v1-notebook.html** — editorial, strong typography, minimal color
- **v2-pro.html** — dark mode, dense information layout, developer-facing
- **v2-studio.html** — light card grid, creator portfolio feel
- **v3-labos.html** — system UI aesthetic, monospace-heavy

v2-pro was the strongest fit. During review, one additional concept emerged from a prompt I wrote:

> "Every day, documented. A full year of commits, posts, and build logs on a single screen. The slow days and the sprint days — none of it hidden."

The idea: a GitHub contribution heatmap variant that aggregates across data sources. Instead of commits only, it would count commits + blog posts + build logs as daily activity. The visual mockup showed "2,847 total entries, 41-day longest streak."

Immediate question: "Is that real data?"

No. Hardcoded placeholders for the visual mockup. Making the heatmap live requires:
- GitHub API integration for commit counts per day
- `getCollection('build-logs')` grouped by date
- `getCollection('ai-news')` and blog posts grouped by date
- An aggregation layer combining all three sources

That's the next concrete task: replace placeholder numbers with real API calls.

## Session Stats

| Session | Duration | Tool Calls | Output |
|---|---|---|---|
| Native component rebuild | 3h 26min | 106 | 12 components, 1 data file |
| Claude Design reverse-engineering + redesign | 2h 5min | 98 | 1 skill, 4 HTML variants |
| **Total** | **5h 31min** | **204** | 17 files created, 1 modified |

Tool distribution across both sessions:
- Bash: 64 calls (build checks, file operations)
- Edit: 37 calls (targeted modifications)
- Write: 26 calls (new file creation)

The original mistake — pasting a static bundle into an Astro page — is obvious in hindsight. A file in `public/` sits outside Astro's build pipeline. Content Collections only exist within that pipeline. The combination was never going to work.

The more useful pattern from this session: when a design prototype needs to graduate to production, the first question is "what data does this page need, and where does that data live in the build pipeline?" Answer that before touching any files.

> Design disconnected from data is just decoration.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
