---
title: "Tracking source.title: Bulk-Replacing 24 Article Cards + Escaping Vercel CANCELED"
project: "portfolio-site"
date: 2026-04-18
lang: en
pair: "2026-04-18-portfolio-site-ko"
tags: [claude-code, debugging, spoonai, deployment, vercel]
description: "A corrupted field in auto-generated frontmatter pushed full article titles into publisher slots. 77 tool calls: data fix, selective staging of 83 dirty files, and an empty-commit Vercel rescue."
---

Every article card on spoonai.me was showing something like `Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong` next to the date. That's supposed to be the publisher name — `CNBC`. Somewhere between the generation script and the markdown file, the `source.title` field swallowed the entire article headline.

**TL;DR** The auto-generation script was populating `source.title` with the raw article title instead of the publisher name. Fixed the spec in two SKILL.md files, bulk-replaced 24 `.md` files using domain-to-publisher mapping, then fought through a Vercel `CANCELED` deployment that blocked the fix from going live. 77 tool calls, one hour.

## The Component Was Fine. The Data Wasn't.

First instinct: check `ArticleCard.tsx`. Found it immediately at line `:148` — `post.source.title` rendered right beside the date. The component logic was correct. It was faithfully displaying exactly what was in the data.

Opened `content/posts/2026-04-16-asml-q1-2026-ai-chip-guidance-raise-ko.md`:

```yaml
source:
  title: "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong"
  url: "https://www.cnbc.com/..."
```

The field should have been `CNBC`. Instead it had the full headline. Checked a few more files from the same date range — every article generated between April 15 and April 17 had the same pattern. The generation script treated `source.title` as "title of the source article" rather than "name of the source publisher." An ambiguous field name, an ambiguous outcome.

## Fixing the Spec Before Fixing the Data

The schema fix had to happen first. If the script runs again before the files are corrected, new files will land with the same bug.

Two SKILL.md files needed updating:
- `~/spoonai-site/SKILL.md`
- `~/.claude/skills/spoonai-daily-briefing/SKILL.md`

Both now explicitly state: `source.title` is the **publisher name only** — `CNBC`, `The Verge`, `TechCrunch`. Not the article headline. Not a shortened version of the headline.

With that guardrail in place, moved to the backfill.

## Bulk Replacing 24 Files with Domain-to-Publisher Mapping

The mapping was straightforward: extract the domain from `source.url`, match against a known publisher list, overwrite `source.title`.

```
cnbc.com         → CNBC
theverge.com     → The Verge
techcrunch.com   → TechCrunch
reuters.com      → Reuters
bloomberg.com    → Bloomberg
...
```

Used Bash to walk the 24 affected files and `sed` to do the replacements. No need for a script — a loop over the file list with targeted substitutions was enough.

All 24 files updated. Verified the frontmatter in a sample of files before staging.

## 83 Uncommitted Changes Were Waiting in the Repo

`git status` returned 83 modified files. My changes accounted for 26 of them. The other 57 were accumulated work from previous sessions that never got committed:

- Home UI redesign (`HomeContent.tsx` +523 lines, `ArticleCard.tsx` 293-line rewrite)
- `globals.css` +257 lines
- Header, Footer, Logo components
- Admin authentication logic
- Three SNS poster scripts

Roughly 1,700 lines of diff across prior sessions.

Pushing everything together would mix the bug fix with unreviewed UI work. Rolling it back or bisecting it later would be a mess. Staged only the 26 files I touched:

```bash
git add SKILL.md content/posts/2026-04-1*.md
git commit -m "fix: source.title을 퍼블리셔명으로 교체 (24개 MD)"
```

Commit `703f6fc` — 25 files changed, +26 -26.

The other 57 files stayed unstaged. They'll get their own commit when that work is ready to ship.

## Vercel Returned CANCELED

Pushed. Checked the deployment dashboard. Status: `CANCELED`.

Used the `list_deployments` MCP tool to confirm — the build never started. It was canceled before hitting the queue. No error logs, no build output.

Root cause was unclear. The fastest fix: trigger a new deployment with an empty commit.

```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

This time the build started normally and the fix appeared on spoonai.me.

## Session Stats

1 hour. 77 tool calls.

Bash dominated at 40 calls — `git status`, `git log`, `git diff`, the `sed` loop across 24 files, and polling the Vercel MCP for deployment status. Actual file edits (the `Edit` tool) were 3. Everything else was observation and coordination.

| Tool | Calls |
|------|-------|
| Bash | 40 |
| Read | 10 |
| Grep | 7 |
| TaskUpdate | 6 |
| ToolSearch | 4 |
| Edit | 3 |

Files modified: 26. Files created: 0.

## What This Revealed

Auto-generated content degrades at schema boundaries. The `source.title` field name is ambiguous enough that a generation script will pick the most concrete available value — the article title — rather than the intended one — the publisher name. The fix isn't stricter parsing. It's a more precise spec. Adding `publisher name only (CNBC, The Verge, TechCrunch, etc.)` to the SKILL.md closes the gap.

On the Vercel side: `CANCELED` deployments with no error output are effectively a black box. The empty-commit redeploy is the fastest exit. Investigating further isn't worth it unless it happens consistently.

The more interesting problem was the 83-file pile. Selective staging is the right call when uncommitted work from earlier sessions is sitting in the repo — but the real fix is shorter commit cycles. Each logical change should land in its own commit before the context switches.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
