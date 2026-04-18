---
title: "174 Tool Calls: Fixing a Data Bug Across 83 Uncommitted Files, Then Running Session 2 via Telegram"
project: "portfolio-site"
date: 2026-04-18
lang: en
pair: "2026-04-18-portfolio-site-ko"
tags: [claude-code, debugging, automation, telegram]
description: "A wrong field in 24 auto-generated markdown files put article titles where publisher names should be. Fixed with sed. Then ran an entire second session through Telegram MCP — no IDE open."
---

Every article card on spoonai.me was displaying something like `Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong` next to the publication date. That slot is supposed to say `CNBC`.

**TL;DR** `source.title` had full article headlines instead of publisher names — an ambiguous field name that the auto-generation script filled with the most concrete value available. Bulk-replaced 24 markdown files with `sed`, updated the spec in two SKILL.md files, rescued a `CANCELED` Vercel deployment with an empty commit. Second session ran entirely through Telegram MCP: scaffolded a new git repo, ran 16 web searches for local AI events, published two blog posts — without touching Claude Code once. 174 tool calls across two sessions.

## The Component Was Fine. The Frontmatter Wasn't.

First stop: `ArticleCard.tsx`. Found it at line `:148` — `post.source.title` rendered next to the date. The component logic was correct. It was faithfully displaying exactly what was in the data.

Opened `content/posts/2026-04-16-asml-q1-2026-ai-chip-guidance-raise-ko.md`:

```yaml
source:
  title: "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong"
  url: "https://www.cnbc.com/..."
```

`source.title` should have been `CNBC`. Checked a few more files in the same date range — every article generated between April 15 and April 17 had the same pattern. The generation script interpreted `source.title` as "title of the source article" rather than "name of the source publication." 24 files, same bug.

## Fix the Spec First, Then Fix the Data

Running the backfill before updating the spec would be pointless — the next auto-generation run would recreate the exact same problem. Two SKILL.md files needed updating:

- `~/spoonai-site/SKILL.md:527`
- `~/.claude/skills/spoonai-daily-briefing/SKILL.md:527`

Both now explicitly state: `source.title` is the **publisher name only** — `CNBC`, `The Verge`, `TechCrunch`. Not the article title. Not a shortened headline. Publisher name.

Then the backfill: extract domain from `source.url`, map to known publisher names, overwrite `source.title` via `sed`:

```
cnbc.com       → CNBC
theverge.com   → The Verge
techcrunch.com → TechCrunch
reuters.com    → Reuters
```

All 24 files updated. Verified a sample before staging.

## 83 Uncommitted Files Were Already Sitting There

`git status` came back much longer than expected. My 26 changed files were mixed in with 57 uncommitted changes from previous sessions that had never been committed:

- **Home UI overhaul**: `HomeContent.tsx` +523 lines, `ArticleCard.tsx` rewritten at 293 lines, `globals.css` +257 lines
- Header, Footer, Logo, About, Archive — all redesigned
- New admin authentication logic
- 3 new SNS poster scripts
- Image backfill for 18 older articles

83 files total. Around 1,700 lines of diff. Pushing everything together would bundle a targeted data fix with an unreviewed full UI redesign into one commit. Staged only the files I had touched:

```bash
git add SKILL.md content/posts/2026-04-1*.md
git commit -m "fix: source.title을 퍼블리셔명으로 교체 (24개 MD)"
```

Commit `703f6fc` — 25 files, +26 -26. The other 57 stayed unstaged.

## Vercel Returned CANCELED

Pushed. Deployment dashboard showed `CANCELED`. The build was dropped from the queue before it started — no error logs, no build output.

The fastest fix: trigger a new build with an empty commit.

```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

Build started normally. Fix appeared on spoonai.me.

## Session 2: Telegram MCP as the Interface

The second session never opened Claude Code. Messages went in via Telegram, Claude executed them, results came back as notifications.

**Request 1:** "Create a new git-connected project for the dental ad work."

After confirming the project name, Claude created `~/dentalad/` locally, initialized `github.com/jee599/dentalad` as a private repo, and pushed an initial scaffold with directories: `clinics/`, `ads-research/`, `site/`, `templates/`, `docs/`. The Telegram MCP connection dropped once mid-run; after reconnect, Claude sent the completion notification again.

**Request 2:** "Search for Claude-related meetups or hackathons near Pangyo / Seoul with open registration."

16 WebSearch calls. Events on April 14 and 17 were already over. No currently open local registrations. Claude surfaced 4 reputable AI events with open registration instead: Snowflake Summit, AI Co-Scientist Challenge, a public education data hackathon, and Meta Llama Academy @ Pangyo.

**Request 3:** "Write a blog post on the latest Claude design update — publish to Dev.to and spoonai.me."

Ran the `auto-publish` skill. Two files generated in one pass:
- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md`
- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md`

## Numbers

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

Bash at 79 is the clear outlier. `sed` across 24 files, repeated `git status` / `log` / `diff`, Vercel MCP polling, repo initialization — all shell work. WebSearch at 16 is the Pangyo event search. Actual file edits were a small fraction of the total.

## What This Reveals

Auto-generated content degrades at schema boundaries. `source.title` is ambiguous enough that a generation script will fill it with the most concrete available value — the article headline — rather than the intended one. The fix isn't stricter validation. It's a more precise spec. `publisher name only (CNBC, The Verge, TechCrunch, etc.)` closes the gap.

Working in a repo with uncommitted changes from previous sessions requires explicit file-level staging. `git add .` in that state would have turned a surgical fix into an untraceable mixed commit. The real fix is shorter commit cycles — each logical unit should ship before context switches.

> Half of frontend bugs live in the data layer. The component rendered exactly what it was told. The wrong value was in the frontmatter.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
