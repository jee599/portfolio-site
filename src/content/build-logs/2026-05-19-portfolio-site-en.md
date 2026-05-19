---
title: "Auto-Detecting a Medical Ad Compliance Bug and Replacing Fonts Across 7 Pages: 4 Sessions, 52 Tool Calls"
project: "portfolio-site"
date: 2026-05-19
lang: en
pair: "2026-05-19-portfolio-site-ko"
tags: [claude-code, compliance-review, typography, dental-ad, daymoon, prompting]
description: "Claude Code caught a date misattribution in Korean medical ad copy with a blocking-issues-only prompt, then resumed an interrupted 7-page font swap."
---

One date in a document silently meant two different things.

Line 27 in `2026-05-19-daily-update.md` referenced "the 5/14 impression count increase" — but the 5/14 notice wasn't about impression counts. That was the 5/7 notice. The 5/14 notice was about a placement expansion test for restaurant categories on PC map. Someone had transposed the dates during editing, and the error was invisible to anyone who hadn't read both source notices side by side.

If the report shipped without review, it would have gone out wrong. This is what Korean medical advertising compliance review actually looks like: not catching obviously illegal claims, but finding subtle inconsistencies that create legal exposure.

Sessions 1 and 2 handled that: 4 tool calls, 0 file edits, 1 blocking issue found and fixed. Sessions 3 and 4 ran in parallel — a separate project replacing fonts across a 7-page photography studio site — where session 3 updated CSS and ended, and session 4 resumed from the exact stopping point.

52 tool calls across 4 sessions. 8 files modified, 0 created.

**TL;DR**: A `blocking-issues-only` Claude Code prompt caught a date misattribution in a Korean medical ad daily report. A session-resume handoff pattern finished an interrupted 7-page font replacement. Both prompt structures are shown in full below.

## Two Tasks, One Day

These sessions didn't run sequentially. The compliance review (sessions 1 and 2) ran as two quick passes before the ad report shipped — under 20 minutes total. The typography work (sessions 3 and 4) ran separately, with session 3 starting the same day and session 4 completing the task on the next open.

The pattern here is Claude Code as a set of specialized tools rather than one long assistant session. The compliance review sessions were read-only, output-constrained, and purpose-built for a specific content type. The typography sessions were scoped to a specific repo with explicit file targets and explicit skip constraints.

Neither session tried to do too much. When the task is well-scoped, the call counts stay proportionate.

## Korean Medical Advertising: Why Consistency Matters More Than Legality

Korea's Medical Service Advertising Act prohibits guaranteed outcomes, comparative rankings, specific facility names without authorization, and missing required disclaimers. Those are the clear violations. The harder compliance problems aren't clear.

A daily ad performance report for a dental client aggregates platform updates, policy changes, and copy recommendations — each citing a source notice with a date. If a date is wrong, a recommendation may trace to the wrong policy. In an audit, that reads as a fabricated justification even if the recommendation itself is correct.

What makes this difficult is context: you need to hold multiple source documents simultaneously and verify that each claim in the report matches the source it cites. A human reviewer can do this, but it requires complete context and focused attention. The kind of check that gets done carefully when there's time and less carefully when there isn't.

Claude holds all documents in context and applies the check mechanically. Encode the compliance criteria in the prompt once, run the same check before every publish.

## What "Blocking Issues Only" Does to a Review Prompt

Most review prompts ask for quality evaluation. "Is this good? What could be improved?" These produce suggestion lists, which require human judgment to triage. For compliance, that's the wrong abstraction.

The prompt for sessions 1 and 2:

```
Read these files and perform a blocking-issues-only review for
scheduled Korean medical/dental ads daily report.
Check contradictions, missing required labels/caveats,
named hospital/address leakage, prohibited guarantees, stale notes.
Answer OK if no blocking issues; otherwise list exact fixes.
Files: [MD file path] [HTML report path]
```

Four specific checks. Binary output: `OK` — report can ship — or a numbered list of exact line numbers and required changes. No "consider," no "might want to," no hedging.

The word "blocking" sets the output contract: you're asking for a gate, not an evaluation. When Claude can't hedge, the result is immediately actionable.

The four checks map to known failure modes:

- **Contradictions**: Does any claim conflict with another claim or source notice?
- **Missing required labels/caveats**: Are mandatory disclaimer patterns present?
- **Named hospital/address leakage**: Is any specific facility named without authorization?
- **Prohibited guarantees**: Does any copy guarantee outcomes or rankings?

Once these criteria are encoded in the prompt, the review runs consistently before every publish without additional configuration.

## The Bug: One Line, Two Meanings

The report covered two Naver platform notices:

- **2026-05-07**: Naver Place ad impression count increase
- **2026-05-14**: PC map Place ad placement expansion test (restaurant category)

Two distinct changes: 5/7 affected how many ads appeared; 5/14 affected which placement surfaces were available. Lines 5 and 12 documented both correctly. Line 27 didn't.

Line 27: "After the 5/14 impression count increase..." — using the 5/14 date to refer to the impression count event, which was 5/7. The 5/14 notice was about placement expansion.

This is a factual contradiction: a statement attributing behavior X to date Y, when date Y is documented elsewhere in the same file as being about behavior Z.

Session 1 returned the finding with the exact location and change required. One sentence to fix. Session 2 re-ran the same prompt on the corrected file: `OK` across all four categories. Date consistency verified, no hospital name leakage, no prohibited guarantee expressions, risk language handled appropriately.

