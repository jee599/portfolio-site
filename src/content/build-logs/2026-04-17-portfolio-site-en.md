---
title: "9 Sessions, 1,008 Tool Calls: A Day of Dense Claude Code Work"
project: "portfolio-site"
date: 2026-04-17
lang: en
pair: "2026-04-17-portfolio-site-ko"
tags: [claude-code, opus-4-7, spoonai, contextzip, telegram, multi-agent]
description: "On April 16, nine Claude Code sessions totaled 1,008 tool calls across 6+ hours. Opus 4.7 launch-day analysis, a full spoonai design overhaul, and contextzip validation."
---

On April 16, I ran nine Claude Code sessions that totaled 1,008 tool calls. More than six hours of work compressed into a single date.

**TL;DR** Opus 4.7 system card analysis on launch day → DEV.to article publishing → full spoonai design refactor → parallel agent validation for contextzip. High-density day.

## Reading the Opus 4.7 System Card the Day It Dropped

The first session was a PDF deep-dive: Claude Opus 4.7's 232-page System Card. Downloaded it fresh, split it into sections, read the critical parts. 6 tool calls, 4 minutes.

The most practically significant finding was a behavioral change to `budget_tokens`. Starting with Opus 4.7, combining `extended_thinking` with `type: "enabled"` and a `budget_tokens` value activates **Adaptive thinking** mode — which behaves differently from the old `type: "enabled"` alone. That's a migration point for anyone using extended thinking in production.

```python
# Before Opus 4.7 — standard extended thinking
"thinking": {
    "type": "enabled",
    "budget_tokens": 10000
}

# Opus 4.7 — same config now triggers Adaptive thinking
# Verify your expected behavior hasn't changed
```

I used this as the basis for two DEV.to articles written in parallel during session 3:

```
Post 1: "Opus 4.7 just killed budget_tokens: what broke and how to migrate"
Post 2: "OpenAI's Duct Tape Models: What We Know"
```

The `auto-publish` skill handled four output files in parallel across spoonai.me (Korean + English), DEV.to, and Hashnode — two agents running concurrently. Session 3: 1 hour 1 minute, Bash 74 + Edit 8 + WebFetch 8.

## The Login Bug That Wasn't a Code Bug

A saju (Korean astrology) project had a persistent issue: correct admin password, 401 response every time. The code was fine.

```bash
ADMIN_PASSWORD="920802\n"
```

Pasting environment variables directly into the Vercel dashboard can silently append `\n`. The user inputs `920802`; the server compares against `920802\n`; strict equality fails. Checked with `.env.vercel-check` and found `ADMIN_SESSION_SECRET` had the same issue. Fixed entirely in Bash — no code changes, 10 commands.

## The spoonai Overhaul: 383 Tool Calls, 3 Hours 6 Minutes

Session 7 was the heaviest. Full design refactor of spoonai.me, targeting both desktop and mobile.

The starting prompt was short: "refactor spoonai design, both mobile and web." The `brainstorming` skill set direction first, then `frontend-design`, `ui-ux-pro-max`, and `audit` ran sequentially.

The first round of designs got scrapped. Feedback: "too AI-mockup-ish." Four directions — Mystic Luxe, Soft Pastel, Modern Utility, Asia-Pop — rendered as HTML mockups in the browser. All of them were clichés: gradient blobs, star decorations, "VIRAL 2.4M" badges.

Second round: 10 agents dispatched in parallel, each producing a different design concept as HTML.

```
01 Bento grid          06 Netflix shelf cinema
02 Masonry (Pinterest)  07 Y2K chrome retro
03 Neo-brutalism        08 Dashboard ticker
04 Swiss tabular        09 Japanese kinfolk
05 (reserved)          10 (reserved)
```

Final pick: Masonry (#2). After selection, `SubscribeForm`, `ArticleCard`, `ScrollProgress`, `CountUp`, and `FloatingSubscribe` were either rewritten or created from scratch. 15+ files changed.

A content bug surfaced in the same session. The daily/weekly entries in `content.ts` lines 308–354 were missing `image` fields, causing archive thumbnails to render blank. Fixed inline.

Session stats: Edit 106 + Bash 87 + TaskCreate 30 + TaskUpdate 63.

## Two Sessions Debugging the Same Telegram Problem

Sessions 4 and 8 hit identical symptoms: sending from Claude to Telegram worked, receiving didn't.

The root cause was **bot process collision**. Each Claude Code session spawns its own `bun server.ts`. Telegram's `getUpdates` is long-polling, which only one process can hold at a time. `bot.pid` manages the lock — but if a previous session's process didn't die cleanly, the new session can't take over polling.

```bash
ps aux | grep "server.ts" | grep -v grep
# PID 15622 (3 hours old): holding lock, not polling
# PID 31885 (21 seconds old): polling, but routing to wrong session
```

Fix sequence: kill all `server.ts` processes → delete `bot.pid` → `/reload-plugins`. The current session relaunches and acquires the lock. Two sessions, same debugging, 107 Bash calls combined.

This is a structural problem — `bot.pid` lock management needs to handle cross-session conflicts at the design level. Debugging the same issue twice is the signal.

## Redesigning the Claude Harness: 4 Parallel Research Agents

Session 5 analyzed Claude Code harness design principles alongside the Hermes agent framework. Four subagents dispatched simultaneously:

```
Agent 1 — Harness theory (Claude Code harness design principles)
Agent 2 — Hermes identity (NousResearch framework)
Agent 3 — Harness in practice (real-world application patterns)
Agent 4 — Hermes application (local implementation methods)
```

Results merged into `~/.claude/plans/harness-hermes-meeting.md`. Core conclusion: **minimalism**. Anthropic's own principle is "add only after observed failure." The existing `~/.claude/` setup — CLAUDE.md at 82 lines, MEMORY at 92KB, 20+ skills — was already overloaded.

Outcome: 4 new hooks, 2 new agents, 3 new commands, and a leaner CLAUDE.md. TaskCreate 14 + Write 13 + Bash 28.

## contextzip: Parallel Validation After Implementation

Session 9 wrapped up contextzip — a Claude Code token-reduction CLI proxy — with parallel subagent validation after implementation was complete.

```
Track 2 — punch-list verification
Track 3 — new filter verification
Track 4 — context-history layer verification
Track 5 — DSL extension verification
+ README hook analysis + v0.2 promotion strategy
```

Commit and push happened in this session. The auto-inferred git email was `jidong@jidongui-iMac.local` — corrected to `jee599@naver.com` before pushing. Session stats: 249 tool calls, 1 hour 7 minutes.

## Patterns That Repeated Across the Day

**Skill chaining compounds quality.** Running `brainstorming` → `frontend-design` → `audit` in sequence lets context accumulate across stages. The output quality is noticeably different from running a single skill against the whole problem.

**Parallel agents are effective for validation.** After implementation, assigning different verification tracks to separate subagents delivers multi-angle review without contaminating the main context window.

**The Telegram multi-session collision is structural.** Restarting doesn't fix it — `bot.pid` lock management needs to prevent cross-session conflicts by design. Debugging the same issue twice is the clearest signal that a fundamental fix hasn't been made.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
