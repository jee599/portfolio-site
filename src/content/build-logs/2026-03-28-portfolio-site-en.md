---
title: "I Used Claude Code to Build a Claude Code Agent Router: 863 Tool Calls Later"
project: "portfolio-site"
date: 2026-03-28
lang: en
pair: "2026-03-28-portfolio-site-ko"
tags: [claude-code, agentcrow, agent-teams, cli-refactor, multi-agent]
description: "4 sessions, 863 tool calls: building AgentCrow Teams Router, refactoring a CLI into 13 modules, and passing 86 tests — all using multi-agent workflows."
---

863 tool calls. 4 sessions. The task was to build a multi-agent router using multi-agent workflows. The tool doing the building was the same type of tool being built.

This is the build log for AgentCrow — a CLI that decomposes prompts, injects role-specific agent personas, and dispatches work to Agent Teams. The meta part: most of the implementation was done by Agent Teams orchestrated through Claude Code.

**TL;DR** Refactored AgentCrow's CLI from a single `cli.ts` into 13 modules, implemented the Teams Router, passed 86 tests. Separately, used 5 parallel agents to implement 83 refmade UI references at an average score of 9.1/10.

## What "Just Do Everything" Actually Produces

Session 1 started with this prompt:

> "Open the agentcrow project, understand the current state, identify everything that needs fixing or implementing across all areas."

Three analysis agents ran in parallel: competitive research (LangGraph, CrewAI, agency-agents), popular GitHub agent packs survey, and a local code audit. All three ran simultaneously.

The reports surfaced two real problems:

1. `VERSION` was defined in both `cli.ts:33` and `package.json` — two sources of truth
2. `src/cli.ts` had every command jammed into a single file, making it impossible to extend cleanly

One follow-up prompt kicked off the full refactor. The result:

```
src/
  cli.ts           — entry point + arg parsing only
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
    constants.ts   — single VERSION source
    hooks.ts
    history.ts
    catalog-index.ts
    mcp-config.ts
    index-generator.ts
```

The existing `tests/cli.test.ts` was coupled to the old structure, so every test had to be rewritten. Test count went from 74 to 86. Total: 28 modified files, 31 new files. Tool breakdown: `Bash(179)`, `Edit(124)`, `Read(81)`. 6 hours 29 minutes.

## The Difference Between Subagents and Agent Teams

Session 4 had a conversation that clarified something important:

> "Wait — aren't you just spawning subagents? That's not actually using Agent Teams."

Correct. Calling `Agent()` alone doesn't put anything on the Teams infrastructure. For Teams to work properly, the flow has to be explicit:

```
TeamCreate(team_name)
  → Agent(team_name, name, subagent_type, prompt)  # spawned as team member
  → SendMessage(to, task)                           # assign work
  → [receive results]
  → SendMessage(to, {type: "shutdown_request"})
  → TeamDelete(team_name)
```

AgentCrow's job in this pipeline is persona injection. The `agentcrow-inject.sh` PreToolUse hook intercepts every agent spawn, looks up the role in `catalog-index.json`, finds the matching `.claude/agents/*.md` file, and prepends it to the prompt. If the system determines a `frontend_developer` is needed, that agent's role definition, persona, deliverables, and success metrics are all prepended to its context automatically.

Without this, every agent in an Agent Team behaves identically — same defaults, same instincts, same blind spots. With persona injection, a QA agent immediately looks for test cases; a security agent immediately looks for vulnerabilities. Same underlying model, different starting angle.

## Agent YAML Quality Validation

The built-in agent library had 14 agents plus 9 English-language agents — 23 total. "Validate the quality" triggered two parallel agents:

- GitHub research agent: compared against `awesome-claude-code-subagents` and `agency-agents` repos
- Local audit agent: checked YAML schema consistency and missing fields

Feedback: agents without `output_format` and `example` fields had inconsistent outputs. Both fields were added to 9 files in a batch update. README synchronization across Korean/English/multilingual variants was handled by 3 agents in parallel.

## Session 2 Is Empty: Rate Limits

Pushing 598 tool calls into a single session ended with: *"You've hit your limit · resets 11pm (Asia/Seoul)"*. That's why session 2 has zero tool calls and zero output.

The recovery was clean because the previous session ended with an explicit handoff note:

> "In a new session, just say '007 re-evaluation to start' and we'll pick up from there."

If you're running long sessions, the most effective thing you can do before hitting the rate limit is write down exactly how to resume. One sentence at the end of a session eliminates all the context reconstruction work at the start of the next one.

## 83 UI References, 5 Agents, No File Conflicts

refmade is a dataset of landing page recreations — Stripe, Linear, Vercel, Supabase, Arc, Raycast — implemented as standalone HTML files, screenshotted with Playwright, and scored against the original. 9.0/10 or above is a pass.

83 incomplete references went to 5 parallel agents simultaneously. Each agent owned a separate HTML file, so there were no merge conflicts. Placeholder CSS shapes were replaced using the Google Imagen API — each agent wrote its own image generation prompts:

> "8K hyperrealism, professional woman in cream blazer, auburn hair, fintech mobile app, white background, photorealistic"

Batch results:

| Batch | References | Avg Score |
|-------|-----------|-----------|
| 023–031 | Glassmorphism → Minimal Product | 9.1 |
| 056–065 | App Store → Editorial | 9.0 |
| 066–075 | Reality Interface → Linear | 9.2 |
| 076–083 | Vercel → Clerk | 9.3 |

Tool breakdown: `Read(156)`, `Bash(56)`, `Agent(54)`. Read is #1 because every agent was constantly referencing the original screenshots for comparison.

## The One Rule for Parallel Agents

Parallel works when agents don't touch the same files. That's the whole rule.

refmade is structurally ideal: each reference is one independent HTML file, so 5 agents can run with zero coordination overhead. The AgentCrow GitHub research agent and local audit agent also had completely non-overlapping file sets.

The CLI module split, by contrast, was sequential. Restructuring the file system requires verifying the build and tests pass at each step before moving forward. No shortcuts there.

Benchmark numbers: direct processing 30s vs parallel agents 51s vs Agent Teams 65s. Agents aren't always faster. Spawn overhead is real. For small tasks (3–5 files), direct processing is the faster choice. Match the approach to the scale of the task.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
