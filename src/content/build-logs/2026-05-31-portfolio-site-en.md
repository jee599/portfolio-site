---
title: "179 Raw Crawls, 31 Tool Calls, 4 Minutes — Claude Code Content Intelligence Crons"
project: "portfolio-site"
date: 2026-05-31
lang: en
pair: "2026-05-31-portfolio-site-ko"
tags: [claude-code, automation, content-intelligence, opus]
description: "Two Claude Code sessions, 31 tool calls, 4 minutes: filtering 179 raw crawls into structured content candidates and updating a rolling medical ad research KB."
---

179 raw crawl entries. Two separate pipelines. 31 tool calls total. Everything wrapped up in under 4 minutes.

Today's Claude Code sessions weren't about building features — they were about proving that repeatable AI automation at this scale is genuinely boring to operate. That's the goal.

**TL;DR** Two Opus 4.8 sessions completed a content intelligence cron (SpoonAI) and a medical advertising research pipeline. 5 files created or updated, 31 total tool calls, under 4 minutes end-to-end.

## Filtering 179 Crawls Without Writing a Schema Doc

The first session handled SpoonAI's content intelligence pipeline. The new site carries two content tracks: general-audience card-news posts (8–15 per day) and expert-grade AI intelligence briefs (10–20). Raw material: `2026-05-31-daily-intel-raw.json` — 179 entries from the daily crawler.

The prompt structure was deliberately lean:

```
Goal: From today's raw crawl, select and structure content candidates
      for SpoonAI's new site — both general-audience and expert tracks.
Scope: Read 2026-05-31-daily-intel-raw.json.
       Write only 2026-05-31-daily-intel.md and .json.
Excluded: No publishing. No emails.
```

The "no publishing, no emails" clause is non-negotiable. LLMs are optimistic about scope — given half a reason, they'll infer "and probably push this to production too." Explicit exclusions kill that before it starts.

What Claude actually did first: before reading today's raw data, it opened yesterday's output. It reverse-engineered the schema — `general_angle`, `expert_notes`, `numbers`, `secondary_sources` — directly from a real artifact rather than from a spec anyone wrote. That's the pattern worth internalizing: **"write it like yesterday's file" beats a three-page schema document**. The format stabilizes itself through examples, and it gets more reliable as the dataset accumulates.

Session 1 total: 3 Reads, 6 Bash calls, 9 tool calls. A human doing the same quality pass on 179 items — reading, scoring, categorizing, structuring — would take half a day.

## Why the Medical Ad Pipeline Read 12 Times Before Writing Once

Session 2 was the daily medical and dental advertising research pipeline. Inputs: `serp-2026-05-31/summary.json` plus that day's collected HTML. Outputs: new `2026-05-31-daily-update.md` and updates to 4 accumulating files.

Out of 22 total tool calls, 12 were Reads. Against 3 Edits and 1 Write, that's a 4:1 read-to-write ratio. The sequence explains why it's correct:

1. Map directory structure (Bash)
2. Read yesterday's `2026-05-30-daily-update.md` to confirm format (Read)
3. Read today's `summary.json` source data (Read)
4. Read artifact prompt guidelines (Read)
5. Read 4 accumulating files sequentially — `rolling-knowledge-base.md` is large enough to need a separate tail read (Read ×5)
6. Confirm HTML report style from `2026-05-30` output (Read)

This looks wasteful. It isn't.

`rolling-knowledge-base.md` grows by one day's worth of entries every 24 hours. Append without understanding the existing structure and format drift starts immediately. Catch that drift on day 3: quick fix. Catch it on day 30 with 30 non-conforming entries: the remediation cost dwarfs every second saved by skipping the upfront reads.

> For accumulating files, a 4:1 read-to-write ratio isn't overhead — it's quality control.

Outputs: `2026-05-31-daily-update.md` created, `rolling-knowledge-base.md` and `source-index.md` updated. Done in 4 minutes.

## The Architecture That Makes Crons Self-Describing

Both sessions share the same structural property: they're not one-off scripts — they're crons that run again tomorrow.

The SpoonAI intelligence cron follows `raw crawl → selection → .md/.json output` daily. The medical ad research follows `SERP data → daily update → rolling KB append`. In both cases, Claude uses yesterday's output as implicit context for today's run. Nobody re-explains the format each day.

This shifts what matters in prompt design. The key instruction isn't "what to build" — it's "where to look." A single directive like "match the structure of yesterday's output file" does more structural work than pages of schema documentation. The pipeline gets more reliable over time, not less: as the archive grows, the model has more patterns to reference.

The failure mode is the opposite: prompts that define everything inline, from scratch, every run. High-maintenance, and doesn't compound with history.

## Today's Numbers

| | Session 1 (SpoonAI) | Session 2 (Medical Ads) |
|---|---|---|
| Model | claude-opus-4-8 | claude-opus-4-8 |
| Duration | ~0 min | 4 min |
| Tool calls | 9 | 22 |
| Read | 3 | 12 |
| Bash | 6 | 6 |
| Edit | 0 | 3 |
| Write | 0 | 1 |
| Files created/modified | 2 | 3 |

31 total tool calls, 5 files. The 12 Reads in session 2 account for most of the cost — and most of the quality. A human doing both tasks at equivalent fidelity would budget 3–4 hours. Actual wall-clock: 4 minutes.

The interesting thing isn't the speed. It's that the pipelines compound: every daily run adds context for the next one, without anyone maintaining that context manually.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
