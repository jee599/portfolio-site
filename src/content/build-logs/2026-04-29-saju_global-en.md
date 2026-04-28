---
title: "Claude Couldn't Write Its Own Logs: An Expired API Key Kills the Build Log Pipeline Twice"
project: "saju_global"
date: 2026-04-29
lang: en
pair: "2026-04-29-saju_global-ko"
tags: [claude-code, api, automation, debugging]
description: "The saju_global build log automation ran twice on 2026-04-28, failed both times, and logged exactly zero tool calls. An expired Anthropic API key was the culprit."
---

On 2026-04-28, the saju_global build log automation pipeline spun up twice. It failed both times. Combined tool calls across both sessions: **zero**.

**TL;DR** An expired `ANTHROPIC_API_KEY` prevented the Claude-powered build log pipeline from initializing at all. No files were read, no commit diffs were analyzed, no logs were written. The fix was a single environment variable replacement. This build log existing is proof the pipeline is back.

## When Claude Can't Write Claude's Logs

The saju_global build log pipeline runs on Claude API (`claude-haiku-4-5-20251001`). The workflow is dead simple on paper: feed commit diffs into Claude, get structured build logs back. It's a fully automated paper trail for every session of work on the project.

It's been working. Until 2026-04-28.

Session 1 started. It hit the Anthropic API authentication check immediately:

```
Error: Invalid API key
```

Session terminated. Zero tool calls. Zero file writes.

Session 2 started — a retry, or a second scheduled run. Same result:

```
Error: Invalid API key
```

Session terminated. Zero tool calls. Zero file writes.

Claude couldn't write Claude's logs. The `ANTHROPIC_API_KEY` environment variable had become invalid — either expired, rotated and not propagated, or invalidated by some account-level event.

There's a particular kind of irony in an AI-powered automation pipeline failing because the AI lost its credentials. The code is fine. The logic is fine. The integration is fine. The API key is not fine. And that's all it takes.

## What Silent Failures Look Like

When an API key expires, pipelines don't fail dramatically. There's no cascade of exceptions through application logic. No partial state. No stack trace pointing to a specific file. The failure is fast, clean, and completely invisible unless you're actively looking for it.

Here's what the failure looks like from the outside:

- Pipeline is scheduled ✓
- Pipeline starts ✓
- Pipeline exits ✓
- Output files: none
- Status: appears to have completed

From the inside, `Invalid API key` surfaces on the first API call. In Claude Code's case, that's during session initialization — before any tools are called, before any files are read, before anything useful happens. The session fails at the authentication layer and exits.

For monitoring purposes, a failed Claude Code session with zero tool calls looks identical to a session that simply found nothing to do. There's nothing in the session log to differentiate the two without examining the specific error output.

That's the trap with silent failures: **zero-output success is indistinguishable from zero-output failure**. Unless you're specifically checking whether the expected output was produced, you won't know the pipeline failed until you notice the gap.

## The Same Root Cause, Twice, Same Day

What makes 2026-04-28 notable is that the build log pipeline failure wasn't the only incident. On the same day, the saju_global *service itself* went down for the same structural reason: an external API key expired, and integrations with third-party APIs began failing across all 8 language regions the service supports.

Two separate systems. Same day. Same root cause.

The pattern both incidents share:

1. **External dependency** — Claude API, or another third-party service
2. **Authentication credential expires** — silently, at some point before the incident
3. **System attempts normal operation** — pipeline runs, service handles requests
4. **Silent failure** — nothing executes, no alert fires
5. **Manual discovery** — someone notices missing output and investigates

The saju_global service outage had direct user impact. The build log pipeline failure had zero user impact — it's an internal automation tool. The severity is completely different. The *structure* is identical.

When you see the same failure mode hit two different systems on the same calendar day, that's not coincidence. That's a gap in how external credentials are managed and monitored.

## Why This Happens

Anthropic API keys don't expire on a fixed schedule by default, but there are several ways a key becomes invalid without any warning reaching your pipeline:

**Rotation without full propagation.** You rotate keys for security hygiene. You update the key in your local environment but forget to update it in Cloudflare Pages, GitHub Actions secrets, or wherever the cron job runs. The pipeline runs against the old key.

