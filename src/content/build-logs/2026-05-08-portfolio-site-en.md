---
title: "4 Parallel Agents, 102 Tool Calls: Reverse-Engineering Naver's Ad Algorithm for Dental Clients"
project: "portfolio-site"
date: 2026-05-08
lang: en
pair: "2026-05-08-portfolio-site-ko"
tags: [claude-code, parallel-agents, research, automation, naver-ads]
description: "6 sessions, 102 tool calls: how 4 parallel Claude Code agents analyzed 17 Naver ad notices, enforced 5-tier evidence grading, and caught the AI Briefing ad beta live."
---

A dental client asked: "Naver feels different lately — did the algorithm change?" That question came in from multiple clients after the ADVoost rollout. "Probably changed" isn't an answer. I needed evidence-backed analysis, not vibes.

**TL;DR:** Used the `research` skill to dispatch 4 agents in parallel, analyzed 17 Naver ad notices across 6 sessions, classified all findings into a 5-tier evidence framework, auto-generated a medical advertising compliance HTML report, and caught the Naver AI Briefing ad beta launch in real time — 102 tool calls total.

## Why 4 Agents Instead of 1

Session 1 was the core. Covering Naver Search, Place, and ad algorithm changes simultaneously requires breadth a single agent can't deliver — one angle goes deep while the rest stay shallow. The `research` skill decomposes the question into 4 independent angles:

1. **Official announcement verification** — crawling the Naver Ads notice board
2. **Organic search & Place ranking signal changes** — community + industry observation
3. **ADVoost matching logic analysis**
4. **Healthcare/dental vertical-specific rules**

Each agent prompt included: "source URL required, flag overlap with sibling agents." The skill generates a scaffold like this:

```
You are Research Agent #2. Your angle: organic search / Place ranking.
- Use WebSearch + WebFetch aggressively
- Return under 1500 words in markdown
- Source URLs required
- Flag any domain overlap with sibling agents
```

All 4 `Agent` calls went out in a single message. Work that would've taken 80 minutes sequentially finished in 21.

Session 1 tool breakdown: `Agent(8)`, `Read(5)`, `Bash(4)`, `TodoWrite(3)`, `Write(2)`.

## Evidence Grading: What Codex Caught

Merging 4 agent outputs surfaced a problem immediately: official announcements and community observations were mixed together. In medical advertising, claiming "algorithm changed" without official confirmation is a compliance risk.

That's why Session 2 created a standalone synthesis review (`claude_synthesis_review.md`). Using 15 notices from `naver_ads_notice_extracts.json` as the ground truth, all findings were split into 5 tiers:

```
CONFIRMED      → explicitly stated in Naver Ads notices
               (broad match, ADVoost, medical content rules, Place ad test)
INFERRED       → reasonably deducible from official help docs
OBSERVED       → community/practitioner reports, no official notice
EXTRAPOLATED   → logical reasoning from confirmed data
UNVERIFIED     → no source or unconfirmed claim
```

Codex cross-check caught one issue: the 2026-05 Place ad rollout notice was missing from the extracted JSON. That item was immediately downgraded to UNVERIFIED. This is exactly why independent verification matters — research outputs need a second pass before they go near a client brief.

Session 2 tool breakdown: `Read(4)`, `Bash(4)`, `Write(2)`, `Grep(1)`. Total time: 5 minutes.

## 5 Source Files → 40.9KB HTML Report

The HTML report was built from 5 source files:

- `integrated_naver_change_report_draft.md`
- `claude_synthesis_review.md`
- `codex_crosscheck_review.md`
- `research-minutes.md`
- `naver_ads_notice_extracts.json`

Session 3 hit a model overload error before finishing the Write. Session 4 completed it. Report structure:

- §1 Key conclusions + medical advertising safety box (pinned to top)
- §2 Evidence tier legend (5-tier visualization)
- §3 Objective data — metric cards from 17 notices
- §4 Organic search & Place observations
- §5 Ad agency impact forecast
- §7 Dongbaek pilot program

Result: 40.9KB, 429 lines. `Bash` had the highest call count (15) because each Write was followed by script-based validation: tag balance, DOCTYPE presence, viewport meta, section existence.

Session 4 tool breakdown: `Bash(15)`, `Read(6)`, `Grep(4)`, `Glob(1)`, `Write(1)`.

## Real-Time Discovery: Naver AI Briefing Ad Beta

Session 6 produced an unexpected result. While running the daily research agent (`medical_dental_ads_daily_goal.md`) through official sources, one hit fired.

**2026-05-07 — Naver launched the "AI Briefing" ad beta.**

Confirmed via `WebSearch(9)` + `WebFetch(6)`:

- Phase 1 targets: Shopping search ads + ADVoost integration
- Placement: below AI-generated answer summaries
- Healthcare vertical AI: on the roadmap for this calendar year
- Medical keyword applicability: [UNVERIFIED]

This went into the client briefing the same day. Without the daily agent, it would've surfaced days later, if at all.

## Full Stats: 6 Sessions, 102 Tool Calls

| Tool | Calls | Primary use |
|------|-------|-------------|
| Bash | 29 | File validation, state updates |
| Read | 28 | Reading source files |
| Write | 9 | Generating output files |
| WebSearch | 9 | Official source discovery |
| Agent | 8 | Parallel research dispatch |
| WebFetch | 6 | Notice page crawling |
| Grep | 5 | Keyword validation |
| TodoWrite | 3 | Step tracking |

8 files created, 0 modified. All new outputs.

## What This Reinforced

**Parallel agents solve breadth problems.** 4 simultaneous agents with distinct angles produced faster, more balanced coverage than 4 sequential runs of the same agent. Each angle had a dedicated agent — blind spots shrunk.

**Evidence grading has to be an explicit step.** Without a dedicated classification pass, official facts and community observations blend together. Running this as a separate session was the right call. The Codex cross-check caught the unverified claim during that process.

**Daily agents eliminate information lag.** Define "what to check" in `medical_dental_ads_daily_goal.md` once, and the agent cycles through official sources detecting changes as they happen. The AI Briefing beta discovery came from this setup.

**File-based state means sessions can fail safely.** Session 1 hit `API Error: Overloaded`, but the already-generated `research-minutes.md` let Session 2 pick up without data loss. This is the practical payoff of managing workflow state in files rather than in-memory.

<details>
<summary>Generated files</summary>

- `claude_naver_research_report.md` — Integrated research report
- `research-minutes.md` — 4-agent consensus, conflicts, and unverified items log
- `claude_synthesis_review.md` — Evidence tier classification review
- `naver_algorithm_ad_agency_prediction_report_2026-05-08.html` — Agency impact forecast (40.9KB)
- `naver_latest_6months_dental_ads_strategy_report_2026-05-08.html` — 6-month focused report
- `2026-05-08-daily-update.md` — Daily update
- `2026-05-08-naver-ai-briefing-and-medical-ad-enforcement.html` — AI Briefing analysis
- `rolling-knowledge-base.md` — Accumulated knowledge base

</details>

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
