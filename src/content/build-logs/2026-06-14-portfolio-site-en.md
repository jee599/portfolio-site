---
title: "707 Tool Calls, One Day: Claude Code From Gmail Audit to Dual Site Redesigns"
project: "portfolio-site"
date: 2026-06-14
lang: en
pair: "2026-06-14-portfolio-site-ko"
tags: [claude-code, workflow, automation, email, design, hermes]
description: "18 Claude Code sessions, 707 tool calls, 51 files — Gmail bounce audit, B2B email automation, and two full site redesigns in a single day."
---

707 tool calls. 18 sessions. 51 files touched. That's the raw output of a single day running Claude Code across a stack of unrelated projects — email auditing, B2B outreach automation, a martial-arts Godot game prototype, and two separate site redesigns.

This is a log of what happened, what patterns held up, and where the system hit walls.

**TL;DR** The Hermes relay pattern — where an orchestrator (Hermes) handles PM and intake while Claude Code CLI executes — ran through Gmail auditing, B2B SaaS email outreach, a saju (four pillars) fortune site redesign, and a coffeechat platform overhaul. Dynamic Workflow was attempted 9 times and executed 0 times, blocked by permission gates in both autonomous cron and interactive contexts.

## 82 Bounces. Real Deliverability Problem: Zero.

The clearest finding of the day came from a Gmail audit session for a JDLab outreach account. The logs showed 86 bounce events. Auditing with Claude Code revealed 82 of them weren't bounces at all — they were Gmail's own daily sending quota throttle kicking in. Messages died in the outbound queue and never reached a recipient.

Actual problems: 3. One hard bounce, two remote rejections. One human reply — from Fjord.

Claude Code took a single `gmail_audit_full.json` input and produced three artifacts:
- `claude_audit_report.md`
- `claude_cleanup_plan.json`
- `claude_reply_shortlist.md`

23 tool calls. Under 5 minutes.

The default instinct when you see "82 bounces" is to suspect list quality or domain reputation. Neither was the issue here. The problem was quota management, and it only surfaced clearly after structured JSON parsing and pattern classification. Handing that classification to Claude Code let it identify the actual root cause rather than chasing the obvious (and wrong) hypothesis.

## How the Safety Guardrails Were Built

The B2B SaaS outreach automation session surfaced the most deliberate design pattern of the day: complete separation between generation and approval.

The send pipeline has an `assertSendAllowed({})` function. Call it, and it throws `GuardrailError: SEND BLOCKED`. Every generated draft carries `approvedToSend: false`. That flag is never flipped programmatically — it requires a human edit.

Verification runs independently twice. First, Claude Code does an in-memory compliance scan. Then a bash grep hits the actual files. Both checks confirm that `price`, `PayPal`, `$`, and `guarantee` appear zero times in actual email bodies. Results are written to `verification.md`.

During Codex review, a "31 matches" count came up as a concern. Digging in: 30 of those were the JSON field name `hasPriceOrPayment` appearing in the schema, plus one policy string. Body-level matches: 0. This is why naive grep isn't sufficient for this kind of verification — you need structure-aware checks, not raw string matching across a JSON document.

All 8 unit tests passed. The guardrail held through mock CLI execution and actual cron paths.

The design principle: the pipeline can run indefinitely, generating and staging drafts, and nothing ships until a human manually sets `approvedToSend: true`. Generation and sending are decoupled at the data level, not just the code level.

## Dynamic Workflow Tried 9 Times. Ran 0 Times.

This was the most consistent failure pattern of the day, and also the most instructive.

Dynamic Workflow was attempted 9 times across sessions — in autonomous cron context and in interactive sessions. Every attempt was blocked. Interactive sessions hit a `"Review dynamic workflow before running"` gate. The cron context had no approver to satisfy it.

The fallback was the same every time: manually fan out Agent subagents per lane, run them sequentially. In session 5, 12 B2B-SaaS niches were split into 5 lanes, 5 Agent calls were made sequentially, and 30 prospects were generated. Same result as a Workflow run — just without parallelism.

The gate exists for a good reason. The Workflow tool can spin up dozens of parallel agents, and running that in an autonomous context without interactive approval would generate unpredictable costs. In cron, there's no human to approve it. The right fix isn't to bypass the gate — it's to pre-authorize Workflow for specific autonomous contexts before scheduling the job.

This is a configuration lesson, not a tool failure.

## Two Full Site Redesigns in One Day

The two heaviest sessions were both visual redesigns, back to back.

**Fortune site (`fortunelab`)** — 169 tool calls.

The core problem: four hero images using three completely different visual languages. `hero-sky` was a real nightscape photograph. `ink-cranes` was a bright-background ink painting. `ink-night` was a dark ink painting. All three on the same page, none of them agreeing on whether the site felt like a modern product or a traditional aesthetic experience.

Resolution: unified the visual direction to **dark cosmic navy + gold celestial line-work**. Single visual language across all hero assets. While in that section of the code, also removed a `$4.99` legacy pricing block that had survived the previous redesign — still alive in `page.tsx:509-542` despite the price having changed.

**Coffeechat platform** — 302 tool calls. Highest of the day.

`git log` showed the previous commit (`0e578da`) had replaced the hero's `InterviewDemo` animation component with a static `ReportShowcase`. This session restored the animated interview demo and added a three-report generation animation on the right side, restructuring the hero into a two-column layout.

Edit: 119 calls. Bash: 98 calls. Read: 75 calls. More than half a workday of effort, compressed.

## The Hermes Relay Pattern

Most sessions today arrived with some variant of: `"You are Claude Code, the actual executor. Hermes is only the relay/orchestrator."`

Hermes acts as the PM and orchestration layer. Claude Code CLI is the executor. Responsibilities are separated by design, not convention.

What this buys: a clear scope boundary. Hermes handles intake and scope gates. Claude Code executes within whatever scope it's given, without needing to reason about why the scope is what it is. Constraints like `"STRICT MODE: READ/WRITE ONLY. Do not use Bash/shell/terminal at all."` come down explicitly from the Hermes level.

Session 14 took this to its logical extreme. Bash was off-limits entirely. The session ran 13 Read calls and 1 Write call, verified the full cron logic, and produced a review report — no shell access. If the necessary evidence exists in files, shell isn't required for verification.

The pattern scales naturally. For sessions that need more autonomy, Hermes passes wider permissions. For audit-only sessions, Hermes constrains to read-only. The executor doesn't need to know which mode it's in — the constraints are explicit in the prompt.

## Tool Usage Breakdown

| Tool | Count |
|---|---|
| Bash | 292 |
| Read | 180 |
| Edit | 151 |
| Write | 28 |
| Agent | 22 |
| Workflow (attempted, never ran) | 9 |

Bash at 292 is the dominant cost. Most of it: validation greps, node script execution, headless Chrome PDF generation, typecheck runs, and test execution. These aren't exploratory — they're verification steps after edits.

Read at 180 reflects context-loading cost. The pattern across sessions was consistent: read 20-40 files at session start to build the full picture, then edit. Skipping that context phase produces misaligned changes.

The Workflow number is the day's most interesting data point: 9 attempts, 0 executions. Agent fallback delivered the same outputs, just without parallelism. The output was correct. The wall-clock time was longer. For autonomous cron jobs that need Workflow-level parallelism, the pre-authorization has to happen before the job is scheduled — not at runtime.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
