---
title: "25 Tool Calls, 5 Minutes: How Claude Opus 4.7 Runs My Daily Ad Intelligence Pipeline"
project: "portfolio-site"
date: 2026-05-09
lang: en
pair: "2026-05-09-portfolio-site-ko"
tags: [claude-code, automation, ai-agent, research-agent, opus]
description: "Built a daily research agent with Claude Opus 4.7 that caught two Naver ad policy changes in 5 minutes — 25 tool calls, structured JSON inputs, and a rolling knowledge base that compounds daily."
---

One Claude Code session. Five minutes. 25 tool calls. Two advertising policy changes surfaced, four files updated, zero manual reading required.

That's the result from May 9th's run of the daily dental advertising research agent I built with Claude Code. This post covers how it's structured, what the agent actually does, and why the architecture is reproducible — not just impressive once.

**TL;DR** — A daily research agent running `claude-opus-4-7` caught two material Naver ad policy changes (May 14 place ad display count increase, May 13 new ROAS conversion metric) in a single session. The key: structured JSON inputs, explicit file output lists in the prompt, and an eight-label taxonomy that keeps facts separated from inference.

## Context: Why This Domain Is Hard to Monitor

For readers outside Korea — Naver dominates Korean search with roughly 65% market share. For local businesses, Naver's advertising ecosystem is the primary paid acquisition channel: PowerLink search ads, Place map-based ads, and PowerContent placements. Dental and medical clinics are heavy users of all three.

Monitoring Naver ad policy is genuinely tedious for a few reasons:

**Policy changes are frequent and scattered.** Naver publishes official notices across multiple help center sections. Changes to Place ads, search ads, and PowerContent each have their own announcement paths. There's no unified feed.

**SERPs shift independently of policy.** The number of ads shown, the layout of map packs, and the presentation of PowerContent placements can change without a corresponding official notice — or the notice comes weeks after the SERP change is already observable.

**Medical advertising has strict compliance requirements.** Korean medical law restricts what clinics can claim in ads. Research notes that blur the line between "officially confirmed" and "we observed this on SERPs" create downstream risk if they influence ad creative or copy. The distinction has to be explicit.

The manual workflow to keep up with all of this takes 30–45 minutes per day. Multiplied across multiple clinics with different campaign mixes, it compounds quickly. A research agent that handles this mechanically — without losing epistemics — is worth building.

## The Data Pipeline Comes First

The agent only works because input is structured before it runs. Each morning, a separate collection step writes two JSON files:

- `raw-2026-05-09.json` — SERP snapshots, ad slot counts, placement observations across target keywords
- `naver-notice-details-2026-05-09.json` — parsed content from Naver's official ad notice pages

This separation matters. The agent doesn't search the internet. It reads prepared JSON. That's not a limitation — it's the constraint that makes the output reproducible.

"Search Naver for today's ad policy news" is a prompt that produces different results on different runs depending on what the model decides to search for, what gets indexed, and what shows up in its context window. "Read `raw-2026-05-09.json` and update `rolling-knowledge-base.md`" produces the same type of output every time, auditable against the source file.

The trade-off is that someone has to maintain the collection pipeline. In this case it's a lightweight script that runs before the agent. The agent's job is analysis and synthesis, not data collection.

## Prompt Architecture: Everything in One Block

The entire system prompt is one block — role definition, output file list, source data paths, and labeling rules together:

