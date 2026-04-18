---
title: "Fixing a Data Bug Hidden in 83 Uncommitted Files — 174 Tool Calls, 2 Sessions"
project: "portfolio-site"
date: 2026-04-18
lang: en
pair: "2026-04-18-portfolio-site-ko"
tags: [claude-code, debugging, automation, telegram]
description: "source.title held full article headlines instead of publisher names. Fixed 24 MD files in bulk, re-triggered a CANCELED Vercel deploy, and ran a second session entirely over Telegram MCP."
---

The article cards on spoonai.me were showing full headlines — `Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong` — right next to the date, where the publisher name (CNBC) was supposed to be. The component code was fine. The problem was in the data.

**TL;DR** `source.title` was being populated with article headlines instead of publisher names. Bulk-replaced 24 MD files via `sed`, updated the spec in two SKILL.md files, and pushed a clean commit out of a repo that had 83 uncommitted files sitting in it. Second session was fully remote via Telegram MCP — scaffolded a new project, searched for AI events, and published a blog post. 174 tool calls across two sessions.

## The Bug Was in the Frontmatter, Not the Component

`ArticleCard.tsx:148` renders `post.source.title` next to the date. The component itself was doing exactly what it should.

The culprit was a frontmatter field in `content/posts/2026-04-16-asml-q1-2026-ai-chip-guidance-raise-ko.md`:

```yaml
source:
  title: "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong"
  url: "https://www.cnbc.com/..."
```

The auto-generation script interpreted `source.title` as "the title associated with the source" — which is technically the article headline. But the intent was always the publisher name. Every MD file generated between April 15–17 had the same pattern. 24 files total.

This is what happens when a spec field has an ambiguous name and no example value. The script picked the most literal interpretation.

## The Fix: Update the Spec First, Then the Data

Running the backfill before updating the spec would be pointless — the next auto-generation run would recreate the exact same problem.

Two SKILL.md files needed updating:

- `~/spoonai-site/SKILL.md:527`
- `~/.claude/skills/spoonai-daily-briefing/SKILL.md:527`

Both now explicitly state: `source.title` is the **publisher name only** — CNBC, The Verge, TechCrunch. Not the article title.

Then the backfill: extract domain from `source.url`, map to known publisher names, run `sed` across all 24 files:

```
cnbc.com       → CNBC
theverge.com   → The Verge
techcrunch.com → TechCrunch
reuters.com    → Reuters
```

No manual edits. Verified a sample before staging.

## 83 Uncommitted Files Were Already Sitting There

`git status` came back much longer than expected. My 26 changed files were mixed in with 57 uncommitted changes left over from previous sessions:

- **Home UI overhaul**: `HomeContent.tsx` +523 lines, `ArticleCard.tsx` 293-line rewrite, `globals.css` +257 lines
- Header, Footer, Logo, About, Archive — all redesigned
- New admin authentication logic
- 3 new SNS poster scripts
- Image backfill for 18 older article MDs

83 files total. Around 1,700 lines of diff. Pushing everything together would bundle a targeted data fix with an unreviewed full UI redesign into one commit. Not useful for anyone reading git history later.

The move: stage only my 26 files explicitly.

```bash
git add SKILL.md content/posts/2026-04-1*.md
git commit -m "fix: replace source.title with publisher names (24 MDs)"
```

Commit `703f6fc` — 25 files, +26 −26. The other 57 stayed untouched on disk.

## Vercel Said CANCELED — Empty Commit Fixed It

After pushing, the Vercel deployment showed `CANCELED`. The build was dropped from the queue before it started — no error logs, no build output.

The fastest fix:

```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

Build started normally on the second attempt. Fix appeared on spoonai.me.

## Session 2: Running Claude Entirely Over Telegram

The second session never opened Claude Code directly. Messages went in via Telegram MCP, Claude executed them, results came back as notifications.

**Request 1:** "Create a new git-connected project for dental ad work in English."

After confirming the project name, Claude created `~/dentalad/` locally, initialized `github.com/jee599/dentalad` as a private repo, and pushed an initial scaffold: `clinics/`, `ads-research/`, `site/`, `templates/`, `docs/`. The Telegram MCP connection dropped once mid-run; after reconnect, Claude sent the completion notification again.

**Request 2:** "Search for Claude-related meetups or hackathons near Pangyo/Seoul with open registration."

16 WebSearch calls. Events on April 14 and 17 had already closed. No currently open local registrations. Returned 4 credible AI events with open registration instead: Snowflake Summit, AI Co-Scientist Challenge, Education Public Data Hackathon, and Meta Llama Academy @ Pangyo.

**Request 3:** "Write a blog post on the latest Claude design update — publish to DEV.to and spoonai.me."

Ran the `auto-publish` skill. Two files generated in one pass:
- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md`
- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md`

## Tool Call Breakdown

| Metric | Value |
|--------|-------|
| Sessions | 2 (1h + 19h apart) |
| Total tool calls | 174 |
| Bash | 79 |
| Read | 17 |
| WebSearch | 16 |
| WebFetch | 11 |
| Grep | 8 |
| Files modified | 2 |
| Files created | 5 |

Bash at 79 dominates. The bulk `sed` replacements across 24 files, repeated `git status` / `log` / `diff` cycles, Vercel MCP polling, and the dentalad repo initialization all ran as shell commands. WebSearch at 16 is entirely from the Pangyo event search.

## What This Session Reinforced

Auto-generated content drifts toward the most literal interpretation of every field name. `source.title` without a concrete example — "(publisher name: CNBC, TechCrunch, etc.)" — gets filled with article titles, because that's technically more specific. Specs need examples, not just field names.

Working in a repo with uncommitted changes from previous sessions requires deliberate staging. `git add .` in that state would have turned a surgical fix into an untraceable mixed commit. Explicit file paths on `git add` are the only reliable approach — or better yet, shorter commit cycles so the pile never builds up.

> Half the bugs are data bugs. The component code was correct. The frontmatter field had the wrong value.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
