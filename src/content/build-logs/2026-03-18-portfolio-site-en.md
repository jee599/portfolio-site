---
title: "5 Posts Vanished Silently. One Missing Line in GitHub Actions Was the Culprit."
project: "portfolio-site"
date: 2026-03-18
lang: en
pair: "2026-03-18-portfolio-site-ko"
tags: [claude-code, github-actions, astro, automation]
description: "5 commits, 0 posts on dev.to. The cause was a single missing path in a GitHub Actions trigger. 7 sessions, 719 tool calls — and a full site pivot while I was at it."
---

5 blog posts. All committed. All pushed. Zero appeared on dev.to.

No error notifications. No failed Actions runs. Just silence.

**TL;DR** — A single missing path in a GitHub Actions `on.push.paths` filter blocked every sync for the blog collection. Fixing it took 5 minutes. Noticing it took three sessions. While tracking down the bug, I also rebuilt jidonglab from an AI news site into a project portfolio hub — 7 sessions, 719 tool calls total.

## The Silent Drop

I handed five draft posts to Claude Code, had it write the files to `src/content/blog/`, committed and pushed. Standard workflow.

Except nothing happened on dev.to.

I checked the Actions tab. No workflow had run. The commits were there, the files were there — but the trigger never fired. Classic case of failing quietly.

I asked Claude to diagnose it:

```
Analyze why this commit didn't publish to dev.to.
Compare publish-to-devto.yml against the actual file paths and find the cause.
```

Under 3 minutes. The culprit:

```yaml
# publish-to-devto.yml — before
on:
  push:
    paths:
      - 'src/content/ai-news/**'  # only watches ai-news
```

`src/content/blog/**` was never in the trigger paths. When I wired up the AI news automation, I forgot to keep the original blog path. The workflow ran fine for AI news posts. For everything else, it never started.

The fix was two lines:

```yaml
# after
on:
  push:
    paths:
      - 'src/content/ai-news/**'
      - 'src/content/blog/**'   # added
```

Two Edits, six Bash commands, one commit. That's all it took.

## Why This Cost Three Sessions Instead of One

Here's the actual inefficiency: I spread this across three separate sessions.

Session 1 — generate the five post files. Session 2 — notice nothing published, diagnose. Session 3 — apply the fix.

Every session restart means reloading context: reading `CLAUDE.md`, re-familiarizing with the project structure, reviewing recent commits. That overhead compounds. Three sessions for a single-cause bug with a two-line fix is wasteful.

The lesson isn't about Claude Code specifically — it's about how to structure work. If you start a task, the diagnosis and fix belong in the same session unless there's a genuine reason to pause. Context is expensive to reconstruct.

When the scope is clear ("these posts aren't publishing"), keep it together until it's done.

## Diagnose First, Fix Second

The prompt that cracked this open wasn't "fix the publishing workflow." It was "analyze why this commit didn't publish."

That distinction matters.

"Fix it" creates pressure to try things. The model might adjust a different part of the workflow, rewrite the sync logic, or add error handling — without identifying the root cause. You end up with a patch on the wrong surface.

"Analyze why" forces diagnosis first. Once the root cause is explicit and confirmed, the fix almost writes itself.

This is the most reliable Claude Code pattern I've found: **diagnose before fixing.** Especially when something is failing silently.

```
Step 1: "Analyze why X isn't working. Compare A and B and identify the discrepancy."
Step 2: (confirm the cause) "Fix it."
```

Skipping Step 1 is how you spend an hour fixing the wrong thing.

## The Bigger Project: Turning jidonglab into a Portfolio Hub

While tracking down this bug, I noticed something harder to ignore.

jidonglab was running as an AI news site. But it was supposed to be a portfolio. I had 11 active git projects locally; 7 were on the site. Build logs were written manually. There was no central place to track project status.

I asked Claude for an implementation plan:

```
Convert jidonglab.com from an AI news/blog site into a project portfolio hub.
Design the plan: project registry + admin management + build log automation.
```

