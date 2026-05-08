---
title: "Building a Daily Ad-Monitoring Agent: How Claude Code Caught Naver's AI Briefing Beta in 24 Hours"
project: "portfolio-site"
date: 2026-05-09
lang: en
pair: "2026-05-09-portfolio-site-ko"
tags: [claude-code, multi-agent, dental-ads, naver-ads, automation, research]
description: "Daily dental ad monitoring agent built with Claude Code. URL-pinned sources + 4-agent parallel dispatch caught Naver's AI Briefing beta in 24 hours."
---

Naver launched its AI Briefing ad beta on May 7, 2026. By May 8 — before my client briefing that morning — I had a detailed report on the initial scope, the ADVoost integration, and the healthcare vertical roadmap. Not because I happened to see a newsletter, but because a daily monitoring agent built with Claude Code had already fetched the official announcement and graded the evidence.

This is a breakdown of how that system works, what broke during the build, and what 6 sessions and 102 tool calls tell you about designing reliable multi-agent research pipelines.

**TL;DR:** Pin official source URLs directly in your agent goal file instead of relying on `WebSearch` keywords. Combine with 4-agent parallel dispatch and a 5-tier evidence grading system. When a session crashes, file-based intermediate state means zero re-research. 6 sessions, 102 tool calls, 8 files created, 0 modified.

## The Context That Makes This Problem Hard

Dental advertising in Korea sits at the intersection of three overlapping regulatory frameworks: Naver's ad platform policies, the Korean Medical Advertising Act (의료법), and the Korean Dental Association's review guidelines. A practitioner who acts on a misread source about policy changes doesn't just get a bad report — they potentially make a compliance decision based on wrong information.

This is the forcing function for the architecture. "Generic research agent" isn't good enough. The system needs to distinguish between what's officially confirmed, what's inferred from documentation, and what's only observed in practitioner communities. That distinction matters legally and practically.

So when I say "daily monitoring agent," I mean an agent that:
1. Checks official platform sources directly via URL
2. Separates findings by credibility tier
3. Produces reports a compliance-aware client can safely act on

## Why "Let the Agent Figure It Out" Breaks for Policy Monitoring

The first instinct with WebSearch-based agents is to trust the model to surface what's relevant. You give it a topic and it searches, reads, synthesizes. This works fine for general knowledge. It breaks for platform policy monitoring.

Query "Naver ad algorithm changes" via `WebSearch` and you get: SEO agency blog posts interpreting last year's changes, community forum speculation, marketing copy from ad tech vendors claiming Naver compatibility — and occasionally, an actual official source buried mid-page. Official announcement pages (`ads.naver.com/notice`) don't have aggressive SEO. SEO agency analysis posts do. `WebSearch` naturally surfaces the latter.

The fix: tell the agent exactly where to look.

`medical_dental_ads_daily_goal.md` maintains a hard-coded URL list for direct `WebFetch` calls:

```
Required direct-fetch sources:
- Naver Ads Notice Board:    https://ads.naver.com/notice?categoryId=147
- Naver Ads Help Center:     https://ads.naver.com/help
- Naver Search Advisor:      https://searchadvisor.naver.com/
- Smart Place Help:          (section-specific URL)
- KDA Ad Review Board:       https://www.dentalad.or.kr
```

With this list, every agent run includes direct `WebFetch` calls to these endpoints regardless of what `WebSearch` returns. In session 6, the breakdown was `WebSearch(9)` + `WebFetch(6)`. That combination is intentional — `WebSearch` provides keyword coverage for things not on the official URL list; `WebFetch` provides authoritative retrieval for things that are.

Result on 2026-05-08: Naver AI Briefing ad beta confirmed as launched 2026-05-07. Scope: Shopping Search Ads integration via ADVoost, placement below AI answer blocks. Healthcare vertical on roadmap for later in 2026. Direct medical keyword applicability: `[needs verification]` — that specific detail wasn't confirmed in any fetched official source.

## 4 Agents in Parallel: Why Independence Matters More Than Speed

The naive multi-agent approach is sequential: research topic A, then B, then C. Each agent waits for the previous one to finish. This is safe but slow, and it has a subtler problem: later agents tend to read the outputs of earlier agents. One agent's framing infects the rest.

Session 1 used the `research` skill to dispatch 4 agents simultaneously in a single message:

```
Agent 1: Official source extraction
  → Pull raw text from Search Advisor, ads.naver.com notices
  → Log exact timestamps of each announcement found

Agent 2: Organic search and Place ranking shifts
  → Community forums, practitioner groups, SEO observation posts
  → Flag anything without a verifiable official source

Agent 3: ADVoost matching logic analysis
  → Focus on ad-matching and auction behavior changes
  → Cross-reference with official API docs where available

Agent 4: Dental/healthcare compliance angle
  → How do identified changes interact with medical advertising law?
  → What needs action vs. monitoring?
```

Each prompt included: the required source URL list, an instruction to flag findings that overlap with sibling agents, and a strict citation requirement. No source = no inclusion in the output.

