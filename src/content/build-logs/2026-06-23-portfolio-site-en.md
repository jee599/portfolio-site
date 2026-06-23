---
title: "HeyGen Avatars + Paddle Payments in 14 Hours: A 504-Tool-Call Claude Code Session"
project: "portfolio-site"
date: 2026-06-23
lang: en
pair: "2026-06-23-portfolio-site-ko"
tags: [claude-code, preterview, heygen, simli, paddle, ai-avatar, payments]
description: "How Claude Code spent 14 hours and 504 tool calls building a photorealistic AI interview simulator and wiring up international payments via Paddle."
---

504 tool calls. 14 hours and 10 minutes. Six sessions.

That's what it took to add a photorealistic AI interviewer to Preterview — three faces, lip-synced audio, microphone input, screen capture — plus an international payment flow via Paddle. Here's the full log, including the parts that didn't work.

**TL;DR**: Asked Claude Code to build something that "looks like a Zoom interview with three interviewers." Before writing a line of code, it decomposed the scope and forced a choice between real-time and turn-based modes. That single architectural decision shaped everything downstream. A working POC came out 14 hours later. Paddle integration took a separate session and went cleaner.

## The Prompt That Launched 14 Hours of Browser Control

Session 4 began with this:

> "A real Zoom-style interview — three interviewers rendered in 3D, lip-synced, with screen capture and microphone input."

Claude's first move wasn't to install a package. It was scope decomposition. Two paths laid out explicitly:

**Scope A** — Push-to-talk. You speak, submit, the interviewer responds. Looks like Zoom. Turn-based under the hood.

**Scope B** — True real-time. Always listening, can interrupt mid-sentence. Requires WebRTC + Voice Activity Detection.

The cost estimate: 90% of implementation complexity and API spend lives in Scope B. We went with Scope A.

This one call reshapes the entire architecture. In turn-based mode, you can pre-generate all interviewer audio for a given response, extract phoneme timing data, and drive lip movements client-side from that pre-computed data. No real-time streaming API. No sub-100ms latency requirement. The avatar tile becomes a video player with synchronized audio rather than a live WebRTC stream.

One scope call. Dozens of simpler implementation choices as a result.

## Why the Avatar Vendor Choice Shapes Everything Downstream

The initial implementation used 3D character models. User feedback was immediate: "How do I switch to a real person?"

Claude ran live web searches to evaluate current options. Two finalists emerged: HeyGen Streaming API and Simli.

The evaluation criterion: under $1 per 20-minute interview session. Claude pulled the actual pricing pages and ran the math. LiveAvatar was immediately disqualified on cost. HeyGen charges per avatar minute at a rate that fits the budget for pre-generated audio. Simli bills per session for the lip-sync layer.

Final architecture: **HeyGen for avatar video generation, Simli for real-time lip-sync rendering**.

The split reflects what each service actually does well. HeyGen generates the avatar video from text and voice. Simli takes that video and drives the lip movements using the audio at runtime, handling the phoneme-to-viseme mapping. Decoupled responsibilities, separate billing, each service doing the thing it's optimized for.

Files generated from this decision:

```
~/preterview/components/interview/HeyGenAvatarTile.tsx
~/preterview/components/interview/SimliAvatarTile.tsx
~/preterview/components/interview/VisualInterviewPoc.tsx
~/preterview/app/api/simli-token/route.ts
~/preterview/app/api/heygen-token/route.ts
~/preterview/lib/heygen.ts
~/preterview/lib/simli.ts
```

48 of the 504 total tool calls were `mcp__claude-in-chrome__computer` — screenshot captures to verify actual UI state in the browser. Not reading console output. Not parsing error logs. Taking a screenshot, inspecting the rendered result, identifying the delta from expected state, editing, re-rendering. That loop ran throughout the session.

## The Part Nobody Writes About: Env Vars, Server State, Session Limits

The session transcript has a section that looks like this:

```
"still showing 3D model"
"no"
"you can just restart the server yourself"
```

Three concrete failure modes, in order:

**Missing `.env.local`** — HeyGen and Simli API calls were failing silently because the credentials weren't in the environment. The application code was correct. The keys weren't there. Adding them manually unblocked the entire avatar flow.

**Stale server state** — After removing the 3D model components, the old renderer kept appearing because the Next.js dev server was still serving the cached module graph. The fix was a server restart. The time cost was diagnosing this as the problem rather than a code bug — the symptoms looked like a component registration issue, not a stale build artifact.

**Simli concurrent session limits** — The goal was three avatars rendering simultaneously, one per interviewer. Only one worked. Simli enforces a cap on concurrent sessions per API key. Production architecture needs to account for this: sequence the avatar activations, upgrade the plan tier, or implement a session pool. The POC scope didn't require solving this.

Lip-sync quality and eye gaze were "acceptable for POC" at session close. Not production-ready. The gaze feels off when multiple avatars are visible simultaneously, and lip-sync has latency at sentence boundaries. That was explicitly out of scope for this session.

Tool breakdown for the visual interview session:

