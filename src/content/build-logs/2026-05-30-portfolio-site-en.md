---
title: "19 Claude Code Sessions to Build Hermes Mission Control — Half Did Nothing"
project: "portfolio-site"
date: 2026-05-30
lang: en
pair: "2026-05-30-portfolio-site-ko"
tags: [claude-code, hermes, dashboard, nextjs, mission-control, orchestration]
description: "19 sessions, 473 tool calls, 29 files — but 10 sessions wrote zero lines of code. Here's why half the Claude Code sessions stalled, and what finally unblocked the build."
---

19 sessions. 473 tool calls. 29 files created. By the numbers, this looks like a successful build. But 10 of those 19 sessions produced exactly zero lines of written code — not a single `Edit`, not a single `Write`. Half the compute went nowhere.

**TL;DR** It took one full day to upgrade the Hermes local dashboard from a raw-ID dump screen into Mission Control V3: human-readable Korean labels, live work-progress visualization, and a redesigned information architecture. The real work happened in just 4 sessions. This post documents why the other 10 stalled — and the pattern that finally made things move.

## Why 10 Sessions Produced Nothing

Session 6 ended like this:

```
Reply exactly BARE_OK
→ Not logged in · Please run /login
```

Sessions 8, 10, and 11 each received a handshake token — `CLEAN_OK`, `CLAUDE_LEAN_OK`, `CLAUDE_FINAL_LEAN_OK` — and terminated. In the Hermes architecture, Claude Code instances run as the orchestrator. Before spawning a real work session, Hermes probes connectivity with lightweight ping sessions. Those sessions are functioning exactly as designed. They just don't do anything.

The more interesting failures were sessions 1 through 5, plus 7 and 9. Opus 4.8 and Sonnet 4.6 alternated through the `hermes-dashboard` repo — `Read(16)`, `Read(17)`, `Read(10)`, `Read(13)` — but never touched `Edit` or `Write`. The blocker was the orchestration gate. Hermes's workflow state machine requires that file writes be delegated to a sub-agent before the workflow advances past `stage: planning`. The primary agent kept hitting that gate and stopping.

Session 4 is the clearest example of good planning that couldn't convert. Sonnet produced a complete implementation plan and wrote this in its reasoning:

> "phosphor annunciator lamps, cool-slate elevation, glow-as-status, reduced-motion fallback, Korean translation layer — this is not slop. My role is surgical improvement, not a full rewrite."

That's a sharp read of the codebase. But the very next step — calling `TaskCreate` to delegate to a sub-agent — stalled. The plan never executed. Classic case of high-quality analysis sitting in front of an execution wall.

## The 4 Sessions That Actually Shipped

Sessions 12 (49 min), 13 (36 min), 14 (2h 20m), and 15 (44 min) are where the code was written. They share one characteristic: each prompt either contained an explicit "do not enter plan mode, do not invoke superpowers/skills, do not present another proposal — directly edit files" instruction, or handed `claude-opus-4-8` a brief file path with "execute it fully."

The directive matters. Without it, the orchestrator's default behavior is to explore, assess, plan, and then schedule implementation for a future session. With it, the agent goes straight to files.

Session 12's core prompt:

```
Goal: improve cron jobs, skills, sessions, and internal identifiers
so they display in clear, human-readable Korean.
Opinion: identifiers like medical-dental-ads-daily-goal and
telegram-tech-report-html are incomprehensible to anyone
except the operator.
```

This session produced the `describeCronJob` helper — an extension to `src/lib/allowlists.ts` that maps raw job IDs to Korean display labels. Codex cross-verification caught one blocker that the primary agent missed: line 161 in `CronOutputPanel.tsx` was still using `{j.name || j.id}` as the primary label. The fix:

```tsx
// Before
{j.name || j.id}

// After
{describeCronJob(j.id)?.label ?? j.id}
```

A small diff. But without it, the entire labeling layer would have been bypassed and raw IDs would still appear in the UI.

## The Brief File Pattern — and a Security Issue It Exposed

Session 13 introduced the technique that finally broke the exploration loop: the brief file.

```
Read /Users/jidong/.hermes/tmp/hermes-dashboard-v2-brief.md and execute it fully.
Use Opus 4.8 xhigh. Work until verified and committed, or report any blocker.
```

The spec is written to a file before the session opens. When the session starts, the agent reads the file and immediately begins implementation — no re-exploration of the repo, no planning loop, no proposal. Session 13 generated 93 tool calls (Bash 33, Read 31, Edit 17, Write 10) and shipped a new `/api/cron-output` route, `CronOutputPanel.tsx`, `NowStrip.tsx`, and `ActiveWork.tsx`.

