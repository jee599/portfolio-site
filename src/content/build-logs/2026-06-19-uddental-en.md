---
title: "I Burned 3 Claude Code Sessions on a Plumbing Test — One Wrong API Key Did It"
project: "uddental"
date: 2026-06-19
lang: en
pair: "2026-06-19-uddental-ko"
tags: [claude-code, automation, dental-promo, debugging, api-key]
description: "Built an automation pipeline for uddental dental clinic. Two sessions died with Invalid API key. Fixed it, passed the plumbing test on session 3."
---

Three sessions. One tool call. Zero sessions actually worked until the third.

**TL;DR** — I was setting up the automation pipeline for the uddental dental clinic project and ran a plumbing test to verify basic I/O flow. Sessions 1 and 2 terminated immediately with `Invalid API key` — the model logged as `<synthetic>`, which means no valid Anthropic model was bound at all. Fixed the key, opened session 3, got `claude-opus-4-8`, and the test passed in a single `Write` call.

## What Is This Pipeline Even For?

The uddental project (`~/dental-promo/dongbaek-uddental/`) is a local automation setup for a dental clinic's online marketing operations. The directory structure looks like this:

```
~/dental-promo/dongbaek-uddental/
├── clinic.json          # clinic metadata and config
├── history.json         # audit trail of past runs
└── cache/               # intermediate outputs
```

Scripts read `clinic.json`, generate blog posts or ad performance reports, and write everything to `_cron/logs/`. A cron job eventually ties it all together. But before wiring up the cron, I needed to confirm that the pipeline's basic flow was unblocked — that data could move from source to sink without hitting a wall.

That's the plumbing test. Not a unit test. Not a smoke test. A literal sanity check: can I write a single line to a log file?

## The Prompt That Started It

The first prompt was as minimal as the task itself:

```
Read /Users/jidong/dental-promo/dongbaek-uddental/clinic.json
Write 'plumbing OK: <slug>' to
/Users/jidong/dental-promo/_cron/logs/plumbing-test.txt
```

Three instructions. One input path, one output path, one output string. No chain-of-thought. No JSON formatting. No "please also verify that...". Just read and write.

Session 1 never executed a single tool call. It terminated at session entry. The model ID logged as `<synthetic>` — which is not a real Anthropic model identifier. That's the fingerprint of a session where the API key didn't authenticate.

## When You Blame the Prompt for a Key Problem

My first instinct after session 1 failed: the prompt is too complex. Let me cut it down.

So for session 2, I removed even the `clinic.json` read:

```
Write exactly the line 'plumbing OK' to
/Users/jidong/dental-promo/_cron/logs/plumbing-test.txt.
Nothing else.
```

One sentence. One tool call implied. No reads, no slugs, no conditionals.

Session 2: same result. `<synthetic>` model, 0 tool calls, 0 seconds of runtime. The session never started.

This is a common debugging trap: when a system fails silently, you start changing the last thing you touched. I changed the prompt. But the prompt was fine. The authentication layer never even got to read the prompt.

The problem was always the API key.

## The Silent Failure Mode That Makes This Dangerous

Here's what makes invalid API key errors particularly rough in automation pipelines: they don't scream. When Claude Code can't authenticate, it doesn't print a giant `ERROR: INVALID_API_KEY` to stdout. The session exits early, the model ID comes back as `<synthetic>`, and if you're not checking that field — or if you're running headless — you might not notice immediately.

Compare this to, say, a missing file path: you get a clear `ENOENT` or a tool error with a specific message. The feedback loop is tight. With auth failures in a multi-step pipeline, the feedback loop is loose. You see "session ended" and have to dig to find why.

The `<synthetic>` model tag is the tell. If you ever see that in your Claude Code session logs, check your API key before you do anything else.

## Session 3: The Fix

After correcting the external API key configuration, I opened session 3.

The model this time: `claude-opus-4-8`. A real model. A real session.

The execution was unremarkable in the best way:

- 1 `Write` tool call
- File created: `~/dental-promo/_cron/logs/plumbing-test.txt`
- Content: `plumbing OK`

That's it. Total tool calls across all three sessions: 1. Total useful sessions: 1. Total time wasted on sessions 1 and 2: 0 minutes of Claude runtime, but real minutes of my time figuring out why nothing was happening.

## The Rule I'm Adding to Every New Pipeline

New rule: **API key validation is step zero, not step one.**

Before any plumbing test, before any `clinic.json` read, before anything — confirm that the session can actually authenticate. The easiest way to do this: run a trivial `Write` call in a fresh session and verify the model ID is a real Anthropic model (not `<synthetic>`).

The plumbing test confirms that data flows. But you need water pressure first. Checking that the tap opens is a separate verification that should happen before the plumbing test, not during it.

In practice this means adding a pre-flight step to the pipeline init sequence:

```
# Pre-flight check (before any real work)
1. Verify API key is set and non-empty
2. Run a no-op tool call and confirm model ID != <synthetic>
3. Only then proceed to plumbing test
```

This adds maybe 10 seconds per pipeline initialization. It saves the kind of confusion that turns a 2-minute task into a 20-minute debugging session.

## Tool Usage

| Tool | Count |
|------|-------|
| Write | 1 |
| **Total** | **1** |

3 sessions. 0 minutes of Claude runtime on sessions 1 and 2. 1 effective tool call on session 3.

Lowest ratio of useful work to total attempts I've had on this project — and it was entirely self-inflicted.

## What's Next for the uddental Pipeline

The plumbing test passed. Now the pipeline can actually start:

1. **Dynamic slug resolution** — Read `clinic.json` and pull the clinic slug dynamically instead of hardcoding it. Session 3 used a static `plumbing OK` string; production code should use `plumbing OK: dongbaek-uddental`.

2. **Cron integration** — Wire the plumbing test into the cron job as a health check. If the cron can't write to `_cron/logs/`, something is broken upstream and nothing else should run.

3. **Blog post generation** — The end goal: feed `clinic.json` + cached data into a Claude Code session that generates a blog post draft and writes it to the output directory. This is where the actual automation value is.

The plumbing is clear. Time to run water through it.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
