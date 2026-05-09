---
title: "Claude Opus 4.7 as a Domain Research Agent — 25 Tool Calls, 5 Minutes, 2 Signals"
project: "portfolio-site"
date: 2026-05-10
lang: en
pair: "2026-05-10-portfolio-site-ko"
tags: [claude-code, claude-opus, agent, dental-ads, research-automation]
description: "How I ran Claude Opus 4.7 as a daily medical ad research agent: 25 tool calls, 5 min session, 2 confirmed signals filed across 4 updated knowledge base files."
---

25 tool calls. 5 minutes. Two confirmed policy changes extracted from raw JSON and filed into a rolling knowledge base — with the right labels attached. That's what one Claude Opus 4.7 session produced for a dental advertising research workflow I've been building.

**TL;DR** Give claude-opus-4-7 a single prompt with an explicit role, a labeled taxonomy, and every file path it needs — and it completes a rolling research base update in one session without guessing.

## Why Opus for This Kind of Work

This research workflow isn't retrieval. It's judgment.

The domain is Korean medical advertising — specifically, tracking changes on Naver (Korea's dominant search platform) that affect dental clinics running Place ads and search campaigns. Every piece of information needs a label:

- `officially confirmed` — from Naver's official announcements
- `based on official documentation` — reasonable interpretation of published docs
- `public SERP observation` — what I can see in live search results
- `industry observation` — patterns across practitioners
- `reasonable inference` — extrapolated from evidence, not stated directly
- `requires verification` — flagged for follow-up
- `figures unconfirmed` / `estimated high-spend` — quantitative claims I can't fully source

A smaller model can retrieve and summarize. But consistently applying this taxonomy across multiple source files — deciding *which* label fits, not just summarizing — needs better reasoning. That's why Opus.

There's also a compliance constraint: specific clinic names must be anonymized in final summaries. Medical advertising data is sensitive. Stating that rule once in the prompt and trusting the model to apply it everywhere is exactly the kind of thing that breaks down without sufficient model capacity.

## The Prompt Pattern That Worked

The session prompt opens like this:

```
You are a daily research agent for medical/dental advertising. Read the following files
and generate/update the 2026-05-09 daily update draft. Apply these labels strictly:
(officially confirmed / based on official documentation / public SERP observation /
industry observation / reasonable inference / requires verification /
figures unconfirmed / estimated high-spend)
Anonymize specific clinic names in final summaries.
```

Then it lists every file the agent needs to read and every file it needs to write or update.

Three things this prompt does explicitly that make the difference:

**Role + rules declared, not described.** "You are a research agent" is a description. Listing the label taxonomy like a type signature is a declaration. The model treats it as a hard constraint. Output without a label is malformed output — it seems to reason that way, at least.

**All file paths named upfront.** 5 files to update, 2 source files to read — all listed in the prompt. When the model knows exactly where to look and where to write, it doesn't spend tool calls exploring. The session stays compact.

**Sensitive data handling inline.** "Anonymize clinic names in final summaries" — stated once, applied everywhere across 4 output files. No post-processing pass needed.

This is closer to writing a function signature than writing a chat message. The difference shows up in session length.

## What 25 Tool Calls Looked Like

5 minutes. 25 tool calls. Here's the breakdown:

| Tool | Count | What it did |
|------|-------|-------------|
| Read | 6 | Ingested `raw-2026-05-09.json`, `naver-notice-details-2026-05-09.json`, and 4 existing KB files |
| Bash | 7 | Checked current file state, explored directory structure |
| Edit | 8 | Updated `rolling-knowledge-base.md`, `competitive-serp-observations.md`, `source-index.md` |
| Write | 1 | Created `2026-05-09-daily-update.md` from scratch |
| TodoWrite | 2 | Tracked task progress internally |

The sequence makes sense: read sources, read existing state, diff the two mentally, write only the new and changed content. No redundant re-reads, no exploratory Bash calls, no half-written files. The explicit file list in the prompt eliminated the guessing loop that usually inflates token and tool usage.

## The 2 Signals That Mattered

Most SERP and policy changes are noise. These two weren't.

**Signal 1 — Place Ad Display Count Increase (effective May 14)**

Naver's official policy change: Place ads now show more listings per result page, across all business categories including clinics. For any dental practice running Place ads, the competitive dynamic shifts — more slots means different bid dynamics and visibility curves.

Filed in `rolling-knowledge-base.md` under `officially confirmed`. This one has a hard date and a direct source, so the label is unambiguous.

**Signal 2 — New Conversion Metric: Purchase Completion ROAS (effective May 13)**

Search ad campaigns gain a new built-in metric. Power Contents and Place campaigns are excluded from this rollout. Documented in `competitive-serp-observations.md`.

This matters because bid optimization strategies that rely on conversion signals need to account for a new metric appearing in dashboards. If you're advising clients on campaign structure, knowing this before May 13 gives you a one-day edge to set expectations.

Beyond these two, 8 SERP observations were incorporated — all labeled `public SERP observation` to keep the confidence level clear.

## What Didn't Get Done (And Why That's Correct)

`naver-ranking-hypotheses.md` wasn't updated this session. The raw source data didn't contain anything strong enough to revise existing ranking hypotheses.

Skipping it was the right call. A research agent that updates files when there's nothing to update is noisier than one that holds. Explicit scoping in the prompt — listing only the files that should change — prevented phantom updates.

After the May 14 Place ad change rolls out and SERP shifts become measurable, that file gets an update with actual data.

## Broader Pattern: Agents as Domain Compilers

What this workflow resembles more than anything is a compiler pass over domain knowledge. Raw JSON goes in. Structured, labeled, anonymized knowledge base files come out. The model's job is to apply the transformation rules consistently.

The prompt defines the rules. The file list defines the scope. The label taxonomy defines the output type system. When all three are tight, the model behaves like a deterministic transform — not a creative agent making things up.

This pattern generalizes. Anywhere you have:
- Structured or semi-structured input data
- A defined output schema (in this case, labeled markdown sections)
- Domain rules that require judgment to apply

...Opus running a tight prompt like this is a reasonable design choice. The 5-minute session time and 25 tool calls are a benchmark for what "tight" looks like in practice.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
