---
title: "Claude Code Automation: What 14 Sessions and 700+ Tool Calls Taught Me About Email Discovery"
project: "portfolio-site"
date: 2026-06-07
lang: en
pair: "2026-06-07-portfolio-site-ko"
tags: [claude-code, automation, outreach, local-commerce, claude-opus]
description: "14 sessions, 700+ tool calls, Claude Opus running every hour. Target: 220 leads. Reality: 15. WebSearch hallucinates emails—I caught it fabricating domains."
---

14 sessions. 700+ tool calls. Claude Opus firing on a 1-hour cron, scraping public emails from small business websites around the world. By end of day, one thing was undeniable: WebSearch's summarization model makes up email addresses.

**TL;DR** I run a global outreach pipeline on `/jdlab-daily-cron`, firing every hour. Target per session: 220 verified leads. Real ceiling: 15–20. In session 7, I caught WebSearch fabricating both a domain name and an email that don't exist — in a pipeline that actually sends emails.

## How the Pipeline Works

When `/jdlab-daily-cron` triggers, Claude runs 15 discovery lanes in parallel. Each lane targets a specific segment of independent small businesses likely to have public email addresses: `us_home_services`, `us_food_cafe`, `us_pet_services`, `uk_ie_local_services`, `shopify_dtc`, `woocommerce_independent`, and more.

Each lane produces a `{items:[...]}` JSON file. Only leads that pass both a safety gate and a quality gate get aggregated into the final output.

Per-session output structure:
- `outputs/outbound_runs/{date}/discovery_batches/{run_id}/` — 15 per-lane JSON files
- `data/exports/{run_id}.csv` — input for the Gmail builder
- `outputs/sheets_payloads/{run_id}.json` — Sheets payload

The downstream builder is strict by design: one bad email address can compromise an entire send run.

## Seven Sessions Before 7AM: The Numbers

Here's the tool call breakdown for the morning outreach sessions:

| Time  | Duration | Tool Calls | WebFetch | WebSearch |
|-------|----------|------------|----------|-----------|
| 00:49 | 31 min   | 91         | 23       | 28        |
| 01:49 | 22 min   | 71         | 33       | 15        |
| 02:49 | 40 min   | 122        | 68       | 26        |
| 03:50 | 18 min   | 76         | 30       | 22        |
| 04:50 | 19 min   | 76         | 33       | 16        |
| 05:50 | 29 min   | 90         | 44       | 20        |
| 06:50 | 18 min   | 47         | 22       | 8         |

Session 3 stands out: 40 minutes, 122 tool calls, with WebFetch alone at 68. Verification was consuming more than twice the tool calls of discovery. That ratio is the core bottleneck.

## WebSearch Fabricates Emails — With Confidence

Session 7 surfaced the most important finding of the day.

WebSearch doesn't just retrieve — it summarizes. And in summarizing, it generates. The model produces email addresses and domain names that look completely legitimate but don't exist anywhere on the web.

Concrete example: the search summary returned domain `austinpettingsservices.com` and email `info@walkatx.com`. The actual business domain was `austinpetsittingservices.com`. The real contact domain was `walkatxpets.com`. The LLM generated plausible-looking strings — structurally valid, grammatically reasonable, factually invented.

The stakes: this pipeline actually sends emails. If I had trusted the WebSearch summary, dozens of outreach messages would have gone to non-existent addresses. After discovering this, every lead requires direct WebFetch confirmation — no exceptions.

## One Character Makes You a Spammer

Session 1 showed the other failure mode — near-misses from search snippets.

A business called Toyne showed `craig@` in the search snippet. The actual page had `admin@`. Hair Studio Day Spa appeared in the snippet as `hairstudiodaypa@gmail.com` — one character off from the real address.

Pipeline rule: unverified emails get recorded as `not_found`. The number doesn't get padded by lowering standards.

## WebFetch Redacts PII Too

WebFetch isn't a clean replacement. Session 7 confirmed: WebFetch replaces most email addresses in fetched HTML with `[email protected]`. The tool itself is redacting PII at the infrastructure level before the result reaches the agent.

The workaround is cross-validation. When a search snippet directly exposes an email *and* the WebFetch result independently confirms the same address, that double-signal gets through. Single-source results stay flagged as `not_found`.

## 220 Target. 15 Actual.

Every session ran with `target=220`. Every run delivered 10–19 verified leads.

This isn't an agent failure. The agent wrote this in session 3's log: *"Reaching 120 verified public emails would require 250+ successful page fetches. Honest quality in a single session makes this impossible."*

The structural reasons why 220 is unreachable:

**Aggregator dominance.** Most search results point to Yelp, Google Maps, and booking platforms. No direct email, by design — that's their business model.

**Contact form-only sites.** Roughly half of businesses with their own domain use contact forms exclusively. No email exposed anywhere in the HTML.

**JavaScript-rendered emails.** A large portion of the remaining half renders email addresses dynamically through JS, often with Cloudflare email obfuscation. The `a[href^="mailto:"]` the agent is looking for simply doesn't exist in the fetched DOM.

The per-lane reachability data accumulates in `~/.claude/projects/.../memory/jdlab-lane-reachability.md` after each session — so the next run inherits this understanding instead of rediscovering it from scratch.

## Running Two Automations in Parallel

While the outreach pipeline ran through the night and morning, a separate session executed a dental advertising research agent. 8 minutes, 26 tool calls. It accumulated Naver ad policy updates and local search ranking observations into persistent knowledge base files: `rolling-knowledge-base.md`, `source-index.md`, and `competitive-serp-observations.md`.

That session's finding: no new Korean healthcare advertising regulations since 2026-06-05. The ADVoost Screen DOOH notice (28168) — prohibiting digital out-of-home ads for medical clinics — was re-confirmed via full-text re-read.

Two completely different automation workflows, feeding different downstream processes, running in parallel on the same day.

## What's Next

The WebFetch verification bottleneck is still unresolved. 22–68 WebFetch calls per session for a 40–50% email capture rate is expensive. Next experiments:

- **Lane reprioritization** — rank lanes by historical email exposure rate, concentrate WebFetch budget where it actually returns results
- **Query pattern improvements** — target searches more likely to surface contact pages directly, reducing the aggregator-to-direct-site ratio in results

The ceiling of ~15 verified emails per session isn't a bug to fix. It's the actual market density of publicly-reachable independent businesses in these lanes. The question is whether the pipeline can find those 15 faster.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
