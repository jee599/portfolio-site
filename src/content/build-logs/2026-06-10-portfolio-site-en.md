---
title: "917 Tool Calls in One Session: Building a Dental Marketing Agent with Claude Code"
project: "portfolio-site"
date: 2026-06-10
lang: en
pair: "2026-06-10-portfolio-site-ko"
tags: [claude-code, agent, automation, dental-marketing, dynamic-workflow]
description: "How a simple 'show me the report' prompt turned into 70 hours, 917 tool calls, and a full dental marketing automation system built with Claude Code."
---

917 tool calls. 70 hours and 56 minutes of wall-clock time. 412 Bash executions, 232 file edits, 163 reads, 50 writes, 26 browser automation calls — all in a single Claude Code session.

This is the story of building a dental marketing automation system from scratch. It wasn't planned to be this large. It rarely is.

**TL;DR** Built `dental-clinic`, a context-aware agent for dental clinic marketing automation: owner-facing reports, a Naver blog image pipeline (GPT Image-2 + PIL), and ad performance analysis. Biggest lesson: a session with two context compressions runs at half efficiency. Split early, not late.

## A Single Prompt That Opened a Rabbit Hole

The initial prompt was about as simple as it gets:

> "Let's launch the dental report we were working on. Use Claude Chrome to verify it directly."

First wall: Naver SmartPlace bot protection. Naver is South Korea's dominant search and local business platform — think Google Maps + Yelp combined, but with aggressive anti-scraping measures. Automating data collection from SmartPlace wasn't going to work.

The pivot: use the Naver Search Advertising API for keyword data, and accept PDF/PNG screenshots from the clinic director for SmartPlace stats. Slower than automated collection, but it meant working with real data from the actual source instead of a scraped approximation.

That pivot ended up shaping the architecture for everything that followed.

## Three Reports Instead of One

The initial ask was one report. After hours of back-and-forth, there were three distinct documents:

**Owner's Diagnostic Report** — A summary of the clinic's current online presence: which channels are driving traffic, what's underperforming, and specific improvement directions. Readable by a non-technical clinic director without explanation.

**Internal Work Report** — The execution playbook for whoever runs the marketing. Ad budget allocations, keyword targeting strategy, prioritized action items with estimated effort and impact.

**Tracking Dashboard** — `~/dental-promo/_tracker/index.html`, deployed to Vercel so the clinic director can check current metrics from any device.

Each report cycled through 10 to 15 rounds of revision requests. "Logo at 60% size," "center-align this section," "more whitespace around the header," "make the font consistent throughout." These were valid feedback items — the visual consistency kept breaking between edits.

The root cause was writing raw HTML without a design system. Every revision introduced drift. Typography tokens weren't locked. Spacing values weren't variables. One edit fixed one thing and broke two others.

If the session had started by binding a minimal design system — or even just defining CSS custom properties for colors, spacing, and type scale — the revision cycles would have been cut in half. This is the main reason the session stretched as long as it did.

The lesson maps to any iterative UI work: the cost of skipping design system setup is paid in revision overhead. Every round of "make it consistent" is a deferred bill from not setting tokens at the start.

## Building the Blog Image Pipeline

For dental clinics on Korean platforms like Naver Blog, images aren't optional decoration — they're how content gets indexed and ranked visually. Analyzing top-ranking competitor blogs showed a consistent pattern: card-news format images, information-dense, clinic logo in the bottom corner, tight typographic consistency.

Card-news is a Korean digital content format — think Instagram carousel posts but for blog platforms, with structured information layouts rather than photography.

The initial approach used Gemini for illustration-style images. The quality was acceptable but the Korean text rendering was inconsistent. Switched to GPT Image-2 once it became available. The difference was noticeable: Korean label text on card-news images became reliable enough to use in production.

The `cardnews.py` pipeline:

```python
# Step 1: Generate base image with GPT Image-2
image = generate_with_gpt_image2(prompt, style_params)

# Step 2: Composite clinic logo using PIL
image = composite_logo(image, logo_path, position="bottom-right", opacity=0.9)

# Step 3: Filter medical advertising law violations
image = filter_medical_violations(image, text_content)
```

Step 3 is specific to Korean medical advertising regulations (의료법). Korean law prohibits certain claims in medical advertising — comparative effectiveness statements, before/after claims without clinical backing, and others. The filter checks generated text against a prohibited phrase list before the image is used.

This whole pipeline became the `dental-blog-image-pipeline` skill, reusable across any dental clinic project without modification.

## When Data Contradicts Your Assumptions

The starting hypothesis going into this project: Naver PowerLink ads are essential for a dental clinic. PowerLink is Naver's equivalent of Google Search Ads — paid listings at the top of search results.

