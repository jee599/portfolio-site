---
title: "I Fixed the Same Mobile Bug 7 Times — 15 Claude Code Sessions, 757 Tool Calls"
project: "portfolio-site"
date: 2026-04-06
lang: en
pair: "2026-04-06-portfolio-site-ko"
tags: [claude-code, spoonai, mobile, debugging, worktree, vercel, design, parallel-agents]
description: "Fixed the same mobile overflow bug 7 times across 15 Claude Code sessions. Here's the iOS Safari root cause I kept missing — and what changed when I finally found it."
---

I fixed the same bug seven times. Every session ended with "that should be it" — and the next session started with the user reporting the same left-right drag on mobile. Over one day of fully redesigning spoonai.me, I ran 15 Claude Code sessions and 757 tool calls. The most-repeated task across all of them was fixing horizontal scroll on mobile.

**TL;DR** `overflow-x: clip` doesn't work on iOS 15 and below Safari. You need it on both `html` and `body`. Negative margins and `100vw` are separate issues that need separate fixes. Patching symptoms without finding the root cause guarantees the bug comes back.

## The Same Bug, Seven Different Fixes

From session 10 through session 15, mobile horizontal scrolling kept getting reported. Here's what Claude Code actually changed in each session:

**Session 10**: Removed `-mx-5 px-5` negative margins from the category tabs in `HomeContent.tsx`, and caught `-mx-4` in `BlogList.tsx`.

**Session 11**: Added `html { overflow-x: hidden }`. Previously it was only on `body`.

**Session 12**: Discovered that `overflow-x: clip` isn't supported on iOS 15 and below — switched to `hidden`. Also added an `onError` handler to images in `ArticleCard.tsx`.

**Session 15**: Switched back to `clip`, added a global `img { max-width: 100%; height: auto; }` rule, and fixed the container in `ImageWithCredit.tsx`.

Why did it keep coming back? Each session fixed exactly one cause and shipped. Removing the negative margin doesn't help if `html` has no overflow constraint — something else will overflow instead. Setting it only on `body` lets iOS Safari scroll the `html` element itself.

Session 12 was the only session that approached this correctly, using the `systematic-debugging` skill. The skill's core rule: **NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**. Following that, I grep'd the entire codebase and found two actual root causes: the iOS compatibility issue with `overflow-x: clip`, and missing image `onError` handlers. Every session before that had been patching symptoms.

```css
/* Final fix — globals.css */
html {
  overflow-x: clip;
}
body {
  overflow-x: clip;
}

/* Global image safeguard */
img {
  max-width: 100%;
  height: auto;
}
```

The lesson: calling `systematic-debugging` at session 10 — the first time the bug was reported — would have cut the seven-session loop down to one or two. When a bug shows up, load the skill, gather all the evidence, then fix.

> Deploying without a root cause means spending another session on the same bug.

## Vercel CANCELED — And Why CLI Deployment Is More Reliable

This problem recurred in sessions 3, 11, and 15. Triggering a Vercel auto-deploy via `git push` resulted in a CANCELED status. Vercel automatically cancels the previous build when a new push comes in quickly — rapid consecutive pushes make this worse, not better.

Session 3: tried pushing an empty commit to re-trigger. That one got CANCELED too.

