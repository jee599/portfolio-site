---
title: "How Claude Sonnet Turns Raw Git Commits into Blog Posts: Inside the generate-build-log Pipeline"
project: "portfolio-site"
date: 2026-04-12
lang: en
pair: "2026-04-12-portfolio-site-ko"
tags: [claude-code, claude-api, automation, github-actions, content-pipeline]
description: "When 3+ commits accumulate, Claude Sonnet auto-generates a build log. How the pipeline works, why I moved from GitHub Actions cron to local launchd, and what broke."
---

Four consecutive commits reading `feat: build logs 2026-04-11 (2 posts, auto)` — same day, same message, four times. That's not a feature. That's a broken trigger. It's what prompted me to tear open `generate-build-log.yml` and audit the whole thing from scratch.

**TL;DR** When 3 or more commits accumulate in a tracked project, Claude Sonnet analyzes the commit data and auto-generates a build log in markdown. The pipeline moved from GitHub Actions cron to local launchd, and a `[skip-log]` pattern prevents infinite loops.

## What the Pipeline Actually Does

`generate-build-log.yml` reads `src/content/projects/*.yaml` to get the list of registered projects. For each project, it fetches commits from the GitHub repo that landed after the last build log was generated. Fewer than 3 commits? Skip. 3 or more? Pass the commit data to Claude Sonnet and write a markdown post.

The data structure going into Claude looks like this:

```json
{
  "project": "Saju Global",
  "slug": "saju_global",
  "date": "2026-04-12",
  "commits": [
    { "sha": "abc1234", "message": "feat: add zodiac compatibility content", "author": "jidong" }
  ],
  "stats": { "totalCommits": 15, "filesChanged": 42, "additions": 1200, "deletions": 80 },
  "changedFiles": ["src/lib/compatibility.ts", "src/pages/compat/[pair].astro"]
}
```

Commit hash, message, changed files, additions and deletions — that's it. No source code. Claude infers *how AI was used in this work* purely from commit messages and file patterns, then writes it up as a blog post.

## Why the System Prompt Is 160 Lines Long

This isn't "write me a blog post." The system prompt is 160 lines of detailed instructions.

One of the core directives:

> "The commit data below is **context**, not content. Don't write a commit changelog. Write an educational blog post about **how AI was used during this work** — what prompting techniques were applied, what tools and patterns proved effective."

Bad build log titles are listed explicitly as negative examples:

```
❌ "[Saju App] Add new feature + 8 more"
❌ "2026-03-09 saju app update"
✅ "The Prompt Pattern That Handled i18n Across 8 Languages at Once with Claude Code"
```

The output format is enforced too. Claude must write `<!-- META: {"title": "...", "slug": "kebab-case"} -->` on the first line so the pipeline can parse it. Frontmatter is assembled by the pipeline itself — not delegated to the model.

Model: `claude-sonnet-4-20250514`. Build logs aren't simple text generation — they require inferring intent and pattern from sparse commit data. Haiku doesn't have enough reasoning depth for this.

## The Trigger Bug That Caused Four Duplicate Posts

The original setup had both `push` and `schedule` triggers active simultaneously. When the pipeline auto-committed a new build log, that commit fired a `push` event — which re-triggered the workflow. The `[skip-log]` tag was supposed to prevent this, but `skipPatterns` filtering happened inside the pipeline logic, not at the GitHub Actions trigger level. So the loop ran freely.

The fix: remove the GitHub Actions cron entirely. The current `generate-build-log.yml` makes this explicit in the comments:

```yaml
on:
  workflow_dispatch:
  # push trigger removed — managed by local launchd cron
  # schedule removed — no longer auto-running from GitHub Actions
```

Now a local `launchd` job triggers `workflow_dispatch` on a schedule. There's an additional reason to prefer this: GitHub Actions disables scheduled workflows on repos with no recent activity. Local cron doesn't have that quirk.

## How a saju_global Build Log Gets Made

As of today (2026-04-12), the `saju_global` project has run 2,357 Claude Haiku API sessions. Each session: 0 tool calls, pure text generation. The job is filling 144 zodiac compatibility pairs × 8 languages = 1,152 content blocks.

Those sessions produce commits in the `saju_global` repo. Once the commit count crosses the threshold, `generate-build-log.yml` pulls that commit data and passes it to Claude Sonnet. Sonnet looks at the pattern — bulk multilingual content generation via Haiku — and writes the post that became `2026-04-12-saju_global-ko.md`.

The pipeline finds its own material and writes its own posts. It's a content flywheel that runs on git history.

## What Happens When the Claude API Fails

If the API key is missing or the call fails, a code-based fallback generates a minimal post:

```javascript
const typeLabels = {
  feat: 'New feature', fix: 'Bug fix',
  refactor: 'Code refactoring', chore: 'Maintenance',
};
logTitle = `[${title}] ${today} — ${typeLabels[dominantType]} + ${relevantCommits.length} more`;
```

Commits get bucketed by type and written as a flat list. The data is preserved, but it's not readable content. The quality gap between Claude-generated and fallback posts is large enough that the API key is effectively a hard requirement.

## What I'd Change

### 1. Structured Outputs Instead of Regex Parsing

Right now the pipeline forces Claude to write `<!-- META: {...} -->` in a custom format and parses it with regex. Using Anthropic's `tool_use` or Structured Outputs would return JSON directly:

```json
{
  "title": "Build log title",
  "slug": "build-log-slug",
  "body": "Markdown body..."
}
```

No parsing failures. No brittle regex.

### 2. Per-Project Thresholds

The 3-commit threshold is too low. A project like `saju_global` runs thousands of API calls that don't map cleanly to code commits. A project driven by API calls has a completely different commit pattern than one driven by feature development. Thresholds should be configurable per project in the YAML definition.

### 3. Auto-Generate English Versions

Right now only `-ko.md` gets auto-generated. English versions for DEV.to are manual. The same commit data can drive two parallel Claude calls — one in Korean, one in English. Two model calls, double the cost, but the content actually reaches English-speaking readers.

## What This Pipeline Taught Me

**Commit messages are richer than they look.** Claude Sonnet can reconstruct a coherent narrative about *how* work was done from nothing more than message strings and file paths. The key is a system prompt that redirects from "what happened" to "how AI was used."

**Trigger design determines pipeline stability.** The `push + schedule` combination is an obvious loop in hindsight, but it's easy to miss when building incrementally. Any pipeline that commits its own output needs the trigger to be external and isolated.

**The 3-commit threshold is a number that needs to match the project.** It's not a universal rule — it's a parameter that should reflect the commit velocity and nature of each tracked repo.

**Fallback preserves data, not value.** The fallback exists so nothing is lost when the API is unavailable. It isn't meant to produce content worth reading. Real value comes from the Sonnet-generated version.

<details>
<summary>Related files</summary>

`.github/workflows/generate-build-log.yml` — build log auto-generation workflow
`src/content/projects/*.yaml` — registered project definitions
`src/content/build-logs/` — generated build log markdown files

</details>

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
