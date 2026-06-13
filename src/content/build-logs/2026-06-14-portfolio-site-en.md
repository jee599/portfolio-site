---
title: "532 Tool Calls, 28 Hours: What Claude Code's Ultracode Mode Actually Does"
project: "portfolio-site"
date: 2026-06-14
lang: en
pair: "2026-06-14-portfolio-site-ko"
tags: [claude-code, ultracode, workflow, fable-5, multi-project]
description: "9 sessions, 5 projects, 1,000+ tool calls in 3 days. Here's what running Claude Fable 5 with ultracode actually looks like at scale."
---

532 tool calls across a single session. That number stopped me cold when I reviewed the logs — most developer workflows don't hit that in a week.

**TL;DR:** Between June 11–13, I ran 9 Claude Code sessions across 5 parallel projects: a global saju (Korean fortune-telling) app redesign, a coffee chat platform with admin/payments/i18n, a newsletter product bug fix, an AEO outreach engine, and a startup funding research sweep. The `ultracode` flag isn't just a speed boost — it's a switch that enables automatic fan-out workflow orchestration.

---

## Why Are These Sessions Running for 28 Hours Straight?

Normal Claude Code sessions run 30 minutes to 2 hours. This week was different:

| Session | Duration | Tool Calls | Project |
|---------|----------|------------|---------|
| Session 4 | 25h 26min | 356 | Saju Global Redesign |
| Session 5 | 27h 48min | 532 | Coffee Chat Admin/Payments |
| Session 6 | 24h 48min | 105 | AEO Outreach Engine |

The mechanism is the `/goal` hook. When set, Claude doesn't terminate the session until every condition in the goal is satisfied. Session 5's goal was: *"Attach per-user admin + token usage tracking + payments + global i18n to Coffee Chat."* Broad conditions produce long sessions. All 532 tool calls were pointed at a single goal.

The failure mode here is real: past roughly 20 hours, context gets compressed and early architectural decisions become fuzzy. I settled into a pattern of `/clear` followed by `/goal` reset to re-anchor the session when that happened.

---

## What `ultracode` Actually Does at Runtime

Running `/effort ultracode` appends `xhigh + dynamic workflow orchestration` to the configuration message. That second part is what matters.

Session 2 demonstrates it clearly. I gave it: *"Comprehensive sweep of primer-grade seed investment and grant programs."* Instead of a linear search, Claude fanned out to 5 parallel search agents across different categories. The result: 57 programs, 209 searches and verification passes, narrowed to 7 final recommendations that matched a solo-founder profile. The same task done manually would take two full days.

Session 9 shows the other dimension. Input: *"JDLab Dynamic Outreach Failure Audit."* Claude didn't wait for me to structure the investigation — it first ran reconnaissance on Gmail access permissions, located quota DSN messages in the bounce queue, and diagnosed the root cause from there. The workflow structure emerged from the data, not from my instructions.

The difference from normal usage: I'm not specifying *how* to parallelize. The agent decides based on what it finds during initial reconnaissance.

---

## Saju Global: When the Data Contradicts the Hypothesis

The redesign started with a positioning question: *"If we rebrand to traditional saju instead of AI-powered readings, does that unblock payment processor approval?"*

The field data said no.

A natural experiment on Etsy made this concrete. Shops that led with "AI Reading" as the primary descriptor: 0 sales in their first month. Shops using a human persona (example: "Yeonhwa Manshin") with traditional framing: 464 sales, 130 reviews, $34 average order value. More importantly, payment processor review isn't triggered by landing page copy — it's triggered by service category classification. An "AI saju" service that takes birth date/time inputs and returns fortune readings is categorized identically to a traditional fortune-telling service. The category is what gets scrutinized, not the adjective in the headline.

This killed the hypothesis cleanly. We kept the traditional positioning (which performs better anyway) and resolved the payment rail problem separately.

The build sequence used the `open-design` skill, producing `landing-midnight.html` in three iterations: v1 → v2 → v3. While v3 was being coded, `gpt-image-2` was generating assets in the background. Image generation was the bottleneck — parallel execution eliminated it as a constraint.

---

## Coffee Chat: 70 New Files and One Git Email Blocking Deployment

Session 5 ended with this error in the Cloudflare deployment pipeline:

