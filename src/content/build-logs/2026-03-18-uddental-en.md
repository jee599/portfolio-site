---
title: "Claude Code Fixed 3 UI Bugs in 5 Minutes — By Reading 22 Files First"
project: "uddental"
date: 2026-03-18
lang: en
pair: "2026-03-18-uddental-ko"
tags: [claude-code, ui, debugging, astro]
description: "41 tool calls, 5 minutes, 3 files fixed. I gave Claude Opus a vague prompt — 'find weird stuff' — and it found bugs I forgot were there."
---

A 🎨 color picker button was floating in the top-right corner of my production site.

I built it weeks earlier to test hero background colors during development. Then I deployed and forgot it existed. It was still there — `z-60`, fully visible to every visitor — until a friend pointed it out.

**TL;DR** — 3 Claude Code sessions, 5 minutes, 41 tool calls. Claude Opus fixed three UI bugs in uddental's homepage: heading hierarchy reversed across three sections, a dev tool leaking into production, and two CSS animations set to loop forever. One session used a deliberately vague prompt: "find weird stuff and fix it."

## The Headings Were Upside Down

Session 2 started with a specific observation but no proposed fix:

```
On pages, combinations like:
- small heading: "진료과목" (specialty category)
- larger subheading: "어떤 치료가 필요하세요?" (what treatment do you need?)
appear with the visual sizes reversed / hierarchy wrong.
```

Before touching any code, Claude ran `Read` five times. Homepage structure in `app/page.tsx`, then subpages, then the FAQ section — reading sequentially to understand what the correct pattern looked like before finding where it broke.

The diagnostic logic was sound. FAQ and all subpages used the right pattern: small eyebrow text for category labels, large `h2` for the description text. That established the baseline.

Then Claude found the deviation: three homepage sections — treatment journey, specialties, facilities — had it backwards. Category names in `h2` (visually large), descriptions in `p` (visually small). Same component structure, opposite visual weight.

Fix: three `Edit` calls on one file. No refactoring, no abstractions — direct corrections to `app/page.tsx`.

Tool usage: `Read(5)` `Edit(3)` `Bash(4)` `Agent(1)` — 13 calls total.

## "Find Weird Stuff" — No Bug Report, No Bug Names

Session 3 was an experiment in deliberately vague prompting:

```
Find and remove/fix all weird empty space at the top, broken-looking layout gaps,
and awkward UI artifacts. This includes unexpected blank areas, mispositioned overlays,
inconsistent spacing, and any obviously wrong mobile layout behavior.
```

No component names. No reproduction steps. No mention of what I suspected.

Claude ran `Read` 17 times. It went through `app/components/` file by file, then `globals.css`, then `app/page.tsx`, then each subpage. A full codebase sweep before producing any output.

Three issues surfaced.

**The leaked dev tool.** `HeroBgPicker.tsx` — a floating color palette I built to test hero background colors during development — was still wired into the production layout. The button and color panel were rendering at `z-60` in the top-right corner of every page. Every user saw it. Classic dev tooling leak.

**The infinite animations.** `globals.css` had two keyframe animations: `floatingPop` and `floatingGlow`. Both attached to the bottom CTA button. Both using `animation-iteration-count: infinite`. Every page load, the button bounced and glowed indefinitely — until the user navigated away.

**The double blank lines.** `app/page.tsx` had duplicate empty lines scattered between sections, creating uneven whitespace in the rendered layout.

The fixes were proportional. `globals.css`: changed `infinite` to `1`. Double blank lines: removed. `HeroBgPicker.tsx`: replaced with a minimal server component that just applies the background color — dev UI gone entirely.

That last decision shows up in the tool log as `Write(1)`. Claude chose to rewrite the file rather than patch it. All the dev-specific picker logic was going away anyway; a clean server component was simpler than editing around it. The judgment call was correct.

Tool usage: `Read(17)` `Edit(5)` `Bash(3)` `Agent(1)` `Write(1)` — 27 calls.

## Was Opus Overkill?

All three sessions ran on `claude-opus-4-6`. UI bug fixes don't feel like Opus territory.

Session 3 changed my thinking.

The vague prompt required building a mental model of what the codebase is *supposed* to look like before identifying what *deviates* from it. That's not mechanical file reading — it's inference. And some of those inferences aren't obvious from a single file:

Is `HeroBgPicker.tsx` intentional production UI, or development tooling that got left in? You have to read the component to understand its purpose. A floating color picker with a dev panel isn't a production feature — but that judgment requires context.

Is `floatingPop infinite` a deliberate design choice or a mistake? It lives in `globals.css` next to real production styles. Without reading the surrounding code and the component that uses it, "always bouncing" could look intentional.

Sonnet makes fewer reads before drawing conclusions. For a vague session like this — no explicit bug report, just "something feels off" — fewer reads means more assumptions, and wrong assumptions produce wrong fixes or missed issues.

For targeted bugs with specific reproduction steps, Sonnet is the right call. For "I don't know what's broken, please find it," Opus earns its cost.

Full run stats across all three sessions:

| Metric | Value |
|--------|-------|
| Sessions | 3 |
| Total tool calls | 41 |
| `Read` | 22 |
| `Edit` | 8 |
| `Bash` | 8 |
| `Write` | 1 |
| `Agent` | 2 |
| Files changed | 3 |
| Time | ~5 minutes |

> You don't have to describe the bug. Read enough code and it finds itself.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
