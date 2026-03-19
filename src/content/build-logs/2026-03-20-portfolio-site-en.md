---
title: "I Gave 6 Claude Code Agents One Prompt. They Built a Multiplayer Game in a Day."
project: "portfolio-site"
date: 2026-03-20
lang: en
pair: "2026-03-20-portfolio-site-ko"
tags: [claude-code, multi-agent, agentcrow, ai-automation]
description: "AgentCrow orchestrated 6 Claude Code agents from a single prompt — PRD to 90 passing tests in one day. The brainstorming skill nearly killed it."
---

Nine sessions. All nine ended with the same error:

```
Invalid API key · Fix external API key
```

Zero tool calls per session. That's how real multi-agent testing starts — not with a clean handoff, but with a broken environment variable and a lot of nothing happening.

**TL;DR** I stress-tested AgentCrow, a multi-agent orchestration system built on Claude Code, with a single prompt: "Get the Pikachu Volleyball assets and build a multiplayer version — PRD first." One Task Decomposer split that into 6 parallel agents. 79 sessions total, 90 tests passing. The biggest blocker wasn't the code. It was a brainstorming skill that turned every agent into a question-asker.

## Nine Failures Before Anything Ran

AgentCrow decomposes natural language prompts into discrete agent tasks and dispatches up to 5 agents in parallel. 144 agent definitions live in `.claude/agents/`, covering roles from PM to QA to Data Pipeline Engineer.

My first real test prompt: "Build me a web app that crawls AI news and sends it by email." Four agents launched. Four agents died immediately, all with the same error.

It took less than 10 minutes to fix the environment variable. But those 9 failed sessions were useful data.

When a misconfigured environment kills an agent immediately and loudly, that's a good failure mode. It's far better than an agent that silently produces wrong output and passes it downstream. Loud failures are debuggable. Silent ones compound.

After fixing the key, the actual test began.

## One Line Becomes Six Parallel Workstreams

The prompt that kicked off the real test:

```
Get the Pikachu Volleyball assets and make it multiplayer.
Write the PRD first, then implement.
```

The Task Decomposer split this into 6 parallel workstreams:

A **PM agent** to write the product spec. A **Data Pipeline agent** to scrape assets from the source repo. A **Game Designer agent** to design the physics and collision engine. A **Frontend Developer agent** to build the Canvas-based client. A **Backend Architect agent** to handle WebSocket infrastructure and game state. A **QA Engineer agent** to write the test suite.

In theory: parallel-safe, no hard state dependencies, clean handoffs through shared files. Each agent works in its own lane.

In practice: every agent stopped and asked a question before doing anything.

## The Skill That Froze the Pipeline

The Game Designer agent, first response:

> "Before I start designing, I have one question. **What kind of multiplayer experience are you targeting?** Real-time competitive? Turn-based? Local co-op?"

The Backend Architect agent:

> "I could show you a mockup or diagram in the browser — though this feature is new and uses significant tokens. Want me to try?"

This happened nine separate times across different agents, different roles, different questions. The pattern was identical: launch → ask for confirmation → stop.

The root cause was the `brainstorming` skill, which was being loaded for every agent. That skill contains a hard gate:

```
<HARD-GATE>: Do NOT invoke any implementation skill
until the brainstorming phase is complete.
```

The brainstorming skill exists for good reasons. When you're working with a person, running a clarification phase before implementation prevents you from building the wrong thing. It's a useful discipline.

But in a multi-agent pipeline, an agent that asks a question is an agent that has stopped working. A pipeline where five agents are all waiting for human confirmation isn't running — it's just waiting. The assumption baked into the brainstorming skill ("there is a human available to answer questions") breaks completely when agents are running autonomously.

The fix was four lines prepended to every agent dispatch:

```
[CRITICAL RULES]
- Do NOT ask questions. Make decisions yourself and proceed.
- Do NOT ask for confirmation. Just do the work.
- If you need to choose between options, pick the best one and explain why.
- Create actual files and write actual code. Do not just describe what to do.
```

After adding this context override, agents started creating files.

## What Each Agent Actually Produced

**PM agent** — 5 tool calls, one file: `docs/pikachu-volleyball-prd.md`.

The spec was genuinely usable: court dimensions at 432×304px, service/receive/spike mechanics with specific timing windows, Authoritative Server model with WebSocket protocol, first-to-15-points win condition. Not a vague outline — a buildable spec.

**Data Pipeline agent** — 28 tool calls, pulling from `gorisanson/pikachu-volleyball`.

