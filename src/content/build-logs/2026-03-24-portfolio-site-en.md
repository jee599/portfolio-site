---
title: "4 Parallel Claude Code Agents Built 6 Web Features in 39 Minutes — Then I Rolled Them All Back"
project: "portfolio-site"
date: 2026-03-24
lang: en
pair: "2026-03-24-portfolio-site-ko"
tags: [claude-code, agentcrow, parallel-agents, portfolio, admin]
description: "One vague prompt triggered AgentCrow to dispatch 4 parallel agents. Aurora, cursor effects, scroll animations, Bento Grid — all built and rolled back in 39 minutes."
---

68 tool calls. 39 minutes. 6 web features shipped. Then I typed "roll everything back" and it was gone in under 5 minutes.

That's the story of Session 7. But before we get there, Session 4 had its own mess — a static JSON file that had been silently lying about which projects existed, and a typo that turned "refmade" into "defmade" on the live site.

**TL;DR:** Two sessions totaling 223 tool calls and ~2h 20min. AgentCrow dispatched 4 parallel Claude Code agents from a single vague prompt and built View Transitions, Aurora background, cursor tilt effects, Scroll-Driven Animations, GSAP, and Bento Grid simultaneously. The rollback cost was near-zero because agents created new files instead of patching existing code. Key lesson: "faster" is a bad prompt. "2000ms" is a good prompt.

---

## The Admin Page Was Lying

Session 4 started with a simple goal: improve the admin dashboard. Total cost: 155 tool calls, 1h 41min.

The first thing that came up was a bug that had been invisible until now. The admin page showed a list of GitHub repos, but repos created after the last build weren't appearing. The cause was obvious once surfaced: `github-repos.json` was a static file generated at compile time. Cloudflare Pages builds don't run continuously, so any repo created after the last deploy was just... absent.

The fix was straightforward — replace the static JSON read with a live GitHub API call inside `api/admin-projects.ts`:

```typescript
// Before: reading a static file baked in at build time
const repos = JSON.parse(await fs.readFile('github-repos.json', 'utf-8'))

// After: live call, always current
const res = await fetch('https://api.github.com/users/jee599/repos?per_page=100', {
  headers: { Authorization: `Bearer ${import.meta.env.GITHUB_TOKEN}` }
})
const repos = await res.json()
```

Static data baked into a deploy is fine until you need it to reflect reality. GitHub repos are a real-time data source — they should be treated like one.

## The Typo That Wasn't in the Code

While reviewing the project cards, I noticed that one project was showing as "defmade" instead of "refmade." The card link was broken too — clicking it went nowhere useful.

First instinct: search the codebase for the string "defmade". Nothing. The component code was clean. The bug had to be upstream.

It was in `aidesiner.yaml` — a YAML config file for a project entry. The `url` field had a typo that was corrupting how the project slug was being derived and displayed. One wrong character in a YAML value, surfacing as a broken project card on the live site.

This kind of bug is the worst category: the error is nowhere near where the symptom appears. The component is correct. The template is correct. The data is wrong. You only find it by following the data backwards from the broken output.

## Scroll Speed: Three Iterations Because I Said "Faster"

The scroll animation speed on the project section needed tuning. This is where things got annoying — and entirely my fault.

The exchange went roughly like this:

> Me: Make the scroll a bit faster.
> Claude: Done. (2x speed)
> Me: Still too slow, make it faster.
> Claude: Done. (2x again)
> Me: Still not right. Make it about 2 seconds.
> Claude: Done. (2000ms, correct on first try)

Three iterations. The first two used relative language: "faster," "still too slow." These are meaningless without a reference point. Claude's interpretation of "faster" is a guess, and guesses compound.

The moment I switched to an absolute value — "2 seconds" — it resolved in one shot.

> Vague directional feedback causes iteration loops. Precise specs solve it in one shot.

This applies everywhere, not just animation speed. If you're giving feedback to an AI agent (or a human engineer), "bigger," "faster," "cleaner" are not specs. A number is a spec.

---

## Session 7: One Prompt, Four Agents

Session 7 had a different character entirely. The goal was to prototype a set of modern web features for the portfolio site — nothing critical, just exploratory. The prompt was intentionally loose:

> "Add View Transitions API, Aurora background, cursor tracking with card tilt, Scroll-Driven Animations, GSAP entrance effects, and Bento Grid layout. Just do it all."

AgentCrow — the multi-agent dispatch system configured in `CLAUDE.md` — parsed that into 4 parallel agents with independent file ownership:

