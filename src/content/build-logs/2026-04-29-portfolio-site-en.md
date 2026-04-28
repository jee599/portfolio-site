---
title: "481 Files Were Fine — The Real Vercel Build Blocker Was a Missing CountUp.tsx"
project: "portfolio-site"
date: 2026-04-29
lang: en
pair: "2026-04-29-portfolio-site-ko"
tags: [claude-code, debugging, parallel-agents, spoonai]
description: "Vercel builds failed 4 days straight with a YAML error pointing to a fixed file. 481 files parsed clean. Real blocker: a missing CountUp.tsx. 2 sessions, 208 tool calls, 9 minutes to deploy."
---

Four days. Every Vercel build canceled. The error message said YAML parsing failure on a specific file. Opening that file: nothing wrong. Parsing every file in the repo: 481 files, zero errors. The bug was never where the error said it was.

**TL;DR** The YAML error users reported had been fixed two months earlier. The actual build blocker was `HomeContent.tsx` importing a `CountUp` component that didn't exist on disk. Two sessions, 208 tool calls, 22 files changed. The deploy took 9 minutes once we found the real issue.

## The Error Message Was Lying

The error report looked clear:

```
YAMLException: incomplete explicit mapping pair; a key node is missed;
or followed by a non-tabulated empty line at line 3, column 277
```

File: `/posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en`. Two consecutive days of Vercel builds canceled — April 27 and 28. Production was frozen at the April 26 manual deploy.

First step: open the file. Line 3 was 204 characters. Column 277 doesn't exist there. Checking git history: commit `3095c96` from the same day had already cleaned this up. The error pointed to a location that no longer had an error.

So we went broader. Used `gray-matter` to parse everything: `content/posts/`, `content/daily/`, `content/blog/`, `content/weekly/`. 76 Bash calls, 13 Read calls. Result: 481 files parsed, 0 errors.

When every file passes, the build pipeline is dying for a different reason entirely.

## What Was Actually Killing the Build

Running a local build reproduced the real error immediately:

```
Module not found: Can't resolve './CountUp'
```

`HomeContent.tsx` was importing `CountUp`. The component file didn't exist. In Next.js 16 with Turbopack enabled by default, a missing module import is an immediate build termination — no graceful fallback, no partial compilation.

The YAML error was from a different point in time. Either Vercel had cached an older error in the build logs, or the error report came from someone looking at previous logs. By the time we were debugging, that error was already gone. The current blocker was the missing component.

Writing `CountUp.tsx`, confirming zero parse errors across all 481 files, and committing took under an hour. Local build verified: 480 static pages generated. Deploy completed.

## Why Two Sessions Debugged the Same Problem

Session 4 (9 minutes, 91 tool calls) and Session 5 (13 minutes, 117 tool calls) both investigated the same issue independently, neither aware the other had run.

Session 4 moved fast: identified the missing `CountUp.tsx`, created it, deployed. Done.

Session 5 ran `superpowers:systematic-debugging`, approached more methodically — and started from scratch on YAML validation that Session 4 had already completed. By the time Session 5 was running, the problem was already fixed. It spent 117 tool calls re-verifying what was already resolved.

This pattern comes up repeatedly in Claude Code workflows. Start a new session without context about prior sessions, and the model has no way to know what's already been done. It starts from the beginning. Same investigation, twice.

The fix is explicit state persistence. Commit messages work. A status file in the repo works. Anything that answers "what state is this project in?" before a new session begins. The cost of duplicate work — in time, in tokens, in tool calls — compounds fast.

## Meanwhile: 5 Parallel Agents on a Different Project

Session 3 that day was a different kind of work. One Telegram message triggered it:

> "Run agents to sell to Southeast Asia/Japan markets and generate revenue by any means — ads, site redesign, viral, everything"

That single message became a 237 tool call session running 33 hours 47 minutes. Five agents ran in parallel:

```
JP fortune market data agent
SEA fortune market data agent
Viral fortune video pattern decode agent
Top-converting fortune site references agent
Site CRO audit JP/TH agent
```

Each agent ran independently and wrote research to `/saju_global/blog-drafts/`. Japan market data, Southeast Asia market data, viral video pattern analysis, site benchmarks, CRO audit. Combined output: ~15,000 words of structured research.

PayPal live endpoints were verified in the same session. A real $1.99 order hit the database and returned an approval URL. Toss showed 29 successful real payments through March. Conclusion: payment infrastructure is fine. The problem is traffic. Test with $50 in ads first.

The CRO agent flagged a ₩ symbol appearing in the Thai checkout. Manual verification found it was a false positive — that code only runs under the `toss` namespace, and Thai users route to PayPal, so they never see that screen. When an agent reads code without routing context, these mistakes happen. Agent output needs manual verification before acting on it.

After that: 21 i18n message files updated, design changes deployed.

## The Unexpected Find Inside a Wrong Hypothesis

The YAML hunt wasn't entirely wasted. `validate-content.mjs` had a `matter.stringify` call that rewrites files in place. While scanning articles from April 27 onward — when self-critique was enabled — one file turned up with no frontmatter at all: `content/daily/2026-04-10-en.md`.

It wasn't the original bug. But it was a latent issue — a file that would have caused problems eventually. The wrong hypothesis led to finding a different real problem.

Debugging with a wrong starting assumption isn't always waste. Sometimes it surfaces things the right path would have missed.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>8aa059b</span> <span class=msg>fix: add missing CountUp component, fix broken daily frontmatter</span></div>
</div>

<div class=change-summary>
<table>
<thead><tr><th>Item</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td>Vercel deploy status</td><td>4 days CANCELED</td><td>Deployed successfully</td></tr>
<tr><td>CountUp.tsx</td><td>Missing (import only)</td><td>Created</td></tr>
<tr><td>YAML file validation</td><td>481 files unchecked</td><td>481 files, 0 errors</td></tr>
<tr><td>Sessions</td><td>—</td><td>2 (Session 4 + Session 5, duplicate)</td></tr>
<tr><td>Total tool calls</td><td>—</td><td>208 (91 + 117)</td></tr>
<tr><td>Files modified (saju_global)</td><td>—</td><td>21 i18n files</td></tr>
</tbody>
</table>
</div>

## The Takeaway

Don't trust the error message at face value.

When the user reported "YAML error," the right first question was: when did this error actually happen? Vercel build logs can cache errors from previous runs. Opening the suspect file before reproducing the failure locally cost time. The faster path: run a local build first, see what fails now, then work backward from there.

The second lesson is less interesting but costs more when ignored: session completion state needs to be recorded somewhere explicit. Two sessions doing duplicate work isn't a model limitation — it's an infrastructure gap. The model has no way to know what previous sessions did unless something written tells it.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
