---
title: "9 Minutes, 26 Tool Calls: Automating a Daily Research KB with Claude Code"
project: "portfolio-site"
date: 2026-05-24
lang: en
pair: "2026-05-24-portfolio-site-ko"
tags: [claude-code, automation, research, dental-ad, knowledge-base]
description: "claude-opus-4-7 ran SERP analysis, KB updates, and HTML reports in a single 9-minute session — 26 tool calls, 84% reads, 4 artifacts."
---

9 minutes. 26 tool calls. 4 files. That's the complete cost of updating a medical and dental advertising research knowledge base today.

**TL;DR**: I deployed `claude-opus-4-7` as a research agent to handle SERP analysis, incremental KB updates, and HTML report generation in a single session. The key insight: pass file paths explicitly in the prompt and the agent self-optimizes context consumption — `grep` for large JSON, `tail` for append-checks, full `Read` for small markdown files. No orchestration infrastructure required.

## The Problem: Manual Research Gets Skipped

The `dentalad` project accumulates daily SERP snapshots and competitor ad data for Korean medical and dental advertising. The goal is a rolling knowledge base that captures patterns, keyword shifts, and competitor moves over time — files like `rolling-knowledge-base.md` and `naver-ranking-hypotheses.md`.

Manual processing looks like this:

1. Open `sources/serp-YYYY-MM-DD/summary.json`, skim 800+ lines
2. Identify keyword position changes, new ad entries, bid estimate shifts
3. Compare against yesterday's update document
4. Append entries to `rolling-knowledge-base.md` in the right sections
5. Update `source-index.md`
6. Write an HTML summary report

Conservative time: 60–90 minutes. Realistic outcome on a busy day: skipped entirely.

When the KB goes 2–3 days without updates, synchronization degrades. `rolling-knowledge-base.md` starts referencing keywords that no longer rank. `competitive-serp-observations.md` misses new market entrants. The compounding effect is that catching up takes twice as long as staying current would have.

A daily research workflow either fits under 15 minutes or it doesn't run daily. There's no middle ground.

## Define the Agent Role Before Touching Any File

The session prompt followed one specific structure: role → scope → raw data paths → existing document paths.

```
Goal: Medical and dental advertising research agent
Scope: ~/dentalad/research/daily-medical-dental-ads/
Raw data: sources/serp-2026-05-24/summary.json
Existing docs:
  - 2026-05-23-daily-update.md
  - rolling-knowledge-base.md
  - source-index.md
  - competitive-serp-observations.md
```

The ordering matters. "Role" first establishes the decision-making context. "Scope" defines the working directory so no file traversal is needed. "Raw data paths" and "existing doc paths" are the critical input: hand these over explicitly, and the agent goes straight to the files.

Without explicit paths, an agent typically burns 3–6 tool calls on directory traversal and glob searches to locate the same files. In a session with 26 total tool calls, that's 12–23% of the budget spent on orientation rather than actual analysis.

This is the Socratic Intake pattern applied to agent prompts: state role, scope, and all inputs upfront, so the agent's first action is substantive work — not asking where things are or what it's supposed to do.

## 84% of Tool Calls Were Reads — That's the Right Ratio

The full 26 tool call breakdown:

| Tool | Count | % |
|------|-------|---|
| Bash | 12 | 46% |
| Read | 10 | 38% |
| Write | 2 | 8% |
| Edit | 2 | 8% |

84% exploration, 16% production. This ratio is what emerges from a well-specified task. Understanding the source material before writing prevents the agent from producing content that contradicts the raw data — or filling gaps with plausible-sounding inference.

The most interesting decision point was `summary.json`. The file is large enough that a full `Read` would consume a significant chunk of the context window. Claude chose `grep` instead:

```bash
grep -n "keyword\|position\|title\|url" sources/serp-2026-05-24/summary.json | head -50
```

Precise extraction of exactly the fields needed for SERP analysis: keyword rankings, page positions, titles, and URLs. The agent assessed the file, recognized the context risk, and chose the surgical path — without any instruction to do so.

The remaining Bash calls split into two patterns:
- `ls` to verify directory structure before attempting reads — confirms files exist before spending a `Read` call on them
- `tail -n 50` on `rolling-knowledge-base.md` — checks the most recent section before appending to avoid duplicates or format breaks

