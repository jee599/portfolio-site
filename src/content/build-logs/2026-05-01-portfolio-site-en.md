---
title: "12 Parallel Claude Code Agents, 144 Tool Calls: Mapping an Entire Market in Two Days"
project: "portfolio-site"
date: 2026-05-01
lang: en
pair: "2026-05-01-portfolio-site-ko"
tags: [claude-code, subagent, research, automation, devto]
description: "12 Claude Code subagents in parallel, 144 tool calls: surveyed 60 Korean AI medical ad companies, generated 8 HTML reports, published 5 DEV.to posts."
---

60 companies surveyed. 8 HTML reports auto-generated. 5 blog posts published to DEV.to. 144 tool calls. Two days of wall-clock time.

That's what parallel subagent dispatch looks like in practice with Claude Code.

**TL;DR** For research tasks, running 12 subagents in parallel is roughly 12x faster than doing it solo — but only when your domains don't overlap. Give each agent an exclusive slice of the problem space and a strict output format. Two sessions, 144 tool calls, 8 market analysis files and 5 DEV.to articles shipped.

## One Prompt, Twelve Agents

I wanted to know how many companies in Korea were actually selling AI-powered medical advertising. Google searches returned scattered, incomplete data. So I handed it to Claude Code:

> "Survey all Korean companies doing AI medical advertising. Every single one. Use multiple subagents."

Before dispatching, I decomposed the research domain into 12 non-overlapping categories: AI blog agencies, AI content automation SaaS platforms, Naver Place specialists, Meta/YouTube ad creative generators, medical advertising law consultants, chatbot integrators, and more.

Each category became one `Agent()` call. All 12 calls were bundled into a single message — parallel dispatch. Each agent was responsible for exactly one category and returned results in a consistent HTML section format.

Total overlap: zero. Total wasted research: zero.

## What Came Out

Twelve agent outputs merged into eight HTML files:

| File | Contents |
|------|----------|
| `TREND-COMPARISON-REPORT.html` | 5-year / 1-year / 90-day ad trend comparison |
| `AI-AGENCIES-DEEP-REPORT.html` | 60 companies across 8 categories with full breakdowns |
| `AI-AGENCIES-PRIMER.html` | Jargon-free primer for non-specialists |
| `AI-AGENCIES-EXAMPLES.html` | Real portfolio samples and output gallery |
| `AI-DENTAL-MASTER.html` + 4 more | Evidence docs, directory index, master summary |

`AI-AGENCIES-DEEP-REPORT.html` alone contains 9 sections, 60 company cards, a pricing comparison table, and ROI analysis. In that single session I invoked `Agent` 47 times. Of the 85 total tool calls in Session 1, 55% were subagent dispatches.

## Three Conditions for Parallel Dispatch to Work

Not every task benefits from parallelization. This one did because three conditions held simultaneously.

**1. Domains were cleanly separated.** "AI blog agencies" and "chatbot integrators" don't share any companies. No agent surveyed the same target twice.

**2. Outputs merged cleanly into a single document.** Each agent returned a self-contained HTML section. Concatenation was the only merge step needed.

**3. Agent count stayed within rate limits.** Twelve agents ran stably. From experience, 5–15 is the reliable band. Go beyond that and you start hitting API rate limits and seeing coordination overhead eat into the gains.

If any of these three conditions fail, parallel dispatch creates more problems than it solves — duplicate research, inconsistent output formats, or hard-to-debug partial failures.

## The Gotcha: Silent Success Bred Duplicate Files

Session 2 was five DEV.to articles about Codex, Symphony, and GPT Image 2.

During execution, several tool calls appeared to fail — but had actually succeeded on the backend. The agents interpreted the ambiguous responses as failures and retried. Result: 8 draft files on disk when I needed exactly 5.

Fixed it with `Bash` to list and delete the 3 duplicates. Then `git push` was rejected — the CI pipeline had committed ahead of me:

```bash
git pull --rebase origin main
git push
```

Claude Code read the rejection error automatically and decided to run `pull --rebase` without prompting — I didn't ask. On repos with active CI pipelines this pattern repeats regularly.

The root cause of the duplicate files: no explicit file naming convention in the agent prompts. The fix: always specify it. Something like "output filename must match `YYYY-MM-DD-{slug}-en.md` exactly." Without that constraint, each agent makes its own naming decision and you get collisions.

## Session 2: Keyword to Published Posts

Input prompt for the second session:

> "Write 5 DEV.to posts about the latest Codex news — GPT Image 2, Symphony, that kind of thing"

The `/auto-publish` skill fired `WebSearch` to gather fresh sources, proposed 5 topic drafts, and waited for approval. One `y`. Five agents ran in parallel, each writing one article (~9,000 characters) and publishing via the DEV.to API. All five were grouped into a series automatically.

| # | Title |
|---|-------|
| 1 | GPT Image 2 Inside Codex: My New Frontend Workflow |
| 2 | Symphony: Why OpenAI's PRs Jumped 500% in 3 Weeks |
| 3 | I Gave Codex My Mouse for a Day |
| 4 | Codex + o3: When the Agent Writes the Tests First |
| 5 | The Codex Failure Modes Nobody Talks About |

## Tool Call Breakdown — 144 Total

| Tool | Count | Share |
|------|-------|-------|
| Agent | 55 | 38% |
| TaskUpdate | 31 | 22% |
| Bash | 23 | 16% |
| TaskCreate | 13 | 9% |
| Write | 8 | 6% |
| WebSearch, Read, other | 14 | 9% |

Agent calls at 38% is my personal benchmark for a well-delegated research session. It means most of the actual searching, reading, and writing happened inside subagents rather than inline in the main context. When that number drops below 20%, I'm doing too much myself.

## The Real Constraint: Decomposition Before Delegation

> Subagents aren't a speed tool. They multiply throughput only on tasks that already have clear boundaries.

Direction decisions, quality judgment, framing — those stay in the main context. "Write a good article" produces mediocre output. "Write about this topic, with this structure, in this tone, targeting this audience" produces something usable.

Both sessions pre-defined the structure before dispatching. The decomposition work — deciding which 12 categories to research, defining what each HTML section should contain, choosing which 5 article topics to cover — happened before a single `Agent()` call was made. That's what made the parallel dispatch effective.

The mental model: subagents multiply velocity on work that's already been decomposed. Decomposition itself is non-delegatable.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
