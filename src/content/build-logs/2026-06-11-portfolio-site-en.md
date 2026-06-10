---
title: "789 Tool Calls in One Day: AI Interview Platform, Email Pipeline Hardening, and Standing Multi-Agent Auth"
project: "portfolio-site"
date: 2026-06-11
lang: en
pair: "2026-06-11-portfolio-site-ko"
tags: [claude-code, dynamic-workflow, multi-agent, email-automation, fable-5]
description: "11 sessions, 789 tool calls, 68 files, 9+ hours: rebuilt CoffeeChat as an AI interview platform, hardened an email pipeline, and set Dynamic Workflow to always-on."
---

789 tool calls. 68 files created or modified. 11 sessions totaling over 9 hours of wall-clock time — all in a single day.

**TL;DR** The biggest chunk was rebuilding CoffeeChat — a mentor-mentee matching site — into an AI mock interview platform. That took 3 hours 19 minutes and 279 tool calls. In parallel, I hardened the JDLab outbound email pipeline across four focused sessions, and baked Dynamic Workflow standing authorization directly into `~/.claude/CLAUDE.md`.

## 3 Hours, 279 Calls — Turning a Matching Site into an AI Interview Platform

The request was three sentences: "Build a resume creator, a portfolio checker, and a mock interview with three AI interviewers."

Three features, no spec, all at once. Claude's first move wasn't to start building — it was to surface the decisions that actually needed making: TTS support or text-only, resume template styles, how to split the interviewer roles. I said no to voice; Claude picked sensible defaults for the rest and started immediately.

Three features landed:

**Resume Builder** — a 5-step wizard (basics → work history → projects → skills & education → preview), per-section "AI polish" buttons, and two templates: a modern single-page layout and a traditional Korean-style format.

**Portfolio Check** — submit a GitHub URL, get structured AI feedback on presentation, depth, and gaps.

**Mock Interview** — input a portfolio and job posting, then three AI interviewers each own a different dimension: portfolio fit, general CS knowledge, and domain expertise. They take turns in a structured round format.

Design went through four feedback rounds:

1. "Looks like every AI site" — fair
2. "The orange-brown combination isn't pretty"
3. "Too static, add some motion"
4. "Colors still feel off"

Each round: `mcp__claude-in-chrome__browser_batch` to verify the actual render, edit, repeat. All 33 browser tool calls in this session were render checks — no guessing what the output looked like. The final design settled on a dark hero section, caramel glow accents, bento grid layout, and scroll-triggered entrance animations.

Tool distribution for the session: Bash 132 (mostly build verification and `tsc --noEmit`), Edit 40, Write 28, Read 25, browser_batch 33.

The 4-round design iteration is worth noting. A spec written up front would have saved one or two rounds, but the speed from "request to working prototype" was still faster than the traditional design-then-implement path. The bottleneck was visual direction, not code.

## The Permission Problem — Why I Wrote Standing Authorization into CLAUDE.md

Every time a task was large enough to warrant multi-agent orchestration, Claude would pause and ask: "This looks like a ③-scale task, can I use Dynamic Workflow?" One interruption per session. Not terrible — but it meant I had to be paying attention at exactly the right moment, and if I missed it or forgot to explicitly authorize, the task would silently fall back to a single-agent approach.

Session 10 fixed this with a sizing rubric added directly to `~/.claude/CLAUDE.md`:

```
① Simple lookup / single-file edit → handle directly, no agents
② Multi-file but fits one context → subagents as needed
③ Broad fan-out ("comprehensive", "audit all", "go through everything",
   or roughly 10+ independent work items) → use Workflow at own discretion
```

The first ③-class request came in immediately after: a report quality improvement for a dental clinic. I didn't say "use a workflow." Claude launched a 5-phase workflow on its own — context restore → parallel data gather (place metrics, competitor probe, three keyword checks in parallel) → report generation → verification → record and push. 11 agents. 85 minutes.

Before this change: there would have been an approval conversation before any of it started. After: there wasn't. The output was the same. The friction was gone.

The key insight is that authorization belongs in durable config, not in the conversation. Conversation state evaporates between sessions; `CLAUDE.md` doesn't.

