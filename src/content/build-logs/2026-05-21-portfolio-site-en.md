---
title: "581 Tool Calls to Make a Portfolio Site Actually Introduce You (Claude Code + Codex, 4 Rounds)"
project: "portfolio-site"
date: 2026-05-21
lang: en
pair: "2026-05-21-portfolio-site-ko"
tags: [claude-code, astro, seo, portfolio, redesign, codex]
description: "Rebuilt jidonglab.com from AI news feed to positioning-clear portfolio: Capabilities component, i18n fix, JSON-LD + GA4 + robots.txt — 33 sessions, 581 tool calls, 4 Codex rounds."
---

A friend sent me a message after I shared my site link: *"What is it you actually do?"*

That's a bad sign for a portfolio site. jidonglab.com had daily AI news posts, a Projects tab buried below the fold, and Hero copy vague enough to describe any developer on the internet. The site existed. It just didn't introduce me.

**TL;DR**: Rebuilt the homepage as a portfolio business card. New `Capabilities.astro` component, Hero/About/Projects copy rewrite, bilingual i18n toggle fix, JSON-LD Person/WebSite/ProfilePage + GA4 + robots.txt — all shipped the same day. 33 sessions, 581 tool calls, 4 Codex cross-validation rounds.

## The Problem: One URL Should Be Enough

The repositioning goal was simple: a stranger who only has a URL should understand what Jidong builds within 3 seconds.

I kept the scope narrow from the start — fix Hero copy, add a "what I do" section, shift the About tone, tighten the nav. No touching the tech stack.

Claude Code surveyed `Hero.tsx`, `About.astro`, `Projects.tsx`, `index.astro`, and `home.css` in 12 Read calls, then made 11 Edit calls to reshape them. The session produced one new file: `src/components/home/Capabilities.astro`.

The component shows four capability cards — AI automation, full-stack development, dental ad ops, and build log authoring — with `data-ko`/`data-en` attributes for bilingual switching. A `.do-grid` CSS class handles the mobile single-column fallback.

Build passed. Type check passed. The session kept getting cut off by `max_turns` limits from the Hermes relay. That's why 33 sessions exist for what should have been 5–6.

## Codex Round 1: A Diff That Referenced a Phantom File

First Codex cross-validation result:

> `src/pages/index.astro` imports/uses `src/components/home/Capabilities.astro`, but the file is untracked. Do not leave the tracked diff non-self-contained.

`index.astro` was already importing `Capabilities.astro`, but the file itself wasn't in the commit. The `max_turns` interruption had cut the session before staging finished.

Adding the missing file also surfaced a copy problem in `Projects.tsx`. The section header said "Currently Running" but the list included projects still under development. Changed the framing to distinguish live from work-in-progress.

This is why cross-review catches things self-review doesn't. When you're implementing, you track intent. When an external model reads the diff cold, it reads state. The diff said "import from here" while the file didn't exist — not a subtle bug.

## Codex Round 2: Copy That Lies

The second round caught something more interesting.

> `Capabilities.astro`: "Every commit diff becomes a Korean/English build log." — This isn't true.

Not every commit gets a build log. This isn't a code bug — it's a factual error in copy. Builds pass, no type errors. Automated verification can't catch this.

Before and after:

- Korean: `"커밋 diff를 한국어·영어 빌드 로그로 매일 쌓는다."` → `"진행 중인 작업을 한국어·영어 빌드 로그로 꾸준히 남긴다."`
- English: `"Every commit diff becomes a Korean/English build log."` → `"Progress gets documented as bilingual build logs."`

Changed absolute claims ("every", "daily") to directional ones ("documented", "consistently"). The kind of correction that only happens because a reviewer read the copy with fresh eyes — not because a linter flagged it.

Why use an external model for copy validation? When you wrote the code, you know what you meant. Reading your own copy for factual accuracy is like proofreading your own writing — you see intent, not what's written. A separate model reading cold sees what's written. That's the gap.

## Codex Round 3: "Building Alone Together"

`Capabilities.astro` included the line `"혼자 같이 만든다."` — roughly "building alone together." The intent is clear: solo developer, AI as collaborator. But in Korean it reads as a contradiction. A native speaker stalls on it.

Replaced with:

