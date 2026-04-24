---
title: "One Telegram Message → 4 Posts Across 3 Platforms: A Claude Code Multi-Agent Automation Log"
project: "portfolio-site"
date: 2026-04-25
lang: en
pair: "2026-04-25-portfolio-site-ko"
tags: [claude-code, auto-publish, multi-agent, automation]
description: "A Telegram message about GPT-5.5 triggered 97 tool calls over 29 hours: research, duplicate detection, 4 parallel agents, and a 1-char DEV.to trap. Full log."
---

One Telegram message. Twenty-nine hours, thirty-nine minutes, and 97 tool calls later: four posts — two in Korean, two in English — were live across three platforms.

The original request: *"write a blog post about gpt 5.5 and duct tape."* No platform preferences. No outline. No language specified. Two keywords with an implicit expectation that something publishable would come out the other end.

**TL;DR**: The `auto-publish` skill handled research → duplicate detection → strategy pivot → parallel multi-agent generation → per-platform inspection → publishing without human input. The only human checkpoint was four words: *"split it into 2 parts."*

## Research First: Two Keywords, Three Searches

The `auto-publish` pipeline doesn't treat incoming messages as prompts to write against directly. It treats them as intents that require disambiguation before any content decisions are made.

"gpt 5.5 and duct tape" has two signals that looked related but needed verification. Before drafting a single outline bullet, the skill ran three `WebSearch` calls.

What came back:

- **GPT-5.5** ships under the internal codename **Spud** (released 2026-04-23). Positioned between GPT-4.5 and GPT-5 on the capability curve — not a flagship, but optimized as a practical workhorse for coding and instruction-following workloads. Mid-tier pricing, broad availability.

- **Duct Tape** is the internal name for **GPT Image 2**, OpenAI's next-generation image model. Currently running on LM Arena for anonymous blind evaluation under the aliases `packingtape` and `maskingtape`. Strong preference scores. No official announcement as of the request date.

They're entirely separate product lines. GPT-5.5 is a language model update; Duct Tape is an image generation project that happens to share an April release window.

Together they form a coherent editorial angle: *OpenAI's dual April launch — reasoning model + image model = pieces of a super app.* That angle wasn't in the request. The research step surfaced it. This matters because it determines whether you write one post covering both or two posts treating them separately.

## Duplicate Detection Before Writing Anything

Before drafting, the pipeline ran a publishing history check across all three platforms.

It found a problem: a post covering "OpenAI Duct Tape / GPT Image 2" had already been published to spoonai.me, DEV.to, and Hashnode on **2026-04-16** — eight days earlier.

Writing the same subject again produces thin content at best and sends a duplicate content signal at worst. Neither outcome is acceptable.

Two options surfaced:
1. Write a new Duct Tape post anyway, accept the overlap, hope readers don't notice
2. Make GPT-5.5 (Spud) the main subject; reference the existing Duct Tape post via canonical internal link

Option 2 is the correct call. The 2026-04-16 post retains its authority. The new post covers fresh material. A canonical internal link is a SEO positive, not a penalty.

This pivot happened without a human decision. The pipeline evaluated the situation, chose the better strategy, and logged its reasoning before continuing.

## "Split Into 2 Parts" — 4 Parallel Agents

The structured outline went back via Telegram for a review pass. The user's full response: *"split into 2 parts."*

That was the last human input in the session.

The pipeline interpreted this as: publish Part 1 (GPT-5.5 technical overview) and Part 2 (the broader OpenAI April strategy story) as separate posts, not a single long piece. For each part, four agents launch in parallel — one per platform/language combination.

Part 1 dispatch:

```
Agent 1 → spoonai.me Korean (Part 1)
Agent 2 → spoonai.me English (Part 1)
Agent 3 → DEV.to English (Part 1)
Agent 4 → Hashnode English (Part 1)
```

Pre-dispatch setup before agents launched:
- Five reference files loaded via `Read` (GPT-5.5 announcement, benchmark comparisons, existing Duct Tape post, LM Arena screenshot, OpenAI pricing page)
- Canonical URL locked: `https://jidonglab.com/blog/openai-gpt-5-5-spud`
- DEV.to username verified
- Per-platform constraints loaded: DEV.to description ≤ 155 chars, max 4 tags, no hyphens; Hashnode requires cover image for normal feed distribution; spoonai.me frontmatter must match the schema in `src/content/config.ts`

All four agents ran concurrently. Each agent has a fully self-contained context: platform target, language, frontmatter schema, canonical URL, reference files. They don't share state or communicate with each other.

