---
title: "Token Economics and Model Routing — How to Cut Your LLM API Costs in Half"
date: 2026-03-09
description: "You don't need GPT-4 for every request. Model routing and cost optimization strategies."
tags: ["token-economics", "model-routing", "cost-optimization", "llm-api"]
lang: "en"
source: "original"
---

When your monthly LLM bill crosses $1,000, you have two options.

Shrug and treat it as the cost of doing AI. Or open the invoice, trace every token, and fix it.

The teams doing the second thing are running the same workloads at 20–30 cents on the dollar compared to the teams doing the first. The gap shows up in gross margin, in runway, and eventually in pricing power.

This post covers the mechanics of where LLM costs actually come from and how to cut them systematically.

---

## How Token Pricing Actually Works

Every major LLM provider bills per token: separately for input (your prompt) and output (the model's response). English is roughly 0.75 words per token. Code is denser.

The asymmetry most teams miss: **output tokens cost 3–10x more than input tokens.**

Current pricing as of March 2026:

| Model | Input ($/1M) | Output ($/1M) | Output multiplier |
|---|---|---|---|
| DeepSeek V3.2 | $0.14 | $0.28 | 2× |
| Gemini 2.5 Flash | ~$0.15 | ~$0.60 | 4× |
| Claude Haiku 4.5 | ~$1.00 | ~$5.00 | 5× |
| Claude Sonnet 4 | $3.00 | $15.00 | 5× |
| Claude Opus 4.6 | $5.00 | $25.00 | 5× |
| GPT-5 | $10.00 | $30.00 | 3× |
| GPT-5.2 Pro | $21.00 | $168.00 | 8× |

GPT-5.2 Pro charges $168 per million output tokens. At 10,000 daily requests averaging 500 output tokens each, that's $840/day — $25,200/month — from output alone.

The practical implication: every unnecessary word the model generates is a direct cost. Telling the model "answer in one paragraph" is a cost optimization, not a style choice.

```python
# No output constraint — model generates 800–2000 tokens freely
response = client.messages.create(
    model="claude-sonnet-4",
    messages=[{"role": "user", "content": prompt}]
)

# Constrained — output capped at 200 tokens
response = client.messages.create(
    model="claude-sonnet-4",
    max_tokens=200,
    messages=[{"role": "user", "content": "Answer in 2–3 sentences. " + prompt}]
)
```

For Claude Sonnet 4, the unconstrained version at 1,500 average output tokens costs $22.50/1M requests. The constrained version at 200 tokens costs $3.00/1M requests. Same quality for most tasks. 7.5× cost difference.

One more detail on pricing comparisons: tokenizers are not standardized across providers. A prompt that counts as 140 tokens in GPT-4 may register as 180 tokens in Claude or Gemini due to different encoding schemes. Provider-to-provider cost comparisons need to account for this.

---

## Model Selection as Cost Architecture

The most impactful optimization is not caching or batching. It's not calling a $10/1M model when a $0.14/1M model would have done the job.

DeepSeek V3.2 at $0.14/$0.28 per million tokens produces quality scores competitive with models priced 50× higher on many benchmarks. Gemini 2.5 Flash occupies a similar position. These are not compromise models — they're appropriate models for a large category of tasks.

The task-to-model mapping that works in production:

| Task category | Appropriate model tier |
|---|---|
| Classification, sentiment, short extraction | DeepSeek V3.2, Gemini Flash |
| Summarization, content generation, simple Q&A | Claude Haiku, GPT-4o mini |
| Code review, analysis, complex reasoning | Claude Sonnet, GPT-4o |
| Multi-step reasoning, expert domains, critical decisions | Claude Opus, GPT-5 |

The mistake is treating model selection as a default setting rather than a routing decision. Setting `model = "claude-sonnet-4"` across your entire application and never revisiting it is leaving significant money on the table.

---

## Model Routing in Production

Routing means dispatching each request to the appropriate model based on task characteristics.

The simplest form is rule-based routing: classify the request type, map it to a model.

```python
ROUTING_TABLE = {
    "classify":      "deepseek-v3",      # $0.14/$0.28 per 1M
    "summarize":     "claude-haiku-4-5", # ~$1/$5 per 1M
    "analyze":       "claude-sonnet-4",  # $3/$15 per 1M
    "reason":        "claude-opus-4-6",  # $5/$25 per 1M
}

def route(task_type: str, prompt: str) -> str:
    model = ROUTING_TABLE.get(task_type, "claude-haiku-4-5")
    return call_model(model, prompt)
```

A more sophisticated approach uses a cheap model to assess complexity before routing:

```python
async def classify_and_route(user_input: str) -> str:
    # Use cheapest model to assess complexity
    classification_prompt = f"""
    Classify this request as: simple, moderate, or complex.
    Request: {user_input}
    Respond with one word only.
    """
    complexity = await call_model("deepseek-v3", classification_prompt, max_tokens=5)

    model_map = {
        "simple":   "gemini-flash",
        "moderate": "claude-haiku-4-5",
        "complex":  "claude-sonnet-4",
    }
    return await call_model(model_map[complexity.strip()], user_input)
```

The classifier call costs nearly nothing (DeepSeek V3.2 at max 5 tokens output). If the routing saves even 1 in 10 requests from going to Sonnet, it pays for itself immediately.

Production data backs this up. Studies from Shanghai AI Laboratory show routing to task-optimized models achieved 85% cost reduction while maintaining 95% of output quality compared to using a single premium model. RAG pipelines using complexity-based routing report 27–55% cost reductions.

---

## OpenRouter and LiteLLM: The Gateway Layer

Instead of implementing routing logic directly, you can push it to an LLM gateway.

**OpenRouter** is a managed service giving access to 623+ models through a single OpenAI-compatible API. It raised $40M in mid-2025 at a $500M valuation, reflecting real enterprise demand for this layer.

```python
import requests

response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={"Authorization": f"Bearer {OPENROUTER_KEY}"},
    json={
        "model": "anthropic/claude-sonnet-4:floor",  # cheapest provider for this model
        "messages": [{"role": "user", "content": prompt}],
        "provider": {
            "sort": "price",
            "max_price": {
                "prompt": 3.0,       # max $/1M input tokens
                "completion": 15.0   # max $/1M output tokens
            }
        }
    }
)
```

The `:floor` suffix enables cost-optimization mode. The `max_price` field filters providers to those under your price ceiling, then picks the cheapest. This works across providers offering the same model at different prices.

OpenRouter's tradeoffs: ~40ms added latency per request, data routes through their infrastructure, and less control over caching and routing logic. It's the right tool for teams that want multi-provider access without managing infrastructure.

**LiteLLM** is the self-hosted alternative. It's an open-source proxy that presents a unified OpenAI-compatible interface across 100+ providers. You run it on your own infrastructure.

```yaml
# litellm config.yaml
model_list:
  - model_name: budget-tier
    litellm_params:
      model: deepseek/deepseek-v3
      max_budget: 0.0005  # per-request cost ceiling

  - model_name: standard-tier
    litellm_params:
      model: anthropic/claude-haiku-4-5

  - model_name: premium-tier
    litellm_params:
      model: anthropic/claude-sonnet-4

router_settings:
  routing_strategy: cost-based-routing
  fallbacks:
    - budget-tier: [standard-tier]
    - standard-tier: [premium-tier]

general_settings:
  master_key: sk-your-key
  budget_manager: true
```

LiteLLM tracks spend per API key, per team, per project. You set hard limits and it enforces them. Useful when you have multiple teams sharing LLM access and need budget governance.

One known issue: Python's GIL creates a bottleneck above ~500 requests per second. High-throughput applications need a different solution or a clustered deployment.

The hybrid approach works well in practice: run LiteLLM as your internal gateway, route sensitive or high-volume traffic directly to providers, and use OpenRouter as a provider for experimentation or access to models you don't have direct contracts with.

---

## Prompt Caching

If your system prompt is longer than 1,024 tokens, prompt caching is the single highest-ROI optimization available.

The mechanism: the provider processes and caches the static portion of your prompt (system instructions, documents, examples). Subsequent requests that share the same prefix read from cache instead of reprocessing.

**Anthropic cache pricing:**
- Cache write: base input price + 25%
- Cache read: 10% of base input price (90% discount)
- Break-even: 2 cache hits

**OpenAI:** Automatic prefix caching at 50% discount on cached tokens, no configuration required.

```python
# Anthropic explicit caching
response = anthropic.messages.create(
    model="claude-sonnet-4",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": system_prompt,  # 2,000 tokens of instructions
            "cache_control": {"type": "ephemeral"}
        },
        {
            "type": "text",
            "text": reference_doc,  # 5,000 tokens of reference material
            "cache_control": {"type": "ephemeral"}
        }
    ],
    messages=[{"role": "user", "content": user_message}]
)

# Monitor cache performance
usage = response.usage
cache_hit_rate = usage.cache_read_input_tokens / (
    usage.cache_read_input_tokens + usage.cache_creation_input_tokens + 1
)
print(f"Cache hit rate: {cache_hit_rate:.1%}")
print(f"Cache savings this request: ${usage.cache_read_input_tokens * 0.0000027:.4f}")
```

Critical constraint: caching is prefix-based. If the first token of your cached content changes, the entire cache is invalidated. Structure prompts with static content first (system prompt, documents, examples), dynamic content last (user query).

Concrete numbers: a 2,000-token system prompt at 1,000 daily requests is 2B input tokens per month without caching. With a 90% cache hit rate, it's 200M tokens. At Sonnet pricing ($3/1M), that's $5,400 versus $600. A single API parameter change saves $4,800/month.

Prompt caching also reduces time-to-first-token by 50–85% on cached portions. The latency improvement often matters as much as the cost reduction for interactive applications.

---

## Batch API for Async Workloads

If a workload doesn't require a real-time response, it should use the Batch API.

**OpenAI Batch API: 50% discount** on all models for requests that can wait up to 24 hours (most complete within an hour). **Anthropic Message Batches:** equivalent discount structure.

```python
import json
from openai import OpenAI

client = OpenAI()

# Build batch request file
requests = []
for i, document in enumerate(documents_to_process):
    requests.append({
        "custom_id": f"doc-{i}",
        "method": "POST",
        "url": "/v1/chat/completions",
        "body": {
            "model": "gpt-5",
            "messages": [
                {"role": "system", "content": "Summarize the following document in 3 bullet points."},
                {"role": "user", "content": document}
            ],
            "max_tokens": 200
        }
    })

# Write JSONL and submit
with open("batch.jsonl", "w") as f:
    for req in requests:
        f.write(json.dumps(req) + "\n")

batch_file = client.files.create(file=open("batch.jsonl", "rb"), purpose="batch")
batch = client.batches.create(
    input_file_id=batch_file.id,
    endpoint="/v1/chat/completions",
    completion_window="24h"
)
print(f"Batch submitted: {batch.id}")
```

Tasks appropriate for batch:
- Document summarization, classification, translation at scale
- Dataset labeling and annotation
- Nightly report generation
- Embedding generation for vector stores
- SEO content generation pipelines

Tasks that require real-time response (chat, live search augmentation) cannot use batch. Everything else should default to batch when latency requirements allow.

---

## Semantic Caching

Prompt caching handles identical prefixes. Semantic caching handles semantically similar requests.

Research shows 31% of LLM queries across production applications are semantically similar to previous requests. Each one of those is an API call that could be served from cache.

```python
from redis import Redis
from sentence_transformers import SentenceTransformer
import numpy as np

redis_client = Redis()
encoder = SentenceTransformer('all-MiniLM-L6-v2')
SIMILARITY_THRESHOLD = 0.92

async def semantic_cache_lookup(query: str) -> str | None:
    query_embedding = encoder.encode(query)

    # Check against cached embeddings (simplified)
    cached_keys = redis_client.keys("query:*")
    for key in cached_keys:
        cached_data = redis_client.hgetall(key)
        cached_embedding = np.frombuffer(cached_data[b"embedding"])
        similarity = np.dot(query_embedding, cached_embedding) / (
            np.linalg.norm(query_embedding) * np.linalg.norm(cached_embedding)
        )
        if similarity > SIMILARITY_THRESHOLD:
            return cached_data[b"response"].decode()

    return None  # Cache miss — proceed to LLM

async def query_with_cache(user_query: str) -> str:
    cached = await semantic_cache_lookup(user_query)
    if cached:
        return cached  # Zero API cost, ~5ms latency

    response = await call_llm(user_query)

    # Store in semantic cache
    embedding = encoder.encode(user_query)
    redis_client.hset(f"query:{hash(user_query)}", mapping={
        "embedding": embedding.tobytes(),
        "response": response,
    })
    redis_client.expire(f"query:{hash(user_query)}", 86400)  # 24h TTL

    return response
```

High-repetition use cases (support bots, FAQ systems, search) see 20–40% additional cost reduction from semantic caching on top of other optimizations. Applications with more unique queries see less benefit. Worth implementing when you can measure a meaningful cache hit rate.

Production cache hit rates of 40–60% are achievable for conversational applications with good traffic patterns. Cache hits reduce latency from ~800ms to ~350ms while eliminating the API cost entirely.

---

## Putting It Together: Cost Optimization Stack

Stack-ranked by impact-to-effort ratio:

> 1. **Model routing** — lowest implementation effort, highest impact (50–70% cost reduction)
> 2. **Prompt caching** — apply immediately if system prompt > 1,024 tokens (up to 90% on input)
> 3. **Batch API** — 50% discount on all non-realtime workloads, zero quality tradeoff
> 4. **Output constraints** — `max_tokens` + explicit length instructions in prompt
> 5. **Semantic caching** — layer on top of the above for high-repetition use cases

Combined, these strategies produce 70–85% total cost reduction compared to a baseline of sending everything to a premium model with no optimization.

The teams most effective at this treat cost architecture the same way they treat system design: as a first-class concern that gets designed upfront, not patched in after the billing shock arrives.

Model prices will continue falling. What matters is building the routing and caching layer that can take advantage of every price drop automatically — rather than being locked into a single provider and model because switching costs are too high.

> "Every dollar saved on LLM costs at equivalent quality is a dollar of margin. At scale, that compounds into a meaningful competitive advantage."
