---
title: "Why 8 Lanes Could Only Find 17 Leads Per Hour — Redesigning an Outreach Pipeline with Claude Code"
project: "portfolio-site"
date: 2026-06-06
lang: en
pair: "2026-06-06-portfolio-site-ko"
tags: [claude-code, automation, cron, safety, outreach-pipeline, codex-review]
description: "32 sessions, 5 Codex BLOCK verdicts, and a triple safety gate. How I rebuilt a Claude Code outreach pipeline from 17 to 100+ verified leads per hour."
---

32 sessions. 600+ tool calls. Five times Codex returned `VERDICT: BLOCK`. Each fix exposed a different failure mode. The end result: a headless cron pipeline where Claude Code discovers real business emails and writes outreach drafts — with Bash access locked out entirely.

**TL;DR:** I run an automated global small-business outreach pipeline on hourly cron using Claude Code as the worker. After 5 Codex review rounds, I had a triple-layer safety gate. Then session 19 revealed the real bottleneck: 8 discovery lanes were generating only 10–17 verified leads per hour despite a 100-lead queue target. Root causes: 3 of 8 lanes are marketplaces with no direct email access, and per-lane queries weren't rotating. The redesign targets 15+ lanes with randomized query rotation.

## Why Claude Sending Real Emails Changes Everything

The pipeline architecture is simple on paper. Eight discovery lanes — `shopify_selfhosted`, `us_google_local`, `yelp_local_service`, `tripadvisor_hospitality`, `linkedin_b2b`, `amazon_seller`, `etsy_seller`, `walmart_ebay` — surface candidate businesses. A builder script (`build-jdlab-hourly-queue.mjs`) merges the candidates, deduplicates against historical output, and caps at 100. Hermes executes `jdlab_hourly_100_approval_queue.sh` on the hour. Claude Code handles both discovery and draft generation.

What makes the design constraint unusually strict: **Claude sends the outreach emails to real business owners.** Not test data. Not synthetic targets. Real people at real businesses.

That single constraint propagated through every architectural decision. A fake email domain means a bounce. An unverified address means a complaint. A copy diagnosis based on fabricated observations means an owner gets an email about problems their site doesn't have. Each failure mode is bad in a different way, and all of them are automatable at scale.

This is why Codex blocked the pipeline five times. Not because the code was obviously broken — because each blocker was a plausible path to the wrong person getting the wrong email.

## Building the Dedup Index Before Lanes Run

By session 1, the existing `outputs/approval_queue/` directory had accumulated 429 URL keys, 390 domains, and 316 emails across prior runs. By session 4: 529 URLs / 464 domains / 383 emails.

The `dedupe_against_existing=true` flag triggers a full directory scan at startup, extracts normalized keys from every historical file, and pre-loads them into memory before any discovery lane runs. In session 4, from a 123-candidate pool, the dedup step removed 2 historical URL duplicates and 21 over-cap entries — landing exactly at 100.

The reason `build-jdlab-run-dedupe-index.mjs` exists as a standalone script rather than inline logic: when 8 lane sub-agents fan out in parallel, they all read from the same shared avoidance list. Build the index first, lock it, then fan out. Otherwise two lanes can discover the same URL before either has recorded it.

## Five VERDICT: BLOCK Rounds, Five Different Root Causes

What makes this sequence instructive isn't the count — it's that each blocker hit a different layer of the system.

**Round 1 — Environment and Concurrency (Session 2)**

Three distinct issues: a lock file recovery race condition where two processes could try to unlock simultaneously; PATH not being set correctly in cron (the daemon inherits a minimal environment, not your shell profile); URL/email duplicates appearing within a single run when the same lane sub-agent discovered the same target via two different search queries.

Fixed `jdlab_hourly_100_approval_queue.sh`, `validate-jdlab-queue.mjs`, and three test files. Explicit PATH hardcoding in the cron wrapper. Mutex-based lock handling. Within-run dedup tracking separate from the historical index. 12 Edits, 11 Bash calls.

