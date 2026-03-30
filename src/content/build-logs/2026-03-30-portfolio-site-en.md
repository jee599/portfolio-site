---
title: "3 Payment Processors Rejected My App for 'Fortune-Telling' — So I Rebranded 21 Files with Parallel Agents"
project: "portfolio-site"
date: 2026-03-30
lang: en
pair: "2026-03-30-portfolio-site-ko"
tags: [claude-code, agentcrow, auto-publish, rebranding, vercel, cache, parallel-agents]
description: "5 sessions, 338 tool calls. 'Fortune-telling' keyword triggered 3 payment rejections. Rebranded 21 i18n files in 20 minutes with parallel agents, auto-published 32 blog posts, and debugged a Vercel immutable cache trap."
---

Three payment processors. Three rejections. The same error message every time.

It started with a two-character Korean word and ended with a full product rebrand, 32 blog posts deployed across three platforms, and an immutable cache bug that had nothing to do with code.

Five sessions. 338 tool calls.

**TL;DR** The phrase "fortune-telling" gets your account blocked on any Stripe-infrastructure payment processor — Lemon Squeezy, Polar, doesn't matter. The fix was reframing the entire product as AI personality analysis. Same day: 10 Claude-related keywords became 32 published posts via parallel agents. And a corrupted image got immutably cached for a year — the only escape was renaming the file.

## The Two Characters That Blocked Three Payment Accounts

Session 1 opened with a two-character prompt:

> "사주"

I was registering 6 products on Lemon Squeezy: `standard` (four pillars report), `compat` (compatibility), `palm` (palm reading). Claude drafted Name, Description, and Pricing for each. The first submission hit a wall immediately — account status: "identity verification: Rejected."

Retry. New account. Switch to Polar. Three attempts, the same message every time:

> "Your product appears to provide fortune-telling/astrology-style reports and insights, which aren't supported under our Acceptable Use Policy."

Any platform on Stripe's infrastructure enforces the same AUP categories. Divination, fortune-telling, astrology — the entire domain is blocked at the payment rail level.

The solution was a framing shift. My prompt:

> "I want to go with AI-based birthday personality analysis, not divination."

"Fortune-telling service" → "AI personality analysis / self-discovery report." Strip every instance of saju · fortune · divination from the codebase. Replace with personality insight / self-discovery / AI analysis.

Session stats: 6h 3min, 46 tool calls. Grep 12, Read 8, Glob 7, Agent 7, Bash 5.

## 21 i18n Files Rebranded in Parallel — Without a Single Conflict

The rebrand surface was wide. `lib/productNames.ts`, `common.json`, `palm.json`, `seo.json`, and 17 other i18n files. Brand name FortuneLab → InsightLab. URL paths. Meta tags.

AgentCrow split the work into three independent domains:

```
🤖 @code-files-rebrand  → lib/productNames.ts, API routes
🌐 @core-en-i18n        → common.json, seo.json
📝 @feature-en-i18n     → palm.json, compat.json, 18 feature files
```

No shared files across agents meant parallel dispatch was safe. The rule for parallel agents: file scopes must not overlap — the moment two agents touch the same file, you get conflicts.

Results: `full.en` in `productNames.ts` became "AI Four Pillars Analysis Report." Five FortuneLab references in `common.json` flipped to InsightLab. Phrases like "Reading the heart line" — descriptively neutral, no fortune-telling connotation — the agents kept without being told to.

21 files. 20 minutes. Doing this solo would have taken half a day.

## 10 Keywords → 32 Files → 3 Repos

Session 2 was a different scale. 199 tool calls. 15 hours 54 minutes of elapsed compute time.

Opening prompts:

> "Find 10 trending Claude-related keywords from the web and communities, most recent first."
> "Write one blog post per keyword. Deploy everything."

The `auto-publish` skill activated. One topic generates: spoonai (Korean + English) + DEV.to (English) + Hashnode (English) = 4 files. 10 topics = 40 files.

First step was deduplication. Topics 4 and 5 overlapped with existing posts like `2026-03-25-claude-computer-use-mac-agent`. Skipped 2, proceeded with 8 topics — 32 final files.

Five agents dispatched in parallel, each handling 2 topics. Per-agent flow: `WebSearch` to collect real articles → write Korean post (for spoonai) → write English post (for DEV.to/Hashnode) → save to all three repos.

