---
title: "Claude Code in Production: 10 Sessions, 740+ Tool Calls, 5 Parallel Projects"
project: "portfolio-site"
date: 2026-06-26
lang: en
pair: "2026-06-26-portfolio-site-ko"
tags: [claude-code, multi-agent, workflow, automation]
description: "10 sessions, 740+ tool calls, 5 parallel projects in 3 days — agent delegation patterns, ultracode workflows, and where AI automation hits its limits."
---

17 emails went out to the wrong people. That's what surfaced during what I thought was a routine system audit — while simultaneously managing four other projects through Claude Code.

Over 3 days: 10 sessions, 740+ tool calls, 5 projects running in parallel. Bash 200+, Edit 80+, Read 95+, Workflow 2. The projects: JDLab outreach automation, dental marketing SEO, an investor deck rebuild, a government grant database search, and a payment platform integration.

**TL;DR:** Agent delegation actually works at scale. A single `dental-clinic` subagent handled an entire marketing project with 1 tool call from my main session. An ultracode Workflow compressed 3 days of research into ~2 hours. The real bottleneck: external platform reviews that require human approval loops.

## A Production Bug I Found by Reading Logs

Sessions 1-2 kicked off with "audit the JDLab outreach system." Straightforward enough.

Then I read the execution logs.

The system's strategy document was explicit: `fail-closed / no-send / no-cron`. But the runtime logs told a different story:

```
classification=live_send
sent_count=17
dry_run=false
```

Seventeen emails had already been delivered to real addresses. Not a test run.

After 79 tool calls tracing the execution path, the culprit surfaced: `jdlab_tryjdlab_live_send_launcher.sh`. Every safety gate was hardcoded open:

```bash
JDLAB_DRY_RUN=0
DRAFT_CREATE_OK=approved
LIVE_SEND_OK=approved
```

There was a second, subtler issue. The sender address was `jd@tryjdlab.com` — an alias — but the actual authenticated account delivering email was `jd@jidonglab.com`. The forbidden-sender gate only checked the alias string, so it passed.

```bash
# before: checks alias only
if [[ "$EXPECT_PROFILE" == *"tryjdlab.com"* ]]; then

# after: checks authenticated account
if [[ "$AUTHENTICATED_EMAIL" == *"jidonglab.com"* ]]; then
```

Three fixes shipped:

1. Deactivate the live launcher (rename to `.disabled` — preserve the audit trail)
2. Change sender validation from alias string to `profile_email` (the OAuth-authenticated address)
3. Add regex patterns for webmaster and role-based email prefixes to the never-send blocklist

Session 2 added hardening: a pre-flight checklist that must fully pass before any launcher runs, plus an audit log recording each gate decision with its input values. 89 tool calls total across both sessions.

Why can't tests catch this? Environment variables get overridden inside the launcher script, but unit tests invoke the code path directly — they never see the launcher's overrides. The only way to catch this class of bug is to read actual runtime logs. Code review misses it entirely.

## What 1-Tool-Call Project Management Looks Like

Session 3: 1 tool call. Total.

That was the dental marketing session for Dongbaek UDDental clinic. The entire session: `Agent(dental-clinic)`. One invocation.

The `dental-clinic` subagent read `~/dental-promo/dongbaek-uddental/` — `clinic.json`, keyword cache, history — restored its prior state, ran keyword rank measurement, wrote results to the log, generated a weekly digest, and synced. No further input from me.

Why a subagent instead of working directly in the main session?

At any point during these 3 days, the main context was already carrying:
- Outreach system gate configs and email send logs
- Investor deck slide content and VC positioning notes
- Government grant program eligibility criteria
- Payment platform policy docs and sandbox test results

Pulling the dental project into that same context would mean carrying clinic-specific keyword rankings alongside payment platform error codes. Context pollution makes every subsequent reasoning step noisier. Isolated subagents are a practical context management strategy, not just a theoretical architecture pattern.

**Session 4** produced the measurable outcome. The day after publishing Post #2 (pediatric dentistry content), Naver ranking data showed:

- **#1** blog tab ranking for "동백 소아치과" (Dongbaek pediatric dentistry)
- **#4** for "용인 소아치과" (Yongin pediatric dentistry) — first-ever ranking for this keyword

The placement traffic analysis surfaced another data point: procedure-keyword inbound traffic was **0%**. New patients were arriving through brand name search only — no one searching "dental implant Dongbaek" was finding the clinic. That 0% figure became the concrete justification for expanding blog volume to cover procedure keywords. Data-driven, not intuition-driven.

One implementation note: using `SendMessage` to continue the same agent instance between sessions rather than spawning new ones. A fresh agent pays full context restoration cost every time. The same instance retains its loaded state. For a project with an evolving keyword database and weekly ranking history, that compounding cost matters.

## When Parallel Agents Compress Days Into Hours