Keyword research said otherwise.

Local search terms like `동백 치과` (Dongbaek dentist area) and `동백 임플란트` (Dongbaek implant) showed monthly search volumes around 10. Not 10,000 — 10. Pulling data on competing dental clinics in the same area: zero were running PowerLink ads. The traffic wasn't there to capture.

Meanwhile, the clinic's Naver Place page was pulling 915 monthly visits — but 80% of those came from direct brand searches: `유디치과`, `동백유디치과`. People already knew the clinic name and were searching for it directly.

The revised conclusion: PowerLink has no meaningful traffic to capture for this clinic's location and market. The actual opportunity is blog SEO — ranking for procedure-specific keywords like `동백 임플란트` through content, since those searches exist but have no competition.

This analysis became the most actionable section of the owner's report. Having the data — timestamped 2026-06-05, sourced from Naver's own keyword tool — made the recommendation concrete rather than advisory. The owner could see the numbers directly.

The broader lesson: "we should run search ads" is an assumption, not a strategy. The assumption was wrong here. Spending 30 minutes on keyword research before committing to an ad budget prevents weeks of wasted spend.

## Designing the dental-clinic Agent

As the session accumulated scope and the context window compressed once, then twice, one inefficiency became obvious: re-establishing per-clinic context from scratch at every new task.

The `dental-clinic` agent addresses this structurally. On session start, it reads:

- `~/dental-promo/{slug}/clinic.json` — clinic profile, ad account identifiers, baseline metrics
- `~/dental-promo/{slug}/history.json` — previous session work log
- `~/dental-promo/_kb/LESSONS.md` — accumulated lessons from all past sessions

After loading these, prompts like "write a Naver blog post for Dongbaek UD Dental" start with full context already restored. No re-briefing required.

The routing pattern in the global `CLAUDE.md`:
```
For dental-promo work: delegate to the dental-clinic subagent.
Main session handles: intent, approval gates (budget/publish/secrets).
Subagent handles: execution, worklog updates, lesson appends.
```

For continuing work on the same clinic within a session, `SendMessage` reuses the same agent instance to maintain context continuity instead of spawning a new agent and losing the accumulated state.

## 22 Parallel Agents for Market Research

On a separate project — FortuneLab, a Korean fortune-telling app — a different workflow challenge came up: comprehensive market research across multiple strategies simultaneously.

Researching 10 monetization approaches serially would take forever and risk context overflow. The pattern that worked: fan out 11 research topics in parallel, then verify each finding adversarially before accepting it.

```javascript
const results = await pipeline(
  TOPICS,
  topic => agent(`Research ${topic.name}`, { schema: FINDING_SCHEMA }),
  finding => agent(`Adversarially verify: ${finding.claim}`, { schema: VERDICT_SCHEMA })
)
```

Total: 22 concurrent agents, approximately 916k tokens across the workflow.

Running this as a single sequential agent creates two problems: context overflows before covering all topics, and findings from late topics get less rigorous treatment because the context is crowded with earlier material. Parallel research removes both constraints.

The adversarial pass matters more than it sounds. An agent tasked with researching "premium subscription revenue for Korean apps" will find numbers to support whatever the market can bear — confirmation bias is a real problem with LLM research. An adversarial agent tasked with *refuting* that number with counter-evidence produces more reliable estimates.

Each finding gets labeled: `verified` (passed adversarial check), `adjusted` (revised down after verification), or `unverified` (no adversarial pass possible, treat with caution). This labeling makes it explicit which numbers in the research are load-bearing and which are directional at best.

## What This Session Made Clear

**Context compressed twice = half efficiency.** The 917 tool call session had two mid-session context compressions. Work from earlier in the session became fuzzy — the specific decisions, the reasons for particular design choices, the context behind code structures. Continuing after two compressions means rebuilding context implicitly through later work, which introduces inconsistencies.

The fix is structural: split large work into sessions from the start. A session covering report design, then ad analysis, then agent architecture, then image pipeline is four sessions that could have been planned, not one session that grew organically and paid for it in context loss.

**Raw HTML under iterative revision diverges.** The design-system-free approach works for a first draft. It breaks down at revision 8. CSS variables as tokens, at minimum, need to be in place before the first feedback round. The open-design skill enforces this — the sessions where it was used had fewer revision cycles than the sessions where raw HTML was edited directly.

**Validate "obvious" strategies with data before committing.** The PowerLink assumption seemed self-evident — of course a business should run search ads. The keyword data was collected in 30 minutes and completely reversed the recommendation. The cost of not checking: potentially months of ad spend on keywords with single-digit monthly search volume.

---

Week total: 6 sessions, 1,000+ tool calls, 70+ modified files.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
