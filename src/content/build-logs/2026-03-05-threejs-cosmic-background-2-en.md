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

It immediately spotted that the global CSS reset had `* { max-width: 100% }` — which squashes canvas elements to zero width.

```css
/* Problem: CSS reset kills canvas width */
* { max-width: 100%; }

/* Fix: exclude canvas */
*:not(canvas) { max-width: 100%; }
```

First commit: exclude canvas from that reset.


## Body background was painting over everything

Still invisible.

The `body` background was an opaque navy (`#0a0b2a`), painting over everything beneath it.

Moved the dark fallback color to `html` and made `body` transparent.

At the same time, deleted the CSS aurora/star code in bulk. **51 lines gone.**


## z-index was the trickiest

The canvas was set to `z-index: -2/-1`.

Sounds fine until you realize negative z-indexes slip behind the root HTML stacking context and disappear.

> "z-index -2 falls below the html element's stacking context — raise the canvas to 0/1 and give main/footer z-index: 2."

That cracked it.

Also removed the magnetic mouse-follow CTA button in the same commit. Complexity without payoff.


## Debugging pattern

Three independent causes.

| # | Cause | Fix |
|---|-------|-----|
| 1 | CSS reset kills canvas width | Exclude canvas from reset |
| 2 | Body background is opaque | Make body transparent |
| 3 | Negative z-index falls behind html root | Raise z-index to 0/1 |

Had to fix them one at a time. So the commits split into 4.

In hindsight, that made each change easy to isolate and review.


---

### Commit log

| Hash | Message |
|------|---------|
| `fcff7ec` | fix(ui): exclude canvas from max-width reset |
| `1ec4fcb` | fix(ui): remove CSS aurora/star backgrounds |
| `96a5555` | fix(ui): make body transparent for canvas |
| `052de6e` | fix(ui): fix z-index stacking, remove magnetic CTA |
| `2d71d3a` | fix: increase hook timeout to 180/240s |

### Change summary

| Item | Before | After |
|------|--------|-------|
| CSS background code | 51 lines | 0 (moved to Three.js) |
| Commits | — | 5 (4 debug + 1 config) |
| Husky timeout | 60s | 180s |

z-index debugging always takes longer than you expect.
