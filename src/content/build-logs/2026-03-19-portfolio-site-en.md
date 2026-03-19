---
title: "Running 4 Projects with Claude Code in One Day — 423 Tool Calls, One Session"
project: "portfolio-site"
date: 2026-03-19
lang: en
pair: "2026-03-19-portfolio-site-ko"
tags: [claude-code, astro, github-api, automation]
description: "Converted jidonglab.com from AI news blog to portfolio hub in one Claude Code session: 423 tool calls, GitHub API 403 debugging, parallel translation agents, and YAML edge cases."
---

I ran 9 Claude Code sessions in a single day. The main one had been running for 73 hours.

Not 73 minutes. 73 hours of wall clock time.

That's how Claude Code sessions work — they persist through machine sleep, context switches, and everything else. I'd started it two days earlier on a different task, kept it open, and by the time I actually checked the session clock, it read 73h.

**TL;DR:** Converted jidonglab.com from an AI news aggregator to a full project portfolio hub using Claude Code. GitHub API 403 debugging, parallel agent translation (6 files at once), automated build log generation, and enough YAML edge cases to last a while. Total tool calls: 423.

## A Plan Document Isn't Optional at This Scale

The first thing in the prompt wasn't a feature request. It was a full implementation plan:

```
Implement the following plan:

# jidonglab Portfolio Hub Renewal

I have 11 git projects locally but only 7 are registered in the portfolio,
and build logs are generated manually.
```

Then the full spec followed — Steps 1 through 5, each with specific files to create or modify.

This is the thing that separates productive Claude Code sessions from expensive ones. If you start with "improve the admin page," Claude will make reasonable-sounding decisions with no shared direction. You end up reviewing changes you didn't ask for.

The plan specified a precise implementation order: add a `visible` field to `src/content/config.ts` schema → create `project-registry.yaml` → write `generate-build-log.sh` → add API endpoints → add Admin tab. Claude followed this sequence exactly. I could pause between steps, review, and decide whether to continue before the next piece ran.

With a plan, Claude is a precise executor. Without one, it's a well-intentioned guesser.

Tool calls by the end of the session: Bash 248, Edit 72, Read 63, Write 19. Total: 423.

## The GitHub API 403 That Took Two Minutes to Fix

The admin feature goal was simple: pull all my GitHub repos, let me toggle which ones appear in the portfolio. One UI, one source of truth, no more manually editing YAML files.

Implementation went smoothly until the first test:

```
github api error 403
```

Claude had written the `admin-projects.ts` endpoint to read `process.env.GITHUB_TOKEN`. The problem: I had a token in the account but hadn't added it to my local `.env`. Worse, the token existed with read-only access — I hadn't checked the `repo` scope when creating it.

Fixed the scope, added the token to `.env`, ran again:

```
9 registered, 28 on GitHub
```

Before: manually editing a YAML file every time I started or finished a project. After: a toggle in the admin UI. 28 repos visible, I check the ones I want surfaced in the portfolio, done.

One thing worth noting about this error class: GitHub's API returns 403 for both "token missing" and "token lacks scope." The response body gives more detail, but at a glance you can't tell which you're hitting. Claude flagged both possibilities — I checked scope first, which turned out to be the issue.

## Parallel Agents: Not Just Delegation, Actual Parallelism

I had 6 Korean build logs that needed English versions. Sequential processing would've consumed the rest of the session.

Instead, Claude spun up an agent:

```
Agent "Translate 6 build logs to English" completed
All 12 files created successfully.
```

One agent call, 6 files in, 12 files out (original + translation each). While the agent was working, I kept building out the portfolio admin features.

This is what the Agent tool in Claude Code actually does — it's not just task offloading, it's concurrent execution within a session. The agent runs its task, the main session runs another, results come back when the agent finishes.

The translated drafts needed tone editing afterward. English developer readers expect different framing than Korean readers — more context on unfamiliar concepts, different structural emphasis. But the raw translation gave me accurate technical content to work from. Starting from scratch would've taken significantly longer.

