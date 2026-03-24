---
title: "50 Tool Calls to Fix One Language Toggle: Claude Code i18n Debugging"
project: "portfolio-site"
date: 2026-03-25
lang: en
pair: "2026-03-25-portfolio-site-ko"
tags: [claude-code, i18n, astro, multi-agent]
description: "One hardcoded var lang = 'ko' was silently breaking the entire translation system. Root cause to deploy: 24 minutes, 50 tool calls with Opus 4.6."
---

One hardcoded string was silently breaking the entire i18n system. Finding it took seconds. Cleaning up everything downstream took 24 minutes and 50 tool calls.

**TL;DR** `var lang = 'ko'` was hardcoded as the default. Every first-time visitor saw Korean regardless of browser language or preference. Flipping the default to English and reversing the button logic required touching 3 files — but Opus 4.6 used 8 parallel agent calls for translation review along the way.

## The Bug That Wasn't Obviously Broken

The request was simple: "English should be the default. The language toggle should switch to Korean, not the other way around."

Simple request. Non-obvious root cause.

Before touching anything, Opus 4.6 read `Base.astro` to map the current translation system. Three problems surfaced immediately.

**Problem 1**: `var lang = 'ko'` — the default language was hardcoded to Korean. When `localStorage` had no `lang` key (i.e., every first visit), the fallback was always Korean. English-speaking visitors always landed on a Korean page.

**Problem 2**: The button label was inverted. If English is the default, the toggle button should show "KO" (offering to switch to Korean). It was showing "EN" instead.

**Problem 3**: 126 existing build log posts had no English pair (`lang: en`). Fixing the UI wouldn't fix the content — English users would still see Korean post titles in the list. This was scoped out intentionally. The request was "fix the toggle," not "translate everything."

## How the i18n System Works

This portfolio doesn't use server-side i18n. No locale routing, no translation files. Instead, every text element carries both languages as HTML attributes:

```html
<span data-ko="최근 포스트" data-en="Recent Posts">Recent Posts</span>
```

JavaScript reads `localStorage.getItem('lang')`, then walks the DOM replacing `textContent` with the appropriate attribute value. It's client-side, zero-dependency, and works without any framework overhead.

The catch: **the default text content needs to match the default language**. If the page initializes in Korean but the default text is Korean, there's no flash. If the default text is Korean but you're switching to English as default, you get a brief Korean flash before JS runs.

The fix required both changing the default language *and* updating all the default text nodes to English. Otherwise the flash would persist even after the `lang` variable was corrected.

## The Fix: 3 Files, 3 Changes Each

The actual changes were surgical:

```diff
- <html lang="ko">
+ <html lang="en">
```

```diff
- var lang = localStorage.getItem('lang') || 'ko';
+ var lang = localStorage.getItem('lang') || 'en';
```

```diff
- <button id="lang-toggle">EN</button>
+ <button id="lang-toggle">KO</button>
```

Then every `data-ko`/`data-en` element needed its default text flipped to English. This touched `Base.astro`, `PostLayout.astro`, and `blog/[slug].astro`.

Not complicated. But there were enough scattered changes across enough files that doing it carefully — without breaking the toggle logic — justified methodical execution.

## Why 50 Tool Calls?

Breakdown: Read ×13, Bash ×12, Edit ×12, Agent ×8, Glob ×2.

The 8 Agent calls are the interesting part. After making the changes, the task was: "Check that all English translations look right. No awkward phrasing, no typos, no missing translations." Instead of scanning the entire site serially, AgentCrow dispatched parallel agents per section — header, navigation, blog listing, post layout, footer.

Parallel review is faster and catches more. A single agent scanning 5 sections sequentially will start rushing by section 4. Five agents each owning one section stay focused.

The 12 Bash calls were mostly build verification (`astro build`) and Cloudflare Pages deployment. The 13 Read calls were the repeated read-modify cycles across the three files — changes were scattered enough that each file needed multiple passes.

## The 126-Post Problem (Deferred)

The deeper issue: 126 existing build logs are Korean-only (`lang: ko`, no `lang: en` pair). English users browsing `/posts` will still see Korean titles for those posts. The UI is fixed but the content isn't.

This was a deliberate scope decision. Auto-translating 126 markdown files is a batch job for the Claude API — a Python script that reads each post, calls `claude-haiku-4-5-20251001` with a translation prompt, and writes the English pair. That's a separate session with a separate scope.

Fixing the UI layer without fixing content is still a real improvement. First-time visitors now land on English, see English navigation, and can find the handful of posts that do have English pairs. The rest is backlog.

## Before / After

| | Before | After |
|---|---|---|
| Default language | Korean (hardcoded) | English |
| Toggle button | Shows "EN" | Shows "KO" |
| `<html lang>` | `ko` | `en` |
| First visit | Korean page | English page |
| Load flash | Korean → English flicker | None |

After deploying: opened the site, saw English, saw "KO" in the top-right corner. Clicked it, switched to Korean. Clicked again, back to English. Done.

24 minutes. 50 tool calls. The actual fix was 3 lines — the other 47 tool calls were reading context, verifying build output, running parallel review, and deploying. That's roughly the right ratio for a change that's small in code but high in surface area.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
