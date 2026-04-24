---
title: "Reverse-Engineering Claude Design's 422-Line Leak — 5 Posts Shipped Across 4 Sessions"
project: "portfolio-site"
date: 2026-04-24
lang: en
pair: "2026-04-24-portfolio-site-ko"
tags: [claude-code, claude-design, auto-publish, devto, reverse-engineering, agents]
description: "Reverse-engineered Claude Design's leaked 422-line system prompt, built a local skill from it, and shipped 5 posts across 4 sessions with 279 tool calls."
---

422 lines. That's how long Claude Design's system prompt is — and it's been sitting in a public GitHub repo since April 17, 2026.

Four sessions later: one new local skill, a 3-part DEV.to series, and two blog posts about GPT-5.5. Total: 279 tool calls.

**TL;DR** Found the leaked Claude Design system prompt in `elder-plinius/CL4R1T4S`, reverse-engineered its core techniques — question framework, context collection, variation generation, AI-slop guards — and ported them into a local `claude-design-lite` skill. Separately, turned 4 trending AI GitHub repos into a DEV.to series, and shipped two GPT-5.5 posts triggered entirely via Telegram.

## The 422-Line Prompt Nobody Was Supposed to See

Longest session of the four: 27 hours 27 minutes, 136 tool calls.

It started with a vague ask: "find me the leaked Claude Design code." Unclear what "Claude Design" meant — local code? an external leak? Spent the opening stretch narrowing scope.

`claude.ai/design` — launched by Anthropic Labs on April 17, 2026. Confirmed. Ran a web search.

Found it in `elder-plinius/CL4R1T4S`: `Claude-Design-Sys-Prompt.txt`, 422 lines, 73KB. Commit timestamp: 2026-04-17 19:55 — same day as the official launch.

What's leaked, what isn't:

| Item | Leaked? | Notes |
|------|---------|-------|
| Claude Code TypeScript source (513K lines) | ✅ | npm sourcemap incident, 2026-03-31 |
| Claude Design system prompt + tool schemas | ✅ | Public repo, 2026-04-17 |
| Claude Design actual source code | ❌ | Still private |

Three structural patterns that stood out:

**Role definition** — "A professional designer who uses HTML as a tool." HTML is the only native output format. Videos, slides, prototypes, decks — all implemented as HTML first, then converted if needed.

**Filesystem-based projects** — Separate namespace from regular claude.ai chats. Path conventions use `<relative path>` for the current project and `/projects/<project-name>/` for others. Direct file read/write, not just conversation context.

**Variationer pattern** — Every design request auto-generates 3 variations: different style, layout, and color palette. The output isn't one answer — it's a structured set of choices.

Turned the analysis into an HTML guide first: `/Users/jidong/claude-design-guide.html`, 7 sections — from "is this a prompt or a skill?" to all 13 built-in tools.

## Porting the Technique to a Local Skill

"Can we inject this into the CLI and get the same output?"

Some features can't travel. Live Preview, Tweaks, and Design Mode all depend on Anthropic's hosted runtime. But the question framework, context collection, variation generation, and AI-slop guards are pure technique — fully portable.

Built `~/.claude/skills/claude-design-lite/SKILL.md`. Core logic:

```
Three self-checks before activation:
 - Is this actual design work vs. simple markup / refactoring?
 - Is there already enough context?
 - Is this a follow-up or a fresh exploration?

10 context-gathering question templates
 (identity, user, feature scope, references, etc.)

3 variation directions + AI-slop guard
 - Block: glassmorphism, neumorphism, gradient abuse
```

Applied it immediately to a jidonglab.com redesign. Answered the 10 questions, got 4 directions:

- `v1-notebook.html` — notebook texture, handwritten feel
- `v2-pro.html` — cream/acid/deep palette, real data
- `v2-studio.html` — dark, studio tone
- `v3-labos.html` — experimental, asymmetric layout

Feedback on v2-pro: "looks good, anything else to add?" Added an activity heatmap showing a year of commits, posts, and build logs on one screen. Follow-up: "is this real data?" Swapped in actual data from the git history and content collections.

