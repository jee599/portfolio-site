---
title: "2,314 Sessions, Zero Tool Calls: Why I Split Claude Code from the Haiku API"
project: "portfolio-site"
date: 2026-04-11
lang: en
pair: "2026-04-11-portfolio-site-ko"
tags: [claude-code, claude-haiku, automation, prompt-engineering, cost-optimization, pipeline]
description: "2,314 Haiku API sessions with 0 tool calls. How separating the orchestration layer from batch execution cuts costs 10x without sacrificing quality."
---

My session log shows 2,314 entries. Tool calls: zero. Not a single Edit, Bash, or Read. That's not a bug — it's the point.

**TL;DR** Claude Code (Sonnet) designed the system. A Python script called the Haiku API directly for 2,314 batch requests. Splitting the orchestration layer from the execution layer delivers a 10x cost reduction while keeping output quality consistent.

## What "2,314 sessions, 0 tool calls" actually means

Open the session log and the pattern is immediately strange. Model: `claude-haiku-4-5-20251001`. Prompt: `Generate a 3-paragraph compatibility description for rat and ox...`. No file edits. No shell commands. No tool calls at all.

This isn't an interactive Claude Code session. It's a script POSTing directly to the Anthropic API — 2,314 times. Claude Code's role was limited to designing that script and running it once. The distinction matters:

- **Interactive Claude Code**: file modifications, architectural decisions, debugging → Sonnet
- **Programmatic API**: batch tasks with identical structure repeating at scale → Haiku

Using Sonnet for the second category is like deploying a senior engineer to fill in spreadsheets.

## Why the layer split was necessary

The first instinct was to generate content directly inside Claude Code. Three problems killed that approach fast.

**Cost** is first. Generating 1,152 content pieces with Sonnet costs more than 10x what Haiku costs for the same structured output. When the task is "follow a format consistently" rather than "reason about an ambiguous problem," that cost difference is indefensible.

**Context accumulation** is second. Generating hundreds of pieces in a single Claude Code session means the conversation context keeps growing. A script calling Haiku directly gives each request a completely clean, isolated session — no carryover, no drift, consistent outputs from request #1 through request #2,314.

**Parallelism** is third. The script iterates over 144 zodiac combinations and fires 8 language calls in parallel per combination. That parallelism structure is impossible to replicate inside a single interactive session.

## The actual architecture

```
Claude Code (Sonnet) → prompt design / script authoring / debugging
         ↓
Python script → direct Haiku API calls (144 combinations × 8 languages)
         ↓
JSON response → database
```

Claude Code touched four things: prompt template design, JSON schema definition, pipeline script, and debugging the first API error. Everything after that — all 2,313 remaining sessions — ran without human involvement.

## Forcing structured output from Haiku

Haiku ignores soft instructions. Phrases like "respond naturally" or "vary your phrasing" don't work. Output format has to be mandated at the prompt level.

```
Respond ONLY with valid JSON, no markdown fences:
{"description":["p1","p2","p3"],"faq":[{"q":"...","a":"..."},...]}
```

Markdown fences (` ```json `) break `json.loads()`. This one line eliminates the problem. Parse errors after adding it: zero.

Paragraph roles also need to be explicit:

```
Paragraph 1: Overall compatibility summary (2-3 sentences).
             Start with the core answer: reference the specific score and relationship.
```

Without `reference the specific score`, Haiku would sometimes describe compatibility without mentioning the actual numerical score (e.g., 60/100). If you want something in the output, you have to say it. Soft implication doesn't register.

## One field that controls three paragraphs

The prompt includes a `Relationship:` field that describes the nature of the pairing, not just its score:

- `generating` — partners that draw energy out of each other (rat-tiger, 65/100)
- `overcoming` — pairs that need to work through differences (rat-ox, 60/100)
- `same` — same zodiac sign (rat-rat, 50/100)

That single word controls the tone across all three paragraphs. `generating` consistently produces "draws out," "complements," "mutual momentum." `overcoming` yields "bridge the gap," "requires conscious effort," "adaptation." Without this field, the same score produces tonally inconsistent paragraphs. One variable, full output coherence.

## Multilingual output without multilingual prompts

Eight language variants — Korean, English, Japanese, Chinese, Vietnamese, Thai, Indonesian, Hindi — with zero separate prompts per language. The entire localization is a single line in the system prompt:

```
Respond in the target language.
```

The script passes the target language per call, and Haiku handles the rest. The rat-tiger 65/100 pairing:

English: *"The Rat and Tiger relationship scores a moderate 65/100—promising but requiring effort."*

Japanese: *"相性スコアは65点です。発展途上というのは、互いに惹かれるものがある一方で..."*

Chinese: *"鼠虎配对的兼容指数为65分，处于"生成"阶段，意味着你们需要主动建立和维护这段关系。"*

Cultural nuance comes through naturally, no post-processing needed.

One gotcha: Haiku occasionally translates JSON keys along with the content. Japanese requests sometimes returned `"説明"` instead of `"description"`, breaking the parser. Fix:

```
Return JSON with these exact keys (do NOT translate the keys)
```

That one instruction is what kept 2,314 responses parseable.

## Results

| Metric | Value |
|--------|-------|
| Total sessions | 2,314 |
| Tool calls | 0 |
| Avg session duration | 0–1 min |
| Parse errors | 0 (after schema enforcement) |
| Languages supported | 8 (ko, en, ja, zh, vi, th, id, hi) |
| Combinations generated | 144 (12×12) |
| Model | claude-haiku-4-5-20251001 |

## When to use this pattern

The decision is straightforward.

**Use interactive Claude Code when**: you're modifying files, making design decisions that require accumulated context, or debugging something non-deterministic.

**Use programmatic API when**: the same request structure repeats at scale, inputs and outputs are clearly defined, cost sensitivity is high.

Keep them separate and Claude Code stays focused on high-judgment work. Haiku handles volume at minimum cost.

> Put each tool at the right layer and you stop choosing between cost and quality.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
