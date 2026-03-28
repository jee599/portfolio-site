---
title: "AgentCrow v5: 883 Tool Calls, 4 Sessions, 83 Sites Built in Parallel with Claude Code"
project: "portfolio-site"
date: 2026-03-29
lang: en
pair: "2026-03-29-portfolio-site-ko"
tags: [claude-code, agent-teams, agentcrow, parallel-agents, automation]
description: "Built a Claude Code Teams Router that auto-injects 144 agent personas. Then used it to implement 83 reference sites in a single day with parallel agents."
---

4 sessions. 883 tool calls. 22 hours of accumulated runtime. I built AgentCrow as a Claude Code Teams Router, then immediately used it to implement 83 web references in parallel — in a single day.

**TL;DR** AgentCrow v5 is a router that takes a prompt, matches it against 144 agent personas, and auto-injects the right persona into Agent Teams. This post covers two things: building the router itself, and using it to ship the `refmade` reference library.

## The Prompt That Started It All

Session 1 began with the simplest possible prompt:

```
Open the agentcrow project and get a sense of the current state.
Fix anything that needs fixing or improving — all areas.
```

The follow-up was even simpler:

```
Do everything.
```

Claude ran with it for 6 hours 29 minutes: 598 tool calls, 179 Bash, 124 Edit, 81 Read. It found `VERSION` duplicated across `cli.ts` and `package.json`, split the monolithic `cli.ts` into a `commands/` directory, and grew the test suite from 74 to 88 tests.

But none of that was what I actually wanted.

## The Real Problem: Teams vs Subagents

AgentCrow was spawning agents — but I realized they were plain subagents, not Agent Teams. The difference matters.

```
Me: When you spawn an agent, does it go through Agent Teams?
Claude: Currently it spawns subagents directly, without Teams.
Me: I want it using Teams.
Me: I want it to feel like a router sitting between prompts and Teams.
```

Plain subagents are parallel execution. Agent Teams adds a coordination layer where agents communicate via `SendMessage` and pass results to each other. For dependency chains (`A → B → C` handoffs), Teams is the right primitive.

## What AgentCrow v5 Actually Does

Here's the flow:

```
Prompt received
    ↓
Match agent roles from INDEX.md
    ↓
TeamCreate(team_name)
    ↓
Agent(team_name, name, subagent_type, prompt + persona)
    ↓
Coordinate via SendMessage / dependency handoffs
    ↓
TeamDelete
```

The key mechanic: when spawning an agent, the `.claude/agents/{role}.md` persona gets auto-injected into the prompt. 144 personas exist, and `agentcrow-inject.sh` does the matching from `catalog-index.json`.

Agent count is determined by task complexity, not by a fixed rule:

| Scale | Agents | Criteria |
|-------|--------|----------|
| Single file / bug fix | 0 (direct) | 1 domain, 1-2 files |
| Small (2 domains) | 2 | API+tests, UI+styles |
| Medium (3-4 domains) | 3-4 | auth+tests+docs |
| Large (research+implement+review) | 5 (max) | multiple files, cross-domain |

It's not always 5. Benchmark results showed: direct handling 30s, parallel agents 51s, Teams 65s. Teams has coordination overhead. For independent parallel work, skip Teams and spawn agents directly.

## refmade: 83 References, One Day

Session 3 was the `refmade` project — HTML reimplementations of real SaaS landing pages: Stripe, Vercel, Linear, Notion, Supabase, Clerk, and 77 others. More than 80 remained.

The prompt:

```
Continue the refmade reference implementation→evaluation loop. Start from re-evaluating 007.
```

The pattern was: batch 4-5 references in parallel, each agent compares against the original screenshot, score 9.0+ = PASS. 285 tool calls over 15 hours 45 minutes.

```
Batch 1: 023, 025, 027, 029 → all 9.0+ PASS
Batch 2: 030, 031, 039, 043 → all 9.0+ PASS
...
Batch N: 056, 057, 058, 059 → ...
```

Rate limits hit multiple times mid-session. When an agent returns "You've hit your limit · resets 11pm (Asia/Seoul)", only that agent stops — the rest keep running. Typed "continue" three times total to resume the stopped agents.

## Swapping CSS Shapes for 8K Hyperrealism

Fake placeholder images made with CSS shapes were killing the visual quality. The fix was calling Gemini Imagen API directly.

Prompt:

```
I'll give you a Nano Banana API key — generate photorealistic 8K images with precise prompts and use them in the references.
Prompts need to be accurate, targeting 8K hyperrealism.
```

Claude wrote the image prompt for each reference, called the API, saved to `public/images/`, and swapped the `<img>` tags. `056-app-store` got a woman with auburn hair in a cream blazer. `064-neon-cinema` got an actual concert stage photo. `073-poppr` got a VR exhibition space.

No comparison to CSS shapes.

## What Landed in CLAUDE.md

The rules that came out of this work:

```markdown
## Agent count decision
Benchmark: direct 30s vs parallel 51s vs Teams 65s
- Small independent tasks: direct
- Independent parallel: parallel agents (no Teams)
- Dependency chains: Teams (SendMessage handoffs)
- Large research+implementation: Teams
```

Teams isn't a universal answer. It has overhead. For simple parallel work, spawning agents directly is faster. Documenting this decision criteria was the point.

## Session Stats

| Session | Duration | Tool calls | Work |
|---------|----------|-----------|------|
| 1 | 6h 29min | 598 | AgentCrow v5 build |
| 2 | 0min | 0 | API key error |
| 3 | 15h 45min | 285 | refmade 83 references |
| 4 | 16h 26min | 97 | Teams Router validation |

Session 2 died immediately on `Invalid authentication credentials`. Swapped the key and restarted.

## What I Actually Learned

"Do everything" prompts work surprisingly well. The catch: you need to drop a "re-explain what you're currently building and how it works" checkpoint mid-session to keep Claude oriented. Did it 3 times in the 6-hour session. It's not about distrust — it's a calibration ping to make sure Claude's mental model of the task matches yours.

For large-scale parallel agent work, design for rate limits upfront. Because agents run independently, some dying doesn't block the rest. The recovery pattern is just: identify which agents stopped, send "continue", done.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
