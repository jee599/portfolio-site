---
title: "20 Sub-Agents, 159 Tool Calls: Researching a Market in One Day with Claude Code"
project: "portfolio-site"
date: 2026-04-21
lang: en
pair: "2026-04-21-portfolio-site-ko"
tags: [claude-code, multi-agent, research, automation]
description: "How I used 20 parallel sub-agents to validate a market entry hypothesis for Korean dental advertising — and why a V2 validation pass is non-negotiable."
---

20 sub-agents. 159 tool calls. A session that ran 75 hours and 57 minutes. One question: can AI break into the Korean dental advertising market?

**TL;DR** — I deployed 12 research agents in parallel, then ran a second pass with 8 validation agents. The V2 pass caught a legal showstopper that would have killed the business model. Here's exactly how that worked.

## The Brief That Started It

A Telegram message, roughly translated:

> Research every profitable Korean company doing hospital/dental advertising. What strategies do they use? What actually drives results? Find everything I could automate or do better with AI. Use 10+ sub-agents, format as reports, push to Git, and ping me when done.

The goal was market validation, not just information gathering. I dispatched 12 agents in parallel, each owning a distinct domain.

## Round 1 — 12 Agents, 12 Domains

| Agent | Coverage | Output |
|-------|----------|--------|
| 01 Top agencies | Top 10 Korean medical ad agencies | 2,636 words |
| 02 Naver SEO | Naver ranking optimization services | ~2,800 words |
| 03 Naver SA | PowerContent & Search Ad agencies | 3,000–3,500 words |
| 04 SNS performance | Medical social performance agencies | ~3,200 words |
| 05 Influencer/viral | Medical influencer marketing landscape | 2,642 words |
| 06 Medical ad law | Korean medical advertising law (2026) | 3,163 words |
| 07 CRM/SaaS | Hospital CRM & booking SaaS market | 2,649 words |
| 08 Content tools | AI content generation tool landscape | 2,961 words |
| 09 Dental specialty | Marketing strategy by dental specialty | 3,308 words |
| 10 Global AI medical | Global AI medical marketing trends | 3,000–4,000 words |
| 11 Top 5 deep dive | In-depth analysis of 5 profitable firms | ~3,479 words |
| 12 Latest dental news | Korean dental industry news, 2026 | 2,688 words |

Each agent had a target word count (2,500–3,500), a specific output path under `/Users/jidong/dentalad/ads-research/reports/`, and 3–5 concrete questions to answer. Because they ran in parallel, the wall-clock time for all 12 was roughly the same as running one.

## Why a V2 Pass Is Not Optional

After the first pass, the follow-up ask was:

> Hire as many sub-agents as needed (efficiently). Validate, supplement, and improve the existing reports. My goal is to enter the existing ad industry with AI.

First-pass research sweeps wide. That's a feature, but it comes with predictable failure modes:

- **Stale data** — 2024 numbers presented as current 2026 figures
- **Pricing drift** — SaaS pricing pages change constantly; agents pull cached data
- **Legal lag** — regulatory updates that post-date the agent's training cutoff

8 V2 agents addressed these directly:

- `A1` Agency fact-check — expanded to 5,424 words, the largest single output
- `A2` Naver 2026 validation — incorporated Cue algorithm changes as of 2026-04-09
- `A3` Legal stress-test — specifically tasked to find showstoppers
- `A4` CRM global pricing — corrected an error in Weave's base pricing
- `A5` Content specialization ROI — recalculated using actual Claude Sonnet 4.6 API costs
- `A6` SNS influencer risk — verified Reels CPM figures
- `A7` Seoul dental prospect list — Top 50 clinics across 8 districts, quantitative filters applied
- `A8` MVP architecture + cost model — rebuilt using current Claude API pricing

## The Showstopper A3 Found

A3 was the most important output of the entire session. The legal stress-test agent found that **CPA (cost-per-acquisition) billing is legally problematic under Korean medical advertising law** — it creates complicity risk for the ad platform if the underlying ad violates regulations.

The first-pass report hadn't flagged this at all.

Getting the pricing model wrong at the MVP stage doesn't just hurt margins — it can make the business impossible to operate legally. A3 returned three showstoppers. That single finding changed the shape of the product.

## The Prompt Pattern That Works

Vague instructions produce vague outputs. The agents that returned the best results had four things specified explicitly:

```
Goal: Research report on [specific domain]
Length: 2,500–3,500 words
Save to: /Users/jidong/dentalad/ads-research/reports/[number]-[slug].md
Required sections: [3–5 specific questions]
```

For A3, I added one extra instruction: "Find showstoppers — anything that would make this business legally or operationally impossible." That framing was what produced the CPA finding.

## Final Output Structure

```
dentalad/ads-research/
├── reports/          # 12 first-pass research reports
├── v2/               # 8 validation reports
├── EXECUTIVE-SUMMARY.md
├── FINAL-REPORT.md
├── ACTION-ITEMS.md
├── RISKS.md
└── 00-AI-AUTOMATION-ROADMAP.md
```

`FINAL-REPORT.md` and `EXECUTIVE-SUMMARY.md` were synthesized directly from all 20 agent outputs. Action items extracted automatically.

## Tool Call Breakdown

| Tool | Count |
|------|-------|
| Bash | 49 |
| Telegram reply | 28 |
| WebSearch | 20 |
| Agent | 20 |
| WebFetch | 16 |
| Write | 10 |
| Read | 7 |
| Other | 9 |
| **Total** | **159** |

Agent × 20 = 12 first-pass + 8 V2. WebSearch and WebFetch covered event lookups, Claude Design blog sourcing, and in-agent research.

## What Parallel Agent Research Actually Teaches You

Splitting one large research prompt into 12 focused agents isn't just faster — each agent produces higher-quality output because it isn't context-switching between domains.

But running only one pass is a mistake. Numbers go stale. Laws change. Pricing pages drift. The A3 case demonstrates the cost: a single missed legal constraint was enough to invalidate a pricing model.

Research agents sweep wide. Validation agents drill narrow. You need both passes to get research you can actually act on.

> Sub-agents cast a wide net. Validation agents find the holes in it. Both passes together produce trustworthy output.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
