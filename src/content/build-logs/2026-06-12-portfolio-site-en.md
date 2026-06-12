---
title: "Claude Fable 5: 11 Sessions, 1,394 Tool Calls, 5 Projects — What a Full Day Actually Looks Like"
project: "portfolio-site"
date: 2026-06-12
lang: en
pair: "2026-06-12-portfolio-site-ko"
tags: [claude-code, claude-fable-5, workflow, open-design, multi-project]
description: "11 Claude Code sessions, 1,394 tool calls across 5 parallel projects: dental deck, silent email funnel, photographer gallery, fortune-telling redesign, and a full-stack admin — all in one day."
---

Eleven Claude Code sessions. 1,394 tool calls. Five projects with nothing in common except they all moved forward on the same calendar day. Dental pitch deck in the morning, CoffeeChat admin dashboard at midnight.

Three sessions hit the daily session limit. The longest ran 14 hours 23 minutes. Everything ran on `claude-fable-5`.

**TL;DR**: The session limit is the real bottleneck — not the model. Before hitting the limit, context holds long enough to carry complex tasks without breaks. `Workflow` fan-out is in a different league for research: 57 accelerator programs searched and filtered in 30 minutes, 11 parallel audit agents surfacing a funnel failure that had been invisible since April 13.

## Cutting a 20-Slide Dental Deck Down to 13

Session 1: 2h 58min, 175 tool calls. The request was simple enough — "a PPT and a speaker script for a clinic director meeting, two separate files."

The `open-design` skill pulled clinic context from `~/dental-promo/dongbaek-uddental/` and generated a 20-slide deck. Tool split: Edit 68×, Bash 61×, Read 15×.

Feedback came immediately: "Too dense, hard to follow just from slides, too much jargon." Every acronym got eliminated or expanded — `CPC`, `AEO`, gone. Numbers got plain-language translations: "37,000 won per click" instead of cost-per-click metrics. Section-divider slides with black backgrounds were cut. 20 slides became 13.

The speaker script started as `.md`, then got converted to `.html` — not for aesthetics, but for a specific recovery mechanism. When a presenter loses their place mid-talk, they need to recover fast. The HTML version embeds slide-number chips; clicking chip #7 jumps directly to slide 7 in the script. Two-second recovery.

Final output:

```
~/dental-promo/dongbaek-uddental/2026-06-11/
├── 03-원장님-프레젠테이션.html   # 13-slide deck, arrow-key navigation
└── 04-발표-스크립트.html         # per-slide script + 8 anticipated Q&As
```

## An Email Funnel Silently Dead Since April 13

Session 4: 39 minutes, 30 tool calls — but that 39 minutes ran 11 parallel agents inside a `Workflow` fan-out: three audit tracks (pipeline, email, site) plus four deep-research threads with adversarial verification passes.

The most severe finding: `send-email.js` was missing `SUPABASE_SERVICE_ROLE_KEY`. The script had no way to read the Supabase database. Result: every subscriber who signed up through the website after April 13 received zero emails. And the unsubscribe links referenced in those (never-sent) emails returned 404.

Both ends of the funnel were broken simultaneously. Intake worked. Delivery was completely dead. No error surfaced anywhere in the UI. No alert fired. The kind of failure that stays invisible until you deliberately look for it.

The fix is blunt: inject `SUPABASE_SERVICE_ROLE_KEY` into the deployment environment and patch the unsubscribe route. Everything else — positioning, content strategy — comes after the funnel is actually alive.

The research agents added one more data point: "Korean AI news tracked daily in English" occupies a much narrower, less saturated niche than generalist AI newsletters. The lane exists. The funnel has to work first.

## 293 Real Photos, a Dynamic Grid, and an Admin Panel

Session 7: 10h 13min, 216 tool calls. Starting inventory: 293 actual photos in Blob Storage across categories. The photographer site needed a full redesign.

Four design directions were presented; "White curation" won — minimal, editorial, photo-first. Home page: full-width hero slideshow with 12 hero shots on crossfade, booking CTA below. Gallery: rebuilt as a dynamic responsive grid.

Partway through: "the home screen looks off, just take people straight to the gallery." 170 lines of intro code deleted. No home page. Gallery as the direct entry point.

An admin panel was built alongside — explicitly requested with no password protection. It covers photo upload and delete via Vercel Blob, category management, and seasonal booking management, backed by four Vercel Function API routes:

```
/api/photos
/api/bookings
/api/settings
/api/upload
```

Deployed to `daymoon-pic-motion.vercel.app`.

