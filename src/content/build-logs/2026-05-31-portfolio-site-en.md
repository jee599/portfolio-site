---
title: "Filtering 179 Raw AI Articles with Claude Opus 4.8: Building a Content Intelligence Cron"
project: "portfolio-site"
date: 2026-05-31
lang: en
pair: "2026-05-31-portfolio-site-ko"
tags: [claude-code, spoonai, content-curation, automation, claude-opus]
description: "How I built a content curation cron using Claude Code + Opus 4.8 to filter 179 raw crawled AI articles into tiered general and expert candidates daily."
---

Every day, 179 raw AI articles land in a JSON file. Most of them are noise. A few are worth turning into content. The challenge is doing that triage automatically — and getting the output schema right before committing to any pipeline.

**TL;DR** I scaffolded a content intelligence cron for SpoonAI's new site using Claude Code. One session, 9 tool calls (6 Bash + 3 Read), zero output files — but the format exploration was the whole point. The next session can skip straight to classification.

## The Problem: Two Audiences, One Raw Feed

SpoonAI's new site serves two distinct reader types. General readers — people curious about AI but not building with it — want digestible card-style news. Developer and researcher readers want technical depth: numbers, signals, secondary sources.

The daily crawl doesn't distinguish between them. `2026-05-31-daily-intel-raw.json` contains 179 items — model releases, regulatory news, acquisitions, research papers — all flat, unsorted, with no audience targeting. Manually triaging this every day was a time sink that didn't scale.

The goal: a cron that reads `daily-intel-raw.json` and outputs `daily-intel.md` plus `daily-intel.json`, pre-sorted into general picks (8–15 items) and expert picks (10–20 items). No publishing, no email, no touching the existing site. Just filter and format.

## Why Claude Opus 4.8 for Curation

The filtering decision isn't a keyword search — it's editorial judgment. "Will a non-technical reader find this interesting?" and "Does this have actionable technical insight?" are questions that require reading comprehension, not pattern matching.

Claude Opus 4.8 runs this classification step. The model reads each item's title, URL, and summary, then makes the general/expert call and fills in structured fields for whichever category it lands in. At 179 items per day, this runs in a single prompt pass.

## What the Schema Needs to Carry

Before writing any classification logic, I needed to lock down the output schema. This is the part that bites you later if you skip it — downstream pipeline stages that parse your output will break silently if a field name drifts between runs.

I read previous-day output files to identify the four fields that matter:

- `general_angle` — the editorial angle for general-audience content
- `expert_notes` — technical analysis memo for developer readers
- `numbers` — specific quantitative data extracted from the article
- `secondary_sources` — related source links for further context

Every item in the output needs to carry exactly these fields, consistently named. The cron runs daily; the parser that reads it should never need to handle format variations.

## The Session: 9 Tool Calls, All Reads

This session was intentionally lightweight. The work was reconnaissance, not production.

| Tool | Count |
|------|-------|
| Bash | 6 |
| Read | 3 |
| **Total** | **9** |

The 6 Bash calls covered: checking that the raw file existed, using `jq` to count items (179), inspecting the first few entries to confirm field structure, and verifying the previous-day output path. The 3 Read calls pulled the raw file body and two samples of prior output to cross-check schema consistency.

No files written. No items classified. Zero generated, zero modified.

## Why Zero Output Files Is a Valid Result

In a multi-pass pipeline, the exploration pass is its own deliverable. The output isn't a file — it's a validated schema and a clear picture of what the next pass needs to do.

> Get the schema wrong and every downstream stage breaks. Read first, write second.

If I had skipped this step and gone straight to classification, I might have produced output with slightly different field names or a missing `numbers` field for certain item types. That would have silently corrupted downstream parsing until someone noticed the output looked off.

The exploration pass confirmed: the schema from previous runs is consistent, the four required fields are stable, and 179 items is within the single-pass budget for Opus 4.8. The next session can start classifying immediately.

## What the Next Session Does

Three things, in order:

**1. Classify all 179 items.** General criteria: "Would someone who doesn't build AI find this worth reading?" Expert criteria: "Does this contain technical insight or concrete numbers?" Items can qualify for both tiers.

**2. Fill in the required schema.** Target counts: 8–15 general, 10–20 expert. Each item gets `general_angle` or `expert_notes` (or both), `numbers`, and `secondary_sources` populated.

**3. Extract the Top 8 headlines.** A separate scannable list at the top of the final MD file — summary before the full detail sections.

The infrastructure is in place. The schema is confirmed. The next session is purely execution.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
