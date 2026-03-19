---
title: "584 Tool Calls to Rebuild a Portfolio Site with Claude Code and Parallel Agents"
project: "portfolio-site"
date: 2026-03-20
lang: en
pair: "2026-03-20-portfolio-site-ko"
tags: [claude-code, astro, parallel-agents, automation]
description: "584 tool calls, 98 hours. How I rebuilt jidonglab.com from an AI news site into a project portfolio hub — and what three GitHub API errors taught me about spec-first development."
---

584 tool calls. 98 hours and 38 minutes. Bash 352 times, Edit 92, Read 86.

This wasn't a redesign. It was an identity change. jidonglab.com went from "AI news blog" to "solo dev project portfolio hub" — and the process surfaced three lessons I keep coming back to.

**TL;DR** — In a single session, I handled GitHub API integration, build log automation, site redesign, and plugin ecosystem expansion using parallel agents. There were plenty of mistakes. The mistakes were the most educational part.

## The Problem With an Invisible Portfolio

I had 11 git projects running locally. Only 7 were on the portfolio. Build logs were written by hand. The site was on autopilot — auto-generating AI news every few hours — while the actual work I was doing stayed invisible.

The prompt I used:

```
Convert jidonglab.com from an AI news/blog site to a project portfolio hub.
I have 11 git projects locally but only 7 are registered in the portfolio.
Build logs are generated manually.

Desired workflow:
1. Generate build logs via CLI
2. Manage projects + publish build logs from an Admin panel
```

Claude broke it into 6 implementation steps: create `project-registry.yaml`, update schemas, write CLI scripts, build API endpoints, add Admin tabs, wire up DEV.to sync. It ran through 350+ Bash calls, one step at a time.

## Three GitHub API Errors, Back to Back

The most painful stretch was GitHub API integration. The goal: when a project's settings change in the Admin panel, write the updated YAML directly to GitHub. Simple concept. Three consecutive errors.

**Error 1: 403.** The Personal Access Token was missing the `repo` scope. Regenerated the token.

**Error 2: 409.**

```
src/content/projects/news4ai.yaml does not match 7cc02a8819f7f2704cbcdf17f10e0035c78abb6e
```

Updating a file via the GitHub API requires sending the current file's SHA. We were sending a stale one.

**Error 3: 422.**

```
"sha" wasn't supplied.
```

Creating a *new* file means you must not send a SHA. The code was sending one anyway. The create/update branching logic was missing entirely.

Claude fixed the code after each error. Watching the errors change in sequence made something clear: this was a predictable cascade. If we'd read the GitHub API docs first and implemented to spec, it would have worked on the first try. Asking Claude to "fix it and keep iterating until it works" got there eventually — but spec-first would have been twice as fast.

## The Korean Posts That Kept Coming Back

There was a separate, unexpected bug. Korean build logs kept appearing on DEV.to.

I said "take down all the Korean posts from DEV.to." They came down. Next day, they were back. I said "I told you to remove that logic — why is it uploading again?" Fixed again. Back again.

The root cause: the filtering logic was split across two files. `publish-to-devto.yml` in GitHub Actions had a language filter that wasn't working correctly. And `sync-devto.ts` in the API layer had its own separate logic. Fix one, the other still fires.

It only resolved after I explicitly said "build logs are jidonglab-only — confirm this is never going to DEV.to" and both files were updated simultaneously.

Claude Code tends to focus on the file it just edited. It doesn't proactively scan for duplicate logic elsewhere in the codebase. For constraints that matter — "never publish X to platform Y" — name the specific files, or repeat the constraint until every path is closed.

## Four Agents, One Redesign

"Redesign the whole site. Trendy and techy. Projects should be the main focus."

AgentCrow dispatched four agents in parallel:

```
🐦 AgentCrow — dispatching 4 agents:
1. @frontend_developer → "Redesign homepage layout — project-first structure"
2. @ui_designer       → "Redesign nav + footer in Base layout"
3. @ux_architect      → "Improve projects/index.astro"
4. @critique          → "UX critique of current design"
```

`index.astro`, `Base.astro`, and `projects/index.astro` were each assigned to a separate agent. The main thread received completion signals from each and coordinated the next steps.

The homepage ended up with project cards as the primary content. Status-based sorting was applied: running → beta → in development → discontinued. That ordering got a one-line adjustment afterward: "beta means it's already live, so it should be second."

The advantage of parallel agents is speed. The risk is context isolation — if one agent changes a Tailwind class and another agent doesn't know about it, conflicts happen. Dividing work at the file level prevents collisions. That's the key thing to get right before dispatching.

## Building a Build Log Pipeline From JSONL

It started with a question: "Is there a better way to generate build logs from JSONL?"

Claude Code writes session data to `~/.claude/projects/` as JSONL files — one per session. I built a pipeline to parse these and auto-generate build logs: `parse-sessions.py` reads the JSONL, `generate-build-log.sh` calls the Claude API and produces a markdown build log.

Registered in GitHub Actions to run every 6 hours. If a new session exists, a build log is generated automatically.

This post is sourced from the same session data that pipeline processes.

There was also a question about the difference between local cron and GitHub Actions. Local cron only runs while the machine is on. GitHub Actions runs on a schedule in the cloud regardless. For anything that needs to be reliable, GitHub Actions wins.

## What This Session Was Actually About

Three things became clear by the end.

**Name constraints at the file level.** "Don't publish Korean to DEV.to" said once wasn't enough. When a constraint applies to multiple files, name the files. Repeat the constraint until all paths are covered.

**When errors cascade, read the spec first.** The GitHub API 403 → 409 → 422 sequence was avoidable. Giving Claude an API error and asking it to fix-and-retry works. Giving it the docs first and asking for a spec-compliant implementation is faster.

**Split parallel agent work by file, not by feature.** Two agents touching the same file concurrently creates conflicts. Before dispatching, divide the work at the file level. Everything else follows from that.

> A portfolio isn't built — it's shown. Automation was the work of making the showing happen automatically.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
