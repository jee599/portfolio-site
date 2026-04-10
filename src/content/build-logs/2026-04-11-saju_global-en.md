---
title: "How I Auto-Generated 1,152 Compatibility Descriptions in 8 Languages with Claude Haiku"
project: "saju_global"
date: 2026-04-11
lang: en
pair: "2026-04-11-saju_global-ko"
tags: [claude-code, claude-haiku, content-generation, i18n, automation, prompting]
description: "144 zodiac combinations × 8 languages = 1,152 content pieces. Built with Claude Haiku, strict JSON schema enforcement, and 824 API sessions with zero parse errors."
---

1,152 content pieces. 8 languages. 824 API sessions. Zero parse errors after the first prompt fix.

That's the scale of the content generation pipeline I built for the saju app's zodiac compatibility feature. The 12 Chinese zodiac signs produce 144 unique pairings (12 × 12). Multiply by 8 languages and you have content that would take months to write manually. With Claude Haiku and a well-designed prompt, it took hours.

**TL;DR** — Give Haiku a strict JSON schema and explicit paragraph-level instructions, and it produces consistent, structured compatibility descriptions across all 8 languages. One API key error on session 1 was the only interruption across 824 sessions.

## Why Haiku, Not Sonnet

Compatibility descriptions need consistency, not creativity. A rat + ox pairing should read the same way whether the user is in Seoul or Jakarta — same structure, same information hierarchy, just different languages.

Sonnet or Opus would cost 10x more per call. For 1,152 content pieces, that difference matters.

I tested `claude-haiku-4-5-20251001` on this task and it handled it cleanly. Feed it a structured prompt with a clear schema, and it follows the schema reliably. The language quality was sufficient for production use across all 8 targets.

## The Prompt That Made Parsing Reliable

The first test run came back with markdown fences mixed into the JSON response:

````
```json
{"description": [...], "faq": [...]}
```
````

That breaks parsing. One line at the end of the prompt fixed it:

> `Respond ONLY with valid JSON, no markdown fences:`

Then I embedded the exact output schema directly in the prompt:

```
{"description":["p1","p2","p3"],"faq":[{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}]}
```

No ambiguity about the shape of the output. After this change: 0 parse errors across the remaining 823 sessions.

## Forcing Paragraph Structure

"Write a 3-paragraph description" leaves Haiku free to decide what goes in each paragraph. That produces inconsistent output at scale.

Instead, I assigned each paragraph a specific job:

```
Paragraph 1: Overall compatibility summary (2-3 sentences).
             Start with the core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences).
             Reference specific elements and interactions.
Paragraph 3: Potential challenges and advice (2-3 sentences).
```

The phrase `reference the specific score and relationship` was load-bearing. Without it, Haiku would sometimes skip mentioning the numerical score (e.g., 50/100) and the relationship type (same, overcoming, generating) in the first paragraph. With it, the key data points appeared in a predictable place every time.

## Running 8 Languages in Sequence

For each of the 144 combinations, the pipeline loops through all 8 languages sequentially. The same pairing — rat + ox, score 60, relationship: overcoming — gets requested in English, Korean, Japanese, Chinese, Thai, Hindi, Indonesian, and Vietnamese, one after another.

Quality varied by language, predictably:

- **English, Korean, Japanese, Chinese** — natural phrasing, culturally appropriate nuance
- **Thai, Hindi** — slightly literal but service-level quality
- **Indonesian, Vietnamese** — somewhere in between

I deployed without per-language review. The strategy is to let real user feedback surface any quality issues and fix them per-language if needed. Haiku's output was good enough that I expected this to be rare.

## The Only Incident: Invalid API Key on Session 1

Session 1 failed immediately. The model showed up in logs as `<synthetic>` and the error was `Invalid API key`.

After a server restart, `ANTHROPIC_API_KEY` wasn't loaded into the environment. The `.env` file existed locally but wasn't registered in the deployment environment. I added the key directly to the deployment config and moved on.

Session 2 onwards: clean Haiku runs.

## The Numbers

| Metric | Value |
|--------|-------|
| Total sessions | 824 |
| Time per session | 0–1 min |
| Tool calls per session | 0 |
| Content pieces generated | 1,152+ |
| Parse errors (post-fix) | 0 |

Tool calls being 0 is intentional — this isn't a Claude Code interactive session. It's a script iterating through all 144 combinations, calling the Haiku API directly, and writing results to the database. No agentic loop, just programmatic bulk generation.

## What Worked, What Didn't

**Worked:**
- `Respond ONLY with valid JSON, no markdown fences:` — eliminated all parse errors
- Per-paragraph role assignment with specific sentence-level guidance — enforced structural consistency
- Injecting `target language` as an explicit variable — prevented language mixing
- Injecting score and relationship type as prompt variables — guaranteed accurate data in output

**Didn't work:**
- Soft instructions like "write naturally" — Haiku frequently ignores vague stylistic guidance
- Explaining the FAQ format without providing an example — output shape was inconsistent until I added a concrete schema

## Closing Thought

> The higher the content volume and the clearer the structure, the better the ROI on LLM automation.

Writing 1,152 pieces by hand is not a realistic option. One day of prompt design plus a script run produces equivalent-quality content in hours. The key is **strict output schema enforcement**: JSON-only output, paragraph-level role assignment, variable injection for critical data. Without these three, you can't guarantee consistency across 824 sessions.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