The 10-hour session clock wasn't driven by writing code. The code wrapped well before the session hit double digits. The time was deploy verification cycles and browser testing loops.

One recurring friction: a second concurrent session was overwriting the design-gate acknowledgment file. Resolved by embedding the session ID in the ack file name — each session's acknowledgment is unique and doesn't collide.

Tool breakdown: Bash 70×, Write 27×, Edit 22×.

## A Fortune-Telling Site, a Payment Rail Reality Check, and What Etsy Data Says About "AI Reading"

Session 9: 11h 33min, 337 tool calls. The most strategically interesting session of the day.

The first question arrived before any code: "If we call it an AI report, won't payment processors reject it?"

The June 11 deep research had already produced the answer. A natural experiment from Etsy: storefronts branded openly as "AI Reading" had 0 sales over one month. Human-persona storefronts — with a named fortune teller — had 464 sales and 130 reviews over one year. The natural read is "don't call it AI." But the actual reason payment processors decline is the *service category* (divination/fortune telling), not the copy on the landing page. Rewording "AI report" to something softer doesn't change the category classification. The risk stays identical regardless of copy.

The real problem to solve: find payment rails that don't restrict divination. Not optimize copy that won't affect the outcome.

Design direction settled on "Midnight Almanac" — deep ink indigo, gold hairline accents, Fraunces serif. The three.js cosmic background from the previous live site was ported: star color shifted to gold tint, drift speed reduced. The goal was slow-moving night sky, not an active animation.

Image generation: `genimg.py` and `genimg-ink.py` scripts built to interface with `gpt-image-2`. Four images queued as a background task, then two more after a brief rate-limit wait.

A geometric SVG chart got flagged mid-session: "too juvenile." Removed. Replaced with scroll-synchronized parallax and micro-interactions.

Seven-locale translation was dispatched to a subagent. That subagent hit the session limit and returned nothing. Translation was completed inline.

Tool breakdown: Bash 127×, Edit 85×, Read 51×.

## 14 Hours, 476 Tool Calls: Full-Stack Admin from Zero

Session 10: 14h 23min, 476 tool calls. The largest session of the day.

The requirement was wide: user auth, token usage tracking, payments, TTS-driven voice interviews, multi-language support — all shippable together, all testable within the same session.

Stack decisions:
- **Database**: Turso (SQLite at the edge, no infrastructure to manage)
- **Payments**: PayPal (global coverage, no divination-category restrictions — directly relevant given session 9's payment rail findings)
- **TTS**: OpenAI `tts-1`

TTS cost came up mid-session: "Is it expensive?" — `tts-1` at $0.015/1K characters puts one voice interview at roughly $0.05–$0.10. Calculation done, decision: proceed.

The Vercel deploy failed partway through: `commit author email (jidong@jidongui-iMac.local) is not valid`. Git config had a local machine hostname hardcoded from the development machine setup. Fixed `user.email` to `jd@jidonglab.com`, re-pushed, passed.

Admin feature set: per-user email/password auth, per-request token usage table, payment history, credit adjustments, user management. `next-intl` added 7 locales. Portfolio enhancement, resume import, and dashboard redesign were dispatched as parallel subagents — three independent UI surfaces building simultaneously.

## Session Breakdown

| Session | Duration | Tool calls | Top tools |
|---|---|---|---|
| Dental deck | 2h 58min | 175 | Edit 68, Bash 61, Read 15 |
| spoonai audit | 39min | 30 | Workflow fan-out, Bash 17 |
| daymoon | 10h 13min | 216 | Bash 70, Write 27, Edit 22 |
| Saju renewal | 11h 33min | 337 | Bash 127, Edit 85, Read 51 |
| CoffeeChat | 14h 23min | 476 | mixed |

Session limit hit three times: saju, JDLab DSN, CoffeeChat. Each time the limit was hit, the core code already existed in the filesystem. Re-entering context cost a few minutes of speed, not work.

The `Workflow` fan-out sessions stand out on efficiency. The spoonai audit: 11 agents, critical infrastructure failure found in 39 minutes. A Primer accelerator research session ran 5 parallel agents, 209 search-and-verify calls, 57 programs catalogued and filtered to 7 actionable options — in roughly 30 minutes. Running those 57 programs sequentially, one lookup at a time, would have consumed most of the day's session. Fan-out compresses research tasks to the latency of the single slowest lookup.

## What's Next

Two unblocked items: inject `SUPABASE_SERVICE_ROLE_KEY` into spoonai's deployment environment, fix the unsubscribe route. Both are concrete, both are fast. Everything else — CoffeeChat Vercel deployment status check, dental director meeting feedback — comes after those two are done.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
