---
title: "My DEV.to Auto-Publish Pipeline Was Silently Failing for 3 Months — One `const lang` Line"
project: "portfolio-site"
date: 2026-04-02
lang: en
pair: "2026-04-02-portfolio-site-ko"
tags: [claude-code, github-actions, automation, debugging]
description: "Claude spent 8 hours hunting an API key that didn't exist locally. The real bug was a `const lang` double declaration that blocked execution for 3 months."
---

My DEV.to publish workflow had been silently failing for 3 months. I didn't know. No alerts, no logs I was watching — just a GitHub Actions run that would trigger, parse the script, and immediately die with a `SyntaxError` before doing anything.

**TL;DR** A `const lang` double declaration caused a Node.js SyntaxError that killed every workflow run at parse time. Claude spent 8 hours searching for a local API key that was stored in GitHub Secrets (write-only). The actual fix was one line. The real lesson was about trusting automation too blindly.

## Claude Made 28 Bash Calls Looking for a Key That Wasn't There

The first prompt was straightforward:

> Publish the two articles in `blog-factory/devto/` to DEV.to using the API. Find the API key in environment variables or config files.

Claude went hunting. 28 Bash calls later, here's what it checked:

- `~/.devto`, `~/.config/devto` — not found
- `~/.env.local` — only `ANTHROPIC_API_KEY`
- All `.env*` files in the project — not found
- macOS Keychain — not found
- Full environment variable scan — not found

It did find `DEVTO_API_KEY` in GitHub Secrets:

```bash
gh secret list
# ✓ DEVTO_API_KEY  Updated 3 months ago
# Value: not readable
```

GitHub Secrets are write-only by design. The CLI can confirm a secret exists, but it can't return the value. After exhausting every path, Claude concluded: "The key doesn't exist locally. Please provide it directly."

This is Claude Code doing exactly what it's designed to do — exhaust every reasonable option before asking. The problem was the prompt itself. A better version would have been: "If you can't find the API key locally, check whether we can publish via GitHub Actions instead." That single redirect would have saved the whole session.

## The Actual Bug: `const lang` Declared Twice

In the next session, the approach changed. Instead of hunting the key, I opened the workflow file first.

`.github/workflows/publish-to-devto.yml` contained an inline Node.js script. Inside that script:

```javascript
// top of script
const lang = frontmatter.lang || 'ko';

// ... 40 lines later ...

const lang = effectiveLang; // SyntaxError: Identifier 'lang' has already been declared
```

Same scope. Same `const`. Two declarations. Node.js catches this at parse time — the script never even starts executing. This workflow had been broken since it was written, failing silently on every push for 3 months.

The fix:

```javascript
const lang = frontmatter.lang || 'ko';
// ...
const effectiveLang = lang; // renamed to avoid re-declaration
```

One line. That's it.

## The Second Problem: Wrong File Path

With the SyntaxError fixed, the next issue surfaced. The workflow trigger was watching:

```yaml
on:
  push:
    paths:
      - 'src/content/blog/**'
```

But the articles were sitting in `blog-factory/devto/`. Different directory — the trigger never fired even when the script was working.

Copied both EN files into `src/content/blog/`, pushed to main. The workflow triggered automatically.

## 429, Then Done

First article (Claude Agent SDK) — published successfully.

Second article (Harness CI/CD) — `429 Too Many Requests`. DEV.to's API rate-limits rapid consecutive requests.

Waited, then manually re-triggered:

```bash
gh workflow run publish-to-devto.yml
```

Second attempt passed. Both articles live on DEV.to.

Total tool calls for the actual fix: 14 Bash, 2 Read, 1 Edit. The real work was one file, one line. Everything else was verification.

## Cover Image Cleanup

In a separate session, cleaned up the `cover_image` fields in `blog-factory/devto/` frontmatter. Images were referenced from Cloudflare R2, but the files didn't exist there yet.

```yaml
# before
cover_image: https://r2.jidonglab.com/images/hero-image.png

# after (field removed)
```

Also removed the inline `![...]` hero image tags from the body. Publishing without images beats publishing with broken URLs.

## The Illusion of Working Automation

The real takeaway here isn't about a SyntaxError. It's about a false sense of security.

I built the GitHub Actions workflow, pushed it, and mentally filed it under "done — automated." Three months of silent failures proved that wrong. There were no success notifications to watch. I hadn't set up failure alerts. I had no idea.

A reliable automation pipeline needs two things: logs that confirm execution happened, and alerts that fire when it doesn't. A quick `gh run list` habit catches this faster than any post-mortem:

```bash
gh run list --workflow=publish-to-devto.yml --limit=5
```

And when prompting Claude to find something it can't reach locally, give it an escape route. "If you can't find the key, pivot to X" turns an 8-hour exhaustive search into a 2-minute redirect.

> The most dangerous automation is the kind you believe is working.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
