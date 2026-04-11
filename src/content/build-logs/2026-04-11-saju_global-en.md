---
title: "2,356 Claude Haiku Calls: Generating 1,152 Compatibility Texts Across 8 Languages"
project: "saju_global"
date: 2026-04-11
lang: en
pair: "2026-04-11-saju_global-ko"
tags: [claude-code, haiku, content-pipeline, i18n, prompting, batch]
description: "144 zodiac pairs × 8 languages = 1,152 content pieces. One structured prompt, 2,356 Haiku API calls, zero tool calls. How I pre-filled an entire DB in two days."
---

2,356 API calls. Zero tool calls. One prompt template. That's the entire content generation pipeline for a saju (Korean astrology) compatibility app — 1,152 localized content pieces produced in two days using `claude-haiku-4-5-20251001`.

**TL;DR** A single structured prompt with four variables filled the entire compatibility database. 144 zodiac pairs × 8 languages, each with a 3-paragraph description and 3 FAQ pairs. Pure text generation, no orchestration overhead.

## Why 1,152 Pieces?

A saju compatibility app needs two types of content per pairing: a **description** that explains what the relationship between two signs looks like, and **FAQs** that pre-answer the questions users actually ask.

12 zodiac signs × 12 signs = 144 combinations. Multiply by 8 target languages (Korean, English, Japanese, Chinese, Hindi, Thai, Indonesian, Vietnamese) and you need 1,152 content pieces. Each one is 3 paragraphs plus 3 Q&A pairs — roughly 400–600 characters. At 30 minutes per piece for a human writer, that's 576 hours of work.

The architecture decision: **pre-generate into the DB rather than generate on-demand**. Calling an LLM every time a user opens a compatibility page means unpredictable latency and unpredictable cost. Pre-fill the database once and every page load becomes a single DB query.

## One Template Drove All 2,356 Sessions

Every session used the same prompt template:

```
Generate a 3-paragraph compatibility description for {sign_a} and {sign_b}
(Chinese Zodiac) in the target language.
Score: {score}/100, Relationship: {relationship}.

Paragraph 1: Overall compatibility summary (2-3 sentences). Start with the
core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences). Reference specific
elements and interactions.
Paragraph 3: Potential challenges and advice (2-3 sentences).

Also generate 3 FAQ Q&A pairs about this combination. Each Q&A should
address a common question users have about this pairing...
```

Four variables: `sign_a`, `sign_b`, `score`, `relationship`. Everything else is fixed. **A fixed template makes output predictable.**

The response schema was equally rigid:

```json
{
  "description": ["paragraph1", "paragraph2", "paragraph3"],
  "faq": [
    {"q": "question1", "a": "answer1"},
    {"q": "question2", "a": "answer2"},
    {"q": "question3", "a": "answer3"}
  ]
}
```

All 2,356 sessions returned this exact shape. No file reads, no code execution, no tool calls — because the task was pure text generation with nothing to orchestrate.

## The `relationship` Field Changes Output Quality

The prompt includes a `Relationship:` field — not just a score, but a semantic label for the pairing dynamic:

- `generating` — signs that energize each other (e.g., Rat + Tiger, 65/100)
- `overcoming` — signs that have to work through fundamental differences (e.g., Rat + Ox, 60/100)
- `same` — same sign pairings (e.g., Rat + Rat, 50/100)

This one word has an outsized effect on output coherence. With `generating`, all three paragraphs carry a consistent "mutual pull" narrative. With `overcoming`, the arc is about navigating contrast. Without it, the model gets the same score but produces paragraphs that shift tone mid-way — optimistic opening, ambivalent close, no through-line.

The label threads a consistent story across the entire output.

## Why Haiku?

`claude-haiku-4-5-20251001` for every session.

This task is about **consistent format compliance**, not creativity. The model needs to produce exactly 3 paragraphs, exactly 3 FAQ pairs, and return valid JSON. Haiku handles that reliably. There's no reason to pay for Sonnet.

Each session runs in 0–1 minutes. Run them in parallel and 2,356 sessions completes in a fraction of wall-clock time. Throughput-per-dollar was the key metric — not subjective output quality.

## Same Prompt, Eight Cultural Registers

The same Rat + Tiger prompt (65/100, `generating`) produces noticeably different opening sentences across languages.

English is direct:
> "The Rat and Tiger relationship scores a moderate 65/100—promising but requiring effort."

Japanese centers the relationship:
> "相性スコアは65点です。発展途上というのは、互いに惹かれるものがある一方で、ものの見方や行動パターンに根本的な違いが存在するということです。"

Chinese is pragmatic:
> "鼠虎配对的兼容指数为65分，处于'生成'阶段，意味着你们需要主动建立和维护这段关系。"

Vietnamese is blunt:
> "Chuột và Hổ được ghi 65/100—mức này có nghĩa là họ không hợp tự nhiên nhưng hoàn toàn có thể xây dựng được gì đó nếu cả hai thực sự cố gắng."

Same prompt, eight cultural frames, zero per-language customization. The single line `"in the target language"` handled all of it. No language-specific prompt variants, no translation post-processing.

## The Trap: JSON Keys That Get Translated

Multilingual bulk generation has a consistent failure mode. Ask the model for Japanese output and it occasionally decides `description` should be `説明`. The fix is explicit:

```
Return JSON with these exact keys (do NOT translate the keys):
{"description": [...], "faq": [{"q": "...", "a": "..."}]}
```

Without this instruction, LLMs translate key names often enough to cause production parsing failures. One line of constraint buys parsing stability across all 2,356 sessions.

## How the Pipeline Is Structured

Claude Code was used to **write the pipeline script**. The actual content generation loop runs independently on the server.

The script generates the full list of 144 combinations × 8 languages, POSTs each to the Claude API, and writes the response JSON to the database. Each session is completely stateless — it doesn't depend on any previous session's output. That's what keeps quality consistent: no context contamination, no accumulated drift between calls.

## By the Numbers

| Metric | Value |
|--------|-------|
| Total sessions | 2,356 |
| Time per session | 0–1 min |
| Tool calls per session | 0 |
| Languages covered | 8 (ko, en, ja, zh, vi, th, id, hi) |
| Sign combinations | 144 |
| Content per combination | 3 paragraphs + 3 FAQ pairs |
| Model | claude-haiku-4-5-20251001 |

## Key Takeaways

- **One prompt, one language variable.** `"in the target language"` covers eight languages without separate prompts per locale.
- **Semantic relationship labels improve coherence.** A score alone leaves the model's narrative direction ambiguous across paragraphs.
- **Some tasks are Haiku tasks.** When the goal is format compliance, paying for a more capable model is waste.
- **Explicitly forbid key translation.** This single constraint eliminates a common bulk generation failure mode.
- **Pre-generation beats on-demand** when the content space is finite and latency/cost predictability matters.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
