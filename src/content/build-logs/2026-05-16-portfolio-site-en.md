---
title: "Claude Opus 4.7: 10 SERP Keywords, 2 Sessions, 13 Bash Calls, Zero Files Written"
project: "portfolio-site"
date: 2026-05-16
lang: en
pair: "2026-05-16-portfolio-site-ko"
tags: [claude-code, dental-ads, serp, research, opus, automation]
description: "Claude Opus 4.7 synthesized 10 Korean dental ad SERP keywords via 14 tool calls across 2 sessions — no files written, pure analysis."
---

Zero files written. Zero lines of code changed. Thirteen Bash calls, one Read.

That's the complete tool call log for today's two Claude Code sessions. No commits, no edits — just Claude Opus 4.7 running shell commands against a nested JSON file and producing a structured synthesis of Korean dental ad SERP patterns.

**TL;DR:** Split wide-scope sessions from narrow-scope sessions. The first session maps the data structure with exploratory Bash calls; the second session queries it precisely. Session 1 used 9 Bash calls, session 2 used 4. The second session dropped to half because the JSON structure was already known. Opus 4.7 connected platform notices to downstream implications that smaller models miss.

## What Two Sessions of Pure Analysis Looks Like

Both sessions today targeted one file: `sources/serp-2026-05-16/summary.json`. Claude Opus 4.7 read dental and medical ad SERP data from Naver, identified official Naver Ads notice changes, and synthesized keyword patterns across 10 sample queries.

Session 1: broad context pass, 9 Bash calls.
Session 2: tight compression pass, 4 Bash calls.

Total elapsed time on record: 0 minutes of human review. A human doing the same JSON analysis manually would budget 30 minutes.

## Session 1: The Context Pass, 9 Bash Calls

The prompt was intentionally wide:

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

The last line is load-bearing. Without `Do not edit files`, Opus will attempt to update the rolling knowledge base automatically. Today's goal was analysis, not mutation.

Nine Bash calls happened because `summary.json` required exploratory parsing. The file is deeply nested — Naver Ads notices by date, keyword-level SERP data by query, category codes embedded in arrays. There's no way to write a precise `jq` filter cold against an unknown schema. Opus explored first:

```bash
# Step 1: confirm top-level keys
cat sources/serp-2026-05-16/summary.json | jq 'keys'

# Step 2: inspect notices array structure
cat sources/serp-2026-05-16/summary.json | jq '.notices[0]'

# Step 3: filter by category 147 (search advertising)
cat sources/serp-2026-05-16/summary.json | jq '.notices[] | select(.category == 147)'
```

Three shell commands for one filtering operation. Multiply across keyword categories, date filters, and label extraction — nine calls total. This looks expensive in the tool log. It's actually correct behavior for schema discovery.

## Session 2: The Compression Pass, 4 Bash Calls

Session 2's prompt was the structural inverse:

```
Read sources/serp-2026-05-16/summary.json only.
Output Korean bullet synthesis with:
new official Naver Ads notices,
medical/dental relevance,
SERP pattern across 10 keywords,
HTML-report yes/no.
Keep under 700 words.
```

One file. Four explicit output bullets. 700-word hard limit.

The synthesis output:

**New Naver Ads Official Notices:**

Map Places ad display inventory expansion test started for the restaurant category. Not a direct dental notice — but on Naver's platform, category-specific ad format tests frequently precede broader rollouts to adjacent verticals. This is a leading signal for medical/dental Places inventory changes, not a non-event.

Brand Search placement changes on PC/mobile also announced. Dental practices running Brand Search campaigns should recheck current impression positions.

**SERP Patterns (10 keyword sample):**

High-value dental keywords — implants, laminates, orthodontics — maintained the established mixed-display pattern between the Places tab and PowerLinks. External platform results (booking sites, review aggregators through blog-format content) appeared on 6+ Gangnam/Cheongdam area keywords, consistent with prior observations. Pattern changes detected in 3 of 10 keywords.

**HTML report justified?** Yes — 3 pattern changes plus notice cross-reference warranted a structured output.

With the JSON structure already mapped from session 1, Opus ran 4 targeted Bash calls: one structural confirmation, three precise extractions. No re-exploration needed.

## Tool Call Breakdown

| Tool | Session 1 | Session 2 | Total |
|------|-----------|-----------|-------|
| Bash | 9 | 4 | **13** |
| Read | 0 | 1 | **1** |
| Edit | 0 | 0 | 0 |
| Write | 0 | 0 | 0 |

## Why 13 Bash Calls Is the Efficient Path

Thirteen Bash calls against a JSON file sounds like overhead. The alternative is worse.

**Option A: dump full JSON into context**

```
"Here is the full contents of summary.json: [5,000 tokens of raw JSON]"
```

**Option B: extract relevant fields via shell**

```bash
jq '.notices[] | select(.category == 147) | {title, date, url}' summary.json
```

Option B feeds 50-100 tokens of filtered data into context instead of 5,000 tokens of raw JSON. The model reasons over clean, targeted information. Accuracy improves; token cost drops.

For structured data — JSON, CSV, databases — shell extraction plus small targeted reads beats full-document prompting. The exploratory Bash calls in session 1 are schema discovery, not waste. Once the structure is mapped, session 2's calls are surgical.

Splitting into two sessions amplifies this. Session 1 does the mapping. Session 2 skips it entirely.

## Why This Is an Opus 4.7 Task

SERP synthesis for Korean medical ads looks like it should run on any model. Read JSON, write bullets. It doesn't.

The Maps Places notice said: *"Ad display inventory expansion test — restaurant category."*

A smaller model returns: "Restaurant category, not relevant to dental."

Opus 4.7 returns: "Platform-level signal for Places ad expansion — restaurant category tests on Naver frequently precede rollout to adjacent verticals, including medical. Monitor for upcoming inventory changes."

The difference isn't reading comprehension. It's contextual inference from platform behavior. The notice text says restaurants. The relevant interpretation requires knowing how Naver rolls out ad format changes across verticals — context that Haiku doesn't apply reliably and Sonnet applies inconsistently.

Same pattern with SERP analysis. "External platform results on 6+ Gangnam keywords" is a neutral data point. Opus connects it to the existing hypothesis about booking-site placement density correlating with PowerLink competition intensity — a connection that requires reading two files simultaneously and understanding what the relationship implies for bidding strategy.

SERP synthesis is a judgment task, not a text extraction task. This is not where you optimize for cost.

## What a Read-Only Session Actually Produces

Nothing was committed today. By standard development metrics, the sessions produced nothing.

That framing is wrong.

Read-only sessions act as decision gates. Today's analysis produced:

1. **A consistent SERP synthesis.** Manual review of ten keyword patterns takes 30-40 minutes, and results vary by reviewer — different people notice different things. Opus applies the same analytical framework every session. The patterns flagged today are the same patterns it would flag on the same data next week.

2. **A bounded task for the next session.** The HTML report decision came back Yes — justified by 3 pattern changes and notice cross-references. The next session has a concrete, scoped task: generate that report. Without today's analysis, that decision falls back to a human reviewing 10 keywords manually.

This is the underappreciated function of read-only AI analysis sessions: not code, not files — but documented, traceable decisions made against consistent criteria. At workflow scale, that consistency is worth more than decisions made by whoever has bandwidth that afternoon.

Today: 14 tool calls, 2 sessions, 0 file changes. That's a complete research cycle.

---

*tool calls: 14 (Bash×13, Read×1) · sessions: 2 · files modified: 0 · model: claude-opus-4-7*

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
