---
title: "12 Agents in Parallel: 444 Tool Calls, 3 Projects, One Day with Claude Code"
project: "portfolio-site"
date: 2026-04-27
lang: en
pair: "2026-04-27-portfolio-site-ko"
tags: [claude-code, multi-agent, auto-publish, devto, parallel-agents]
description: "Running 12 sub-agents in parallel: dental ad research, DEV.to series publishing, and PayPal validation in a single day of Claude Code."
---

444 tool calls. 3 sessions. 12 sub-agents running in parallel. This is what a full day of multi-agent Claude Code looks like — the output, the false positives, and where it breaks down.

**TL;DR** — Ran 3 sessions across different domains: published a DEV.to 3-part series with the auto-publish skill, dispatched 12 parallel agents to produce a dental advertising research report, and validated live PayPal payments through a Telegram → Claude Code pipeline. Total: 444 tool calls, 12 files created, 28 modified.

## The DEV.to Series That Wrote Itself (Almost)

The prompt was simple: "Analyze 4 popular AI Git projects and post to DEV.to."

The auto-publish skill takes over from there. Phase 1 collects source material, Phase 2 proposes structure, Phase 3 generates content, Phase 4 publishes. One prompt fires the skill; the skill makes every subsequent decision.

Phase 2 proposed regrouping 4 projects into 3 themed posts:

| Part | Title | Projects Covered |
|---|---|---|
| Part 1 | Skills: When a Markdown File Got 100K Stars | `andrej-karpathy-skills` + `hermes-agent` |
| Part 2 | OpenClaw: The Local AI Gateway | OpenClaw (295K+ stars) |
| Part 3 | Terminal Agents | OpenCode + open-source terminal agents |

Four projects, reorganized by theme into a three-part series — each post stands alone, all three connect. Part 1 published immediately at `2026-04-23 14:55 UTC` (DEV.to id=3542024). Parts 2 and 3 went up as drafts pending scheduled publication.

The interesting part: there was an existing post about OpenClaw (`claude-code-channels-vs-openclaw-en.md`) already in the repo. The skill detected it and pivoted — linking internally instead of re-covering the same ground. That judgment call happened without a human in the loop.

Session 1 stats: `claude-opus-4-7`, 75h 58m context, 191 tool calls. Breakdown: `Bash` 96 / `Agent` 11 / `Read` 14.

## When Article Quality Drops Between Runs

Mid-session 1, a content quality problem surfaced. The observation: "April 26th articles are worse than April 25th."

The issue was structural. The generation pipeline was defaulting to news summary plus model-by-model lists. Flat, low-signal, easy to skip. Three things needed to change:

1. Blend source summary + background knowledge + industry insight into each post
2. Add a title image and inline images mid-article
3. Make each post teach something, not just report it

Updated `~/.claude/skills/spoonai-daily-briefing/SKILL-2-publish.md` and rewrote the `self-critique.mjs` validation logic. Three scheduled jobs in GitHub Actions pick up the changes on the next run.

## 12 Agents, 6 HTML Reports, Zero Duplication

Session 2 started with a scoped research request: "Survey all AI dental/medical advertising agencies in Korea. Show what methods they're using and which ones work given recent Naver algorithm changes."

12 sub-agents dispatched in parallel, each assigned a different domain slice:

- Korean AI medical ad agency landscape (8 categories)
- Naver C-Rank / D.I.A.+ algorithm change analysis
- Individual agency output sampling (blog samples, chatbot demos, portfolios)
- 5-year / 1-year / 90-day trend comparison

Output: 6 HTML files — `TREND-COMPARISON-REPORT.html`, `AI-AGENCIES-DEEP-REPORT.html`, `AI-AGENCIES-PRIMER.html`, and three supporting reports. Browser-ready, no post-processing needed.

The agents tagged their own evidence by confidence level: "Named source + quantitative data (5 stars)", "Initials + rich metrics (4 stars)". Agencies like 호원앤컴퍼니 and 인블로그 surfaced with direct links to real client case studies.

One caveat worth documenting: competitor claims in agent-collected data tend to be inflated. Sub-agents go wide fast, but they don't discriminate between press releases and verified results. Cross-check key metrics before acting on any competitive intelligence the agents surface.

Session 2 stats: `claude-opus-4-7`, 2h 26m, 63 tool calls. `Agent` 35 / `Bash` 9 / `Write` 6.

## Telegram Message → Live PayPal Test

Session 3 started differently. A Telegram channel message arrived directly into the Claude Code context — the Telegram plugin routes channel messages into the active session.

The message asked whether anyone had visited or paid on a Korean fortune-telling project. Direct DB query answered immediately: 30 cumulative payments (₩171K total), payments dropped off post-March, 87 sessions still coming in during April.

Next request: "Run one agent each for Japan and Southeast Asia — find a path to revenue."

4 agents running in background:
- `JP fortune market data` — Japanese divination app market size, payment patterns
- `SEA fortune market data` — Thailand/Indonesia/Vietnam market data (81 sources)
- `Viral fortune video pattern decode` — reverse-engineering viral video formulas
- `Top-converting fortune site references` — high-conversion site benchmarks

While agents ran, tested the PayPal live endpoint directly. Confirmed: real $1.99 order created in DB, approval URL generated. Results saved to `scripts/paypal-live-test.sh`.

Then a false positive surfaced. A CRO agent flagged: "Thai users are seeing the ₩ symbol." Pulled up the code — the ₩ rendering lives inside the `toss` namespace, Korean checkout only. Thai users route to the PayPal hosted page. No ₩ in sight.

The agent was wrong. More agents means more false positives. Without a classification and verification layer, scaling agent count scales noise at the same rate.

Session 3 stats: `claude-opus-4-7`, 12h 41m, 190 tool calls. `Bash` 92 / `Read` 32 / `Edit` 25 / `mcp__plugin_telegram` 13.

## The Full Day: Where Agents Win and Where They Don't

| | Session 1 | Session 2 | Session 3 |
|---|---|---|---|
| Tool calls | 191 | 63 | 190 |
| Agent calls | 11 | 35 | 7 |
| Primary domain | Publishing + quality | Research | Validation + market |

Total: 444 tool calls. `Bash` 197 / `Agent` 53 / `Read` 46 / `Edit` 35. 12 files created, 28 modified.

Most of the 53 agent calls came from sessions 2 and 3, both research-heavy. Research is where parallel agents deliver the clearest ROI: wide search space, parallelizable collection, individual agent errors get averaged out by the aggregate.

For code changes, direct `Edit` outperformed agents every time. Updating i18n messages across 21 files needed no agents — 25 `Edit` calls, done.

**The pattern**: agents handle breadth, direct edits handle precision. Using agents for surgical code changes adds coordination overhead without any speed gain.

## What Actually Breaks at Scale

Two failure modes worth documenting from today:

**False positives scale with agent count.** The ₩ symbol alarm was harmless. But in a production context, acting on unverified agent output is how you ship bugs you didn't write. Every agent output needs a confidence classification before it enters a decision path.

**Research output is a first draft, not ground truth.** Competitor metrics from web-scraped sources are marketing claims until verified independently. The HTML reports are a useful starting map, not a final answer.

The day's output was real: a published series, 6 research reports, a validated payment flow, live market data across two regions. But the process also surfaced exactly where parallel agents need human checkpoints to stay reliable.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
