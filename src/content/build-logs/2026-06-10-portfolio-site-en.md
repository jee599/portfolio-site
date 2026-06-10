---
title: "One Line in CLAUDE.md Gives Claude Autonomous Multi-Agent Workflow Authority"
project: "portfolio-site"
date: 2026-06-10
lang: en
pair: "2026-06-10-portfolio-site-ko"
tags: [claude-code, dynamic-workflow, claude-md, orchestration, multi-agent]
description: "Adding a standing approval policy to CLAUDE.md lets Claude self-assess task size and spin up multi-agent workflows autonomously. 5 sessions, 12 tool calls, 1 file changed."
---

One text file change. Six minutes. Now Claude decides on its own when to spin up a multi-agent workflow.

**TL;DR** Added a standing authorization policy to the global `~/.claude/CLAUDE.md`. From the next session on, Claude reads task size and autonomously decides whether to run a Workflow — no per-request approval needed. One file modified. Six minutes total.

## Why Per-Session Approval Was Slowing Things Down

Claude Code's default behavior requires user confirmation before executing the Workflow tool. For broad audits or work spanning many independent files, this is a bottleneck. Even when a task is clearly fan-out in nature, Claude stops and asks "Can I use a workflow?" every time.

The session started with a simple ask:

> "I want Claude to be able to use dynamic workflows based on task size and efficiency — on its own judgment."

The simplest implementation: write the policy into `CLAUDE.md`. No code changes. Text changes behavior.

## The Three-Tier Sizing Criteria That Actually Works

Added sizing criteria to the Routing section of `~/.claude/CLAUDE.md`. Two Edit calls, one Read, four Bash — done.

**Tier 1 — Direct**: Simple lookups or single-file edits. Claude handles it inline, no agents.

**Tier 2 — Subagents as needed**: Multi-file work that fits within one context window. Claude spawns subagents only as warranted.

**Tier 3 — Workflow**: Broad fan-out work. Audits, reviews, migrations, or research spanning many independent units. Requests with keywords like "thorough" or "comprehensive". Or roughly 10+ independent work items.

Two additional constraints were baked in: agent count should scale to the task, not be maximized; and before fanning out, Claude must say in one line what's being parallelized and at what scale.

## Switching to Fable 5 and Effort xhigh

Same session: used `/model` to switch the default model to Fable 5. Sessions from this point forward run on Fable 5.

Session 5 added `/effort xhigh` — a setting exclusive to Fable 5, Opus 4.8, and 4.7 that sits just below the maximum, described as "deeper reasoning than high." The configuration takes about a minute to set. The downstream effect on output quality is not minimal.

## Subagents and Workflows Aren't Mutually Exclusive

Session 5 surfaced a clarifying question:

> "If I use subagents, can I still use dynamic workflow?"

Short answer: yes. Workflows *contain* subagents. Every `agent()` call inside a workflow script is a subagent. `pipeline()` and `parallel()` are the scheduling layer that determines order and concurrency for those subagents.

Custom agent types also work inside Workflows. You can write `agent(prompt, {agentType: 'dental-clinic'})` to slot a specialized agent — a dental marketer, a code reviewer — as a pipeline stage. This is why Workflow is an orchestration layer, not just a parallel execution tool: it lets you compose specialized roles into a coherent pipeline.

## Checking In on the Dental Agent

Session 3 checked the status of the dental agent (Dongbaek-UDI clinic). Nothing new was run this session — the last run was four days prior (June 6). A report quality improvement request came in, which was routed to the `dental-clinic` subagent per the routing rules. One Agent tool call.

The reason the main session doesn't handle this directly: the dental agent is designed to restore full context by reading `clinic.json`, `history.json`, and the entire `cache/` directory. Having the main session re-read and process the same files is redundant work, not a shortcut.

## Coffee Chat Site Renewal — Planning Stage

Session 4 brought a completely different project request:

> "I want to rebuild the coffee chat site — not as a mentor-mentee connector, but as a platform with resume generation, portfolio review, and a mock interview with three AI agents."

Four Bash calls to survey the existing codebase. The session ended at the planning stage; implementation was deferred to the next session.

Each of the three features has a distinct open decision:
- **Resume generation**: form-based input vs. freeform text
- **Portfolio review**: URL submission vs. file upload
- **Mock interview**: role distribution across three agents + voice input stack

These decisions drive the implementation architecture. None of them have defaults that are obviously correct.

## Stats

<div class="change-summary">
<table>
<thead><tr><th>Item</th><th>Value</th></tr></thead>
<tbody>
<tr><td class="label">Total sessions</td><td class="after">5</td></tr>
<tr><td class="label">Sessions with actual tool use</td><td class="after">2 (sessions 3, 4)</td></tr>
<tr><td class="label">Total tool calls</td><td class="after">12</td></tr>
<tr><td class="label">By tool (Bash / Edit / Read / Agent)</td><td class="after">8 / 2 / 1 / 1</td></tr>
<tr><td class="label">Files modified</td><td class="after">1 (~/.claude/CLAUDE.md)</td></tr>
<tr><td class="label">Time (active sessions)</td><td class="after">~7 minutes</td></tr>
<tr><td class="label">Default model</td><td class="after">Changed to Fable 5</td></tr>
</tbody>
</table>
</div>

The core lesson: Claude's behavior is configurable through policy files, not code. One paragraph in `CLAUDE.md` determines whether Claude runs Workflow autonomously across every future session. Six minutes of configuration, permanently applied.

The implication is broader than this single change: any behavioral constraint you keep re-stating in conversations could be moved into `CLAUDE.md` once and stop being a recurring cost. The policy file is the interface.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
