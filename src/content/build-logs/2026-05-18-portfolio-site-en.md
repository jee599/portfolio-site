---
title: "Automating Medical Ad Compliance Review with Claude Code: 9 Tool Calls, 0 Blocking Issues"
project: "portfolio-site"
date: 2026-05-18
lang: en
pair: "2026-05-18-portfolio-site-ko"
tags: [claude-code, compliance, dental-ads, automation]
description: "How I used Claude Code to automate Korean medical law compliance checks on dental ad content — 2 sessions, 9 tool calls, zero violations."
---

Nine tool calls. Two documents. Zero violations. That's the full story of automating Korean medical law compliance checks on dental advertising content — a task that used to take 20–30 minutes every single day.

The trick isn't fancy tooling or a custom pipeline. It's prompt design: enumerate the blocking criteria explicitly, enforce a binary output format, and let Claude Code do the mechanical matching.

**TL;DR** When you define compliance as a checklist rather than a judgment call, Claude Code becomes a deterministic gatekeeper. The Read + Bash pattern handles documents cleanly, and forcing a structured output (`OK` or `BLOCK: reason`) makes results pipeline-ready without human interpretation.

## Why Dental Advertising Compliance Is Harder Than It Looks

Korean medical advertising law (의료법) is unusually strict by international standards. Dental clinics can't guarantee outcomes, can't publish unverified rankings, and must disclose when content is AI-generated or survey-based. Violations aren't just fines — they can result in operating license suspensions.

For a tool that generates daily dental marketing reports, this creates a recurring compliance problem. Every report needs to be checked before it goes anywhere. The categories that matter:

**Factual contradictions.** The `dentalad` project produces two parallel documents for the same date: a Markdown summary and a full HTML analytics report. If the numbers in the summary don't match the HTML report, that's a trust and accuracy problem — and potentially a claim that can't be verified.

**Unsupported performance claims.** Phrases like "guaranteed #1 search ranking," "guaranteed appointment volume," or "guaranteed revenue increase" are explicitly prohibited. These appear naturally in AI-generated marketing copy and need to be caught before publication.

**Named hospitals or clinic addresses.** Mentioning specific clinics by name in user-facing reports can violate advertising review board regulations, especially when the context could be read as comparative or promotional.

**Missing source and disclaimer labels.** Data from surveys, scraped SERPs, or AI-generated analysis must include source attribution and a statement of limitations. This is non-negotiable for regulated healthcare advertising content.

Manually checking all four categories across two documents — one Markdown, one HTML — takes a careful reader 20–30 minutes. Done daily, that's over two hours a week spent on a task that's fundamentally mechanical.

## The Target Documents

The files under review were from `2026-05-17` in the `dentalad/research/daily-medical-dental-ads/` directory:

- `2026-05-17-daily-update.md` — the daily Markdown summary with keyword performance, rankings, and campaign notes
- `2026-05-17-info-keyword-ai-and-local-serp-patterns.html` — the full HTML analytics report with SERP pattern data and AI content analysis

These two files cover the same data but serve different audiences. The Markdown version is a human-readable operational summary; the HTML report is the detailed artifact. Checking them against each other is part of the compliance requirement — inconsistency between the two is itself a flag.

## Session 1: Cast Wide, Find the Shape

The first session used a broad but purposeful prompt:

```
Read the daily update and HTML report for 2026-05-17 under
/Users/jidong/dentalad/research/daily-medical-dental-ads.
Check for contradictions, unsupported claims, accidental
hospital names/addresses, or missing required labels.
Return concise blocking issues only, or OK if none.
```

"Blocking issues only" is the load-bearing phrase. It signals that style suggestions, minor phrasing notes, and anything that wouldn't actually stop a publish should be filtered out before the response is generated. This is noise reduction built into the prompt.

Claude Code ran `Read` twice to load both files, then `Bash` five times for parsing and pattern matching. The Bash calls weren't optional — extracting usable text from an HTML file for cross-document comparison requires shell tools. `grep` and `sed` strip tags; plain reads leave you comparing markup rather than content.

The Bash calls roughly mapped to:
1. Strip HTML tags from the report to get clean text
2. Extract claim-like phrases (superlatives, guarantee language)
3. Search for clinic name patterns (Korean clinic naming conventions are predictable)
4. Pull source/disclaimer markers from both documents
5. Cross-reference key metrics between the two files

Total: 7 tool calls. Result: `OK`.

The shape of the first session is exploratory. It's learning what the documents contain, building a mental model of their structure, and then applying the criteria. That's why it takes more tool calls — there's discovery work happening alongside the compliance check.

## Session 2: Tighter Constraints, Fewer Tool Calls

The first session confirmed compliance. The second session tested a different hypothesis: does a more structured prompt with an explicit output format reduce tool call overhead while maintaining accuracy?

The second prompt:

```
Blocking review only. Read these two files:
research/daily-medical-dental-ads/2026-05-17-daily-update.md and
research/daily-medical-dental-ads/reports/2026-05-17-info-keyword-ai-and-local-serp-patterns.html.
Answer exactly OK if no blocking issue. Blocking issues:
contradictory facts between the two files, named hospitals/addresses
in user-facing summary/report, missing source/label caveats, or
claims of guaranteed rankings/reservations/revenue.
```