During that implementation work, the agent found a security issue in the cron output directory. Files at `~/.hermes/cron/output/<jobId>/<timestamp>.md` included a `## Prompt` section containing the full prompt text verbatim. If those files were surfaced in the dashboard UI without filtering, API keys or internal strategy context could be exposed to anyone viewing the dashboard. A prompt redaction layer was added to `allowlists.ts` before the session committed.

The pattern worth noting: multi-agent AI automation surfaces unexpected data exposure issues that a single-pass implementation would miss. The agent was exploring file paths to understand the data shape — and stumbled onto the leak in the process.

## V3: The 2-Hour 20-Minute Session

Session 14 was the largest in the build. 122 tool calls over 2 hours and 20 minutes. Bash 39, Edit 29, Read 28, Write 22.

```
Read /Users/jidong/.hermes/tmp/hermes-dashboard-v3-brief.md and execute it fully.
Prioritize design quality and human-readable work-progress IA.
Work until verified, committed, and 7878 is restarted if safe.
```

New files created in V3:

```
src/
├── components/
│   ├── MissionControl.tsx      # full layout restructure
│   ├── WorkBoard.tsx           # in-progress work cards
│   ├── AgentProgressPanel.tsx  # Claude/Codex agent status
│   ├── CronIssueCards.tsx      # cron issue card view
│   └── Collapsible.tsx
└── lib/
    ├── workStages.ts           # status → human-readable mapping
    ├── issueTranslator.ts
    ├── workflows.ts
    └── controlRoomTypes.ts
```

The design language from the existing "mission-operations room" — phosphor annunciator lamp indicators, cool-slate surfaces, semantic glow for status — was preserved. The work was structural: a new information architecture layered on top of what session 4's analysis had correctly identified as non-slop. This was surgical expansion, not a full rewrite.

Midway through, a `[Request interrupted by user]` broke the session. After Codex cross-verification finished, a follow-up prompt continued the work:

```
Codex cross-verification is done and codex-report.md exists. Continue: inspect
the Codex report for any blocking issues. If only minor/non-blocking, do not
over-polish; run final typecheck/build/diff-check, commit, restart the 7878 dashboard.
```

The "do not over-polish" instruction is doing real work here. If Codex reports only minor issues, commit anyway. This is an explicit instruction to break the perfectionism loop — a failure mode where an AI agent keeps refining when the work is already good enough to ship.

## Tool Call Distribution Across All 19 Sessions

| Tool  | Count | Share |
|-------|-------|-------|
| Read  | 209   | 44%   |
| Bash  | 153   | 32%   |
| Edit  | 46    | 10%   |
| Write | 34    | 7%    |
| Agent | 17    | 4%    |
| Other | 14    | 3%    |

Read at 44% is the headline number. Opus's default pattern before touching any file is to read the codebase thoroughly. Session 4's conclusion — "this is not slop, surgical improvement only" — prevented a full rewrite that would have introduced regressions and broken the existing design language. That read-heavy exploration cost time up front, but saved more time downstream.

The 17 Agent calls represent Codex cross-verification passes and `frontend-implementer` delegation. The primary agent did not write everything itself. Verification was delegated externally — which is how the `CronOutputPanel.tsx` label bug and the prompt-exposure security issue both surfaced.

## What the Brief File Pattern Actually Changes

The root inefficiency in this build: the orchestrator re-explored the same codebase across multiple sessions and kept scheduling implementation for "the next session." Sessions 1 through 11 produced zero code changes. Hermes was cycling through explore → plan → "implement next time" without ever crossing into write mode.

Switching to brief files in sessions 13 and 14 broke that loop. When a spec is written to `hermes-dashboard-v2-brief.md` before the session opens, context reconstruction costs one file read. The agent skips re-exploration and goes directly to implementation.

> An open-ended goal like "upgrade into a more visual mission-control style dashboard" creates an exploration loop. A brief file collapses the context reconstruction cost into a single `Read` call.

19 sessions were not necessary. Starting with a brief file from session one would have landed this in 5 sessions or fewer. The overhead was not the Claude Code model — it was the orchestration structure that kept deferring execution.

The practical takeaway for anyone building with Claude Code in a multi-agent setup: the gap between a good plan and shipped code is often not capability — it's the mechanism that converts planning state into write permission. Make that mechanism explicit, and make it cheap.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
