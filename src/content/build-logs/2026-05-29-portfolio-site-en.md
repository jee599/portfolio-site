---
title: "44 Tool Calls, Zero Code Changes: A Day Claude Ran as a Report Engine"
project: "portfolio-site"
date: 2026-05-29
lang: en
pair: "2026-05-29-portfolio-site-ko"
tags: [claude-code, automation, claude-opus, orchestration, build-log]
description: "3 sessions, 44 tool calls, 7 minutes — zero code changes. What a 64% Read ratio reveals about AI-driven content pipelines."
---

Forty-four tool calls. Three sessions. Seven minutes. Zero code changes.

That's the complete summary of today's Claude Code activity. Not a single `Edit` call. No bug fixes. No refactors. Just a model reading existing files, processing context, and outputting two documents.

If you've been using Claude Code primarily as a coding assistant, today's session log reads like an anomaly. It's not. It represents an entire class of AI-powered automation work that rarely gets talked about: context-heavy, synthesis-driven report generation where the model's primary job is reading, not writing.

**TL;DR:** Three Claude Code sessions ran through Hermes relay today — SpoonAI content intelligence collection, dental advertising research daily update, and P1 product daily report generation. All three ended with just 2 `Write` calls total. Everything else was context gathering. `Read` accounted for 64% of all 44 tool calls. Today Claude Code operated as a document assembly engine, not a code editor. The most interesting moment: the orchestrator caught its own task misclassification mid-session and reclassified from `major` to `standard` before triggering unnecessary pipeline stages.

## What 64% Read Ratio Actually Tells You

Before walking through each session, this number deserves upfront attention.

In any content pipeline where accuracy matters — research aggregation, competitive analysis, rolling daily reports — read-to-write ratio is a meaningful signal. When reads significantly outnumber writes, the system is doing proper context collection before output. When that ratio inverts or flattens, you're generating content that's undergrounded.

Today: 28 reads, 2 writes. That's a 14:1 ratio. The two output files that came out of today's sessions are useful precisely because they were preceded by 28 reads. If you trimmed those reads in the name of efficiency, you'd get output faster and trust it less.

This shows up concretely in Session 2, where 4 of the 22 tool calls were `Grep` — not for discovery, but for deduplication. Before appending new data points to a rolling research file that accumulates daily updates, you need to verify those data points aren't already there. That's reads gating writes. It's the difference between a clean rolling dataset and one that silently compounds duplicate entries over time.

There's an instinct in AI tooling to optimize for low token counts and fewer tool calls. That instinct is sometimes right. But in synthesis-heavy pipelines, it can produce systems that are fast and wrong. The 64% read ratio isn't a problem to optimize away — it's evidence the pipeline is doing the work it's supposed to do.

## The No-Output Session That Everything Downstream Depends On

8 tool calls. 0 minutes (below measurement threshold). 0 output files.

First glance: nothing happened. That reading is wrong.

This was a cron-triggered content intelligence collection run for SpoonAI's news site. The job: evaluate today's content candidates from crawled data and pass the verdict to the next stage in the pipeline.

The model was `claude-opus-4-7`. The prompt arrived through Hermes relay, pre-formatted with a Socratic scope gate:

```
Socratic scope gate:
1) Goal: collect/synthesize today's candidates for SpoonAI new-site content
2) Scope: only files under /Users/jidong/spoonai/crawl/newsite for 2026-05-29
```

This format matters. Goal, scope boundary, what to do, what to leave alone — all specified upfront. The model ran 6 `Read` calls to ingest the crawled content and 2 `Bash` calls to verify file paths. No `Write` call because this session wasn't the generator — it was the gate.

In a well-designed pipeline, some stages don't produce artifacts. They produce decisions. Session 1 was a decision point: are today's content candidates viable? The answer feeds into whether and how downstream processes activate.

The `0min` log reflects a sub-minute run that did real evaluative work. Speed isn't the issue. The issue is whether the evaluation was accurate, and that depends on actually reading the source content rather than pattern-matching on file names.

If you're designing multi-stage AI pipelines, build gate stages explicitly. Don't combine collection, evaluation, and generation into single monolithic sessions. When a gate stage fails, you want it to fail clearly and early.

## When 22 Tool Calls Compress Into One File

3 minutes. 22 tool calls. One output file.

This session looks most "inefficient" by naive metrics and is actually the most technically interesting.

