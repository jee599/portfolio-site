---
title: "641 Tool Calls Later: Claude Code's WebSearch Hallucinates Email Addresses"
project: "portfolio-site"
date: 2026-06-07
lang: en
pair: "2026-06-07-portfolio-site-ko"
tags: [claude-code, automation, outreach, claude-opus]
description: "Running Claude Opus 4.8 nine times a day to automate cold outreach — and discovering that WebSearch fabricates email addresses and domain names."
---

Nine times a day, Claude Opus 4.8 wakes up and goes to work. Each session, it scans 15 prospecting lanes, visits real pages to collect on-page evidence, and drafts personalized copy-critique emails targeting 220 verified leads per run. One day of runtime: 9 sessions, 641 tool calls, roughly 3.5 hours.

**TL;DR** WebSearch's summarization model fabricates email addresses and domain names. If your pipeline trusts search snippets for contact info, you're sending to hallucinated addresses. WebFetch against the actual page is the only reliable verification step.

## What the Pipeline Actually Does

When `/jdlab-daily-cron` fires, Claude prospects for independent small businesses with publicly listed emails across 15 lanes: `us_home_services`, `us_food_cafe`, `us_pet_services`, `uk_ie_local_services`, `shopify_dtc`, and more. Each candidate gets a live page visit to verify the business exists and the email is real. Only verified leads get a personalized draft — pulling actual copy from the business's homepage to diagnose and rewrite.

Output is per-lane JSON: `{items:[...]}`. Each item carries the business name, email, an on-page quote, a Before/After copy critique, and a `conversion_fit_score`. A downstream builder reads this JSON to generate Gmail drafts. It passes every item through safety and quality gates — so one bad email address poisons the entire run.

## The Gap Between 220 and Reality

The target was `target=220` verified leads per session. Actual results: 10–19 per run.

This isn't agent failure. It's the actual distribution of the web. Most search results for local businesses point to Yelp, Google Maps, or booking aggregators — not directly to the business. Of businesses with their own domain, about half offer only a contact form. The other half have a publicly listed email. The agent updated this reality into its `jdlab-lane-reachability.md` memory file after each run.

Session 3 put it plainly in its own notes: *"Reaching 120 verified public emails requires 250+ successful page fetches — not achievable in a single session at honest quality."* The pipeline documented its own ceiling.

## The Discovery That Changes Everything

Session 7 surfaced the most important finding of the day.

WebSearch's summarization model generates plausible-but-wrong email addresses and domain names. Not occasionally — as a pattern. Real example from this run: a search snippet returned `austinpettingsservices.com` as the domain and `info@walkatx.com` as the contact email. The actual business domain was `austinpetsittingservices.com`. Different email too. The summarizer invented a coherent-sounding string that doesn't exist.

This breaks any pipeline that trusts search results for contact info. An email sent to a hallucinated address either bounces or — worse — lands in someone's inbox who has no idea why they received it. The fix is non-negotiable: every email address must be confirmed via WebFetch against the actual page. No exceptions for "the snippet looked right."

## One Character Is the Difference Between Delivered and Bounced

Session 1 showed the same problem at the character level. A business called Toyne showed `craig@` in the search snippet. Actual page: `admin@`. Hair Studio Day Spa had `hairstudiodaypa@gmail.com` in the snippet — one letter short of the real address.

The agent's own recorded principle after this: *"No unverified email is included in an automated send pipeline."* Leads that failed verification were logged as `not_found`. The pipeline didn't lower the bar to hit a number.

## WebFetch Has Its Own Constraint

Session 7 confirmed a second limitation. WebFetch redacts most emails to `[email protected]` for PII protection. So WebFetch alone can't always retrieve the actual address.

The working approach uses both signals together. Collect email candidates from search snippets — but treat them as unverified. Use WebFetch to confirm the domain and business exist. Cross-check whether the snippet email matches what appears in the page's raw HTML before redaction kicks in. Both signals have to agree before an item is included.

## Tool Call Breakdown

Across 8 sessions:

| Tool | Calls |
|------|-------|
| WebFetch | ~253 |
| WebSearch | ~135 |
| Write | ~128 |
| Read | ~35 |
| Edit | ~7 |

WebFetch ran nearly twice as often as WebSearch. The pipeline spent more time verifying than searching — which is exactly what honest outreach automation looks like.

## What Comes Next

The realistic throughput for this pipeline is 10–20 verified leads per run. The `target=220` figure reads as a stress test rather than a goal — useful for surfacing constraints, not a number to optimize toward blindly.

Two directions from here: diversify lanes and tune search queries to improve coverage, or accept the lower volume and invest more in each lead's personalization quality. Either way, the lesson from this run is the same — WebSearch summaries are a starting signal, not a source of truth. Treat every piece of contact information from a snippet as unverified until a live page confirms it.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
