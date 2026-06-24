---
title: "8 Sessions, 933 Tool Calls: Paddle Payments, Multi-Agent Research, and 185 Cold Emails with Claude Code"
project: "portfolio-site"
date: 2026-06-25
lang: en
pair: "2026-06-25-portfolio-site-ko"
tags: [claude-code, paddle, preterview, cold-email, multi-agent, automation]
description: "Three days, 8 Claude Code sessions, 933 tool calls: Paddle payment integration, multi-agent competitor analysis, and 185 personalized cold emails."
---

271 tool calls in a single session. Bash 68, Chrome 67, Edit 36, Read 25, Navigate 17. That's what integrating a real payment processor looks like when you let an AI agent drive.

**TL;DR** Three days, 8 sessions, 933 tool calls: Paddle billing integration, a multi-agent competitive teardown, and a two-pass cold-email campaign targeting 185 CS education institutions worldwide — all driven by Claude Code with `claude-opus-4-8`.

## The Payment Integration That Took 271 Tool Calls

Session 2 was the heaviest: 23 hours 40 minutes, 271 tool calls. The starting prompt was one sentence: "Add Paddle payments to Preterview."

The first thing Claude did wasn't write code — it read the project. The `feat/geo-payment-routing` branch was already merged, routing Korean users to PayApp and international users to PayPal. Paddle was a natural drop-in replacement for the PayPal slot.

Before touching any files, Claude fanned out 4 WebFetch agents to read live Paddle documentation. The reasoning: Paddle Billing's API changes often, and getting webhook signature verification wrong is fatal. That's the right call — you don't want to discover breaking changes in production.

Files created:
- `lib/payments/paddle.ts`
- `app/api/pay/paddle/{create,webhook,confirm}/route.ts`
- `components/pricing/PaddleBuy.tsx`
- `docs/paddle-setup.md`

The Chrome tool showing up 67 times — nearly as often as Bash at 68 — is telling. That's the agent opening a real browser, loading the checkout flow, and visually confirming what rendered. When the user sent a screenshot saying "this is showing PayPal, not Paddle" — Claude could see the same UI and debug it in context. Real-browser verification, not unit tests pretending to be the checkout page.

## A Multi-Agent Competitive Teardown

Session 4 started with: "Codeit seems to have something similar to my Preterview — compare them, current state."

Instead of a single web search, Claude launched a dynamic workflow with 4 parallel branches:
- Deep product analysis of Codeit Ascent
- Company and strategy context for Codeit
- Domestic AI mock-interview competitive landscape
- Cross-verification of key claims

The findings didn't match the initial assumption. Ascent and Preterview aren't direct competitors — they're adjacent markets.

Ascent targets Korean job seekers across all industries: 113 company-specific interview sets covering marketing, planning, PM roles. Preterview is globally focused on developers — GitHub/portfolio analysis, English language support. The structural overlap is "voice-based conversational mock interview with a multi-dimensional report." The user base barely overlaps.

One specific claim — that Ascent had GitHub/portfolio URL analysis — was tested against live evidence and marked `refuted`. That's the value of the adversarial verification pass: plausible-but-wrong claims get killed before they influence strategy.

Same session, behavior logging was added. The trigger: "A user said it's broken, but I'm not seeing any auth redirect alerts." Three files, one session:
- `components/action-logger.tsx`
- `app/api/client-log/route.ts`
- `app/admin/logs/page.tsx`

## Cold Emails to 185 Institutions, Automated

Session 8 clocked 290 tool calls. It started with a single email draft request.

The ask: "Make an email template for selling Preterview. Target influencers and university career centers."

Here's how the session actually unfolded:

1. Draft the HTML email
2. Send a live test to a real address
3. Discover video previews don't render in email clients
4. Try GIF fallback
5. Settle on screenshot attachment

That last step — hitting the actual email client constraint — is what field testing is for. "Video doesn't play in email" is common knowledge, but you only internalize it when you send the email and see the broken embed yourself.

Then the scope expanded: "Curate 30–50 domestic institutions and 50+ international ones. Personalized copy for each. Verified emails only."

Two dynamic workflow passes ran back to back.

**Pass 1**: 95 institutions discovered. User feedback: "Drop anything requiring partnership workshops or commitments I can't realistically make."

**Pass 2**: 198 institutions discovered, 185 with source-confirmed emails. The list ran from Samsung SSAFY and Woowa Brothers Tech Course to MIT CSAIL and Stanford HAI. Any email without a cited source was explicitly excluded — no guessed addresses, no pattern-based inference like `careers@university.edu`.

Each entry received personalized copy matched to the contact's role: career center coordinator, program director, and department head all got different framing. The automation didn't just find contacts — it wrote 185 distinct opening lines.

Final architecture decision: cron job sending 30 emails per day to protect domain reputation while maintaining steady outreach.

## Memory as SSOT Across Sessions

Sessions 5 and 7 both searched government and private funding programs — same topic, two days apart. That's not redundancy. Session 5 (June 22) ran 42 live verifications of open programs. Session 7 (June 24) ran delta verification only: "show me only what's still open as of today."

What made this efficient: Claude read `~/funding/` and `project_primer_application.md` at the start of Session 7, recovered full context from the prior run, and only re-checked programs whose status might have shifted. No re-research from scratch. No duplicated work.

The memory file acted as SSOT across two completely separate sessions. This is the pattern that scales: persistent local files as cross-session memory, delta checks instead of full re-runs. When prior research exists, re-verify only the delta.

## Numbers

| Session | Primary Work | Tool Calls |
|---|---|---|
| Session 8 | Cold email automation | 290 |
| Session 2 | Paddle payment integration | 271 |
| Session 4 | Competitor analysis + behavior logging | 168 |
| Session 3 | Moving checklist app | 79 |
| Session 7 | Funding re-search + IR deck | 67 |
| Session 5 | Funding search | 51 |
| Session 6 | Thread strategy | 5 |
| Session 1 | Dental periodic measurement | 2 |

Three days of real work. Sessions 2 and 8 each individually crossed the 24-hour mark. Total: 933 tool calls, all on `claude-opus-4-8`.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
