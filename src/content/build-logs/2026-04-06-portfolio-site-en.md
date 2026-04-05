---
title: "670 Tool Calls in 48 Hours: How I Built an AI-Undetectable Dental Image Pipeline"
project: "portfolio-site"
date: 2026-04-06
lang: en
pair: "2026-04-06-portfolio-site-ko"
tags: [claude-code, multi-agent, gemini, image-pipeline, naver-seo]
description: "Building a pipeline to auto-generate 25 dental blog images: 3 parallel validation agents, Gemini Pro/Flash routing by type, and 4 iteration rounds to reach AI-detectability score 9.1/10."
---

670 tool calls. 48 hours and 30 minutes. The longest single session I've ever run — and it wasn't debugging. It was building a pipeline that auto-generates 25 images per dental blog post, at a quality level where human reviewers can't tell the difference.

**TL;DR**: Three subagents doing parallel cross-validation every round. Gemini Pro for anatomy illustrations, Flash for text cards. Four rounds of iteration before the average AI-detectability score hit 9.1/10. The meta-lesson: skill files have to be living documents or the pipeline forgets what it learned between rounds.

## A Single Word Kicked Off 38 Minutes and 133 Tool Calls

Session 1 started with one word.

```
spoonai
```

Claude found two related projects in memory and asked what I wanted. Then the actual instruction arrived:

```
Check if there's room for design improvements,
fix the translation feature so it works properly,
apply both strategy and technical fixes for Google and AI search SEO
```

Three domains at once: design, i18n, SEO. Instead of handling them sequentially, Claude dispatched three Explore agents in parallel to map the current state. When results came back, a critical bug surfaced.

`getPostSlugs()` at `lib/content.ts:133` was filtering files with `!f.includes("-en")` — silently dropping every English post. `getAllPosts("en")` returned an empty array, which meant every `/posts/..-en` URL was a 404. The translation feature wasn't broken in the UI. The content loader was eating the data before the UI ever saw it.

38 minutes, 133 tool calls. Edit ×63, Bash ×37, Read ×27. 22 files modified.

## The 48-Hour Build: Automated Images for Naver S-Tier Dental Blogs

Session 2 was the main event.

Three Naver dental blog posts — implant bone grafting, gum disease, pediatric dentistry. Each post needed 25 images: 6 text cards, 6 3D medical illustrations, and real-photo composite cards. The quality bar was "S-tier" by Naver SEO standards — images that look like they were produced by a professional medical graphic design team.

### Why Three Agents Validating the Same Output

Every quality pass ran in a separate context with this prompt pattern:

```
Evaluate with a fresh context,
compare against S-tier reference examples,
have 3 agents cross-validate
```

Three agents per round, fixed roles:

- SEO/algorithm validation agent
- Medical accuracy + quality validation agent
- S-tier design/visual standards agent

The reason for separate contexts: if validation runs in the same thread that did the generation, it inherits all the biases and blind spots from that generation pass. Fresh context, different angle, same files — that's what catches things the original agent rationalized away.

Results came back as score tables only. `001 implant: SEO 7/10, medical 9/10, visual 8/10`. The main thread never needed to process full agent output — just the numbers.

### Routing Gemini Pro and Flash by Image Type

Early rounds used Gemini without differentiation. Round 2 made this explicit:

```
Use Pro and Flash differently based on the image quality needed
```

The split logic: medical illustrations (anatomy diagrams, alveolar bone cross-sections, implant placement sequences) → Gemini 2.0 Pro. Text cards (hero, FAQ, CTA, disclaimers) → Gemini 2.0 Flash. Pro is slower and costs more. Running it on flat card backgrounds with a few lines of text is pure waste.

This branching landed in `build_template_variables()` in `pipeline.py`. Filename patterns encode the image type, which determines the model. No manual intervention per image.

### Four Rounds to 9.1/10

Round 1's failure mode was obvious once you saw it: 3D CGI aesthetic. Blue glows, exaggerated specularity, plastic-looking textures. Average AI-detectability score: 6–7/10. Looked like a hospital website from 2018.

Round 2 fixed a `viewport` measurement bug. The HTML template had `body height: 860px` hardcoded, but the Playwright capture was set to `clip height=1075`. That 215px gap rendered as white background on every hero image. Also caught a logo double-exposure bug on text cards where the logo was composited twice.

Round 3 was the style shift that moved the needle. Switched medical illustration style from 3D CGI to Gray's Anatomy textbook — simplified anatomical line art, muted palette, clean labels. AI-detectability scores jumped to 8–9/10 immediately.

Round 4 was calibration:

```
AI detectability needs to be 9+ across the board
```

Three agents scored the same 25 images independently. When scores converged → batch passes. When scores diverged → identify the lowest-scoring items, fix them, re-score. Final output: 25 images averaging 9.1/10.

### The Skill File Is the Memory

`naver-dental-blog/SKILL.md` and `dental-blog-image-pipeline/SKILL.md` were updated 7 times during this session. The prompt that triggered each update:

```
Update the skill with everything we've learned so far, then tell me what's left and continue
```

Deferring skill updates to "after the session" means the next session relearns everything from scratch. S-tier quality benchmarks, failed prompt patterns, bug fixes discovered mid-run — all of it needs to be written into the skill while the context is hot. That's how the pipeline compounds across sessions instead of resetting.

Additions to `pipeline.py` across rounds:

- `parse_image_tags()` — parser for `<!-- IMAGE: -->` tags in blog markdown
- `build_template_variables()` — filename-based Pro/Flash model routing
- CTA card differentiation — filename branching so the same CTA template doesn't repeat across posts
- `viewport` fix → `overflow: hidden` applied across all HTML templates

## The Bug Nobody Asked About

Midway through the session:

```
Why does it run 1st, 2nd, 3rd attempts every time?
```

Three nested retry loops in the pipeline — a mistake from the initial scaffolding. The intent was: if the image generation API fails, retry. The implementation was: always run three times, regardless. Success on attempt 1? Still runs 2 and 3. Failed on all 3? Runs 3 more.

After the fix: exit on first success, retry only on failure. Simple, but it halved runtime.

## Rollback Without Git Is Not a Strategy

Near round 5, a full redesign pass ran on a card set.

```
Image #9 — the version right before this was better. Roll it back.
```

No rollback path existed. The agents had been writing files directly, bypassing git. No intermediate commits, no per-round output directories, no `.bak` files before overwrites. Once a redesign runs, the previous version is gone.

This was the most expensive mistake of the session — not in API cost, but in lost work. A pipeline that destructively overwrites files needs a recovery mechanism before it runs redesigns. Either `.bak` copies created pre-write, or round outputs saved to versioned subdirectories.

## What 670 Tool Calls Without Edit Looks Like

Of 670 tool calls, Edit appeared rarely. The breakdown was Bash running Python scripts, Agent spawning subagents, Write replacing entire files. The pipeline was mostly being executed and validated — not coded.

The discipline that makes parallel agents safe: scope assignment. "Score these 3 files independently" dispatches 3 agents that read and evaluate the same files, write nothing. No overlapping write scopes means no conflicts. In this session, validation agents were read-only throughout, so parallel execution stayed clean across all four rounds.

---

## Related Posts

- [Building a Dental Clinic Site in 8 Minutes with Claude Code](/posts/2026-03-16-uddental-en)
- [Hiring 10 Agents to Build a Mentoring Platform: 6 Sessions, 1,289 Tool Calls](/posts/2026-03-15-coffee-chat-en)
- [Blog Automation Pipeline: Turning 105 Session Logs into Build Logs](/posts/2026-03-15-portfolio-site-en)

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
