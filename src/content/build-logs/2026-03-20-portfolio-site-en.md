---
title: "605 Tool Calls: How I Rebuilt My Portfolio Into a Project Hub with Claude Code"
project: "portfolio-site"
date: 2026-03-20
lang: en
pair: "2026-03-20-portfolio-site-ko"
tags: [claude-code, astro, multi-agent, automation, github-api]
description: "605 tool calls, 355 Bash commands, one session. How I turned jidonglab.com from an AI news blog into a project portfolio hub — and three bugs that made it messy."
---

605 tool calls. 355 Bash. 99 Edit. 91 Read.

That's not a success metric. That's a record of what it looks like when a session doesn't run clean. I fixed the same bug three times. Hit a build timeout I didn't see coming. Spent three iterations on GitHub API errors that were all predictable from the docs. The number just reflects that honestly.

**TL;DR** — Converted jidonglab.com from an AI news aggregator into a project portfolio hub. One session: JSONL-based build log automation, a GitHub API-connected admin panel, a parallel-agent site redesign, and a build timeout caused by a component doing data fetching it had no business doing.

## The Problem: 11 Projects, 7 Visible

I had 11 git repos running locally. The portfolio showed 7. Build logs were written by hand, one at a time. The site was publishing AI news automatically every few hours — while everything I was actually building stayed invisible.

A visitor couldn't tell what I was working on. That was the problem.

I opened with a structured prompt:

```
Convert jidonglab.com from an AI news/blog site into a project portfolio hub.
I have 11 git projects locally, but only 7 are in the portfolio.
Build logs are generated manually.

Target flow:
1. Generate build logs via CLI
2. Manage projects + publish build logs from Admin
```

The site's `admin.astro` was a 58KB file. Claude read it and laid out a 6-step plan: create `project-registry.yaml`, update Content Collection schemas, write CLI scripts, add API endpoints, extend the Admin panel, wire up DEV.to sync. Then it ran 355 Bash commands to implement each step.

## The JSONL Pipeline That Writes Blog Posts From Code

It started with one line: "It'd be nice to generate build logs from JSONL sessions."

Claude Code stores every conversation locally at `~/.claude/projects/` as JSONL files — user prompts, tool calls, and results, all of it. Parse those files and you can reconstruct what happened in any session.

`parse-sessions.py` reads the JSONL, filters by project directory, and produces a structured summary. `generate-build-log.sh` sends that summary to the Claude API and gets back a markdown draft. Hook it into GitHub Actions and every `git push` can trigger an auto-generated build log.

This post is sourced from the same session data that pipeline processes.

One question came up: what's the difference between local cron and GitHub Actions? Local cron only runs when your machine is on. For anything that needs to run reliably on a schedule, GitHub Actions is the obvious choice.

## GitHub API Fails — Three Times in a Row

The Admin panel needed to commit project YAML directly to GitHub when settings changed. The GitHub Contents API handles this. The errors came in sequence, each predictable from the previous.

**403 first.** The Personal Access Token didn't have the `repo` scope. Generated a new token.

**Then 409.**

```
src/content/projects/news4ai.yaml does not match 7cc02a8819f7f2704cbcdf17f10e0035c78abb6e
```

Updating a file via the GitHub Contents API requires sending the current file's SHA. The code was sending a stale one. Fixed: `GET /contents/{path}` to fetch the current SHA first, then include it in the `PUT`.

**Then 422.**

```
"sha" wasn't supplied.
```

Creating a new file means no SHA field at all — but the code was sending an empty string. Added a branch: if the file doesn't exist yet, omit the SHA field entirely.

I used a "keep fixing until it works" prompt and Claude iterated through each error. Looking back, all three failure modes were visible in the GitHub API docs. Reading the spec first and implementing to it would have cut the tool calls in half.

## The Same Bug Fixed Three Times

DEV.to is for English content. Korean build logs kept appearing there anyway.

First time: asked to take them down. Done. Next day they were back. Asked why. Got a fix. They reappeared again.

The filtering logic was split across two places. The `publish-to-devto.yml` GitHub Actions workflow had a `lang` filter that wasn't working. The `sync-devto.ts` API layer had its own separate publish logic. Fix one, the other fires independently.

It only stopped after I said: "Build logs are jidonglab-only — confirm this is never going to DEV.to again." Both files were updated simultaneously, and it stayed fixed.

Claude Code focuses on the file it just changed. It won't proactively scan for duplicate logic in other files. For constraints that actually matter, name the specific files involved. Repeat the constraint until all paths are confirmed closed.

## The Build Timeout I Didn't See Coming

After deploying, Cloudflare Pages killed the build mid-way:

```
Failed: build exceeded the time limit and was terminated
```

The culprit was `ProjectCard.astro`. The component was calling `getCollection('build-logs')` directly:

- 9 project cards
- Each calls `getCollection` at build time
- 24 build log files per collection read
- 9 × 24 = 216 file reads happening inside component renders

The fix was straightforward: remove `getCollection` from `ProjectCard`, pass the build log data down from the parent as props.

```
fix: ProjectCard에서 getCollection 제거 → 빌드 타임아웃 해결
```

It's a basic rule — components shouldn't fetch their own data, data flows down from parents. This worked fine locally and only exploded in the Cloudflare build environment. That gap between "works locally" and "fails in CI" is the most frustrating class of bug, and the hardest to anticipate.

## Two Agents, Zero Conflicts

"Redesign the whole site. Projects should be front and center."

AgentCrow dispatched two agents in parallel:

```
🐦 AgentCrow — dispatching 2 agents:
1. @frontend_developer → "Homepage redesign — project-first layout"
2. @frontend_developer → "Base layout nav + footer improvements"
```

`index.astro` and `Base.astro` were edited simultaneously by separate agents. No conflicts — because they were working in different files.

One ordering question came up after the redesign shipped: "beta means it's already running, so it should probably be second." The final sort order: live → beta → in development → discontinued.

The rule for parallel agents is file-level separation. Two agents editing the same file concurrently will conflict. Before dispatching, split the scope at the file boundary. Everything else follows from that.

## What 605 Actually Measures

36 files changed. 18 new files created. 9 projects updated.

A large portion of the 355 Bash calls were `npm run build` and `tsc --noEmit` — verifying each code change before moving on. That loop is tedious but it catches problems before they compound into something harder to untangle.

The GitHub API triple-fail was the opposite: iterating against runtime errors instead of reading the spec upfront. That pattern doubled the work. The lesson isn't "don't iterate" — it's "give Claude the docs, not just the error message."

> Automation is the process of turning "how I built things" into a record that writes itself. While you're shipping, the blog catches up.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