Total: 4 Read calls. 0 file edits. Claude acted as reviewer only.

## Resuming a Stalled Session Without Starting Over

The Daymoon project was a photography studio site. Font direction: `Outfit` for English text, navigation, and brand elements; `Pretendard` for Korean body text. Both geometric sans-serif — the combination holds visual consistency across scripts.

Session 3 started cold. Explored the repo structure, confirmed the existing font load setup (Noto Sans KR + Outfit via Google Fonts), updated `styles.css` with new font declarations and CSS variable reassignments. Session ended before the HTML files were updated.

Seven pages remained: index, about, product, gallery, contact, notice, reservation. Each `<head>` still loaded Noto Sans KR. Without the webfont link in HTML, `Pretendard` would fall back silently on a fresh cache load.

Session 4 prompt:

```
Continue the Daymoon typography update. The previous run changed styles.css but stopped before completing.
Finish the task in /Users/jidong/daymoon-pic-site:
1. Ensure Pretendard actually loads on all real site pages.
   Current HTML pages load Google Fonts for Noto Sans KR + Outfit.
   Add a safe Pretendard webfont load consistently to real pages
   (index/about/product/gallery/contact/notice/reservation as applicable),
   or otherwise make Pretendard available. Keep Outfit too. Do NOT add serif fonts.
```

"The previous run changed X but stopped before completing. Finish Y." One sentence establishes state. Claude didn't re-explore to figure out the current position — the prompt provided it directly.

Session 3 spent 14 Bash calls on discovery: locating files, reading font load patterns, tracing CSS variable references. None of that repeated in session 4.

This pattern also applies to intentional splits. Deliberately stopping at a natural checkpoint — CSS first, HTML separately — creates a smaller rollback unit. If `styles.css` had introduced an unintended override, you'd catch it before propagating the change to 7 HTML files. The "Continue the previous run" structure works for both accidental and intentional session breaks.

## The Font Pairing Decision

Before replacing fonts, the direction was "Quiet Minimal" — the site should support the photography, not compete with it. Neutral, editorial, without being generic.

`Outfit` for English and navigation:

- Low stroke contrast keeps it from drawing attention to itself
- Humanist proportions without quirky letterforms — legible at small sizes, interesting at display sizes
- Available as a variable font on Google Fonts, so no additional CDN dependency for English characters

`Pretendard` for Korean body text:

- Designed specifically to pair with Western grotesks — proportions calibrated for mixed Korean/English layouts
- Covers the full character set for Korean web use including Hanja and special characters
- Variable version handles the full weight range in one file

The pairing produces visual continuity between scripts: similar x-height, similar stroke weight, similar overall texture. On a photography site where the content is images, type consistency keeps the UI from pulling focus.

## Variable Font, Dynamic Subset: What the CDN Link Does

The `<link>` added to each page's `<head>`:

```html
<link rel="stylesheet" as="style" crossorigin
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
```

Two technical choices:

**Variable over static weights**: Loading separate `.woff2` files per weight creates one HTTP request per weight file. A variable font bundles all weights in one file and one request. For a site using 3-4 Korean font weights, this is a meaningful reduction in HTTP overhead.

**Dynamic subset over full character set**: A full static Korean font covers the KS X 1001 character set plus extensions — 2–4 MB per weight file. Dynamic subset serves only the characters present on the current page, then loads additional subsets on demand. For pages where Korean text is limited to navigation labels and short headings, the initial font payload drops significantly.

The jsDelivr link handles both in one import. No custom font loading strategy required.

## Session Statistics

| Session | Task | Tool Calls | Primary Tools |
|---------|------|-----------|---------------|
| 1 | Medical ad review (issue found) | 2 | Read × 2 |
| 2 | Re-review (OK confirmed) | 2 | Read × 2 |
| 3 | `styles.css` update (incomplete) | 23 | Bash × 14, Read × 5, Edit × 4 |
| 4 | 7 HTML pages completed | 25 | Edit × 13, Read × 7, Bash × 4 |

Total: 52 tool calls. Bash (18), Edit (17), Read (16), Grep (1). 8 files modified, 0 created.

Session 3's Bash count (14) reflects the cold-start discovery phase. Session 4's Bash count (4) reflects execution on a known target.

The shift from Bash-dominant to Edit-dominant is a diagnostic signal. Bash-heavy sessions are in discovery mode. Edit-heavy sessions are in execution mode. When a session starts with an explicit state handoff, it skips the discovery phase entirely.

## Patterns Worth Keeping

**Constrained output format over open-ended review.** "Blocking issues only" with binary output removes ambiguity. The structure applies to any review with a known failure mode list: deploy checklists, API security audits, legal copy, content moderation.

**State handoff between sessions.** "The previous run changed X but stopped before completing" is a one-sentence state transfer that replaces re-discovery. It works for both accidental and intentional session splits, making mid-task verification safe without losing accumulated context.

**Split at dependency layers.** CSS before HTML is the right boundary. If the CSS direction is wrong, you want to know before propagating it to 7 files. Splitting at natural dependency layers keeps rollback units small and verification meaningful.

Running these as four separate sessions instead of one long session meant each had a clear, narrow scope. The compliance reviewer never saw the font files. The font updater never had to think about compliance. Narrow sessions with constrained output produce predictable results.

> The cost of restarting a session is lower than the cost of missing a mid-task verification step.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
