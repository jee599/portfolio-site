---
title: "Same Question, Different Model — A 45x Cost Difference: Token Economics in Practice"
date: 2026-03-09
description: "Output tokens cost 3-10x more than input. Miss this detail and your API bill will surprise you"
tags: ["ai", "llm", "token-economics", "model-routing", "cost-optimization"]
lang: "en"
source: "original"
---

GPT-4-level performance now costs 1/100th of what it did two years ago.

As of March 2026, the price gap between "budget" and "premium" LLM models exceeds 1,000x. Mistral Nemo runs at $0.02 per million tokens. o3 Pro runs at $375. Same concept — "LLM API call" — four orders of magnitude apart in price.

Understanding and exploiting this gap is Token Economics. Automating the exploitation is Model Routing.

## Tokens as Currency

In the LLM world, tokens are money. Literally.

A token is the smallest unit of text an LLM processes. In English, roughly 4 characters equal one token. "What's on my calendar today?" costs about 8 tokens. "Could you please provide me with a comprehensive overview of my scheduled appointments for today?" jumps to 18. Same intent, more than double the cost.

LLM APIs charge per token. Here's the detail most developers miss: **output tokens cost 3–10x more than input tokens.**

Claude Sonnet 4.6 charges $3 per million input tokens and $15 per million output. A 5x multiplier. If a chatbot generates twice as many output tokens as input — which is common — the real cost is closer to $33 per million total tokens, not the advertised "$3."

The asymmetry makes computational sense. Generating tokens autoregressively — with beam search, temperature sampling, and alignment layers — consumes far more GPU time and memory than simply embedding inputs.

Reasoning models add a third cost dimension: **thinking tokens.** These are internal "thought" tokens invisible to the user but essential for multi-step reasoning. They're typically priced at or above output token rates. A standard model finishes an answer in 200 output tokens. A reasoning model might use 10,000 thinking tokens plus 200 output tokens for the same question. The cost explodes in the invisible part.

## March 2026 Price Landscape

Side-by-side pricing per million tokens tells the story clearly.

```
Model                    Input      Output     Quality (0-100)
Claude Opus 4.6          $5         $25        100
GPT-5                    $10        $30        ~95
Claude Sonnet 4.6        $3         $15        ~88
Gemini 2.5 Pro           $1.25      $10        ~85
DeepSeek V3.2            $0.14      $0.28      79
Gemini 2.0 Flash-Lite    $0.075     $0.30      ~60
GPT-5 Nano               $0.05      $0.20      ~50
```

Running the same customer support workload — 1 million conversations per month, average 2K tokens each — costs roughly $195/month on DeepSeek V3.2, $3,250 on Claude Sonnet, and $8,750 on Claude Opus. Same work. Up to 45x difference.

## Model Routing: The 60–80% Cost Reduction

Model routing means automatically directing each request to the appropriate model based on complexity. Simple questions don't need Opus. Complex architecture reviews don't belong on Haiku.

```
User Request
    ↓
[Router]
    ├── Simple → Haiku ($0.25/1M)   "What's the weather?"
    ├── Medium → Sonnet ($3/1M)      "Find the bug in this code"
    └── Complex → Opus ($5/1M)       "Redesign this architecture"
```

Realistic savings across most applications: 60–80%. The practical approach is using the cheapest model to classify complexity. Ask Haiku "rate this request 1–3" — it costs about $0.00003 per classification. Essentially free.

```python
async def route(query: str) -> str:
    classification = await haiku.call(
        system="Rate complexity 1-3. Number only.",
        user=query
    )
    level = int(classification.strip())
    if level == 1: return "haiku"
    elif level == 2: return "sonnet"
    else: return "opus"
```

One important caveat: routing failure costs are asymmetric. Sending a complex task to Haiku produces a bad answer and the user asks again — double cost. Sending a simple task to Opus wastes money but delivers a good answer. When uncertain, route one tier up.

## Beyond Routing: The Full Optimization Stack

**Prompt Caching** saves up to 90% on repeated system prompts and tool definitions. Essential for agent-style workloads with identical configurations across dozens of calls.

**Batch API** offers 50% discounts for non-real-time tasks — report generation, bulk classification, batch translations.

**Output length limits** are the easiest win. Set `max_tokens` in API calls and include "Answer in 50 words" in prompts. Since output tokens cost 3–5x more than input, just preventing verbose responses yields meaningful savings.

**RAG optimization** means tightening retrieval. Teams routinely pass 4–8 long documents into prompts when a short snippet would suffice. Limiting retrieval to 2–3 short chunks can halve input tokens with no accuracy loss.

**Semantic caching** returns cached responses for semantically similar queries. "What's the weather like today?" and "How's the weather right now?" can hit the same cache entry. Zero LLM calls means zero cost.

Combining these techniques compounds the savings. Routing cuts 60–80%. Caching reduces the remainder further. Batch processing handles async work at half price. Final cost can land at 10–20% of the unoptimized baseline.

> The most expensive optimization is using the best model for every request. The most effective optimization is knowing which request deserves which model.

---

- [LLM API Pricing Guide (March 2026)](https://costgoat.com/compare/llm-api)
- [LLM Token Optimization — Redis](https://redis.io/blog/llm-token-optimization-speed-up-apps/)

---

*Also available on: [Dev.to](https://dev.to/jidonglab) · [Naver](https://blog.naver.com/jidonglab) · [Medium](https://medium.com/@jidonglab)*
