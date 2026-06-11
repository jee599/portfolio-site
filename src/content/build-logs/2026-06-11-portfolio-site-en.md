---
title: "294 Tool Calls, 21 Hours: Rebuilding a Platform from Scratch with Claude Code"
project: "portfolio-site"
date: 2026-06-11
lang: en
pair: "2026-06-11-portfolio-site-ko"
tags: [claude-code, next.js, multi-agent, ai-automation, workflow]
description: "One day, 10 Claude Code sessions, 559 tool calls. How I rebuilt a mentor-matching site into a 3-feature AI career platform — plus a 22-agent parallel research run."
---

Ten Claude Code sessions in a single day. 559 tool calls. 21 files created. The longest session ran 21 hours and 56 minutes, burned through 294 tool calls, and rewrote an entire Next.js site from scratch.

**TL;DR** Rebuilt CoffeeChat from a mentor-mentee matching platform into a 3-feature AI career tool: resume builder, portfolio analyzer, and AI mock interviewer. Same day, ran a 22-agent parallel research sweep across 12 dental advertising channel dimensions.

## Rewrite, Not Refactor

The pivot prompt was direct:

> "I want to rebuild the CoffeeChat site — not a mentor/mentee platform anymore. Instead: 1. fill in your info and it generates a resume, 2. portfolio review, 3. three agents where agents write and the person speaks, for a mock interview."

This wasn't a refactor. A fresh Next.js project at `~/coffeechat`. Before building, Claude surfaced two decisions worth making upfront: TTS voice support, and how the three interview agents divide responsibilities. Voice was out of scope. Everything else used sensible defaults and build started immediately.

One session covered it all: 5 API routes (resume polish, portfolio analysis, interview setup/turn/report), shared types, Anthropic client, 5-step resume wizard, portfolio checker, and mock interview interaction flow. Tool breakdown for that session: Bash 144, Edit 40, Write 29. Bash was mostly build verification and type checking.

## Three Design Rounds and One Favicon Fix

Design feedback came in four rounds. "Looks AI-generated." "Buttons are misaligned." "The orange-brown color scheme is ugly." "The overall color combination feels unconsidered."

Image generation ran three times. Round one: hand-drawn style — feedback: "needs to look more professional." Round two: 3D professional style — feedback: "still ugly, the orange-brown isn't working." Round three: "match the toss.tech tone."

Each round ran `scripts/gen-assets.mjs` via background TaskCreate, generated 6 assets in parallel, then verified renders with browser MCP (`mcp__claude-in-chrome__browser_batch`) before the next instruction. Browser tool calls hit 34 times across the full session — nearly all render checks, not guessing.

Favicon was a separate issue: "favicon still looks wrong?" — background transparency handling. Fixed with a targeted regeneration.

## The Interview Agent: Behavior as a System Prompt

The mock interview UX requirements were precise:

> "Follow-up questions that dig into the answer, drilling deeper into specific claims, pivoting when the user says they don't know, asking additional questions when an answer is insufficient."

The entire behavior spec was encoded as the system prompt at `app/api/interview/turn/route.ts`. If a portfolio and job posting are provided, the interview starts from that context. If not, a setup flow first collects field, experience level, and past work. Interview question categories branch by domain: portfolio-based, general knowledge, specialized knowledge, then server/game/backend/frontend tracks.

A cost question came up mid-session: "How much does a 10–20 minute interview cost with Opus?" Token estimates put it at $0.45–$1.20. The difference from Sonnet comes down to naturalness of follow-up questioning and depth of answer analysis — not just response quality but how the model tracks prior turns.

Full client-side logic — 5 resume wizard components, 3 portfolio components, 4 interview components, 4 lib modules, demos.tsx — went to a code review agent. The stop hook caught leftover TODOs twice. Both were cleaned up immediately.

## 22 Agents, 12 Dimensions: A Comprehensive Ad Channel Sweep

Session 10 ran `ultracode` mode for a complete sweep of online dental advertising channels.

```
/effort ultracode
Search and update everything about online medical/dental advertising
channels with current information...
```

The Workflow fanned out 22 agents across 12 dimensions in parallel: Naver search ads, Naver Smart Place, blog algorithm, AEO/GEO, Google, Meta, YouTube, Kakao/Daangn, medical law compliance, legal boundaries for patient reviews, booking platforms, and cost benchmarks. After each dimension finished, 6 high-risk dimensions got adversarial verification — 5 key claims each, checked by a separate adversarial agent that was prompted to refute, not confirm.

Output: a 48KB channel catalog at `_kb/research-online-channels-2026-06.md`, a 24-row judgment table (9 recommended, 7 conditional, 7 not recommended). Adversarial verification caught 4 wrong claims. The most notable: a claim that a Constitutional Court ruling on non-covered treatment discounts was from 2025 — it was actually 2019-05-30.

During the run, the dental-clinic agent hit API overload (HTTP 529) and was force-terminated after 65 calls. Checking file state showed most tasks were already complete. The remaining portion was re-run to finish.

## The Telegram Plugin That Was Just Turned Off

Session 1 walked through the Telegram setup and gave three steps: enter bot token → rerun with `--channels` flag. Session 2: "still not connected."

Root cause was simple. `~/.claude/settings.json` had `"telegram@claude-plugins-official": false`. A bulk plugin disable during harness cleanup in late May had turned it off silently. Flipping it to `true` fixed it immediately.

Session 9 brought a separate project update via Telegram. "Clean up the Saju project" → context restored from memory, status summary sent back via Telegram reply. "Enable git integration" → two GTM execution packs (Japan and US markets) generated in parallel as background agents. End-to-end test of the AI Saju chat completed before session close.

## The Numbers

| Metric | Value |
|--------|-------|
| Total sessions | 10 |
| Total tool calls | 559 |
| Longest session | 21h 56min (CoffeeChat rebuild) |
| Files created | 21 |
| Files modified | 18 |
| Workflow agents | 22 (dental research) |

By tool: Bash 319, Edit 52, Write 31, Read 39. Bash dominates because every build check, server restart, and test run is a Bash call.

294 tool calls in the CoffeeChat session means 294 verification loops: write code, build, check in browser, revise. That cycle ran continuously for 21 hours. The 22-agent research sweep ran in parallel on the same day — a different kind of session entirely, fan-out and verify rather than iterative build-and-check.

The gap between these two modes is worth noting. One session was deep and sequential; the other was wide and parallel. Claude Code supports both from the same interface.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
