---
title: "62 Tool Calls, 1 Write: Running Claude Opus Across Three Domains in a Day"
project: "portfolio-site"
date: 2026-05-28
lang: en
pair: "2026-05-28-portfolio-site-ko"
tags: [claude-code, automation, research, claude-opus, hermes, orchestration]
description: "4 sessions, 62 tool calls, 1 Write. How claude-opus-4-7 processed an intel report, dental ad research, and a revenue report in one day using the Hermes relay pattern."
---

62 tool calls across 4 sessions. Three completely different domains. One Write.

**TL;DR** — Ran claude-opus-4-7 through a Hermes relay architecture to process a SpoonAI intel report, dental ad research, and a P1 revenue report in a single day. The majority of tool calls were Read and Bash — reading before writing accounts for more than half of all operations.

## What Four Sessions Actually Looked Like

On 2026-05-28, claude-opus-4-7 handled four sessions across three domains.

**Session 1** — Took `2026-05-28-daily-intel-raw.json` for SpoonAI's new site and organized it into card-news-style markdown and JSON output. Finished in 10 Bash calls. File structure verification, format-peeking yesterday's artifacts, and validating the output directory all fit within that count.

**Sessions 2 & 3** — Dental ad research. Analyzed 15 SERP samples (12 region × treatment combinations, 2 risk-expression variants, 1 cost-event variant) and updated 5 cumulative files. The interesting part: this work split into two sessions. The first pass created `2026-05-28-daily-update.md` but missed the cumulative file updates — `rolling-knowledge-base.md`, `naver-ranking-hypotheses.md` — and the HTML report. A Narrow Finish Pass covered the rest.

**Session 4** — An integrated revenue report across four P1 products (Dental AI, FortuneLab, SpoonAI, Shorts). Four `WebSearch` calls pulled that day's market signals, with the output rendered as HTML. External events like the dental SNS pre-review panic were woven directly into the report.

## The Scope Gate That Kills Context Waste

Every session prompt starts with the same five-part structure:

```
1. Goal — one-sentence restatement of the objective
2. Scope — only the files/directories being touched
3. Work to do — actual execution steps
4. Non-scope — what stays untouched
5. Assumptions — handling unblocking ambiguities
```

Without this structure, the model infers scope on its own and ends up reading files it doesn't need. Requests that come through Hermes relay are especially prone to context loss — the original prompt's intent degrades as it passes through layers. The Scope Gate is the buffer that absorbs that loss.

The dental sessions showed the payoff clearly. When the first pass finished only 1 of 5 required files, the second prompt didn't touch the completed file. The Non-scope declaration blocked the rework.

## When One Session Isn't Enough: The Narrow Finish Pass

Sessions 2 and 3 are the canonical pattern for large work items. Try to finish a big task in one session, fall short, handle the remainder in a follow-up.

Why does the split happen? As context accumulates in the first session, the cost of exploration and comprehension rises. The session closes before the model reaches the artifact-writing phase. The Narrow Finish Pass is the recovery strategy — make explicit what's already done, hand only the incomplete items to the next session.

```
# Structure of the second session prompt
The first artifact pass created 2026-05-28-daily-update.md
but did not finish cumulative files or HTML report.

## Scope
Only finish/update these existing required artifacts:
- rolling-knowledge-base.md
- source-index.md
- ...
```

Without this framing, the second session restarts the same exploration loop as the first.

## What the Tool Call Distribution Reveals

| Tool | Count |
|------|-------|
| Bash | 27 |
| Read | 24 |
| TaskCreate | 5 |
| WebSearch | 4 |
| Write | 1 |
| ToolSearch | 1 |

51 reads and confirmations. 1 write. Before writing, you need to fully read input files, existing cumulative documents, and prior artifacts to produce output that matches established style. In dental research specifically — where every claim needs a label (`official / observed / hypothesis / unverified-figure`) — skipping the Read phase breaks formatting consistency with existing documents.

The 5 TaskCreate calls came from session 4 (P1 revenue report), where each report section was tracked as a discrete task. For longer sessions, using TaskCreate as intermediate checkpoints proved effective.

## The Relay Architecture: Why Hermes Doesn't Write

In this setup, Hermes only forwards prompts. Design, implementation, edits, and final review belong to Claude CLI.

It sounds obvious, but in practice the boundary blurs. When Hermes starts directly judging artifact quality or modifying files, two layers end up touching the same files concurrently and conflicts arise. For today's sessions, the role boundary was made explicit in the prompt:

```
You are Claude CLI / Claude Code — the actual content intelligence author.
Hermes is the relay/orchestrator only.
```

That one line locks the model's role identity. Without it, responses occasionally come back framed as if Hermes generated them.

## Today's Numbers

| Item | Value |
|------|-------|
| Sessions | 4 |
| Total tool calls | 62 |
| Bash | 27 |
| Read | 24 |
| Write | 1 |
| Files created | 1 |
| Model | claude-opus-4-7 (all sessions) |

> One Write represents 62 tool calls. Reading and verification are what make the write possible.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
