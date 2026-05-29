---
title: "Hermes Dashboard V1→V4: Building a Local Agent Monitor in One Day with Claude Code"
project: "portfolio-site"
date: 2026-05-30
lang: en
pair: "2026-05-30-portfolio-site-ko"
tags: [claude-code, hermes, dashboard, multi-agent, orchestration]
description: "11 sessions, 478 tool calls, 5 hours: how I iterated a local agent monitor from MVP to V4 with Claude Code's orchestrator gate pattern—and caught a security bug along the way."
---

11 sessions. 478 tool calls. Nearly 5 hours of work. That's what it took to go from "I have no idea what's running locally" to a real-time dashboard showing every agent task, cron job, and workflow in flight.

**TL;DR:** Using Claude Code's orchestrator gate pattern, I iterated the Hermes dashboard from MVP → V2 → V3 (mission control redesign) → V4 (human-readable labels) in a single day. Along the way, I caught a security issue that would have shipped undetected if I hadn't explored the real data first.

## Why I Needed a Dashboard

Hermes, Claude Code, Codex, and cron automations were all running concurrently—and I had zero visibility into what was actually happening. The workflow was: open a tmux session, run `ps aux`, dig through log files. Too slow. Too manual.

What I needed was a read-only `localhost:7878` dashboard that could surface the current state of everything at a glance.

## The First 49 Minutes: V1 MVP

Session 4 was planning. I wrote a brief at `~/.hermes/tmp/hermes-dashboard-brief.md` and handed it to the plan-orchestrator agent. Session 5 delegated the actual implementation to a general-purpose agent.

The first obstacle was the orchestrator gate. The main Claude instance tried to call `Edit`/`Write` directly, but the workflow state wasn't set to `stage: implementing`—so the pre-tool hook blocked it. One state update unblocked the subagent writes:

```bash
source ~/.claude/workflows/.../lib/state.sh
state_set stage implementing
```

After V1 shipped, a Codex cross-verification pass surfaced 4 must-fix issues: a missing protocol allowlist for RSS links, an EOF newline in the log route, and a couple of edge cases. A fix agent handled them immediately.

## How a Security Issue Almost Slipped Through

V2 (Session 8, 36 minutes, 93 tool calls) started with cron output exploration—and that's when I found something.

Files at `~/.hermes/cron/output/<jobId>/<timestamp>.md` contained **full prompts verbatim in a `## Prompt` section**. If those prompts included API keys or internal strategy details, they'd have rendered directly in the dashboard UI.

The fix was a redaction layer in `allowlists.ts` to strip prompt sections before they reached the frontend. Without digging through the actual files first, this would have shipped.

This is why the session logged 33 Bash calls before a single line of implementation code ran. Read the real data. Design second.

## V3: The 2-Hour Mission Control Redesign

Session 9 was the longest: 2 hours 20 minutes, 122 tool calls.

The `interface-design` skill loaded mid-session. A direction change came in from the user; the session resumed after Codex cross-verify results came back.

The core change in V3 was the UI language. The "AI News" section was removed. New components were split out for agent progress, cron issue cards, and a workboard:

```
~/hermes-dashboard/src/
├── components/
│   ├── AgentProgressPanel.tsx   # new
│   ├── CronIssueCards.tsx       # new
│   ├── MissionControl.tsx       # new
│   └── WorkBoard.tsx            # new
└── lib/
    ├── controlRoomTypes.ts
    ├── workStages.ts
    └── workflows.ts
```

`globals.css` got a `cool-slate` theme with a lamp effect. Over 20 files were generated in this single session.

I used the `Workflow` tool once—a dynamic 4-phase pipeline: contract → parallel components → integrate → typecheck.

## V4: The Raw ID Problem

Session 11 (49 minutes, 59 tool calls) tackled a UX issue that had been there since V1.

Internal identifiers like `medical-dental-ads-daily-goal` and `telegram-tech-report-html` were rendering as-is in the UI. A user called it out directly.

The fix: a `describeCronJob` helper in `src/lib/cronLabels.ts`, with all label-rendering components routing through it instead of using raw IDs. Around 9 files changed—classified as `standard` complexity and delegated to the `frontend-implementer` subagent.

## What the Orchestrator Gate Looks Like in Practice

The gate came up repeatedly across all 11 sessions. Two things matter in practice.

**First**, the main Claude instance can't write files unless workflow state is `stage: implementing`. Skip this and every `Edit`/`Write` call fails at the pre-tool hook.

**Second**, `major` complexity tasks enforce the full pipeline—plan → implementation agent → verifier → Codex. This feels like overhead until Codex catches a real bug. It did in V1. It did again in V3, where blocking findings from the Codex report triggered a dedicated fix pass.

```
plan.md → implement → diff.patch → verifier-report.md → codex-report.md → final report
```

Even in sessions 6–7 where only a `config` object was passed, the main agent read `state.json` to restore full context. The state file is what keeps continuity across disconnected sessions.

## The Numbers

| Metric | Count |
|--------|-------|
| Total sessions | 11 |
| Total tool calls | 478 |
| Bash | 198 |
| Read | 147 |
| Edit | 46 |
| Write | 39 |
| Agent | 23 |
| Files created | 32 |
| Files modified | 17 |
| Longest single session | 2h 20m (V3) |

The Read count (147) being second only to Bash (198) tells the real story. More calls went into exploration than implementation. Looking at actual data before writing code was the consistent pattern that held throughout all four versions.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
