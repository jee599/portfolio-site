---
title: "Claude Code, 10 Sessions and 846 Tool Calls: Catching a Live Email Bug and Getting Rejected by Paddle Twice"
project: "portfolio-site"
date: 2026-06-26
lang: en
pair: "2026-06-26-portfolio-site-ko"
tags: [claude-code, local-commerce, preterview, paddle, ultracode, workflow]
description: "10 sessions, 846 tool calls: fixing a live email send bug, two Paddle rejections, IR rebuild with multi-agent ultracode, and a full homepage redesign."
---

17 real businesses received cold outreach emails from a system that was never supposed to send anything.

**TL;DR** Across 10 Claude Code sessions and 846 tool calls: discovered and patched a live email send vulnerability in `local-commerce-agent`, got rejected by Paddle twice while integrating payments for preterview, rebuilt an investor IR deck using multi-agent ultracode mode (and caught a product inconsistency the IR author missed), and shipped a full redesign of jidonglab.com. Not a quiet day.

## The System That Wasn't Supposed to Send Anything — Sent 17 Emails

`local-commerce-agent` is an email outreach automation for local businesses. The repo's documented design principle is explicit: **fail-closed / no-send / no-cron**. No actual mail should ever leave the system without deliberate, multi-gate authorization.

Session 1 (79 tool calls, 20 minutes) was a routine audit. The first thing the agent read was the recent run log:

```
classification=live_send
sent_count=17
dry_run=false
```

The sender was `jd@jidonglab.com` — the primary work account, not a test alias.

Tracing the root cause took about ten minutes. The culprit was `jdlab_tryjdlab_live_send_launch.sh`, a launcher script that had all three safety gates hardcoded open:

```bash
JDLAB_DRY_RUN=0
JDLAB_DRAFT_CREATE_OK=approved
JDLAB_LIVE_SEND_OK=approved
```

That alone would have been containable if the banned-sender check had worked. It didn't. The check was validating against the `--expect-profile` string — which was set to `jd@tryjdlab.com` — but the actual authenticated sender (`jd@jidonglab.com`) was evaluated against a different field entirely. The check compared the right value to the wrong column. Both conditions that should have stopped the send independently failed to trigger.

This is the kind of bug that only surfaces when someone reads the logs carefully instead of trusting that a "no-send" system is actually not sending.

Session 2 (89 tool calls, 31 minutes) was the hardening pass. Changes made:

- Added `webmaster` and `mailer_daemon` (including underscore variants like `mailer_daemon` and `mailerdaemon`) to the never-send pattern list
- Added detection for placeholder and likely-typo email addresses
- Fixed a confusing `done → external_status` mapping that made it hard to distinguish internal completion state from actual delivery confirmation

Two sessions, 32 Edit calls, two new test files added: `jdlab_send_identity_guard.test.js` and `jdlab_goal_mode_hardening.test.js`. The tests explicitly cover the wrong-field check that caused the original bypass.

The broader lesson: a "fail-closed" design isn't a property of your architecture — it's a property of every individual execution path. A launcher script with hardcoded overrides is a separate execution path, and it inherits none of your safety guarantees unless you explicitly wire them in.

## Paddle Rejected the Submission. Twice.

Session 8 ran 211 tool calls — the highest of any session in this batch. It was the Paddle payment integration for preterview, and it didn't go cleanly.

**First rejection: expired KYC on an old account.** The Paddle account had been created during an earlier project (`fortunelab`), and the KYC verification had lapsed in the meantime. The dashboard showed "Action required — verification process has expired." Attempting to recover the account was a dead end.

**Second rejection: product category mismatch.** A new account was created with the `preterview.com` domain. Paddle reviewed the submission and responded:

> "We identified the following product categories: Other/Resume/CV Builders, Human Services/Consulting"

preterview is an AI mock interviewer — voice-based, with automated performance reports covering communication patterns, problem-solving approach, and domain expertise. It runs real-time coaching sessions. Paddle classified it as a Resume Builder and declined on Acceptable Use Policy grounds.

The clarification materials have been submitted. The core argument is that preterview is a performance coaching and assessment tool, not a document generation product. The distinction matters because the user outcome is behavioral change, not a PDF artifact. Whether Paddle's review process is granular enough to register that difference remains to be seen.

On the code side, the work is done regardless. The `feat/paddle-checkout` branch — 23 commits, 47 files, +4,960 lines — merged into main. New files:

- `app/api/pay/paddle/`
- `components/pricing/PaddleBuy.tsx`
- `lib/payments/paddle.ts`

The Korean payment alternative is still unresolved. payapp doesn't support credit-based product types, so the search continues.

