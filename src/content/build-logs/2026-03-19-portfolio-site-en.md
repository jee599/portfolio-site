---
title: "Claude Code Logs Everything. I Built a Pipeline to Read Them."
project: "portfolio-site"
date: 2026-03-19
lang: en
pair: "2026-03-19-portfolio-site-ko"
tags: [claude-code, astro, portfolio, automation, github-api]
description: "73 hours, 423 tool calls. How I parsed Claude Code's .jsonl session logs to auto-generate build logs and rebuilt jidonglab.com as a project portfolio hub."
---

73 hours. 423 tool calls. One Claude Code session.

I didn't plan to leave it running that long. I just kept working, kept adding, kept fixing. When I finally checked the session timer, it read 73 hours 53 minutes. The clock doesn't lie — Claude Code accumulates session time continuously unless you explicitly close it.

That number is also why this build log exists at all. I found it in a `.jsonl` file.

**TL;DR**: Claude Code logs every session to `~/.claude/projects/` as `.jsonl` files — user prompts, tool calls, file changes, all of it. I built a pipeline (`scripts/parse-sessions.py` + `scripts/generate-build-log.sh`) to parse those logs and auto-generate build logs. In the same session, I rebuilt jidonglab.com from an AI news site into a project portfolio hub, connected 28 GitHub repos through the API, and added admin controls for managing project visibility without touching code.

## The .jsonl Files You Didn't Know Were There

I stumbled on this by accident. Mid-session, I opened `~/.claude/projects/` for an unrelated reason. It was full of `.jsonl` files. Every project, every session, every conversation — all recorded. User prompts, tool invocations, file diffs, assistant responses. A complete timestamped history of everything I'd asked Claude to do.

The build log use case hit me immediately.

I'd been writing build logs manually — sitting down after a long session and trying to reconstruct what happened. That workflow has two problems. It's tedious: you spend 20-30 minutes writing about work you just spent hours doing. And it's lossy: the interesting decisions compress into vague summaries. "Refactored the admin panel" isn't useful. The specific reason you chose one approach over another — that's what's worth recording.

The `.jsonl` files don't compress anything. They keep everything.

I asked Claude directly:

> "How can I use these .jsonl files to automatically generate per-project logs — prompts, file changes, tool usage?"

The output was `scripts/parse-sessions.py`. It reads the `.jsonl` for a given project, extracts all user-authored prompts, collects the list of files modified by Edit/Write tools, and counts tool usage by type. Piped through `scripts/generate-build-log.sh`, the parsed output becomes a structured Markdown build log — headings, tool usage table, prompt excerpts, the works.

The pipeline doesn't replace editorial judgment. You still decide what context matters, what story to tell. But the raw material is already there. You're curating, not reconstructing.

No more manual archaeology. The session remembers. The script reads it. The log writes itself.

## "Why Can I Only See 7 of My 11 Projects?"

jidonglab.com started as an AI news aggregator with a blog. I added a portfolio section later, but it was duct-taped together — 11 active projects, only 7 showing up, no way to manage visibility without editing Astro content files directly. New projects required touching `src/content/projects/`, rebuilding, and deploying.

This was the core task for this session: turn jidonglab.com into a proper portfolio hub.

Three pieces: a project registry, GitHub API integration, and a rebuilt admin panel.

The registry lives in `scripts/project-registry.yaml`. Each entry maps a project to its local git path, slug, and branch — enough information for CLI scripts to locate the right repo and pull commit history. This file is intentionally CLI-only. It has no relationship to the Astro build process. Keeping it separate means I can use it in scripts without worrying about Astro's content pipeline expectations.

On the Astro side, I added a `visible` field to the projects collection schema in `src/content/config.ts`. Toggling a project's portfolio visibility is now a content operation — flip the field, the project appears or disappears from the portfolio page. No code changes, no redeploy required beyond the content update itself.

The GitHub API connection was the ugly part. First attempt returned a 403.

> "github api error 403"

Obvious in hindsight: listing private repos requires a Personal Access Token with explicit `repo` scope. The default token I'd set up didn't have it. I updated the token permissions, retried, and got access to all 28 repos.

Seeing "9 registered, 28 on GitHub" appear in the admin panel was the moment the whole thing clicked into place. Nine projects deliberately added to the portfolio. Nineteen more repos on GitHub — experiments, abandoned ideas, private work — visible to me as context, invisible to visitors.

That gap between "on GitHub" and "in portfolio" is exactly the kind of curation that should be admin-controlled, not hardcoded. It is now.

## admin.astro: Working Inside a 58KB File

