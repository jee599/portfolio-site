---
title: "Codex Caught What the Build Didn't: Claude Code + 4-Round Cross-Validation on jidonglab.com"
project: "portfolio-site"
date: 2026-05-22
lang: en
pair: "2026-05-22-portfolio-site-ko"
tags: [claude-code, astro, seo, portfolio, redesign, codex, i18n]
description: "4 Codex rounds, 164 tool calls, 10 sessions: caught 0 code bugs, 3 copy errors. One was a factual lie that passed every automated check."
---

Codex ran four times over this redesign. It found zero code bugs. It caught three copy errors — including one sentence that was factually false and passed every automated check: `npm run build`, TypeScript, ESLint. No tool flagged it.

That gap between "builds successfully" and "is actually correct" is the most interesting part of this project.

**TL;DR:** Full homepage redesign of jidonglab.com as a portfolio business card. Goal: a stranger with just the URL should know what Jidong builds within three seconds. 10 Claude Code sessions, 164 tool calls, 4 Codex cross-validation rounds. More copy errors surfaced than code bugs.

## The Question That Prompted the Redesign

A friend visited jidonglab.com and replied with one question: *"What do you do?"*

That was the brief.

The site had daily AI news above the fold, projects buried below the scroll, and a hero section with copy vague enough to describe half the internet. Nothing was wrong with the code. The site was built as a content feed, not a portfolio — and it showed.

One constraint: don't touch the tech stack. Astro 4 + React + Tailwind on Cloudflare Pages stays as-is. Only copy and section structure. One test: can a stranger identify what this person builds within three seconds of landing?

Claude mapped the current state with 12 Read calls across `Hero.tsx`, `About.astro`, `Projects.tsx`, `index.astro`, and `home.css`, then executed 11 Edit calls. The new addition was `src/components/home/Capabilities.astro` — four capability cards:

- AI automation (build logs, news pipelines, dental ad systems)
- Full-stack development (Next.js, Astro, Cloudflare Workers)
- Dental ad operations (Google/Meta campaigns, landing pages)
- Bilingual build log writing (Korean + English)

Each card uses `data-ko`/`data-en` HTML attributes for client-side language switching. The `.do-grid` CSS class handles the mobile one-column fallback.

The sessions kept hitting Hermes's `max_turns` limit and cutting off mid-task. What should have been one session became ten. That's why ten session boundaries cover changes that form one logical unit of work.

## Codex Round 1: The Commit That Wasn't Self-Contained

First Codex cross-validation came back with this:

> "`src/pages/index.astro` imports/uses `src/components/home/Capabilities.astro`, but the file is untracked. Do not leave the tracked diff non-self-contained."

`index.astro` was already importing `Capabilities.astro`. The import was in the commit. The actual component file wasn't — staging had been interrupted by the session cutoff. The diff described a state that couldn't run.

This is the simplest class of error Codex catches: structural completeness. A reviewer reading only the diff should be able to apply it and have the code work. An untracked import breaks that guarantee.

Fixed by staging the missing file. Also caught a copy problem in `Projects.tsx` during the review: the "currently running" section had development-stage projects mixed in with live ones. Separated them with explicit labels.

## Codex Round 2: When the Build Passes But the Copy Lies

Round 2 was more interesting:

> `Capabilities.astro`: `"Every commit diff becomes a Korean/English build log."` — This is not true.

It isn't. Not every commit gets a build log. This was aspirational copy that crossed into factual territory.

Here's what makes this error worth thinking about: it's not a code bug. Not a type error. `npm run build` passes. TypeScript is happy. ESLint has no opinions. The sentence is just false, and no automated tool in a standard web development pipeline is designed to catch that.

**Before:**
```
KO: "커밋 diff를 한국어·영어 빌드 로그로 매일 쌓는다."
EN: "Every commit diff becomes a Korean/English build log."
```

**After:**
```
KO: "진행 중인 작업을 한국어·영어 빌드 로그로 꾸준히 남긴다."
EN: "Progress gets documented as bilingual build logs."
```

The fix is a vocabulary shift: absolute quantifiers ("every", "daily") become directional ones ("consistently", "documented"). Meaning preserved. Statement now true.

If you're using Claude Code to write copy and code together, semantic accuracy is a category of error to watch specifically. The model writes what sounds right; automated tools validate what compiles. The intersection doesn't cover factual correctness.

## Codex Round 3: A Sentence at War With Itself

Round 3 flagged this Korean sentence:

`"혼자 같이 만든다."` — literally "building alone together."

The intent reads through: one person building, with AI as the working partner. But "alone together" is an oxymoron in Korean the same way it is in English.

Replaced with:
```
KO: "AI와 함께, 실제로 혼자 만든다."
EN: "Building alone, but with AI as co-pilot."
```

Same concept. No contradiction. The English version works standalone for anyone who hasn't encountered the solo-plus-AI building model before.

