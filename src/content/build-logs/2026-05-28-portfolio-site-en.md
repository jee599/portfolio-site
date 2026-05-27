---
title: "10 Bash Calls, 0 Files: What a Dead Claude Code Session Reveals About Pipeline Friction"
project: "portfolio-site"
date: 2026-05-28
lang: en
pair: "2026-05-28-portfolio-site-ko"
tags: [claude-code, spoonai, bash, daily-intel, automation]
description: "10 Bash calls, 0 files created. A Claude Code session that never reached Write stage exposes the hidden cost of pre-flight exploration in AI automation pipelines."
---

10 Bash calls. Zero writes. Zero reads. The session closed with nothing on disk — and that's exactly what made it worth logging.

**TL;DR** The goal was to pull `2026-05-28-daily-intel-raw.json` from SpoonAI and produce two output files: a `.md` and a `.json` with curated AI intel candidates. The session spent all 10 tool calls on exploration and never reached the Write stage. The day before, an identical task took 32 tool calls and finished in under 2 minutes. The gap between those two sessions is the story.

## What 10 Bash Calls Actually Look Like

Before Claude writes a file, it checks things. JSON structure, output directory existence, previous day's format, schema from yesterday's output. Every one of those checks is a Bash call.

Today's 10 calls were almost entirely this category — pre-flight exploration:

```bash
cat 2026-05-28-daily-intel-raw.json | head -100
ls -la /Users/jidong/spoonai/crawl/newsite/
ls 2026-05-27-daily-intel.md   # check previous day's format
```

The pattern: confirm what the JSON looks like, compare against yesterday's output format, verify the target directory exists. This groundwork has to happen before Write can produce something accurate. If you skip it and write with the wrong schema, you pay a higher cost to fix or rewrite the output.

So 10 Bash calls isn't "nothing happened." It's "the exploration budget ran out before execution started."

## From Raw JSON to Card-News Candidates

The session's actual goal was extracting two types of content from `2026-05-28-daily-intel-raw.json`:

- **General audience**: card-news-style AI news anyone can follow
- **Expert audience**: intelligence content for product managers and engineers

Two output files:

```
/Users/jidong/spoonai/crawl/newsite/2026-05-28-daily-intel.md
/Users/jidong/spoonai/crawl/newsite/2026-05-28-daily-intel.json
```

The prompt used a Socratic Scope Gate format — explicitly stating goal, scope, what will be done, what won't be done, and assumptions:

```
1) Goal: Collect 2026-05-28 Daily AI Intel candidates for SpoonAI's new site.
2) Scope: Use only 2026-05-28-daily-intel-raw.json as source.
3) Action: Select and format raw candidates → produce .md + .json.
4) Out of scope: No changes to existing pipeline.
```

This structure eliminates the "is this what you meant?" loop. Claude skips the clarification dance and starts executing. But in this session, execution never started.

## Why the Session Stalled Before Writing

Two possible causes. Either the JSON was complex enough that exploration consumed the session budget, or the context limit was hit before reaching the Write stage.

Comparing to May 27 makes the gap visible. That session ran 32 tool calls on the same SpoonAI raw JSON task and produced both output files in under 2 minutes. Today stalled at 10.

Ten calls means the session ended during structure analysis. Bash confirmed things. No Write followed.

The lesson isn't that Bash exploration is wrong — it's that exploration and execution shouldn't depend on being in the same session. When exploration fills the context and the session closes, the next session starts from scratch. Same exploration, again.

## The Socratic Gate Doesn't Replace Filesystem Awareness

The prompt specified scope and goal clearly. Exploration still happened. The reason: the prompt answers "what to build" but not "what the current files look like."

Before writing, Claude verifies:

- Does the output directory exist?
- What does last day's file format look like?
- What are the top-level keys in the raw JSON?
- What's the schema of yesterday's `.json` output?

None of that comes from the prompt. It requires actually reading files. That's where the 10 Bash calls went.

Two fixes address this:

**Option A — embed the reference in the prompt.** Include the previous day's output path and a sample directly in the prompt context. Claude skips the discovery step and goes straight to writing.

**Option B — fix the reference location.** Keep a canonical format reference at a stable path. Every session reads from that same location instead of hunting for yesterday's output.

Both approaches share the same principle: pay the exploration cost once, upfront, so subsequent sessions don't repeat it.

## Automation Pipelines Accumulate Maintenance Debt

SpoonAI generates a raw JSON every day. The conversion step — raw JSON to curated `.md` + `.json` — runs daily. When a session stalls at the exploration phase, that day's intel file doesn't get created. The next session has to pick it up from scratch.

This is manageable once. It compounds over weeks.

The structural fix is a checkpoint:

```
exploration result → save to checkpoint.json
next session       → read checkpoint.json → skip to Write stage
```

This mirrors the `brief.md` pattern validated in May 27 sessions 6–7. Pre-paying the exploration cost shortens the execution phase. The checkpoint becomes the handoff between sessions — exploration done once, execution picks it up cleanly.

Without the checkpoint, every session that hits a context limit before writing restarts the same exploration. The pipeline looks like it runs daily but produces gaps on context-heavy days.

## The Numbers

| Metric | Value |
|--------|-------|
| Sessions | 1 |
| Total tool calls | 10 |
| Bash | 10 |
| Read | 0 |
| Write | 0 |
| Files created/modified | 0 |

Comparison with May 27's equivalent session:

| Metric | May 27 | May 28 |
|--------|--------|--------|
| Tool calls | 32 | 10 |
| Files created | 2 | 0 |
| Time to completion | ~2 min | — |

> A session that produces no files still leaves data. The exploration pattern, where it entered, why it stopped. This log is the next session's starting point.

## What a Zero-Output Session Is Actually Worth

The instinct is to treat a session with no written output as waste. That framing misses what's in the data.

A session that ran 10 Bash calls and stopped tells you:

1. The exploration phase is long enough to consume a session budget
2. The pipeline has no checkpoint between exploration and execution
3. The prompt lacks enough context to skip the discovery step

Each of those is actionable. None of them are visible from a session that "worked" — where exploration was fast and execution followed immediately.

Zero-output sessions reveal friction that successful sessions hide. The May 27 session that produced two files in 2 minutes didn't expose this. Today's dead session did.

Logging both is how the pipeline improves.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
