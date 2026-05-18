---
title: "6 File Reads, Zero Code Changes: Automated Medical Ad Compliance Auditing with Claude Code"
project: "portfolio-site"
date: 2026-05-18
lang: en
pair: "2026-05-18-portfolio-site-ko"
tags: [claude-code, compliance, dental-ads, review, automation]
description: "6 files, 6 Read calls, 0 code changes. How Claude Code audits Korean medical advertising law compliance consistently—and why explicit blocking criteria are the key."
---

Six files. Six Read calls. Zero code changes. That's the entire session log from today—and the result was a clean compliance pass.

**TL;DR** When you explicitly list blocking criteria and enforce a strict output format, Claude Code can review six files for Korean medical advertising law compliance and return a consistent verdict every time.

## What I Was Reviewing

The `dentalad` project automates dental advertising operations. Every night, a script scrapes competitor SERPs, and Claude generates an analysis report. That report must comply with Korean medical advertising law (의료광고법).

Today's review covered six artifacts dated `2026-05-18`: five `.md` files and one HTML report. The checklist:

- Missing required evidence labels (`공식 확인`, `공개 SERP 관찰`, `운영 가설`, `수치 미확인`, `확인 필요`)
- Prohibited guarantee language (e.g., "guaranteed results," "top hospital")
- CPC/CTR/CPA/ROAS figures stated as fact without supporting evidence
- Named hospital or address exposure in the HTML report
- AI generation disclosure and source label consistency
- All required artifacts present

Doing this manually means opening six files and checking each item line by line—a 10–15 minute repetitive task, every day.

## The Prompt That Made It Work

```
Read these files and perform a blocking-issues-only review for the
scheduled Korean medical/dental ads daily report.

Check for:
- missing required labels
- prohibited guarantees
- unstated CPC/CTR/CPA/ROAS/ad spend claims
- named hospital/address leakage in the HTML report
- contradictions about AI briefing/source labels
- whether required artifacts exist

Answer OK if no blocking issues, otherwise list only blockers.
Files: /Users/jidong/dentalad/research/daily-medical-dental-ads/2026-05-18-daily-...
```

Three intentional design decisions here.

**"blocking-issues-only"** constrains scope. Add "also suggest improvements" and the output doubles in length while the actual blockers get buried. The goal is pattern matching, not general judgment.

**"Answer OK if no blocking issues"** enforces output format. Without it, you get summaries, hedged opinions, and compliments mixed together. If you want to wire this output into a pipeline, you need a predictable signal.

**Explicit absolute file paths** instead of glob patterns. There should be zero ambiguity about what's in scope.

## Result: OK

The session log shows a single `OK` with a per-item verification summary:

- **Labels**: Evidence labels consistently applied across all five `.md` files and the HTML report
- **Guarantee language**: None found
- **Unsubstantiated metrics**: None. All figures tagged as `수치 미확인` (unverified) or `확인 필요` (needs verification)
- **Hospital/address exposure**: None
- **AI disclosure**: AI auto-generation notice present in HTML §5, source labels consistent
- **Artifact existence**: All six files confirmed

The tool usage pattern is worth noting: `Read(6)`, no Bash. Claude processed all six files—including the HTML report—without any shell commands. It read through the markup directly without needing to strip tags first. A similar task I ran previously used `Bash(5)` for preprocessing. When the prompt scope is clearly defined, tool call count tends to drop.

## Why Consistency Matters More Than Accuracy

Without explicit criteria, Claude's judgments drift. Some runs flag an issue; others let the same content pass. In an automated pipeline, that inconsistency is a reliability problem—not an accuracy one.

Listing blockers explicitly makes the review behave like a checklist: "if any of the following applies, block." That structure eliminates subjective judgment from the loop. Automation reliability comes from criteria clarity.

This pattern isn't specific to dental advertising. It applies to any rule-based review where blocking conditions are enumerable:

- Legal disclaimer completeness checks
- PII detection in generated reports
- Required field validation in API responses
- Breaking change annotations in release notes

If you can list the conditions that constitute a violation, Claude Code can run the check consistently across runs.

## Session Stats

| Metric | Value |
|--------|-------|
| Sessions | 1 |
| Total tool calls | 6 |
| Read | 6 |
| Bash / Edit / Write | 0 |
| Files modified | 0 |
| Files created | 0 |
| Blocking issues found | 0 |

Zero modified files, zero created files—that's the nature of a review task. Review means read and judge. It doesn't mean change code. Human time belongs on ambiguous edge cases, not routine compliance checks that can be fully specified upfront.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
