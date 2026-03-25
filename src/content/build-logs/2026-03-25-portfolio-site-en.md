---
title: "3 Sessions, 336 Tool Calls: i18n Switch, Skill Refactor, and Hover Animations with Claude Code"
project: "portfolio-site"
date: 2026-03-25
lang: en
pair: "2026-03-25-portfolio-site-ko"
tags: [claude-code, i18n, animation, security, multi-agent]
description: "How Claude Code handled a default language switch, skill cleanup, hover animations, and a security audit across 3 sessions and 336 tool calls."
---

336 tool calls. 3 sessions. 12 files changed. More decisions made than lines written.

**TL;DR** — Switching the default language from Korean to English sounds trivial. It's not. Every text-bearing element across the entire layout needs to be audited. Claude Code mapped the change scope before touching anything, which is why it finished in one pass with no regressions.

## Session 1: "English Should Be the Default" — 13 Reads, 12 Edits

The prompt was direct.

```
The language toggle isn't working right. The site needs to default to English —
all translations should be complete for English.
```

Claude Code read `Base.astro` first, then returned with three specific problems instead of just starting to edit.

**Problem 1**: `var lang = 'ko'` — default language hardcoded to Korean. Every first visit fell back to Korean regardless of browser preference.

**Problem 2**: The toggle button showed `EN`. If English is the default, the button should offer `KO` — not the other way around.

**Problem 3**: Every `data-ko`/`data-en` element had Korean as its rendered baseline text in the HTML. Flipping `lang = 'en'` wouldn't fix the flash — the text nodes loaded from the server are still Korean.

That third point was the real problem. The strategy: keep the `data-ko`/`data-en` attribute structure intact, replace all inline default text with English, then at JS initialization read `localStorage` for a saved `lang` preference. Korean users get the `data-ko` values applied on top.

25 of the 50 tool calls in this session were Read and Edit. The other half went to a delegated Agent for translation review.

```
Check all the English translations — are they complete, natural, no typos?
```

One prompt. The Agent crawled the entire site, flagged missing translations, and caught awkward phrasing. Faster than clicking through every page manually, and it stayed focused without getting tired.

## Session 2: Removing Naver from the auto-publish Skill — 37 Bash, 23 Edits

The original goal was publishing three articles about Claude updates to DEV.to and Hashnode. But opening the `auto-publish` skill showed Naver still listed as a publish target.

```
Remove the Naver stuff from that skill.
```

Six references removed: Agent 3 (Naver Korean HTML), the `naver-seo-rules.md` reference, Phase 4 Naver publishing section, Phase 5 Naver queue check. Platform count dropped from 3 to 2 — spoonai.me and DEV.to only.

The Hashnode token setup was unexpectedly tedious. Even after providing the token directly, Claude Code ran through a Bash sequence: locate the env var, patch `publish-to-hashnode.mjs`, verify the result. That's where the 37 Bash calls came from. One token, a lot of shell.

One SEO decision worth keeping: every English post published to DEV.to or Hashnode gets `canonical_url` set to `jidonglab.com`. Whichever platform Google crawls first, the original source stays attributed to the personal site. That's how you syndicate without duplicate content penalties.

## Session 3: Hover Animations and a Security Audit — 100 Bash, 33 Edits

The longest session. 196 tool calls, 100 of them Bash.

It started with a UX question about the preview cards.

```
Can you make the previews animate on hover? Like a scroll or re-trigger animation?
```

Three animation variants added to `ArticleCard.tsx`:
- **Hero card**: 1.05x image zoom + shimmer scanline effect
- **Default card**: 1.05x image zoom on hover
- **Compact card**: 1.1x thumbnail zoom on hover

A `scan` keyframe animation landed in `globals.css` for the shimmer effect.

Then Vercel deployments started canceling. Three consecutive `git push` triggers, three `CANCELED` statuses. Claude Code bypassed the stalled auto-deploy by running `vercel build --prod && vercel deploy --prebuilt --prod` directly. Not elegant, but it shipped.

The security audit was a single delegated prompt.

```
Are there any security issues in this site? API attack vectors, token exposure, anything?
```

The Agent came back with one CRITICAL finding: an API route with no input validation. Finding that manually would have meant reading every route file from scratch. Delegated and triaged in under 15 minutes.

The hover animation itself went through five revision cycles. "Scroll on hover" → "Why does it scroll every 4 seconds?" → "Only scroll while hovering" → "2.5x the scroll speed" → "Actually, half that." Requirements tightened through iteration. The 33 Edit calls are mostly this loop.

## Tool Distribution Across All Three Sessions

| Tool | Count |
|------|-------|
| Bash | 149 |
| Edit | 68 |
| Read | 54 |
| Agent | 25 |
| Other | 40 |

Bash is nearly half the total because build verification, deployments, and env var setup ran repeatedly across sessions.

The 25 Agent calls stand out. Translation review, security audit, and reference HTML improvements were all delegated. Each would have taken 1–2 hours done manually.

## What Sticks From This Day

A task that looks simple — "switch the default language" — can silently affect every text-bearing element in the layout. The right prompt isn't "switch it to English." It's "map how the translation system currently works and list the problems." Scope analysis before edits catches side effects that a direct implementation would miss.

Security audits and code review are now default Agent tasks. No need to know what to look for in advance — delegate and triage the output.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
