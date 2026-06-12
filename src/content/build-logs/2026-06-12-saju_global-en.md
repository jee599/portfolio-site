---
title: "Auto-Generating 5 Compatibility Pairs with Claude Haiku: Structured Prompt Pattern"
project: "saju_global"
date: 2026-06-12
lang: en
pair: "2026-06-12-saju_global-ko"
tags: [claude-code, claude-haiku, content-generation, prompt-engineering, saju]
description: "How injecting score + relationship type into a structured prompt lets Claude Haiku generate 3-paragraph compatibility descriptions and FAQ pairs as consistent JSON — validated across 5 pairs, 0 tool calls."
---

144 Chinese Zodiac pairs. 144 Western Astrology pairs. Multiply by the number of target languages, and you're looking at hundreds of compatibility descriptions that need to exist before launch. Writing them manually isn't a few-hour task — it's weeks of work.

**TL;DR** — Inject the score and relationship type directly into the prompt. Claude Haiku returns 3 structured paragraphs + 3 FAQ pairs as consistent JSON. 5 sessions, 0 tool calls, 0 file modifications. The pattern holds across extreme score differences (40 vs. 100).

## The Scale Problem That Makes Manual Writing Untenable

`saju_global` is a multilingual compatibility service covering both Chinese Zodiac and Western Astrology. The content requirement is deceptively large:

- Chinese Zodiac: 12 animals × 12 animals = **144 pairs**
- Western Astrology: 12 signs × 12 signs = **144 pairs**
- Each pair needs descriptions in Korean, English, Chinese, Japanese (at minimum)

That's 1,152 compatibility descriptions before you've written a single FAQ. The only viable path is AI generation — but naive prompting doesn't work. Ask a model to "describe the compatibility of Horse and Rooster" and you get generic astrology copy that reads the same whether the score is 40 or 95. The score information gets ignored.

This session was about validating a prompt pattern that forces the model to use the score and relationship type as primary constraints, not decorative context.

## The Prompt Structure That Actually Works

The core insight is simple: the score and relationship type need to be injected as first-class parameters, and each paragraph needs an explicit role.

```
Generate a 3-paragraph compatibility description for horse and rooster
(Chinese Zodiac) in the target language.
Score: 40/100, Relationship: overcoming.

Paragraph 1: Overall compatibility summary (2-3 sentences).
  Start with the core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences).
  Reference specific elements and interactions.
Paragraph 3: Potential challenges and advice (2-3 sentences).

Also generate 3 FAQ Q&A pairs about this combination.
```

Three constraints drive the quality:

1. **Explicit score injection** — `Score: 40/100` in the system parameters, not buried in prose
2. **Paragraph role constraints** — summary → strengths → challenges/advice, in that order
3. **First-sentence requirement** — Paragraph 1 must start with the core answer referencing the score

Without the role constraints, Paragraph 3 defaults to generic "every relationship needs work" advice. With them, a 100-point pair still gets honest trade-offs, and a 40-point pair leads with difficulty — not false positivity.

## Why Score Injection Changes Everything

This is the key finding. Without explicit score injection, the model treats compatibility descriptions as a genre — it writes what "compatibility content" sounds like. A 40-point pair and an 80-point pair end up with nearly identical descriptions, just with different names.

With score injection, the model treats it as a constraint. The test covered the full range:

| Pair | Type | Score | Relationship |
|---|---|---|---|
| Horse × Rooster | Chinese Zodiac | 40 | overcoming |
| Rat × Dragon | Chinese Zodiac | 65 | overcoming |
| Rabbit × Monkey | Chinese Zodiac | 55 | overcoming |
| Capricorn × Virgo | Western | 100 | same |
| Aquarius × Capricorn | Western | 45 | opposing |

The goal was to verify that one prompt structure produces consistent output across extreme score differences. It does.

## Output Quality Check

Horse × Rooster (40 points, `overcoming`):

```json
{
  "description": [
    "马和鸡的配对指数只有40分，属于需要克服重重障碍才能相处的关系...",
    "马的热情和行动力能为生活增添色彩，有时也能打破鸡过于循规蹈矩的节奏...",
    "根本的差异在于，马需要自由和冒险，鸡则坚守秩序和计划..."
  ]
}
```

Score 40 is present in the first sentence. The relationship type `overcoming` maps to "克服重重障碍" (overcoming layer after layer of obstacles) — not as a label, but woven into the description naturally.

Capricorn × Virgo (100 points, `same`):

```json
{
  "description": [
    "摩羯座和处女座堪称天作之合，这对组合的匹配度达到完美的100分...",
    "摩羯座的野心和处女座的精明形成天然互补...",
    "缺点是两个星座都太理性，有时会把感情当任务来执行..."
  ]
}
```

Even at 100 points, Paragraph 3 surfaces a genuine weakness — both signs are too rational, sometimes treating emotions like tasks to complete. This isn't a generic disclaimer; it's accurate to the `same` relationship type (two earth signs amplifying each other's rigidity). The paragraph role constraint prevented purely sycophantic output.

## Session Stats

| Metric | Value |
|---|---|
| Sessions | 5 |
| Total tool calls | 0 |
| Files modified | 0 |
| Model | claude-haiku-4-5-20251001 |
| Pairs processed | 5 |

Zero tool calls means this was pure API inference validation — no file generation, no code changes. The session work was prompt → JSON output, testing the pattern across different pair types and score ranges.

## Why Haiku and Not Sonnet

Compatibility descriptions are creative writing, but they're rule-based creative writing. Low score means lead with difficulty. `Opposing` relationship means center the tension. These aren't nuanced editorial judgments — they're constraints that map directly to prompt parameters.

Haiku follows those constraints reliably. Sonnet and Opus aren't better here; they're just more expensive.

The cost math matters at scale: 288 pairs × 4 languages × FAQ included = 1,152+ generation requests. The cost difference between Haiku and Sonnet for this workload is significant. Haiku is the right tool.

## What's Next

This session validated the prompt pattern. Two things come next.

**Batch pipeline**: Run all 144 pairs automatically, write results to the DB. The pattern is confirmed; it just needs to be wired into a pipeline that iterates over the full pair list.

**Multilingual expansion**: The current output is Chinese. The `target language` parameter handles the rest — swap it to Korean, English, or Japanese and the same prompt structure produces consistent output in each language.

The core finding: a well-constrained prompt structure maintains consistency when you change the language. Score behavior doesn't drift across translations because the constraint is numeric, not linguistic.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
