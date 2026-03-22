---
title: "4 Claude Code Sessions, 0 Tool Calls: How One Bad API Key Killed a Full Day"
project: "saju_global"
date: 2026-03-23
lang: en
pair: "2026-03-23-saju_global-ko"
tags: [claude-code, debugging, api-key, automation]
description: "Ran 4 Claude Code sessions on saju_global. Total tool calls: 0. A single invalid API key blocked every session before a single file could be touched."
---

On 2026-03-22, I opened 4 Claude Code sessions. The total number of tool calls across all of them was 0.

**TL;DR** — Every session died at the same point: `Invalid API key · Fix external API key`. One bad external API key was enough to prevent Claude Code from doing anything at all.

## Four Sessions. Nothing to Show For It.

Sessions 1 and 3 had the same prompt: generate Korean and English build logs in `build-logs/`, then update `STATUS.md`. Sessions 2 and 4 were also identical — write a blog draft to `blog-drafts/2026-03-22-draft-ko.md`.

All four ended the same way. The moment Claude Code tried to make an external API call, authentication failed. Zero edits, zero reads, zero bash commands. No files modified, no files created.

This isn't a Claude Code failure. The prompts were well-formed. The tasks were clear. Claude Code was working exactly as designed — it just couldn't get past the first external dependency check.

## What Actually Blocked It

The `saju_global` project integrates with external APIs. The session logs alone don't pinpoint which service's key was invalid, but the failure pattern is consistent: Claude Code hit an auth error before making its first tool call, and the entire session stopped there.

There are three common reasons this happens. The key expired. The environment variable was misconfigured. Or the project moved to a different machine and the `.env` file didn't come with it. The fix is always the same — re-issue the key or re-verify the environment variables.

## The Weakest Link in Any Automation Pipeline

When you automate repetitive work with Claude Code — generating build logs, drafting blog posts, updating `STATUS.md` — a single prompt can handle all of it. That's the upside. The downside is that the entire AI automation pipeline collapses the moment any external dependency breaks.

This incident is a textbook example. The prompts were correct. Claude Code was functional. The intended work was unambiguous. But one invalid API key meant four sessions produced nothing.

The more you invest in automation, the more critical external dependency management becomes. Practical mitigations: set up key expiration alerts, or add an environment variable check script that runs before starting a session.

## Why Log a Zero-Output Day

A session with 0 tool calls seems like it has nothing worth logging. That's exactly why it's worth logging.

Anyone who uses Claude Code regularly will eventually have a day like this — where the blocker isn't the code, isn't the prompt, and isn't Claude Code itself. It's infrastructure. A key. An env var. Something outside the project that quietly breaks the whole flow.

Recording the pattern means the next time it happens, you spend 2 minutes finding the cause instead of 2 hours.

Today, saju_global is paused. Fix the key, and it runs again.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
