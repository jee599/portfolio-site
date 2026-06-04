---
title: "28 Claude Code Sessions, 125 Real Leads, 88 Email Drafts: Building a Global Sales Pipeline in One Day"
project: "portfolio-site"
date: 2026-06-04
lang: en
pair: "2026-06-04-portfolio-site-ko"
tags: [claude-code, automation, outreach, local-commerce-agent, gmail-api]
description: "How 28 Claude Code sessions turned a simple sales question into 125 verified leads and 88 personalized Gmail drafts—built and shipped in a single day."
---

By the end of the day, I had 125 verified small business leads scraped from the live web, 88 personalized Gmail drafts staged and ready for human review, and a suppression module that prevents re-contacting the same leads across future runs. I hadn't planned any of this when I woke up. It started with one question.

**TL;DR** — Using Claude Code as executor and Hermes as a relay orchestrator, I built `local-commerce-agent` in a day: schema-validated lead discovery, personalized email generation, and cross-run deduplication. ~500 total tool calls. 125 leads, 88 drafts, 59 passing tests, 0 blockers.

## The Question That Started Everything

"How can a solo Korean developer sell Amazon listing copy optimization to U.S. businesses—and what's the simplest way to get paid?"

That was the brief. I handed it to Claude Code as session 1. Sessions 1 and 2 (34 tool calls combined, ~34 minutes) were evidence gathering: research the market, identify payment rails, surface precedents. The output was `global_amazon_copy_payment_report.html`, `sources.json`, and `summary.md`.

Session 2 replicated the same research using only local cached evidence—no live web agents. Speed optimization: when the evidence already exists, don't fetch it again.

Session 3 was a Codex review pass. Codex flagged one blocking issue: the Upwork official page had returned 403 during scraping, but the report still marked it as "verified." That's a fabrication risk. Nine edits, five reads, and a patch later, every claim was tied to a live source.

This loop—Claude works, Codex reviews, Claude patches—repeated all day. Codex stays read-only. It never edits. That separation matters.

## Schema First, Data Second

Session 6 (30 tool calls, 11 minutes) is where the real architecture started. I created the `jdlab-global-copy-outreach` agent, but the first file I wrote wasn't an agent script—it was a JSON schema.

`jdlab_approval_queue_item.schema.json` defines exactly what a valid lead looks like: required fields, allowed enum values, no unexpected properties. Then I wrote `validate-jdlab-queue.mjs` to enforce it. Only after both existed did I start generating actual lead data.

The directory structure that emerged: `.claude/agents/`, `.claude/commands/`, `data/schemas/`, `scripts/`, `test/`—11 new files total.

Session 7: Codex returned `VERDICT: request-changes`. Three blocking issues:

1. `discovery_status` missing from the schema's `required` array
2. Free example count below minimum
3. No check for unexpected properties

Ten edits, five reads, five Bash calls. Fixed. The validator now catches anything a future agent tries to slip through.

This is the pattern. The schema isn't documentation—it's a gate. Every downstream artifact has to pass through it before it moves to the next stage.

## Running Four Parallel Agents Against Eight Channels

Session 8 (39 tool calls, 16 minutes) was the first live pilot. The constraint was explicit: no illustrative examples, no synthetic data. Only leads with verifiable public web presence.

Four research agents ran in parallel, each covering a different surface: Shopify stores, U.S. local service businesses, hospitality, Yelp listings, and B2B directories. After the agents returned 11 leads, the orchestrator independently re-verified every high-risk claim—five email addresses confirmed via `WebFetch` against their original pages before any artifact was written.

That verification step is non-negotiable. Agent output goes through independent re-confirmation before it becomes a file. This isn't distrust of the model; it's the architecture refusing to let fabrication compound across stages.

Session 9 (60 tool calls, 27 minutes—the longest of the day) scaled this to 100+. Six parallel research agents returned 125 items and 89 publicly listed email addresses.

One deduplication bug surfaced immediately: Amazon, Etsy, Walmart, and eBay were all keying on the same root domain, so marketplace listings were collapsing into a single entry. Switched to full URL path as the dedup key. Validator: 0 errors.

