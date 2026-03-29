---
title: "AgentCrow v5: I Benchmarked 3 Claude Code Agent Modes — 41s vs 89s vs 197s"
project: "portfolio-site"
date: 2026-03-29
lang: en
pair: "2026-03-29-portfolio-site-ko"
tags: [claude-code, agent-teams, agentcrow, benchmark, parallel-agents]
description: "Direct: 41s. Parallel agents: 89s. Teams: 197s. Real benchmarks on Claude Code multi-agent routing and when each mode actually makes sense."
---

More agents should mean faster results. In my benchmarks, using Claude Code Teams on a simple task was **4.8x slower** than just handling it directly.

**TL;DR** AgentCrow v5 routes requests across three execution modes — direct, parallel agents, and Teams — based on task structure. Benchmarks: direct 41s · parallel 89s · Teams 197s. The entire game is picking the right mode for the job.

## The Question That Started This

The conversation was short:

```
Me: is agentcrow working?
Me: when agents are created, does it automatically hand off to agent teams?
Claude: Currently spawning sub-agents directly without Teams
Me: I want it to use teams
Me: I'm thinking of it as a router between teams and prompts
```

AgentCrow already had 144 agent personas — a router in concept. But in practice it was calling the `Agent` tool directly, skipping Teams' `SendMessage` handoff entirely. The natural follow-up: how much does that actually matter? Time to measure.

## Benchmark Setup

Three modes, same task: implement `slugify`, `deepClone`, and `retry` utilities with tests. Three independent modules, six total files — clean and comparable.

**Mode 1: Direct** — write all six files sequentially, no agents.

**Mode 2: Parallel agents** — spawn three `Agent` tool calls simultaneously, each handling two files.

**Mode 3: Teams** — full `TeamCreate` → `TaskCreate` → `Agent(team_name)` → `SendMessage` handoff chain.

I also ran a dependency scenario separately: `types` → `validator` → `formatter`, each importing the previous one.

## The Numbers

| Mode | Time | Tool Calls |
|------|------|------------|
| Direct | **41s** | 12 |
| Parallel agents | **89s** | ~45 |
| Teams | **197s** | ~80 |

Teams was 4.8x slower than direct. Every part of the Teams machinery adds latency: spawn overhead, `TeamCreate`, `TaskCreate`, and `SendMessage` round-trips all stack up.

This doesn't mean Teams is bad. On the dependency scenario, the calculus changed.

## When to Use Each Mode

**Go direct** when you have 1–5 files, clear specs, and a single domain. The agent spawn overhead exceeds the work itself on small tasks — you're paying a fixed cost for zero benefit.

**Parallel agents** fit when you have 2+ distinct domains, no file conflicts, and you can write the full spec upfront. Even with dependencies, if you can describe the interface in text, parallel is enough. In the `formatter` → `types` case, I just included the `types` interface in the formatter agent's prompt. No Teams needed.

**Teams** earns its overhead when agent A's *runtime output* is the input for agent B. Schema analysis → migration generation. Build error collection → fix implementation. Codebase exploration → targeted implementation. The key phrase: "dynamic information that can't be written into the prompt in advance."

## The AgentCrow v5 Decision Flow

This went straight into `CLAUDE.md`:

```
Q1. ≤5 files, clear spec?
  YES → Direct
  NO  ↓

Q2. Can you write everything each agent needs in the prompt upfront?
  YES → Parallel agents (Agent tool, no Teams)
  NO  ↓

Q3. Does agent B need agent A's runtime result?
  YES → Teams (TeamCreate + SendMessage handoff)
```

The previous v4 collapsed this to: "complex request → use agents." Measuring revealed that rule fails in both directions — Teams on independent tasks wastes 4x+ time, while direct handling on small tasks is consistently fastest.

## Parallel Agents at Scale: 83 References

During the same period, I used parallel agents heavily on the refmade project — recreating 83 real SaaS landing pages (Stripe, Vercel, Linear, Notion, Supabase, Clerk) as HTML from screenshots.

The prompt was minimal:

```
continue the refmade reference implementation→evaluation loop. start from 007 re-evaluation
```

The pattern: batch 4–5 references, spawn agents in parallel, each compares its implementation against the original screenshot, score ≥9/10 means PASS. Repeat. A 42-hour session, 302 tool calls.

Rate limits hit multiple times mid-batch. When an agent returns `"You've hit your limit · resets 11pm (Asia/Seoul)"`, only that agent pauses — the rest keep running. Three "continue" prompts total across the session.

Image quality was a friction point. CSS placeholder shapes dragged scores down. The fix: Gemini Imagen API. Claude writes a specific image prompt per reference, calls the API, and patches the HTML. `056-app-store` got an auburn hair, cream blazer professional. `064-neon-cinema` got a real concert stage. `073-poppr` got a VR exhibition space.

## Session Stats

- Total sessions: 5
- Total tool calls: 466
- By tool: Read 196, Bash 108, Agent 75, Write 19
- Files created: 17, files modified: 5

## What I Actually Learned

Before running these benchmarks, "more agents = better" felt intuitively true. Measuring gave me a concrete framework instead. Teams is the right answer less often than expected. Independent tasks run faster in parallel, and even dependency chains don't require Teams as long as you can describe the interface upfront.

In multi-agent orchestration, the question isn't "how many agents?" It's "what execution mode fits this task's dependency structure?"

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
