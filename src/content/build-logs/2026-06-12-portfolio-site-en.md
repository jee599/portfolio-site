---
title: "24 Claude Code Sessions, 700+ Tool Calls: Telegram Recovery to 31-Agent GTM Research"
project: "portfolio-site"
date: 2026-06-12
lang: en
pair: "2026-06-12-portfolio-site-ko"
tags: [claude-code, multi-agent, telegram, workflow, ultracode]
description: "24 sessions, 700+ tool calls in one day: Telegram plugin recovery, 31-agent saju GTM research, full site rebuild, dental KB adversarial verification."
---

700+ tool calls. 24 sessions. One day.

The largest single session — rebuilding a coffee-chat platform from scratch — clocked 359 tool calls: 177 Bash commands, 54 Chrome browser interactions, 43 file edits, 30 writes. The day started with tracking down why Telegram was silently disconnected (one boolean in `settings.json`), ran through a 31-agent parallel GTM research sweep that finished in 43 minutes, and ended with a dental advertising knowledge base updated by 22 parallel agents — with adversarial verification catching 4 factually wrong claims before they made it into production.

**TL;DR**: `"telegram@claude-plugins-official": false` in `~/.claude/settings.json` silently killed mobile Claude Code control. Flipped to `true`, restarted, mobile was back. Biggest task of the day: `fortunelab.store` global GTM strategy via 31 parallel agents, 814 tool calls, 43 minutes. Coffee-chat site full rebuild: 359 tool calls in one session from a single prompt.

## The One Boolean That Killed Mobile Control

The message came in: "connection not working, check it." Opened `~/.claude/settings.json`. Late May harness cleanup — bulk-disabled a set of plugins including the Telegram one. One line:

```json
"telegram@claude-plugins-official": false
```

Changed to `true`, restarted the session, messages started flowing immediately.

This is the kind of bug that's annoying precisely because it's invisible. Telegram wasn't throwing errors. The connection just wasn't there. No fallback, no log entry that surfaces without going looking. The fix took under a minute once the cause was found; finding the cause was the whole job.

The practical value of Telegram integration: checking session status mid-commute, sending "summarize saju project status" and getting a `STATUS.md` read-and-reply without being at a computer. That day's Telegram commands — saju project status check, git integration activation, full feature verification — were all handled automatically by Claude Code sessions running in the background. Reconnecting this made the rest of the day's work accessible from anywhere.

## What 359 Tool Calls in One Session Actually Looks Like

Session 9 was the week's largest by tool call count. The starting prompt:

> "Rebuild the coffee-chat site — instead of mentor/mentee matching, I want: 1. fill in content and it builds your resume, 2. reviews your portfolio, 3. runs mock interviews with 3 agents where the agents respond in text and the user speaks"

That's a complete product pivot in one sentence. Codebase analysis, feature design, and full implementation — resume builder, portfolio analyzer, mock interviewer — all in one session. Final count: 177 Bash, 54 Chrome interactions, 43 edits, 30 writes.

The interview feature's logic handles a common edge case: users who don't have a job posting or a portfolio to attach. In that case, the agent first asks about their field, years of experience, and what they've worked on, then generates follow-up questions grounded in those answers rather than generic prompts. Model selection was split by function — mock interviews use Opus (quality-first), resume generation uses Sonnet (cost-optimized), portfolio analysis uses Opus again.

Design feedback came in multiple rounds throughout the session: "looks too much like a generic AI site", "the colors are off", "favicon background isn't transparent". Each round, Chrome browser interaction rendered the current state in-session so fixes happened inside the same feedback loop rather than requiring a context switch. GPT Image 2.0 API generated Toss-style 3D visual assets; the favicon was regenerated once the transparency issue was flagged. Having browser-measured renders in the same session loop compressed each design iteration cycle significantly.

The important point here isn't the raw tool call number — it's that the entire product direction, architecture, and UI went from single-sentence prompt to deployed state without leaving the session. The session did what would normally require several days of back-and-forth across planning docs, implementation, and design review.

## 31 Agents, 43 Minutes, 814 Tool Calls

Session 10 covered global GTM strategy for `fortunelab.store`, a Korean saju (four pillars of destiny) service targeting international markets. 31 parallel agents via the Workflow tool, 814 tool calls, 43 minutes wall-clock time.

Multi-agent GTM research at this scale surfaces data that a single-context search sweep would miss. The most impactful finding came from Etsy live measurement: AI-labeled products in the spiritual/astrology category showed 0 sales. Human-persona products in the same category: 464 sales over one year. That single number decided the landing page positioning before any copy was written: don't lead with AI. Position as "1,000-year Korean traditional saju with precise manseryeok calculation." Saju.com's existing English-language product already uses a named persona — "Master Cheong-wol" — rather than surfacing the underlying technology.

