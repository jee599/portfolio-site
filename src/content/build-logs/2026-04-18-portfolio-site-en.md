---
title: "Opus 4.7 Launch Day: 15 Sessions, 4 Projects, 6 New Agents"
project: "portfolio-site"
date: 2026-04-18
lang: en
pair: "2026-04-18-portfolio-site-ko"
tags: [claude-code, auto-publish, harness, contextzip, agents]
description: "How I shipped two blog posts, redesigned an agent harness, released contextzip v0.2, and rebuilt a site's design — all in 48 hours with Claude Code"
---

Opus 4.7 dropped on April 16th. By end of day I had two posts live on DEV.to, six new agents wired into my Claude Code harness, and a binary release on GitHub. Total: 15 sessions, 1000+ tool calls, 48 hours.

**TL;DR** — The biggest structural change was splitting my Claude Code workflow into isolated agents per concern: writing, editing, design review, implementation, planning, and verification. Each agent runs in its own context. No shared state, no contamination.

## Reading a 232-Page PDF in 6 Minutes

Anthropic published the Opus 4.7 System Card at 9 AM. 232 pages. I dropped the PDF URL into Claude Code with a single prompt: "analyze this."

Three Read calls, two Bash calls, six minutes. Out came a benchmark comparison table and alignment summary. Key positioning from the doc: strongest publicly available model, below Mythos Preview, optimized for SWE tasks, agentic workflows, and computer use.

That summary became the foundation for two blog posts written the same afternoon.

## Shipping Two Posts Four Hours After Launch

I used the `auto-publish` skill to run two writer agents in parallel — each targeting a different angle.

**Post 1: Migration guide for the breaking change**

Title: `Opus 4.7 just killed budget_tokens: what broke and how to migrate`

There was an actual breaking change. The old `budget_tokens` approach started returning 400 errors. The fix: switch to `type: "enabled"` + `budget_tokens` in combination. The post was built around that migration path.

**Post 2: OpenAI's duct-tape image models**

Three image models appeared on LM Arena for a few hours — `packingtape`, `maskingtape`, `gaffertape-alpha` — then got pulled. I tied that to the DALL-E retirement deadline (2026-05-12) and what it signals about OpenAI's image strategy.

Each post agent produced four files: spoonai ko/en, DEV.to, Hashnode. 97 tool calls total across both agents. 74 Bash, 8 Edit, plus Writes.

## A Single Newline That Blocked Admin Access

In the middle of all this, a separate project broke. The admin panel for `fortunelab.store` kept returning 401 even with the correct password.

It wasn't a bug in the auth code. It was this:

```
ADMIN_PASSWORD="920802\n"
```

A trailing newline in the Vercel environment variable. The server compared against `920802\n`. The user typed `920802`. Strict equality failed. Ten Bash calls to find the cause.

## Rebuilding the Agent Harness

This was the heaviest work of the 48 hours. I started with a parallel deep-research pass — four subagents on two tracks:

- Harness theory + Hermes identity principles  
- Harness practice + real-world agent composition

The diagnosis was clear. My `~/.claude/` was overloaded: 82-line CLAUDE.md, 92KB of MEMORY files, 20+ skills. Anthropic's stated principle is "add only after observed failure." Mine had grown the opposite way.

After pruning, I added six purpose-built agents:

| Agent | Role |
|---|---|
| `blog-writer` | Platform-specific draft generation (spoonai, naver-dental, devto) |
| `content-editor` | Strip AI clichés, tighten prose |
| `design-reviewer` | Read-only UI scoring across 5 axes |
| `frontend-implementer` | TypeScript + Next.js + Tailwind execution |
| `plan-orchestrator` | Read-only recon before implementation begins |
| `code-verifier` | Tests, lint, console.log check before commit |

Four hooks went in alongside the agents: `sticky-rules` (re-injects after compaction), `contextzip-rewrite` (auto-wraps Bash calls), `protect-files` (Edit/Write guard), `commit-cleanliness` (Stop hook), `trajectory-log`.

The design principle here is **file-based context isolation**. Agents don't share conversation history. The orchestrator makes decisions. Each agent executes in its own sealed context.

```
~/.claude/agents/blog-writer.md
~/.claude/agents/content-editor.md
~/.claude/agents/design-reviewer.md
~/.claude/agents/frontend-implementer.md
```

## Releasing contextzip v0.2

`contextzip` (`jee599/contextzip`) had accumulated 30+ commits since v0.1.1. I cut the v0.2.0 release.

The headline feature: `compact/apply/expand` — a session history compressor. Previous versions compressed command output. v0.2 targets the Claude conversation history itself. Long sessions accumulate heavy context; `compact` summarizes and compresses that history to reduce token overhead on subsequent turns.

GitHub Actions built binaries for five targets: linux-x86_64, linux-musl, macos-arm64, macos-x86_64, windows-x86_64.

Before release, I ran a token breakdown across recent sessions. The numbers were surprising:

```
Tool use (inputs)  : 46.4%
Tool results       : 39.4%
User text          : 10.1%
Assistant text     :  4.1%
```

Claude's actual responses are 4% of total token usage. The real cost is tool I/O — Read (22.1%), Agent dispatches (20.0%), Write (18.9%). That's the target for compression.

33 Bash, 8 Glob, 4 Read, 1 Edit.

## Full Site Redesign in One Session

The final major session: redesigning `spoonai-site`. I generated ten mockups in parallel, each as a distinct design direction:

- Bento grid (Apple-style)
- Masonry / Pinterest layout
- Neo-brutalism
- Swiss typography
- Japanese Kinfolk editorial
- Netflix cinema dark
- Y2K Chrome retro
- Dashboard ticker

Each mockup was built as raw HTML by a subagent and served on a local port for review. I picked the Masonry layout, then fixed article cards to render actual images, added responsive behavior, animations, and a newsletter section.

An admin page auth bypass bug surfaced in this session and got patched.

395 tool calls. 20 hours 40 minutes.

## Tool Usage Across All 15 Sessions

| Tool | Primary use |
|---|---|
| Bash | Build, deploy, git, analysis — by far the most used |
| Edit | Code modifications |
| Read | File reading and analysis |
| Agent | Parallel subagent dispatch |
| Write | File creation |
| TaskUpdate/Create | Multi-agent coordination |

Heaviest session: Session 10 (spoonai design, 395 tool calls). Shortest: Session 1 (PDF analysis, 6 tool calls).

## What Actually Changed

The agent pipeline is the structural shift. Publishing a blog post now has a defined chain:

```
blog-writer → content-editor → design-reviewer (if needed) → publish
```

Each step is an independent agent. No context bleed between stages. `sticky-rules.md` encodes the chain contract, and the SessionStart hook re-injects it after compaction so the pipeline survives long-running sessions.

contextzip v0.2 matters for the same reason. Sessions that run long accumulate history weight. `compact` gives you a way to reset that weight without losing the context you actually need.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