## Multi-Agent Ultracode Caught What the IR Author Missed

Session 4 was a preterview investor IR upgrade. The approach: `ultracode` mode with the Workflow tool, four parallel lenses running concurrently — VC framing, competitive positioning, narrative structure, and design coherence. 92 tool calls, 46 minutes, with Bash 35 / Read 29 / Edit 24 as the primary distribution.

The most useful thing the multi-agent run produced wasn't improved copy. It was a factual inconsistency the IR author hadn't caught.

The IR document stated the product evaluates candidates on **three capability axes**. The actual product report UI, which the agents verified directly against the codebase, showed **five axes**: experience specificity, job expertise, problem-solving, communication, and fundamental skills. The product had been updated after the IR was written. The IR was still describing the old version.

This is a real advantage of AI automation doing verification work rather than just generation work: agents read the actual code and UI definitions, not just what a human summary says about them. A human reviewer editing the IR in isolation would likely have taken the three-axis claim at face value.

Session 6 was a second rebuild pass, this time grounded in an actual investor feedback document (`preterview_feedbacks_260626.pdf`). The gap between a theoretically well-structured IR and one that responds to real objections from real investors is significant — the second pass addressed specific concerns that couldn't have been anticipated from internal review alone.

## Six Logo Directions, One Homepage Redesign, 143 Tool Calls

Session 5 (143 tool calls, 65 minutes) combined two workstreams: a new logo for jidonglab and a full homepage redesign.

For the logo, GPT Image (`gpt-image-2`) generated six directional explorations for a JL monogram. The selected direction was an indigo JL monogram with clean geometric construction, replacing the previous site logo.

The homepage redesign was more substantial. The new layout:

- Leads with preterview as the flagship product (above the fold)
- Includes a dental ad agency dashboard section with real report screenshots — numbers and client names removed, but the actual UI structure intact, which communicates "this is running in production" more effectively than mockup screenshots
- 21 files changed total
- New components: `BrandMark.tsx`, `DentalShowcase.tsx`, `Flagship.tsx`

The design principle here is that a portfolio should demonstrate actual work, not just describe it. Real dashboards with redacted data read as evidence; polished mockups read as aspirational.

## Everything Else That Happened in 846 Tool Calls

A few other sessions worth noting:

**Session 3** delegated the routine measurement for Dongbaek UDI dental clinic to the `dental-clinic` subagent — the same pattern used for recurring clinic work to preserve context across sessions. A pediatric dentistry post published the same day hit #1 on Naver's blog tab for "동백 소아치과" and #4 for "용인 소아치과" within 24 hours of publishing (verified against logNo 224326926066).

**Session 7** was a grant search for Pangyo Valueup support follow-up. An 8-angle parallel workflow ran across different grant categories and eligibility criteria, surfacing 36 verified leads and 23 candidates worth pursuing. Output: `MORE-2026-06-25.md` and `SEOUL-STARTUP-HUB-2026-06-25.md`.

**Session 9** was a short one: four WebSearch calls to determine whether a Money Today "Good Company Award" email was legitimate press outreach or paid award solicitation. It was the latter — the "coverage support (membership eligibility)" line item was the tell, a standard pattern for magazine award ad sales.

**Session 10** (162 tool calls) was preterview ad strategy: Naver PowerLink keyword selection, GA4 pixel insertion (`G-ES6SENFGM2`), and Google RSA copy. The keyword cluster around "면접 말버릇" (interview speech habits) and "면접 습관교정" (interview habit correction) showed the best cost-per-click ratio relative to intent quality — more specific than "interview prep" and less competitive than "mock interview."

## What 846 Tool Calls Actually Looks Like

Tool distribution across all 10 sessions:

| Tool | Count |
|------|-------|
| Bash | 268 |
| Read | 151 |
| Edit | 103 |
| Write | 21 |
| Other | ~303 |

The Bash-heavy distribution reflects the audit and verification work — log inspection, test runs, file diffing. Read-heavy sessions (like the IR rebuild) skew differently, with more time spent on comprehension before generation.

One pattern that's become consistent across multi-agent Claude Code work: the most valuable outputs aren't always the primary deliverable. The IR inconsistency, the email audit findings, the grant candidates — those came from agents checking assumptions against ground truth, not from instruction-following generation. The sessions where agents are given latitude to verify before they write consistently produce higher-quality corrections than sessions scoped purely to generation.

Session 8's 211 tool calls for a payment integration that got rejected twice is its own lesson. The code is correct. The product categorization problem was an organizational constraint that no amount of implementation work could have preempted. Sometimes the right next step is just submitting the clarification and waiting.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
