---
title: "2,314 Claude Haiku Sessions, Zero Tool Calls: Separating Orchestration from Execution"
project: "portfolio-site"
date: 2026-04-11
lang: en
pair: "2026-04-11-portfolio-site-ko"
tags: [claude-code, claude-haiku, automation, cost-optimization, pipeline, prompting]
description: "2,314 Haiku API sessions, 0 tool calls. How I split Claude Code orchestration from programmatic execution to generate 1,152+ content pieces at minimum cost."
---

My Claude Code session history shows 2,314 entries. Tool calls: 0. No file edits, no bash commands, no reads. Just structured API calls generating content at scale.

Here's how that's possible — and why it's the right architecture.

**TL;DR** — Instead of generating content inside a Claude Code interactive session, I wrote a script that calls the Haiku API directly. Claude Code (Sonnet) designed and debugged the script. Haiku ran 2,314 API calls independently. Result: 1,152+ content pieces across 8 languages, with Claude Code never touching a single file during execution.

## What 2,314 Sessions With Zero Tool Calls Actually Looks Like

The session log has an unusual pattern. Model: `claude-haiku-4-5-20251001`. User prompt: `Generate a 3-paragraph compatibility description for rat and ox...`. No Edit calls. No Bash. No Read. Tool call count: zero.

This isn't a Claude Code interactive session. A Python script is calling the Anthropic API directly. Claude Code designed and launched that script — but the 2,314 content generation calls happened entirely outside of it.

The distinction matters:

- **Claude Code interactive**: file edits, code review, architectural decisions → Sonnet or Opus
- **Programmatic API**: repeatable structured tasks → Haiku

Conflating the two is the mistake most people make when they first use Claude Code for content pipelines.

## Why Split the Layers at All

My first instinct was to generate content directly inside Claude Code. That hit three walls fast.

**Cost.** Generating 1,152 content pieces with Sonnet costs roughly 10× more than Haiku for equivalent structured output. Structured repetitive tasks don't need creativity — they need consistency. Paying for a more capable model here is just waste.

**Context window pollution.** Running hundreds of generation requests inside a single Claude Code session means all that output accumulates in the conversation context. By the 50th request, the model carries the weight of the previous 49. A script calling Haiku directly gives each request a completely clean, isolated session — no carryover, no drift.

**Parallelism and control.** The script iterates over all zodiac combinations and fires independent API calls per language. It can retry failures, log errors per request, and resume from where it left off without touching a Claude Code session. That level of batch control is difficult to replicate inside an interactive session.

## The Actual Orchestration Architecture

The full pipeline:

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
Remaining 2,313 Haiku sessions
  → no Claude Code involvement
```

What Claude Code actually contributed: designing the prompt template structure, defining the expected JSON schema, writing the pipeline script, and debugging the one error in session 1. After that, the remaining sessions ran autonomously. Claude Code was the architect, not the laborer.

## Session 1 Failed — And That Was the Right Design

Session 1 logged as `<synthetic>` model with an `Invalid API key` error. When a synthetic model appears instead of Haiku, it means the API key wasn't recognized at the routing layer at all.

The root cause: `ANTHROPIC_API_KEY` wasn't set in the deployment environment. The `.env` file only existed locally and hadn't been registered in the production config. The fix was adding the environment variable directly to the deployment settings. Session 2 ran cleanly.

The important part: the error surfaced in session 1, not session 500. The pipeline was designed to fail fast — the first call exposed the problem. A silent failure mode that logs a warning and continues would have produced thousands of sessions of garbage data before anyone noticed. Fail-fast caught the misconfiguration before a single bad row was written.

The remaining sessions ran without interruption.

## Forcing Consistency Out of Haiku

Haiku ignores soft instructions. Phrases like "write naturally" or "vary your phrasing" have no effect. Soft guidance is wasted tokens.

The solution is format enforcement at the prompt level.

**Block markdown fences.** One line at the end of every prompt:

```
Respond ONLY with valid JSON, no markdown fences:
```

Without this, Haiku frequently wraps responses in ` ```json ` code blocks. That's fine for human readers, but it breaks `json.loads()` in the script. Explicit prohibition eliminates the issue. Parse error rate after adding this line: zero.

