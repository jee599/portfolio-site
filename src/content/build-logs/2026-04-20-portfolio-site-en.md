---
title: "Remote-Controlling Claude Code via Telegram — 120 Tool Calls, 68-Hour Session"
project: "portfolio-site"
date: 2026-04-20
lang: en
pair: "2026-04-20-portfolio-site-ko"
tags: [claude-code, telegram, automation, devtools]
description: "One Telegram message spun up a private GitHub repo. Another published to two platforms. Here's what 120 tool calls across a 68-hour Claude Code session looks like."
---

68 hours, 44 minutes. I was at my keyboard for maybe 10 minutes of that. A handful of Telegram messages — Claude Code created a GitHub repo, scaffolded a project, published blog posts to two platforms, and ran 36 web searches on my behalf.

**TL;DR** This is a record of how Telegram → Claude Code remote control works in production: what it handles well, how MCP disconnects behave, and where the architecture still has gaps.

## One Telegram Message, One GitHub Repo

Here's what I sent:

```
프로젝트 uddental 말고 git 연동되는걸로 하나 더 파줘
치과광고 영어로한 프로젝트로
```

("Make me another project separate from uddental, with git integration — a dental advertising project in English")

What Claude Code did with that:

1. Created `~/dentalad/` locally
2. Created `github.com/jee599/dentalad` as a private repo
3. Scaffolded the directory structure: `clinics/`, `ads-research/`, `site/`, `templates/`, `docs/`
4. Wrote `README.md`, `package.json`, `.gitignore`, and pushed the first commit

The project name came back as four candidates via Telegram. I replied "dentalad." Two message round-trips, zero manual setup.

This is the pattern: Claude Code takes ambiguous intent, surfaces options, and executes on a single-word pick.

## What Happens When Telegram MCP Disconnects

Mid-session, the MCP server dropped. From my end: a "server disconnected" signal, no context about why.

The usual suspects:

- Bot token expiry or rotation
- Telegram API timeout causing a network break
- Session loss after system sleep/wake

Fastest recovery path: `/telegram:configure` to check token status. In this case the token was still valid — `/reload-plugins` brought it back. The dentalad scaffolding that was in progress had already completed before the drop.

The important behavior: **Claude Code kept running through the disconnect.** The agent finished its work, and when the MCP channel came back up, results were delivered through Telegram. No work lost.

This matters architecturally. Telegram is just the notification layer. The compute is local. A dropped connection is annoying but not destructive — as long as git commits are happening, the work is preserved.

## 36 Web Requests for Event Discovery

```
지금 한국 서울 판교 근처에서 등록가능한 클로드 관련 미팅이나 해커톤 모두 검색해서 알려줘
```

("Search for all Claude-related meetups and hackathons currently open for registration near Seoul/Pangyo")

20 `WebSearch` calls, 16 `WebFetch` calls. The results were thin — the April 14th and 17th events had already passed. Four registerable events were still open at search time: Snowflake Summit Korea, AI Co-Scientist Challenge, 교육공공데이터 open dataset event, and Meta Llama Academy @ Pangyo.

Then came the follow-up: "set up a recurring search and notify me when something new shows up."

This exposed the core architectural gap.

**Remote schedule agents (CCR) can't access local Telegram MCP.** A scheduled agent running on Anthropic's cloud has no path to the local Telegram plugin. The options I offered:

1. Direct Telegram Bot API call via `curl` (sendMessage with the bot token) — works, but the token lives in plaintext in the trigger config
2. Email results to `jidongs45@gmail.com` via Gmail MCP

Neither was finalized before the session ended. This is an open problem.

## Auto-Publishing Claude's Design Refresh

```
devto랑 spoonai.me에 이번에 클로드 디자인 업데이트된거 최신소식
```

("Publish the latest Claude design update news to devto and spoonai.me")

The `auto-publish` skill handled this end-to-end. Two outputs:

- `~/dev_blog/posts/2026-04-18-anthropic-claude-design-launch-2026-en.md` (DEV.to, English)
- `~/spoonai-site/content/blog/2026-04-18-anthropic-claude-design-launch-2026-ko.md` (spoonai.me, Korean)

Pipeline: source gathering (WebSearch + WebFetch) → draft generation → platform-specific formatting → publish. No manual editing. `canonical_url` points to `jidonglab.com` on both platforms to prevent SEO duplicate penalties.

## iPhone Idea-Capture App: Brainstormed, Not Built

```
아이폰에서 항상 플로팅되어 있거나 플로팅 아일랜드, 혹은 가장 쉬운 방법으로
스크린샷 링크 메모 공유 그냥 스케치 모든 아이디어를 모으는 앱을 만들어줘
```

("Build an iPhone app that captures everything — screenshots, links, notes, sketches — using Dynamic Island or floating UI or whatever's easiest")

The `brainstorming` skill ran first. Two directions surfaced: Dynamic Island persistent capture vs. Share Extension for capturing from other apps. I replied "b" — Share Extension won. Implementation didn't start this session.

The pattern is consistent: brainstorm → pick → implement. Not all three steps have to happen in the same session.

## Tool Call Breakdown

| Tool | Count |
|------|-------|
| Bash | 42 |
| Telegram reply | 21 |
| WebSearch | 20 |
| WebFetch | 16 |
| Read | 7 |
| Write | 5 |
| Other | 9 |
| **Total** | **120** |

Bash's 42 calls are mostly git operations and filesystem work. WebSearch + WebFetch at 36 combined — split between event discovery and Claude Design source gathering. Telegram replies at 21 represent actual two-way communication, not just fire-and-forget commands.

## What Remote Control Actually Feels Like

Most messages were 1–2 lines. Claude Code fills in the rest from context. The dentalad repo creation is a good example of how ambiguous requests resolve cleanly: propose options → pick → execute.

MCP disconnects happen. The session confirmed that the work survives them because the actual state lives in git, not in the notification channel. Reconnect, check the repo, continue.

> Async remote control is convenient. But the work needs to be verifiable even when the notification channel is down. Git commits do that job.

The open problem is scheduled agents + Telegram. The local MCP approach doesn't work for cloud-side triggers. Next session: try the direct Telegram Bot API approach (`curl` sendMessage) and decide whether token exposure in trigger config is acceptable, or route through Gmail instead.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
