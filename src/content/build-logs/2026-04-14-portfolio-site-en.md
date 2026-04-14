---
title: "261 Tool Calls to Ship a Dental Blog Image Pipeline (AgentCrow in Practice)"
project: "portfolio-site"
date: 2026-04-14
lang: en
pair: "2026-04-14-portfolio-site-ko"
tags: [claude-code, agentcrow, automation, subagent, dental-blog, multi-agent]
description: "3 sessions, 454 tool calls across 3 projects: 24 dental images automated, 288 SEO pages generated, and a 2-week broken cron fixed. The AgentCrow pattern, skill-code sync, and screenshot feedback in practice."
---

261 tool calls in a single session. 25 hours of wall-clock time. One goal: automate 24 dental blog images that didn't embarrass anyone.

This is the build log for three sessions spanning 2026-04-06 to 2026-04-14. Three projects running in parallel, one Claude Code setup orchestrating all of it.

**TL;DR** — Parallelized a dental image generation pipeline with AgentCrow, iterated via "modify skill → re-run → screenshot feedback" loops. Learned the hard way that if your skill docs drift from the actual implementation, you restart from zero every session.

## "This Is Terrible" — That Was the Starting Point

Session 2 opened with this feedback:

> "This is terrible. Where did all the improvements from last session go?"

The previous session had upgraded the pipeline logic, but only updated `SKILL.md` — not `pipeline.py`. The skill document and the actual implementation had diverged. This set the tone for everything that followed: modify → re-run → screenshot → modify again. That loop ran dozens of times.

The lesson was obvious in hindsight. Documentation that doesn't match the code isn't documentation — it's technical debt disguised as notes.

## AgentCrow: Dispatching 3 Agents at Once

The work split cleanly into three independent workstreams: skill update, content writing, and structural analysis. Parallel dispatch via AgentCrow:

```
🐦 AgentCrow — dispatching 3 agents:
1. @skill-updater  → reflect 7 photo categories in SKILL.md
2. @blog-enhancer  → upgrade blog post 001 (implant) to production quality
3. @blog-reader    → analyze 002/003 structure as reference baseline
```

Post 002 (cavity treatment) was designated the S-tier benchmark — strong image-text balance, psychological hooks, professional signals. Post 001 (implants) had the opposite problem: text-heavy, only 8 images, no hook, zero real photography. The `@blog-reader` agent produced a clear gap analysis; the `@blog-enhancer` used that analysis to rebuild 001 with 24 images.

The pattern that works: agents with non-overlapping scopes, no cross-dependencies between outputs, clear deliverables. When those conditions hold, parallel dispatch earns its keep.

## Screenshots Are Prompts

The most efficient feedback mechanism in this session wasn't text — it was screenshots.

> "[Image #28] This is way too big."

Logo was oversized. Attaching a screenshot was faster and more precise than describing it. When you can see the actual pixel ratio, you know whether to scale by 50% or 80%. Another example:

> "[Image #29] Force Korean text on every image. And fix the background — current one looks off."

One line, two code changes: mandatory Korean label logic added to `pipeline.py`, background color changed from warm beige to pure white (`#ffffff`). A screenshot communicates visual context that paragraphs of description can't.

When iterating on generated images, treat the screenshot as the prompt. Words approximate; visuals specify.

## Five Consecutive Pipeline Failures

Background jobs exited with code 2 five times in a row. Each failure had a different root cause: Korean font path resolution, Gemini model version mismatch, cache invalidation conflict. The fix was `delete cache → re-run`, applied after every modification.

When the pipeline failed, the most efficient recovery was pasting the full error log directly. "The pipeline broke again" tells Claude nothing. The stack trace tells Claude everything.

## Background Color Changed 4 Times. Logo Size Changed 3 Times.

This is what iterative design looks like in practice:

1. Default white `#ffffff`
2. Warm beige `#f5f0eb` (for visual cohesion)
3. Soft sky blue `#f0f4ff` (trying something different)
4. Back to pure white `#ffffff` (final)

