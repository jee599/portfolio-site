---
title: "Forcing Claude Code to Follow a Workflow: Hooks, State Machines, and 79 Tool Calls"
project: "portfolio-site"
date: 2026-05-03
lang: en
pair: "2026-05-03-portfolio-site-ko"
tags: [claude-code, orchestration, multi-agent, harness, workflow, hooks]
description: "How I built a hook-based harness to enforce plan→implement→verify→codex pipelines on Claude Code. 79 tool calls, 6h 44m, 9 files."
---

79 tool calls. 6 hours and 44 minutes. 9 new files. The result wasn't a feature — it was a cage.

The goal: make Claude Code unable to write code without a plan, and unable to finish a response without verification. Not through prompting or memos. Through hooks that block execution at the OS level.

**TL;DR** — `PreToolUse` and `Stop` hooks now enforce a strict orchestrator workflow. Every non-trivial task must pass through plan → implement → verify → codex cross-check before Claude can finish a response. The state lives in a file, not in Claude's context window.

## The Problem: Claude Does What It Wants

The initial request was narrow: "add codex MCP cross-verification at the end." But the conversation surfaced a deeper issue. The real problem wasn't missing cross-verification — it was that Claude would routinely skip planning entirely, write code directly, and close out the turn without any structured verification step.

The harness at that point looked like this:

- `SessionStart` → `sticky-rules.sh` (re-inject rules after context compaction)
- `PreToolUse(Bash)` → `contextzip-rewrite.sh` (token savings)
- `PreToolUse(Edit|Write|MultiEdit)` → `protect-files.sh` (file protection)
- `Stop` → `commit-cleanliness.sh` (commit hygiene)

Subagent definitions existed in `.claude/agents/`. Orchestration documentation existed in `CLAUDE.md`. None of it was enforced. When a task came in, Claude would evaluate it, decide it was simple enough to handle directly, and write the code. No plan. No verification. No external review. The documentation was aspirational, not mechanical.

The fix wasn't more documentation. It was enforcement.

## Research First: Four Parallel Agents

Before building anything, dispatched four research agents in parallel to map the landscape:

```
Agent 1: Multi-agent orchestration frameworks (general patterns)
Agent 2: Hermes agent framework (NousResearch)
Agent 3: Claude Code harness and sub-agent enforcement patterns
Agent 4: Agent gating and enforcement patterns in production systems
```

Hermes turned out to be `NousResearch/hermes-agent` (127k ⭐) — a fine-tuned model, not a Claude Code harness layer. Not directly applicable. The Claude Code hooks documentation had more practical patterns for what was needed here.

The research converged on a clear principle: **enforcement has to be mechanical, not conversational**. Any workflow that relies on the model remembering rules across context boundaries is fragile. Rules need to live in shell scripts that run regardless of what the model thinks.

## The Architecture: Files Beat Memory

The central design decision: manage state in files, not in Claude's context window.

Claude Code loses context on compaction, on session restart, on long conversations that exceed the window. If the workflow state exists only in context, it evaporates. If it exists in `~/.claude/workflow/current/state.json`, it survives.

```
~/.claude/workflow/
├── ORCHESTRATION.md       # workflow spec
├── AGENTS.md              # agent roles, triggers, outputs
├── current/
│   ├── state.json         # active task state (source of truth)
│   ├── plan.md            # plan-orchestrator output
│   ├── research.md        # Explore agent output
│   ├── diff.patch         # implementation result
│   ├── verifier-report.md # code-verifier output
│   └── codex-report.md    # codex cross-verify output
└── log/
    └── YYYYMMDD-HHMMSS/   # completed task archives
```

`state.json` carries `task_id`, `complexity`, `stage`, `completed_stages`, and `artifacts`. Each stage writes its output to a file. The next stage reads from that file — not from Claude's context. This means the orchestrator's context window doesn't accumulate implementation details; it just routes.

Complexity tiers are intentionally conservative. When in doubt, classify one level higher:

| Level | Criteria | Pipeline |
|-------|----------|----------|
| `trivial` | `~/.claude/**` changes ≤ 3 lines, or pure Q&A | Main handles directly |
| `simple` | Single file ≤ 30 lines | implement → verify |
| `standard` | New feature, multi-file ≤ 5 | plan → implement → verify → codex |
| `major` | 6+ files, architecture changes | standard + reviewer |

