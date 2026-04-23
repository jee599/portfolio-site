---
title: "Reverse-Engineering Claude Design's Leaked System Prompt — 3 Sessions, 284 Tool Calls"
project: "portfolio-site"
date: 2026-04-24
lang: en
pair: "2026-04-24-portfolio-site-ko"
tags: [claude-code, claude-design, sub-agents, devto, automation]
description: "Claude Design leaked its 422-line system prompt on launch day. Here's how I reverse-engineered it into a local Claude Code skill, ran 5 parallel research agents, and shipped a 3-part DEV.to series — 284 tool calls across 3 sessions."
---

The day Claude Design launched, its 422-line system prompt appeared on GitHub. Two days later I fed it into Claude Code, extracted the patterns, and ported them into a local skill — 128 tool calls, 22 hours.

**TL;DR**: 3 sessions, 284 total tool calls — parallel research verification with 5 sub-agents, Claude Design reverse engineering, and auto-publishing a 3-part DEV.to series.

## Five Agents Verified 66,745 Words of Assumptions

The `dentalad/` project had a consistency problem. V1 research and V2 validation were landing on different conclusions, but the FINAL-REPORT still reflected V1 assumptions throughout.

Two concrete errors that made the gap undeniable:

1. **Naver Cue:** was shut down on 2026-04-09. V1 had treated it as a core ranking algorithm and built an entire strategy around it.
2. **AI content cost**: V1 calculated ₩26,000 per generated blog post. V2 corrected this to ₩1,700. The final report still showed the V1 number.

Reading 66,745 words sequentially to catch every discrepancy would have been slow and error-prone. Instead, I split the document by domain and dispatched five agents in parallel:

```
Agent 1 → Regulations (AI Basic Act, FTC guidelines, Medical Law)
Agent 2 → Competitors (Carelabs, Top 5 market players)
Agent 3 → Platforms (Naver, Meta, ChatGPT)
Agent 4 → Unit economics (COGS, pricing, MRR)
Agent 5 → Market data (ROAS, LTV, TAM)
```

Key findings from the parallel run:

- **Competitors**: Three companies (Sangseung Gihoek, Raonhaje, Adresult) had revenue figures inconsistent with their headcount. V2 had flagged these for downward revision; FINAL-REPORT still used V1 numbers.
- **Platforms**: The document claimed "ChatGPT blocks Naver." The factual direction was inverted — **Naver blocks ChatGPT crawlers**. Subject and object were swapped.
- **Regulations**: The FTC virtual-person guidelines were in public comment stage, not enacted law. V1 had presented them as active requirements.

Each finding was patched into the relevant document and saved as five separate reports under `verification/`. Session 1: Bash 31, Edit 23, TaskCreate 9 — 103 tool calls, 3h 12min.

## Claude Design Committed Its System Prompt to GitHub on Launch Day

It started with a search query: "find the leaked Claude Design source."

That surfaced `elder-plinius/CL4R1T4S` on GitHub — `Claude-Design-Sys-Prompt.txt`, 422 lines, 73KB. Commit timestamp: 2026-04-17 19:55. Identical to Claude Design's official release date.

Three structural patterns from the analysis:

**Role definition**: Claude Design frames itself as "a professional designer who uses HTML as the primary tool." The user is positioned as a manager; the model is the practitioner. Videos, slides, and prototypes are all built as HTML first, then converted. Markdown or plain text responses are explicitly avoided.

**File system-first operation**: Unlike standard claude.ai chat, it works at project scope. Paths use `<relative path>` notation; separate projects live under `/projects/<project-name>/`. Files are written and modified directly, not described.

**13 built-in tools**: `create_file`, `edit_file`, `web_search`, `screenshot_page` among them. Browser preview is handled inline without switching context.

The goal was to reproduce this behavior in the local CLI. Host-dependent features — Live Preview, Tweaks, Design Mode — were cut. What remained worth porting: the question methodology, context collection before starting any design work, variation generation, and AI-slop guards that keep output from looking generated. The result is `~/.claude/skills/claude-design-lite/`.

The skill was tested immediately against a `jidonglab.com` redesign. Four directions generated as HTML: v1-notebook, v2-pro, v2-studio, v3-labos.

Session 2: Edit 37, Bash 36, WebSearch 11, Write 12 — 128 tool calls, 22h 3min.

## A Casual Prompt Became a 3-Part Series on DEV.to

The input was one sentence: "find 4 trending AI GitHub projects, analyze them, post to DEV.to." The `auto-publish` skill ran.

Four projects were restructured into a 3-part series — 2,500–3,500 words each, independently readable but sequentially connected:

| Part | Projects | Angle | Status |
|------|----------|-------|--------|
| Part 1 | andrej-karpathy/skills + hermes-agent | The Skills paradigm emerges | Published |
| Part 2 | OpenClaw | Local MCP gateway | Draft (2026-04-25) |
| Part 3 | opencode | Terminal agent competition | Draft (2026-04-27) |

Part 1 — [How a Markdown File Hit 16K Stars: Skills in 2026](https://dev.to/ji_ai/how-a-markdown-file-hit-16k-stars-skills-in-2026-36hi) — published 2026-04-23 at 14:55 UTC. Parts 2 and 3 were uploaded as drafts (`published: false`) and will go live on their scheduled dates.

An existing OpenClaw article (`claude-code-channels-vs-openclaw-en.md`) was already in the system covering a different angle — Claude Code Channels vs OpenClaw comparison. Rather than overwriting it, that piece became an internal link from Part 2.

Session 3: Bash 22, WebSearch 4 — 53 tool calls, 3h 25min.

## 3 Sessions by the Numbers

| Session | Date | Duration | Tool Calls | Work |
|---------|------|----------|-----------|------|
| 1 | 2026-04-22 | 3h 12min | 103 | Research verification |
| 2 | 2026-04-22 | 22h 3min | 128 | Claude Design reverse engineering + redesign |
| 3 | 2026-04-23 | 3h 25min | 53 | DEV.to series publishing |

By tool type: Bash 89, Edit 64, TaskUpdate 31, Write 25. 23 files created, 7 modified.

Two skills saw their first production deployment this week: `claude-design-lite` and `auto-publish`. Both were written and used within the same session — built, tested, and shipped in one pass.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