Why does independence matter more than speed? Each agent formed its conclusions without reading the others. When synthesis later revealed that Agents 1 and 2 had contradictory assessments of a Place ranking change, that contradiction was a signal to investigate — not an artifact to smooth over. With sequential agents reading each other's output, the second agent would have deferred to the first. The error would have been invisible.

Wall-clock time: 21 minutes for 4 complete research files. Sequential would have been 80+ minutes. But the speed argument is secondary to the bias isolation argument.

## Evidence Grading: The Step That Made the Report Safe to Use

After merging 4 agent outputs, the first draft synthesis had a problem. "2026-05 Place Ad Policy Update" appeared as a stated fact. Checking `naver_ads_notice_extracts.json` — 15 entries scraped from official sources — that claim wasn't there. Not as an inference, not as a qualified observation. Just missing.

In healthcare ad consulting, an unverified "policy update" stated as fact isn't a minor editorial problem. If a client adjusts their ad strategy based on it, the agency is accountable.

Session 2 produced `claude_synthesis_review.md` with a mandatory 5-tier evidence grading system applied across the entire report:

```
Tier 1 — Official Confirmed
  Only what's explicitly stated in official Naver notices or policy documents.
  No inference, no extrapolation.

Tier 2 — Help Doc Inference
  Conclusions reasonably derivable from official help documentation.
  Cites specific section of the source doc.

Tier 3 — Industry Observed
  Changes seen in practitioner communities or SEO industry observation.
  No official source. Clearly labeled as observation, not confirmation.

Tier 4 — Reasonable Inference
  Logical reasoning from official data (e.g., "If X changed and Y depends on X...").
  Still labeled as inference.

Tier 5 — Needs Verification
  Missing source or unconfirmed claim. Find a source or remove it.
```

The Naver AI Briefing beta launch: Tier 1. Official announcement URL, timestamped.

Place ranking behavior for organic search: Tier 3 at best. Naver doesn't publish ranking factors publicly. Community observations stay at community observation level.

Medical keyword direct applicability: Tier 5. The announcement didn't address healthcare. It stays `[needs verification]` until Naver publishes a healthcare-specific notice.

Session 2 cost: 5 minutes. `Read(4)`, `Bash(4)`, `Write(2)`, `Grep(1)`. The output was a materially different report — not in content, but in what the reader could safely act on.

## API Overload, Zero Work Lost

Session 3 hit `API Error: Overloaded` partway through HTML report generation. Opus 4.7 plus parallel agent calls had exceeded the rate limit. Session terminated.

Zero work was lost.

`research-minutes.md` — session 1 dispatch summary — already on disk.
`claude_naver_research_report.md` — session 2 synthesis draft — already on disk.
`naver_ads_notice_extracts.json` — 15 raw official notice entries — already on disk.

Session 4 opened those files and picked up from synthesis to HTML generation. No re-fetching. No reconstructing what was found.

This is why file-based intermediate state is non-negotiable for multi-session agent work. API rate limits, context window overflow, manual interruptions — any of these can end a session. If the agent holds state only in memory, everything from that session disappears. The pattern: every meaningful intermediate output gets written to a named file before the next stage starts. Recoverable naming matters too — `naver_ads_notice_extracts.json` is more recoverable than `temp.json`.

Session 4's HTML report: 40.9KB, 429 lines. The 15 Bash calls in that session were validation: tag balance, DOCTYPE presence, viewport meta, section completeness — verified by script after each Write, not manual review.

## Three Versions of the Report Is Not Rework

Three distinct HTML reports by session 6:

**Version 1:** `naver_algorithm_ad_agency_prediction_report_2026-05-08.html`
Broad algorithm change history + agency prediction model.
Scope: comprehensive. Audience: internal reference.

**Version 2:** Same-day revision — "last 6 months, key changes only"
Condensed to 6-month window, removed historical context.
Scope: condensed. Audience: client-facing briefing.

**Version 3:** `2026-05-08-daily-update.md` + daily HTML
Today's monitoring results only.
Scope: daily snapshot. Audience: automated report output.

Three files, not three failed attempts. The requirement evolved: from "comprehensive history" to "agency forecast" to "daily snapshot." Each version built on the same underlying research without repeating data collection. Previous versions weren't deleted — they serve as comparison baseline for version review: when checking whether the final output matches the stated scope, having the progression shows the iteration, not just the end state.

## The Full Stats

6 sessions, 102 tool calls total:

| Tool | Calls |
|------|-------|
| Bash | 29 |
| Read | 28 |
| Write | 9 |
| WebSearch | 9 |
| Agent | 8 |
| WebFetch | 6 |
| Grep | 5 |
| TodoWrite | 3 |

8 files created. 0 files modified. Every output is a new file — overwriting destroys the version history that makes comparison possible.

The three systems that made this work: URL-pinned source list in the agent goal file, 4-agent parallel dispatch with independent scoping, enforced 5-tier evidence grading. Remove URL pinning and `WebSearch` drifts toward lower-quality sources. Remove parallel dispatch and agent bias propagates through the full output. Remove evidence grading and the report becomes unsafe to use in a compliance context.

None of them were optional.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