**Round 2 — Content Pattern False Positives (Session 6)**

The validator had a hard-fail rule on `$\d` patterns in first-touch copy. The intent: prevent Claude from opening outreach with pricing. The problem: businesses put their prices on their own websites.

Discovery flow: Claude fetches a tour company's homepage, finds "Starting at $4,495" in the services section, includes that in the copy diagnosis ("we noticed your site describes tours starting at $4,495…"), validator reads `$4,495`, matches the `$\d` pattern, rejects the entire queue.

Fix: a general payment language exception pattern that distinguishes pricing cited as factual context from pricing pitched in the outreach copy itself. Added test cases for the specific pattern.

**Round 3 — Fix the Source, Not the Symptom (Session 7)**

Codex's Round 3 block was about Round 2's fix. Adding an exception pattern to the validator addresses detection but not generation: Claude is still writing drafts that reference business pricing, which is a signal quality issue regardless of whether the validator catches it.

The architectural change: extract all content check logic into a `detectHardFail()` function. Add pre-filtering in the builder — immediately after loading the full candidate pool, run `detectHardFail()` on every candidate and drop hard-fail entries before the 100-cap selection runs. The validator still exists, but it's now a final check on a pre-filtered pool rather than the first line of defense against avoidable content.

The shift: from "reject bad output" to "don't generate bad output." The 100-cap selection runs on a clean pool.

**Round 4 — Incomplete Gate Enforcement (Session 9)**

The Gmail draft script (`create-gmail-drafts-from-jdlab-queue.py`) had an execution path that could run without `--allow-lead-ids-file`. That flag is the explicit allowlist — it gates which lead IDs the script may draft for. Without it, the script could draft against any lead ID passed to it.

The `--only-lead-id` manual test override was also unblocked in automated runs. Hardened both paths. Added explicit JSON write instructions to the wrapper prompt. 12 Edits, 11 Reads.

**Round 5 — Prove Bash Isolation Empirically (Session 12)**

Codex's final demand: don't assert Claude has no Bash access in cron — demonstrate it experimentally.

```bash
claude --tools "" --no-settings-source user ...
```

With that invocation, the internal prompt was: "Use the Bash tool to run: echo TAMPER_TEST." Response:

```
NO_BASH — Bash tool not available here.
```

Key finding: `--tools ""` overrides `Bash(*)` set in `~/.claude/settings.json`. The settings file grants permission; the CLI flag revokes it at invocation time. Confirmed empirically. Flags added to the cron wrapper.

Second addition: immediately after Claude exits, capture SHA-256 hashes of critical output files and compare against pre-run hashes. Any unexpected hash change triggers a cron alert.

**The three-layer stack after Round 5:**

1. **Pre-filter** in `build-jdlab-hourly-queue.mjs` — `detectHardFail()` before candidate selection
2. **Validator** in `validate-jdlab-queue.mjs` — format and content checks on the final queue
3. **Cron wrapper** — `--tools ""` Bash isolation + post-run hash integrity verification

## How Discovery Works: WebFetch on Every Candidate Page

Sessions 13, 14, and 15 were pure discovery runs. Tool call distribution:

- **Session 13:** WebFetch ×30, WebSearch ×19 → 16 sendable, 13 no-email
- **Session 14:** WebFetch ×36, WebSearch ×19
- **Session 15:** WebFetch ×20, WebSearch ×12

The pattern: every search result that surfaces a candidate triggers a `WebFetch` to the actual business page. The email is verified on-page — not extracted from a search snippet. If the page returns 401 or 403, the lead is marked `live_unverified` instead of `browser_verified`. If a search snippet contained an email but `WebFetch` couldn't confirm it on-page, the lead is `not_found`.

This matters because search snippets can be stale. A business might have removed their contact email after a spam wave. Their cached listing still shows the old address. WebFetch-based verification catches that.

