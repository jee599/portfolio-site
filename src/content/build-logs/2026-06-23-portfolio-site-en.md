---
title: "Codeit Shipped First — So I Ran 11 Claude Code Sessions and 664 Tool Calls"
project: "portfolio-site"
date: 2026-06-23
lang: en
pair: "2026-06-23-portfolio-site-ko"
tags: [claude-code, preterview, heygen, simli, paddle, visual-interview, competitive-analysis, ultracode]
description: "Codeit launched an AI mock interview product 6 days before this log. Here's what 11 sessions, 664 tool calls, and 51 hours of Claude Code looked like in response."
---

Eleven Claude Code sessions. 664 tool calls. One session that ran for 27 hours and 28 minutes straight. Six days after a competitor shipped, this is what the response looked like — not a pivot meeting, not a roadmap review, just Claude Code running through live avatar interviewers, international payment wiring, a 24-agent ad strategy sweep, and cold email drafts, all in parallel.

## TL;DR

Codeit launched "Ascent," an AI mock interview product, on June 17. The build log from the following six days covers: a photorealistic avatar interview POC using HeyGen + Simli, Paddle international payment integration replacing PayPal, a 24-agent ad research workflow consuming approximately 880k tokens, a sales page, and cold email templates. The biggest bottleneck wasn't code quality or architecture. It was cost — specifically, keeping a 20-minute, 3-interviewer session under $1.

## The Competitor Audit That Started Everything

Session 10 came in with a direct ask: "Codeit just launched something that looks like Preterview — compare them."

Claude's first move was product reconnaissance, not code. It mapped the Preterview stack (resume builder, 5-axis portfolio review, 3-interviewer AI voice mock interview, credit billing, global targeting) and cross-referenced against the Codeit product. Result: Ascent, launched June 17, 2026. Exactly six days earlier.

The response ran as a two-stage workflow. Stage one: establish what Ascent actually does and where it overlaps with Preterview. Stage two: answer "how do we differentiate and sell better" — competitor dissection, internal gap audit, channel and pricing research, a first draft, adversarial self-critique, and a concrete action plan, in that order.

The overlap was real but bounded. Both products do post-interview reports (attitude and delivery scoring plus multi-dimensional competency ratings) and resume/cover-letter to expected-question pipelines. That's adjacent market territory, not a head-on collision — but the timing created urgency.

## 335 Tool Calls — The Visual Interview Session

Session 5 started with one sentence.

> "I want an interview that renders 3 interviewers as 3D faces like a real Zoom call, with synchronized lip movement, requires my screen, and uses my mic."

27 hours and 28 minutes. 335 tool calls. That single session accounts for 51% of all tool calls across the entire 11-session run.

The first thing Claude did was split the scope — cleanly, before touching any code.

**Scope A — Push-to-talk.** You speak, submit, the interviewer responds. It looks like Zoom but it's turn-based.

**Scope B — True real-time.** The system listens continuously and can interrupt. Requires WebRTC + VAD. About 90% of the cost and effort lives here.

Scope A was confirmed, and vendor selection began. A 3D model went in first. Then immediately: "How do we switch to photorealistic avatars?"

Claude ran web searches against HeyGen Streaming API, Simli, LiveAvatar, and D-ID — not to read docs, but to verify actual latency and pricing against real architecture constraints. The Preterview architecture is turn-based, which means avatar video can be pre-generated rather than streamed in real-time. That narrowed the viable combination: HeyGen for avatar streaming, Simli for real-time lip sync.

Files created: 8 new, 6 modified. `HeyGenAvatarTile.tsx`, `SimliAvatarTile.tsx`, `VisualInterviewPoc.tsx`, `heygen.ts`, `simli.ts`, and 3 API routes.

The `mcp__claude-in-chrome__computer` tool was called 48 times. Claude was directly driving the browser, checking UI state visually, and fixing what it saw. The session transcript has raw mid-build messages still in it:

> "It's still showing the 3D model" / "Not working" / "Can't you restart the server yourself?"

`.env.local` was missing, so API key wiring failed. Changes weren't taking effect without a server restart. Three avatars were supposed to render simultaneously but only one did — that turned out to be a Simli concurrent session limit.

## "It Has to Cost Under a Dollar per Interview"

Cost became the actual constraint. The budget line landed mid-session:

> "This is way too expensive. It needs to be under a dollar for a 20-minute interview. That's the ceiling."

LiveAvatar was tried first. Credits were loaded, real API keys were wired up, and actual tests ran. The per-session cost came in over the limit.

Claude spun up a workflow — 24 agents cross-verifying vendor pricing and narrowing down viable paths within the "$1 / 20 minutes / 3 interviewers" budget. The conclusion: leverage the Simli Free tier, and generate each avatar once and reuse it rather than generating fresh video per session.

