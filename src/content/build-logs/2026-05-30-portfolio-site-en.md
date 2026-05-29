---
title: "17 Sessions, 440 Tool Calls: Rebuilding the Hermes Dashboard into a Real Mission Control"
project: "portfolio-site"
date: 2026-05-30
lang: en
pair: "2026-05-30-portfolio-site-ko"
tags: [claude-code, multi-agent, dashboard, next-js, mission-control, ui]
description: "I sent the same prompt 7 times. After 17 sessions and 440 tool calls, the Hermes dashboard finally became a real mission control. Here's what went wrong and why brief files fixed it."
---

I opened 17 sessions. Only 5 of them touched a single file.

That's the number that surprised me when I looked back at this work. Twelve sessions burned on exploration, retries, or one-word status responses like `CLEAN_OK`. Roughly 70% of the orchestration budget went to overhead before a line of code changed. This is what running Claude under the Hermes orchestrator looks like when you give it an underspecified goal — and it's a pattern worth understanding before you scale it up.

**TL;DR:** Rebuilt the Hermes local dashboard at `http://127.0.0.1:7878` into a proper mission control UI focused on work visibility. Korean labels for cron job identifiers, a cron output panel, prompt redaction for security, and a full V3 redesign. 46 files changed across 440 tool calls. The root cause of the waste: open-ended prompts. The fix: spec files written upfront.

## Why I Sent the Same Prompt Seven Times

Sessions 1, 3, 4, 5, 7, and 9 all carried nearly identical goals:

```
Goal: Upgrade the existing Hermes local GUI dashboard into a more visual
mission-control style dashboard for tracking ongoing Hermes/Claude/Codex/Cron work.
```

The loop works like this: the Hermes orchestrator opens a session, Claude spends it exploring the codebase, hits context limits before writing anything, and the orchestrator decides "that session was just planning — retry." Rinse, repeat.

Session 6 was the low point. A `<synthetic>` model returned: `Not logged in · Please run /login`. Sessions 8, 10, and 11 were health-check one-liners: `CLEAN_OK`, `CLAUDE_LEAN_OK`, `CLAUDE_FINAL_LEAN_OK`. The orchestrator was essentially pinging itself.

Actual implementation didn't start until session 12.

This isn't a bug in the Hermes orchestrator or in Claude Code. It's a consequence of giving an AI automation system an open-ended goal without a pre-written spec. The multi-agent system faithfully does the work it has context for — exploration, planning, handoff notes — and defers implementation to "the next session." With no brief file anchoring it, that deferral compounds.

## Session 12: Korean Labels Everywhere (49 Minutes, 59 Tool Calls)

The first real session had a concrete, user-reported complaint driving it:

```
Goal: Improve the local Hermes dashboard at http://127.0.0.1:7878 so cron jobs,
skills, sessions, and internal identifiers are explained in clear Korean.
The user specifically complained that entries like `medical-dental-ads-daily-goal`,
`telegram-tech-report-html`, `daily-codex-cli-update` appear as raw text.
```

Raw job IDs showing up as primary labels is the kind of thing you stop noticing after a while — until someone who didn't build the system sits down with it. The fix is straightforward: a lookup function that maps IDs to human-readable strings. The interesting part is how the work was distributed.

Codex cross-verification caught two blockers before anything shipped. The key one:

> `CronOutputPanel.tsx` line 161: `{j.name || j.id}` renders raw text as the primary label. Import `describeCronJob` and use the Korean label as first priority.

The `describeCronJob` helper maps 7 cron job IDs to Korean descriptions. The main Claude Code session read 22 files and made zero edits — all implementation was delegated to a `frontend-implementer` sub-agent. The only file the main session directly modified was `plan.md`.

That division of labor — orchestrator holds the spec and integration contract, implementer sub-agent does the file work — is cleaner than having a single agent context try to do both. The cost is coordination overhead. When it works, you get parallel progress. When the spec is underspecified, you get the loop from sessions 1–11.

## Session 13: V2 Upgrade, and a Security Issue Nobody Expected (36 Minutes, 93 Tool Calls)

This is where the brief file approach appeared for the first time:

```
Read /Users/jidong/.hermes/tmp/hermes-dashboard-v2-brief.md and execute it fully.
Use Opus 4.8 xhigh. Do not modify Hermes Agent source.
Work until verified and committed, or report any blocker.
```

One sentence is the entire change in behavior: instead of an open goal, the session opens a spec file and executes it. The exploration loop disappears. Context budget goes to implementation.

While exploring the cron output directory, the session found something unexpected. Files at `~/.hermes/cron/output/<jobId>/<timestamp>.md` included a `## Prompt` section with the complete job prompt inline. Any cron output surfaced in the dashboard UI would expose full prompt text — which can contain API keys, internal strategy notes, or credentials passed as context.

The fix was a redaction layer in `allowlists.ts` that strips `## Prompt` sections before cron output reaches the API response. It's the kind of security issue that only surfaces when you actually read the files your system produces, which is exactly what a 43% Read-heavy session does.

This session produced `CronOutputPanel.tsx`, `NowStrip.tsx`, `ActiveWork.tsx`, and a new `/api/cron-output` route. Tool call breakdown: Bash 33, Read 31, Edit 17, Write 10.

