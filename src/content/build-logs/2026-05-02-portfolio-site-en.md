---
title: "3 Hooks That Force Claude Code to Stop Writing Its Own Code"
project: "portfolio-site"
date: 2026-05-02
lang: en
pair: "2026-05-02-portfolio-site-ko"
tags: [claude-code, orchestrator, harness, hooks, multi-agent, codex]
description: "Built a Claude Code harness where PreToolUse/Stop hooks physically prevent the main agent from writing code. plan→implement→verify→codex pipeline, file-persisted state. 79 tool calls, 6h 44min."
---

79 tool calls. 6 hours 44 minutes. Not a single line of code written directly by the main agent.

That last part wasn't an accident — the system was specifically designed to make it impossible. This session was about building a harness where three hooks physically block the main Claude orchestrator from writing code, enforcing a plan → implement → verify → codex cross-validation pipeline with all state persisted to files that survive context compaction.

**TL;DR** `PreToolUse`, `Stop`, and `UserPromptSubmit` hooks force the main orchestrator to route all coding through subagents. Pipeline state lives in `~/.claude/workflow/current/` as files. Skip a verification step and the Stop hook blocks the response from completing.

## The Question That Started Everything

Session opening prompt:

> "Connect codex CLI via MCP for cross-validation at the last stage. Is the harness engineering already in place?"

The honest answer: partially. There were token-saving hooks via contextzip, file protection rules, commit cleanliness checks — but no orchestrator structure. The main agent was planning, writing code, and reviewing all by itself. That defeats the point of a multi-agent setup.

The follow-up was the real requirement:

> "Except for trivial tasks, enforce everything through hooks. Define the orchestrator and each agent in CLAUDE.md with context. Make the whole thing file-based so state persists across compaction."

The emphasis on *hooks* and *files* — not guidelines, not memory — was deliberate. Guidelines are forgotten. Files and hooks are not.

## Research Before Design — 4 Agents in Parallel

Before designing anything, the reference landscape needed mapping. Four domains, dispatched in parallel:

- Multi-agent orchestration frameworks (AutoGen, LangGraph, CrewAI)
- Hermes agent framework validation
- Claude Code hooks and official harness documentation
- Agent enforcement and gating patterns

`NousResearch/hermes-agent` (127k stars) is real — a fine-tuned model family that structures tool calls as typed function signatures. Not directly applicable here, but the approach informed the design. The core references were Claude Code's `PreToolUse`/`Stop` hook contracts and LangGraph's file-based state machine pattern.

One data point: `Agent(6)` — only six agent calls in a 79-call session. That's because four research agents ran in the background. The remaining 73 calls were `Bash(23)`, `TaskUpdate(21)`, `TaskCreate(10)`, `Write(9)` — all design and implementation work.

## Why Files — The Compaction Problem

Context compaction kills long-running pipelines. When a session grows long enough, Claude compresses prior context to fit the window. If pipeline state lives only in conversation memory, it evaporates at the next compaction boundary.

The answer is files as the source of truth:

```
~/.claude/workflow/
├── ORCHESTRATION.md     workflow definition + routing rules
├── AGENTS.md            agent catalog with input/output contracts
├── current/
│   ├── state.json       task_id, complexity, stage, completed_stages
│   ├── plan.md          plan-orchestrator output
│   ├── diff.patch       implementation result (git diff)
│   ├── verifier-report.md
│   └── codex-report.md
└── log/
    └── YYYYMMDD-HHMMSS/ completed task archive
```

`state.json` is the live record of any active task:

```json
{
  "task_id": "20260502-153045",
  "user_request": "original request text",
  "complexity": "trivial|simple|standard|major",
  "stage": "classified|planning|implementing|verifying|cross_verifying|done",
  "completed_stages": ["classified", "planning"],
  "artifacts": {
    "plan": "current/plan.md",
    "diff": "current/diff.patch",
    "verifier": null,
    "codex": null
  }
}
```

After a compaction event, the `SessionStart` hook reads `state.json` and restores the active task state. The `PreCompact` hook writes `state.json` to stderr right before compression fires — ensuring it survives into the next context window.

**Files are the memory that survives sessions, subagents, and compaction. Conversation context is ephemeral.**

## 3 Hooks That Turn Guidelines into Hard Constraints

### `orchestrator-init.sh` (UserPromptSubmit)

Fires on every user request. Injects complexity classification rules and routing logic into context as `additionalContext`. After compaction, the main agent can't forget the routing rules — it gets them back at the start of every turn regardless.

### `orchestrator-gate.sh` (PreToolUse: Edit|Write|MultiEdit)

This is the critical gate. The logic:

```bash
complexity=$(jq -r '.complexity' ~/.claude/workflow/current/state.json)
stage=$(jq -r '.stage' ~/.claude/workflow/current/state.json)

if [[ "$complexity" != "trivial" && "$stage" != "implementing" ]]; then
  echo '{"decision": "block", "reason": "No plan approved. Run plan-orchestrator first."}'
  exit 0
fi
```

If the task isn't `trivial` and the stage isn't `implementing`, any file modification is rejected. The main agent physically cannot write code without a plan committed to `current/plan.md` first and the stage advanced to `implementing`.

Without this hook, self-persuasion creeps in: *"this change is small enough to do directly."* The hook makes that path unavailable.

### `orchestrator-stop.sh` (Stop)

Fires when the agent is about to end its response:

```bash
diff_exists=$([ -f ~/.claude/workflow/current/diff.patch ] && echo "yes" || echo "no")
verifier_exists=$([ -f ~/.claude/workflow/current/verifier-report.md ] && echo "yes" || echo "no")
codex_exists=$([ -f ~/.claude/workflow/current/codex-report.md ] && echo "yes" || echo "no")

if [[ "$diff_exists" == "yes" && ("$verifier_exists" == "no" || "$codex_exists" == "no") ]]; then
  echo '{"decision": "block", "reason": "Missing verifier-report or codex-report."}'
  exit 2
fi
```

Code was written but verification artifacts are missing — response blocked. The agent cannot declare done and move on without verification files on disk.

Combined result: any task above `trivial` must complete this sequence before the response is allowed through:

```
1. plan-orchestrator      → current/plan.md
2. (gate clears)
   implementation agent   → current/diff.patch
3. code-verifier          → current/verifier-report.md
4. codex-cross-verify     → current/codex-report.md
5. (stop clears)
   report to user
```

## Complexity Classification — Default Higher, Not Lower

The classification table has four levels. The critical design choice is the threshold:

| Level | Criteria | Pipeline |
|-------|----------|----------|
| `trivial` | `~/.claude/**` changes ≤ 3 lines, or pure Q&A | Main handles directly |
| `simple` | Single file ≤ 30 lines, clear spec | implement → verify |
| `standard` | New feature, UI change, ≤ 5 files | plan → implement → verify → codex |
| `major` | 6+ files, architecture change, new dependency | standard + code-reviewer |

The explicit rule in `ORCHESTRATION.md`:

> Almost all coding tasks should be classified `standard` or above. `trivial` is reserved for genuinely trivial memory updates, config changes, or pure questions.

Without this rule, classification drift happens — tasks that *feel* simple get classified as simple. The hooks are only as good as the classification that feeds them.

## Codex MCP — A Fresh Model at the End

For `standard` and `major` tasks, the final stage sends everything to an external model via codex MCP. `~/.claude/agents/codex-cross-verify.md` wraps the prompt:

```
You are an external code reviewer. Read these files and verify:
- PLAN: <plan.md contents>
- DIFF: <diff.patch contents>
- VERIFIER: <verifier-report.md contents>

Cross-check:
1. Does the diff match the plan?
2. Are there bugs the verifier missed (logic, security, edge cases)?
3. Any backward-compatibility or breaking changes?

Return: VERDICT (approve|request-changes) + bullet list of findings.
```

A model reviewing its own work in the same context window shares the same blind spots as the original implementation. The reasoning that led to a bug is likely still present in context. An external model starting fresh has no prior investment in the decisions made.

This is the same reason code review exists in teams — not because the reviewer is smarter, but because they didn't anchor on the implementation choices.

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

9 new files created, 3 modified. `Write(9)` is high because the harness required net-new files. `TaskUpdate(21)` and `TaskCreate(10)` reflect managing each pipeline stage as a discrete tracked task — plan, implement, verify, cross-verify each got its own task entry.

## What the Hooks Actually Change

When the main agent writes code directly, two failure modes emerge.

**Context pollution.** Implementation details accumulate in the main context and bias subsequent judgment. If the main agent wrote the code, reviewed it, and is now deciding whether to ship — all within the same context — the anchoring from original decisions is present throughout. Subagents start fresh. No noise, no prior stakes.

**Rule drift.** "Plan first" is a good principle. It's also easy to rationalize past when a task *looks* small. `orchestrator-gate.sh` removes the option — the hook rejects the edit before it can happen, regardless of reasoning.

The distinction:

> Hooks enforce workflow through structure, not willpower. The orchestrator doesn't need to remember the rules — it just can't break them.

A guideline lives in the agent's judgment. A constraint lives in the shell script that runs before every file write.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
