---
title: "17 Emails Went Out by Accident — 3 Days Hardening 6 Projects with Claude Code"
project: "portfolio-site"
date: 2026-06-27
lang: en
pair: "2026-06-27-portfolio-site-ko"
tags: [claude-code, automation, security, paddle, preterview, multi-agent]
description: "A live email blast, a Paddle rejection, and 830+ tool calls later — hardening 6 projects across 15 sessions in 3 days with Claude Code."
---

On the morning of June 25th, I opened the JDLab email pipeline logs and saw three fields that should never appear together: `classification=live_send`, `sent_count=17`, `dry_run=false`. Seventeen emails had gone to real recipients. The sender was `jd@jidonglab.com` — the primary mailbox explicitly blocked in the codebase.

That kicked off a week that ended up spanning 3 days, 15 sessions, and 830+ tool calls across six active projects: `local-commerce-agent`, `preterview`, `dongbaek-uddental`, `jidonglab-site`, and `portfolio-site`.

**TL;DR** Email security audit + hardening (2 sessions), Preterview IR upgrade via multi-agent validation workflow, Paddle payment integration blocked twice, dental marketing sub-agent delegation, jidonglab.com homepage redesign. Every part of this ran through Claude Code as the primary execution layer.

## How 17 Emails Slipped Through Every Gate

The root cause was in `~/.hermes/scripts/jdlab_tryjdlab_live_send_launch.sh`. This cron entrypoint hardcoded every safety gate open:

```bash
JDLAB_DRY_RUN=0
JDLAB_DRAFT_CREATE_OK=approved
JDLAB_LIVE_SEND_OK=approved
SEND_WINDOW=9999
```

The strategy document said "fail-closed / no-send / no-cron." The actual execution script was the exact opposite. A second vulnerability compounded the problem: the forbidden-sender identity check only looked at the `--expect-profile` string. When an authenticated mailbox (`jd@jidonglab.com`) used a From alias (`jd@tryjdlab.com`), the check passed cleanly. The gate was inspecting the wrong field entirely.

I gave Claude a single instruction: "End-to-end audit of the JDLab workflow — check all actual logs, state files, and Hermes scripts." Session 1 ran Bash 21 times, Read 22, Edit 14 — 79 tool calls to surface 3 root causes and ship fixes.

The core fixes:
- Disabled the live launcher completely (confirmed removed from crontab/launchd, not just commented out)
- Changed the forbidden-sender identity guard to check **authenticated mailbox** instead of From alias
- Expanded `never-send` patterns to cover `webmaster`, `mailer_daemon` (including underscore variants), and role addresses like `contacto`, `contato`, `press`, `partnerships`

Session 2 was an independent verification pass on session 1's fixes, plus additional hardening for defense-depth gaps that session 1 hadn't touched. Four independent audits ran in parallel: bounce/reply feedback loops, yield collapse, never-send pattern coverage, and preflight suppression classifier. 89 tool calls.

The system is fully fail-closed after session 2. Live launcher disabled. Draft gate blocked by default. All send/draft crons paused.

The thing that stood out here was how much faster parallel auditing is than sequential review. Session 1 did sequential root cause analysis — 79 calls to trace the full chain. Session 2 split four concern areas across four independent audits and ran them concurrently. The total call count per area was smaller, but the coverage was broader because no single audit was trying to hold the full context of every subsystem simultaneously.

## The Sub-Agent Pattern That Actually Works at Scale

The most time-efficient change this week wasn't a code fix — it was formalizing the delegation pattern for context-heavy recurring work.

The use case was Dongbaek Uddental dental clinic's regular performance measurement. Here's what the main session prompt looked like:

```
Regular measurement for Dongbaek Uddental. Delegate to dental-clinic sub-agent.
Public data: measure keyword rankings (blog tab + unified search).
Track 2 published posts (pediatric): check if logNo 224326926066 entered pediatric keywords...
```

One prompt. That's all the main session handled. The `dental-clinic` sub-agent read `clinic.json`, `cache`, and `history.json` under `~/dental-promo/dongbaek-uddental/`, restored its own context, ran measurement → logging → digest generation → sync — and returned a structured result. Main session tool calls: `Agent(1)`.

Results that day: 'Dongbaek pediatric dentist' blog tab hit **#1 ranking**, 'Yongin pediatric dentist' **entered 4th place for the first time** — within 24 hours of publishing.

The important implementation detail: for session 6 (Uddental blog publishing, 53 tool calls), I used `SendMessage` to resume the same dental-clinic agent instance rather than spawning a new one. A fresh instance means paying the `clinic.json` context restoration cost again. Reusing the same instance keeps the conversation state alive. The session prepped 2 pediatric dentistry posts as final packages; the clinic owner published them directly to Naver Blog via copy-paste.

The broader principle here is that Claude Code as an orchestration layer works best when the main session only handles decisions and approval gates. Delegation to a specialized sub-agent that owns its own context, state files, and output format removes the recurring restoration overhead from the main session entirely.

## Parallel Multi-Angle IR Validation

Session 4 ran the Preterview investor relations document upgrade in ultracode mode (multi-agent workflow). The problem: an IR document that had drifted from the actual product state and needed both accuracy correction and narrative tightening.

First step was systematic: list every falsifiable claim in the existing IR. Then cross-check each one against ground truth.

Key discrepancies found:
- README stated signup bonus as 300cr; IR stated 200cr (the IR was correct)
- IR claimed "3 capability axes"; actual product has **5 axes** (confirmed by reading report screenshots directly, not from docs)
- "5 payment methods" claim → verified by grepping the codebase, not by trusting the written spec

