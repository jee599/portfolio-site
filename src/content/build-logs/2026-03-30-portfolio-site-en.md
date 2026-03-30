---
title: "Rejected by 3 Payment Processors: Full Codebase Rebranding + 40 Blog Posts with Claude Code"
project: "portfolio-site"
date: 2026-03-30
lang: en
pair: "2026-03-30-portfolio-site-ko"
tags: [claude-code, agentcrow, auto-publish, lemon-squeezy, polar, rebranding, parallel-agents]
description: "Stripe, LemonSqueezy, Polar all rejected my saju app. Rebranded 21 i18n files via 5 parallel agents, generated 40 blog posts, deployed to 3 platforms. 281 tool calls."
---

Three payment processors. Three rejections. Same reason every time.

**TL;DR** — 3 sessions, 281 tool calls. Used Claude Code to rebrand an entire codebase (FortuneLab → InsightLab, 21 i18n files) after payment processors blocked "fortune-telling" framing. Then spawned 5 parallel agents to generate 40 blog posts and deploy to 3 platforms. Added bilingual support to the daily briefing in 24 minutes flat.

## The Word That Got My App Rejected Three Times

Session 1 started with a two-character prompt:

> "사주"

I was registering 6 products on LemonSqueezy — `standard` (saju report), `compat` (compatibility), `palm` (palm reading). Claude drafted Names, Descriptions, and Pricing tiers for each. The first registration attempt hit a wall immediately: **"identity verification: Rejected."**

I tried again. Created a new account. Switched to Polar. Three attempts, same message each time:

> "Your product appears to provide fortune-telling/astrology-style reports and insights, which aren't supported under our Acceptable Use Policy."

Any platform running on Stripe's infrastructure enforces the same AUP categories: divination, fortune-telling, astrology. The entire domain is blocked.

The fix was a framing shift. My prompt to Claude:

> "I want to go in the direction of birthday-based AI personality analysis rather than divination."

**"Fortune-telling service" → "AI personality analysis / self-discovery report."** Extract saju, fortune, divination from the codebase. Replace with personality insight, self-discovery, AI analysis.

## 5 Parallel Agents, 21 i18n Files, One Rebranding Pass

The scope was wide: `lib/productNames.ts`, `common.json`, `palm.json`, `seo.json` — 21 i18n files total, plus the brand rename FortuneLab → InsightLab across URL paths and meta tags.

AgentCrow split the work into 3 independent domains:

```
🤖 @code-files-rebrand  → lib/productNames.ts, API routes
🌐 @core-en-i18n        → common.json, seo.json (brand, metadata)
📝 @feature-en-i18n     → palm.json, compat.json, 16 other feature files
```

Results per agent:

- `productNames.ts`: `full.en` replaced with "AI Four Pillars Analysis Report" and equivalents
- `common.json`: FortuneLab → InsightLab, 5 brand references updated
- 18 feature files: language like "Reading the heart line" was kept where it's descriptively neutral; explicit divination language removed

No shared files across agents, so parallel dispatch was safe. That's the key criterion for AgentCrow — file scopes must not overlap.

Session tool distribution: `Grep(12)`, `Read(8)`, `Glob(7)`, `Agent(7)`, `Bash(5)`. Grep led because finding brand keywords across the full codebase required it.

21 files, under 20 minutes. Solo that's half a day.

## 40 Blog Posts Across 3 Platforms

Session 2 was a different scale. 199 tool calls, 15 hours 54 minutes of compute time.

It started with two prompts back-to-back:

> "Find ~10 trending Claude-related keywords from the web and communities right now."
> "Write one blog post per keyword. Deploy everything."

The `auto-publish` skill kicked in. One topic → spoonai (KO + EN) + DEV.to (EN) + Hashnode (EN) = 4 files per topic. 10 topics = 40 files.

Before generating, Claude checked for duplicates. Topics 4 and 5 overlapped with `2026-03-25-claude-computer-use-mac-agent` and one other existing post. Those 2 were skipped; 8 topics proceeded. Final output: 32 files.

5 agents dispatched in parallel:

```
📝 @writer-1 → Topics 1-2: Mythos model leak + Pentagon lawsuit
📝 @writer-2 → Topics 3-4: Anthropic IPO + Computer Use/Cowork
📝 @writer-3 → Topics 5-6: Auto Mode + sub-agents
📝 @writer-4 → Topics 7-8: Developer anxiety + Anthropic Institute
📝 @writer-5 → Topics 9-10: Chrome extension + financial markets
```

Each agent ran `WebSearch` to pull real articles, then wrote both a Korean post (for spoonai) and an English post (DEV.to/Hashnode) simultaneously.

Deployment: 3 git pushes to 3 separate repos. spoonai went clean. `dev_blog` and `hashnode` had upstream changes — pull first, then push.

| Repo | Files | Status |
|------|-------|--------|
| spoonai | 40 files | push success |
| dev_blog | 20 files | pull → push |
| hashnode | 20 files | pull → push |

Session tool distribution: `Bash(103)`, `Read(24)`, `Agent(22)`, `WebFetch(18)`, `Grep(11)`. Bash dominated — git operations, file moves, build verification.

## 24 Minutes, 36 Tool Calls: Bilingual Daily Briefing

Session 3 was the opposite extreme.

This is what happens when the spec is precise before Claude touches any file. I gave the exact structure upfront:

> "content/daily/ only has YYYY-MM-DD.md in Korean (problem). Required: 1. lib/content.ts — add lang param to getDailyBriefing. 2. app/daily/[date]/page.tsx — ko/en tab UI. 3. components/DailyBriefing.tsx — tab component."

Claude created a `TodoWrite` plan before writing a single line:

```
☐ lib/content.ts: filter -en.md in getDailyDates()
☐ lib/content.ts: new hasDailyEnVersion(date) function
☐ lib/content.ts: getDailyBriefing(date, lang?) with lang param
☐ app/daily/[date]/page.tsx: parallel fetch for ko/en
☐ components/DailyBriefing.tsx: tab UI
☐ content/daily/2026-03-30-en.md: sample English file
```

Build passed. 10 `/daily/[date]` routes generated correctly. Two skill sync files (`spoonai-site-publish/SKILL.md`, `spoonai-daily-briefing/SKILL.md`) updated in the same session. All in 24 minutes.

Tool distribution: `Read(15)`, `TodoWrite(7)`, `Edit(7)`, `Glob(2)`, `Bash(2)`. `TodoWrite` second — precise specs produce a planning-first pattern.

## Business Constraints Changed the Architecture

The longest part of this sprint wasn't writing code. It was routing around payment infrastructure constraints.

Claude's contribution here wasn't code changes — it was **positioning strategy**. "If you reframe from divination to AI personality analysis, you can pass AUP" — making that call, then executing a full codebase change to match it.

Payment processor policy drove technical architecture. When external constraints (AUP rules, compliance requirements, platform policies) shape technical decisions, AI that can reason at the strategy level alongside you is useful differently than autocomplete.

> Business constraints changed what the product says it is. Claude Code changed what the code actually says.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
