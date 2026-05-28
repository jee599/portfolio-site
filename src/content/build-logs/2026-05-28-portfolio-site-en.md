---
title: "69 Tool Calls Across 4 Domains: Running Claude Code as a Daily Ops Hub"
project: "portfolio-site"
date: 2026-05-28
lang: en
pair: "2026-05-28-portfolio-site-ko"
tags: [claude-code, automation, ai-ops, claude-opus-4-7, orchestration]
description: "8 sessions, 69 tool calls: dental ad SERP research, AI intel curation, revenue reports, and CLI status — all in ~6 minutes with claude-opus-4-7."
---

69 tool calls. 8 sessions. 4 unrelated business domains. About 6 minutes of wall-clock time.

That's a full Wednesday running Claude Code as a multi-domain ops hub — dental clinic ad research in Korea, AI news curation, product revenue signal reporting, and developer tooling status reports. All in one day. All through the same orchestration layer.

**TL;DR**: Using claude-opus-4-7 across 8 sessions, I processed Korean dental SERP analysis, SpoonAI AI intel curation, P1 product revenue signals, and CLI version status — without switching contexts manually. The multi-domain orchestration pattern is stabilizing. One session hit an orchestrator gate misclassification worth documenting in detail.

## The Setup: Why Four Domains in One Place

This isn't a monorepo story. The four domains are genuinely unrelated: a dental marketing business, an AI news product, a SaaS product suite, and this portfolio's own dev tooling. The only thing connecting them is Claude Code running as the ops layer.

The advantage isn't code reuse — it's context switching cost. When every domain has its own Claude session structure, knowledge base files, and artifact pipelines, you can move between domains in under a minute. The sessions are stateless but the file-based knowledge bases aren't. That separation is what makes the multi-domain pattern tractable at daily frequency.

Sessions 7 and 8 were health check pings returning `CLAUDE_OK` and `CLAUDE_OK_AFTER_FIX`. The substantive work was 6 sessions across 4 domains.

## What Actually Got Done

**Session 1 — SpoonAI Daily AI Intel**

Read `2026-05-28-daily-intel-raw.json` and transformed it into card-news-style markdown plus structured JSON output. Finished in 10 Bash calls with no `Read` tool usage.

The reason: the raw input was already structured JSON. There was no need to go through the Read → parse → process pipeline. `jq` in a Bash heredoc handled the transformation directly. This is worth noting because a lot of Claude Code sessions over-use `Read` on structured data that pipes better through shell tools.

**Sessions 2–3 — Korean Dental Clinic SERP Research**

May 28 was the day Naver's place ad impression count increase went live (internal announcement #31700). That timing mattered — analyzing 15 SERP samples on the exact day the ad product changed behavior added interpretive context unavailable the day before or after.

Sample breakdown: 12 region × procedure combinations, 2 risk-expression combinations, 1 cost-event combination. Output: 5 cumulative knowledge files updated — `rolling-knowledge-base.md`, `naver-ranking-hypotheses.md`, `source-index.md`, `competitive-serp-observations.md`, and `evidence_brief.md`.

Why two sessions for one job? Session 2 created `2026-05-28-daily-update.md` but ran out of scope before finishing the cumulative file updates and HTML report. Session 3 ran as a targeted Narrow Finish Pass. More on that pattern below.

**Session 4 — P1 Product Revenue Report**

Generated an HTML report covering Thursday's revenue signals across 4 P1 products. Used `TaskCreate` 5 times to set section-level checkpoints — this gives you a structured audit trail of what was generated and in what order, which matters when reviewing the output later.

4 `WebSearch` calls pulled in same-day fresh signals. The most useful: dental clinic SNS pre-screening news directly relevant to one product's market context. A revenue report without same-day external signals is just last week's data in a new template.

**Sessions 5–6 — CLI Version Status Report**

A single HTML file showing Claude Code, Codex CLI, and Hermes version status. Should have been trivial. Hit an orchestrator gate instead.

## When the Orchestrator Got in the Way

Session 5 is the most instructive session of the day — not for what it produced but for what it revealed about the orchestration layer.

The task: generate one HTML file with version status for three CLI tools. Objectively simple — no file reads, no cumulative knowledge base updates, no multi-step dependencies. But the orchestrator classified it as `standard` and triggered the `plan-orchestrator` flow, requiring a planning artifact before any file writes.

**Root cause: prompt length, not task complexity.**

