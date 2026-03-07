---
title: "Replacing CSS aurora backgrounds with Three.js CosmicBackground (4 z-index bugs)"
project: "saju_global"
date: 2026-03-05
lang: en
pair: "2026-03-05-threejs-cosmic-background-2-ko"
tags: [three.js, css, z-index, ui, debugging]
---

Ripped out 51 lines of CSS `body::before/::after` aurora and star-field animations.

Replaced them with a Three.js `CosmicBackground` component.

What should have been a one-commit swap turned into four debugging commits.

The canvas was invisible in three independent ways at once.


## CSS reset was killing the canvas

The Three.js canvas was mounted as `position: fixed` but nothing appeared on screen.

Asked Claude to look at `globals.css` and `CosmicBackground.tsx` together.

It immediately spotted the global CSS reset — `* { max-width: 100% }` — which squashes canvas elements to zero width.

```css
/* Problem: CSS reset kills canvas width */
* { max-width: 100%; }

/* Fix: exclude canvas */
*:not(canvas) { max-width: 100%; }
```

First commit: exclude canvas from that reset.


## Body background was painting over everything

Canvas started rendering, but still invisible.

The `body` had an opaque navy background (`#0a0b2a`) painting over everything beneath it.

Moved the dark fallback color to `html` and made `body` transparent.

At the same time, deleted the CSS aurora/star code in bulk. **51 lines gone.**


## z-index was the trickiest

The canvas was set to `z-index: -2/-1`.

Negative z-indexes slip behind the root HTML stacking context and disappear entirely.

> "z-index -2 falls below the html element's stacking context — raise the canvas to 0/1 and give main/footer z-index: 2."

That cracked it.

Also removed the magnetic mouse-follow CTA button. Complexity without payoff.


## Debugging pattern

Three independent causes, each masking the others.

Had to fix them one at a time, so commits split into 4.

In hindsight, the granularity made each change easy to isolate and review.


<hr class="section-break">

<div class="commit-log">
<div class="commit-row"><span class="hash">fcff7ec</span> <span class="msg">fix(ui): exclude canvas from max-width reset</span></div>
<div class="commit-row"><span class="hash">1ec4fcb</span> <span class="msg">fix(ui): remove CSS aurora/star backgrounds</span></div>
<div class="commit-row"><span class="hash">96a5555</span> <span class="msg">fix(ui): make body transparent for canvas</span></div>
<div class="commit-row"><span class="hash">052de6e</span> <span class="msg">fix(ui): fix z-index stacking, remove magnetic CTA</span></div>
<div class="commit-row"><span class="hash">2d71d3a</span> <span class="msg">fix: increase hook timeout to 180/240s</span></div>
</div>

<div class="change-summary">
<table>
<thead><tr><th>Item</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td class="label">CSS background code</td><td class="before">51 lines</td><td class="after">0 (moved to Three.js)</td></tr>
<tr><td class="label">Commits</td><td class="before">—</td><td class="after">5 (4 debug + 1 config)</td></tr>
<tr><td class="label">Husky timeout</td><td class="before">60s</td><td class="after">180s</td></tr>
</tbody>
</table>
</div>

z-index debugging always takes longer than you expect.
