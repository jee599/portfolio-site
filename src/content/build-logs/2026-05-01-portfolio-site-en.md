---
title: "12 Parallel Subagents, 276 Tool Calls: Surveying an Entire Ad Market in One Day"
project: "portfolio-site"
date: 2026-05-01
lang: en
pair: "2026-05-01-portfolio-site-ko"
tags: [claude-code, agents, research, automation, devto]
description: "12 Claude Code subagents in parallel, 276 tool calls across 4 sessions: surveyed Korea's AI dental ad market, generated 7 HTML reports, published 5 DEV.to posts."
---

4 sessions. 276 tool calls. In the largest session, 12 subagents ran simultaneously — each assigned a different slice of the Korean AI dental and hospital advertising market.

**TL;DR** Running 12 subagents in parallel enables research at a scale that's impossible in a single-context session. The same session that produced 7 HTML market reports also shipped 5 DEV.to articles via parallel generation. The key wasn't speed — it was clean domain decomposition before any agent was dispatched.

## Why the Dental Ad Market Needed 12 Agents

Korea's AI medical advertising market is fragmented. SEO agencies, short-form video studios, SaaS platforms, and AI content generation tools all compete in overlapping spaces. Surveying them manually would take days.

The input prompt was blunt:

```
Survey all Korean companies doing AI-powered dental / hospital advertising.
Every single company. Everything I need to know.
Use multiple subagents.
```

AgentCrow dispatched 12 agents in parallel. Each one got an exclusive domain — no overlap allowed. The breakdown:

- Agency type deep dives (3 agents)
- Real portfolio and output collection (2 agents)
- Naver algorithm change tracking (2 agents)
- Regulatory and legal risk analysis (2 agents)
- Pricing structure and ROI benchmarks (2 agents)
- Untapped market opportunity mapping (1 agent)

Each agent ran `WebSearch` + `WebFetch` against its own domain only, then returned structured results. Total overlap: zero. Total redundant research: zero.

## What Came Out: 7 HTML Reports

| File | Contents |
|------|----------|
| `TREND-COMPARISON-REPORT.html` | 5-year, 1-year, 90-day trend comparison across 7 axes |
| `AI-AGENCIES-DEEP-REPORT.html` | 60 companies deconstructed across 9 sections |
| `AI-AGENCIES-PRIMER.html` | Jargon-free primer for non-specialists |
| `AI-AGENCIES-EXAMPLES.html` | Real output gallery with verified URLs |
| `AI-DENTAL-MASTER.html` | Consolidated directory of 200+ companies |
| `AI-DENTAL-AD-HOW-IT-WORKS.html` | Mechanism walkthrough + next action plan, 49KB |

The final master report (`AI-DENTAL-AD-HOW-IT-WORKS.html`) inherited the existing design system: Pretendard + IBM Plex Serif, cream paper background (`#f5f3ed`), green accent (`#0d4d3a`). Style continuity with the previous `HOW-ADS-WORK.html` was intentional — same reader, same visual context.

The master report itself was assembled in a second pass: 4 background agents ran analysis from different angles (output samples, working mechanisms, regulatory/risk/gap analysis, top-company deep dive), all simultaneously. Once all 4 completed, a single synthesis pass merged them into one coherent document.

## Publishing 5 DEV.to Articles in Parallel

In the same time window, the `auto-publish` skill shipped a DEV.to series on Codex.

```
Write 5 DEV.to posts about the latest Codex news.
GPT Image 2, Symphony, that kind of thing.
```

Flow: parallel `WebSearch` for fresh sources → 5 topic proposals → one approval (`ㅇㅇ`) → 5 agents generating simultaneously.

| # | Title | Length |
|---|-------|--------|
| 1 | GPT Image 2 Inside Codex: My New Frontend Workflow | ~9.0K |
| 2 | Symphony: Why OpenAI's PRs Jumped 500% in 3 Weeks | ~9.0K |
| 3 | I Gave Codex My Mouse for a Day | ~9.0K |
| 4 | Codex vs Claude Code: A Pragmatic Comparison | ~9.0K |
| 5 | The Reasoning Tax: What O-Series Thinking Costs | ~9.0K |

All five grouped into the series "Codex April 2026 Deep Dive" and published.

## The Gotcha: Successful Tool Calls That Looked Like Failures

During DEV.to article generation, several `Write` calls returned what looked like failure responses. Agents retried. Result: 8 draft files on disk instead of 5.

The actual cause was silent success — the tool call completed on the backend but the response arrived late. The agent interpreted the delay as failure and issued a duplicate write.

```
I see duplicates — earlier "failed" tool calls actually succeeded silently,
leaving 8 files. Let me clean up and keep the 5 within-spec versions.
```

After culling to 5 and committing, `git push` was rejected — the CI pipeline had committed ahead of the local branch:

```bash
git pull --rebase origin main
git push
```

Claude Code read the rejection error and ran `pull --rebase` without being asked. On repos with active CI this pattern repeats regularly.

Root cause of the duplicate files: no explicit filename convention was given in the agent prompts. Without a constraint like "output filename must match `YYYY-MM-DD-{slug}-en.md` exactly," each agent makes its own naming decision. With 5 agents running simultaneously, those independent decisions produce collisions. Specifying naming conventions upfront prevents this entirely.

## Side Project: Google Meet Integration for Coffee Chat

Between research sessions, I added automatic Google Meet link generation to a mentorship booking project. When a session is confirmed, a Meet link is created and attached automatically.

OAuth flow:

- `GET /api/mentor/google/connect` — initiates OAuth
- `GET /api/mentor/google/callback` — stores tokens in Supabase
- `src/lib/google/booking-hook.ts` — booking confirmation hook, calls Calendar API

Toss Payments integration is on hold pending contract finalization. The current flow uses bank transfer as a temporary fallback — swapping in the real API key in `payment/confirm/route.ts` is the only migration step required. Three unit tests shipped alongside: `oauth.test.ts`, `calendar.test.ts`, `booking-hook.test.ts`.

## Tool Call Breakdown — 276 Total

| Tool | Count |
|------|-------|
| Bash | 71 |
| Agent | 59 |
| TaskUpdate | 55 |
| Write | 25 |
| TaskCreate | 25 |
| Read | 22 |
| Edit | 5 |
| **Total** | **276** |

Agent calls at 21% of the total. Research, generation, and analysis delegated to subagents; `Bash` used primarily for file verification and git operations. 4 sessions total, 25 files created, 4 files modified.

## The Real Prerequisite: Draw the Boundaries First

> Subagents aren't a speed tool. They multiply throughput only when the work already has clean boundaries.

Direction decisions, quality judgment, framing — those stay in the main context. Both sessions started with structure before dispatch. The 12 agents each got a non-overlapping domain. That's what kept them from duplicating effort. The parallel dispatch was effective because the decomposition was done first, not because of any property of the agents themselves.

Decomposition is non-delegatable. Everything downstream of it can be.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