**Codex running total after three rounds:** 0 code bugs. 2 factual copy errors. 1 logical contradiction.

## "The Korean Tone Is Off" — A Bug Hidden in the Layout

Feedback arrived after the redesign went live:

> "Looks good, but the language switching and Korean text tone feel off."

Two separate problems compressed into one sentence.

The tone issue was fixable — some copy had drifted into a more formal register than the site's voice. Standard copy editing.

The language switching issue was different. **The toggle wasn't working on the homepage at all.**

Subpages using `Base.astro` load a JavaScript snippet that watches the language toggle button, reads and writes `localStorage`, and swaps `data-ko`/`data-en` attribute visibility. This script lives in `Base.astro`.

`index.astro` (the homepage) uses an independent layout that doesn't inherit from `Base.astro`. The toggle script was never imported. Clicking the language button did nothing. Korean text stayed Korean regardless of user selection.

This is a common Astro footgun: components are portable across pages, but layout-level scripts aren't. A component that depends on a layout-provided script will silently break on any page using a different layout. The component renders fine. The interactive behavior disappears with no error.

Investigation session: 13 Read calls + 3 Grep calls to trace the script loading chain. Diagnosis only — no fix that session. The actual changes landed in a separate session: `Hero.tsx`, `Capabilities.astro`, `Projects.tsx`, `ShipLog.astro` — 7 Read calls, 5 Edit calls to wire the toggle script directly into the homepage layout.

## The sitemap 404 Nobody Had Noticed

Before the SEO/AEO work, an audit ran first. Found this immediately.

`Base.astro` had `<link rel="sitemap" href="/sitemap-index.xml">`. The old `robots.txt` pointed to the same path. Astro's `@astrojs/sitemap` integration actually generates `/sitemap.xml`. Every subpage on jidonglab.com had a sitemap link pointing to a 404 — for an unknown duration.

JSON-LD was also missing entirely. Without structured data, Google indexes the page content but has no entity context. It can infer "software development"; it can't infer "this is a specific person with specific skills and projects."

Fixed in one session across five files:

**`src/components/Analytics.astro`** — New. Emits the GA4 script only when `PUBLIC_GA_MEASUREMENT_ID` is set. Local dev without the env var doesn't break the build.

**`src/pages/index.astro`** — JSON-LD schemas: `Person` + `WebSite` + `ProfilePage`. Explicit `og:type`, `og:locale`, canonical URL in OG tags.

**`src/layouts/Base.astro`** — Sitemap href corrected: `/sitemap-index.xml` → `/sitemap.xml`. Analytics component wired in.

**`public/robots.txt`** — New file. 13 named AI crawler groups with explicit rules: GPTBot, ClaudeBot, PerplexityBot, GoogleOther, Google-Extended, ChatGPT-User, Applebot-Extended, Bytespider, CCBot, anthropic-ai, cohere-ai, Omgilibot, Diffbot.

**`public/llms.txt`** — New file. AEO entity context for language model consumption: who Jidong is, what he builds, canonical URLs, what the site contains.

Tool usage this session: Read ×14, Bash ×6, Edit ×6, Grep ×3, Write ×3.

## Codex Round 4: robots.txt Rule Conflict

Round 4 checked the SEO work and flagged the robots.txt pattern:

```
User-agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /admin
```

The issue: `Allow: /` can make the subsequent `Disallow` rules meaningless. The robots.txt specification doesn't clearly define rule precedence when `Allow` and `Disallow` match the same path at different specificity levels, and real crawler implementations vary — some take the most permissive matching rule, others use declaration order, others use longest-path matching. With `Allow: /` present, there's no guarantee `/api/` and `/admin` are actually blocked.

Fix: for all 13 crawler blocks, added explicit `Disallow: /api/` and `Disallow: /admin` entries. `Allow: /` continues to signal that public content is crawlable. API endpoint protection is a separate, explicit rule — not something inferred from the absence of other allow rules.

## By the Numbers

**10 valid sessions** after filtering Hermes `max_turns` interruptions that fragmented one logical task across multiple restarts.

**~164 tool calls total:**

| Tool | Count |
|------|-------|
| Read | 64 |
| Bash | 54 |
| Edit | 31 |
| Write | 4 |

**Files:** 9 modified, 4 new (`Capabilities.astro`, `Analytics.astro`, `robots.txt`, `llms.txt`)

**Codex cross-validation rounds:** 4

**Codex findings:**

| Category | Count |
|----------|-------|
| Code bugs | 0 |
| Structural (untracked file) | 1 |
| Factual copy errors | 2 |
| Logical contradictions | 1 |
| Infrastructure config bugs | 1 |

> Cross-validation caught five issues across four rounds. None were code bugs. The most valuable catches were in categories where automated tooling has no opinions: semantic accuracy, logical consistency, and spec-ambiguous configuration.

The build passing doesn't mean the copy is true. That's the part worth keeping.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
