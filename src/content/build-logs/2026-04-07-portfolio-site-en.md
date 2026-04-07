---
title: "343 Tool Calls, 3 Projects in One Day — How AgentCrow Keeps Context from Collapsing"
project: "portfolio-site"
date: 2026-04-07
lang: en
pair: "2026-04-07-portfolio-site-ko"
tags: [claude-code, multi-agent, agentcrow, skill, debugging]
description: "3 sessions, 343 tool calls, 28 files changed. Found a translation bug's root cause in 3 minutes, iterated a live image pipeline mid-run."
---

343 tool calls. 3 separate projects. 22 hours and 6 minutes of session time. That was yesterday.

The three projects: a translation bug in spoonai, a global payment strategy for a Korean astrology (saju) app, and a dental blog image pipeline. In a typical AI coding session, context would have collapsed halfway through. It didn't — because of how agent work was structured.

**TL;DR** The AgentCrow pattern (≤5 parallel agents with non-overlapping file scopes) kept the main context clean. The real grind was the image pipeline: three background color iterations, five logo size adjustments, twelve new rules added mid-session.

## How I Found a Translation Bug's Root Cause in 3 Minutes

Someone reported that spoonai's translation feature "wasn't working properly." Vague problem. Instead of dispatching an Explore agent, I read `lib/content.ts` directly.

```typescript
// lib/content.ts:133
const getPostSlugs = () =>
  fs.readdirSync(postsDir).filter(f => !f.includes("-en"));
```

There it was. The filter `!f.includes("-en")` was completely excluding English files. So `getAllPosts("en")` returned an empty array, which meant every `/posts/...-en` URL returned 404. The translation button worked — there just wasn't a page to navigate to.

The fix was trivial. Finding the root cause wasn't. The reason it took 3 minutes instead of 30: read code first, form a hypothesis, verify. No agent dispatch needed.

## AgentCrow: Running Parallel Agents Without Blowing Up Context

The dental blog session was the largest: 206 tool calls across a single 22-hour session. This is where the AgentCrow pattern earned its keep.

```
━━━ 🐦 AgentCrow ━━━━━━━━━━━━━━━━━━━━━
Dispatching 3 agents:

🔄 @skill-updater → reflect 7 photo categories in SKILL.md
📝 @blog-enhancer → elevate post 001 implant blog quality
🎨 @blog-reader → analyze structure of posts 002/003
```

Two rules made this work.

First: non-overlapping file scopes. `@skill-updater` only touches `SKILL.md`. `@blog-enhancer` only touches `post.html`. Let two agents write to the same file and you get conflicts. Assigning explicit per-agent scope prevents this entirely.

Second: only summaries come back to main context. Copy the full agent output and the context window fills up in minutes. The main thread records key numbers and conclusions — nothing else.

The tool call breakdown for the session: Read 124, Edit 90, Bash 72, Agent 27. Agents were only 8% of total calls — but they handled over 60% of the actual work volume. The ratio matters.

## Tuning a Live Pipeline While It's Running

The `dental-blog-image-pipeline` skill kept changing rules while images were being generated. Normally a bad sign. Here it was intentional.

1. Pipeline generates 24 images
2. "These look terrible" → audit current skill state
3. Reload skill → apply updated rules → rerun pipeline

Background color changed three times: warm beige (`#f5f0eb`) → sky blue (`#f0f4ff`) → pure white (`#ffffff`). Each iteration: clear cache, rerun. Logo size got adjusted five times. Feedback came as screenshots with notes like "2x the current size" or "should be about half to a third of this."

This wasn't programming — it was using an agent as a design decision tool. During the session: model upgraded to Gemini 3.1 Flash, Korean label enforcement added, full caption band applied across all images. Twelve rules added in one session while the pipeline was live.

## A Global Payment Strategy With 4 Prompts and Zero Code

The saju app payment session had exactly 4 tool calls. No code was written.

Lemon Squeezy rejected → checked Stripe/Paddle policies on fortune-telling apps (both block it) → investigated Komoju/Omise → confirmed a Japanese business entity is required. The entire flow was structured through a single brainstorming skill.

```
got rejected so lemon squeezy is out
→ want country-specific payment, paddle / stripe both block fortune apps
→ check komoju
→ what if i don't have a business entity?
```

Four short prompts covered an entire global payment strategy. The skill maintained conversation context and surfaced trade-offs for each option without losing the thread. Sometimes the most productive session is the one that writes no code.

## Context Management Was the Real Constraint

By session 3, "compact context and continue" came up directly. Makes sense for a 22-hour session.

Reading files directly in the main thread fills context fast. The pattern that survived 343 tool calls: main thread handles planning and coordination only. File exploration and edits get delegated to agents. When results come back, only key numbers and conclusions get recorded.

Even the photo classification — reviewing 16 real photos to sort into categories — happened in main. `manifest.json` had a misclassification: image `46-009` was tagged as exam room, but it was actually the waiting area. That kind of judgment call is faster in main than in an agent, because the context for making it is already there.

Agents for file operations. Main for judgment calls. That division held across 343 tool calls.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
