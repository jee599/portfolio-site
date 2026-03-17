---
title: "claude-opus-4-6 Mapped an Unfamiliar Repo in 7 Tool Calls"
project: "uddental"
date: 2026-03-18
lang: en
pair: "2026-03-18-uddental-ko"
tags: [claude-code, claude-opus, next-js, ai-comparison]
description: "Same dental website, three AI implementations: Claude, Codex, hybrid. How claude-opus-4-6 mapped the full structure in 4 Read + 3 Bash calls."
---

Three implementations of the same codebase, stacked side by side. That's uddental.

It's a dental website project — but calling it that undersells the experiment. The real story is the folder structure:

```
implementations/
├── claude/
├── codex/
└── hybrid-claude-plan-co.../
```

Same spec. Three different AI tools. Side by side. I'd never seen a repo structured this way before.

**TL;DR** — claude-opus-4-6 mapped this unfamiliar repo in 7 tool calls (4 Read, 3 Bash). The exploration prompt was 4 lines. Stack: Next.js 15 + React 19 + TypeScript + Tailwind CSS v4, deployed on Vercel.

## The Repo That Made Me Stop

Most repos have a `src/` folder and a `README`. uddental has an `implementations/` directory that explicitly tracks three parallel development histories.

This is a structured experiment: build the same product with Claude alone, with Codex alone, and with a hybrid workflow — then compare the results. That kind of explicit comparison is rare. Usually "I used AI to build this" means one tool, one shot, and a vague impression. This repo makes the comparison concrete and reproducible.

I wanted to understand its structure without digging around manually. So I gave it to Claude Code with a short brief.

## Four Lines Was Enough

Here's the full exploration prompt:

```
Open this repository in Claude Code context and do a quick initial scan only:
1) confirm the repo is accessible
2) identify the stack/framework
3) list the most important top-level directories/files
4) report any obvious start/dev/build commands if present

Keep it concise and do not make changes.
```

That's it. Four numbered items plus one explicit constraint: *do not make changes.*

That constraint matters. Claude Code defaults to proactive — if it sees something to improve, it tends to fix it. Without a guardrail, an exploration session can drift into an unsolicited refactor. "Do not make changes" keeps it read-only.

The principle generalizes. If your goal is narrow, your prompt should be narrow. The more specific the instruction, the less energy Claude spends on scope you didn't ask for.

## 7 Tool Calls, Full Picture

claude-opus-4-6 used 4 Read calls and 3 Bash calls. Seven total. The session took about a minute.

Read calls hit the high-signal config files: `package.json`, `.vercel.json`, `next.config.ts`. These tell you the stack, the deployment target, and the build configuration without touching application code. Bash calls checked directory structure — three targeted lookups, not a recursive `find .` dumping everything.

What came back:

- **Stack**: Next.js 15 + React 19 + TypeScript + Tailwind CSS v4
- **Deployment**: Vercel (`.vercel` build artifacts present, config file confirmed)
- **Architecture**: App Router, `implementations/claude/` is the main app
- **Commands**: `npm run dev`, `npm run build` (standard Next.js)

Seven tool calls. One unfamiliar repo. Full picture.

Compare that to the alternative: opening files manually, reading source code, checking docs. You'd spend 10-15 minutes to get the same information — and you'd probably miss the `.vercel.json`. The difference isn't just speed. It's cognitive overhead. Claude loads the unfamiliar codebase so you don't have to.

## What Three Implementations Actually Tell You

The `implementations/` structure is the genuinely interesting part.

When you build the same thing with different tools, you surface each tool's *design pressure* — the decisions it nudges you toward, the patterns it defaults to, the trade-offs it makes without asking. A tool strong at generating boilerplate might produce different component architecture than one better at reasoning through abstractions. Explicit prompting produces different file organization than intent inference.

You can read "Claude vs Codex" comparisons online all day. Or you can look at a repo where someone actually built the same thing both ways and left the output standing.

The hybrid folder is the most interesting one. The "plan-co" in the folder name hints at a co-planning workflow — maybe Claude for architecture, Codex for implementation, or some other division of labor. The name suggests the author didn't just alternate tools randomly but had a deliberate handoff strategy.

I didn't diff the three implementations in this session. Comparing component structure, routing approaches, and state management across the three is the next step. But the skeleton is already telling: same spec, three paths, one repo that captures all of them.

## When to Use Opus for Exploration

One deliberate choice: using claude-opus-4-6 for a quick scan, not a smaller model.

The instinct is to save Opus for complex reasoning and use cheaper models for simple lookups. But exploration isn't simple — it requires judgment about what's worth reading, what can be skipped, and how to synthesize a coherent picture from a handful of config files and directory listings.

A faster model might make more tool calls, miss the `.vercel.json`, or produce a summary that raises more questions than it answers. Opus got it in 7 calls with nothing left ambiguous.

The cost difference between 7 Opus calls and 20 Haiku calls on the same task is negligible. The quality difference isn't.

For initial codebase exploration: don't optimize for cost. Optimize for how many follow-up questions you need to ask. Fewer is better.

## The Reusable Pattern

This works for any unfamiliar repo:

Write a prompt with 3-4 specific things you want to know. Add "do not make changes" explicitly. Let Claude decide which files to read. Trust that it'll find the config files that matter.

Not "help me understand this codebase" (too vague). Not "read every file in `src/`" (too expensive). A short list of specific questions, run once, with a guardrail.

If you're onboarding to a new project, reviewing a PR from a codebase you don't know, or inheriting someone else's work — this approach gets you oriented faster than reading documentation, mostly because most repos don't have good documentation anyway.

This session ended at first exploration. The real next step is diffing the three implementations and understanding what each tool actually produced when given the same requirements. That's a deeper session — but this one gave me the map to start.

> The fastest way into an unfamiliar codebase is to ask Claude what's in it before you open a single file.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
