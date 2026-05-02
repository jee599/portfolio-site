---
title: "Enforcing an Orchestrator with 3 Hooks — Claude Code Harness Engineering, 79 Tool Calls"
project: "portfolio-site"
date: 2026-05-02
lang: en
pair: "2026-05-02-portfolio-site-ko"
tags: [claude-code, orchestrator, harness, hooks, multi-agent, codex]
description: "Built 3 hooks that physically prevent the main agent from writing code — enforcing a plan→implement→verify→codex pipeline with file-persisted state."
---

79 tool calls. 6 hours 44 minutes. Not a single line of code written directly by the main agent.

That last part is the point. This session was about building a system that makes it *structurally impossible* for the main Claude orchestrator to write code — using three hooks that enforce a plan→implement→verify→codex cross-validation pipeline, with all state persisted to files that survive context compaction.

**TL;DR** `PreToolUse`, `Stop`, and `UserPromptSubmit` hooks force the main orchestrator to route all coding through subagents. Pipeline state lives in `~/.claude/workflow/current/` as files. Skip a verification step and the Stop hook blocks the response from completing.

## The Question That Started It

Session opening prompt:

> "Connect codex CLI via MCP and apply cross-validation at the last stage of your workflow. Is the harness engineering already in place?"

The answer was: partially. Token savings via contextzip, file protection, commit cleanliness hooks — all present. What was missing was an actual orchestrator structure. The main agent was planning, coding, and reviewing all by itself, which defeats the point of having a multi-agent setup.

Follow-up:

> "Except for trivially simple tasks, force everything through hooks. Define the orchestrator and each agent in CLAUDE.md with context. Run the whole thing off files so state persists across compaction."

That was the core requirement. The emphasis on *hooks* and *files* — not just guidelines — was deliberate.

## Research Before Design — 4 Agents in Parallel

Before designing anything, the right references needed to exist. Building a multi-agent enforcement system without knowing what patterns have already been validated is a recipe for reinventing broken wheels. Four domains were dispatched in parallel:

- Multi-agent orchestration frameworks (AutoGen, LangGraph, CrewAI)
- Hermes agent framework validation
- Claude Code hooks and official harness documentation
- Agent enforcement and gating patterns

`NousResearch/hermes-agent` (127k ⭐) exists and is real — it's a fine-tuned model family that structures tool calls as typed function signatures. Not directly portable to this use case, but the structured-output approach informed the design. The core references ended up being Claude Code's `PreToolUse`/`Stop` hook contracts and LangGraph's file-based state machine pattern.

One data point worth noting: `Agent(6)` — six agent calls is low for a 79-call session. That's because four research agents ran in the background during design. The remaining 73 calls were `Bash(23)`, `TaskUpdate(21)`, `TaskCreate(10)`, `Write(9)` — all design and implementation work.

## Why Files? The Compaction Problem

Context compaction kills long-running pipelines. When a session grows long enough, Claude compresses prior context to fit the window. If pipeline state lives only in conversation memory, it evaporates at the next compaction boundary.

The solution is files as the source of truth:

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

`state.json` is the source of truth for any active task:

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

After a compaction event, the `SessionStart` hook reads `state.json` and reloads the active task state into context. The `PreCompact` hook writes `state.json` to stderr immediately before compression fires — so it survives into the next context window even if the conversation is truncated.

Core design principle: **files are the memory that survives sessions, subagents, and compaction. Conversation context is ephemeral.**

## 3 Hooks That Turn Guidelines into Constraints

The enforcement mechanism is three hooks. Each targets a different failure mode.

### `orchestrator-init.sh` (UserPromptSubmit)

Fires on every user request. Injects complexity classification rules and routing logic into context as `additionalContext`. Even after compaction, the main agent gets the routing rules at the start of each turn.

This solves the "forgetting the rules" problem that appears in long sessions — the orchestrator doesn't have to remember what it's supposed to do, because the hook reminds it on every message.

### `orchestrator-gate.sh` (PreToolUse: Edit|Write|MultiEdit)

The critical enforcement hook. Logic:

```bash
complexity=$(jq -r '.complexity' ~/.claude/workflow/current/state.json)
stage=$(jq -r '.stage' ~/.claude/workflow/current/state.json)

if [[ "$complexity" != "trivial" && "$stage" != "implementing" ]]; then
  echo '{"decision": "block", "reason": "No plan approved. Run plan-orchestrator first."}'
  exit 0
fi
```

If the task isn't trivial and the stage isn't `implementing`, any attempt to edit or write files is rejected. The main agent physically cannot write code without a plan committed to `current/plan.md` first and the stage advanced to `implementing`.

Without this hook, self-persuasion creeps in: *"this change is small enough to do directly."* The hook makes that decision impossible to act on.

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

If code was written but verification artifacts are missing, the response is blocked. The agent can't declare success and move on without the verification files existing on disk.

Combined result — any task above `trivial` must go through this sequence:

```
1. plan-orchestrator → current/plan.md
2. (orchestrator-gate clears) implementation subagent → current/diff.patch
3. code-verifier → current/verifier-report.md
4. codex-cross-verify → current/codex-report.md
5. (orchestrator-stop clears) report to user
```

## The Complexity Ladder — Thresholds Set Conservatively

| Level | Criteria | Pipeline |
|-------|----------|----------|
| `trivial` | `~/.claude/**` changes ≤ 3 lines, or pure Q&A | Main handles directly |
| `simple` | Single file ≤ 30 lines, clear spec | implement → verify |
| `standard` | New feature, UI change, multi-file ≤ 5 | plan → implement → verify → codex |
| `major` | 6+ files, architecture change, new dependency | standard + code-reviewer |

The rule embedded in `ORCHESTRATION.md`:

> Almost all coding tasks should be classified `standard` or above. `trivial` is reserved for genuinely trivial memory updates, config changes, or pure questions.

Without this explicit rule, classification drift happens. Tasks that *feel* simple get classified as simple. The hooks are only as good as the classification that feeds them.

## Codex MCP Cross-Validation — A Second Model at the End

For `standard` and `major` tasks, the final stage sends everything through codex MCP for external model validation. `~/.claude/agents/codex-cross-verify.md` wraps this logic:

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

The core argument: a model reviewing its own work in the same context window shares the same blind spots as the original implementation. The reasoning that led to a bug is likely still present in context, making it harder to catch. An external model starting fresh has no stake in the decisions already made.

This is the same reason code review exists in teams. It's not that the reviewer is smarter — it's that they haven't anchored on the implementation choices.

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

9 new files created, 3 modified. The high `Write(9)` count reflects net-new file creation for the workflow system itself. `TaskUpdate(21)` and `TaskCreate(10)` reflect treating each pipeline stage as an explicit tracked task — plan, implement, verify, cross-verify each got its own task entry.

## What the Hooks Actually Change

When the main agent writes code directly, two failure modes appear.

**Context pollution.** Implementation details accumulate in the main context and bias subsequent judgment calls. If the main agent wrote the code, reviewed it, and is now deciding whether to ship — all in the same context — the anchoring from original implementation choices is present throughout. Subagents start fresh. They have no stake in prior decisions.

**Rule drift.** "Plan first" is a good principle and also easy to rationalize past when a task looks small. `orchestrator-gate.sh` removes the option. The agent can't choose to skip the plan step because the hook rejects the file edit before it can happen.

The distinction: a guideline lives in the agent's judgment. A constraint lives in the enforcement mechanism.

> Hooks enforce workflow through structure, not willpower. The orchestrator doesn't need to remember the rules — it just can't break them.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
