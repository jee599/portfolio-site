---
title: "454 Tool Calls, 5 Parallel Agents: Rebuilding a Dental Blog Image Pipeline with Claude Code"
project: "portfolio-site"
date: 2026-04-14
lang: en
pair: "2026-04-14-portfolio-site-ko"
tags: [claude-code, agent-parallel, image-pipeline, uddental, saju-global, seo]
description: "3 sessions, 454 tool calls, 5 parallel quality evaluators. Here's what it actually looks like to iterate an AI image pipeline until it's good."
---

"Worst output ever. Where did all the skill improvements go?"

That one message turned session 2 upside down. I spun up 5 agents in parallel to audit the entire blog, scrapped the current approach, and rebuilt the pipeline from scratch. This is the record of 3 sessions and 454 tool calls.

**TL;DR**: Improving an image pipeline is 80% defining the standard, 20% writing code. If you don't give the agent a clear picture of what "good" looks like, you can run the pipeline ten times and get the same broken output.

## The Cron Had Been Dead for Two Weeks

Session 1 was short. I was chasing an email delivery failure in `~/spoonai`. The last archive timestamp was 2026-03-30. Today is April 13. The scheduler had been silently dead for over two weeks.

The cause was embarrassingly simple: when I registered the job with `CronCreate`, I left out the `durable: true` option. When the session ends, the cron dies with it. `crontab -l` was empty. No launchd plist either. Once I confirmed re-registering as a Cowork task would fix it, the session ended.

A Telegram connection issue surfaced in the same session. "Why doesn't Claude answer when I message on Telegram?" The current session wasn't connected to the channel — you have to run `/telegram:configure` to register the bot token per session. The whole session: 11 tool calls — Bash ×8, Read ×2, Agent ×1.

## "Worst Output Ever" — Starting with 5 Parallel Agents

Session 2 was the main event: overhauling the uddental dental blog image pipeline. 261 tool calls over 25 hours.

Opening prompt:

```
continue uddental blog improvements
```

Three unresolved items were in memory: fundamental image quality improvement, classifying 16 real clinic photos, full blog content upgrade. Three posts existed — 001, 002, 003 — and post 002 (cavity treatment) was the strongest in image-text balance and professionalism signals.

First step: classify the 16 photos. Claude looked at each one directly:

| File | Category |
|------|---------|
| 37-001~003 | Exterior (building front, signage) |
| 45-001~004 | Hallway / CT room |
| 46-001~009 | Treatment rooms, waiting area |
| 47-001~014 | Reception desk, individual treatment rooms |

`manifest.json` had three misclassifications: 46-009 (treatment room → waiting area), 45-004 (hallway → CT room), and 47-011 was missing entirely. Fixed all three, added CT room, waiting area, and reception as new categories.

With classification done, I dispatched 3 agents in parallel via the AgentCrow pattern:

```
Dispatching 3 agents:
@skill-updater  → reflect 7 photo categories in SKILL.md
@blog-enhancer  → upgrade 001 implant post for expertise signals
@blog-reader    → analyze 002/003 structure to extract quality baseline
```

## The Output Landed. "Worst Ever."

The pipeline generated 24 images. The feedback was immediate.

> "Worst output ever. Where did all the skill improvements go?"

I pulled up `naver-dental-blog` SKILL.md and handed it directly to the agent. The standards were in there: 5 S-tier benchmark clinics, 22–25 `IMAGE` tags, 30%+ dark-background cards, 5,000–6,000 character body text.

Re-read the skill, rewrote post 001 to spec. This time the agent printed a validation table:

| Metric | Target | Actual | Pass |
|--------|--------|--------|------|
| Body text | 5,000–6,000 chars | 6,016 chars | ✓ |
| IMAGE tags | 22–25 | 24 | ✓ |
| H2 headings | 7–8 | 8 | ✓ |
| FAQ items | 5+ | 7 | ✓ |

Numbers checked out. The problem: no images had actually been generated. Pipeline rerun needed.

## Iterating the Images — Logo, Background, Korean Text, Layout

Image quality tuning consumed roughly half of session 2. The loop: share a screenshot, identify the problem, patch `pipeline.py`, rerun, repeat.

**Logo size**: First pass was too large. "Should be half to a third of the current size." Shrank it. After rerun: "Make it 2x bigger." Logo size alone took 3 full iterations.

