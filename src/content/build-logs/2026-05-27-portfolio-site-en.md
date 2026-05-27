---
title: "7 Sessions, 129 Tool Calls, 4 Files Written: Orchestrating a Full Day with Claude Code"
project: "portfolio-site"
date: 2026-05-27
lang: en
pair: "2026-05-27-portfolio-site-ko"
tags: [claude-code, automation, hermes, orchestration, build-log]
description: "How I ran 4 separate projects in one day using Claude Code — content intel, dental ad research, HTML reports, and grad school analysis — with only 4 Write calls."
---

Seven sessions. 129 tool calls. Not a single line of code changed. In one day, Claude Code handled SpoonAI content intelligence, Korean dental ad regulation research, an agent HTML report, and an AI grad school application analysis — all through the same orchestration pattern.

**TL;DR** The Hermes relay → Claude CLI executor pattern held up across all four projects. The exception was dental research: 3 sessions, 0 Write calls, until one line fixed it — `Do not ask questions.`

## Feeding a 365KB JSON Into a Content Pipeline — Sessions 1–2

Session 1 started with a single input: `2026-05-27-daily-intel-raw.json`, a 365KB raw JSON dump. The goal was to extract two audiences worth of content candidates — general-audience card news and expert-level intelligence briefs — and write them to separate files.

The prompt was direct:

```
Select and organize general-audience AI card-news content candidates
and expert-level AI intelligence content candidates
from today's collected data.
Use only /Users/jidong/spoonai/crawl/newsite/2026-05-27-daily-intel-raw.json as the source.
```

Claude ran Bash 28 times — parsing the JSON, extracting by section, and ultimately generating both a `.md` and a `.json` output. Two minutes, 32 tool calls.

Session 2 was growth and monetization signal collection targeting Product Hunt, Show HN, and GitHub Trending. The Reddit/HN data in the raw dump was empty, so Claude fell back to WebFetch and scraped directly — that's where most of the day's 15 WebFetch calls came from. It referenced the previous output for formatting, then generated `growth-sponsor-signals.md`. Four minutes, 24 tool calls.

## 3 Sessions, 0 Writes: The Dental Research Dead Zone — Sessions 3–5

This was the most wasteful stretch of the day.

Session 3 had a clear goal: create and update three files — `2026-05-27-daily-update.md`, `rolling-knowledge-base.md`, and `source-index.md`. Claude inspected the existing directory structure and wrote a `plan.md`. Bash 18, Read 5, Write 1 — but that one Write was the plan itself. Zero actual output files.

Session 4 started fresh. Read 13, Bash 10. Claude re-read existing file headers, re-confirmed formatting, re-mapped the directory structure. One minute of orientation. Zero Writes.

Session 5 added one line to the prompt:

```
Do not ask questions.
```

That was enough to push it into execution mode. Read 11, Bash 8 — and the files finally got written.

### Why This Pattern Keeps Happening

When sessions are split, context resets. Each new session pays the full "where am I?" cost from scratch: scan directories, read existing file formats, locate prior outputs. Split a large task across three sessions and you pay that cost three times.

Two fixes:
1. **Include prior output paths in the prompt explicitly.** When the previous session generated `plan.md`, the next prompt should say `"Read /path/to/plan.md and execute step 3."` The session skips re-orientation entirely.
2. **Don't split — finish in one session.** Context overhead from splitting always exceeds the marginal cost of running longer.

Setting `Do not ask questions.` as a prompt default also eliminates the clarification loop that burns session budget before a single file gets written.

## The Most Efficient Session: 5 Tool Calls, 4 Minutes — Session 6

Session 6 had the shortest prompt of the day:

```
Read brief.md and create the required report files exactly under outputs/.
You may use web only if available, but do not ask questions.
Keep evidence labels explicit.
Produce a clean mobile-friendly Korean HTML technical report for PDF export
and a concise short_summary.md.
```

Result: Bash 2, Write 2, Read 1. Five tool calls total. `report.html` and `short_summary.md` generated in four minutes.

Compare that to sessions 1–5 averaging 22 tool calls. The difference was that `brief.md` had everything pre-loaded — current directory state, expected outputs, formatting requirements. Claude skipped the orientation phase entirely and went straight to execution.

Session 7 (AI grad school report) had the same setup and was even leaner: Read 1, Bash 1. Two tool calls. The shortest session of the day.

## Why the brief.md Pattern Works

Sessions 6 and 7 used so few tool calls because the setup work was done before Claude started. Roughly half of what Claude does in any session is orientation: confirm what exists, read existing formats, locate prior outputs. That cost accumulates — 20+ Bash/Read calls before a single Write happens.

`brief.md` pre-pays that cost. A human does the organization once, hands it to Claude, and Claude starts at the execution step instead of the orientation step.

In sessions 3–5, that pre-payment never happened. Every session re-learned the same directory structure. What session 3 discovered, session 4 didn't know. What session 4 discovered, session 5 didn't know. The same Read/Bash pattern ran three times.

## How the Hermes Relay Pattern Actually Works

Looking at today's sessions, the CLAUDE.md Hermes rule is working as designed.

Hermes organizes the user's request and passes it to Claude CLI — as a `brief.md`, a `plan.md`, or a long structured prompt. Claude CLI reads it, makes decisions, and produces the output. Hermes only delivers the result.

Session 3's `plan.md` fits the same model. A plan is orchestration infrastructure, so Hermes can produce it directly. The actual `daily-update.md` and `rolling-knowledge-base.md` have to come from Claude CLI.

The boundary matters. When an orchestrator starts producing deliverables directly, the validation loop breaks. The executor has mechanisms for checking its own output and iterating. The orchestrator doesn't. Keeping roles separated preserves that loop.

## Tool Usage Breakdown

| Tool | Count | Primary Use |
|------|-------|-------------|
| Bash | 72 | File checks, JSON parsing, directory scans |
| Read | 37 | Existing file structure and format inspection |
| WebFetch | 15 | Direct scraping of Product Hunt, Show HN |
| Write | 4 | Actual output file generation |
| ToolSearch | 1 | Load WebFetch schema |

Four Write calls across seven sessions. Read-to-Write ratio is roughly 9:1 — for every file created, nine existing files were read first. Most of those Reads were format confirmation, not content extraction.

To bring that ratio down: include format references directly in the prompt, or keep standard templates at a fixed path. The `brief.md` approach from sessions 6–7 is the right direction.

> 7 sessions, 129 tool calls, 4 output files. One well-structured `brief.md` upfront can cut that tool call count in half.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
