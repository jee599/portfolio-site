---
title: "From Opus 4.7 Launch-Day Coverage to contextzip v0.2: 15 Claude Code Sessions in One Day"
project: "portfolio-site"
date: 2026-04-17
lang: en
pair: "2026-04-17-portfolio-site-ko"
tags: [claude-code, contextzip, agents, harness, opus-4-7, auto-publish]
description: "Analyzed Opus 4.7's 232-page system card, shipped contextzip v0.2 to 5 platforms, and built 6 agent harness types — all in 15 Claude Code sessions and 1,000+ tool calls."
---

On 2026-04-17, Anthropic shipped Opus 4.7. By morning, I had the 232-page system card in Claude's context. By afternoon, a DEV.to post was live. By evening, contextzip v0.2.0 binaries were on GitHub Releases for five platforms. That's 15 Claude Code sessions and over 1,000 tool calls in a single day.

**TL;DR** — Opus 4.7 analysis → breaking news published → contextzip v0.2 released → 6-agent harness built. All shipped same day.

## How to Digest a 232-Page System Card in Under an Hour

Anthropic dropped the official system card PDF in the morning. Model ID: `claude-opus-4-7`. Pricing: $5/$25 per MTok. Context: 1M tokens, 128k max output. The biggest breaking change was **adaptive thinking** — the old `budget_tokens` parameter alone no longer works. You now need `type: "enabled"` combined with `budget_tokens`.

First session: 3 `Read` calls, 2 `Bash` calls. I passed Claude the PDF URL and told it to extract only the key sections.

You can't read 232 pages in one shot. I chunked by page range and called `Read` multiple times, going through positioning → benchmarks → alignment in sequence. Total session time: 4 minutes, 6 tool calls.

The next session produced the articles. Using the `auto-publish` skill, I wrote two pieces simultaneously — **an Opus 4.7 `budget_tokens` migration guide** and **an analysis of OpenAI's duct-tape era (GPT-Image-2 rumor)** — and published them to spoonai.me, DEV.to, and Hashnode. Tool usage: 74 Bash, 14 Read, 8 Edit. Session time: 1 hour 1 minute.

Total time from model launch to DEV.to confirmation: ~3 hours. The bottleneck in breaking-news publishing isn't the prompt — it's sourcing. Going from The Information's exclusive leak → official launch confirmation → system card analysis consumed more than half the total time. I used `WebFetch` + `WebSearch` throughout, but fact-checking at this speed is still slow by nature.

## contextzip v0.2: Validated by Sub-Agents, Shipped in One Session

contextzip is a Rust CLI that compresses Claude Code tool output and cuts token usage by 60–90%. The last release was v0.1.1. Thirty-plus commits had stacked up since then.

The upgrade session (session 7) logged **395 tool calls** — 85 Bash, 70 Edit, 40 Read. One of the core tasks was a real measurement of context footprint. I analyzed what actually consumes tokens in Claude responses across 10 sessions and 6,850 turns:

```
Tool use (inputs)  : 46.4%  ← Edit old/new_string, Write payloads, etc.
Tool results       : 39.4%  ← Command output, file content
User text          : 10.1%
Assistant text     :  4.1%  ← Claude narration, apologies, etc.
```

Claude's own narration accounts for **4.1%**. The real compression lever is tool input/output. The `Agent` tool averaged 2.9 KB per input — the heaviest single tool. `Write` averaged 5.3 KB per input.

New features (session history compression, TOML filter expansion, context-history layer, DSL extension) each got a dedicated sub-agent for validation. Four agents ran in parallel, punching through a checklist and returning results. Independent eyes catch edge cases the implementer misses.

Deployment (session 9): 33 Bash, 8 Glob, 4 Read, 1 Edit. Bumped `Cargo.toml` from 0.1.0 → 0.2.0, committed, pushed the tag. GitHub Actions built five platform binaries automatically — `linux-x86_64`, `linux-musl`, `macos-arm64`, `macos-x86_64`, `windows-x86_64` — and attached them to the release.

## Building the Agent Harness: 6 Types Complete

Session 5 kicked off with four sub-agents running parallel research on harness design principles. The conclusion was blunt: **the first principle of a harness is minimalism**. Anthropic's own recommendation is "add only after observed failure." My current `~/.claude/` was already heavy — CLAUDE.md at 82 lines, 92 KB of MEMORY files, 20+ skills.

Session 8 added four new agent definitions:

| Agent | Model | Role |
|---|---|---|
| `blog-writer` | sonnet | Drafts for 3 platforms (spoonai · naver-dental · devto) |
| `design-reviewer` | sonnet | UI review on 5 axes, read-only |
| `frontend-implementer` | sonnet | TS + Next.js + Tailwind implementation |
| `content-editor` | sonnet | Strips AI clichés, copy editing |

Combined with the existing `plan-orchestrator` and `code-verifier`, that's 6 total. The chain order is now codified in `sticky-rules.md`: implementation complete → `code-verifier` → `design-reviewer` → `content-editor`.

An agent file isn't a 400-line instruction block. Look at the format: role, model, 3–5 core constraints. That's it. Shorter files stay consistent across compaction boundaries.

## 10 Mockups Generated in Parallel — and Why Most Got Scrapped

The spoonai.me design refactor (session 10, 395 tool calls) was the most direct test of parallel agent dispatch. Ten designs — bento grid, masonry, neo-brutalism, swiss tabular, japanese kinfolk, netflix cinema, Y2K chrome, dashboard ticker, and two more — each got an agent. Ten agents, ten simultaneous HTML files.

Because each agent ran independently, all ten completed at roughly the same time. I picked masonry (#2). The other nine got dropped.

The feedback "all of these are bad" came up twice. The first time, the mockups were dense with AI-generic clichés. The second time, the actual implementation had a bug where the `top news` badge appeared on every card. Both times, finding the root cause took longer than it should have — layout bugs are hard to diagnose from code alone. Skipping the step of running a local server and checking in a browser is not an option.

## What This Day Actually Taught Me

**Parallel agents win in exploration, not execution.** Ten designs, four research threads, four validation runs — when outputs are independent, parallel dispatch cuts time dramatically. Sequential work (implement → verify → deploy) still needs sequential execution.

**Tool call count is not a proxy for complexity.** Session 10 hit 395 tool calls, but most were repetitive Edit and Bash operations. Session 3 logged 147 calls and actually published three articles across three repos. What matters is the output, not the count.

**Fact-checking can't be skipped in a breaking-news pipeline.** The Opus 4.7 post started with "just dropped" as the prompt, but publishing without verification risks shipping wrong information. The sequence — The Information leak → official launch page → system card analysis — had to happen in order.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
