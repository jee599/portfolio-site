---
title: "Telegram as a Claude Code Remote: 47-Hour Session, 111 Tool Calls"
project: "portfolio-site"
date: 2026-04-20
lang: en
pair: "2026-04-20-portfolio-site-ko"
tags: [claude-code, telegram, automation, project-bootstrap, auto-publish]
description: "How I ran a 47-hour Claude Code session asynchronously via Telegram DMs — bootstrapping a new project, hunting AI events, and publishing to 3 platforms."
---

A session that started with a two-character message ran for 47 hours and racked up 111 tool calls.

**TL;DR** Using Telegram as a remote interface for Claude Code means you can queue work without sitting at your computer. This session covered bootstrapping the `dentalad` project with GitHub integration, searching for Pangyo AI events, and auto-publishing a Claude Design blog post across three platforms — all asynchronously.

## Why Telegram Works as a Remote Control

Every instruction in this session came through Telegram DMs. Short messages, staggered over time: "spin up another project" → "call it dentalad" → "write a blog post" → "what angle?" The session stays open; new messages pick up where the last one left off.

The async advantage is obvious. Queue work while commuting, or right after waking up, with a single line. Claude processes it while you're doing something else. The tradeoff: if the MCP connection drops, notifications stop flowing.

```bash
# Diagnose a dropped Telegram MCP connection
claude mcp list
tail ~/.claude/logs/*telegram* 2>/dev/null
```

Common culprits: momentary network drops, expired bot tokens, session loss after system sleep. This session hit one mid-run. I couldn't get notifications through Telegram, confirmed the token via `/telegram:configure`, and reconnected.

## Bootstrapping `dentalad` in 5 Minutes

The prompt: "Set up a new project for dental advertising — English name, wired to git. Not uddental."

I proposed four name options. The reply: "dentalad sounds good." Done.

One sequence handled everything: create `~/dentalad/` locally, create a private `github.com/jee599/dentalad` repo, scaffold the directory structure, push initial commit.

```
dentalad/
├── clinics/          # per-clinic materials
├── ads-research/     # ad research
├── site/             # website
├── templates/        # ad templates
├── docs/             # documentation
├── README.md
├── package.json
└── .gitignore
```

A significant chunk of the 41 Bash calls went here. The `gh repo create` → `git init` → `git push` chain is short, so this resolved fast.

## Searching Pangyo AI Events — and the Scheduler Limitation

The prompt: "Find Claude-related meetups or hackathons near Pangyo, Seoul."

20 WebSearch calls later, the results were thin. Events from April 14 and 17 had already closed. I forwarded four events with open registration: Snowflake AI Hackathon, AI Co-Scientist Challenge, a public education data hackathon, and Meta Llama Academy @ Pangyo.

Then: "Can you set up a recurring search and alert me when something new shows up?"

This is where a real constraint surfaced. **Remote scheduled agents can't reach the Telegram MCP.** The only connectors available in claude.ai are Vercel and Gmail. The Telegram plugin I use is local-only. A scheduled agent could run the search, but it has no way to deliver the notification.

I laid out the options:

1. **Telegram Bot API via `curl sendMessage`** — embed the bot token directly in the trigger prompt. Functional, but the token lives in plaintext.
2. **Gmail** — send to jidongs45@gmail.com. Stable, but a different UX from Telegram.

The conclusion: for low-frequency event searches, manual lookup when needed beats a scheduled agent with no reliable notification path.

## Auto-Publishing a Claude Design Post to 3 Platforms

The prompt: "Write a blog post about Claude's new design."

I ran the `/auto-publish` skill: keyword input → WebSearch for current material → generate per-platform formats → publish. One pass.

Output files:
- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md` — English post for DEV.to
- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md` — Korean post for spoonai.me

Most of the 14 WebFetch calls went here — pulling from Anthropic's official announcement, tech blog coverage, and GitHub release notes for cross-verification.

The key detail for multi-platform publishing is `canonical_url`. Every English post going to DEV.to and Hashnode sets `canonical_url` pointing back to `jidonglab.com`. Same content across multiple platforms, zero SEO duplicate penalty.

## Session Stats

47 hours 11 minutes. 111 tool calls.

| Tool | Count |
|------|-------|
| Bash | 41 |
| WebSearch | 20 |
| Telegram reply | 16 |
| WebFetch | 14 |
| Read | 7 |
| Write | 5 |
| ToolSearch | 3 |
| Skill | 2 |

Bash dominates because git operations, script execution, and directory setup are all Bash. WebSearch's 20 calls split between the event search and Claude Design research.

5 files created. 0 files modified. This session was pure net-new output.

## What This Pattern Actually Looks Like

The async remote control loop has a distinct shape: vague short message → Claude proposes options → one-word selection → completion notification. That loop turns over quickly.

The prerequisite is MCP connection stability. If it drops, notifications don't arrive and you have no idea whether the work completed. For anything important, leave a paper trail that doesn't depend on the notification channel — a file write, a git commit, something visible in the repo. That way the work is provable even if Telegram goes silent.

> Async remote control is convenient. But the work needs to be verifiable even when the notification channel is down.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