| Tool | Calls |
|---|---|
| `Bash` | 105 |
| `Edit` | 67 |
| `mcp__claude-in-chrome__computer` | 48 |
| `mcp__claude-in-chrome__navigate` | 21 |
| `Write` | 18 |

Browser control accounted for roughly a third of all calls. The pattern of taking a screenshot and correcting based on the actual rendered state turned out to be faster than reasoning about the UI from code alone — especially for timing and layout issues that don't surface until the component renders in a real browser.

## Reading Before Writing: How the Paddle Integration Stayed Clean

Session 5 started with eight words: "adding Paddle payments to Preterview."

The first 17 tool calls were all `Read`. Not Paddle documentation. The existing codebase.

`feat/geo-payment-routing` was already merged. Structure: Korean users route to PayApp (KRW), international users to PayPal (USD). Three credit pack tiers at 9,900 / 49,000 / 99,000 KRW. Idempotent credit fulfillment logic to handle duplicate webhook deliveries. Webhook-based confirmation pattern with deduplication by transaction ID.

Once that was mapped, the decision was straightforward: **replace only the PayPal international path with Paddle**. The Korean PayApp flow stays untouched. The credit fulfillment logic stays untouched. The payment routing gets a one-line change.

Before writing any Paddle-specific code, four areas of the live Paddle documentation were verified:

1. Client-side checkout initialization and overlay behavior
2. Webhook signature verification — wrong implementation here is a security vulnerability, not just a bug
3. Order and transaction ID structure for idempotency keys
4. Credit fulfillment trigger conditions and event types

Then the code was written to match existing patterns in the codebase, not to introduce new conventions.

Files created:

```
~/preterview/lib/payments/paddle.ts
~/preterview/app/api/pay/paddle/create/route.ts
~/preterview/app/api/pay/paddle/webhook/route.ts
~/preterview/app/api/pay/paddle/confirm/route.ts
~/preterview/components/pricing/PaddleBuy.tsx
~/preterview/docs/paddle-setup.md
```

Tool breakdown for the Paddle session:

| Tool | Calls |
|---|---|
| `Bash` | 39 |
| `Read` | 17 |
| `Edit` | 10 |
| `Write` | 6 |

The `Read`-to-`Edit` ratio tells the story. More time reading existing code than writing new code. The goal was for the Paddle integration to be invisible from the perspective of the codebase — matching function signatures, naming conventions, error handling patterns, and logging format from the existing payment code rather than introducing a different style.

One caveat: Paddle sandbox testing requires Price IDs injected via environment variable, which means end-to-end verification is blocked until the Paddle account is configured and sandbox credentials are in `.env.local`. The webhook signature logic is correct against the documentation. Full purchase-to-fulfillment validation pending account setup.

## 18 Parallel Agents Across 42 Grant Programs

Session 3 was different. Started with `/effort ultracode` and a single request:

"Find every government and private grant program I can apply to with Preterview and the dental ad agency project, fill out the applications."

18 agents ran in parallel. They verified 42 programs — not a scraped list, but actual current-state verification: open or closed, specific deadline, solo-founder eligibility, working application URL. Programs listed online with closed deadlines were marked and excluded. Programs requiring a co-founder or corporate registration were flagged separately.

12 individual applications were written to `~/funding/apply-2026-06-22/applications/`, one file per program, filled out with project-specific content.

The key output: `~/funding/apply-2026-06-22/HIGHPROB.md` — a ranked list by estimated pass rate, with specific eligibility criteria, required documents, and deadlines for each high-probability program.

This is where multi-agent AI automation earns its cost. A sequential search would have taken hours across multiple databases and likely missed programs in less-visible channels. 18 parallel agents across 42 programs converge faster, with citations for every finding.

## Full Session Statistics

| Metric | Count |
|---|---|
| Total sessions | 6 |
| Total tool calls | 504 |
| Longest single session | 14h 10m (visual interview) |
| `Bash` calls | 183 |
| `Edit` calls | 81 |
| Browser control calls | 52 |
| Files created | 26 |
| Files modified | 17 |

The visual interview session alone accounted for 64% of total tool calls. That's consistent with UI work that involves live browser verification — the feedback loop between code change and visual result is inherently iterative, and each iteration adds calls. But it also reflects the novelty of the work: integrating two new external APIs (HeyGen and Simli) with different auth flows, different error surfaces, and browser-rendered output that can only be verified visually.

Browser-driven UI verification at this volume was new for this project. The pattern works. The cost is session length.

## What's Still Open

**Simli lip-sync quality** — noticeable latency at sentence boundaries, particularly when the avatar transitions between speaking and idle states. The pre-computed timing data extraction from HeyGen audio needs tuning to align better with the actual Simli rendering engine.

**Eye gaze** — with three avatars rendering simultaneously, gaze direction feels off. The avatars don't track the camera naturally, which breaks the illusion of eye contact during the interview. This likely requires per-avatar gaze configuration in the HeyGen avatar settings, not a code fix.

**Paddle sandbox verification** — the implementation matches the Paddle documentation, but Price IDs are runtime environment variables. Can't verify the full purchase-to-credit-fulfillment path until the Paddle account is configured and sandbox credentials are available.

The POC runs. Production is a separate scope.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
