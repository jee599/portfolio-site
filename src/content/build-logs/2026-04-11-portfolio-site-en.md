---
title: "2,357 Claude Sessions, Zero Tool Calls — What That Number Actually Means"
project: "portfolio-site"
date: 2026-04-11
lang: en
pair: "2026-04-11-portfolio-site-ko"
tags: [claude-code, claude-haiku, automation, prompt-engineering, orchestration, batch]
description: "2,357 Haiku sessions with 0 tool calls. Claude Code designed the pipeline; a script ran it. Separating orchestrator from executor cuts costs 10x and keeps context clean."
---

My session log shows 2,357 entries — all `claude-haiku-4-5-20251001`. Total tool calls across all of them: zero. Claude Code ran 2,357 times without touching a single file.

**TL;DR** Claude Code's job was to design the script. The 2,357 iterations ran without it. Splitting your AI toolchain into layers keeps the main context clean and cuts costs by 10x or more.

## The Log Entry That Made Me Stop and Look Twice

Every session in the log looks identical:

```
Generate a 3-paragraph compatibility description for rat and tiger
(Chinese Zodiac) in the target language.
Score: 65/100, Relationship: generating.
```

No Edit calls. No Bash. No Read. Pure text generation. This wasn't Claude Code running interactively — it was a script making direct POST requests to the Anthropic API. Claude Code only came in to *build* that script.

That distinction matters more than it sounds.

## Why You Should Never Do Bulk Generation Inside Claude Code

My first instinct was to run everything inside a single Claude Code session. Three things broke immediately.

**Context pollution.** When you generate hundreds of outputs in one session, the conversation history accumulates. By request 100, the model is already influenced by the previous 99 outputs. Responses start converging toward a mean — distinct early outputs, then gradual drift toward uniformity. A script that makes independent API calls starts each request with a clean context. Output variance stays where you want it.

**Cost.** Running structured, format-constrained generation on Sonnet costs more than 10x what Haiku costs for the same task. A prompt like "generate 3 paragraphs in this structure" doesn't need creative reasoning — it needs reliable JSON formatting. Haiku handles that with no quality drop. Using Sonnet here is like deploying a senior engineer to fill in a spreadsheet.

**Parallelism.** The saju app needed 12×12 zodiac combinations × 8 languages = 1,152 content pieces. A script fans out across all 144 sign pairs concurrently. A Claude Code interactive session is fundamentally sequential. There's no way to get that throughput from a single chat window.

## What Claude Code Actually Did in 2,357 Sessions

Claude Code showed up for exactly four things at the start:

1. **Prompt template design** — structuring four variables (`sign_a`, `sign_b`, `score`, `relationship`) to control the full output
2. **JSON schema definition** — writing the instruction that forces parseable responses
3. **Pipeline script** — the loop that iterates 144 combinations × 8 languages
4. **First parse error** — catching and fixing a JSON key translation bug

After that, 2,353 sessions ran without Claude Code present at all.

## The Actual Architecture

```
Claude Code (Sonnet) → prompt design / script authoring / debugging
         ↓
Python script → direct Haiku API calls (144 combinations × 8 languages)
         ↓
JSON response → database
```

## Two Prompt Decisions That Made the Difference

### The `Relationship` Field Nobody Thinks to Add

Passing only a numeric score creates inconsistent paragraph tone. "65/100" is ambiguous — is this good? Borderline? The model decides each run, inconsistently.

Adding `Relationship: generating` anchors the entire description to a theme: two signs that actively build something together. `overcoming` produces descriptions centered on friction and growth. `same` produces the tension of mirrored personalities. One variable controls the narrative arc across all three paragraphs.

Without it, you get three technically correct paragraphs that don't cohere. With it, the output reads intentional.

### Never Let the Model Translate JSON Keys

This is the most common batch generation mistake. Ask for output in Japanese, and the model occasionally returns `説明` instead of `description`. Your parser breaks silently. You discover this at item 847 of 1,152.

The fix is one line:

```
Return JSON with these exact keys (do NOT translate the keys):
{"description": [...], "faq": [{"q": "...", "a": "..."}]}
```

That instruction held across all 2,357 sessions. Zero parse failures after adding it.

## Same Prompt, Eight Languages, Eight Different Voices

The entire multilingual system runs on one clause: `in the target language`. No language-specific prompts. No separate templates.

Here's what Rat-Tiger (65/100) looks like as the opening line across four languages:

**English** — direct, outcome-focused:
> "The Rat and Tiger relationship scores a moderate 65/100—promising but requiring effort."

**Japanese** — relationship dynamics first:
> "相性スコアは65点です。発展途上というのは、互いに惹かれるものがある一方で..."

**Chinese** — practical and action-oriented:
> "鼠虎配对的兼容指数为65分，处于'生成'阶段，意味着你们需要主动建立和维护这段关系。"

**Vietnamese** — plainspoken, no hedging:
> "Chuột và Hổ được ghi 65/100—mức này có nghĩa là họ không hợp tự nhiên nhưng hoàn toàn có thể xây dựng được gì đó..."

Same variables. Cultural framing adapts automatically. No post-processing, no human translation layer.

## The Numbers

| Metric | Value |
|--------|-------|
| Total sessions | 2,357 |
| Tool calls | 0 |
| Time per session | 0–1 min |
| Languages | 8 (ko, en, ja, zh, vi, th, id, hi) |
| Sign pair combinations | 144 (12×12) |
| Total content pieces | 1,152 |
| Model | claude-haiku-4-5-20251001 |

## When to Stay in Claude Code, When to Leave

The rule is simple.

**Use Claude Code interactively when:** you're modifying files, making decisions that require accumulated context, diagnosing errors, or changing architecture. These tasks need the feedback loop.

**Go programmatic when:** you're doing structured repetition, the input/output contract is fully defined, and you need parallelism. Claude Code's interactive overhead — conversation history, tool scaffolding — actively works against you here.

The counterintuitive insight: sometimes leaving Claude Code is the best way to use Claude Code. Design in the interactive session. Execute outside it. The orchestrator stays clean; the executor runs at optimal cost.

> Separate the orchestrator from the executor, and both can focus on what they're actually good at.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
