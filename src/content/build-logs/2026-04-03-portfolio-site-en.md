---
title: "8 Hours Chasing the Wrong Bug: How Claude Code Found a SyntaxError in 3 Minutes"
project: "portfolio-site"
date: 2026-04-03
lang: en
pair: "2026-04-03-portfolio-site-ko"
tags: [claude-code, github-actions, devto, automation, debugging]
description: "Spent 8 hours hunting a missing DEV.to API key. The real bug was a duplicate const declaration in GitHub Actions. Claude Code fixed it in 3 minutes."
---

I spent 8 hours looking for an API key that was never missing.

**TL;DR** DEV.to auto-publishing was failing because of a `SyntaxError` — a duplicate `const lang` declaration inside a GitHub Actions workflow. The API key was in GitHub Secrets all along. 8 hours on the wrong trail, 3 minutes to fix the actual bug with Claude Code.

## The Wrong Starting Point

The prompt seemed straightforward enough.

```
Publish the two posts in blog-factory/devto/ to DEV.to via API.
Look for the API key in env vars or config files. Report back if you can't find it.
```

Claude fanned out 4 parallel tasks immediately: search for scripts referencing DEV.to, search for env files, search for JSON files with DEV.to references, search for publishing scripts. 28 Bash calls, 2 Reads, 1 Glob. The places it checked:

- `~/.devto`, `~/.config/devto` — not found
- `~/.env.local` — only `ANTHROPIC_API_KEY`
- `.env*` files in the project — not found
- macOS Keychain — not found
- Environment variables — not found

`DEVTO_API_KEY` existed in GitHub Secrets. But Secrets are write-only — you can't read the value via CLI. Claude kept arriving at the same conclusion: "paste the API key and I'll publish immediately."

That same session burned 31 tool calls reaching the same dead end. A duplicate session reached the exact same conclusion.

## The Question That Changed Everything

Instead of continuing to hunt for the key, the prompt shifted direction.

```
Check the .github/workflows/publish-to-devto.yml workflow.
Figure out when it triggers.
If the files aren't on main, merge or push them directly.
```

The moment Claude read the workflow file, it found the bug.

```javascript
// Inside the workflow — same scope, declared twice
const lang = file.match(/-ko\.md$/) ? 'ko' : 'en';
// ... some code in between ...
const lang = frontmatter.lang || effectiveLang; // SyntaxError!
```

`const lang` was declared twice in the same scope. Every single workflow run had been failing with a `SyntaxError` before it could even attempt to publish anything. The API key was sitting in GitHub Secrets the whole time — the workflow just never ran far enough to use it.

A second issue turned up at the same time: the EN post files only existed in `blog-factory/devto/`, not in `src/content/blog/` where the workflow was looking. Even with the syntax error fixed, the files wouldn't have been found.

## The 3-Minute Fix

```
1. Fix the duplicate const lang → rename to effectiveLang
2. Add the 2 EN files to src/content/blog/ and push to main
```

1 Edit call, 14 Bash calls, 2 Reads. The actual code change was a single line.

```javascript
// Before
const lang = frontmatter.lang || effectiveLang;

// After
const effectiveLang = frontmatter.lang || detectedLang;
```

After the push, the workflow triggered automatically. The Claude Agent SDK post published successfully. The Harness CI/CD post hit a 429 rate limit on the first run, but a manual re-run published both posts.

## Cleaning Up Cover Images

Before publishing, there was one more cleanup step. The `blog-factory/devto/` files had `cover_image` fields pointing to R2 URLs and `![...]` image tags in the body — but the images didn't actually exist in R2. They had to come out before publishing.

```
Remove cover_image R2 URLs (both files)
Remove body ![...] hero image tags + captions (both files)
```

2 Edit calls. Done.

## What This Tells Us About Claude Code

**Parallel search is fast — but if the direction is wrong, speed makes it worse.** Claude fired off 4 parallel tasks simultaneously and reached a conclusion quickly. The problem was that the conclusion was built on a false premise. "The API key is missing" wasn't the actual issue, so no amount of fast parallel searching was going to help.

**Prompt abstraction level determines what Claude can see.** Switching from "publish directly with the API key" to "figure out how the GitHub Actions workflow is supposed to work" immediately surfaced the real bug. Same codebase, same Claude, completely different result.

**Claude is fast at workflow debugging because it reads the whole file at once.** It parsed `publish-to-devto.yml` in a single read and spotted the duplicate declaration immediately. A human scanning the same file would've needed several passes and probably missed it the first time.

Total tool usage across the session: Bash 45, Read 6, Edit 3, Glob 3. Most of that went into the API key hunt that turned out to be unnecessary. The actual fix used a fraction of it.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
