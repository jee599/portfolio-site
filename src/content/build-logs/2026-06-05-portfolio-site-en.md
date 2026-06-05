---
title: "611 Tool Calls in One Day with Claude Opus 4.8: Saju App Globalization, a PayPal Boundary Bug, and a Race Condition"
project: "portfolio-site"
date: 2026-06-05
lang: en
pair: "2026-06-05-portfolio-site-ko"
tags: [claude-code, opus-4-8, multi-agent, paypal, saju, workflow]
description: "17 sessions, 611 tool calls, 4 projects in one day with Claude Opus 4.8 — from a 195-call saju app globalization to a PayPal 25-char boundary bug."
---

611 tool calls. 17 sessions. 4 projects. All on `claude-opus-4-8`. The day started with dental ad research and ended with a Korean fortune-telling SaaS wired up for international payments.

**TL;DR** The largest single session globalized a saju app — 3 hours 49 minutes, 195 tool calls, 9 parallel agents running code audits and market research simultaneously. Along the way: a PayPal `invoice_number` field that silently overflowed its 25-character limit in production but not in tests, and a file-based design gate that blew up the moment two sessions ran concurrently.

## 17 Sessions, 611 Tool Calls — Here's the Breakdown

Four projects across ~6 hours 40 minutes of active session time:

- `dentalad` — daily dental ad marketing research update with HTML report output
- `ai-10-dollar-june` — daily report tracking first $10 revenue from AI tooling
- `local-commerce-agent` — JDLab global outreach pipeline + PayPal API integration + product image production
- `saju_global` — Korean fortune-telling (saju) app globalization via ultraplan

Tool distribution across all 17 sessions: Bash 255, Read 157, Edit 103, Write 55. More execution than exploration — the ratio signals a day weighted toward implementation and iteration rather than investigation. When Bash dominates, things are getting built and tested, not just read.

The saju session alone consumed 3 hours 49 minutes of that 6:40 total. The remaining 2:51 covered everything else. One session dwarfed the rest.

## The Saju Session: 9 Parallel Agents, ~785K Tokens of Analysis

Session 14 was the anchor for the whole day. The prompt that kicked it off:

```
Check the saju project end-to-end — is it ready to sell globally?
Payments, all logic working correctly, which countries, how to market/advertise...
```

`/ultraplan` failed immediately. Same error that shows up whenever you forget to run from a git repo:

```
ultraplan: cannot launch remote session —
Background tasks require a git repository (checked: /Users/jidong).
```

Moved into the `saju_global` directory. Ran again. This time it launched and called `Workflow` to spawn 9 agents in parallel:

