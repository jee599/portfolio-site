---
title: "8 Hours Chasing a Ghost: How Claude Code Found a GitHub Actions Bug in 3 Minutes"
project: "portfolio-site"
date: 2026-04-03
lang: en
pair: "2026-04-03-portfolio-site-ko"
tags: [claude-code, github-actions, devto, automation, debugging]
description: "Spent 8 hours hunting a missing DEV.to API key. The real culprit: a const lang double-declaration SyntaxError silently killing every GitHub Actions run."
---

I spent 8 hours debugging a problem that didn't exist.

**TL;DR** DEV.to auto-publishing was broken not because of a missing API key, but because of a `const lang` double-declaration `SyntaxError` in the GitHub Actions workflow. 8 hours on the wrong trail, 3 minutes to actually fix it.

## The Prompt That Started 8 Hours of Pain

The initial prompt was simple enough.

```
Publish the two posts in blog-factory/devto/ to DEV.to via the API.
Find the API key in env files or config. If it's not there, report back.
```

Claude launched four parallel tasks immediately: find scripts referencing DEV.to, find env files, find JSON config referencing DEV.to, find blog publishing scripts. 28 Bash calls, 2 Reads, 1 Glob. Every location came up empty:

- `~/.devto`, `~/.config/devto` — nothing
- `~/.env.local` — only `ANTHROPIC_API_KEY`
- Project `.env*` files — nothing
- macOS Keychain — nothing
- Environment variables — nothing

The `DEVTO_API_KEY` did exist as a GitHub Secret. But GitHub Secrets are write-only — you can't read them via CLI. Claude kept landing on the same conclusion: "Paste the API key and I'll publish immediately."

Same conclusion, twice. The session hit 31 tool calls going in circles.

## The Wrong Frame Was the Whole Problem

Changing the frame changed everything.

Instead of asking Claude to publish directly, I redirected to the workflow layer:

```
Read .github/workflows/publish-to-devto.yml and figure out
what triggers it. If the files aren't on main, merge them or
push them directly.
```

Claude read the workflow file and immediately spotted the bug.

```javascript
// Same scope, declared twice
const lang = file.match(/-ko\.md$/) ? 'ko' : 'en';
// ... more code ...
const lang = frontmatter.lang || effectiveLang; // SyntaxError!
```

`const lang` was declared twice in the same scope. Every single workflow run was failing with a `SyntaxError` before it could do anything. The API key was sitting in GitHub Secrets perfectly intact — the workflow just never ran long enough to use it.

There was a second issue too: the EN files were only in `blog-factory/devto/`, not in `src/content/blog/` where the workflow was looking. Two bugs, one read of a YAML file.

## 3 Minutes to Fix What 8 Hours Couldn't

```
1. Fix the const lang double-declaration → rename to effectiveLang
2. Add the 2 EN files to src/content/blog/ and push to main
```

1 Edit call, 14 Bash calls, 2 Reads. The actual code change was one line:

```javascript
// Before
const lang = frontmatter.lang || effectiveLang;

// After
const effectiveLang = frontmatter.lang || detectedLang;
```

After pushing, the workflow triggered automatically. The Claude Agent SDK post published successfully. The Harness CI/CD post hit a 429 rate limit on the first run, but a manual re-trigger published both posts.

## Cover Image Cleanup (A Small Side Quest)

Before publishing, both files in `blog-factory/devto/` had `cover_image` fields pointing to R2 URLs and hero image tags in the body — but the actual images didn't exist in R2. Had to strip them.

```
Remove cover_image R2 URLs (both files)
Remove body ![...] hero image tags and captions (both files)
```

2 Edit calls. Done.

## What This Tells You About Claude Code

**Parallel search is fast, but fast in the wrong direction is worse than slow.** Claude ran 4 concurrent tasks for the API key search and converged on a conclusion quickly. The problem: the premise was wrong. "Key not found" wasn't the real issue, so every fast iteration just confirmed a false hypothesis.

**Prompt abstraction changes what Claude sees.** Switching from "publish via API key" to "understand how the workflow is supposed to publish this" immediately surfaced the actual bug. The same Claude, the same codebase — different prompt level, different result.

**Workflow debugging is one of Claude's strongest moves.** It read the entire `publish-to-devto.yml` in one shot and caught the double-declaration without scrolling back and forth. A human reading that file would have spent 10 minutes mentally tracking variable scope. Claude did it in one pass.

Total tool calls across the session: 45 Bash, 6 Read, 3 Edit, 3 Glob. The majority were spent searching for a key that was never missing. The actual fix was a fraction of that.

The lesson isn't "Claude should have found the bug sooner." It's that the prompt defined the search space, and the search space was wrong. The 8 hours weren't a Claude failure — they were a framing failure.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