Logo sizing went through the same cycle. Too large → "half the current size" → too small → "double the current size" → done. Every change went into `SKILL.md` immediately. If the skill doesn't reflect the current state of the code, the next session inherits all the same decisions without any of the context.

## One Step, One Image

Six-step implant procedure, initially laid out as three images with two steps each. Feedback:

> "Too much information per image. Split each step into its own card."

Result: 3 images → 6 images. Information density per image dropped by half. The sequence reads naturally as the user scrolls — each image advances the story by exactly one step.

This rule is now in `SKILL.md`: "Process images: 1 step = 1 image." When feedback produces a rule, write it down immediately. Otherwise you get the same feedback next session.

## 5 Parallel Agents for Quality Review

"The tone feels inconsistent" is a multi-dimensional problem. Fixing it requires looking at writing, design, SEO, image quality, and conversion effectiveness simultaneously. Dispatched 5 agents in parallel:

```
Agent "tone/writing audit"    → ending consistency 8/10, 6 AI clichés flagged
Agent "visual design audit"   → color consistency 6/10
Agent "content/SEO audit"     → keyword density, structure analysis
Agent "image quality audit"   → overall 8.2/10
Agent "conversion audit"      → CTA effectiveness 8/10
```

Color consistency at 6/10 was the weakest signal. Background colors varied across cards. Fix: unified `body background` across 7 template files, hardcoded color palette in `pipeline.py`. The pattern — parallel evaluation → prioritize → parallel fix — works well when a single piece of feedback requires changes across multiple files.

## Session 3: 288 Pages from One Script

`saju_global` project. The prompt:

> "Implement 288 SEO compatibility landing pages per the spec at docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md"

Used the Writing Plans skill to draft the implementation plan first, then Subagent-Driven Development skill to execute. You can't handcraft 288 pages — a single `generate-compat-content.ts` script generates all of them. Ran it in the background and monitored via logs.

Used git worktrees to isolate the work from `main`. Of the 182 tool calls in this session, 111 were Bash — mostly repeated script executions and log checks.

## Session 1: A Cron That Died 2 Weeks Ago

`spoonai` project. Last successful email dispatch: 2026-03-28. Two weeks of silence. Root cause: the CronCreate session cron had expired — registered without `durable: true`. `crontab -l` was empty. No launchd plist either.

The fix was straightforward. The delay was not. Two weeks is a long time to go without noticing a broken delivery pipeline. The lesson: always set `durable: true` when registering scheduled tasks. Anything running on a scheduler needs active monitoring, not just hope.

## Session Stats

| Session | Date | Duration | Tool Calls |
|---------|------|----------|------------|
| spoonai cron debug | 04-13 | 13h 43min | 11 |
| uddental image pipeline | 04-06 | 25h 5min | 261 |
| saju SEO 288 pages | 04-09 | 105h 43min | 182 |

Tool breakdown: Bash (174), Read (138), Agent (41), Edit (35), Grep (20). Total: 454.

The 138 Read calls in Session 2 stand out. Agents re-reading the same files repeatedly is a cost that adds up. The fix: narrow agent scopes, pass only the files each agent actually needs. Fewer reads, faster iteration.

## What Carries Over

Three patterns proved their worth across all three sessions:

**Skill-code sync is non-negotiable.** Every time a design decision changes, update the skill file before the session ends. A skill that diverges from the code is worse than no skill at all — it confidently gives you the wrong starting point.

**Screenshots beat descriptions.** When working with generated visuals, screenshot feedback is more precise, faster to produce, and harder to misinterpret. The image is the spec.

**Parallel evaluation before parallel fixing.** When feedback is multi-dimensional, dispatching specialized agents to audit different aspects simultaneously — then prioritizing fixes — compresses the review-fix cycle significantly.

The full source for the dental blog image pipeline is in the `uddental` project. The SEO page generator lives in `saju_global`. Both are wired to the same AgentCrow dispatch pattern.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
