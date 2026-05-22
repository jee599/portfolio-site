---
title: "7 Claude Code Sessions, 86 Tool Calls, 4 Projects — Zero Lines of Code Written"
project: "portfolio-site"
date: 2026-05-23
lang: en
pair: "2026-05-23-portfolio-site-ko"
tags: [claude-code, claude-opus, automation, agent, workflow]
description: "One day, 7 Claude Code sessions, 86 tool calls across 4 projects — content scraping, regulatory research, HTML reports, strategy consulting. No code written."
---

On May 22nd, I ran 7 Claude Code sessions and hit 86 tool calls. Every session used `claude-opus-4-7`. I wrote zero lines of code.

The projects ranged from content intelligence collection for SpoonAI, Korean dental advertising regulation research, mobile-friendly HTML report generation, to startup strategy consulting. Not a code editor session in sight — Claude was the orchestrator across 4 completely different projects.

**TL;DR** — This is what using Claude Code as a multi-project agent actually looks like at scale. Some sessions timed out, one hit an API socket error mid-pipeline, and some worked perfectly on the first try. The differences came down to prompt structure, not model capability.

## The Session That Burned 41 Tool Calls in 9 Minutes

Session 3 was the heaviest: 9 minutes flat, 41 tool calls. Bash 20, Read 13, Edit 6, Write 2. That's not a runaway session — it was deliberate. The task was collecting and analyzing Korean hospital and dental clinic advertising intelligence for a rolling knowledge base.

What made 41 calls manageable in 9 minutes was the intake block at the top of the prompt:

```
1. Goal: Collect and analyze Korea hospital/dental advertising updates for 2026-05-22 
   per medical_dental_ads_daily_goal.md. Update the cumulative knowledge base files.
2. Scope: Today's files under ~/dentalad/research/daily-medical-dental-ads/. 
   Use only official/semi-official sources and public Naver integrated SERP samples.
3. Excluded: Historical re-crawl, any file outside the daily directory, 
   non-Korean market data.
```

When goal, scope, and exclusions are explicit and numbered, Claude doesn't spend tool calls on "how far should I go?" The session ran a complete pipeline: crawl Naver for regulatory changes → parse announcements → update 5 knowledge base files → generate HTML report.

The key finding that day: Naver Notice #31700. Effective 2026-05-28, Naver's integrated search Place Ad slots expand — medical clinics included. This directly affects ad strategy for dental clients, and Claude surfaced it, updated the rolling KB, and queued the HTML report.

Artifacts from session 3:
- `2026-05-22-daily-update.md` (new)
- `rolling-knowledge-base.md` (updated)
- `source-index.md` (updated)
- `competitive-serp-observations.md` (updated)
- `naver-ranking-hypotheses.md` (updated)

Then the session timed out. Right before the HTML report write.

## How to Resume a Timed-Out Session Without Restarting

Session 4 existed for one reason: finish what session 3 couldn't.

The prompt was deliberately minimal:

```
The previous Claude run updated the markdown files and sources but timed out 
before creating the HTML report referenced in 2026-05-22-daily-update.md.

Goal: Create the missing mobile-friendly HTML report and verify the daily artifacts.
Do not redo the whole crawl unless required.
```

Two things carried the weight here. First, explicitly stating where the previous run stopped — Claude doesn't re-explore territory already covered. Second, the hard constraint "do not redo the whole crawl" prevents the model from defaulting to a fresh start when given ambiguous context.

Result: Bash 7, Read 4, Grep 3, Write 1. If session 3 spent 9 minutes, session 4 finished in under 5.

Final artifact: `2026-05-22-integrated-search-place-ad-slot-expansion.html` — 23.0KB, self-contained, mobile-friendly CSS. No external dependencies.

The pattern here is reusable. Treat a timed-out session like a git rebase — you know what state you're in, you only need to apply the remaining delta. The continuation prompt is not "start over" — it's "here's the diff, apply the rest."

## When the API Drops Mid-Pipeline

Session 1 was collecting content intelligence for SpoonAI when this error hit at call 14:

```
API Error: The socket connection was closed unexpectedly. 
For more information, pass `verbose: true` in the second argument to fetch()
```

14 Bash calls in, mid-pipeline: external API fetch → raw JSON parsing → candidate filtering → file save. The socket dropped somewhere between parsing and saving.

The instinct is to re-run the whole session. That's usually wrong.

I opened session 2 with a single narrow task: "Validate that these two files match the schema." Read 2 calls, PASS. Session 1 had actually written the files before the socket error — the crash was on a non-critical step that happened after the writes.

Splitting validation into a separate 2-call session costs almost nothing. Re-running a 14-call pipeline to recover 2 files costs everything.

The broader principle: when a session errors, diagnose before you retry. `Read` the output files first. Most of the time, more progress was made than the error message suggests.

## Zero Code Changed, Useful Output

Session 6 was the most unusual. I asked for marketing and product feedback on the SpoonAI `/newsite` prototype — positioning, the five learning tracks, B2B vs. B2C tradeoffs. Zero code changes. Read 2, Grep 1.

The Stop hook flagged it:

```
Stop hook feedback:
Found 3 debug/TODO leftover(s) in working tree. 
Clean them up or confirm intentional before stopping.
```

Claude investigated. The flagged `console.log` calls in `scripts/*` are intentional stdout output for CLI utilities — that's their entire purpose. The marker in `app/api/subscribe/route.ts` was pre-existing, not introduced in this session. Hook false positive.

I explained the context inline and the session passed. The output: a structured product analysis formatted for direct Telegram paste. One specific finding that came from this session: among the five learning tracks on `/newsite`, the "debate track" — where users argue both sides of a proposition — is the strongest differentiator for B2B SaaS positioning. It's not a feature most content platforms have, and it's defensible.

