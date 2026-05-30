---
title: "19 Sessions, 473 Tool Calls: How I Finally Got Claude Code to Stop Planning and Start Coding"
project: "portfolio-site"
date: 2026-05-31
lang: en
pair: "2026-05-31-portfolio-site-ko"
tags: [claude-code, hermes, dashboard, next-js, orchestration, prompting]
description: "8 of 19 Claude Code sessions produced zero code. Here's the prompt pattern that broke the loop and shipped Hermes Dashboard V3."
---

8 out of 19 sessions. That's how many Claude Code sessions I ran that produced exactly zero lines of code. 473 total tool calls, and for the first half of the project, most of them were `Read`.

**TL;DR** — Upgrading the Hermes local dashboard to a Next.js mission-control UI exposed a systematic failure mode in Claude Code: the orchestrator's skill-loading structure was forcing a plan → propose → wait-for-approval loop every single session. The fix wasn't a better prompt — it was a brief file that front-loaded all context and bypassed the planning phase entirely. I also caught a security issue along the way where cron output files were leaking full prompts to the web UI.

## The First 8 Sessions: Brilliant Analysis, Zero Output

The request was simple: upgrade the Hermes dashboard to a mission-control style UI. I sent it nine times across nine sessions.

Every session followed the same arc: explore codebase → analyze current state → propose design → end. No implementation.

Session 1: 16 `Read` calls, 4 `Bash` calls. No output. Session 3: Same pattern, 21 tool calls. No output. Session 7: I added "do not plan, implement immediately" directly to the prompt. Still just exploration.

The problem wasn't the prompt text — it was the orchestrator structure underneath. Hermes was loading skills (`interface-design`, `brainstorming`) at session start, which systematically wired in a planning phase. The flow was architecturally "understand → propose → get approval," and no amount of "just do it" instruction could override that at the prompt level.

## The Pattern That Actually Broke the Loop

Session 12 was where I changed the approach. First, I replaced the intent-level prompt with an explicit implementation framing:

```
You are Claude Code implementing an approved UI upgrade. IMPORTANT: Do not enter plan mode,
do not invoke superpowers/skills, do not present another proposal. Directly edit files in
this repo, then run verification.
```

That helped, but exploration was still eating too many tool calls. The real unlock was a brief file:

```
Read /Users/jidong/.hermes/tmp/hermes-dashboard-v2-brief.md and execute it fully.
Use Opus 4.8 xhigh. Work until verified and committed, or report any blocker.
```

The brief contained the exact file list to change, data structures, and implementation order — everything Claude would have spent 40+ `Read` calls rediscovering on its own. With that context pre-loaded, Claude skipped straight to `Edit` and `Write`.

Session 12: 59 tool calls, core label system shipped. Session 13: 93 tool calls, V2 complete. The first real code appeared in these two sessions after nine sessions of nothing.

> When repeated sessions fail the same way, suspect the orchestrator structure, not the prompt wording.

## The Security Issue Hidden in Cron Output Files

Session 13 surfaced something unrelated to UI — and more urgent.

While reviewing `~/.hermes/cron/output/<jobId>/<timestamp>.md`, I found this structure:

```markdown
## Prompt
<full prompt content — including API keys, internal paths, system metadata>

## Response
...
```

The cron output files were recording the full prompt used to generate each job run. The `/api/cron-output` endpoint was serving these files directly to the web UI, which meant anyone with access to the dashboard could read system internals, key names, and file paths from the prompt section.

The fix: added redaction logic to `src/lib/allowlists.ts` that strips the `## Prompt` section during the parse step, before the data ever reaches the API response. That file became the single entry point for output sanitization — intentionally, so there's one place to audit.

## V3: 35 Files, 122 Tool Calls, One 2h20m Session

Session 14 was the heaviest single session in this project: 122 tool calls over two hours and twenty minutes. The V3 brief was ambitious — five new components, three new API routes, and a full redesign of the lib layer.

Key files generated in this session:

- `src/components/WorkBoard.tsx` — active work items rendered as cards
- `src/components/AgentProgressPanel.tsx` — live Claude/Codex session progress
- `src/lib/workflows.ts` — workflow state parsing
- `src/lib/workStages.ts` — stage definitions for multi-step tasks
- `src/app/api/control-room/route.ts` — single aggregation endpoint for all dashboard data

I ran Codex cross-verification against this session's output. `codex-report.md` flagged two blocking issues: `CronOutputPanel.tsx` was still rendering raw `{j.name || j.id}` instead of using the `describeCronJob()` helper, and there was a type mismatch in the workflow state parser. Both were fixed in separate sessions — the kind of precise, targeted callout that makes cross-verification worth the overhead.

## Making Internal IDs Human-Readable

One of the original pain points was watching the UI render internal job identifiers directly: `medical-dental-ads-daily-goal`, `telegram-tech-report-html`, `daily-codex-cli-update`. These are fine as system identifiers but useless as dashboard labels for a human operator.

The solution was a `describeCronJob()` helper that maps IDs to human-readable descriptions. Simple in concept, but it took two passes to get right — Codex caught that `CronOutputPanel.tsx` was still using raw names after the first implementation. That's the kind of "I thought I fixed this" bug that's easy to miss when you're 100+ tool calls into a session.

## The Brief File Pattern for Multi-Agent AI Automation

The practical takeaway from this project is a prompting pattern that generalizes beyond Claude Code:

When you're working with an AI orchestrator that loads skills or enters a planning phase automatically, a "no planning" instruction in the prompt is fighting the system design. It rarely wins.

What works instead: externalize the context. A brief file that contains the exact scope, file targets, data shapes, and implementation order acts as a pre-computed context window. The model reads it and has everything it needs to go directly to implementation. No discovery loop, no proposal round-trip.

For repeated `Read`-heavy sessions, this is also how you reduce tool call overhead. Every session has to rebuild context from scratch — a brief file compresses that into one read.

## Stats

| Metric | Value |
|--------|-------|
| Total sessions | 19 |
| Sessions with actual code | 4 (sessions 12, 13, 14, 15) |
| Total tool calls | 473 |
| Read | 209 (44%) |
| Bash | 153 (32%) |
| Edit | 46 (10%) |
| Write | 34 (7%) |
| Agent (subagents) | 17 |
| Files created | 29 |
| Files modified | 17 |

`Read` at 44% is the most honest metric here. It reflects how much context-rebuilding is happening across session boundaries. In a fresh session, Claude has no memory of the previous one — so it reads everything again. The brief file approach is a direct attack on that number.

The four implementation sessions (12–15) averaged 85 tool calls each and produced all 29 new files. The fifteen preceding sessions produced none. That ratio says something about where the actual cost of AI-assisted development sits — not in the generation, but in the setup and context management.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
