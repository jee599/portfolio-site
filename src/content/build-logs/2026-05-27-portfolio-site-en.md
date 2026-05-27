---
title: "6 Claude Code Sessions, 127 Tool Calls, 4 Files Written: The Context Delivery Problem"
project: "portfolio-site"
date: 2026-05-27
lang: en
pair: "2026-05-27-portfolio-site-ko"
tags: [claude-code, automation, hermes, orchestration, build-log]
description: "127 tool calls across 6 Claude Code sessions automated 3 projects—but only 4 files got written. The bottleneck wasn't Claude. It was context delivery."
---

127 tool calls. 6 sessions. Three separate projects automated in a single day. And yet the actual output was 4 files.

Not 40. Not 14. Four.

That ratio tells you everything about where Claude Code's friction lives. It's not generation speed. It's not the model. It's context delivery—how much of the "what already exists and what format should this follow" overhead gets baked into the prompt versus rediscovered from scratch every session.

This is a breakdown of what happened across all 6 sessions today: what worked, what burned 3 sessions producing zero output files, and what made the most efficient session cost only 5 tool calls.

**TL;DR**: The Hermes relay pattern (Hermes orchestrates, Claude CLI executes) ran stably across 3 projects. The dental research sessions wasted 3 runs before a single line addition—`"Do not ask questions."`—finally unblocked output. The best session (Session 6) ran 5 tool calls and finished in 4 minutes because all context was pre-loaded in `brief.md`.

## Processing 365KB of Raw JSON Into Structured Content Candidates

Session 1 started with `2026-05-27-daily-intel-raw.json`—a 365KB raw JSON file from the daily intelligence crawl. The goal: extract two separate content candidate lists. One for general-audience card-news style AI content. One for expert-level intelligence briefings. Two files out.

The core prompt:

```
Select and organize general-audience AI card-news content candidates
and expert-level AI intelligence content candidates
from today's collected data.
Use only /Users/jidong/spoonai/crawl/newsite/2026-05-27-daily-intel-raw.json as the source.
```

Claude ran Bash 28 times—parsing the JSON, extracting sections, restructuring by content type, then writing `.md` and `.json` output files. 2 minutes, 32 tool calls total.

What made this session efficient: the prompt had a single, unambiguous source file and two clearly defined output types. No format guessing, no reference hunting, no "what does the current file look like" loop. Claude went straight to parsing.

Session 2 shifted to growth and monetization signal collection: Product Hunt, Show HN, GitHub Trending. The previously collected Reddit/HN data turned out to be empty, so Claude fell back to WebFetch and pulled data directly—that's where 15 of today's 15 WebFetch calls originated. Checking the existing file format, then generating `growth-sponsor-signals.md` took 4 minutes and 24 tool calls.

## 3 Sessions, 0 Files Written: The Dental Research Deadlock

This was the most wasteful stretch of the day.

Session 3 had a clear objective: generate or update three files—`2026-05-27-daily-update.md`, `rolling-knowledge-base.md`, and `source-index.md`. Claude scanned the existing file structure, built a `plan.md`, and ran through 18 Bash calls and 5 Reads. Write count: 1. And that 1 Write was the `plan.md`. Actual deliverables: zero.

Session 4 tried again. 13 Reads, 10 Bash calls. One minute spent checking file headers, confirming formats, understanding the directory structure. Write count: 0.

The problem is structural. When sessions are split, the next session has no memory of the previous one. It has to pay the "what does the current state look like" cost from scratch. Reads go up. Bash calls go up. Actual output stays at zero because the session spends its budget on orientation rather than generation.

Session 5 had one additional line in the prompt:

```
Do not ask questions.
```

That unblocked execution. Session 5 ran 11 Reads and 8 Bash calls before finally producing output.

The fix isn't just `"do not ask questions."` It's upstream. Two approaches that prevent this pattern:

1. **Explicit output paths in the prompt**: When the previous session generates `plan.md`, the next prompt should reference it by path—`"Read /path/to/current/plan.md and execute step 3."` The session skips re-orientation entirely.
2. **Don't split sessions for a single task**: If the full task can complete in one session, keep it in one session. Context overhead from splitting always exceeds the marginal cost of running longer.

Adding `"Do not ask questions"` as a default in Hermes prompts eliminates the orientation-then-stall pattern even when sessions do get split.

