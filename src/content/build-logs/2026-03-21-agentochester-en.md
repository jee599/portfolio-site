---
title: "4 Parallel Claude Code Agents, 197 Tool Calls, and a Game That Technically Worked"
project: "agentochester"
date: 2026-03-21
lang: en
pair: "2026-03-21-agentochester-ko"
tags: [claude-code, multi-agent, game-dev, websocket]
description: "One prompt spawned 4 parallel Claude Code agents. 92 tests passed in 113 minutes. Then the user said 'Are you kidding me?' Here's what parallel AI agents actually get wrong."
---

92 tests passed. The WebSocket server was running. Two clients connected, the ball flew across the screen, scores incremented correctly.

The user's response: "Are you kidding me? This doesn't feel anything like the original game."

That's the agentochester story in two sentences.

**TL;DR** I used agentochester's multi-agent dispatch system to build a multiplayer Pikachu Volleyball clone. Parallel agents are genuinely fast for scaffolding — 4 agents running simultaneously, 14 files generated, functional multiplayer in under 2 hours. But "all tests passing" and "feels like the real game" are completely different things, and no amount of parallel execution closes that gap for you.

## One Prompt, Four Agents

The entire input was: "Make Pikachu Volleyball multiplayer."

agentochester takes a prompt, decomposes it into tasks, maps each task to an agent role, and dispatches them. The decomposer runs on `claude-opus-4-6`. This is what it came back with:

```
1. game_designer      — game mechanics design doc
2. frontend_developer — Next.js + Canvas client
3. backend_architect  — WebSocket multiplayer server
4. qa_engineer        — testing (after 1–3 complete)
```

The rule is simple: tasks that don't touch the same files run in parallel. `game_designer`, `frontend_developer`, and `backend_architect` started simultaneously. `qa_engineer` joined after the other three finished.

While agents ran, the terminal streamed completions one by one:

```
Agent "Game designer - mechanics" completed
Agent "Backend - WebSocket server" completed
Agent "Frontend - game client" completed
```

Client build: success. Server type check: pass. Then `qa_engineer` ran:

```
All 92 tests pass.
```

113 minutes from single prompt to working multiplayer game. On paper, that's a win.

## The Gap Nobody Measures

I ran the game. There was a port conflict from a previous process — cleared that — and then Pikachu Volleyball loaded.

It worked. Ball physics, WebSocket sync, score tracking, all of it functional. But it looked and felt like a tech demo, not a game. No sprites. Generic physics. The visual language of the original — the chunky pixel characters, the exaggerated jump arcs, the satisfying spike — was completely absent.

This is the honest limitation of multi-agent Claude Code dispatch: agents execute requirements, they don't infer intent. "Make Pikachu Volleyball multiplayer" is an underspecified requirement. A human engineer would probably ask "do you want it to look like the original?" An agent just builds what the words say.

The user was direct: "Find the original Pikachu Volleyball source, grab the assets, make it identical."

Two agents went back in:

```
1. Rewrite server — original physics engine
2. Rewrite client — sprites + physics
```

Both agents analyzed the original source, reconstructed the physics model, and swapped in sprite-based rendering. TypeScript strict mode: pass. Build: success.

## Where the Real Work Was

With proper assets and physics in place, the bugs started surfacing.

**SSR hydration error.** Next.js was failing on client/server render mismatch. The game canvas initialization had `typeof window !== 'undefined'` guards mixed into it, which broke React's hydration expectations. Fix: isolate the game engine as a client-only component, keep the Next.js shell clean.

**Frame rate inconsistency.** The original implementation used `requestAnimationFrame` without a fixed timestep, so game speed scaled with monitor refresh rate. At 144Hz the ball moved noticeably faster than at 60Hz. Fixed with a deterministic game loop: accumulate delta time, step physics at a fixed interval, render whenever.

**Aerial diving.** There was a bug where you could dive while airborne. Checked the original source — it has an explicit flag that only allows diving when the jump state is inactive. The agent had missed this conditional entirely.

**Spike direction.** In the original, holding Enter + a direction key spikes the ball that way, across 8 directions. The logic takes the input vector and computes angle. The agent had implemented spike without the directional component. One prompt fixed it:

```
Original source had this — no spike while airborne, and Enter + direction key
should spike toward that direction. Check all source files and implement properly.
```

The agent read the full original source, found the missing conditionals, and implemented both. This part actually went smoothly — source analysis + comparison + reimplementation is exactly the kind of tedious work where agents add real value. Doing it manually would have taken 30–45 minutes.

## Deploying to a Separate Repo

```
Create a new workspace at git@github.com:jee599/pikachu.git
and move all the Pikachu Volleyball code there
```

Migrated the code to a dedicated repo, added Railway deployment config. `WS_URL` as an environment variable, server on Railway WebService, client on Railway Static. A few more visual tweaks — removing persistent effects from the court, adjusting hit effect duration — and the game was close to the original.

Railway with an existing account: `railway up` and done.

## The Numbers

```
Total tool calls:  197
Bash: 84 | Read: 48 | Edit: 36 | Write: 17 | Agent: 12
Files modified: 10 | Files created: 12
Time: 1h 53m
```

Bash dominated at 84 calls because server startup, build verification, and type checks ran repeatedly through the debugging cycle. Agent count of 12 covers the initial 4-way dispatch plus the two rewrites and subsequent debugging agents.

The parallel dispatch was genuinely useful for the scaffolding phase — three agents working simultaneously across game design, frontend, and backend is faster than any sequential approach. But the initial result needed two full rewrites and a bunch of targeted bug fixes before it matched expectations.

The session cost would have been significantly lower with more precise upfront requirements. Specifying "match the original game's physics and sprites" in the initial prompt likely would have saved the first rewrite cycle entirely.

## What This Tells You About Multi-Agent Development

Parallel agents compress scaffolding time. They're less useful when the requirement is vague, because each agent interprets ambiguity independently, and there's no shared context between them to catch the gaps.

The feedback loop matters more than the dispatch speed. A 10-minute improvement in initial prompt specificity saved more clock time than whatever parallelism bought.

> "All 92 tests pass" measures spec accuracy, not user expectation accuracy. Those are different numbers, and only one of them shows up in the terminal output.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
