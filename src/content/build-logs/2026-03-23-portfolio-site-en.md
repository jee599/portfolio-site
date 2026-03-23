---
title: "I Ran 4 Parallel Claude Code Agents and Rolled Back Everything"
project: "portfolio-site"
date: 2026-03-23
lang: en
pair: "2026-03-23-portfolio-site-ko"
tags: [claude-code, agentcrow, parallel-agents, rollback, astro]
description: "295 tool calls across two sessions: GitHub API 409 conflicts, discovering thum.io, and dispatching 4 parallel agents via AgentCrow — then rolling it all back."
---

295 tool calls. Two sessions. Net change: one improved admin panel and a thum.io integration. Everything else got rolled back.

That's the honest summary of yesterday. Not a failure, exactly — more like a fast-forward through "what if we tried everything at once" and a quick answer of "not today."

**TL;DR** — Session 1 (1h 41min, 155 tool calls) fixed a stale GitHub repo list and hit a SHA mismatch 409 in the GitHub API. Session 2 (39min, 68 tool calls) dispatched 4 parallel Claude Code agents via AgentCrow to implement aurora background, custom cursor, Bento Grid, and scroll animations simultaneously — all working, all rolled back because the aesthetic didn't fit the site.

## The Admin Panel That Was Quietly Lying About My Projects

`jidonglab.com/admin` has a project list. That list was wrong. Newly created GitHub repos weren't showing up, and it took longer than I'd like to admit to understand why.

The data came from `github-repos.json` — a static file generated at build time. Of course it was stale. Any repo created after the last Cloudflare Pages deploy simply didn't exist from the site's perspective. The bug wasn't in the code. It was in the architecture: a snapshot masquerading as live data.

The fix: make the admin panel fetch live from the GitHub API on demand rather than reading the frozen build artifact. Obvious in retrospect, invisible until you're staring at it.

## A 409 Error That Was Entirely My Own Fault

While building the project registration flow in the admin panel, the GitHub API started returning 409s:

```
GitHub API error: {"message":"src/content/projects/cleantech.yaml does not match
7a85c7d8e4e3f27db8fc39d836a457bc0b98ef49","documentation_url":"...","status":"409"}
```

GitHub's file update API requires the current file's SHA alongside the new content. If the SHA you send doesn't match what's actually on disk, the write is rejected — optimistic concurrency, by design.

The problem was that the code was caching the SHA from a previous GET and reusing it on subsequent PUT requests without refreshing. The fix: add a GET call immediately before each PUT to fetch the latest SHA. Not glamorous, but correct.

## thum.io: The Screenshot Pipeline I Didn't Need to Build

Projects without local screenshot assets were rendering as blank cards. The obvious fix is to go take screenshots of everything, manage the files, check them in. The better fix is to not own that problem at all.

```
thum.io/get/width/400/https://refmade.com
```

Pass a URL, get a rendered screenshot back. No API key. No account. No asset pipeline. The implementation became a simple fallback: if a project has a local screenshot in `screenshotMap`, use it; otherwise construct the thum.io URL and let them handle it. Two lines of logic, zero ongoing maintenance.

## Three Prompts to Set One Animation Duration

There's a small but instructive failure buried in session 1. Adjusting scroll speed for the admin panel's project marquee took three sequential prompts: "same speed", "2x faster", "2x faster again", and finally "set it to 2 seconds." We landed on `animation-duration: 2s` — which is what I should have written in the first message.

When you have a concrete target value in mind, say it. "Adjust the speed" forces the model to guess, and guessing costs round trips. 155 tool calls for a conceptually straightforward session reflects more iteration overhead than necessary. Some of that was the SHA investigation; a fair amount was underspecified prompts requiring correction loops.

## Session 2: Dispatching 4 Agents to Implement 6 Technologies in 39 Minutes

The second session started with a deliberately open ask: "I want to use more modern web tech on this site."