The isolation design matters for failure handling. If Agent 3 (DEV.to) fails mid-generation, Agents 1, 2, and 4 are unaffected. You can re-dispatch just the failed agent without re-running the others. In a sequential pipeline, a single failure blocks everything downstream.

Part 2 followed the same four-agent pattern after Part 1 publishing was confirmed. One Telegram message — *"queue up for publishing"* — triggered `git add`, `git commit`, and `git push` for each platform file in sequence. No manual staging, no interactive prompts.

## The 156-Character Trap

After generating all four Part 1 files, the pipeline ran a per-file inspection pass before committing anything.

One issue: the DEV.to `description` field clocked in at **156 characters**. The platform enforces a hard 155-character limit.

One character over.

Trimmed one word. Re-checked. Then pushed.

The fix itself is trivial. What's not trivial is catching it before it ships. The pipeline runs as three distinct phases: **generate → inspect → publish**. They're not collapsed into a single pass.

The inspection phase exists because platform constraints don't fail loudly — they either silently truncate metadata or reject the API call after the fact, when the post is already partially live in a broken state. By the time you catch it post-publish, you've got a live post with bad SEO metadata and a correction to make publicly.

Per-platform gotchas the inspection step routinely catches:
- DEV.to: 155-char description cap, max 4 tags, no hyphens in tag names, `tags` must be lowercase
- Hashnode: cover image field required; missing it means the post shows up in the feed without a preview image
- spoonai.me: Astro Content Collections schema is strict — missing or mistyped frontmatter fields throw a build error

In a pipeline that generates and immediately publishes, all of these would surface as post-publish corrections. Separating generation from inspection makes them pre-push corrections instead.

## Session Stats

| Metric | Value |
|---|---|
| Session length | 29h 39m |
| Total tool calls | 97 |
| Bash calls | 42 (43%) |
| Telegram messages | 11 |
| Agent dispatches | 8 |
| Read calls | 7 |
| Posts generated | 4 |
| Platforms published | 3 (spoonai.me, DEV.to, Hashnode) |

The 42 Bash calls are the obvious optimization target. Most of them are `git add` / `git commit` / `git push` running separately per platform, per part. That's platform × part × 3 commands = 12+ calls just for git operations, repeated each publishing round. Batching all platform files into a single commit per part would bring the Bash count down substantially.

It's a known inefficiency. The current structure is per-platform commits for clean history and isolated rollback. Worth revisiting once the publishing flow is more stable.

Of the 11 Telegram messages, 1 was the original request, 1 was "split into 2 parts," and the rest were status updates and publishing confirmations. Human decision-making input: 2 messages. The rest is the model reporting what it did.

## What This Architecture Gets Right

**Telegram as an intent relay, not a command interface**

The input doesn't need to be a structured command. "gpt 5.5 and duct tape" is a vague brief. The pipeline resolves the intent internally — through research, disambiguation, duplicate detection — before committing to any output format. Input quality doesn't determine output quality.

This decoupling is what makes short Telegram messages viable as triggers. You're not compressing a full prompt into a message; you're providing a direction and letting the pipeline do the specification work.

**Duplicate detection before generation, not after**

Most automation pipelines skip duplicate checking entirely. This one runs it as a mandatory phase before any writing happens. The 2026-04-16 Duct Tape finding changed the entire structure of the output — from "write about both" to "write about Spud, link to the existing Duct Tape post." That's not a minor tweak; it's a structural change to the content strategy.

Without this check, the pipeline would have generated a Duct Tape post that repeats the 2026-04-16 material. With it, the new post is correctly positioned and links back to the original rather than competing with it.

**Agent isolation for failure resilience**

Each of the four parallel agents is independently retryable. This is intentional — not just an architectural convenience. In any parallel execution model, the failure recovery cost of a shared-state design is the entire batch. Isolated agents make failure local.

**Generate → inspect → publish as three phases**

The inspection step is a quality gate between content creation and publishing. It doesn't require human review — it runs automatically — but it exists as a distinct phase so constraints can be checked while there's still time to fix them cleanly. The 156-char DEV.to description was caught here, fixed in two seconds, and never touched the live platform in a broken state.

> When Telegram becomes the input channel, a short context-free message is enough to trigger the entire pipeline. The pipeline resolves context, detects conflicts, adapts strategy, and executes — all before the first word is written. The constraint isn't prompt engineering. It's having a pipeline with distinct phases that each do one thing well.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
