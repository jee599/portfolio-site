---
title: "141 Tool Calls, 9 Sessions, Zero Code Files: Using Claude Code as a Research Engine"
project: "portfolio-site"
date: 2026-05-28
lang: en
pair: "2026-05-28-portfolio-site-ko"
tags: [claude-code, automation, hermes, research, workflow]
description: "141 tool calls, 9 sessions, 0 code files changed. What a research-only Claude Code day looks like: tool call ratios, session patterns, and the relay/executor split."
---

141 tool calls. 9 sessions. Zero code files modified.

That's what a day of using Claude Code as a research and intelligence automation engine looks like — not a coding session.

**TL;DR**: The same Claude Code workflow you use for writing code works just as well for research, report generation, and intelligence gathering. The key is a clean separation between a relay layer (Hermes) that routes requests and Claude CLI as the actual executor that reads, fetches, and writes. Sessions stayed under 4 minutes by front-loading scope definition in every prompt.

## The Tool Call Distribution That Tells the Story

Before looking at what got built, look at the tool call breakdown:

| Tool | Count |
|------|-------|
| Bash | 78 |
| Read | 42 |
| WebFetch | 15 |
| Write | 5 |
| ToolSearch | 1 |
| **Total** | **141** |

Read at 42 calls, Write at 5. An 8:1 ratio. In a typical coding session, Edit dominates this distribution. When the ratio flips to Read-heavy with minimal Write, you're in synthesis mode — reading existing data, combining it, summarizing it.

The 78 Bash calls weren't running complex commands. Mostly: check if a file exists, list a directory, tail the last 20 lines of a previous output file. Each one is a checkpoint — read what's already there, decide whether to continue or adjust.

This distribution is a useful signal. When you look at a session's tool call log and see `Bash > Read >> Write` with almost no Edit, you're looking at research work, not coding work. The tool call profile maps to the cognitive mode.

## Short Sessions Are a Feature, Not a Constraint

Nine sessions ran across the day. Time breakdown:

- **0 minutes**: 2 sessions
- **1–2 minutes**: 4 sessions
- **4 minutes**: 2 sessions
- **8 minutes**: 1 session

Seven out of nine sessions completed in under 4 minutes. That's not because the tasks were trivial — one of the 2-minute sessions produced a multi-section intelligence brief with external data sourced from three different platforms.

Short sessions stay short because scope is defined before execution starts.

## The Prompt Structure Behind Sub-4-Minute Sessions

The prompt format that made consistent short sessions possible:

```
# Socratic intake

Goal: Compile the 2026-05-27 Korean medical/dental ad research results
      into a structured daily brief.
Scope: Only create/update files under
       /Users/jidong/dentalad/research/daily-medical-dental-ads/
Tasks: daily-update.md, rolling-knowledge-base.md, source-index.md
Not doing: existing site modifications, deployment, email
Assumptions: Previous day's data exists in the research directory.
             Using same format as previous daily briefs.
```

The "Not doing" section is as important as the "Tasks" section. When Claude knows what's explicitly out of scope, there's no need to ask clarifying questions. The session starts with execution, not negotiation.

Without this structure, a session might spend the first minute asking: "Should I update the existing files or create new ones? Do you want me to check the deployment too?" With explicit scope definition, that overhead disappears.

The four fields that eliminate back-and-forth: **Goal** (one-sentence restatement), **Scope** (exact directory/file targets), **Not doing** (explicit exclusions), **Assumptions** (what you're taking for granted so Claude doesn't have to ask).

This pattern comes from treating Claude sessions like function calls — inputs defined, outputs expected, side effects explicitly listed. The clearer the contract, the shorter the execution.

## Hermes Is a Relay, Not a Worker — Why This Matters

Most sessions originated from Hermes — a layer that receives requests from Telegram and routes them to Claude CLI. This architecture creates a tempting shortcut: let Hermes handle the response directly since it's already in the loop.

The design rule that prevented this:

> Hermes is a relay. Design, implementation, modification, and output creation are Claude CLI's job.

The actual prompt enforced this explicitly:

```
You are Claude CLI, the actual report writer. Hermes is only the relay.
Your job: read the brief, fetch any needed external data, write the output files.
Hermes routes the request. You execute it.
```

