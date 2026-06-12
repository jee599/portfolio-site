---
title: "1,394 Tool Calls, 5 Projects, One Day: Claude Code at Full Throttle"
project: "portfolio-site"
date: 2026-06-12
lang: en
pair: "2026-06-12-portfolio-site-ko"
tags: [claude-code, claude-fable-5, workflow, open-design, gpt-image-2, multi-project]
description: "10 sessions, 1,394 tool calls across 5 live projects: dental pitch deck, broken email funnel, photographer site deploy, and a fortune telling redesign."
---

Ten sessions. 1,394 tool calls. Five completely different codebases. The longest session ran 14 hours and 23 minutes; the shortest wrapped in under a minute with a single cron status text fix. This is a raw account of what a full day of Claude Code-driven development looks like on June 12, 2026 — not a demo, not a highlight reel, but everything that shipped, broke, and got fixed.

**TL;DR**: Running claude-fable-5 across 10 sessions, the session limit hit three times. Still, every project reached deployment or a concrete deliverable. A 1-minute fix and a 14-hour full rebuild happened on the same calendar day.

## Cutting a 20-Slide Dental Deck Down to 13

Session 1 (2h 58min, 175 tool calls) was clinic director meeting prep. The data sitting in `~/dental-promo/dongbaek-uddental/` got pulled into two deliverables: an HTML slide deck with keyboard/click navigation, and a per-slide speaker script.

First draft: 20 slides. Feedback came back immediately — "too dense, too much jargon, translate the numbers into plain language." Every acronym went: `CPC`, `AEO`, gone. "Cost per click" became "37,000 won per click." The section-divider slides with black backgrounds were cut. 20 → 13.

The speaker script started as markdown, then a conversion request came in. The final version was HTML with chip-based slide navigation — click a slide number chip, jump directly to that position in the script. The use case: a presenter who loses their place mid-talk can recover in two seconds. Tags like "30 seconds max" and "★ Today's objective" were added for quick scanning.

Last task of the session: email both files. AppleScript → Mail.app → naver.com addresses, sent.

Tool breakdown: Edit 68×, Bash 61×, Read 15×.

## The Email Funnel That Had Been Silently Dead Since April 13

Session 4 (39min, 30 tool calls) ran a full pipeline audit on spoonai.me as a Workflow with 11 parallel agents: three audit tracks (pipeline, email, site) plus four deep research threads with adversarial verification.

The most serious finding: subscriber emails captured on the site land in Supabase, but `send-email.js` was missing `SUPABASE_SERVICE_ROLE_KEY`. The script couldn't read the DB at all. Every subscriber since April 13 received zero emails. Worse, the unsubscribe links in those (never-sent) emails returned 404. The funnel was broken at both ends simultaneously — intake was working, delivery was completely dead.

What makes this failure mode particularly insidious is how invisible it is. No errors surfaced anywhere in the UI. Subscribers signed up, got a confirmation, and then heard nothing. The multi-agent audit found it; manual monitoring would have caught it much later.

The research component surfaced an interesting positioning gap: generalist AI daily newsletters are saturated, but "Korean AI news, tracked daily in English" is still an open slot. With the pipeline itself confirmed healthy, funnel recovery is the next concrete step before validating that positioning.

## 57 Accelerator Programs Researched in One Fan-Out Pass

Session 6 (9h 57min, 62 tool calls) covered Primer accelerator application prep — deadline 2026-06-28, standard terms: 100M KRW investment at a 1B KRW post-money valuation, roughly 10% equity.

After drafting three variants of a 200-character self-pitch (a required field in the application), the scope expanded: find comparable alternatives to Primer. A Workflow fanned out across five research categories in parallel: government programs, private accelerators, corporate/financial open innovation, AI-specific/global programs, and rolling-admission options. Five agents, 209 search-and-verify calls, 57 programs total.

Filtered to: solo founder + AI automation B2B + existing traction. That left 7 immediately actionable options. Sorted by deadline: DIPS Link-up AX Round 2 (Jun 22), DHP Partnership (rolling), Primer 29th cohort (Jun 28). A 1-minute pitch video script also came out of the same session.

Searching five program categories sequentially would have consumed most of the session. Running them as parallel agents compressed it to one shot.

