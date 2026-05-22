---
title: "6 Claude Code Sessions, 80 Tool Calls — Automating 3 Projects in a Single Day"
project: "portfolio-site"
date: 2026-05-22
lang: en
pair: "2026-05-22-portfolio-site-ko"
tags: [claude-code, automation, multi-agent, pipeline, claude-opus]
description: "6 Claude Code sessions, 80 total tool calls, 3 parallel projects in one day. Bash dominated at 43 calls. Here's what the session breakdown revealed about failure isolation and prompt design."
---

80 tool calls. 6 sessions. 3 completely unrelated projects — all wrapped up in a single day, with Opus 4.7 running every step.

**TL;DR** Splitting work into focused single-purpose sessions beats cramming everything into one long session. Each session stays isolated, so a timeout or socket error only kills that one unit — not your entire workflow.

## Why 6 Sessions Instead of One

The day's work spanned three unrelated domains: SpoonAI news intelligence, dental ad research, and a strategy review for a new marketing site. Mixing them into one session means shared context, higher token overhead, and an error in domain A cascading into domains B and C.

Instead, each session got exactly one job:

- **Session 1** (15 tool calls, 4 min): Raw SpoonAI intel JSON → cleaned MD/JSON output
- **Session 2** (2 tool calls, ~0 min): Schema compliance check on growth/sponsor signal files
- **Session 3** (41 tool calls, 9 min): Dental ad SERP collection + 5 knowledge base file updates
- **Session 4** (15 tool calls, 5 min): HTML report generation after Session 3 timed out
- **Session 5** (4 tool calls, 4 min): Markdown report → mobile-friendly HTML rework
- **Session 6** (3 tool calls, 3 min): Marketing strategy feedback for /newsite (zero code changes)

## Bash 43 Times — Scripts Were the Core of the Automation

The tool call distribution is revealing: Bash 43, Read 23, Edit 6, Write 4, Grep 4. Bash accounts for more than half of all calls — wildly more than Write (4) or Edit (6).

That's because Claude wasn't just reading and writing files. It was building and executing pipelines. Session 3 is the clearest example: Claude wrote a Python SERP collection script (`collect_2026_05_22.py`), ran it via Bash, read the output, then updated 5 KB files based on the results.

```
Write (generate script) → Bash (execute) → Read (parse output) → Edit (update KB)
```

That four-step loop repeated 20+ times within Session 3 alone. The pipeline wasn't designed upfront — Claude assembled it incrementally based on what each step returned.

## When a Socket Error Kills Your Session Mid-Run

Session 1 hit `API Error: The socket connection was closed unexpectedly` at the worst possible moment: after 14 tool calls reading and structuring data, but before writing a single output file.

Recovery was one sentence: open a new session and prompt with "the previous session timed out before writing output — use the context already built and generate the files." Session 3 hit the same wall — timed out mid-execution — and Session 4 picked up HTML report generation exactly where it left off.

Neither interruption cost more than a few minutes. The reason: every session's expected output paths were specified in the prompt upfront. The recovery session knew precisely what to produce without re-reading the problem from scratch.

## Session 2: Validation Done in 2 Tool Calls

Session 2 deserves a closer look. Two tool calls, essentially zero elapsed time. Claude read two files — a `.md` and its corresponding `.json` — and immediately output schema compliance results:

```
sponsor_leads: 17 (MD ↔ JSON match)
competitor_notes: 7
content_opportunities: 10
outreach_hooks: 5
```

The prompt was tightly constrained: "counts, required fields, PASS/FAIL only." Vague prompts produce verbose responses. Validation tasks should specify the exact success criteria before handing off — Claude doesn't need to explain what it found, just whether it passes.

## Session 6: Zero Code Written, Stop Hook Triggered Anyway

Session 6 was a pure strategy session — no files created, no code changed. But the Stop hook fired with `Found 3 debug/TODO leftover(s)`.

Claude ran Grep to investigate. The flagged markers weren't from this session at all — they were pre-existing `console.log` statements in `scripts/*`. In CLI utilities, `console.log` *is* the intended stdout output mechanism. Removing it would break the scripts.

This is a false positive. The right fix isn't to suppress or delete the logs — it's to configure per-project hook exclusion paths so the hook doesn't scan CLI utility directories. Running the same hook rules across all directories without exceptions will surface friction like this regularly.

## Two Files Were Enough for a Strategy Review

Session 6 covered marketing and positioning feedback for the SpoonAI `/newsite` launch. No code changes — just Read on two existing files, then written analysis.

Claude flagged two friction points: "AI intelligence" and "AI learning" overlap in messaging in a way that muddies B2B positioning. And a $49–$299 pricing structure with no Free Tier means you can't measure conversion before the paywall — the funnel is blind until someone pays.

Code-free analysis is `trivial` complexity. 3 tool calls, done. No research agent, no subagent scaffold needed.

## What This Day Made Clear

Multiple short sessions outperform one long session on two axes: fault tolerance (a timeout kills one session, not the day) and cost per retry (restarting a 5-minute session costs almost nothing).

The single most important habit: put both the input file paths *and* the output file paths in the intake prompt. When a session disconnects mid-run, the recovery session knows exactly what to produce without re-reading the whole problem. Clean inter-session handoffs depend entirely on this.

Tool breakdown: Bash 43 / Read 23 / Edit 6 / Write 4 / Grep 4 — 80 total calls across 6 sessions.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
