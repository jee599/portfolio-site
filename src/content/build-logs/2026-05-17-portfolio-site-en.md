---
title: "9 Tool Calls to a Clean OK: Automating Dental Ad Compliance with Claude Opus 4.7"
project: "portfolio-site"
date: 2026-05-17
lang: en
pair: "2026-05-17-portfolio-site-ko"
tags: [claude-code, compliance, dental-ad, automation, claude-opus]
description: "Automating Korean medical ad compliance review with Claude Opus 4.7: 2 sessions, 9 tool calls, zero blocking issues — faster than opening the files manually."
---

Two sessions. Nine tool calls. The verdict: **OK**.

That's the full output from running dental advertising compliance review through Claude Opus 4.7. What used to mean opening two files, cross-referencing their contents, and manually checking each line against Korean Medical Law Article 56 now completes in under a minute.

**TL;DR** — Bash ×5, Read ×4. The model cross-checked a daily update `.md` against an HTML analysis report, scanning for hospital name exposure, guarantee language, and missing source attribution. No blocking issues found. Zero files modified or created — pure audit.

## Why Dental Ads Have a Legal Compliance Gate

Korean Medical Law Article 56 governs dental advertising. Certain phrases are outright violations: "guaranteed booking," "guaranteed results," "best procedure in Korea." Directly exposing a hospital's name or address in user-facing content is also prohibited regardless of context.

The `dental-ad-ops` pipeline generates a new analysis report daily. Manually checking each one against the legal criteria isn't sustainable at scale. The automation target is precise: read two files, check them against each other for factual contradictions, scan for prohibited patterns, return a parseable verdict.

## Session One: Structure First, Then Content

The first prompt gave Claude a clear task with minimal framing:

```
Read the daily update and HTML report for 2026-05-17 under
/Users/jidong/dentalad/research/daily-medical-dental-ads.
Check for contradictions, unsupported claims, accidental
hospital names/addresses, or missing required labels.
Return concise blocking issues only, or OK if none.
```

Claude used Bash 5 times and Read twice — mapping the directory structure, locating both files, reading each one, and running through the checklist. Wall-clock time: under 30 seconds.

The first session functions as orientation. The model confirms what files exist, where they live, and what format they're in. That context makes the second session faster.

## Session Two: Enumerate the Blocking Criteria

After reviewing the first session's output, I ran a second pass with explicit, enumerated criteria:

```
Blocking review only. Read these two files:
research/daily-medical-dental-ads/2026-05-17-daily-update.md
research/daily-medical-dental-ads/reports/2026-05-17-info-keyword-ai-and-local-serp-patterns.html.

Answer exactly OK if no blocking issue. Blocking issues:
contradictory facts between the two files,
named hospitals/addresses in user-facing summary/report,
missing source/label caveats,
or claims of guaranteed rankings/reservations/revenue.
```

Four blocking categories, explicitly named. Read ×2. Verdict: **OK**.

The key difference from session one: the definition of "blocking" is no longer implicit. In session one, Claude inferred what a blocking issue means from context. In session two, the criteria are enumerated: factual contradictions, real hospital names or addresses, missing source attribution, and guarantee claims (rankings, reservations, revenue).

## Tool Call Breakdown

| Tool | Count |
|------|-------|
| Bash | 5 |
| Read | 4 |
| **Total** | **9** |

Files modified: 0. Files created: 0. This was a read-only compliance audit.

## What the Two Sessions Reveal About Prompt Design

The gap between the two sessions comes down to one thing: who defines "blocking."

Session one says: "find blocking issues." Session two says: "here is what blocking means." The second approach is more reliable in production because it removes interpretive variability. When you spell out `guaranteed rankings/reservations/revenue`, the model's decision boundary is fixed. Runs become consistent across days, across different content, and potentially across different model versions.

The instruction `Answer exactly OK if no blocking issue` was equally important. Without it, Claude returns a paragraph summarizing what it reviewed. That's informative but not parseable. If the verdict format is variable, the downstream pipeline can't act on it. Fixed output format is a prerequisite for automation.

A related design pattern: both blocking criteria and output format should be specified together. The criteria determine what the model looks for; the format determines what it returns. Specify one without the other and you've only solved half the problem.

## The Path Toward a Fully Automated Loop

The current setup is still manual — prompt execution triggered by hand after each daily report generates. The next step is integrating this into GitHub Actions. The flow:

1. Daily report generates via cron
2. GitHub Actions triggers the compliance session
3. If the verdict is `OK`, no action
4. If the verdict contains any blocking issue, fire a Slack alert before content goes live

One open question on the model side: Claude Opus 4.7 may be overspecified for this task. The compliance criteria are deterministic and the files are modest in size. Whether Haiku or Sonnet delivers the same verdict consistently is a cost-versus-quality benchmark still pending.

> The goal isn't to use the most powerful model. It's to find the smallest model that passes the bar reliably.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