**Background color**: Warm beige (`#f5f0eb`) → light blue (`#f0f4ff`) → pure white (`#ffffff`). Every color decision meant another pipeline run. Three agent invocations burned just on background color.

**Korean text is not optional**: A screenshot showed images with English labels only. "No English — Korean is mandatory." Added hard Korean-label enforcement to the Gemini prompt in `pipeline.py`.

**Image splitting**: "When showing a multi-step process, you're cramming too much into one image." The implant 6-step sequence was grouped into 3 cards (2 steps each). Split to 1 step = 1 image. More total images, lower information density per card — much easier to scan.

Pipeline failures (`exit code 2`) happened more than 8 times in session 2 alone. Each time: read the error log, move to the next attempt immediately.

## 5 Parallel Agents to Audit the Whole Blog

"The overall tone isn't consistent." Text tone, visual design, SEO, image quality, ad effectiveness — five evaluation axes needed simultaneously.

Dispatched 5 agents in parallel:

```
Agent "Blog Tone/Style Audit"    → consistency 8/10, 6 AI clichés flagged
Agent "Blog Visual Design Audit" → color consistency 6/10
Agent "Blog Content/SEO Audit"   → keyword density, structural hierarchy
Agent "Blog Image Quality Audit" → overall 8.2/10
Agent "Blog Ad Effectiveness"    → CTA effectiveness 8/10
```

All five ran simultaneously and returned individual reports. Color consistency at 6/10 was the weakest score — each card had a different background. Batch-updated `body background` across all 7 template files and hardcoded the color palette in `pipeline.py`.

## SKILL.md Evolves Alongside the Code

Every time I edited `pipeline.py`, I updated `SKILL.md` in the same pass. Session 2 alone saw 12 edits to the skill file.

The reason is straightforward. If you only fix `pipeline.py`, the next session's agent reads `SKILL.md`, sees "no captions," and silently rolls back the change. `SKILL.md` is the source of truth.

```
patch pipeline.py → sync SKILL.md → consistency survives the next session
```

The prompt that drove this loop: "reflect the changes in the skill." One line kept the pipeline stable across sessions.

## 288 SEO Landing Pages, Generated by Script

Session 3 shifted to `saju_global` — auto-generating 288 zodiac compatibility SEO landing pages.

```
implement SEO compatibility landing pages (288 pages) in saju_global
spec: docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md
```

Used the `writing-plans` skill to draft an implementation plan first: read the spec, map existing codebase patterns, organize tasks by file, save the plan.

You can't hand-write 288 pages. Built `generate-compat-content.ts` as a background script. It generates per-combination content into `zodiac-compat-content.json` and spreads page routes automatically. Each combination gets its own URL targeting a long-tail keyword — "Aries + Libra compatibility" and 287 similar queries. 288× more search surface area from a single script.

Dispatched per-task agents via the `subagent-driven-development` skill, with a separate git worktree to keep main untouched throughout.

Session 3 breakdown: Bash ×111, Read ×20, Agent ×17, TaskUpdate ×14.

## 454 Tool Calls Across 3 Sessions

| Session | Date | Duration | Tool Calls | Main Task |
|---------|------|----------|------------|-----------|
| 1 | Apr 13 | 13h 43min | 11 | spoonai cron recovery, Telegram setup |
| 2 | Apr 6 | 25h 5min | 261 | Dental blog image pipeline overhaul |
| 3 | Apr 9 | 105h 43min | 182 | 288 SEO compatibility pages |

By tool, across all sessions:

- `Bash` ×174 — pipeline execution, log inspection, background processes
- `Read` ×138 — SKILL.md, templates, existing code review
- `Agent` ×41 — parallel evaluation, implementation, skill updates
- `Edit` ×35 — `pipeline.py`, HTML templates, SKILL.md

## Iteration Is How Standards Get Built

The image adjustment cycle looks like thrashing from the outside. But each pass sharpens the standard. You find out how much smaller the logo needs to be. You learn why warm beige looks wrong against clinic photography. Those judgments accumulate and become explicit rules in `SKILL.md`.

The next session starts with: "logo at 15% of card width, pure white background (`#ffffff`), Korean labels mandatory." That's the real output of a 25-hour session — not the images, but the standard that produces good images reliably from now on.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
