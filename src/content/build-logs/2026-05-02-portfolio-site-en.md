---
title: "Enforcing an Orchestrator with 3 Hooks — 79 Tool Calls, Zero Direct Code"
project: "portfolio-site"
date: 2026-05-02
lang: en
pair: "2026-05-02-portfolio-site-ko"
tags: [claude-code, orchestrator, hooks, multi-agent, codex]
description: "Three PreToolUse and Stop hooks prevent Claude Code's main instance from writing code directly, enforcing a plan→implement→verify→codex pipeline."
---

79 tool calls. 6 hours 44 minutes. Not a single line of code written directly by the main Claude instance. That was the point — I built a system that physically prevents it from doing so.

**TL;DR**: Three hooks (`PreToolUse`, `Stop`, `UserPromptSubmit`) force the main orchestrator to never write code directly. Every non-trivial task flows through plan → implement → verify → codex cross-validation, with the entire pipeline state persisted to files at `~/.claude/workflow/current/`.

## It Started with "Is Your Harness Already Wired Up?"

The session kicked off with this prompt:

> "Connect codex CLI via MCP and apply cross-validation as the last step of your workflow. Is the harness already set up?"

When I checked, it was only partially there. Token-saving hooks via `contextzip`, file protection, commit cleanliness — those existed. But the orchestrator structure was missing. The main Claude was doing everything: planning, writing code, reviewing. No separation, no enforcement.

The follow-up request made the goal explicit:

> "Except for trivially simple tasks, enforce everything through hooks. Define the orchestrator and each agent in CLAUDE.md, run it file-based, store state in workflow memory."

That was the spec.

## Research Before Architecture — 4 Agents in Parallel

I don't build on patterns I haven't validated. Before designing anything, I needed references. Four domains got dispatched in parallel:

- Multi-agent orchestration frameworks (AutoGen, LangGraph, CrewAI)
- Hermes agent framework verification
- Claude Code hooks + official harness documentation
- Agent enforcement and gating patterns

`NousResearch/hermes-agent` (127k stars) turned out to be real — a fine-tuned model family that structures tool calls as function signatures, not directly applicable here. The key references were Claude Code's `PreToolUse`/`Stop` hooks and LangGraph's state machine pattern.

**Why only 6 Agent calls total?** Those 4 research agents ran in the background. The remaining 73 calls were Bash(23), TaskUpdate(21), TaskCreate(10), Write(9) — the actual design and implementation work.

## File-Based State Machine: Why Files?

Compaction is the failure mode. When a session gets long or context gets compressed, Claude loses memory of previous stages. Managing pipeline state in memory means it evaporates after compaction.

Files don't evaporate:

```
~/.claude/workflow/
├── ORCHESTRATION.md     Workflow definition
├── AGENTS.md            Agent catalog
├── current/
│   ├── state.json       task_id, complexity, stage, completed_stages
│   ├── plan.md          plan-orchestrator output
│   ├── diff.patch       Implementation result (git diff)
│   ├── verifier-report.md
│   └── codex-report.md
└── log/
    └── YYYYMMDD-HHMMSS/ Completed task archive
```

`state.json` knows the current stage. After compaction, the `SessionStart` hook reads it and restores context for the main instance. The `PreCompact` hook dumps `state.json` to stderr right before compression, so it survives into the next context window.

## 3 Hooks That Make the Rules Non-Optional

The enforcement mechanism is three hooks.

**`orchestrator-init.sh` (UserPromptSubmit)** — Re-injects classification and routing rules into context on every user prompt. Even after compaction, the main instance doesn't forget the rules.

**`orchestrator-gate.sh` (PreToolUse: Edit|Write|MultiEdit)** — If `state.complexity != "trivial"` AND `stage != "implementing"`, file modifications are denied. This is the core enforcement hook: no plan, no code.

**`orchestrator-stop.sh` (Stop)** — If a diff exists but `verifier-report.md` or `codex-report.md` are missing, the response is blocked from completing. You can't close out a task without verification.

The result: any non-trivial task must follow this exact sequence:

```
1. plan-orchestrator → generate current/plan.md
2. (orchestrator-gate passes) implementation agent → current/diff.patch
3. code-verifier → current/verifier-report.md
4. codex-cross-verify → current/codex-report.md
5. (orchestrator-stop passes) report to user
```

## Complexity Classification: "Almost Everything is Standard"

I built a conservative classification table:

| Tier | Criteria | Pipeline |
|------|----------|----------|
| `trivial` | Changes only in `~/.claude/**` ≤ 3 lines, or pure Q&A | Main handles directly |
| `simple` | Single file ≤ 30 lines, clear spec | implement → verify |
| `standard` | New feature, UI changes, multi-file ≤ 5 | plan → implement → verify → codex |
| `major` | 6+ files, architecture changes, new dependencies | standard + code-reviewer |

The principle baked into the config:

> Almost all coding tasks classify as standard or above. Trivial is reserved for memory edits, config changes, and pure questions.

Without this, self-justification creeps in: "This looks simple enough to skip the plan." The hooks only work if classification is strict.

## Codex MCP Cross-Validation: An External Model Gets the Final Look

For `standard` and `major` tasks, the last stage routes through codex MCP for an independent model review. `~/.claude/agents/codex-cross-verify.md` wraps this logic:

```
You are an external code reviewer. Read these files and verify:
- PLAN: <plan.md content>
- DIFF: <diff.patch content>
- VERIFIER: <verifier-report.md content>

Cross-check:
1. Does the diff match the plan?
2. Are there bugs the verifier missed?
3. Any backward-compat or breaking changes?

Return: VERDICT (approve|request-changes) + bullet list of findings.
```

Reviewing within the same context means sharing the same blind spots. An external model brings a different angle.

## Session Stats

| Tool | Count |
|------|-------|
| Bash | 23 |
| TaskUpdate | 21 |
| TaskCreate | 10 |
| Write | 9 |
| Agent | 6 |
| Edit | 5 |
| Read | 2 |
| Skill | 2 |
| **Total** | **79** |

9 new files created, 3 files modified. `Write(9)` is high because this was mostly a "create new infrastructure" session. `TaskUpdate(21)` + `TaskCreate(10)` reflect pipeline stages tracked as discrete tasks.

## Why Hooks, Not Willpower

When the main Claude writes code directly, two problems surface.

**Context pollution.** Implementation details accumulate in the main context window and start influencing subsequent decisions. Sub-agents start fresh — no noise from previous stages.

**Unenforced rules are ignored.** "Plan first" is a good principle. Claude won't reliably follow it without enforcement. Without `orchestrator-gate.sh`, "this looks simple enough" becomes a valid self-justification. The hook makes it physically impossible.

> Hooks replace willpower with structure. The workflow runs because it can't not run.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