```
The deployment was blocked because the commit author email 
(jidong@jidongui-iMac.local) is not valid.
```

The local machine hostname had leaked into `git config`. `jidong@jidongui-iMac.local` is not a real email address, and Cloudflare's deployment validator correctly rejected it. Claude doesn't touch `git config` (security policy), so this was a manual fix — update the email in `.gitconfig`, amend the commit, redeploy.

The session's tool call breakdown: Bash (190), Edit (136), Write (66). Over 70 new files created. At this scale, not running `/clear` mid-session is critical — the context window needs to stay intact to track dependency chains across 70 files. Once you clear, you lose the implicit map of what depends on what.

The feature surface delivered in that session: per-user admin dashboard, token usage tracking, Stripe payment integration, multi-language support with TTS, and a resume builder module. One session, one goal.

---

## spoonai: Fix the P0 Before You Think About Growth

I came into Session 7 asking about distribution strategy for spoonai.me. The session started with a P0 diagnosis instead.

Two bugs were live in production: new subscribers permanently unable to receive emails (broken subscription confirmation flow), and the unsubscribe link returning a 404. Trying to grow with these active would just accelerate churn.

The fix sequence:
- Added `/unsubscribe` and `/feedback` pages
- Changed `/api/unsubscribe` GET handler from immediate deletion to a 302 redirect to a confirmation page
- Deployed to live via commit `4a3c598`
- Verified live URL response codes

56 tool calls. 22 minutes. That's the kind of session that should feel routine but often isn't — a focused scope with a clear done state.

---

## The `design-gate` Hook: Annoying Until It Isn't

The project's `CLAUDE.md` has a hard rule: no HTML deliverable without an Open Design or equivalent design system pass. The `hooks/design-gate.sh` hook enforces this — it intercepts `.html` file writes and blocks them until the design pass is acknowledged.

In Session 6, running the `report-builder` skill hit this gate. Required call before proceeding:

```bash
bash ~/.claude/hooks/design-pass.sh "report-builder design system pass"
```

The first few times this fires, it reads as friction. But the forced gate made me choose between three design systems (Stripe, Notion, Linear) before writing a line of CSS. That decision produced a `_theme-directions.html` comparison page. Without the hook, I would have written ad-hoc CSS and refactored it later — or not.

The hook works because it's enforced at the tooling level, not the memory level. There's no way to skip it by forgetting. That's the design.

---

## Handoff Between Sessions: Memory as the Connective Tissue

Nine sessions, each starting independently. Without a memory system, each one would require re-establishing context from scratch — project goals, architectural decisions, what's done, what's blocked.

The setup: `~/.claude/projects/-Users-jidong/memory/` holds per-project memory files. On session start, relevant memory is loaded automatically.

Session 3 (daemoon site build) is the extreme case: 6 tool calls, 5 minutes total. The opening question was *"What's left to do?"* — the immediate response covered the Vercel Blob storage flow and the 3-tab admin structure. That response came from memory accumulated across previous sessions, not from re-reading files.

The efficiency gain is asymmetric. Short sessions like Session 3 are only possible because longer sessions like Session 4 wrote durable memory. The 25-hour sessions are paying forward to the 5-minute ones.

---

## What Didn't Work

Session 8 hit a model resolution failure:

```
claude-fable-5[1m]: model not found. It may not exist or you may not have access.
```

The `[1m]` suffix is an extended context variant that wasn't available in that session's context. This is a sharp edge when working across multiple model configurations — a habit of running `/model` before starting any session would have caught this before 30 minutes of work went sideways.

---

## What's Still Open

Three significant items are unfinished:

**Coffee Chat**: Turso DB integration and PayPal webhook testing remain in development. The admin and payment UI is built; the production data layer isn't connected.

**Saju Global**: `landing-midnight.html` v3 is complete. Integration into the Next.js app hasn't started. The landing exists as a static file.

**AEO Outreach Engine** (`hermes-dashboard/aeo-engine`): Directory structure and module scaffolding exist. The actual prospect pipeline is not connected. This is scaffolding without data flow.

The pattern across all three: the session-driven approach delivers working code faster than I can integrate and test it. The bottleneck has shifted from writing to validation and wiring.

Next week is for connecting things, not building them.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
