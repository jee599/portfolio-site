---
title: "4 readability fixes + favicon after Three.js cosmic background"
project: "saju_global"
date: 2026-03-05
lang: en
pair: "2026-03-05-cosmic-bg-ui-polish-ko"
tags: [threejs, css, favicon, ui-polish]
---

The day after shipping a Three.js starfield background, four readability bugs surfaced in a row.

Cards were see-through. The BaZi table was unreadable. There was no favicon.

Fixed everything in 4 commits.


## Constellation lines had to go

36 lines of Three.js code drawing faint purple line segments between stars at `opacity: 0.12`.

They were invisible on most screens and just added render overhead.

Prompt was literally: *"these constellation lines are visual noise at 12% opacity, delete them."*

One turn.


## Card backgrounds were nearly transparent

All the card CSS variables — `--bg-card`, `--bg-card-glass`, `.glassCard` — were designed with near-zero opacity.

Fine when the background was a flat dark gradient. Catastrophic against a moving 3D starfield.

Bumped card backgrounds to `rgba(13,11,20,0.72)`.

Dark enough to read against stars, still translucent enough to feel layered.


## BaZi table needed more work

Row dividers for separation.

`text-shadow` glow on the heavenly stem / earthly branch characters (천간/지지).

Tighter highlight column contrast.

All in `globals.css`, one file, maybe 15 lines changed.


## Favicon was a fun one

Next.js App Router auto-detects `app/icon.svg` with no config.

Dropped in 10 lines of SVG — a ☆ character with a purple→cyan gradient inside a dark circle.

It just worked on deploy.

I just said "Next.js App Router way" and Claude went straight to the right file path with the right SVG.

---

<div class="commit-log">
<div><span class="hash">cc721f1</span> fix(ui): remove constellation lines from CosmicBackground</div>
<div><span class="hash">4aec609</span> fix(ui): increase card background opacity for readability</div>
<div><span class="hash">b5a348d</span> fix(ui): enhance Four Pillars table readability</div>
<div><span class="hash">ae7f7eb</span> feat(ui): add favicon (SVG star icon with gradient)</div>
</div>

| | Before | After |
|---|---|---|
| Constellation code | 36 lines | 0 |
| Card background opacity | ~10% | ~72% |
| Favicon | none | 10-line SVG |

Visual bugs like these are where Claude Code shines.

Paste a screenshot and it pinpoints exactly which CSS variable to change.
