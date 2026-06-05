---
title: "The Pipeline Codex Blocked 7 Times: Building 100-Lead/Hour Outreach Automation with Claude Code"
project: "portfolio-site"
date: 2026-06-06
lang: en
pair: "2026-06-06-portfolio-site-ko"
tags: [claude-code, automation, outreach, pipeline, codex-review, safety]
description: "15 sessions, 614 tool calls, 7 Codex review rounds to ship a multi-agent outreach pipeline that finds and drafts 100 cold emails per hour — without sending spam."
---

One bug in an email automation doesn't just break the feature. It sends spam to real people. That single constraint shaped every architectural decision in this build.

**TL;DR** Built a fully automated outreach pipeline for JDLab that discovers, validates, and drafts cold emails for 100 small businesses per hour. 15 Claude Code sessions, 614 tool calls, 7 Codex `VERDICT: BLOCK` rounds. Here's what broke, what the safety gates look like, and what the tool call logs reveal about how multi-agent pipelines actually get built.

## The Architecture: Eight Lanes, One Queue

The goal is specific: every hour, find 100 small businesses worldwide, identify a real copy problem on their website, and draft a personalized first-touch email. Targets are Shopify stores, local restaurants, service companies — places with websites that have genuine problems worth fixing.

Eight discovery lanes run in parallel: `shopify_selfhosted`, `us_google_local`, `yelp_local_service`, `tripadvisor_hospitality`, `linkedin_b2b`, `etsy_seller`, `amazon_seller`, `walmart_ebay`. Each lane gets its own subagent with a targeted discovery prompt. `build-jdlab-hourly-queue.mjs` aggregates results from all eight, scores candidates, and selects the final 100.

Parallelism here isn't premature optimization — it's necessary. Each lane has different discovery mechanics (search syntax, page structure, email extraction patterns), and running them sequentially would make the hourly window impossible to hit.

The hard constraint underneath all of this: a separate system called Hermes actually sends these emails via Gmail. The pipeline's job ends at queue creation. But if a bad lead gets into `outputs/approval_queue/`, it eventually reaches a real inbox. That's why validation is non-negotiable.

## The Dedup Problem Hiding in 529 Keys

The pipeline doesn't run once — it runs every hour, accumulating history. The longer it runs, the more likely a fresh discovery run surfaces businesses that were already contacted. Re-contacting someone is a spam complaint.

By session 4, the system had already processed 529 URL keys, 464 unique domains, and 383 email addresses across prior runs. Without dedup, discovery subagents keep re-surfacing the same high-visibility targets — popular Shopify themes, well-ranked Yelp listings, frequently indexed pages.

`build-jdlab-run-dedupe-index.mjs` solves this by scanning every prior queue file under `outputs/approval_queue/` before each run, generating a consolidated exclusion list. All 8 lane subagents read this index at startup, before any discovery work begins. Dedup happens at the input stage, not the output stage.

That distinction matters architecturally. Filtering at assembly means 8 subagents already did redundant work — they found, fetched, and processed leads that were going to be removed anyway. Passing the exclusion index into discovery changes what gets found, not just what survives.

Session 4 final output: pool of 123 candidates, 2 historical duplicates removed, 21 held for capacity reasons, final count 100. The log showed `0 duplicates against history` — the first clean run.

## The `$4,495` That Blocked 100 Emails

This is session 7's core bug, and it illustrates how validation rules interact with content generation in unexpected ways.

The validator (`validate-jdlab-queue.mjs`) hard-fails any draft containing a `$\d` pattern — dollar sign immediately followed by digits. The rationale is solid: pricing language in first-touch cold email is a reliable spam trigger and damages trust. First-touch emails shouldn't reference specific dollar amounts.

The problem: Claude was quoting prices directly from the business's own website as evidence of copy issues. A tourism business listing "$4,495 tour packages." A local experience company charging "$60 Voodoo Experience." These were legitimate copy diagnosis observations — the businesses themselves wrote these prices, and they signal pricing strategy worth discussing. But the validator's pattern matching doesn't have a "quoted from source" exception. A `$` followed by digits fails, full stop.

```
ValidationError: draft contains $4,495 — hard fail on $ + digit in first-touch copy
items affected: 6
```

Six leads blocked, causing the run to fail validation entirely.

The fix has two parts. First, a pre-filter in `build-jdlab-hourly-queue.mjs`: immediately after loading the full candidate pool, any item whose draft or copy diagnosis contains `$\d` gets moved to a `held_out` file before scoring begins. These items never reach the validator. Second — and more important — the `$\d` pattern detection was extracted into a shared utility function. Builder and validator now import identical logic from the same place. Before this change, both files had their own implementation. Divergence was guaranteed after any future update.

## Seven BLOCK Verdicts: What Each One Actually Fixed

Sessions 2, 6, 7, 9, and 12 all ended with Codex returning `VERDICT: BLOCK`. The pattern was consistent: Claude implements, Codex reviews read-only, the next session fixes the blockers. No BLOCK was wasted — every one pointed at a genuine issue.

Session 9's blockers are worth walking through because they illustrate the category of problems that emerge in pipeline automation:

