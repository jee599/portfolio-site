---
title: "12 Parallel Subagents, 276 Tool Calls: Research Automation and 5 DEV.to Posts in One Build Day"
project: "portfolio-site"
date: 2026-05-01
lang: en
pair: "2026-05-01-portfolio-site-ko"
tags: [claude-code, multi-agent, research, auto-publish, devto]
description: "12 parallel Claude Code subagents, 276 tool calls: Korea dental market research, 5 DEV.to posts auto-published, and Google Meet OAuth — in 4 sessions."
---

Twelve Claude Code subagents. Running simultaneously. Not as a benchmark — as an actual working session.

Four sessions. 276 tool calls. 60 vendors catalogued. 7 HTML reports generated. 5 DEV.to posts published. One Google Meet OAuth integration shipped. All in the same build day.

**TL;DR** When you decompose a research problem into non-overlapping domains and assign one subagent per domain, you can complete market surveys in a single session that would otherwise take days. The same pattern works for content generation — 5 blog posts in one cycle, ~9K characters each, generated and deployed in parallel.

## What the Market Research Task Actually Was

Korea's medical advertising market is strictly regulated. Clinics can't run the same ad copy they'd use for consumer products — the Medical Devices Act and Medical Services Act both apply, and violations carry real penalties. Vendors operating in the space navigate this while also handling Naver SEO (Korea's dominant search engine), blog automation, and the visual formats that perform in Korean healthcare contexts.

The brief: map the vendor landscape entirely. Who's operating, what they charge, what they actually deliver, what regulatory risks they carry, and where the market has gaps. Six research dimensions, each deep enough to require dedicated investigation.

Running them sequentially would have taken days. Running them in parallel with 12 subagents took one session.

## What "Use 10+ Subagents" Actually Means in Practice

The original instruction:

> "Use 10+ subagents to investigate, with separate agents for each domain"

The first design decision is domain decomposition. Spinning up 12 agents and telling them all to "research AI dental advertising" produces duplicated work, overlapping results, and no clean way to synthesize outputs. The non-overlap constraint is the prerequisite for parallel efficiency.

The 12 domains:

- SEO and blog automation vendors — 3 agents (highest vendor density in this market, warranted more coverage)
- Portfolio and deliverable collection — 2 agents
- Naver algorithm change tracking — 2 agents
- Regulatory risk and medical advertising law — 2 agents
- Pricing models and ROI matrices — 2 agents
- Untapped market opportunity mapping — 1 agent

Each agent ran `WebSearch` + `WebFetch` against its assigned domain only. No cross-domain lookups. No shared data structures. Each returned its results to the main context independently.

The main context handled synthesis — combining, deduplicating, and cross-referencing across all 12 return values. Synthesis is inherently sequential. You can't delegate the judgment layer.

Session 1 tool distribution: `Agent(47)` + `Bash(14)` + `Write(11)` = 96 tool calls. The elevated `Agent` count relative to `Bash` is the fingerprint of a research session. When that ratio inverts, the session has shifted to implementation mode.

## 12 Agents Return — How Do You Trust the Output?

Running 12 agents doesn't produce 12 equally reliable results. Some agents return verified company names, direct URLs, and specific pricing data. Others return assertions that something exists, without evidence.

Before writing the integration report, I reclassified all findings by evidence strength:

```
★★★★★ — real name + quantitative data + direct URL verified
★★★★  — initials + rich statistics, no direct URL
★★★   — company name + pricing data, URL unconfirmed
★★    — claims only, no supporting evidence
```

This matters because downstream decisions — which vendors to contact, which pricing benchmarks to trust, which regulatory risks are actual vs. theoretical — depend on confidence levels, not just information volume.

The final output, `AI-AGENCIES-DEEP-REPORT.html`, came in at 21KB across 9 sections:

1. Full vendor directory — 60 companies
2. Five standard operating patterns observed across vendors
3. Pricing and ROI matrix
4. Regulatory risk map
5. Market gap analysis
6–9. Category-specific deep dives

The evidence classification cannot be delegated to a subagent. It requires comparing outputs across agents and making reliability judgments. Distributing this work produces conflicting quality assessments that still need central reconciliation — you add a coordination layer without removing the judgment requirement.

## Publishing 5 DEV.to Posts in Parallel — and Two Bugs That Surfaced

The `/auto-publish` skill pipeline: content research → topic selection → parallel generation → API publishing. Same build day as the research session, same parallelization approach.

The five posts in the Codex series:

