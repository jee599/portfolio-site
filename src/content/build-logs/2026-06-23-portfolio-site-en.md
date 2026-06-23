---
title: "335 Tool Calls in One Session: AI Avatar Interviews and Paddle Payments with Claude Code"
project: "portfolio-site"
date: 2026-06-23
lang: en
pair: "2026-06-23-portfolio-site-ko"
tags: [claude-code, preterview, heygen, simli, paddle, multi-agent, ultracode]
description: "13 sessions, 64 hours, 853 tool calls over 3 days. Shipping HeyGen+Simli visual interviews and Paddle international payments for Preterview — with the real friction included."
---

One session ran for 27 hours 28 minutes and made 335 tool calls. That's not a typo. It's what happened when I asked Claude Code to build a real-time AI avatar interview system from a single sentence — three photo-realistic interviewers, lip sync, push-to-talk, browser control, the whole thing.

This is the sprint log for Preterview: 3 days, 13 sessions, 853 total tool calls. AI visual interviews (HeyGen + Simli), Paddle international payments, a public demo page, and an ad strategy research pass — all in the same sprint.

**TL;DR:** Claude Code holds up as a combined project manager and implementer. Stack decisions, cost modeling, and code all fit in a single session. The real tax: any integration touching external APIs takes roughly 2× longer than you estimate. Missing `.env.local`, vendor rate limits, and concurrent session caps accumulate fast.

## The Session That Ate 27 Hours

Session 5 started with this:

> "Like a real Zoom interview — three interviewers rendered in 3D, lip sync, they can see my screen, I use a microphone"

No spec doc. No architecture diagram. Just that sentence.

The first thing Claude did wasn't write code — it decomposed scope. Two branches:

**Scope A — Push-to-talk.** You speak, submit, the interviewer responds. Looks like Zoom, but it's turn-based under the hood. Interviewer audio can be pre-generated, timing can be extracted offline, and the Web Speech API (free) handles the user's side.

**Scope B — Real-time.** The system listens continuously and interjects naturally. Requires WebRTC + VAD. Contains roughly 90% of the cost and complexity.

Scope A won. The reasoning was concrete: pre-generating audio makes timing extraction deterministic, no streaming pipeline is required, and the free Web Speech API stays intact. Before any code was written, Claude generated `~/reports/preterview-scopeA-options.html` — a layer-by-layer option comparison within Scope A constraints. Decide first, build second.

Vendor selection ran through a dynamic multi-agent workflow. HeyGen Streaming API, Simli, LiveAvatar, and D-ID were all benchmarked against latency, pricing, and concurrent session limits. Result: **HeyGen for avatar streaming + Simli for real-time lip sync**.

New files from that session: `HeyGenAvatarTile.tsx`, `SimliAvatarTile.tsx`, `VisualInterviewPoc.tsx`, `heygen.ts`, `simli.ts`, plus three API routes. `mcp__claude-in-chrome__computer` was called 48 times — Claude drove the browser directly to validate UI state rather than guessing from code alone.

The session transcript has moments like this still in it:

```
"still showing 3D model"
"no"
"you can restart the server yourself"
```

`.env.local` was missing, so API keys weren't loading. Server restarts were needed to pick up env changes. Three simultaneous avatars failed — Simli's concurrent session limit was one. These aren't bugs in Claude's output; they're the expected friction of live external API integration. 335 tool calls is what working through that friction looks like.

## "Under $1 Per 20-Minute Interview"

Same session. After the POC was running, the cost constraint landed:

> "this is way too expensive — one interview needs to be around $1, 20 minutes, no more"

LiveAvatar was the first attempt. Real API key, real test run. Per-session cost came back over budget.

Claude ran a dynamic workflow: *"Verify cheapest path to ≤$1 per 20-min 3-interviewer photoreal session."* Agents fanned out across vendor pricing pages, API docs, and community threads. Output: a stack-ranked list of paths that hit the budget.

The winning path: Simli Free tier for lip sync + generate each avatar once and reuse across sessions. One-time generation cost amortized to near-zero per interview. The constraint forced a useful architectural insight — stateless avatar rendering is cheaper than stateful streaming. Lock this kind of constraint in early because it reshapes the architecture.

## Paddle Payments: Read the Existing Code First

Session 9 started with six words: *"attach Paddle payments to Preterview."*

That became 249 tool calls across 23 hours 21 minutes.

Before writing a single line, Claude read the entire existing payment architecture. The `feat/geo-payment-routing` branch was already merged. The structure was already in place: Korea → PayApp (KRW), International → PayPal (USD), three credit pack tiers (₩9,900 / ₩49,000 / ₩99,000), idempotent credit fulfillment logic, webhook-based fulfillment pattern.

The decision followed directly from the read: **replace only the international path (PayPal → Paddle)**. Don't touch the Korean PayApp integration.

Paddle's official docs were verified before implementation — specifically webhook signature validation, because getting that wrong is catastrophic and silent. Files generated: `lib/payments/paddle.ts`, three API routes (`create`, `webhook`, `confirm`), `PaddleBuy.tsx`, and `docs/paddle-setup.md`.

