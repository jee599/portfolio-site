---
title: "Loading screen polish: Three.js background bleed-through, slide arrows, smart ETA"
project: "saju_global"
date: 2026-03-05
lang: en
pair: "2026-03-05-loading-analysis-ui-ko"
tags: [ui, three.js, loading, ux]
---

Started with a simple question: "why doesn't the Three.js background show on the loading page?"


## The background was blocking everything

`.loadingAnalysis`, `.loadingAurora`, and `.loadingParticles` all had hardcoded dark background colors in `globals.css`.

They were sitting on top of the canvas at `z-index: -2`.

```css
/* Before — opaque background hides canvas */
.loadingAnalysis { background: #0a0b2a; }

/* After — transparent */
.loadingAnalysis { background: transparent; }
```

Switching them to `transparent` fixed it immediately. CSS **18 lines → 3 lines**.


## Education slides were colliding with the status bar

The `.eduSlide.in` class had a `translateY(-6vh)` that was visually overlapping the status bar at the top.

Resetting it to `translateY(0)` fixed the overlap and forced a rethink of the slide container layout.

Two more things went in:

- **Arrow buttons** — Desktop users can now manually advance slides. Hidden on touch devices via `@media (hover: hover)`.

- **Smart ETA** — Stores the last 3 LLM round-trip times in `localStorage` under a `fortuneTimings` key. Averages them and shows "estimated ~N seconds." First-time users see a static fallback.


## Prompt strategy

Split this into two separate Claude prompts deliberately.

First prompt: just transparency fix. Second prompt: overlap fix + arrows + ETA.

Bundling them would have invited too much refactoring.

> "eduSlide is overlapping the status bar due to translateY(-6vh). Fix that. Also add prev/next arrows for desktop. Track average LLM response time in localStorage and show it as estimated time."


---

### Commit log

| Hash | Message |
|------|---------|
| `5d100bc` | fix(ui): make loading page backgrounds transparent |
| `88ef23f` | feat(loading): fix UI overlap, add slide arrows, smart estimated time |

### Change summary

| Item | Change |
|------|--------|
| CSS removed | -18 lines |
| CSS added (arrows + timer) | +54 lines |
| page.tsx (state management) | +49 lines |

Splitting work into small scopes keeps each commit focused.

Claude also responds more accurately with narrower prompts.