**Provide an inline schema example.** Immediately after the instruction:

```
{"description":["p1","p2","p3"],"faq":[{"q":"...","a":"..."},...]}
```

Showing the schema is more effective than describing it. Haiku is a strong few-shot learner — a concrete example anchors the output format reliably.

**Assign explicit roles per paragraph.** Generic instructions produce generic output:

```
# Vague
Write 3 paragraphs about compatibility.

# Specific
Paragraph 1: Overall compatibility summary (2-3 sentences).
             Start with the core answer: reference the specific score and relationship.
Paragraph 2: Communication and daily interaction patterns.
             Include specific behavioral tendencies for each sign.
Paragraph 3: Long-term potential and key friction points.
             End with a concrete recommendation.
```

Without `reference the specific score`, Haiku would sometimes describe compatibility in general terms without mentioning the numerical score (e.g., 60/100) that the application needed to display. One specific instruction eliminates that ambiguity entirely.

## Scale Metrics

| Metric | Value |
|--------|-------|
| Total sessions | 2,314 |
| Tool calls | 0 |
| Avg session duration | 0–1 min |
| Parse errors | 0 (after schema enforcement) |
| Languages supported | 8 |
| Zodiac combinations | 144 (12×12) |
| Estimated content pieces | 1,152+ (144 × 8 languages) |
| Model | claude-haiku-4-5-20251001 |

## One Variable Controls the Entire Output Tone

The 2,314 session logs repeat three `relationship` types: `generating`, `overcoming`, `same`. Swapping that single parameter changes the entire narrative character of the output.

- `generating` (rat–tiger, 65 pts): framed around shared energy and possibility
- `overcoming` (rat–ox, 60 pts): framed around effort and bridging differences
- `same` (rat–rat, 50 pts): framed around mirrored weaknesses amplifying each other

Two pairs can share an identical 60-point score but produce completely different articles depending on the relationship type. One variable controls the entire narrative shape. That's intentional prompt architecture — not luck.

## The Decision Framework: When to Use Which Pattern

Not every Claude task belongs in an interactive session.

**Use Claude Code interactive when the task involves judgment or filesystem access:**
- Reading existing code and understanding its context
- Modifying files based on current state
- Architectural decisions requiring back-and-forth refinement
- Accumulated context where each step informs the next

**Use programmatic Haiku API when the task is batch and mechanical:**
- The same request structure applies to many different inputs
- Input/output schema is fixed and well-defined across the batch
- Volume is large enough that model cost matters
- Each request is independent and stateless

The test is simple: could you write the task as a function with parameters? If yes, it belongs in a script calling Haiku. If the task requires reading the current state of a file to know what to do next, it belongs in a Claude Code session.

## What This Architecture Gets You

The 0-tool-call pipeline isn't just cost optimization. It's a cleaner architecture.

Each Haiku session is stateless and isolated. If one fails, it doesn't affect the others. The script logs the failure, skips that combination, and continues. You get full observability per request — response time, parse success, output length — without any of it touching the Claude Code context window.

Claude Code stays clean. The interactive session remains focused on design and debugging. It never accumulates 1,152 generated content pieces in its context. When you return to the session, the context is exactly where you left it.

The separation also makes iteration faster. Adjusting the prompt template means changing one string in the script and re-running the affected combinations — not trying to modify behavior mid-session while the model holds hundreds of generated responses in context.

## The Principle

> Put the right tool at the right layer. Cost and quality aren't a trade-off when the architecture is correct.

Trying to do everything inside Claude Code's interactive session is expensive, slow, and eventually breaks down as context fills up. Designing with Claude Code and executing with direct Haiku API calls is the correct division of responsibility.

2,314 sessions with zero tool calls isn't a curiosity. It's a signal that the architecture is working as intended.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
