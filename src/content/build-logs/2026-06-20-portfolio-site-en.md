---
title: "7 Claude Code Sessions: Auditing 77 Bugs via Workflow, Tracing a 578→9 Pipeline Collapse"
project: "portfolio-site"
date: 2026-06-20
lang: en
pair: "2026-06-20-portfolio-site-ko"
tags: [claude-code, multi-agent, workflow, bug-audit, llm-automation]
description: "7 sessions, 338 tool calls, 47 files changed. How I traced a 97% silent data loss, audited 77 Next.js bugs in one Workflow run, and delegated agent-to-agent work."
---

578 candidates were in the queue. Only 9 made it out.

97% of the data vanished somewhere in the pipeline — silently, no errors, no alerts. Nobody noticed until I looked at the numbers directly.

**TL;DR** — 7 sessions, 338 tool calls, 5 projects in parallel. Traced a silent data collapse in `local-commerce-agent`, ran a single Workflow that surfaced 77 UI/UX bugs across a Next.js SaaS, and completed a full dental clinic measurement cycle with exactly 1 tool call from the main session.

## When 578 Becomes 9

`local-commerce-agent` is a pipeline: a local crawler collects business targets → Codex builds a queue → Gmail drafts get generated from that queue.

The crawler pulled 578 candidates (95 draft-quality). The actual queue had 9.

The diagnostic prompt:

```
improve the JDLab safe no-send cron/crawler/Codex-wrapper logic using the latest
completed run evidence so future runs convert Hermes-local crawler evidence into a
much larger, better diversified validated queue.
```

10 parallel Bash calls, 10 parallel Read calls to sweep the artifacts. `_local_evidence/*.json` had all 578 candidates. The top-level batch file — which Codex populates and the queue builder reads — had 11 of 15 lanes empty. Since the queue builder only reads the top-level batch, all local crawler evidence was silently ignored on every single run.

Fix: added a collapse guard to `build-jdlab-hourly-queue.mjs`. It now compares the local crawl summary against full-size and lane-distribution expectations, and sets an `approval_required` flag when the ratio diverges beyond threshold. Also patched `jdlab-build-codex-cron-prompt.mjs` with stronger prompting and added one new test file. 8 Edit calls, 3 Write calls. 9 minutes, 32 tool calls.

Session 3 was an independent Codex review of the same fix — and it caught an additional MAJOR logic issue: the `isCopyBearing` helper was missing entirely, making copy-bearing classification unreliable. 4 Read calls for context, then the helper was added. 7 tool calls.

## Auditing 77 Bugs in One Workflow Run

`preterview` is a Next.js App Router AI mock-interview SaaS. Interview room, resume builder, portfolio, auth, billing, dashboard, admin, landing, i18n — 10 domains, ~9,400 lines of component code. Too large to audit manually in any reasonable time.

One prompt:

```
preterview ui/ux나 기능상에 자잘한 버그들 없나 모두 찾아봐
(Find all minor bugs in preterview's UI/UX and functionality)
```

Claude Code analyzed the structure, then designed the Workflow automatically: **10 domain-scoped finder agents running in parallel → a skeptical verification agent cross-referencing each finding against actual code → false positive elimination → deduplication and priority ranking**. While finder A scans domain X, domain Y's verification is already running. No sequential bottleneck.

Results: 77 found → 21 rejected → 56 confirmed → 46 after merging duplicates. Severity breakdown: high 2, medium 8, low 26, nit 10. The most repeated pattern: i18n gaps — Korean text leaking through to English-locale users.

Then I pushed further:

```
Verify every finding: does it actually need fixing, are there side effects after the fix,
and check global service / usability / security / token waste. Fix only what clears all lenses.
```

A second Workflow rescored each of the 55 remaining findings across those 4 dimensions, modeled side effects per proposed change, and returned a final priority list. Final instruction: "Fix only what actually needs fixing."

24 bugs fixed. 33 files changed: `InterviewRoom.tsx`, `auth-context.tsx`, `storage.ts`, `lib/format.ts`, `messages/en/*.json`, and more. Session: 1h 42min, 162 tool calls.

## Delegating an Agent to Another Agent

The Dongbaek UD Dental periodic measurement ran on a single prompt:

```
동백유디치과(dongbaek-uddental) 정기 측정이다.
dental-clinic 서브에이전트에 위임해 수행하라.
(Run the periodic measurement for Dongbaek UD Dental. Delegate to the dental-clinic subagent.)
```

The main Claude session spawned the `dental-clinic` agent. The agent loaded `~/dental-promo/dongbaek-uddental/` — `clinic.json`, `history.json`, cache — restored its context, and ran the full cycle end-to-end: SERP measurement for 6 keywords (0 blocked) → parsing the `place-stats-2026-06-19.md` inbox file → updating `history.json` → running `sync.sh` → commit and push.

Side result: the first published blog post entered search rankings at position 7 for the `동백 임플란트` keyword — one day ahead of expected indexing. The main session used exactly 1 tool call: `Agent`.

## The Silent Domain Contamination

Session 4 was a "wrong context baked in everywhere" bug that had spread quietly. The public-facing domain (`jidonglab.com`) and the Gmail sender alias (`jd@tryjdlab.com`) had been confused throughout the codebase — 12 files had `tryjdlab.com` hardcoded as footer URLs.

8 Bash calls to map all references across the repo. 17 Edit calls to fix 12 files: replaced `tryjdlab.com` with `jidonglab.com` in public URL contexts, left sender aliases untouched. Test fixtures updated to block regression. 4 minutes, 39 tool calls.

Same string, two different semantic roles, two different correct values. The mapping pass before touching anything was the key step.

## 6 Business Documents in One Day

Session 6 was a different kind of work. Two products — `local-commerce-agent` (dental ad automation) and `preterview` — needed: 2 technical business analyses, 2 business plans, 1 government grant fit analysis, 1 announcement checklist. 6 documents total. Completed documents were sent via Telegram through the Hermes relay.

One observation: `~/funding/` already had pre-validated data on 57 grant programs from two days prior. Claude Code found and reused it automatically — no fresh research needed, just narrowing the existing dataset down to matches for both products. 5h 30min, 88 tool calls.

Prior research output is a reusable asset. Re-running the same research every session is silent waste.

## The Day in Numbers

| Metric | Value |
|---|---|
| Sessions | 7 |
| Total tool calls | 338 |
| Files modified | 47 |
| Files created | 14 |
| By tool | Bash 116, Edit 87, Read 81, TaskUpdate 18, Write 14, Workflow 5 |

Session 2 alone accounted for 162 tool calls — nearly half the day's total. That's what Workflow looks like at scale: it consumes Bash, Edit, and Read in bulk because parallel agents each run their own read-verify-edit cycles. Sequential manual review of 10 domains would have taken most of a workday. The parallel structure compressed it into one session.

The throughput pattern across all 7 sessions was consistent: parallel agents for discovery, skeptical agents for verification, synthesis for prioritization. That structure generalizes — bug audits, grant fit analysis, pipeline debugging, agent delegation.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
