---
title: "I Built a 3-Platform Auto-Publishing Pipeline in One Day — 289 Tool Calls Later"
project: "portfolio-site"
date: 2026-03-23
lang: en
pair: "2026-03-23-portfolio-site-ko"
tags: [claude-code, automation, skills, agentcrow]
description: "Built an auto-publish Claude Code skill that simultaneously posts to spoonai, DEV.to, and Naver Blog — then spent 2 hours debugging a Vercel git author mismatch."
---

289 tool calls. 22 hours and 39 minutes. And a Vercel deployment that sat blocked for two hours because of a git config I hadn't touched in months.

**TL;DR** — Built a Claude Code skill called `auto-publish` that takes any URL, keyword, or markdown file and simultaneously publishes to spoonai.me (Korean), DEV.to (English), and Naver Blog (Korean HTML). Hit a Vercel git author mismatch midway through that burned most of session 2's 127 Bash calls to resolve.

## It Started With Four Markdown Files and a Telegram Message

Someone pinged me on Telegram: "Got some articles — can you push them to DEV.to?"

They dropped four files. `channels-en-part1.md`, `channels-en-part2.md`, `dispatch-en-part1.md`, `dispatch-en-part2.md`. English posts about Claude Code Channels and Dispatch.

Claude checked the files, pushed to GitHub, and GitHub Actions hit the DEV.to API. All four posts live in 15 minutes.

Then: "Can you apply SEO and hooking techniques to the published articles? Improve the titles, optimize descriptions, fix the bullet points."

These articles were written externally — they hadn't gone through the blog-writing skill, so none of the usual quality filters had applied. No numbers in headlines. Descriptions were too generic. Bullet points everywhere. All four needed a full rewrite.

Rather than doing them one at a time, I dispatched 4 parallel agents simultaneously — one per article. Each agent rewrote its assigned post with SEO-optimized title, revised description, better hooks, and pushed the updated version back. Parallel execution felt 2–3x faster than sequential.

That's when the obvious question surfaced: why am I doing this manually every time? What if I could just give Claude a URL, a keyword, or a file — and it handles everything?

## Designing the auto-publish Skill

I ran a brainstorming skill first before writing any code. Requirements were clear from the start:

- Accept three input types: URL (WebFetch), keyword (WebSearch), or markdown file (Read)
- Publish to three platforms simultaneously: spoonai.me (Korean), DEV.to (English), Naver Blog (Korean HTML via queue folder)
- Single-user tool — no need for a web UI or Telegram bot, CLI is enough
- SEO and hooking logic baked into the generation step per platform

Between web app, Telegram bot, and CLI, CLI won immediately. Fastest to build, no infrastructure to maintain, runs directly in Claude Code.

The skill breaks into three phases:

**Phase 1 — Ingest.** Detect input type. URL → WebFetch the page content. Keyword → WebSearch and pull relevant sources. File → Read and parse the markdown.

**Phase 2 — Generate.** Platform-specific content generation. spoonai.me needs Korean body text with front matter. DEV.to needs English with tags and series metadata. Naver Blog needs Korean HTML that matches their editor format — this goes to a queue folder since Naver doesn't have a public publish API.

**Phase 3 — Publish.** Git push for spoonai.me and DEV.to (GitHub Actions handles the actual API calls). Queue folder for Naver — manual copy-paste into their editor via a separate cowork step.

The key piece is `auto-publish/SKILL.md`. This file is not documentation. It's a runtime spec — Claude reads it during execution to make decisions without prompting. Every branch condition is spelled out: what to do when the URL returns a 403, how to handle keyword ambiguity, which SEO rules apply to which platform. If the spec is vague, Claude will ask. If it's precise, Claude just executes.

```
/auto-publish write about Claude Code Channels
```

That one line triggers the full pipeline: WebSearch for sources, generate Korean post for spoonai, generate English post for DEV.to, write Naver HTML to queue. The only manual step left is uploading the queue file to Naver's editor.

## The Vercel Deployment Block That Cost Two Hours

After publishing, I checked spoonai.me. `404 — This page could not be found.`

Opened the Vercel deployment log:

```
Deployment Blocked
Git author jidongs45@gmail.com must have access to the team
jee599's projects on Vercel to create deployments.
```

My Mac's global git config had `user.email` set to `jidongs45@gmail.com` — a personal account that wasn't a member of the `jee599` Vercel team. The spoonai-site repo lives under that team. So every commit pushed from my machine was blocked at Vercel's author check.

Here's the troubleshooting sequence, in order:

