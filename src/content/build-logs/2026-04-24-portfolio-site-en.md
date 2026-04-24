---
title: "Reverse-Engineering Claude Design's 422-Line System Prompt — 4 DEV.to Posts Shipped"
project: "portfolio-site"
date: 2026-04-24
lang: en
pair: "2026-04-24-portfolio-site-ko"
tags: [claude-code, claude-design, auto-publish, devto, content-automation, agents]
description: "Reverse-engineered Claude Design's leaked 422-line prompt, ported its core pattern to a local skill, then shipped 4 DEV.to posts — 4 sessions, 279 tool calls."
---

The 422-line Claude Design system prompt appeared on GitHub on April 17, 2026 — the same day the product launched.

**TL;DR**: Reverse-engineered the leaked Claude Design prompt, distilled its core interaction pattern into a local skill (`claude-design-lite`), generated 4 redesign variants for jidonglab.com, and shipped 4 DEV.to posts via `auto-publish`. 4 sessions, 279 tool calls.

## The 422-Line Prompt Nobody Was Supposed to See

Longest session of the four: 27 hours 27 minutes, 136 tool calls.

Starting prompt: "find the leaked claude design code."

At first it wasn't clear what "claude design" meant — local codebase or something external. Narrowed the scope by figuring out what `claude.ai/design` actually was: a new product from Anthropic Labs launched April 17, 2026. Ran a web search.

Found it in `elder-plinius/CL4R1T4S`: `Claude-Design-Sys-Prompt.txt` — 422 lines, ~73KB. Commit timestamp: 2026-04-17 at 19:55. Matches the official launch date.

| Item | Leaked? | Notes |
|------|---------|-------|
| Claude Code TypeScript source (513K lines) | ✅ | npm sourcemap incident, 2026-03-31 |
| Claude Design system prompt + tool schemas | ✅ | Public repo, 2026-04-17 |
| Claude Design actual source code | ❌ | Still private |

Three structural patterns extracted through reverse-engineering:

**Role definition** — "A professional designer who uses HTML as a tool." HTML is the only native output format. Videos, slides, prototypes, decks — all implemented as HTML first, then converted if needed.

**Filesystem-based projects** — Separate namespace from regular claude.ai chats. Path conventions: `<relative path>` for the current project, `/projects/<project-name>/` for others. Direct file read/write, not just conversation context.

**Variationer pattern** — Every design request auto-generates 3 variants with different styles, layouts, and color palettes. The output isn't one answer — it's a structured set of choices.

> The method here is "inferring from enforced contracts" — no source code, just 422 lines of prompt + tool schemas. What Claude Design *can't* do isn't forbidden by the prompt; it simply doesn't exist in the tool schemas.

Compiled the analysis into an HTML guide: `/Users/jidong/claude-design-guide.html`, 7 sections — from "is this a prompt or a skill?" to all 13 built-in tools.

## Porting the Questioning Framework to a Local Skill

"Can we inject this into the CLI and replicate the same behavior?"

Host-dependent features — Live Preview, Tweaks, Design Mode — can't be implemented locally. But the **questioning framework, context gathering, variation generation, and AI-slop guardrails** can be ported.

Created `~/.claude/skills/claude-design-lite/SKILL.md`. Core logic:

```
3 self-checks before activating
 - Is this actual design work vs. simple markup/refactoring?
 - Is there already enough context?
 - Is this a follow-up or a fresh exploration?

10 context question templates
 (identity, users, feature scope, references, color direction, etc.)

3 variation directions + AI-slop guardrails
 - Block: glassmorphism, neumorphism, gradient abuse
```

The key insight from Claude Design: it leads with 10 questions before producing any output. Regular prompts jump straight to the result. Design makes questioning mandatory. That structure went directly into the skill.

Applied it immediately to a jidonglab.com redesign. Answered the 10 questions, got 4 directions:

- `v1-notebook.html` — notebook texture, handwritten feel
- `v2-pro.html` — cream/acid/deep palette, real data
- `v2-studio.html` — dark, studio tone
- `v3-labos.html` — experimental, asymmetric layout

"v2-pro looks good — anything worth pushing further?" That feedback led to adding an activity heatmap: one year of commits, posts, and build logs on a single screen. Follow-up: "is that real data?" Reworked it with live data from git history and content collections. Deployment scoped to the next session.

## 4 Trending AI Repos → a 3-Part DEV.to Series

Separate session. 3 hours 25 minutes, 53 tool calls.

Starting prompt: "analyze 4 trending AI projects on GitHub and post the writeups to DEV.to."

`auto-publish` skill activated. WebSearch collected April 2026 trending repos:

- `andrej-karpathy/skills` — 16K stars. Define agent skills as a single Markdown file.
- `hermes-agent` — Agent framework built on the Hermes model.
- `OpenClaw` (steipete) — 295K stars. Local AI gateway + 50+ integrations.
- `opencode` — Terminal-native AI agent.

Revised direction mid-session: "make it 3 posts." Collapsing 4 projects into 3 posts forced a structural decision — shift from project-by-project to theme-by-paradigm. That shift is what made the series work.

| Post | Projects | Angle | Status |
|------|----------|-------|--------|
| Part 1 | andrej-karpathy/skills + hermes-agent | Birth of the Skills paradigm | Published (04-23 14:55 UTC) |
| Part 2 | OpenClaw | Local MCP gateway | Draft (04-25) |
| Part 3 | opencode | Terminal agent wars | Draft (04-27) |

Part 1 published: [How a Markdown File Hit 16K Stars: Skills in 2026](https://dev.to/ji_ai/how-a-markdown-file-hit-16k-stars-skills-in-2026-36hi) — DEV.to id=3542024.

Parts 2 and 3 uploaded as `published: false` drafts, scheduled for manual publish on the target dates. First session where staggered draft-and-publish worked correctly end-to-end.

## GPT-5.5, Duct Tape, and Telegram as an Async Control Interface

4th session. 10 hours, 88 tool calls. Triggered entirely via Telegram.

Message received: "write a blog post about gpt 5.5 and duct tape."

Two topics that look adjacent but aren't the same project. GPT-5.5 (codename "Spud," released April 23, 2026). Duct Tape (GPT Image 2, live-testing on LM Arena under `packingtape`/`maskingtape` aliases).

First task before writing a word: duplicate check. Had already published "OpenAI Duct Tape / GPT Image 2" across 3 platforms on April 16 — 8 days prior. Making Duct Tape the main story again would be redundant. Adjusted: GPT-5.5 (Spud) as the primary narrative, Duct Tape handled via internal link.

"Split into 2 posts" → "queue them for publishing." Once direction was locked, dispatched 4 agents in parallel to generate the files. One bug: DEV.to `description` came in at 156 characters — 1 over the limit. Trimmed and pushed.

The workflow pattern that solidified here: Telegram for direction-setting, no back-and-forth confirmation. One message scopes the work, agents execute in parallel. The bottleneck is human review, not generation time.

## 4 Sessions, 279 Tool Calls

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

Bash at 34% is structural — `auto-publish` runs git push, DEV.to API calls, and file verification all through shell. The 12 Agent calls were exclusively parallel content generation: splitting independent domains into subagents keeps the main context window lean while maximizing throughput.

13 files created, 5 modified. The Claude Design session alone produced 11 new files: 4 HTML variations + 3 skill files + 1 HTML guide + 1 API route + misc.

Two skills made their production debut this week. `claude-design-lite` was applied to a live redesign the same session it was created. `auto-publish` ran staggered scheduled publishing correctly for the first time. Building a skill and immediately deploying it against a real task is the fastest path to finding what it's missing.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
