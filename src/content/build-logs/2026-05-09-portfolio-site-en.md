---
title: "25 Tool Calls in 5 Minutes: How Claude Opus 4.7 Caught Two Dental Ad Policy Changes"
project: "portfolio-site"
date: 2026-05-09
lang: en
pair: "2026-05-09-portfolio-site-ko"
tags: [claude-code, automation, dental-ads, research-agent, opus]
description: "A daily research agent built with Claude Opus 4.7 detected two Naver ad policy changes — Place Ads display increase and a new conversion metric — in a single 25-tool-call session."
---

Medical and dental ad research is tedious. You read official notices, watch SERPs, update hypotheses, and fold everything into a rolling knowledge base. Every day. So I built a daily research agent with Claude Code.

**TL;DR** One session, five minutes, 25 tool calls. Detected the 5/14 Place Ads display count increase and the 5/13 new conversion metric addition, then auto-updated four files.

## The Prompt That Drives It

One large system prompt handles everything: role definition, output file list, source data paths, and labeling rules — all in a single block.

```
You are a medical/dental advertising daily research agent. Read the following files
and generate/update the 2026-05-09 daily update draft.
Always apply labeling (official confirmed / official help-based interpretation /
public SERP observation / industry observation / reasonable inference /
needs verification / unconfirmed figure / high-spend estimate).
Pattern-generalize specific clinic names in final summaries.

Files to update:
- research/daily-medical-dental-ads/2026-05-09-daily-update.md
- rolling-knowledge-base.md
- source-index.md
- competitive-serp-observations.md
- naver-ranking-hypotheses.md

Source data:
- research/daily-medical-dental-ads/raw-2026-05-09.json
- research/daily-medical-dental-ads/naver-notice-details-2026-05-09.json
```

The key design decision: **explicitly list output files**. The agent never has to guess what to write. Input (raw JSON) → processing (analysis + labeling) → output (named files) — the entire pipeline lives inside the prompt.

## Two Signals, Five Minutes

`claude-opus-4-7` read `raw-2026-05-09.json` and `naver-notice-details-2026-05-09.json`, then surfaced the two material changes.

**Signal 1 — Place Ads display count increase starting 5/14**  
An official notice applying to all business categories including clinics. Place Ads are a critical channel for location-based dental marketing, so this went straight into `rolling-knowledge-base.md`.

**Signal 2 — New "Purchase Completion ROAS (%)" conversion metric added to search ads starting 5/13**  
Power Content and Place campaigns are excluded. This is a new metric with direct implications for dental search ad optimization.

The agent didn't stop at reading the notices. It connected the changes to existing hypotheses in `naver-ranking-hypotheses.md` and updated how those earlier observations should now be interpreted — a diff of understanding, not just a diff of facts.

## 8 SERP Observations with Labels

Eight SERP observations were added to `competitive-serp-observations.md` that day. The agent applied the labeling rules to each one, tagging the source type explicitly.

In the medical advertising space, vague language like "the algorithm seems to have changed" is a compliance risk. Without labels, six months of accumulated observations become a useless mix of facts and speculation.

- `[official confirmed]` — only what appears in an official ad notice
- `[public SERP observation]` — directly verified by search
- `[reasonable inference]` — inferred from official sources
- `[needs verification]` — no official backing

Natural search and Place general ranking fall under Naver's non-disclosure policy, so they cannot be elevated beyond `[public SERP observation]`. This rule has to live in the prompt — the agent won't self-impose it.

## Tool Call Breakdown

| Tool | Count | Purpose |
|------|-------|---------|
| Edit | 8 | Partial updates to existing files |
| Bash | 7 | Path verification, directory navigation |
| Read | 6 | Raw JSON + existing markdown |
| Write | 1 | New `2026-05-09-daily-update.md` |
| TodoWrite | 2 | Task checklist management |
| ToolSearch | 1 | Available tool discovery |

Seven Bash calls stands out. The research directory structure is deeply nested, so the agent frequently verified paths. Providing absolute paths in the prompt would cut this down.

## Why the Structure Holds

The daily research agent runs reliably because its inputs are structured. Raw data drops as JSON; the agent reads it and produces markdown. That's the whole loop.

"Search the internet for news" gives different results every time. "Read this JSON file and write to this file" is reproducible.

`rolling-knowledge-base.md` is what makes this compound over time. Each daily update layers new signals onto existing context. The result isn't a one-off analysis — it's a time-series you can actually reason from.

---

*Session summary — Model: claude-opus-4-7 | Time: 5 min | Tool calls: 25 | Modified: 3 files, Created: 1 file*

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