Claude Code analyzed the current portfolio state: heavy on inline styles, animations were a basic `fadeIn`, nothing particularly modern. Six additions emerged as candidates — Astro View Transitions, CSS Scroll-Driven Animations, aurora/mesh gradient backgrounds, custom cursor with card tilt, Bento Grid layout, and GSAP animations.

Rather than picking one and iterating, the ask was: give me a toggle panel so I can switch each feature independently and evaluate them all live.

AgentCrow dispatched 4 parallel Claude Code agents:

```
━━━ 🐦 AgentCrow ━━━━━━━━━━━━━━━━━━━━━
Dispatching 4 agents:

🖥️ @toggle-panel  → FeatureToggle.tsx 컨트롤 패널 컴포넌트 생성
🖥️ @cursor-effect → CursorEffect.tsx 커서 추적 + 카드 틸트 컴포넌트 생성
🎨 @aurora-css    → aurora 배경 CSS 생성
🎨 @scroll-css    → CSS Scroll-Driven Animations CSS 생성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

While the agents ran, the main thread handled GSAP installation and Bento Grid CSS. All four finished in under 10 minutes.

What came back:
- `aurora.css` — toggled via `[data-ft-aurora="on"]` data attribute on the document root
- `CursorEffect.tsx` — 40px cursor glow with `mousemove` card tilt using CSS perspective transforms
- `FeatureToggle.tsx` — fixed bottom-right panel, 6 independent toggle buttons
- `scroll-animations.css` — CSS Scroll-Driven Animations spec, scroll progress bar and entrance effects

Integration was clean. Every toggle worked independently. The feature gate design held up exactly as intended.

## Why Parallel Agents Are Faster (The Actual Reason)

The speedup from parallel multi-agent execution isn't just raw throughput. It's the shape of the dependency graph.

`aurora.css`, `CursorEffect.tsx`, `FeatureToggle.tsx`, and `scroll-animations.css` are completely independent files. No shared state, no import relationships between them. Processed sequentially, you pay the full cost of each agent's execution time in series. Processed in parallel, you pay only the cost of the slowest one.

The constraint on parallelism isn't compute — it's file conflicts. AgentCrow's job is to identify which tasks have non-overlapping write surfaces and batch them. When the graph is right, 4 components are production-ready in the time it takes to do 1.

## "Just Roll It All Back"

Integration done. I asked Claude Code to deploy. The response was a reminder of how Cloudflare Pages works: deployments trigger from `git push`. No wrangler path exists for direct frontend deploys without pushing to the remote branch.

So it pushed. I saw the result live. Then:

> "Just roll it all back."

The features worked. The aurora gradient was visually interesting. The cursor effect was smooth. But none of it fit the site — `jidonglab.com` is built around a clean, toss.tech-style minimal aesthetic. Gradient effects and glowing cursors are noise against that baseline. They're right for a creative portfolio or a product landing page. They're wrong for a dev log site.

One rollback commit. Back to the starting state.

The four components exist as a reference. Next time the aesthetic question gets a different answer, the implementation is already written.

## The Accounting

Session 1 (admin integration): 1h 41min, 155 tool calls — Bash 78, Read 35, Edit 15.

Session 2 (modern web tech experiment): 39min, 68 tool calls — Bash 18, Read 14, TaskCreate 6.

Combined: 295 tool calls. Net diff: admin panel improvements, GitHub API SHA handling, thum.io fallback. Everything from session 2 was reverted.

The rollback doesn't invalidate the session. The cost was 39 minutes and 68 tool calls — cheap enough to call exploration rather than waste. The more useful lesson is about the gap between parallel agents and "are we building the right thing."

Parallel agents solve the execution speed problem. They don't solve the product direction problem. The faster you can build, the easier it is to skip the moment of asking whether the thing you're building should exist. By the time the results are in, you're evaluating finished work instead of questioning the premise.

> Confirm direction before you dispatch.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