The Workflow tool spawned 4 agents in parallel — VC lens, positioning lens, narrative lens, design lens. Each independently reviewed and critiqued the IR claims. Running them in parallel rather than sequentially matters: a sequential pass would let earlier findings bias later reviewers. Independent parallel evaluation surfaces disagreements instead of burying them.

Conclusion: the IR was more accurate than the README. The only substantive fix was "3 capability axes → 5 capability axes." Real interview and report screenshots — 3-person evaluation panel, voice answer playback, follow-up question generation, real-time speech recognition, 5-axis scorecard — were embedded directly into the slides to replace the described claims with demonstrated evidence.

Session 4: Bash 35, Read 29, Edit 24, Workflow 1. Total: 92 tool calls.

The workflow cost more than a single-pass review would have. But catching the 3-vs-5-axis discrepancy before the IR went to investors made that cost worthwhile. The issue wasn't in the written documentation anywhere — it only surfaced when one of the parallel agents pulled the actual product screenshots.

## Paddle Rejected the Integration. Twice.

Session 7 was the longest this week — a 26-hour 52-minute wall clock (most of it Paddle waiting), 211 tool calls. The core task was merging `feat/paddle-checkout` (23 commits, 47 files, +4,960 lines) into main and getting the payment integration live.

The merge was clean. The 4 payment commits didn't touch interview or avatar files. No conflicts.

**First rejection**: the existing Paddle account's KYC verification had expired.

```
Verification status: Action required
We're unable to verify your identity as the verification process has expired.
```

Created a new account and rebuilt the sandbox from scratch: 3 products (Starter 800cr/$7.99, Standard 5,000cr/$39, Pro 12,000cr/$79), client-side token, webhook endpoint configuration.

**Second rejection**: domain review for the new account returned a policy rejection.

```
We identified the following product categories on this domain:
Other/Resume/CV Builders
Human Services/Consulting or Advisory Services
These categories fall outside what Paddle can support under our Acceptable Use Policy.
```

Preterview is an AI interview coach. Paddle's classifier flagged it under "Human Services" — presumably because "interview coaching" typically involves a human coach. The appeal went back with explicit language: zero human interviewers, zero human coaches, zero consultants involved in any session. Fully automated software product. AI generates all feedback. Waiting on the review outcome.

While waiting, the session handled adjacent cleanup: 3 new legal pages (terms, privacy, refund) from scratch, dead payment code removal, live environment variable organization. Paddle blocking the payment flow didn't block the rest of the product — the code work that could be done was done.

LemonSqueezy is now on the shortlist as a fallback if the Paddle appeal doesn't land.

## Keyword Strategy: Where to Put 500,000 KRW

Session 8 (162 tool calls) was the ad channel decision session. The budget was 500,000 KRW (~$370) and the question was: domestic Naver or global channels?

The workflow ran parallel research arms — one on Naver PowerLink mechanics, one on global alternatives. The domestic analysis covered search volume, CPC estimates, and conversion intent by keyword segment. The global arm looked at whether English-language interview coaching search traffic had any realistic overlap with Preterview's positioning.

Verdict: all-in on Naver PowerLink for the initial campaign. The highest-leverage keywords weren't the obvious ones. "AI 면접" (AI interview) was too broad and expensive. The better targets were "면접 말버릇 교정" (interview speech habit correction) and "면접 습관 교정" (interview habit correction) — mid search volume, low CPC, high purchase intent. Users searching those phrases are actively trying to fix a specific problem, not just exploring.

Gaming industry keywords like "게임회사 면접" (game company interview) had relevant intent but search volume was too small to justify CPC spend at this budget level.

Implementation: added GA4 (`G-ES6SENFGM2`) and Naver conversion tracking pixel to `app/layout.tsx`, merged to main. Naver biz channel review passed the same day. GA4 is managed through `NEXT_PUBLIC_GA_ID` in `.env.local` to keep the tracking ID out of the repository.

## What Three Days of Multi-Project Orchestration Actually Looks Like

The session count breakdown: 2 security sessions (email hardening), 1 IR upgrade (Preterview), 2 Paddle sessions (integration + appeal), 2 dental sessions (measurement + blog publishing), 1 ad strategy session, 1 homepage redesign session, a handful of smaller maintenance sessions. 830+ tool calls across all of them.

Two patterns that consistently worked across all project types:

**Sub-agent delegation for context-heavy recurring work.** The dental marketing case was the clearest example. The main session doesn't need to know the details of Naver blog ranking algorithms, clinic history, or keyword tracking state. The sub-agent owns that context permanently. The main session commits one agent call and gets a structured result back. This scales: the same pattern would work for any domain that has its own stable context and recurring measurement cadence.

**Parallel independent agents for multi-perspective verification.** Sequential review — even careful sequential review — has a compounding bias problem. Each step's framing influences the next. Running 4 agents independently on the same material and then synthesizing disagreements is more reliable for finding gaps. The IR case demonstrated this concretely: 3 of the 4 reviewers would have passed the "capability axes" claim if they'd been working sequentially off a shared context. The 4th caught it by reading the actual product screenshots.

The pattern that didn't work well: long-running sessions that mix blocked work (Paddle approval waiting) with active work. Session 7's 26-hour wall clock included substantial idle time. That work would have been cleaner split into two sessions — one for the merge, one for the legal pages and cleanup after the first rejection came back.

Paddle is still pending. The rest ships.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
