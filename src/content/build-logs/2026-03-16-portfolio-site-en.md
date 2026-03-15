---
title: "How Claude Code Automated a 4-Platform Blog Pipeline in One Session (324 Tool Calls)"
project: "portfolio-site"
date: 2026-03-16
lang: en
pair: "2026-03-16-portfolio-site-ko"
tags: [claude-code, automation, blog, devto, hashnode]
description: "324 tool calls. 4 platforms. One session. How Claude Code designed and shipped a multi-platform blog automation pipeline from a vague prompt."
---

324 tool calls. 4 platforms. One Claude Code session that ran for 26 cumulative hours. By the end, AI news was publishing automatically to DEV.to, Hashnode, Medium, and Naver Blog simultaneously.

**TL;DR** A vague "just fix it" prompt turned into a fully automated multi-platform publishing pipeline. Claude Code handled diagnosis, implementation, and integration across 10+ files — but none of it went smoothly.

## The Prompt That Started It All

> "jidonglab and devto aren't working — fix it until it works"

That was the opening prompt. No specifics. No error messages. No context about what "not working" meant.

Claude Code didn't ask for clarification. It opened `src/lib/devto.ts`, pulled up the GitHub Actions workflow files, and traced the actual failure. A vague complaint became a structured diagnosis in minutes.

Two root causes surfaced: the AI news cron was generating content but failing to sync to DEV.to, and the latest-first sort order was broken on jidonglab. Both were fixable. Identifying them was the slow part.

## AI News Automation: Real Sources, Not Hallucinations

The original AI news automation was pure API — Claude generating news from its training data. That meant narrow coverage and occasional hallucination.

One message changed the architecture:

```
me: use google search / X, reddit, threads, global sources for news coverage
```

Claude Code opened `src/pages/api/generate-ai-news.ts`, mapped the existing generation logic, then added a source layer: Google Custom Search API and external feed crawling. The structural change was separating news *collection* from news *curation*. Before: Claude API generating content from nothing. After: real sources scraped first, Claude API curating and writing.

Accuracy went up. Hallucinations dropped.

The GitHub Actions cron schedule got updated alongside: `0 0,12 * * *` UTC — hitting 9 AM and 9 PM KST.

## Adding Four Platforms: Auth Was the Real Problem

Hashnode was straightforward. Get the API key, drop it in as `HASHNODE_TOKEN`, connect it in `src/lib/hashnode.ts`. The user literally pasted the token and blog URL into chat with no explanation:

```
user: ceef0313-ecca-456d-ab62-6a60280e6ab1
user: https://plzai.hashnode.dev/
```

Claude Code read the context, matched the values to the right environment variables, and wired it up.

Medium was different. OAuth flow instead of API key. The user supplied a Google OAuth client ID and secret, the auth flow got implemented — then hit an "Access Blocked" error. Turns out Medium's auto-publishing requires a paid membership. One payment later, it worked.

What stood out in this phase was the debugging pattern. Every time implementation stalled, Claude Code switched to `Bash` and hit the API directly — call it, read the response, adjust the code, repeat. `Read` and `Edit` tools dominated file work. `Bash` took over when the code needed live validation.

The tool call distribution across 324 calls showed this clearly: Bash was the most-used tool. More time was spent running things than reading or editing.

## The Korean-Only DEV.to Problem

Partway through, a content audit revealed a problem: most posts on DEV.to were Korean-only. Build logs that weren't supposed to be there. AI news that had already aged out. No English versions.

The prompt was multi-part and messy:

```
me: remove duplicates and low-value news, delete anything on dev.to that's a
    jidonglab feature update or build log, delete expired Korean news,
    generate English versions for blog posts only
```

Claude Code's execution sequence: fetch the full post list from the DEV.to API → classify each post by title and tags → unpublish posts that didn't belong → generate English translations for posts missing them → publish the new versions.

Each step was an API call. Done manually, this is half a day of work. Claude Code ran through it systematically.

## Admin Page: "This Is Unreadable"

During operations, the visitor count in the admin dashboard didn't match Cloudflare's numbers. A screenshot went into chat. Claude Code traced the discrepancy.

Cloudflare reports raw hits including bot traffic. The admin page tracked only human visitors. Different metrics, both correct. Not a bug.

But the "Build Logs by Project" section actually had a real bug — no view-count sorting. That got fixed.

```
me: sort Build Logs by Project section by view count
```

One line. Claude Code opened `src/pages/admin/index.astro`, added the sort logic. Done in under a minute.

## The Language Toggle That Showed Nothing

English mode button. Click it. Content disappears.

The existing i18n system used `data-ko` and `data-en` attributes to show/hide elements. But AI news content renders dynamically as Astro components — no attributes, no match, blank screen.

The fix combined two approaches: `navigator.language` for browser-based auto-detection, `localStorage` for explicit user preference. When the language toggles, the right content is there.

During this fix, Claude Code's `Edit` tool ran in sequence across multiple files. One bug found in one file turned up the same pattern in another. Each instance got patched individually.

## What "Just Do It" Actually Means

Several prompts in this session were open-ended:

```
"fix jidonglab and devto, make it work no matter what, post Korean content to devto too"
"use cowork to crawl news every 9am as a CLI subscription model"
"convert all dev.to English posts to a clean format and publish everything to hashnode"
```

Each had a different level of specificity. The first was goal-oriented ("no matter what"). The second specified method ("cowork"). The third defined source and target.

Claude Code performed best on goal-oriented prompts. "Fix it until it works" triggered multiple rounds of iteration and landed on a working result.

The method-specified prompt ("use cowork") ran into a problem — cowork automation wasn't functional in the current environment. Claude Code pivoted to GitHub Actions cron instead. The outcome the user wanted (automated 9 AM news) was achieved, but the method changed.

That's the practical lesson: prompt with *what*, not *how*. Claude Code will find a working path. Specifying the path locks it into methods that might not work.

## Session Stats

| Metric | Value |
|--------|-------|
| Session duration | ~26 hours cumulative |
| Tool calls | 324 |
| Files changed | 10+ |
| Platforms added | Hashnode, Medium (from 2 → 4) |
| Bugs fixed | DEV.to English sync, admin sort, i18n toggle |

The comparison point: doing this manually would mean reading API docs for each platform, mapping out OAuth flows, configuring cron schedules, and integrating with existing code. Days of work across four different platform APIs. Claude Code ran through it in one session.

What required human involvement: Medium membership payment, Hashnode account creation, Google OAuth app setup. Credentials have to be created by a person. Claude Code's role was taking those credentials and wiring them into the codebase.

## What's Still Broken

Blogger integration stalled in the Google OAuth flow. A 404 error appeared and didn't get resolved within the session. That's the next session's first task.

Medium auto-publishing is partially working post-membership, but not all posts have been verified as publishing correctly. More validation needed.

AI news quality has a duplication problem — similar topics appearing multiple times in the same day. Either a clustering layer on the collection side, or a prompt-level instruction like "skip topics already covered today" needs to be added.

> Automation isn't complete when it works. It's complete when you can leave it running and not worry.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
