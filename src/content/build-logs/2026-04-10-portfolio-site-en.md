---
title: "I Fixed the Same Mobile Bug 5 Times — What Claude Code's Systematic Debugging Skill Finally Revealed"
project: "portfolio-site"
date: 2026-04-10
lang: en
pair: "2026-04-10-portfolio-site-ko"
tags: [claude-code, debugging, design, mobile, systematic-debugging]
description: "Fixed a mobile horizontal scroll bug 5 times before a structured skill forced evidence-first debugging. 17 sessions, 892 tool calls, one redesign."
---

Five times. I pushed a fix for the same mobile horizontal scroll bug five times across eleven sessions. Each time, I thought it was done. Each time, the next report came in within days.

**TL;DR** Patching symptoms hides root causes. The Claude Code Systematic Debugging skill forced evidence-first investigation — and only then did the actual cause surface. In the same stretch, the `ui-ux-pro-max` and `frontend-design` skills drove a full site redesign. 17 sessions, 892 tool calls total.

## Five Fixes, Same Bug

Session 1: added `html, body { overflow-x: clip }`. Deployed. Bug report came back the next day.

Session 2: switched to `overflow-x: hidden`, added global `img { max-width: 100% }`. Deployed again.

Sessions 6, 8, 11 — three more rounds of the same thing. Every time I thought I'd found a new problem. In reality, I was creating new symptoms while the original cause stayed untouched.

There were two root causes, and neither was obvious from looking at a single component.

**Root cause 1: `overflow-x: clip` and iOS Safari compatibility.** The `clip` value isn't supported in Safari versions before 16 — it silently falls back to `visible`, which means no overflow clipping at all on iOS 15 and below. Switching to `hidden` seemed like the answer, but `hidden` on the `html` element itself turns the element into a scroll container on mobile, which breaks scroll behavior in a different way.

**Root cause 2: negative margins inside components.** `HomeContent.tsx` used a `-mx-5 px-5` pattern on the category tabs — the intent was to extend the tab background past the parent's padding. On mobile, this created a 16px overflow past the viewport edge. `BlogList.tsx` had a `-mx-4` negative margin causing the same problem independently.

Session 11 is when the Systematic Debugging skill was applied. Phase 1 — collect evidence before touching code. A grep across the codebase for the patterns that cause horizontal overflow:

```bash
grep -r "\-mx-\|w-screen\|100vw\|overflow-x" components/ app/ --include="*.tsx"
```

Two locations came back. Those were the real causes. That was it.

> Fixing symptoms moves the bug to a different location. The Systematic Debugging principle is simple: don't touch code until you can explain why the bug happens.

## What the Skill Actually Changed

Without the skill, Claude's default mode is to jump to "here's what I'd try" almost immediately. With the Systematic Debugging skill applied, Phase 1 is enforced: collect all evidence from the codebase, evaluate each hypothesis as confirm or reject, write the fix last.

Session 1 (no skill): 54 tool calls, `overflow-x: clip` added, deployed, bug returned in 3 days.

Session 11 (skill applied): 33 tool calls, grep identified two locations, negative margins removed, deployed, no recurrence.

Fewer tool calls. More precise fix. The discipline of narrowing scope first made the session faster and the result permanent.

## Bringing In Design Skills

The same period included a full redesign of the site. Two skills were installed: `ui-ux-pro-max` (community's top-ranked design skill, 55.8k stars) and `frontend-design` (Anthropic's official skill, 277k+ installs).

```bash
npx skills add anthropics/claude-code --skill frontend-design
```

Both were installed to `.claude/skills/` and `~/.claude/skills/` so they're available locally and globally.

The difference isn't that the skill runs automatically — it doesn't. The difference is what happens when the prompt explicitly loads it. Without a skill, "improve the design" produces safe, generic output. With a skill loaded at the start of the session, Claude reads 658 lines of guidelines covering color tokens, typography scale, 44px touch targets, and anti-AI-slop principles before writing a single line of code. The output quality is measurably different.

Session 12 implemented dark mode, Cmd+K search, and a full color shift to indigo — all in one session. 148 tool calls, 7 hours 33 minutes, Opus 4.6. The breakdown: Edit 43, Bash 34, Read 30, Write 15.

The prompt structure that made this work:

```
Implement the full redesign based on the design analysis.
## Required: read skills first
1. Read .claude/skills/ui-ux-pro-max/SKILL.md in full
2. Read .claude/skills/frontend-design/SKILL.md in full
```

The explicit "read this first" instruction is the critical part. Installed skills don't self-activate. If the prompt doesn't say to read them, they don't get applied.

## Opus vs. Sonnet: A Practical Distinction

Across 17 sessions, Opus 4.6 was used in sessions 3, 8, 9, 11, 12, and 14. The pattern is consistent: all design work, all sessions touching multiple files simultaneously, all sessions where skill guidelines needed to be applied.

Simple bug fixes — sessions 4, 5, 6, 13 — ran on Sonnet 4.6. Adding one line of CSS or fixing a single import doesn't need Opus.

A working heuristic:
- 3+ files modified in one session → Opus
- Reading a skill and applying its guidelines → Opus
- Single-file bug fix → Sonnet
- Grep + targeted one-location change → Sonnet

## Parallel Agents for Independent Components

Session 14 required applying feedback from three separate design reviewers across multiple components. `HomeContent.tsx`, `PostContent.tsx`, `DailyBriefing.tsx`, and `Footer.tsx` each needed independent changes with no shared state.

The AgentCrow pattern dispatches agents with non-overlapping file scopes:

```
🐦 AgentCrow — dispatching 3 agents:
1. @frontend_developer → HomeContent.tsx + ArticleCard.tsx (hero section, brand color, TOP badge)
2. @frontend_developer → PostContent.tsx (social sharing, TOC, source link styles)
3. @frontend_developer → DailyBriefing.tsx + Footer.tsx (dark mode, responsive)
```

No file scope overlap means no merge conflicts. The main thread handles planning and coordination; implementation is fully delegated. 26 tool calls, 10+ feature changes completed.

## Vercel CANCELED: The Rapid-Push Problem

Vercel's CANCELED deployment status appeared repeatedly throughout these sessions. The cause is straightforward: Vercel automatically cancels in-progress builds when a new push comes in. During active debugging where commits were being pushed in quick succession, each new push canceled the previous build.

There's also a worktree behavior to know: pushing from a worktree branch doesn't trigger Vercel's production deployment — it's not a push to `main`. The final merged result needs either a `main` push or a direct CLI deploy:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" /opt/homebrew/bin/vercel --prod
```

This command is now in memory. Future sessions can invoke it without reconstructing the path.

## What 892 Tool Calls Looks Like

Bash led the breakdown at roughly 280 calls — git status, build runs, image compression, grep searches. Edit came in second at around 130, Read at 120. The terminal-heavy nature of debugging and deployment shows up in the numbers.

The ratio also reflects the Systematic Debugging shift. Early sessions had high Edit counts relative to Read. Later sessions flipped that — more reading and investigation, fewer (but more accurate) edits.

The rule distilled from fixing the same bug five times: if you can't explain why the bug occurs before touching the code, the fix is a symptom patch.

> Skills change how Claude works — not just what it produces. Without a skill, outputs are competent. With a skill loaded and applied, outputs follow actual principles.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
