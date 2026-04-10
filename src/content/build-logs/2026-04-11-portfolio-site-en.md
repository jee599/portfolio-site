---
title: "839 Sessions, 0 Tool Calls: Separating Claude Code Orchestration from Haiku Execution"
project: "portfolio-site"
date: 2026-04-11
lang: en
pair: "2026-04-11-portfolio-site-ko"
tags: [claude-code, claude-haiku, automation, cost-optimization, pipeline]
description: "839 Claude sessions, zero tool calls. How separating orchestration from execution cuts costs while scaling content generation with Haiku API."
---

839 sessions in the Claude Code history. Zero tool calls.

Not a bug. Not a misconfiguration. By design.

**TL;DR** — Instead of generating content inside Claude Code's interactive session, I wrote a Python script that calls the Haiku API directly. Claude Code (Sonnet) handled design and debugging. Haiku ran 839 independent API sessions to generate structured multilingual content. Separating orchestration from execution cuts costs by 10x and keeps Claude Code's context clean.

## What 839 Sessions Without a Single Tool Call Looks Like

The session history is immediately strange. The model is `claude-haiku-4-5-20251001`. The user prompts look like this:

```
Generate a 3-paragraph compatibility description for rat and ox.
Paragraph 1: Overall compatibility summary (2-3 sentences).
             Start with the core answer: reference the specific score and relationship.
...
Respond ONLY with valid JSON, no markdown fences:
{"description":["p1","p2","p3"],"faq":[{"q":"...","a":"..."},...]}
```

No Edit calls. No Bash executions. No Read operations. Every session is just a user prompt and a model response.

This isn't Claude Code running interactively. A Python script was calling the Anthropic API directly. Claude Code's only role was designing that script and launching it. Once the script started, Claude Code stepped back entirely.

The distinction between these two modes is the foundation of the whole pattern:

- **Claude Code interactive session**: file edits, code review, architecture decisions, debugging — Sonnet or Opus
- **Programmatic API call**: structured, repeatable output tasks — Haiku

Conflating the two is the mistake most people make when they first start using Claude Code for content pipelines.

## Why Splitting the Layers Matters

The obvious approach is to generate everything inside a Claude Code session. I did this in early experiments. Three problems killed it.

**Cost at scale.** The task was generating 1,152 content pieces — compatibility descriptions and FAQ entries for every combination of 12 zodiac signs, in 8 languages. Generating that with Sonnet costs roughly 10x more than Haiku for equivalent structured output. When the task is purely mechanical — consistent format, no creative judgment required — paying for a more capable model is waste. The model's job here isn't to be smart. It's to be consistent.

**Context window pollution.** Running hundreds of generation requests inside a single Claude Code session means all that output accumulates in the conversation context. By the 50th request, the model is carrying the weight of the previous 49. Each subsequent generation starts with a polluted context window that wasn't designed to hold content data. A script calling Haiku directly gives each request a completely clean, isolated session — no carryover, no drift.

**Parallelism and control.** The script iterates over every sign-combination × language pair and fires independent API calls. It can retry failures, log errors per request, and resume from where it left off without touching a Claude Code session. Replicating this kind of batch control inside an interactive session is messy. The scripting layer handles it naturally.

## The Actual Orchestration Architecture

The full pipeline looks like this:

```
Claude Code (Sonnet)
  → designs prompt templates
  → defines JSON output schema
  → writes the Python pipeline script
  → debugs session 1 error
         ↓
Python script (runs independently)
  → iterates over all (sign_a × sign_b × language) combinations
  → calls Anthropic API directly with Haiku model
  → parses JSON response
  → writes to database
         ↓
838 additional Haiku sessions
  → no Claude Code involvement
```

What Claude Code actually contributed to this pipeline was about 4 things: designing the prompt template structure, defining the expected JSON schema, writing the script that drives the pipeline, and debugging the single error that appeared in session 1. After that, 838 sessions ran autonomously.

The supervisory role is real but narrow. Claude Code is the architect, not the laborer. This is the correct mental model for any content pipeline.

## Session 1: The Error That Validated the Design

Session 1 shows a `<synthetic>` model tag and an `Invalid API key` error.

A `<synthetic>` model appearing in session logs means the API key was never recognized — the request didn't reach the model routing layer at all. The root cause: `ANTHROPIC_API_KEY` wasn't set in the deployment environment. The `.env` file was local-only and hadn't been registered in the production configuration.

The fix was straightforward: add the environment variable directly to the deployment settings. Session 2 onward worked without issue.

What matters here isn't the bug itself — it's where it surfaced. The error appeared in session 1, not session 500. The pipeline was designed to be fail-fast: if the very first API call fails, the entire run aborts immediately. This is non-negotiable for any batch pipeline running at this scale.

