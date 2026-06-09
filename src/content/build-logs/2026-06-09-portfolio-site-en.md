---
title: "Claude Code Ran 34 Sessions to Find Business Leads — WebSearch Was Hallucinating Email Addresses"
project: "portfolio-site"
date: 2026-06-09
lang: en
pair: "2026-06-09-portfolio-site-ko"
tags: [claude-code, automation, ai-agent, outreach]
description: "Built a global local business outreach pipeline with Claude Code: 34 sessions/day, 220 lead target, 15-20 verified emails. Found WebSearch hallucinating email addresses — fixed with mandatory WebFetch verification."
---

34 times today, Claude Code autonomously discovered global local businesses. Each session fired 47–122 tool calls. The target was 220 new leads per hour. The actual verified count: 15–20 emails.

**TL;DR** I automated a global cold-outreach pipeline using Claude Code across 15 business lanes. Critical finding: the WebSearch summarizer model hallucinates email addresses. Mandatory WebFetch verification on the source page is the only way to make the pipeline trustworthy.

## The Pipeline: 15 Lanes Running Every Hour

The `/jdlab-daily-cron` command triggers every hour with these parameters:

```
target=220
dedupe_against_existing=true
voice=human_specific_professional_trust_building_hooked_free_mini_diagnosis
```

Fifteen lanes run in parallel: `us_home_services`, `us_food_cafe`, `us_salon_spa`, `us_pet_services`, `us_auto_services`, `us_hospitality_bnb`, `us_wedding_events`, `specialty_retail_classes`, `shopify_dtc`, `woocommerce_independent`, `wix_squarespace_studio`, `b2b_service_firms`, `ca_local_services`, `uk_ie_local_services`, `anz_local_services`. Each lane produces a JSON file. A central validator applies schema checks and a safety gate before passing records to the email builder.

The execution order Claude Code follows every session is fixed: read schema and validator → WebSearch for candidate discovery → WebFetch to confirm emails on the actual page → write lane JSON → generate summary report. Session 1 established this flow; the other 33 sessions ran the same pattern.

## The Gap Between 220 Leads and Reality

In session 3, the agent explicitly documented the mismatch itself:

> "120 verified public emails would require 250+ successful fetches, which isn't feasible at honest quality in one session."

The yield math explains why. When WebFetch reads a page, roughly 40–50% expose a public email. The rest are contact forms, phone-only, or 403/404 errors. Running 30–40 WebFetch calls per session realistically produces 12–20 verified emails.

The 220-lead target is structurally unachievable. What matters is that the pipeline reports this honestly. The agent never pads unverified emails to hit the number — it records the real count and explains the gap.

## WebSearch Was Inventing Email Addresses

Session 7 surfaced a critical failure mode. The WebSearch summarizer model synthesizes email addresses and domains that don't match reality.

Actual cases caught:

- Real domain `austinpetsittingservices.com` → summarizer output `austinpettingsservices.com`
- `walkatxpets.com` returned with email `info@walkatx.com` (address doesn't exist)
- Search snippet showed `craig@toyne.co.uk` → real page had `admin@toyne.co.uk`

The last case is the worst kind. The summarizer generated a plausible email — not from a cached page, not from a stale index, but synthesized. In an auto-send pipeline, this means sending email to a person who never listed that address. The session 7 agent wrote directly to memory:

> "The summarizer model invents plausible-but-wrong emails/domains. Recording this critical calibration point."

From that session forward: WebSearch snippets are only for candidate discovery. Every email must be confirmed via WebFetch on the original page.

## Why WebFetch Verification Is Non-Negotiable

The rule is simple. Every lead goes through WebFetch to read the actual page and extract the email there.

One additional wrinkle: WebFetch sometimes returns emails as `[email protected]` — Cloudflare email obfuscation combined with PII filtering. When that happens, the lead is marked `not_found` and dropped.

A lead only makes it into a lane file if it satisfies three conditions: a real email address confirmed via WebFetch, a headline or copy excerpt read directly from the page (the basis for the diagnosis), and a Before→After copy suggestion (the quality gate condition). Missing any one of these and the validator rejects it.

Session 1 showed this discipline working immediately. Toyne's real address was `admin@toyne.co.uk`, but the search snippet showed `craig@toyne.co.uk`. Without verification, the wrong address would have shipped. The agent recorded: "The verification discipline is already proving its worth."

## Lane-by-Lane: Where Emails Actually Surface

After 34 sessions, lane-specific patterns are clear from the data.

**High email exposure:**
- `us_home_services` (electricians, plumbers, painters) — independent operators who run their own sites and list their email directly
- `us_food_cafe` (independent cafes and restaurants) — same pattern; owner-operated
- `b2b_service_firms` (small IT shops, MSPs) — business development contact is their core CTA

**Low email exposure:**
- `us_wedding_events` — heavily dependent on booking platforms that sit in front of direct contact
- `us_pet_services` — high rate of Cloudflare email obfuscation
- `anz_local_services` — booking portals dominate, direct sites are sparse
- `uk_ie_local_services` — contact-form-only is disproportionately common

`us_hospitality_bnb` sits in the middle. It requires filtering out large chains and Airbnb listings before independent BnB operator emails appear. These patterns accumulate in `jdlab-lane-reachability.md` and feed into the discovery strategy for the next session's runs.

## What 34 Sessions Taught Me About AI Agent Design

This wasn't a coding project in the usual sense. I gave Claude Code a prompt and operated the pipeline. The design lessons came from watching what the agent did under pressure.

**Design for honest failure, not optimistic reporting.** When the target doesn't match reality, the agent needs permission to say so. `target=220` is in the prompt, but the agent logged why it's unreachable and stored that in memory. Without that, the pipeline fills in unverified data to hit the number. That's worse than useful.

**In an auto-send pipeline, data quality beats code quality.** One hallucinated email from WebSearch means a real person receives a message they never consented to. No amount of clean code recovers from bad input data. The WebFetch verification step isn't a nice-to-have; it's the thing that makes the pipeline acceptable to run.

**Tool call counts reveal actual work density.** Session 3 hit 122 tool calls; session 7 hit 47. Sessions with a higher WebFetch ratio produced more trustworthy leads. The raw number isn't the metric — the ratio of verification calls to discovery calls is.

<div class="change-summary">
<table>
<thead><tr><th>Metric</th><th>Target</th><th>Actual</th></tr></thead>
<tbody>
<tr><td class="label">Leads per session</td><td class="before">220</td><td class="after">15–20</td></tr>
<tr><td class="label">Email source</td><td class="before">WebSearch snippet</td><td class="after">WebFetch on source page</td></tr>
<tr><td class="label">Hallucinated emails</td><td class="before">Passed through</td><td class="after">Dropped by validator</td></tr>
<tr><td class="label">Lanes</td><td class="before">—</td><td class="after">15</td></tr>
<tr><td class="label">Total sessions</td><td class="before">—</td><td class="after">34 / day</td></tr>
</tbody>
</table>
</div>

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
