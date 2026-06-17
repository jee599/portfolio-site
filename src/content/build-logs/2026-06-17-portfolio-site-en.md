---
title: "Fixing open-design Reference Fidelity: Ditching grep hex for Playwright getComputedStyle"
project: "portfolio-site"
date: 2026-06-17
lang: en
pair: "2026-06-17-portfolio-site-ko"
tags: [claude-code, open-design, playwright, design-system, hooks]
description: "Tracked down why open-design only extracted colors from reference sites. One grep line replaced with Playwright getComputedStyle — now captures 72px/weight 510/letter-spacing −1.584px."
---

For months, the open-design skill had a quiet failure mode: point it at a reference site like toss.tech or linear.app, and it'd come back with a rough color palette — nothing else. Fonts wrong. Spacing off. Layout structure completely invented. It looked vaguely similar, not actually similar.

This wasn't a vague "the model isn't creative enough" problem. It was a specific, mechanical failure with an obvious root cause. 7 hours 47 minutes and 86 tool calls later, it was fixed.

**TL;DR** — The extraction recipe was a single `grep -E '#[0-9a-fA-F]{3,8}'` command. It caught hex colors and nothing else — no fonts, no spacing, no shadow, no section structure. Replaced it with Playwright `getComputedStyle` for real browser-rendered values. Added two gate hooks so skipping extraction is impossible.

## The Root Cause Was One Line of Shell

`~/.claude/skills/open-design/SKILL.md`, RULE 2, branch B. The extraction instruction:

```
Extract real values — grep -E '#[0-9a-fA-F]{3,8}' for hex, read typography from screenshot
```

Grep for hex and you get colors. That's it. Font family, font scale, letter-spacing, line-height, border-radius, box-shadow, container widths, section structure — none of that lives in a hex string.

The second half was worse: "read typography from screenshot" means asking the model to visually guess a font from a JPEG. That doesn't work reliably on a good day.

The practical result: every open-design run against a reference site received a color palette and filled everything else from the model's internal defaults. Ask for "something like Toss" and you'd get Toss colors on a completely different typographic foundation. The fonts were wrong. The letter-spacing was wrong. The section rhythm was wrong. The color palette was the only thing that matched — and even then, only the hex-visible subset.

## Exploring Fix Approaches — 6 Directions in Parallel

Before writing any code, I ran a multi-agent parallel search across six approaches to find the best current method for CSS extraction:

- **Playwright `getComputedStyle`** — reads actual browser-rendered values after CSS cascade resolution. Accurate for fonts, colors, spacing, everything. Already installed.
- **Dembrandt** (MIT, latest June 2026) — purpose-built CSS token extraction library. Solid, but adds a new Node dependency.
- **Figma REST API** — requires access to the design file. Not viable for arbitrary reference URLs.
- CSS AST parsing — works on source files, not rendered output. Misses runtime computed values.
- Chrome DevTools Protocol directly — more complexity than Playwright wraps, no benefit.
- Visual regression diffing tools — answers "did it change?" not "what are the values?"

Playwright was already installed at Node 1.59.1 for the dental AI pipeline. No new dependencies. Decision made.

## Building the Extractor

New file: `~/.claude/skills/open-design/scripts/extract-reference.mjs`

The core is straightforward. Launch a headless Chromium instance, navigate to the reference URL, and use `page.evaluate()` to run `getComputedStyle` against the actual DOM:

```js
const h1 = document.querySelector('h1')
const cs = getComputedStyle(h1)
return {
  fontSize: cs.fontSize,
  fontWeight: cs.fontWeight,
  fontFamily: cs.fontFamily,
  letterSpacing: cs.letterSpacing,
  lineHeight: cs.lineHeight,
}
```

The script doesn't stop at headings. It samples hero sections, navigation, body text, buttons, and card containers — anything semantically meaningful. Colors are extracted via `getComputedStyle` too, which handles CSS variables, computed `rgb()` values, and opacity correctly — things grep can never see.

Running it against linear.app:

- h1: **72px / weight 510 / Inter Variable / letter-spacing −1.584px** — Linear's non-standard 510 weight and negative tracking, measured exactly. This specific combination is what makes things look like Linear. The grep version had none of it.
- Dark canvas background: `rgb(8, 9, 10)`
- Signature accent: `rgba(0, 255, 5, 0.1)`
- Section structure: hero → benefits → PageSection ×5 → changelog → customer quotes → CTA

Previously, section structure was completely absent from extraction output. Reading the DOM directly populates it from the actual rendered page.

The extractor outputs three artifacts:

- `reference-tokens.json` — all extracted design tokens, structured
- `reference.png` — full-page screenshot for visual verification
- A fidelity score computed by `compare-tokens.mjs` (gate threshold: ≥70%)

## Two Gate Hooks — Extraction Is Not Optional

An extractor the model can skip is just documentation. Two hooks enforce extraction as a hard prerequisite.

**`reference-gate.sh`** — fires on every `.html` file Write attempt. If `reference-tokens.json` doesn't exist in the project directory, the write is blocked. There is no path to a visual deliverable that bypasses extraction.

**`reference-required.sh`** — when a reference URL is detected in the prompt, this hook fires a notification requiring the extraction command to run before design work starts.

**`design-router.sh`** was updated to handle brand keywords. When the prompt contains "make it like Toss" or "Linear style" or similar brand references, the router looks up the brand in `brand-urls.tsv` and runs `extract-reference.mjs` automatically:

```
toss	https://toss.tech
linear	https://linear.app
inflearn	https://inflearn.com
```

Brand URL mappings live in a separate tsv file — easy to extend without touching the router logic.

`compare-tokens.mjs` verifies the extracted tokens against the rendered CSS at ≥70% fidelity. Below that threshold, the build fails with a diff showing exactly which tokens are missing or wrong.

## Same Day: Pokémon Card EV Report

An unrelated session ran the same day. While browsing Buyee for Pokémon card box listings, a request came in to produce an HTML report showing expected value (EV) per box.

`mcp__claude-in-chrome` navigated Buyee directly — browsing listings, extracting box names, prices, and known card pull rates. The open-design skill handled the output format, producing `~/pokemon-box-ev-report.html`. 2 hours 22 minutes, 104 tool calls, 31 `mcp__claude-in-chrome__computer` invocations.

Browser automation for Japanese import research, design pipeline for the output. An unusual combination that worked.

## Session 3: Nothing Happened

A request came in to improve a coffee chat site. Claude API returned HTTP 500 Internal Server Error. Zero tool calls. Two minutes. Server-side issue, no workaround available, session closed.

## Numbers

| | |
|---|---|
| Total sessions | 3 |
| Total time | ~10h 11min |
| Total tool calls | 190 |
| Main tools | Bash ×44, mcp__claude-in-chrome__computer ×31, Edit ×18, Read ×16 |
| Files created | 10 |
| Files modified | 5 |

## What Changed

Asking for "something like Toss" now means the skill visits toss.tech, measures the rendered CSS, and extracts font family, size scale, weight, letter-spacing, line-height, colors, spacing, and section structure — then binds those values into the design system before writing any output HTML.

The hook gates make this non-negotiable. There is no path through the skill that produces a visual deliverable without first measuring the reference.

The grep-only version of open-design was half an extractor. It's fixed.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
