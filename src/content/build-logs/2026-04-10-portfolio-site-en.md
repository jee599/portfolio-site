---
title: "How I Used Claude Code to Plan 288 SEO Pages in 63 Tool Calls — Without Writing a Single Line of Code"
project: "portfolio-site"
date: 2026-04-10
lang: en
pair: "2026-04-10-portfolio-site-ko"
tags: [claude-code, subagent, planning, seo, writing-plans]
description: "20 hours, 63 tool calls, zero code written. The strategy behind planning 288 SEO landing pages using the writing-plans skill and multi-agent patterns in Claude Code."
---

I spent 20 hours and fired 63 tool calls without writing a single line of code. And it was exactly the right move.

**TL;DR** Use the `writing-plans` skill to produce a concrete implementation plan before touching code. Then hand that plan to subagent-driven development for execution. A session dedicated purely to design — no coding — dramatically accelerates everything that follows.

## 288 Pages: Where Do You Even Start?

The task: add 288 SEO compatibility landing pages to a saju (Korean astrology) app. 12 zodiac signs × 12 zodiac signs = 144 combinations, doubled for male/female reversal = 288 pages. A spec document existed, but I've seen what happens when you skip planning and jump straight to code — you hit a wall halfway through, direction drifts, and you end up redesigning the architecture after the fact.

So I called `writing-plans` first.

## The writing-plans Skill: Make a Document Before You Make a Commit

```
/writing-plans → saju_global SEO compatibility landing 288 pages
```

One core assumption drives this skill: **write the plan as if the executing agent is a new hire seeing the codebase for the first time.** File paths, existing patterns, schema definitions — everything gets spelled out explicitly.

Before writing a single line of the plan, I read the codebase. 13 `Read` calls, 4 `Glob` calls. Routing structure, existing SEO meta tag patterns, i18n configuration, Content Collection schemas — verified directly from source, not from memory. That's a rule in CLAUDE.md: never write a plan from assumptions.

The first attempt hit a snag: a spec file path didn't match what I expected. Instead of stopping to ask, I ran `Glob` against `docs/superpowers/specs/` to scan the directory and locate the actual file. The agent unblocked itself without interrupting the workflow.

The output: `docs/superpowers/plans/2026-04-10-seo-compatibility-pages.md`

That single document contains everything the execution session needs:

- Every file that needs to change, with its path and the reason why
- Task execution order
- How to verify each piece works
- Where to draw commit boundaries

Without this plan, you can't run agents in parallel. Overlapping scopes cause conflicts. The plan document is what makes multi-agent execution safe.

## 16 Agent Calls: For Exploration and Task Design, Not Code

Of the 63 total tool calls, `Agent` accounted for 16 — the highest of any tool. None of them were for writing implementation code. Two purposes drove all of them:

**1. Delegating codebase exploration.** Existing SEO patterns, routing structure, i18n setup — I handed these to an `Explore` agent. The point is to keep the main context clean. You don't want exploration output flooding the thread where architectural decisions get made.

**2. Reviewing the plan.** After drafting, I ran an independent agent over the plan document. The context that wrote the plan is too close to it — a separate agent catches gaps and inconsistencies the original context misses.

`TaskCreate` × 7, `TaskUpdate` × 13 — task tracking infrastructure for the execution session. Each agent's assignment gets defined before a single line of implementation code is written.

## Preparing for Subagent-Driven Execution

Once the plan is solid, you choose an execution strategy. Two options:

1. **Subagent-driven**: dispatch independent agents per task → checkpoint review → repeat
2. **Inline**: sequential execution in the current session

At 288 pages, the answer was obvious. You need parallel execution or the timeline doesn't work.

Before execution begins, I set up a worktree. Working directly on `main` mixes experimental changes into stable code. A worktree keeps `main` untouched.

```bash
git worktree add ../saju-seo-pages feature/seo-compat-pages
```

In the execution session that follows, the plan document gets decomposed into discrete tasks, each handed to a separate agent. Scopes were defined at planning time, so parallel runs don't collide.

## Is 20 Hours of Pure Planning Defensible?

That question comes up. Is it legitimate to close a session with zero code written?

> Starting implementation without a plan means re-orienting after every completed task. Agents drift out of scope, ignore existing patterns, or create file conflicts. Recovering from that costs more time than the planning session would have.

Throwing a 288-page project at agents without a plan is a reliable way to reach 50% completion and have to start over. Separating into `writing-plans` → `subagent-driven development` gives each session a single responsibility. Planning session plans. Execution session executes.

## Session Stats

63 tool calls total: `Agent` (16), `Read` (13), `TaskUpdate` (13), `TaskCreate` (7), `Bash` (5), `Glob` (4), `Skill` (2), `Write` (1).

Files created: 1. Files modified: 0.

## Takeaways

- **Scale up the planning investment as the task grows.** Read the codebase directly, then put actual file paths and patterns into the plan document — not approximations.
- **Delegate exploration to Explore agents.** Reserve the main context for judgment and coordination only.
- **Define task scopes before the execution session.** Agents without predefined scopes will collide in parallel runs.
- **Worktrees are the default.** The cost of keeping `main` clean is zero. The cost of not doing it can be a full rollback.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
