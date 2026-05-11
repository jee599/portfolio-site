---
title: "12 Tool Calls, 0 Files Modified: When Claude Code's Orchestration Hooks Blocked Themselves"
project: "portfolio-site"
date: 2026-05-11
lang: en
pair: "2026-05-11-portfolio-site-ko"
tags: [claude-code, hooks, orchestration, debugging, dentalad]
description: "A single state.sh Bash call triggered my PreToolUse hook, cascading into 12 cancelled tool calls and zero output. Here's what happened."
---

12 tool calls. Zero files read. Zero files modified. The session produced nothing — not because the task was beyond Claude Code's capability, but because my orchestration system's PreToolUse hook blocked a Bash call, and that Bash call was bundled with 4 Read calls in the same response.

**TL;DR**: A `source ~/.claude/workflows/.../lib/state.sh` call triggered my PreToolUse hook and was blocked. Claude Code's parallel tool execution model cancelled the co-bundled Read calls as collateral damage. Retries had the same structure. After 12 tool calls across 3 user messages, nothing was accomplished. Root cause: the orchestration layer over-classified a read-only task and injected state management code that didn't belong there.

## A 15-Line Summarization Task That Should Have Taken 30 Seconds

The session was a daily research task for a dental/medical advertising project. The goal: read 4 summary files and propose key changes to an existing knowledge base, in 15 lines or fewer.

Files to read:

- `sources/serp-2026-05-11/summary.json`
- `2026-05-10-daily-update.md`
- `rolling-knowledge-base.md`
- `source-index.md`

That's it. Read four files, write a short summary. No code changes. No API calls. No file writes. A task that should take seconds.

But the orchestration workflow context was active.

## One Bash Block, Eight Read Cancellations, Zero Output

My Claude Code setup runs a multi-agent orchestration system. Every task gets classified as `trivial`, `simple`, `standard`, or `major`. Based on classification, the system injects workflow context into Claude's response — including calls to update `state.json` via a shell helper (`state.sh`).

For this session, the orchestration layer classified the task as `simple` (not `trivial`). That distinction matters: `simple`-and-above tasks are expected to call `state.sh` to update their stage to `implementing` before doing any work.

The first response bundled the state update with the file reads:

```
[Parallel tool calls in response 1]:
- Bash: source ~/.claude/workflows/.../lib/state.sh && state_set stage implementing
- Read: sources/serp-2026-05-11/summary.json
- Read: 2026-05-10-daily-update.md
- Read: rolling-knowledge-base.md
- Read: source-index.md
```

The PreToolUse hook blocked the Bash call. And here's the cascade: in Claude Code, when tool calls are bundled in a single response and one fails, the others can be cancelled. All 4 Read calls were cancelled as collateral damage from a single Bash block.

The second attempt had the same structure. Same result.

By the third user message, the instruction changed: "Just give me the summary from what you've read so far. Don't read any more files."

Nothing had been read. There was nothing to summarize.

## Tool Call Autopsy

| Tool | Count | Outcome |
|------|-------|---------|
| Read | 8 | All cancelled |
| Bash | 4 | All blocked or cancelled |
| Edit | 0 | — |
| Write | 0 | — |

**Total**: 12 tool calls. **Useful output**: 0.

The 8 Read calls split across two attempts: 4 in the first response, 4 in the retry. Every single one was cancelled due to the accompanying Bash call failing.

The 4 Bash calls were all variations of the same `state.sh` source operation. All blocked by the PreToolUse hook configuration.

## The Two-Layer Root Cause

The failure has two distinct layers, and both need to be fixed independently.

**Layer 1: Misclassification.**

Reading 4 files and writing 15 lines is not a `simple` task by the system's own definition — it's `trivial`. Trivial tasks are not expected to update workflow state, so no Bash calls get injected. The orchestration routing logic failed to classify a read-only task correctly.

The system classifies based on signals like "file modifications planned," "code changes expected," "API calls needed." A pure read + summarize operation should score as `trivial` every time. But with the workflow context active and a multi-file read operation, the classifier bumped it to `simple`.

**Layer 2: Parallel bundling of sequential dependencies.**

Even if the task was legitimately `simple`, the state update and the file reads should not have been bundled in the same response. The state update must succeed before the reads are meaningful — that's a sequential dependency, not a parallel operation.

When you bundle operations A, B, C, D, E where A must succeed before B–E have value, and A fails, B–E become orphaned. Claude Code's response model doesn't automatically decouple them.

The correct pattern:

1. Response 1: Bash only (state update)
2. Response 2: Read calls only (after confirming state update succeeded)

Instead, everything went into one response, and the failure propagated to everything.

## The Design Tension No One Talks About

There's a real tension in AI automation systems between thoroughness and fragility.

A thorough orchestration system tracks state. It knows what stage a task is in. It enforces discipline: you don't move to `implementing` without logging it. This is genuinely useful for complex multi-agent workflows where 6+ files change across multiple agents, where Claude Code hands off to Codex for cross-verification, where the work spans multiple sessions.