Describing version status for three separate tools produces a long prompt even when the actual output is simple. The orchestrator was classifying on surface area — token count and domain breadth — rather than actual execution complexity. A verbose prompt describing a simple generation task reads as more complex than a terse prompt describing a harder one.

Two fixes worked:
- Session 5: Internal reclassification to `simple` via `state_set complexity simple`, then proceed.
- Session 6: Simplified the prompt before re-submitting. Shorter prompt → lower classification → no gate.

The explicit lesson: **prompt length and task complexity are not the same thing**. If you're building orchestration layers on top of Claude Code and using heuristics to route to heavier pipelines, test this explicitly. Add an override mechanism, or tune the classification to weight output complexity (files changed, dependencies required) over input complexity (token count, domains mentioned).

## Reading the Tool Call Distribution

```
Bash:         33  (48%)
Read:         24  (35%)
TaskCreate:    5
WebSearch:     4
Write:         2
ToolSearch:    1
```

**Bash at 48%** is doing most of the work. File I/O, `jq` processing, git operations, state updates, HTML generation — all Bash. Most file output happened through `cat > file` patterns inside Bash, not through explicit `Write` calls.

**Write at just 2** is the telling number. If you're monitoring Claude Code sessions by counting `Write` tool invocations, you'll undercount actual file creation significantly. The Write tool is clean and auditable, but Bash with heredocs is often faster for templated HTML or structured markdown with lots of variable interpolation. Bash created more files than Write did today.

**Read at 35%** is almost entirely Session 3. Reading 15 cumulative knowledge files sequentially before updating them is unavoidable when reconciling new daily data against long-form accumulated documents. Each file must be read in full before you can determine what to add, what to revise, and what to leave unchanged. There's no shortcut here — this is what knowledge base maintenance actually costs in tool calls.

**TaskCreate at 5** is specific to Session 4's section-checkpoint pattern. For longer report-generation sessions, creating a task per section before starting each one gives you a structured execution log. When you review the transcript later, you can see exactly where each section was generated and whether it matched the original scope.

## Catching a Policy Change in Real-Time

The dental SERP sessions have a detail worth calling out. The session was reading `evidence_brief.md` — a cumulative file tracking observed signals — which contained a note that today was the D-Day for Naver's place ad impression count increase.

That context fed directly into the ranking hypotheses update. Not just "here's new SERP data" but "here's new SERP data from the exact day a known variable changed." The hypotheses file got updated with that causal framing attached.

The two-pass structure made this possible:
- Day N-1: Raw SERP collection, no interpretation
- Day N: Interpretation with date-aware context from cumulative files

Without the raw collection pass the day before, there's nothing to compare. Without the cumulative knowledge base tracking the D-Day date, the interpretation pass has no way to attach the right causal context. Both halves matter.

Any research workflow with date-triggered external events benefits from this structure. Policy changes, algorithm updates, product launches — when collection and interpretation phases are separated by time, each phase can do its job with full context.

## The Narrow Finish Pass

Sessions 2 and 3 are a recurring pattern in this setup. A large job is partially completed in one session. A second session handles what's left.

The key is how you write the second prompt. If you don't explicitly partition what's done from what remains, the second session treats the whole job as incomplete and starts from scratch — re-reading files already processed, duplicating git operations already committed, regenerating artifacts that are already correct.

The Session 3 prompt header:

```
The first artifact pass created 2026-05-28-daily-update.md
but did not finish cumulative files or HTML report.

## Scope
Only finish/update these existing required artifacts:
- rolling-knowledge-base.md
- source-index.md
- competitive-serp-observations.md
- naver-ranking-hypotheses.md
```

Four things that make this work:
1. Names the specific artifact that *was* completed
2. Names the specific artifacts that *were not* completed
3. Uses `Only finish/update` to signal this is a continuation, not a restart
4. Excludes original research context — the files themselves contain it

This is different from error recovery. Session 2 didn't fail — it succeeded at part of the work. Session 3 is scoped exclusively to the remaining artifact set. The distinction matters for how the session is framed from the start.

## By the Numbers

| Metric | Value |
|--------|-------|
| Sessions | 8 (6 substantive) |
| Total tool calls | 69 |
| Bash | 33 |
| Read | 24 |
| Write | 2 |
| Files generated | 2 new |
| Total wall time | ~6 minutes |
| Model | claude-opus-4-7 (all sessions) |

> 6 minutes across 4 domains. When the orchestration layer is working, the human input is scope and source material. Claude handles the tool use.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