## The Most Efficient Session: 5 Tool Calls, 4 Minutes

Session 6's prompt was the shortest of the day:

```
Read brief.md and create the required report files exactly under outputs/.
You may use web only if available, but do not ask questions.
Keep evidence labels explicit.
Produce a clean mobile-friendly Korean HTML technical report for PDF export
and a concise short_summary.md.
```

Result: Bash ×2, Write ×2, Read ×1. 5 tool calls. Two files created—`report.html` and `short_summary.md`. 4 minutes elapsed.

Sessions 1–5 averaged 22 tool calls each. Session 6 ran at 5. The difference isn't task complexity—generating a structured HTML report is more involved than parsing a JSON file. The difference is that `brief.md` contained everything Claude needed: the scope, the output format, the evidence labeling requirement, the target use case (mobile-friendly, PDF export). Claude skipped straight to execution.

The `brief.md` pattern is the practical equivalent of "don't make the agent re-read the codebase." It's a handoff document—not a long project spec, just enough context to skip the orientation phase entirely.

## How the Hermes Relay Pattern Actually Works

Looking at today's sessions, the CLAUDE.md Hermes rules are functioning as designed.

Hermes receives the user's request and packages it for Claude CLI—as a `brief.md`, a `plan.md`, or a structured long-form prompt. Claude CLI receives the package, reads the relevant files, makes decisions, and produces output. Hermes relays the result. That's the complete loop.

Session 3's `plan.md` creation fits this structure too. Plans are orchestration infrastructure—they describe what Claude CLI should do, not what the actual deliverables look like. Hermes can write `plan.md` directly because it's a relay artifact. The actual content files—`daily-update.md`, `rolling-knowledge-base.md`—belong to Claude CLI's execution domain.

The boundary matters in practice. When an orchestrator starts producing deliverables directly, the validation loop breaks. The executor has mechanisms for checking its own output against requirements and iterating. The orchestrator doesn't. Keeping roles separated preserves that loop.

## Tool Usage: The 9:1 Read/Write Ratio

| Tool | Count | Primary Use |
|------|-------|-------------|
| Bash | 71 | File checks, JSON parsing, directory inspection |
| Read | 36 | Existing file structure, format confirmation |
| WebFetch | 15 | Product Hunt, Show HN direct scraping |
| Write | 4 | Actual deliverable generation |
| ToolSearch | 1 | WebFetch schema loading |

The Write count of 4 is the headline number. Across 6 sessions, Claude created 4 files. That's the actual output. The 36 Reads went mostly toward format confirmation—checking what an existing file looks like before writing a new one in the same style.

A 9:1 Read/Write ratio means: for every file written, 9 files were read. In raw terms, that's 32 tool calls spent on orientation for every 4 calls spent on output.

Two ways to bring that ratio down:

**Embed the format reference directly in the prompt**: Instead of letting Claude hunt for an existing file to copy the format from, paste the relevant section of the format spec into the prompt. One less Read per output file.

**Standardize templates at fixed paths**: If all daily update files follow the same structure, maintain a canonical `_template.md` at a known path. Every session that needs the format reads one file instead of hunting through recent examples. Session 6's `brief.md` approach already does this at the session level—extending it to recurring task types is the logical next step.

> 6 sessions, 127 tool calls. 4 files actually written. Redesign the context delivery layer and the tool call count drops by half.

## What This Actually Measures

The Read/Write ratio isn't just an efficiency metric. It's a measure of how much context has been externalized into prompts versus left for the model to reconstruct.

When the ratio is 9:1, the model is doing a lot of archaeological work—reading existing files to figure out conventions, formats, and current state that could have been stated explicitly. That work is necessary and often correct, but it has a cost: tool calls, latency, and the occasional wrong inference.

When the ratio drops toward 2:1 or 3:1 (closer to Session 6's inverted 1:2), most of the context was provided upfront. The model spends most of its budget generating, not orienting.

The `brief.md` handoff pattern is the simplest way to push that ratio down for recurring task types. For one-off tasks, explicit path references cover most cases. Neither requires changing the model or the tooling—just the shape of the prompt.

Today's sessions demonstrate both ends of that spectrum in the same day, which makes the comparison concrete: same model, same infrastructure, 4× difference in tool call efficiency.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
