---
title: "5 Parallel Claude Code Agents, One Hard Pivot, and a SRI Bug Only Codex Found (79 Tool Calls)"
project: "portfolio-site"
date: 2026-05-10
lang: en
pair: "2026-05-10-portfolio-site-ko"
tags: [claude-code, design, parallel-agents, codex, automation]
description: "Dispatched 5 parallel frontend-implementer agents for a coffee chat redesign. Got rejected. Pivoted to education platform tone. Codex caught a SRI hash mismatch code-verifier missed. 79 tool calls."
---

The brief was one line: "Redesign the coffee chat site. Give me at least 5 options."

No reference imagery. No target user. No mood direction. Just that.

**TL;DR** Dispatched 5 `frontend-implementer` agents in parallel to generate simultaneous redesign variants for a coffee chat mentoring site. Got "none of these feel professional" feedback, reworked the entire brief around education platform trust signals, ran another 5 in parallel. Codex cross-verification (`codex-cross-verify`) then caught a SRI hash mismatch across 4 files that `code-verifier` had missed — production React would have been silently blocked. 79 tool calls total.

## The Problem with Starting Blind

Jumping straight to 5 designs from that brief produces exactly what you'd expect: generic templates that could belong to any product in any industry.

The first real step was running `WebFetch` on the site to understand what it actually was. Not a general networking app — a **1:1 mentoring platform for the Korean game industry**. Current studio employees meet with job seekers for coffee chats, resume reviews, and mock interviews. That's the core product.

With that context captured in `plan.md`, a `general-purpose` agent defined 5 distinct design directions and wrote specs detailed enough that each `frontend-implementer` could run without making judgment calls. Then all 5 went out in parallel: Editorial Magazine, Soft Brutalist, Premium Dark, Retro Arcade, Neo-Minimal.

## "None of These Are Any Good"

All 5 variants came back. The response was blunt: "None of these feel professional. Not one. Go look at Inflearn or similar education platforms."

The problem was visible in retrospect. Every variant had explored aesthetic differentiation — editorial typography, motion gradients, brutalist grids — without touching the actual gap: **educational platform trust signals**. Inflearn and FastCampus don't lead with visual novelty. They lead with credibility, structure, and evidence that the platform has delivered real outcomes for real users.

By anchoring the brief to the game industry identity, the designs had skipped the trust layer that a first-time visitor needs before booking a session with a stranger.

Reclassified the complexity, rebuilt the plan with education-service credibility as the explicit north star, defined 5 new variants, and ran another parallel batch.

## The Bug Codex Found That code-verifier Missed

After round two, `design-reviewer` ran a review pass. Then `codex-cross-verify` ran — and a critical bug surfaced.

Variants V2 through V5 all loaded `react.production.min.js`, but the SRI (Subresource Integrity) hashes in each `<script>` tag were computed from `react.development.js`. When SRI validation fails, the browser blocks the script entirely. The pages looked visually complete, but React wouldn't have loaded in any production browser.

```html
<!-- Bug: production file URL, development build hash -->
<script src="react.production.min.js"
  integrity="sha384-[hash from development build]"
  crossorigin="anonymous"></script>
```

`code-verifier` missed this — SRI hash mismatches don't surface at the lint or typecheck level. The tooling doesn't cross-reference CDN file hashes against build variant. Codex caught it by reading the files and checking hash values against the correct build target. All 4 files were updated with the correct production hashes immediately.

## Tool Call Breakdown

79 total. `Agent` led with 28 — 5 parallel dispatches for round one, 5 more for round two, plus `plan-orchestrator`, `design-reviewer`, and `codex-cross-verify`. When you stack two rounds of parallel dispatch on top of the orchestration layer, the `Agent` call count rises fast. `Bash` came in at 26, mostly `diff.patch` generation and workflow state updates. `TaskUpdate` and `TaskCreate` accounted for 13 calls tracking stage transitions.

Outputs landed in `/Users/jidong/coffee-chat-redesign/` — a comparison canvas with all 5 variants, each card linking to the full design in a new tab.

## A Second Session: Dental Ad Research in 7 Minutes

The same day, a separate session ran a daily research update for a dental advertising workflow. A cron agent read `medical_dental_ads_daily_goal.md`, updated 5 markdown files, and generated an HTML report — 23 tool calls, 7 minutes.

Breakdown: `Read` 9×, `Edit` 8×, `Bash` 3×, `Write` 2×. When the pattern is established and context is consistent, the orchestration overhead drops. 23 calls, 6 outputs.

## What These Sessions Showed

**No context, generic output.** Starting with a URL and expecting 5 high-quality designs doesn't work. An explicit site analysis step has to be part of the plan before the design brief gets written.

**Parallel agents need concrete specs.** Dispatching 5 `frontend-implementer` agents simultaneously works, but only when `plan.md` is specific enough that each can run independently. "V3: floating gradient blobs, background `#0a0a0f`, monospace for all numbers" is the level of specificity that enables clean parallel execution. Vague specs collapse back into sequential dependency — each agent fills gaps differently, and the variants drift toward each other.

**Codex and code-verifier are complementary, not redundant.** `code-verifier` covers tests, lint, and typecheck. Codex reads for logical consistency across files. The SRI hash mismatch was invisible to the former and obvious to the latter.

> "None of these are any good" was the pivot point. The right response to rejection isn't defense — it's asking what "good" would actually look like.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
