---
title: "The Automation That Never Worked: SyntaxError, 4 Zombie Processes, and 700 Claude Code Tool Calls"
project: "portfolio-site"
date: 2026-03-31
lang: en
pair: "2026-03-31-portfolio-site-ko"
tags: [claude-code, github-actions, debugging, automation, telegram, mcp]
description: "A SyntaxError breaking DEV.to publishing from day one, 4 zombie Telegram MCP processes causing 409 Conflicts, and an immutable cache trap. 18 sessions, 700 tool calls."
---

18 sessions. 700 tool calls. Today was the day I discovered things that had been broken since the moment they were created — silently, without a single alert.

The DEV.to auto-publish workflow had been failing with a `SyntaxError` since the day it was written. The Telegram bot had 4 zombie processes fighting each other over a single connection. Neither sent an error notification. Both just quietly failed.

**TL;DR** Two fixes — a duplicate `const lang` declaration and a mismatched file path — brought the DEV.to pipeline back to life. The Telegram 409 Conflict resolved after killing 4 zombie processes.

## The Image Trapped Behind a 1-Year Cache

Right after deploying to spoonai.me, thumbnails for the Harvey AI and Mistral Voxtral articles showed as broken. I replaced the files with correct JPEGs. The browser kept showing the broken images.

After 31 Bash commands, the culprit was in `vercel.json`:

```json
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

On the first request, a broken HTML response had been saved as a `.jpg`. The browser cached it with a 1-year TTL and the `immutable` directive — "this file will never change, don't bother revalidating." Replacing the file on the server meant nothing; the browser never asked again.

The fix was a filename rename. Changing `-01.jpg` to `-02.jpg` changes the URL, which breaks the cache key, which forces a fresh fetch from the server.

> Only use `immutable` on paths that include a content hash. Putting it on a generic `/images/` path makes file replacement effectively impossible without a URL change.

## Bypassing a Stuck Vercel Build

Three consecutive `git push` commands and Vercel refused to start a build. Every attempt returned "CANCELED" with no build logs. Claude's solution was blunt:

```bash
npx vercel deploy --prod
```

164 static pages built in 55 seconds. 5 Bash commands. When git-integrated auto-deploy stalls, `vercel deploy --prod` is a fast bypass that just works.

## The DEV.to Pipeline Dead on Arrival

I wanted to publish two English posts to DEV.to. The API key wasn't accessible locally, so the approach shifted to the existing GitHub Actions workflow.

Checking `.github/workflows/publish-to-devto.yml` revealed the first problem: the trigger fired on pushes to `src/content/blog/`. The English files lived in `blog-factory/devto/` — a path never included in the trigger. The workflow had never had a reason to run.

Then the worse problem. Inside the workflow's Node.js script, `const lang` was declared twice in the same scope:

```javascript
// Inside publish-to-devto.yml Node.js script
const lang = file.includes('-en.') ? 'en' : 'ko'
// ... dozens of lines later ...
const lang = frontmatter.lang || 'ko'  // SyntaxError!
```

`SyntaxError: Identifier 'lang' has already been declared`. This existed from the moment the workflow was created. It had never successfully run once.

The fix:

```bash
# 1. Fix SyntaxError — 1 Edit
const lang = file.includes('-en.') ? 'en' : 'ko'
const effectiveLang = frontmatter.lang || lang  # renamed

# 2. Move file to the correct trigger path
cp blog-factory/devto/claude-agent-sdk-deep-dive-en.md \
   src/content/blog/claude-agent-sdk-deep-dive-en.md

# 3. Push to main → workflow triggers automatically
git push origin main
```

The Claude Agent SDK post published immediately. The Harness CI/CD post hit a 429 rate limit and required a manual `gh workflow run` to clear.

There's an irony: 21 Bash commands spent hunting for a local API key is what forced the pivot to GitHub Actions — which is what exposed the `SyntaxError`. The dead end revealed the bug.

## 4 Zombie Telegram Processes Causing 409 Conflicts

The Telegram bot wasn't responding. Sessions 12 through 16 were consumed by this single problem.

The initial assumption was configuration. Token, DM policy, allowlist — all correct. The `getUpdates` API responded normally. Messages still weren't arriving.

The server logs told the real story:

```
409 Conflict: Terminated by other getUpdates request;
make sure that only one bot instance is running
```

Every time a Claude Code session restarts, the Telegram MCP server spawns a new process. Previous processes don't always terminate cleanly. Running `ps aux | grep "bun server.ts"` showed 4 processes running simultaneously. The Telegram Bot API allows only one active `getUpdates` connection — with 4 competing instances, messages were split across them or dropped entirely.

```bash
# Kill all zombie processes
kill -9 20895 21043 21156 21289
```

After cleanup, `/reload-plugins` brought the bot back to normal. 6 sessions, 46 Bash commands, 20 Read calls.

> In environments where Claude Code sessions restart frequently, MCP server zombie processes accumulate. When a bot connection stops working and the config looks fine, run `ps aux | grep` before touching anything else.

## Tool Usage Breakdown

```
Total: ~700 tool calls
- Bash:     ~230 (33%) — deploys, exploration, process management
- Read:     ~180 (26%) — understanding code
- Edit:      ~50  (7%) — actual code changes
- WebFetch:  ~53  (8%) — Naver blog parsing
- Write:     ~16  (2%) — creating new files
- Agent:     ~21  (3%) — sub-agent delegation
```

Bash and Read together account for 59%. Exploration and verification took significantly more effort than implementation. 50 Edit calls across 26 files — roughly 2 edits per file on average.

## What This Session Taught

**Always verify GitHub Actions workflows actually run.** After creating a workflow, check `gh run list` immediately to confirm it succeeded. A workflow with a `SyntaxError` fails silently on every trigger — no notification, no alert, no indication anything is wrong.

**When an MCP plugin stops responding, check for duplicate processes first.** Even if the config is correct and the API responds, if the bot is dead, `ps aux` before anything else.

**`immutable` cache belongs only on content-hashed paths.** Putting it on a generic path like `/images/` means file replacement is impossible without a URL change.

The most expensive bugs here weren't complex logic errors. They were a one-line duplicate variable declaration and a misconfigured HTTP header — both invisible during normal development because they only manifest at runtime: one in CI, one in a browser with a warm cache.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
