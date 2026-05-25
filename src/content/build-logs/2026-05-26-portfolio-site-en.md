---
title: "481 Files Parsed, 0 Errors: When the Diagnosis Is Wrong, So Is the Fix"
project: "portfolio-site"
date: 2026-05-26
lang: en
pair: "2026-05-26-portfolio-site-ko"
tags: [claude-code, debugging, workflow, automation, pdf-generation]
description: "Vercel build failed with a YAML error pointing to a specific file. gray-matter parsed 481 files and found zero errors. The real blocker was a missing CountUp.tsx. 13 sessions, 420 tool calls."
---

481 markdown files parsed with gray-matter. Zero errors. The YAML frontmatter diagnosis that kicked off this debugging session was completely wrong.

When Vercel fails with an error that names a specific file and a specific column, you follow the breadcrumb. That's not bad judgment — it's normal debugging instinct. But error messages capture state at a point in time. By the time you're reading them, the code may have moved on. That mismatch burned two sessions and ~100 Bash calls this week before the pattern became obvious.

**TL;DR:** Falsify error messages before you trust them — especially when they point to a specific file. Run a quick global check first. And when your orchestrator misclassifies a task as `major`, reclassify it in the first response rather than sitting blocked in a planning loop.

## The YAML Error That Pointed at Nothing

April 28 report: Vercel build failing on YAML frontmatter parsing. The error even named a file:

```
YAMLException: incomplete explicit mapping pair; a key node is missed;
or followed by a non-tabulated empty line at line 3, column 277
```

Reasonable first move: check the YAML. Parsed all `.md` files across `content/posts/`, `content/daily/`, `content/blog/`, `content/weekly/` with gray-matter. 481 files. Zero errors.

Then checked the specific location the error described — line 3, column 277 of the named file. A batch fix committed on April 14 (`3095c96`) had already cleaned that up. The current line 3 in that file was 204 characters. The error the report described had ceased to exist a month earlier.

The actual build blocker was `CountUp.tsx`. `HomeContent.tsx` imported it, but the file didn't exist. Turbopack (Next.js 16's default bundler) fails fast on missing imports. YAML was never involved.

Two fixes: create `CountUp.tsx`, recover frontmatter on 2 daily files that were missing it. Ran a local build, confirmed 480 pages generated cleanly, pushed to main. 76 Bash calls, 13 Reads.

Then the same report came in again in session two. This time: parsed with `js-yaml` as a second opinion, extracted files with unusually long lines, dug into `validate-content.mjs` line 581 where `matter.stringify` rewrites files. Suspected it might be corrupting post-April-27 files. Same conclusion: both parsers pass, two daily files without frontmatter (`content/daily/2026-04-10.md`, `2026-04-10-en.md`) flagged — already a known issue.

Session two spent ~100 Bash calls verifying what session one had already determined.

The pattern to carry forward: when an error message gives you a specific file and line number, verify that location still exists in the current codebase before doing anything else. `git log --follow`, `wc -c`, a quick `cat -n` — any of these takes 5 seconds and can save you an entire session.

## When the Orchestrator Gets the Complexity Wrong

Half the sessions this week hit a recurring friction point: the Hermes orchestrator classifying tasks as `major` and blocking the Edit tool, when the actual work was 1-2 files and no code changes.

One session: add a dated section to two dental ad monitoring files (`competitive-serp-observations.md` and `naver-ranking-hypotheses.md`). Append the 2026-05-25 block. Pure `simple` work by any reasonable definition. Orchestrator gate flagged it as `major`.

The fix is one bash call:

```bash
source ~/.claude/workflows/{project-slug}/lib/state.sh && \
  state_set complexity simple && \
  state_set stage implementing
```

That unblocks the Edit tool and the session continues. This pattern showed up in sessions 5, 7, 9, and 10 — HTML report formatting, a 2-line TOC fix, an artifact append, a content section update. All flagged `major`, all reclassified to `simple` and completed without issue.

The heuristic for when the classification is wrong:
- File count: 1-2
- No code changes (content or artifact files only)
- Spec is already fully defined

When all three hold, the plan → verify → codex pipeline adds overhead with no benefit. The better move is to state the reclassification in the first response: "This is a single-file content update, reclassifying as `simple`." One line, then proceed. Sitting blocked in a planning loop reaches the same conclusion with more tool calls.

Session 7 ended with an incomplete repair — the task carried over to session 8. Session 8 picked it up: add hypothesis 35 to `naver-ranking-hypotheses.md`, strengthen context on hypotheses 30/31. Verified with grep (`2026-05-25` marker present, `가설 35` present), closed.

## Building a Chrome Headless PDF Pipeline

Sessions 9, 11, 12, and 13 all produced reports as PDFs. Four reports total, same pipeline each time.

The structure is straightforward: build content and styling entirely in HTML, then render to PDF with Chrome headless.

```bash
google-chrome --headless --disable-gpu \
  --print-to-pdf=output.pdf \
  --print-to-pdf-no-header \
  input.html
```

After generation, verify required strings made it into the output:

```bash
pdftotext output.pdf - | grep "required phrase"
```

Session 13 caught a real issue this way: a line item with unconfirmed amounts was missing the "see attached notice" annotation. Codex review flagged it. Two-line Edit, PDF regenerated.

Reports produced this week:
- `2026-05-25_spoonai_fortunelab_global_100_report.pdf` — 13 pages, 1.2 MB
- `2026-05-25_gov_startup_support_seoul_gyeonggi_ai_solo.pdf` — 2.7 MB
- `2026-05-25_gov_startup_support_realistic_strategy.pdf` — A4, 10 pages, 2.5 MB

Session 10 hit a TOC numbering bug: TOC listed item 9 as "Source Appendix", but the body had item 9 as "Changes from Previous Report" and item 10 as "Source Appendix". Two-line Edit (add missing TOC entry + anchor id in body), PDF regenerated. 8 Bash calls, 4 Edits for that session.

The main failure mode with this pipeline is skipping verification. It's easy to generate a PDF that looks right visually and miss a missing string. Codex catching the annotation gap in session 13 is a good argument for keeping the grep check every time.

## Session Stats

13 sessions, 420 tool calls.

| Tool | Count | % |
|------|-------|---|
| Bash | 263 | 62% |
| Read | 72 | 17% |
| Edit | 20 | 5% |
| Grep | 13 | 3% |
| Write | 11 | 3% |
| WebFetch | 11 | 3% |
| TaskUpdate | 10 | 2% |
| TaskCreate | 9 | 2% |

Bash at 62% reflects what this week actually was: build execution, PDF conversion, state.sh calls, grep verification, file size checks. More validation than construction.

Read at 17% is higher than typical — several sessions needed large files read in chunks, plus referencing existing patterns before generating new content.

Edit at only 20 calls is the revealing number. Most actual changes happened through Bash (PDF regeneration, file recovery) rather than direct edits. The ratio of verification calls to edit calls was roughly 13:1.

8 files modified, 9 files created. 1.3 files changed per session on average.

## What to Carry Forward

**On error messages:** A specific file path and line number is a claim about the past, not the present. Before debugging, verify the claim: does the error location still exist? A 5-second check can tell you whether you're chasing a live issue or a ghost.

**On orchestrator classification:** When the classification is clearly wrong (1-2 files, no code changes, fully defined spec), reclassify in the first response. Don't wait for the planning loop to reach the conclusion it would have skipped. "This is single-file content, reclassifying as `simple`" takes one line and keeps the session moving.

**On PDF verification:** Always grep the output. Visual inspection misses missing strings. `pdftotext | grep` is fast and catches the class of bug that's hardest to spot in a rendered PDF.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