```
━━━ AgentCrow ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dispatching 4 agents:

@toggle-panel  → create FeatureToggle.tsx (UI to toggle each feature on/off)
@cursor-effect → create CursorEffect.tsx (cursor tracking + card tilt logic)
@aurora-css    → create aurora.css (aurora gradient background animation)
@scroll-css    → create scroll-animations.css (Scroll-Driven Animations + GSAP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Each agent owned exactly one new file. No agent touched a file that another agent was writing. No merge conflicts possible by design.

While the 4 agents ran in parallel, the main thread waited. When all 4 completed, the main thread handled integration: wiring the new components into `Base.astro` and `index.astro`, passing props, and validating that the toggle panel could enable/disable each feature independently.

68 tool calls. 39 minutes from prompt to "all 6 features running locally."

For context: doing this sequentially — one feature at a time, each waiting on the last — would take at minimum 2-3 hours, and likely longer because you'd lose context between features. Parallel agents don't lose context. They each have a focused scope and execute simultaneously.

## Why the Rollback Was Cheap

After reviewing the implementation locally, I decided not to ship any of it. The features were well-built, but the overall aesthetic didn't fit where the site is right now. Too much going on.

The rollback took under 5 minutes.

Why? Because the agents created new files. They didn't patch `Base.astro`. They didn't rewrite `index.astro`. They added:

- `FeatureToggle.tsx`
- `CursorEffect.tsx`
- `aurora.css`
- `scroll-animations.css`

Rolling back meant deleting those 4 files and removing the integration wiring the main thread had added — a few lines in two files.

Compare that to the alternative: if the agents had edited existing components in-place, a rollback would require carefully reverting diffs across multiple files, checking for unintended side effects, and probably re-testing everything. With new files, the rollback is surgical.

> The cost of a rollback is proportional to how much existing code was modified, not how much new code was created.

This is a principle worth designing for. When you're prototyping with AI agents, encourage them to create new files over patching existing ones. It keeps the blast radius small.

## Deploying to Cloudflare Pages via wrangler

One thing worth documenting: during this session, I explored deploying directly via `wrangler` CLI rather than going through the Cloudflare dashboard.

```bash
npx wrangler pages deploy dist/ --project-name portfolio-site
```

It works. The deploy takes about the same time as a git-push-triggered deploy, but gives you more direct control over which build you're shipping. Useful for manual rollback scenarios or testing a specific build artifact.

In this case, I ultimately decided to roll back rather than deploy, but having the wrangler path available matters. Dashboard-driven deploys are fine for normal workflow; CLI deploys are better when you need precision.

## What "CLAUDE.md is configured right" Actually Means

The "just do it all" prompt only works because of what's in `CLAUDE.md`. Without the AgentCrow dispatch rules, Claude Code would execute those 6 features sequentially — one agent, one feature at a time, 2-3 hours minimum.

The relevant configuration is:

```markdown
## AgentCrow Rules
- For complex requests (2+ tasks), find matching agents from .claude/agents/ and dispatch them
- Dispatch independent tasks in parallel
- Each agent owns one file — no overlapping file ownership
- Main thread handles integration after agents complete
```

This isn't magic. It's a documented decision protocol. The `CLAUDE.md` file acts as a persistent system prompt that shapes how Claude Code interprets every subsequent prompt in the session. "Just do it all" lands very differently when the system already knows to decompose multi-task requests into parallel agent work.

The investment in writing good `CLAUDE.md` rules pays compound returns. Every session that follows gets better agent dispatch without any additional prompting.

## Four Things That Actually Hold Up

After two sessions and 223 tool calls, these are the four things that proved out in practice:

**1. Vague prompts are fine at the task level, not at the spec level.**
"Do all 6 features" is a good task-level prompt — it gives Claude Code room to decompose the work intelligently. "Make it faster" is a bad spec-level prompt — it gives the agent no ground truth to target. The distinction matters. Use natural language for task decomposition; use numbers for specs.

**2. Parallel agents scale the output, not just the speed.**
The 39-minute session wasn't just faster than sequential execution — it was qualitatively different. Each agent maintained focused context on its specific file. `@cursor-effect` only thought about cursor tracking. `@aurora-css` only thought about the gradient animation. The output quality per feature was higher than if one agent had context-switched between all six.

**3. New files are rollback-safe; patched files are not.**
This is an architectural principle for AI-assisted prototyping. If you're exploring features you're not sure you'll keep, structure the work so agents create isolated files. Integration can always be added; surgery on existing files is expensive to undo.

**4. Static data ages poorly in live systems.**
The `github-repos.json` bug wasn't a coding error — it was an architecture assumption that stopped being valid. Static snapshots of live data sources are technical debt that starts accruing the moment the data changes. If the data is live, the read should be live.

---

**Sessions:** 4 + 7
**Total tool calls:** 223 (155 + 68)
**Total time:** ~2h 20min (1h 41min + 39min)
**Features shipped:** Admin bug fixes, scroll animation tuning, typo fix
**Features built and rolled back:** View Transitions API, Aurora background, cursor tilt, Scroll-Driven Animations, GSAP, Bento Grid

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