Smaller markdown documents got full `Read`. The heuristic that emerged: large structured data files get Bash extraction, small documents get full reads. Applied consistently across a session, this keeps context consumption predictable.

## No State Helper? The Session Kept Moving

One line appeared in the session log:

```
No state helper found — proceeding to artifact generation.
```

The workflow state management script (`lib/state.sh`) wasn't at the expected path. In a state-machine-dependent workflow, this is a blocking error — the session stops and waits for a missing dependency.

In a file-based workflow, it's a one-line note and a continue.

`lib/state.sh` manages `state.json`, which tracks stage transitions across a workflow. The agent already had its goal from the prompt and knew exactly which files to produce. State tracking would have been useful for orchestration logging, but wasn't required for execution.

File-based workflows are more resilient because outputs are defined by the task, not by a state transition graph. If a helper script is missing, the agent produces the target files and moves on. A future orchestrator can reconcile the state log afterwards.

The tradeoff: without state tracking, visibility into long-running sessions degrades. For sessions under 15 minutes with a single clear goal, that's acceptable. For multi-hour sessions with inter-step dependencies, state tracking becomes important.

## 2 Writes + 2 Edits = 4 Artifacts

| File | Action | Content |
|------|--------|---------|
| `2026-05-24-daily-update.md` | Write | SERP analysis, competitor ad patterns, keyword trends |
| `reports/2026-05-24-cost-keyword-serp-split.html` | Write | Mobile HTML report: cost vs keyword vs SERP position splits |
| `rolling-knowledge-base.md` | Edit | Append 5/24 section |
| `source-index.md` | Edit | Add today's source entry |

The Write/Edit split is deliberate. New files get Write. Cumulative files get append-only Edit.

`rolling-knowledge-base.md` accumulates patterns across weeks of SERP data. Rewriting it to add today's entry risks corrupting previously captured insights. The correct operation is a targeted append to the right section. Edit handles this; Write with full file content would overwrite. As files grow, Edit consistently beats Write for incremental updates.

The same logic applies to `source-index.md`. It's a growing index of every data source ever processed. Today's entry goes at the bottom, and that's all that should change.

The HTML report came out in a single Write call: cumulative KB and today's SERP data synthesized into a mobile-readable format with cost analysis by keyword cluster, position distribution, and ad composition by type. Building this manually from the same source data takes 20–25 minutes. It's the task that gets cut when you're short on time — and the first data you miss when trying to spot a trend three weeks later.

## Why 9 Minutes Is the Number That Actually Matters

Speed is the obvious benefit. A 7–10x improvement is real and measurable. But repeatability is the argument that actually matters.

A 90-minute task competes with everything else on the calendar. On a day with back-to-back meetings, it gets skipped. Skip two consecutive days and the KB is stale. Stale KB means the next analysis is missing context from the gap. Data quality degrades faster than the gap duration implies, because gaps tend to happen on the busiest days — exactly when market conditions are most active.

A 9-minute task doesn't compete. It runs between context switches. On the worst calendar day of the month, it still fits.

> The real value of automation isn't speed — it's accumulation without gaps.

Gap-free daily data is qualitatively different from data with frequent gaps. SERP data gaps mean missed competitor moves, keyword shifts that appear discontinuous, and bid estimate changes that look like sudden jumps rather than gradual trends. The 9-minute workflow produces data that's actually useful for trend analysis over weeks.

## What This Pattern Requires

Two inputs make this work consistently:

**1. A Socratic Intake prompt**
Role, scope, raw data paths, existing document paths — in that order. Complete enough that the agent's first action is reading a file, not asking a clarifying question.

**2. Explicit file paths**
Don't describe where files might be. State exactly where they are. This eliminates traversal calls and keeps the tool call budget focused on substantive work.

What this doesn't require: state management infrastructure, multi-agent coordination, or complex orchestration pipelines. This session was a single agent, a single prompt, and 9 minutes.

Where it breaks down: tasks where source data structure changes significantly between runs, or where KB updates require reasoning across multiple previous sessions simultaneously. Those cases benefit from more structured multi-step approaches with explicit state tracking.

For daily SERP research with a stable file structure, a single well-prompted agent is sufficient.

My only remaining job each morning: drop the SERP snapshot into `sources/`.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
