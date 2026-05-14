---
title: "6 Reads, 0 Writes: Claude Opus 4.7 as a Compliance Gate for Medical Ad Content"
project: "portfolio-site"
date: 2026-05-15
lang: en
pair: "2026-05-15-portfolio-site-ko"
tags: [claude-code, compliance, dental-ads, qa, audit]
description: "How I use Claude Opus 4.7 as a read-only compliance auditor for dental ad research — 6 files, 4 blocking criteria, zero issues found."
---

Six tool calls. Zero file changes. Full QA pass in under a minute.

That's the complete log from today's Claude Code session. No code written, no edits made — just Claude Opus 4.7 reading through six dental advertising research files and confirming: nothing blocks deployment.

It looked like the quietest session of the week. It might have been the most important one.

**TL;DR:** Running Opus 4.7 as a read-only compliance auditor is faster and more consistent than manual review. Six files checked against four blocking criteria, one minute to run, same checklist every session. Today: zero blocking issues.

## Why Six Files Need a Gate Before Deployment

The dental ad research workflow I've built generates six files every day. These aren't just data dumps — they feed into published content, client reports, and advertising copy.

Here's what updates each day:

- `research/daily-medical-dental-ads/2026-05-14-daily-update.md` — the day's SERP observations, keyword rankings, competitive positioning
- `rolling-knowledge-base.md` — the cumulative record of everything observed over weeks
- `source-index.md` — links and sources backing every claim
- `competitive-serp-observations.md` — what competitors are doing in search
- `naver-ranking-hypotheses.md` — current theories about Naver's ranking algorithm for medical queries
- An HTML summary report — the human-readable version that gets shared

All six update together and are meant to be consistent with each other. Inconsistencies aren't just sloppy — they can lead to contradictory content going out, or worse, compliance violations that slip through because no single reviewer had all six files open at the same time.

The core compliance concern here is South Korean medical advertising law (의료광고법). The relevant rule: research and analysis content cannot expose identifiable information about specific medical providers. A label like `"강남 치과 추천"` (Gangnam dental recommendation) is a search keyword and is fine. A label like `"강남역 ○○치과의원"` (a specific named clinic at Gangnam station) is an identifiable provider reference and can create legal exposure.

In practice, the line between these two isn't always obvious from the data. SERP research involves collecting what shows up in search results — including clinic names that appear in those results. The question is whether that information becomes embedded in labels, claims, or report elements in a way that crosses the line.

That judgment call has to happen before anything deploys. And it has to happen consistently, not just on the days when the human reviewer is paying close attention.

## The Four Blocking Criteria

I've standardized four blocking criteria for this workflow. A file set passes only if all four are clear.

**1. Hospital/address leakage in the HTML report**

The HTML report uses keyword-form labels as section headers. The check: are those labels still keyword-form, or have any clinic names or addresses crept in?

This is more subtle than it sounds. A label that starts as `"청담 라미네이트 가격"` (Cheongdam laminate price) might drift to include a specific clinic's name if the researcher adds examples directly from SERP results. The audit checks every label and section header in the HTML file for identifiable provider information.

**2. Contradictions between daily update and rolling knowledge base**

The daily update reflects what was observed on a specific date. The rolling knowledge base aggregates observations over time. These should be consistent — if today says the Cheongdam laminate keyword shows zero place listings, the rolling knowledge base should either agree or have an explicit update explaining the discrepancy.

Unresolved contradictions undermine the integrity of the research and can lead to conflicting claims appearing in different pieces of content derived from this research.

**3. Missing required labels in SERP pattern tracking**

Every sample keyword in the dataset requires a label identifying its SERP pattern — e.g., "Place-dominant," "Organic-dominant," "Mixed." These labels drive downstream analysis. If a keyword entry is missing its label, any analysis based on it is unreliable.

The check: scan all ten sample keyword entries for the required label field.

**4. Unsupported claims in the ranking hypotheses file**

`naver-ranking-hypotheses.md` is where informed speculation lives. It's supposed to contain hypotheses — statements plausible given the data, not yet confirmed. The compliance risk is when hypothesis language drifts into definitive claims: "Naver ranks X above Y because of Z" stated as fact.

The check: look for sentences that assert facts about ranking behavior without citing supporting data.

## The Prompt Structure That Makes This Work

Getting a useful compliance audit out of Claude isn't about the model's raw capability — it's about constraining the scope of the output.

The prompt I used:

```
Read the updated daily research files for 2026-05-14 and review for blocking issues only:
contradictions, missing required labels, unsupported claims,
or specific hospital/address leakage in the HTML report.
Return OK if no blocking issues, otherwise list exact fixes.
```

Three things matter here.

**"Blocking issues only"** — Without this constraint, Claude finds everything worth improving: structure suggestions, phrasing refinements, data points that could use more citation. That feedback is real, but it's not what a deployment gate needs. The gate's job is to stop bad content from going out, not to improve content that's already good enough.

**Explicit output format** — "Return OK if no blocking issues, otherwise list exact fixes." This forces a binary verdict. The output is either `OK` or a list of specific, actionable items. No ambiguous middle ground. No "there might be some concerns worth considering." Clear enough to act on immediately.

**"Exact fixes" not "considerations"** — If there are problems, I need to know specifically what to change. "The hospital name in section 3 of the HTML report should be changed to a keyword-form label" is actionable. "The HTML report may have some compliance concerns" is not.

This prompt pattern applies to any compliance gate: define the blocking criteria explicitly, constrain scope to blocking-only, demand a binary verdict with specific fixes if needed.

