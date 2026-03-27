---
title: "336 Tool Calls: Flipping a Site's Default Language and Rebuilding a Publish Pipeline"
project: "portfolio-site"
date: 2026-03-27
lang: en
pair: "2026-03-27-portfolio-site-ko"
tags: [claude-code, i18n, auto-publish, skill, vercel]
description: "3 sessions, 336 tool calls. How Claude Code handled a full i18n default swap and a publish pipeline refactor — starting with 13 Read calls before touching a single file."
---

336 tool calls across 3 sessions. The code changes themselves were modest. What's interesting is the *pattern* of how Claude Code approached each task.

**TL;DR** A one-line prompt flipped the entire site's default language from Korean to English. Editing a skill file directly restructured the publishing pipeline. And a Vercel deployment mystery ended with a manual deploy.

## Why Claude Read 13 Files Before Touching Anything

Session 1 started with this prompt:

> "The language toggle isn't working well. The site should default to English, with all content translated. Switch the default to English and add a Korean toggle."

The first thing Claude did was *not* write code. It ran `Read` 13 times to map the current state:

- `Base.astro` had `var lang = 'ko'` hardcoded
- `<html lang="ko">` in the root layout
- The toggle button showed `EN` by default — which only makes sense if Korean is default (showing what you can switch *to*)
- 126 build logs had no English translations

This wasn't a one-variable change. The entire site used `data-ko`/`data-en` attributes to render text, and the default text nodes throughout — navigation, home, about, posts pages — were all Korean strings. The full scope of work only became visible after those 13 reads.

Once the scope was clear: `Edit` ran 12 times across 3 files — `Base.astro`, `PostLayout.astro`, and `[slug].astro`. The 8 `Agent` calls in between delegated translation quality checks and deployment steps.

**The pattern:** Read first, always. Not because Claude is cautious — because the cost of a wrong assumption is higher than the cost of 13 reads.

## Opening a Skill File and Deleting a Platform

Session 2 was about the `auto-publish` skill. It started as a question:

> "Is there a skill that writes posts to jidonglab and DEV.to?"

There was. The `auto-publish` skill published to three platforms simultaneously: spoonai.me, DEV.to, and Naver Blog. But I'd decided to stop using Naver, so:

> "Remove Naver from that skill."

Claude opened `~/.claude/skills/auto-publish/SKILL.md` and edited it directly. What got removed:

- Agent 3 (Naver Korean HTML generation)
- Phase 4: Naver publish section
- Phase 5: Naver queue verification
- Naver series handling block
- `naver-seo-rules.md` reference

Three platforms became two. The skill now publishes to spoonai.me and DEV.to (plus Hashnode, added in this session).

The Hashnode addition surfaced a canonical URL discussion. When publishing the same content to multiple platforms, you need `canonical_url` set to your own domain (`jidonglab.com`) to avoid duplicate content penalties in search. This rule got written explicitly into the skill file so it's enforced on every future publish.

One snag during Hashnode setup: Claude couldn't find the API token. The user pasted it directly into the chat. Claude received it, wrote it to the config file, and continued.

## The Vercel CANCELED Mystery

Session 3 opened with a deployment problem. Multiple recent pushes to `main` were showing `CANCELED` status in Vercel. The last successful auto-deploy was from the commit `fix: deploy as jee599 author`. Everything after that had been silently canceling.

The fix was manual:

```bash
vercel build --prod && vercel deploy --prebuilt --prod
```

The root cause was never fully confirmed — most likely a Vercel project configuration issue with the Git integration. The manual deploy worked, the site updated, and we moved on.

This is worth noting: sometimes the right call is to unblock yourself with a workaround and investigate later, rather than spending 30 minutes diagnosing a CI issue when the fix is one command.

## What 336 Tool Calls Actually Looked Like

| Tool | Count | Share |
|------|-------|-------|
| Bash | 149 | 44% |
| Edit | 68 | 20% |
| Read | 54 | 16% |
| Agent | 25 | 7% |
| Other | 40 | 12% |

`Bash` at 44% wasn't about writing code — it was build verification and deployment. "Did it build?" and "Did it deploy?" together accounted for more tool calls than the actual file edits.

The 25 `Agent` calls went to work that didn't need to consume the main context: translation quality review, security checks, reference file cleanup. Delegating these kept the main session focused.

## Short Prompts, Large Blast Radius

The clearest pattern from these sessions: the shortest prompts triggered the largest scope of changes.

- "Switch the default to English" → 3 files, dozens of text node changes
- "Remove Naver from that skill" → full restructure of a multi-phase skill file
- "Deploy" → discovered CANCELED state, pivoted to manual deploy

Prompt length doesn't determine work complexity. What determines it is how well Claude understands the current state before acting. That's why Read always comes first — not as a habit, but because you can't scope a change you haven't mapped.

The tool count tells the same story differently: 54 reads vs 68 edits. Nearly 1 read per edit. Not because every edit needed a read, but because Claude front-loaded the exploration before any writing happened.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
