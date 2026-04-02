---
title: "8 Hours Hunting an API Key That Wasn't the Problem: Fixing a GitHub Actions Bug with Claude Code in 3 Minutes"
project: "portfolio-site"
date: 2026-04-03
lang: en
pair: "2026-04-03-portfolio-site-ko"
tags: [claude-code, github-actions, devto, automation, debugging]
description: "Spent 8 hours chasing a missing DEV.to API key. The real culprit was a duplicate `const lang` declaration causing a SyntaxError in GitHub Actions. Fixed in 3 minutes."
---

I spent 8 hours hunting for an API key that was never missing.

**TL;DR** — DEV.to auto-publishing was broken because of a `SyntaxError` in a GitHub Actions workflow script: `const lang` was declared twice in the same scope. The API key was sitting in GitHub Secrets the whole time. 8 hours on the wrong problem, 3 minutes on the fix.

## The Prompt That Started It All

The original task was simple enough:

```
Publish the two posts in blog-factory/devto/ to DEV.to via their API.
Find the API key in env vars or config files. Report back if it's not there.
```

Claude launched 4 parallel tasks immediately: scan for scripts referencing DEV.to, find env files, find JSON configs with DEV.to references, find blog publishing scripts. 28 Bash calls, 2 Reads, 1 Glob.

Here's the full list of places Claude checked:

- `~/.devto`, `~/.config/devto` — nothing
- `~/.env.local` — only `ANTHROPIC_API_KEY`
- All `.env*` files in the project — nothing
- macOS Keychain — nothing
- Shell environment variables — nothing

The key did exist — as `DEVTO_API_KEY` in GitHub Secrets. But GitHub Secrets are write-only. You can't read them from the CLI. So Claude kept reaching the same conclusion: "paste your API key and I'll publish immediately."

The same session ran 31 tool calls and landed on the exact same answer. Then a duplicate session ran through the same motions again.

## 31 Tool Calls Chasing the Wrong Lead

This is where the parallel search pattern backfired. Claude is fast — four independent searches firing simultaneously, collapsing hours of manual scanning into seconds. But fast execution on a wrong premise isn't efficiency. It's just failing faster.

The assumption was: *something is missing*. The actual problem was: *something is broken*.

Both feel like "why isn't this working" from the outside, but they need completely different debugging strategies. I was stuck in key-hunting mode when I should have been in workflow-debugging mode.

After the second session hit the same wall, I changed the question.

## The Prompt That Actually Found the Bug

```
Check the .github/workflows/publish-to-devto.yml workflow.
Understand what conditions trigger it.
If the files aren't on main, merge them or add them directly and push.
```

Claude read the workflow file and found the bug immediately.

```javascript
// Inside the workflow script — same scope, declared twice
const lang = file.match(/-ko\.md$/) ? 'ko' : 'en';

// ... more code ...

const lang = frontmatter.lang || effectiveLang; // SyntaxError!
```

`const lang` declared twice in the same block. Every single workflow run was failing with a `SyntaxError` before it could do anything. The API key was fine. The workflow never ran.

There was a second issue too: the EN files lived in `blog-factory/devto/`, but the workflow scanned `src/content/blog/`. Even after fixing the syntax error, the workflow would have found nothing to publish.

## The 3-Minute Fix

```
1. Fix the duplicate const lang → rename to effectiveLang
2. Move the 2 EN files to src/content/blog/ and push to main
```

1 Edit call, 14 Bash calls, 2 Reads. The actual code change was one line:

```javascript
// Before
const lang = frontmatter.lang || effectiveLang;

// After
const effectiveLang = frontmatter.lang || detectedLang;
```

After the push, the workflow triggered automatically. The Claude Agent SDK post published successfully. The Harness CI/CD post hit a 429 rate limit on the first run, but a manual rerun got both posts live.

## Cleaning Up Cover Images

Before publishing, there was one more task. Both files in `blog-factory/devto/` had `cover_image` fields pointing to R2 URLs, plus hero image `![...]` tags in the body — both referencing images that didn't actually exist in R2.

```
Remove cover_image R2 URLs (both files)
Remove body hero image tags + captions (both files)
```

2 Edit calls. Done.

## What This Debugging Session Actually Teaches

**Parallel search is fast, but direction is everything.** Claude ran 4 simultaneous searches and returned results in seconds. Impressive. But all four searches were scoped to the wrong hypothesis. Speed without direction burned 8 hours.

**The prompt level determines the problem surface.** "Publish via the API" narrows Claude to looking for credentials. "Understand the workflow that handles publishing" opens the whole execution path. One prompt finds a missing key. The other finds a broken script. Same goal, completely different debugging depth.

**Claude reads workflow files unusually well.** The entire `publish-to-devto.yml` lands in context at once. A human would scroll past the first `const lang`, read more code, scroll back — easy to miss. Claude flags the duplicate declaration on the first pass because it holds the whole file in scope simultaneously. For workflow debugging specifically, this is a real advantage.

Total tool usage across the session: Bash ×45, Read ×6, Edit ×3, Glob ×3. Most of that was spent looking for a key that was never the problem.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
