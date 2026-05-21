---
title: "My Portfolio Said 'Every Commit' When It Meant 'Sometimes': Claude Code, 3 Codex Reviews, and Full SEO/AEO in One Day"
project: "portfolio-site"
date: 2026-05-21
lang: en
pair: "2026-05-21-portfolio-site-ko"
tags: [claude-code, portfolio, seo, aeo, redesign, codex]
description: "20 Claude Code sessions rebuilt jidonglab.com into a portfolio business card—with JSON-LD, llms.txt, AI crawler rules, and 3 Codex passes that caught 2 false copy claims."
---

A friend received `jidonglab.com` and replied: "So what do you actually do?"

That question ended the old homepage. If a portfolio page can't answer "who is this person and what do they do" in three seconds, it's not a portfolio — it's a maze. The redesign had one criterion: hand someone the URL and they immediately know. Like a business card.

**TL;DR** Rebuilt the homepage as a portfolio business card. New `Capabilities.astro` component, rewritten Hero/About/Projects copy, fixed Korean localization tone, and shipped full SEO/AEO infrastructure — 3 JSON-LD schemas, `llms.txt`, `robots.txt` with 13 AI crawler groups, GA4 — in the same day. Three Codex cross-review cycles caught 2 factual copy errors and 1 contradictory sentence. Zero code bugs across all three passes.

## The Brief

The redesign started from one prompt:

> "Redesign jidonglab.com so it works like a personal business card / portfolio sales page. If someone only receives this site URL, they should immediately understand what Jidong does and why they might work with him."

Before writing a line, Claude read the existing state: `Hero.tsx`, `About.astro`, `Projects.tsx`, `index.astro`, `home.css`. 12 Read calls. Then 11 Edit calls. Then a build and typecheck to confirm nothing broke.

The main new artifact: `src/components/home/Capabilities.astro`.

Four cards: automation pipelines, agent orchestration, dental ad operations, build logging. Bilingual (Korean + English) via `data-ko`/`data-en` attributes. Grid layout using `.do-grid`/`.do-card` classes with a single-column mobile fallback. The component names what I actually do rather than implying it through project names.

## When the Session Breaks Mid-Flight

The first real problem wasn't code — it was a workflow artifact. The session hit Hermes's `max_turns` limit mid-flight. `Capabilities.astro` got created as an untracked file. `index.astro` was already importing it. The commit diff was non-self-contained: apply it, get a broken import.

Codex caught this on cross-review pass #1:

> "`src/pages/index.astro` imports/uses `src/components/home/Capabilities.astro`, but the file is untracked. Do not leave the tracked diff non-self-contained."

Passing that review back to Claude: stage the missing file. While there, also fix a copy mismatch in `Projects.tsx` — the section header said "things currently running" but the list included projects still in development. Changed the header to cover both states.

This illustrates why cross-review catches things self-review doesn't. When you're implementing, you track intent. When an external model reads the diff cold, it reads state. The diff said "import from here" while the file didn't exist — not a subtle bug.

## "Every Commit Diff Becomes a Bilingual Build Log" Was a Lie

Cross-review pass #2 found a subtler error: a factual claim in `Capabilities.astro` that wasn't true.

The Writing card originally read:

```
EN: Every commit diff becomes a Korean/English build log.
KO: 커밋 diff를 한국어·영어 빌드 로그로 매일 쌓는다.
```

Codex flagged it: **blocking issue**. Not every commit produces a build log. Some build logs are written after a series of commits. Purely mechanical commits — dependency bumps, typo fixes — never generate one. The Korean version doubled down with "매일" (daily), which is also inaccurate.

This kind of error doesn't get caught in standard code review because it's not a logic bug — it's a fact error. The code compiles. The component renders correctly. But the sentence doesn't describe reality.

The fix:

```
EN: Progress gets documented as bilingual build logs.
KO: 진행 중인 작업을 한국어·영어 빌드 로그로 꾸준히 남긴다.
```

Absolute quantifiers ("every", "daily") became directional statements ("gets documented", "꾸준히" — consistently). The meaning survives; the overclaim doesn't.

Why use an external model for copy validation? When you wrote the code, you know what you meant. Reading your own copy for factual accuracy is like proofreading your own writing — you see intent, not what's written. A separate model reading cold sees what's written. That's the gap. **Whether phrasing matches reality** is a judgment that's easier to make when you didn't write the first draft.

## "Building Alone, Together" Doesn't Parse

Cross-review pass #3 caught a different kind of error: a self-contradicting sentence.

`Capabilities.astro` included: `"혼자 같이 만든다."` Literally: "building alone, together." The intent is clear — working solo but with AI as collaborator. In Korean, it reads as a logical contradiction. A native speaker stalls on it.

Claude rewrote it: `"AI와 함께, 실제로 혼자 만든다."` — "With AI, building alone in practice."

