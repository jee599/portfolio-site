---
title: "4 Parallel Claude Code Agents, 6 Features in 39 Minutes, and Why I Rolled It All Back"
project: "portfolio-site"
date: 2026-03-23
lang: en
pair: "2026-03-23-portfolio-site-ko"
tags: [claude-code, agentcrow, parallel-agents, portfolio, build-log]
description: "Dispatched 4 parallel AI agents with AgentCrow to add 6 modern web features. 223 tool calls, 2 sessions. Then reverted everything."
---

Four agents were running simultaneously. Aurora background CSS, cursor effect component, scroll animations, FeatureToggle panel. While they worked, I was installing GSAP and writing Bento Grid CSS. Thirty-nine minutes later, all 6 features were integrated into `index.astro`. Then I reverted everything.

**TL;DR** Used AgentCrow to dispatch 4 parallel Claude Code agents, added 6 modern web features, discovered they didn't fit the site, and rolled it all back. 2 sessions, 223 tool calls total. What remained: a 2-second scroll speed fix and two adjacent git commits that tell the whole story.

## Session 1: 155 Tool Calls to Debug One Stale JSON File

The Projects tab on `jidonglab.com/admin` wasn't showing recent GitHub repositories. The logical assumption was a bug in the data-fetching code.

It wasn't.

Claude traced through `src/pages/admin.astro`, `src/pages/api/admin-projects.ts`, and `src/lib/projects.ts` in sequence. The actual culprit was `github-repos.json` — a static file generated at build time. Any repo added after the last deployment simply wasn't in there. The bug wasn't in the code; it was in the architecture. The fix required rethinking how the admin page sourced its data, not patching a function.

There was a second issue in the same session: the URL input field had no Save button. Updates only applied on focus-out, which meant the UX was quietly broken in a non-obvious way. One prompt fixed both:

> "Make a save button and trigger screenshot recapture for all sites when it's pressed."

That landed as: Save button added, plus an automatic screenshot recapture call on every save. Preview images use `thum.io` for real-time capture. Another edge case came up mid-session — scroll speed for the preview images was inconsistent because each site's image had a different height, making relative scroll speed feel wrong. The fix was to set a fixed scroll duration of 2 seconds regardless of image height.

The tool call breakdown for this session tells a clear story: Bash 78x, Read 35x, Edit 15x. Bash dominated because the cycle was execute → verify → re-execute far more than it was write code. Half of the 155 tool calls were just running commands to observe what was actually happening. This is typical of debugging sessions where the root cause isn't obvious — the AI spends more time probing than editing.

## Session 2: 4 Parallel Agents, 6 Features, 39 Minutes

The second session started with a brainstorming skill invocation. The prompt was open-ended:

> "I want to use more modern web technologies on jidonglab.com."

Claude analyzed the current codebase and proposed 6 concrete features:

1. Astro View Transitions
2. CSS Scroll-Driven Animations
3. Aurora background effect
4. Cursor tracking + card tilt
5. GSAP animations
6. Bento Grid layout

The natural next step would have been to pick one or two and iterate. Instead:

> "Just do all of them. Add a toggle panel so each feature can be turned on and off independently."

AgentCrow dispatched immediately:

```
━━━ 🐦 AgentCrow ━━━━━━━━━━━━━━━━━━━━━
Dispatching 4 agents:

🖥️ @toggle-panel → Create FeatureToggle.tsx control panel component
🖥️ @cursor-effect → Create CursorEffect.tsx cursor tracking + card tilt
🎨 @aurora-css → Create aurora background CSS
🎨 @scroll-css → Create CSS Scroll-Driven Animations CSS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Each agent had a clearly scoped, independent deliverable with no file overlap. While the 4 agents ran in parallel, the main Claude thread handled GSAP installation and Bento Grid CSS. Everything happened concurrently.

The outputs:

- `src/styles/aurora.css` — toggled via `[data-ft-aurora="on"]` attribute on the document root
- `src/components/FeatureToggle.tsx` — fixed bottom-right panel, z-index layered above everything
- `src/components/CursorEffect.tsx` — 40px cursor glow effect + perspective card tilt on hover
- `src/styles/scroll-animations.css` — scroll progress bar at the top + entrance animations for elements

Integration came after all agents finished: CSS imports added to `Base.astro`, components mounted in `index.astro`. The orchestration overhead was measurable — 12 TaskUpdate calls and 6 TaskCreate calls just for tracking agent state. 18 tool calls spent purely on coordination, not on building anything.

That's the real cost of multi-agent AI automation: it's fast, but not free.

## Why Parallel Agents Work — and When They Don't

The parallel dispatch worked cleanly here because the task decomposed perfectly. Four agents, four independent files, zero merge conflicts. Had this been done sequentially — one agent finishing before the next starts — the same work would have taken significantly longer than 39 minutes.

The pattern that makes multi-agent effective is file independence. When each agent owns its own output file and has no reason to read another agent's in-progress work, parallelism is safe and fast. The AgentCrow dispatch plan makes this explicit: you can see at a glance whether any two agents would touch the same files.

What parallelism doesn't give you is time to think.

When agents are building at speed, there's no natural pause point where you step back and ask "should we actually be building this?" That question only surfaces after the work is done — when you're looking at the running result.

## The Rollback Decision That Took 5 Seconds

Everything was integrated. Deployment was one command away.

The decision to revert took about 5 seconds.

`jidonglab.com` is a site about transparent solo developer work — what got built, how it was built, what worked and what didn't. Aurora glow effects and animated cursor tracking are technically impressive, but they belong on a creative portfolio or a product landing page. They send the wrong signal for a dev log site where the point is clarity over flash.

The technical execution was solid. The context fit was wrong.

```
c0bb51e Revert "feat: add 6 modern web features with toggle control panel"
71bf179 feat: add 6 modern web features with toggle control panel
```

Those two commits sit next to each other in the git log. 39 minutes to build, a few seconds to decide it was wrong.

## What 223 Tool Calls Actually Bought

Across both sessions:

- Session 1: 155 tool calls, debugging architectural data staleness + UX fixes in the admin panel
- Session 2: 68 tool calls, 39 minutes, building and integrating 6 modern web features via parallel agents

What actually shipped: a fixed scroll duration (2 seconds, uniform) and a cleaner admin page. The 6 features exist only in the git history.

The lesson from the multi-agent session isn't that parallel agents are risky. It's that speed compresses the window for strategic reconsideration. In sequential work, each intermediate step is a natural checkpoint. In parallel work, you go from "prompt" to "done" fast enough that the "should we?" question arrives too late.

The brainstorming phase should have included a fit check: does this belong on this site? It didn't. The build proceeded because Claude proposed 6 things and the instinct was to try all 6. That's the trap with capable AI tooling — the question shifts from "can we build it?" (almost always yes) to "should we build it?" (requires a different kind of deliberation that AI can't substitute for).

> Distribute independent tasks with no file overlap to parallel agents. But confirm direction before dispatching.

The toggle panel approach — build everything, then switch features on/off — was actually a reasonable mitigation for uncertainty. Each feature could have been evaluated independently and reverted without touching the others. The problem was that evaluation happened after 39 minutes of build time rather than before.

AgentCrow will dispatch the moment you say go. Make sure you've said the right thing first.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
