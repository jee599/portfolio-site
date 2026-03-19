---
title: "423 Tool Calls to Pivot a Portfolio: From AI News Site to Project Hub"
project: "portfolio-site"
date: 2026-03-19
lang: en
pair: "2026-03-19-portfolio-site-ko"
tags: [claude-code, astro, portfolio, automation, github-api]
description: "Converted jidonglab.com from an AI news aggregator to a project portfolio hub: 423 tool calls, 28 GitHub repos auto-synced, build log pipeline automated."
---

423 tool calls. One session. A site with a completely different purpose.

73 hours 53 minutes of elapsed time. The result: jidonglab.com changed its identity — from AI news aggregator to **project portfolio hub**.

**TL;DR:** Rewired jidonglab.com to pull 28 GitHub repos via API, added an admin UI to toggle project visibility, automated build log generation from Claude Code session logs, cleaned up Korean posts on Dev.to, and fixed a YAML parser bug triggered by URLs. Claude Code did the execution. I provided specs and caught edge cases.

---

## Why the Pivot

jidonglab.com started as an AI news curation site. Every day at 9 AM KST, a pipeline scraped news, summarized it with Claude, and published to Dev.to. Fully automated, no maintenance.

The problem: it wasn't working as a portfolio.

I had 11 git projects running locally — a saju (Korean astrology) app, a coffee chat tool, a dental clinic site, a trading bot, an AI news platform. Only 7 appeared in the portfolio. Build logs were written manually. Work existed, but wasn't visible anywhere in an organized way.

The fix was directional. Move the site's center of gravity from news to projects.

The prompt that kicked things off:

```
Implement the following plan:
Convert jidonglab from an AI news/blog site into a project portfolio hub.
11 local git projects exist, but only 7 are registered in the portfolio.
Build logs are generated manually.
```

I pass Claude Code a structured plan rather than a loose request. When it receives a spec document, it determines execution order by file, batches parallelizable tasks together, and works through them. "Here's the spec" consistently outperforms "can you help me with."

---

## Encountering the 58KB `admin.astro`

The first blocker was `admin.astro`.

58KB. One Astro component. That's a smell — Projects, Build Logs, Stats, and Dev.to tabs all crammed into a single file, UI and logic interleaved.

Claude Code read the file in chunks using the Read tool, mapped the tab structure, identified where JavaScript event bindings lived, then determined where to splice in the new Projects and Build Logs tabs without breaking existing behavior.

Manual navigation through that file would have taken 30 minutes just to get oriented.

Lesson learned on prompting large files: "edit this file" fails on 58KB components. "Read this file's tab structure, add a Projects tab and Build Logs tab, and preserve the existing JS event binding pattern" works. File complexity requires proportional context. The more specific the instruction, the fewer correction rounds.

---

## GitHub API: 9 Repos → 28

The old portfolio used a static YAML list. Adding a project meant editing a file, committing, deploying. Functional but manual.

New approach: pull repos directly from the GitHub API and control visibility through the admin UI.

Building the API endpoint (`admin-projects.ts`) went smoothly — until `403 Forbidden` hit.

Token scope. The GitHub Personal Access Token was missing the `repo` permission. Claude Code can't generate tokens; that's a manual step. Paused, updated the token, restarted.

Next call returned: **9 registered, 28 on GitHub**.

All 28 repos, one request. From that point, toggling a project's `visible` state in the admin panel is all it takes to show or hide it on the portfolio. No YAML edits, no deploys for data changes. That was the goal.

---

## Automating Build Logs

Writing build logs was the most time-consuming recurring task on this site. Build something, then spend additional time turning it into a readable post. Sometimes the writing took longer than the coding.

Two scripts:

- `scripts/generate-build-log.sh` — orchestrates the pipeline
- `scripts/parse-sessions.py` — parses Claude Code's `.jsonl` session logs

The parser extracts raw material from session files: which files were modified, what prompts were entered, how many tool calls ran, which tools dominated. That data feeds into Claude, which produces a draft.

