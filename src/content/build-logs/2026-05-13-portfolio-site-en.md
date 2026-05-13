---
title: "4 Pivots, 604 Tool Calls: Building a Photographer Portfolio in One Day with Claude Code"
project: "portfolio-site"
date: 2026-05-13
lang: en
pair: "2026-05-13-portfolio-site-ko"
tags: [claude-code, astro, animation, ui-ux]
description: "Built Daymoon's photography portfolio across 19 Claude Code sessions in one day — FLIP animation, full redesign, slideshow, 4 direction changes. 604 tool calls, transparent."
---

Nineteen sessions in a single day. 604 tool calls. Fourteen files modified. And four complete direction changes.

That's the shape of today's work on `daymoon-pic-site` — a photography portfolio for Daymoon. Not a clean, linear build. A working day that went wherever the user's vision went, with Claude Code following each pivot.

**TL;DR** The user changed direction four times over 19 sessions: cursive FLIP animation → commercial editorial redesign → slideshow → Korean/English language toggle. Claude Code rewrote hundreds of lines each time. The day's highlight was a Stop hook false positive triggered by a verification note inside `WORKLOG.md` — not by actual debug code. Tool distribution: Bash 193, Read 172, Edit 141.

## Session 1: A Cursive Logo That Flies Into the Header

The first session started with two requests delivered together.

> "the daymoon cursive logo is getting clipped at the bottom — fix that, and I want to see the letters write themselves, then the logo naturally move to where it sits in the header"

The clipping was a descender problem. Script-style fonts have letterforms that drop below the baseline, and the container had `overflow: hidden` cutting them off. Adjusting `padding-bottom` and recalculating `line-height` fixed it without affecting surrounding layout.

The animation was the more interesting constraint. Two approaches exist for an intro-to-header transition: fade-crossfade, or FLIP (First, Last, Invert, Play). Fade-crossfade causes a moment where two visually similar elements overlap — a glitch. FLIP physically moves the element, preserving object permanence. The viewer sees one thing travel, not two things swap.

Implementation replaced the intro IIFE in `script.js` with a three-phase body class sequence:

```
intro-active → intro-morphing → intro-done
```

At the `intro-morphing` phase, `getBoundingClientRect()` captures the intro wordmark's current position and the header brand box's position. The delta is applied as a reversed `translate` transform — snapping the wordmark to appear at its intro position while it's already rendered at the header location. Enabling CSS transition and removing the transform lets the browser animate back to natural position.

Verified via CDP (Chrome DevTools Protocol): intro removed within 4500ms, brand opacity returning from 0 to 1 on schedule, no console errors.

Tool breakdown: Read(13), Edit(10), Bash(9), TodoWrite(5), Grep(4) — 43 total.

## "Redo It. This Is AI/Generic."

Three sessions later, the direction changed completely.

> "redo it properly — commercial design fonts / layout / as many photos visible as possible / marketable for web and mobile both"

The handwriting intro and single-photo emotional layout were both out. The new target: editorial commercial photography site. 5-column contact-sheet grid, dense product strip, mobile sticky DM bar. `styles.css` was rewritten from scratch.

This is where something interesting happened with the workflow system. The plan-orchestrator was called to produce `plan.md`, and the orchestrator gate classified this as `standard` complexity — which blocked direct editing until the stage advanced to `implementing`. The classification wasn't wrong, but the actual work was structurally simple: one file, full rewrite. The complexity label and the practical task didn't match, which added overhead to a straightforward operation.

The rewrite completed without issues once the stage cleared. The grid, the strip, the mobile bar — all implemented in the target session. The workflow classification friction is worth noting because it surfaces a real question: when does architectural staging improve quality versus add latency?

## Slideshow, and the Stop Hook That Cried Wolf

After several more sessions, the home layout changed again. The contact-sheet grid was out. The user wanted a single large photo cycling through a fade-in / fade-out slideshow.