1. Changed `user.email` in git config to the `jee599` account email
2. Pushed an empty commit — still blocked (Vercel uses the commit author email at push time, and cached the old commits)
3. Tried adding `jidonggg` as a team member on Vercel — no delete option appeared, couldn't clean up
4. Pushed an empty commit directly from the `jee599` account — this worked
5. Existing blocked deployments showed "This deployment can not be redeployed" — they're permanently stuck
6. Created a fresh commit from the `jee599` account — new deployment triggered, site came back up

This entire sequence ate the majority of session 2's 127 Bash calls. The loop was: paste error message → Claude suggests fix → apply fix → push → check deployment log → same error or new variant → repeat.

There's a hard boundary here that's worth naming: Vercel dashboard operations and account permission changes require human hands. Claude can diagnose what's wrong and tell you exactly what to click, but it can't click for you. The 127 Bash calls were me and Claude trying everything that could be scripted — the things that couldn't be scripted were the blocking factors.

## Fixing AgentCrow's Failing Tests, Then Publishing to npm

Session 3 shifted to a different project: [AgentCrow](https://github.com/jee599/agentcrow), a Claude Code multi-agent routing tool. v3.3.0 had 3 failing tests.

Root cause: the `hasSubmodule` check was using `existsSync` on a directory path. `existsSync` returns `true` for empty directories — and `agents/external/agency-agents/` was an empty submodule (not initialized). The check was supposed to skip certain tests via `describe.skipIf`, but since the directory existed (even though it was empty), the skip condition never fired.

The fix required checking for the presence of actual content inside the submodule directory, not just whether the directory path exists.

Claude surfaced 10 proposed changes. I went through each one and re-verified whether it was actually necessary. Result: 4 were genuine fixes. 6 were either nice-to-have improvements or based on misdiagnosed root causes — things Claude had inferred incorrectly from the context.

This is a pattern worth paying attention to: Claude's suggestions aren't binary correct/incorrect. Filtering them matters more than applying all of them. Applying all 10 would have introduced noise into the codebase and made the actual fixes harder to isolate.

After applying the 4 real fixes:

```
6 passed, 0 failed, 2 skipped
```

Build passed. Time to publish.

```
npm error code ENOENT
npm error path /Users/jidong/package.json
```

Ran `npm publish` from the home directory instead of the project directory. Classic. Moved to `/Users/jidong/agentcrow` and ran it again. Then the npm auth token wasn't in `.npmrc` — pasted it manually and published.

After publishing, the question came up: "Can we promote this somewhere? Hacker News maybe?"

First step before any promotion: record a proper demo. Used `asciinema` to capture the full flow — install, command input, agent dispatch output. Made the AgentCrow output visually distinct with color and emoji so the agent routing is obvious on first viewing. Updated the existing DEV.to post with the demo embed.

## Why the Skill-as-Runtime-Spec Pattern Scales

The most reusable thing from these sessions isn't the `auto-publish` tool itself — it's the pattern behind how it's built.

The typical Claude Code workflow is prompt-driven: you describe what you want in the chat, Claude does it, session ends, context disappears. Next session you describe it again. It doesn't compound.

Skill files change that. You write the workflow once as a markdown spec, and every invocation of `/auto-publish` follows the same rules — platform-specific formatting, SEO requirements, input handling branches, all of it. The spec is version-controlled, easy to edit, and readable by both humans and Claude.

The other pattern: parallel agents for independent tasks. The 4-article SEO rewrite that would have taken 40 minutes sequentially took roughly 15 minutes with 4 agents running simultaneously. The agentcrow fixes involved 3 agents working on non-overlapping files at the same time. 2–3x speed improvement is a reasonable estimate, though it varies by task.

Together, these two patterns — skill files as runtime specs + parallel agents for independent work — are what make Claude Code genuinely fast rather than just convenient.

## Tool Call Breakdown

**Session 2:** Bash 127, Agent 38, Read 26, Edit 26

Bash dominates because of the Vercel debugging cycle: push, check logs, modify, push again. Every attempt to unblock the deployment went through Bash. Agent calls were for the parallel SEO rewrites.

**Session 3:** Bash 68, Edit 25, Read 19, Agent 7

Higher Edit ratio reflects the test fixing work — read failing test, identify location, apply fix, re-run. The agent count is lower because most of the agentcrow changes were sequential (one fix informed the next).

**Total across both sessions:** 289 tool calls, 22 hours 39 minutes.

> Abstract repeated work into skill files. Split independent tasks across parallel agents. That's the efficient path with Claude Code.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
