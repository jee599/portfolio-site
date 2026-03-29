---
title: "One Grep Command Found 4 i18n Gaps in 5 Minutes — Claude Code Debugging Pattern"
project: "portfolio-site"
date: 2026-03-29
lang: en
pair: "2026-03-29-portfolio-site-ko"
tags: [claude-code, i18n, debugging, skill-management, gemini]
description: "Found 4 components ignoring useLocale with a single grep. Trimmed 11 design skills to 5. Replaced CSS shapes with Gemini 8K images."
---

Four components were silently ignoring the locale toggle. Users switching to English got Korean text back anyway. The bug had no error message — just wrong output. One Grep command surfaced all four culprits in under five minutes.

**TL;DR** Running `grep -r "useLocale"` against the component directory and diffing against the full component list revealed 4 missing hook calls. Same day: trimmed 11 design skills down to 5, and replaced CSS placeholder shapes in refmade with Gemini Imagen 8K images.

## The Bug That Left No Trace

i18n was already implemented — `lib/i18n.ts` had 50+ translation keys, a header toggle, localStorage persistence. The code existed. The UI wasn't changing. That combination points to one thing: components that never call the translation hook.

The search strategy was simple: find which components *do* call `useLocale`, then figure out which ones *don't*.

```bash
grep -r "useLocale" src/components/ --include="*.tsx" -l
```

Result: `Header.tsx`, `PostContent.tsx`, `SubscribeForm.tsx`, `BlogList.tsx` — just four files. Everything else was hardcoding Korean strings directly.

The gap list:

- `DailyBriefing.tsx` — `아카이브`, `이전`, `다음`, `전체 보기` hardcoded
- `ArchiveList.tsx` — `Article` label hardcoded
- `ArticleCard.tsx` — no `useLocale` import at all
- `PostContent.tsx` — *had* `useLocale`, but still broken

That last one was the most interesting case. `PostContent.tsx` was already calling the hook. The bug was in `formatDateKo` — a utility function that always returned Korean-formatted dates regardless of locale. The function name had the answer in it the whole time. Replacing it with a `formatDate(locale)` pattern fixed it.

Total session: 25 minutes, 55 tool calls — Read 23, Bash 14, Edit 5. Five components updated, one utility function replaced.

The pattern that worked: confirm *where* the implementation exists first, then grep for *where it's missing*. No error messages required. Bugs without stack traces are still findable — they just require a different kind of search.

## 11 Skills, 0 Conflicts — Then 5 Skills

Before redesigning coffeechat from scratch, I audited the design-related skills and agents already installed: 11 skills, 6 agents.

"Does having 11 skills cause conflicts?" — reasonable question.

It doesn't. Skills only activate when explicitly invoked via the `Skill` tool. They don't intercept requests automatically. Agents work the same way. Having 10 wrenches in a toolbox doesn't cause problems — you still have to pick one up.

The actual problem was redundancy. `ui-ux-pro-max` already covered what six other skills were doing:

- 161 color palettes → replaces `colorize`
- 57 font pairings → replaces `typeset`
- Layout guidelines → replaces `arrange`
- `audit` and `critique` overlapped — kept the broader one

What survived the cut: `ui-ux-pro-max`, `frontend-design`, `critique`, `animate`, `overdrive`.

The decision rule: when was the last time I actually invoked it? Skills that haven't been called in weeks are clutter. More options slow down the start of a session, not because of technical overhead but because of decision overhead.

The more interesting discovery came during coffeechat reference research. While running WebSearch on external GitHub projects, I found that the `interface-design` skill (~4.2k stars) includes a feature for persisting design decisions across sessions. Instead of re-explaining the design system at the start of every session, the skill carries that context forward. Session stats: 39 tool calls, Bash 22, WebSearch 11.

## Replacing Blue Rectangles with 8K Photos

refmade is a project that recreates SaaS landing pages — Stripe, Vercel, Linear, Notion — as static HTML. A multi-agent loop processes 83 references in parallel. The problem: wherever a reference required a real image, the implementation was substituting CSS shapes.

The original Revolut page has a photo of a woman with auburn hair. The implementation had a blue rectangle. "Completely unacceptable quality" was accurate feedback.

After getting a Gemini Imagen API key, Claude wrote reference-specific prompts and generated the images directly. Each prompt was tuned to match what the original page actually showed:

```
056-app-store:
"professional woman, auburn hair, cream blazer, holding smartphone,
fintech app, white background, 8K hyperrealism"

064-neon-cinema:
"live concert stage, pyrotechnics explosion, crowd audience,
dramatic stage lighting, dark atmosphere, 8K hyperrealism"

073-poppr:
"person in VR/AR exhibition space, amber warm lighting,
immersive environment, modern gallery, 8K hyperrealism"
```

Five references updated in parallel. Each agent handled prompt writing → API call → HTML injection as a single unit. The visual similarity to the originals improved noticeably the moment real photos replaced the shapes.

One thing worth noting: the API key was pasted into the prompt directly. Claude didn't hardcode it into source files — it handled it as a secret without being told to. That kind of default judgment matters when you're moving fast across multiple sessions.

## Session Stats

Four sessions total: spoonai (i18n fix), coffeechat (design audit), refmade (image replacement), agentcrow (benchmark). 625+ tool calls across all sessions. Breakdown by tool: Read 187, Bash 124, Agent 59. Files modified: `HomeContent.tsx`, `PostContent.tsx`, `GalleryClient.tsx`, `next.config.ts`, `middleware.ts`.

Mid-session, a password change request came in while the translation bug was still open. The i18n fix went first — "English toggle isn't working" is a more urgent user-facing breakage than an internal account change. Claude made that call without being asked to prioritize. When sequence matters, explicit is still better than implicit — but it's useful to know where the default judgment lands.

The i18n session pattern is worth reusing: grep for the hook, diff against the full file list, fix the gaps. It works for any cross-cutting concern — analytics calls, error boundaries, auth guards. The search takes a minute. The fix list writes itself.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
