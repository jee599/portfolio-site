---
title: "AI Reviews an AI Orchestrator — 11 Sessions, 76 Tool Calls, 4 Bugs Fixed in LLMTrio"
project: "LLMTrio"
date: 2026-03-16
lang: en
pair: "2026-03-16-LLMTrio-ko"
tags: [claude-code, llm, agent, code-review]
description: "Used Claude Code to audit and fix LLMTrio, a multi-LLM orchestration CLI. 11 sessions, 76 tool calls, 4 bugs squashed — AI debugging an AI agent system."
---

LLMTrio has a certain irony to it. It's a CLI tool that orchestrates multiple LLM agents — and I used Claude Code to debug it. An AI reviewing and fixing an AI agent system.

**TL;DR** — 11 sessions, 76 tool calls to audit LLMTrio's architecture and fix 4 bugs. The "architect prompt" pattern consistently raised the quality of Claude Code's output throughout the work.

## The Architect Prompt Pattern

Every session in this project started with the same system prompt.

```
You are a senior software architect designing a system.

Produce a clear technical plan (under 300 words):
Components, File Structure, Data Flow, Tech Stack.

No boilerplate. No "it depends." Make concrete decisions.
```

Two constraints do the work: "make concrete decisions" and "under 300 words." Without them, Claude hedges — "you could do X, or alternatively Y." With them, it commits: "do X, here's why."

The difference shows up even on trivial examples. Ask Claude to write a `hello world function in Python` with no constraints, and it lists multiple approaches. Give it the architect prompt, and it immediately decides: one file `hello.py`, function plus main guard. The pattern scales — the same decisiveness showed up on every complex architectural question in this project.

## Full Audit of `octopus-core.js`

Session 8 was the core of the work: 18 tool calls. `Read` ×13, `Glob` ×2, `Bash` ×1, `Write` ×1, `Edit` ×1.

Thirteen `Read` calls just to understand the architecture. `octopus-core.js` is a 2-phase workflow engine — it decomposes tasks, spawns agents, and manages state. `dashboard-server.js` is a local server that streams live progress to a browser. The CLI lives in `bin/llmtrio.js` and handles command parsing and routing.

After mapping the codebase, I updated `CLAUDE.md` and `config/default-budget.json`. The `default-budget.json` file was missing `workflow` configuration and `timeout_seconds` that were documented in the README but absent from the actual file. A documentation/code drift bug — the kind that's tedious to catch manually.

## 7 Issues from a Focused Code Review

Session 9 switched to reviewer mode.

```
You are a code reviewer examining the implementation.

Review format:
1. Critical Issues — Bugs that will cause failures
2. Security — Vulnerabilities
3. Performance — Bottlenecks
4. Improvements — Better patterns

For each issue: describe the problem, show the problematic code, suggest the fix.
Max 7 issues. Be specific, not generic.
```

"Max 7 issues. Be specific, not generic." That constraint matters. Without it, Claude returns 10–15 items, half of which are vague suggestions like "use more descriptive variable names." Capping at 7 forces it to prioritize real problems.

Two of the seven were Critical. In `dashboard-server.js:944`, a timeout of `0` was being silently converted to 60 seconds. In `dashboard-server.js:84`, a JSON parse retry was using busy-wait — blocking the event loop for 300ms. `octopus-core.js` had already fixed the same issue; `dashboard-server.js` had been missed.

## 16/16 Tests Passing — Then Finding More Bugs

Session 10 started with a test run. All 16 passed. Passing tests don't mean no bugs. Session 11 found and fixed 4 more.

The specific fixes:

- `octopus-core.js:9` — `TRIO_DIR` environment variable was completely ignored. Missing `process.env.TRIO_DIR ||` before the fallback path.
- `octopus-core.js:36` — scaffold tasks were executing as `implementation` type. Changed to `scaffold`.
- `dashboard-server.js` — `parseInt` returning `NaN` bypassed the `??` null coalescing operator, letting `NaN` through as a valid value.
- `dashboard-server.js` — no size limit on POST body, a straightforward security exposure.

Session 11 alone: 29 tool calls. `Edit` ×15, `Read` ×11, `Bash` ×2, `Grep` ×1. That's 38% of the total 76 tool calls in a single session.

## Claude Code Stats

```
Total sessions:  11
Total tool calls: 76
  Read:  39 (51%)
  Edit:  16 (21%)
  Bash:  14 (18%)
  Glob:   3 (4%)
  Write:  2 (3%)
  Agent:  1 (1%)
  Grep:   1 (1%)

Files modified: 5
Files created:  2
```

`Read` at 51% is the signal. Claude Code reads before it edits — a lot. That's the right pattern. Modifying code without understanding it produces side effects. The high read ratio reflects how the work actually went: understand first, change second.

Separating sessions by role — architect, then reviewer, then implementer — also proved effective. Doing everything in one session mixes context and degrades quality at each phase. Keeping roles separate raises the output at every step. That's the same workflow principle LLMTrio itself is trying to implement.

> The fastest way to build an AI orchestrator is to work like one.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
