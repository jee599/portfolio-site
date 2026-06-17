---
title: "437 Tool Calls, 6 Parallel Agents — Full SaaS Codebase Audit with Claude Code"
project: "portfolio-site"
date: 2026-06-17
lang: en
pair: "2026-06-17-portfolio-site-ko"
tags: [claude-code, workflow, audit, open-design, playwright, coffeechat]
description: "Audited an entire SaaS codebase in 14 hours using a 6-dimension parallel workflow: security, token efficiency, AI quality, UX, and design. 437 tool calls, 11 agents, ~1.2M tokens."
---

14 hours 11 minutes. 437 tool calls. One prompt that asked for five things at once.

That's what it took to audit the entire coffeechat codebase using Claude Code's dynamic Workflow tool — covering security vulnerabilities, token leaks, AI output quality, UX friction, and "AI aesthetic tells" all in parallel.

**TL;DR** — Ran 6 specialized audit agents simultaneously via the `Workflow` tool. Correctness findings went through adversarial verification. Most fixes committed on the spot. 50 files created or modified by end of day.

## The Request That Made Direct Editing a Dead End

coffeechat was already in decent shape: a custom design system, prompt caching, email verification gates, a credit ledger, PayPal integration. Not a greenfield project. The question wasn't "what should we build?" — it was "what's actually broken and where?"

The prompt:

```
Review the entire coffeechat site logic:
- Issues or improvements I haven't found yet
- How to make resume/portfolio/interview flows easier for users
- Ways to reduce token usage while keeping quality
- Upgrades to resume checking, portfolio validation, interview results
- How to remove the "AI-generated" feel from the design
(all of the above)
```

Five concurrent workstreams. Starting with direct file reads would mean loading the entire codebase into the main context. That's exactly the condition the dynamic Workflow tool is designed for — fan out to independent agents, keep the main context clean.

## A 6-Dimension Parallel Audit

The `Workflow` tool launched 6 specialist agents simultaneously. Each agent's schema enforced `file:line` citations — no finding without a source pointer.

- **Correctness** — real bugs, race conditions, security vulnerabilities
- **Token efficiency** — cache misses, redundant API calls, model selection mismatches
- **Interview AI quality** — follow-up question logic, model role configuration, domain-specific customization
- **Resume/portfolio AI quality** — achievement sentence generation, feedback specificity
- **UX** — input flows, error messages, state feedback
- **Design AI tells** — grayscale card grids, excessive border-radius, generic section structure

When the correctness agent surfaced a finding, a separate adversarial verification agent re-examined it independently — "is this a real bug or a false positive?" before anything went into the fix queue.

Final tally: 11 agents, ~1.2M tokens, 283 tool calls, 32 confirmed findings.

## What Got Fixed

**Security first.** Two API routes had missing admin checks. `app/api/admin/users/[id]/route.ts` and `admin/payments/[id]/refund/route.ts` were reachable without authentication. Both patched.

**Credit system redesign.** The old model assigned fixed credit costs per feature. Replaced it with **actual API cost × 7**. If a session goes negative (edge cases in prompt caching), the cost is absorbed on the server side — users see `0`, never a negative balance. All negative-balance display logic lives in `lib/credits.ts`.

**Interview session caching.** Each session now gets a unique key at setup time. Once a report is generated for that key, the endpoint blocks regeneration requests. `app/api/interview/setup/route.ts` issues the key; `report/route.ts` checks the cache before invoking the model. Duplicate token burns eliminated.

**Model routing.** Made model assignments explicit: Opus for interview sessions, Sonnet for resume review, Opus for portfolio feedback. `lib/anthropic.ts` passes different model IDs per feature instead of a single global constant.

**Feedback widget.** Built `components/feedback-widget.tsx` — a persistent inline feedback bar at the bottom of every screen, routed through Resend as real-time email. The app is in early testing; direct user feedback matters more than async surveys at this stage.

## Stripping the AI Aesthetic

The design audit came back with three specific patterns that read as "AI-generated site":

1. Every section is a card grid — flat information architecture with no visual hierarchy
2. No accent color, so nothing has visual weight
3. All icons from the same rounded icon set — the single most recognizable AI-site tell

Built `illustrations.tsx` with custom inline SVGs to replace the icon set. More importantly, embedded an actual animated demo scenario in the interview screen — the cursor-blinking-on-empty-field was replaced with a real conversation flow playing out.

The goal: make the interface look like someone made a deliberate visual decision, not like a model populated a template.

## Same Day: Fixing the open-design Reference Extractor

A separate session (7h 47min, 86 tool calls) tackled a structural bug in the open-design skill.

The extraction command in `SKILL.md` was:

```bash
grep -E '#[0-9a-fA-F]{3,8}'
```

It only pulled hex color values. Font families, letter-spacing, section structure — all missing. This explained why designs built "from Linear.app" would get the colors right but completely miss the feel.

Replaced `extract-reference.mjs` with Playwright `getComputedStyle` measurements. Running it against linear.app immediately showed the gap:

```
h1: 72px / weight 510 / Inter Variable / letter-spacing −1.584px
```

Weight `510` and negative letter-spacing are what make Linear look like Linear. Neither value appears as a hex string in the source. `grep` never had a chance at them.

Added `reference-gate.sh` as a hook: if `reference-tokens.json` doesn't exist when a `.html` file is about to be written, the build blocks. Skipping extraction is now a hard error, not a silent omission.

## When to Use a Workflow vs. Direct Editing

The parallel workflow was clearly right for the audit phase. The six dimensions are completely independent — the security agent doesn't need to know what the token efficiency agent found; the design agent doesn't care about authentication logic. Independence is exactly the condition that makes `pipeline()` the right primitive.

The fix phase was different. File modifications were entangled — changing `lib/credits.ts` affected how `app/api/interview/setup/route.ts` handles credit checks. Fanning out to multiple agents here would have introduced conflicts. Sequential, direct edits were the right call.

Pattern: parallelize when dimensions are independent; stay sequential when changes share state.

## Numbers

| | |
|---|---|
| Main session | 14h 11min |
| Total tool calls | 437 |
| Audit agents | 11 |
| Tokens processed | ~1.2M |
| Files created/modified | 50 |
| Confirmed findings | 32 |
| open-design session | 7h 47min, 86 tool calls |

50 files. 21+ hours across two sessions. Commits split by feature, not by session.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