The practical rule I've settled on: if a task involves 3+ similar items that don't depend on each other, it's a parallel agent job.

## Long Sessions and Context Compression

The session log for this day touched portfolio-site, uddental, agentochester, and tokenzip — four separate projects. My concern going in was that context would bleed across projects.

It didn't.

Claude targeted the right project directory for each task without confusion. Switching from `~/portfolio/portfolio-site/` to "check the dental project" moved to `~/uddental/` cleanly. Any context-switching problems were mine, not Claude's.

The real risk with long sessions is different: context compression.

When a session runs long enough, older messages get compressed into summaries. Claude starts working from a compressed version of earlier context, not the original. The longer the session, the more information gets approximated.

I saw this directly: late in the 73-hour session, a display bug in the admin projects tab came up again — the same bug I'd already fixed hours earlier. Claude flagged it as new. That earlier fix had been compressed out of accessible context.

The practical ceiling I've landed on: **200–300 tool calls per session** is about where context degradation becomes noticeable. Beyond that, a fresh session is faster than compensating for what's been forgotten. Starting fresh costs you a context reload. Working through degraded context costs you debugging time on problems you already solved.

300 tool calls is a rough threshold, not a hard rule. But if you're at 400+ and things feel off, it's probably the session, not the code.

## DEV.to: The Korean Posts That Shouldn't Have Been There

After the admin work, I checked DEV.to. Several posts had gone up in Korean — not intentional. English-language platform, Korean content.

```
pull down anything in Korean,
check if current English posts are set up for search/traffic
```

Claude used the DEV.to API to flip those posts to `published: false`. Then it analyzed the existing English posts for patterns.

The SEO signal was clear: posts with numbers in the title consistently outperform descriptive ones. "88% cost reduction" beats "cost optimization approach" in click-through. Tags matter too — `ai` and `webdev` carry significantly more traffic than specific technical tags like `astro` or `yaml`. The right move is to anchor every post with at least one high-traffic tag, then fill remaining slots with specific ones.

Not surprising findings. But having them grounded in actual data from existing posts is more actionable than general SEO advice.

## Build Log Automation: What "Automatic" Actually Means Here

I built two scripts: `scripts/generate-build-log.sh` and `scripts/parse-sessions.py`.

The pipeline: Claude Code stores session data as `.jsonl` files under `.claude/projects/`. The parser extracts which files were modified, what prompts were entered, and how many tool calls happened per session. That structured data gets passed to Claude, which generates a build log draft from it.

A `LaunchAgent` at `~/Library/LaunchAgents/com.jidong.build-log.plist` runs the parser every 6 hours.

What "automatic" doesn't mean: the post publishes itself. The draft is auto-generated, I review it, I publish it. Auto-generate + manual publish is the right split. Fully automatic means publishing things I haven't read.

The actual time saving: from "session happened" to "post published" dropped from around 90 minutes to about 20. The parser handles data extraction and structure. Claude fills in narrative from the data. I clean up tone and add context the parser can't infer. That's the right division of labor.

## YAML and the URL Colon Problem

Near the end of the session, the admin UI started throwing errors when I added a project URL:

```
adding a link or project status in admin shows some yaml error
```

The cause: URLs contain colons. YAML uses colons as key-value separators. An unquoted URL like `https://github.com/user/repo` looks to the YAML parser like two things: a key `https` and a value `//github.com/user/repo`. Parser fails.

The fix: when writing string values to YAML, automatically wrap them in quotes. One utility function change.

The broader pattern here is familiar: edge cases like this only surface when you actually use the feature with real data. Claude Code helps you build fast, which means you hit these issues at the "testing it out" stage rather than the "planning it out" stage. The feedback loop becomes: build fast → break on real input → fix immediately. For solo development, that's the right loop to be in.

> Write the plan first. Run parallel agents. Cut sessions at 200–300 tool calls. Claude Code's efficiency comes from workflow, not from the tool itself.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