## Session 14: The V3 Full Redesign That Took Two Hours and Twenty Minutes (122 Tool Calls)

The longest session of the entire build. `claude-opus-4-8` at xhigh effort, 2 hours 20 minutes.

```
Read /Users/jidong/.hermes/tmp/hermes-dashboard-v3-brief.md and execute it fully.
Use Opus 4.8 xhigh. Prioritize design quality and human-readable work-progress IA.
Work until verified, committed, and 7878 is restarted if safe.
```

There was a `[Request interrupted by user]` partway through. After Codex cross-verification finished, a follow-up prompt handed the session back:

```
Codex cross-verification is done and codex-report.md exists. Continue: inspect
the Codex report for any blocking issues. If only minor/non-blocking, do not
over-polish; run final typecheck/build/diff-check, commit with message
'feat: redesign Hermes dashboard work control room', restart the 7878 dashboard safely.
```

The instruction "do not over-polish" is doing real work there. Without it, an xhigh Opus session will iterate on details after the blocking issues are resolved. Telling it explicitly to stop at a verified build prevents scope creep inside a single session.

New files created in V3:

```
src/
├── components/
│   ├── MissionControl.tsx     # full layout restructure
│   ├── WorkBoard.tsx          # in-progress work cards
│   ├── AgentProgressPanel.tsx # Claude/Codex agent status
│   ├── CronIssueCards.tsx     # cron issue card view
│   └── Collapsible.tsx
└── lib/
    ├── workStages.ts          # status → display label mapping
    ├── issueTranslator.ts
    ├── workflows.ts
    └── controlRoomTypes.ts
```

The design constraint was to preserve the existing "mission-operations room" visual language — phosphor annunciator lamps, cool-slate surfaces, semantic glow — while restructuring the information architecture. This was surgical expansion, not a full rewrite. The existing design system stayed intact; what changed was how work state was represented and surfaced.

Tool call breakdown: Bash 39, Edit 29, Read 28, Write 22.

## Session 15: The Fourth Pass, Now with Parallel Agents (44 Minutes, 71 Tool Calls)

After V3, one gap remained: "what's currently in progress" wasn't visually obvious at a glance. The AI news section was also evaluated and removed — it didn't belong in a work-tracking tool.

This session was the first to use the `Workflow` tool explicitly:

```
Build diagrammatic mission-control wall:
contract → parallel components → integrate → typecheck
```

Six sub-agents dispatched in parallel, each responsible for a different component. The main session handled contract definition and final integration only. Read 36, Bash 27.

The parallel dispatch pattern only works cleanly when the contracts are tight. If component A's output type is ambiguous, component B's integration step will produce a type error that surfaces only at the integrate phase — costing the same time you saved on parallel execution. The brief file for V3 was precise enough that this didn't happen here, but it's the failure mode to watch for when scaling multi-agent AI automation.

## Where the 440 Tool Calls Actually Went

| Tool  | Count | Share |
|-------|-------|-------|
| Read  | 191   | 43%   |
| Bash  | 141   | 32%   |
| Edit  | 46    | 10%   |
| Write | 34    | 8%    |
| Agent | 17    | 4%    |
| Other | 11    | 3%    |

Read at 43% is the number that stands out. Before writing a new component, Opus reads ten or more related files — types, existing components, utility functions, config. This isn't inefficiency; it's how the model avoids building against the wrong interface. The cost is time. The benefit is that when the component ships, it actually integrates.

The 32% Bash is mostly `tsc`, `npm run build`, and `git diff` — verification steps between edits. The pattern is: read context, write code, verify, read error output, fix, verify again. The Edit-to-Read ratio of roughly 1:4 reflects how much context Opus needs to make a confident change.

## The Brief File Pattern vs. Open-Ended Prompts

This is the actual lesson from 17 sessions.

Sessions 1 through 11: zero files modified. Hermes ran explore → plan → "implement in the next session" on a loop. The open-ended goal "upgrade into a more visual mission-control style dashboard" is genuinely ambiguous. What does "more visual" mean? What should change first? The orchestrator doesn't hallucinate an answer; it defers. Reasonable behavior, wrong outcome.

Sessions 13 and 14 used brief files. The prompt is three sentences: read this file, use this model, work until committed. The spec lives in `hermes-dashboard-v2-brief.md` and `hermes-dashboard-v3-brief.md`. When the session opens, context reconstruction costs one file read instead of a full codebase exploration pass.

> Open goals create exploration loops. The orchestration cost doubles. Brief files collapse that cost to a single read.

The math is blunt: 17 sessions were not necessary. Starting from brief files, this build should have taken 5 sessions. The 12-session overhead was pure prompt design tax.

For anyone running Claude Code under a Hermes orchestrator or similar multi-agent setup: write the spec file before you dispatch the session. Be specific about what changes, what the acceptance criteria are, and what should not be touched. The model can execute a tight brief precisely. It cannot reliably scope an open goal on its own.

## What Shipped

The `http://127.0.0.1:7878` local dashboard now has:

- 7 cron jobs displayed with human-readable labels instead of raw IDs
- Cron output files served safely with `## Prompt` sections redacted before reaching the UI
- Live status cards for active Claude/Codex sessions
- Phosphor annunciator lamp design system preserved
- Passed typecheck + build, committed, and the dashboard restarted cleanly

29 files created, 17 files modified.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
