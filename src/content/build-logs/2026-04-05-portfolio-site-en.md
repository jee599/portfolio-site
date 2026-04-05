---
title: "32 Parallel Agents, 3 Blog Posts, 18 3D Images: Claude Code at Full Throttle"
project: "portfolio-site"
date: 2026-04-05
lang: en
pair: "2026-04-05-portfolio-site-ko"
tags: [claude-code, multi-agent, dental-blog, gemini, image-generation]
description: "227 tool calls, 32 agent invocations, 3 dental blog posts, 18 Gemini-generated 3D illustrations — one Claude Code session, fully automated."
---

227 tool calls. 32 agent invocations. The output: 3 dental blog posts, 18 3D illustrations, and mobile fixes across 11 files — all from a single Claude Code session.

**TL;DR** I built a content pipeline for the uddental project using Claude Code parallel agents. Not just writing — the whole thing: SEO validation, medical advertising compliance checks, and design scoring, all running in parallel.

## Starting Where It Hurts: Mobile

The session opened with a single prompt:

```
Check everything on mobile and make sure it works
```

The site is Next.js 15 + Tailwind. Looked simple. Wasn't. Reading through the code surfaced 24 mobile issues. `layout.tsx` was importing a `FloatingSchedule` component that didn't exist — a build-breaking import with no runtime warning, just a silent failure waiting to happen. Individual pages were hardcoded with desktop-only values: `gap-12`, `px-10`, no responsive breakpoints anywhere.

11 files fixed in one pass. `doctors/page.tsx` had a subtle browser compatibility bug: hex opacity shorthand like `${doc.accent}0a` that some browsers don't parse correctly. Converted to `rgba()` and moved on.

What made the fix efficient wasn't just the edits — it was the sequence. Claude read the full codebase first, produced a complete issue list, then started fixing. The tool call ratio tells the story: Read 63, Edit 34. More reads than writes. That's the right ratio for surgical fixes.

## What "S-Tier" Means for Korean Dental SEO

After mobile, the real work started:

```
Let's write blog posts. Check the skill and the reference docs I've collected.
```

The `naver-dental-blog` skill defines the target format. I pulled up the S-tier reference analysis and settled on three topics:

- **001**: Dental implants with bone grafting
- **002**: Bleeding gums and periodontal disease
- **003**: First pediatric dentistry visit

Each post spec: 5,000–6,000 characters, 7–8 H2 sections, 22–25 IMAGE tags, formal Korean register, Korean Medical Advertising Act compliant.

Three agents, three posts, running in parallel. Each agent owned one post end-to-end. Results came in via task notifications as they completed.

Cross-validation ran immediately after — also parallel. Three agents scoring from three angles simultaneously:

- SEO/algorithm compliance
- Medical advertising law
- S-tier design criteria

First round: posts 002 and 003 had insufficient IMAGE tags and keyword density below target. Fix cycle → re-validate. Repeated 3 times until all scores cleared the bar. Single-agent sequential review would have taken three times as long and missed the cross-domain blind spots.

## When the Skill Doesn't Work, Fix the Skill

Mid-session, the validation agents kept returning incomplete scores:

```
Did you update the skill in the last session? Why isn't the evaluation coming through?
```

The root cause was simple: `naver-dental-blog/SKILL.md` had no scoring criteria. Agents follow what's in the skill file. No criteria, no scores.

Added 7 sections to the skill: S-tier benchmark enforcement rules, medical law compliance checklist, keyword density thresholds, IMAGE tag minimums, and content quality rubrics. Updated `dental-blog-image-pipeline/SKILL.md` at the same time.

This is the loop worth building: use the skill → find the gap → improve the skill → re-run. The skill gets sharper every session. One-time debugging that pays forward.

Post-upgrade scores on the 18-point checklist:
- **001**: 17/18
- **002**: 16/18
- **003**: 18/18

## 18 3D Illustrations via Gemini

Text alone wasn't enough. Added image generation to the pipeline:

```
Generate actual 3D illustrations using Gemini. Use 3 agents and compare.
```

Model: `gemini-2.0-flash-image`. 6 images per post, 18 total. Three agents generating in parallel. No retries needed — all 18 succeeded on the first attempt.

`dental-blog-image-pipeline/scripts/pipeline.py` parses IMAGE tags from each post, calls the Gemini API with the alt text as the prompt, and saves the output. Success condition: file size ≥ 5KB. Simple heuristic, zero false positives in this run.

Final quality score: **9.0/10**. Agent comment: "Top 10% for local dental clinic blogs in the Yongin/Dongbaek area."

## What This Session Actually Proved

Parallel agents only pay off when tasks are truly independent. Three blog posts worked because each post had zero shared state — no shared files, no shared data, no coordination needed. Cross-validation worked because SEO, medical law, and design are genuinely orthogonal dimensions. When file scopes overlap, agent boundaries must be explicit upfront, or you get conflicts that cost more time to resolve than the parallelism saved.

Tool call breakdown for the session: Read 63, Edit 34, Agent 32, Bash 31, TaskUpdate 24.

Read is the highest count. That's not a coincidence. You can't write accurate fixes — or accurate content — without reading enough context first. The numbers confirm what good engineering practice already says.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
