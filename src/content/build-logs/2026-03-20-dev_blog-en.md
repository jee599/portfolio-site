---
title: "307 Tool Calls to Fix Two Missing HTTP Headers: Claude Code Builds a DEV.to Pipeline"
project: "dev_blog"
date: 2026-03-20
lang: en
pair: "2026-03-20-dev_blog-ko"
tags: [claude-code, github-actions, devto, automation]
description: "I pushed 7 posts. Only 2 showed up on DEV.to. 307 tool calls and 3+ hours later, the culprit was two missing HTTP headers and a vague prompt."
---

I pushed 7 posts to a GitHub repo wired to auto-publish on DEV.to. Two appeared. The other five quietly disappeared.

**TL;DR** — Building a GitHub Actions pipeline to auto-publish to DEV.to burned 307 tool calls across 3 hours 19 minutes. The core bugs: HTTP 403 from missing headers, no retry logic, and a prompt so wide that Claude had no choice but to try everything.

## Seven Files Committed. Two Posts Published.

Session 1 never got off the ground. The user said "put the attached file in the repo" — but there was no attachment in the conversation. Checking `/Users/jidong/dev_blog/dev_blog/` found only a `.git` folder. Session 1 ended with a question instead of a commit.

Session 2 started with the actual files: seven of them — one `publish.yml` workflow and six markdown posts.

```
.github/workflows/publish.yml
posts/ai-fortune-architecture-ko.md
posts/ai-fortune-architecture-en.md
posts/designing-saas-with-claude-ko.md
posts/designing-saas-with-claude-en.md
posts/llm-cost-optimization-ko.md
posts/llm-cost-optimization-en.md
```

Committed, pushed. Then the first feedback came back.

> "Why did only 2 posts go up?"

The repo had all seven files. But committing files doesn't auto-publish them — the `publish.yml` workflow had trigger conditions, and only two files satisfied them. The other five were silently skipped.

That's when Session 2 started stretching.

## When the Prompt Is Too Wide, Claude Tries Everything

"Only 2 posts went up" opened a cascade of follow-up requests:

"Can we also update what's already on DEV.to? I want to make it look better."

"Remove the series."

"TL;DR looks broken. Just remove it."

"Make it more readable. It's too stiff."

Each request meant editing markdown files, adjusting the workflow, committing, pushing. Midway through, the context window filled and the session had to continue on a compressed summary. `[Request interrupted by user]` appeared twice. A background GitHub auth command failed with exit code 1 and had to be rerouted.

By the end, Session 2 wasn't solving one problem — it was simultaneously handling pipeline logic, post formatting, and authentication. That's why the numbers look like this:

| Session | Tool calls | Time |
|---------|-----------|------|
| Session 1 | 4 | ~5 min |
| Session 2 | 307 | ~3h 17m |
| Session 3 | 14 | ~2 min |
| **Total** | **325** | **~3h 24m** |

Session 2 is 94% of all tool calls in this project.

The breakdown inside Session 2: Bash 129 times, Edit 75 times, Read 62 times. When a session has no clear scope, Claude covers all possibilities. Bash runs checks. Edit patches files. Read re-examines everything touched by the previous patch. Loop.

## The 403 Was Two Lines Away from Fixed

Session 3 was given a `publish-log.txt` with specific evidence: three posts failing with HTTP 403.

That's a different kind of session. Not "something's wrong, figure it out" — but "here's the exact error, here's the log, fix it."

Three issues came out of the analysis:

The `publish.yml` curl commands were missing `User-Agent` and `Accept` headers. DEV.to's API occasionally rejects requests that arrive without them. No retry logic meant a transient 403 (rate limit, timing) would just end the job silently. And error response bodies weren't being logged, so there was nothing useful to debug from.

The fix:

```bash
# Before
curl -X POST https://dev.to/api/articles \
  -H "api-key: $DEVTO_API_KEY" \
  -d @article.json

# After
curl -X POST https://dev.to/api/articles \
  -H "api-key: $DEVTO_API_KEY" \
  -H "User-Agent: dev_blog-publisher/1.0" \
  -H "Accept: application/vnd.forem.api-v1+json" \
  --retry 3 --retry-delay 5 \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d @article.json
```

Two headers. A retry flag. A status code in the output. `publish.yml` and `README.md` updated, committed. Session 3 done in 14 tool calls.

## What the Tool Call Count Actually Measures

307 vs 14 isn't about problem complexity. It's about prompt scope.

Session 2's prompt was effectively: "Some posts are missing. Also make the content look better. Also handle auth." Three different problem domains with no separation. Claude had no principled way to stop — every fix could reveal another issue.

Session 3's prompt was: "Three posts are failing with HTTP 403. Diagnose, add retry logic, fix the headers, improve logging." One domain. Clear success condition. Done in 14 calls.

The total tool call breakdown across all sessions — Bash 141, Edit 75, Read 65, TodoWrite 16, Write 16 — reflects this pattern. Most of the Bash and Read calls are investigation work, not implementation. When the problem isn't defined, exploration eats the budget.

> The fastest way to make Claude Code efficient is to narrow the prompt before you send it.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