- Korean: `"AI와 함께, 실제로 혼자 만든다."` ("With AI, but actually building alone.")
- English: `"Building alone, but with AI as co-pilot."`

Same idea. Reads clearly instead of creating a logic puzzle for the reader.

Codex Round 3 cumulative results: 0 code bugs, 2 copy factual errors, 1 contradictory sentence. All three builds passed. Copy verification is a legitimate use case for multi-model review that usually gets overlooked in favor of code-focused checks.

## "The Korean Copy Sounds Off"

Right after the redesign went live, feedback came in: "Looks good, but the Korean/English toggle and the Korean phrasing feel a bit off."

Two separate problems.

**First**: The `data-ko`/`data-en` language toggle script wasn't loading on the homepage at all. Pages using `Base.astro` had it. But `index.astro` uses its own standalone layout — the toggle script never loaded, so the site always showed English copy regardless of the `lang` value stored in localStorage.

**Second**: Some Korean copy was direct-translated from English sentence structure. It read fine in English but felt stiff in Korean.

The debugging session spent 13 Read + 3 Grep calls just getting oriented. The actual fixes happened in a second session: 4 files (`Hero.tsx`, `Capabilities.astro`, `Projects.tsx`, `ShipLog.astro`), 7 Read calls, 5 Edit calls. The i18n script was inlined into `index.astro`'s layout, and the Korean copy was rewritten from scratch rather than translated.

Separating exploration from implementation paid off here. Start editing before you understand the layout structure and you fix symptoms instead of causes. The cause: `index.astro` doesn't extend `Base.astro`, so it inherits none of its global scripts.

## Sitemap 404 and the SEO Infrastructure Nobody Notices Until It's Missing

Before adding anything new, I audited what was already broken.

An old bug surfaced immediately. `Base.astro` and `robots.txt` both referenced `/sitemap-index.xml` — but the actual Astro-generated route was `/sitemap.xml`. Every subpage on the site had a `<link rel="sitemap">` tag pointing to a 404. For how long? Unknown.

JSON-LD was also missing entirely. Without structured data, Google indexes a personal site with no context about who runs it or what it covers.

One session handled all of it:

- `src/components/Analytics.astro` (new) — Emits the GA4 snippet only when `PUBLIC_GA_MEASUREMENT_ID` is set. Missing env var doesn't break local builds.
- `src/pages/index.astro` — JSON-LD Person + WebSite + ProfilePage injected, OG tags strengthened.
- `src/layouts/Base.astro` — Sitemap path corrected `/sitemap-index.xml` → `/sitemap.xml`, Analytics component wired in.
- `public/robots.txt` (new) — Explicit allow/disallow rules for 13 AI crawler groups.
- `public/llms.txt` (new) — AEO entity context for LLM indexing.

Tool breakdown: 14 Read, 6 Bash, 6 Edit, 3 Grep, 3 Write.

## Codex Round 4: robots.txt Rule Conflict

The initial robots.txt pattern for AI crawlers looked like this:

```
User-agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /admin
```

Codex flagged a potential conflict: when `Allow: /` is present, subsequent `Disallow` rules may be ignored depending on how the crawler interprets rule precedence. The spec is ambiguous and implementations vary across crawlers.

Fix: Removed the blanket `Allow: /` from all 13 AI crawler blocks (GPTBot, ClaudeBot, PerplexityBot, and others). Each block now only has explicit `Disallow` rules for `/api/` and `/admin`. No ambiguity, clean precedence.

`robots.txt` looks simple but the spec permits conflicting rules with no canonical resolution behavior. The safest pattern: only write what you want to restrict; let default crawl behavior handle the rest.

## By the Numbers

33 sessions (fragmented by `max_turns` limits), 581 total tool calls.

| Tool | Count |
|------|-------|
| Bash | 251 |
| Read | 177 |
| Edit | 83 |
| Write | 23 |
| Other | 47 |

13 files modified, 13 files created. 4 Codex cross-validation rounds.

What Codex caught that automated tests couldn't:

- Untracked file referenced in a tracked diff
- Two factually false copy claims
- One grammatically contradictory sentence in Korean

A portfolio site has one job: when a stranger gets the URL, they should have a reason to reach out. Everything else is decoration.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
