---
title: "19 Claude Code Sessions, 473 Tool Calls: Building a Dashboard That Watches Claude Watch Itself"
project: "portfolio-site"
date: 2026-05-30
lang: en
pair: "2026-05-30-portfolio-site-ko"
tags: [claude-code, hermes, dashboard, automation, multi-agent]
description: "The same prompt ran 6 times before a file changed. 5 sessions were pure echo probes. Here's what broke the loop — and the security issue nobody asked for."
---

19 sessions. 473 tool calls. The first file change happened in session 12.

**TL;DR** Built a dashboard that monitors Claude's own work — using Claude Code. The Hermes dashboard went from V1 to V3 across three implementation sessions. Six sessions ran the same prompt without touching a file. Five more were echo probes with zero tool calls. One line of role-clarification text broke the loop. Along the way, a security issue surfaced that nobody asked the agent to find.

## The Same Prompt Ran Six Times

Sessions 1, 3, 4, 5, 7, and 9 all started with the same instruction: *"Upgrade the Hermes dashboard into a mission-control style UI."*

Every one of those sessions did exactly the same thing: Read files. Run Bash commands. Explore the codebase. Stop. No writes, no edits, nothing shipped.

Between those sessions, five more ran as bare echo probes — `HELLO`, `BARE_OK`, `CLEAN_OK`, `CLAUDE_LEAN_OK`, `CLAUDE_FINAL_LEAN_OK` — verifying that context routing worked correctly when Hermes relayed prompts to Claude Code. Five sessions, zero tool calls total.

The root problem: Hermes acts as the orchestrator and Claude Code is the executor. Nothing in the prompt made that split explicit. The agent kept treating itself as the planner, not the implementer — exploring, forming a plan, then deferring implementation to "the next session."

Session 12's prompt fixed it with one sentence:

```
"You are Claude Code, the actual implementer.
Hermes is only the relay/orchestrator."
```

That sentence broke the loop. In multi-agent systems, role ambiguity between orchestrator and executor is a real failure mode, not a hypothetical one.

## What Hermes Is

A local Next.js app running at `http://127.0.0.1:7878`. It shows real-time state across Claude Code sessions, Codex sessions, cron jobs, tmux sessions, and workflow statuses. Claude monitoring Claude's own work.

The original problem was the cron job IDs. Raw strings like `medical-dental-ads-daily-goal`, `telegram-tech-report-html`, and `daily-codex-cli-update` were displayed as-is. Looking at the dashboard, you couldn't tell what any of them actually did. That's what triggered the V1→V3 cycle.

## Session 12: Korean Labels (49 min, 59 tool calls)

Created a `describeCronJob` helper that maps 7 cron job IDs to human-readable Korean labels, then replaced every `{j.name || j.id}` with `describeCronJob(j.id)` across all components.

Codex cross-review caught two blockers before commit. First: line 161 of `CronOutputPanel.tsx` still used the raw ID as the primary label — the helper was added but never wired up there. Second: one component had no import from the new helper file at all.

Both fixed. Typecheck and build passed. Commit.

Tool distribution: Bash 32×, Read 22×, Agent 4×, Write 1×. The 4 Agent calls were Codex cross-review plus `frontend-implementer` subagent delegation — the change touched 8+ files, too wide for a single context pass.

## Session 13: V2 — Cron Output Panel (36 min, 93 tool calls)

Ran from a spec file: `~/.hermes/tmp/hermes-dashboard-v2-brief.md`. Three new components (`ActiveWork.tsx`, `CronOutputPanel.tsx`, `NowStrip.tsx`) and a new API route (`/api/cron-output`).

While reading through the actual cron output files at `~/.hermes/cron/output/<jobId>/<timestamp>.md` to understand the data shape, something unexpected showed up: a `## Prompt` section containing the full prompt text verbatim.

Nobody asked the agent to look for security issues. It was reading files to understand structure, and this fell out of that. If the API route served those files as-is, complete prompt contents — potentially including API keys or internal strategy details — would reach the client.

A redaction filter went into `/api/cron-output` before the route shipped. The `## Prompt` section gets stripped server-side before the response goes out.

This session created 14 files. Tool breakdown: Bash 33×, Read 31×, Edit 17×, Write 10×. Write count spikes when net-new files are being created — expected.

## Session 14: V3 — Full Redesign (2 hr 20 min, 122 tool calls)

The heaviest session. Started from `hermes-dashboard-v3-brief.md`.

Exploration alone took Read 28× and Bash 10+×. The agent pulled live data before designing anything: 7 active cron jobs, 26 workflow states, 3 Claude processes running, server healthy. Those numbers shaped the component design directly.

Midway through, a follow-up prompt came in after Codex cross-verification:

```
Codex cross-verification is done. Continue: inspect the Codex report for any
blocking issues. If only minor/non-blocking, do not over-polish; run final
typecheck/build/diff-check, commit, restart the 7878 dashboard.
```

"Do not over-polish" is the key instruction. If Codex finds no true blockers, ship it. An explicit directive to exit the perfectionism loop — the failure mode where an agent keeps refining past the point of diminishing returns.

Codex reported no blockers. Typecheck and build passed. Commit: `feat: redesign Hermes dashboard work control room`. 35 files created or modified.

## Tool Usage Across All 19 Sessions

| Tool  | Count | Share |
|-------|-------|-------|
| Read  | 209   | 44%   |
| Bash  | 153   | 32%   |
| Edit  | 46    | 10%   |
| Write | 34    | 7%    |
| Agent | 17    | 4%    |

Read at 44% is the headline number. Exploration outweighed implementation by more than 2:1, even in sessions that shipped substantial code.

Edit and Write combined: 80 calls across 46 unique files — 1.7 edits per file on average. `allowlists.ts` and `page.tsx` were touched in multiple sessions, meaning neither was finished in a single pass.

The 17 Agent calls are all either Codex cross-verification or `frontend-implementer` delegation. The main agent didn't write everything itself — verification was outsourced, which is how the `CronOutputPanel.tsx` label bug and the prompt-exposure security issue both surfaced.

## Brief Files Break the Exploration Loop

Sessions 1 through 11: 11 sessions, zero file changes.

The failure pattern: Hermes managing Claude Code sessions creates a relay layer. The orchestrator spent each session re-exploring context, forming plans, then deferring implementation. The loop ran because nothing anchored the session to "start here, implement this."

Brief files fixed it. When sessions 13 and 14 opened a spec file first — `hermes-dashboard-v2-brief.md`, `hermes-dashboard-v3-brief.md` — they skipped re-exploration entirely and went straight to implementation. Context reconstruction cost drops to a single file read.

> Open-ended goals like "upgrade into a more visual mission-control style dashboard" create exploration loops. A brief file converts them into bounded implementation tasks. Context reconstruction cost: one `Read` call.

19 sessions were not necessary. Starting with brief files from the beginning, this was a 5-session project. The overhead wasn't capability — it was the orchestration structure that kept deferring execution.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
