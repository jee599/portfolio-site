---
title: "Telegram to Published: End-to-End Content Automation with Claude Code (4 Sessions, 279 Tool Calls)"
project: "portfolio-site"
date: 2026-04-25
lang: en
pair: "2026-04-25-portfolio-site-ko"
tags: [claude-code, auto-publish, content-automation, multi-agent]
description: "4 sessions, 279 tool calls: Telegram→DEV.to pipeline live, Claude Design reverse-engineered into a portable skill, jidonglab.com redesigned with 4 variants."
---

One Telegram message. Five posts published. Zero manual steps between them.

That's the pipeline that closed across 4 sessions this week — 279 tool calls spanning research, duplicate detection, file generation, and API pushes. The model handles all of it end-to-end. This was the week `auto-publish` went from "mostly working" to "actually reliable."

**TL;DR** 4 sessions, 279 tool calls. 5 posts deployed to DEV.to (1 immediate, 4 as staggered drafts). Claude Design's 422-line leaked system prompt reverse-engineered into a portable `claude-design-lite` skill. jidonglab.com redesigned with 4 distinct variants. The Telegram→model→DEV.to pipeline is now fully end-to-end.

## Four GitHub Projects Turned Into a Three-Part Series With Staggered Publish Dates

The starting prompt was simple: "find 4 trending AI GitHub projects from April 2026 and publish analysis posts to DEV.to."

`auto-publish` skill Phase 1 ran WebSearch for April 2026 trending. Four projects came back: `andrej-karpathy/skills` (16K stars), `hermes-agent`, `OpenClaw` (295K stars), `opencode`.

Then the direction shifted: "make it 3 posts instead."

Rather than restructure as a project-by-project rundown, the framing pivoted to technical paradigms — each post angles from a different architectural lens. This makes each piece independently valuable rather than forcing a reader to consume all three.

| Part | Projects | Angle | Publish |
|------|----------|-------|---------|
| Part 1 | andrej-karpathy/skills + hermes-agent | The Skills paradigm as a new primitive | 04-23 (live) |
| Part 2 | OpenClaw | Local MCP gateway architecture | 04-25 (draft) |
| Part 3 | opencode | Terminal agent competition | 04-27 (draft) |

Parts 2 and 3 were uploaded to DEV.to as `published: false` drafts. They'll publish manually on the target dates. The reason: dropping all three at once buries them in the feed. Three days apart gives each post an independent exposure window in DEV.to's "latest" feed.

