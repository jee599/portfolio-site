---
title: "288 SEO Landing Pages in One Claude Code Session — 171 Tool Calls"
project: "portfolio-site"
date: 2026-04-13
lang: en
pair: "2026-04-13-portfolio-site-ko"
tags: [claude-code, seo, subagent, automation, saju_global]
description: "How I used Claude Code's writing-plans + subagent-driven-development workflow to generate 288 SEO compatibility landing pages in a single 67-hour session."
---

171 tool calls. 101 Bash executions. One session. The task: generate 288 unique SEO landing pages for a Korean astrology app (`saju_global`) — specifically, zodiac compatibility pages for every possible pair.

**TL;DR** — Write the plan first with `writing-plans`, execute with `subagent-driven-development`. The real win was that Claude ran background scripts autonomously while I did nothing.

## Why 288 Pages

Compatibility landing pages require combinatorics. 12 zodiac signs × 12 zodiac signs = 144 pairs. Flip the order (male/female perspective) and you get 288. Each page needs distinct content — otherwise search engines treat them as duplicate thin content. Generating this by hand isn't just tedious; it's not possible at scale.

The spec lived at `docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md`.

## Plan First, Execute Second

Jumping straight into implementation on large-scale tasks always drifts. That's why I ran the `writing-plans` skill before touching any code.

The output: `docs/superpowers/plans/2026-04-10-seo-compatibility-pages.md` — a set of atomic, executable tasks. Without that plan, you can't give a subagent a clean scope. With it, each agent knows exactly where its work starts and ends.

There were two execution strategies to choose from:

> **1. Subagent-Driven** — independent agents per task, mid-session review checkpoints, fast iteration
>
> **2. Inline Execution** — sequential execution in the current session

I chose option 1.

## "Why Not Just Run the CLI?"

Midway through planning, I asked myself this. And honestly — running `npx tsx scripts/generate-compat-content.ts` directly in the terminal would have worked. So what's actually different about subagent-driven-development?

The difference is **judgment**. A CLI executes. A Claude agent thinks while executing. If the script stalls, if generated content falls below quality thresholds, if you hit an API rate limit — a CLI dumps an error and stops. Claude adapts.

In practice, this session ran the background task (`nohup npx tsx scripts/generate-compat-content.ts`) multiple times. My messages were almost embarrassingly terse:

```
Me: how's it going?
Claude: [checks logs] 73/288 pages generated. ~12 minutes remaining.

Me: merge it yourself and run step 2
Claude: [executes git merge, runs script twice]
```

That's the actual difference. I provided context. Claude handled execution and judgment.

## The Worktree Strategy

Work didn't happen on `main`. Claude checked the git state first and created a worktree:

```bash
git worktree add .claude/worktrees/seo-compat-pages feature/seo-compat-pages
```

Writing 288 entries to `zodiac-compat-content.json` in one shot is the kind of operation where mistakes are expensive to undo. The worktree kept `main` clean while the experiment ran in isolation.

## Tool Call Breakdown

171 calls, distributed across the session:

| Tool | Count | % |
|------|-------|---|
| Bash | 101 | 59% |
| Read | 20 | 12% |
| Agent | 17 | 10% |
| TaskUpdate | 14 | 8% |
| TaskCreate | 7 | 4% |
| Write | 3 | 2% |

Bash at 59% tells the story. This session wasn't about editing code — it was about **running and monitoring**. The 3 Write calls (2 actual files created: `zodiac-compat-content.json` and the plan file) confirm it. Content generation at scale means running scripts and watching them, not manually editing files.

Claude's role: keep the script running, check the logs, intervene when needed.

## What Scale Work Teaches You

Completing 288-item content generation in a single session made a few things concrete.

**Plans are required for multi-agent work.** Without a written plan, scope gets fuzzy and subagents overlap or miss tasks. With `writing-plans` output, each agent received a hard-edged scope: "do this task, nothing else."

**Background execution needs a monitoring contract.** Running `nohup` and asking "how's it going?" is fine — but only if you've pre-defined where logs live and what format they're in. Without that, status checks become guesswork.

**101 Bash calls is normal for scale work.** Large batch jobs follow a run-check-rerun loop by nature. The key is that Claude can drive that loop autonomously. You define the goal; Claude manages the repetition.

## Session Stats

| | |
|---|---|
| Session duration | 67h 26m |
| Model | claude-opus-4-6 |
| Total tool calls | 171 |
| Bash executions | 101 |
| Agent dispatches | 17 |
| Files created | 2 |
| Pages generated | 288 |

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
