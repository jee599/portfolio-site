---
title: "FLIP Animation, CSS Inheritance Bugs, and a Full Redesign Demand — Claude Code 7 Sessions, 198 Tool Calls"
project: "portfolio-site"
date: 2026-05-13
lang: en
pair: "2026-05-13-portfolio-site-ko"
tags: [claude-code, animation, css, ui-design, daymoon]
description: "Built a FLIP intro animation for a photographer's portfolio, fixed CSS inheritance bugs, unified typography — then got a full redesign demand at end of day. 198 tool calls."
---

The FLIP animation took one day to build. The user's response at the end: "redo it."

That's the arc of this build log. Seven sessions, 198 tool calls, one photographer's portfolio site, and a sharp reminder that "technically working" and "commercially convincing" are different targets.

**TL;DR** Built a FLIP-based intro-to-header animation for Daymoon, a photographer's portfolio site. Fixed an Instagram logo CSS filter conflict, removed a duplicated mobile drawer element, and unified `letter-spacing` across four HTML files. Final session: user rejected the entire design direction and requested a commercial-grade rebuild. 7 sessions, 198 tool calls total.

## Morning: AI Reviewing AI-Generated Output

The first two sessions had nothing to do with code. The task was cross-verifying auto-generated medical ad briefings — running Claude Opus over the pipeline's output to check whether AI-generated numbers matched the source data.

The prompt design mattered more than any implementation detail:

```
Report only issues that must be fixed before delivery; if none, say OK.
```

Scoping to "blocking problems only" eliminates noise. The verification covered 10 notice IDs, SERP statistics, and AI briefing frequency counts — all cross-referenced against the original `summary.json`. Everything matched. Result: OK.

2 sessions, 13 tool calls, 0 file edits. The practical insight: rule-based checks like number matching and field existence verification are faster and more accurate with AI than manual review. The narrow prompt scope is what makes the output actionable — you're not asking for editorial opinion, just a go/no-go on specific fields.

## The Cursive Logo That Got Clipped

Afternoon: Daymoon, a photographer's portfolio site. Two requests arrived together.

First: the `daymoon` cursive wordmark was getting clipped at the bottom. Second: after the logo "writes itself" in the intro, it should animate to the header brand box position, as if flying into place.

The clipping was a descender problem. Script-style fonts have descenders that drop below the baseline. The container had `overflow: hidden` applied for layout reasons, which cut them off. Adjusting `padding-bottom` and recalculating `line-height` fixed it without touching surrounding elements.

The animation was the more interesting constraint.

## FLIP Instead of Fade — Why It Matters

Two approaches for the intro-to-header transition. Option one: fade out the intro wordmark, fade in the header brand. Option two: FLIP (First, Last, Invert, Play) — physically move the element.

Fade-crossfade creates a moment where two visually similar elements overlap, which reads as a glitch. FLIP moves the actual intro wordmark to the header's exact coordinates, maintaining object permanence. The user sees one thing move, not two things swap.

The implementation replaced the entire intro IIFE in `script.js`:

1. **First** — Record the intro wordmark's current bounding rect with `getBoundingClientRect()`
2. **Last** — Record the header brand box bounding rect
3. **Invert** — Compute the delta, apply it as a reversed `translate` + `scale` (this snaps the element to look like it's at its intro position, but rendered at the header location)
4. **Play** — Enable CSS transition, remove the transform — the browser animates back to natural position

```javascript
const first = introWordmark.getBoundingClientRect();
const last = brandBox.getBoundingClientRect();

const dx = first.left - last.left;
const dy = first.top - last.top;
const scale = first.width / last.width;

// Snap to inverted position (no transition yet)
introWordmark.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

// Force reflow, then release
requestAnimationFrame(() => {
  introWordmark.style.transition = 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)';
  introWordmark.style.transform = 'none';
});
```

Verification was done via CDP (Chrome DevTools Protocol), tracking the `body` class transition sequence from a local server:

```bash
# CDP verification output
body class: intro-active → intro-morphing → intro-done ✓
ink element lands on brand box (607,13–672,37) ✓
no console errors ✓
```

Completed in under 4500ms. Session breakdown: 13 Read, 10 Edit, 9 Bash — four of the Bash calls were CDP verification scripts.

## The Instagram Logo and CSS Scope That Was Too Wide

Next request: replace the DM button placeholder with the actual Instagram logo.

`logo-instagram.svg` was already in `assets/`. That part was trivial. The problem: `.simple-nav .book img` had `filter: invert(1)` — a rule written to make images white against dark header backgrounds. That selector was broad enough to catch the DM link's `img` element too, flipping the Instagram logo to white on a light background.

Fix: scoped override.

```css
.simple-nav .book.dm-link img {
  filter: none;
}
```

Same session, a second inheritance issue surfaced. `.drawer-row.icon-link` was inheriting `justify-content: center` from `.icon-link`, centering the icon in the mobile drawer when it should be left-aligned. Grep traced the full selector hierarchy. Two Edit calls total.

These are the bugs that take longer to locate than to fix. You have to map the inheritance chain before the cause becomes obvious, and CSS inheritance doesn't make that chain visible at a glance.

## Mobile Drawer Deduplication + Typography Unification

Opening the mobile drawer showed `daymoon / DM 문의` at the top section and a second `DM 문의` in the bottom nav. Duplicate entry, different visual weight.

Removed the `.drawer-login` DM link. Only the bottom nav's Instagram logo link remains. The drawer top now holds brand name only.

Typography was inconsistent across files. `letter-spacing` ranged from `-0.04em` to `-0.07em` depending on the heading element and which HTML file:

```css
/* Before — scattered across four files */
.hero-title { letter-spacing: -0.07em; }
.section-label { letter-spacing: -0.04em; }
.nav-brand { letter-spacing: -0.05em; }

/* After — unified */
h1, h2, .display { letter-spacing: -0.045em; }
```

Pretendard font loading was also missing from two HTML files. Applied uniformly across all four: `index.html`, `gallery.html`, `product.html`, `contact.html`. Along with `styles.css` and `script.js`, this session touched six files — 26 Edit calls and 17 Bash calls.

## Final Session: "Redo It"

Last session of the day. The request:

> "redo it properly — commercial design, fonts/layout/maximum photos visible, marketable for web and mobile"

This wasn't a bug report. It was a direction rejection. The site had drifted toward text-heavy layout, which is the wrong direction for a photography portfolio. A portfolio that doesn't lead with images has already failed its primary job.

This session didn't reach implementation. It was file exploration and state assessment — reading `PROJECT.md` and `WORKLOG.md`, mapping existing asset structure. 12 Bash calls, 8 Read calls, 0 edits. The redesign continues in the next session.

## What 198 Tool Calls Look Like

Seven sessions, 198 total. Breakdown: Bash 62, Read 61, Edit 55.

Read and Bash being nearly equal is the pattern worth noting. The workflow is: read current state → make change → verify result. That cycle repeats. The ratio is roughly one verification per one modification.

Small CSS bugs took longer to locate than large feature changes. Filter inheritance and letter-spacing inconsistency both required tracing full selector hierarchies before the fix was obvious. The FLIP animation, despite being structurally more complex, moved faster — the requirements were precise, so implementation could start immediately.

> Specific user requests produce fast AI output. "Commercial layout, photo-first, responsive" is directionally clear. The redesign session has everything it needs to start.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
