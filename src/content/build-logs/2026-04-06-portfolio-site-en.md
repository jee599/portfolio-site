---
title: "670 Tool Calls, 48 Hours: Building an S-Grade Dental Blog Image Pipeline in 4 Rounds"
project: "portfolio-site"
date: 2026-04-06
lang: en
pair: "2026-04-06-portfolio-site-ko"
tags: [claude-code, multi-agent, gemini, image-pipeline, skill, naver-seo]
description: "How I built a pipeline generating 25 dental blog images at S-grade quality: 670 tool calls, 3 parallel cross-validation agents, Gemini Pro/Flash routing, and 4 iterative rounds."
---

48 hours, 30 minutes. 670 tool calls. A new personal record for a single session.

The goal was specific: build a pipeline that auto-generates 25 images per dental blog post at what Naver SEO practitioners call "S-grade" quality. Not just working — indistinguishable from human-produced content.

**TL;DR**: Deployed 3 parallel subagents for cross-validation per round, routed Gemini Pro vs Flash by image type, and iterated through 4 rounds before hitting an average AI-detectability score of 9/10. The key insight: skill files have to evolve in real time, or the pipeline regresses.

## The One-Word Prompt That Started a 38-Minute Session

Session 1 began with a single word.

```
spoonai
```

Claude pulled two related projects from memory and asked for clarification. The follow-up came fast:

```
Check if there's room for design improvements,
fix the translation feature to work perfectly,
apply both strategy and technical SEO for Google and AI search
```

Three domains in one message: design, i18n, and SEO. Rather than context-switching, Claude dispatched 3 Explore agents in parallel to map the current state. When the results came back, a critical bug surfaced immediately.

`lib/content.ts:133` — `getPostSlugs()` was filtering with `!f.includes("-en")`, which silently dropped every English file. `getAllPosts("en")` was returning an empty array, so every `/posts/..-en` URL was returning 404. The translation "not working" wasn't a UI problem at all — it was a content loader bug.

38 minutes. 133 tool calls. Edit ×63, Bash ×37, Read ×27. 22 files modified.

## 670 Tool Calls: Building the Dental Image Pipeline

Session 2 was the main event.

The objective: an automated image generation pipeline for 3 Naver S-grade dental blog posts — implant bone grafting, gum disease, and pediatric dentistry. 25 images per post: 6 text cards, 6 3D medical illustrations, and photo-style composite cards.

### The Parallel Cross-Validation Pattern

Every quality pass ran in a separate context. This prompt appeared repeatedly across rounds:

```
Evaluate with a fresh context,
compare against S-grade reference examples,
have 3 agents cross-validate
```

Three agents per round, fixed roles:

- SEO/algorithm validation agent
- Medical accuracy + quality validation agent
- S-grade design/visual standards agent

Running 3 agents against the same output simultaneously keeps the main context clean. Results surfaced as score tables only: `001 implant: SEO 7/10, medical 9/10, visual 8/10`. That's all that needed to come back to the main thread.

### Gemini Pro / Flash Routing

The early rounds just used Gemini. Round 2 added a routing rule:

```
Use both Pro and Flash, route based on required image quality
```

The split was by image type. Medical illustrations (anatomy, alveolar bone cross-sections, implant placement sequences) → Gemini 2.0 Pro. Text cards (hero, FAQ, CTA, disclaimers) → Gemini 2.0 Flash. Pro produces better output but is slower and more expensive. Using it for flat card layouts wastes both.

This branching logic landed in `pipeline.py`'s `build_template_variables()` — file name patterns determine the image type, which determines the model.

### Round 1 → Round 4: Getting to 9/10

Round 1's biggest problem was the 3D CGI aesthetic. Blue glows, exaggerated specularity, robotic textures. Average AI-detectability score: 6–7/10.

Round 2 caught a `viewport` bug. The HTML template had `body height: 860px` fixed, but hero image capture was set to `clip height=1075`. Result: 215px of white background at the bottom of every hero image. Also fixed a logo double-render bug on text cards.

Round 3 switched the medical illustration style to Gray's Anatomy textbook style — simplified anatomical line art instead of 3D CGI. AI-detectability scores jumped to 8–9/10.

Round 4 was final tuning.

```
AI detectability needs to be 9+ across the board
```

Three agents independently scored the same 25 images. When scores converged, the batch passed. When they diverged, the lowest-scoring items got identified and revised. Final result: 25-image average AI-detectability score of 9.1/10.

### Skill Files as Living Documents

`naver-dental-blog/SKILL.md` and `dental-blog-image-pipeline/SKILL.md` were updated 7 times during this session. Every round, learnings went directly into the skill files.

```
Update skills with everything learned so far, then what's left? Keep going.
```

Deferring skill updates to "later" means starting from scratch in the next session. S-grade benchmarks discovered mid-session, failed prompt patterns, bug fixes — all of it needs to land in the skill file immediately. That's what makes the pipeline compound instead of reset.

Things added to `pipeline.py` across rounds:

- `parse_image_tags()` — parser for `<!-- IMAGE: -->` tags
- `build_template_variables()` — file-name-based Pro/Flash routing
- CTA card differentiation — file-name branching to prevent repeated CTA template reuse
- `viewport` fix → `overflow: hidden` applied globally across HTML templates

## Why Are There 3 Retry Rounds?

This came up mid-session:

```
Why does it run 3 times?
```

Three retry loops was an initial design mistake. The image generation API occasionally fails, so retry logic was necessary — but the code was hardwired to always run 3 times. Success or failure, it ran 3 rounds. Fixed: exit on first success, retry only on failure.

## Rollback: When the Previous Version Was Better

Near round 5, a full redesign pass ran on one card.

```
Image #9 — the version right before this was better. Roll it back.
```

There was no rollback path. The agents had been writing files directly. No git commits for intermediate states, no backup copies before the redesign. Once overwritten, the previous version was gone.

This was the most expensive mistake in the session. The pipeline needed either `.bak` backups before any overwrite, or round outputs saved to separate directories. Running a full redesign without a snapshot means no recovery option.

## 670 Tool Calls, Almost No Edit

Of the 670 tool calls, Edit was barely used. Bash to run Python scripts, Agent to dispatch subagents, Write to replace files wholesale. The majority of work was pipeline execution and validation — not code editing.

Scope assignment is the critical discipline when running multiple agents. "Score these 3 files independently" dispatches 3 agents that each read and evaluate the same files. No overlapping write scopes means parallel execution is safe. In this session, the validation agents were read-only throughout, so there were zero conflicts.

---

## Related Posts

- [Building a Dental Clinic Site in 8 Minutes with Claude Code Frontend](/posts/2026-03-16-uddental-en)
- [Hiring 10 Agents to Build a Mentoring Platform: 6 Sessions, 1,289 Tool Calls](/posts/2026-03-15-coffee-chat-en)
- [Blog Automation Pipeline: Turning 105 Session Logs into Build Logs with Claude Code](/posts/2026-03-15-portfolio-site-en)

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