Almost all coding work classifies as `standard` or above. `trivial` is reserved for config changes, memory updates, and direct questions.

## The Hooks: Where Enforcement Happens

Three hooks implement the enforcement:

### `orchestrator-gate.sh` (PreToolUse)

Fires before any `Edit`, `Write`, or `MultiEdit` tool call. Reads `state.json`. If `complexity` is not `trivial` and `stage` is not `implementing`, returns `deny`. Claude physically cannot write code without being in the implementing stage — which requires a completed plan.

```bash
# core logic
if [[ "$complexity" != "trivial" && "$stage" != "implementing" ]]; then
  echo '{"decision": "deny", "reason": "No plan found. Run plan-orchestrator first."}'
  exit 0
fi
```

This is the most critical hook. It prevents the default behavior of writing code first and planning second (or never).

### `orchestrator-init.sh` (UserPromptSubmit)

Fires on every user message. Injects classification and routing rules into `additionalContext`. This ensures that even after context compaction, the orchestrator receives fresh routing instructions on every turn. The model doesn't need to "remember" the workflow — the hook re-delivers it.

### `orchestrator-stop.sh` (Stop)

Fires before Claude ends a response. Checks: does `current/diff.patch` exist? If yes, do `verifier-report.md` and `codex-report.md` also exist? If verification files are missing, returns `exit 2`. Claude cannot close the turn.

```bash
if [[ -f "$CURRENT/diff.patch" ]]; then
  [[ ! -f "$CURRENT/verifier-report.md" ]] && exit 2
  [[ ! -f "$CURRENT/codex-report.md" ]] && exit 2
fi
```

The combination: you can't start writing without a plan, and you can't finish without verification. The middle is enforced by the stage machine.

## The Codex Cross-Verify Agent

Defined at `~/.claude/agents/codex-cross-verify.md`. Triggers after `code-verifier` passes on `standard` and `major` tasks. Calls `mcp__codex__codex` to get an external model's view of the diff.

The prompt structure passed to Codex:

```
You are an external code reviewer. Read these files and verify:
- PLAN: <plan.md contents>
- DIFF: <diff.patch contents>
- VERIFIER: <verifier-report.md contents>

Cross-check:
1. Does the diff match the plan?
2. Are there bugs the verifier missed (logic/security/edge cases)?
3. Any backward-compat or breaking changes?

Return: VERDICT (approve|request-changes) + bullet list of findings.
```

Output lands at `current/codex-report.md`. If it's absent when the Stop hook fires, the response is blocked.

The key property: Codex is a different model with no context from the current session. It reads only the files. This removes the "the model convinced itself it was correct" failure mode.

## Numbers: What 79 Tool Calls Looks Like

```
Bash         23  (script execution, file ops, git)
TaskUpdate   21  (four research agents each reporting progress)
TaskCreate   10  (subagent dispatches)
Write         9  (one file at a time, each hook/doc/lib)
Agent         6  (research agents + implementation)
Edit          5  (refinements to hooks)
Read          2  
Skill         2  
```

TaskUpdate at 21 is because four research agents ran in parallel, each updating task state as they progressed. Write at 9 is because each file was created separately — nine distinct `Write` calls for nine new files.

Files created:

```
~/.claude/agents/codex-cross-verify.md
~/.claude/hooks/orchestrator-gate.sh
~/.claude/hooks/orchestrator-init.sh
~/.claude/hooks/orchestrator-stop.sh
~/.claude/workflow/AGENTS.md
~/.claude/workflow/ORCHESTRATION.md
~/.claude/workflow/lib/classify.sh
~/.claude/workflow/lib/state.sh
~/orchestrator-harness-research.html
```

6 hours 44 minutes is long for 9 files. The time went into research (parallel agents exploring four domains), design iteration (the state schema went through three revisions), and hook debugging (shell scripts failing silently requires careful logging to diagnose).

## What's Different Now

Before: Claude would classify a task, decide it was straightforward, and write the code directly. The subagent documentation was decorative.

After: `Edit` on a non-trivial task before plan-orchestrator runs returns a deny. The Stop hook won't release until verifier and codex reports exist. The state machine tracks exactly where a task is — across sessions, across compaction events.

The next session is the real test. A staged rollout where the hooks interfere unexpectedly, or where the complexity classification is wrong, will surface edge cases that pure design can't anticipate. The classification heuristics are conservative by design — the cost of an over-classified task is one extra planning step, not a broken pipeline.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
