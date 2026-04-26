---
title: "12 Parallel Agents, 627 Tool Calls: What 5 Claude Code Sessions Actually Look Like"
project: "portfolio-site"
date: 2026-04-27
lang: en
pair: "2026-04-27-portfolio-site-ko"
tags: [claude-code, claude-design, subagent, dental-ad, devto, spoonai]
description: "Reverse-engineered Claude Design's leaked system prompt into a local skill. 12 parallel sub-agents analyzed the Korean dental ad market. 5 sessions, 627 tool calls, 40 files."
---

627 tool calls across 5 sessions. 40 files created. Most of it wasn't writing code — it was figuring out how to use Claude Code better.

**TL;DR** Pulled apart Claude Design's leaked system prompt and ported the relevant parts into a `claude-design-lite` skill. Ran 12 parallel sub-agents to research the Korean dental advertising market. Published 3 DEV.to articles in the process.

## What 422 Lines of Claude Design's System Prompt Actually Says

Two days after Claude Design launched on 2026-04-17, the system prompt showed up in the `elder-plinius/CL4R1T4S` repository. 422 lines, ~73KB. I fed it into Claude Code and started reading.

Three things stood out.

**Claude Design runs as a "professional designer who uses HTML as a medium."** It doesn't think in Figma abstractions or design tokens — it thinks in HTML/CSS and builds everything (videos, slides, prototypes) as web documents. The file system is the project context.

**The 10-question intake is the core mechanic.** It doesn't start generating immediately. It asks: Does the project have a defined identity? Who's the audience? What are the reference aesthetics? It locks down the design direction before touching HTML. This is what separates it from "write me a landing page" prompts.

**There's an explicit AI-slop guard.** Banned: "generic gradients," "glass-morphism cards," "floating geometric shapes." The rules are in the prompt verbatim.

I ported all three into `~/.claude/skills/claude-design-lite/SKILL.md`. Left out the Live Preview and Tweaks functionality (host-dependent), kept the intake questions, context collection, variation logic, and anti-slop guards.

Applied it immediately to a jidonglab.com redesign. Generated 5 variations under `~/jidonglab-redesign/` — v1 (notebook), v2 (pro), v3 (labos), v3/home. Ended up modifying `src/components/home/About.astro`, `Projects.tsx`, and `home.css`.

## Running 5 Agents in Parallel to Fact-Check 66,745 Words of Research

Inside `dentalad/ads-research/` there were 66,745 words of market research documents — 12 original files plus 8 validation passes. The problem: the conclusions contradicted each other in several places.

Dispatched 5 sub-agents in parallel, one per domain: regulation, competitors, platforms, unit economics, market data. The results came back with a clear pattern of errors and omissions.

- Naver Cue: was treated as a core algorithm in V1. It was shut down on 2026-04-09.
- The AI Basic Act enforcement date was wrong.
- CareRabs' 2025 profitability turnaround and ongoing acquisition were missing entirely.
- The subject/object were inverted in one claim — it was Naver blocking ChatGPT, not the other way around.

V2 had overridden V1 on 12 separate items, but FINAL-REPORT was still pulling V1 figures. Fixed 3 files directly.

During this session I also tested generating dental blog images with Codex. The output was obviously AI-generated — wrong color palette and layout when compared against top-ranked Naver blog posts in the dental niche. Shelved the skill-building for now.

## The DEV.to Series: AI GitHub Projects Worth Following in 2026

Picked 4 projects — `andrej-karpathy-skills`, `hermes-agent`, `OpenClaw`, `opencode` — and wrote a 3-part series: **The 2026 AI GitHub Playbook**.

- **Part 1**: "How a Markdown File Hit 16K Stars: Skills in 2026" — published (DEV.to id=3542024)
- **Part 2**: OpenClaw local gateway — uploaded as draft
- **Part 3**: opencode terminal agent — uploaded as draft

Published Part 1 immediately, scheduled the others. Ran the full Phase 1-4 pipeline in the `auto-publish` skill.

On the same day, noticed a visible quality drop between April 25 and April 26 spoonai articles. Restructured the article format: body summary + contextual knowledge + industry insight in one piece, with a relevant image inserted mid-article. Modified `self-critique.mjs` so it applies to subsequent generated articles.

## Dispatching 12 Agents: Korean Dental AI Vendor Research

Session 5 was the largest agent dispatch. The task: classify 60 Korean "AI medical advertising" vendors into 8 categories and surface actual deliverables from each — sample blog posts, ad creatives, chatbot transcripts, portfolio screenshots.

12 agents in parallel, each assigned a non-overlapping domain. Synthesized into 4 HTML reports: trend comparison, deep-dive on AI vendors, a plain-language primer, and an actual deliverables gallery.

Only 2 vendors had named references with hard numbers (5-star cases): Howon & Company and Inblog. The rest were either anonymized or estimated.

The lesson from running 12 agents: more agents doesn't mean better results. Half of them came back with usable data. The productive half had tighter, narrower scopes. The right move is narrower domains, not more parallelism.

## Numbers This Week

| Metric | Value |
|---|---|
| Sessions | 5 |
| Total tool calls | 627 |
| Bash / Edit / Agent / Write | 233 / 81 / 58 / 47 |
| Files created | 40 |
| Files modified | 14 |
| DEV.to published | 1 |
| DEV.to drafts | 2 |
| Max parallel agents | 12 (session 5) |

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
