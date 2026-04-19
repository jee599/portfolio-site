---
title: "One Telegram Message, One GitHub Repo: Claude Code as an Async Assistant (111 Tool Calls)"
project: "portfolio-site"
date: 2026-04-19
lang: en
pair: "2026-04-19-portfolio-site-ko"
tags: [claude-code, telegram, automation, github, claude-design]
description: "From a single Telegram message to a scaffolded GitHub repo in under 30 minutes. What 111 tool calls across a 47-hour session actually produced."
---

I sent one Telegram message: "spin up another project for dental ads, English-focused." Under 30 minutes later, `~/dentalad/` existed on disk and a private GitHub repo was live. This is what Claude Code as an async assistant looks like in practice.

**TL;DR** Delegated a full day of async tasks through a Telegram → Claude Code pipeline. 111 tool calls — nearly half split between `Bash` (41) and `WebSearch` (20). 16 Telegram replies show how much back-and-forth async delegation actually generates.

## One Message to a Live GitHub Repo

The prompt was minimal:

> "Create another project connected to git, dental ads in English"

Claude proposed four name candidates. I replied "dentalad ok." Execution started:

1. Created `~/dentalad/` directory
2. Scaffolded `clinics/`, `ads-research/`, `site/`, `templates/`, `docs/`
3. Wrote `README.md`, `package.json`, `.gitignore`
4. Created `github.com/jee599/dentalad` as a private repo via `gh repo create`
5. Initial commit + `git push -u origin main`

A large chunk of the 41 Bash calls were consumed here, running in sequence: `gh repo create` → `git init` → `git remote add` → `git push`. My only input was confirming the name.

## When MCP Drops Mid-Session

Partway through, the Telegram MCP server disconnected. The session received only a "disconnected" signal — no root cause, nothing visible on the client side.

The usual suspects:

- Bot token expiry or rotation
- Temporary network interruption
- Plugin process crash
- Session loss after system sleep

Reconnection was straightforward: ran `/telegram:configure` to check token state, reconnected. The dentalad completion notification went out after reconnection.

The lesson: the Telegram pipeline is convenient but only as reliable as the MCP connection. In long sessions, disconnects happen. Reconnection is easy, but any queued notifications need to be resent manually. Plan for the gap.

## The Hard Limit of Scheduled Agents

"Search for Claude events in Pangyo on a schedule and notify me when something comes up." This hit a wall.

Remote scheduled agents (CCR) don't have access to local MCP plugins. The connectors available on claude.ai are Vercel and Gmail — the Telegram plugin is local-only. A remote agent has no path to push results to Telegram without an external mechanism.

Two options on the table:

1. **Direct Telegram Bot API** — embed the bot token in the trigger prompt, call `sendMessage` via `curl`. Works, but the token lives in plaintext in the trigger config.
2. **Gmail fallback** — route notifications through the Gmail connector already linked to claude.ai.

Scheduled agents are powerful, but they're isolated from the local plugin ecosystem. That separation is a real constraint when Telegram is your notification layer.

## Claude Design Blog → auto-publish

"Write and post a blog about the Claude design update." Used the `auto-publish` skill to generate two files simultaneously:

- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md` (for DEV.to)
- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md` (for spoonai.me)

Most of the 20 WebSearch and 14 WebFetch calls were spent here — pulling official docs, release notes, and technical blogs to fill the content. One source topic split into two platform-specific outputs. The time-per-output ratio is favorable once the pipeline is running.

## Session Stats

| Metric | Value |
|--------|-------|
| Session duration | 47h 11min |
| Total tool calls | 111 |
| Bash | 41 |
| WebSearch | 20 |
| Telegram reply | 16 |
| WebFetch | 14 |
| Files created | 5 |
| Files modified | 0 |

Bash at the top was expected. The number worth noting is 16 Telegram replies — that's how much async delegation actually produces, even in a session that feels lightweight. Instructions, confirmations, status pings, and completion notifications all go through the same channel.

## What's Next

- Investigate Telegram MCP auto-reconnect on disconnection
- Populate actual content in the dentalad project
- Design a scheduled agent + notification pipeline that doesn't depend on local Telegram MCP (decide between Bot API token approach and Gmail fallback)

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