A LaunchAgent at `~/Library/LaunchAgents/com.jidong.build-log.plist` runs the parser every 6 hours automatically.

Not fully hands-off. Drafts are generated automatically; publishing is manual after review. Quality requires a human pass. Current state: auto-generate + manual publish.

The constraint: output quality is proportional to session quality. Clear prompts and deliberate context during sessions lead to usable drafts. Sloppy sessions produce sloppy drafts. The automation is a forcing function for better session hygiene.

---

## When Parallel Agents Actually Help

The agentochester project (session 7, 327 tool calls) used the `subagent-driven-development` skill — take a spec, decompose it into independent tasks, dispatch each to a separate agent.

Agents that ran:
- `adapter.ts` implementation
- 8 builtin YAML agents
- `catalog` + `agent-manager` implementation
- `assembler.ts` implementation
- TypeScript type safety audit
- Security review
- Test coverage analysis
- Dashboard QA
- Spec compliance review

9 agents, each with an isolated context window.

The caveat: parallel agents only help when tasks are actually independent. If task B can't start until task A completes, spinning up B in parallel just means it waits. `catalog.ts` couldn't be built until `adapter.ts` was done — that's a serial dependency regardless of how many agents are running.

Dependency mapping is a prerequisite for effective parallelism. Write the spec with explicit dependency annotations, or you'll spin up agents that immediately start blocking each other.

---

## Dev.to Cleanup and SEO

Mid-session, a problem surfaced: Korean-language posts were live on Dev.to.

Dev.to is an English-first platform. Korean posts don't surface in search, don't reach the intended audience, and dilute account focus.

```
Unpublish all Korean posts from Dev.to.
Check whether the remaining English posts are optimized
for search, hooks, and traffic.
```

Claude Code called the Dev.to API, fetched the post list, detected language, and unpublished the Korean posts. Then it rewrote titles and tags on the remaining English posts from an SEO perspective.

The logic is straightforward: identify search intent, front-load the primary keyword in the title, select 4 tags strategically. Applied uniformly across all existing posts in one pass.

---

## The YAML Colon Bug

```
when I add a link or project status in admin, I get some yaml error
```

Entering a URL in the admin UI broke YAML parsing. The cause: colons in URLs. In YAML, `:` is the key-value separator. An unquoted URL like `https://example.com` confuses the parser — `https` looks like a key.

Fix: automatically quote string values on serialization. Trivial change, but one that only surfaces when you actually use the feature with real data.

This is the real cycle for solo development: build fast with Claude Code, use the feature, fix what breaks. Anticipating every edge case before shipping is slower than shipping and iterating. The YAML bug took 30 seconds to find in use; it would have taken much longer to predict in design.

---

## What the Tool Stats Tell You

Session 1 (portfolio-site pivot):
```
Bash(248), Edit(72), Read(63), Write(19), Grep(10)
```

Bash at 248 covers deployments, build checks, API tests, and git operations. Edit at 72 means existing files were modified far more than replaced. Read at 63 reflects the upfront cost of understanding large files before touching them. Write at 19: new file creation is rarer than it seems.

This ratio reflects sound working patterns: understand existing code → modify only what's necessary → create new files only when required.

Session 7 (agentochester):
```
Bash(107), Edit(59), Read(49), Write(43), TaskUpdate(29)
```

Write jumps to 43 because this was a new repository being built from scratch. `TaskUpdate` at 29 is agent orchestration overhead — the coordination cost of running 9 parallel agents, made visible as a number.

---

## What's Still Incomplete

The automation is in place, but not finished.

**Build log quality**: Draft quality scales with session quality. This isn't a problem to solve in the pipeline — it's a discipline to maintain during sessions.

**Project curation**: 28 repos synced, but not all belong in the portfolio. Going through each one and toggling `visible` is still pending.

**Projects page redesign**: The current layout doesn't distinguish active from completed projects at a glance. A redesign that makes that distinction visual is next.

> When a site is clear about what it shows, the work that happens there becomes clearer too.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
