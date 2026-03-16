---
title: "3 Projects, 949 Tool Calls, One Day: How Claude Code Ships at a Different Scale"
project: "portfolio-site"
date: 2026-03-16
lang: en
pair: "2026-03-16-portfolio-site-ko"
tags: [claude-code, astro, portfolio, automation, admin]
description: "3 sessions, 10h 49m, 949 tool calls — a dental site redesign, an LLM router app from scratch, and a portfolio hub migration, all in one day with Claude Opus 4.6."
---

949 tool calls. 3 separate projects. 10 hours and 49 minutes. What would have taken a solo developer at minimum two weeks got done in a single day.

**TL;DR** Three Claude Opus 4.6 sessions ran in parallel on March 15, 2026: a dental clinic homepage redesign, an LLM mixer app prototype from zero, and a portfolio site migration to a project hub. The key was a prompt strategy of "hand over a big spec first, then have Claude phase it out itself."

## Can You Actually Run Three Projects in One Day?

The three sessions on 2026-03-15:

- **Session 1** (4h 52min, 309 tool calls): `uddental` — dental clinic UI redesign
- **Session 2** (2h 35min, 368 tool calls): `llmmixer_claude` — LLM routing app, 0 to 1
- **Session 3** (3h 20min, 272 tool calls): `portfolio-site` — hub migration

Tool usage breakdown: `Bash(417)`, `Edit(200)`, `Read(180)`, `Write(123)`, `Grep(13)`, `Agent(9)`. Nearly half the calls were `Bash` — dev server restarts, `git push`, `npm install` and other repetitive ops dominated the runtime.

## Handing Off a Spec in One Line

Session 2 had the most instructive prompt pattern.

```
/Users/jidong/Downloads/SPEC.md implement this.
First write a detailed implementation plan as a markdown file.
```

Then:

```
For each phase: implement it, do an objective self-review,
iterate up to 3 times until it's solid,
then move on to the next phase.
```

Two prompts. Claude wrote `IMPLEMENTATION_PLAN.md` itself, then ran a sequential implement → self-review → fix cycle starting from Phase 0. No micromanagement required. Once you make Claude write the plan, it maintains its own context.

Result: starting from an empty repo, 81 files generated in 2h 35min — Next.js + TypeScript dashboard, CLI entrypoint, SSE log streaming, Claude/Codex/Gemini adapters.

## "Roll It Back" — The Limits of Delegating Version Control

Session 1's most time-consuming stretch. As the dental hero section's design direction kept shifting, rollback requests piled up.

```
no, roll back what you just did
```

```
no I mean just... undo back to before I asked for this
```

Claude can roll back on git commit boundaries cleanly. But when changes accumulate without commits, "go back to before" becomes context-tracking, and accuracy drops. The lesson: when UI direction isn't locked in yet and you're iterating, either use feature branches per variation or explicitly ask for `git stash` before each change.

## Hydration Errors: Claude Can't Dodge Them Either

The same error hit in two separate sessions:

```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
This won't be patched up. This can happen if a SSR-ed Client Component used:
- Variable input such as Date.now() or Math.random() which changes each time it's called.
```

The culprit was the dental site's "is the clinic open right now?" feature. Server render time and client hydration time differ — `Date.now()` on both sides guarantees a mismatch. Claude initially generated it that way, hit the error, then fixed it by splitting into `useEffect` + client-only state.

Claude knows these Next.js/React SSR patterns and can fix them fast. The problem is it doesn't generate hydration-safe code by default. When requesting components that use real-time data, specifying "handle this as client-only rendering" upfront gets you clean code on the first pass.

## Redesigning the Portfolio as a Project Hub

Session 3 was the structural work. The existing site was AI news and blog-centric, with a project section manually managing 7 entries. Two goals:

First, extract the project registry into `scripts/project-registry.yaml` — a mapping of local git paths to portfolio slugs. Second, automate build log generation. The pipeline: parse the JSONL conversation logs stored in `.claude/projects/`, extract per-session summaries (prompts, tool call counts, changed files), and feed them to Claude CLI to draft build logs.

The key prompt in session 3:

```
Implement the following plan:
# jidonglab portfolio hub migration
...
Also set up claude code schedule to auto-update each project every 6 hours
and publish build log posts to jidonglab.
```

Automation included. Output: `scripts/parse-sessions.py`, `scripts/generate-build-log.sh`, and new Projects + Build Logs tabs in the admin panel.

## The GitHub 403 That Came from Patching the Wrong Layer

Session 3's final debug spiral.

```
when I update a link or project status in admin it shows some yaml error
```

The admin was committing YAML changes directly via GitHub API. It hit `403`. The cause: while moving the GitHub token server-side to avoid client exposure, the required permission scopes were stripped out in the process. Fixed by patching `src/pages/api/admin-projects.ts`.

```
github api error 403
test and fix this until it works perfectly
```

That single-line prompt was enough. Claude identified the root cause, patched it, tested, patched again. No GitHub API docs needed.

## JSONL Conversation Logs → Build Log Pipeline

This post is the first output of that pipeline. Claude Code stores all conversation history as JSONL files under `~/.claude/projects/`. `scripts/parse-sessions.py` reads those files and extracts per-session user prompts, tool call counts, and the list of changed files. That summary gets passed to Claude CLI, which drafts the build log.

**Before:** Build logs were hand-written. Recalling what happened each session, then writing it up — 30 to 60 minutes per session.

**After:** One run of `generate-build-log.sh` extracts session summaries and generates a draft. Editing takes 10–15 minutes.

## What Actually Changes When You Work This Way

It's not that you write less code. You make fewer decisions. Session 3 produced 27 new files and 10 modified files, none of which I wrote by hand. My job was to set direction and structure prompts.

The failure mode is equally clear. When UI direction isn't settled and you keep sending vague requests like "make it trendier," you burn tool calls fast. That's why session 1 hit 309 tool calls. One reference screenshot is worth 30 rounds of iteration.

Looking at the tool usage split: `Edit(200)` outpaced `Write(123)`. Claude itself defaults to modifying existing files over rewriting from scratch — a preference that plays out across the whole session.

> Make Claude write the spec first, and it maintains its own context. Focus prompts on *what*, not *how* — the output quality reflects it.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