The sandbox setup ran in-session: sandbox API key (`pdl_sdbx_apikey_...`) issued from the Paddle dashboard, checkout page and success redirect verified via Chrome MCP. `mcp__claude-in-chrome__computer` was called 67 times. Separate Bash call count: 63.

The tool call count makes sense when you consider the depth of pre-implementation reading. When you're wiring into an existing payment system, thorough reading before writing is where correctness lives.

## The Public Demo: Measure Cost Before Writing Code

Session 6 — public demo page with 5–7 free turns. 1 hour 10 minutes, 43 tool calls.

The sequence was deliberate: **cost modeling first, implementation second**.

`scripts/demo-cost.mjs` ran a real single-turn test through Claude Opus 4.8 and counted tokens. With measured per-turn cost in hand, the per-IP rate limit policy was set from data rather than intuition. The demo route structure followed `/interview` conventions exactly: thin async server page + `DemoInterview.tsx` client component + standalone `app/api/demo/turn/route.ts`. When the architecture is clear upfront, 43 tool calls is enough to ship a feature end-to-end.

## The PRD Written After Reading the Code

Session 7 — PRD PDF. 10 minutes, 23 tool calls.

First draft generated. User feedback: *"the mock interview section is the core — strengthen it."*

Claude re-read the actual interview feature code, then rewrote the PRD. The mock interview section expanded from a paragraph to six sub-sections: three-stage interview setup, three-interviewer panel roles, live interview room features, follow-up question loop, post-interview report, and re-interview flow.

Next request: *"text isn't readable on mobile."* CSS font-size adjustment, re-render. Done.

The sequence matters: code read → PRD rewrite → layout fix. The document reflects what was actually built, not what was planned before building.

## Ad Strategy: Adversarial Verification Rewrote Every Number

Session 10 opened with `/effort ultracode`. The ask: objective benchmarks with sources for ad spend targeting, both Korea and global markets.

Two dynamic workflows ran.

**First workflow:** Five agents ran in parallel — Naver PowerLink CPC rates, Meta Korea CPM, KakaoMoment benchmarks, global Meta ad performance (2024–2025 actuals), Reddit ad benchmarks. After the initial pass, adversarial verification ran: agents were tasked with refuting each claimed number. Result: **13 out of 13 key figures were revised**. Single-agent estimates carry optimism bias. Adversarial cross-checking is what makes benchmark numbers usable for actual budget decisions.

**Second workflow:** Naver PowerLink campaign setup, three Reddit ad creative variants, pixel + landing page QA checklist — validated against current platform constraints. Total: 69 tool calls.

The output was an actionable channel-by-channel spend plan with sourced numbers that had already survived a refutation pass.

## The Sidebar Sessions

**Session 4 (38 min, 45 tool calls):** `preterview-demo.html` rewritten as a game developer portfolio interview scenario. Playwright extracted frames, ffmpeg encoded them. Output: `preterview-demo-ko.mp4` and `preterview-demo-en.mp4`, both 1280×720, 30fps, 39.5 seconds.

**Session 2 (13 min, 1 tool call):** Dental clinic keyword ranking check. The single tool call was `Agent(dental-clinic)` — full delegation. The sub-agent handled placement ranking measurement, `history.json` update, and `sync.sh` push internally. Sub-agent internals don't appear in the main session's tool call count.

**Session 1 (5 min, 17 tool calls):** Cron job status check. 26 deliveries confirmed, PDF report generated — 4 pages, 776KB.

**Session 3 (1h 4min, 20 tool calls):** Research on a startup data leak incident — separate project context.

**Session 8 (2h 44min, 51 tool calls):** Korean government and private startup support program research.

## Full Session Stats

| Session | Duration | Tool Calls | Focus |
|---------|----------|------------|-------|
| 1 | 5m | 17 | Cron status report |
| 2 | 13m | 1 | Clinic ranking check (delegated) |
| 3 | 1h 4m | 20 | Startup data leak research |
| 4 | 38m | 45 | Preterview demo video |
| 5 | 27h 28m | 335 | Visual interview POC (Simli + HeyGen) |
| 6 | 1h 10m | 43 | Public demo page |
| 7 | 10m | 23 | Preterview PRD PDF |
| 8 | 2h 44m | 51 | Gov/private grant research |
| 9 | 23h 21m | 249 | Paddle international payments |
| 10 | 8h 46m | 69 | Ad strategy research (ultracode) |
| **Total** | **64h** | **853** | |

Session 5 (visual interview) is 39% of all tool calls. Session 9 (Paddle) is 29%. Both sessions started with deep reads of existing code before touching anything — exploration-heavy work stacks up Bash and Read calls fast.

## What's Left

- Simli lip sync quality: gaze tracking still reads slightly off, eye contact breaks immersion
- Paddle sandbox round-trip test: full purchase → webhook → credit fulfillment
- Public demo deployment: confirm production routing before announcing

The pattern from this sprint: external API integrations consistently take 2× estimated time. The code itself moves fast. The integration surface — missing secrets, vendor rate limits, concurrent session caps, sandbox quirks — is where the hours actually go.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
