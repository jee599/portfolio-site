---
title: "Claude Code as a QA Gate: Catching a Medical Ad Compliance Blocker with 16 Tool Calls"
project: "portfolio-site"
date: 2026-05-20
lang: en
pair: "2026-05-20-portfolio-site-ko"
tags: [claude-code, compliance, qa, medical-ad, claude-opus]
description: "Zero code written. Claude Code ran 16 tool calls across 3 sessions and flagged one blocking compliance issue in Korean medical ad reports — in under 2 minutes."
---

claude-opus-4-7 ran 16 tool calls, read 6 files, and found one blocking compliance issue — without writing a single line of code.

**TL;DR** Used Claude Code for compliance QA, not coding. Session 1 identified an "unsupported factual claim" blocker. Session 2 verified the fix. Session 3 returned `OK`. Total elapsed time: ~2 minutes.

## Why Medical Ad Compliance Is a Different Kind of Problem

Korean medical advertising regulations are strict. Unsupported statistics, unverifiable claims, hospital name leaks, misuse of review registration numbers — any one of these can invalidate an entire report. When reports are generated daily, manual review doesn't scale.

The standard approach is to bolt on a human QA step. The better approach is to treat Claude Code as the QA gate.

The first prompt looked like this:

```
Read these files and do a blocking-issues-only final review for today's
scheduled Korean medical/dental ads report. Check: contradictions,
missing required labels/caveats, prohibited guarantees,
named hospital/address leakage, stale dates around 5/07 vs 5/14...
```

"blocking-issues-only" is load-bearing. Ask for a general review and you get noise. Narrow the scope to real blockers and you get signal.

## Session 1: 6 Files, 10 Reads, One Blocker Found

claude-opus-4-7 read six files: `2026-05-20-daily-update.md`, `rolling-knowledge-base.md`, `source-index.md`, and the HTML report. Ten Read calls, 6 Bash calls.

Two findings came back.

**Blocking issue**: Section 2 of `reports/2026-05-20-mobile-powerlink-layout-and-info-ai.html` contained a bullet related to public notice 30960 that made an unsupported factual claim — a reference to a medical ad review committee contact embedded in the body copy, with no traceable source in the review documentation.

**Non-blocking bug**: `rolling-knowledge-base.md` had a duplicate header — `### 5.7 2026-05-19` and `### 5.8 2026-05-20` both existed. Not a blocker, but a data consistency problem worth flagging alongside.

Files modified: 0. Files created: 0. Claude read and reported. Fixing was a human job.

## Session 2: Verifying the Fix with Minimal Context

After the fix was applied, a second session opened with a tighter prompt:

```
Re-check only the prior blocker after fixes.
Read reports/2026-05-20-mobile-powerlink-layout-and-info-ai.html
and rolling-knowledge-base.md.
Answer OK if the unsupported 30960 claim is gone
and the KB duplicate 5.7/5.8 issue is fixed;
otherwise list exact remaining issue.
```

Two files. Two Reads. Two Bash calls. No prior session context was passed — just the facts: something was fixed, verify it independently. This session still had a remaining issue to flag.

## Session 3: Final OK — 2 Tool Calls

The last session used the most precise prompt of the three:

```
Blocking-only recheck. Read ONLY reports/2026-05-20-mobile-powerlink-layout-and-info-ai.html
and rolling-knowledge-base.md.
Confirm: (1) HTML no longer says '의료광고 심의위원회 문의처가 본문에 포함',
(2) KB no longer has duplicate headers '### 5.7 2026-05-19' and '### 5.8 2026-05-20'.
Answer exactly OK if fixed; otherwise list issue.
```

Two Reads. Response: `OK`.

## The Numbers

| Metric | Value |
|--------|-------|
| Sessions | 3 |
| Total tool calls | 16 |
| Read calls | 10 |
| Bash calls | 6 |
| Files modified | 0 |
| Files created | 0 |
| Blocking issues found | 1 |
| Elapsed time | ~2 minutes |

## The Pattern That Made It Work

The most transferable insight from this session is prompt design, not AI capability.

"Tell me everything wrong" → noise. "Blocking issues only" → one actionable finding.

Each subsequent session narrowed further: fewer files to read, more precise confirmation criteria. The narrower the context, the faster and more accurate the response.

Medical ad compliance maps cleanly to this structure because the checklist is known in advance. Unsupported claims, prohibited guarantees, leaking identifiers, stale dates — these are concrete conditions, not fuzzy judgments. Put them in the prompt and Claude becomes a checklist executor. The same logic applies to code review.

The critical phrase: `answer exactly OK if fixed; otherwise list issue`. It removes ambiguity. Either the condition is met or it isn't. The human on the other side can act immediately without parsing hedged language.

## What Comes Next

Reports generate automatically every morning. The prompt is currently typed manually. The natural next step: add a QA step to the GitHub Actions pipeline. Report generation → Claude review → deploy on `OK`, alert on `FAIL`. Claude Code as a compliance gate, no code changes required.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