The skill validated itself within the same session it was created.

## 4 Trending AI Repos → 3-Part DEV.to Series

Separate session: 3 hours 25 minutes, 53 tool calls.

Prompt: "pick ~4 hot AI GitHub projects from April 2026 and publish analysis posts to DEV.to"

`auto-publish` skill triggered. WebSearch pulled trending repos:

- `andrej-karpathy/skills` — 16K stars. Defining agent skills via a single Markdown file
- `hermes-agent` — Agent framework built on the Hermes model
- `OpenClaw` — 295K stars. Local AI gateway with 50+ integrations
- `open-code-cli` — Terminal-native AI agent

Revised instruction mid-session: "make it 3 posts, not 4." The regrouping forced a structural decision — go from project-by-project to theme-by-paradigm. That shift is what made the series work.

| Post | Projects Covered | Angle | Status |
|------|-----------------|-------|--------|
| Part 1 | andrej-karpathy/skills + hermes-agent | The skills paradigm emerges | Published (04-23 14:55 UTC) |
| Part 2 | OpenClaw | Local MCP gateway | Draft (scheduled 04-25) |
| Part 3 | open-code-cli | Terminal agent wars | Draft (scheduled 04-27) |

Part 1 published: [How a Markdown File Hit 16K Stars: Skills in 2026](https://dev.to/ji_ai/how-a-markdown-file-hit-16k-stars-skills-in-2026-36hi)

Parts 2 and 3 uploaded to DEV.to as `published: false`, scheduled for their respective dates. First session where staggered publishing worked cleanly end-to-end.

## GPT-5.5, Duct Tape, and Telegram as an Async Control Interface

4th session: 10 hours, 88 tool calls. Triggered entirely via Telegram.

Message received: "write blog posts about gpt 5.5 and duct tape"

These look adjacent but they're separate projects. GPT-5.5 (codename "Spud", released 2026-04-23). Duct Tape (GPT Image 2, live-testing on LM Arena under the aliases `packingtape` and `maskingtape`).

First actual task before writing a single word: deduplication check. Had already published "OpenAI Duct Tape / GPT Image 2" across three platforms on April 16 — 8 days prior. Making duct tape the main story again would be redundant. Adjusted the angle: GPT-5.5 (Spud) as the primary narrative, duct tape handled via internal link.

"Split into 2 posts" → "queue them for publishing" — once the direction was locked, dispatched 4 agents in parallel to generate files. One bug surfaced: DEV.to description hit 156 characters, 1 over the limit. Trimmed and pushed.

The workflow pattern that solidified here: use Telegram for direction-setting, no confirmation round-trips. One message scopes the work, agents execute in parallel. The bottleneck is human review, not generation time.

## Tool Usage Across 4 Sessions

| Tool | Count | Share |
|------|-------|-------|
| Bash | 95 | 34% |
| Edit | 42 | 15% |
| TaskUpdate | 26 | 9% |
| Read | 26 | 9% |
| WebSearch | 18 | 6% |
| Write | 15 | 5% |
| Agent | 12 | 4% |
| Other | 45 | 16% |

Bash at 34% is structural — `auto-publish` runs git push, DEV.to API calls, and file verification all through shell. The 12 Agent calls were exclusively parallel content generation: independent domains get split off as subagents to keep the main context window clean while maximizing throughput.

13 files created, 5 modified. The Claude Design session alone produced 11 new files: 4 HTML variations, 3 skill files, 1 HTML guide, 1 API route, misc.

Two skills made their production debut this week: `claude-design-lite` (built and applied in the same session) and `auto-publish` (first time staggered publishing ran correctly). Building a skill and immediately deploying it against a real task is the fastest path to discovering what it's missing.

> The point of reverse-engineering Claude Design wasn't curiosity about the leak. It was extracting one specific technique — the question framework — and running it locally. A single skill file changed output quality in a way that's hard to get from a prompt alone.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
