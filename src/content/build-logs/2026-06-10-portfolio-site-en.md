---
title: "789 Tool Calls in One Day: Site Rebuild, Startup Application, and Pipeline Audit with Claude Code"
project: "portfolio-site"
date: 2026-06-10
lang: en
pair: "2026-06-10-portfolio-site-ko"
tags: [claude-code, fable-5, dynamic-workflow, automation, email-pipeline]
description: "11 sessions, 789 tool calls, 38 files created. Rebuilt coffeechat into an AI interview platform in 3h19m, filed an accelerator application, audited an email pipeline, and unlocked autonomous multi-agent orchestration."
---

11 sessions. 789 tool calls. 30 files modified, 38 files created. That's what Claude Code produced on June 10, 2026 — running on Fable 5 across a genuinely diverse set of work.

**TL;DR** Rebuilt the coffeechat site into a resume builder + portfolio checker + AI mock interview platform in 3 hours 19 minutes (279 tool calls). Same day: Claude filled out a startup accelerator application, fixed an outbound email pipeline across 4 sessions, and I added a single standing-authorization policy to `CLAUDE.md` that unlocked autonomous Dynamic Workflow execution for all future sessions.

## How 279 Tool Calls Rebuilt a Site in Under 4 Hours

Coffeechat was a mentor-mentee matching platform. The ask was to replace it entirely with three features:

> "I want a site that builds your resume, checks your portfolio, and runs mock interviews with 3 agents — agents communicate in text, the user responds by voice."

Everything happened in one session: reading the existing codebase, designing API routes, building components, and iterating on design feedback. Five-plus rounds. "Don't make it look AI-generated." "Use toss-style tone." "The orange-brown color scheme is ugly." "Show an actual interview flow on the main page." After each round, Claude checked the browser render directly with `browser_batch`.

Output: a Next.js app at `~/coffeechat`, 5 API routes (`/interview/setup`, `/interview/turn`, `/interview/report`, `/polish`, `/portfolio`), 20+ components. GPT Image 2.0 API generated 3D assets for the favicon and section images.

The resume builder is a 5-step wizard. Each section has an "AI Polish" button that returns achievement-reframed rewrites with metric coaching tips. The interview agent takes a portfolio or job posting, then asks follow-up questions in a thread. When you answer "I'm not sure," it pivots and approaches from a different angle. Role-specific question branches (developer/server/game/backend/frontend) and track variants (portfolio-based, foundational, domain expertise) were added mid-session.

3 hours 19 minutes. Bash: 132. Edit: 40. Write: 28. `browser_batch`: 33. Zero lines of code written by hand.

## The Email Pipeline That "Ran But Couldn't Be Trusted"

Sessions 4, 5, 6, and 8 addressed the JDLab outbound pipeline in `local-commerce-agent`.

**Session 4** — Companies that had already replied and been resolved were still sitting in the hot-lead queue. Created `state/jdlab_resolved_replies.json` to separate resolved state, and moved two hardcoded real email addresses from invoice defaults into `paypal-hot-leads.example.json`.

**Session 5** — Bounce CSVs were hardcoded to a specific timestamp filename. New audit files wouldn't be picked up automatically. Built `resolveBounceCsvSelection()` to pattern-match `~/.hermes/document_cache/` and always select the most recent file. Result: 28 existing + 3 new = 31 tests passing. Bash: 12. Edit: 9.

**Session 6** — Full pipeline audit. 33 minutes, 107 tool calls. Fixed free-mail domain suppression, added MX record preflight checks, atomic writes for the draft loop with run_id cross-validation, comprehensive exception handling overhaul. Audit results saved to `outputs/reviews/claude_jdlab_codex_cron_audit.md`. Edit: 43. Bash: 32.

**Session 8** — Quality upgrade. 38 minutes, 111 tool calls. Contact tiering (C-suite/VP/Director/Manager weights), send-window upper bounds, template repetition suppression cap. Six new test files: `jdlab_contact_tier.test.js`, `jdlab_copy_calibration.test.js`, `jdlab_send_window_caps.test.js`, and others.

Four sessions, one-line summary: moved from "it runs but you can't trust it" to "auditable."

