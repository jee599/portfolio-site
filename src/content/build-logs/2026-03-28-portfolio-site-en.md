---
title: "808 Tool Calls: Using Claude Code to Build an AI Agent Dispatcher"
project: "portfolio-site"
date: 2026-03-28
lang: en
pair: "2026-03-28-portfolio-site-ko"
tags: [claude-code, agentcrow, parallel-agents, multi-agent, cli-refactor]
description: "Two projects, one day, 808 tool calls. How I used Claude Code agents to refactor AgentCrow CLI and implement 83 UI references in parallel."
---

808 tool calls. Two sessions. Two projects. One of them was building an agent dispatcher — using an agent.

**TL;DR** AgentCrow CLI refactor (598 tool calls, 6h 29min) and refmade UI reference implementation (210 tool calls, 3h 26min) ran as separate sessions. The core pattern: dispatch up to 5 parallel agents, each owning non-overlapping files.

## "Fix Everything" — and the Agent Did

AgentCrow is an automatic agent dispatch tool for Claude Code. The published version on `npm` was v3.4.3. I gave Claude a full project walkthrough and asked: "What needs fixing, improving, or implementing — across all areas?"

The analysis came back with two clear issues. `VERSION` was duplicated between `cli.ts:33` and `package.json`. More critically, `src/cli.ts` was a single monolith containing every command.

74 tests were passing. The architecture was not.

I said: "Do all of it."

`src/cli.ts` split into 12 files:

```
src/
  cli.ts              — main entry + arg parsing only
  commands/
    init.ts
    agents.ts
    compose.ts
    lifecycle.ts
    doctor.ts
    update.ts
    uninstall.ts
    ...
  utils/
    constants.ts      — single source of truth for VERSION
    hooks.ts
    history.ts
    ...
```

Tests went from 74 to 86. The existing `cli.test.ts` was tightly coupled to the old structure, so it needed a full rewrite alongside the refactor. Final count: 28 modified files, 31 new files — all in one session.

## Agents That Audit Agents

AgentCrow's core feature is automatic persona injection. It decomposes a prompt, identifies the right roles, and routes tasks to `agent teams`. There were 9 builtin agent YAMLs.

While adding English-language agents, I asked: "Validate the agent quality."

Claude dispatched two agents in parallel:

- **Research best agent personas on GitHub** — scanned competing agent frameworks
- **Audit builtin agent quality** — checked 14 local YAMLs for schema consistency

The GitHub research agent combed through repos like `awesome-claude-code-subagents` and `agency-agents`. Simultaneously, the audit agent read all 14 local YAMLs and flagged missing `output_format` and `example` fields. Both finished at roughly the same time.

The follow-up work — adding `output_format` and `example` sections to 9 agents, syncing English/Korean/multilingual READMEs — ran as 3 parallel agents per batch. Each agent owned a different file, so there was no collision.

## The Rate Limit Wall

Mid-session, it stopped. "You've hit your limit · resets 4am (Asia/Seoul)"

598 tool calls in one session on the `<synthetic>` model. Session 2 has no record — a question about whether AgentCrow was applied just returned the limit message.

The next morning I started fresh with `claude-opus-4-6`. This is a recurring pattern. Instead of pushing everything into one session, it's worth leaving clear checkpoints. AgentCrow's session had an end-of-session summary: "start the next session with this prompt." That made picking up seamless.

## 83 UI References, 5 Agents at a Time

refmade is a project that recreates real product UIs (Stripe, Linear, Supabase, Arc, Vercel) in HTML. Each reference has a target screenshot. Implement it, compare against the original, score ≥ 9/10 to pass.

83 references were still incomplete. At the start of the session, I dispatched 5 agents simultaneously.

Each agent worked independently: read the reference screenshot, examine existing HTML, rewrite or patch it, capture an implementation screenshot with Playwright, compare against the original, and self-score.

A few agents hit rate limits mid-task. Their task output came back with just "You've hit your limit · resets 11pm (Asia/Seoul)." Those agents were re-dispatched with "continue."

3 hours 26 minutes. 210 tool calls. References 056–083 mostly complete. Average score per batch: 9.0–9.3/10. Stripe, Linear, Vercel, Supabase, Arc, Raycast, Notion, Clerk — all passed at 9+.

## Tool Usage Breakdown

| Tool | Count | Share |
|------|-------|-------|
| Read | 214 | 26% |
| Bash | 197 | 24% |
| Edit | 124 | 15% |
| TaskUpdate | 83 | 10% |
| Agent | 72 | 9% |
| TaskCreate | 45 | 6% |
| Write | 34 | 4% |
| Grep | 22 | 3% |
| Other | 17 | 2% |

`Read` leads at 26%. Before touching any code, Claude reads it. This cuts down on the "rewrite code that already exists" failure mode significantly.

`Agent` at 72 calls means any task where files don't overlap gets parallelized. One agent mines GitHub while another audits local files and a third translates a README.

## When Parallel Agents Work — and When They Don't

Parallel dispatch only works without file conflicts. Two agents writing to the same file will collide. refmade's structure is ideal: each reference is one independent HTML file.

The AgentCrow session had the same clean separation. The Research agent and the Audit agent touched entirely different files. README translation agents each owned a different language file.

The `cli.ts` refactor was sequential. It was restructuring the entire file hierarchy — one agent at a time, verify build and tests, then proceed. Parallelizing structural refactors causes conflicts.

The rule is simple: parallel for independent file ownership, sequential for shared structure.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
