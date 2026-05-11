---
title: "One Bash Block Cancelled 8 Reads: How Claude Code Orchestration Blocked Itself in 12 Tool Calls"
project: "portfolio-site"
date: 2026-05-11
lang: en
pair: "2026-05-11-portfolio-site-ko"
tags: [claude-code, hooks, orchestration, debugging]
description: "A single Bash hook block cascaded into 8 cancelled Reads. 12 tool calls, 0 files changed, 0 output — caused by misclassifying a read-only task."
---

One line of state management code stopped a session cold. `source ~/.claude/workflows/.../lib/state.sh`. Not a complex deployment. Not a database migration. A shell helper that updates a JSON file. It blocked, and took 8 Read calls down with it.

The task: read four research files and return a 15-line summary. No code changes. No deploys. Nothing that touches production. Twelve tool calls later, the session produced zero output.

**TL;DR:** A read-only research task was classified as `simple` instead of `trivial`. That caused the model to bundle a `state.sh` state-update Bash call with 4 parallel Read calls in the same response. The PreToolUse hook blocked the Bash call. Claude Code's tool batch behavior cascaded that block into all 4 Reads. The retry had the same structure, the same result. After 12 tool calls across 3 prompts, nothing had been read and nothing had been written.

## The Task: Read SERP Summary, Return 15 Lines

May 11, 2026. Daily research routine for dental/medical advertising. The model was `claude-opus-4-7`. The prompt:

> "I want to write today's (2026-05-11) medical/dental advertising daily research output. Read the files below and suggest — in Korean, within 15 lines — what key changes to add to the existing knowledge base, which hypotheses to keep, and whether to generate an HTML report."

Four files:

- `sources/serp-2026-05-11/summary.json`
- `2026-05-10-daily-update.md`
- `rolling-knowledge-base.md`
- `source-index.md`

No code to write. No file to modify. Read and analyze. This is the definition of a `trivial` task in the orchestration system's own classification rules.

## What Happened in the First Response

The orchestration system injects context into every new request via a `UserPromptSubmit` hook. Part of that context includes complexity classification and — for non-trivial tasks — state management code that updates `state.json`.

This session was classified as `simple`. For `simple`-and-above tasks, the system expects a state update before work begins:

```bash
source ~/.claude/workflows/dentalad-ce664b4c06/lib/state.sh && state_set stage implementing
```

That Bash call landed in the first response, bundled in parallel with all 4 Read calls. One response, five tool calls issued together:

```
[Response 1 — parallel tool calls]:
Bash: source lib/state.sh && state_set stage implementing
Read: sources/serp-2026-05-11/summary.json
Read: 2026-05-10-daily-update.md
Read: rolling-knowledge-base.md
Read: source-index.md
```

The PreToolUse hook inspected the Bash call and blocked it. The `source` command triggered the check. Hook behavior is correct — it's supposed to block unauthorized shell execution.

What it wasn't supposed to do — but did — was cancel the 4 Reads in the same batch. Claude Code's parallel tool call model treats a blocked call as a cancellation signal for the response batch. The 4 Reads were collateral damage. None of them completed.

## The Retry Reproduced It Exactly

Second prompt: "Continue from where you left off."

Same orchestration context. Same complexity classification. Same model response structure: 1 Bash + 4 Reads bundled together. Same hook behavior: Bash blocked, Reads cancelled.

This is a property of deterministic systems. Given identical inputs — same orchestration context, same hook rules, same prompt structure — the model produces identical outputs. The failure reproduced with 100% fidelity.

That's actually useful to know. It rules out random error. The problem is structural.

## Third Prompt, No Content to Return

Third prompt: "Just output what you've read so far, within 15 lines. Don't read any more files."

The model had read nothing. Every Read call across both previous attempts had been cancelled before completing. There was no content to summarize. The prompt assumed prior progress existed. None did.

Three prompts, three failures, each building on the assumption that the previous attempt had produced something.

## Tool Call Ledger

| Tool | Calls | Outcome |
|------|-------|---------|
| Read | 8 | All cancelled |
| Bash | 4 | All blocked or cancelled |
| Edit / Write | 0 | — |
| **Total** | **12** | **0 useful output** |

The 8 Read calls split 4+4 across the two attempts. The 4 Bash calls were all variants of the same `state.sh` source operation. Every single call failed.

For comparison: the task, had it run normally, would have required 4 Read calls and one response turn. Under a minute. Instead: 12 tool calls, three prompts, complete failure.

## Why Bash and Reads Ended Up in the Same Batch

When a model generates a response that requires housekeeping (state update) and actual work (reading files), it naturally issues them together. From the model's perspective, both are part of the same response turn. There's no obvious ordering constraint between "update state to `implementing`" and "read these files" — they look parallel.

