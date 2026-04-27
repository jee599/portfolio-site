---
title: "53 Subagent Dispatches, 3 Projects, 458 Tool Calls: 4 Days with Claude Code"
project: "portfolio-site"
date: 2026-04-28
lang: en
pair: "2026-04-28-portfolio-site-ko"
tags: [claude-code, multi-agent, automation, devto, market-research]
description: "4 days, 3 projects, 53 subagent dispatches, 458 tool calls. DEV.to series publishing, 12-agent dental market research, and a live PayPal test — all from one session."
---

53 subagent dispatches in 4 days. Not across different sessions — from a single Claude Code session, bouncing between three separate projects while agents ran in parallel on each.

**TL;DR** Tell Claude Code "use 10+ subagents to research this" and 12 agents actually spin up, each digging a different domain simultaneously. That pattern, applied across three projects, produced 458 tool calls over 4 days. This is what that looked like.

## Publishing a 3-Part DEV.to Series Without Touching the Editor

The starting prompt was intentionally vague:

```
analyze 4 trending ai/git projects and post articles on devto
```

Claude ran a Phase 1 search, surfaced four trending GitHub projects — `andrej-karpathy/skills`, `hermes-agent`, OpenClaw, OpenCode — and came back with a proposal: bundle them into a three-part series called *The 2026 AI GitHub Playbook*.

The more interesting part was how it split four projects into three posts. Not a flat list — angle-first. Part 1 took the Skills repo and framed it around a single question: how does a Markdown file get 16K stars? Part 2 put OpenClaw in the context of local AI gateways. Part 3 positioned OpenCode as the opening chapter of the terminal-agent era.

Part 1 published immediately. Parts 2-3 went to DEV.to as drafts with `published: false` — ready to schedule. The [live post](https://dev.to/ji_ai/how-a-markdown-file-hit-16k-stars-skills-in-2026-36hi) landed as DEV.to id=3542024.

What made this session smooth was the `auto-publish` skill's phase structure: source collection → structure proposal → content generation → publish. Each phase ended with a decision point. I approved, it moved forward. No back-and-forth on scope or format.

Session stats: **75h 58min, 191 tool calls** (Bash 96, Agent 11). Web searches and file ops dominated — the agent count was low because the work was sequential by design.

## 12 Agents in Parallel: Dental Ad Market Research

The second session is where multi-agent dispatch got interesting. Prompt:

```
use 10+ subagents and have each research a different domain
```

Twelve agents dispatched. Each took a separate slice: Korean AI medical advertising landscape, Naver algorithm changes, pricing and ROI benchmarks, real campaign artifact collection, and more. Zero overlap between agents — each had a clean domain boundary.

The output wasn't a single report. Claude proposed a reader-tiered set:

- `AI-AGENCIES-DEEP-REPORT.html` — dense, terminology-intact version for practitioners
- `AI-AGENCIES-PRIMER.html` — plain-language version for non-technical stakeholders
- `AI-AGENCIES-EXAMPLES.html` — real campaign examples gallery

Splitting output by audience depth rather than topic wasn't in the instructions. Claude proposed it unprompted, which was the right call.

Session stats: **2h 26min, 63 tool calls** (Agent 35, Bash 9). Agents were the primary tool here; Bash was cleanup work. High density — 35 agent dispatches in under 2.5 hours.

## A Telegram Message That Became a Live PayPal Test

The third session started with an inbound Telegram message:

```
anyone paid or visited the saju project?
```

Claude queried the database directly: 30 total payments, ₩171K lifetime revenue. Zero payments since March. Traffic was still coming in — 87 sessions in April alone — but converting nothing.

"Does payment actually work right now?" turned into a live PayPal integration test. Claude wrote `scripts/paypal-live-test.sh`, created a real $1.99 order, and retrieved the approval URL to confirm the flow was alive. Status check on the other payment providers came out of this too: Toss had 29 validated transactions and was fine. LS Pay was dead — stuck in test mode after the fortune-telling category got flagged for content compliance.

One false positive worth documenting: a CRO agent flagged that Thai users were seeing a `₩` symbol. Sounded like a real localization bug. It wasn't. The `₩` symbol lives inside the `toss` payment namespace, and Thai users route to the PayPal hosted page — they never see it. The lesson isn't that agents make mistakes (they do), it's that agent-raised issues need to be verified against the actual code path before acting on them.

Four agents ran in parallel on JP/SEA market sizing: Japanese fortune market scale, Southeast Asia data, viral video patterns for the category, and reference site analysis. The synthesis: don't touch the payment stack yet. The primary bottleneck is traffic, not conversion. Recommendation was $50/week on paid acquisition to get baseline data before any platform refactor.

Session stats: **22h 29min, 204 tool calls** (Bash 100, Edit 25, Telegram reply 16). Longest session by duration and call count.

## Where Subagents Help and Where They Don't

Four days of this made the pattern clearer.

**Agents work when domains are independent.** The dental research session is the clearest example: competitor landscape, algorithm changes, and campaign examples don't share state. Split into agents, each one stays focused and the main context window doesn't fill with tangential detail. 35 agents in 2.5 hours with clean, non-overlapping outputs.

**Agents slow things down when work is sequential file editing.** The third session included updating 21 i18n message files. Running that through agents would have added coordination overhead for no gain — Claude handled it directly with the Edit tool, pattern-matching across files. When the path is known and the operation is repetitive, agent dispatch is just latency.

**Always verify agent output against the source.** The `₩` false positive is the concrete example. An agent flags an issue → you check which namespace the code actually lives in → you find it's unreachable by the affected users → you close it. That verification step has to be part of the workflow. Trusting agent output without checking code paths is how small issues get escalated into large ones.

> Agents are tools. The output is a draft, not a decision.

## Session Summary

| Session | Duration | Tool Calls | Primary Tools |
|---|---|---|---|
| DEV.to publishing | 75h 58min | 191 | Bash (96), Agent (11) |
| Dental ad research | 2h 26min | 63 | Agent (35), Bash (9) |
| Saju expansion | 22h 29min | 204 | Bash (100), Edit (25) |
| **Total** | — | **458** | **Agent (53), Bash (205)** |

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