```
You are a daily medical/dental ad research agent. Read the following files and
generate/update the 2026-05-09 daily update draft.

Follow labeling rules strictly:
- [Official Confirmed] — explicitly stated in an official ad notice
- [Official Guide Interpretation] — reasoned from official help documentation
- [Public SERP Observation] — directly verified by running the search
- [Industry Observation] — from credible secondary sources
- [Reasonable Inference] — inferred from official sources, not directly stated
- [Needs Verification] — hypothesis without official or direct observational backing
- [Unconfirmed Metric] — numeric claim without an official source
- [High-Spend Estimate] — spending pattern inferred from ad placement behavior

Pattern-generalize specific clinic names in summary-level findings.

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

Three structural decisions carry most of the weight here.

**Explicit output file list.** The agent knows exactly which files to update and which to leave alone. Without this, models sometimes create new files when they should update existing ones, or touch files outside the intended scope. The list closes the input-to-output loop inside the prompt itself: source data on one side, output targets on the other, processing rules in the middle.

**Labeling taxonomy in the prompt.** The eight-label system is written out fully every time the prompt runs — not referenced from a separate config file, not assumed from prior context. This is deliberate. If the taxonomy lives in a file the agent reads separately, there are two versions of truth. If it's in the prompt, there's one. The agent applies it consistently because it has no choice.

**Pattern-generalization of clinic names.** SERP data often includes specific clinic names observed in ad placements. At the summary level (the entries that go into `rolling-knowledge-base.md`), these get abstracted into patterns: "high-budget clinic in [district]," "clinic with 4.9+ review score," rather than named directly. This is both a privacy consideration and a practical one — the knowledge base tracks behavioral patterns across the market, not a directory of specific competitors.

## Signal 1: Place Ad Display Count Increase

**Source:** Official Naver notice | **Effective date:** May 14, 2026 | **Label:** `[Official Confirmed]`

Naver announced an increase in the number of Place ads displayed per search result, applying to all business categories including medical and dental. Place ads are the map-based local placements — for geographically targeted dental marketing, they capture high-intent local searches ("dentist in Gangnam," "implant clinic near me") and are often the highest-converting channel for local clinics.

More ad slots per result cuts both ways: more competition for placement, but also opportunity for clinics currently outside the visible pack to enter it. The notice was unambiguous, so it went into `rolling-knowledge-base.md` as `[Official Confirmed]` without inference.

The more useful update was to `naver-ranking-hypotheses.md`. An existing hypothesis — that Place ad impression share correlates with review count above a certain threshold — needed to be flagged as "pending revalidation." The prior data was collected when fewer slots were shown. Whether the correlation holds at higher slot counts is now an open question. The agent made that connection automatically because both pieces of information were in its context.

## Signal 2: New Conversion Metric in Search Ads

**Source:** Official Naver notice | **Effective date:** May 13, 2026 | **Label:** `[Official Confirmed]` for existence, `[Needs Verification]` for dental-specific behavior

Naver added "Purchase Completion ROAS (%)" as a new conversion tracking metric available in search ad campaign dashboards. PowerContent and Place campaigns are explicitly excluded — this applies to search ads only.

For dental search ad optimization, this creates two immediate action items:

First, the metric is worth tracking from day one. New first-party signals from ad platforms tend to reflect what the platform is building toward. Whether "purchase completion" maps cleanly to dental conversion events (appointment bookings, consultation requests) is a question worth answering with a test campaign.

Second, the exclusion of PowerContent and Place is itself significant. It narrows where ROAS-based optimization is available and suggests these campaigns are still being developed for e-commerce-style attribution. Dental campaigns running primarily on Place ads won't have access to this metric yet.

The agent logged the metric existence as `[Official Confirmed]` and added a `[Needs Verification]` note for the dental-category attribution question — the right epistemic split given what the notice actually said.

## The Labeling System: Why It's Not Optional

`competitive-serp-observations.md` received 8 new entries that day, each tagged with a label.

This labeling system exists because knowledge bases degrade without it. An observation written six months ago as "the algorithm seems to favor clinics with more reviews" becomes indistinguishable from an official ranking factor when someone reads it cold. Six months of unlabeled observations become a liability: you can't tell which entries are solid enough to act on and which are educated guesses that were never verified.

The eight labels map directly to decision authority:

- `[Official Confirmed]` → act on it, it's stated policy
- `[Public SERP Observation]` → worth tracking, treat as a data point not a rule
- `[Reasonable Inference]` → develop into a testable hypothesis
- `[Needs Verification]` → flag for follow-up, don't operationalize yet
- `[Unconfirmed Metric]` → note the source uncertainty, treat with skepticism

Organic search ranking and Place organic ranking signals are capped at `[Public SERP Observation]` — Naver doesn't publish ranking factors, so there is no path to `[Official Confirmed]` for these. This constraint is written into the prompt explicitly. Without it, models tend to drift toward confident-sounding claims even when the evidence doesn't support them. The constraint prevents that drift.

## Tool Call Distribution

| Tool | Count | Primary Use |
|------|-------|-------------|
| Edit | 8 | Targeted updates to existing files |
| Bash | 7 | Path verification, directory traversal |
| Read | 6 | Raw JSON + existing markdown |
| Write | 1 | New `2026-05-09-daily-update.md` |
| TodoWrite | 2 | Task checklist |
| ToolSearch | 1 | Available tool inventory at session start |

The Edit/Write ratio (8:1) is intentional. The daily agent should make surgical updates to existing files — new entries appended, hypothesis status changed, items marked verified or superseded. Regenerating entire files from scratch loses the history and risks overwriting valid older entries.

Seven Bash calls is the main inefficiency. The research directory is nested several layers deep, and the agent ran `ls` and `test -f` checks frequently before writing to verify paths. Providing absolute paths in the prompt for every input and output file would cut this to 1–2 calls. That's the clearest optimization available.

ToolSearch (1 call) is the agent inventorying available tools at session start — expected behavior.

## Why This Compounds Over Time

The daily research agent isn't interesting because it runs once. It's interesting because it runs every day and the results accumulate.

`rolling-knowledge-base.md` is the load-bearing piece. Each day's update layers new signals onto the existing knowledge base. When Signal 1 (Place ad slot increase) arrived, the agent didn't just log it — it searched the existing knowledge base for related hypotheses and updated their status. That's only possible because the prior observations were already there, structured and labeled.

The compounding effect means the agent becomes more useful as the knowledge base grows. Month one, it's catching policy changes and logging SERP observations. Month three, it's identifying patterns across the time series — which hypotheses have been confirmed, which have been refuted, which are still open questions.

This is the difference between a note-taking tool and a research pipeline. The architecture is:

```
raw data (JSON)
     ↓