The research output was a structured HTML report (`FORTUNELAB_GTM_DEEPRESEARCH_2026-06-11.html`). 52 load-bearing claims extracted from the research, each run through adversarial verification — 38 confirmed, 13 corrected with updated values, 1 unverified. Any number cited in the report came from browser-measured source data; claims that failed verification were replaced with corrected values rather than flagged-and-kept.

The structure here matters: research at this scale is only useful if the output is reliable. Running adversarial verification on load-bearing claims is the difference between a research report that can be acted on and one that requires a second pass to audit.

## Why `pipeline()` Finished 31-Agent Research in 43 Minutes

The 43-minute wall-clock time for 31 parallel agents and 814 tool calls is worth unpacking, because the reason is architectural.

`pipeline()` in the Workflow tool has no synchronization barrier between stages. Agent A can be in stage 3 while agent B is still in stage 1. That's not true of `parallel()` barriers, which wait for all items to complete a stage before proceeding to the next.

For research workflows, this means fast agents don't sit idle waiting for slow ones. The 31 agents covering different research dimensions finished at different rates — some topics had sparse data, others had dense source material requiring more fetches. Under a barrier model, the total wall-clock would be bounded by the slowest agent at each stage multiplied by the number of stages. Under `pipeline()`, fast agents just move ahead.

This is not a theoretical optimization. It's the difference between 43 minutes and a substantially longer run that would have been impractical to use interactively.

The practical rule: default to `pipeline()`. Only use a `parallel()` barrier when stage N genuinely needs all of stage N-1's output at once — deduplication across the full result set, early-exit if total count is zero, or when a downstream prompt explicitly needs to compare across all prior findings. Everything else is a pipeline.

## Adversarial Verification Caught 4 Wrong Claims Before They Shipped

Session 11: dental online advertising knowledge base update across all active channels. 12-dimension parallel research covering Naver search ads, smart place optimization, blog algorithm changes, AEO/GEO, Google, Meta, YouTube, Kakao/Danggeun marketplace, medical law compliance, review management, booking platforms, and trend-based cost data.

The 6 highest-risk dimensions (medical law, compliance, policy specifics) got adversarial verification: 5 load-bearing claims per dimension, each challenged by an independent agent tasked with refuting the claim.

Four wrong claims were caught:

1. "Constitutional Court non-covered discount ruling was in 2025" — actual ruling date: 2019-05-30
2. "Receipt review POS integration is required" — alternative certification methods exist and are accepted
3. Two additional policy claims with incorrect details

Without adversarial verification, all four would have shipped into the KB as facts. KB data feeds into agent decision-making for ad strategy; wrong compliance data in particular creates downstream risk that's hard to detect until something breaks in production.

Mid-session, API overload (529 errors) killed the dental-clinic agent at 65 tool calls. Standard recovery: check which files were written, identify the last completed work item, continue from there. Files persisted through the agent crash, so resumption required no special handling beyond reading state and picking up the remaining dimensions.

## Tool Call Distribution Across 24 Sessions

| Tool | Count |
|---|---|
| Bash | 390+ |
| Edit | 110+ |
| mcp__claude-in-chrome__browser_batch | 71 |
| Write | 35 |
| Workflow (fan-out launches) | 6 |

Sessions 9 (coffee-chat rebuild, 359) and 8 (saju Telegram control, 197) accounted for most of the volume. Sessions 3–7 were automated batch runs — claude-haiku-4-5 generating saju compatibility text content — with 0 Claude Code tool calls since those ran independently.

Chrome browser interactions (71) mostly break into two categories: design iteration renders during the coffee-chat rebuild, and live measurement fetches during GTM research where actual page data was needed rather than cached search results.

The 6 Workflow launches covered the two large research sessions and four smaller fan-out tasks. Each Workflow launch represents a decision point where the work was wide enough that parallel agents were clearly faster than sequential context — not used by default, used when the task shape warranted it.

## What Carries Forward

A few patterns that held up across the day's work:

**Adversarial verification is not optional for KB updates.** Research agents are optimistic by default — they find supporting evidence, not disconfirming evidence. A separate agent tasked with refuting each claim catches the cases where source data is ambiguous, outdated, or simply wrong. 4 of 52 claims failing isn't a high rate, but in a knowledge base used for compliance-adjacent decisions, 4 wrong facts is 4 too many.

**Browser-in-session iteration changes the design loop.** The coffee-chat rebuild's fast design iteration came from having render verification inside the same session rather than as a separate step. Feedback → fix → render → repeat without context switching kept the feedback loop under a minute per cycle.

**Single-boolean failures are worth documenting.** The Telegram `false` → `true` fix took under a minute. But "mobile control was silently broken for several weeks" is the actual story. The harness cleanup that caused it was reasonable at the time; adding a connectivity check to the post-cleanup verification list would catch this class of issue earlier.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
