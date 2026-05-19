---
title: "Resuming a Dead Claude Code Session: 7 Pages Updated in 25 Tool Calls"
project: "portfolio-site"
date: 2026-05-20
lang: en
pair: "2026-05-20-portfolio-site-ko"
tags: [claude-code, typography, pretendard, session-continuation, workflow]
description: "When a Claude Code session dies mid-task, the next session starts blind. Here's the exact resume prompt pattern that picks up cleanly — used to migrate Pretendard across 7 HTML pages in 25 tool calls."
---

A Claude Code session ended after modifying one CSS file. Seven HTML pages still needed the web font link tag. The next session had zero memory of any of it. A precisely structured resume prompt finished the job in 25 tool calls.

**TL;DR** — Font migration for Daymoon, a photographer's portfolio site. Session 3 (23 tool calls) updated `styles.css` then stopped. Session 4 picked up with a handoff prompt that specified current state, remaining work, and hard rules — then completed all 7 HTML files in 25 tool calls. Total across both sessions: 48 tool calls, 8 files changed.

---

## The Session Ended After One File

The task: migrate the Daymoon photographer portfolio from its existing font stack to Pretendard for Korean body text, keeping `Outfit` for navigation and brand elements.

Session 3 mapped the repo structure (14 Bash calls), read key files (5 Read calls), then updated `styles.css` with the new font stack. 23 tool calls total. Then the session ended.

The problem: CSS alone doesn't load the font. Each of the 7 HTML pages had a `<head>` section with explicit web font link tags — `<link>` elements pointing to CDN stylesheets. Changing the CSS font stack doesn't inject those link tags. The new stack was referenced but never loaded.

Seven files. Zero of them touched. Session over.

---

## Hard Rules Before Any Code Runs

Before Session 3 started, the design direction was locked. The user had reviewed font pairing options and picked "Quiet Minimal":

- English / brand / navigation: `Outfit`
- Korean body text: `Pretendard` (variable subset via jsDelivr CDN)

The constraints went directly into the prompt:

```
Hard rules:
- Follow existing Daymoon style: photo-first, minimal, white/near-white
- Do NOT add serif fonts (no Cormorant, EB Garamond, or similar)
- Do NOT add marketing copy or decorative text
- Do NOT redesign the layout — photos are the subject, not the typography
```

This matters more than it looks. Without explicit prohibitions, Claude generates plausible alternatives. Cormorant Garamond is a legitimate choice for a photographer's site — elegant, editorial, widely used in that genre. It's the kind of "improvement" that looks reasonable in isolation. The hard rule eliminates that path before the model can take it.

Clear negative constraints keep scope fixed. The model stops optimizing for aesthetic quality and starts optimizing for compliance with stated intent.

---

## The Resume Prompt Is the Entire Mechanism

Claude Code has no memory between sessions. Session 4 started blind: no knowledge of what Session 3 had done, no awareness that `styles.css` was complete, no context about which files remained.

Everything had to come from the prompt.

Here's the structure that Session 4 received:

```
Continue the Daymoon typography update. The previous run changed styles.css
but stopped before completing.

Finish the task in /Users/jidong/daymoon-pic-site:
1. Ensure Pretendard actually loads on all real site pages — add the CDN
   link to every HTML file's <head> if it's missing
2. Keep the existing Outfit + Noto Sans KR links intact (don't remove them)
3. Update cache-bust version strings where present

Hard rules:
- No serif fonts
- No marketing copy
- Photo-first minimal style — do not alter the design
```

Three components, all required:

**1. Current state**: what the previous session completed. Not "we were working on fonts" — specifically: "`styles.css` updated, HTML files not yet touched."

**2. Remaining work**: explicit list of what's left. Not "finish the font migration" (ambiguous). "Add the Pretendard CDN link tag to the `<head>` of every HTML file in the site directory."

**3. Hard rules repeated**: new session, no prior context. Constraints that weren't in this prompt didn't exist as far as Session 4 was concerned.

The "continue from" framing sets the starting point immediately. Claude doesn't re-explore what's already done or validate decisions that were already made. It treats the stated checkpoint as ground truth and works forward from there.

---

## Pattern Verification Before Batch Editing

Session 4's first move wasn't to open an HTML file and start editing. It was to verify structure across all 7 files.

Claude read one page, then checked the pattern claim:

> All 7 real pages share identical font-loading lines.

