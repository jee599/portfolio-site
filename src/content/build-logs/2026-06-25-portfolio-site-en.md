---
title: "One Cold Email Request Became 185 Institutions: A Claude Code Marketing Campaign in 2 Days"
project: "portfolio-site"
date: 2026-06-25
lang: en
pair: "2026-06-25-portfolio-site-ko"
tags: [claude-code, preterview, marketing, cold-email, multi-agent, workflow, automation]
description: "Cold email draft → 185 IT institutions, ad strategy, GA4/Naver pixel, GEO/AEO, 6 logo variants, homepage redesign. 10 sessions, 750+ tool calls, 2 days."
---

303 tool calls. 109 Bash commands. 70 file edits. 20 Gmail draft MCP calls — in a single session. That's what "write me a sales email" looks like when Claude Code is the one holding the keyboard.

Over 10 sessions and two days, Claude Code built the entire Preterview marketing campaign from zero: personalized cold emails for 185 IT institutions, a full advertising strategy validated by adversarial verification agents, GA4 and Naver pixel setup, GEO/AEO optimization, 6 logo variants, and a jidonglab.com homepage redesign.

**TL;DR**: A single request for "a sales email or landing page" expanded into a 185-institution personalized outreach system, a 24-agent ad strategy report (13 of 17 metrics corrected by a dedicated skeptic agent), pixel tracking setup, GEO/AEO implementation, and a full brand refresh — 10 sessions, ~750 tool calls, two days.

## How "Send One Email" Became 198 Institutions

The starting prompt was simple: *"Make a one-page sales site or email template for Preterview."*

The sales landing page came first. Preterview's violet accent (`#6E56F7`) and near-black hero tokens were pulled directly from `globals.css` to keep brand consistency without guessing.

Then came the email template — and the first real blocker. The goal was to embed a 30-second demo video inline. We tried `<video>` tags, GIF embeds, HTML overlays. Email client security policies blocked every approach. One feedback message — *"if you can't make it work, just cut it"* — and we moved on: static screenshot with a linked URL. Simple, and it works everywhere.

The scope shift happened with one sentence: *"I want to send this to university career centers."*

Dynamic Workflow ran twice:
- **Round 1**: 95 institutions, 92 verified public email addresses
- **Round 2**: 198 total (72 domestic, 113 international)

One constraint was locked into every prompt: **no guessed emails**. Every address had to be verifiable from a public official page. Fabricated addresses were explicitly blocked from being generated.

Personalization hit a practical wall fast. First-pass drafts included offers like "workshop partnerships" — things Preterview couldn't deliver. One feedback pass removed all of it. The copy that survived every round: *"promotional pricing at approximately $2 per interview in API costs."* Specific, honest, and direct — because "we can't just give it away for free" is the actual constraint.

Final deliverables from this session:
- `~/preterview/marketing/send_outreach.py` — CSV-based throttled sending script
- `preterview-sales.html` — sales landing page
- `preterview-email-univ.html` — university outreach email template
- `cold-emails.md` — institution-specific personalized drafts

## Why the Adversarial Verification Agent Corrected 13 of 17 Metrics

The next request: *"Is Instagram worth it? What's the most effective way to allocate a ₩500K budget?"*

Four Dynamic Workflows ran sequentially:
1. Platform-by-platform CPC, reach, and CTR data collection
2. Three execution-ready creative assets
3. Per-channel budget allocation with funnel modeling
4. Naver PowerLink live keyword CPC queries

**Total: 24 agents, ~880k tokens, 245 web tool calls.**

The most important output wasn't the strategy — it was the verification pass. A dedicated adversarial verification agent ran against all research findings and **corrected 13 out of 17 key metrics**. The original research agents had either pulled stale data or made errors. Without a separate skeptic role, the entire ad strategy would've been built on wrong numbers.

This is the clearest argument in practice for splitting verification into its own agent. It's not a nice-to-have.

The conclusion: **Naver PowerLink**. Long-tail keywords like `면접말버릇` (interview speech habits) and `면접습관교정` (interview habit correction) had low CPCs and high purchase intent. Copy was generated to fit Naver's format constraints — 15-character headlines, 45-character descriptions — grouped by keyword cluster. Google RSA copy in Korean and English came out of the same session.

