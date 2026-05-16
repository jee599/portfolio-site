---
title: "13 Bash Calls, 1 Read: How Claude Opus 4.7 Synthesizes 10 SERP Keywords Across 2 Sessions"
project: "portfolio-site"
date: 2026-05-16
lang: en
pair: "2026-05-16-portfolio-site-ko"
tags: [claude-code, dental-ads, serp, research, opus, automation]
description: "Claude Opus 4.7 analyzed Korean dental ad SERP data in 2 sessions, 14 tool calls. Why splitting into a wide first pass and a narrow compression pass produces better synthesis than one broad query."
---

13 Bash calls. 1 Read. 0 writes.

That's the complete tool call log for today's Claude Code session. No code written, no files modified — just Claude Opus 4.7 running shell commands against a nested JSON file and turning raw SERP data into a structured synthesis of Korean dental advertising patterns.

Fourteen total tool calls across two sessions. Two targeted research queries instead of one sprawling prompt. And the second session used less than half the Bash calls of the first.

**TL;DR:** Splitting research into two scoped sessions — a broad context-gathering pass, then a tight compression pass — produces denser output than a single wide query. The first session maps the data structure; the second session queries it precisely. Session one used 9 Bash calls, session two used 4. Opus 4.7 connected SERP patterns to platform-level signals that smaller models would miss entirely.

## The Task: SERP Research for Korean Medical Ads

The workflow I've built collects daily SERP data for ten Korean dental and medical advertising keywords — terms like `임플란트` (dental implants), `라미네이트` (veneers), `치아교정` (orthodontics). High-value search categories where ad placement and organic listing patterns shift frequently on Naver.

Today's raw output: `sources/serp-2026-05-16/summary.json`. A nested JSON with day's search result observations, official Naver Ads notices, keyword-level SERP pattern data, and category labels.

The synthesis goal:
1. New official Naver Ads policy notices, filtered to what's relevant for medical/dental advertisers
2. SERP pattern observations across all 10 sample keywords
3. Whether generating an HTML summary report is justified by today's data
4. Which rolling research files (if any) need updating

Manual review of this takes 30-40 minutes and varies depending on what catches your eye. Opus does it in under a minute with consistent criteria, every session.

## Why Two Sessions Instead of One

The first instinct for AI-assisted data analysis is usually to write one comprehensive prompt and get everything back at once. For structured data with an unfamiliar schema, that's usually wrong.

The problem: `summary.json` is deeply nested. Naver Ads notices live in one subtree, keyword-level SERP data in another, category codes scattered throughout. Before you can filter `.notices[] | select(.category == 147)`, you need to know that `category` is the field name, that 147 is the search advertising category code, and that `notices` is the top-level key. You don't get that from one cold prompt against an unknown JSON structure.

If you send Opus a broad synthesis prompt with an unfamiliar file, it does what any good analyst would do: it explores the data before synthesizing it. That exploration shows up as Bash calls. Nine of them, in session one.

Explicitly splitting the work turns this into a feature instead of overhead.

**Session 1** is the context pass. Broad scope, no output format constraints, multiple files. The goal is understanding — what changed today, what the structure looks like, what matters.

**Session 2** is the compression pass. Single file, explicit four-bullet output format, 700-word ceiling. The goal is synthesis — the exact output needed.

Session two ran 4 Bash calls. Session one's exploration did the structural work that made precision possible.

## Session 1: Context Gathering, 9 Bash Calls

The prompt for session one:

```
You are reviewing today's Korean medical/dental ads daily research data.
Read sources/serp-2026-05-16/summary.json
and the existing rolling KB/source-index/SERP/hypotheses files.
Give a concise Korean synthesis:
(1) new official changes,
(2) SERP repeated patterns,
(3) what files should be updated,
(4) whether an HTML report is justified.
Do not edit files.
```

Three constraints matter here.

**"Do not edit files"** — without this, Opus will try to update the rolling knowledge base automatically. In a research session, I want analysis, not automated propagation. The constraint keeps the session read-only.

**Explicit file scope** — I listed the rolling KB, source-index, SERP observations file, and ranking hypotheses file alongside `summary.json`. Opus needs yesterday's context to identify what changed today. Front-loading that context makes the synthesis more accurate.

**No output format constraint** — session one is for gathering, not filtering. Constraining output here would cut context I need to write session two's synthesis prompt precisely.

Nine Bash calls happened because `summary.json` required exploratory parsing. To filter notices by category 147 (search advertising), Opus first confirmed the key names:

```bash
cat sources/serp-2026-05-16/summary.json | jq 'keys'
```

Then inspected the notices array structure:

```bash
cat sources/serp-2026-05-16/summary.json | jq '.notices[0]'
```

Then ran the actual filter:

```bash
cat sources/serp-2026-05-16/summary.json | jq '.notices[] | select(.category == 147)'
```

Three shell commands for one filtering operation. Multiply across keyword categories, date filters, and label extraction and you get nine. Exploratory parsing looks expensive in the tool call log; it's actually the correct approach for schema discovery.

## Session 2: Compression, 4 Bash Calls

Session two's prompt was the structural inverse of session one's:

