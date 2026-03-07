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

I asked Claude to look at `globals.css` and `CosmicBackground.tsx` together.

It immediately spotted that the global CSS reset had `* { max-width: 100% }` — which squashes canvas elements to zero width.

First commit: exclude canvas from that reset.


## Body background was painting over everything

Still invisible.

The `body` background was an opaque navy (`#0a0b2a`), painting over everything beneath it.

The fix was to move the dark fallback color to `html` and make `body` transparent.

At the same time, I deleted the CSS aurora/star code in bulk. 51 lines gone.


## z-index was the trickiest

The canvas was set to `z-index: -2/-1`.

Sounds fine until you realize negative z-indexes slip behind the root HTML stacking context and disappear.

> "z-index -2 falls below the html element's stacking context — raise the canvas to 0/1 and give main/footer z-index: 2."

That cracked it.

Also removed the magnetic mouse-follow effect from the CTA button in the same commit.

The effect was complexity without payoff.


## Debugging pattern

Three independent causes.

1. CSS reset kills canvas width

2. Body background is opaque

3. Negative z-index falls behind html root

Had to fix them one at a time. So the commits split into 4.

In hindsight, that made each change easy to isolate.

The last commit bumped the husky pre-push timeout from 60s to 180s.

The automated build-log generation via Claude CLI needs more runway than originally estimated.

---

<div class="commit-log">
<div><span class="hash">fcff7ec</span> fix(ui): exclude canvas from max-width reset</div>
<div><span class="hash">1ec4fcb</span> fix(ui): remove CSS aurora/star backgrounds</div>
<div><span class="hash">96a5555</span> fix(ui): make body transparent for canvas</div>
<div><span class="hash">052de6e</span> fix(ui): fix z-index stacking, remove magnetic CTA</div>
<div><span class="hash">2d71d3a</span> fix: increase hook timeout to 180/240s</div>
</div>

| | Before | After |
|---|---|---|
| CSS background code | 51 lines | 0 (moved to Three.js) |
| Commits needed | — | 5 (4 debug + 1 config) |
| Husky pre-push timeout | 60s | 180s / 240s fallback |
