---
title: "5 Zodiac Pairs, 0 Tool Calls: Claude Haiku as a JSON Content Engine"
project: "saju_global"
date: 2026-06-11
lang: en
pair: "2026-06-11-saju_global-ko"
tags: [claude-code, haiku, content-generation, multilingual, json, astrology]
description: "How saju_global uses Claude Haiku to auto-generate multilingual zodiac compatibility content as structured JSON—0 tool calls, pure inference."
---

5 zodiac pairings. 0 tool calls. 0 file edits. That's a typical Claude session for saju_global—and it's working exactly as intended.

Most Claude Code build logs cover code generation. This one doesn't. For saju_global, Claude Haiku handles a job that has nothing to do with writing or editing code: generating structured compatibility descriptions for every zodiac pairing, in multiple languages, at a cost that actually makes sense for the scale.

**TL;DR** Pass a zodiac pair, a score, and a relationship type to Claude Haiku. Get back 3 paragraphs of compatibility copy plus 3 FAQ pairs as structured JSON in the target language. 0 tool calls, pure inference. This is what AI content generation looks like when the output format is fixed and the model just needs to fill it in.

## What is saju_global?

saju_global is a multilingual compatibility service that bridges Eastern and Western astrology. It covers the Chinese zodiac (twelve earthly branches: Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, Pig) and Western astrology (Aries through Pisces), producing compatibility content for every possible cross-pairing—in every supported language.

Today's session covered five combinations:

| Pair | System | Score | Type |
|------|--------|-------|------|
| Horse × Rooster | Chinese Zodiac | 40/100 | overcoming |
| Rat × Dragon | Chinese Zodiac | 65/100 | overcoming |
| Rabbit × Monkey | Chinese Zodiac | 40/100 | overcoming |
| Capricorn × Virgo | Western | 100/100 | same |
| Aquarius × Capricorn | Western | 45/100 | opposing |

All five outputs were in Simplified Chinese (简体中文). The model inferred the target language from context—no explicit `lang` parameter needed.

## The Numbers Behind the Model Choice

Before getting into how the prompt works, it's worth understanding why Haiku specifically.

Eastern zodiac alone: 12 × 12 = 144 combinations. Western zodiac: another 144. Add cross-system pairings and you're already past 300. Multiply by the number of supported languages—Simplified Chinese, Traditional Chinese, English, Japanese, Korean, and more—and the total climbs into the thousands.

Running that through Claude Sonnet or Opus would be financially untenable. The cost would make the project unviable before launch. Haiku changes the math entirely. And crucially, this content doesn't require a highly capable model. The requirements are:

1. Fixed output structure (JSON with two keys)
2. Accurate score and relationship type in the prose
3. Consistent tone calibration based on compatibility level
4. Fluent multilingual output

These are Haiku-tier requirements. The model doesn't need to reason through complex logic or make creative leaps. It needs to produce consistent, well-formed content that follows a pattern. Haiku does this reliably and at a fraction of the cost.

## The Prompt Pattern

Every session uses the same prompt structure:

```
Generate a 3-paragraph compatibility description for {animal_a} and {animal_b}
({category}) in the target language.
Score: {score}/100, Relationship: {relationship}.

Paragraph 1: Overall compatibility summary (2-3 sentences).
  Start with the core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences).
  Reference specific elements and interactions.
Paragraph 3: Potential challenges and advice (2-3 sentences).

Also generate 3 FAQ Q&A pairs about this combination...
```

The phrase `in the target language` is the critical piece. Rather than hardcoding a language parameter, the prompt instructs the model to infer the target language from context. In practice this means the API call includes the language specification in the surrounding context, and the model carries it through to the output without needing an explicit field.

The score and relationship type are passed as structured inputs, not described in prose. This keeps the prompt format consistent and makes the outputs predictable.

## Output Structure

The return value is always the same two-key JSON:

