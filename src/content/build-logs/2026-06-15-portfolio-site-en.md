---
title: "8 Sessions, 130+ Tool Calls, 0 Emails Sent: Building a Safety-First AI Email Pipeline"
project: "portfolio-site"
date: 2026-06-15
lang: en
pair: "2026-06-15-portfolio-site-ko"
tags: [claude-code, safety-guardrail, multi-agent, email-pipeline, hermes, codex-review]
description: "Built a B2B SaaS email draft pipeline across 8 Claude Code sessions. Compliance checks, Codex cross-review, cron scheduling. Final send count: 0. The design is correct."
---

8 sessions. Over 130 tool calls. Zero emails delivered.

The numbers look like failure. They're not. `approvedToSend: false` on every single draft is exactly what success looks like here.

**TL;DR** This isn't automation that *sends* email — it's automation that produces *send-ready drafts* with full compliance verification. After 8 iterative Claude Code sessions, the architecture includes independent validation, Codex cross-review, and cron scheduling. The human decides when to pull the trigger.

## The Safety Boundary Was Line One of the First Prompt

Session 4's opening instruction: *"Use the safe approach. Use Claude dynamic workflow to target the highest-conversion prospects and send professional marketing emails to drive payment."*

"Safe approach" came first. That phrase became the architectural constraint for everything that followed.

The first thing Claude did was read the existing guardrail code — not plan new features, not scaffold a workflow. Read the guardrails.

```
typecheck: clean
test: 8/8 pass
audit → leads → draft: mock=true mode, RED(DE) auto-drop
send gate: assertSendAllowed({}) → GuardrailError('SEND BLOCKED')
```

Without `ANTHROPIC_API_KEY` set, the send gate throws `GuardrailError`. Claude demonstrated this before writing a single line. Tool usage for that session: `Read(16), Bash(6), Agent(6), Workflow(1)` — one Workflow attempt, immediately blocked by the permission gate, immediate fallback to 6 parallel Agents.

## What the Pipeline Actually Does

12 B2B SaaS categories are split into independent lanes. Each lane generates prospects and self-validates compliance. The assembly stage runs three additional checks before anything reaches eligible status:

**1. Suppression list deduplication.** Every draft is cross-referenced against the send suppression set. Across all 30 drafts in `email_sequences.json`, suppression conflicts: 0.

**2. Forbidden token scan.** Words like `price`, `PayPal`, `$`, and `guarantee` are searched directly in email bodies. Session 8 produced a confusing edge case: `verification.md` showed "31" as the token hit count, but the body-level scan returned 0. Root cause: the JSON field names themselves (`hasPriceOrPayment`, `hasGuaranteeOrFakeClaim`) and policy strings contained the banned words — not the email bodies. This distinction was explicitly documented in `verification.md` to prevent future confusion.

**3. Eligible file separation.** Drafts with `verified_pass` are extracted to a separate `eligible_email_sequences.json`. The reviewer sees only send-candidates in one file, not a mixed list requiring manual filtering.

## Codex Flagged the Contradiction Before It Became a Problem

Sessions 8 and 9 run the same task twice. Intentionally.

Session 8 started with: *"Codex-review independently verified and found two issues. Fix them."* Codex had flagged a contradiction in `verification.md`: the line "price/PayPal/$ token in eligible bodies: 31" appeared alongside "price/PayPal/guarantee tokens in email bodies: NONE" — same document, direct conflict.

Claude completed the fix. Then Session 9 received the same task brief — Hermes had opened a new session with no memory of Session 8. Instead of re-running the fix, Claude did something more useful: independent re-verification.

```bash
# verification.md §6 body-level claim check
grep -oc 'price\|paypal\|\$\|guarantee' eligible_email_sequences.json
# → 0 (excluding JSON meta fields)
```

Session 9 tool usage: `Bash(14), Read(4)` — no file modifications. Verification only.

That's the Codex → Claude cross-verification loop. Codex flags as a read-only reviewer. Claude fixes. The next session independently re-verifies the same claim without knowing the fix already happened. For automated pipelines where trust needs to compound over time, this is the structure that makes "it's correct" defensible rather than assumed.

## Cron Contexts Break the Workflow Tool — Here's the Workaround

Session 10 ran as an autonomous cron context. Goal: regenerate a suppression-list-checked draft set every 6 hours.

