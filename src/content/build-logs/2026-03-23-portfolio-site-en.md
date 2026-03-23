---
title: "4 Claude Code Agents, 6 Features, 39 Minutes — Then I Rolled Back Everything"
project: "portfolio-site"
date: 2026-03-23
lang: en
pair: "2026-03-23-portfolio-site-ko"
tags: [claude-code, agentcrow, portfolio, build-log, parallel-agents]
description: "Dispatched 4 parallel Claude Code agents via AgentCrow to ship 6 modern web features simultaneously. Aurora CSS, cursor effects, scroll animations — all working. All rolled back. 223 tool calls, 2 sessions."
---

Four agents were running simultaneously. Aurora background CSS, cursor effect component, scroll animations, FeatureToggle panel. While they worked, I was installing GSAP and writing Bento Grid CSS. Thirty-nine minutes later, all 6 features were integrated into `index.astro`. Then I rolled back everything.

**TL;DR** Used AgentCrow to dispatch 4 parallel Claude Code agents and implement 6 modern web features at once. They delivered. But after seeing it live, none of it fit the site's concept. Rolled back. 2 sessions, 223 tool calls total.

## Session 1: 155 Tool Calls to Debug an Admin Page

The Projects tab on `jidonglab.com/admin` wasn't showing the latest GitHub repos. There was already logic in place to fetch the project list — the question was why it wasn't working.

Claude traced through `src/pages/admin.astro`, `src/pages/api/admin-projects.ts`, and `src/lib/projects.ts` in sequence. The culprit was `github-repos.json` — a static file generated at build time. Any repo created after the last deployment simply wasn't in there. The bug wasn't in the code. It was in the architecture.

There was also a URL input issue. The admin page had no Save button — changes only applied on focus-out, which meant updates were silently failing in a way that wasn't obvious. I asked for both fixes at once:

> "Make a save button. When it's pressed, re-capture screenshots for all sites."

That landed as: Save button added, plus automatic `thum.io` screenshot recapture triggered on every save. Another edge case came up during the session — scroll speed for the preview images was inconsistent because each site has a different image height, making relative scroll speed feel wrong. Final fix: hardcode the scroll duration to 2 seconds regardless of image height.

The tool call breakdown tells a clear story: Bash 78, Read 35, Edit 15. Bash was more than half of all 155 calls. The cycle was execute → verify → re-execute, not write code. This is what debugging sessions look like when the root cause isn't obvious — more probing than editing.

## Session 2: AgentCrow Dispatches 4 Agents, 6 Features in 39 Minutes

The next session started with the `brainstorming` skill. The prompt was open:

> "I want to use more modern web technologies on jidonglab.com."

Claude analyzed the current codebase and proposed 6 additions: View Transitions API, CSS Scroll-Driven Animations, Aurora background effect, cursor tracking with card tilt, GSAP animations, and Bento Grid layout.

The natural next step would have been to pick one and iterate. Instead:

> "Just do all of them. One panel with 6 toggles so I can turn each one on or off, and roll back any one individually."

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

Four agents ran in parallel. Each agent owned a distinct file — no conflicts. While the agents worked, the main Claude thread handled GSAP installation and Bento Grid CSS. Everything happened concurrently.

The outputs:

- `src/styles/aurora.css` — toggled via `[data-ft-aurora="on"]` attribute on the document root
- `src/components/FeatureToggle.tsx` — fixed bottom-right panel with per-feature on/off controls
- `src/components/CursorEffect.tsx` — cursor tracking glow + perspective card tilt on hover
- `src/styles/scroll-animations.css` — scroll progress bar + entrance animations

Once all agents finished, the integration step ran: CSS imports into `Base.astro`, components mounted in `index.astro`. Claude used TaskUpdate 12 times and TaskCreate 6 times to track agent completion and sequence the work. Eighteen tool calls spent purely on orchestration overhead — not building anything.

## The Moment I Decided to Roll It Back

Integration done. Ready to deploy.

I typed: "just roll it all back."

The reason was simple. `jidonglab.com` is a site that transparently shows what a solo developer builds — what worked, what didn't, how it was done. Aurora glow effects and cursor tracking are technically impressive, but they belong on a creative portfolio or a product landing page. They send the wrong signal for a dev log site.

Technically solid. Contextually wrong.

```
c0bb51e Revert "feat: add 6 modern web features with toggle control panel"
71bf179 feat: add 6 modern web features with toggle control panel
```

Two commits side by side in the git log. Thirty-nine minutes to build. A few seconds to decide.

## What Parallel Agents Actually Taught Me

Parallel agents work best when tasks don't share files. Building 2 CSS files and 2 components sequentially would have taken significantly longer than 39 minutes. The speedup is real.

But the faster you build, the easier it is to skip the moment of "do we actually need this?" While the agents were building, there was no natural pause to step back and ask whether any of it should exist. By the time I saw the finished result, the question had shifted from "should we build this?" to "ship or revert?"

> Distribute independent, non-overlapping file work across parallel agents. But confirm direction before you dispatch.

The mistake wasn't using parallel agents. It was moving from brainstorming directly to implementation without asking "does this fit the site?" Claude proposed 6 things and the instinct was to try all 6. That's the trap with capable AI tooling — "can we build it?" is almost always yes. "Should we?" requires a different kind of deliberation.

Total: 2 sessions, 223 tool calls. What actually shipped: a 2-second scroll duration fix and two adjacent commits that tell the whole story.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
