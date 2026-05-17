---
title: "Claude Opus as a Compliance Gate: 9 Tool Calls, Zero Blocking Issues"
project: "portfolio-site"
date: 2026-05-17
lang: en
pair: "2026-05-17-portfolio-site-ko"
tags: [claude-code, compliance, prompting, automation]
description: "How I use Claude Code not to write code, but as a legal compliance gate for AI-generated medical ad content — and cut 7 tool calls down to 2."
---

In two sessions today, Claude Code touched zero files. Zero edits, zero new files, zero shell commands that changed anything. And it still did something useful.

That's the pattern I want to document: using Claude Opus not as a coding assistant, but as a compliance gate. A step in a content pipeline that checks whether AI-generated output clears legal thresholds before it goes anywhere near a user.

**TL;DR** Give Claude Opus explicit file paths and a numbered list of blocking criteria. It reads both files and returns OK in 2 tool calls. Without explicit paths, it burns 5 Bash calls just finding the files first.

## The Context: Daily Medical Ad Reports That Can't Be Wrong

My `dentalad` project generates daily keyword analysis reports for dental clinic marketing. Every day it produces two artifacts:

- A markdown daily update (`2026-05-17-daily-update.md`)
- An HTML report with keyword rankings and local SERP patterns

Both are AI-generated. Both get used in client-facing contexts. And in South Korea, medical advertising is tightly regulated — the Medical Devices Act and the Medical Service Advertising Review Act prohibit comparative advertising, unverified efficacy claims, and anything that could be read as guaranteeing treatment outcomes.

The practical risk in AI-generated content:

- **Numerical contradictions** between the two files (daily update says one thing, the HTML report says another)
- **Hospital names or addresses** accidentally included (comparative advertising violation)
- **Unsupported ranking claims** — phrases like "top keyword" or "most searched" that imply guarantees
- **Revenue or appointment guarantee language** that crept in from a training pattern

A human can catch all of this with a careful read. But doing a careful read every single day, for every report, is exactly the kind of work that doesn't scale.

## Why Claude Code Specifically (Not Just the API)

I could call the Claude API directly, paste in the file contents, and get the same result. But Claude Code gives me something the raw API doesn't: tool-level traceability.

When I run this review as a Claude Code session, I can see exactly which files were read, in what order, with what results. The tool call log is an audit trail. If a compliance issue is ever disputed, I can point to the session and show what was checked and when.

That matters in regulated domains. "We reviewed it" is weaker than "here's the exact model, the exact files read, and the exact output."

## First Attempt: 7 Tool Calls

My initial prompt was deliberately vague — I wanted to see what Claude would do with loose instructions:

```
Read the daily update and HTML report for 2026-05-17 under
/Users/jidong/dentalad/research/daily-medical-dental-ads.
Check for contradictions, unsupported claims, accidental
hospital names/addresses, or missing required labels.
Return concise blocking issues only, or OK if none.
```

Result: **7 tool calls**. Breakdown: Bash ×5, Read ×2.

Five of the seven calls were Claude figuring out where the files were. The path I gave pointed to a directory, not specific files. Claude had to list the directory, identify the relevant files by date pattern, verify the paths existed, then read them.

The compliance result was OK. But 5 out of 7 calls was overhead that had nothing to do with the actual review.

## Second Attempt: 2 Tool Calls

I rewrote the prompt with two changes: explicit file paths, and a numbered list of blocking conditions.

```
Blocking review only. Read these two files:
research/daily-medical-dental-ads/2026-05-17-daily-update.md
research/daily-medical-dental-ads/reports/2026-05-17-info-keyword-ai-and-local-serp-patterns.html

Answer exactly OK if no blocking issue.
Blocking issues:
- contradictory facts between the two files
- named hospitals/addresses in user-facing content
- missing source/label caveats
- claims of guaranteed rankings/reservations/revenue
```

Result: **2 tool calls**. Read ×2. Straight to the files, straight to the answer.

**OK.**

7 → 2. The diff was entirely in the prompt.

## Two Principles That Explain the Gap

### 1. Explicit paths eliminate navigation overhead

When you give Claude a directory path and ask it to "find the relevant files," it has to solve a subproblem first: what counts as relevant? This requires listing the directory, applying heuristics (date patterns, file extensions), possibly recursing into subdirectories.

Every Bash call here is latency and token cost with no compliance value. The compliance work is in the Read calls. If you know the exact file paths — and in a cron-driven pipeline you always know — put them in the prompt.

### 2. Enumerated blocking criteria constrain the judgment space

"Check for problems" is unbounded. Claude has to decide what counts as a problem, how severe it needs to be, whether to flag edge cases or only clear violations. Without constraints, that decision varies between runs.

"Flag exactly these four conditions, return OK otherwise" is bounded. Claude applies four specific tests and returns a binary result. The criteria don't change between runs because they're in the prompt, not inferred.

This is especially important in legal and regulatory contexts. The four criteria I'm using map directly to provisions in the Korean medical advertising review framework. They're not heuristics — they're requirements. Encoding them explicitly in the prompt means Claude is checking against the actual rules, not a probabilistic approximation of them.

## The Broader Pattern: Role Separation in AI Pipelines

Having AI review AI-generated content looks circular. It's not.

The generation step (producing the daily update and HTML report) is optimized for completeness and coverage. The model is trying to be useful, which means including more information, making connections, being expansive. That's the right behavior for generation.

The review step needs the opposite disposition: narrow scope, binary output, conservative threshold. When reviewing for compliance, I don't want Claude to be helpful — I want it to be a precise filter.

Same model, different roles, different prompts.

This separation is cleaner than trying to build compliance checking into the generation prompt. When compliance is a downstream gate, you can iterate on the gate independently from the generation logic. You can tighten the criteria, add new blocking conditions, or swap the reviewing model — without touching the generation pipeline.

## Formalizing Blocking Criteria as Code

The instinct when writing compliance prompts is to be descriptive: "make sure there's nothing that could be read as a guarantee of results." That's prose, not a specification.

The better frame: write blocking criteria the way you'd write a test assertion. Each criterion should be a condition that either holds or doesn't. If it holds, it's a blocking issue. If none hold, it's OK.

```
Blocking issues:
- contradictory facts between the two files
- named hospitals/addresses in user-facing content
- missing source/label caveats
- claims of guaranteed rankings/reservations/revenue
```

These four lines are the entire compliance check. Not because the domain is simple — Korean medical advertising law is extensive — but because these four conditions are the ones that create direct legal exposure in daily keyword reports. Everything else is stylistic or advisory.

The discipline of writing blocking criteria this way forces you to be explicit about what you're actually protecting against. "Something might be wrong" doesn't define a gate. Four specific conditions do.

## Session Stats

| | Session 1 | Session 2 |
|---|---|---|
| Date | 2026-05-16 | 2026-05-16 |
| Model | claude-opus-4-7 | claude-opus-4-7 |
| Tool calls | 7 (Bash×5, Read×2) | 2 (Read×2) |
| Result | OK | OK |
| Files changed | 0 | 0 |

Two sessions combined: 9 tool calls, 0 blocking issues, 0 files touched.

The cost difference between Session 1 and Session 2 is entirely in prompt quality — not model size, not context length, not temperature settings.

## What's Next

Currently running this prompt manually each morning. The natural next step is automation: a GitHub Actions job that runs the compliance check after the daily report generation, and posts to Slack if blocking issues are found.

When that's wired up, the pipeline becomes:

```
generate reports → compliance gate → if OK: publish / if blocking: alert
```

No human in the loop unless Claude flags something. The gate runs, the result is logged, and the reports either go out or they don't.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
