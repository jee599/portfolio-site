---
title: "Claude Code Planned 288 SEO Pages in 10 Minutes — Before Writing a Single Line"
project: "portfolio-site"
date: 2026-04-10
lang: en
pair: "2026-04-10-portfolio-site-ko"
tags: [claude-code, planning, seo, superpowers, writing-plans]
description: "23 tool calls, 13 reads, 3 parallel agents — and zero files modified. How the writing-plans skill turns Claude Code into a planner before a coder."
---

23 tool calls. 10 minutes. Zero files modified. That's what it took Claude Code to produce a complete, executable implementation plan for 288 SEO landing pages.

**TL;DR** The `writing-plans` skill forces Claude Code to understand your codebase before touching anything. 13 Read calls, 4 Glob calls, 3 parallel sub-agents — all just to produce a single plan file. That upfront investment is what makes the actual implementation session fast and clean.

## 288 Pages and a Spec Doc That Won't Tell You Where to Start

The `saju_global` project needed compatibility SEO landing pages. The math: 12 zodiac signs × 12 zodiac signs = 144 pairs, doubled for directionality = 288 pages. A spec document existed, but it didn't say which files to touch, how to wire up routing, or how the new pages should fit with existing patterns.

The prompt was deliberately simple:

```
Implement 288 SEO compatibility landing pages for the saju_global project.
Spec: docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md
```

If Claude Code had jumped straight to implementation here, this would have gone sideways. It didn't. It loaded the `writing-plans` skill instead.

## What writing-plans Does Under the Hood

The moment the skill loads, Claude Code shifts into research mode. Before a single implementation file is touched, it collects the full context it needs to write a plan that can stand on its own.

In this session, 23 total tool calls broke down like this:

| Tool  | Count | Purpose                              |
|-------|-------|--------------------------------------|
| Read  | 13    | Existing routes, components, schemas |
| Glob  | 4     | File discovery and pattern matching  |
| Agent | 3     | Parallel codebase exploration        |
| Skill | 1     | Loading writing-plans                |
| Bash  | 1     | Verification                         |
| Write | 1     | Producing the plan file              |

More than half the session was spent just reading. The 3 parallel agents each tackled a different domain simultaneously — routing patterns, existing SEO component architecture, and content collection schema. Instead of doing those explorations sequentially, they ran concurrently and merged their findings.

What the resulting plan contains:

- Every file to create or modify, with the reason why
- Step-by-step execution order designed around DRY and YAGNI
- Testing approach for each phase
- Commit granularity — how to split the work into atomic, reviewable chunks

The key design constraint of the `writing-plans` skill is "zero context assumed." The plan has to be self-contained enough that a fresh agent in a new session — with no memory of this conversation — can execute it without guidance from you.

## When Claude Code Can't Find the Spec File

The first attempt hit a dead end: the spec file wasn't at the path I'd given. Wrong path.

Claude Code didn't stop and ask. It globbed `docs/superpowers/specs/` directly, found the actual file, and kept going.

This kind of autonomous recovery happens because `CLAUDE.md` contains: "Do not ask questions. Make decisions and proceed." When the agent hits an obstacle, the default is self-rescue — interrupt the user only if truly blocked. A simple directory scan recovers from most path errors without any human intervention.

## The Output: 1 File Created, 0 Files Modified

After 10 minutes and 23 tool calls, the session produced exactly one artifact:

```
docs/superpowers/plans/2026-04-10-seo-compatibility-pages.md
```

One file created. Zero source files touched.

This looks underwhelming until you consider what that file enables. The plan documents every decision: which dynamic route file to create, how to generate 288 static paths at build time, which SEO component to extend vs. build from scratch, what the content collection schema needs, how to split the work into reviewable commits.

Without this plan, an implementation session for 288 pages would involve Claude Code making assumptions about patterns you haven't confirmed, mid-session pivots when those assumptions turn out wrong, and accumulated drift that makes the codebase harder to reason about by the end. The plan prevents that failure mode entirely.

The session ended with a question from Claude Code: "Subagent-Driven or Inline Execution for the implementation phase?" The plan is done. All that's left is deciding how to run it.

## Why Planning and Implementing Are Different Sessions

There's a predictable failure mode in AI-assisted coding: the agent receives a request, starts modifying files immediately, hits an unexpected design constraint halfway through, and either rolls back or continues down a path that made sense locally but is wrong globally. In long sessions, this gets worse — the agent has committed to early choices that are hard to undo, and the context window is increasingly occupied by work that may need to be thrown away.

The `writing-plans` → `executing-plans` separation is a direct fix for this. Each session gets a single responsibility:

- **Planning session**: read, explore, produce a plan. No file modifications.
- **Execution session**: follow the plan. No exploration, no architectural decisions mid-flight.

If the plan is wrong, you fix the plan — a text file, not a tangled implementation. If a step turns out to be invalid, the execution session surfaces it cleanly rather than having it corrupt downstream steps.

The multi-agent planning approach also compresses the exploration time. Three parallel agents scanning independent parts of the codebase is roughly 3× faster than one agent doing it serially — and all that parallelism stays contained in the planning session, not bleeding into execution context.

Tool call breakdown: Read 13, Glob 4, Agent 3, Skill 1, Bash 1, Write 1. Total: 23 tool calls.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
