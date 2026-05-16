---
title: "14 Tool Calls, Zero Code Written: Claude Opus for Daily Medical Ad SERP Analysis"
project: "portfolio-site"
date: 2026-05-17
lang: en
pair: "2026-05-17-portfolio-site-ko"
tags: [claude-code, claude-opus, serp, prompt-engineering, research, dental-ad-ops]
description: "Read-only Claude Code sessions: 13 Bash, 1 Read, 0 file edits. How I use Claude Opus to synthesize Korean medical ad SERP data in under a minute."
---

Yesterday's two Claude Code sessions generated 14 tool calls. Not a single file was modified.

**TL;DR**: A read-only research pipeline using Claude Opus 4-7 to analyze Korean medical/dental advertising SERP data. No code written — just fast synthesis of accumulated JSON files. 13 Bash calls, 1 Read, 0 edits.

## The Problem Nobody Wants to Solve Manually

The `dental-ad-ops` project runs a daily SERP crawler against Naver — Korea's dominant search engine, where medical advertising operates under strict legal and platform constraints. Every day, files accumulate in `sources/serp-YYYY-MM-DD/summary.json`: ad placements by keyword, official Naver Ads policy notices, industry-specific patterns across 10 tracked keywords.

Reading all of this manually every morning takes 20–30 minutes — if you know what to look for. A "Place Ad inventory expansion test in the restaurant category" sounds irrelevant to a dental clinic until you know Naver's history of rolling out new ad formats vertically-first, then broadening. That context lives across multiple KB files: `KB/serp-patterns.md`, `KB/hypotheses.md`, `KB/source-index/`.

The solution isn't more automation scripts. It's handing the reading and cross-referencing to Claude.

## Session 1: Wide-Context KB Synthesis

The first prompt:

```
You are reviewing today's Korean medical/dental ads daily research data.
Read sources/serp-2026-05-16/summary.json and the existing rolling KB/source-index/SERP/hypotheses files.
Give a concise Korean synthesis:
(1) new official changes,
(2) SERP repeated patterns,
(3) what files should be updated,
(4) whether an HTML report is justified.
Do not edit files.
```

Four things are doing work here.

**Role framing** before any file access. Telling Claude it's reviewing Korean medical ad data gives it the lens to interpret what it finds. A Naver Place Ad expansion that looks like a restaurant industry story is actually a leading indicator for dental ad formats — that reading only makes sense with domain context.

**Explicit file scope** prevents Claude from deciding what to look at on its own. Named files and categories, not open-ended exploration.

**Structured output** with four numbered points. Predictable structure makes the output scannable and prevents free-form rambling.

**`Do not edit files.`** — the most important line in the prompt.

Claude Code's default orientation is action. It will write output to files, create summary documents, generate structured reports. That's the right behavior when you're building something. When you just want analysis, it's noise. The explicit constraint keeps the session clean.

This session ran 9 Bash calls: reading `summary.json`, listing KB files, reading individual KB entries, a `jq` call to extract specific fields. Completed in under a minute.

### What Wide Context Catches

Reading the full KB alongside fresh SERP data lets Claude catch things isolated analysis misses. The restaurant Place Ad expansion is a good example: on its own, it's not a dental story. Cross-referenced against the rolling hypothesis that Naver is expanding Place Ad formats more broadly, it becomes a pattern worth tracking.

That synthesis — connecting a restaurant-category test to dental advertising strategy — requires context that doesn't exist in any single file.

## Session 2: Fast Daily Check Under 700 Words

The second prompt tightened the scope:

```
Read sources/serp-2026-05-16/summary.json only.
Output Korean bullet synthesis with:
new official Naver Ads notices, medical/dental relevance, SERP pattern across 10 keywords, HTML-report yes/no.
Keep under 700 words.
```

Three deliberate changes from Session 1:

**`summary.json only`** — no KB files. When I already have rolling context in my head, I don't need Claude to re-derive it. I just need today's data summarized fast.

**`HTML-report yes/no`** — binary decision at the end. The pipeline has a downstream step: generate an HTML stakeholder report when SERP patterns shift significantly. Asking for a binary decision makes that call explicit rather than implicit.

**`Keep under 700 words`** — without this, Claude produces thorough output. Thorough is correct but wrong here. The cap forces prioritization.

Key findings from this session:

- **Naver Place Ad inventory expansion test** in restaurant verticals. Not urgent for dental, but the expansion pattern is consistent — worth monitoring.
- **Brand Search PC schedule change** effective 2026-05-11. Dental clinics running brand keyword campaigns should verify their schedules.
- No direct medical/dental targeting changes across any of the 10 tracked keywords.
- **HTML report: No.** No significant pattern changes detected. Daily briefing is sufficient.

4 Bash calls, 1 Read. 5 tool calls total. About 1 minute.

## The Read-Only Claude Code Pattern

Combined across both sessions: 13 Bash, 1 Read, 14 total tool calls. Zero files modified or created.

This is a specific usage pattern worth naming: **read-only analysis sessions**.

The default mental model for Claude Code is "AI that writes code." That's accurate most of the time. But Claude Code is also a fast synthesis engine for structured data — reading JSON, markdown, and text files, cross-referencing context, producing distilled output.

The constraints that make this pattern work:

1. **Explicit read-only instruction.** `Do not edit files.` Left unconstrained, Claude will write things.
2. **Output format spec.** Numbered bullets, word caps — makes output scannable and prevents scope creep.
3. **File scope definition.** Specify exactly which files to read. Claude is thorough by default; that thoroughness isn't always useful.
4. **Binary decisions where possible.** "HTML-report yes/no" is faster to act on than "should I generate a report?"

## Prompt Design as a Control Surface

Same source data, two prompts, two qualitatively different outputs.

**Session 1 — wide context:**
- Use when: first run, high-change days, strategic review
- Output: deep cross-referenced synthesis, catches multi-file patterns
- Tool calls: 9 Bash

**Session 2 — narrow scope:**
- Use when: quick daily check, low-change days
- Output: concise briefing, binary decisions
- Tool calls: 5 (4 Bash + 1 Read)

Both sessions take roughly the same wall-clock time. The difference is depth and context consumption. Session 1 burns more tokens but catches cross-file patterns. Session 2 is lean and fast.

The logical next step is a routing layer: a short check of yesterday's KB delta that decides which session type to run. Pattern change detected → wide context. No significant change → narrow scope. One automated decision replaces the current manual choice between two prompts.

## Numbers

| Metric | Value |
|--------|-------|
| Total sessions | 2 |
| Total tool calls | 14 |
| Bash | 13 |
| Read | 1 |
| Files modified | 0 |
| Files created | 0 |
| Time elapsed | ~1 minute |
| Model | claude-opus-4-7 |

## When Read-Only Is the Right Call

Not every Claude Code session should produce artifacts. Sometimes the output itself is the value — a daily briefing that replaces 30 minutes of manual reading.

The read-only pattern fits when:
- Data is already collected and structured (JSON, markdown)
- Goal is synthesis, not transformation
- Output is for human consumption, not downstream pipelines
- Speed matters more than reproducibility

It doesn't fit when you need version-controlled output, when analysis feeds into another automated step, or when the session needs to run unattended.

For the dental ad SERP pipeline, this pattern is a staging step. The end state is a fully automated API pipeline that runs on a cron, writes structured output to the KB, and delivers a Telegram briefing. Claude Code sessions are how I validate prompt designs before committing them to automation.

> Not every Claude Code session writes code. Sometimes the most efficient session is the one that writes nothing.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