## What the Audit Actually Found

Opus 4.7 read all six files in sequence.

**Hospital/address leakage**: All labels in the HTML report were keyword-form. The Cheongdam sections used `"청담 라미네이트"` and `"청담 교정"` — search category terms, not clinic identifiers. No clinic names, no doctor names, no addresses. Pass.

**Contradictions**: The daily update and rolling knowledge base agreed on all key patterns. The Cheongdam laminate keyword continued to show zero place listings in direct SERP, six results through external platforms (booking sites, review aggregators). Matched existing knowledge base entries. Pass.

**Missing labels**: Ten sample keywords, all present with SERP pattern labels. No unlabeled entries. Pass.

**Unsupported claims**: The ranking hypotheses file contained active hypotheses framed as hypotheses — "current hypothesis: X appears to be the case based on Y observations" — not as definitive claims. No unsupported assertions. Pass.

Final verdict: `OK — no blocking issues found`.

## The Tool Call Log Tells a Different Story

| Tool | Count |
|------|-------|
| Read | 6 |
| Edit | 0 |
| Write | 0 |
| Bash | 0 |

Six tool calls. No file changes. By raw output metrics, this session looks like nothing happened. That framing is wrong.

**Time saved**: A human reading six files carefully — cross-referencing the daily update against the rolling knowledge base, scanning the full HTML report for label drift, checking all four blocking criteria — takes 20-30 minutes at minimum. Repeat five days a week and it's 1.5-2 hours of weekly review time. Claude does it in under a minute.

**Consistency**: Human review quality varies. On a Tuesday morning after a good night's sleep, you catch everything. On a Friday afternoon, you skim. Your internal checklist drifts. Something that you'd flag one day slides past on another because it *seems similar* to patterns you've seen before. Claude's checklist doesn't drift.

**The ambiguity of silence**: This is the one that matters most. When a person reviews files and doesn't raise issues, there's no record of what was actually checked. Did they review all six files? Did they check for hospital name leakage specifically, or just do a general read? If a problem surfaces later, there's no audit trail.

When Claude returns `OK — no blocking issues found`, that's timestamped, explicit, and based on a documented checklist. The audit happened. The criteria were applied. The verdict is on record. That's a deployment gate with a paper trail.

## Why This Task Requires Opus 4.7

I default to smaller models for simpler tasks. This isn't one of them.

The central judgment in this audit — distinguishing keyword-form labels from specific clinic identifiers — requires contextual understanding that smaller models handle less reliably.

Consider the distinction:
- `"강남 치과 추천"` = a search query, a category of providers, no specific entity identified
- `"강남역 ○○치과의원 임플란트"` = a specific named clinic at a specific location, identifiable entity

Both appear in SERP research data. Both contain dental keywords. The difference lives in the semantics of Korean medical naming conventions and the structure of Naver's SERP results — context that requires sophistication to parse reliably.

Smaller models exhibit two failure patterns here:

**Over-flagging**: The model treats any label containing a neighborhood name and service type as a potential clinic identifier. `"청담 라미네이트"` gets flagged even though it's a search category. False positives slow the workflow and erode trust in the audit.

**Under-flagging**: The model misses a clinic name embedded in an otherwise keyword-adjacent phrase. `"청담 ○○ 치과 라미네이트 비교"` might pass because the surrounding phrase looks like a search query. False negatives mean compliance violations go out.

Either error is a problem. Compliance gates are not where you optimize for cost. The audit runs once a day. Opus 4.7 handles the judgment correctly and consistently. Given the stakes, that reliability is non-negotiable.

## Building This Into the Workflow

This read-only audit pattern is becoming a regular part of how I use Claude Code. It applies anywhere you have:

1. Content generated automatically at volume
2. A defined set of criteria that must be met before deployment
3. Criteria that require judgment, not just string matching

Pure string matching — checking for specific words or patterns — doesn't need an LLM. A grep handles that. What Claude brings is judgment: is this a keyword or a clinic name? Is this claim supported by the cited data? Does this hypothesis statement cross into definitive assertion territory?

The operational pattern:

1. Define the blocking criteria explicitly (not improvement criteria — *blocking* criteria)
2. Write the prompt to elicit a binary verdict: OK or list of exact fixes
3. Pick a model capable of the relevant judgment calls
4. Run after every batch update, before deployment

The session logs become an audit trail. Over time, you can see whether specific criteria are catching issues frequently — which might indicate a problem with the generation step that should be addressed upstream.

## What Read-Only Sessions Are Actually For

Code generation gets most of the attention in AI-assisted development. But the verification step is at least as important, and currently underserved.

The workflows I've built generate research, copy, and reports at a volume I couldn't match manually. The natural next step is that AI also verifies what it generates — not as a self-review (obvious limitations), but as a structured audit against explicit criteria.

The key constraint: the verification step needs a tight scope. An AI asked to "review this content and suggest improvements" will find improvements everywhere. That's not the job. The job is: does this content clear the bar? Binary. Bar defined by blocking criteria. Everything else deferred.

When the verification comes back OK, that's not nothing. That's a deployment gate with a traceable record. The content was reviewed, the criteria were applied, no blocking issues were found. That matters for compliance, for quality assurance, and for the confidence to push content at volume without a human reading every file every day.

Today's session: six reads, zero writes, one `OK`. That's a good session.

---

*tool calls: 6 (Read×6) · files modified: 0 · model: claude-opus-4-7*

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