**Account-level events.** Billing issues, plan changes, security alerts, or admin actions on a shared account can invalidate keys you didn't explicitly rotate. No notification reaches the pipeline.

**Configured expiry forgotten.** You set an expiration date when generating the key — good security practice — but didn't schedule a renewal reminder.

In this case, the exact reason wasn't captured. The session that would have logged that context couldn't start. What's clear: the key was invalid, two runs hit the failure, and nobody found out until someone noticed the missing logs.

## The Fix

No code change. Purely operational:

```bash
# Verify the key is invalid
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-4-5-20251001","max_tokens":1,"messages":[{"role":"user","content":"ping"}]}'
# → {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}

# Issue a new key at console.anthropic.com
# Replace the environment variable in every environment that uses it
export ANTHROPIC_API_KEY="sk-ant-..."
```

For Cloudflare Pages or GitHub Actions, the environment variable gets updated through the dashboard or secrets settings. No code deploy — just a config update and a new run.

The fact that this build log was generated is operational confirmation the fix worked.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>fix</span> <span class=msg>fix: replace invalid external API key</span></div>
</div>

<div class=change-summary>
<table>
<thead><tr><th>Item</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td>ANTHROPIC_API_KEY</td><td>expired / invalidated</td><td>newly issued key</td></tr>
<tr><td>Build log pipeline</td><td>failed twice (0 tool calls)</td><td>resumed normally</td></tr>
<tr><td>Sessions</td><td>2 (failed)</td><td>—</td></tr>
</tbody>
</table>
</div>

## What Should Have Caught This

Three specific gaps made this failure hard to catch before multiple runs were lost:

**No pre-flight auth check.** The pipeline assumes a valid key and proceeds. A health check at startup — one that fails loudly on 401 — would surface the error immediately on the first affected run.

**No output-presence monitoring.** If the pipeline is supposed to produce a file and doesn't, that absence should be detectable. A post-run check for expected output would catch zero-output failures regardless of cause.

**No 401 alerting.** When the API returns a 401, that information should reach a human in minutes. Instead it was buried in session output that nobody reads until someone goes looking.

Here's the shape of a pre-flight check:

```typescript
async function verifyApiKeyBeforeRun(): Promise<void> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1,
      messages: [{ role: "user", content: "ping" }],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      await sendAlert({
        severity: "critical",
        title: "Build log pipeline: API key invalid",
        message: "ANTHROPIC_API_KEY returned 401. Pipeline cannot start.",
      });
      process.exit(1);
    }
    throw error;
  }
}
```

The `sendAlert` connects to whatever channel gets monitored — Slack, Discord, PagerDuty, email. The design principle is: **fail loud, not silent**. A pipeline that exits with a clear error and fires an alert is far more useful than one that exits with zero output and zero indication that anything went wrong.

## External Credentials Are Invisible Dependencies

The broader lesson from two incidents on the same day: external credentials are invisible until they stop working.

When a service you own breaks, you have logs, error tracking, and alerts. When an external credential expires, you often have nothing — because the failure happens before your code runs.

The mental model shift: treat API keys like infrastructure, not configuration. You wouldn't run production infrastructure without health checks. You shouldn't run production pipelines against API keys that have no validity monitoring.

Approaches that would prevent this class of failure:

- **Pre-flight health checks**: verify auth at startup, fail loudly on 401
- **Output monitoring**: after each scheduled run, confirm expected output exists
- **Synthetic monitoring**: ping the API on a regular schedule, alert on auth failures independent of pipeline runs
- **Rotation reminders**: schedule alerts N days before planned key rotation to verify propagation across all environments

None of these are complex. The reason they often don't exist is that key expiry happens infrequently enough that building the monitoring feels like overkill — until two systems fail on the same day for the same reason.

## What's Next

One thing goes on the backlog: when `ANTHROPIC_API_KEY` returns `401`, fire an immediate alert.

The pipeline should fail loud, not quiet. A cron job that silently produces nothing is operationally equivalent to a cron job that doesn't exist — except worse, because you think it's working.

Today's log getting generated is the happy path. The goal is making the failure path equally observable.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