Pixel setup ran alongside the strategy work:
- `.env.local`: `NEXT_PUBLIC_GA_ID=G-ES6SENFGM2` added
- `layout.tsx`: GA4 injected via Next.js `Script` component
- Naver conversion tracking: bizChannel review passed, self-install requested, awaiting setup email

GEO/AEO implementation landed in the same session:
- `~/preterview/public/llms.txt`
- `app/robots.ts`
- `app/sitemap.ts`
- `components/marketing/structured-data.tsx`

The goal: get ChatGPT, Perplexity, and Gemini to cite `preterview.com` when users search "mock interview."

## 6 Logo Variants from GPT Image 2, One Winner

*"Should I use JL? Generate some options and let me pick."*

The workflow: write a generation script, define 6 direction briefs, test direction 1 to validate the script, then generate the remaining 5 in parallel.

The winner: an indigo JL monogram. It went into `~/jidonglab-site/app/icon.svg`, wrapped in a `BrandMark.tsx` component, and applied across the Nav and site-wide. The brand decision was written to `reference_jidonglab_brand.md` in project memory so future sessions don't re-derive it.

The jidonglab.com homepage redesign ran in the same session. Structure:
- **Preterview** as the flagship project (front)
- Dental ad agency dashboard mockup with names and numbers scrubbed (middle)
- spoonai.me and other projects (back)

New components: `DentalShowcase.tsx`, `Flagship.tsx`.

## The Other Sessions: What Role Separation Looks Like in Practice

**Dental clinic measurement** (2 tool calls from the main session): The full pipeline — public data fetch, logging, digest generation, deploy — was handled entirely by the dedicated `dental-clinic` subagent. Main session: 2 tool calls. The "동백 임플란트" blog post had fallen outside the top 12 from competitor spam. It recovered to #3 during this cycle.

**Grant research** (67 tool calls): Three tracks — dental ad agency, AI mock interview, sole proprietor. Re-verified 42 programs from June 22 against June 24 deadlines. Preterview IR materials also came out of this session.

**Award email triage** (5 tool calls): An invitation arrived for the "2026 Korea Good Company Award — AI Mock Interview Service Category." Four web searches confirmed the pattern: paid award scheme, the award is bait, the real invoice is "coverage support membership" plus advertising fees. Declined.

**Udental Naver blog publishing** (53 tool calls): Finalized 2-post draft package with publishing approval. Output format: folder + txt files ready for direct paste into Naver's editor, with the 30-tag maximum accounted for.

## Session Breakdown

| Session | Tool Calls | Key Output |
|---|---|---|
| Preterview marketing | 303 | Landing page, 2 email variants, 185-institution list, send script |
| Ad strategy + pixels | 162 | Strategy report, GA4, Naver pixel, GEO/AEO |
| Logo + homepage | 143 | 6 logo variants, jidonglab.com redesign |
| Grant research | 67 | 42 re-verified entries, HTML report, IR materials |
| Udental blog | 53 | 2-post publishing package |

Most-used tools: `Bash` and `Edit`. Web research was distributed into parallel agents inside Workflows to keep the main context lean. Dental work ran entirely in a dedicated subagent — 2 tool calls from the main session. When role separation is working, the main session stays thinner than you'd expect.

## What This Actually Demonstrates

A few things became clear running this end-to-end:

**The scope boundary is set by the first feedback, not the first prompt.** "Send to university career centers" changed everything. The constraint — no guessed emails — shaped the output quality directly. Tight constraints produce better outputs than open-ended prompts.

**Adversarial verification isn't overhead.** 13 of 17 corrected metrics isn't an edge case — it's how research agents behave when given no independent check. A dedicated skeptic running against findings is the fix, not a luxury.

**Delegation keeps the main session coherent.** The dental work that would've consumed 50+ main-session tool calls ran in a specialized agent, invisible to the main context. This isn't just efficiency — it's what lets the main session stay focused on work that actually needs full context.

**Email client security is a hard wall.** Video embedding in email is still broken. The right answer is a static screenshot with a tracking link, not another approach to try.

The full campaign ran in two days. The bottleneck wasn't generation speed or tooling — it was feedback latency between sessions.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
