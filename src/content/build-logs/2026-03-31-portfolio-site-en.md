---
title: "My DEV.to Auto-Publish Pipeline Had Never Worked — Finding the const lang SyntaxError"
project: "portfolio-site"
date: 2026-03-31
lang: en
pair: "2026-03-31-portfolio-site-ko"
tags: [claude-code, github-actions, devto, debugging, automation]
description: "11 sessions, 452 tool calls, and a SyntaxError that silently killed my DEV.to automation from the moment it was created."
---

11 sessions. 452 tool calls. 26 files modified, 14 created. The most striking discovery of the day: my DEV.to auto-publish workflow had never successfully run — not even once — since the day I built it.

**TL;DR** A `const lang` duplicate declaration `SyntaxError` in the GitHub Actions script killed the workflow from day one. Renaming the second declaration to `effectiveLang` and moving EN files to the correct trigger path brought the pipeline back to life.

## The Image That `immutable` Cache Refused to Let Go

Right after deploying to spoonai.me, thumbnails for Harvey AI and Mistral Voxtral articles were broken. I replaced them with valid JPEGs. The browser still showed the broken images.

```
Previous fix swapped in a valid JPEG but the live site still shows broken images.
Verify the actual file is valid and frontmatter paths are correct.
```

49 tool calls later, the culprit wasn't the code at all.

```json
// vercel.json
{
  "headers": [
    {
      "source": "/images/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

On the initial request, a broken HTML response had been saved as a `.jpg`. The browser cached it with a 1-year TTL and the `immutable` directive — which tells browsers: *this file will never change, don't even bother revalidating*. Replacing the file on the server meant nothing; the browser never asked again.

The fix was a filename rename. Going from `-01.jpg` to `-02.jpg` changes the URL, which changes the cache key, which forces the browser to fetch from the server. Four frontmatter edits, old files deleted. 31 Bash calls, 12 Reads, 4 Edits.

> `immutable` is a performance win for truly static assets. But any path where file *content* can change — without the filename changing — will trap stale responses for up to a year.

## Bypassing Vercel's Stuck Build Queue

Three `git push`es in a row, and Vercel never started a build. Every attempt showed "CANCELED" with no build logs to explain why.

Claude's solution was direct:

```bash
npx vercel deploy --prod
```

164 static pages built and deployed to production in 55 seconds. 5 Bash calls total. When git-connected auto-deploy gets stuck, `vercel deploy --prod` is the fastest escape hatch.

## Adding an English Track to the Daily Briefing

spoonai.me's `content/daily/` only had Korean files. The post system supported `-ko.md` / `-en.md` pairs, but the daily briefing had been left Korean-only.

1 hour 27 minutes, 39 tool calls, 4 files changed.

`lib/content.ts` got a `getDailyBriefing(date, lang?)` signature update and a new `hasDailyEnVersion()` helper. `app/daily/[date]/page.tsx` now fetches both language versions in parallel, and `DailyBriefing.tsx` renders a tab UI to switch between them.

The less obvious part: `~/Documents/Claude/Scheduled/spoonai-site-publish/SKILL.md` step 3.6 was updated to include English daily generation, and `~/.claude/skills/spoonai-daily-briefing/SKILL.md` was kept in sync. Code and automation spec updated together. If the SKILL.md isn't current, the next scheduled Claude session will skip the English daily. That's the pattern: treat automation specs as first-class artifacts alongside the code they drive.

## The DEV.to Pipeline That Was Dead on Arrival

I wanted to publish two English posts (`claude-agent-sdk-deep-dive-en.md`, `harness-cicd-deep-dive-en.md`) to DEV.to. First pass: strip `cover_image` R2 URLs and hero image tags — those images don't exist in R2, so leaving them would produce broken embeds. Glob twice, Read twice, Edit twice.

Then the actual publishing. No API key locally.

```bash
# Claude searched (21 Bash calls):
~/.devto, ~/.config/devto, .env, .env.local,
.env.production, wrangler.toml, macOS Keychain...
# Nothing.
```

`DEVTO_API_KEY` is in GitHub Secrets — write-only by design, unreadable from outside. So the approach shifted: use the existing GitHub Actions workflow instead.

Checking `.github/workflows/publish-to-devto.yml` revealed the first problem. The trigger was set to fire on pushes to `src/content/blog/`. The EN files lived in `blog-factory/devto/` — a path that had never been part of the trigger. The workflow had never had a reason to run.

Then the worse problem:

```javascript
// Inside publish-to-devto.yml Node.js script
const lang = file.includes('-en.') ? 'en' : 'ko'
// ...dozens of lines later...
const lang = frontmatter.lang || 'ko'  // SyntaxError!
```

`SyntaxError: Identifier 'lang' has already been declared`. This was in the script from the day the workflow was created. Every run — if there had ever been a run — would have failed at parse time, before executing a single line of logic.

The fix was two steps:

```bash
# 1. Fix the SyntaxError — 1 Edit
# Before:
const lang = frontmatter.lang || 'ko'
# After:
const effectiveLang = frontmatter.lang || lang

# 2. Move EN files into the trigger path
cp blog-factory/devto/claude-agent-sdk-deep-dive-en.md \
   src/content/blog/claude-agent-sdk-deep-dive-en.md

# 3. Push to main → workflow triggers automatically
git push origin main
```

The workflow fired. Claude Agent SDK post: published successfully. Harness CI/CD: 429 rate limit. A manual `gh workflow run` cleared it.

The 21 Bash calls spent hunting for a local API key weren't wasted time — that dead end forced a pivot to GitHub Actions, which is how the `SyntaxError` got found at all. The detour surfaced the real bug.

## Tool Call Breakdown

```
Total: 452 tool calls
- Bash:   157 (35%) — builds, deploys, filesystem exploration
- Read:   152 (34%) — understanding existing code
- Edit:    45 (10%) — actual code changes
- Agent:   21 (5%)  — parallel subagent dispatch
- Write:   16 (4%)  — new file creation
```

Read and Bash together are 69% of all calls. Understanding and verifying the system took significantly more effort than changing it. Edit ran 45 times across 26 files — 1.7 edits per file on average. Most files got it right the first time.

## What This Session Actually Taught

**Audit your GitHub Actions workflows.** A workflow with a `SyntaxError` fails silently. There's no notification, no alert, no indication anything is wrong — it just never runs. After creating a CI pipeline, actually trigger it once and verify it executes. `gh run list --workflow=publish-to-devto.yml` takes 10 seconds and would have caught this immediately.

**`immutable` cache means what it says.** It's a valid performance optimization for assets that truly never change. But image paths that can be updated without renaming will trap broken responses for a year. Including a content hash or version in the filename is the safer pattern — then content changes force URL changes, which bypass cache automatically.

The bigger pattern: the most expensive bugs in this session weren't complex logic errors. They were a one-line duplicate variable declaration and a misconfigured HTTP header. Both were invisible during normal development because they only manifest in specific runtime conditions — one in CI, one in a browser with a warm cache.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