Sessions 5-6 each ran an ultracode Workflow — multiple subagents fanning out on independent tasks in parallel, converging to a synthesized result.

### Investor Deck Rebuild (Session 5)

Starting point: a 12-slide HTML investor deck for Preterview. The problem: the deck said "3-axis capability model." The actual live product report screen showed 5 axes. A factual inconsistency in a pitch deck is a fixable problem — but you have to find it first.

The Workflow ran three tracks concurrently:

**Track 1: Source verification** — Does the product have 3 axes or 5? Read the codebase, not the marketing copy. Check the data model, report schema, UI component definitions.

**Track 2: Multi-lens critique** — Four parallel agents, each with a distinct reviewer identity: VC partner, marketing strategist, positioning consultant, visual designer. Each reads the full deck independently with no cross-contamination of results.

**Track 3: Rebuild spec synthesis** — Once tracks 1 and 2 complete, synthesize a per-slide rewrite spec with specific text changes, data replacements, and visual notes.

Tool counts: Read 29, Bash 35, Edit 24. The output was actionable at the slide level — not "section 3 needs work" but "Slide 7, second bullet: replace '3-axis' with '5-axis capability model'; add screenshot of the Insight axis from the live report view." The factual error was confirmed: 5 axes, the deck was wrong.

### Government Grant Search (Session 6)

Background: an existing database of 42 government grant programs for Korean tech startups. Goal: find programs not already catalogued.

8 parallel search angles, each running independently:

| Angle | Focus |
|---|---|
| Central government | MSIT, MOTIE programs |
| NIPA / AI | AI-specific initiatives |
| Gyeonggi / Pangyo | Regional tech zone grants |
| Content / edtech | Category-specific programs |
| Accelerators | Cohort-based programs |
| Competitions | Grant competitions and awards |
| Healthcare | Digital health funding |
| Global | International / export programs |

Each agent did live web verification — confirming programs were actually open, checking deadlines, verifying eligibility criteria. No hallucinated programs that closed two years ago.

Output: 23 verified program recommendations with application status, funding amount, and eligibility notes. Manual version: browser tabs, spreadsheets, 2-3 days. Workflow version: ~2 hours wall-clock.

## The Part AI Can't Speed Up

Session 7: Preterview payment integration. 26 hours, 211 tool calls. Bash 104, mcp__claude-in-chrome 27.

The code side moved quickly. The problem was Paddle.

Issues hit in sequence:

**Problem 1:** Original Paddle account's KYC had expired. Non-reactivatable. Start over.

**Problem 2:** New Paddle account submitted for production review. Rejected — Preterview classified as "HR Service," a restricted category under Paddle's merchant policy.

**Problem 3:** The credit-based payment model (users pre-purchase interview credits) conflicts with Paddle's usage-based billing policy restrictions. Not a configuration issue — a product model question that requires a policy exception process.

**Problem 4:** The `feat/paddle-checkout` branch had 23 commits built on assumptions about account setup that no longer held. The branch couldn't merge to main.

That 27 `mcp__claude-in-chrome` count represents work that looks like debugging but is actually form-filling, policy-reading, and sandbox testing through a real browser. Browser automation helped where it could — but it can't approve a merchant application on behalf of a human reviewer at a payment platform.

"Code is correct, but platform review is the blocker" is the hardest state to be in. Sandbox approval means nothing until production review clears. Every account configuration change restarts the review cycle. There's no automation path around it. Budget for the wait as a fixed cost, not an uncertainty.

## By the Numbers

| Metric | Value |
|---|---|
| Total sessions | 10 |
| Total tool calls | 740+ |
| Largest session | 211 calls (26 hrs, Preterview payments) |
| Smallest session | 1 call (dental clinic delegation) |
| Files changed | 30+ |

The distribution matters more than the total. The 1-call session and the 211-call session represent opposite ends of the delegation spectrum — one where the agent owned the entire domain, one where external dependencies created unavoidable blocking work.

## Patterns Worth Repeating

**Domain-isolated subagents keep context clean.** A dedicated agent per project domain means the main session never carries domain-specific state. With 5 simultaneous projects, this is how you prevent context pollution between unrelated work streams. Dental keyword rankings don't belong in the same context window as Paddle policy docs.

**Parallel Workflows for multi-source research.** Any task requiring coverage of N independent sources — grant programs, reviewer perspectives, competitive angles — runs faster as parallel agents than sequential tool calls in one session. 8 agents searching simultaneously also don't anchor on each other's results, which matters for research quality.

**Read logs before reading code.** The outreach bug was invisible in static analysis. The runtime logs made it obvious. When debugging automation systems, start with execution logs and work backward to code — not the other way around.

**External review cycles are a fixed cost.** Payment processing, app store reviews, ad platform approvals — wherever a human reviews your integration, that timeline is outside the system. The code can be perfect. Build the wait into the schedule.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