A silent failure mode — where session 1 returns empty output, logs a warning, and continues — would have produced 838 sessions of garbage data before anyone noticed. Fail-fast caught the environment misconfiguration before a single row of bad data was written.

The remaining 838 sessions ran without interruption.

## Forcing Consistency Out of Haiku

Haiku is cheap and fast, but it ignores vague instructions. "Write naturally" produces inconsistent output. "Vary your phrasing" gets interpreted differently on each call. Soft guidance is wasted tokens.

The solution is format enforcement at the prompt level, not the instruction level.

**Blocking markdown fences.** The last line of every prompt:

```
Respond ONLY with valid JSON, no markdown fences:
```

Without this, Haiku frequently wraps responses in ` ```json ` code blocks. That's valid when a human is reading the output, but it breaks `json.loads()` in the script. Explicit prohibition in the prompt eliminates the issue entirely. Parse error rate after adding this line: zero.

**Inline schema definition.** Immediately after the instruction, provide the exact schema:

```
{"description":["p1","p2","p3"],"faq":[{"q":"...","a":"..."},...]}
```

This does two things: it removes ambiguity about the expected structure, and it anchors Haiku's output format to a concrete example. Haiku is a strong few-shot learner. Showing the schema is more effective than describing it.

**Explicit role assignments per paragraph.** Generic paragraph instructions produce generic output:

```
# Bad
Write 3 paragraphs about compatibility.

# Good
Paragraph 1: Overall compatibility summary (2-3 sentences).
             Start with the core answer: reference the specific score and relationship.
Paragraph 2: Communication and daily interaction patterns.
             Include specific behavioral tendencies for each sign.
Paragraph 3: Long-term potential and key friction points.
             End with a concrete recommendation.
```

The difference between these two approaches is significant. Without `reference the specific score`, Haiku would sometimes describe compatibility in general terms without mentioning the numerical score that the application needed to display. Explicit role definitions remove the model's discretion on structure — they specify not just what to write about, but how to lead each section.

The result: 839 structured JSON responses with no deviation from schema and no parse failures after the formatting rules were established.

## Scale Metrics

| Metric | Value |
|--------|-------|
| Total sessions | 839 |
| Tool calls | 0 |
| Avg session duration | 0–1 min |
| Parse errors | 0 (after schema enforcement) |
| Languages supported | 8 |
| Zodiac combinations | 144 (12×12) |
| Total content pieces | 1,152+ |
| Model | claude-haiku-4-5-20251001 |

The numbers tell the story. 839 sessions with zero tool calls means 839 clean, isolated, fast API calls — none of the overhead of a full Claude Code interactive session. The pipeline ran to completion without human intervention after the session 1 fix.

## The Decision Framework: When to Use Which Pattern

Not every Claude task belongs in an interactive session. The decision rule comes down to what the task actually requires.

**Use Claude Code interactive when the task involves judgment or filesystem access:**
- The task requires reading existing code and understanding its context
- The task requires modifying files based on what's already there
- The task involves architectural decisions that need back-and-forth refinement
- The task requires accumulated context — each step informs the next

**Use programmatic Haiku API when the task is batch and mechanical:**
- The same request structure applies to many different inputs (a template with variable substitution)
- Input/output pairs are well-defined and consistent across the batch
- The volume is large enough that model cost is a significant factor
- Parallelism matters — each request is independent and can run concurrently

The test is simple: could you write the task as a function with parameters? If yes, it belongs in a script calling Haiku. If the task requires reading the current state of a file to know what to do next, it belongs in a Claude Code session.

Following this split keeps Claude Code focused on what it's actually good at — judgment, context-aware decisions, and system design. Haiku handles the mechanical execution at minimum cost.

## What This Architecture Gets You

The 0-tool-call pipeline isn't just a cost optimization. It's a cleaner architecture.

Each Haiku session is stateless and isolated. If one fails, it doesn't affect the others. The script can log the failure, skip that combination, and continue. You get full observability per request — response time, parse success, output length — without any of it touching the Claude Code context window.

Claude Code stays clean. The interactive session remains focused on design decisions and debugging. It never accumulates hundreds of generated content pieces in its context. When you return to the session, the context is exactly where you left it: the script, the schema, the architecture.

The separation also makes iteration faster. If the prompt template needs adjustment, you change one string in the script and re-run the affected combinations. You're not trying to modify prompt behavior mid-session while the model is already holding 300 generated responses in context.

## The Principle

> Put the right tool at the right layer. Cost and quality aren't a trade-off when the architecture is correct.

Trying to do everything inside Claude Code's interactive session is expensive, slow, and eventually breaks down as context fills up. Designing the pipeline with Claude Code and executing it with direct Haiku API calls is the correct division of responsibility.

839 sessions with zero tool calls isn't a curiosity. It's a signal that the architecture is working as intended.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
