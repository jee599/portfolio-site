---
title: "Default Language Switch + 3-Platform Auto-Publish: 336 Tool Calls, 3 Sessions"
project: "portfolio-site"
date: 2026-03-25
lang: en
pair: "2026-03-25-portfolio-site-ko"
tags: [claude-code, i18n, auto-publish, devto, hashnode, astro]
description: "One hardcoded var lang = 'ko' broke the translation toggle on an English site. Fixing it took 50 tool calls. Here's what 336 tool calls across 3 Claude Code sessions looks like."
---

336 tool calls. 3 sessions. One `var lang = 'ko'` buried in `Base.astro` was the source of everything.

**TL;DR**: Session 1 fixed the default language and cleaned up English copy across the entire site (50 tool calls). Session 2 removed Naver from the auto-publish skill and added Hashnode, completing a 3-platform pipeline (90 tool calls). Session 3 rounded out the rest. Across all three: 149 Bash calls, 25 Agent delegations, 12 files modified, 0 new files created.

## How "the toggle is broken" cascaded into a full pipeline rebuild

Session 1 started with two words: "portfolio site."

Claude Code ran a brainstorming skill first — assessed the current stack (Astro 4 + React + Tailwind, Cloudflare Pages, toss.tech-style design), confirmed it was a live site, then waited. The second prompt locked in the scope:

> "The translation button doesn't quite work. The site should be English-first, so English needs to be the default everywhere."

Opening `Base.astro` surfaced three problems at once: `<html lang="ko">` in the HTML declaration, `var lang = 'ko'` as the JavaScript default, and a toggle button that displayed the wrong label for its current state. On an English-first site, English should load by default and the toggle should show "KO" — the language you're switching *to*, not the one you're already on.

The actual fix was three lines. But verifying it required crawling every element with `data-ko`/`data-en` attributes to confirm English was the visible default across all of them. That verification is what drove 13 Reads, 12 Edits, and 12 Bash calls across `Base.astro`, `PostLayout.astro`, and `blog/[slug].astro`.

One prompt then kicked off a quality pass:

> "Check if all English translations are correct, smooth, no typos"

That triggered 8 Agent calls. Claude Code swept the entire site, found awkward phrasings left over from the original Korean copy, and cleaned them up — faster than clicking through every page manually. Total: 24 minutes, 50 tool calls.

## Naver was in the auto-publish skill. It shouldn't have been.

Session 2 opened with a question about an existing skill:

> "Is there a skill for writing about specific topics to jidonglab / devto?"

The `auto-publish` skill existed. But its target list was spoonai.me + DEV.to + Naver, and Naver was no longer in the plan. The follow-up prompt:

> "Remove the Naver parts from that skill"

`SKILL.md` showed that Agent 3 was "Naver Korean HTML generation." Naver-related logic was scattered in four places: Phase 4 (publishing), Phase 5 (queue checks), series handling rules, and one of six reference files (`naver-seo-rules.md`). Surgical removal took 23 Edit calls — one for each section, not a bulk find-and-replace that could break surrounding logic.

Then the publishing targets were redefined in a single line:

```
jidonglab.com as canonical, then spoonai.me / hashnode / dev.to
```

Three platforms, one canonical domain. The skill read this directly and rebuilt the pipeline around it. When the Hashnode API token came in mid-conversation, the skill read it, saved it to config, and updated `hashnode_blog/.github/scripts/publish-to-hashnode.mjs` without being explicitly told to. Then it generated articles on three Claude-related topics and published to all three platforms simultaneously. 45 minutes, 90 tool calls.

## Why canonical_url is the whole point

Every article published to DEV.to and Hashnode includes `canonical_url` pointing back to `jidonglab.com`. It doesn't matter which platform Google indexes first — the authoritative source stays at jidonglab.com. Duplicate content penalties are avoided. Domain authority flows back to the original site instead of splitting across three domains.

This is standard SEO practice, but it requires the automation to handle it consistently. Doing it manually across every post is error-prone. The skill enforces it by default.

One friction point: fetching the Hashnode publication ID via API failed due to a permissions issue. The prompt:

> "What's a publication ID? Just figure it out"

Claude Code found a workaround independently — no further instructions needed. This delegation pattern matters. When you give Claude Code room to find a solution rather than prescribing one, it often finds a faster path than you would have specified.

## Tool call distributions tell you what each session was actually doing

The three sessions had visibly different tool call patterns, which reflects what kind of work was happening in each.

Session 1 was Read/Edit-heavy. The approach: read the existing code thoroughly before touching anything. 13 Read calls, 12 Edit calls. Bash appeared only for build verification and deployment.

Session 2 was Bash-dominant: 37 Bash calls. The 23 Edit calls were for the skill file itself, but most of the session was shell execution — Hashnode API testing, publish verification, config writes, and 7 WebSearch calls to gather the latest Claude news for the test articles.

Session 3: Bash 100, Edit 33, Read 32. Hover animation iterations and Vercel deployment troubleshooting inflated the counts. Agent ran 13 times for security audit and reference improvements in parallel.

Across all 336 tool calls, Bash was the most frequent at 149 (44%). More time went into execution and verification than writing code.

## The prompts that did the work

Two prompts stand out for how much output they produced relative to their length.

**Delegating the translation review:**

```
Check if all English translations are correct, smooth, no typos
```

No file paths, no instructions about how to check. Claude Code dispatched agents to crawl the entire site, compare `data-ko`/`data-en` pairs, and fix awkward phrasing. 8 Agent calls from one sentence.

**Defining the new pipeline:**

```
jidonglab.com as canonical, then spoonai.me / hashnode / dev.to
```

Three platforms separated by slashes. One canonical domain. The skill parsed this line directly and rebuilt the publishing pipeline. The less you prescribe the implementation, the more Claude Code can optimize for what actually makes sense given the existing code.

## What actually changed

The default language fix touched `Base.astro`, `PostLayout.astro`, and `blog/[slug].astro`. Three line changes, but verification required checking every `data-ko`/`data-en` element across the site.

The auto-publish skill dropped Naver, added Hashnode, and established `jidonglab.com` as the canonical base. The 3-platform pipeline (spoonai.me + DEV.to + Hashnode) was live by end of session.

12 files modified total. 0 new files created. New functionality came from changing existing code, not layering on top of it. 25 Agent delegations handled translation review, security audit, and reference improvements without manual intervention — tasks that would have been context-switching overhead if done by hand.

The pattern across all three sessions: short prompts with clear intent, delegation of verification to agents, and trusting Claude Code to find solutions when the "how" isn't specified.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
