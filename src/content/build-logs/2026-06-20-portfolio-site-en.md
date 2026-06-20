---
title: "8 Claude Code Sessions, 380 Tool Calls: Auditing 77 Next.js Bugs and a 578→9 Pipeline Collapse"
project: "portfolio-site"
date: 2026-06-20
lang: en
pair: "2026-06-20-portfolio-site-ko"
tags: [claude-code, multi-agent, workflow, bug-audit, llm-automation]
description: "8 sessions, 380 tool calls, 47 files changed. How I traced a 97% silent data loss, ran 10 agents in parallel to audit 77 Next.js bugs, and delegated agent-to-agent."
---

578 candidates sat in the pipeline queue. 9 came out the other side.

The pipeline ran normally. No errors, no alerts. 97% of the data just evaporated — silently — and nobody noticed until I looked at the raw numbers.

**TL;DR** — 8 sessions, 380 tool calls, 5 projects running in parallel. Traced a silent data collapse in `local-commerce-agent`, ran one Workflow that surfaced 77 UI/UX bugs across a Next.js SaaS in 1h 42min, and completed a full dental clinic measurement cycle with exactly 1 tool call from the main session.

## When 578 Becomes 9

`local-commerce-agent` is a three-stage pipeline: a local crawler collects business targets → Codex reads the evidence and builds an email draft queue → Gmail drafts get generated from that queue.

The crawler pulled 578 candidates (95 marked draft-quality). The actual queue had 9.

The diagnostic prompt I used:

```
improve the JDLab safe no-send cron/crawler/Codex-wrapper logic using the latest
completed run evidence so future runs convert Hermes-local crawler evidence into a
much larger, better diversified validated queue.
```

10 parallel Bash calls, 10 parallel Read calls to sweep all artifacts simultaneously. `_local_evidence/*.json` had all 578 candidates. The top-level batch file — the one Codex populates and the queue builder reads — had 11 of 15 lanes completely empty. Since `build-jdlab-hourly-queue.mjs` only reads the top-level batch, every single local crawler evidence record was silently skipped on every run.

Fix: a collapse guard added to `build-jdlab-hourly-queue.mjs`. It compares the local crawl summary against expected full-size and lane-distribution thresholds, and sets an `approval_required` flag when the ratio diverges. Also patched `jdlab-build-codex-cron-prompt.mjs` with stronger prompting and created one new test file. 8 Edit calls, 3 Write calls. 9 minutes, 32 tool calls total.

Session 3 was an independent Codex review of the same fix — and it caught a separate MAJOR logic issue: the `isCopyBearing` helper didn't exist, making copy-bearing classification wrong across the board. 4 Read calls for context, added the helper. 7 tool calls, 2 minutes.

## 10 Agents in Parallel: Auditing 77 Bugs at Once

`preterview` is a Next.js App Router AI mock-interview SaaS. Interview room, resume builder, portfolio, auth, billing, dashboard, admin, landing, i18n — 10 domains, roughly 9,400 lines of component code + 5,400 lines of pages + 4,000 lines of lib + 3,200 lines of API. Not something you walk through manually in any reasonable session.

One prompt kicked it off:

```
preterview ui/ux나 기능상에 자잘한 버그들 없나 모두 찾아봐
(Find all minor bugs in preterview's UI/UX and functionality)
```

Claude Code analyzed the codebase structure, then auto-designed the Workflow: **10 domain-scoped finder agents in parallel → a skeptical verifier cross-referencing each finding against the actual code → false positive rejection → deduplication and priority ranking**. While finder A scans domain X, domain B's verification is already running. There's no sequential bottleneck — the wall-clock time is the slowest single-domain chain, not the sum of all of them.

Results: 77 found → 21 rejected (false positives) → 56 confirmed → 46 after merging duplicates. Severity: high 2, medium 8, low 26, nit 10. Most common pattern by far: i18n gaps — Korean text leaking to English-locale users.