Spritesheet extracted, 16 audio files captured in dual WAV+M4A format, animation frame data parsed. Generated `public/assets/manifest.json` and `animations.json`. One non-obvious detail that came up: converting 8-bit PCM WAV files to M4A required a 16-bit intermediate conversion step via `afconvert`. The agent figured this out without being told.

**Game Designer agent** — 20 tool calls, 8 TypeScript files in `src/game/`:

`physics.ts`, `collision.ts`, `animation.ts`, `scoring.ts`, `sync.ts`, `engine.ts`, `types.ts`, `constants.ts`. All TypeScript checks passed on the first pass.

**Frontend agent** — 43 tool calls, the full rendering layer in `src/game/client/`:

`sprite-loader.ts`, `sound-manager.ts`, `renderer.ts`, `input-manager.ts`, `network-client.ts`, `game-client.ts`, `GameCanvas.tsx`, and the page route at `app/game/page.tsx`.

One build error appeared — but it wasn't in the game code. The `/_global-error` pre-rendering failure is a known Next.js 16 issue, not something the agent introduced.

**Backend Architect agent** — WebSocket server implementing the Authoritative Server model defined in the PRD. Game state managed server-side, synchronized to clients on each tick.

**QA agent** — 21 tool calls, and the most interesting result of the batch:

```
Test Files  4 passed (4)
Tests       90 passed (90)
Duration    330ms
```

Four test files, 90 tests, all passing. The suite covers `tests/physics/collision.test.ts` (collision detection, reflection, gravity), `tests/network/websocket.test.ts` (connection, reconnection, room management), `tests/performance/input-latency.test.ts` (sub-200ms validation), and `tests/e2e/two-player.test.ts` (simulated 2-player concurrent gameplay).

The QA agent wrote all 90 tests before any implementation code existed, working entirely from the PRD. No running code to test against — just a specification. If the spec is clear enough to build from, it's clear enough to test against.

## The Failure Mode Worth Talking About

The 79-session count includes something worth being honest about.

The Task Decomposer session appears more than 10 times in the logs. The same "Pikachu Volleyball" task was decomposed repeatedly — same input, same output, multiple times.

AgentCrow's orchestration logic wasn't tracking task completion state properly. Already-completed tasks were getting re-dispatched. No state persistence between orchestrator runs meant no way to say "this workstream is done, don't start it again."

This is the kind of failure that doesn't appear in demos. Demos show the happy path — one prompt, clean decomposition, parallel execution, done. Production usage surfaces the edge cases: what happens when the orchestrator restarts mid-task? What happens when a task completes but the completion isn't recorded? What happens when the same task decomposition runs twice because the first run's result wasn't persisted?

Multi-agent systems live or die on state management. "Track which tasks are complete" sounds trivial. Failing to do it means burning sessions on redundant work, and in a token-billed environment, redundancy has a direct cost.

## Skills Designed for Humans Break in Autonomous Pipelines

The brainstorming skill problem generalizes to a broader pattern.

Every skill makes assumptions about its execution environment. The brainstorming skill assumes: there is a human available, the human has context about the task, and asking the human a question will produce a useful answer. These assumptions are correct when a developer is actively working with Claude Code.

In a multi-agent pipeline, none of these assumptions hold. There's no human in the loop. The agent's question goes unanswered. The pipeline stalls.

This isn't an argument against brainstorming skills — it's an argument for being explicit about execution context. The four-line CRITICAL RULES block that fixed the issue is essentially a context declaration: "you are operating autonomously, without human supervision, make decisions and proceed."

Skills built for interactive use need an explicit "autonomous mode" or need to check their execution context before applying their defaults. Otherwise composing human-in-the-loop skills into autonomous pipelines will keep producing the same class of failure.

The same principle shows up in other domains. Stripe's Radar doesn't block a transaction to ask a human "is this fraudulent?" — it makes a decision and acts. Human review happens after the fact, asynchronously, for edge cases that the automated system flags. Autonomous systems and human-in-the-loop systems have different decision architectures. Mixing them without being explicit about which context you're in creates exactly the kind of pipeline stall that happened here.

## One More Thing: Portfolio Site Redesign

Separate from the AgentCrow testing, jidonglab.com got a structural update this week.

The homepage is now project-centered rather than post-centered. Projects are sorted by status: live → beta → in development → discontinued. AgentCrow and ContextZip updated to live status.

The redesign was a single focused session — no agents, direct edits, one commit. Some tasks don't need orchestration. Knowing which tasks benefit from multi-agent parallelism and which don't is its own skill.

> When an agent asks a question, the pipeline stops. In multi-agent systems, autonomy isn't a feature — it's a requirement.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
