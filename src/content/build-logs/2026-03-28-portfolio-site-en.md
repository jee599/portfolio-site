---
title: "Building an AI Agent Router with Claude Code: AgentCrow at 863 Tool Calls"
project: "portfolio-site"
date: 2026-03-28
lang: en
pair: "2026-03-28-portfolio-site-ko"
tags: [claude-code, agentcrow, agent-teams, multi-agent, refmade]
description: "4 sessions, 863 tool calls. Built AgentCrow Teams Router, split CLI into 13 modules, passed 86 tests. Agents building agents."
---

863 tool calls across 4 sessions. That's what it takes to build an AI agent router — using AI agents.

AgentCrow is a CLI that decomposes prompts, attaches role-specific agent personas, and dispatches them as Agent Teams. The meta part: the entire build process itself ran through Agent Teams.

**TL;DR** Refactored AgentCrow CLI from a single `cli.ts` into 13 modules, implemented a Teams Router with proper persona injection, and separately used 5 parallel agents to implement 83 HTML references in the refmade dataset — averaging 9.1/10. 28 files modified, 31 new files created.

## What Happened When I Said "Fix Everything"

Session 1 started with this prompt:

> "Open the agentcrow project, understand the current state. Tell me everything that needs to be fixed, improved, or implemented — across all areas."

Three analysis agents ran in parallel: competitive research (LangGraph, CrewAI, agency-agents), popular GitHub agent pack survey, and local code audit. All three ran simultaneously.

The reports came back with two core problems:

1. `VERSION` was duplicated in `cli.ts:33` and `package.json`
2. All commands were crammed into `src/cli.ts` — completely unscalable

"Fix everything" went ahead. The result:

```
src/
  cli.ts           — main entry + arg parsing only
  commands/
    init.ts
    agents.ts
    compose.ts
    lifecycle.ts
    add.ts
    doctor.ts
    update.ts
    uninstall.ts
    inject.ts
    serve.ts
    stats.ts
  utils/
    constants.ts   — single source of truth for VERSION
    hooks.ts
    history.ts
    catalog-index.ts
    mcp-config.ts
    index-generator.ts
```

The existing `tests/cli.test.ts` depended on the old structure, so the entire test suite got rewritten alongside. Test count went from 74 to 86. Tool distribution for this session: `Bash(179)`, `Edit(124)`, `Read(81)`. Runtime: 6 hours 29 minutes.

## The Difference Between a Subagent and a Teams Agent

Session 4 surfaced a question I should have caught earlier:

> "Wait — this is just a subagent, not actually Agent Teams, right?"

Correct. Calling `Agent()` alone doesn't put it on the Teams infrastructure. Proper Teams usage requires a different flow:

```
TeamCreate(team_name)
  → Agent(team_name, name, subagent_type, prompt)  # spawned into the team
  → SendMessage(to, task)                           # assign work
  → [receive results]
  → SendMessage(to, {type: "shutdown_request"})
  → TeamDelete(team_name)
```

AgentCrow's role in this is persona injection. The `agentcrow-inject.sh` PreToolUse hook fires when an agent spawns — it looks up the matching `.claude/agents/*.md` file in `catalog-index.json` and prepends the persona to the prompt automatically.

When the router decides a `frontend_developer` is needed, that agent gets the persona's `role`, `persona`, `deliverables`, and `success_metrics` prepended to its context before it does anything.

Without this, all agents on a Team are functionally identical. With it, the QA agent goes looking for test cases first. The security agent goes looking for vulnerabilities first. The behavior diverges because the identity diverges.

## Validating 23 Agent YAML Files in Parallel

14 built-in agents + 9 English-language agents = 23 total. "Validate quality" triggered a two-agent parallel dispatch:

- GitHub research agent: compared against `awesome-claude-code-subagents` and `agency-agents`
- Local audit agent: checked YAML schema consistency, missing fields

