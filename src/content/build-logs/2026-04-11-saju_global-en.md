---
title: "2,313 Multilingual Content Pieces in One Day — One Prompt, 8 Languages, Claude Haiku"
project: "saju_global"
date: 2026-04-11
lang: en
pair: "2026-04-11-saju_global-ko"
tags: [claude-api, haiku, content-generation, i18n, prompt-engineering]
description: "Pre-generated a Chinese Zodiac compatibility DB across 144 sign pairs × 8 languages using 2,313 Claude Haiku API calls — one prompt template, zero per-language customization."
---

2,313 Claude Haiku API calls. One day. Eight languages. That's how long it took to pre-generate an entire Chinese Zodiac compatibility database for `saju_global`.

**TL;DR** One prompt template with a single `"in the target language"` instruction covers all 8 languages. Haiku was the right model — format compliance matters more than creativity here. Pre-generation beats on-demand for both UX and cost.

## Why 2,313 Sessions

The Chinese Zodiac has 12 signs. 12 × 12 = 144 compatibility pairs. Each pair needs a 3-paragraph description plus 3 FAQ entries. The app supports 8 languages: Korean, English, Japanese, Simplified Chinese, Vietnamese, Thai, Indonesian, and Hindi.

144 pairs × 8 languages = 1,152 base content pieces. Add FAQs and the number climbs past 2,000. Writing this manually would take months. The only viable path was full automation.

The key design decision: **pre-generate everything into the DB rather than generate on-demand**. On-demand means every user waits for an LLM response. Pre-generation means instant loads and zero per-request cost at runtime. That decision also changed how the prompts had to be designed.

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

Three variables: `{sign_a}`, `{sign_b}`, `{score}/{relationship_type}`. The phrase **"in the target language"** does all the i18n work. No per-language prompt variants. No translation post-processing.

## The `relationship_type` Field Changes Everything

The `Relationship:` field in the prompt isn't just metadata — it fundamentally shapes the output quality.

Three relationship types were defined:

- `generating` — signs that energize each other (e.g., Rat-Tiger, 65 points)
- `overcoming` — signs that need to bridge differences (e.g., Rat-Ox, 60 points)
- `same` — same sign pairing (e.g., Rat-Rat, 50 points)

One word makes a measurable difference. With `Relationship: generating`, the model weaves a consistent "pulling each other forward" narrative across all three paragraphs. With `overcoming`, the theme of bridging gaps and effort runs through the whole piece. Without this field, the same numerical score produces inconsistent tone — paragraph 1 might be optimistic, paragraph 3 pessimistic, with no coherent thread.

The relationship type acts as a soft constraint that keeps the entire output tonally unified.

## Why Haiku, Not Sonnet

Every session used `claude-haiku-4-5-20251001`. Three reasons:

**Speed**: Most sessions completed in under a minute. With parallel execution, 2,313 calls finished in a fraction of the time you'd expect.

**Cost**: The task isn't creative writing — it's structured content generation. The requirement is "produce exactly 3 paragraphs and 3 FAQs in the right format." Haiku handles format compliance without issues. Spending on Sonnet or Opus for this would be pure waste.

**Multilingual quality**: The output quality across all 8 languages held up. Korean, Japanese, Chinese, Hindi (Devanagari script), Thai, Vietnamese, Indonesian — all produced natural, coherent text. The session logs showed no language-specific degradation.

## 0 Tool Calls Across 2,313 Sessions

Every session shows `tool calls: 0`. That's expected — this isn't a Claude Code file-editing workflow.

The actual pipeline: a script generates all 144 × 8 language combinations, POSTs each to the Claude API directly, and writes the JSON response to the database. Claude Code was used to **write the pipeline script itself**. The content generation loop runs independently on the server. No file reads, no edits, no tool use — just structured API calls.

## Same Pair, 8 Different Voices

Run Rat-Tiger (65 points, generating) through 8 languages and you get 8 culturally distinct texts from one prompt.

English is direct: *"The Rat and Tiger relationship scores a moderate 65/100—promising but requiring effort."*

Japanese softens the delivery: *"相性スコアは65点です。発展途上というのは、互いに惹かれるものがある一方で、ものの見方や行動パターンに根本的な違いが存在するということです。"*

Chinese is pragmatic: *"鼠虎配对的兼容指数为65分，处于"生成"阶段，意味着你们需要主动建立和维护这段关系。"*

No per-language customization in the prompt. The cultural adaptation happens automatically. That's the most surprising result of this experiment — language alone carries enough cultural context to differentiate the output naturally.

## The JSON Key Translation Trap

Bulk multilingual generation has a reliable failure mode: you ask for Japanese output and get `"説明"` as a JSON key instead of `"description"`. The model occasionally translates the keys along with the content.

The fix is explicit instruction in the prompt:

```
Return JSON with these exact keys (do NOT translate the keys):
{"description": [...], "faq": [{"q": "...", "a": "..."}]}
```

Without this line, JSON parsing breaks intermittently across a large batch. One explicit instruction stabilizes parsing across all 2,313 calls.

## The Numbers

| Metric | Value |
|--------|-------|
| Total sessions | 2,313 |
| Time per session | 0–1 min |
| Tool calls per session | 0 |
| Languages covered | 8 (ko, en, ja, zh, vi, th, id, hi) |
| Sign combinations | 144 |
| Content per combination | 3 paragraphs + 3 FAQ pairs |
| Model | claude-haiku-4-5-20251001 |

## What Transfers to Other Projects

- **One prompt, one language instruction.** `"in the target language"` scales to any number of languages without prompt duplication.
- **Semantic labels improve coherence more than numeric scores alone.** A `relationship_type` field (or equivalent categorical context) gives the model a consistent narrative frame across a multi-paragraph output.
- **Match model to task requirements.** When the requirement is format compliance over creative quality, Haiku is the right call. Don't pay for capabilities you don't need.
- **Anchor JSON keys explicitly.** In bulk multilingual generation, `"do NOT translate the keys"` is not optional — it's load-bearing.
- **Pre-generation vs. on-demand is a real architectural choice.** When content is finite and enumerable, pre-generation wins on UX, cost, and reliability.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