That judgment came from 3 tool calls, no code, and took under 2 minutes.

## Tool Usage Breakdown Across All 7 Sessions

| Session | Primary Tools | Profile |
|---------|--------------|---------|
| 1 | Bash(14) | Network-heavy pipeline, API socket error |
| 2 | Read(2) | Validation only, minimal surface area |
| 3 | Bash(20), Read(13), Edit(6) | Full research + rolling KB update |
| 4 | Bash(7), Read(4), Grep(3) | Timeout continuation, targeted delta |
| 5 | Read(1), Write(1) | Single file re-edit |
| 6 | Read(2), Grep(1) | Zero-code strategy consulting |
| 7 | Bash(4), Write(2) | Standalone HTML report generation |

Reading the tool distribution tells you a lot about the session's character.

Heavy Bash is a signal: the session needs external resources. This is where network errors live, where timeouts happen, and where latency compounds. Design these sessions with clear checkpoints — know which Bash calls produce persistent file outputs, and where a timeout would leave you.

High Read/Edit ratio with no Bash: existing-file update work. Usually reliable and fast. Less failure surface.

Single Write with minimal Reads: the fastest session type. Claude knows exactly what to produce, the path is fixed, and there's no exploration phase. If you can design a session to reach this profile, do it.

## Three Prompt Patterns That Changed the Failure Rate

Seven sessions with two failures (one timeout, one socket error) — and both failures were recoverable in under 5 minutes. That recovery speed came from prompt patterns, not luck.

**Pattern 1: Numbered intake blocks**

```
1. Goal: [one sentence outcome]
2. Scope: [files, directories, data sources]
3. I will: [explicit steps]
4. I will NOT: [exclusion list]
5. Assumptions: [if ambiguous, state them here]
```

This is overhead in the prompt. It pays back in fewer clarifying Bash calls and fewer exploratory Reads. The model doesn't need to figure out the boundaries — they're stated.

**Pattern 2: Explicit previous state for continuation sessions**

"The previous run completed steps 1-3 and stopped before step 4" is more useful than re-describing the full task. Claude gets a starting position, not a starting-over instruction. For multi-step pipelines where timeouts are possible, write the initial prompt assuming a continuation session might need to read it.

**Pattern 3: Absolute output paths in the prompt**

Embed the full output path in the prompt itself: `~/dentalad/research/daily-medical-dental-ads/2026-05-22-daily-update.md`. Don't let Claude decide where to put output files. This matters for two reasons: continuation sessions need to find the output by a predictable path, and sessions 6 hours later (or the next day) need the same predictability.

When the output path is fixed, you can grep for it, reference it in follow-up prompts, and track exactly what was produced. When it's implicit, you spend tool calls finding the file before you can use it.

## What the Dental Ad Research Workflow Actually Looks Like

The regulatory research work for dental clients is a recurring workflow. Every day, a session runs this pipeline:

1. Fetch Naver public announcements for `병원`, `치과`, `의료광고` keywords
2. Check for new notices affecting Place Ad rankings, integrated search slots, or compliance requirements
3. Update the rolling knowledge base with new findings
4. Update the source index and observation logs
5. Generate an HTML report for client-facing summaries

The HTML report step — the one that session 3 timed out before completing — is the highest-value output. It's a 23KB self-contained file with embedded CSS, structured findings, and direct links to Naver notice pages. The Markdown files are the KB. The HTML is the deliverable.

Running this daily with a structured prompt means the knowledge base compounds. What took 20 minutes of manual research in January runs in 9 minutes of Claude tool calls in May — and the KB has six months of context that shapes what Claude pays attention to.

Naver Notice #31700 (Place Ad slot expansion for medical clinics, effective 2026-05-28) is exactly the kind of signal that gets missed in manual research. It's buried in a category most developers don't track. Claude found it because the prompt explicitly includes "check for Place Ad slot changes" in the scope definition.

## Why This Isn't a Coding Tool Story

The framing matters here. Claude Code is usually discussed in the context of code changes — refactoring, debugging, feature implementation. That's real and useful. But these 7 sessions weren't about code at all.

Content intelligence collection is a research and data-structuring problem. Regulatory tracking is a document monitoring problem. Strategy consulting is a synthesis problem. HTML report generation is a templating problem.

All of these ran through Claude Code as the execution layer. The model handled file I/O, external data fetches, document parsing, structured output formatting, and incremental KB updates — with the same toolset used for code changes.

The difference from code sessions is the output artifact type and the failure mode. Code sessions fail with compilation errors or test failures. Research sessions fail with socket timeouts and stale sources. Both are recoverable with the same mental model: know your state, know your delta, apply the delta.

## The Day in Numbers

| Metric | Count |
|--------|-------|
| Total sessions | 7 |
| Total tool calls | 86 |
| Files created | 5 |
| Files updated | 4 |
| Timeouts | 1 |
| API socket errors | 1 |
| Code commits | 0 |
| Lines of code written | 0 |

Without these 7 sessions, the dental ad KB update, SpoonAI intelligence collection, startup strategy review, and HTML deliverable generation would have been 3-4 hours of manual work. The actual wall-clock time for all 7 sessions was under 45 minutes, including the time spent writing the continuation prompts.

The ROI on prompt engineering compounds. An intake block that took 3 minutes to write eliminated 15 minutes of clarifying tool calls. An absolute output path that took 10 seconds to type made the continuation session 5 minutes faster.

That's not a lot individually. Across 7 sessions and 4 projects in one day, it adds up.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
