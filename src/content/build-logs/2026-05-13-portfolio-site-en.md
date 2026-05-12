---
title: "AI Reviewing AI: Automating Medical Ad QA with Claude Opus (2 Sessions, 13 Tool Calls)"
project: "portfolio-site"
date: 2026-05-13
lang: en
pair: "2026-05-13-portfolio-site-ko"
tags: [claude-code, ai-qa, dental-ads, automation, content-verification]
description: "A meta QA workflow where AI verifies AI-generated medical ad briefings. Cross-validated Notice IDs, SERP stats, and AI briefing counts across 2 sessions and 13 tool calls."
---

Today I wrote zero lines of code. Two sessions, 13 tool calls, no file edits — and that was the whole point.

**TL;DR** I ran Claude Opus over the `research/daily-medical-dental-ads/` artifacts to cross-validate factual consistency. Ten Notice IDs, ten SERP keyword classifications, one AI briefing frequency count — all matched `summary.json` exactly. No blocking issues.

## "If It's Fine, Just Say Fine" — How a One-Liner Shaped the Whole Prompt

The first session's prompt was longer than I'd like:

```
Review today's medical/dental ads daily update artifacts for factual consistency,
label discipline, and Telegram safety. Read these files only:
research/daily-medical-dental-ads/2026-05-13-daily-update.md,
research/daily-medical-dental-ads/reports/2026-05-13-ai-briefing-info-keyword-and-place-d1.html,
research/daily-medical-dental-ads/sources/serp-2026-05-13/summary.json.
Report only issues that must be fixed before delivery; if none, say OK.
```

The critical line is the last one: "Report only issues that must be fixed before delivery; if none, say OK."

Most QA prompts leave this open — "look it over carefully," "give me thorough feedback." Open-ended prompts produce open-ended output: minor stylistic notes, suggestions, things that would be nice to fix. None of that is useful when the question is *can this ship*.

The second session tightened further:

```
Quick review for blocking problems only.
Focus on factual consistency, labels, no specific hospital names/addresses
in user-facing report, and no unsupported metric claims.
Return 'OK' if no blocking issues, otherwise list fixes.
```

"Blocking problems only" narrows the scope explicitly. No design feedback, no sentence suggestions. Just: is there anything that stops deployment.

The difference in output between these two prompting styles is not subtle. One produces a report you have to triage. The other produces a decision.

## What Got Verified — 3 Checkpoints

Medical advertising automation has a specific failure surface. Three things matter before any briefing goes out.

**Data consistency.** The markdown daily update and the HTML report both derive from `summary.json`. If a number in the report diverges from the source JSON — even by one — it's a data integrity problem. The Notice IDs verified this session: 31509, 30960, 31453, 30865, 31287, 31426, 31006, 31243, 31120, 31126. All ten matched the source exactly. SERP keyword classification (eight local/treatment queries, two informational) also matched.

**Label discipline.** Under Korean medical advertising law, directly surfacing specific hospital names or addresses in user-facing reports requires separate licensing. The automated briefing strips this. A single Grep confirmed no hospital name or address leaked into the output layer.

**AI briefing frequency.** The markdown noted that AI briefings were detected six times for the `임플란트 통증 기간` (implant pain duration) keyword. Cross-referencing with the same field in `summary.json`: match.

The second session's verdict:

> Notice IDs, SERP totals, AI briefing count of 6 on `임플란트 통증 기간` — all match summary.json. No blocking issues.

That's the output. One paragraph. Enough to ship.

## Tool Usage Breakdown

Two sessions, 13 tool calls total.

| Tool | Count | Share |
|------|-------|-------|
| Read | 9 | 69% |
| Bash | 3 | 23% |
| Grep | 1 | 8% |
| Edit | 0 | — |
| Write | 0 | — |

Read dominates because three files (`daily-update.md`, the HTML report, `summary.json`) were read in both sessions — that's six reads as a baseline, plus three more for spot checks. Bash calls were JSON field extraction and file size checks. The single Grep was the hospital-name leak check.

No writes. No edits. This was a pure read-and-compare operation.

## Is AI QA Actually Practical?

The pattern here is using AI to verify AI-generated output for factual consistency. The alternative — having a person cross-reference ten Notice IDs against a JSON source — sounds simple until you do it under time pressure. Numbers blur. Attention drifts. One transposed digit passes human review.

Claude Opus read three files and compared them in roughly 30–60 seconds of subjective wall time (accounting for tool call latency). Whether the result is "OK" or "needs fixes" doesn't matter — it's faster and less error-prone than a human doing the same mechanical comparison.

The limitation is equally important to state clearly: this workflow only checks **mechanical consistency**. Does the number in the report match the number in the source? Is the label present or absent? That's all it does.

What it doesn't catch: whether the logical flow of the briefing makes sense for the intended audience, whether a sentence that doesn't mention a specific hospital name still implies one through context, or whether a claim is technically accurate but misleading given the regulatory environment. Those require human review. They always will.

The practical split: rule-based checks (field existence, numeric match, prohibited keyword presence) go to Opus. Contextual and regulatory judgment stays with humans.

## The Real Output

The deliverable from today's sessions isn't code. It's a go/no-go decision: the briefing can ship.

As AI automation pipelines grow longer — generation, formatting, distribution, archival — the outputs of each stage accumulate. At some point you need a verification layer that can keep up with the generation rate. Human reviewers become the bottleneck. Inlining AI QA into the pipeline removes that bottleneck for the mechanical checks.

Prompt design determines what you get back. "Look this over carefully" and "report blocking issues only, say OK if none" produce fundamentally different outputs. For operational automation, you want the second. The first is for exploratory review; the second is for deployment gates.

Two sessions. Thirteen tool calls. Zero edits. The pipeline is clean.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