| # | Title |
|---|-------|
| 1 | GPT Image 2 Inside Codex: My New Frontend Workflow |
| 2 | Symphony: Why OpenAI's PRs Jumped 500% in 3 Weeks |
| 3 | I Gave Codex My Mouse for a Day |
| 4 | Building a Full RAG App with Codex in One Session |
| 5 | Codex vs Claude Code: My 2-Week Comparison |

Two bugs appeared right before publishing. Both represent failure modes common to parallel agent workflows.

**Silent success reported as failure.** The `Write` tool returned an error response for one file. The file had actually been written successfully. The agent treated the error as real and retried. By the time the session caught this, there were 8 files in the output directory instead of 5. Resolution: filter to files that pass the 10KB character threshold, discard duplicates.

This is an insidious class of bug. The agent's retry logic is correct given what it observed — the observation itself was wrong. In parallel workflows, false negatives compound: one agent's incorrect error report can trigger retries that create state inconsistencies that cascade into other agents. The systematic fix is idempotent write logic (check-then-write with content hashing) rather than write-and-retry.

**Git push rejected.** CI had pushed a commit to remote while the session was running.

```bash
! [rejected] main -> main (fetch first)
```

The agent read the error log, independently concluded `git pull --rebase` was the correct resolution, executed it, and re-pushed. The complete sequence — error detection, root cause analysis, recovery, retry — was autonomous.

Each post averaged ~9.0K characters. Series label: "Codex April 2026 Deep Dive."

## Shipping Google Meet Integration for coffeechat

The same session picked up a feature addition for coffeechat, a mentorship booking product: auto-generate a Google Meet link when a consultation is confirmed.

Existing flow: mentor sets availability → student books → confirmation email sent. The gap: no meeting link in the confirmation. Both parties had to coordinate separately — enough friction to generate support requests.

New flow: mentor connects their Google account via OAuth during onboarding. When a booking is confirmed, the system calls Calendar API with the meeting details and generates a Meet link automatically. The link appears in both the confirmation notification and the calendar invite.

Core files generated:

```
src/lib/google/oauth.ts            — Google OAuth 2.0 PKCE flow
src/lib/google/calendar.ts         — Calendar event creation with Meet link
src/lib/google/booking-hook.ts     — Booking confirmation hook, Calendar trigger
supabase/migrations/20260501_mentor_google_oauth.sql
```

Three test files alongside the implementation: `oauth.test.ts`, `calendar.test.ts`, `booking-hook.test.ts`. Coverage: PKCE token exchange, Calendar API event payload structure, booking hook trigger behavior.

One open dependency: payment processing. Toss contract is pending, so the current flow uses bank transfer temporarily. The integration point is isolated to `payment/confirm/route.ts` — swapping in the Toss API key is the only change needed when the contract clears.

Session tool distribution: `Bash(50)` + `Read(20)` + `Write(12)`. Compare this to the research session's `Agent(47)` + `Bash(14)` profile. The dominant tool is a reliable signal of what kind of work was actually happening.

## 4-Session Aggregate Stats

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

25 files created, 4 modified. `Agent` at 59 calls accounts for 21% of total.

The tool ratio is a session health indicator worth tracking: research sessions push `Agent` share above 40%; implementation sessions push `Bash` share above 50%. An inverted ratio — high `Agent` in a coding session, high `Bash` in a research session — is a signal the work drifted from scope.

`TaskUpdate` at 55 calls reflects active orchestration. In multi-agent sessions, a high `TaskUpdate` count means the main context is tracking progress rather than fire-and-forget dispatching. It's the difference between running agents and orchestrating them.

## When Parallelization Actually Delivers

> Subagents are not a speed multiplier. They're a partition tool. The gains are real only when the work has clean boundaries.

IO-bound tasks — web search, page fetch, content extraction — parallelize well. The bottleneck is network latency, not reasoning. Running 12 search agents in parallel approaches 12x throughput on the IO layer.

Compute-intensive tasks — complex reasoning, code generation with inter-task dependencies, anything that reads outputs from another in-flight subtask — show limited parallel gains. The reasoning bottleneck doesn't disappear with more agents.

Work without natural boundaries — direction-setting, synthesis, quality judgment — doesn't parallelize at all. These require full context. Distributing them produces partial opinions that still need central reconciliation; you've added coordination overhead without reducing work.

The clean 12-agent run in this session came from one design decision made before dispatch: each agent had an explicitly defined, non-overlapping domain. Zero shared state means zero coordination overhead and efficient parallelism.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
