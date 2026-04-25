---
title: "97 Tool Calls in One Session — Shipping a GPT-5.5 Analysis to 3 Platforms with Claude Code"
project: "portfolio-site"
date: 2026-04-26
lang: en
pair: "2026-04-26-portfolio-site-ko"
tags: [claude-code, auto-publish, multi-agent, telegram]
description: "A Telegram message triggered 97 tool calls over 30 hours: duplicate detection, 4 parallel agents, and simultaneous publishing to spoonai.me, DEV.to, and Hashnode."
---

97. That's how many tool calls Claude made in a single session. 29 hours and 39 minutes: 42 Bash calls, 11 Telegram responses, 8 Agent dispatches. It all started with a one-line Telegram message: `write a blog post about GPT 5.5 and duct tape`.

**TL;DR** Split a GPT-5.5 (codename Spud) and Duct Tape (GPT Image 2) analysis into two parts and published them simultaneously across three platforms. The critical move: catching a duplicate post from 8 days earlier before it caused SEO conflicts.

## One Telegram Message, 30 Hours of Work

The message was short. Claude picked it up, fired the `auto-publish` skill, and started researching immediately.

GPT-5.5 and Duct Tape are unrelated projects. **GPT-5.5 (codename Spud)** is a model released on 2026-04-23. **Duct Tape** is the internal codename for GPT Image 2, which was tested on LM Arena under the aliases `packingtape` and `maskingtape`. The framing angle: "OpenAI's April two-handed launch: reasoning + image = super app puzzle."

Research results and a proposed structure were sent to Telegram together — no waiting for approval before locking in the outline.

## Duplicate Detection Changed the Strategy

Before pulling references, existing publication history was checked first. That's where the critical finding came in.

**Eight days earlier (2026-04-16), a "OpenAI Duct Tape / GPT Image 2" post had already been published to all three platforms.** That topic was already deeply covered. Writing the same thing again would be straight duplicate content.

Strategy adjusted: GPT-5.5 (Spud) as the main topic, Duct Tape connected via internal links to the existing post. Canonical URL unified to `https://jidonglab.com/blog/openai-gpt-5-5-spud`.

After a user request to split into two parts, the content was divided into Part 1 (GPT-5.5 technical analysis) and Part 2 (OpenAI Super App roadmap).

## 4 Agents in Parallel

Once 5 references were loaded, 4 agents were dispatched simultaneously:

```
1. @content-writer → "Part 1 ko (spoonai.me)"
2. @content-writer → "Part 1 en (spoonai.me)"
3. @content-writer → "Part 1 DEV.to (English)"
4. @content-writer → "Part 1 Hashnode (English)"
```

Sequential would have meant 4× the time. Parallel means total time equals the slowest agent's runtime.

One small bug surfaced during the review pass: the DEV.to description was 156 characters — one over the 155-character limit. Trimmed and pushed.

## Publishing Flow

After Part 1 validation, Part 2 went through the same process. Final commit sequence:

```bash
# spoonai-site
git add content/blog/2026-04-25-openai-gpt-5-5-spud-{ko,en}.md
git commit -m "feat: GPT-5.5 Spud analysis (Part 1 ko/en)"
git push origin main

# dev_blog
git add posts/2026-04-25-openai-gpt-5-5-spud-en.md
git push origin main
```

Status reports went to Telegram at each stage. Errors triggered immediate Telegram alerts, which meant the session could run unattended.

## Tool Distribution

| Tool | Count | Purpose |
|---|---|---|
| Bash | 42 | git push, file checks, metadata queries |
| Telegram response | 11 | Progress reports, structure proposals |
| TaskUpdate | 11 | In-session task state updates |
| Agent | 8 | Parallel content generation |
| TaskCreate | 7 | Subtask creation |
| Read | 7 | Reference and existing file review |

Bash dominates at 42 because git operations and filesystem checks run repeatedly throughout the session. The actual content generation was handled by 8 Agent calls.

## What Skipping the Duplicate Check Would Have Cost

The same topic would have been published twice. From an SEO perspective, canonical conflicts. From a reader perspective, redundant content. Checking publication history before research is the sequence that matters.

The `auto-publish` skill's Phase 1 (source analysis) enforces this. Keyword input triggers an existing publication history check. Follow the skill, skip the mistake.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
