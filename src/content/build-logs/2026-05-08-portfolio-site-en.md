---
title: "4 Parallel Agents, 102 Tool Calls: Automating Naver Algorithm Research with Claude Code"
project: "portfolio-site"
date: 2026-05-08
lang: en
pair: "2026-05-08-portfolio-site-ko"
tags: [claude-code, multi-agent, research, naver-ads, dental-ads]
description: "Claude Code 4-agent parallel dispatch analyzed 17 Naver ad announcements, enforced 5-tier evidence grading, and caught a live ad beta — 6 sessions, 102 tool calls."
---

Three dental ad clients asked the same question in the same week: "Naver feels different lately — did the algorithm change?" The ADVoost rollout had shifted how results behaved, and the feedback kept coming. "It seems like it changed" isn't a useful answer. 6 sessions and 102 tool calls later, I had analyzed 17 official Naver announcements and produced 3 HTML reports.

**TL;DR:** Used the `research` skill to dispatch 4 parallel agents → Codex cross-verification to isolate unconfirmed claims → iterative HTML report generation. Bonus: caught the Naver AI Briefing ad beta launch in real time, one day after it went live on 2026-05-07.

## 4 Opus Agents Simultaneously: 4 Research Angles in 21 Minutes

Single-prompt research on Naver algorithm changes doesn't work. Official announcements, industry community observations, ADVoost technical changes, dental ad practice implications — these four angles pull from different sources with different reliability levels. Mix them in one prompt and the model blends verified facts with speculation.

The `research` skill's solution: dispatch 4 agents in parallel from a single message.

```
Agent 1: Official announcement extraction & Search Advisor docs
Agent 2: Organic search & Place ranking changes (community + industry observation)
Agent 3: ADVoost matching logic analysis
Agent 4: Dental/medical ad practical implications
```

Each agent prompt required: "source URL mandatory, flag overlap with sibling agents." Once 4 independent output files landed, a separate synthesis session extracted agreements, contradictions, and unverified claims. Work that would've taken 80 minutes sequentially finished in 21.

Session 1 tool calls: `Agent(8)`, `Read(5)`, `Bash(4)`, `TodoWrite(3)`, `Write(2)`.

## The Unverified Announcement Codex Caught — Evidence Grading Introduced

The problem surfaced immediately when combining all 4 agent outputs. The first draft included a "2026-05 Place Ad policy announcement" stated as fact — but it appeared in none of the 15 entries in `naver_ads_notice_extracts.json`. In medical advertising, stating "algorithm changes" without official confirmation is a compliance liability.

Session 2 created a standalone `claude_synthesis_review.md` and enforced five evidence tiers:

```
CONFIRMED      → explicitly stated in Naver Ads notices
               (broad match, ADVoost, medical content rules, Place ad test)
INFERRED       → reasonably deducible from official help docs
OBSERVED       → community/practitioner reports, no official notice
EXTRAPOLATED   → logical reasoning from confirmed data
UNVERIFIED     → no source or unconfirmed claim
```

Organic search and general Place ranking are undisclosed by Naver policy — they couldn't be elevated above OBSERVED. Without this explicit grading step, unconfirmed claims would've made it into the client report unchanged.

Session 2 tool calls: `Read(4)`, `Bash(4)`, `Write(2)`, `Grep(1)`. Elapsed: 5 minutes.

## API Overload and Why File-Based State Management Actually Matters

Session 3 hit `API Error: Overloaded` attempting the first HTML report generation. Opus 4.7 with 8 parallel agents was too many concurrent requests.

No work was lost. `research-minutes.md` and `claude_naver_research_report.md` were already written to disk. Session 4 picked up immediately and moved straight to report generation. This is the practical payoff of file-based state management: when agents write intermediate results to files, a broken session doesn't lose context.

Session 4 produced `naver_algorithm_ad_agency_prediction_report_2026-05-08.html` — 40.9KB, 429 lines. Structure:

```
§1 Key conclusions + medical ad safety box (pinned to top)
§2 Evidence tier legend (5-level visualization)
§3 Objective data — metric cards from 17 announcements
§4 Organic search & Place observations
§5 Ad agency impact predictions
§7 Dongbaek Place Ad pilot analysis
```

Session 4 tool calls: `Bash(15)`, `Read(6)`, `Grep(4)`, `Glob(1)`, `Write(1)`. Bash ran 15 times because each Write was followed by script-based validation — tag balance, DOCTYPE presence, viewport meta, section existence.

The client then requested "last 6 months only, essentials." Session 5 produced a third version. Three HTML reports across three sessions wasn't scope creep — requirements evolved: "overall changes" → "agency impact predictions" → "last 6 months compressed."

## The Daily Agent That Caught Yesterday's AI Briefing Beta

Session 6 produced an unexpected result. Running the daily research agent defined in `medical_dental_ads_daily_goal.md`, one of the official source scans fired a hit.

**2026-05-07 — the day before — Naver launched an 'AI Briefing' ad beta.**

The key was explicit target URLs in the agent prompt:

```
- Naver Ads Notice:         https://ads.naver.com/notice?categoryId=147
- Naver Ads Help:           https://ads.naver.com/help
- Naver Search Advisor:     https://searchadvisor.naver.com/
- Korea Dental Ad Review:   https://www.dentalad.or.kr
```

Without this list, generic `WebSearch` prioritizes blog posts. Specifying URLs directly changes the source reliability floor.

`WebSearch(9)` + `WebFetch(6)` confirmed:
- Phase 1: Shopping search ads/ADVoost integration, shown below AI-generated answer summaries
- Healthcare vertical AI: explicitly on the in-year roadmap
- Medical keyword coverage: [UNVERIFIED]

Without the daily agent, this would've surfaced days later. Instead it went directly into that day's client briefing.

## Full Stats

| Tool | Calls | Primary use |
|------|-------|-------------|
| Bash | 29 | File validation, state updates |
| Read | 28 | Source file reads |
| Write | 9 | Output file generation |
| WebSearch | 9 | Official source discovery |
| Agent | 8 | Parallel research dispatch |
| WebFetch | 6 | Announcement page crawling |
| Grep | 5 | Keyword verification |
| TodoWrite | 3 | Step tracking |
| **Total** | **102** | |

8 files created, 0 files modified. Each iteration produced a new file rather than overwriting — overwriting intermediate results removes the comparison baseline for Codex cross-verification.

Parallel agents work well for breadth problems. 4 simultaneous agents outperform 4 sequential runs on both speed and coverage balance. Evidence grading has to be an explicit step — without a dedicated classification pass, verified facts and inferences merge. Moving the grading to a separate session and running Codex cross-verification measurably improved the final report quality.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
