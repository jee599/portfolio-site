---
title: "4 Parallel Claude Agents, 35 Tool Calls: Deep-Researching Naver's Algorithm Changes"
project: "portfolio-site"
date: 2026-05-08
lang: en
pair: "2026-05-08-portfolio-site-ko"
tags: [claude-code, research, multi-agent, naver, dental-ad]
description: "4 Claude Opus 4.7 agents in parallel, 35 tool calls, 2 sessions to analyze Naver search and ad algorithm changes — and what evidence discipline revealed."
---

Four Claude Opus 4.7 agents running simultaneously, all querying Naver algorithm data at the same time. That's what 21 minutes of parallel multi-agent research looks like — and what happens when the API buckles under the load.

**TL;DR** The `research` skill dispatches 4 agents in a single message. What would've taken 80+ minutes sequentially finished in 21. But speed wasn't the hard part. The real work was separating officially confirmed changes from industry observations — and Codex crosscheck caught one unverified claim that slipped through.

## Splitting a Topic Into 4 Parallel Angles

The `research` skill breaks a research question into 4 independent sub-topics and fires all agent calls in a single message. For Naver algorithm research targeting dental ad campaigns, the split looked like this:

1. **Official announcement analysis** — change history from Naver Ads official channels
2. **Organic search / Place rankings** — SEO community and practitioner observations
3. **Ad matching and metrics** — ADVoost, relevance index, expanded match changes
4. **Healthcare / dental context** — medical advertising regulations crossed with Place Ads

Each agent gets a scoped prompt skeleton:

```
You are Research Agent #2. Your angle: organic search / Place rankings.
- Use WebSearch + WebFetch aggressively
- Return markdown under 1,500 words
- Source URLs required
- Flag overlapping areas with sibling agents
```

All 4 `Agent` tool calls go out in one message. Sequential execution would've meant waiting for each agent to finish before the next starts — 80+ minutes of wall-clock time. Parallel: 21 minutes total.

The tradeoff shows up at synthesis. When 4 agents independently cover "algorithm changes," you end up with the same facts stated at different confidence levels. That tension needs explicit resolution before the report is usable.

## The API Overloaded Error (and Why It Didn't Matter)

Late in session 1, `API Error: Overloaded` hit. Running 4 Opus 4.7 agents simultaneously was enough to hit capacity limits. All 4 research results had already come back — the crash happened right at the HTML synthesis step, after the retrieval was complete.

Session 1 output: `research-minutes.md` + `claude_naver_research_report.md`, both written to disk.

Session 2 picked up at synthesis only — no repeated retrieval, no lost work. File-based state is what made this a non-event instead of a full restart.

The workflow pattern: every intermediate artifact goes to a named file before the next step starts. Session continuity doesn't depend on conversation context.

## Session 2: The Evidence Pass

Session 2 was 5 minutes, 11 tool calls. The core task was cross-validating three files:

- `integrated_naver_change_report_draft.md`
- `codex_crosscheck_review.md`
- `naver_ads_notice_extracts.json` — 15 official Naver Ads announcements extracted

Codex's review flagged a specific problem: the "May 2026 Place Ads rollout notice" appeared in the draft body but was absent from the JSON extract of actual announcements. The source didn't support the claim.

That assertion got downgraded to "needs verification" in `claude_synthesis_review.md`.

The rule that came out of this pass:

```
Officially confirmed = explicitly stated in Naver Ads announcements only
  ✓ Expanded search, ADVoost, relevance index
  ✓ Medical material review policy, brand search

Not confirmed = use "observed" or "industry-reported"
  ✗ General organic/Place ranking changes
  ✗ May 2026 Place Ads rollout (absent from JSON extract)
```

Writing "due to recent algorithm changes..." without an official source is misinformation, not analysis. In a research report used to make ad spend decisions, that distinction matters. Codex crosscheck is what enforced it here.

## Tool Usage

| Tool | Calls |
|------|-------|
| Read | 9 |
| Bash | 8 |
| Agent | 8 |
| Write | 4 |
| TodoWrite | 3 |
| Grep | 1 |
| Skill | 1 |
| ToolSearch | 1 |
| **Total** | **35** |

3 files created. 0 files modified.

The 8 `Agent` calls: 4 research agents in session 1, then Codex crosscheck and synthesis agents in session 2.

## What Parallel Research Actually Costs

Four agents in parallel gives roughly 4× speed — but synthesis gets proportionally harder. The failure mode is specific: each agent independently makes claims about "algorithm changes" at varying confidence levels, without knowing what the other agents found. By the time you're merging 4 × 1,500-word outputs, you have the same fact stated three different ways with three different certainty levels.

Two things help:

**Explicit overlap flagging in the prompt.** The skill includes "flag overlapping areas with sibling agents" in each agent's instructions. This surfaces contradictions during retrieval rather than during synthesis.

**Primary source cross-validation at synthesis.** Agent summaries get checked against raw sources (`naver_ads_notice_extracts.json`). Agents can and do hallucinate. Codex crosscheck is the catch layer. This session confirmed it catches things.

The file-based state pattern generalizes: any multi-step workflow where an intermediate step might fail (API overload, context limit, rate limit) should write its output to disk before starting the next step. Conversation context doesn't survive a session crash. Files do.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
