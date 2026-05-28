---
title: "Claude Opus 4 Made 8 Tool Calls, Read 6 Files, and Wrote Nothing — Here's Why That's a Win"
project: "portfolio-site"
date: 2026-05-29
lang: en
pair: "2026-05-29-portfolio-site-ko"
tags: [claude-code, automation, spoonai, content-pipeline, read-only]
description: "Why a Claude Code session with Read: 6, Bash: 2, Write: 0 isn't a failure — and how separating collection from generation makes an AI content pipeline more reliable."
---

8 tool calls. 6 Reads. 2 Bash calls. Zero writes.

**TL;DR:** The daily collection phase of the SpoonAI news site content pipeline ends without creating any files. Reading intel files and evaluating candidates *is* the job for this session — nothing more.

## Why Zero Writes Is a Feature, Not a Bug

Session 1's goal was to collect and evaluate content candidates for SpoonAI's news site on `2026-05-29`. The target files lived under `/Users/jidong/spoonai/crawl/newsite/`:

- `2026-05-29-daily-intel.md` — intel for general card-news AI overviews
- Additional crawl files from that day

The 6 `Read` calls consumed those files. The 2 `Bash` calls checked file existence and directory state. `Write` stayed at zero because this session was the *collection and evaluation phase*, not the *generation phase*.

Separating pipeline stages clarifies responsibility at each step. The collection session reads intel and filters candidates. The generation session takes those candidates and builds actual posts. Merge both into a single session and it gets longer — and the first pass starts missing output.

## Why Claude Opus 4.7 for a Read-Only Session

Using `claude-opus-4-7` here is worth noticing. Pure file reading could run on a lighter model.

The SpoonAI news site intel pipeline handles two distinct content types: general AI overviews for card-news format, and expert-level AI intelligence for deep-analysis posts. Deciding which topics fit which format isn't simple classification — it requires reading mixed signals inside the intel files and evaluating content value.

Putting Opus in the collection phase raises candidate selection quality. The tradeoff is that this session stays short — the `0min` in the session log proves it. The heavier the model, the more important it is to keep each stage small and focused.

## What "0 Minutes" Actually Means

The session log shows `0min`. That doesn't mean it was instant — it means the actual duration fell below the measurement unit.

`Read` + `Bash` sessions run fast. They don't generate code, call external APIs, or run web searches. Because the intel files are pre-crawled and ready locally, there's no network wait.

This structure only holds if the crawl stage runs reliably upstream. If `/Users/jidong/spoonai/crawl/newsite/` is missing the day's files, the collection session has nothing to evaluate. The real risk in this pipeline isn't the collection session — it's the crawl stage.

## The Open Question in This Pipeline Design

If the collection session evaluated candidates, those results need to land somewhere the next generation session can read. The `Write: 0` stat leaves a gap here — if evaluation results live only in the model's context and never write to a file, that context disappears when the session ends.

A robust pipeline should produce an intermediate artifact at the end of the collection session — something like `candidates.md`. Then the generation session prompt can open with "the collection session selected these candidates." In the current structure, both sessions have to run in the same context window to stay connected.

That's the one thing left to fix.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
