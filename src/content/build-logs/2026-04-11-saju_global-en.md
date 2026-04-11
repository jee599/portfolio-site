---
title: "Pre-generating 2,313 Multilingual Compatibility Texts with Claude Haiku — One Prompt, 8 Languages"
project: "saju_global"
date: 2026-04-11
lang: en
pair: "2026-04-11-saju_global-ko"
tags: [claude-api, haiku, content-generation, i18n, prompt-engineering]
description: "144 zodiac pairs × 8 languages = 2,313 Claude Haiku API calls, done in one day. One prompt template, zero per-language duplication."
---

2,313 Claude Haiku API calls. One day. 8 languages. That's how the entire Chinese zodiac compatibility database for `saju_global` got pre-generated.

**TL;DR** — A single prompt template with "in the target language" as the only language directive covered all 8 languages. Pre-generating into a DB beat on-demand LLM generation for both UX and cost. Model choice: Haiku — format compliance is the job here, not creativity. No reason to pay for Sonnet.

## What Needed to Get Built

`saju_global` needed **Chinese Zodiac compatibility** content. 12 signs × 12 signs = 144 pairs. Each pair gets a 3-paragraph description plus 3 FAQ Q&A entries. The app supports 8 languages: Korean, English, Japanese, Simplified Chinese, Vietnamese, Thai, Indonesian, and Hindi.

Generating on-demand means every user waits on an LLM response. **Pre-generating into a DB** was the obvious call — and that decision locked in the entire prompt design strategy.

144 pairs × 8 languages = 1,152 content pieces. Add FAQs and the session count reaches 2,313. Writing this by hand would take months. The API pipeline did it in a day.

## The Prompt That Ran 2,313 Times

Every single session used the same template:

```
Generate a 3-paragraph compatibility description for {sign_a} and {sign_b}
(Chinese Zodiac) in the target language.
Score: {score}/100, Relationship: {relationship_type}.

Paragraph 1: Overall compatibility summary (2-3 sentences).
Start with the core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences).
Reference specific elements and interactions.
Paragraph 3: Potential challenges and advice (2-3 sentences).

Also generate 3 FAQ Q&A pairs about this combination.
```

Three variables: `{sign_a}`, `{sign_b}`, `{score}/{relationship_type}`. The language directive is just **"in the target language"** — one line, 8 languages covered. No separate prompt per language. The target language is injected at the application layer per request, alongside the prompt. Haiku handles the rest.

## The `Relationship` Field Is Doing More Work Than It Looks

The `Relationship:` field in the prompt isn't just a label — it's a consistency anchor.

Each pair is classified into one of three types:

- `generating` — the pairing creates energy between the two signs (e.g., Rat + Tiger, 65/100)
- `overcoming` — fundamental differences that require deliberate effort to bridge (e.g., Rat + Ox, 60/100)
- `same` — same sign pairing (e.g., Rat + Rat, 50/100)

One word shifts the entire output. With `Relationship: generating`, all three paragraphs carry a "drawing out potential" undercurrent. With `overcoming`, the challenge-and-growth arc runs consistently from paragraph one through three.

Without this field, the same score produces inconsistent tone — one paragraph optimistic, the next cautionary, the third neutral. The relationship type is the thread that holds all three paragraphs together.

## Why Haiku, Not Sonnet

Every session ran on `claude-haiku-4-5-20251001`. Three reasons:

**Speed.** Most sessions completed in under a minute. Running 2,313 calls in parallel wasn't a bottleneck.

**Cost.** This task isn't about creativity — it's about **consistent format compliance**. The output structure is fixed: 3 paragraphs, then 3 FAQ pairs. Haiku follows structured prompts reliably. Paying for Sonnet or Opus to do this is wasteful.

**Multilingual quality.** Session logs showed natural output across all 8 languages — including Devanagari script for Hindi, Thai script, and natural Japanese. Haiku didn't hallucinate or code-switch. Every language came back clean.

For tasks where "3 structured paragraphs, consistent tone" is the success criterion, Haiku is the right model. Know the job before picking the tool.

## Why Every Session Logged 0 Tool Calls

Every session logged `tool calls: 0`. Expected — this wasn't a Claude Code file-editing workflow.

The actual pipeline: a script generates the full list of 144 combinations × 8 languages, POSTs each combination directly to the Claude API, and writes the response JSON to the DB. Claude Code was used to **write the pipeline script itself** — not to run the content generation loop. The loop runs independently on the server.

This distinction matters for cost accounting. Zero tool calls means session cost is purely prompt + completion tokens, no overhead from file reads or edits.

## Same Pair, 8 Languages — How the Nuance Shifts

Rat + Tiger (65/100, `generating`) across all 8 languages produced genuinely different text — not just translated words, but culturally tuned framing.

English came back direct: "The Rat and Tiger relationship scores a moderate 65/100—promising but requiring effort."

Japanese softened the framing: "相性スコアは65点です。発展途上というのは、互いに惹かれるものがある一方で、ものの見方や行動パターンに根本的な違いが存在するということです。"

Chinese leaned practical: "鼠虎配对的兼容指数为65分，处于"生成"阶段，意味着你们需要主动建立和维护这段关系。"

The prompt didn't change. Cultural register shifted naturally by language. No language-specific instructions needed — the model's multilingual training does the heavy lifting. That's exactly the behavior "in the target language" is designed to unlock.

## The JSON Key Translation Trap

One pitfall with multilingual bulk generation that's easy to miss: LLMs occasionally translate JSON keys when the output language isn't English.

Ask for Japanese output without explicit instructions, and you might get `"説明"` instead of `"description"` as a key. That breaks every downstream parser.

The fix is one line in the prompt:

```
Return JSON with these exact keys (do NOT translate the keys):
{"description": [...], "faq": [{"q": "...", "a": "..."}]}
```

Explicit. Unambiguous. That single instruction locked in parsing stability across all 2,313 sessions. Without it, you're playing whack-a-mole with JSON parsing errors at bulk scale.

## The Numbers

| Metric | Value |
|---|---|
| Total sessions | 2,313 |
| Time per session | 0–1 min |
| Tool calls per session | 0 |
| Languages covered | 8 (ko, en, ja, zh, vi, th, id, hi) |
| Zodiac pairs | 144 |
| Content per pair | 3 paragraphs + 3 FAQ pairs |
| Model | claude-haiku-4-5-20251001 |

## What to Take From This

**One prompt, one language directive.** "In the target language" covers 8 languages. No per-language duplication.

**Relationship type is a consistency multiplier.** Score alone lets tone drift across paragraphs. A named relationship type locks the narrative arc end to end.

**Know when Haiku is enough.** If the task is structured output compliance — not open-ended creativity — Haiku delivers. Don't over-spend on model capability the task doesn't need.

**Explicitly block JSON key translation.** One line prevents bulk parsing failures at scale. Add it every time.

**Pre-generation beats on-demand when content is finite.** Users get instant responses; you pay once. Both UX and cost win.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