I didn't stop there:

```
Verify every finding: does it actually need fixing, are there side effects after the fix,
check global service / usability / security / token waste. Fix only what clears all lenses.
```

A second Workflow rescored each of the 55 remaining findings across 4 dimensions, modeled per-fix side effects, and returned a final ranked list. Final instruction: "fix only what actually needs fixing."

24 bugs fixed. 33 files changed: `InterviewRoom.tsx`, `auth-context.tsx`, `storage.ts`, `lib/format.ts`, `messages/en/*.json`, and more. `PointsField.tsx` and `useBufferedList.ts` were extracted as new components. Session: 1h 42min, 162 tool calls — 43% of the entire day's tool calls, in one session.

## Delegating an Agent to Another Agent

The Dongbaek UD Dental periodic measurement ran on a single prompt from the main session:

```
동백유디치과(dongbaek-uddental) 정기 측정이다.
dental-clinic 서브에이전트에 위임해 수행하라.
(Run the periodic measurement for Dongbaek UD Dental. Delegate to the dental-clinic subagent.)
```

The main Claude session spawned the `dental-clinic` agent. The agent loaded `~/dental-promo/dongbaek-uddental/` — `clinic.json`, `history.json`, cache files — restored its full context, then ran the entire cycle autonomously: SERP measurement for 6 keywords (0 blocked) → parsing the `place-stats-2026-06-19.md` inbox file → updating `history.json` → running `sync.sh` → commit, push, deploy.

Side result: the first published blog post entered search at position 7 for the `동백 임플란트` keyword — one day ahead of expected indexing. The main session used exactly **1 tool call**: `Agent`. Everything else happened inside the subagent.

## The Silent Domain Contamination

Session 4 was a "wrong value baked in everywhere" bug that had spread quietly across the codebase. The public-facing domain (`jidonglab.com`) and the Gmail sender alias (`jd@tryjdlab.com`) had been confused — 12 files had `tryjdlab.com` hardcoded as footer URLs.

Same string. Two different semantic roles. Two different correct values.

8 Bash calls to map every reference across the repo. 17 Edit calls to fix 12 files: replaced `tryjdlab.com` with `jidonglab.com` in all public URL contexts, left sender aliases unchanged. Test fixtures updated to prevent regression. 4 minutes, 39 tool calls.

The mapping pass before touching anything was the key — you can't do targeted replacement without first knowing which occurrences are which role.

## 6 Business Documents in One Day

Session 6 was a different kind of work entirely. Two products — `local-commerce-agent` (dental ad automation) and `preterview` — each needed: a technical business analysis, a business plan, a government grant fit analysis, and an announcement checklist. 6 documents total. Finished documents were delivered via Telegram through the Hermes relay.

One thing that made this fast: `~/funding/` already had pre-validated data on 57 grant programs from two days earlier. Claude Code found it automatically and reused it without re-running any research — just filtered the existing dataset down to matches for both products. 23h 31min session, 88 tool calls.

Prior research output is a reusable asset. Re-running the same research on every session is invisible waste.

## The Day in Numbers

| Metric | Value |
|---|---|
| Sessions | 8 |
| Total tool calls | 380 |
| Files modified | 47 |
| Files created | 15 |
| By tool | Bash 135, Edit 87, Read 81, TaskUpdate 18, Write 15, Workflow 4+ |

Session 2 alone — the preterview audit — accounted for 162 tool calls, 43% of the day's total. That's what Workflow looks like at scale: each parallel agent runs its own read-verify-edit cycle, so Bash, Edit, and Read get consumed in bulk. Sequential review of 10 domains would have taken most of a workday. The parallel structure compressed it to one session.

The consistent pattern across all 8 sessions: parallel agents for discovery, skeptical agents for verification, synthesis for prioritization. It generalizes — bug audits, grant fit analysis, pipeline debugging, agent-to-agent delegation all follow the same shape.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
