---
title: "14 Tool Calls, Zero File Edits: Using Claude Opus 4.7 as a Pure SERP Analyst"
project: "portfolio-site"
date: 2026-05-16
lang: en
pair: "2026-05-16-portfolio-site-ko"
tags: [claude-code, claude-opus, serp, prompt-engineering, analysis-automation]
description: "2 sessions, 14 tool calls, 0 file modifications — how explicit prompt constraints turn Claude Opus 4.7 into a focused SERP analyst."
---

The session ended with 14 tool calls, 0 file modifications, and genuinely useful output. No code was written. No files were touched. Just analysis — and it worked.

**TL;DR** Deploy Claude Opus 4.7 as a read-only analyst with an explicit word limit and it will compress complex SERP JSON into a tight, actionable summary. The two constraints that actually matter: `Do not edit files` and a hard number like `Keep under 700 words`.

## The Setup: Daily SERP Data That Accumulates Fast

This project tracks Korean medical and dental advertising keywords daily. The data lands at `sources/serp-YYYY-MM-DD/summary.json` — structured JSON covering around 10 keywords per day: ad counts, positions, organic result counts, place ad presence, and more.

Reading it manually is slow. Spotting patterns across days is even harder. The obvious move was to pass it to Claude and let it synthesize. The less obvious question was how to prompt it so the output was actually useful rather than exhaustive.

Two sessions answered that question.

The broader context: medical and dental advertising in Korea operates under strict regulations. Naver — Korea's dominant search engine — is the primary ad platform, and changes to its ad formats or policies can directly affect campaign performance. Tracking daily SERP snapshots for 10 representative keywords lets you spot pattern shifts early before they affect campaign costs. The challenge is that JSON data at this scale is tedious to read manually, and the signal-to-noise ratio is low on any given day.

Claude was the obvious tool for synthesis. The question was always: how do you prompt it so it doesn't either over-produce or miss the point?

## Session 1: Cast a Wide Net First

The first prompt was deliberately broad:

```
You are reviewing today's Korean medical/dental ads daily research data.
Read sources/serp-2026-05-16/summary.json and the existing rolling
KB/source-index/SERP/hypotheses files. Give a concise Korean synthesis:
(1) new official changes, (2) SERP repeated patterns,
(3) what files should be updated,
(4) whether an HTML report is justified.
Do not edit files.
```

The last line — `Do not edit files` — is the load-bearing constraint. Without it, Claude will act on what it reads. It'll spot a stale KB entry and update it. It'll find a missing hypothesis and add one. That behavior is useful in most sessions, but not when you want a pure read-only analysis pass. The constraint makes the intent explicit.

With it in place, Claude ran 9 Bash commands: parsed the JSON, read the existing KB files, cross-referenced the hypotheses, and synthesized everything into a structured report. Time spent by a human: zero.

The output was thorough — possibly too thorough. "Concise" in the prompt turned out to be doing less work than expected. Claude has its own interpretation of what concise means in context, and when the underlying data is rich, that interpretation tends toward comprehensive. Session 1 surfaced everything relevant. Session 2's job was to cut it down.

## Session 2: Narrow the Scope, Define the Output

The second prompt constrained both what Claude read and how much it wrote:

```
Read sources/serp-2026-05-16/summary.json only.
Output Korean bullet synthesis with:
new official Naver Ads notices, medical/dental relevance,
SERP pattern across 10 keywords, HTML-report yes/no.
Keep under 700 words.
```

Two words changed the behavior significantly: `only` and `Keep under 700 words`.

`only` stopped Claude from re-reading the full KB. It had already explored that territory in session 1. This time, it stayed focused on the single target file.

`Keep under 700 words` forced triage. Claude had to decide what actually mattered versus what was simply present in the data. The difference between "significant" and "present" is the entire job of an analyst. Claude made that distinction correctly — the output was dense and useful rather than comprehensive and verbose.

Result: 4 Bash calls + 1 Read call = 5 tool calls total. Half the tool usage of session 1, with output that was more immediately actionable.

One detail worth noting: the reduction from 9 Bash calls to 4 wasn't just about the narrower scope. Claude understood the JSON structure from session 1. It knew where to look. The second session benefited from the first session's exploration, even though the prompts were independent. This compounding effect is a consistent pattern with multi-session workflows: the second prompt is more efficient because the first prompt already established context.

## What Claude Actually Surfaced

Three findings from the May 16, 2026 analysis:

**Naver place ad inventory expansion test.** Official Naver Ads notice: a test expanding place ad display real estate, with restaurants as the initial target category. No direct impact on dental/medical ads yet, but the directional signal is clear — Naver is actively expanding place ad inventory. The place ad format has historically been a lower-cost alternative to standard search ads for local businesses, so any expansion of its inventory is relevant to the medical advertising landscape. Worth tracking.

**No significant SERP pattern changes across 10 keywords.** Ad counts and positions were stable across the full keyword set. No anomalies in organic result counts. Nothing warranting a flag.

**Self-determined: HTML report not needed.** This is the finding worth examining closely. The prompt explicitly asked Claude to judge whether generating an HTML report was justified. It said no: one new notice, minimal pattern change, report unnecessary.

Claude's default tendency is to produce artifacts. When you give it data and ask it to analyze, it wants to make something: a report, a summary document, an updated file. The fact that it evaluated against explicit criteria and concluded "nothing to build" is the behavior you want from an analyst that runs daily. A workflow that produces a report every day regardless of content is a workflow that teaches you to ignore the reports. Claude's judgment here — that the threshold for a report wasn't met — is the correct calibration.

## Tool Call Breakdown

| Tool | Session 1 | Session 2 | Total |
|------|-----------|-----------|-------|
| Bash | 9 | 4 | **13** |
| Read | 0 | 1 | **1** |
| Edit | 0 | 0 | 0 |
| Write | 0 | 0 | 0 |

**Files modified: 0. Files created: 0.**

The Bash-heavy distribution is expected. JSON parsing, directory traversal, KB file searching — all of that runs through Bash. The single Read call came in session 2, when Claude needed to open a specific file directly after Bash exploration had already identified it.

The zero Edit/Write row is the point. Analysis sessions should not produce file artifacts unless there's a clear reason to. In this case there wasn't, and Claude stayed in its lane. If you run a daily synthesis workflow and every session modifies files, you lose the clear distinction between "data in" and "analysis out." The constraint preserved that separation.

## Three Things That Actually Worked

**Use numbers instead of adjectives for output constraints.**

`concise` is ambiguous. Claude interprets it differently depending on the richness of the underlying data. `Keep under 700 words` is a constraint it can enforce mechanically. The output quality difference between session 1's vague "concise synthesis" and session 2's hard word limit was the most concrete result of this experiment.

This generalizes beyond length. Whenever you want bounded output — specific number of items, specific format, specific depth — use a number. Adjectives communicate preference; numbers define the constraint.

**`Do not edit files` is mandatory for pure analysis sessions.**

Claude's default is to improve things it notices. Usually that's a feature. In an analysis session, it's scope creep. A knowledge base entry gets updated. An index gets reorganized. A hypothesis gets expanded. All of those might be correct improvements — but they're not what you asked for, and they make the session harder to audit and harder to roll back.

One explicit line eliminates an entire category of unexpected side effects. If you want read-only behavior, say so explicitly. Don't rely on the absence of edit instructions to imply read-only behavior — that implication doesn't hold.

**Use session 1 to explore, session 2 to extract.**

Don't try to write the perfect prompt on the first attempt. Session 1 should be broad: let Claude read widely, explore the file structure, and surface what's actually in the data. Session 2 should be narrow: constrained scope, explicit output format, hard word limit.

Session 2's Bash count dropped to 4 because Claude already understood the JSON schema and directory structure from session 1. That prior context translated directly into fewer exploratory calls. Two targeted sessions consistently beat one over-engineered prompt — and they're faster to iterate on when the output isn't what you wanted.

## Why This Pattern Scales

The underlying pattern is simple: Claude as a pure analyst, constrained to read-only, with an explicit output length.

This applies far beyond SERP data. Any workflow where you have structured data that needs synthesis — logs, monitoring output, database dumps, API response archives — benefits from this pattern. The constraints aren't about limiting Claude's analytical capability. They're about getting precise output from a model that will otherwise produce thorough output whether thorough is what you needed or not.

The cost of a pure-analysis session is low. You're not modifying anything. You're not taking on any state. The entire session is reversible by definition. That makes it a safe default for any workflow where the value is in the insight, not the artifact.

Zero files modified doesn't mean zero value produced. It means the session did exactly what it was designed to do.

---

*tool calls: 14 (Bash×13, Read×1) · sessions: 2 · files modified: 0 · model: claude-opus-4-7*

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
