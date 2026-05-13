---
title: "Dental Ad Research QC with Claude Code: 6 Reads, Zero Blocking Issues"
project: "portfolio-site"
date: 2026-05-14
lang: en
pair: "2026-05-14-portfolio-site-ko"
tags: [claude-code, dental-ads, qa, research, claude-opus]
description: "How I QC'd six dental ad research files with Claude Code — checking for hospital name leaks, contradictions, and missing labels. Zero blocking issues."
---

One exposed hospital name in an HTML report is a Korean Medical Law violation. That single constraint shapes every QC step in my dental ad research automation pipeline.

**TL;DR**: Six Read tool calls covered all six research files. No hospital name or address leakage, no contradictions, no missing labels — zero blocking issues. Report ships tomorrow.

## What Gets Checked — and Why It Matters

My pipeline tracks Naver Place, blog, and SERP patterns for dental advertising clients. It runs daily and auto-generates research files. The problem: any output that lands in an HTML report could be surfaced to clients or flow into downstream tooling. If a specific clinic name slips into that report, it's a compliance issue under Korean Medical Law — not just a data quality problem.

Today's QC covered six files updated for 2026-05-14:

- `research/daily-medical-dental-ads/2026-05-14-daily-update.md`
- `rolling-knowledge-base.md`
- `source-index.md`
- `competitive-serp-observations.md`
- `naver-ranking-hypotheses.md`
- `reports/2026-05-14-place-ad-application-day-serp-pattern.html`

Four criteria drove the check:

1. **Contradictions** — does anything in the daily update conflict with the established knowledge base?
2. **Missing required labels** — are all observations tagged with source type, date, and confidence level?
3. **Unsupported claims** — any assertions without a linked observation or source?
4. **Hospital/address leakage** — does the HTML report contain any specific clinic name, address, or doctor name?

## One Prompt, Full Coverage

I passed all six file paths to Claude Opus 4.7 with a deliberately narrow instruction:

```
Read the updated daily research files for 2026-05-14 and review for blocking issues only:
contradictions, missing required labels, unsupported claims,
or specific hospital/address leakage in the HTML report.
Return OK if no blocking issues, otherwise list exact fixes.
```

The key phrase is "blocking issues only." No improvement suggestions, no style comments, no recommendations. The purpose of this QC is to make a deployment decision — not to do a code review. Narrow prompts produce sharp results. Six Read calls later, all files were verified. No exploratory reads, no retries — exactly the six files, in order.

## What the Verification Actually Found

**Hospital leakage check**: The HTML report uses search query labels throughout — things like "Gangnam dental" or "Cheongdam laminate" — not clinic-specific identifiers. No `OO치과의원`, no addresses, no doctor names. The pipeline was designed from the start to use keyword labels rather than entity names, so this held cleanly.

The critical distinction is subtle in context: "Gangnam dental" is a search keyword. "Gangnam Yonsei Dental Clinic" is a hospital name. Surrounded by SERP data and observation notes, that line can blur. The HTML report stayed on the right side of it throughout.

**One interesting data point from the contradiction check**: In a 10-sample observation for the Cheongdam laminate query, Naver Place returned zero results. External platforms returned six. This isn't a contradiction — it's an actual SERP pattern difference, recorded as such. It supports the hypothesis that Naver Place ad exposure and external platform exposure move independently. The knowledge base already had this as an open hypothesis; the daily update added a confirming data point rather than conflicting with it.

**Labels and sourcing**: Every entry had a source link or observation record attached. No unsupported claims found.

## Tool Usage

| Tool | Calls |
|------|-------|
| Read | 6 |
| **Total** | **6** |

Edit: 0. Write: 0. Bash: 0. Pure verification session.

## Why Opus for QC

Speed isn't the constraint here — accuracy is. The keyword-vs-clinic-name distinction is obvious in isolation. In context, surrounded by SERP data and observation notes, it requires careful reading of the full document, not just a pattern match.

Missing that distinction once costs more than any model pricing difference. Opus handles the final blocking-issue determination; Sonnet or Haiku handles plenty of other steps in the pipeline — data collection, summarization, formatting. But the compliance-adjacent verdict stays with the most capable model available. The asymmetry in risk justifies the asymmetry in model choice.

## Why a 6-Tool-Call Session Gets a Build Log

Zero files changed. Six reads. This looks like a session worth skipping in a log.

But "nothing happened" and "verified nothing was wrong" are different outcomes with the same surface appearance. A QC pass record establishes *when* the pipeline was last known clean. If something breaks next week, I can trace back to exactly which files were in what state on May 14th.

In an automated pipeline, verification records matter as much as implementation records — maybe more, because implementation records tell you what was built, and verification records tell you whether it was safe to ship. The absence of blocking issues is itself a result worth recording.

Result: OK. Report ships tomorrow.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