But for a 15-line summarization task, this overhead isn't just useless — it's actively harmful. The state management machinery is correct in isolation. The problem is that it fires even when the task doesn't warrant it.

This is the classic overhead-vs-value mismatch in automated systems. The cost of applying orchestration to a trivial task isn't zero overhead — it's negative value. The system becomes an obstacle.

The irony: this session was part of building a more reliable AI workflow. The orchestration system exists to make Claude Code more disciplined. And the orchestration system blocked a read-only task from reading anything.

## Read-Only Collateral Damage

The frustrating part of this session isn't the blocked Bash call. That's expected — the hook exists to prevent unintended state mutations. The frustrating part is that 8 Read calls, which pose zero risk, were caught in the blast radius.

Read calls don't modify anything. They're diagnostic. A PreToolUse hook that blocks Bash shouldn't have any effect on Read calls. But Claude Code's response batching means they're treated as a unit — succeed or fail together.

This is a limitation of the parallel tool call model, not a bug in the hook logic. The hook saw a Bash call and blocked the whole response batch. Perfectly correct behavior. Perfectly wrong outcome.

One mitigation: explicitly separate infrastructure tool calls from work tool calls in the orchestration prompt. "First, call Bash to update state. Do not call any other tools in that same response." This forces sequential execution and breaks the bundling at the source.

## Two Fixes That Would Have Prevented This

**Fix 1: Sharpen the trivial classifier.**

The orchestration system needs a cleaner definition of `trivial`:

- No code changes planned
- No file writes planned
- Pure read + analysis/summarize
- Single-domain, single-session scope

When all four conditions hold, the task should be `trivial` regardless of how many files it reads. Trivial tasks skip state management entirely — no `state.sh` calls, no workflow stage updates, no hook exposure.

The fix lives in the routing prompt injected by the `UserPromptSubmit` hook. Explicit heuristics: if the intent is "read X and summarize," classify as `trivial` before anything else runs.

**Fix 2: Never bundle Bash and Read in the same response.**

This is the more durable fix because it handles misclassification gracefully.

If a state update Bash call is needed, it goes alone in its own response and must succeed before anything proceeds. File reads follow in a subsequent response, after the state update is confirmed.

Structure:

```
Turn 1: Bash (state.sh source + state_set)
Turn 2: Read (file reads, only after Bash succeeds)
Turn 3: Analysis/output
```

The cost is one extra round-trip. The benefit: a Bash block cannot cascade into Read cancellations. The two operation types are decoupled by design.

## What "Trivial" Actually Means in a Multi-Agent System

The `trivial` classification isn't just about effort. It's about isolation.

A trivial task is self-contained: it reads some data, produces some output, and has no side effects that other tasks need to know about. There's no reason to log it in a state machine. There's no workflow to track. The output exists in the conversation, not in a file that another agent reads.

When an orchestration system injects state management into a trivial task, it's not being thorough — it's confusing thoroughness with universality. Not every task is a step in a larger workflow. Some tasks are just tasks.

The classification boundary should be:

> Does this task produce an artifact that another automated step needs to consume?

If no, it's `trivial`. The dental research summarization was a human-readable 15-line output. No other agent was going to read it. No `state.json` entry would ever be referenced. It was trivial by definition, and the classifier missed it.

## Why Zero-Output Sessions Matter Most

Some developers skip writing build logs when nothing shipped. I don't, because failed sessions contain information that successful ones don't.

This session taught three things that aren't visible from reading the orchestration code:

**1. The orchestration system can block itself.** It's not just that hooks might block external code — the orchestration's own state management code can trigger its own hooks. The system can be its own adversary. You can't unit-test for this; it only surfaces in live sessions.

**2. A single Bash block can cascade into multiple Read cancellations.** The tool call bundling behavior means infrastructure calls and work calls share fate when they're in the same response. This coupling is invisible until it causes a failure.

**3. Misclassifying a trivial task isn't just overhead-expensive — it's failure-expensive.** A misclassified read-only task doesn't just waste tokens. It can result in a session that produces literally zero useful output, followed by a confused "just summarize what you've read" request that has no answer because nothing was ever read.

You can't learn these cases by reading orchestration code. You have to hit them in production. That's why the log exists.

## The Bigger Pattern

Every automation system eventually automates things it shouldn't. The discipline is recognizing when the automation's coverage exceeds the automation's competence.

My orchestration system is competent at managing complex multi-agent workflows — parallel Claude Code and Codex workers, cross-verification steps, state handoffs between sessions. It's not competent at staying out of the way for trivial tasks. That's a coverage problem.

The fix isn't to remove the orchestration. It's to sharpen the boundary between "tasks where orchestration helps" and "tasks where orchestration just adds friction." That boundary is currently drawn too aggressively. Read-only tasks with human-readable output should be firmly outside it.

Sessions like this one help draw that line.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