Once the plan came back, I ran the full implementation in a single session: `scripts/project-registry.yaml` for project metadata, `src/content/projects/` for individual project YAML files, an admin page for editing status and links.

That session: 322 tool calls. Bash led at 204, then Edit at 44, Read at 41, Write at 19.

Bash dominates because the short utility commands pile up fast — checking file existence, running `npm install`, verifying git state, confirming build output. Each one is a few seconds, but at 204 calls, it adds up. This is normal for sessions that touch both code and build tooling.

## Build Log Automation from Claude Code's Own Files

The most unexpected discovery in this project came from poking around `.claude/`.

Claude Code stores all conversation history as JSONL files under `.claude/projects/[project-hash]/`. Each session is a separate file. Each file contains every message, tool call, and tool result.

If you can parse those files, you can reconstruct what happened in any session: which files were touched, what tools ran, what the user asked for, what Claude produced.

I asked Claude to build that parser:

```
Analyze the JSONL file structure in .claude/projects/[hash]/*.jsonl
and write a parse-sessions.py script that extracts:
- per-session work summary
- tool usage stats
- list of modified files
Output in markdown format.
```

`scripts/parse-sessions.py` now runs on a local cron every 6 hours. Each run produces a build log draft — session summaries, tool breakdowns, file change lists. This build log was written from that output.

The implementation is a `LaunchAgents` plist registered to macOS, triggering the script on schedule. The outputs feed into the content pipeline.

The interesting thing about this approach: Claude Code is essentially self-documenting, if you're willing to read its own logs. You don't need to instrument anything or add logging. The data is already there.

## The GitHub API Mistake

After the portfolio pivot, I hit a 403 from GitHub API when trying to update project status from the admin page.

```
GitHub API Error 403
```

At first this looked like a rate limit or permissions issue. But the actual problem was architectural: `admin.astro` was calling the GitHub API to update project information, when it should have been writing directly to local YAML files.

There was no reason to go through GitHub API at all. The admin page runs on the same machine as the project files. The right approach is `fs.writeFileSync` to the local YAML, not a remote API call to write the same data through a third party.

I rewrote the `admin-projects.ts` API route to read and write local YAML directly. No GitHub token needed. No rate limit risk. Simpler dependency graph.

```
fix: admin projects GET — remove GitHub API calls, prevent rate limit issues
```

That was the final commit of session 7. Sometimes the fix for an API error is removing the API call entirely.

## 7 Sessions, by the Numbers

Total across all sessions: **719 tool calls**.

| Tool  | Count | Share |
|-------|-------|-------|
| Bash  | 365   | 51%   |
| Write | 117   | 16%   |
| Read  | 113   | 16%   |
| Edit  | 98    | 14%   |
| Agent | 13    | 2%    |

78 files created, 31 files modified.

Bash at 51% isn't a problem — it reflects the build-and-verify loop that any real implementation session involves. The ratio shifts toward Edit/Write when work is mostly code, toward Bash when it involves dependency management, build verification, and git state checks.

The 3-session detour on a 2-line bug is the real inefficiency number here. Not the tool call count.

## What Actually Transferred

Two things from this session that will change how I work:

**Keep diagnosis and fix in the same session.** If you've confirmed the cause, don't save the fix for later. Later means context reload, which means time wasted reconstructing what you already knew.

**JSONL parsing as build log automation.** Claude Code's session files are a free data source for project history. If you're already using Claude Code heavily, parsing `.claude/projects/` is the lowest-effort path to automated build logging.

The prompt pattern that got the most leverage this session:

```
Analyze why [X] isn't working.
Compare [A] and [B] and identify the discrepancy.
```

Then, after confirmation: `Fix it.`

Two prompts, correct answer. One prompt that conflates the two, and you're debugging the fix.

> Diagnose first. Fix second. That ordering is the difference between efficient and lucky.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
