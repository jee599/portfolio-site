---
title: "103 Tool Calls Dissected: Running Claude Code via Telegram, MCP Disconnects, and Multi-Platform Publishing"
project: "portfolio-site"
date: 2026-04-19
lang: en
pair: "2026-04-19-portfolio-site-ko"
tags: [claude-code, telegram, mcp, automation, multi-platform]
description: "14 of 103 tool calls went to Telegram replies — not code. Here's what a session looks like when Telegram is the Claude Code control plane."
---

14 out of 103 tool calls went to sending Telegram messages. Not writing code, not editing files — delivering results to a human. That's what the distribution looks like when Telegram becomes your Claude Code interface.

**TL;DR** Telegram MCP receives instructions → `dentalad` GitHub repo scaffolded → MCP disconnects mid-session → reconnect → Pangyo AI event search → Claude design update published to two platforms. 41h 16m session, 5 files created.

## Why Telegram Became the Control Panel

Every instruction in this session arrived as a Telegram DM. "Start an English dental advertising project with git", "name it dentalad", "write a blog post about Claude's design update and publish it" — all phone messages.

The old workflow: sit at a terminal, type directly into Claude Code. The new one: send a message from anywhere. `claude-opus-4-7` receives the message through the Telegram MCP plugin, executes the task, and fires a completion notification back to Telegram.

The tool usage breakdown makes the architecture visible:

```
Bash(41) > WebSearch(17) > mcp_telegram_reply(14) > WebFetch(11) > Read(7) > Write(5)
```

Bash being first makes sense. But `mcp_telegram_reply` is third — ahead of file reads and writes. This wasn't just end-of-task pings. It was progress reporting at each stage: repo created, scaffolding done, files committed.

## The dentalad Repo: Two Prompts, One Scaffold

The entire instruction was: "Set up an English dental advertising project with git, one more repo."

Before executing, Claude asked for name candidates over Telegram. Four options. User picked `dentalad`. Execution started immediately.

```
~/dentalad/
├── clinics/
├── ads-research/
├── site/
├── templates/
├── docs/
├── README.md
├── package.json
└── .gitignore
```

`github.com/jee599/dentalad` private repo created, local scaffold generated, initial commit pushed. Each step — directory structure, `git init`, remote setup, first commit — was a separate Bash call. Splitting operations this way makes error tracing straightforward: if `git remote add` fails, you know exactly where.

## What Happens When MCP Disconnects

Mid-notification — right as Claude was sending the repo-creation confirmation to Telegram — the connection dropped.

From inside the Claude Code session, the signal was just "server disconnected." The underlying cause isn't visible from the client side. Common culprits:

- Bot token expiry or rotation
- Network timeout on the Telegram API side
- Plugin process crash
- Session loss after system sleep/wake

When the user asked why it disconnected, the diagnostic steps:

```bash
claude mcp list
tail ~/.claude/logs/*telegram* 2>/dev/null
```

Reconnection options: re-run `/telegram:configure` to revalidate the token, or restart Claude Code entirely. In this session, restart worked. The dentalad completion notification went out late — but it went out.

The key point: **MCP disconnection doesn't kill the underlying work.** The notification failed; the repo didn't. Task execution and the notification channel are decoupled. The repo was already on GitHub before the disconnect.

## Remote Agents Can't Reach Local MCP — and That Matters

When a request came in to schedule regular searches for AI events in Pangyo and Seoul, examining the remote agent setup revealed a hard constraint.

**Remote agents don't have access to local MCP plugins.**

Agents triggered remotely via Remote Trigger can only use connectors available on claude.ai — Vercel, Gmail. The local Telegram plugin doesn't exist in that environment. A remote agent can't push results to Telegram without a separate mechanism.

Two options:

1. **Direct Bot API call** — embed the bot token in the trigger prompt, call `sendMessage` via `curl`. Functional, but the token sits in plaintext in the trigger config.
2. **Gmail fallback** — route results through email.

Gmail is cleaner from a security standpoint. But the user decided against scheduling the search at all. The actual results weren't actionable — the April 14 and April 17 events had already ended. The active events at the time were Snowflake Arctic Challenge, AI Co-Scientist Challenge, and two others. Nothing requiring immediate registration.

## WebSearch × 17: The Multi-Platform Publishing Flow

The request "publish the Claude design update to spoonai and DEV.to" drove the heaviest search activity in the session.

The `/auto-publish` skill ran: take a keyword, use WebSearch to collect current source material, generate platform-optimized drafts, publish.

```
WebSearch → Anthropic blog, GitHub release notes, tech publications
WebFetch  → Extract full body from each source
Write     → Korean draft (spoonai.me) + English draft (DEV.to)
```

Two files produced:

- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md`
- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md`

One topic, two language-specific outputs. SEO canonical points to `jidonglab.com`.

The WebFetch(11) ratio is worth noting. WebSearch finds URLs; WebFetch reads the actual content. 11 fetches against 17 searches means roughly 65% of search results were actually read — full article bodies, not title skims.

## How Many of Those 103 Calls Actually Touched Code?

```
Bash(41):  shell execution (git, npm, curl, gh CLI)
Write(5):  new file creation
Read(7):   file reads
Edit(0):   zero existing file modifications
```

Edit count: zero. No existing code was changed in this session. New repo scaffolded, new posts generated, external APIs called. Pure creation, no modification.

Bash(41) dominates because most work was system operations: git commands, GitHub CLI, npm scripts, curl calls. Code editing wasn't the bottleneck — orchestration was.

> In this session, Claude Code was an operator, not an editor. It wasn't writing code — it was running tools.

## 5 Files From a 41-Hour Session

41 hours, 16 minutes. 103 tool calls. 5 files: 3 for the dentalad scaffold, 2 blog posts.

That ratio might look inefficient on paper. But most of the session was exploration and judgment: which events to track, how to configure the remote agent, what angle to take per platform. Those decisions don't produce files.

The bigger shift Telegram created isn't task density — it's task timing. Instructions don't require sitting at a terminal anymore. A thought surfaces on the subway; a message goes out. Results come back to the phone. The work happens when it's relevant, not when a terminal happens to be open.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
