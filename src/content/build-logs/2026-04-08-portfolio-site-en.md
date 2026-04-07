---
title: "4 Projects, 691 Tool Calls: Running a Multi-Project Dev Shop with Claude Code"
project: "portfolio-site"
date: 2026-04-08
lang: en
pair: "2026-04-08-portfolio-site-ko"
tags: [claude-code, multi-project, agents, paypal]
description: "4 days, 4 projects, 691 tool calls: a translation bug hunt, an image pipeline war, payment integrations, and the ops patterns that keep it all moving."
---

691 tool calls across 4 sessions in 4 days. One bug took a single line fix. One session ran for 25 hours. Here's what running multiple projects with Claude Code actually looks like.

**TL;DR** The real value of Claude Code in multi-project work isn't code generation — it's context recovery speed. Switch projects, say "catch me up on this one," and you're back in 30 seconds.

## The Translation Bug That Was One Line

A user reported that the English version of spoonai wasn't working. No details — just "translations aren't showing up." Every `/posts/...-en` URL was returning 404.

I pointed Claude at the codebase and asked it to trace the root cause. It found the problem in `lib/content.ts:133`, inside `getPostSlugs()`:

```typescript
// the culprit
const files = fs.readdirSync(dir).filter(f => !f.includes('-en'))
```

The filter was actively excluding English files from the list. So `getAllPosts("en")` returned an empty array, `generateStaticParams` never generated English slugs, and every English URL 404'd. One filter condition had killed the entire i18n feature.

The fix was obvious once found. The hard part was finding it. Without Claude, I would have gone through routing config, middleware, i18n settings in order. Instead: hand over the symptom, let it follow the code path, get the answer. That's the actual leverage.

## 25 Hours Inside an Image Pipeline

The uddental session was the longest — 25 hours 5 minutes, 261 tool calls. Most of those were repeated runs of `pipeline.py`.

The setup: a Python pipeline that generates dental blog images using Gemini. The problem: every run produced slightly different results, and visual quality requires tight iteration.

Here's a sample of feedback from that session:

- "Logo should be about half to a third of its current size"
- "Actually, make it twice the current size" (the very next round)
- "Force Korean text to appear in every image"
- "Warm beige background? Or maybe a light sky blue?"
- "Too much info in one image — split each step into its own card"

Each round: modify `pipeline.py`, update `SKILL.md` to match, run, evaluate. Two files to track simultaneously across every iteration.

The pattern that emerged: for tight visual feedback loops, direct conversation beats agent dispatch. The overhead of spawning subagents and aggregating results just adds friction when you're doing "run → look → react" at fast cadence. Short-burst sessions with a single tight loop belong in the main thread.

Also worth noting: the background pipeline failed 7 times with exit code 2. Environment variable issue. When Claude gets a failure with no logs attached, it guesses. Next time I run into this, I attach the failure output immediately rather than just reporting "it failed."

## The 27-Minute Business Registration Task

The coffeechat session was different in character. A TossPayments contract review email arrived requiring business information in the footer. This was closer to paperwork than engineering.

I pasted the full email to Claude and said: fix the footer code based on this. It pulled out the required fields, mapped them to the right places in the code, and flagged which items were mandatory for payment processor compliance review.

Changes: added representative name, business registration number, address, and phone number to `site-config.ts`. Updated the Footer component to conditionally hide the mail-order business registration number when it's not set.

27 minutes, 75 tool calls. The prompt was just the email plus one sentence.

## Chasing Global Payments for a Fortune-Telling App

The saju project session was about adding Japanese and Southeast Asian payment support. 4 hours 9 minutes, 222 tool calls.

Payment processor selection took longer than expected. LemonSqueezy had a prior rejection on record — out. Paddle and Stripe don't accept fortune-telling as a category. Komoju was evaluated. Settled on PayPal.

The integration path: create sandbox app in PayPal Developer Console, set client ID and secret as environment variables, wire up the payment flow. Mid-session error: "Logging in to seller account to complete this purchase." Turned out to be a sandbox account configuration issue, not a code problem.

The multilingual validation piece was interesting. Korean strings were leaking into the Japanese payment screen. To verify all payment flows across all language pages simultaneously, I dispatched multiple agents in parallel — one per locale — and had them report back. Finding cross-language leakage this way is faster than manually clicking through every combination.

## How Multi-Project Ops Actually Works

Four projects running in parallel forces some discipline.

**Session start ritual.** Every new session begins with: "summarize the current state of this project." Claude reads recent commits, any open issues, and memory files. In 30 seconds I know exactly where I left off. No manual note hunting.

**One project per session.** If you bounce between projects in a single session, context bleeds. When something breaks, you can't isolate which project's code caused it. Keep sessions scoped to a single project.

**Agents for exploration and validation, main thread for implementation.** The image pipeline work made this concrete: if your loop is "run → feedback → fix," agent overhead slows you down. Use agents when you need parallel coverage (like multi-locale validation) or when you're exploring unfamiliar territory.

**Tool usage breakdown across all 4 sessions:**

| Tool | Count |
|------|-------|
| Read | 159 |
| Bash | 134 |
| Edit | 102 |
| Agent | 26 |

Read was the highest by a significant margin. Most of the work was understanding existing code before modifying it.

> Running multiple projects slows individual progress. The tradeoff: when one project hits a wall, you make forward movement elsewhere. The bottleneck rotates instead of blocking everything.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