**Code audit agents (4):**
- Payment logic — PayPal and Lemon Squeezy flow coverage, edge cases, error handling
- Saju engine and astrological calculation accuracy
- i18n and legal requirements (GDPR across EU, Japan's Tokushoho Act for e-commerce disclosures)
- Conversion funnel and user flow end-to-end

**Market research agents (5):**
- Global landscape and competitive analysis
- Japan market specifically (high-context for saju content, legal requirements for digital commerce)
- Southeast Asia (Vietnam, Thailand, Indonesia — cultural appetite for fortune-telling content)
- India and Chinese-speaking markets
- Western channels, unit economics, acquisition cost estimates

Running these in parallel matters for a reason that isn't obvious until you've done it the sequential way: a single agent asked to cover all nine of these areas in sequence will trade depth for breadth. It gets halfway through Japan and pivots to Southeast Asia before finishing. The parallel run lets each agent go deep on its specific domain with no context pressure from the other eight.

Total output: ~785K tokens of analysis. Parsing the 161K-character result into actionable items and actual code changes touched 30+ files.

## The Pivot That Rewired the Payment Architecture

Midway through the session, the scope shifted completely.

"I won't do Korean payments. Just start with international."

That's not a cosmetic change. The payment architecture had been built assuming Toss (domestic KR) as a primary rail alongside PayPal and Lemon Squeezy. Dropping Toss from the active flow changed which rail was primary, how the checkout routing worked, and which compliance requirements were now the front line.

The Toss pages (`checkout/toss/page.tsx`, `checkout/toss/success/page.tsx`) were preserved — logic intact, but gated as KR-only and flagged as temporarily inactive. PayPal and Lemon Squeezy moved up as the primary international rails. No code deleted; the architecture just shifted which path was lit.

Components added in this single session:
- `CookieConsent.tsx` — GDPR consent collection before any tracking fires
- `AnalyticsGate.tsx` — blocks all analytics calls until consent exists
- `UsageCounter.tsx` — free usage counter displayed in the UI
- `data-request/page.tsx` — GDPR Article 17/20 data request page (required for EU users)
- `tokushoho/page.tsx` — Japan Tokushoho Act disclosure page (legally required for any paid commerce in Japan)
- `cron/retarget/route.ts` — retargeting email cron triggered on checkout abandonment

At the end of the session: "Yeah, push it and merge into main." Branch state confirmed, merge executed. Done.

Two strategy documents also came out of the same session: `FORTUNELAB_GTM_US_SEA_PLAYBOOK.html` and `FORTUNELAB_REVENUE_PLAN_2026-06.html`. Not code — execution playbooks for how to acquire users and monetize across Western and Southeast Asian markets. The 9-agent research pass fed directly into these.

## The PayPal 25-Character Bug That Automated Tests Missed

Session 4 built the PayPal Invoicing v2 API integration. Session 5 fixed a blocking issue that a Codex review pass surfaced the following morning.

The `invoice_number` field in PayPal's API has a hard 25-character limit. Exceed it and the API returns an error. The bug was in how the invoice number was constructed across different code paths.

In the dry-run path, the generated invoice number was exactly 25 characters. Tests passed. But in the live path, a timestamp suffix gets appended to distinguish real invoices from dry runs:

```
dry-run:  JDLAB-MADEINN-VT-20260605       → 25 chars (exactly at limit)
live:     JDLAB-MADEINN-VT-20260605-114827 → 32 chars (PayPal API error)
```

The dry-run landing at exactly 25 characters was the signal that got missed. When your test path hits the ceiling exactly, you have zero margin — and if any production path adds a suffix, you're already over. The correct read was "this is dangerous." The actual read during implementation was "this passes."

Codex's review, done as a read-only pass with no implementation context, flagged it: the dry-run number is exactly at the limit, and the live path clearly adds characters. This is a boundary violation waiting to happen.

Fix: compact format shortening the number to leave room for the live suffix, plus a batch-level assertion in the test suite that explicitly validates the 25-char cap at both paths. 16 tool calls total (Edit 6, Read 5, Bash 5). Resolved in 4 minutes.

The broader pattern repeated three times that day. Sessions 5, 7, and 16 were all short fix sessions born from the same loop: Claude implements, Codex does a read-only review, Codex surfaces a blocker, the next session resolves it. External reviewer with no implementation bias sees what the builder couldn't.

## The Design Gate Race Condition

Session 6 ran into something that had never appeared before.

This project runs a shell hook that requires an "Open Design equivalent" acknowledgment before any `.html` file can be written. The mechanism: `design-pass.sh` writes the current session ID to a `design-gate.ok` file. Before writing HTML, the gate reads that file and checks that the session ID matches.

Session 6 completed the acknowledgment. The gate blocked again immediately.

The diagnosis:

```
shared gate state has a cross-session race —
a concurrent session (a45e846e, jidonglab-site) consumed my ack
and set design-gate.ok to its own session id.
```

A different session running concurrently — working on the `jidonglab-site` project in a separate terminal — read the same file, wrote its own session ID, and overwrote the acknowledgment. Last write wins. Session 6's clearance was gone.

The immediate fix: re-acknowledge in session 6 and proceed. The structural fix — replacing the single-file write with a session ID stack or per-session lockfiles — would have required redesigning the hook. That's a separate task, not something to refactor mid-session when you're in the middle of something else.

This failure mode is invisible when you run one session at a time. It surfaces only under concurrent sessions writing to the same shared file. On a day with 17 sessions, some overlapping across projects, that's not an edge case — it's just what the environment looked like.

The lesson is sharp: if a hook writes to a shared file, it needs to be designed for concurrent writers from day one. The assumption of single-session sequential execution is a hidden invariant that breaks the moment the real usage pattern diverges from it.

## Why the Same Product Image Got Rebuilt Four Times

Sessions 10 through 13 all worked on the same artifact: PayPal payment link product images. Each session iterated on the previous result rather than starting over.

**Session 10**: Built a Python SVG generator with a headless Chrome rasterize pipeline. Output format: 1200×1200 PNG for PayPal's product image requirement. First version used a blue accent (`#2348DA`) and a `yourstore.com` placeholder site.

**Session 11**: Replaced the placeholder branding with jidonglab.com's actual identity. Used WebFetch to pull real colors (`#00c471` green), actual copy, and service names directly from the live site. "yourstore.com/product/soy-candle" became real jidonglab service descriptions.

**Session 12**: Added English deliverable details — buyers needed to see clearly what they'd receive. Each image now includes a deliverable list (what's in the report), section breakdown, and page count. The visual went from brand-focused to content-focused.

**Session 13**: "Dense report feel." Swapped the sparse card layout for a packed preview layout — more content per image, heavier visual weight, closer to how a consulting deliverable looks than a product card.

After each session: render with headless Chrome, verify the image is legible at actual thumbnail sizes (200px and 96px — the sizes PayPal displays in checkout). No Playwright available in this environment; ran the Chrome headless shell binary directly via subprocess.

The structural point here is the pipeline design from session 10. The chain — `build.py` → SVG generation → Chrome rasterize → PNG output — was built once and never touched again. Sessions 11–13 replaced only `build.py`. The renderer was stable infrastructure; the content generator was the variable.

This is the pattern that made each iteration fast. Each session was roughly 10 minutes because the pipeline already worked. Without it, each session would have been rebuilding the render chain from scratch — easily 30+ minutes per iteration on a four-iteration task.

## What the Day's Numbers Show

**Parallelizing agents increases both coverage and depth.** The saju ultraplan ran 4 code audit agents and 5 market research agents simultaneously. A single sequential agent given the same scope would have had to trade depth for breadth — finish Japan before starting Southeast Asia, cover payments before covering GDPR. The 9-agent parallel run got full depth on all nine areas because each agent had no context pressure from the others.

**Building a pipeline once makes repetition cheap.** The PayPal image went through 4 full iterations. With the pipeline in place, each was ~10 minutes. Without it, rebuilding the render chain each time would have been 30+ minutes per session. The upfront investment in session 10 paid back immediately on session 11, and kept paying through 12 and 13.

**File-based shared state doesn't survive concurrent sessions.** The design gate worked correctly for months under single-session usage. It failed the first time two sessions ran simultaneously and both needed to write the same file. Shared mutable state that assumes sequential access is a ticking clock on any workflow that might ever parallelize.

**External review catches boundary bugs that tests pass.** The PayPal 25-char bug is the canonical example: dry-run at exactly 25 characters looks like a passing test. An external reviewer with no implementation context looks at that same number and sees danger. The gap between "tests pass" and "correct" is exactly where a second perspective earns its cost.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