## Claude Filled Out a Startup Accelerator Application

Session 7: 2 hours 31 minutes, 71 tool calls. SparkClaw accelerator application.

The approach was direct: paste the form text into the prompt. Claude pulled project context and real pilot data from memory and populated each field. The first draft was painfully generic.

> "Strip the AI tone. Make it persuasive and expert, with lots of my actual experience and data. The pilot dental clinic didn't pay us — I'm literally just checking whether the ads I'm running are actually helping."

From the second version, real numbers and firsthand observations replaced hypotheses. Instead of claims, it cited actual findings: "If the diagnostic score is wrong, the sales deck and execution plan collapse." Formulaic "firstly/secondly" list structure and unnecessary bold were removed.

Same session: a one-pager company PDF via open-design (A4, converted to PDF), and a grant/credit research workflow rendered as an HTML report in the browser.

Side finding confirmed mid-session: SparkClaw's "Claude Tier 4 Credits" is free high-tier Claude API access — genuinely worth applying for. Ran a Seoul-based search for comparable programs as well.

## One Line in CLAUDE.md Unlocked Autonomous Orchestration

Session 10 modified `~/.claude/CLAUDE.md`:

```
Dynamic workflow (standing opt-in): Jidong grants standing authorization for the Workflow tool
— Claude decides on its own judgment when task size/efficiency warrants multi-agent orchestration.
Sizing guide: ① lookup/single-file edit → direct; ② multi-file work that fits one context
→ Agent subagents as needed; ③ broad fan-out work → launch a dynamic Workflow.
```

Before this, every multi-agent run required an explicit "use dynamic workflow" instruction. Now Claude assesses scope and decides autonomously. Fan-out triggers: audits/reviews/migrations/research across multiple independent units, keywords like "thorough/comprehensive," or roughly 10+ independent work items.

The policy took effect immediately. A dental agent report quality-upgrade request in the same session triggered autonomous Workflow execution: 5 phases, 11 agents. Context restore → 3 parallel re-measurements → report revision → verification → record/commit/push. About 85 minutes. Output: HTML + PDF at `~/dental-promo/dongbaek-uddental/2026-06-10/`.

Setup cost: 7 minutes. Effect: every subsequent session.

## Subagents and Workflows Are Not the Same Layer

A question from session 3 produced a clarification worth keeping.

> "If I use subagents, can I still use dynamic workflow?"

They're not mutually exclusive. Workflows *wrap* subagents. Every `agent()` call inside a workflow script is a subagent. `pipeline()` and `parallel()` determine the execution order and concurrency of those subagents. The `agentType` option lets you inject custom agents like `dental-clinic` or `code-reviewer` as pipeline stages.

This also explains why dental agent work isn't a Workflow candidate. Re-measurement → report → record for one clinic is sequential and interdependent — no fan-out. Keeping `clinic.json`, `history.json`, and the cache in a single agent's context produces better output than splitting it.

## Tool Call Breakdown (11 Sessions)

<div class="change-summary">
<table>
<thead><tr><th>Tool</th><th>Count</th></tr></thead>
<tbody>
<tr><td class="label">Bash</td><td class="after">298</td></tr>
<tr><td class="label">Edit</td><td class="after">165</td></tr>
<tr><td class="label">Read</td><td class="after">105</td></tr>
<tr><td class="label">TaskUpdate</td><td class="after">62</td></tr>
<tr><td class="label">Write</td><td class="after">48</td></tr>
<tr><td class="label">TaskCreate</td><td class="after">33</td></tr>
<tr><td class="label">browser_batch</td><td class="after">33</td></tr>
<tr><td class="label">Agent</td><td class="after">13</td></tr>
<tr><td class="label"><strong>Total</strong></td><td class="after"><strong>789</strong></td></tr>
</tbody>
</table>
</div>

Bash is 38% — mostly test runs and browser render checks. Edit comes in second at 21%, which makes sense: most of the day's work was modifying existing files, not generating new ones. `browser_batch` 33 times reflects the coffeechat session's tight UI iteration loop.

Sessions 1, 2, and 11 hit the monthly credit limit and terminated early. Three of the day's sessions ended at a wall, not at completion.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
