---
title: "334 Tool Calls: How Parallel Claude Code Agents Shipped 20 HTML References in One Day"
project: "portfolio-site"
date: 2026-03-30
lang: en
pair: "2026-03-30-portfolio-site-ko"
tags: [claude-code, agents, agentcrow, parallel, refmade]
description: "334 tool calls, 20 HTML references, one day. Parallel agents, rate limit checkpoints, and Gemini image generation across 9 sessions."
---

334. That's the number of tool calls fired in a single Claude Code session. Twenty agents running simultaneously — reading HTML, taking screenshots, scoring each other's output. Add three rate limit walls and a Gemini image generation pipeline, and that's what one day of parallel agent work looks like.

**TL;DR** Parallel agents are dramatically faster for independent file work. But without a rate limit retry pattern, roughly half your agents will return "You've hit your limit" and nothing else.

## The Problem: 37 Unfinished References and a Deadline

refmade is a design reference project — the goal is to re-implement curated HTML layouts so they match their original screenshots as closely as possible. Out of 83 references, over 40 were unfinished. Each one had an evaluation loop: compare against the original image, score it, mark PASS if it hits 8.5/10 or above.

One session had 37 incomplete references queued:

```
014, 023, 025, 027, 029, 030, 031, 039, 043, 048, 049, 052, 056, 057, 058,
059, 060, 061, 062, 063, 064, 065, 066, 067, 069, 070, 073, 074, 075, 076,
077, 078, 079, 080, 081, 082, 083
```

Sequential processing was never an option. The workflow was: scan the incomplete list → distribute 4–5 references per agent → each agent compares current HTML against the original screenshot, patches it, captures the result with Playwright → score it → PASS if ≥ 8.5/10.

Five agents spawned simultaneously, each working on a different reference file. No shared state. No file conflicts. Textbook parallel agent territory.

## Hitting the Rate Limit — and What "Resume" Actually Means

Spawn five agents at once, and sooner or later you get this back:

```
"You've hit your limit · resets 11pm (Asia/Seoul)"
```

The problem isn't the limit itself — it's what the agent returns. Just that one line. You have no idea whether the task completed or not. Checking the session shows 7–15 tool_uses logged, but whether the file actually changed requires a manual diff.

The prompt I used to recover: **"다시 진행해"** — two words in Korean, roughly "resume." That's it.

Claude scanned which agents had finished, which had stalled mid-task, and resumed from the last known checkpoint. This pattern repeated twice in the same session.

> Rate limits in large parallel workloads aren't exceptions — they're expected. Treat them like checkpoints, not failures.

The practical implication: when you're running 20+ agents across a session, budget for at least two rate limit pauses. Design your prompts so that "check what's done, continue what isn't" is a natural recovery path — not an afterthought.

## AgentCrow Benchmark: Teams API vs Parallel Agents vs Direct

During an AgentCrow tuning session, I ran an actual performance comparison. Same task, three execution strategies:

1. **Claude Teams API** — `TeamCreate` + `SendMessage` for coordinated multi-agent work
2. **Parallel subagents** — `Agent` tool, multiple independent spawns
3. **Direct processing** — Claude working through tasks sequentially

The benchmark task was a TypeScript module set with interdependencies: `slugify.ts`, `deepClone.ts`, `types.ts`, `validator.ts`, `formatter.ts`.

| Method | Speed | Dependency handling | State sharing |
|--------|-------|--------------------|-|
| Teams API | Slow | Yes | Real-time |
| Parallel agents | Fast | No | None |
| Direct | Medium | Natural | Full |

Parallel agents finished 2–3x faster than Teams for the independent files. But `formatter.ts` had a hard dependency on `validator.ts` output — and that's where it broke. One agent tried to import a type that the other hadn't written yet.

The rule this confirms: **parallel agents for independent files, Teams or direct for anything with shared state or ordering constraints.** Mixing them without mapping dependencies first guarantees at least one failure.

## Gemini API: When CSS Shapes Don't Cut It

Several refmade references required real photography — people, product shots, lifestyle imagery. CSS shapes as placeholders are immediately obvious in quality scoring, typically costing -1 to -2 points per image mock-up.

The fix: Gemini Nano API for image generation, prompts written directly by the agent.

```
8K hyperrealism photography, woman with auburn hair wearing cream blazer,
natural office lighting, shallow depth of field, editorial style
```

Applied to `056-app-store-showcase.html` (Revolut-style landing page), the result was close enough to the original that the scoring difference dropped to noise. Same approach for:

- `064-neon-cinema` — concert crowd photography
- `073-poppr` — VR headset product shot
- `070-overlay-beauty` — beauty brand editorial

> If your reference implementation uses placeholder shapes where the original has photography, you're leaving points on the table. Real image generation APIs are load-bearing for fidelity scores.

## Tool Usage Across Sessions

| Session | Tool calls | Top tools |
|---------|-----------|-----------|
| refmade loop | 334 | Read (164), Bash (88), Agent (54) |
| AgentCrow benchmark | 198 | Bash (22 + parallel teams), WebSearch (11) |
| spoonai i18n fix | 55 | Read (23), Bash (14), Edit (5) |

`Read` is the most-called tool by a wide margin. The reason: before spawning any agent, I read the actual source code to extract the spec. Pulling types, interfaces, or file paths from memory means agents reference things that don't exist or paths that have moved.

This habit — **read the code, then write the prompt** — is the single biggest quality multiplier for agent-driven work. A prompt with wrong types produces wrong code at agent speed.

## Two Bugs, Same Symptom, Different Root Causes

After deployment, the reference gallery was showing broken preview images.

```
refmade.com에서 연결을 거부했습니다.
(Connection refused from refmade.com)
```

First fix: `next.config.ts` missing `refmade.com` in the `images.domains` array, plus missing CORS headers in `middleware.ts`. Done.

Then the same symptom came back. Same broken preview message. Different cause: the thumbnail path in the main gallery view was hardcoded to `/samples/` — a different base path than where the images actually lived. Fixed the path generation logic in `GalleryClient.tsx`.

Same error message. Two completely separate root causes. The second diagnosis was fast because I shared a screenshot. Without it, Claude would have assumed the same fix applied twice — because that's the natural prior given the identical symptom.

> When debugging recurring symptoms, share a screenshot before describing the problem. Text descriptions anchor to the previous fix; visual context forces fresh analysis.

## What Carried Over

Five things worth keeping from this batch of sessions:

**Independent files → parallel agents.** Any time a task maps cleanly onto separate files with no shared types or imports, parallel agents are the right call. The speedup is real and consistent.

**Rate limits are checkpoints, not blockers.** "Resume from where you left off" is a valid single-sentence prompt for recovery. Build the mental model that large parallel sessions will pause — and plan for it.

**Read the code before writing agent prompts.** Memory is wrong often enough that it's not worth trusting. Five minutes reading the actual types and paths saves 30 minutes debugging a confused agent.

**Image generation is load-bearing for visual references.** Shape-based placeholders score 1–2 points lower than real images. If you're evaluating against visual fidelity, image API integration pays for itself immediately.

**Same symptom, different cause — screenshot first.** Verbal bug reports lead to pattern-matching on previous fixes. Screenshots surface actual current state and make the second root cause obvious.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
