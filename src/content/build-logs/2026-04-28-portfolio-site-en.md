---
title: "Error Messages Lie: 445 Tool Calls, Three Projects, One Day with Claude Code"
project: "portfolio-site"
date: 2026-04-28
lang: en
pair: "2026-04-28-portfolio-site-ko"
tags: [claude-code, debugging, multi-agent, automation]
description: "445 tool calls, 5 sessions, 3 projects. The spoonai build failure wasn't YAML — a missing component was. Here's what multi-agent AI automation looks like when it goes sideways."
---

445 tool calls. Five sessions. Three projects. That was today — and roughly half the debugging time was wasted because I trusted the error message.

**TL;DR:** The spoonai build failure had nothing to do with YAML parsing. A missing `CountUp.tsx` was the real cause, and the error message pointed in the wrong direction entirely. On saju_global, five Claude Code agents ran in parallel to complete Japan and Southeast Asia market research and ship a full redesign in a single session. The portfolio automation pipeline failed twice today — same expired API key both times.

## The "YAML Error" Where 481 YAML Files All Passed Validation

spoonai builds were all CANCELED between April 27 and April 28. The error looked specific and actionable:

```
YAMLException: incomplete explicit mapping pair; a key node is missed;
or followed by a non-tabulated empty line at line 3, column 277
```

It named the offending file: `/posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en`. Clear enough. Started with YAML validation.

Ran `gray-matter` across all four content directories — `content/posts/`, `content/daily/`, `content/blog/`, `content/weekly/`. 481 files. Zero errors. Switched to `js-yaml` and ran the same pass. Still zero. Opened the named file directly: line 3 was a 204-character string with nothing wrong. Checked git history: commit `3095c96` from April 14 had already patched that exact file two weeks earlier.

By this point Session 4 had burned through 76 Bash calls on files that were all clean.

The real error only appeared when I reproduced the build locally:

```
Module not found: Can't resolve './CountUp'
```

`HomeContent.tsx` imports a `CountUp` component. `CountUp.tsx` didn't exist. Next.js 16 runs Turbopack by default, and when Turbopack encounters a missing module it terminates the build. During that shutdown the content loading pipeline also exits, and the YAML parser throws an exception that ends up at the top of the visible log output.

The YAML exception was real. YAML was not the problem.

This failure mode is worth naming: when a build tool runs multiple parallel processes, a fatal failure in process A can surface secondary exceptions from process B first. You see process B's complaint, chase it, find nothing wrong, and waste cycles on a clean layer while the actual broken thing sits uninvestigated.

Fix: create `CountUp.tsx`. Also patched two broken frontmatter files in `content/daily/` (`2026-04-10-en.md` and `2026-04-10.md` — both missing closing `---`). Those weren't causing the build failure, but they would have eventually.

After the fix:

```
480 static pages generated
✓ Build complete
```

Committed as `8aa059b`. Vercel auto-deployment resumed.

The session breakdown is instructive. Session 4 was 9 minutes and 91 tool calls — reproduced the build locally, found the real error, fixed it. Session 5 was 13 minutes and 117 tool calls and never arrived at the same conclusion. Both sessions had no shared context, so Session 5 re-examined files Session 4 had already cleared and re-ran validation that had already been disproven.

Two sessions working the same problem without shared state doesn't double coverage. It duplicates work with potentially divergent conclusions.

> Reproduce the failure before reading the error message. The error is a starting hypothesis, not a diagnosis.

## One Telegram Message → Five Parallel Agents → Design Shipped

The saju_global session started from a single Telegram message:

```
Any visitors or payments on the saju project?
```

Direct DB query. Results: 30 cumulative payments totaling ₩171,000, zero payments since March, 87 sessions in April. Payment platform breakdown: Toss functional, LS rejected (fortune-telling is a restricted merchant category in Korea), PayPal configured for live but zero real transactions despite being active.

The follow-up:

```
Run agents to sell this in SEA and Japan — ads, redesign, viral, all of it
```

Five agents dispatched in parallel via Claude Code's multi-agent setup:

- Japan market research: competitive landscape, pricing norms, localization requirements
- Southeast Asia market research: country-by-country breakdown, 136 inline sources
- CRO audit: conversion funnel analysis for JP/TH user flows
- Viral pattern analysis: content format breakdown for fortune-telling vertical
- Ad strategy: channel recommendations for JP/SEA markets