Why does this matter? When Hermes generates output directly, that output is unverified. It hasn't gone through the read-fetch-synthesize cycle. It's producing text based on what it knows at routing time, not based on reading the actual current state of the research files or fetching live data.

Claude CLI as executor means:
- Reading the actual files before producing output (not working from memory)
- Fetching real-time data when the task requires it
- Writing output that reflects the actual data state, not a cached approximation

Session 7 demonstrated how lean this can get: 2 tool calls total. Read 1, Bash 1. Read the brief to confirm what was needed, check that the output directory existed, write the result. Done.

The relay/executor split keeps output accurate and verifiable. Hermes knows where to send the request. Claude CLI knows what to do with it.

## 15 WebFetch Calls and Mid-Session Decision Making

The SpoonAI growth signal collection session generated 15 WebFetch calls. The original plan: pull data from Product Hunt, Show HN, and GitHub Trending. Three sources, standard scan.

Midway through, data quality wasn't meeting the threshold:
- Reddit/HN data: sparse, not enough signal
- GitHub Trending: skewing toward large established repositories, missing new launches

The session adapted:

```
Reddit/HN data is sparse. I'll query Product Hunt and Show HN directly.
Adding competitor newsletter sources in parallel.
Pulling additional Show HN entries from the past 48 hours.
```

Three sources became six. The final brief had better signal coverage than the original plan would have produced.

This is the meaningful difference between Claude Code and a data pipeline script. A script with predefined sources returns whatever those sources contain, including empty results. Claude Code evaluates data quality mid-execution and adjusts the sourcing strategy.

For intelligence gathering work, this matters. You don't know in advance which sources will have good signal on a given day. A fixed scraper returns what's there. An adaptive executor fills gaps.

The tradeoff: 15 WebFetch calls cost more than 3. For daily intelligence gathering where signal quality determines the value of the output, that's a reasonable exchange.

## The Interruption That Improved the Session

Session 9 was the outlier — 8 minutes, the longest of the day. The user interrupted mid-stream:

```
[Request interrupted by user]

Stop. Don't overthink this. Just write the two files directly
using admission_cases_brief.md as the source. Write tool only.
```

What happened before the interrupt: too much time analyzing the brief before starting to write. The brief had been read, the scope was understood, but the session was still in planning mode rather than execution mode.

After the interrupt, immediate execution: Bash 3, Read 3, Write 1. Complete.

The pattern is clear in retrospect. When the output is:
- Two specific files
- Content fully defined in an existing brief
- No ambiguity in format

...there's no planning phase needed. Start writing. The brief is the plan.

Adding `Write tool only` to the prompt from the start would have prevented the over-analysis. For output-constrained tasks — you know exactly how many files and roughly what they contain — skip the planning phase and start executing.

Planning overhead should scale with output uncertainty. Two files from an existing brief has near-zero uncertainty.

## What Five Write Calls Produced

All of the day's output came from 5 Write calls:

**`2026-05-27-growth-sponsor-signals.md`**  
SpoonAI growth and sponsor signal report — synthesized from six sources including Product Hunt, Show HN, and competitor newsletters.

**`2026-05-27-daily-intel.md` + `2026-05-27-daily-intel.json`**  
AI intelligence daily summary in both human-readable Markdown and structured JSON for downstream consumption.

**`report.html` + `short_summary.md`**  
SpoonAI and fortunelab analysis reports — HTML for sharing, Markdown for archival.

**`ai_masters_admission_cases_interview_report.html`**  
Graduate admissions case analysis formatted for review.

Zero code files. All analysis artifacts. This is what Claude Code's daily output looks like when used as a research tool rather than a code generator.

## Research Mode vs. Coding Mode: Reading the Signal

The tool call ratio is the clearest indicator of what mode you're in:

- **Coding mode**: `Edit >> Read > Bash`, Write low
- **Research mode**: `Bash > Read >> Write`, Edit near-zero

When Bash is dominant, Read is in second place, and Write is under 10% of total calls, you're in synthesis mode. The work is reading data, checking state, and producing structured output — not modifying existing code.

The session length targets differ too. Research sessions can complete in 2 minutes because the feedback loop is simpler: read the output file and either it has the right information or it doesn't. Coding sessions run longer because iteration is built into the workflow.

> When judgment calls outnumber implementation tasks, the tool call ratio shifts: Bash > Read >> Write. That pattern signals a research-mode day.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
