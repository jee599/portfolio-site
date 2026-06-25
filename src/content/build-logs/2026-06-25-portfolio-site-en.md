---
title: "676 Claude Code Tool Calls in 72 Hours: Parallel Payment, Outreach, and Ad Infrastructure for Preterview"
project: "portfolio-site"
date: 2026-06-25
lang: en
pair: "2026-06-25-portfolio-site-ko"
tags: [claude-code, preterview, paddle, marketing, google-ads, workflow]
description: "72 hours, 3 Claude Code sessions, 676 tool calls — cold emails to 192 institutions, Paddle KYC rejected twice, GA4 + Naver pixel live."
---

Three Claude Code sessions ran in parallel over 72 hours, each attacking a different front: Session 3 built cold email infrastructure for 192 educational institutions (303 tool calls), Session 4 integrated Paddle payments (211 tool calls), Session 6 wired the ad infrastructure (162 tool calls). Total: 676 tool calls across the Preterview launch prep track alone.

**TL;DR** — 192 cold email drafts done, Paddle rejected twice and under appeal, GA4 + Naver conversion pixel live. Everything except payments is ready.

## How 192 Cold Emails Came Out of a Single Prompt

Session 3 started with one sentence: "Make a sales page or email form."

The scope escalated fast.

> "Crawl every university admissions office and cram school, domestic and international. We're emailing all of them."

Dynamic Workflow ran twice. Round one: 95 institutions, 92 with verified public emails. Round two expanded to 198 (72 domestic, 113 international). One rule baked into every prompt: **no guessed emails**. If an address wasn't publicly listed on an official page, it didn't make the list.

Personalization was the actual work. Generic pitches don't land. One feedback pass stripped out anything that promised "workshop partnerships" or future commitments that weren't on the table. The concrete number that survived every round: "API cost of roughly $2 per interview session during the promotional period." The reasoning behind it — "we can't just give it away for free" — made it into the final copy verbatim.

Final artifacts under `~/preterview/marketing/`: `preterview-sales.html`, `preterview-email-univ.html`, `cold-emails.md`, `send_outreach.py` (CSV-throttled dispatch script). Session 3 breakdown: 70 Edit calls, 109 Bash calls, 20 Gmail draft MCP calls.

One dead end worth logging: the team tried embedding a 30-second demo video in the emails. `<video>` tags, GIF embeds, HTML overlays — all blocked by email client security policies. "If you can't fix it, just cut it." Replaced with a static screenshot linked to the demo. Email client security is a hard wall, not a configuration problem.

## Paddle Rejected Preterview Twice

Session 4 opened with a branch review: `feat/paddle-checkout`, 23 unmerged commits. Paddle as MoR for international payments was the architecture.

First obstacle: the existing Paddle account had been submitted under a previous project ("fortunelab") and rejected. KYC expired, re-submit blocked. New account from scratch:

```
PADDLE_VENDOR_ID=...
PADDLE_API_KEY=pdl_live_apikey_...
PADDLE_WEBHOOK_SECRET=ntfset_...
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_...
```

`preterview.com` submitted for domain review. Rejected. The reason:

> "we identified the following product categories on this domain: Other/Resume/CV Builders, Human Services/Consulting or Advisory Services"

Paddle's automated review classified an AI mock interview platform as a resume builder or human consulting service — both outside Paddle's Acceptable Use Policy. The appeal went through Typeform with one core argument: "Fully AI-generated feedback. Zero human interviewers, coaches, or consultants."

By end of session, alternatives were being scoped: LemonSqueezy, TechOne, Korean PG providers. One additional finding: credit-pack billing (sell credits rather than subscriptions) isn't supported by some processors, which constrains the fallback options.

Side output from this session: three legal pages (`app/[locale]/terms`, `privacy`, `refund`), admin payment refund dashboard, `lib/payments/packs.ts` for pricing pack definitions. Session 4 stats: 104 Bash calls, 27 Chrome MCP calls for Paddle dashboard automation, 24 Edit calls.

## The Ad Strategy on ₩500k

Session 6 opened with a direct question: "Is Instagram worth it? What does ₩500,000 go furthest on for this product?"

Four Dynamic Workflows ran in sequence:
1. CPC/reach/CTR benchmarks across platforms
2. Three execution-ready assets (Naver Power Links copy, Reddit creatives, pixel + landing checklist)
3. Budget allocation with expected funnel output per channel
4. Live keyword CPC queries for Naver Power Links

Result: Naver Power Links. Keywords like "면접말버릇" (interview speech habits) and "면접습관교정" (interview habit correction) have low CPCs with clear purchase intent — tier S. Generic keywords like "AI 면접 연습" drew too much competition for the budget to be efficient. Google Search ran in parallel, producing Korean and English RSA copy.

Pixel installation on both platforms simultaneously:

- **GA4**: `NEXT_PUBLIC_GA_ID=G-ES6SENFGM2` added to `.env.local`, injected via Next.js `Script` component in `layout.tsx`
- **Naver conversion tracking**: Biz channel application approved, self-install conversion tracking filed, waiting on setup email

GEO/AEO got covered in the same session — a strategy report on getting Preterview cited in ChatGPT, Perplexity, Gemini, and Google AI Overviews for "mock interview" queries. Landing page CRO audit ran concurrently, confirming that `DEFAULT_SIGNUP_BONUS = 200` (200 free credits on signup) was the right hook.

## The Other Sessions

**Dongbaek UDental regular measurement** (Session 1, 2 tool calls): One `dental-clinic` subagent call automated the full pipeline — public data fetch, inbox read, logging, dashboard, digest. The "동백 임플란트" blog ranking had fallen outside the top 12 from competitor spam, then recovered to #3. Two tool calls from the main session.

**Grant research** (Session 2, 67 tool calls): Re-verified government and private grants across three tracks — dental marketing, AI mock interview, sole proprietor. Built on 42 verified programs from June 22, re-measured against June 24 deadlines. Immediate action items: Pangyo Hub Value-Up (6/24), K-Global Mentoring (6/30), NPU (6/29). Preterview IR deck also came out of this session.

**Award email filter** (Session 5, 5 tool calls): An invitation arrived for "2026 Korea Good Company Award — AI Mock Interview Service Category." Four web searches confirmed the pattern: paid award scheme, the award is the hook, the real invoice items are "coverage membership" and advertising. Declined.

## Session Breakdown

| Session | Work | Tool Calls |
|---------|------|-----------|
| 1 | Dental clinic SEO monitoring | 2 |
| 2 | Grant research + Preterview IR deck | 67 |
| 3 | Cold email outreach (192 institutions) | 303 |
| 4 | Paddle payment integration | 211 |
| 5 | Award email filter | 5 |
| 6 | Ad infrastructure + GA4 + Naver pixel | 162 |

**Total: 750+ tool calls across 6 sessions.**

## The Lesson Paddle Taught

AI services hit a specific classification problem with payment processors. The automated domain review sees interview questions, feedback text, user profiles — and maps them to the nearest known category: resume builder, coaching platform, consulting service.

None of those are accurate for a fully automated AI product. The classifier doesn't ask.

The fix is front-loading the distinction at initial submission, not in an appeal after rejection:

> "All feedback is generated entirely by AI models. No human interviewers, coaches, or consultants are involved at any point."

If that sentence isn't in the initial product description, the processor fills in the blank with the closest human-services category it recognizes — and that gets the application rejected. Appeals are slower and less reliable than getting the submission right the first time.

Payment processing is the one unresolved piece. Everything else — outreach, ad copy, conversion pixels, legal pages — is ready.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
