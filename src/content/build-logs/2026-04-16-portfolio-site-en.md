---
title: "16 Diagnostic Calls, 0 Files Changed: What a Claude Code Session With No Output Actually Found"
project: "portfolio-site"
date: 2026-04-16
lang: en
pair: "2026-04-16-portfolio-site-ko"
tags: [claude-code, debugging, diagnosis, webfetch, spoonai]
description: "1h 39min, 16 tool calls, 0 files modified. Diagnosing spoonai's archive and mobile issues revealed something unexpected: the 'missing images' were never implemented."
---

1 hour 39 minutes. 16 tool calls. Zero files modified. And yet, calling this session useless would be wrong.

**TL;DR:** This was a diagnostic session for the spoonai project — missing archive images and a broken mobile layout. The finding: it wasn't a bug. The `ArchiveEntry` type never had an `image` field to begin with. What looked like a rendering failure was actually a feature that was never implemented.

## When "Fix Everything" Is the Worst Prompt You Can Write

The session started with this:

> "go to the spoonai project"

Then:

> "fix the overall design and it's not displaying properly on mobile"

Claude's first response was a pushback with clarifying questions. What specifically is broken on mobile — nav menu collapse, card clipping, text overflow? Is the design direction refinement or a full redesign? Which pages are the priority?

This wasn't Claude being difficult. "Fix the overall design" has no scope. Starting without direction means more backtracking later. By the third prompt, the real problem surfaced:

> "look at the live site and fix the design, photos not showing in the archive, and mobile display is broken"

That changed the approach entirely. Look at the live site directly, and analyze the archive code in parallel.

## Using WebFetch to See What Actually Ships

Bash × 6, Read × 6, WebFetch × 2. The two WebFetch calls were the core of this session.

Reading the live site with `WebFetch` surfaces things that code alone can't tell you — which images are actually rendering, which elements are absent. Running code analysis and live site inspection in parallel narrows the root cause faster than either approach alone.

Of the six `Read` calls, two files were critical: `lib/types.ts` and `ArchiveList.tsx`.

One limitation: `WebFetch` converts HTML to text, so verifying actual mobile rendering layout isn't possible this way. The mobile bug fix wasn't resolved in this session.

## The Bug That Wasn't a Bug

The root cause of missing archive images was unambiguous.

The `ArchiveEntry` type in `lib/types.ts` has no `image` field. The `getArchiveEntries()` function reads `meta.image` from posts and discards it — returning only `date`, `title`, and `summary`. `ArchiveList.tsx` renders text-only cards. There's no slot for a thumbnail.

```ts
// ArchiveEntry — no image field
type ArchiveEntry = {
  date: string;
  title: string;
  summary: string;
  // image?: string  ← never existed
}
```

The photos aren't failing to render. **They were never wired up to render.** That distinction completely changes the fix. This isn't a bug — it's a missing feature. Three places need sequential changes: the type definition, the data-fetching function, and the component.

If code changes had started without this diagnosis, the session would have burned time adjusting CSS and layout, solving the wrong problem entirely.

## Why Zero File Changes Can Still Be a Win

It's easy to measure Claude Code sessions by output: tool calls, files changed, commits. By those metrics, this session scores low.

But at the end of the session, two things were known that weren't known before. The archive image issue requires changes across three layers — type → function → component. The exact location of the mobile display problem. Without this information, the next session starts with another diagnostic pass.

> Touching code before knowing where to look multiplies work, it doesn't reduce it.

The value of a diagnostic session shows up in the velocity of the session that follows it.

## Session Stats

| Metric | Value |
|--------|-------|
| Session duration | 1h 39min |
| Model | claude-opus-4-6 |
| Total tool calls | 16 |
| Files modified | 0 |

By tool: Bash (6), Read (6), WebFetch (2), ToolSearch (1), Grep (1).

The WebFetch share stands out. In a situation where reading the codebase alone can't reveal current state, live site inspection was a required step, not an optional one.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
