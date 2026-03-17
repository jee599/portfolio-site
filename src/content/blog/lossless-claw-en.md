---
title: "lossless-claw: How a 7-Star Project Solves the Hardest Problem in AI Agents — Forgetting"
date: 2026-03-17
description: "A DAG-based summarization system that replaces sliding-window compaction. Every message preserved, depth-aware prompts, sub-agent recall. The most sophisticated open-source context management architecture."
tags: ["ai", "agent", "llm", "opensource"]
lang: "en"
source: "original"
---

Long conversations kill agents.

Three hours into a coding session, the agent forgets the architecture decision you agreed on. Yesterday's file structure — gone. Last week's deployment strategy — truncated out of the context window. Every AI coding agent hits this wall. [lossless-claw](https://github.com/Martian-Engineering/lossless-claw) solves it by compressing context without losing anything.

<small>[Source: lossless-claw](https://github.com/Martian-Engineering/lossless-claw) — Martian Engineering</small>

## 7 Stars, Maximum Technical Depth

The gap between star count and technical sophistication is enormous. 7 stars, 0 forks — yet 63 commits, 3 releases, a dual-language architecture (TypeScript 66.8% + Go 32.5%), and a complete terminal UI for database inspection and repair. This is an implementation of the LCM (Lossless Context Management) paper published by Voltropy.

The project is a plugin for OpenClaw that replaces sliding-window compaction — the standard approach of simply discarding older messages — with a DAG-based summarization system. The core promise: "Nothing is lost. Raw messages stay in the database."

## Depth-Aware Prompts Are the Real Innovation

The system builds a directed acyclic graph of summaries. Raw messages become leaf summaries (depth 0), which condense into depth 1, then depth 2, and so on. The critical design choice: each depth level uses a completely different prompt strategy.

Depth 0 (Leaf) preserves timestamps, file operations, and decisions in a narrative summary. Depth 1 creates chronological session summaries with deduplication. Depth 2 focuses on arcs — goals, outcomes, what carries forward. Depth 3+ retains only durable context: key decisions, relationships, and lessons learned.

This mirrors how human memory works. Recent events are recalled in detail. Yesterday is a summary. Last month is conclusions. Last year is lessons. Each depth's prompt is engineered to match that layer of abstraction.

## Every Summary Ends With an Escape Hatch

All summaries include an "Expand for details about:" footer listing what was compressed. When the agent needs specifics, it calls `lcm_expand_query`, which delegates a sub-agent to walk the DAG back down to the source messages and compose a precise answer.

Four agent tools enable memory exploration: `lcm_grep` (full-text and regex search), `lcm_describe` (summary/file detail lookup), `lcm_expand_query` (sub-agent deep recall), and `lcm_expand` (low-level DAG traversal for sub-agents only).

The design insight: giving agents tools to explore their past is more effective than stuffing everything into context. Humans don't hold all memories simultaneously either — they recall on demand.

## Not Production-Ready Yet, But the Architecture Matters

The project currently requires an unmerged OpenClaw PR (#22201). The community is tiny. Production use is premature. But the architecture — depth-aware prompt strategies, DAG-based summarization, sub-agent expansion — represents the most sophisticated open-source approach to the long-context agent problem.

Context windows keep growing, but Lost in the Middle degradation and cost remain. "Just use a bigger context" isn't the answer. Intelligent compression is.

> It feels like talking to an agent that never forgets. Because it doesn't.

- [lossless-claw](https://github.com/Martian-Engineering/lossless-claw)
- [LCM Paper](https://voltropy.com/LCM)
- [OpenClaw](https://github.com/openclaw/openclaw)
