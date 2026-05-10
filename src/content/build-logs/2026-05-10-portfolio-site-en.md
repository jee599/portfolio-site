---
title: "5 Parallel Redesigns and the SRI Hash Bug Codex Caught Before Production"
project: "portfolio-site"
date: 2026-05-10
lang: en
pair: "2026-05-10-portfolio-site-ko"
tags: [claude-code, frontend, design, multi-agent, codex, bug-fix]
description: "Redesigned a Korean game-industry mentoring site with 5 parallel Claude Code agents. Codex cross-verification caught an SRI hash mismatch before production. 79 tool calls."
---

"None of these look professional. Not a single one."

That was the feedback after 5 design variants landed simultaneously from a parallel agent dispatch. It's a useful kind of failure — the type that tells you exactly what the brief was missing from the start.

**TL;DR:** Dispatched 5 `frontend-implementer` subagents in parallel to redesign `coffeechat.it.kr`, a Korean game industry mentoring platform. First round failed the professional-trust test, so the entire brief got reworked. Then Codex cross-verification caught an SRI hash mismatch across 4 files that would have silently broken React in production. Total: 79 tool calls across 2 sessions.

## Why the Site Analysis Had to Come First

The starting point was a URL: `coffeechat.it.kr`. Before touching any spec, `WebFetch` analyzed the live site.

What came back wasn't a generic coffee-chat matchmaking app. It was a **1:1 mentoring platform specifically for the Korean game industry** — resume reviews, mock interviews, and coffee chats with people currently working at major Korean game studios. The actual product is career acceleration for people trying to break into or level up within the Korean game sector.

That context shifts the entire design direction. Generic SaaS templates signal product-market fit problems, not professionalism. A platform in the career-mentoring space needs to communicate credibility first. Visual novelty comes second at best.

After the analysis, a `general-purpose` agent built `plan.md` — each variant specified in enough detail that the implementer agents could run without making judgment calls. Then all 5 variants went to `frontend-implementer` subagents in parallel.

| Variant | Mood | Key Elements |
|---|---|---|
| V1 Editorial Magazine | Korean indie magazine | Instrument Serif, cream `#f4eee4` |
| V2 Soft Brutalist | Bold borders, lime/pink color blocks | Strong typographic contrast |
| V3 Motion Dark | Animation-heavy | Floating gradient blobs, `@keyframes drift` |
| V4 Minimal Pro | Inflearn-adjacent tone | White base, high information density |
| V5 Korean Editorial | Korean editorial print | Vertical type emphasis |

## When "All of Them Are Wrong" Is the Right Feedback

Five variants, five misses. The response: "None of these look professional. Look at Inflearn or similar education platforms."

The problem is obvious in retrospect. Every variant chased visual distinctiveness — editorial typography, motion gradients, brutalist grids — without touching the actual problem: **educational platform trust signals**.

Inflearn, Class101, and Fastcampus don't just look clean. They communicate scale and authority through specific repeating UI patterns: enrollment counts with four-digit formatting, completion rates, mentor profile cards that show current employer and years of experience, verified badges, cohort timelines. These aren't decoration — they're evidence of a platform that has delivered value to real users.

V1 through V5 skipped all of it. They were visually interesting, but the kind of visually interesting that makes someone think "design exercise" rather than "I could trust this platform with my job search."

The fix wasn't another aesthetic round. Round 2 started with a dedicated Inflearn site analysis as the baseline reference. The goal shifted from "make it look different" to "make it feel like a platform where a game company employee would actually show up as a mentor."

## The SRI Hash Mismatch Codex Found

After implementing the second round, `code-verifier` ran first, then Codex cross-verification.

The verifier passed. Codex found something it missed.

V2, V3, V4, and V5 all loaded `react.production.min.js` from unpkg — but the `integrity` attribute in each `<script>` tag was set to the SHA-384 hash of `react.development.js`, not the production build.

```html
<!-- What was in the code -->
<script
  src="https://unpkg.com/react@18/umd/react.production.min.js"
  integrity="sha384-[hash computed from development.js]"
  crossorigin="anonymous"
></script>
```

Production and development builds have different file contents. Different minification, different source maps stripped out — different SHA-384 hashes. When a browser performs SRI validation, it fetches the file, hashes it, and compares. Hash mismatch means the script is blocked entirely. React doesn't load. The page renders without interactivity and throws no obvious error to the end user.

This doesn't surface in ESLint. It doesn't show up in a design review or a visual regression test. It surfaces when someone reads the diff with enough context to know what the values are supposed to mean and checks them against the actual source files.

Codex caught it by cross-referencing the diff against known constraints — not just syntax correctness, but semantic correctness. All 4 files got updated with the correct production hashes before shipping.

If this had gone to production, every user with SRI enforcement enabled (i.e., every modern browser) would have hit a silently broken experience. No console errors visible to the end user, just a non-interactive page.

## What Makes Parallel Dispatch Actually Work

5 sequential variants take 5x as long. Parallel dispatch takes as long as the slowest single agent. The speedup is obvious. The less obvious requirement is what enables it.

Each `frontend-implementer` agent starts with no shared state and no coordination channel. For all 5 to run independently, `plan.md` has to resolve every decision each agent would otherwise block on.

Vague: "Make it look professional and modern."

Specific enough to run independently: "V3: motion dark theme. Background `#0a0a0f`. Hero section uses floating gradient blobs animated via `@keyframes drift`. Canvas particle effect behind the CTA. Font: `Space Grotesk` for headings, `Inter` for body. No light mode variant."

The difference is decision surface. Vague briefs generate agents that either make assumptions (producing inconsistent results) or stop to ask questions (losing the parallelism benefit entirely). Specific specs generate agents that execute.

Creating `plan.md` with a dedicated agent before dispatching the implementers was the right call. That planning agent had the space to think through each variant in isolation, producing specs detailed enough that the implementers could run in parallel without coordination.

## Tool Call Breakdown

**Session 2 (redesign):**

| Tool | Calls | Purpose |
|---|---|---|
| `Agent` | 28 | Subagent dispatch — 5 parallel implementers, verifier, Codex cross-verification |
| `Bash` | 26 | Diff generation, file moves, server checks |
| `TaskUpdate` / `TaskCreate` | 13 | Progress tracking |
| `ToolSearch` | 5 | Schema loading |
| `WebFetch` | 5 | Site analysis |

**Session 1 (dental ad cron job):**

A separate task — 5 file updates to the `dentalad` cron workflow plus an HTML report. `claude-opus-4-7` handled it directly: 7 minutes, 23 tool calls, no subagents. Small, well-scoped tasks don't benefit from orchestration overhead. The pipeline for small tasks is: read, edit, verify. Not: plan, dispatch, verify, cross-verify.

## Output Structure

The comparison canvas lives at `/Users/jidong/coffee-chat-redesign/` as a single HTML file. Each of the 5 variant cards has a "View →" link that opens the variant in a new tab. Browser-native comparison — no screenshots, no tool switching, just tab-hopping between full-page renders. The client picks directly in the browser.

Round 2 (professional, education-platform trust signals, Inflearn reference baseline) continues next session.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