Deployment: `git push` to three repos. spoonai succeeded immediately. `dev_blog` and `hashnode` had upstream changes — pull and re-push. Another session had committed into the same repos mid-automation loop.

The same session also updated the `frontend-design` skill. Prompt: "Analyze 20 reference sites built with v0 or Lovable." Claude inferred the prompt patterns those tools use internally and added them to `production-design-system.md` in the skill.

Tool distribution: Bash 103, Read 24, Agent 22, WebFetch 18, Grep 11. Bash dominated — git operations, file movement, build validation.

## What a Sharp Spec Does to Tool Call Count

Session 3 was the opposite extreme. Adding an English tab to the spoonai.me daily briefing.

The spec was precise from the start:

> "`content/daily/` only has Korean YYYY-MM-DD.md files (problem). To do: 1. `lib/content.ts` — add language parameter to `getDailyBriefing`. 2. `app/daily/[date]/page.tsx` — ko/en tab layout. 3. `components/DailyBriefing.tsx` — tab UI"

Claude created a 6-step TodoWrite plan and executed in order. 4 files changed. Build succeeded. 10 `/daily/[date]` routes generated correctly. Including skill file sync for `spoonai-site-publish/SKILL.md` and `spoonai-daily-briefing/SKILL.md`: 39 tool calls total. Read 15, TodoWrite 7, Edit 7.

The pattern is observable: same amount of code change, fewer tool calls with a sharp spec. Vague requests burn calls on exploration. Precise specs go straight to implementation. Session 3 had significantly more file diffs than session 4, yet used fewer calls — because session 4 required investigation before touching anything.

## The Immutable Cache Trap: Renaming the File Is the Only Exit

Session 4 was the day's most instructive debugging case. Two blog posts — Harvey AI and Mistral Voxtral — kept showing broken images on the live site. The files had already been replaced. The browser still served broken images.

49 tool calls verifying file existence, frontmatter accuracy, build status. All clean.

The culprit was `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/images/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

`immutable` tells the browser: "This file never changes. Don't request it again for a year." The first deployed file was corrupted — HTML content saved with a `.jpg` extension. The browser cached that corrupted file for a year. Replacing the file at the same URL does nothing; the browser serves from its cache.

Fix: rename `-01.jpg` → `-02.jpg`, update frontmatter, delete the corrupted original. Different URL forces a fresh fetch.

7 minutes. 49 tool calls, 31 of them Bash — file validation and build checks.

`immutable` cache is a CDN performance win, but if a corrupted file lands first, it becomes a permanent trap. The lesson: validate image files before deployment. Any pipeline serving assets with `immutable` headers needs a file integrity check before push.

## 3 Canceled Builds — CLI Bypasses Everything

Session 5. Pushed to main three times. Vercel builds kept showing CANCELED with no build logs.

Ran `npx vercel deploy --prod` directly from the project root. Build completed in 55 seconds. 164 static pages generated. Deployed to `https://spoonai.me`.

1 minute. 5 tool calls. All Bash.

Git-triggered builds canceling is likely a Vercel worktree configuration conflict or deduplication behavior when the same commit gets pushed multiple times. Root cause not fully determined. CLI deploy bypassed it.

## Session Stats

| Session | Duration | Tool Calls | Primary Tools |
|---------|----------|-----------|---------------|
| Saju rebrand | 6h 3min | 46 | Grep, Read, Agent |
| 32 posts published | 15h 54min | 199 | Bash, WebFetch, Agent |
| Daily English tab | 1h 27min | 39 | Read, Edit, TodoWrite |
| Image cache fix | 7min | 49 | Bash, Read, Edit |
| Force deploy | 1min | 5 | Bash |

Total: 338 tool calls. By tool: Bash 149, Read 59, Agent 29, Grep 24, WebFetch 18, Edit 17.

---

A payment processor rejection — a business constraint — changed a technical decision. 21 files that would have taken half a day solo took three parallel agents 20 minutes. The spec clarity gap is measurable: session 3 (sharp spec, 39 calls) made more changes than session 4 (investigation needed, 49 calls).

The immutable cache lesson is evergreen: if you deploy with `immutable`, validate before push. There's no patch after the fact — only a filename change.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