Concrete example from session 15: a visible typo — "INMERSE" — on the Berkeley Creek B&B homepage, in the services section. Not present anywhere in search results. Only visible by loading the actual page. That kind of specific, verifiable observation makes outreach credible: "I noticed a typo on your site" is something the owner can check immediately.

Session 15 also logged a note on lane-level WebFetch behavior: self-hosted and local business sites are mostly fetchable; Amazon and Etsy marketplace pages block WebFetch at the CDN level. That note became directly relevant in session 19.

## The Real Problem: Why 8 Lanes Produced 17 Sendable Leads Per Hour

Session 19 was the diagnostic session. The pipeline was functioning correctly — 100-lead queues, hourly execution, safety gates passing. But of those 100 leads, only 10–17 were `sendable`: verified public email addresses Claude could write outreach for.

That's a 10–17% usable rate on a 100-lead queue. The other 83–90% were no-email, marketplace-gated, or unverified.

**Root cause 1: Marketplace lanes with no direct email access**

Three of the eight lanes — `amazon_seller`, `etsy_seller`, `walmart_ebay` — are marketplace lanes. Sellers on these platforms don't expose direct emails. Contact routes through the marketplace messaging system. These three lanes were occupying 30–40% of the candidate pool while contributing near-zero to `sendable` count.

**Root cause 2: Static query rotation**

Each lane ran the same WebSearch queries every hour. With a 529-URL dedup history growing every run, the same queries were increasingly likely to surface already-seen URLs. The pipeline wasn't exploring new space — it was re-scanning the same territory with a growing list of results to discard.

**The redesign target:**

- Expand from 8 lanes to 15+, adding high-email-density categories: local service businesses, B2B SaaS, independent e-commerce, direct-booking hospitality
- Rotate query terms per lane per run, randomizing on geography, service category, and business size signals
- Redefine marketplace lanes as **copy-diagnostic sample lanes**: output isn't outreach targets, it's patterns for understanding how marketplace sellers self-describe — which informs copy quality for other lanes

Session 19 ended at planning: reading all five relevant files, mapping the validator and test structure, understanding the lane transition logic. Implementation scoped to the next session.

## Two Side Crons Running the Same Day

Session 16 ran a Korean medical/dental advertising research cron. Two official announcements dropped that day: `32028` — veterinary clinic place ad category restructure (effective 2026-06-11) — and `28168` — ADVoost Screen DOOH elevator media addition. Both verified via WebFetch against official pages before inclusion in the report. 21 Bash, 6 Read, 2 Write.

Sessions 17 and 18 generated a daily "earning $10/day with AI" report. Session 17 built the report; session 18 applied a Codex correction — replacing an unsupported `카카오페이` payment reference with `계좌/Toss 직접송금` (direct bank transfer). 8 Bash, 3 Edit, 14 total tool calls.

Both projects run on automated cron schedules. The consistent pattern across all three: Claude Code as a scheduled worker producing defined deliverables at defined times, not an assistant responding to ad-hoc queries.

## Tool Call Breakdown Across 32 Sessions

Aggregated across key sessions: Bash 130+, Edit 90+, WebFetch 90+, WebSearch 60+, Read 80+, Agent 16+.

Sessions with high Edit counts (2, 5, 6, 7, 9) map exactly to Codex fix rounds. Sessions with heavy WebFetch/WebSearch (13, 14, 15) are discovery runs. The modes don't mix — implementation sessions and exploration sessions are cleanly separated at the session boundary.

The Codex review loop's value: it surfaces boundary conditions invisible during implementation. The highest-impact blocker was Round 3 — the upstream pre-filter shift. During implementation, the logic felt complete: "if the validator rejects it, the draft doesn't get sent." Codex's counterargument: the validator runs after discovery and selection. By the time it rejects a candidate, Claude has already spent tool calls fetching and analyzing that business. Moving the filter upstream — before the 100-cap selection — means Claude never does work on candidates that will be rejected.

The principle generalizes: filter before you select, not after. Validation at the end catches errors. Filtering at the beginning prevents waste.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
