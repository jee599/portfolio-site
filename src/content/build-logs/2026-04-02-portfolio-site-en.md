---
title: "28 Bash Calls to Find Nothing: One SyntaxError Was Silently Killing My DEV.to Pipeline"
project: "portfolio-site"
date: 2026-04-02
lang: en
pair: "2026-04-02-portfolio-site-ko"
tags: [claude-code, github-actions, devto, debugging, workflow]
description: "A duplicate `const lang` declaration blocked every DEV.to publish silently. 8 hours hunting an API key that wasn't the problem. The fix was one Edit call."
---

I ran 28 Bash commands hunting for a DEV.to API key. The key was exactly where it should be — in GitHub Secrets — and was never the problem.

**TL;DR**: A `const lang` identifier was declared twice in the same scope inside a GitHub Actions workflow script. Every run died with `SyntaxError: Identifier 'lang' has already been declared`. Eight hours of credential hunting, one Edit call to fix it.

## The API Key Hunt — 28 Bash Calls

The initial prompt was simple enough:

> Publish the two posts in `blog-factory/devto/` directly to DEV.to. Find the API key from env vars or config files.

Claude searched everywhere. `~/.devto`, `~/.config/devto`, every `.env*` file in the project, macOS Keychain, shell environment variables. Four background tasks running in parallel, all returning nothing.

```bash
# This pattern repeated 28 times across different paths
find ~ -name ".devto" 2>/dev/null
security find-generic-password -s "dev.to" 2>/dev/null
grep -r "DEVTO" ~/.env* 2>/dev/null
```

`gh secret list` confirmed `DEVTO_API_KEY` existed in GitHub Secrets. But you can't read secret values through the GitHub CLI — write-only by design. An obvious dead end.

Final tool count for session one: 28 Bash, 2 Read, 1 Glob. The session ended without a conclusion.

## The Pivot — Check the Workflow First

Next session, different direction:

> Check `.github/workflows/publish-to-devto.yml` and figure out what conditions trigger it.

There was already a GitHub Actions workflow handling DEV.to publishing automatically. It watched `src/content/blog/` for new files on push and called the DEV.to API directly. Manual API calls were never needed.

While reading the workflow, Claude caught the actual bug:

```javascript
// Inside the workflow's inline Node.js script
const lang = frontmatter.lang || 'ko';
// ... some logic in between ...
const lang = file.endsWith('-en.md') ? 'en' : 'ko'; // SyntaxError!
```

Same variable name, same scope, declared twice with `const`. Every workflow run was throwing `SyntaxError: Identifier 'lang' has already been declared` and exiting at parse time. Earlier posts had published fine — this duplicate was introduced while extending the logic, and nobody noticed because the workflow just silently failed.

A second issue surfaced at the same time: the EN files only existed in `blog-factory/devto/`, not in `src/content/blog/` where the workflow was watching.

## The Fix — One Edit Call

```javascript
// Before: two const lang declarations in the same scope
// After:
const effectiveLang = file.endsWith('-en.md') ? 'en' : (frontmatter.lang || 'ko');
```

Merged both `const lang` declarations into a single `effectiveLang`. One `Edit` tool call. That was the entire fix.

Copied the two EN files into `src/content/blog/`, pushed to main. The workflow triggered automatically.

## 429 — Rate Limit on the Second Post

First post (`claude-agent-sdk-deep-dive-en.md`) published successfully. Second post (`harness-cicd-deep-dive-en.md`) hit a 429 Too Many Requests — DEV.to rate-limits burst requests within a short window.

```bash
gh workflow run publish-to-devto.yml
```

Manual re-trigger. Second post published.

## Where the Time Actually Went

Session one: 28 Bash calls hunting a key that wasn't local. Nothing resolved.  
Session two: 14 Bash + 2 Read + 1 Edit. The actual fix was the single `Edit`.

The debugging effort dwarfed the fix by an order of magnitude.

## What This Teaches

**Check the pipeline before hunting for credentials.** The assumption going in was "the API key must be somewhere" — so 28 searches happened before anyone asked "wait, is there already automation handling this?" The workflow file would have taken two minutes to read. That two minutes would have saved eight hours.

Claude Code executes faithfully in whatever direction you point it. If the direction is wrong, execution quality doesn't matter. The skill isn't writing better prompts — it's deciding *where to look first* before writing any prompt at all.

> Wrong hypothesis + fast execution = confidently wrong, faster.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
