---
title: "Loading screen polish: Three.js background bleed-through, slide arrows, smart ETA"
project: "saju_global"
date: 2026-03-05
lang: en
pair: "2026-03-05-loading-analysis-ui-ko"
tags: [ui, three.js, loading, ux]
---

Started with a simple question: "why doesn't the Three.js background show on the loading page?"


## The opaque background was the culprit

`.loadingAnalysis`, `.loadingAurora`, and `.loadingParticles` in `globals.css` all had hardcoded dark background colors.

The Three.js canvas was sitting at `z-index: -2`, completely covered by the opaque backgrounds above it.

```css
/* Before — opaque background hides canvas */
.loadingAnalysis { background: #0a0b2a; }

/* After — transparent to let canvas show through */
.loadingAnalysis { background: transparent; }
```

Switching to `transparent` fixed it immediately.

CSS went from **18 lines → 3 lines**.


## Slides were overlapping the status bar

The `.eduSlide.in` class had `translateY(-6vh)` which was pushing slides into the top status bar area.

```css
/* Problem: slides drifting into status bar zone */
.eduSlide.in { transform: translateY(-6vh); }

/* Fix: reset to normal position */
.eduSlide.in { transform: translateY(0); }
```

Fixing this meant rethinking the entire slide container layout.


## Two additional UX improvements

<ul class="feature-list">
<li>
<span class="feat-title">Arrow buttons</span>
<span class="feat-desc">Desktop users can manually advance slides. Hidden on touch devices via <code>@media (hover: hover)</code>.</span>
</li>
<li>
<span class="feat-title">Smart ETA</span>
<span class="feat-desc">Stores the last 3 LLM round-trip times in <code>localStorage</code> under a <code>fortuneTimings</code> key. Averages them and displays "estimated ~N seconds." First-time users see a static fallback.</span>
</li>
</ul>


## Prompt strategy

Bundling everything in one Claude prompt invites over-refactoring.

So I split by commit scope.

First prompt: only the transparency fix.

Second prompt combined the rest:

> "eduSlide is overlapping the status bar due to translateY(-6vh). Fix that. Also add prev/next arrows for desktop. Track average LLM response time in localStorage and show it as estimated time."

Smaller scope = more precise output from Claude.


<hr class="section-break">

<div class="commit-log">
<div class="commit-row"><span class="hash">5d100bc</span> <span class="msg">fix(ui): make loading page backgrounds transparent</span></div>
<div class="commit-row"><span class="hash">88ef23f</span> <span class="msg">feat(loading): fix UI overlap, add slide arrows, smart estimated time</span></div>
</div>

<div class="change-summary">
<table>
<thead><tr><th>Item</th><th>Change</th></tr></thead>
<tbody>
<tr><td class="label">CSS removed</td><td class="after">-18 lines</td></tr>
<tr><td class="label">CSS added (arrows + timer)</td><td class="after">+54 lines</td></tr>
<tr><td class="label">page.tsx (state mgmt)</td><td class="after">+49 lines</td></tr>
</tbody>
</table>
</div>
