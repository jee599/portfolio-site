---
title: "Claude Code as a Compliance Reviewer: Catching a Date Attribution Bug in 4 Tool Calls"
project: "portfolio-site"
date: 2026-05-19
lang: en
pair: "2026-05-19-portfolio-site-ko"
tags: [claude-code, compliance-review, dental-ad, blocking-issue, medical-law]
description: "Used Claude Code as a blocking-issues-only compliance reviewer for Korean medical ad content. Caught 1 date attribution bug in 4 Read calls, 0 files modified."
---

A single Naver policy announcement was referenced twice in the same document — under two different dates, pointing to two different meanings. Without a dedicated review pass, it would have shipped and become part of the public record.

**TL;DR** Using a `blocking-issues-only` prompt pattern, I delegated Korean medical/dental ad compliance review to Claude Code. It caught 1 date misattribution in the first pass. After fixing, a second review returned OK. Total: 4 tool calls, all `Read`, 0 files modified by Claude.

## Why Medical Ad Compliance Needs a Dedicated Reviewer

Korean medical advertising law (의료법) places strict requirements on how clinics can promote their services. Prohibited language includes claims of guaranteed outcomes, direct comparisons between clinics, rankings without substantiated methodology, and testimonial-style phrasing that implies typical results. Beyond what you can say, there are attribution requirements: if you reference a policy change, regulatory update, or platform announcement, the dates and facts have to be exactly right.

The daily report I run compiles policy changes from Naver Place, new keyword trends, and campaign performance notes into a structured document delivered to dental clinic operators. Each operator makes strategy decisions based on what's in that report. A misattributed policy date doesn't just look sloppy — it can lead an advertiser to apply a tactic at the wrong time, or justify a decision based on a policy change that didn't happen when claimed.

This is the kind of document where a single factual error has downstream consequences. It needed a review step that didn't depend on my own attention being consistent.

## The Prompt Pattern That Hires a Reviewer

Most LLM review prompts fail in the same way: they're too open-ended. "Check this for issues" returns a mix of blocking problems, minor style notes, vague suggestions, and observations that require human judgment to triage. The output is long and doesn't tell you what to do next.

The `blocking-issues-only` pattern is about constraint, not instruction. By defining what *not* to report, you eliminate an entire output category before it's generated:

```
Read these files and perform a blocking-issues-only review for
scheduled Korean medical/dental ads daily report.
Check contradictions, missing required labels/caveats,
named hospital/address leakage, prohibited guarantees, stale notes.
Answer OK if no blocking issues; otherwise list exact fixes.
Files: [MD file path] [HTML report path]
```

The checklist maps directly to actual legal and operational risk categories — the non-negotiables. Anything not on the list doesn't need to appear in the response.

The required output format is equally important: `OK` or *exact fixes*. Not "you might want to consider" — exact location, exact problem, exact correction. A vague suggestion still requires human interpretation before action. An exact fix can be acted on immediately.

## First Pass: One Issue Found

The first session didn't return OK. Claude flagged a contradiction at line 27 of `2026-05-19-daily-update.md`.

Earlier in the document, two Naver Place policy announcements were clearly separated:

- **Lines 5, 12**: May 7 announcement — Place Ad impression count increased
- **Lines 5, 12**: May 14 announcement — PC map Place Ad display space expansion test, limited to restaurant category

Both were accurately described in the header section. The problem was in the analysis section. **Line 27** read:

> "Since the 5/14 Place Ad impression count increase, competition for top placements has intensified…"

The May 14 announcement was about a display space expansion test in a different ad product category. The impression count change was the May 7 update. Line 27 had attributed "impression count increase" to the wrong date — conflating two distinct policy updates that had different implications.

This isn't a typo. It's a factual error in context: a reader who understood the May 14 policy correctly would recognize the contradiction. A reader who didn't would carry the wrong model of when the impression count policy changed into their strategy decisions.

In a daily report sent to clinic operators managing ad budgets, that's not acceptable.

## The Fix and Why Re-Review Matters