The admin panel is a single Astro file. At the start of this session it was already 58KB — months of accumulated feature work packed into one component. Tabs, modals, fetch calls, inline JavaScript for client-side interactivity. Entirely manageable, but large enough that you can't hold the whole thing in context at once.

I added two new tabs: Projects and Build Logs.

The Projects tab shows the registered/GitHub split, surfaces each project's metadata from the content collection, and lets me toggle visibility. The toggle writes back to the YAML frontmatter of the corresponding project file. The Build Logs tab surfaces parsed session data — recent prompts, tool usage stats, modified file lists — directly in the browser.

Tool usage for this section alone: Bash 248 times, Edit 72, Read 63.

The Read count tells the story. With a 58KB file, you can't drop it in context as a whole. The workflow was: read a section, understand it, edit a specific part, read again to verify the change landed correctly. This pattern repeated dozens of times across the session. It's slow by absolute standards, but it's accurate — each edit had full context for the surrounding code.

Midway through, I hit a YAML parsing error when toggling project status from the admin panel. The bug was in how the parser handled YAML keys that contained nested objects — it was reconstructing the serialized output incorrectly, which caused the file write to corrupt the frontmatter structure. Found the specific line, patched the reconstruction logic, confirmed the fix by toggling a test project back and forth a few times in the UI.

Admin panel complexity scales nonlinearly with feature count. This was a reminder.

## Korean Posts on DEV.to

While the portfolio work was running, I noticed something in the content audit:

> "Take down any Korean-language posts on DEV.to and check whether existing posts are properly set up for search visibility."

The auto-publish script that pushes build logs to DEV.to had been running without a language filter. Korean build logs were going to DEV.to alongside English ones. DEV.to is an English-first platform — Korean posts don't index well for the audience there, and they create a confusing experience for readers who land on them.

I pulled the Korean posts, then went through the existing English build logs and updated titles and tag sets for better search alignment. Titles with specific technology names and outcomes outperform generic titles consistently; the existing ones were too vague.

The translation backlog was six Korean build logs that needed English counterparts. Sending that work to the same session would have been a mistake — mixing translation and implementation work in one context degrades quality in both directions. Instead, I used the `Agent` tool to spin up a dedicated translation agent:

> "Agent 'Translate 6 build logs to English' completed. All 12 files created successfully."

One agent, six source posts, twelve outputs — a DEV.to version and a Medium version per post. The isolated context paid off. Translation quality was consistent across all six posts in a way it usually isn't when I've tried to do translation as a side task during implementation work.

This is the clearest argument for multi-agent approaches in Claude Code: not just parallelism, but context hygiene. A task that deserves its own focused context should get its own context.

## CronCreate: Scheduling Inside the Session

After building the pipeline, I wanted it to run automatically:

> "Set up Claude Code scheduling to update build logs per-project every 6 hours, then post to jidonglab."

This was my first time using `CronCreate`. I'd seen it in the docs but hadn't had a practical use case.

The difference from a local cron is meaningful. `CronCreate` schedules run inside the Claude Code session context. That means they can execute prompts, use tools, interact with files through the same interface as interactive work. A local cron can only run shell commands — it can call a script, but it can't continue a conversation or use Claude tools directly.

For the build log pipeline, the practical implication is that a `CronCreate` job can run the parse script, review the output, make editorial decisions about what goes in the final log, and push the result — all as part of the same scheduled task. A shell-based cron can only run the script. It can't do the judgment layer.

A fallback `~/Library/LaunchAgents/com.jidong.build-log.plist` was also generated as a launchd-based local schedule for cases where the Claude Code session isn't active. Belt and suspenders — the shell-based cron handles the raw pipeline; the `CronCreate` job handles the full editorial pass when the session is live.

## Session Stats

Full tool breakdown for this session:

- Bash: 248 — git status, npm builds, API testing, curl calls to verify endpoints
- Edit: 72 — admin.astro, schema changes, component modifications
- Read: 63 — working through the 58KB admin file in chunks, plus other config files
- Write: 19 — new files: scripts, YAML registry, generated build logs
- Grep: 10 — code search when I needed to find specific patterns across the codebase

Total session time: 73 hours 53 minutes. Actual active work was spread across roughly a day and a half. The timer reflects elapsed wall time, not compute time — Claude Code keeps the session open until you explicitly close it, so the 73 hours includes all the gaps between active work.

That 73-hour number is, incidentally, why I found this project entry so easily in the `.jsonl` files. It stood out.

> The logs are already there. All you need is a script to read them.
