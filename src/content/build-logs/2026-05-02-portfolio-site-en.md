---
title: "Building a Harness That Stops Claude Code From Writing Code Itself: 355 Tool Calls, 10 Edits"
project: "portfolio-site"
date: 2026-05-02
lang: en
pair: "2026-05-02-portfolio-site-ko"
tags: [claude-code, orchestration, multi-agent, hooks, codex]
description: "Engineering a 3-hook harness that forces Claude Code into pure orchestrator mode: 355 tool calls, 65 subagent dispatches, and a Codex MCP cross-validation pipeline."
---

Out of 355 tool calls in this session, only 10 were `Edit`. The rest: `Bash(94)`, `TaskUpdate(76)`, `Agent(65)`. That ratio is not accidental — it's the output of a harness specifically designed to prevent Claude Code from writing code directly.

**TL;DR** Three hooks (`orchestrator-gate.sh`, `orchestrator-init.sh`, `orchestrator-stop.sh`) plus a file-based state machine (`state.json`) enforce an orchestrator-only workflow. Every non-trivial task must pass through plan → implement → verify → codex before it completes.

## Why Five Sessions Kept Producing the Same Failure Mode

This week I ran Claude Code across three projects in parallel: dental advertising market research (12 parallel subagents, 7 HTML reports), 5 DEV.to posts auto-published, and Google Meet integration for coffeechat. Five sessions total.

The failure mode repeated across all of them. The main Claude context — which should have been orchestrating — kept writing code directly. No plan. No review. No verification. In the DEV.to session, a tool call that appeared to fail had actually succeeded. By the time anyone caught it, the output directory held 8 files instead of 5 and required manual cleanup.

After 65 subagent dispatches across the week, the pattern in agent behavior was clear. A well-behaved agent reads a plan file, produces a diff, and exits. A problematic agent touches files without context. The main context was exhibiting the same problematic pattern — acting before a plan existed, skipping verification afterward.

Promises don't fix this. "I'll run the plan step first next time" isn't a constraint, it's an intention. The only thing that actually works is a hook that denies the tool call at the infrastructure level.

## The Research: What 127k Stars and Three Frameworks Showed

I dispatched 4 agents in parallel to map orchestration framework references before building anything.

The findings:

- `NousResearch/hermes-agent` at 127k stars is a real, documented framework with an orchestrator-worker model
- Claude Code's official hook documentation covers `PreToolUse`, `Stop`, and `SessionStart` event types
- AutoGen and LangGraph both enforce orchestrator-worker separation — and both use explicit state tracking, not in-memory assumptions

Two principles emerged from the survey.

**State must survive outside the context.** Compaction clears conversation history. If task progress lives only in Claude's working memory, a compaction event erases everything. Persisting `task_id`, `complexity`, `stage`, and `completed_stages` in a `state.json` file means any new context can resume exactly where the previous one stopped.

**Enforcement only works at the hook layer.** You cannot reason your way into consistent behavior. `PreToolUse` can deny a request before it executes. That's the only mechanism that holds.

## Three Hooks, One State Machine

The full directory layout:

```
~/.claude/
├── workflow/
│   ├── ORCHESTRATION.md    # complexity classification + pipeline definition
│   ├── AGENTS.md           # agent catalog (roles, triggers, output paths)
│   ├── lib/
│   │   ├── state.sh        # state_set, state_add_completed helpers
│   │   └── classify.sh     # complexity classification heuristics
│   └── current/
│       ├── state.json      # active task state
│       ├── plan.md         # plan-orchestrator output
│       ├── diff.patch      # implementation result
│       ├── verifier-report.md
│       └── codex-report.md
└── hooks/
    ├── orchestrator-gate.sh   # PreToolUse: blocks Edit/Write without a plan
    ├── orchestrator-init.sh   # UserPromptSubmit: classifies + initializes state
    └── orchestrator-stop.sh   # Stop: blocks exit if diff exists without verification
```

`orchestrator-gate.sh` is the core constraint. It reads `complexity` from `state.json`. If the task is not `trivial` and the current `stage` is not `implementing`, any `Edit` or `Write` call is denied. The main context can only touch files after dispatching a plan agent and explicitly running `state_set stage implementing`. Subagents — invoked from within the implementing stage — can write freely. The main context cannot.

`orchestrator-stop.sh` enforces the other boundary. If `diff.patch` exists but `verifier-report.md` does not, the hook returns `exit 2`, blocking the session from closing. For `standard` and `major` complexity tasks, `codex-report.md` is also required.

`orchestrator-init.sh` fires on every user prompt. It classifies the incoming request, writes a fresh `state.json`, and injects the routing rules back into Claude's context — so compaction events don't cause the orchestrator to forget its own constraints.

## The Codex MCP Gate

The last verification step uses `mcp__codex__codex` through an agent defined in `~/.claude/agents/codex-cross-verify.md`. It receives three files: `diff.patch`, `plan.md`, and `verifier-report.md`.

The prompt:

```
Cross-check:
1. Does the diff match the plan?
2. Are there bugs the verifier missed (logic/security/edge cases)?
3. Any backward-compat or breaking changes?

Return: VERDICT (approve|request-changes) + bullet list of findings.
```

Internal verification loops have a structural bias. The same context that wrote the code also verifies it — which means the same blind spots that existed during writing exist during review. An external model reading only the diff, plan, and verifier report closes that gap. It has no preconceptions about what the code was supposed to do.

## The Complexity Classification

Every incoming task gets classified before any work starts:

| Complexity | Criteria | Pipeline |
|------------|----------|----------|
| `trivial` | `~/.claude/**` ≤3 lines, or pure Q&A | Main context handles directly |
| `simple` | Single file ≤30 lines | Implement → verify |
| `standard` | New feature, UI change, or multi-file ≤5 | Plan → implement → verify → codex |
| `major` | 6+ files, architecture changes | Standard + code-reviewer |

The classification threshold is deliberately conservative. When in doubt, classify one level higher. In practice, nearly every coding task is `standard` or above. `trivial` is reserved for config edits and direct questions — cases where the file-based pipeline would add overhead with no safety benefit.

## What the 10 Edits Were

The 10 `Edit` calls during this session were almost entirely from building the harness itself. The hooks, the state machine helpers, the ORCHESTRATION.md and AGENTS.md documentation. 34 files created, 7 modified. The 65 subagent dispatches handled the actual implementation work — the harness was bootstrapped partly through the old behavior it was designed to prevent.

That's the correct sequencing: enforce the constraint going forward, accept that building the constraint itself is a one-time exception. Every session after this one should show near-zero `Edit` calls from the main context.

The tool ratio to watch going forward:

- High `Agent` share (>40%) = research session — expected
- High `Bash` share (>50%) = implementation session — expected
- High `Edit` in the main context = something bypassed the gate — investigate

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
