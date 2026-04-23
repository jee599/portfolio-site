---
title: "I Reverse-Engineered Claude Design's Leaked 422-Line System Prompt and Ported It to a Local CLI Skill"
project: "portfolio-site"
date: 2026-04-24
lang: en
pair: "2026-04-24-portfolio-site-ko"
tags: [claude-code, claude-design, devto, automation, reverse-engineering]
description: "Claude Design shipped and its 422-line system prompt leaked the same day. Here's what the prompt reveals about its architecture — and how I ported the useful parts to a local Claude Code skill in 136 tool calls."
---

Claude Design launched on April 17, 2026. By 19:55 UTC that same day, its 422-line system prompt was sitting in a public GitHub repository. Four days later I reverse-engineered it with Claude Code, extracted the behavioral patterns, and ported them into a local CLI skill. One session: 27 hours 27 minutes, 136 tool calls.

**TL;DR** 2 sessions, 193 total tool calls — reverse-engineered the leaked Claude Design prompt, built `claude-design-lite` from it, generated 4 redesign variants for jidonglab.com, and published a 3-part DEV.to series on trending AI GitHub projects.

## The Prompt That Started Everything: "Find Me the Leaked Claude Design Code"

That was the literal first message. It was ambiguous enough — local code search or external leak material? — that I narrowed the scope progressively via web searches.

What surfaced: `Claude-Design-Sys-Prompt.txt` in the `elder-plinius/CL4R1T4S` repo — 422 lines, 73KB. Commit timestamp: 2026-04-17 19:55, matching Claude Design's official release date exactly.

Follow-up questions came fast: "Is this the latest version?", "Any source code?", "How is the internals structured?", "How do I actually use it?". I mapped what was public, what wasn't, and separated confirmed fact from community speculation.

| What | Leaked? |
|---|---|
| Claude Code TypeScript source (513,000 lines) | ✅ npm sourcemap incident, 2026-03-31 |
| Claude Design system prompt + tool schema | ✅ public GitHub repo, 2026-04-17 |
| Claude Design actual source code | ❌ still private |

The Claude Code sourcemap incident from March was unrelated — a build artifact that accidentally bundled compiled-with-source TypeScript. But it set a precedent: the community had already been doing prompt archaeology by the time Claude Design launched.

## What 422 Lines of System Prompt Actually Tell You

I read the full prompt plus tool schema and inferred the internal architecture. Not "I saw the source code" — more accurately, "I inferred the enforced contract from the outside."

Three structural patterns were clear.

**The model is a practitioner, not a chatbot.** The prompt defines Claude Design as "a professional designer who uses HTML as the primary medium." The user is the manager; the model is the IC. Videos, slide decks, prototypes, brand identities — everything gets built as HTML first, then converted to the target format. There are no markdown or plain-text responses. If you expect a bullet list explaining your design options, you won't get one. You get files.

**Projects are filesystem-backed, not chat-backed.** Claude Design operates in a completely separate space from regular claude.ai sessions. Files use relative path conventions; other projects live under `/projects/<project-name>/`. The model reads and writes files directly — it behaves closer to a local editor session than a conversation thread.

**13 built-in tools, including browser-level primitives.** The schema includes `create_file`, `edit_file`, `web_search`, and `screenshot_page`. That last one matters: it means Design can render HTML and screenshot the result inline, without ever leaving the environment. The iteration loop is self-contained.

I compiled this analysis into a standalone HTML guide at `/Users/jidong/claude-design-guide.html` — Instrument Serif headlines, IBM Plex Sans body copy, JetBrains Mono for code, automatic dark/light switching.

## "Can We Inject This Into Claude Code and Get the Same Behavior?"

That's where the session shifted. The honest answer is: partly.

Claude Design's host-dependent features — Live Preview, the Tweaks panel, Design Mode — require the web runtime. They can't be replicated locally. But the behavioral layer — **the question discipline, context collection, variation generation, and AI-slop prevention** — is pure prompt logic. That part is portable.

So I built `~/.claude/skills/claude-design-lite/SKILL.md`. The core logic:

```
1. Three pre-flight checks before activating:
   - Is this actually a design task?
   - Do I have enough context to generate real variations, not generic output?
   - Is this a follow-up iteration or a fresh exploration?

2. Ten question templates for context gathering:
   - Brand identity, target users, feature scope,
     visual references, technical constraints, etc.

3. Three variation directions per session:
   - Each direction uses a different aesthetic principle
   - Variations must be genuinely distinct, not color-swap copies of each other

4. AI-slop guard (hard block):
   - No glassmorphism
   - No neumorphism
   - No gratuitous gradient stacking
   - No "card with drop-shadow on white background" defaults
```

I ran the skill immediately against a jidonglab.com redesign — answered all ten questions, got four directions back:

- `v1-notebook.html` — notebook aesthetic, handwritten texture treatment
- `v2-pro.html` — cream/acid/deep palette, built on live data
- `v2-studio.html` — dark studio tone, editorial weight
- `v3-labos.html` — experimental, asymmetric layout, no grid

The v2-pro direction held up best in review. Feedback: "Good, but can we push it further?" — so I added an activity heatmap: a full year of commits, posts, and build logs in one view, with cumulative counts and longest streak visible. Mid-review the question came: "Is this real data?" It wasn't yet — placeholders. I switched it to pull live data from the actual sources.

Session 2 totals: Edit ×37, Bash ×36, Write ×12, WebSearch ×11. 136 tool calls across 27 hours 27 minutes.

## Publishing a 3-Part DEV.to Series in a Single Session

A separate session the next day arrived as a one-liner: "find ~4 trending AI GitHub projects, analyze them, post to DEV.to." The `auto-publish` skill triggered. After one refinement ("make it 3 posts"), I proposed structure, got approval, and ran the publishing sequence.

Four projects became a thematic 3-part series:

| Part | Projects Covered | Angle | Status |
|---|---|---|---|
| Part 1 | andrej-karpathy/skills + hermes-agent | The Skills paradigm emerging | Published (04-23, 14:55 UTC) |
| Part 2 | OpenClaw | Local MCP gateway architecture | Draft (scheduled 04-25) |
| Part 3 | opencode | The terminal agent arms race | Draft (scheduled 04-27) |

[Part 1 — How a Markdown File Hit 16K Stars: Skills in 2026](https://dev.to/ji_ai/how-a-markdown-file-hit-16k-stars-skills-in-2026-36hi) is live. Parts 2 and 3 are uploaded with `published: false` and scheduled to flip on their dates.

There was already a published piece (`claude-code-channels-vs-openclaw-en.md`) covering "Claude Code Channels vs. OpenClaw" as a head-to-head comparison. That angle doesn't overlap with Part 2's architecture focus, so I kept it as an internal link rather than rewriting it.

Session 1 totals: Bash ×22, WebSearch ×4, TaskCreate ×4. 53 tool calls over 3 hours 25 minutes.

## Two Sessions, Combined

| Session | Date | Duration | Tool Calls | Work |
|---|---|---|---|---|
| Session 4 | 04-22 | 27h 27min | 136 | Claude Design reverse-engineering + 4 redesign variants |
| Session 1 | 04-23 | 3h 25min | 53 | 3-part DEV.to series |

Tool breakdown across both sessions: Bash ×59, Edit ×41, Read ×19, WebSearch ×15, TaskUpdate ×15, Write ×15, TaskCreate ×10. Files created: 13. Files modified: 4.

Two skills got their first real production deployment this cycle: `claude-design-lite` (built mid-session and immediately applied to the redesign) and `auto-publish` (ran the DEV.to series end-to-end). Both were written and used within the same session that created them — no staging, no testing environment.

## What the Prompt Is Actually Teaching

The leaked prompt isn't most useful as a jailbreak template or a "copy and deploy" artifact. What's interesting is what it reveals about production-grade prompt architecture.

The clearest signal: the 422 lines spend almost no text explaining *what HTML is* or what good design looks like in the abstract. It assumes those. The bulk of the content is behavioral enforcement — what the model should *not* do, how to handle ambiguous inputs, what counts as acceptable output versus a lazy default. The ratio of "don't do X" to "do Y" is roughly 3:1.

That's the layer worth porting. Not the specific tool names, not the filesystem path conventions — those are host-specific details. The discipline of asking before generating, the structured variation approach, and the explicit guard rails against AI aesthetic defaults are the transferable primitives. That's what `claude-design-lite` captures.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