It's a meaningful constraint to lock in early. The architecture you build around "$1 per session" looks different from the one you'd build if cost wasn't a hard ceiling.

## Paddle Integration: Reading the Existing Code Was Half the Job

Session 8 started with one line: "Let's wire up Paddle payments for Preterview."

93 tool calls, 15 hours 27 minutes.

Claude's first action was a full audit of the existing payment infrastructure before writing a single line. The `feat/geo-payment-routing` branch had already been merged. The structure: Korean users go through PayApp (₩), international users through PayPal ($). Three credit pack tiers (9,900 / 49,000 / 99,000 KRW), idempotent credit grant logic, and webhook-based fulfillment patterns were all already in place.

The conclusion was simple: replace only the international path. PayApp stays untouched.

Before writing implementation code, Claude verified the Paddle documentation across four separate areas — client-side checkout, webhook signature verification, order creation, and credit fulfillment — because getting webhook signature verification wrong is a silent failure mode that only shows up in production disputes.

Files produced: `lib/payments/paddle.ts`, three API routes (`create`, `webhook`, `confirm`), `PaddleBuy.tsx`, and `docs/paddle-setup.md`.

Tool breakdown: Bash (40), Read (18), Edit (10), Write (6). The Read count is notably higher relative to the visual interview session — this session spent proportionally more time understanding existing patterns and following them precisely, rather than generating net-new code.

## 24 Agents, 880k Tokens, One Ad Strategy

Session 9 opened with `/effort ultracode` and ran two workflows.

First workflow: "Is Instagram the right channel? What's the most effective targeting and budget allocation, with actual numbers, for both Korean and global markets?"

Five agents ran in parallel pulling 2024–2025 benchmark data: Naver PowerLink CPC, Meta Korea CPM, Kakao Moment, global Meta and TikTok, and Reddit. The outputs then went through adversarial verification — and all 13 core metrics were revised. Single-agent estimates trend optimistic. Adversarial cross-checking is what makes the numbers usable.

Second workflow: "Do steps 1, 2, 3." — Naver PowerLink setup, three Reddit ad creatives, and a pixel + landing page QA checklist, each generated with platform-specific constraints baked in and verified against actual specs.

Total: 24 agents, approximately 880k tokens. The tool call count shows 18 in the main session — the actual agent invocations inside the workflows multiply that figure considerably.

## Demo Video, Sales Page, Cold Email

Session 4 rewrote `preterview-demo.html` around a game developer portfolio scenario and turned it into a video. Playwright extracted frames using `?capture=1&t=<seconds>` parameters, ffmpeg encoded the output. Two files: `preterview-demo-ko.mp4` and `preterview-demo-en.mp4`, both 1280×720 at 30fps, each 39.5 seconds.

Session 7 went through the `open-design` skill to produce the sales page and cold emails. Brand tokens were pulled directly from Preterview's `globals.css` and bound into the design — violet accent `#6E56F7`, near-black hero background. Two cold email variants: one for influencers, one for university career centers. Both written in inline CSS for email client compatibility.

Session 6 built a public demo page capped at 5–7 turns. IP-based rate limiting was added to put a ceiling on Opus API costs. The cost was actually computed by running a real single-turn test against Opus 4.8 pricing (input $5/1M, output $25/1M) rather than estimated.

## The Full Numbers

| Session | Duration | Tool Calls | Focus |
|---------|----------|------------|-------|
| 1 | 5m | 17 | JDLab cron status report |
| 2 | 13m | 1 | Dental clinic monitoring delegation |
| 3 | 1h 4m | 20 | Research on startup data leak incident |
| 4 | 38m | 45 | Preterview demo video |
| 5 | 27h 28m | 335 | Visual interview POC (Simli + HeyGen) |
| 6 | 1h 10m | 43 | Public demo page |
| 7 | 1h 52m | 75 | Sales page + cold emails |
| 8 | 15h 27m | 93 | Paddle international payments |
| 9 | 1h 6m | 18 | Ad strategy (ultracode) |
| 10 | 1h 50m | 17 | Codeit Ascent comparison + action plan |
| **Total** | **51h** | **664** | |

Sessions 5 and 8 — the visual interview POC and the Paddle integration — together account for 65% of total tool calls. The common thread: both sessions required reading a lot of existing code before writing any. Deep exploration accumulates Bash and Read calls faster than any amount of feature work.

Session 2 shows 1 tool call. That was a delegation to a `dental-clinic` sub-agent, with only the digest coming back to the main session. Agent delegation doesn't appear in the main session's tool call count.

## What's Still Open

The Simli lip sync quality needs another pass — eye contact in particular still reads as slightly off. Paddle sandbox needs a full round-trip test. And the Preterview action plan v2 has a stated target of "N paying customers within 8 weeks" that hasn't been validated yet.

The competitor shipped first. The response was 51 hours of Claude Code sessions. Whether that's fast enough depends entirely on what ships next.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