agent (claude-opus-4-7)
     ↓
  ┌──────────────────────────────────┐
  │  rolling-knowledge-base.md       │ ← compounding context
  │  naver-ranking-hypotheses.md     │ ← hypothesis tracking
  │  competitive-serp-observations.md│ ← labeled observations
  │  source-index.md                 │ ← citation trail
  │  2026-05-09-daily-update.md      │ ← today's summary
  └──────────────────────────────────┘
```

The rolling knowledge base feeds back into each subsequent agent run. New signals get interpreted against months of prior context. That feedback loop is what makes the agent more accurate over time rather than static.

## What I'd Change

**Absolute paths in the prompt** — eliminate the 7 Bash path-verification calls. Estimated savings: 3–4 tool calls per session.

**JSON output before markdown** — have the agent emit a structured JSON summary of changes before writing to markdown files. Creates a machine-readable audit trail and makes it easier to diff what changed between runs programmatically.

**Confidence scores on inferences** — the current label taxonomy is categorical. Adding a numeric confidence score (0–1) to `[Reasonable Inference]` entries would help prioritize which hypotheses to test next, rather than treating all inferences as equal.

**Automated validation pass** — a second lightweight agent run that reads the daily update and flags any entries where the label seems inconsistent with the evidence cited. Catches cases where the first-pass agent was overconfident.

The core architecture — structured JSON in, labeled markdown out, rolling knowledge base as context — is worth keeping. The optimizations are all operational.

---

*Session summary — Model: claude-opus-4-7 | Duration: 5 minutes | Tool calls: 25 | Modified: 3 files | Created: 1 file*

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