## Four Sessions of Email Pipeline Hardening

Sessions 4 through 8 (session 6 included) were a series of focused, targeted hits on the JDLab outbound email pipeline. Starting condition: response rates were low. Goal: improve quality without a full rewrite.

Every session followed the same discipline: write the test first, then change the code.

**Session 4 — Cleaning up false hot leads**

Two already-resolved inbound replies were still flagged as "hot leads" in the pipeline state. The fix: extract resolved contacts into `state/jdlab_resolved_replies.json`, add tests confirming those addresses no longer appear in the default active view. Small change, but bad state in the lead list was actively polluting prioritization.

**Session 5 — Hardcoded path kills cron reliability**

The bounce CSV file path was hardcoded as an absolute path. Every audit run generates a new timestamped file, but the cron job was always reading the original filename. Net effect: new bounces were invisible to the automation.

Wrote `resolveBounceCsvSelection()` to auto-select the most recent file from the Hermes cache directory using `fs.readdirSync` + sort by mtime. Test count: 28 existing + 3 new = 31 passing.

**Session 6 — Upstream guards**

Three additions: MX preflight check (rejects free-mail domains before any send attempt), `run_id` cross-check to prevent duplicate sends in the same run, tightened exception handling in the draft loop to prevent silent swallowing of errors.

This was the heaviest session in the sequence: Edit 43, Bash 32. Used `TaskCreate` to track steps because the scope was wide enough to lose thread. Running totals after each step kept the session from drifting.

**Session 8 — Tiering and template hygiene**

Two additions: contact tiering (cold/warm/hot classification with different send windows per tier) and a template repetition prevention module to avoid sending the same framing to the same contact twice.

Five new test files:
- `jdlab_contact_tier.test.js`
- `jdlab_send_window_caps.test.js`
- `jdlab_template_repetition.test.js`
- `jdlab_codex_wrapper_policy.test.js`
- `jdlab_copy_calibration.test.js`

The pipeline went from one flat state file and a single send path to a tiered system with guards at multiple stages. No single session was long — the cumulative effect came from not leaving broken state between sessions.

## Writing a Startup Application with Claude Code

Session 7: a job application for Spark Claw, a startup — 10+ form fields, each needing answers grounded in actual projects and specific numbers.

The first draft had the usual AI fingerprints: "First and foremost," "The key differentiators are as follows," "I believe my experience uniquely positions me." One instruction: "Strip the AI filler. Use my real experience, specific numbers."

Three iterations. The final answers were grounded in concrete data — number of pilot dental clinic diagnostics run, number of market research firms surveyed — and written dry. No hedging, no throat-clearing.

Same session: a one-page company introduction document. Went through the open-design route to produce an A4 HTML layout, then converted to PDF. Brand color `#533afd`, a table of four live products, 502KB final size.

The application writing and document generation together took about the same time as one design feedback round on CoffeeChat.

## Day by the Numbers

| Metric | Count |
|---|---|
| Sessions | 11 |
| Total tool calls | 789 |
| Bash | 298 |
| Edit | 165 |
| Files touched | 68 |
| Wall-clock | 9+ hours |
| Largest session | CoffeeChat renewal — 279 calls |
| Smallest session | Session 3 — 6 calls |
| Model | claude-fable-5 (all sessions) |

Sessions 1 and 2 hit the spend limit before any work could start — that's why the day effectively began at session 3.

The most Edit-heavy session was the JDLab pipeline audit at 43 edits. Most Bash calls across the day were build verification and test runs, not exploratory commands.

The spread between largest and smallest session (279 vs 6 calls) reflects how different the work was. CoffeeChat needed sustained, iterative UI work with constant render verification. Other sessions were surgical — one broken assumption, one fix, tests green, done.

## What Changed

Three durable changes came out of today, not just completed features:

1. **CoffeeChat is a different product.** The mentor-mentee framing is gone; the AI interview platform is live.
2. **Dynamic Workflow authorization is now in config.** No more per-session friction for ③-scale tasks.
3. **The email pipeline has tiering, guards, and a test suite.** It went from a single-path send to a defended, tiered system.

The rest — the application, the PDF, the individual bug fixes — were one-off tasks that are done and don't need revisiting.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