Two structural changes from session 1:

First, the blocking criteria are enumerated as a flat list rather than described narratively. There's no room for interpretation about what counts as a blocking issue — the list is the definition.

Second, the output instruction is prescriptive: "Answer exactly OK if no blocking issue." Not "let me know if everything looks fine," not "provide a brief summary" — exactly `OK`. A single word.

Result: `Read` twice, 2 total tool calls, output `OK`.

The session skipped the Bash parsing phase entirely. With criteria stated precisely and output format locked, Claude Code had enough semantic signal from the plain reads to apply the checklist without additional extraction steps.

The difference between 7 tool calls and 2 isn't about one approach being smarter. It's about what each prompt asks for. The first prompt asks Claude Code to investigate and then report. The second asks it to apply a predefined ruleset and return a binary verdict.

## What Prompt Design Is Actually Doing Here

These two sessions surface something important about working with AI models in automated contexts.

**Vague criteria produce variable results.** "Tell me if anything looks wrong" is an invitation to exercise judgment. Judgment is context-dependent and inconsistent across time. The same document might trigger a flag on Monday and pass review on Friday because the framing shifted slightly. Automation requires consistency.

**Explicit criteria produce mechanical matching.** "Block if any of these conditions are true: [list]" turns the task from judgment into lookup. Claude Code isn't deciding whether something is a problem — it's checking whether a pattern matches. That's a fundamentally different cognitive mode, and it's far more reliable for recurring automated tasks.

**Forced output format enables downstream consumption.** A result that's exactly `OK` or `BLOCK: <reason>` doesn't need to be parsed by a human before it can be acted on. It can be piped into a CI check, a Slack notification, a cron result log, or a conditional publish step. The structure is ready for automation from the moment the response is generated.

**The gap between sessions is a calibration artifact.** You'd start with a session 1-style prompt to understand what "blocking" means in context for your specific documents. Once you've seen what Claude Code surfaces and what it ignores, you write the tighter session 2-style prompt as the production version. Session 1 is the calibration run; session 2 is the deployment version.

## Session Statistics

| Metric | Value |
|--------|-------|
| Sessions | 2 |
| Total tool calls | 9 |
| `Read` calls | 4 |
| `Bash` calls | 5 |
| Files modified | 0 |
| Files created | 0 |
| Blocking issues found | 0 |

Zero files modified or created — that's the point. Compliance review is read-and-judge. The document pipeline doesn't change unless a violation surfaces. If `BLOCK` comes back instead of `OK`, that's the signal to stop and investigate.

## The ROI Case

A 20–30 minute manual compliance check done daily is roughly 150–175 minutes a week. Across a month, that's close to 12 hours of careful, focused reading that a well-prompted Claude Code session handles in under 60 seconds.

The cost isn't zero — there's setup time in calibrating the prompt, and occasionally the prompt needs updating when new document formats appear. But that's hours of one-time work versus hours of recurring work. The math is straightforward.

The less obvious benefit is consistency. Human reviewers have bad days. They miss things when they're tired or rushing. A prompt-based compliance gate applies the same criteria every time, at the same level of attention, regardless of time of day or workload.

## Where This Pattern Generalizes

The Read + Bash compliance gate isn't specific to dental advertising. Any rule-based review where the criteria can be enumerated explicitly follows the same structure:

**Legal disclaimer verification.** Before publishing marketing copy, check that required liability language appears verbatim. Enumerate the required phrases; flag any that are missing.

**PII detection before commits.** Scan staged files for patterns that match email addresses, phone numbers, or government ID formats. Return `OK` or a list of files with line numbers.

**API response field validation.** After a schema change, check that all required fields exist and match expected formats across a sample of responses. Enumerate the required fields; flag discrepancies.

**Release note auditing.** Before tagging a release, verify that all commits touching public APIs have corresponding `BREAKING CHANGE` entries in the changelog. Explicit criteria, binary output.

**Configuration drift detection.** Compare a production config snapshot against a reference config. Flag keys that are present in one but not the other, or values that have deviated beyond acceptable bounds.

The pattern is always: enumerate blocking conditions → pass the artifacts → enforce binary output. Claude Code handles the scanning; you handle the exception cases when `BLOCK` comes back.

## Setting This Up as a Daily Gate

To run this in a cron or CI context:

```bash
#!/bin/bash
RESULT=$(claude -p "
Blocking review only. Read these two files: [paths].
Answer exactly OK if no blocking issue. Blocking issues:
[enumerate criteria].
" --output-format text)

if [ "$RESULT" != "OK" ]; then
  echo "COMPLIANCE BLOCK: $RESULT"
  exit 1
fi
```

The `--output-format text` flag strips markdown formatting from the response, giving you the raw `OK` or `BLOCK: reason` string that shell comparison can work with directly.

This is the automation endpoint: a shell check that exits 0 on `OK` and exits 1 on `BLOCK`, with the reason in stdout for logging. Plug this into whatever runs your publish pipeline.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
