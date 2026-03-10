---
title: "An AI That 'Thinks' for 28 Minutes — The Reality of Inference Scaling and Reasoning Models"
date: 2026-03-09
description: "DeepSeek R1 takes 28 minutes to generate 100K thinking tokens. It's trading speed for accuracy"
tags: ["ai", "llm", "inference-scaling", "reasoning", "deepseek", "rlvr"]
lang: "en"
source: "original"
---

The paradigm for improving AI performance has shifted.

Through 2023, the formula was clear. Bigger models, more data, more GPUs. Pour billions into training, and the model gets smarter. GPT-3 to GPT-4 was this playbook in action. This is Training-Time Scaling.

Starting in 2025, a different approach became mainstream. Keep the trained model as-is, but invest more computation **at the moment of generating a response.** This is Inference-Time Scaling. The rough analogy is how humans produce better answers when given more time to think through complex problems.

OpenAI's o-series popularized this shift. Traditional LLMs like GPT-4o give instant answers — System 1 thinking. Reasoning models like o1 and o3 pause, think, verify, then answer — System 2 thinking.

The scale of this transition shows up in the numbers. Analysts project inference compute demand will exceed training demand by 118x by 2026. By 2030, inference could claim 75% of total AI compute, driving $7 trillion in infrastructure investment. OpenAI's 2024 inference spend reached $2.3 billion — 15 times the training cost for GPT-4.

## What Reasoning Models Actually Do Inside

Ask a standard LLM about tax calculations and it pattern-matches from training data. It might be right, might be wrong. No intermediate work visible.

A reasoning model is different. Before answering, it generates step-by-step reasoning inside a `<thinking>` block. These thinking tokens are invisible to the user but consume compute and cost money.

DeepSeek R1 takes 28 minutes to generate 100K thinking tokens on a GPU running at 60 tokens/sec. A standard model finishes in 200 output tokens. A reasoning model might use 10,000–100,000 thinking tokens plus 200 output tokens. Cost can differ by 50x or more. But accuracy improves dramatically.

## Three Core Techniques

**Chain-of-Thought** has the LLM generate intermediate reasoning steps instead of jumping straight to an answer. This is what o1, o3, and DeepSeek R1 all do. The model's "thought process" as text output significantly improves accuracy on complex problems.

**Self-Consistency** generates multiple answers to the same question and uses majority voting to select the final one. Costs multiply by N, but accuracy gains on tasks like math are substantial. DeepSeekMath-V2 combined Self-Consistency with Self-Refinement to achieve gold-medal performance on a competition math benchmark.

**Self-Refinement** has the model critique and revise its own output. Generate once, self-critique, regenerate improved. This is essentially the Reflection pattern from agentic AI applied at the model level.

## DeepSeek R1 vs OpenAI o3

The two leading reasoning models take different architectural approaches.

o3 uses a dense transformer with large-scale reinforcement learning and test-time search. It generates and evaluates multiple reasoning paths internally without revealing them. Every parameter activates during processing, demanding substantial compute but delivering comprehensive reasoning.

DeepSeek R1 uses a Mixture-of-Experts architecture with pure reinforcement learning (RLVR). It generates explicit, user-visible Chain-of-Thought, making its reasoning transparent and auditable. Only a subset of parameters activates per input, keeping costs lower. It matched o1's performance at 70% lower cost.

The core tradeoff: o3 is expensive, powerful, and opaque. R1 is affordable, transparent, and nearly as capable.

## RLVR: Where Reasoning Ability Comes From

DeepSeek R1's reasoning emerged from RLVR — Reinforcement Learning with Verifiable Rewards. The concept is simple: give the model math problems, check if the answer is correct, reward correct answers, penalize wrong ones. Repeat millions of times.

The remarkable discovery: without any human feedback, pure RL produced emergent reasoning ability. Nobody taught the model to "solve step by step" — it invented Chain-of-Thought on its own. AIME benchmark accuracy jumped from 15.6% to 71%.

The constraint: answers must be automatically verifiable. Math has clear correct answers. Code can be tested by execution. Essays and creative writing can't be auto-verified — which is why RLHF (human feedback) is still needed for those domains.

The 2026 trend is RLVR extending beyond math and code into chemistry, biology, law, and other domains where "correct" can be programmatically defined.

## When to Use Reasoning Models

Not every query needs reasoning. The decision criterion: "How bad is it if the answer is wrong?"

A slightly awkward translation is fine. A wrong tax calculation creates legal problems. Use reasoning models where accuracy outweighs cost and latency. Use standard models for everything else. This connects directly to Model Routing — the next evolution is Selective Reasoning, where the system first judges "does this question need deep thinking?" before activating reasoning mode.

> The era of spending hundreds of millions on training is fading. How you invest in inference is the competitive edge of 2026.

---

- [Understanding Reasoning LLMs — Sebastian Raschka](https://magazine.sebastianraschka.com/p/understanding-reasoning-llms)
- [DeepSeek-R1 Technical Report](https://arxiv.org/abs/2501.12948)
- [Inference-Time Scaling — Introl](https://introl.com/blog/inference-time-scaling-research-reasoning-models-december-2025)

---

*Also available on: [Dev.to](https://dev.to/jidonglab) · [Naver](https://blog.naver.com/jidonglab) · [Medium](https://medium.com/@jidonglab)*