## The Reality of Generating 88 Personalized Emails

Session 16 (96 tool calls, 31 minutes) was the heaviest session of the day and the one I'd been building toward.

The goal: for each of the 89 deliverable leads, generate a Gmail draft that includes the business's actual hero headline (pulled from their live page), a specific Before/After copy suggestion, and a subject line personalized to their brand.

The generator, `rewrite-jdlab-draft-hooks-v2.mjs`, hit two gate failures during development:

**Failure 1** — When a brand name was all-caps, it leaked into the subject line as ALL-CAPS. Fixed with a `toTitleCase()` normalization step.

**Failure 2** — When the hero "before" sentence was long, it echoed twice in the email body, pushing the character count over limit. Fixed with a length-check conditional before the second insertion.

Hard constraint throughout: only `users.drafts.update`, never `users.drafts.send`. Nothing goes out without explicit human approval. The drafts sit in Gmail until someone clicks send.

Final count: 88 drafts staged. One lead was excluded during final quality filtering.

## Building Suppression Before the First Send

Sessions 22–24 (~80 tool calls combined) tackled a problem that's easy to ignore until it's embarrassing: what happens when tomorrow's cron job runs and re-contacts everyone from today?

`jdlab-suppression.mjs` normalizes URLs and email addresses (lowercase, strip `www`, canonicalize paths) and compares each candidate against all historical run files before including it in a new batch.

The tricky part: `lca_30_candidate_shortlist.json` belongs to a different project (LCA-* IDs), but a naive "any queue_type matches" rule was picking it up. Caught this via a reproduction test: 100 items all suppressed under `run: 'unknown'`. The root cause was the discovery batch files (original files without run IDs) being read as history. Fixed with a file-path-pattern exclusion list.

59 tests passing. Suppression works across runs.

## Auditing 88 Emails for Risk Before Handoff

Session 25 (15 tool calls, 10 minutes) was a quality audit. I piped all 88 email bodies through a Bash feature-extraction script to flag patterns: missing opt-out links, generic openers, dangerous claim language.

The risk-word scan produced two false positives:

- `ROAS` matched "roasted" in one business description
- `CTR` matched "electric" in another

The actual hits on `guarantee` and `#1` were both quoting the recipient's own existing copy back to them—legally fine and intentionally ironic. Manual review confirmed, both ignored.

Final classification: **65 good**, **23 ok** (generic opener, improvable but not blocking), **0 weak**, **0 blockers**. All 88 are ready for human review and send.

## What the Tool Call Distribution Tells You

Total tool usage across all 28 sessions: Bash ~120, Read ~70, Edit ~55, Agent ~15.

The Bash-heavy distribution reflects the architecture: lots of validation scripts, lots of data normalization, lots of file-pattern matching. Read-heavy because every stage re-reads schemas, history files, and source artifacts before generating anything new. Edit-heavy because Codex review cycles kept producing targeted patches. Agent-sparse because agents are expensive—they get dispatched for parallel research, not for everything.

The research → verify → patch cycle shows up directly in these numbers.

## What Actually Made This Work

Two things prevented this from becoming 125 fabricated leads and 88 generic cold emails:

**1. The schema gate.** Every lead has to pass `validate-jdlab-queue.mjs` before it can proceed. Agents can hallucinate; validators catch it. The schema isn't just type-checking—it enforces business rules: real email format, source URL required, no unexpected fields. Without this, the pipeline would have accumulated garbage silently.

**2. The orchestrator re-verification step.** After agents return results, the orchestrator independently re-fetches key claims from source pages before writing final artifacts. This breaks the trust chain at exactly the right point: agents gather, humans (or orchestrators acting as humans) verify, then files get written.

The pattern scales. Tomorrow's cron job will run the same pipeline, the suppression module will filter already-contacted leads, and the schema validator will catch anything the new batch of agents gets wrong.

The interesting finding from the day: the architecture that makes AI automation trustworthy at scale is the same architecture that makes human pipelines trustworthy—schemas, validators, separation of concerns, and explicit verification before commit.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
