---
title: "Claude Code Fixed a Flipped Typography Hierarchy Across 3 Sections in 2 Minutes"
project: "uddental"
date: 2026-03-18
lang: en
pair: "2026-03-18-uddental-ko"
tags: [claude-code, debugging, typography, nextjs]
description: "Vague report: 'sizes look reversed.' No file, no component. Claude Code diagnosed and fixed the hierarchy inversion in 2 min: 5 reads, 3 edits, 14 tool calls, 1 file changed."
---

The bug report had exactly one sentence.

"진료과목 looks big and 어떤 치료가 필요하세요? looks small."

No file path. No component name. No reproduction steps. Just: the visual sizes look reversed on the homepage.

I handed it to Claude Code with a breadth-first prompt. Fourteen tool calls and two minutes later, the bug was found, fixed, and committed.

**TL;DR** Three homepage sections on the uddental dental clinic site had their heading hierarchy inverted — category labels were rendered as `h2`, section titles as `p`. FAQ and all subpages were already using the correct eyebrow pattern. Claude Code found the inconsistency by reading the codebase itself, not by being told where to look. One file changed: `app/page.tsx`, 6 lines deleted, 6 lines added.

## The Prompt That Matters When You Don't Know Where the Bug Lives

When you don't have a file path, the instinct is to narrow the search. Pick the most likely component. Start there. That instinct is usually wrong.

Here's the prompt I gave Claude:

```
[Wed 2026-03-18 09:42 GMT+9] In /Users/jidong/uddental/implementations/claude,
inspect the deployed/UI heading hierarchy issue the user reported.

Problem statement:
On pages, combinations like:
- small heading: "진료과목"
- larger subheading: "어떤 치료가 필요하세요?"
appear with the visual sizes reversed / hierarchy wrong.

Please do the following:
1) Inspect all relevant pages/components in this implementation
   for section eyebrow/title/subtitle typography hierarchy issues.
2) Find every place where the visual order is inverted.
3) Fix all instances to match the correct pattern.
```

Two things make this work. First, the symptom is described concretely — not "the UI looks wrong," but "the category label is visually larger than the section title." Second, the scope is explicitly wide: "find every place," not "look in this component."

The difference between "check this file" and "inspect all relevant pages and components" is the difference between a patch and an actual fix. If I'd pointed Claude at a single component, it might have fixed one section and missed two others with the identical problem.

## How Claude Diagnosed It Without a File Path

Claude opened `app/page.tsx` first — a reasonable starting point for a homepage bug. Five Read tool calls followed: the main page, subpages, shared component files. Scanned sequentially.

The diagnosis came back unambiguous. Three sections on the homepage — treatment journey, treatment departments, and facility overview — all shared the same inverted pattern:

```tsx
// Before — inverted hierarchy
<h2 className="text-2xl font-bold">진료과목</h2>
<p className="text-sm text-gray-500">어떤 치료가 필요하세요?</p>
```

The category label (`진료과목` — "Treatment Departments") was tagged as `h2`. The actual section title (`어떤 치료가 필요하세요?` — "What treatment do you need?") was a plain `p`.

Visually, `h2` renders larger by default. So the category label dominated, and the section's real heading got buried beneath it. Visual weight was exactly backwards relative to information importance.

What made the Read phase interesting: Claude checked the FAQ section and subpages too, and found they were already using the correct pattern. The right implementation existed in the codebase — Claude found it and used it as the reference without being told it existed.

## The Fix: Standard Eyebrow Label Pattern

The correct hierarchy is the eyebrow label pattern standard in modern design systems:

```tsx
// After — correct hierarchy
<p className="text-sm font-semibold text-mint-600 uppercase tracking-wider">
  진료과목
</p>
<h2 className="text-3xl font-bold text-gray-900">
  어떤 치료가 필요하세요?
</h2>
```

Category label → small `p` with `uppercase`, `tracking-wider`, and accent color. Section title → large `h2` with full weight. Visual hierarchy now matches semantic hierarchy. The label is visually subordinate; the heading is the dominant element.

Three Edit calls — one per broken section, all in `app/page.tsx`. Then `next build` via Bash. No errors. Committed.

Full tool breakdown: Read ×5, Bash ×4, Edit ×3, Agent ×1 — 14 calls total. Session time: 2 minutes. Changed file: 1. Lines modified: 6 deleted, 6 added.

## Why Only the Homepage Was Broken

The subpages were built after the design pattern was finalized. The homepage sections came earlier, when the eyebrow convention wasn't yet settled. Classic multi-phase development drift.

This type of inconsistency is hard to catch in code review because each section looks locally reasonable in isolation. A category label can be large. A description can be small. The problem only becomes visible when you step back and notice the visual weight is inverted relative to content importance — exactly the kind of thing that surfaces as a user report, not a lint error.

## What Wide-Scope Prompting Gets You

Three sections were broken. If the prompt had pointed Claude at a specific component, best case: one section fixed. The other two would still be broken, and the same report would resurface later.

Wide-scope prompting — "inspect all relevant pages and components" — turned a single bug report into a complete audit. Claude read the FAQ and subpages not because I asked it to, but because the task was framed as finding all instances, not patching the most obvious one.

The session also demonstrates something easy to overlook: Claude used the existing codebase as its own reference implementation. It found the correct pattern in FAQ without being told it was there, confirmed it was the intended design, and applied it to the broken sections consistently. The reference didn't need to come from me.

> When you don't know where the bug is, don't narrow the scope — broaden it, and let the model find the pattern.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
