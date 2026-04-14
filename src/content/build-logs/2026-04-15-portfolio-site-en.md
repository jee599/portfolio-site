---
title: "25 Hours, 261 Tool Calls: Building a Dental Blog Image Pipeline with Claude Code + AgentCrow"
project: "portfolio-site"
date: 2026-04-15
lang: en
pair: "2026-04-15-portfolio-site-ko"
tags: [claude-code, agents, image-pipeline, gemini, automation]
description: "How I built a 24-image auto-generation pipeline for a dental blog using Claude Code, AgentCrow multi-agent dispatch, and Gemini API — including 3 logo resizes, 4 background color swaps, and 5 Korean rendering fixes."
---

25 hours. 261 tool calls. One session with `claude-opus-4-6`. The goal was a single pipeline that could automatically generate 24 images for a dental Naver blog. The result: `pipeline.py` + Gemini API + 7 HTML templates.

**TL;DR**: Building an image generation pipeline is less about writing code and more about defining quality standards. I parallelized the evaluate-revise-regenerate loop using the AgentCrow pattern, and it was the key to reducing iteration count.

## "The Output Is Terrible — What Happened to the Skill Upgrade?"

The feedback was immediate when the first image set came out. The `naver-dental-blog` skill had been updated, but the pipeline hadn't picked up the new standards.

Once I identified the problem, I dispatched 3 agents in parallel:

```
🐦 AgentCrow — dispatching 3 agents:
1. @skill-updater → reflect 7 photo categories in SKILL.md + correct 16 photos
2. @blog-enhancer → upgrade expertise level in blog post 001 (implant)
3. @blog-reader → analyze structure of posts 002/003 (quality baseline)
```

AgentCrow is a dispatch pattern using role-specific agents defined in `.claude/agents/`, governed by rules in `CLAUDE.md`. Instead of reading and modifying files directly in the main context, each agent completes its scoped work and returns only a result summary. The `Agent` tool was called 23 times this session.

## 3 Logo Resizes, 4 Background Colors, 5 Korean Rendering Fixes

Once the pipeline was running, it became a quality feedback loop.

**Logo sizing — 3 rounds**

First pass: too big → "shrink it to half or a third." Regenerated: too small → "double the current size." We compared directly using screenshots. Final result: 3 rounds of tuning logo compositing parameters in `pipeline.py`.

**Background color — 4 rounds**

`#ffffff` → warm beige `#f5f0eb` → soft sky `#f0f4ff` → back to `#ffffff`. Every color change meant the agent had to update all 7 HTML templates and rerun the pipeline. We ended up where we started. Without a defined visual direction upfront, iteration count multiplies.

**Korean text rendering**

> "Every image must have Korean text."

> "No English — this is non-negotiable."

Gemini kept mixing English labels into the generated images. I added explicit Korean-only prompt instructions to `build_gemini_prompt()` and added a Korean rendering validation step as a hard rule in `SKILL.md`. If it's not in the skill, it won't carry forward to the next session.

## Pipeline Failures Were Hiding as Background Tasks

Midway through the session, pipeline reruns kept returning `exit code 2`:

```
Background command "clear cache + rerun pipeline" failed (exit code 2)
Background command "rerun pipeline (Korean label switch)" failed (exit code 2)
Background command "clear cache + rerun pipeline (split images)" failed (exit code 2)
```

These were `nohup npx tsx` scripts running in Bash background. The errors surfaced as `task-notification` messages — errors that would've been immediately visible as foreground output. Lesson reconfirmed: background tasks need an explicit failure-detection and log-inspection step.

## "Can We Split One Process Image Into Two Slides?"

When the split-image requirement came in, the scope became concrete:

```
// Before: 6-step process grouped 2 steps per image → 3 images
prosthetics-3-methods-comparison.png   // bridge/denture/implant on one card
implant-6-steps.png                    // all 6 steps on one card

// After: 1 step = 1 image
prosthetics-bridge.png
prosthetics-denture.png
prosthetics-implant.png
implant-step-1.png ~ implant-step-6.png
```

I split the IMAGE tags in `post.html` and added the rule "one image per step for process flows" to `SKILL.md`. Embedding the rule in the skill means the next post starts correctly from the beginning — no re-explaining needed.

## Classifying 16 Clinic Photos: Agent Generates `manifest.json` Directly

16 KakaoTalk photos in `~/uddental/clinics/uddental/photos/` needed category classification before they could be used in blog posts. File names like `37-001.jpg` and `45-004.jpg` tell you nothing — you have to look.

The agent inspected all 16 and generated a `manifest.json`:

```json
{
  "37-001": { "category": "exterior", "desc": "building front, wide angle" },
  "45-004": { "category": "ct-room", "desc": "CT/panorama equipment close-up" },
  "46-009": { "category": "waiting-room", "desc": "sofa + TV waiting area" }
}
```

Initial classification had 3 errors. `46-009` was labeled as an exam room — it was the waiting room. `45-004` was labeled as a hallway — it was the CT room. Even when an agent looks directly at images, a verification pass is required.

## 3 Projects, 454 Tool Calls

Stats across 3 sessions this period:

| Session | Project | Duration | Tool Calls |
|---------|---------|---------|-----------|
| 1 | spoonai | 13h 43min | 11 |
| 2 | uddental | 25h 5min | 261 |
| 3 | saju_global | 105h 43min | 182 |

By tool type: Bash 174, Read 138, Agent 41, Edit 35, Grep 20.

In session 1 (spoonai), I discovered the Cowork schedule had been dead for 2 weeks. `crontab -l` was empty. No launchd plist. A cron registered without `durable: true` evaporated when the session expired. Always verify durability settings for automated schedules.

In session 3 (saju_global), I implemented 288 SEO landing pages for compatibility (궁합) horoscopes. Used `superpowers:writing-plans` to write a spec-driven plan, then `subagent-driven-development` to execute it. When a spec document exists, the plan → subagent dispatch pattern is the most efficient path.

## Treat Skills Like a Codebase

`SKILL.md` was modified 12+ times this session. Every time I changed the pipeline, I updated the skill to match.

> Reflect what you just changed in the skill.

This is the core discipline. If `pipeline.py` changes but `SKILL.md` still points to old rules, the agent in the next session works from the outdated baseline. Code and skills have to stay in sync.

Managing skills like Git reduces tool call count. You stop spending the first part of every session reconstructing context that should already be codified.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
