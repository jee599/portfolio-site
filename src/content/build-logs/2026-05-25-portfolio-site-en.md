---
title: "481 Files Validated, Zero Errors — the Real Bug Was a Missing React Component: 10 Sessions, 389 Tool Calls"
project: "portfolio-site"
date: 2026-05-25
lang: en
pair: "2026-05-25-portfolio-site-ko"
tags: [claude-code, debugging, automation, build-log, orchestration]
description: "Vercel reported a YAML parse error. 481 files validated, 0 broken. Real cause: missing CountUp.tsx. A 10-session, 389 tool call record of debugging gone sideways and an orchestrator that kept calling simple tasks major."
---

Vercel said the build failed with a YAML frontmatter parse error. The error message named a specific file and line number. I validated all 481 content files with `gray-matter`. Zero broken files. Ran `js-yaml` as a second pass. Still zero.

Running the build locally produced a completely different error.

**TL;DR** When the hypothesis you're given is wrong, Claude Code will follow it faithfully — 176 Bash calls deep before course-correcting. This is a 10-session, 389 tool call record of what happens when you chase stale error logs, and what it looks like when an AI orchestrator systematically over-classifies simple tasks as major.

## The Error Message Was a Stale Log

Sessions 1 and 2 started with the same prompt:

```
Vercel build is failing with a YAML frontmatter parse error.
Error: YAMLException at line 3, column 277
File: /posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en
```

Looked like a YAML parsing issue, so I hunted for a YAML parsing issue. `gray-matter` across 481 files. Result: 0. `js-yaml` for a second pass. Also 0.

Only after triggering a local build did the actual error surface:

```
Module not found: Can't resolve './CountUp'
```

`HomeContent.tsx` was importing `CountUp.tsx`, which didn't exist. That's where Turbopack stopped. The YAML error visible on Vercel was a stale log from an older failed deployment — it had nothing to do with the current build failure.

The fix was straightforward: create `CountUp.tsx`, clean up two daily files with malformed frontmatter, run `npm run build`, confirm 480 static pages generated. Commit `8aa059b`, push, Vercel auto-deploy resumed.

Session 1 used 76 Bash calls. Session 2 used 100. Combined: 176. The number describes the wasted work better than any explanation.

`npm run build` was a faster diagnostic than validating 481 files. Even when an error message names a specific file, it's a hypothesis until you reproduce it locally.

> If local reproduction fails, discard the hypothesis and look at the full build pipeline from the beginning.

## When the Orchestrator Calls Everything "Major"

This workflow runs an orchestrator that classifies each incoming request into one of four complexity tiers: `trivial / simple / standard / major`. Each tier maps to a different pipeline. `major` requires a full plan → implement → verify → codex cross-check sequence before any edit gates open.

This week, the orchestrator kept misclassifying tasks.

Session 4 was a research and sponsorship analysis task — produce two output files with findings. No code changes, no architecture decisions, no database. The orchestrator called it `major`. Halfway through the session I manually reclassified it:

```bash
source ~/.claude/workflow/lib/state.sh && state_set complexity simple
```

Sessions 9 (HTML + PDF report generation) and 10 (TOC correction) followed the same pattern. The gate blocked progress until I reclassified both.

The root cause is that the classification heuristic measures file count and code change volume. Research, reports, and artifact generation don't fit that model. A task that produces output files without touching source code is `simple` regardless of scope. The classifier needs a separate signal for "output artifact, no code change."

Until that's fixed, the workaround is the manual `state_set` call.

## Why the Same File Needed Two Sessions

Session 7 appended 2026-05-25 sections to `competitive-serp-observations.md` and `naver-ranking-hypotheses.md`. Gate friction caused the session to end with only partial edits completed.

A downstream Codex verification pass caught the gap: `naver-ranking-hypotheses.md` was missing hypothesis item 35.

Session 8 went back in. This time: read the source file (`2026-05-25-daily-update.md`) first, verify the existing structure of both files, then add only the missing content with targeted `Edit` calls.

```
competitive-serp-observations.md → 2026-05-25 section (line 677)
naver-ranking-hypotheses.md → hypothesis 35 (line 620)
```

The verification stage catching a gap from the previous session is the pipeline working as designed. The gate friction caused the incomplete first pass; the separate verification step caught it. Both outcomes trace directly to orchestrator behavior.

## Turning Research into a Structured PDF

Session 9 converted research output into a paper-style PDF rather than a raw markdown dump. The spec included the output path, styling requirements, and generation method.

Write the HTML first, then convert with Chrome headless:

```bash
chromium --headless --print-to-pdf=output.pdf input.html
```

Output: 13 pages, 1.2 MB. Session 10 brought a Codex review with one finding: the TOC listed section 9 as "Source Appendix" when the actual section 9 was "Changes Since Last Report" and "Source Appendix" was section 10.

Two-line fix, PDF regenerated. Session 10 took 1 minute and 15 tool calls — Codex caught a real error; the fix was trivial.

## Tool Call Breakdown: 389 Across 10 Sessions

| Tool | Count |
|------|-------|
| Bash | 244 |
| Read | 68 |
| Edit | 16 |
| WebFetch | 11 |
| Grep | 11 |
| TaskUpdate | 10 |
| Write | 9 |
| TaskCreate | 9 |
| **Total** | **389** |

Bash at 244 dominates. Most of those calls are verification loops: rerunning builds, grepping for patterns, checking file sizes, confirming output. `Edit` — actual file modifications — accounts for 16 calls. That's a **15:1 ratio of verification to modification**.

This ratio matters. The expensive part of AI-assisted development isn't the editing; it's the validation work surrounding each edit. Faster local feedback loops would compress this significantly.

`WebFetch` at 11 calls came from session 4 — pulling live pages from Product Hunt, Hacker News, and competitor newsletters to collect signals not in the existing crawl data.

Session durations ranged from 1 minute (sessions 3 and 10) to 13 minutes (session 2). The longest session was the debugging session chasing the wrong hypothesis. Following stale error messages costs more time than almost anything else in this workflow.

> Error messages may not reflect current state. Checking the build log timestamp before starting to debug saves entire sessions.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
