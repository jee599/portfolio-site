---
title: "Opus 4.7 Launch Day: System Card Analysis, 10 Parallel Design Mockups, and a Breaking API Change"
project: "portfolio-site"
date: 2026-04-17
lang: en
pair: "2026-04-17-portfolio-site-ko"
tags: [claude-code, claude-opus-4-7, design, multi-agent, debugging]
description: "On Opus 4.7 launch day: read the 232-page system card, caught a silent breaking change in the thinking API, shipped two articles, and ran 10 parallel design mockups — all in 10 sessions and 1,000+ tool calls."
---

10 sessions. 1,060 tool calls. 4 projects running at the same time. That was April 16th, the day Claude Opus 4.7 shipped.

**TL;DR** — Caught a silent breaking change in the Opus 4.7 thinking API on launch day, published a migration guide to DEV.to, generated 10 parallel design mockups for spoonai, traced a Telegram bot polling conflict across two debug sessions, and diagnosed a Vercel env variable newline bug without touching a single line of code.

## The Breaking Change Nobody Announced

Anthropic dropped Opus 4.7 with a 232-page system card. I pulled the PDF via `WebFetch` and read it same day. Model ID: `claude-opus-4-7`. Pricing: identical to 4.6 ($5/$25 per MTok). Context: 1M tokens.

The critical change was in thinking mode. Up through 4.6, you passed `budget_tokens` directly inside the `thinking` block:

```typescript
// 4.6 — works fine
{
  thinking: { type: "enabled", budget_tokens: 5000 }
}
```

Opus 4.7 only supports adaptive thinking via `type: "enabled"`. Pass `budget_tokens` and you get a **400 error**. No deprecation warning. No migration guide in the release notes. Just a silent breaking change.

```typescript
// 4.7 — remove budget_tokens entirely
{
  thinking: { type: "enabled" }
}
```

That became the article hook: *"Opus 4.7 just killed budget_tokens: what broke and how to migrate."* I traced the timeline from The Information's exclusive leak (April 14) to the official launch, then used the `auto-publish` skill to push to DEV.to and Hashnode simultaneously. A second article — on OpenAI's duct-tape image model situation — ran in parallel, each piece handled by its own agent.

Session 4 stats: 74 Bash calls, 8 WebFetch, 8 Edit, 10 TaskUpdate.

## Why I Generated 10 Mockups Instead of 1

The spoonai design refactor was a 3-hour session (session 8, 383 tool calls). Two bugs came in together: archive images not displaying, and mobile layout broken.

The image bug was obvious from first read. `ArchiveEntry` had no `image` field. `getArchiveEntries()` was returning `date/title/summary` and silently dropping `meta.image`. The images weren't failing to load — they were never being passed to the renderer at all. Fixed by extending the type and the query function.

For design direction, instead of proposing one approach and iterating, I dispatched 10 agents in parallel, each producing a full HTML mockup for a different visual style:

```
agent 1 → bento-grid
agent 2 → masonry (pinterest-style)
agent 3 → neo-brutalism
agent 4 → swiss tabular
agent 5 → japanese kinfolk
agent 6 → netflix cinema
agent 7 → Y2K chrome
agent 8 → dashboard ticker
...
```

Each agent generated a standalone HTML file, served locally, and the whole set was ready for comparison in one pass. When the feedback came back as "none of these," the time spent on direction was already near zero — no back-and-forth needed. Masonry won. From there it was sequential edits to `ArticleCard`, `HomeContent`, `SubscribeForm`, and `globals.css`.

Each agent brief explicitly included "render both desktop and phone frames" — mobile wasn't an afterthought.

## The Vercel Newline Bug

Session 3 was an auth issue on the fortune project. Password `920802` was correct, but the server kept returning 401.

The `.env` file looked fine locally. Checked the Vercel dashboard — environment variable was stored as `920802\n`. A trailing newline had been appended when the value was saved. The user types `920802`, the server compares against `920802\n`, gets `!==`, rejects.

Not a code bug. An input bug.

Diagnosis: 10 Bash calls, 5 Read calls. Fix: re-enter the value in the Vercel dashboard. No code changes.

## Tracing a Telegram Polling Lock

Debugged this across sessions 5 and 9. Symptom: messages from Claude → Telegram worked fine; messages from Telegram → Claude weren't reaching the active session.

Root cause: multi-process conflict. When multiple Claude sessions are open, each one spins up its own `bun server.ts`. Telegram's long polling only allows one active `getUpdates` connection per token — concurrent calls return 409 Conflict. If a dead session's process is still holding the polling lock, the live session never receives incoming messages.

```bash
ps aux | grep "server.ts" | grep -v grep
# → PID 15622 (3-hour-old stale process)
# → PID 31885 (current session's process)
```

Fix: kill all `server.ts` processes, then run `/reload-plugins` so the current session re-acquires the bot. The underlying issue — multiple Claude sessions competing for the same polling lock — recurs whenever sessions stack up.

## contextzip Self-Improvement

Session 10 was contextzip meta-work (249 tool calls). contextzip is a proxy that intercepts common CLI commands (`git`, `npm`, etc.) and filters their output to reduce token consumption in Claude's context window.

Updated the core from upstream, then layered on new features. Validation ran via 4 parallel subagents:

```
agent → playwright_cmd validation
agent → new filter effectiveness analysis
agent → DSL extension feasibility review
agent → context-history layer architecture review
```

Each agent read the relevant code and returned a punch-list. Faster than sequential review, and keeps the main context window from filling up with implementation details.

## Harness × Hermes Research

Session 6 was a parallel deep-research run on two topics: "Claude Code harness design" and "the Hermes agent framework." Two subagents per topic, running concurrently.

Two findings stood out. Anthropic's official recommendation is harness **minimalism** — add only after observed failures. My `~/.claude/` at that point was already heavy: CLAUDE.md at 82 lines, MEMORY at 92KB, 20+ skills loaded. Second: symbolic links in `~/.claude/agents` were broken, meaning custom subagents weren't loading at all.

From the research output, I created 4 hooks (`commit-cleanliness.sh`, `protect-files.sh`, `sticky-rules.sh`, `trajectory-log.sh`), 2 agent files, and 3 commands.

## By the Numbers

| | |
|---|---|
| Sessions | 10 |
| Total tool calls | ~1,060 |
| Longest session | Session 8 (3h 6min, 383 calls) |
| Parallel design mockups | 10 |
| Parallel research agents | 4 |
| Files modified | 40+ |

Running 4 projects in parallel on a single day isn't a pace that's possible without Claude Code. Without parallel agent dispatch and the skill system, the design mockup comparison alone would have taken half a day.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