This was the daily update cycle for a medical/dental advertising research agent. The target: propagate a new official Naver Ads notice (notice #31822, published 2026-05-28) across four rolling files — the main accumulation log, source index, competitive SERP tracker, and Naver ranking hypothesis file. The notice covered a new Kakao Talk consultation extension ad format: a significant product update with implications for dental clinic advertising strategy.

The session hit its first obstacle after loading initial context:

```
Summary.json is too large to read in one pass — splitting into chunks.
Core context secured. Will verify official notice #31822 HTML content
before writing output.
```

This is Claude Code operating within real system constraints. `summary.json` — an aggregated context file built from weeks of accumulated research — had grown beyond single-read capacity. The model chunked it across multiple `Read` calls, pulled the official notice HTML separately via `Bash`, then ran `Grep` four times across existing rolling files before writing anything.

Why the Grep calls? Not discovery. Deduplication.

Rolling research files accumulate daily. If you don't check before appending, you end up with repeated observations, duplicate source citations, and signal data that's hard to trust after a few weeks of drift. The Grep calls verified that today's Naver notice signal was genuinely new in each of the four target files before writing updates. This is a correctness requirement, not an optimization — skip these checks and the rolling files degrade.

Final breakdown: Read 13x, Bash 4x, Grep 4x, Write 1x.

Output: one file at `~/dentalad/research/daily-medical-dental-ads/2026-05-29-daily-update.md`.

That file contains today's competitive SERP observations, the Naver notice signal and its implications for Kakao Talk consultation ad inventory, updated keyword performance hypotheses, and notes for tomorrow's observation targets. Twenty-two tool calls compressed into one document designed to be incrementally useful when combined with the next day's and the day after that.

The compression is the point. A research pipeline that requires human synthesis every day won't run consistently. The goal is making daily execution cheap enough that it actually happens daily.

## The Self-Correcting Orchestrator

14 tool calls. 4 minutes. One HTML file.

And the most instructive moment of the day.

This session's goal: generate an integrated daily report for four P1 products — Dental AI Ads, FortuneLab/Saju, SpoonAI, and this portfolio site — as a Korean HTML document ready for Chrome PDF export.

The session started cleanly. Context files for all four products loaded in parallel `Read` calls. Chrome PDF export path confirmed. HTML structure drafted. Then:

```
Orchestrator gate triggered.
This is not a code change — it's a daily report generation task (content
writing + Chrome PDF export). Reclassifying from major to standard.
```

The workflow system had classified this task as `major`, which would have activated a full verification pipeline: plan-orchestrator → code-verifier (runs lint, typecheck, greps for `console.log`) → codex cross-verify (external model review of the diff). Three additional agent invocations designed for multi-file code changes — none of which apply to generating an HTML report from context files.

The model caught the mismatch and reclassified itself to `standard`. After that, the session ran directly: Read 9x, Bash 4x, Write 1x. Output: `~/product-agent-management/reports/p1_product_daily_report_2026-05-29.html`.

In a multi-agent orchestration system, task complexity labels are load-bearing. They determine which pipeline stages activate, what verification steps run, and what artifacts get produced. A misclassification doesn't just add latency — it activates the wrong safeguards, produces irrelevant review artifacts, and blocks work that shouldn't be blocked.

The classification rubric this system uses:
- `trivial`: pure question, short confirmation, no file changes
- `simple`: single file or <30 lines changed
- `standard`: 2-5 files, small feature, clear UI/script/template task
- `major`: 6+ files, architecture/migration/DB/auth/payment/deploy/external API

Report generation that reads context files and writes one HTML document is `standard`. The confusion arose because "produces a complex artifact" was being conflated with "is architecturally complex." They're not the same.

If you're building orchestration layers over multi-agent systems, invest in classification heuristics early. Misclassification overhead compounds — wrong labels accumulate wrong pipeline overhead, and that makes the system feel slower and more obstructed than it should.

## Today's Numbers

| Tool | Count | Percentage |
|------|-------|------------|
| Read | 28 | 64% |
| Bash | 10 | 23% |
| Grep | 4 | 9% |
| Write | 2 | 4% |

No `Edit`. No `MultiEdit`. All three sessions followed the same pattern: context ingestion → synthesis → document output. Today Claude Code was not a code editor. It was a document assembly engine.

## Three Things Worth Taking Away

**Scope gates eliminate clarification overhead.** The Socratic scope gate format in Session 1 — goal, scope boundary, inclusions, exclusions — meant the model ran 8 tool calls with no back-and-forth. An underspecified prompt would have spent the first several exchanges just clarifying what to do before any real work started.

**Deduplication is a pipeline requirement, not optional.** Rolling files that accumulate over time need reads-before-writes as a correctness mechanism. Session 2's 4 Grep calls were mandatory. Skip them and your rolling dataset starts becoming unreliable after a few weeks of daily appends.

**Complexity classification belongs in the critical path.** Session 3's self-correction was useful. But in production you want classification to be right the first time. If your orchestration layer consistently misclassifies certain task patterns, that's a signal to update the heuristics — not to rely on in-session self-correction as a fallback.

> 28 reads are what make 2 writes worth keeping. Context-free generation doesn't scale.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
