---
title: "197 Tool Calls in One Day: Running 3 Research Pipelines in Parallel with Claude Code"
project: "portfolio-site"
date: 2026-05-31
lang: en
pair: "2026-05-31-portfolio-site-ko"
tags: [claude-code, claude-opus, web-search, research-automation, multi-agent]
description: "197 tool calls across 5 sessions: Bash 73, WebSearch 40, Read 33. How Claude Opus ran 3 completely different research pipelines in a single day using context chaining and parallel agents."
---

73 Bash calls. 40 WebSearches. 33 file reads. By the end of the day, 197 tool calls had fired across 5 sessions and 6 new files existed that didn't before.

**TL;DR** — Used Claude Opus to complete three structurally different research pipelines in a single day: a SpoonAI content intelligence cron, a medical/dental advertising daily research update, and a global AI revenue platform report covering 25+ platforms verified against live official sources. Two patterns made this scale: context chaining (referencing yesterday's output files) and parallel agents by lane.

## Three Sessions That Have Nothing in Common

The day's meaningful work came from three sessions.

**Session 1** was content intelligence collection for SpoonAI's new site. The agent read 179 items from `2026-05-31-daily-intel-raw.json` and selected candidates for two buckets: general card news (8–15 items) and expert intelligence (10–20 items). 9 tool calls total. The first thing the agent did wasn't read the raw data — it read the *previous day's output file*. It reverse-engineered the `general_angle`, `expert_notes`, `numbers`, and `secondary_sources` field structure to match the existing schema before writing anything.

**Session 2** was daily research for medical and dental advertising. Input: `serp-2026-05-31/summary.json` and the day's collected HTML. Output: a daily update plus two updated cumulative files. Of 22 tool calls, 12 were reads. That 3:1 read-to-write ratio isn't waste — `rolling-knowledge-base.md` holds multiple days of accumulated data, and appending to it without understanding its current structure would silently corrupt the format. The session finished in under 4 minutes.

**Session 5 was the main event.**

## The Moment WebSearch Looked Empty

Session 4 laid down the structure first: 5 Agent calls, 8 tool calls total. Session 5 ran the full execution: 158 tool calls over 37 minutes.

The goal was to execute the `brief_global_ai_10_research.md` directive verbatim — live verification of 25+ global AI revenue platforms, pulling commission rates, payment terms, and Korea eligibility requirements directly from official sources.

Two things happened in the first minutes. An `API Error: Overloaded` hit. And WebSearch results looked empty at first glance. On the next iteration, the results were all there — relay buffering had delayed the display, not the actual fetches. WebSearch, WebFetch, and curl were all working normally throughout.

If this had been misread as a failure and the session abandoned, the output would have been a static summary instead of live-verified data. The difference between "it looks broken" and "it's buffering" is a lot of output quality.

## How 40 Policy Facts Got Confirmed from Official Sources

The core prompt constraint was:

```
Do not ask the user questions.
Use live web search where available.
If a source is blocked, record it as blocked and continue with another verifiable source.
```

"If blocked, record it as blocked and move to the next source" is the load-bearing line. The agent didn't stop when it hit a wall — it logged the block and continued. 40 WebSearches and 22 WebFetches later, roughly 40 commission and policy facts had been confirmed from official primary sources.

Several meaningful corrections surfaced during verification:

- **Etsy** is actually usable from Korea via Payoneer — not blocked as previously documented
- **Toloka** dropped PayPal as a payout method
- **Upwork**'s fee is now variable (0–15%), not a flat rate
- **Ko-fi**'s shop sale fee is 5%, not 0%

This isn't summary work — it's catching actual policy changes that static knowledge would have missed.

> The pattern confirmed today: split by lane, assign parallel agents per lane. Investigating 25 platforms sequentially compounds delay. Splitting by lane means total completion time converges to the slowest single lane, not the sum of all lanes.

## 5 Output Files in 37 Minutes

Files produced by Session 5:

- `global_ai_10_revenue_report.md` — detailed report, 27,872 bytes, 349 lines
- `global_ai_10_revenue_report.html` — same content rendered as HTML
- `method_ledger_seed.json` — structured per-platform data
- `sources.json` — verified source list
- `_progress.md` — in-flight progress log written during execution

Both JSON files passed validation. All 5 files confirmed created. Bash accounted for 60 of Session 5's calls — the majority hitting official URLs directly with curl, then writing and validating output.

## Full Tool Call Breakdown

| Tool | Count |
|------|-------|
| Bash | 73 |
| WebSearch | 40 |
| Read | 33 |
| WebFetch | 22 |
| Write | 12 |
| ToolSearch | 9 |
| Agent | 5 |
| Edit | 3 |
| **Total** | **197** |

5 sessions. 2 modified files. 6 new files. Excluding the "Say OK" session, 4 sessions produced 197 tool calls. Sessions 1 and 2 together: 31. Sessions 4 and 5 together: 166. The numbers show exactly how heavy live research is versus cron-style data transformation.

## Why Context Chaining Matters for Cron Automation

Sessions 1 and 2 are crons that run again tomorrow. The SpoonAI intelligence cron runs a daily `raw crawl → selection → .md/.json output` routine. The medical advertising research runs `SERP data → daily update → cumulative KB append`. In both cases, Claude references yesterday's output to build today's.

The instruction "write it in the same format as the file you made yesterday" is more reliable in practice than several pages of schema documentation. As accumulated data grows, so does the pattern library — and the model maintains consistency naturally without explicit formatting rules being re-stated every run.

This is a meaningful property for any AI automation pipeline: the longer a cron has been running, the more stable its output format becomes. Prior outputs act as living examples, not just data.

## What Actually Made This Scale

Three things made 197 tool calls across three completely different domains produce usable output in a single day.

**Lane-based parallelism.** Research tasks that look sequential often aren't. Segmenting 25 platforms into parallel Agent lanes means the bottleneck is the slowest lane, not the sum of all lanes. The structure matters more than the raw call count.

**Fault-tolerant prompting.** "Record it as blocked and continue" isn't a nice-to-have — it's what separates a session that survives partial failures from one that stalls. The Overloaded API error and the buffered WebSearch output would both have looked like hard failures without this approach.

**Context chaining across sessions.** Cron jobs that reference prior outputs don't need re-explained schemas. The format is implicit in the example. This reduces prompt complexity and increases output consistency over time.

The 37 minutes for Session 5 is what live web verification costs at this scale. That's the honest number for 25+ platforms with primary source confirmation. The tradeoff is worth it when the alternative is citing policies that have since changed.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
