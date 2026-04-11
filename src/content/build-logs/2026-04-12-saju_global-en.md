---
title: "2,356 API Calls, 8 Languages, 1 Prompt: Generating Zodiac Compatibility Content at Scale with Claude Haiku"
project: "saju_global"
date: 2026-04-12
lang: en
pair: "2026-04-12-saju_global-ko"
tags: [claude-code, claude-api, haiku, prompt-engineering, i18n, content-generation]
description: "144 zodiac compatibility pairs × 8 languages generated with a single prompt template and Claude Haiku. 2,356 API calls, zero parsing failures."
---

2,356 API calls. One prompt template. Eight languages. That's the output from building the compatibility content layer for saju_global — a Korean astrology app targeting a global audience.

**TL;DR** — 144 zodiac compatibility pairs × 8 languages, generated with Claude Haiku and a single prompt template. The key insight: write instructions in English, delegate output to the target language. Structured JSON schema kept parsing failures near zero across all 2,356 calls.

## The Problem: 1,152 Empty Slots

saju_global needs compatibility descriptions for every combination of the 12 Chinese zodiac animals. 12×12 = 144 pairs. Multiply by 8 service languages — Korean, English, Japanese, Chinese, Hindi, Thai, Indonesian, Vietnamese — and you need at least 1,152 content blocks before launch.

These aren't simple translations. Each block needs to reflect a compatibility score and a relationship type (`generating`, `overcoming`, `same`). The tone and framing shift depending on those values. Writing this manually would take months.

Two options:

1. GPT-4o or Claude Sonnet — high quality, high cost
2. Claude Haiku — sufficient quality, 10× cheaper

Running the math made the decision obvious. Generating 1,152 blocks with Sonnet would cost tens of dollars in API fees alone. Haiku handles the same workload at a fraction of the cost, and for structured output with a fixed format, the quality gap is smaller than you'd expect.

## Why One Prompt Handles Eight Languages

The core strategy is straightforward: **write instructions in English, delegate output to the target language**.

```
Generate a 3-paragraph compatibility description for rat and tiger
(Chinese Zodiac) in the target language.
Score: 65/100, Relationship: generating.

Paragraph 1: Overall compatibility summary (2-3 sentences).
Start with the core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences).
Reference specific elements and interactions.
Paragraph 3: Potential challenges and advice (2-3 sentences).

Also generate 3 FAQ Q&A pairs about this combination.
```

Only `target language` changes between calls. Everything else — structure, score, relationship type, paragraph order — stays identical. Haiku reads the English instructions and writes fluent, culturally appropriate output in each target language.

What's interesting is that the tone adjusts automatically per language without any explicit instruction. Japanese output uses a measured, formal register. Chinese output is terse and direct. Korean lands in a natural explanatory style, not stiff or robotic. The model picks up cultural writing conventions without being told to. That wasn't something I anticipated — it emerged from Haiku's language modeling, not from prompt engineering.

## How to Get Zero Parsing Failures Across 2,356 Calls

Free-text output is expensive to post-process at scale. If the model decides to add a preamble, restructure paragraphs, or drop a field, every downstream step breaks.

The fix is enforcing a JSON schema in the prompt:

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

Haiku follows this structure with near-perfect reliability. Across 2,356 generations, parsing failures were effectively zero. This is the part that often surprises people: for instruction-following on a fixed schema, Haiku performs close to Sonnet. The reasoning gap between the two models matters a lot for complex tasks. For "output this exact JSON shape," it barely matters at all.

## Relationship Type Shapes Content More Than Score

Every compatibility pair has a score (0–100) and a relationship type. The four types are `generating` (one element feeds the other), `overcoming` (one element controls the other), `same` (same animal), and `ideal` (harmonious match).

Including the relationship type in the prompt produces meaningfully different framing even when scores are similar:

- `rat + tiger` (65, `generating`): *"An initially magnetic connection that deepens over time"* — growth framing
- `rat + ox` (60, `overcoming`): *"Fundamentally different, but the friction builds real strength"* — conflict-to-resilience framing  
- `rat + rat` (50, `same`): *"Too alike to complement each other — the mirror dynamic"* — sameness-as-tension framing

The `overcoming` pair (60 points) sometimes reads as more optimistic than the `generating` pair (65 points), because the relationship frame drives the narrative more than the raw number. **Score is a signal; relationship type is the story.**

## Haiku vs Sonnet: The Real Trade-off

For this pipeline, model selection is cost strategy. Haiku won for three reasons:

**1. Fixed output format.** Three paragraphs plus three FAQs. When creative latitude is low, Haiku is sufficient. The model doesn't need deep reasoning — it needs to follow a template reliably.

**2. Verifiable output.** JSON parsing confirms structure. There's no need for Sonnet's stronger reasoning when correctness can be checked mechanically.

**3. Volume.** 2,356 calls at Sonnet pricing would have cost significantly more. At this scale, the cost difference is not marginal.

The one area where Haiku falls short: FAQ diversity. Questions like *"How compatible are X and Y?"* appear across nearly every pair. Sonnet would likely generate FAQs that reflect each pairing's specific dynamics. I accepted this trade-off — at this stage of the project, cost efficiency beats content uniqueness in FAQs.

## What the Session Logs Actually Show

All 2,356 sessions are logged as `0 tool calls`, most at `0min`. Pure text generation. No code execution, no file access — just prompt in, JSON out.

This is the natural shape of a content generation pipeline. The API server receives a request, fires a prompt at Haiku, parses the JSON response, and writes to the database. No Claude Code tooling involved — only raw inference.

Comparing the `rat + rabbit` pairing (55 points) across languages surfaces something interesting:

- Korean: *"The Rat's quick energy can breathe life into the Rabbit's careful, measured approach"* — framed as energy exchange
- English: *"the Rat admires the Rabbit's quiet grace"* — framed as emotional attraction

Same prompt, same pair, same score. The cultural lens shifts the interpretation automatically. This is one of those things you can't engineer directly — it comes from how Haiku was trained across languages, not from prompt design.

## What's Next

The current pipeline generates one description per animal pair. Two improvements are on the roadmap:

**Multi-context versions per pair.** Compatibility means different things in romantic, business, and family relationships. Adding a `relationship_context` parameter to the prompt would generate context-appropriate descriptions for each pair without changing the core template.

**Dynamic personalization.** Instead of pre-generated static content, use the user's actual birth date and time to generate a tailored compatibility description on demand. This use case would probably require Sonnet — the reasoning complexity goes up significantly when accounting for hour, day, and month interactions.

## Key Takeaways

- **One English prompt template covers eight languages.** "Instructions in English, output in target language" is the baseline strategy for multilingual content generation.
- **Explicit JSON schema eliminates parsing failures.** 2,356 calls, effectively zero errors. Schema enforcement is worth the few extra prompt tokens.
- **Relationship type drives content direction more than numeric score.** `generating`, `overcoming`, and `same` are narrative frames, not metadata labels.
- **Haiku is the right tool for high-volume, fixed-format generation.** The FAQ diversity trade-off is real, but 10× cost savings at this scale makes it the clear choice.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
