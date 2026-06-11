---
title: "5 Sessions, Zero File Changes: Auto-Generating Zodiac Compatibility Content with Claude Haiku"
project: "saju_global"
date: 2026-06-11
lang: en
pair: "2026-06-11-saju_global-ko"
tags: [claude-code, claude-haiku, content-generation, saju, astrology, multilingual]
description: "How claude-haiku-4-5 generates 144+ zodiac compatibility texts as structured JSON — 5 sessions, 0 code changes, multilingual output."
---

Five sessions. Zero tool calls. Zero files modified. That's what a pure content generation workflow looks like — and it's what built the compatibility database for `saju_global` today.

**TL;DR** Use `claude-haiku-4-5-20251001` as a content generation API to auto-generate Chinese Zodiac and Western Astrology compatibility descriptions in multiple languages. A well-structured prompt template produces consistent JSON output — no parsing tricks needed.

## The Scale Problem That Made Hand-Writing Impossible

`saju_global` is a global fortune-telling app built around two compatibility systems: Chinese Zodiac (12 animals) and Western Astrology (12 signs). Each system has 144 unique pairings (12 × 12). Add multilingual support and you're looking at thousands of text entries.

Nobody writes that manually. That's not a team problem — it's an economics problem.

## What Today's Sessions Produced

Five compatibility descriptions, all in Simplified Chinese (简体中文):

| Pair | System | Score | Relationship |
|------|--------|-------|--------------|
| Horse × Rooster | Chinese Zodiac | 40 | overcoming |
| Rat × Dragon | Chinese Zodiac | 65 | overcoming |
| Rabbit × Monkey | Chinese Zodiac | 40 | overcoming |
| Capricorn × Virgo | Western Astrology | 100 | same |
| Aquarius × Capricorn | Western Astrology | 45 | overcoming |

Three `overcoming` pairs from the Chinese Zodiac side, one perfect match, one challenged pairing. Each entry gets a 3-paragraph description plus 3 FAQ Q&A pairs.

## The Prompt Template That Does the Heavy Lifting

Every session runs the same template:

```
Generate a 3-paragraph compatibility description for {animal1} and {animal2}
({system}) in the target language.
Score: {score}/100, Relationship: {relationship}.

Paragraph 1: Overall compatibility summary (2-3 sentences).
  Start with the core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences).
Paragraph 3: Potential challenges and advice (2-3 sentences).

Also generate 3 FAQ Q&A pairs about this combination...
```

`{system}` gets `Chinese Zodiac` or `Zodiac Sign (Western Astrology)`. Score and relationship type are injected directly. `target language` is set dynamically by the client — today's sessions all targeted Simplified Chinese.

The key insight: making score and relationship explicit in the prompt means the model reflects them naturally in output. You get "只有40分" (a mere 40 points) for a difficult pairing and "达到完美的100分" (a perfect 100 points) for a great match — not because you told it to phrase things that way, but because it has enough context to calibrate tone.

## The Output Format: JSON You Can Use Directly

```json
{
  "description": [
    "Paragraph 1 text",
    "Paragraph 2 text",
    "Paragraph 3 text"
  ],
  "faq": [
    { "q": "Question 1", "a": "Answer 1" },
    { "q": "Question 2", "a": "Answer 2" },
    { "q": "Question 3", "a": "Answer 3" }
  ]
}
```

No post-processing. No regex extraction. The frontend consumes it directly. When you specify structure in the prompt, Haiku respects it consistently.

## Score 100 vs Score 40: Tone Shifts Automatically

Capricorn × Virgo (100 points, `same`) opens like this:

> 摩羯座和处女座堪称天作之合，这对组合的匹配度达到完美的100分。两个土象星座天生就说同一种语言——务实、稳重、坚定，他们用行动而非甜言蜜语来证明爱意...

Horse × Rooster (40 points, `overcoming`):

> 马和鸡的配对指数只有40分，属于需要克服重重障碍才能相处的关系。两个生肖在性格和价值观上差异很大，但如果彼此足够坚定，这段关系并非没有可能。

Same template. Completely different register. The model adjusts emotional weight based on the numerical and categorical inputs — it's not filling in blanks, it's calibrating tone.

## Why Haiku, Not Sonnet or Opus

At 144 Chinese Zodiac pairs × 144 Western Astrology pairs × N languages, request volume hits hundreds to thousands per language. Using Sonnet or Opus makes the API cost prohibitive for a content generation pipeline at this scale.

Compatibility descriptions are closer to structured information delivery than creative writing. The content follows predictable patterns: overall assessment, strengths, challenges, advice. When the prompt is specific enough, Haiku produces quality that's indistinguishable from more expensive models for this use case.

## What Comes Next

Three of today's five pairs are `overcoming` type. The current prompt isolates "challenges and advice" into Paragraph 3, keeping negative content at the end and framing it constructively. Whether this reduces user drop-off vs. a more upfront framing is worth an A/B test.

The FAQ generation is doing quiet SEO work. Three Q&A pairs per compatibility page is a natural fit for FAQ schema markup. Adding `application/ld+json` FAQ markup to each page is a straightforward next step with measurable search visibility impact.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
