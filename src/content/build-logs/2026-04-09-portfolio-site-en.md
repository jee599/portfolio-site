---
title: "I Fixed the Same Bug 5 Times — Claude Code Debugging and a Full Redesign in One Day"
project: "portfolio-site"
date: 2026-04-09
lang: en
pair: "2026-04-09-portfolio-site-ko"
tags: [claude-code, debugging, mobile, design, parallel-agents]
description: "14 sessions, 624 tool calls, 39 files changed in one day. How I kept fixing the same overflow-x bug until systematic debugging finally worked."
---

14 sessions. 624 tool calls. 39 files changed. That's what April 6th looked like.

**TL;DR** The same mobile horizontal scroll bug appeared 5 times across separate sessions. I fixed the symptom each time until session 11, when systematic debugging finally found the real cause. In between, I installed design skills, ran a full redesign with dark mode and Cmd+K search, and used parallel agents to cut main context overhead.

## I Fixed the Same Bug 5 Times

The horizontal scroll bug followed me all day. I thought I had it solved in session 1. It came back in session 2. Then sessions 4, 6, and 11.

Each fix I applied:

- **Session 1**: Added `overflow-x: clip`. Didn't know iOS 15 and below Safari falls back `clip` to `visible`.
- **Session 2**: Added `html { overflow-x: hidden }` + global `img { max-width: 100% }`. Applying clip only on `body` is ignored when `html` scrolls.
- **Session 6**: Swapped body's `clip` for html's `hidden` — same fix, different direction.
- **Session 11**: Found the actual root cause — negative margins. `-mx-5 px-5` in `HomeContent.tsx:98` and `-mx-4` in `BlogList.tsx:33`.

Every time I patched the symptom, it surfaced somewhere else. Session 11 was when I properly applied the `systematic-debugging` skill, and that's when I found the source.

```bash
grep -r "\-mx-\|\-ml-\|\-mr-\|w-screen\|100vw" components/
```

One command. Two negative margin instances found. If I had run this in session 1, the bug would have died there.

The lesson isn't about CSS. It's about the debugging habit: **search for the pattern across the codebase before patching the symptom**. `overflow-x` bugs are almost always caused by something wider than the viewport — negative margins, `100vw` widths, or elements that overflow their container. Grep for those patterns first.

## Installing Design Skills and the Full Redesign

In session 5, I installed `frontend-design` and `ui-ux-pro-max` skills from the Superpowers skill registry:

```bash
npx skills add anthropics/claude-code --skill frontend-design
```

`ui-ux-pro-max` is 658 lines: 50+ UI styles, 161 color palettes, 57 font pairings, 99 UX guidelines. After installation, I copied it to `~/.claude/skills/` globally so it's available across all projects.

After reading the skill, Claude Opus gave this diagnosis:

> "You're stuck in Apple clone territory. Modern tech sites like Vercel, Linear, and Raycast have distinct brand identities."

The accent color was `#0071e3` — Apple blue. The layout followed apple.com structure. Pretendard font, `#fbfbfd` background, hairline borders. I had faithfully copied Apple's visual grammar without realizing it.

The diagnostic was accurate. The fix was a full rebrand.

## One Opus Session, Complete Redesign: Dark Mode + Cmd+K Search

Session 12 was the largest and most complex: 148 tool calls, 7 hours 33 minutes.

In a single session, I implemented dark mode, a Cmd+K command palette search, an indigo (`#4f46e5`) color system, tab transition animations, a table of contents, and social share buttons. The implementation uses CSS variables for dark/light switching, so `prefers-color-scheme` is supported automatically.

Dark mode that respects system preferences — zero JavaScript needed for the initial render.

Session 14 used 3 parallel agents for the remaining design improvements:

```
🐦 AgentCrow — Dispatching 3 agents:
1. @frontend_developer → HomeContent.tsx + ArticleCard.tsx (hero, brand colors, TOP badge)
2. @frontend_developer → PostContent.tsx (social share, TOC, source link styles)
3. @frontend_developer → DailyBriefing.tsx + content.ts (value proposition, layout)
```

Each agent had non-overlapping file scope — no merge conflicts, no coordination overhead. All three ran concurrently. Main session tool calls for that phase: 9.

This is the pattern worth internalizing: **define scopes that don't intersect, then fire in parallel**. The agents handled ~40–50 tool calls each. That's roughly 800 tool calls kept out of the main context window.

## Vercel CANCELED: The Rapid Push Trap

Vercel builds were showing CANCELED all day. My first assumption was a build error.

The actual cause: Vercel automatically cancels in-progress builds when a new push arrives. Push two commits in quick succession — both get canceled.

Two solutions:

Deploy directly via CLI, bypassing the webhook:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" /opt/homebrew/bin/vercel --prod
```

Or push a single commit and wait for the build to complete before pushing again.

For the rest of the day, I left `git push` in CANCELED state and used `vercel --prod` for every deployment. Once I understood the cause, the fix took 30 seconds.

## 93% Image Compression with sips

During session 10 performance work, I checked the logo image and found a 2220×1501px PNG. Display size: 200×73px — the source was 11x larger than needed.

```bash
sips -Z 400 public/images/logo.png
```

737KB → 49KB. 93% reduction. Next.js converts to WebP before serving, but an oversized source file still hurts cold start times and inflates the git repository.

One caveat: when I tried resizing other post images, some came out *larger* after resizing. PNG compression can produce larger files at lower resolutions depending on image content. Check whether converting to JPEG first makes sense before batch-resizing with `sips`.

## Tool Usage Stats

| Tool | Count |
|------|-------|
| Bash | 218 |
| Read | 173 |
| Edit | 100 |
| TodoWrite | 38 |
| Glob | 25 |
| Write | 17 |
| Agent | 16 |
| Grep | 15 |

Agent at 16 calls — mostly sessions 12 and 14. Each agent handled 40–50 tool calls on average, keeping ~800 calls out of the main context.

Grep at 15 is the telling number. It's the lowest count, and it's the tool that would have killed the overflow-x bug in session 1. The correlation is not a coincidence.

When debugging layout issues, `grep` for the pattern class before touching any CSS. When something keeps recurring across sessions, that's the signal that you're fixing symptoms, not causes. Use systematic search before applying any patch.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