The implementation was straightforward. Actual photos from `assets/` loaded into a JavaScript array, `setInterval` advancing the index, CSS `transition` handling the crossfade. One dead-end worth noting: the first draft used a pool of `<figure>` elements in the DOM as an asset holder. The code got messy quickly and was reverted to a simple JS array.

Then the Stop hook fired at end-of-session:

```
Stop hook feedback:
Found 1 debug/잔존마커 leftover(s) in working tree.
```

There was no debug code. Grep traced the flag to this line in `WORKLOG.md`:

```
디버그 코드·잔존마커 0건
```

"Zero debug markers" — a verification note confirming nothing was left behind — contained the exact keyword the hook was grepping for. The context didn't matter. The hook matched the string.

Fixed by rewriting the phrase to avoid the trigger keyword. The broader rule: verification notes in `WORKLOG.md` shouldn't literally contain the strings that validation hooks search for. The hook can't distinguish between "this word appears in code" and "this word appears in a sentence about the word."

Session 11 tool breakdown: Bash(27), Edit(16), Read(12), Grep(8) — 64 total.

## Five Sessions of Language Switching

The final five sessions were the most revealing part of the day — not technically complex, but operationally interesting.

Session 14 unified the product page to English: `Graduation / Couple / Friend / Wedding`.

Session 15 reversed it: "make all of that page Korean" — `졸업스냅 / 커플스냅 / 우정·가족 / 웨딩스냅`.

Session 16 extended Korean to in-page navigation anchors.

Session 17 replaced the `DM` token with `문의하기` throughout.

Session 18: "restore navigation to English, keep content Korean."

Each session modified only what was asked. Session 18 was the cleanest: navigation strings reverted to English, and the inline `<style>` blocks added in previous sessions were removed at the same time — the diff was tighter than if cleanup had been deferred. Cache-busting version strings across six HTML files stayed in sync via Edit calls each session:

```
?v=dm-clean-home-20260513-1
?v=dm-product-lang-20260513-1
?v=dm-product-nav-restore-20260513
```

The version suffix acts as a change log — you can read the history from the URL.

What this sequence demonstrates: Claude Code in rapid iteration mode works better with tight scope. "This file only", "this section only", "don't touch the other pages" — explicit constraints reduced tool call counts and error rates. Open scope leads to unnecessary reads and accidental side effects. Tight scope keeps each session fast and reversible.

## What 604 Tool Calls Look Like

Full day breakdown:

| Tool | Count |
|------|-------|
| Bash | 193 |
| Read | 172 |
| Edit | 141 |
| Grep | ~50 |
| Other | ~48 |

Bash leading is expected — verification, git ops, CDP checks, workflow state updates. Read nearly matching Bash is the pattern worth noting. The rhythm is: read current state, make change, verify result. That's two Read/Bash calls per one Edit. Exploration costs more than implementation.

FLIP animation, despite being architecturally non-trivial, moved fast because the requirements were precise. The commercial redesign took longer — not because of technical difficulty, but because "commercial and marketable" required resolving a visual direction before implementation could start. The language sessions moved fastest of all: explicit string targets, clear before/after.

> Specific requests produce fast output. Directional requests require a resolution step first. Knowing which kind of request you're making is more important than the request itself.

## What Changed About How I'll Work

Three patterns from today that hold across any Claude Code session:

**Scope constraints are a feature.** Telling Claude Code "only this file" or "only this section" isn't limiting — it's accurate. Models work better with narrow scope because they can read the relevant code completely without drifting into adjacent files. Open-ended requests invite unnecessary exploration.

**Hook greps are context-free.** The Stop hook that flagged `WORKLOG.md` did exactly what it was configured to do. Validation systems operate on pattern matching, not semantics. Write verification notes with that in mind — avoid putting the very strings you're checking for into prose about those strings.

**Direction changes are recoverable.** Four pivots in one day sounds chaotic. In practice, each pivot was a clean cut: commit, then rebuild. The commit history after this day is a complete record of every approach, including the ones that got replaced. That's not waste — that's informed iteration with full rollback.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