English aligned: `"Building alone, but with AI as co-pilot."`

Same concept. The meaning now lands on first read instead of making the reader do work.

Three Codex cross-review cycles, final tally: **0 code bugs, 2 factual copy errors, 1 contradictory sentence.** Build passed all three times. Copy verification is a legitimate use case for multi-model review that usually gets overlooked in favor of code-focused checks.

## "The Korean Copy Tone Is Off"

After the redesign, feedback arrived:

> "Looks good, but the language toggle feels broken and the Korean phrasing is off."

Two distinct problems were happening simultaneously.

**Language toggle not loading.** Sub-pages using `Base.astro` had the `data-ko`/`data-en` attribute toggle script. But `index.astro` uses its own independent layout — the toggle script never got injected. Bilingual attributes were in the DOM; nothing was reading them.

**Copy tone was too literal.** Some Korean was reverse-translated from English rather than written naturally in Korean. Professional-sounding in English, slightly stilted in Korean.

Fixing this took two sessions. The first was pure reconnaissance: 13 Reads + 3 Greps to map the layout structure, script injection points, and which copy needed work. No edits. The second session made the changes: `Hero.tsx`, `Capabilities.astro`, `Projects.tsx`, `ShipLog.astro`. 7 Reads, 5 Edits.

Separating exploration from implementation paid off here. Start editing before you understand the layout structure and you fix symptoms instead of the cause. The cause was that `index.astro` doesn't extend `Base.astro` — so it inherits none of `Base.astro`'s global scripts.

## The Sitemap That Was Pointing to 404

Shifting to SEO/AEO work, the first step was an audit of what was actually there.

**Finding #1:** `Base.astro` referenced `/sitemap-index.xml` as the sitemap path. The actual Astro sitemap route is `/sitemap.xml`. Every sub-page's `<link rel="sitemap">` was pointing to a 404. The sitemap existed; the reference was wrong.

**Finding #2:** No JSON-LD anywhere. Without structured data, a personal site surfaces in search results with zero context — no rich snippets, no entity recognition, no connection to a named person. Google can index the page; it can't tell what it's *about*.

One session handled everything:

**`src/components/Analytics.astro`** (new file) — gates the GA4 snippet behind `PUBLIC_GA_MEASUREMENT_ID`. If the env var isn't set, no `<script>` tag is emitted. Build doesn't fail; site just runs without analytics. This is the right pattern for optional third-party scripts: don't couple the build to credentials.

**`src/pages/index.astro`** — 3 JSON-LD schemas added to `<head>`:
- `Person` — name, job title, skills, linked social profiles
- `WebSite` — site name, URL, description
- `ProfilePage` — connects the page to the Person entity

Also strengthened OG tags: explicit `og:type`, `og:image`, `twitter:card`.

**`src/layouts/Base.astro`** — sitemap path corrected (`/sitemap-index.xml` → `/sitemap.xml`), Analytics component wired in.

**`public/robots.txt`** (new file) — explicit `Allow: /` for 13 AI crawler groups (GPTBot, ClaudeBot, Bingbot, Googlebot, PerplexityBot, and others), global `Disallow` for `/api/` and `/admin`.

**`public/llms.txt`** (new file) — AEO entity context. A plain-text file describing who Jidong is, what jidonglab.com covers, and which topics it's authoritative on. Helps LLMs build accurate context when indexing the site for AI-powered search.

Tool usage this session: 14 Reads, 6 Bash, 6 Edits, 3 Greps, 3 Writes.

## The robots.txt Trap

Codex flagged one more issue in `robots.txt`.

The original structure for AI crawler groups:

```
User-agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /admin
```

The problem: `Allow: /` in the same user-agent block as `Disallow: /api/` creates ambiguity. Different crawler implementations resolve rule precedence differently. Some honor the more-specific Disallow. Others see the broad Allow first and skip the Disallow entirely.

Safe fix: remove the explicit `Allow: /` from each AI crawler group (crawlers crawl by default if not blocked) and keep only the Disallow rules. Apply to all 13 groups explicitly.

`robots.txt` looks simple but the spec permits conflicting rules, and there's no canonical crawler behavior for resolving them. The safest pattern is additive: only write what you want to restrict; let default crawl behavior handle the rest.

## What Changed

**Modified:** `Hero.tsx`, `About.astro`, `Projects.tsx`, `ShipLog.astro`, `Topbar.astro`, `home.ts`, `index.astro`, `home.css`, `Base.astro`, `.env.example`

**New files:** `Capabilities.astro`, `Analytics.astro`, `public/robots.txt`, `public/llms.txt`

**Sessions:** 20 total (including fragments from Hermes max_turns splits)

**Codex cross-review cycles:** 3

The test for a portfolio page is whether a stranger who only has the URL has a reason to reach out. That's the bar. Today's work moved the site closer to clearing it.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
