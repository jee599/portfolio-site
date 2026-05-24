---
title: "Claude Opus 4.7 as a Research Agent: 9 Minutes, 26 Tool Calls, 4 Output Files"
project: "portfolio-site"
date: 2026-05-24
lang: en
pair: "2026-05-24-portfolio-site-ko"
tags: [claude-code, automation, research, dental, claude-opus]
description: "Ran claude-opus-4-7 as a daily SERP research agent for medical/dental ads. One prompt, no intervention: it read source files, generated updates, appended to a rolling KB, and produced an HTML report in 9 minutes."
---

9 minutes. 26 tool calls. 4 files written or updated. One prompt, zero intervention.

That's what running `claude-opus-4-7` as a dedicated research agent looks like in practice — not a benchmark, just a real session processing Korean medical/dental advertising SERP data that would otherwise take 30–40 minutes by hand.

**TL;DR** — Automated the daily research update cycle for a dental advertising SERP knowledge base using Claude Opus 4.7. The agent read source JSON, generated today's daily update, appended new entries to a rolling knowledge base, and produced a mobile HTML report in one session. The key pattern: pass file paths explicitly in the prompt, and the model self-selects the most efficient read strategy — `grep` for large files, `Read` for small ones.

## The Problem: SERP Data Accumulates Faster Than You Can Process It

Under `dentalad/research/daily-medical-dental-ads/`, SERP snapshots and competitor ad data land every day. Processing them manually — reading the source, comparing with previous hypotheses, updating the rolling knowledge base, writing a summary — takes 30–40 minutes at minimum.

The deeper problem: `rolling-knowledge-base.md` and `naver-ranking-hypotheses.md` are both long-running documents. When updates fall behind by a day or two, they drift out of sync. And once they're out of sync, catching up takes even longer.

The fix was giving Opus 4.7 a clear role:

> "Read today's SERP summary file, update the existing documents, and produce a report."

## What a Socratic Intake Prompt Actually Looks Like

The prompt handed to the agent was structured around four explicit elements:

```
Goal: Daily research agent for medical/dental advertising strategy
Scope: ~/dentalad/research/daily-medical-dental-ads/
Source: sources/serp-2026-05-24/summary.json
Existing docs: 2026-05-23-daily-update.md, rolling-knowledge-base.md,
               source-index.md, competitive-serp-observations.md
```

Goal, scope, source file path, and existing document paths — all explicit. The critical piece is handing over `sources/serp-2026-05-24/summary.json` directly. Without a specific path, the agent spends tool calls exploring the directory structure to figure out what exists. With the path, it starts reading immediately.

This is the "Socratic Intake" pattern: state what you want, where the data lives, and what the output targets are. The model handles everything in between.

## Why Bash Outnumbered Read — the Agent's Self-Optimization

Tool usage for the session:

| Tool | Count |
|------|-------|
| Bash | 12 |
| Read | 10 |
| Write | 2 |
| Edit | 2 |
| **Total** | **26** |

The Bash-over-Read split is worth understanding. `summary.json` is large enough that reading it in one shot would blow the context window. Claude recognized this and chose `grep` to extract only the relevant SERP summary sections — without being asked to.

The three Bash use patterns across the session:

1. **Directory inventory** — `ls` to confirm file structure before touching anything
2. **Targeted JSON extraction** — `grep` to pull SERP summary keys from the large source file
3. **Rolling file position check** — `tail` to find the last entry in `rolling-knowledge-base.md` before appending

Only 2 Edit calls is also notable. Both `rolling-knowledge-base.md` and `source-index.md` are append-only structures — today's entries go at the bottom. The agent didn't rewrite existing content; it appended a new dated section. That's correct behavior for an accumulating knowledge base.

## When the State Helper Is Missing — and the Agent Keeps Going

There was a moment mid-session worth documenting:

```
state helper not found at expected path — proceeding with artifact generation
```

The workflow state management script (`lib/state.sh`) wasn't present in the expected location. The agent detected this, noted it, and moved forward without blocking. No error. No retry loop. Just: the state tracking mechanism is absent, so I'll skip it and continue to outputs.

This is a property of file-based workflows worth preserving. The absence of `state.json` doesn't stop the session. If the output files are written, the next step has what it needs. File existence is a simpler source of truth than a state machine.

## 9 Minutes Later: Four Files

```
Created:  2026-05-24-daily-update.md
          → SERP analysis, competitor ad patterns, keyword trends for today

Created:  reports/2026-05-24-cost-keyword-serp-split.html
          → Mobile HTML report: cost/keyword/SERP split analysis

Modified: rolling-knowledge-base.md
          → 5/24 entry appended

Modified: source-index.md
          → Today's source indexed
```

The HTML report was a single `Write` call. Claude synthesized the rolling KB content and today's SERP summary into a mobile-ready layout — the same report that previously took 20+ minutes to produce manually.

The daily update and HTML report are the two outputs with direct business value. The KB and index updates are infrastructure — they compound over time, keeping the research base accurate and searchable.

## The Core Pattern: File Paths Are Half the Prompt

The model doesn't need to be told "read these files" step by step. It needs to know where the files are.

When you put file paths in the prompt, Opus 4.7 works out the optimal read strategy on its own: `grep` for large files, `Read` for small ones, `tail` for finding the current position in an append-only document. The strategy depends on file size and read goal, and the model reasons about both without instruction.

The dental ad research workflow now runs on two elements:

1. **Socratic Intake prompt** — goal, scope, source path, existing doc paths
2. **SERP snapshot** — dropped into `sources/YYYY-MM-DD/` daily

My daily action is dropping the snapshot. The agent handles everything else in under 10 minutes.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
