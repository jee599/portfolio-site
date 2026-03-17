---
title: "7 Tool Calls to Understand Any Codebase: Claude Code's Initial Scan Pattern"
project: "uddental"
date: 2026-03-17
lang: en
pair: "2026-03-17-uddental-ko"
tags: [claude-code, nextjs, onboarding, claude-opus]
description: "One prompt, 7 tool calls, zero changes. How I use Claude Code's initial scan pattern to map an unfamiliar codebase before touching anything."
---

Seven tool calls. No file changes. Complete picture of a codebase I'd never seen before.

That's the initial scan pattern I run every time I open a new project in Claude Code. It cost me a few tokens and saved me from the classic mistake: diving into code before understanding what's already there.

**TL;DR** One read-only prompt → Claude runs 7 tool calls (Read ×4, Bash ×3) → full project structure mapped. No guessing, no surprises.

## The Prompt That Does One Job

`uddental` is a dental website and ad strategy project. When I first opened it, I ran this:

```
Open this repository in Claude Code context and do a quick initial scan only:
1) confirm the repo is accessible
2) identify the stack/framework
3) list the most important top-level directories/files
4) report any obvious start/dev/build commands if present

Keep it concise and do not make changes.
```

The last line is load-bearing. `do not make changes`. Without it, Claude might generate a README, scaffold configuration files, or "helpfully" reorganize things. During onboarding, the goal is understanding — not modification.

## Opus vs. Sonnet for Initial Scans

I set the model to `claude-opus-4-6` for this session.

The reasoning: structural inference on an unfamiliar codebase is different from completing a known task. Opus reasons about architecture more reliably — it's more likely to catch that a top-level directory contains three parallel implementations rather than treating them as unrelated folders. That's worth the extra cost at scan time. Getting it wrong and correcting later is more expensive.

## What 7 Tool Calls Found

`Read(4), Bash(3)`. That's the full call log. Read-only throughout.

The result was more interesting than a typical dental website:

```
implementations/
├── claude/          — Main Next.js app (App Router, build complete, Vercel config)
├── codex/           — Codex implementation track
└── hybrid-claude-plan-co...  — Third implementation
```

Same project, built three ways with three different AI tools, side by side for comparison. The `claude/` implementation is the main one — it has a `.next` build directory and Vercel deployment config already in place. The other two tracks look experimental.

Stack inside `implementations/claude/`: Next.js 15 + React 19 + TypeScript + Tailwind CSS v4.

## Why the Initial Scan Gets Its Own Session

If you start with "fix this file" on an unknown codebase, Claude works without context. The output might conflict with existing patterns, duplicate something that already exists, or make assumptions about project structure that turn out to be wrong.

A dedicated scan session gives two things.

**Claude's context.** Once Claude knows `implementations/claude/` is the main entry point, it doesn't need to be told again. "Add a booking form" is enough — Claude already knows which directory it belongs in and which stack constraints apply.

**Your context.** You can't make good decisions about what to build without knowing what already exists. Skipping the scan means discovering "oh, this was already here" halfway through an implementation.

## Persisting the Scan Results

The output of a 7-call scan compresses down to a few lines. Worth saving in `CLAUDE.md` or a project note so the next session doesn't repeat the work:

```markdown
# uddental project context
- Main implementation: implementations/claude/ (Next.js 15 + React 19 + Tailwind v4)
- Three-way AI implementation comparison (claude / codex / hybrid)
- Vercel deployment configured
```

Next session opens with full context from line one. No redundant reads, no misrouted changes.

> Read first, touch later. That's the rule for unfamiliar code — and it applies to Claude Code just as much as to humans.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
