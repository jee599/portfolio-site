---
title: "11 Characters Triggered 97 Tool Calls — Claude Code auto-publish Build Log"
project: "portfolio-site"
date: 2026-04-25
lang: en
pair: "2026-04-25-portfolio-site-ko"
tags: [claude-code, auto-publish, multi-agent, automation, telegram]
description: "One Telegram message: 97 tool calls, 29h 39m, 4 posts, 3 platforms. How auto-publish handled research, duplicate detection, and parallel agents end-to-end."
---

One Telegram message — 11 characters — kicked off 97 tool calls over 29 hours and 39 minutes. Four posts landed on three platforms. I typed exactly two sentences the entire time.

**TL;DR**: The `auto-publish` skill autonomously handled research, duplicate detection, strategy revision, 4 parallel agent dispatches, and multi-platform publishing. Total human input: "split into 2 posts" and "queue up for staging."

## The Request Had Two Keywords That Meant Two Different Projects

The message: *"write a blog post about GPT 5.5 and duct tape."*

At first glance, one topic. It isn't. Three `WebSearch` calls established what was actually in scope:

- **GPT-5.5 (codename: Spud)** — OpenAI's reasoning model released 2026-04-23. Positioned between GPT-4.5 and full GPT-5 on the capability curve.
- **Duct Tape (GPT Image 2)** — An image generation model being evaluated on LM Arena under the aliases `packingtape` and `maskingtape`. No official announcement at time of request.

Same company. Same month. Completely different modalities.

The editorial frame: *OpenAI's April double-launch — reasoning + image = pieces of the super app puzzle.* That angle wasn't in the request. Research surfaced it.

Before drafting a single word, the pipeline ran a history check.

## The Pipeline Found an Existing Post from Eight Days Earlier

History scan result: a post covering "OpenAI Duct Tape / GPT Image 2" had already been published on 2026-04-16 — on spoonai.me, DEV.to, and Hashnode.

Writing the same subject again produces thin content. Publishing it hurts SEO.

Strategy shifted: **make GPT-5.5 (Spud) the primary story** and connect Duct Tape via a canonical internal link to the existing post. Rewriting the same topic is duplication; canonical linking is a net SEO positive.

This call was made by the model. No confirmation request sent to the user.

The outline went to Telegram. User replied: "split into 2 posts." Direction locked.

## 4 Parallel Agents — After Loading 5 Reference Files First

Before dispatching any agents, 5 reference files were loaded via `Read`:

- Canonical URL: `https://jidonglab.com/blog/openai-gpt-5-5-spud`
- DEV.to username and constraint rules
- Hashnode publication slug
- spoonai.me content schema
- Per-platform character limits and tag constraints

Loading references before dispatch eliminates a class of errors. Agents run in isolation — without the right canonical URL or username baked in at spawn time, they'll invent values. Pre-loading makes those values deterministic.

With references confirmed, Part 1 dispatched to 4 agents simultaneously:

```
Agent 1 → spoonai.me Korean (Part 1)
Agent 2 → spoonai.me English (Part 1)
Agent 3 → DEV.to English (Part 1)
Agent 4 → Hashnode English (Part 1)
```

All 4 ran in parallel, generating files independently. Parallel generation matters beyond speed: sequential agents drift toward the first agent's tone and structure. Isolated dispatch means each agent writes to its platform's conventions without influence from the others.

Part 2 followed the same pattern after Part 1 publish confirmation.

## "Queue Up for Staging" — One Sentence, Three Platforms

That was the second and final sentence of human input.

`git add`, `git commit`, and `git push` ran per platform automatically. Commit messages followed conventional commits: `feat: publish GPT-5.5 Spud post (spoonai.me ko)`, etc. Each platform got its own commit for clean history and surgical rollback.

## The DEV.to 156-Character Trap

Post-generation inspection ran platform constraint checks. DEV.to `description`: 156 characters. Platform limit: 155. One character over.

Trimmed, re-checked, pushed.

The fix is trivial. The catch is not. This bug surfaced because **generation and review are separate pipeline stages**. The generation agent produces content. The review stage validates platform constraints. When those responsibilities are separated, each has a clear failure mode.

A monolithic pipeline — generate + validate + publish in one pass — would likely ship this silently. The validation objective gets buried inside the generation prompt and deprioritized.

> Platform constraints get caught at review, not generation. The pipeline separation is what makes quality gates reliable.

## Session Stats

| Metric | Value |
|---|---|
| Session length | 29h 39m |
| Total tool calls | 97 |
| Bash | 42 (43%) |
| Telegram messages | 11 |
| Agent dispatches | 8 |
| Read | 7 |
| Posts generated | 4 |
| Platforms published | 3 |

42 Bash calls at 43% of total is the obvious optimization target. Most of it is `git add + commit + push` running as 3 separate commands, per platform, per post. A single multi-repo push script would cut that by more than half.

The 11 Telegram messages break down as: 1 original request, 2 human decisions, 8 status/confirmation updates from the pipeline. The model reported more than it asked.

## What Changes When Telegram Is the Input Layer

The 11-character message carried zero prompt engineering. No "act as a technical writer" preamble. No format specification. No platform instructions. The pipeline filled in context from:

- Content history (duplicate detection)
- Skill definitions (platform constraints, character limits)
- Reference files (canonical URLs, usernames)
- Agent specialization (each agent knows its target platform)

The prompt became the intent. Everything else was already encoded in the system.

This is the meaningful shift: **the interface moved out of the IDE, and the pipeline still worked.** Short, context-free messages are enough to trigger the full pipeline. You don't need to be at a computer. You don't need to write long prompts.

The bottleneck in most content pipelines is the human in the loop, not generation speed. When the input layer moves to messaging, the human becomes an async approver rather than a synchronous operator.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
