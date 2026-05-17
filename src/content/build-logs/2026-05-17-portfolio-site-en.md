---
title: "9 Tool Calls to Compliance: Automating Dental Ad Review with Claude Opus 4.7"
project: "portfolio-site"
date: 2026-05-17
lang: en
pair: "2026-05-17-portfolio-site-ko"
tags: [claude-code, compliance, dental-ad, automation, claude-opus]
description: "Claude Opus 4.7 reviewed dental ad compliance in 2 sessions, 9 tool calls — checking for contradictions, hospital name leaks, and guarantee claims. Result: OK."
---

2 sessions. 9 tool calls. The verdict: **OK**.

That's the entire compliance audit for a daily dental advertising report, handled by Claude Opus 4.7. No manual file-diffing, no checklist scanning, no second-guessing whether "premium service" crosses a legal line. The model read both files, applied the criteria, and returned a clean pass.

**TL;DR** — 5 Bash calls + 4 Read calls to cross-check a daily update `.md` against an HTML intelligence report. No blocking issues: no contradictory facts, no hospital names in user-facing copy, no guarantee language, no missing source labels.

## Why Compliance Automation for Dental Ads

Dental advertising in South Korea is governed by Article 56 of the Medical Act. The rules are specific: phrases like "guaranteed booking," "best procedure," or "proven results" are violations. So is any direct mention of a hospital's name or address in user-facing content. Every report that gets published is exposure to regulatory risk.

Doing this manually means opening two files, comparing them line by line, and running a mental checklist against legal criteria. For a daily report cadence, that's unsustainable.

The automation opportunity is clear: read the files, apply fixed criteria, surface blocking issues. Nothing more.

## Session 1: Exploration with Open Criteria

The first prompt was intentionally broad:

```
Read the daily update and HTML report for 2026-05-17 under
/Users/jidong/dentalad/research/daily-medical-dental-ads.
Check for contradictions, unsupported claims, accidental
hospital names/addresses, or missing required labels.
Return concise blocking issues only, or OK if none.
```

Claude used Bash 5 times and Read 2 times — navigating the directory structure, loading both files, then running through the criteria. Elapsed time felt under 30 seconds.

The session established the baseline. Both files were readable, no obvious violations surfaced.

## Session 2: Explicit Criteria, Stricter Review

After confirming the first pass, the second session enumerated the blocking criteria directly in the prompt:

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

Two Read calls to load both files. Verdict: **OK**.

The difference between sessions was prompt specificity. Session 1 gave Claude the categories to look for. Session 2 gave it the exact violations to match against — `guaranteed rankings/reservations/revenue` rather than "guarantee language."

## Tool Call Breakdown

| Tool | Count |
|------|-------|
| Bash | 5 |
| Read | 4 |
| **Total** | **9** |

Files modified: 0. Files created: 0. Pure review pass.

## What the Prompt Design Taught Me

Naming violations explicitly is more reliable than naming violation categories.

"Guarantee language" requires the model to infer what counts. `guaranteed rankings/reservations/revenue` removes that inference step entirely. The model matches against a concrete list, not an abstract concept. That consistency matters when the same prompt runs daily — you want the same judgment on the same inputs every time.

The `Answer exactly OK if no blocking issue` constraint was equally important. Fixing the output format means downstream parsing works without fragile regex or NLP. If the response is anything other than "OK," the pipeline knows something needs human review.

## What Comes Next

Right now, the prompt runs manually. The next step is wiring it into GitHub Actions: when the daily report generates, trigger the compliance session automatically. If the result isn't "OK," push a Slack alert before anything gets published.

There's also a cost question. Claude Opus 4.7 is the most capable model in the family, but this task — reading two files and pattern-matching against a list — doesn't necessarily need it. Running the same review with Haiku or Sonnet and comparing outputs will tell whether there's a cheaper option that maintains the same pass/fail accuracy.

If Haiku holds up, the per-review cost drops significantly. At daily cadence, that adds up.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
