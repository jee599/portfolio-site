---
title: "One Screenshot Beats 100 Lines of Prompts: Dental Image Pipeline with Claude Code"
project: "portfolio-site"
date: 2026-04-14
lang: en
pair: "2026-04-14-portfolio-site-ko"
tags: [claude-code, multi-agent, image-pipeline, subagent, automation]
description: "3 sessions, 454 tool calls: screenshot feedback loops and parallel agents to upgrade a dental blog image pipeline and auto-generate 288 SEO pages."
---

3 sessions. 454 total tool calls. More than half of them were pipeline re-executions.

**TL;DR** Attaching a screenshot to your feedback is faster than writing 100 lines of description. I ran this pattern repeatedly while building a dental blog image pipeline with Claude Code — and validated the same multi-agent approach while auto-generating 288 SEO landing pages in a separate project.

## The Numbers First

| Session | Date | Duration | Tool Calls | Main Task |
|---------|------|----------|------------|-----------|
| 1 | Apr 13 | 13h 43min | 11 | spoonai cron recovery, Telegram setup |
| 2 | Apr 6 | 25h 5min | 261 | Dental blog image pipeline upgrade |
| 3 | Apr 9 | 105h 43min | 182 | Auto-generate 288 SEO compatibility pages |

Session 2 was the interesting one. 261 tool calls over 25 hours — the entire session revolved around iterating on `pipeline.py`, a script that generates 24 images for a dental blog.

## Why Screenshots Replace Text Descriptions

Early in session 2, I was giving feedback in text:

> "Add 3–4 lines of caption below each image, match the font to the overall tone, and put the logo centered at the very bottom of all images."

The agent modified `pipeline.py` and regenerated the images. Result: half right.

Next turn, I switched approaches. I attached a screenshot of the output.

> [screenshot attached] "Logo is 2x too big. Way too much."

That single sentence with a screenshot was more precise than three paragraphs of text. The agent pinpointed the logo sizing code in `pipeline.py` immediately — no back-and-forth about what "too big" means. The image showed it.

The loop that ran for the rest of the session:

```
attach screenshot → give feedback → agent modifies code → re-run pipeline.py → check screenshot
```

The pipeline failed (`exit code 2`) eight or more times in session 2 alone. Each time, the agent read the error log and moved to the next attempt without getting stuck in debugging rabbit holes. Fast iteration beat careful debugging.

This pattern is especially powerful when the output is visual. Text descriptions introduce ambiguity. Screenshots remove it.

## 5-Agent Parallel Evaluation

Midway through session 2, I got feedback that "the overall tone isn't unified." Five different dimensions needed evaluation simultaneously: text tone, design consistency, SEO structure, image quality, ad effectiveness.

Instead of asking one agent to evaluate all five, I dispatched five agents in parallel via the AgentCrow pattern:

- `@blog-evaluator-tone` → sentence-ending consistency, professional signal strength
- `@blog-evaluator-design` → color consistency, spacing, font uniformity
- `@blog-evaluator-content` → SEO keyword density, structural hierarchy
- `@blog-evaluator-image` → image quality across all 24 images, Korean text rendering issues
- `@blog-evaluator-ad` → CTA effectiveness, conversion signals

Each agent returned a scored report. Color consistency: 6/10. Image quality: 8.2/10. Concrete numbers, not vague impressions.

The fix priorities became obvious:

1. Background: warm beige (`#f5f0eb`) → pure white (`#ffffff`) — the beige was inconsistent across images
2. Model upgrade: switch to `gemini-3.1-flash` + add quality-focused prompts
3. Image structure: split step sequences to 1 image per step (previously: 3 steps crammed into 1 image)
4. Korean labels: mandatory on all images, no exceptions

Parallel evaluation surfaced issues that sequential review would miss. You don't notice color inconsistency when you're focused on evaluating text tone. Five agents looking simultaneously catch cross-cutting problems.

## SKILL.md Is the Source of Truth

Every time `pipeline.py` changed, `SKILL.md` got updated in the same pass. Session 2 alone had 12 edits to `SKILL.md`.

The reason is simple: agents read `SKILL.md` at the start of each session. If `pipeline.py` says "add captions" but `SKILL.md` still says "no captions," the next session's agent follows `SKILL.md` and reverts the change.

```
modify pipeline.py → sync SKILL.md → maintain consistency across sessions
```

The prompt that drove this: "reflect the changes in the skill." The agent traced back through code changes and updated the relevant sections of `SKILL.md`. Minor overhead that prevents a major consistency problem.

If you're using skill files to guide agents across sessions, treat synchronization as non-negotiable. Code and skill file must stay in sync.

## 288 SEO Pages with Subagent-Driven Development

Session 3 shifted to the `saju_global` project: auto-generating 288 SEO compatibility landing pages.

The spec lived in one file: `docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md`

The flow:

1. `writing-plans` skill → generate implementation plan → save to `docs/superpowers/plans/2026-04-10-seo-compatibility-pages.md`
2. `subagent-driven-development` skill → dispatch independent agents per task
3. After each task: spec compliance review → code quality review (two-stage validation)

Running the content generation script directly (`npx tsx scripts/generate-compat-content.ts`) was an option, but parallel agents processed tasks faster. The content generation script ran in the background while other tasks proceeded. Session 3: 182 tool calls, with Bash at 111 — background process execution, log monitoring, git worktree management.

288 pages from a single spec file. The planning step was the key: breaking the spec into independent tasks that agents could own without blocking each other.

## Tool Usage Breakdown

Across all 3 sessions:

| Tool | Count | Primary Use |
|------|-------|-------------|
| Bash | 174 | Pipeline execution, log checking |
| Read | 138 | `SKILL.md`, templates, existing code review |
| Agent | 41 | Parallel evaluation, implementation, skill updates |
| Edit | 35 | `pipeline.py`, HTML templates, `SKILL.md` |

Read at 138 is high. That's agents checking `SKILL.md` before every significant change — reading the spec before writing the code. It works because the reading prevents incorrect assumptions.

Agent at 41 spans both evaluation agents (5 dispatched simultaneously during the tone evaluation pass) and implementation agents (subagent-driven development for the 288 SEO pages).

## What This Teaches About AI-Assisted Development

**Screenshot feedback is underused.** For visual work — image generation, UI components, layout — a screenshot pinpoints the problem faster than any text description. The agent doesn't have to interpret what you mean by "too big." It can see it.

**Skill files need to be synchronized.** If your agent system uses skill files to maintain context across sessions, treat synchronization as non-negotiable. Inconsistency between code and skill files causes agents to revert changes silently. One prompt at the end of each change — "update the skill to reflect this" — keeps everything aligned.

**Pipeline failures are expected.** `exit code 2` appeared 8 times in session 2. The right response is to read the error and try again — not stop to debug. Fast iteration over cautious debugging when you're running an iterative pipeline.

**Parallel agents expose what sequential review misses.** Five agents evaluating five dimensions simultaneously catch issues that single-threaded review overlooks. Cross-cutting problems — a design inconsistency invisible when you're focused on copy quality — surface naturally when multiple perspectives run at once.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
