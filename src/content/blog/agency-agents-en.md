---
title: "agency-agents: 120 AI Specialist Personas That Prove Prompts Need Personality, Not Just Instructions"
date: 2026-03-17
description: "A 31k-star collection of AI agent definitions with unique personalities, workflows, and success metrics across 12 divisions. The next evolution beyond 'Act as a developer.'"
tags: ["ai", "promptengineering", "agent", "opensource"]
lang: "en"
source: "original"
---

"Act as a developer." That was once the state of the art in prompt engineering.

[agency-agents](https://github.com/msitarzewski/agency-agents) ends that era. Born from a Reddit thread and refined over months of iteration, this 31k-star project contains 120+ AI agent definitions organized into 12 divisions. Each agent has a unique personality, communication style, concrete deliverables, and measurable success metrics. Not a prompt template — a complete persona.

<small>[Source: agency-agents](https://github.com/msitarzewski/agency-agents) — msitarzewski</small>

## Zero Lines of Code, 31k Stars

GitHub labels this project "Shell 100%" because of the conversion scripts. The actual content is entirely Markdown. Text, not code, earned 31k stars. The insight is fundamental: an agent's power comes from its definition, not its implementation. Define *who it is*, not just *what it does*.

The 12 divisions mirror a real agency: Engineering (15 agents), Design (8), Marketing (18), Sales (8), Paid Media (7), Product (4), Project Management (6), Testing (8), Support (6), Spatial Computing (6), Game Development (19), Specialized (14). The Marketing division alone includes six agents specialized for the Chinese market — Baidu SEO, Xiaohongshu, WeChat, Bilibili, Kuaishou, and China E-Commerce.

## The Anatomy of an Agent Definition

Every agent file follows a shared structure: Identity & Memory, Core Mission, Critical Rules, Technical Deliverables, Workflow Process, Success Metrics.

The differentiators are Critical Rules and Success Metrics. The Reddit Community Builder's Critical Rule: "You're not marketing on Reddit — you're becoming a valued community member who happens to represent a brand." One sentence that prevents spam behavior.

The Evidence Collector's Identity: "I don't just test your code — I default to finding 3–5 issues and require visual proof for everything." Personality shapes behavior.

"Write good code" and "Achieve Core Web Vitals score 90+" produce different results. Measurable criteria make the LLM move with more specificity.

## One Script, Nine Tools

The `convert.sh` script transforms the same agent definitions into formats for Claude Code, Cursor, Aider, Windsurf, Gemini CLI, OpenCode, Codex CLI, GitHub Copilot, and OpenClaw. Each tool's agent system is different — `.md` for Claude, `.mdc` for Cursor, a single `CONVENTIONS.md` for Aider, `.windsurfrules` for Windsurf. The script itself is the best documentation of how AI coding tools differ in their agent architecture.

## Beyond awesome-chatgpt-prompts

awesome-chatgpt-prompts (115k stars) opened the era of "Act as a X" one-liners. agency-agents proposes the next step: complete personas with workflows, prohibitions, and success criteria that guide behavior across an entire conversation, not just the first message.

> Think of it as assembling your dream team, except they're AI specialists who never sleep, never complain, and always deliver.

- [agency-agents](https://github.com/msitarzewski/agency-agents)
- [agency-agents-zh](https://github.com/jnMetaCode/agency-agents-zh) — Chinese translation + 9 originals