Session 15: recognized the pattern. `git push` → Vercel auto-trigger is unreliable for fast-moving work. Direct CLI deployment always succeeds:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" /opt/homebrew/bin/vercel --prod
```

Claude saved this to memory after session 15. Any command you need to look up more than once in a day belongs in memory — it cuts session cost meaningfully when you're running 15 sessions.

## Eight Worktrees, Zero Merge Conflicts During Work

The worktrees created during the day: `angry-williams`, `keen-buck`, `pensive-hoover`, `recursing-mccarthy`, `nifty-tereshkova`, `stoic-knuth`, `silly-curie`, `funny-chatelet`. Eight in one day.

The reason for using worktrees was straightforward: keep session scopes from overlapping. While session 14 was running a full dark mode + search redesign in `keen-buck`, session 10 was handling mobile overflow fixes in `pensive-hoover`. The main branch stayed stable throughout.

The problem was merge timing. At the end of session 14, "merge the keen-buck redesign into main" came in — a large PR containing the entire dark mode and search implementation. Resolving conflicts, verifying the build, and deploying ate up roughly half the session.

Worktrees are great for parallel work. But the longer you keep a branch alive, the more it diverges, and the more expensive the merge becomes.

> Merge or discard when the unit of work is done. Waiting turns a 10-minute merge into a 2-hour one.

## AgentCrow: Parallel Dispatch Without File Conflicts

Sessions 4 and 6 used the AgentCrow pattern — dispatching 3–4 agents simultaneously across file domains that don't overlap.

Session 4 example:

```
🐦 AgentCrow — dispatching 3 agents:
1. @frontend_developer → HomeContent.tsx + ArticleCard.tsx
2. @frontend_developer → PostContent.tsx
3. @frontend_developer → DailyBriefing.tsx + content.ts
```

Each agent's scope was explicitly constrained in the prompt to its assigned files. Overlap causes git conflicts. When the three agents completed in parallel, the main thread handled build verification and commit sequentially.

Session 14 scaled this further: dark mode (CSS variables + ThemeProvider), search (SearchCommandPalette + API route), and component redesigns (Header, Footer, ArticleCard, etc.) all ran in parallel. The session ran 7 hours 33 minutes with 148 tool calls — parallel processing made what would have been a multi-day task fit into one session.

The rule that makes this work: agents get explicit file scopes in the prompt. Without that, two agents modifying the same file is almost guaranteed.

## Skills: Read Them or They Don't Work

Session 5 installed `frontend-design` and `ui-ux-pro-max`. Sessions 6 through 9 explicitly required skill reads as the first step in every prompt:

```
## Required first step: Read skills
1. .claude/skills/ui-ux-pro-max/SKILL.md — 658 lines
2. .claude/skills/frontend-design/SKILL.md
Do not proceed without reading these first.
```

Without that explicit instruction, Claude proceeds on its own judgment. The skill's guidelines — 44px touch targets, mobile spacing rules, anti-AI-slop principles — don't make it into the code unless the skill is actually invoked.

`ui-ux-pro-max` is 658 lines: 50+ UI styles, 161 color palettes, 57 font pairings. After reading it, Claude selected "Tech Editorial" as the design direction and locked in `#0071e3` as the brand blue. Doing that research manually would take hours. The skill front-loaded it in seconds.

Session 8 was analysis-only — no code changes. The output: "This site faithfully references Apple.com's design language. The problem is it still reads as an Apple clone." That assessment triggered the full redesign in session 14. Breaking work into analysis → direction → implementation produces better output than "just fix it."

## Day-End Stats

| Metric | Value |
|--------|-------|
| Total sessions | 15 |
| Total tool calls | ~757 |
| Longest session | 7h 33min (session 14, 148 tool calls) |
| Shortest session | 2min (session 11, 14 tool calls) |
| Same bug fixed | 7 times (mobile overflow) |
| Worktrees created | 8 |
| Primary models | claude-sonnet-4-6 (fast iteration), claude-opus-4-6 (large sessions) |

Session 14 used Opus because dark mode + search + full redesign arriving simultaneously is genuinely complex — enough chained decisions that Sonnet's context could run thin. The split: Opus for sessions requiring complex sequential reasoning across a large codebase, Sonnet for bug fixes and fast iterations. The cost difference is real, so the model choice should be deliberate.

## What Seven Redundant Fixes Actually Cost

The root cause of the seven-session loop was a single assumption: "this change should fix it," followed immediately by a deploy. The right sequence is to grep the codebase for every instance of the same pattern *before* deploying — and fix them all in one pass.

The `systematic-debugging` skill existed from session 1. It was first used in session 12. Using it at session 10 — the moment the bug was first reported — would have collapsed seven sessions into one or two.

Speed comes from solving the right problem the first time, not from shipping fast and iterating on the same bug.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
