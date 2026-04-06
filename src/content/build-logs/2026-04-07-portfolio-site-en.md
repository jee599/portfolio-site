---
title: "17 Claude Code Sessions, 600+ Tool Calls — Full Redesign in One Day (and 7 Tries to Fix One Mobile Bug)"
project: "portfolio-site"
date: 2026-04-07
lang: en
pair: "2026-04-07-portfolio-site-ko"
tags: [claude-code, parallel-agents, debugging, mobile, worktree]
description: "How I redesigned spoonai.me in a single day using 17 Claude Code sessions and parallel agents — and what it took to finally kill an iOS Safari scroll bug."
---

It took seven sessions to fix one mobile scroll bug. Every time an agent said it was fixed, the user came back with "still scrolling sideways." This is the story of those seven attempts — and the full-site redesign that happened around them.

**TL;DR** I completed a full redesign of spoonai.me using 17 Claude Code sessions across two days. The parallel agent pattern was the key to moving fast. The mobile `overflow-x` bug that took 7 attempts came down to a single browser compatibility gap: `clip` falls back to `visible` on iOS Safari below 15.

## The Scale: 17 Sessions, One Day

From April 5 to April 6, 2026: 17 sessions, 600+ tool calls. Session 14 alone was 148 tool calls and 7 hours 33 minutes.

The prompt that kicked it all off was simple: "Implement a full redesign based on the design analysis. Use a blue color scheme." From that, one session produced dark mode, a Cmd+K search palette, an indigo color system, and scroll-reveal animations. 23 new files were created — `ThemeProvider.tsx`, `SearchCommandPalette.tsx`, `ScrollReveal.tsx`, and more, either created from scratch or fully replaced.

## Parallel Agents: Scope Files, Not Tasks

The pattern I used most throughout the redesign was AgentCrow parallel dispatch. In session 4, I split three agents like this:

```
🐦 AgentCrow — dispatching 3 agents:
1. @frontend_developer → HomeContent.tsx + ArticleCard.tsx
2. @frontend_developer → PostContent.tsx
3. @frontend_developer → DailyBriefing.tsx + content.ts
```

The rule is that file scopes must not overlap. Two agents touching the same file causes conflicts. Splitting by domain makes parallel execution safe.

In session 6, I went further: before dispatching agents, I had them read `ui-ux-pro-max/SKILL.md` (658 lines) and `frontend-design/SKILL.md`. The consistency of the output was noticeably better compared to sessions where agents went in without reading the skills first.

Don't expect agents to intuit "good design." You have to inject the standard explicitly.

## Worktrees: Isolated Workspaces Per Branch

Every task across all 17 sessions got its own worktree: `angry-williams`, `keen-buck`, `silly-curie`, `pensive-hoover`, and others. The benefits are twofold: experiments never pollute `main`, and multiple agents can work in separate worktrees simultaneously.

One problem I ran into: Vercel's automatic deployment cancels builds when pushes arrive in quick succession. When merging worktree branches into main, back-to-back pushes caused Vercel to cancel earlier builds. The fix was deploying directly via CLI:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" /opt/homebrew/bin/vercel --prod
```

I relearned this in sessions 3, 11, and 15. Relying solely on git push for Vercel deployments doesn't work when branches merge fast.

## The Bug That Took 7 Sessions

The mobile horizontal scroll bug started in session 7 and kept showing up through session 15.

Here's what was tried, in order:

- Added `body { overflow-x: clip }`
- Removed negative margins (`-mx-5`, `-mx-4`)
- Added `html { overflow-x: hidden }`
- Set `max-width: 100%` on images
- Removed all `100vw` usages

Each time: "fixed." Each time, the user responded: "still scrolling."

In session 12, I used the `systematic-debugging` skill and finally found the root cause. `overflow-x: clip` is not supported on iOS Safari below version 15. In unsupported browsers, it silently falls back to `visible` — meaning no clipping happens at all. That's why seven patches all failed: each one treated a symptom while the actual cause, a browser compatibility gap, went unchecked.

The final fix:

```css
html {
  overflow-x: hidden; /* fallback for older iOS Safari */
  overflow-x: clip;   /* preferred: prevents scroll chaining */
}

img {
  max-width: 100%;
  height: auto;
}
```

Browsers that support `clip` use it. Older iOS Safari falls back to `hidden`. Done.

The `systematic-debugging` skill's core rule is: find the root cause before writing a fix. If I'd followed that from the start, this would have been resolved in three sessions, not seven.

## Image Optimization: 737KB → 49KB

During a performance investigation in session 9, I found the logo image was a 2220×1501px PNG at 737KB. The actual rendered size was 200×73px.

Resizing and compressing with `sips` brought it down to 49KB — a 93% reduction.

```bash
sips -z 146 400 logo.png --out logo-optimized.png
```

Next.js `next/image` auto-converts to WebP, but source file size still affects cold start time and git repository size. One caveat: some PNGs got *larger* after `sips` processing because `sips`'s PNG compression is less efficient than the original encoder. Those files were restored with `git checkout`.

## Load the Skill First

Session 7 produced the clearest lesson of the entire project. The user's prompt included an explicit instruction: "Read the skill properly before redesigning. Do not proceed without reading it."

The output from that session was more consistent than any previous session.

`ui-ux-pro-max` defines 44px touch targets, spacing rules, and mobile breakpoints. `frontend-design` applies "anti-AI-slop" principles to prevent generic outputs. Injecting these directly into the agent prompt — or having the agent `Read` them before starting — anchors the implementation to actual guidelines rather than vibes.

Agents don't spontaneously produce good design. You have to tell them what good means.

## By the Numbers

| Metric | Value |
|--------|-------|
| Total sessions | 17 |
| Total tool calls | 600+ |
| Longest session | 148 tool calls, 7h 33m |
| New components created | 23 |
| Image compression | 93% (737KB → 49KB) |
| Mobile scroll bug attempts | 7 |
| Max parallel agents | 4 |

A full redesign with dark mode, Cmd+K search, an indigo color system, and responsive mobile UI — in one day. That's not something a solo developer can pull off without AI. The bugs were real. The iteration count was painful. But the output landed.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
