---
title: "Building Pikachu Volleyball Multiplayer with 6 Parallel Claude Agents — 90/90 Tests Pass"
project: "agentochester"
date: 2026-03-20
lang: en
pair: "2026-03-20-agentochester-ko"
tags: [claude-code, multi-agent, agentochester, game-dev]
description: "AgentCrow multi-agent orchestration: 6 parallel agents built Pikachu Volleyball multiplayer in one day. 9 API key failures, then 90 tests all passing."
---

The first 9 sessions all failed with the same error. "Invalid API key." Zero tool calls. Zero output. I was running agent orchestration tests on a project called agentochester — without actually configuring the API key.

Session 10 was the first time I saw "Hi! 👋".

**TL;DR**: AgentCrow decomposed "build Pikachu Volleyball multiplayer" into 6 parallel agents — PM, data pipeline engineer, game designer, frontend developer, backend architect, and QA engineer. One day later: 8 physics engine files, 7 client renderer files, 90 tests — all passing.

## 9 Failures Before Writing a Single Line of Code

Sessions 1 through 9 all ran against the `<synthetic>` model. When there's no Anthropic API key, there are no agents. That's obvious in theory. It took 9 failed sessions to make it stick in practice.

The moment I set the key and ran session 10, the agent responded. First real progress of the project.

Infrastructure first. Always. Even when you're building infrastructure to manage other infrastructure.

## How One Prompt Becomes Six Agents

The core of agentochester is `smart-decomposer.ts`. It takes a user prompt and splits it into role-specific agent tasks.

The input was this:

> "Grab the Pikachu Volleyball resources and make it multiplayer. Start with a spec and implement it."

That single sentence got decomposed into 6 tasks:

```json
[
  {"role": "product_manager", "action": "Game rules, network architecture, MVP scope doc"},
  {"role": "data_pipeline_engineer", "action": "Sprite sheet and sound asset collection"},
  {"role": "game_designer", "action": "Physics engine, collision detection, sync protocol"},
  {"role": "frontend_developer", "action": "Canvas rendering, game loop, keyboard input"},
  {"role": "backend_architect", "action": "WebSocket server, room creation, reconnection handling"},
  {"role": "qa_engineer", "action": "Physics unit tests, E2E, input latency validation"}
]
```

Each agent ran with the same prompt structure:

```
You are Game Designer Agent Personality (game_designer).
[CRITICAL RULES]
- Do NOT ask questions. Make decisions yourself and proceed.
- Do NOT ask for confirmation. Just do the work.
[Task]
Design Pikachu Volleyball game mechanics — 2D physics engine...
[File Scope]
src/game/
```

The `[CRITICAL RULES]` section is the load-bearing piece. Without it, agents loop back into question mode. Early sessions had the PM agent presenting four options for "what form the spec should take," and the game designer asking "should I use the visual companion?" Explicit execution rules break that loop. Agents start deciding instead of asking.

## What Each Agent Actually Produced

**Data Pipeline Engineer** (session 20, 28 tool calls) pulled assets from the `gorisanson/pikachu-volleyball` open-source repo: `sprite_sheet.png` (476×885 pixels) and 16 sound files. WAV-to-MP3 conversion hit a wall immediately — no `ffmpeg` installed. The agent switched to macOS's built-in `afconvert`, then hit another wall: source files were 8-bit PCM, which can't convert directly to AAC. Solved it in two steps: 8-bit → 16-bit PCM first, then → M4A. When one path closes, find another.

**QA Engineer** (session 28, 21 tool calls) wrote tests before seeing any game code. It installed `vitest` and created 18 physics engine tests, 18 WebSocket tests, 18 E2E tests, and 18 performance tests — all from reading the PRD alone. When the actual game engine arrived, the suite expanded to 90. All passed.

During execution the QA agent caught a real bug in `forceBallDrop`. When the ball spawned near the floor, it collided with the player first and bounced off unpredictably. Fix: adjust player spawn position. A later run caught a loop bug in the scoring logic — `resetForServe` was being called after the 14th point, on the final point of the game. Both bugs caught, diagnosed, and fixed by the same agent that wrote the tests.

**Game Designer** (session 39, 20 tool calls) created 8 files under `src/game/`: `constants.ts`, `physics.ts`, `collision.ts`, `animation.ts`, `scoring.ts`, `sync.ts`, `engine.ts`, `types.ts`. TypeScript type narrowing warnings came up during implementation. The agent correctly identified these as type system issues rather than logic bugs and handled them without escalating.

**Frontend Developer** (session 43, 43 tool calls) — the most active agent by tool usage. Built 7 files: `sprite-loader.ts`, `sound-manager.ts`, `input-manager.ts`, `network-client.ts`, `renderer.ts`, `game-client.ts`, and the game page itself. A build error appeared, but it traced back to a pre-existing issue in a Next.js `_global-error` page — nothing in the game code. All game-related TypeScript passed clean.

## Why the Decomposer Ran the Same Task 10+ Times

Session logs show the decomposer generated nearly identical Pikachu Volleyball tasks across sessions 15, 16, 17, 19, 21, 30, 31, 32, 33, 35, and 36. The same JSON, again and again.

This wasn't a bug. It was the experiment.

Out of 73 total sessions, roughly 10 actually wrote production code. The rest were decomposer tuning, agent role mapping validation, and orchestrator result-aggregation experiments. Building the orchestration system required running the orchestration process many times to understand what worked.

There's a real irony here: to build a system that decomposes tasks intelligently, you have to manually run the same task many times with slight variations and observe what changes. The orchestrator had to be hand-orchestrated first.

## When the Brainstorming Skill Kept Interrupting

Early sessions had a recurring pattern: `superpowers:brainstorming` kept triggering right before implementation. PM agent, game designer, frontend developer — each time a major implementation was about to start, the skill loaded and pulled the agent back into clarification mode.

Adding `[CRITICAL RULES]` broke the cycle. Even when an agent loads a skill that encourages brainstorming and confirmation-seeking, explicit execution rules override it.

This matters beyond this one project. Any long-running multi-agent system will have agents hitting configured skills, system defaults, or trained tendencies that push toward asking rather than doing. The fix isn't disabling skills — it's making execution rules explicit enough to be unambiguous.

## 90 Tests Written Before the Code Existed

The final output:

```
Test Files: 4 passed
Tests:      90 passed
Duration:   330ms
```

Physics collision detection, WebSocket reconnection logic, 2-player E2E, input latency under 200ms. All written by the QA agent from the PRD alone, before any game code existed. When the implementation arrived, the tests passed.

TDD works across agents, not just within a single codebase.

The QA agent didn't just run tests mechanically — it debugged failures, proposed fixes, and verified them. The `forceBallDrop` bug and the `resetForServe` loop were both caught and resolved by the same agent that wrote the original tests. That's the behavior you want: a QA agent that's also a debugging agent.

> The more complex the orchestrator, the simpler and clearer each agent's instructions need to be.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