**Lock recovery race condition.** The hourly cron uses a PID lock file to prevent overlapping runs. The lock removal logic had a path where an empty PID file — created by a crash at the wrong moment — would still trigger lock removal. The next run could start while a previous run was still active. Fixed by validating PID file contents before treating lock removal as safe.

**Same-run URL and email dedup missing.** Cross-run dedup (the 529-key index) was in place, but nothing prevented a single run from including the same URL or email address through different lane subagents. Lane A and Lane B could both surface the same Shopify store — different search paths, identical target. Fixed with a same-run seen-set check during queue assembly.

**Gmail draft script executable without `--allowlist` flag.** The Hermes Gmail integration required an explicit allowlist before drafts would be written. But the gate could be bypassed by calling the script in a specific invocation order. Fixed by making allowlist validation unconditional at script entry, regardless of call path.

Both `jdlab_draft_gate.test.js` and `jdlab_wrapper_safety.test.js` were written alongside these fixes. The meta-observation: the faster Claude implements, the more valuable external review becomes. Implementation speed and review rigor need to scale together. Running Codex after every major session isn't overhead — it's load-bearing.

## Claude Without Bash: The Session 12 Hardening

Session 12 introduced the most significant safety change in the build.

When Claude runs non-interactively inside a cron job, the threat model changes. There's no human in the loop to catch unexpected behavior. A malformed prompt or injected instruction could potentially cause Bash tool use — which in a cron context means arbitrary shell commands running as part of the pipeline.

The question: even with `Bash(*)` in `~/.claude/settings.json`, can you strip Bash access for a specific invocation?

The answer, demonstrated through two probe sessions, is yes.

Session 10: a probe prompt that should return only `PROBE_OK`. It did. Session 11: explicitly requested Bash tool use within the same hardened configuration. Response: `NO_BASH — Bash tool not available here`. Zero `tool_use` calls for Bash in the session transcript. Per-task configuration files combined with specific CLI flags override user-level settings. These two sessions are the before/after verification: session 10 confirms the channel works, session 11 confirms Bash is gone.

On top of this, `capture_critical_hashes()` was added to the Hermes wrapper. It snapshots SHA hashes of pipeline-critical files before and after every Claude invocation. If any protected file changes, the cron stops immediately. Claude's outputs are validated at the filesystem level, not just at the application level.

## Switching to Evidence: What WebFetch Changed

Sessions 1–12 relied on WebSearch for discovery and inferred email addresses from domain patterns and search snippets. Starting session 13, the approach shifted: WebFetch opens the actual page, and emails are only included if they appear directly in the rendered content.

Session 14 made 36 WebFetch calls. The results were different in kind from inference-based discovery.

Emails obfuscated as `info [at] domain [dot] com` go to `not_found` — they're intentionally hidden from scrapers, and contacting them through reconstructed addresses is poor practice regardless of validity. Only emails found as-is on the page go to `public_email`. Real typos like "INMERSE" instead of "IMMERSE," ambiguous CTAs like "email a picture for a quote" — these can only be confirmed by reading the actual page. WebSearch snippets reflect index-time snapshots and often miss the most relevant page sections.

Session 14 final sendable leads: `browser_verified` 34, `not_found` 66. 66 leads dropped because no public email could be confirmed. The queue was smaller but the quality was categorically higher — every lead had a confirmed email from the source page.

## Tool Usage Breakdown

15 sessions, 614 total tool calls:

| Tool | Calls | Purpose |
|------|-------|---------|
| `Bash` | 140 | Validation runs, script testing, file checks |
| `Read` | 103 | Schema verification, queue inspection, reference lookup |
| `WebFetch` | 94 | Direct lead verification (sessions 13–15) |
| `Edit` | 80 | Targeted file modifications |
| `Write` | 57 | Queue JSON generation, new config files |
| `WebSearch` | 50 | Initial candidate discovery |
| `TaskUpdate` | 40 | Progress tracking across sessions |
| `TaskCreate` | 24 | Session-level task planning |

13 existing files modified. 56 new files created. The ratio reflects a pipeline that grew through iteration — new scripts, new test files, new queue outputs — rather than a design that was fully specified upfront.

## What This Build Confirmed

**Validation loop tightness is the variable that determines shippability.** Seven Codex review rounds sounds like a lot until you consider what each BLOCK actually caught — race conditions, bypass paths, missing same-run dedup. Any one of those in production means a spam complaint or a lock file that prevents the next hour's run. The cost of tight review loops is time. The cost of skipping them is reputation damage that's hard to recover.

**Shared detection logic, not parallel implementations.** The `$\d` pattern bug happened because two places in the codebase independently checked for the same condition. One was the source of truth; the other drifted after an update. Extracting shared logic into a utility function is not refactoring for its own sake — it's removing the possibility of a class of bugs.

**Dedup at discovery time, not assembly time.** If the exclusion index is passed to subagents before they start finding leads, they return different results. If you wait until assembly to filter, you've paid for 8 subagents worth of redundant discovery work and gotten the same final output. The distinction matters at scale, and it affects the quality of what subagents actually find within their exploration budget.

**Evidence over inference at every stage.** WebFetch instead of WebSearch snippets. Hash verification instead of trusting nothing changed. Explicit `PROBE_OK` tests instead of assuming the configuration is correct. Each shift from inference to evidence adds latency but removes ambiguity from the system's behavior.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
