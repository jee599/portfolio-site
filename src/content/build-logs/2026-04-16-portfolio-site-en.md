---
title: "16 Tool Calls, 0 Lines Changed: When Claude Code's Best Move Is to Not Write Code"
project: "portfolio-site"
date: 2026-04-16
lang: en
pair: "2026-04-16-portfolio-site-ko"
tags: [claude-code, debugging, diagnosis, root-cause-analysis]
description: "1h 39m, 16 tool calls, zero file edits. How Claude Code pinpointed a type definition bug by cross-referencing the live site with source code."
---

1 hour 39 minutes. 16 tool calls. Zero files changed.

**TL;DR** Sometimes the most productive session is one where you write no code at all. Claude Code cross-referenced the live production site with the codebase and traced a missing image bug to its root cause — a type definition with no `image` field — before touching a single line.

## "Fix the Design" Turned Into Root Cause Archaeology

The prompt was blunt.

```
fix the overall design and the mobile layout is broken
```

Claude didn't open a file and start editing. It opened the live site first. `WebFetch` pulled the production URL, `Read` loaded the archive page component, `Grep` traced the `ArchiveEntry` type definition. Six Bash calls, six Reads, two WebFetches, one Grep — all investigation, zero edits.

The diagnosis that came back was precise.

## Why the Archive Had No Photos

"Photos aren't showing in the archive" — sounds like a rendering bug. It wasn't.

The `ArchiveEntry` type in `lib/types.ts` had no `image` field. `getArchiveEntries()` pulled `date`, `title`, and `summary` from each post and discarded `meta.image`. `ArchiveList.tsx` was built to render text cards only.

The images weren't broken. They were never wired up.

```ts
// Current ArchiveEntry — no image field
type ArchiveEntry = {
  date: string;
  title: string;
  summary: string;
  // image?: string  ← doesn't exist
}
```

This distinction matters. A rendering bug means CSS and layout. A missing field means a feature addition — new type field, updated data fetcher, new UI component. Completely different fix surface. If Claude had jumped straight into editing, it would have burned time on layout tweaks while the actual problem sat one layer deeper in the type system.

## The Pattern: Live Site + Code in Parallel

The useful move in this session was crossing `WebFetch` results with code analysis.

Start from the live site: what's visibly wrong? Then trace backward through the code: why is that thing wrong? Reading code alone might eventually surface the missing field, but starting from the symptom on the live page makes the direction of investigation obvious — you're not guessing what to look for.

Mobile was a different story. `WebFetch` converts HTML to markdown, so actual rendered layout isn't visible. The mobile layout issues didn't get resolved in this session — they went on the list for the next one.

## A Commit with 0 Lines That Still Produced Output

No changed files looks like nothing happened. But this session ended with a concrete, prioritized fix list:

1. Add `image` to `ArchiveEntry` type
2. Extract `meta.image` inside `getArchiveEntries()`
3. Add thumbnail rendering to `ArchiveList.tsx`
4. Mobile layout — needs real device testing, not just WebFetch

Without the diagnosis, the work would have started somewhere vague — maybe CSS, maybe the layout wrapper. The actual problem was in a type definition. Vague starting points compound into wasted iterations.

> When you don't know where to cut, every cut is in the wrong place.

Claude Code ran through this investigation in under two hours. Manually opening files, cross-checking the live site, and tracing type definitions through the codebase would have taken longer with more cognitive load.

The zero-edit session isn't a failure mode. It's the intended output when the real bottleneck is understanding, not implementation.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