## 293 Photos, an Admin Panel, and a Live Vercel Deploy

Session 7 (10h 13min, 216 tool calls) was a full redesign of the daymoon photographer site. Started with a simple inventory: 293 photos across categories.

Four design directions were presented. "White curation" was selected — minimal, editorial. The structure landed as: home → full-width hero slideshow (12 hero shots, crossfade) → booking CTA, with the gallery rebuilt as a dynamic grid.

Midway through the session: "the home screen looks off — just go straight to the gallery." Deleted 170 lines of intro page code, made the gallery the entry point. No homepage.

An admin panel was built alongside (password-free, as explicitly requested) using Vercel Blob Storage API: photo upload/delete, category management, seasonal booking management. Deployed to `daymoon-pic-motion.vercel.app`.

Two ack file conflicts occurred during the session — a separate concurrent session was overwriting the design-gate ack file. Worked around it by embedding the session ID directly in the OK file, making each session's ack unique.

Tool breakdown: Bash 70×, Write 27×, TaskUpdate 26×, Edit 22×, Read 19×.

## Fortune Telling Gets Real Images — gpt-image-2 and a Payment Rail Reality Check

Session 9 (11h 33min, 337 tool calls) was the second-longest of the day. The project: repositioning a saju (Korean fortune telling) site toward traditional aesthetics.

First, a business question came up: "Won't payment processors reject it if we label it as an AI report?" The data said the opposite of what you'd expect. A natural experiment from June 11 Etsy data: storefronts openly branded "AI Reading" had 0 sales; human-persona storefronts had 464. Payment processors screen by service category (divination/fortune telling), not landing page copy. The strategic conclusion: rewording the pitch doesn't solve the problem. Finding payment rails that don't restrict divination does.

Design direction: deep ink indigo + gold hairline + Fraunces serif. The three.js cosmic background was ported from the previous site, with star color shifted to gold tint and drift speed reduced — the goal was a "slow-moving night sky" feel rather than an active animation.

Image generation request came in: "use gpt-image-2 for the assets we need." Built `genimg.py` and `genimg-ink.py` scripts, queued four image generations via BackgroundTask. Hit the generation rate limit briefly, resumed as soon as it cleared.

A geometric SVG chart got flagged as "too juvenile." Removed it, replaced with scroll-synchronized parallax and micro-interactions. Seven-locale translation was delegated to a subagent, failed when the session limit hit, then continued inline.

## 14 Hours, 476 Tool Calls: Admin Dashboard + Payments + TTS from Zero

Session 10 was the day's longest. The full scope: admin dashboard, user auth, token usage tracking, payments, and TTS — all in one session, because the project needed all of it to be testable together.

Stack decisions: Turso (SQLite edge deployment) for the DB, PayPal for payments (global service, no divination category restrictions on the payment rail — directly relevant given the saju context). API keys came in as pastes during the session — Claude API key (`sk-ant-api03-...`) and OpenAI key (`sk-proj-...`) written to `.env`, TTS wired up.

Vercel deploy failed with "commit author email is not valid" — git config had `jidong@jidongui-iMac.local` hardcoded from a local machine setup. Fixed the git config, re-pushed, passed.

Admin feature set: per-user email/password login, per-request token usage table, payment history, credit adjustments, user management. `next-intl` added 7 locales. Portfolio enhancement, resume import, and dashboard redesign were each dispatched to separate subagents and run in parallel — three independent UI chunks building simultaneously.

## Day in Numbers

| Metric | Value |
|---|---|
| Total sessions | 10 |
| Total tool calls | 1,394 |
| Longest session | 14h 23min (coffee chat admin) |
| 2nd longest | 11h 33min (saju redesign) |
| 3rd longest | 10h 13min (daymoon) |
| Accelerator programs researched | 57 (5 agents, 209 searches) |
| spoonai audit agents | 11 |
| Vercel deploys | 2 (daymoon, coffee chat) |
| Files created | 40+ |
| Session limit hits | 3 |

The session limit hit three times across the day. Each time: reset, re-enter, re-establish context, continue. Files survive the reset. Re-establishing context costs some speed, but the work doesn't disappear — it's all in the filesystem.

The 1-minute fix and the 14-hour rebuild are the same tool, the same workflow, the same reset behavior. Scale is the variable; the process is identical.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
