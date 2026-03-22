---
title: "4 Claude Code Sessions, 0 Tool Calls: How One Bad API Key Silenced My Automation"
project: "saju_global"
date: 2026-03-22
lang: en
pair: "2026-03-22-saju_global-ko"
tags: [claude-code, api, debugging, saju]
description: "4 automated Claude Code sessions ran and produced nothing. Zero tool calls, zero file changes. A single invalid API key was the culprit."
---

Four sessions ran. Zero tool calls. Zero file changes. Zero output.

**TL;DR** — An expired external API key brought down all automated Claude Code sessions for saju_global. No alerts, no stack traces. Sessions opened and closed silently. Replacing the key fixed everything.

## When Automation Dies Without Making a Sound

Usually when automation breaks, you know about it. Error logs pile up. A Slack notification fires. A deployment goes red.

This wasn't that.

Sessions were triggering on schedule — build log generation, blog draft creation. The user prompts were landing correctly. But somewhere in the tool execution path, authentication against an external API was failing, and Claude Code was exiting without doing anything at all.

No errors surfaced. The session just... ended.

The only clue was a single message buried in the session output: `Invalid API key`.

Here's what the session stats looked like:

| Metric | Value |
|--------|-------|
| Total sessions | 4 |
| Total tool calls | 0 |
| Files modified | 0 |
| Root cause | Invalid API key |

## What Expired

saju_global uses an external LLM API to interpret the results of its saju (Korean fortune-telling) calculations. The key for that API had either expired or was misconfigured in the environment.

The key itself wasn't the problem — those things expire. The problem was how the failure propagated. When the API key check failed, the entire session terminated silently. Nothing in the output indicated which step had failed, or why execution stopped. I only found out later by checking that the automation had produced nothing.

The most dangerous kind of error is one that looks like no error at all.

## After Replacing the Key

Swapped the external API key with a valid one, verified the environment variable was set correctly, and ran a test call to confirm:

```bash
# Verify key validity
curl -H "Authorization: Bearer $EXTERNAL_API_KEY" https://api.example.com/health
# → 200 OK
```

That was it. Sessions started producing output again. If you're seeing sessions with zero tool calls, the first thing to check is the health of your external dependencies — keys, tokens, connection strings.

## A Quiet Failure Mode in Claude Code Automation

This wasn't a code bug. It was an environment bug.

When a Claude Code session starts, it reads context and builds a plan before making any tool calls. But if the first tool call in that plan hits an external API with a bad key, authentication fails and the session stalls. Everything downstream is blocked. No retry, no fallback, no alert.

Automated pipelines need explicit logic to catch these early failures. Two things to add next:

- Run an external API health check at session start before anything else
- Fire an alert when any session ends with zero tool calls

> Silent failures in automation can be worse than having no automation at all. At least without it, you'd do the work manually.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
