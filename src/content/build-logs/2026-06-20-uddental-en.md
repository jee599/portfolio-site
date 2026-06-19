---
title: "2 API Key Failures, 1 Tool Call: Passing the uddental Cron Pipeline Plumbing Test"
project: "uddental"
date: 2026-06-20
lang: en
pair: "2026-06-20-uddental-ko"
tags: [claude-code, automation, cron, debugging, dental-promo]
description: "Three sessions, two dead on Invalid API key, one success with claude-opus-4-8 and a single Write call. What a plumbing test reveals about AI automation pipelines."
---

Three sessions. Two died instantly on `Invalid API key`. The third one — running `claude-opus-4-8` — made exactly one tool call, wrote a single line to a file, and the plumbing test was done.

That's the whole story. But what it tells you about building reliable cron automation with AI agents is worth unpacking.

**TL;DR** — Before wiring up any real logic in the uddental dental clinic automation pipeline, I ran the simplest possible end-to-end test: read a JSON file, write one line to a log. Two sessions failed at the infrastructure layer (API key not passed correctly in the cron context). The third passed in under a minute with one tool call. The test itself is trivial — what it validates is not.

## What Is a Plumbing Test and Why Run One First

The term comes from Unix tool philosophy. Before you worry about what flows through the pipes, make sure the pipes are connected.

In software engineering, a plumbing test is the minimum viable end-to-end check — not a unit test, not an integration test in the traditional sense. It's "does water flow at all?" You're not checking water pressure or purity. You're checking that the pipes exist and are connected.

For the uddental cron pipeline, the architecture looks like this: dental clinic data lives under `~/dental-promo/dongbaek-uddental/`, structured as `clinic.json` plus a cache and history directory. A scheduled agent periodically reads this data and produces outputs — blog drafts, place listing updates, ad performance reports. The agent runs via cron, which means it runs headless, unattended, in a different execution context than an interactive session.

Before building any of that real logic, the question is: **can an agent even read and write files in this environment?**

The plumbing test prompt was deliberately minimal:

```
Read /Users/jidong/dental-promo/dongbaek-uddental/clinic.json and
write exactly one line 'plumbing OK: <slug>' to
/Users/jidong/dental-promo/_cron/logs/plumbing-test.txt.
Do nothing else, no sync, no commits.
```

One read. One write. Nothing else. If that works, the foundation is solid enough to build on.

## Session 1: Dead on Arrival

The first session never got off the ground.

The agent ran under a `<synthetic>` model identifier — already a signal that something was wrong with the execution context. Within seconds: `Invalid API key`. Zero tool calls. The session started and terminated without doing anything.

This is the nightmare scenario for cron automation: the job fires, the process starts, and the failure happens before the agent can even report what went wrong. If you don't have logging around the process itself, you'd see nothing but a missing output file.

## Session 2: Same Error, Simpler Prompt

I simplified the test to remove any possible ambiguity. No file read, no slug interpolation — just write one static line.

```
Write exactly the line 'plumbing OK' to
/Users/jidong/dental-promo/_cron/logs/plumbing-test.txt.
Nothing else.
```

Same result. `Invalid API key`. Zero tool calls. Zero seconds of useful work.

At this point the diagnosis was clear: this wasn't a prompt problem. The API key wasn't being passed into the cron execution context correctly. The agent process was starting but couldn't authenticate to the Claude API.

This is one of the more annoying failure modes in automation: the error happens at a layer you don't normally think about when writing the logic. You spend time crafting the right prompt, structuring the output format, thinking about edge cases — and then the whole thing dies because an environment variable isn't set.

## Session 3: claude-opus-4-8, One Tool Call, Done

After fixing the API key delivery in the cron configuration, the third session ran cleanly.

Model: `claude-opus-4-8`. Same prompt as session 2.

Agent response:

> I'll write that exact line to the file.

Write tool. Once. File created. `plumbing OK` confirmed.

The whole session took under a minute. Total across all three sessions: 3 attempts, 1 success, 1 tool call, 1 file created.

## What Three Sessions and One Success Actually Validate

The result looks underwhelming — a file with two words in it. But the three sessions together tell you several things that matter for production automation.

**File system access works.** The agent in the cron context can read and write to `~/dental-promo/`. This sounds obvious, but it's not guaranteed. Path availability, permissions, and sandboxing behavior can all differ between an interactive session and a headless cron run. Confirmed now.

**The API key delivery path is fixed.** The same prompt failed twice with no key and succeeded once with the fix applied. That's a clean before/after. If you'd skipped the plumbing test and jumped straight to "generate a blog draft from clinic.json," you'd have seen the same failure but spent an hour debugging the prompt instead of the infrastructure.

**The agent respects scope constraints.** The prompt explicitly said `nothing else, no sync, no commit`. The agent did exactly one thing. This matters more than it sounds. In an automated pipeline, an agent that goes off-script — even helpfully — can cause unexpected side effects. Running `git commit` or `curl`ing an external API when you didn't ask for it breaks the predictability that makes automation trustworthy. The constraint held.

## The Broader Pattern: Infrastructure Before Logic

Every automation pipeline has two layers. The first is infrastructure: can the components communicate? Can the agent authenticate? Can it read and write where it needs to? The second is logic: does the agent produce correct, useful output?

Most debugging time gets spent on layer two because layer one *usually* works in development. But cron and headless execution introduce a different environment. Environment variables aren't sourced from your shell profile. File paths that exist interactively may not exist in the cron user's context. API keys passed as command-line arguments might get stripped by certain job schedulers.

Running the plumbing test first flips the debugging order. You confirm layer one is solid before you invest time in layer two. The two failures in sessions 1 and 2 took maybe five minutes total to diagnose once I knew to look at API key delivery. If I'd been three hours into building the blog generation prompt when those failures hit, the debugging would have been much messier.

## Prompt Design for Plumbing Tests

The minimal prompt worked, and that was intentional.

When you're testing infrastructure, you want the prompt to be so simple that any failure is obviously not a prompt problem. "Write one line to this file" is unambiguous. If that fails, the problem is environmental.

The explicit `nothing else` constraint served two purposes. First, it kept the test clean — you're validating a specific capability, not asking the agent to do something useful. Second, it gave you a clear success criterion. Did the file appear with exactly the right content? Pass. Anything else? Fail.

For the next phases of the pipeline, the prompts will get more complex. But they'll be built on top of confirmed-working infrastructure.

## What Comes Next

The plumbing is clear. The next sessions will run actual content through it:

- **Blog draft generation**: read `clinic.json` + recent place data, produce a full blog post draft in the right format
- **Place listing analysis**: compare current listing data against competitors, flag gaps
- **Ad performance review**: parse the cached ad metrics and produce a summary with recommended adjustments

Each of these builds on what the plumbing test confirmed: the agent can read from `~/dental-promo/dongbaek-uddental/` and write outputs to the `_cron/` directory structure.

The pipeline is designed to run unattended. The plumbing test is the proof that "unattended" is actually safe to rely on.

## Running the Numbers

| | |
|---|---|
| Sessions | 3 |
| Successful sessions | 1 (`claude-opus-4-8`) |
| Failed sessions | 2 (Invalid API key) |
| Total tool calls | 1 (Write × 1) |
| Files created | 1 (`plumbing-test.txt`) |
| Time to diagnose failure | ~5 minutes |
| Time saved by not skipping this step | hard to measure, but real |

Two sessions died before they could do anything. One session succeeded in under a minute. The delta between failure and success was a single environment variable being set correctly.

That's what plumbing tests are for.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