The fix was one line: update the attribution on line 27 from 5/14 to 5/07. Simple, clearly correct.

But "simple fix, clearly correct" is exactly when skipping re-review feels justified — and exactly when it shouldn't be. Re-review isn't checking whether the file was saved. It's verifying that the correction, in context, resolves the issue without introducing new ones. A reference change in one line can make an adjacent sentence wrong, or contradict a later section written assuming the original attribution.

The second session used a slightly modified prompt:

```
Blocking-issues-only re-review after the 5/07 attribution fix.
Check these two files for contradictions, missing labels/caveats,
named hospital/address leakage, or prohibited guarantees.
Answer OK if none.
Files: [same file paths]
```

Naming the specific fix in the prompt tells Claude what to verify landed and prompts checking of surrounding context. Not just "is it fixed" but "is the document consistent now."

The second pass returned OK with confirmation across four categories:

**Date consistency** — Both `daily-update.md` and the HTML report consistently attributed the May 7 announcement to impression count increases, and the May 8 announcement to new conversion tracking metrics. No cross-file discrepancy.

**No clinic-specific leakage** — All location and treatment references used generic combinations ("Gangnam implant," "Mapo orthodontics") with no specific clinic names, registration numbers, or addresses.

**Disclaimer coverage** — Both files included the required non-guarantee statement: "We do not guarantee improvements in ranking, appointment volume, patient visits, or revenue."

**Risk expression coverage** — Terms in the monitored category (painless, 100%, guaranteed, lowest price, #1, testimonial-style phrasing) appeared only in the "watch and avoid" section, not as claims.

## Session Statistics

| Item | Value |
|------|-------|
| Sessions | 2 |
| Total tool calls | 4 |
| Tools used | Read × 4 |
| Files modified by Claude | 0 |
| Files created by Claude | 0 |
| Blocking issues detected | 1 |

The tool use pattern is worth noting. Read-only review produces no artifact risk — Claude cannot accidentally modify a file it's only reading. The actual correction happened outside the review session. The review confirmed correctness; it didn't do the editing.

## Why This Pattern Works

A general "review this for me" prompt produces output with no priority signal. The `blocking-issues-only` pattern forces two things: a binary ship/no-ship verdict, and when there's an issue, the exact location and what to fix.

Medical ad compliance has a fixed checklist and clear judgment criteria — exactly the conditions where this pattern fits. Encoding the checklist in the prompt means every review runs against the same standard. What a tired human misses at the end of the day, Claude doesn't.

The two-pass structure matters too. "I fixed it so it should be fine" is not the same as confirmed OK. The re-review catches cases where the correction is locally right but contextually wrong — a sentence in a later section that assumed the old (wrong) attribution and now reads as inconsistent.

## Adapting to Other Compliance Domains

The same prompt structure applies wherever you have a fixed checklist and binary criteria:

**GDPR/privacy reviews**: Check for PII in logs, missing consent disclosures, or data retention claims that contradict the privacy policy.

**Financial content**: Verify past performance disclaimers are present, no specific return guarantees are implied, and all cited figures trace back to disclosed sources.

**Terms of service compliance**: Check that user-facing copy aligns with the ToS, no capabilities are claimed that aren't contractually guaranteed, no prohibited comparisons appear.

The prompt shape stays the same:

```
Perform a blocking-issues-only review for [domain].
Check [specific categories for that domain].
Answer OK if none; otherwise list exact location and fix.
```

The work is identifying the right checklist for your domain. Once that's done, the pattern is reusable across documents, teams, and time.

## What This Doesn't Replace

This pattern catches factual contradictions and known-prohibited content. It doesn't replace human judgment on edge cases, evolving regulatory interpretations, or situations requiring understanding of the full business and legal context.

A misattributed date is mechanically detectable. Whether a borderline guarantee claim crosses the legal threshold in a specific jurisdiction, under a specific enforcement posture — that's still a human call.

The pattern is a first filter, not a final authority. Its value is making the first filter reliable and consistent, so human review time can focus on cases that actually need it.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
