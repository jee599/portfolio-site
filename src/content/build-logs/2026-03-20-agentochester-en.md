---
title: "12 AI Agents, 197 Tool Calls: What 'Build It Like the Original' Actually Means"
project: "agentochester"
date: 2026-03-20
lang: en
pair: "2026-03-20-agentochester-ko"
tags: [claude-code, multi-agent, agentochester, game-dev]
description: "One prompt, 12 agents, 197 tool calls, 1h53m. Built a Pikachu Volleyball clone — then spent the rest rewriting it when agents had no reference for the original."
---

The prompt was one line.

```
Make Pikachu Volleyball multiplayer
```

agentochester parsed that and dispatched three agents in parallel — `game_designer`, `frontend_developer`, `backend_architect`. One hour and 53 minutes later, the tool call counter read 197.

**TL;DR** Parallel agents move fast. But "build something like X" without giving X as a reference means agents fill the gap with reasonable assumptions. Reasonable assumptions produce reasonable output — not the original. For domain-specific work like replicating a game's physics engine, you need the actual source, not a description of it.

## What agentochester does

agentochester is a CLI that decomposes user prompts into structured tasks and dispatches them to role-specific sub-agents. Internally, `claude-opus-4-6` acts as the task decomposer. It reads the prompt, breaks it into independent or sequential tasks, assigns agent roles, and executes them — parallel where possible, sequential where dependencies require it.

Sessions 1 through 3 were all zero-minute runs. No code output — just validating the decomposer against typical prompts: a to-do app, a REST API, a blog site. The JSON decomposition into roles and tasks worked cleanly each time. Giving the decomposer a natural-language description of a project and getting back structured role assignments felt immediately useful.

Session 4 was the first real build.

## Parallel x3 → QA → port conflict

The dispatch plan came out as:

```
1. game_designer      → game mechanics design document
2. frontend_developer → Next.js + Canvas client
3. backend_architect  → WebSocket multiplayer server
```

All three started simultaneously. Completion order: `game_designer` finished first, then `backend_architect`, then `frontend_developer`. Once the last agent completed, `qa_engineer` was dispatched. 92 tests. All passing.

Then I ran it manually. Port 3001 was already occupied.

Each agent had launched a dev server during its work — to verify a build, test an endpoint, check a render. When the agent's task finished, the agent exited. The OS process didn't.

This is the standard parallel agent environment problem. Each agent sees only its own task, not the shared environment. Agent A binds port 3001, finishes, exits — but the port stays open. Agent B either conflicts or silently grabs a different port. By the time QA runs, the environment is in a state none of the individual agents intended, and test suites that pass in isolation don't guarantee a clean integrated system.

## "That's not the original game"

After killing the orphaned process and getting things running, the feedback came:

```
Are you serious? The assets and physics are completely wrong.
This isn't Pikachu Volleyball. Find the original and copy it exactly.
```

Functionally, the agents had built a working game. Ball exchange, scoring, WebSocket multiplayer sync — all working. But the characters were solid-colored rectangles. The ball arc was wrong. No sprite animation, no dive animation, no visual feedback for spikes.

The problem wasn't the agents. It was the prompt.

"Make Pikachu Volleyball multiplayer" contains no reference to the original. From the agents' perspective, the request was: build a multiplayer volleyball game in the style of Pikachu Volleyball. They had no access to the original codebase, no sprite sheets, no physics specification. So they built what "volleyball game" means from first principles. Competent, functional, completely wrong.

An agent doesn't know what it doesn't know. It won't say "I'm not sure what the original physics felt like" — it'll implement physics that make sense for volleyball. The output is confident, reasonable, and misaligned.

## Original source analysis → physics rewrite

The original Pikachu Volleyball source (`git@github.com:jee599/pikachu.git`) was cloned into the workspace. Two agents were dispatched for targeted rewrites:

```
1. "Rewrite server — original physics"
2. "Rewrite client — sprites + physics"
```

With the actual source available, there was a lot to extract. The agents read the original directly and reimplemented from what they found:

Ball initial y-coordinate and spawn position. No-dive-while-airborne constraint — the player must be grounded to initiate a dive. Eight-direction spike detection based on arrow key state at moment of contact. Simultaneous Enter + directional key input handling. Frame-by-frame sprite animation sequencing.

Those 84 Bash calls were mostly environmental — build checks, port cleanup, TypeScript compilation, server restarts. The 48 Read calls were heavily concentrated on the original source files. The agents read every relevant file before touching the implementation. Understand first, change second.

After the rewrite, smaller bugs surfaced one at a time. 60fps frame timing was off. The airborne dive was still triggering under certain conditions:

```typescript
// Before: dive allowed mid-air
if (input.dive) {
  /* dive logic */
}

// After: ground-only dive
if (input.dive && player.onGround) {
  /* dive logic */
}
```

SSR hydration was mismatching on the game canvas — needed `useEffect` to defer canvas initialization to the client. Ghost trail artifacts remained in the renderer because the frame buffer wasn't clearing between animation frames.

Each fix was isolated. One bug at a time, verify, move to the next.

## What 197 tool calls looks like

```
Bash(84), Read(48), Edit(36), Write(17), Agent(12)
```

Bash dominated because most of the work was environmental, not code authoring. Every "does this work" question is a Bash call — build verification, server restart, port cleanup, type check.

Read at 48 was the original source analysis phase. Physics constants, collision detection, animation state machines — all read before any code changed.

Edit at 36 was the actual implementation: physics engine corrections, renderer changes, bug fixes. Write at 17 created new files — server modules, client components, test files.

Agent at 12 tracks the full dispatch history. Initial parallel: `game_designer`, `frontend_developer`, `backend_architect` (3). QA pass (1). Physics rewrite: client + server agents (2). Source analysis (1). Deployment config (1). Targeted bug fixes (4). Twelve total.

The session ran 1 hour 53 minutes. Most of that time was in the two parallel rewrite agents working through the original physics implementation.

## When parallel dispatch helps, and when it doesn't

Initial implementation was the ideal parallel case. Game design doc, frontend client, backend server — independent work, no shared mutable state, parallelism is free. This is where agentochester's dispatch model earned its keep.

Physics bug fixes were sequential by necessity. Fix the airborne dive, test the game, find the next issue. You can't know what the third bug is until you've fixed the second. Single agent, one at a time.

The pattern: parallelize when tasks are independent and don't share environment state. Serialize when each step depends on the previous result, or when concurrent writes to shared resources create conflicts.

Domain-specific work — replicating a specific game's physics — needs explicit reference material regardless of agent count. The number of agents doesn't change whether the input was precise enough to produce the right output.

> Telling an agent "make it feel like the original" without giving the original is a vague prompt. The agent will do its best with what it has. Its best won't match yours.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
