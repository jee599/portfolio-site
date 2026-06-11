---
title: "One Boolean Killed My Telegram Loop — Then 31 Agents and 29 Hours Changed Everything"
project: "portfolio-site"
date: 2026-06-11
lang: en
pair: "2026-06-11-portfolio-site-ko"
tags: [claude-code, telegram, multi-agent, workflow]
description: "12 sessions, 783 tool calls: fixed a Telegram async loop with one settings.json line, ran 31-agent GTM deep research, and rebuilt a coffeechat site into an AI interview platform in 29 hours."
---

783 tool calls across 12 sessions. The fastest fix took under 5 minutes. The longest session ran 29 hours and 26 minutes. Both were solved by the same principle: find the actual root cause, not the assumed one.

**TL;DR** A single `false` in `settings.json` had silently killed the Telegram plugin. Flipping it to `true` completed an async control loop — send instructions from phone, Claude works, results arrive on Telegram. Same day: a 31-agent Workflow for global GTM deep research, and a full pivot of a coffeechat site into an AI resume + portfolio + mock interview platform.

## A Two-Session Debug That Came Down to One JSON Value

Session 1 was a status check: Telegram plugin v0.0.6 installed, Bun 1.3.11 present, user ID on the allowlist, bot token file in place. Everything looked ready. Nothing connected.

Session 2 found the actual problem. Inside `~/.claude/settings.json`:

```json
"telegram@claude-plugins-official": false
```

A harness cleanup in late May had bulk-disabled all plugins. Telegram went down silently with them. Changed it to `true`, restarted — immediate connection.

After that, the async loop became real. Session 8: a Telegram message asking "are you connected?" followed by "wrap up the Saju project files" and "enable the git integration." Claude restores context from memory, does the work, replies on Telegram. The practical value is exactly what it sounds like: Claude runs while you're doing something else. You don't need to sit in front of a terminal to queue the next task.

## 31 Agents, 814 Tool Calls, and Adversarial Verification at Scale

Session 10: global GTM deep research for the Saju project. Launched with `ultracode` mode and waited.

Result: **31 agents, 814 tool calls, ~43 minutes**. 13 research topics ran in parallel. After they finished, a completeness critic agent reviewed the combined output and flagged 3 gaps — additional research rounds ran to fill them. Then 52 core claims went through adversarial verification:

```
31 research agents → completeness critic → 3 gap fills
→ adversarial verification: 52 claims
  → confirmed: 38 / corrected: 13 / unverified: 1
```

Session 11 ran the same pattern for dental marketing channel research. 22 agents across 12 dimensions in parallel — Naver search ads, Smart Place, blog algorithm, AEO/GEO, Google, Meta, YouTube, KakaoTalk, medical regulations. 30 adversarial checks caught 4 incorrect claims. One source had written that "the Constitutional Court non-covered discount ruling was in 2025." The actual date: 2019-05-30. Several agency-sourced documents had wrong dates. Adversarial verification found them.

Mid-run, the dental-clinic agent hit API overload (HTTP 529) and terminated after 65 calls. Checked the file state manually — most was already complete. Re-ran only the remaining sections to finish.

This is the pattern where Workflows add the most value: 10+ independent work items that each need reliable output. Single-context Claude can't cover half the surface area, and it can't self-verify at this scale.

## Real Travel Times, Not Estimates

Session 9 was a personal task: find commercial or officetel spaces near Gubanpo station where a grand piano fits, within 15–20 minutes travel.

Workflow: 8 zone agents in parallel, 40 listings collected. Then a follow-up request — re-evaluate assuming it's a piano lesson business, not personal practice.

That reframing surfaced a critical issue: officetel units are zoned as business facilities in Korea. Registering a lesson business (교습소) may not be legally permitted at all. Once the zoning problem was confirmed, suitability scores for many listings flipped completely.

Travel times were measured via `mcp__claude-in-chrome` browser navigation, not estimated. Sinnonhyeon station: 8 min direct. Sinsa: 11 min. Nonhyeon: 15 min. Sindaebang Samgeori: 30 min — exceeded the threshold, excluded. Only measured values went into the final report.

## A 29-Hour Platform Pivot: Coffeechat Becomes an AI Interview Platform

Session 12 was the longest of the day. A mentor-mentee coffeechat site needed to become a resume builder + portfolio analyzer + AI mock interview platform.

The starting prompt:

> "Renew the coffeechat site so it: 1. builds a resume when you fill in your info, 2. reviews your portfolio, 3. runs a mock interview with 3 agents — agents write, users speak."

Rather than asking Claude to figure out product decisions, I resolved them upfront and handed them over directly. "No TTS interviewer voice." "Resume generation on Sonnet, portfolio and interview on Opus." Cost was calculated before committing to the model: "How much does a 10–20 minute interview cost with Opus?" → $0.45–$1.20 confirmed, model locked.

The core design requirement: **it shouldn't look like it was made by AI**. The first version used brown and orange tones — rejected as "not pretty." Icons generated with GPT Image 2.0 had broken transparency in the favicon. After a few feedback loops, the direction landed: Toss-style dark hero `#171710`, caramel glow accents, bento grid layout, Linear-style motion.

The most technically interesting piece was domain-specific interview routing:

> "An Unreal 5 content programmer shouldn't get graphics deep-dives. A combat programmer shouldn't get deep UI questions."

The setup flow in `app/api/interview/setup/route.ts` collects role + actual years of experience (not "junior/senior" labels) + portfolio or job posting as context. When neither portfolio nor posting is provided, the system opens a pre-interview conversation to gather domain, experience, and specific past work before generating questions.

Interview behavior was explicit in the system prompt: experience-based follow-up questions, probing into answers, pivoting to a different angle when the candidate says "I don't know." A code review agent read all 16 files — 5 resume wizard components, 3 portfolio, 4 interview, 4 lib — and reviewed the logic end-to-end. The stop hook caught leftover stubs twice. Cleaned both times.

Final tool breakdown for this session: **Bash 177, browser 54, Edit 43, Write 30**.

## Day in Numbers

| Metric | Value |
|--------|-------|
| Sessions | 12 |
| Total tool calls | 783 |
| Longest session | 29h 26min (coffeechat) |
| Second longest | 7h 47min (dental marketing research) |
| Workflow agents | 31 (GTM deep research) |
| Adversarial claims verified | 52 |
| Files created | 25 |
| Files modified | 23 |

Tool breakdown across all sessions: Bash 396, Edit 113, browser navigation 72, Read 64, Write 36.

The Telegram async loop changed the daily operating model more than anything else. When a 43-minute Workflow is running — or when you're waiting on results — a single Telegram message queues the next task. Claude is running. You're doing something else.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