The Workflow tool got blocked again — but for a different reason than Session 4. In autonomous cron contexts, there's no interactive approver available to grant permissions. From `verification.md §6`: *"Actual Workflow tool rejected by permission gate — blocked in autonomous cron because there is no interactive approver. Fallback to 5-lane Agent decomposition."*

The 5 lanes were manually decomposed into parallel Agents. Result: 30 drafts, full compliance pass, `approvedToSend: false` across the board, 27 eligible.

Tool usage: `Bash(11), Read(5), Agent(5), Write(3), Workflow(1)`.

The same tool that drives efficiency in interactive sessions becomes unavailable in scheduled contexts. The pipeline needed to degrade gracefully and still produce correct output. The fallback pattern — parallel Agents per lane — preserved all compliance guarantees without requiring interactive permission grants.

## "I Tested" Is a Compliance Violation

Session 11 was a narrow surgical fix. Four eligible email bodies contained the phrase "I tested" — implying the sender had personally verified the recipient's specific site. Factually unverifiable. Compliance violation.

```javascript
// _revise.mjs — batch replacement across 4 bodies
const replacements = {
  "a general market pattern I tested on your site":
    "a general market pattern, though specifics will vary by site",
  // ... 3 more patterns
}
```

Applied to exactly four files: `email_sequences.json`, `email_sequences.md`, `eligible_email_sequences.json`, `eligible_email_sequences.md`. The source file `_lanes/lane_1.json` was explicitly left untouched — out of scope.

Total tool usage: `Bash(3), Write(2), Read(1), Edit(1)` — 7 tool calls.

The constraint that mattered: don't regenerate the full draft set. Replace exactly the problematic pattern in exactly the files that need it. When modifying reviewed and validated output, surgical edits preserve everything else that's already been verified.

## The Gmail Audit: 82 of 86 "Bounces" Were Never Attempted

Session 1 was a Gmail send audit run before the pipeline was built. The task: determine why 86 sends showed as bounced.

```
- Gmail daily-send-quota self-throttle: 82 (no delivery ever attempted)
- Actual hard bounces:                   1
- Remote server rejection:               3
- Actual human reply:                    1 (Fjord)
```

82 of them were Gmail's own quota throttle. The daily send limit was hit and Gmail silently stopped delivery attempts — not because the addresses were bad, but because the account ran out of daily quota. Without this audit, the natural next step would have been to scrub the address list. Wrong diagnosis, completely wrong fix.

Three outputs from Session 1: a Korean audit report, `cleanup_plan.json`, and a reply shortlist. Tool usage: `Bash(18), Write(3), Read(2)`.

Knowing *why* something failed is prerequisite work. Jumping to fixes without the audit would have wasted effort on the wrong problem.

## The Hermes Relay Pattern

Most of Sessions 1-13 share this structure in the opening system prompt:

```
"You are Claude Code, the actual executor. Hermes is only the relay/orchestrator."
```

Hermes plans and routes task briefs. Claude executes and produces files. No context carries between sessions — each is a cold start.

The advantage is role clarity. Claude focuses entirely on execution. When a session brief explicitly states four things — objective, scope, output paths, constraints — the session produces clean, predictable results without exploratory overhead.

The counterexample was the Godot planning sessions. Sessions 2 and 3 were pure exploration: tool calls, reading, searching. No output files. Session 7 added explicit prohibitions to the brief: *"Do NOT use TaskCreate/TaskUpdate/workflow/planning tools. Do NOT spend time searching for tools. Immediately perform file operations."*

Files appeared immediately after that constraint was added.

In stateless session environments, specificity of constraints is directly proportional to output predictability. Removing Claude's ability to plan forces it to execute. Sometimes that's exactly the right call.

## The Numbers

| Metric | Value |
|---|---|
| Sessions tied to AEO pipeline | 8 (sessions 4, 5, 8, 9, 10, 11, 12, 13) |
| Email drafts generated (cumulative final) | 57 |
| Final eligible (full compliance pass) | 27–30 |
| Emails actually sent | **0** |
| Drafts with `approvedToSend: true` | **0** |
| Average tool calls per session (AEO) | 17 |
| Codex cross-verification cycles | 1 (session 8 fix → session 9 independent re-verify) |

Every draft has `approvedToSend: false`. That's the target state. Automation covers everything up to the moment a human decides to send. The send decision doesn't belong to the pipeline.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
