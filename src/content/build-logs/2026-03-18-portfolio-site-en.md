---
title: "854 Claude Code Tool Calls in One Day: Building a Portfolio Hub and Automating Build Logs"
project: "portfolio-site"
date: 2026-03-18
lang: en
pair: "2026-03-18-portfolio-site-ko"
tags: [claude-code, portfolio, automation, astro]
description: "854 tool calls, 7 sessions, 4 projects in a single day. How I converted jidonglab from an AI news site to a portfolio hub and built a JSONL-based build log automation pipeline."
---

854. That's how many times Claude Code called a tool in a single workday.

Bash: 403. Read: 159. Edit: 124. Write: 117. Seven sessions. Four different projects.

The number sounds impressive. The day wasn't extraordinary. When you run multiple projects with Claude Code as your primary development loop, this is just what a normal Thursday looks like.

**TL;DR** I converted `jidonglab.com` from an AI news aggregator to a project portfolio hub, built a JSONL-based pipeline that auto-generates build logs from Claude Code session data, and hit a GitHub API 403 that was entirely avoidable.

## The Site That Forgot What It Was For

`jidonglab.com` started as an automated AI news publisher. Every day at 9 AM and 9 PM KST, Claude crawls the latest AI news and posts summaries automatically. It runs fine.

But I'd been ignoring a problem. I have 11 git projects running locally. The portfolio only listed 7. Build logs had to be written manually. The thing that was supposed to represent my work was the most neglected part of the stack.

So I made a call: AI news becomes a side feature. The main thing becomes a project hub.

The reasoning was simple. If someone lands on `jidonglab.com`, I want them to see what I'm actually building — not a curated feed of AI news articles I didn't write.

## One Prompt to Drive 331 Tool Calls

The conversion plan was written as a markdown spec and handed to Claude as a single prompt:

```
Implement the following plan:
# jidonglab Portfolio Hub Renewal
## Context
Convert jidonglab.com from an AI news/blog site
to a project portfolio hub...
```

That prompt drove Session 2 in its entirety. 331 tool calls. Bash: 213, Edit: 44, Read: 41.

Claude handled it autonomously: added a `visible` field to the `src/content/config.ts` schema, generated `scripts/project-registry.yaml`, built Projects and Build Logs tabs into the admin panel, wired up `src/pages/projects/index.astro` and `[slug].astro` routing.

This is the pattern I've settled into for large-scope work. Write a thorough spec in markdown. Hand it over as one prompt. Context-switch to something else. Come back and review the diff.

The tradeoff: Claude optimizes for "make it work first." Edge cases get missed. Session 2 introduced one immediately.

## The GitHub API 403 That Shouldn't Have Existed

After deploying the admin panel changes, updating a project's status returned this:

```
github api error 403
```

I dug into `admin-projects.ts`. The GET route was calling the GitHub API to fetch project metadata — without authentication. Rate limit exceeded.

The fix was trivial: read project data from the local YAML file instead. The GitHub API was never needed here.

```typescript
// Before: unnecessary external call
const repos = await fetch(`https://api.github.com/user/repos`, { headers });

// After: read local YAML directly
const registry = yaml.load(fs.readFileSync('scripts/project-registry.yaml'));
```

Commit: `fix: admin projects GET — remove GitHub API call, prevent rate limit`

This class of bug has a frustrating pattern. It doesn't surface during development. You test locally, everything passes. You ship it, real traffic hits the rate limit, and your admin panel breaks in production.

The root cause: Claude, when implementing from a spec, tends to reach for external data sources when local ones would do. If I'd added `"minimize external API calls"` as an explicit constraint in the original spec prompt, this wouldn't have happened. Prompts that describe *what* to build need to also describe *how not* to build it.

## The Build Logs Were Already Being Written

Mid-session, a different question came up:

> "Instead of writing build logs manually, what if we used the project `.jsonl` files? What even is in those?"

Claude Code stores every session conversation under `~/.claude/projects/` as a `.jsonl` file. One file per session. Each line is a JSON object — the message content, tool calls, timestamps, everything.

```json
{"type":"user","message":"..."}
{"type":"tool_use","name":"Bash","input":{"command":"..."}}
{"type":"tool_result","content":"..."}
```

That means the raw material for a build log already exists. It just needs to be extracted.

```
How do we parse the jsonl to get per-project logs,
prompt content, and a summary of what was done?
```

Claude wrote `scripts/parse-sessions.py`. It reads `.jsonl` files and extracts user prompts, tool usage stats, and lists of files created or modified. `generate-build-log.sh` then feeds that output to Claude API and gets back a draft build log.

This post came through that pipeline.

Writing a build log manually used to take 30 minutes. Now it's one script execution. The automation pays for itself in days — and more importantly, it removes the psychological friction that makes you skip documentation entirely.

If you use Claude Code, your `~/.claude/projects/` directory already contains a complete history of everything you've built. Worth knowing.

## Four Projects in One Day

The projects I touched that Thursday: `portfolio-site`, `LLMMixer` (new), `uddental` (dental clinic), `saju_global` (Korean fortune app).

The scope was completely different across each. LLMMixer was a full architecture design for a greenfield project — normally weeks of planning, handled in one session, 78 new files created. `uddental` was a two-minute session to fix an inverted heading hierarchy. `saju_global` needed compliance changes for a payment processor review: add business registration info to the footer, add a product section.

Without Claude Code, this combination is effectively impossible in a single day. Every time you switch to a different codebase, you're spending mental energy re-orienting — remembering conventions, understanding structure, recalling where you left off.

Claude absorbs that cost. For short tasks, the prompt is literally: "go into this project and fix X." Claude reads the codebase, diagnoses the problem, makes the change, commits. My job is to review the diff.

## Installing a Skill Ecosystem

Something else happened during this session: I installed `superpowers`, `engineering-skills`, `product-skills`, and `marketing-skills` back-to-back.

Claude Code's skill system lets you pre-define workflows for specific task types — TDD, debugging, code review, PRD writing. Once a skill is installed, saying "implement this with TDD" means the entire test-first cycle without having to specify each step.

There was a small hitch during installation. Pasting two commands on one line caused a URL parsing error:

```bash
# This broke
/plugin marketplace add coreyhaines31/marketingskills
/plugin install marketing-skills

# These needed to run separately
```

Trivial, but it burned 15 minutes I wasn't expecting to spend.

## What the Numbers Actually Tell You

Bash at 403 is the top tool by a wide margin. Build runs, git commits, script executions — short commands that stack up fast. Read at 159 before Edit at 124 is a healthy ratio: Claude reads before it modifies. When that ratio inverts, side effects from poorly-understood changes start showing up.

Write at 117 is high because of LLMMixer: 78 new files created in one day for a greenfield project.

The number I watch most is the Read-to-Edit ratio. When Bash dominates Read, Claude was executing more than exploring. Fine for well-defined tasks — a problem if surprises keep appearing mid-session.

> Break large tasks into smaller ones and the quality of each step goes up. If you don't break them down, Claude will — but its criteria and yours may not match.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