```json
{
  "description": [
    "Paragraph 1: overall summary referencing score and relationship type",
    "Paragraph 2: strengths of this pairing",
    "Paragraph 3: potential friction and practical advice"
  ],
  "faq": [
    { "q": "...", "a": "..." },
    { "q": "...", "a": "..." },
    { "q": "...", "a": "..." }
  ]
}
```

The structure doesn't change whether the score is 100 (Capricorn × Virgo) or 40 (Horse × Rooster). What changes is the tone of the content.

The 100-point pairing (Capricorn × Virgo, `same` type) opens with 天作之合—a Chinese idiom meaning "a match made in heaven." The framing emphasizes shared earth element energy and natural mutual understanding.

The 40-point pairing (Horse × Rooster, `overcoming` type) opens with 需要克服重重障碍—"must overcome numerous obstacles." The prose acknowledges the difficulty honestly before pivoting to what's salvageable.

The model reaches these tonal distinctions on its own. The prompt doesn't say "be encouraging for high scores" or "be realistic for low scores." It gives the model the score and relationship type as data, and the model calibrates accordingly.

## Why 0 Tool Calls Is the Expected Behavior

This is worth clarifying because it looks unusual in the context of Claude Code build logs.

These sessions are not interactive Claude Code sessions. saju_global is calling the Claude API programmatically—the app sends requests, gets responses, and stores the structured output. The session log captures those API calls. There's no file editing, no Bash execution, no shell commands.

Input → inference → JSON output. That's the entire pipeline.

Claude Code tools like `Edit`, `Write`, and `Bash` are irrelevant here. This is pure generation work: the model reads a structured prompt and writes structured content. The fact that it appears in a build log is because the Claude API calls are being tracked as part of the saju_global development workflow.

0 tool calls isn't a failure mode or a minimal session. It's the correct behavior for this type of task.

## Tone Calibration by Relationship Type

The `relationship` parameter does most of the tonal heavy lifting. Three types appeared in today's sessions:

**`same` (100pt, Capricorn × Virgo)**: Both signs share the earth element. The prose emphasizes resonance, shared values, and natural compatibility. The Chinese output leans into classical idioms about natural harmony.

**`overcoming` (40–65pt)**: This is where things get interesting. The Rat × Dragon pairing at 65 points and the Rabbit × Monkey pairing at 40 points are both classified as `overcoming`, but the model produces noticeably different content. The 65-point version acknowledges challenges while emphasizing genuine strengths. The 40-point version leads with the difficulty. The score creates a gradient within the same relationship type.

**`opposing` (45pt, Aquarius × Capricorn)**: The most direct framing. The Chinese output uses 相对克制的对立关系—"a relatively restrained oppositional relationship"—which is honest without being dismissive. The advice focuses on finding common ground across fundamental differences.

Two parameters (score + relationship type) give the model enough signal to produce tonally appropriate content without being over-specified. The prompt doesn't enumerate every tonal rule; it trusts the model to apply them correctly given the inputs.

## What the Prompt Doesn't Do

It doesn't explain Chinese zodiac mythology or Western astrology symbolism. It doesn't define what "overcoming" means in relationship terms. It doesn't specify how much weight to give the score versus the relationship type.

The model brings that knowledge. The prompt provides the specifics—which pair, which score, which relationship category—and the model combines the structured inputs with its existing knowledge of both zodiac systems to produce content that's actually grounded in the subject matter.

This is the right use of a language model for content generation: provide structure and constraints, let the model handle domain knowledge.

## Next Steps

- **Cross-language quality verification**: All of today's output was Simplified Chinese. Need to run test batches for other supported languages and compare output quality across scripts.
- **Generation priority queue**: Not all 300+ combinations are equally useful at launch. Need to identify the most frequently searched pairings and prioritize those for early generation.
- **FAQ diversity audit**: Within the same relationship type, combinations might be getting similar FAQ questions. Need to check whether `overcoming` pairings are producing distinct FAQ sets or converging on the same questions.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
