---
title: "Fixing a Data Bug in 24 Files While Running 3 Projects via Telegram — Claude Code Build Log"
project: "portfolio-site"
date: 2026-04-19
lang: en
pair: "2026-04-19-portfolio-site-ko"
tags: [claude-code, debugging, telegram, automation, spoonai]
description: "How a wrong field value in 24 markdown files caused a UI bug — bulk fix with sed, selective staging, and running three concurrent projects via Telegram MCP."
---

Article titles were showing up where publisher names should be. Not a component bug. A data bug — in 24 separate markdown files.

**TL;DR** `source.title` was storing the full article headline instead of the publisher name (e.g., `CNBC`). Fixed by bulk-replacing all 24 affected files based on domain and adding explicit examples to the spec. Session two ran entirely through Telegram MCP — no Claude Code terminal open — and handled repo creation, hackathon research, and a blog publish across three projects. 174 tool calls total.

## The UI Was Fine. The Data Wasn't.

`ArticleCard.tsx:148` renders `post.source.title` next to the article date. The component logic was correct. The problem was upstream.

```yaml
# content/posts/2026-04-16-asml-q1-2026-ai-chip-guidance-raise-ko.md
source:
  title: "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong"
  url: "https://www.cnbc.com/..."
```

`source.title` should have been `CNBC`. Instead, it held the entire article headline. The auto-generation script had misread the field's intent — the spec said "title" without clarifying what kind. Between April 15–17, every generated file followed the same wrong pattern. 24 files total.

The fix went in two directions. First, I updated the SKILL.md spec with an explicit example and a prohibition:

```
source.title: "CNBC"  # publisher name only (CNBC, The Verge, TechCrunch, etc). Article headlines are not allowed here.
```

Then I bulk-replaced all 24 files using domain-to-publisher mappings:

```
cnbc.com       → CNBC
theverge.com   → The Verge
techcrunch.com → TechCrunch
reuters.com    → Reuters
```

Commit `703f6fc` — 25 files, +26 -26.

## 83 Uncommitted Files and Selective Staging

`git status` came back much longer than expected. My 26 changed files were mixed in with 57 changes from earlier sessions sitting unstaged.

The uncommitted pile included:
- Major home UI overhaul: `HomeContent.tsx` +523 lines, `ArticleCard.tsx` 293-line rewrite, `globals.css` +257 lines
- Header/Footer/Logo/About/Archive redesigns
- New admin auth logic
- 3 new SNS poster scripts
- Backfill images for 18 older article markdown files

~1,700 lines of diff total. Running `git push` here would merge my fix with unrelated in-progress work into one commit. I staged only my 26 files by naming them explicitly:

```bash
git add SKILL.md content/posts/2026-04-1*.md
git commit -m "fix: replace source.title with publisher name (24 MD files)"
```

The other 57 stayed untouched.

## Vercel CANCELED — Empty Commit as a Redeploy Trigger

Right after the push, the Vercel deployment status was `CANCELED` — dropped from the build queue. The fix is simple:

```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

Build went through on the second attempt. Empty commits are a reliable way to kick off a deploy without touching code.

## Three Tasks Over Telegram, No Terminal Open

The entire second session ran through Telegram MCP. I never opened a Claude Code terminal. The setup: send a message on Telegram, Claude executes the task, replies with the result.

**New `dentalad` repo:** The request was "create a new git-connected project for dental ad work in English." After confirming the project name, Claude created `~/dentalad/` locally, initialized a private `github.com/jee599/dentalad` repo, and pushed an initial scaffold. Directory structure: `clinics/`, `ads-research/`, `site/`, `templates/`, `docs/`. The Telegram MCP connection dropped once mid-task and re-sent the completion notification after reconnecting.

**Pangyo hackathon search:** 16 WebSearch calls. The April 14 and 17 events had already ended with no open registration windows. Claude returned four alternative AI hackathons with active registration instead.

**Claude design blog post:** Published via the `auto-publish` skill to spoonai.me (Korean) and DEV.to (English) simultaneously. Files generated:
- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md`
- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md`

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

Bash at 79 calls (45% of total) breaks down as: `sed` for bulk MD edits, repeated `git` commands, Vercel MCP polling, and `dentalad` repo initialization. WebSearch at 16 is entirely from the hackathon research task.

## Specs Need Examples, Not Just Field Names

Auto-generated content degrades in proportion to how ambiguous the spec is. If `source.title` is described as just "title" with no example, a script will default to the most concrete thing it can find — the article headline. Field descriptions need explicit examples *and* explicit prohibitions: `"publisher name only — CNBC, The Verge, TechCrunch"` leaves no room for misinterpretation.

When there's a pile of uncommitted changes in the repo, scope your staging by filename rather than reaching for `git add .`. The difference between `git add .` and `git add SKILL.md content/posts/2026-04-1*.md` is the difference between a clean commit history and a mess.

> Half of UI bugs are data problems. The component was fine. The frontmatter field had the wrong value.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
