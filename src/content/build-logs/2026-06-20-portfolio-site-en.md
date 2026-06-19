---
title: "578 Candidates, 9 in the Queue: Tracing a Silent Collapse and Auditing 77 Bugs with Multi-Agent Claude Code"
project: "portfolio-site"
date: 2026-06-20
lang: en
pair: "2026-06-20-portfolio-site-ko"
tags: [claude-code, multi-agent, workflow, bug-audit, llm-automation]
description: "6 sessions, 337 tool calls, 47 files modified. How a pipeline silently dropped 97% of its data — and how multi-agent Claude Code found 77 bugs in one shot."
---

578 candidates in the pipeline. 9 made it to the queue. Nobody noticed.

**TL;DR** Six Claude Code sessions, 337 tool calls across two projects in one day. Traced a silent 97% data collapse in `local-commerce-agent`, then audited 77 UI/UX bugs across 10 domains in `preterview` using a parallel multi-agent workflow — 24 of them fixed in a single 1h42m session.

## The Queue That Silently Ate 97% of Its Data

`local-commerce-agent` is a pipeline: a local crawler collects business targets, Codex builds a prioritized queue, Gmail drafts get generated from that queue. The crawler had pulled 578 candidates (95 draft-quality). The actual queue had 9 items.

The investigation prompt:

```
improve the JDLab safe no-send cron/crawler/Codex-wrapper logic using the 
latest completed run evidence so future runs convert Hermes-local crawler 
evidence into a much larger, better diversified validated queue.
```

10 Bash calls and 10 Read calls into the artifacts exposed the root cause. `_local_evidence/*.json` held all 578 candidates. But the top-level batch file that Codex populates? 11 of 15 lanes were empty. The queue builder only reads that top-level batch — so the entire local evidence layer was silently ignored on every run.

The fix: a collapse guard in the queue builder. After loading the local crawl summary, compare pool size against lane distribution and set an `approval_required` flag if the numbers diverge beyond threshold. Changes landed in 8 Edit calls and 3 Write calls: guard logic in `build-jdlab-hourly-queue.mjs`, prompt reinforcement in `jdlab-build-codex-cron-prompt.mjs`, plus a new test file.

An independent Codex review afterward caught one more MAJOR logic issue: the `isCopyBearing` helper didn't exist, making copy-bearing classification fall back to incorrect defaults. A separate session (session 3, 7 tool calls total) fixed it: 4 Read calls for context, one helper addition.

## What 10 Parallel Agents Found in a 9,400-Line Codebase

`preterview` is an AI mock interview SaaS on Next.js App Router — ~9,400 lines across 10 domains: interview room, resume builder, portfolio, auth, payments, dashboard, admin, landing, and i18n.

The prompt: "find all the small bugs."

Workflow structure:

1. **10 parallel finder agents** — one per domain, each reading only its slice of the codebase
2. **Per-finding skeptical verifier agents** — cross-check each finding against actual code, filter false positives
3. **Synthesis stage** — deduplicate across domains, prioritize by impact

Results: 77 found → 21 false positives rejected → 56 confirmed → 46 after cross-domain dedup.

The dominant patterns were predictable in retrospect: hardcoded English strings where i18n keys should be, and missing error handling around async boundaries. Both are the kind of thing that accumulates invisibly — no test fails, nothing crashes, it just quietly degrades the experience for users who aren't on the happy path.

Then a second pass: "judge from all angles and fix only what actually needs fixing." Each confirmed bug scored across 4 lenses:

- Global service impact (does this break non-English users?)
- Usability (does this surface as a confusing UX?)
- Security (does this expose anything?)
- Token waste (does this cause unnecessary LLM calls?)

Side-effect analysis ran per bug before any fix was approved. 24 bugs made the final cut.

Session 2: 162 tool calls, 57 Edit, 55 Bash, 43 Read. 1 hour 42 minutes. 33 files touched — `InterviewRoom.tsx`, `auth-context.tsx`, `storage.ts`, `lib/format.ts`, `messages/en/*.json`, `messages/ko/*.json`, and 27 more.

Sequential review of 10 domains would have taken most of a workday. The parallel structure compressed it into a single session with no context window overload on any individual agent.

## The Wrong Domain Baked Into 12 Files

Session 4 was a "wrong context hardcoded everywhere" problem. The public site domain (`jidonglab.com`) and the Gmail sender alias (`jd@tryjdlab.com`) were being confused throughout the codebase — `tryjdlab.com` was appearing as a footer URL in 12 files that should have been pointing to `jidonglab.com`.

Strategy: replace `tryjdlab.com` with `jidonglab.com` in public URL contexts, leave sender alias contexts untouched. 8 Bash calls to map every reference across the codebase, 17 Edit calls across 12 files. Test fixtures updated alongside to prevent regression.

This one required careful context discrimination — same string, two different semantic roles, two different intended values. The Bash mapping pass was essential before touching anything.

## Six Funding Documents Without a Single New Search

Session 5 was a different type of work. For two products — `local-commerce-agent` and `preterview` — the session produced 6 documents: 2 technical business analyses, 1 grant fit analysis, 2 business plans, 1 announcement checklist.

Two days earlier, a prior research session had already vetted 57 Korean government grant programs in `~/funding/`. That data was reused as the base — the grant fit analysis narrowed from the existing 57 programs down to the best fits for both products, with no new web searches needed.

Completed documents were delivered via Telegram through Hermes. 33 Bash, 9 Write, 9 TaskCreate calls.

The lesson here isn't about Claude Code mechanics — it's about treating prior research output as a reusable asset. Re-running the same research is a common source of wasted effort.

## Product Hunt: The Answer Was Already in the GTM Playbook

Session 6: "Where and how should we sell this — should we launch on Product Hunt?"

A GTM playbook from June 18 already existed, built from 25 research agents and 16 fact-checked data points. Product Hunt was already classified there as "Channel 4 · SECONDARY · one-day spike." Rather than re-researching, the session ran a 2026-reality-check workflow: 12 agents, adversarial fact-checking included.

Conclusion: Product Hunt is not the first move, and it's not the right first channel.

2026 PH outcomes are driven by existing fan base and coordinated day-of traffic. Without a pre-existing community, top-10 placement probability is low regardless of product quality. The correct sequence: establish presence on Hacker News Show HN, relevant subreddits, Discord servers — build early users first, then launch on PH when you have an audience to activate.

Adversarial fact-checking confirmed all core conclusions as supported. It also corrected a few figures that had been presented as measurements but were actually 2016-era conventional wisdom.

## The Numbers

| Metric | Count |
|--------|-------|
| Sessions | 6 |
| Total time | ~8 hours |
| Tool calls | 337 |
| Files modified | 47 |
| Files created | 14 |
| Bash | 116 |
| Edit | 87 |
| Read | 81 |
| Write | 14 |
| Workflow | 5 |

Session 2 alone accounted for 162 tool calls — nearly half the day's total. Multi-agent workflows consume Bash/Edit/Read at scale because each sub-agent runs its own read-verify-edit cycle. The cost is real, but so is the compression: 10 domains reviewed in parallel rather than sequentially.

The throughput pattern across all 6 sessions was the same: parallel agents for discovery, skeptical agents for verification, synthesis for prioritization. That structure works whether you're auditing bugs, reviewing grant fit, or fact-checking market analysis.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
