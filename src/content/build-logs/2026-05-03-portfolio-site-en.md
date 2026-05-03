---
title: "5 Parallel Claude Code Agents: 382 Tool Calls Across 3 Projects in One Day"
project: "portfolio-site"
date: 2026-05-03
lang: en
pair: "2026-05-03-portfolio-site-ko"
tags: [claude-code, multi-agent, parallel, devto, coffeechat, dentalad]
description: "5 sessions, 382 tool calls, 3 projects simultaneously. DEV.to drafts in parallel, 5 verification agents on 66K-word research, Google Meet OAuth — parallel agent dispatching in practice."
---

382 tool calls. 5 sessions. Three separate projects moving at the same time — DEV.to content, a Korean dental ad market research project, and a coffee chat booking platform. The throughput came from one thing: parallel agent dispatching.

**TL;DR** — Parallel agents in Claude Code aren't just theory. This session tested two real cases: 5 DEV.to articles written simultaneously, and 5 verification agents cross-checking 66,745 words of market research. Both showed clear speed advantages over sequential processing — and exposed specific failure modes worth knowing about.

## Writing 5 DEV.to Articles at the Same Time

Session 1 started with a request: "Write 5 DEV.to articles based on the latest Codex news." Sequential processing would average 2–3 minutes per article — 15+ minutes total. Instead, 5 agents ran in parallel.

Research came first. Checked the latest developments on GPT Image 2, Symphony, and Codex CLI, then allocated five article slots:

```
1. GPT Image 2 Inside Codex: My New Frontend Workflow
2. Symphony: Why OpenAI's PRs Jumped 500% in 3 Weeks
3. I Gave Codex My Mouse for a Day
4. The Codex Memory Problem (And How I Solved It)
5. Codex vs Claude Code: An Honest 2026 Comparison
```

Five agents launched simultaneously. TaskCreate fired 16 times across this session — most of them here.

One problem emerged immediately: tool calls marked as "failed" had actually succeeded, resulting in 8 files instead of 5. Cleaning up duplicates took extra time that offset some of the parallelism gains. The lesson: parallel agents need output verification afterward. Silent success is a real failure mode that doesn't show up in the error log.

Each article went through validation against `devto-seo-rules.md` — 10K character limit, prohibited phrase check, Sources section format. All five passed.

What the parallel approach saved: roughly 10 minutes of wall-clock time versus sequential. The tradeoff was 5–10 minutes of output cleanup. Net positive, but narrower than expected on the first run. On a second run with the same setup, cleanup drops to near zero because you know exactly what to verify.

## 5 Verification Agents on 66,745 Words of Market Research

Session 2 was a completely different scale of problem. The dentalad project — market research on AI dental advertising in Korea — had accumulated:

- V1 research: 12 documents
- V2 validation: 8 documents
- Integrated reports: 4 documents
- Total: 66,745 words across all files

The problem was data drift. V2 had already corrected V1's numbers, but FINAL-REPORT was still referencing V1 figures. With five distinct domains in the report — regulation, competitors, platforms, unit economics, market data — cross-verification by a single agent would have consumed an entire session on regulation alone before touching anything else.

Split into 5 parallel agents by domain:

```
Agent 1: Regulation (AI Basic Act, Fair Trade Commission, Medical Act)
Agent 2: Competitors (CareLabs, Sangsŭng Planning, Top 5 players)
Agent 3: Platforms (Naver, Meta, ChatGPT)
Agent 4: Unit Economics (cost structure, pricing, MRR projections)
Agent 5: Market Data (ROAS benchmarks, LTV, TAM estimates)
```

The findings were specific and actionable. Three categories of errors surfaced:

**Data drift:** FINAL-REPORT carried V1 figures that V2 had already corrected. The final document was presenting superseded data as current.

**Competitor revenue overstated:** Across the board, revenue estimates for the Top 5 competitors were higher than what the corrected V2 sources supported.

**Regulatory timeline incorrect:** The report stated "2025-12 enforcement" for the AI Basic Act, but that was the announcement date — not the enforcement date. A meaningful difference when presenting to clients.

**Subject-object reversal:** The section on ChatGPT and Naver had the relationship backwards. Naver blocked ChatGPT's indexing; ChatGPT didn't block Naver. The original draft had the causal direction wrong.

Running this sequentially, a single agent verifying all five domains would have taken most of a session just to get through regulatory context. Parallel agents logged 64 TaskUpdate calls in this session — the highest count of any session, and a direct reflection of how much concurrent progress tracking was happening.

Verification output landed as 5 files:

- `verification/01-regulation.md`
- `verification/02-competitors.md`
- `verification/03-platform.md`
- `verification/04-unit-economics.md`
- `verification/05-market-data.md`

After verification, FINAL-REPORT, EXECUTIVE-SUMMARY, and RISKS were updated to reflect the corrected data. Three HTML report variants were generated as well.

