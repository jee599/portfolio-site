---
title: "Claude Code Research Agent: 26 Tool Calls, 9 Minutes, One Complete Daily KB"
project: "portfolio-site"
date: 2026-05-25
lang: en
pair: "2026-05-25-portfolio-site-ko"
tags: [claude-code, automation, research, dental-ad]
description: "How I automated daily medical/dental ad competitive research with Claude Opus 4.7: grep-first JSON handling, append-only KB edits, 26 tool calls."
---

26 tool calls. 9 minutes. One complete daily knowledge base update, competitive SERP analysis, and a mobile-optimized HTML report — all from a single Claude Code session.

**TL;DR** Validated a pattern for automating daily medical/dental advertising competitive research using Claude Opus 4.7 as a research agent. The two techniques that matter: grep-first for large JSON files, and append-only edits for rolling documents.

## Why Repetitive Research is Perfect for Agents

Running dental ad campaigns means tracking competitor SERP positions and keyword cost trends every day. The old workflow: manually write `daily-update.md`, append entries to `rolling-knowledge-base.md`, manage a source index. Repetitive, structured, no creative judgment required — exactly what agents are built for.

The session kicked off with a single prompt:

> "As a medical/dental advertising research agent, incorporate May 24 official sources and public SERP samples to update the daily summary, rolling KB, source index, competitive SERP observations, and top-listing operation hypotheses. Generate a mobile HTML report as needed."

No clarifying questions, no back-and-forth. Claude read the existing files and started working.

## Three Phases, 26 Tool Calls

**Phase 1 — Context Scan (10 Read calls)**

Before writing anything, the agent read every relevant existing file: `2026-05-23-daily-update.md`, `rolling-knowledge-base.md`, `source-index.md`, `competitive-serp-observations...`. Large files were chunked with offset reads. The goal was to understand exactly where the previous session left off before adding anything new.

**Phase 2 — Large JSON Without the Token Cost (12 Bash calls)**

`sources/serp-2026-05-24/summary.json` was too large to load with the Read tool directly. Instead:

```bash
grep -E '"keyword"|"cpc"|"position"' sources/serp-2026-05-24/summary.json | head -100
```

Extract only the keys you need. Don't load the full file. More than half of the 12 Bash calls were grep/head/tail combinations like this. This is the pattern that keeps token usage from spiraling on data-heavy research tasks.

**Phase 3 — Output (2 Write, 2 Edit)**

Once context was established:
- `Write` × 2: New `2026-05-24-daily-update.md` and `reports/2026-05-24-cost-keyword-serp-split.html`
- `Edit` × 2: Append May 24 sections to `rolling-knowledge-base.md` and `source-index.md`

## The Two Patterns That Actually Work

**grep-first**: Whether it's JSON or Markdown, grep for the lines you need before reaching for the Read tool. Reading entire files is a last resort.

**append-only editing**: Don't rewrite existing documents. Add a new dated section at the end. Minimal Edit scope, clean diffs.

```bash
# Find the append point without loading the full file
tail -30 rolling-knowledge-base.md
```

Use `tail` to check the end of a file, then use the last paragraph as `old_string` in the Edit call with the new content appended after it. The diff stays surgical — only the new section shows up.

## Tool Call Breakdown

| Tool | Count | Purpose |
|------|-------|---------|
| Bash | 12 | grep, head, tail, state updates |
| Read | 10 | Chunked reads of existing files |
| Write | 2 | New files |
| Edit | 2 | Append to rolling KB |

Read got 10 calls because `rolling-knowledge-base.md` alone took three chunked reads. Targeting sections by offset is significantly more efficient than loading the full document and hoping the relevant content lands in context.

## Why Opus 4.7, Not Sonnet

This session ran on `claude-opus-4-7`. The decision rule for research agents is straightforward: when a task requires holding context from multiple documents simultaneously and generating new content in a consistent voice, Opus is noticeably more reliable.

Daily KB updates are continuations — the agent needs to understand the pattern established by previous sessions and extend it without tone drift. 10 files read, 4 outputs generated, consistent structure throughout. That's the specific use case where Opus earns its cost premium over Sonnet.

## What's Still Manual

The pattern works, but with a clear constraint: SERP data collection is still manual. `sources/serp-2026-05-24/summary.json` gets created by a human before the session starts. The next step is wiring Google Custom Search API or a Playwright scraper to populate the input directory automatically.

HTML reports are generated but not deployed. Connecting GitHub Actions to Cloudflare Pages would close the loop — genuinely zero-touch daily reports.

## Key Takeaways

- grep-first + append-only keeps token waste low on data-heavy research sessions
- Large JSON: Bash grep beats the Read tool every time
- 26 tool calls, 9 minutes is enough for a full daily KB update + HTML report
- Opus 4.7 is the right model when multi-document context retention matters
