---
title: "11 Sessions, 186 Tool Calls to Publish 2 Blog Posts — What Claude Code Actually Debugged"
project: "portfolio-site"
date: 2026-04-01
lang: en
pair: "2026-04-01-portfolio-site-ko"
tags: [claude-code, github-actions, devto, automation, worktree, debugging]
description: "Publishing 2 posts to DEV.to was supposed to take 10 minutes. It took 11 Claude Code sessions. Here's the silent SyntaxError and worktree trap that caused it."
---

Publishing two English posts to DEV.to. Estimated time: 10 minutes. Actual: 11 sessions, 186 tool calls. The root causes were embarrassingly simple — files stranded on the wrong branch, and a workflow that had been silently broken from the moment it was created.

**TL;DR** Files were committed to a worktree branch instead of `main`. A `const lang` duplicate declaration SyntaxError had been killing the GitHub Actions workflow without any alerts. Fixing both took about 10 minutes. Finding both took 11 sessions.

## The Files Were Never on main

Session 6 cleaned up two files in `blog-factory/devto/`. Stripped the `cover_image` R2 URLs, removed hero image tags from the body. Three Bash calls, two Edits. Clean work.

The problem: the commits landed on the `cool-edison` worktree branch. Not `main`. GitHub Actions triggers on push to `main`. The workflow was never going to fire.

Session 8 surfaced this:

```bash
git branch
# * claude/cool-edison
# main

git log main..HEAD --oneline
# 2 commits ahead of main
```

When you're working across worktrees, it's easy to lose track of where your commits are landing. The file looks edited, the commit succeeded — but it went to a temporary branch, not the one CI watches.

Always check `git branch` after committing in a worktree context. The cost of not checking is exactly this: 10 minutes of cleanup becomes a multi-session archaeology dig.

## The Workflow Was Dead on Arrival

Before moving files to `main`, I read the workflow. `.github/workflows/publish-to-devto.yml`. The trigger path was `src/content/blog/`.

The EN files lived in `blog-factory/devto/`. Wrong trigger path. The workflow had never fired on these files, not once.

Then I found the real problem. Inside the workflow's Node.js script:

```javascript
// near the top
const lang = file.includes('-en.') ? 'en' : 'ko'

// ... dozens of lines later ...

const lang = frontmatter.lang || 'ko'  // SyntaxError!
```

`SyntaxError: Identifier 'lang' has already been declared`.

This workflow had never successfully executed. Not once since it was written. There were no success logs, no failure notifications, no GitHub Actions alerts. It just sat there, silently broken.

The fix was one Edit:

```javascript
const lang = file.includes('-en.') ? 'en' : 'ko'
const effectiveLang = frontmatter.lang || lang
```

Renamed the second declaration to `effectiveLang`. Then copied the EN files to the trigger path and pushed to `main`:

```bash
cp blog-factory/devto/claude-agent-sdk-deep-dive-en.md \
   src/content/blog/claude-agent-sdk-deep-dive-en.md
git add src/content/blog/
git push origin main
```

The workflow triggered automatically. The Claude Agent SDK post published immediately. The Harness CI/CD post hit a 429 rate limit on the first attempt — ran `gh workflow run` to retry manually, and it went through.

> After creating a GitHub Actions workflow, immediately run `gh run list` to verify it actually executed. A workflow with a SyntaxError fails with zero notification. You won't know until you check.

## 21 Bash Calls Looking for a Key That Wasn't There

Session 10 tried a different approach: call the DEV.to API directly instead of waiting for GitHub Actions. Ran Bash 21 times. Checked `~/.devto`, `~/.config/devto`, `.env*` files, macOS Keychain, environment variables. Nothing.

The `DEVTO_API_KEY` exists — in GitHub Secrets. But GitHub Secrets are write-only from the CLI. `gh secret view` doesn't return the value. The key is only accessible inside a GitHub Actions runner.

This is a common pattern that bites local development: you store a key in GitHub Secrets for CI, then discover you can't use it from your local machine. If you need a key in both contexts, you need to store it in both places — GitHub Secrets for CI, `.env.local` for local scripts.

Those 21 Bash calls confirmed the key simply wasn't stored locally. Going forward: API keys live in two places — GitHub Secrets for CI, `~/.env.local` for local use.

## The blog-factory Directory Design

The current structure:

```
src/content/blog/    ← GitHub Actions trigger path
blog-factory/devto/  ← drafts and staging
```

The intended flow: draft and review in `blog-factory/devto/`, then move to `src/content/blog/` when ready to publish. Moving the file is what triggers the workflow.

This created persistent confusion across sessions. Edit the file → no publish → realize the file isn't in the trigger path → copy to `src/content/blog/` → publish. The mental model and the actual pipeline were misaligned.

The fix going forward: treat `blog-factory/devto/` as temporary staging. Once work is done there, immediately move (not copy) to `src/content/blog/`. One step, no ambiguity.

## Tool Call Breakdown (Sessions 6–11)

```
Total: 186 tool calls
- Bash:  83 (45%) — deploys, file exploration, API calls
- Read:  47 (25%) — reading file contents
- Edit:  14  (8%) — actual code changes
- Glob:  10  (5%) — file path discovery
- Bash x21 in session 10: searching for the DEV.to API key
```

Bash 45%, Read 25%. Investigation consumed 70% of all tool calls. Actual code changes (Edit) were 8%. The underlying problems were simple — a misplaced file and a duplicate variable name — but figuring out *what* was wrong took the bulk of the work.

This is the actual cost of "silent failures." If the SyntaxError had surfaced as a red workflow run on day one, this would have been a 5-minute fix. Instead it accumulated across 11 sessions.

## What's Working Now

The DEV.to auto-publish pipeline is live. Adding an EN file to `src/content/blog/` now triggers GitHub Actions and publishes to DEV.to automatically.

The gap between "this should work" and "this actually works" is exactly the gap this session closed. Took 11 sessions this time. Next time it's a 2-minute copy and push.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