`index.html`, `about.html`, `contact.html`, `gallery.html`, `notice.html`, `product.html`, `reservation.html` — every `<head>` section had the same CDN links, in the same order, with the same formatting. No exceptions.

This check is the unlock for batch mode. When the pattern is confirmed identical, you read one file carefully to understand the surgery, then repeat the same edit 7 times without per-file judgment overhead. If the pages had diverged — different CDN providers, different tag ordering, custom inline fonts on some pages — each file would need individual handling.

They didn't. Confirmed identical, operated as batch.

The implementation added Pretendard Variable with dynamic subset via jsDelivr:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css">
```

Dynamic subset is the correct choice for a Korean-language site. It only loads the Unicode blocks actually used on each page, rather than the full Pretendard character set. The tradeoff: slightly more complex cache behavior, significantly faster first-paint on pages with sparse Korean text.

The existing `Outfit` and `Noto Sans KR` link tags stayed. Additive rather than replacing: if Pretendard fails to load for any reason (CDN outage, browser quirk), the fallback stack remains functional. The cache-bust version string was also updated — minor but worth doing when touching every `<head>` anyway.

Session 4: 25 tool calls (Edit 13 / Read 7 / Bash 4 / Grep 1). Closed.

---

## What the Tool Call Distribution Shows

Sessions 3 and 4 together: 48 tool calls across two separate context windows.

| Session | Tool Calls | Breakdown |
|---------|------------|-----------|
| Session 3 | 23 | Bash 14 / Read 5 / Edit 4 |
| Session 4 | 25 | Edit 13 / Read 7 / Bash 4 / Grep 1 |

Session 3 was exploration-heavy. Before writing any code, Claude needed to understand a repo it had never seen: directory layout, how assets were organized, whether HTML pages used a template system or were individual files, where the font loading happened. 14 Bash calls for `ls`, `find`, and `git log` operations. That's front-loading — spending tool calls on understanding before committing to edits.

Session 4 was implementation-heavy. The structure was already understood (from the resume prompt's context). The remaining work was mechanical: verify pattern, apply edit, move to next file. 13 Edit calls for 7 HTML files plus minor touchups, 7 Read calls for verification before and after edits.

The distribution is telling. Good AI-assisted work isn't just about minimizing total tool calls — it's about spending them on the right things in the right order. Exploration up front, pattern verification before batch work, implementation after both.

---

## A Parallel Pipeline: Medical Ad Attribution Audit

Sessions 1 and 2 that day weren't typography. They were a separate project: daily ad performance review for a dental clinic (`dentalad`).

The artifact: `2026-05-19-daily-update.md`. Line 27 had a date attribution error — an ad volume increase was listed under the May 14 notice, but the actual policy change was in the May 7 notice. The downstream effect: the report implied a two-week delay in effect that didn't exist. Small but meaningful in a compliance-sensitive context.

Session 1 found it (4 Read calls). Session 2 confirmed the fix looked correct (2 Read calls). Done.

This is the other end of the complexity spectrum from the font migration. Different task type, different tool distribution, same fundamental approach: the prompt specifies exactly what to examine and what correct looks like. The session doesn't wander.

---

## Full Session Statistics

| Metric | Count |
|--------|-------|
| Total sessions | 4 |
| Total tool calls | 52 |
| Edit | 17 |
| Bash | 18 |
| Read | 16 |
| Grep | 1 |
| Files modified | 8 |
| Files created | 0 |

Bash outnumbers Edit across all sessions because Session 3 spent heavily on repo exploration before writing any code. Once the structure was mapped and pattern confirmed, Session 4 flipped — Edit-heavy, Bash-light.

---

## Three Rules for Resuming a Stopped Session

When a Claude Code session ends mid-task, the next session can pick up cleanly. The resume prompt needs exactly three things:

**State what was completed.** Not implied — written explicitly. "The previous session updated `styles.css` and stopped before touching HTML files." This tells the new session where the checkpoint is and prevents re-doing work that's already done.

**List remaining work specifically.** "Finish the font migration" is too vague. "Add the Pretendard CDN link tag to the `<head>` section of these 7 HTML files" is actionable. The more specific the list, the less interpretation overhead the session spends before starting.

**Repeat all hard rules.** Every constraint that was in Session 3 needs to be in Session 4's prompt. The new context window didn't inherit "no serif fonts." It doesn't know about "photo-first minimal." Constraints that aren't stated don't exist.

With these three components, an interrupted session isn't wasted work. It's a documented checkpoint. The cost of the interruption is the time to write the resume prompt — usually a few sentences.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