But they're not parallel in terms of failure propagation.

If the Bash fails, only the state update fails. The Reads are independent of it. The problem is that Claude Code's batching model doesn't isolate failures within a batch — a blocked call can cancel sibling calls in the same response.

Bundling calls with different failure modes into the same response creates a hidden dependency: the success of the entire batch is coupled to the success of the most fragile call in it.

The more fundamental problem is that this batch shouldn't have existed at all. `trivial` tasks don't get state update injection. If the classification had been correct, there would be no Bash call, no hook trigger, no cascade.

## The Misclassification

The orchestration system has four levels:

- **`trivial`**: pure Q&A, read-only analysis, no file modifications → direct response, no state updates
- **`simple`**: single file or <30 line changes → direct edit + minimal verification
- **`standard`**: 2–5 files, small feature → checklist + optional verifier
- **`major`**: 6+ files, architecture changes → full plan → implement → verify → cross-check

A task with no planned file writes is `trivial` by definition. But the classifier used something like "how many files are referenced" as its signal. Four files referenced → bumped to `simple`.

The correct primary signal is **intent to modify files**. Reading 4 files to return analysis is `trivial`. Modifying 4 files to implement a feature is `standard`. File count in the task description is a proxy, not the real signal.

One wrong classification cascaded:

```
misclassify read-only task as `simple`
  → inject state update Bash into response
    → bundle Bash with Read calls
      → PreToolUse hook blocks Bash
        → Read calls cancelled as batch collateral
          → 0 output, 12 wasted tool calls
```

Remove the misclassification and none of the rest occurs.

## The Hook Did Its Job

The PreToolUse hook was correct. It blocked a Bash call outside of an authorized workflow stage. That's exactly what it's supposed to do.

The problem isn't the hook — it's what triggered the hook path in the first place. A `trivial` task should never touch the hook path for Bash. It doesn't need `state.sh`. It doesn't need `state.json` updates. It produces output directly in the conversation, not in a workflow artifact that another agent will consume.

The hook's failure mode was only possible because the orchestration system over-reached. It inserted state management code into a session that didn't need state management. Then its own hook blocked that code. The system became its own adversary.

This is a distinct failure mode from bugs in hook logic. The hook logic was correct. What failed was the boundary between "tasks that need orchestration" and "tasks that don't."

## How to Prevent This

Two changes, both in the orchestration layer, neither in the hook logic.

**1. Classify with file modification intent as the primary signal.**

The prompt or heuristic that drives complexity classification needs a hard rule:

> If the task has no planned file writes, classify as `trivial` regardless of how many files it reads.

This single rule handles read + summarize, read + analyze, read + explain — all of the cases where orchestration overhead is not just wasteful but actively harmful. `trivial` tasks skip state injection entirely, so no Bash call enters the response, so no hook fires.

**2. Never bundle Bash and Reads in the same response.**

For tasks that legitimately need state updates (`simple` and above), the Bash call should run alone in its own turn, confirm success, and then Reads follow in a subsequent response.

```
Turn 1: Bash only (state update, confirmed success)
Turn 2: Read calls (data gathering, after state is confirmed)
Turn 3: Analysis/output
```

One extra round-trip. The benefit: a hook block on the Bash call cannot cascade into Read cancellations. Infrastructure calls and work calls have independent failure modes instead of shared fate.

Fix 2 is the more durable one because it handles misclassifications gracefully. Even if something is incorrectly classified as `simple`, the sequential structure means a blocked state update doesn't kill the data reads.

## Failed Sessions Are Still Build Logs

The session produced no analysis and no files. It still belongs in the log.

Successful sessions show what the system does. Failed sessions show where the system's assumptions break. This session documented three things invisible in the codebase:

**The orchestration system can block itself.** The hooks meant to prevent bad code changes can block the orchestration's own state management code. Self-interference is a failure mode that unit tests don't catch — it requires a live session with the full hook stack active.

**A single Bash block can cancel multiple unrelated Reads.** Tool call batching means infrastructure calls and work calls share failure state when they're in the same response. The coupling is invisible in code. It's only visible when a session logs "8 Read calls, all cancelled, cause: one Bash block."

**Trivial misclassification isn't just overhead — it's failure.** A misclassified read-only task doesn't waste a few tokens. It can result in a complete session failure: 12 tool calls, 0 useful output, and a third prompt that asked for a summary of content that was never read.

> The causal chain — Bash block → Read cancellations — is traceable only through the session log. The trivial misclassification diagnosis is the same. Without the record, the failure looks random. With it, the mechanism is completely clear and the fix is two lines in the classification prompt.

The value of the build log isn't in the sessions where everything works. It's in the sessions like this one.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