The value of parallel verification here isn't just speed — it's independence. Each agent came to its domain without anchoring bias from having just read another domain's numbers. The structural separation feels right for cross-validation work.

## Google Meet OAuth Integration in coffeechat

The second half of Session 1 switched context to coffeechat, a mentor booking platform. It started with "does the consultation flow have Google Meet generation?" and turned into a full OAuth integration.

The work required OAuth 2.0 + Google Calendar API. Generated files:

- `src/lib/google/oauth.ts` — authorization flow and token refresh
- `src/lib/google/calendar.ts` — meeting creation with conferencing data
- `src/lib/google/booking-hook.ts` — trigger that fires on booking confirmation
- `src/app/api/mentor/google/connect/route.ts` — OAuth callback handler
- `src/app/api/mentor/google/disconnect/route.ts` — token revocation
- `src/app/api/mentor/google/status/route.ts` — connection status check
- `src/components/mentor/GoogleConnectCard.tsx` — mentor-facing UI

Three test files alongside those. Bash hit 50 calls in this session — most of it verifying the OAuth token exchange and inspecting the Calendar API response shape to confirm that `conferenceData.entryPoints` was populated correctly before trusting the meeting URL.

Payment flow decision: bank transfer (무통장) for initial launch, with Toss Payments integration deferred until after the merchant contract. The bank transfer confirmation logic sits in `payment/confirm/route.ts`, designed to be swapped out without touching the booking flow.

This part of the session was sequential by necessity. The mentor dashboard has interconnected components — the Google Connect card updates state that the booking flow reads, which updates state that the confirmation email template reads. Parallelizing that topology would have created merge conflicts that cost more time to resolve than the parallelism saved.

## Tracking Claude Subscription Usage: ccusage

Session 3 addressed a separate question: "Is there a way to know how much of the subscription I've actually used?" The official dashboard only returns percentage-based usage, not raw token counts.

All request logs live at `~/.claude/projects/**/*.jsonl`. Every session, every tool call, every token count — written locally by default. The `ccusage` package parses these and surfaces per-project, per-day token and cost breakdowns.

Several Mac menu bar apps have been built on the same approach:

- **Usage for Claude** — Product Hunt launch, iOS companion, GitHub-style contribution grid
- **ClaudeBar** — menu bar focused, lightest weight, no frills
- **Claude Token Monitor** — polls every 5 minutes, shows current session burn rate

All of them read from `~/.claude/` JSONL. It's filesystem polling, not a real-time event stream — there's inherent lag, but for subscription tracking it's accurate enough.

The key limitation: the subscription model doesn't expose raw token counts officially. Local log parsing is the only path to exact numbers, and that path exists because Claude Code writes detailed JSONL locally by default.

## Tool Usage Breakdown

382 tool calls across 5 sessions:

| Tool | Count | Primary Use |
|------|-------|-------------|
| Bash | 143 | API verification, git, filesystem |
| TaskUpdate | 64 | Parallel agent progress tracking |
| Read | 37 | Existing file review before edits |
| TaskCreate | 34 | Parallel agent dispatch |
| Write | 33 | New file creation |
| Edit | 27 | Targeted file modification |
| WebSearch | 18 | External reference and fact-check |
| Agent | 16 | Direct subagent invocation |

TaskCreate + TaskUpdate = 98 calls. 26% of all tool calls went to parallel task management overhead.

6 files modified, 29 files created. Average of 7 files per session.

The Bash count (143) is high relative to file operations (Write 33 + Edit 27 = 60). That ratio reflects active verification — running the OAuth flow manually, checking API responses, inspecting JSONL output — rather than generating and moving on.

## Where Parallel Agents Work and Where They Don't

After 5 sessions with this pattern, the boundaries are clearer.

**Works well:**

Independent domain verification. The dentalad 5 agents each owned a separate domain with no shared state. Agent 1 reading regulation documents had zero dependency on Agent 3 reading platform data. The outputs were additive, not interdependent.

Independent content generation. 5 DEV.to articles on non-overlapping topics ran cleanly. No agent needed to know what another agent was writing.

**Doesn't work:**

Tasks with shared state. The coffeechat mentor dashboard has interconnected components — you can't parallelize changes to components that read each other's state without introducing conflicts that are slower to resolve than the parallelism saves. Sequential was faster in that case.

Silent success. The 8-files-instead-of-5 situation on the DEV.to batch. When an agent reports failure but the output file exists anyway, you have invisible state that the next step doesn't expect. Post-parallel verification is non-negotiable on any write-heavy batch.

The 26% overhead on parallel task management is real and visible in the numbers. It's worth absorbing when tasks are genuinely independent and parallelism multiplies throughput. It isn't worth it when the dependency structure forces sequential resolution anyway — you pay the overhead without getting the speed gain.

The heuristic that's held up: if you could hand the tasks to 5 different people who'd never need to talk to each other, parallelize. If any two would need to coordinate, keep it sequential.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