The feedback: agents without `output_format` and `example` fields produced inconsistent output structure. Both fields were added to 9 files in bulk. README synchronization (Korean/English/multilingual) ran as 3 parallel agents.

## Rate Limits Don't Care About Your Momentum

Pushing 598 tool calls into a single session ended with: *"You've hit your limit · resets 11pm (Asia/Seoul)."*

Session 2 has zero tool calls in the logs. That's the API key error window.

What saved the continuity was a checkpoint message left at the end of session 1:

> "In a new session, just say '007 re-evaluation from the start' and you're good."

If you're doing heavy multi-session work with Claude Code, end each session with explicit handoff instructions. The format doesn't matter — what matters is that the next session knows exactly where to pick up. Context switching overhead drops to near zero.

## 5 Parallel Agents, 83 HTML Implementations, Average 9.1/10

refmade is a dataset of landing page recreations — Stripe, Linear, Vercel, Supabase, Arc, Raycast. Each reference is implemented as standalone HTML, captured via Playwright, then evaluated against the original screenshot. Passing threshold: 9.0/10.

83 incomplete references ran through 5 parallel agents simultaneously. Each agent owned independent HTML files — no overlap, no conflicts.

Images that were placeholder CSS shapes got replaced using the Google Imagen API. Agents wrote their own prompts:

> "8K hyperrealism, professional woman in cream blazer, auburn hair, fintech mobile app, white background, photorealistic"

Batch evaluation results:

| Batch | References | Avg Score |
|-------|-----------|-----------|
| 023-031 | Glassmorphism ~ Minimal Product | 9.1 |
| 056-065 | App Store ~ Editorial | 9.0 |
| 066-075 | Reality Interface ~ Linear | 9.2 |
| 076-083 | Vercel ~ Clerk | 9.3 |

Tool distribution: `Read(156)`, `Bash(56)`, `Agent(54)`. Read is #1 because each agent repeatedly references the original screenshot while building.

## When Parallel Agents Actually Make Sense

Parallel only works when there are no file conflicts. The rule is simple: two agents touching the same file means a conflict.

refmade is the ideal parallel workload because each reference is one independent HTML file. In the AgentCrow sessions, the GitHub research agent and the local audit agent operated on completely separate file sets.

The `cli.ts` module split, by contrast, ran sequentially. Restructuring the file system itself means each step needs a passing build and tests before the next step starts. That's a dependency chain — parallel doesn't apply.

Benchmark from actual runs: direct processing 30s vs parallel agents 51s vs Teams 65s. Agents aren't always faster. Spawn overhead is real. For small tasks (3-5 files), doing it yourself is faster.

The decision tree for multi-agent dispatch:

| Situation | Approach | Reason |
|:----------|:---------|:-------|
| Small independent work (3-5 files) | Direct | Spawn overhead exceeds task cost |
| Independent parallel domains | Parallel agents (no Teams) | No coordination needed |
| Sequential with handoffs (A→B→C) | Teams | SendMessage carries results between agents |
| Research → Implementation | Teams | Explore→general-purpose handoff |
| Large (5+ domains, shared context) | Teams | TaskList tracking + coordination |

## What 863 Tool Calls Built

Across 4 sessions:

- AgentCrow CLI: 1 file → 13 modules
- Test suite: 74 → 86 tests passing
- Agent YAML files: 23 validated and patched
- refmade HTML references: 83 implemented at 9.0+ average
- Teams Router: fully documented and embedded in CLAUDE.md

The sessions that moved fastest were the ones where the prompt was specific about constraints: file ownership, pass/fail criteria, what "done" looks like. The sessions that were slower were the open-ended analysis passes — useful output, but high variance.

The meta-observation: building an agent routing system with agents gives you immediate feedback on the design. If the routing logic is wrong, you see it in the dispatch decisions. If the persona injection is incomplete, the agent behavior tells you. Eating your own dog food at 863 tool calls a day accelerates iteration in a way that static testing doesn't.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