Part 1 went live: [How a Markdown File Hit 16K Stars: Skills in 2026](https://dev.to/ji_ai/how-a-markdown-file-hit-16k-stars-skills-in-2026-36hi) — DEV.to id=3542024, 04-23 14:55 UTC.

This was the first session where the staggered draft strategy worked cleanly from a single session without any manual intervention on intermediate steps.

## A Single Telegram Message Hits Duplicate Detection Before Research Even Starts

Session 4. One Telegram message: "write a blog post about gpt 5.5 and duct tape."

Two topics that sound related but aren't. GPT-5.5 (codename Spud, released 2026-04-23) is a language model update. Duct Tape is GPT Image 2 — currently A/B tested on LM Arena under the aliases `packingtape` and `maskingtape`. Different product lines, overlapping release cycles, loosely connected branding.

The pipeline ran duplicate detection before any research started. There was already a post titled "OpenAI Duct Tape / GPT Image 2" published across three platforms on 04-16 — 8 days prior. Writing Duct Tape as the main subject again would produce near-duplicate content with no differentiation.

Direction pivot: GPT-5.5 (Spud) as the lead subject, Duct Tape referenced via internal link.

```
GPT-5.5 main + Duct Tape as internal link
→ canonical: https://jidonglab.com/blog/openai-gpt-5-5-spud
→ DEV.to description: 156 chars → trimmed to 155 → pushed
```

"Split into 2 posts" → "queue for publishing" — 4 agents dispatched in parallel to generate the files. One bug caught during push: DEV.to description was 1 character over the platform limit. Trimmed, re-pushed.

The pattern that locked in during this session: Telegram sets the direction, the model handles everything from research to publication. No human context-switching until it's done. The duplicate detection step is what makes this safe to run autonomously — without it, the pipeline would just flood DEV.to with overlapping content.

## Reverse-Engineering 422 Lines of Leaked System Prompt Into a Portable Skill

The longest session of the four. 27 hours 27 minutes. 136 tool calls.

It started with: "find me the leaked Claude Design code."

WebSearch narrowed to the `elder-plinius/CL4R1T4S` repo, which contained `Claude-Design-Sys-Prompt.txt`. 422 lines. ~73KB. Commit timestamp: 2026-04-17 19:55 — matching Claude Design's public launch date exactly.

No source code. Just the system prompt and tool schemas. The approach was to infer implementation from "what the contract forces" — if a tool schema defines a specific parameter shape, you can work backwards to what logic must be generating it.

Three key patterns extracted from the reverse engineering:

**HTML as the universal intermediate format.** Slides, video mockups, interactive prototypes — everything is generated as HTML first, then converted to whatever the user requested. There's no native per-output format. HTML is the single intermediate representation regardless of the target output type. This has an interesting implication: the model's rendering logic is unified, not specialized per output type.

**The Variationer pattern.** Every design request auto-generates 3 variants with different style, layout, and color palette combinations. This isn't optional behavior — it's enforced by the workflow. The user always sees options. Single-result generation is explicitly avoided.

**10 questions before any output.** Claude Design collects context first — identity, target users, functional scope, design references, color preferences, typography preferences, and more — before generating anything. The context collection phase is mandatory, not skippable.

The question that followed: "can we inject this into the CLI and get the same functionality?"

Partially. Live Preview and Design Mode are host-environment-dependent features — they can't be replicated in a local CLI context. But the portable parts were clear: the question framework, context collection methodology, variation generation discipline, and AI-slop guards.

`~/.claude/skills/claude-design-lite/SKILL.md` was written to capture these. Core structure:

```
Pre-flight self-check (3 questions before activating):
  - Is this actual design work vs. markup cleanup / refactoring?
  - Is enough context already present to proceed?
  - Is this a follow-up iteration or a new design exploration?

10 context questions:
  identity, users, functional scope, references,
  color palette, typography, interaction style, etc.

AI-slop guard — auto-blocks:
  glassmorphism, neumorphism, gradient overuse, card-stacking
```

The skill was applied immediately to a jidonglab.com redesign — no waiting for a future use case. Answering the 10 context questions up front, then generating 4 variants:

- **v1-notebook**: notebook paper texture, handwritten-feel type treatment
- **v2-pro**: cream/acid green/deep palette, developer-professional aesthetic
- **v2-studio**: dark theme, high-contrast studio look
- **v3-labos**: asymmetric layout, dense information density

`v2-pro` got an activity heatmap built in — 1 year of commits, posts, and build logs rendered as real data, not placeholder content.

> Building a skill while immediately applying it is the fastest path to a useful skill. Abstract skills that never get tested stay abstract.

The practical lesson here isn't that leaked prompts are interesting (they are), but that the design patterns in them — mandatory context collection, enforced variation, explicit output constraints — are worth extracting and applying without the hosted environment.

## What 279 Tool Calls Actually Look Like

| Tool | Count | Share |
|------|-------|-------|
| Bash | 95 | 34% |
| Edit | 42 | 15% |
| Read | 26 | 9% |
| TaskUpdate | 26 | 9% |
| WebSearch | 18 | 6% |
| Write | 15 | 5% |
| Agent | 12 | 4% |
| Other | 45 | 16% |

Bash at 34% reflects the `auto-publish` structure: git pushes, DEV.to API calls, and file verification all run through shell. It's not heavy computation — it's orchestration. The model is calling shell commands the way you'd call them manually, just without stopping to wait for human confirmation at each step.

Agent at 12 calls — every one of those was parallel content generation. When tasks are structurally independent (different post drafts, different file targets), splitting them across subagents keeps the main context window lean and increases throughput. The main thread handles coordination; subagents handle volume. The main session's context stays clean enough to reason about what's already been done.

Files created across 4 sessions: 13. Files modified: 5. The Claude Design session alone produced 11 files — 4 HTML variants, 3 skill files, 1 design guide, 1 API route (`/api/now.ts`), and miscellaneous config.

The 279 total isn't a sign of inefficiency — it's a sign of a pipeline that's doing real work. Research, deduplication, file generation, API calls, error handling. The per-session average is ~70 tool calls, which tracks against the complexity of what each session was doing.

## What Actually Shipped

Two skills moved from concept to active production use this week.

`claude-design-lite` was built and immediately applied to an actual site redesign. The forced 10-question context phase surfaced assumptions that would have stayed implicit — who the primary user is, what the first action should be, which design references to avoid. The 4 variants that came out were genuinely differentiated, not color-swap iterations of the same layout.

`auto-publish` ran its first clean staggered deploy: 3 posts, 3 different publish dates, queued from a single session. The distribution strategy is now codified into the workflow rather than requiring a judgment call each time.

The Telegram→model→DEV.to loop closing end-to-end is the larger milestone. The pipeline now handles research, duplicate checking, content generation, formatting, and API publishing without a human context-switching in between. Fewer interruptions, faster time from idea to published post.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