While the agents ran, I tested the PayPal live endpoint directly — created an actual $1.99 test order, confirmed approval URL generation, saved the test script to `scripts/paypal-live-test.sh`. This is the category of verification agents can't substitute for. You need to hit the actual endpoint to know the actual endpoint works.

When results came back, one surfaced a genuine bug: `i18n/messages/ja/common.json:3` had `運命研究所` (roughly "Fate Research Institute"), but `apps/web/countries.ts:142` referenced the same product as `FortuneLab`. Two different brand names, same app, same codebase. Live defect.

One result was a false positive. The CRO agent flagged: "Thai users are seeing the ₩ symbol." Checked the code — that rendering path lives inside the `toss` namespace, which only executes in the Korean Toss checkout flow. Thai users route to the PayPal-hosted checkout page and never reach the code that renders ₩. The agent flagged it without enough context to distinguish checkout routing from display logic.

One real issue, one phantom. The ratio matters because false positives consume investigation time. More agents running in parallel means more findings and proportionally more noise. Every flagged issue needs to be traced to actual code before it becomes an action item. The verification step doesn't disappear because the discovery step was fast.

After reviewing the results, the message came back: `just change the design for now`.

Updated 10 language i18n files (`ko`, `en`, `ja`, `th`, `id`, `hi`, `zh`, `vi`, and others), modified `page.tsx`, `paywall/page.tsx`, and `globals.css`. Deployed.

That session: 33 hours 47 minutes wall-clock, 126 Bash calls, 25 Edit calls, 18 Telegram replies, 237 tool calls total.

> Agents get you answers quickly. Whether those answers are correct is still yours to verify.

## The Automation Pipeline That Failed Twice, Same Reason Both Times

The portfolio site runs an automated build log generation pipeline. It ran twice today. Failed twice today, same error both times:

```
Error: Invalid API key
```

An external API key had expired. Sessions 1 and 2 each ended at zero tool calls — Claude Code initialized, hit the auth failure immediately, and had nothing to execute. After rotating the key, the pipeline resumed and completed normally.

Second time today I hit the same pattern: not a code bug, but an environment state that had drifted under the code. spoonai had a component that was imported but never created. The portfolio pipeline had an API key that was referenced but no longer valid.

Both failures surfaced in misleading ways. The spoonai error looked like a content parsing problem. The API key error looked like an integration failure. In both cases reading the error at face value would send you into the wrong layer — the actual fix in each case was a one-step environment correction, not a code change.

Error messages describe symptoms in the layer they originate from. Root causes often live elsewhere.

## The Numbers

| Session | Time | Tool Calls | Primary Tools |
|---------|------|------------|---------------|
| saju_global JP/SEA | 33h 47min | 237 | Bash(126), Edit(25), TG reply(18) |
| spoonai recovery A | 9min | 91 | Bash(76), Read(13) |
| spoonai recovery B | 13min | 117 | Bash(100), Read(9) |
| portfolio automation × 2 | — | 0 | — |
| **Total** | — | **445** | **Bash(302), Read(56), Edit(26)** |

68% of tool calls were Bash. The pattern has solidified: delegate research and broad exploration to agents, verify and validate directly in the shell. Agents survey large surface areas efficiently. Shell commands are reliable for confirming something actually works.

The distinction matters because agents reason about the codebase from context — which can be stale, partial, or misread. A Bash call hits the actual filesystem, the actual API, the actual build system. When something needs to be confirmed rather than inferred, Bash is the right tool.

> Agents get you fast coverage. Bash gets you ground truth. You need both.

## What Changed

| Item | Before | After |
|------|--------|-------|
| spoonai Vercel deployment | CANCELED (all of 4/27–4/28) | Auto-deployment resumed |
| CountUp.tsx | Non-existent (import-only reference) | Created |
| content/daily broken files | 2 (missing closing `---`) | 0 |
| saju_global JP brand name | Inconsistent (`運命研究所` / `FortuneLab`) | Unified |
| saju_global i18n | 10 languages not updated | All updated + deployed |
| Portfolio automation | Expired API key (2 failures) | Key rotated, pipeline running |

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>610a966</span> <span class=msg>feat: build logs 2026-04-28 (2 posts, auto)</span></div>
<div class=commit-row><span class=hash>3b014bc</span> <span class=msg>feat: build logs 2026-04-28 (1 posts, auto)</span></div>
<div class=commit-row><span class=hash>8aa059b</span> <span class=msg>fix: add CountUp component + repair broken daily frontmatter</span></div>
</div>

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
