---
title: "9 Sessions, 259 Tool Calls: Iterating a Dashboard from V1 to V3 in One Day with Claude Code"
project: "portfolio-site"
date: 2026-05-29
lang: en
pair: "2026-05-29-portfolio-site-ko"
tags: [claude-code, hermes, dashboard, automation, workflow, subagent]
description: "9 Claude Code sessions, 259 tool calls in a single day. How an orchestrator gate, a security bug, and 10 subagent calls drove a Hermes dashboard from V1 to V3."
---

Nine Claude Code sessions in one day. 259 tool calls. The longest session ran 49 minutes; the shortest clocked zero. One session never touched a file — just Read calls, back to back. Another fired 93 tool calls solo.

**TL;DR** — The main work was an MVP operations dashboard for Hermes, my Telegram-based AI relay. The orchestrator hook repeatedly blocked the main agent from writing files, which forced delegation to subagents. That friction turned out to be a feature: V1, V2, and V3 all shipped inside a single day.

## The Morning: Three Sessions, No Code

The first three sessions didn't touch the codebase.

**Session 1 (8 tool calls, 0 min)** was content candidate collection for the SpoonAI news site — 6 Read calls, 2 Bash calls, zero writes. Its job was aggregation and handoff, not production.

**Session 2 (22 tool calls, 3 min)** handled a daily dental-ad research update: accumulating new Naver TalkTalk ad-extension announcements into a rolling file. `summary.json` had grown large enough that it needed to be read in chunks. Four Grep calls to check for duplicates first, then one Write to close it out.

**Session 3 (14 tool calls, 4 min)** produced the first orchestrator gate collision. Building a P1 product daily report, the workflow classified the task as `major` and blocked forward progress.

```
Orchestrator gate triggered.
This is a report generation task, not a code change —
reclassifying from major → standard.
```

Claude reclassified itself and continued. Output: `~/product-agent-management/reports/p1_product_daily_report_2026-05-29.html`.

## Why the Dashboard Existed at All

My daily setup has Hermes (Telegram relay), Claude CLI, Codex CLI, and GitHub Actions cron jobs running in parallel. Figuring out what any agent was actually doing — or whether the last cron run succeeded — required manually tailing log files across multiple directories.

The brief was minimal: read-only local dashboard, `localhost:7878`, no modifications to Hermes Agent source.

## Session 4: Blocked Before the First Write

Session 4 (15 tool calls, 2 min) finished environment exploration and then tried to write a plan file to `current/plan.md`. The gate intercepted it — `stage` wasn't set to `implementing` yet.

The fix was straightforward: delegate to a `plan-orchestrator` subagent instead of writing directly.

```
~/.claude/workflows/Users-jidong-hermes-dashboard-4fc2267a47/current/plan.md
```

This became the session's defining pattern. The main agent handles planning and verification; writes go through subagents. Every subsequent session followed the same split.

## Session 5: V1 Ships in 49 Minutes and 66 Tool Calls

The longest session of the day. After reading the brief and confirming the environment, the entire implementation was delegated to a single `general-purpose` subagent:

```
Read /Users/jidong/.hermes/tmp/hermes-dashboard-brief.md and implement it now.
Work until the local dashboard MVP is usable and verified.
```

One prompt. The subagent read the plan, wrote the code, ran `npm install`, built the project, and generated a diff. Faster than the main agent doing it directly.

Tool breakdown: Bash ×36, Agent ×7, TaskCreate ×10, TaskUpdate ×7.

Post-V1, Codex cross-verification surfaced four must-fix items. Two remained unresolved — a missing protocol allowlist for RSS links and an EOF blank line in the log route — so a fix agent ran one more pass.

## Session 8: V2, 93 Tool Calls, and a Security Bug Nobody Asked For

This session started from `hermes-dashboard-v2-brief.md`. The main objective was accurate mapping of the cron output directory structure.

During exploration, a significant security issue surfaced:

```
Critical security finding: those .md files echo the full prompt in a ## Prompt section
```

Files at `~/.hermes/cron/output/<jobId>/<timestamp>.md` contained the complete executed prompt, including system prompt content. Exposing these through an API endpoint would leak internal instructions to anyone with network access.

Two fixes landed:
- `src/lib/allowlists.ts` — protocol allowlist for external links
- `src/app/api/cron-output/route.ts` — prompt section redaction before API response

New components shipped in this session:
- `src/components/ActiveWork.tsx`
- `src/components/CronOutputPanel.tsx`
- `src/components/NowStrip.tsx`

Tool breakdown: Bash ×33, Read ×31, Edit ×17, Write ×10.

## Session 9: Explore First, Build Later

The final session targeted V3 design improvements. The `interface-design` skill loaded at start.

Of 33 tool calls, 20 were Read and 11 were Bash. More exploration than implementation. Most of the session went toward understanding what new data sources — tmux session state, workflow `state.json`, git status — actually looked like on disk before writing any model code. The session ended with a plan file, not shipped code.

The pattern: model the data correctly before touching the UI.

## Full Numbers

| Tool | Count |
|------|-------|
| Bash | 111 |
| Read | 81 |
| Edit | 17 |
| Write | 16 |
| Agent (subagent) | 10 |
| TaskCreate | 10 |
| TaskUpdate | 7 |
| Grep | 4 |
| **Total** | **259** |

9 sessions, ~95 minutes total. 12 files created, 6 modified.

## What the Orchestrator Gate Actually Did to the Architecture

The most interesting thing about this day wasn't the dashboard — it was how the orchestrator hook reshaped the workflow structure.

When `stage` doesn't match, the main agent's file writes are blocked. Early on this felt like friction. By the end of the day the role split was clean: main agent owns planning, judgment, and verification; subagents own writes. Ten Agent calls in one day is the footprint of that structure.

Without the delegation pattern, the main agent would have tried to handle everything directly and blown its context window. Instead, each subagent started fresh with a narrow scope.

> When the gate blocks you, don't route around it. Delegate. That's the architecture working as intended.

The subagent-first pattern also made the security find possible: the main agent stayed in a planning/review posture during the V2 session, which gave it the bandwidth to notice the prompt-leakage issue rather than just shipping the feature.

Multi-agent Claude Code setups build this kind of separation in by default. The orchestrator hook just made it hard to ignore.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