```
Read sources/serp-2026-05-16/summary.json only.
Output Korean bullet synthesis with:
new official Naver Ads notices,
medical/dental relevance,
SERP pattern across 10 keywords,
HTML-report yes/no.
Keep under 700 words.
```

One file. Four bullets. Hard word limit. Fully specified output structure.

The synthesis output:

**New Naver Ads official notices (2026-05-16):**

- Local Places ad display expansion test — restaurant category only, so no direct dental application, but signals a platform-wide trend toward expanding Places ad inventory
- Brand Search ad placement changes on PC/mobile — dental brand search operators should recheck current display positions
- New keyword groups for product search — no medical relevance

**SERP patterns across 10 sample keywords:**

High-value dental keywords (implants, veneers, orthodontics) maintained the established mixed-display pattern between the Places tab and PowerLinks. External platform results (booking sites, review aggregators accessed through blog-format content) appeared on 6+ Gangnam and Cheongdam area keywords — consistent with prior observations.

**HTML report justified?** Yes — 3 of 10 keywords showed observable pattern shifts, and the notice changes cross-reference with existing rolling research.

With the JSON structure already mapped in session one, Opus used 4 targeted Bash calls: one structural confirmation plus three precise extractions. No exploration needed.

## Tool Call Stats

| Tool | Session 1 | Session 2 | Total |
|------|-----------|-----------|-------|
| Bash | 9 | 4 | 13 |
| Read | 0 | 1 | 1 |
| Edit | 0 | 0 | 0 |
| Write | 0 | 0 | 0 |

The single Read call happened in session two — Opus reading the existing ranking hypotheses file to cross-reference against today's SERP patterns. Session one handled all its data access through Bash.

## Why Bash-Heavy Analysis Is the Right Approach

Thirteen Bash calls looks like overhead. It isn't.

`summary.json` is structured data with category codes, date fields, and nested arrays. Two approaches exist for working with it:

**Approach A: Load full JSON into context**

```
"Here is the full contents of summary.json: [5000 tokens of raw JSON]..."
```

**Approach B: Extract relevant fields via shell**

```bash
jq '.notices[] | select(.category == 147) | {title, date, url}' summary.json
```

Approach B feeds 50-100 tokens of targeted data into context instead of 5000 tokens of raw JSON. The model reasons over clean, filtered information instead of parsing a large document. Accuracy improves. Token cost drops.

The general principle: for structured data — JSON, CSV, databases — shell extraction plus small targeted reads is more efficient than full-document prompting. Reserve large-context reasoning for unstructured text where shell manipulation doesn't help.

The exploratory Bash calls in session one aren't waste. They're schema discovery. Once the structure is mapped, session two's calls are surgical.

## Why This Is an Opus 4.7 Task

SERP synthesis for Korean medical advertising looks like it should work on any model. Read some JSON, write some bullets. It doesn't.

Consider this notice from today's data: *"Local Places ad display expansion test — restaurant category."*

A simpler model returns: "Restaurant category, not directly relevant to dental."

Opus returns: "Places ad expansion trend signal — restaurant category tests on Naver's platform frequently precede rollout to adjacent verticals. Monitor for medical/dental Places inventory changes."

The difference isn't reading comprehension. It's contextual inference from platform history. Opus knows that category-specific ad format tests on Naver tend to function as early signals for broader rollouts. The literal notice says "restaurants." The relevant interpretation is "upcoming vertical expansion." Getting from one to the other requires knowing something about how Naver rolls out ad format changes, which requires the kind of reasoning that smaller models don't do reliably.

Same pattern with SERP analysis. "External platform results on 6+ Gangnam keywords" is a neutral data point. Opus connects it to the existing hypothesis that booking-site placement density in Gangnam organic results correlates with PowerLink competition intensity — a connection that requires reading two files together and understanding what the relationship implies for bidding strategy.

Haiku makes none of these connections. Sonnet makes some. Opus makes all of them, consistently.

SERP synthesis is a judgment task, not a text extraction task. This is not where you optimize for cost.

## What a Read-Only Session Produces

Today's session generated no commits, no file updates, no visible repository changes. By standard development metrics, nothing happened.

That framing is wrong.

Two things came out of today's work.

**A reliable SERP synthesis.** Manual review of ten keyword patterns takes 30-40 minutes and the analysis varies by reviewer — different people emphasize different patterns. Opus applies a consistent analytical framework across every session. The patterns it flagged today are the same patterns it would flag next week given equivalent data. That consistency matters when the research feeds advertising decisions.

**A defined scope for the next session.** The HTML report decision came back "yes" — justified by the pattern changes and notice cross-references. The next session has a clear, bounded task: generate the HTML report. The read-only session made a decision that gates downstream work.

This is the underappreciated function of read-only AI sessions. They don't produce code or files. They produce decisions — documented, consistent, traceable decisions made against explicit criteria. When you're running a workflow at volume, decisions made by a consistent framework are worth a lot more than decisions made by whoever has bandwidth that afternoon.

Today was 14 tool calls, 2 sessions, 0 file changes. That's a complete research cycle.

---

*tool calls: 14 (Bash×13, Read×1) · sessions: 2 · files modified: 0 · model: claude-opus-4-7*

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
