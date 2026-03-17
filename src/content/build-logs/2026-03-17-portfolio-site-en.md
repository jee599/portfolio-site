---
title: "949 Tool Calls, 3 Projects, One Day: Claude Code at Full Throttle"
project: "portfolio-site"
date: 2026-03-17
lang: en
pair: "2026-03-17-portfolio-site-ko"
tags: [claude-code, automation, portfolio, build-log]
description: "Three Claude Code sessions in one day: dental site redesign, LLM multi-agent router from scratch, portfolio hub migration. 949 tool calls, 11 hours, lessons on what actually works."
---

949 tool calls. Three sessions. Three completely different codebases. Roughly 11 hours of wall clock time — and I wasn't the one doing the context switching.

**TL;DR** A dental clinic site redesign (`uddental`), a multi-agent LLM router built from a blank repo (`llmmixer`), and a portfolio hub migration (`portfolio-site`) — all in the same day. The core pattern: Claude handles the execution loop, you handle the decisions.

## Session 1: 4 Hours 52 Minutes to Redesign a Dental Site

Morning session was `uddental` — a redesign for a dental clinic in Yongin, Korea.

The starting prompt was intentionally minimal: "Show the clinic photos cycling on the hero, with key info overlaid." No wireframes. No mockups. That single sentence.

Claude built a hero slider: 6 photos crossfading at 4.5-second intervals, with clinic name and CTA layered on top. Straightforward and clean.

Then I asked it to add live clinic status — open or closed based on current time, rendered server-side using `Date.now()`. That blew up with a hydration error:

```
A tree hydrated but some attributes of the server rendered HTML
didn't match the client properties.
```

Classic Next.js SSR trap. The timestamp computed on the server differs from the one the client computes during hydration. The fix is mechanical: move the time logic into `useEffect`, initialize state to a value that's identical on both sides so the first render matches. Claude caught the cause, applied the fix, moved on.

Session stats: 110 Bash calls, 105 Edit calls — nearly 1:1. That ratio is meaningful. The work wasn't bulk code generation. It was iterative: read code, change one thing, verify, repeat.

Design direction mostly came through screenshots, not descriptions. "Like this" + one reference image. Claude reads the layout from the screenshot — spacing, hierarchy, visual weight — and translates it directly to code. A reference image consistently beats a paragraph of prose.

## Session 2: An LLM Router from Zero in 2 Hours 35 Minutes

The afternoon was a different class of problem. `llmmixer_claude` — a multi-agent orchestrator that routes tasks between Claude, Codex, and Gemini based on context.

Starting state: completely empty repo. Zero commits, no scaffolding.

I passed in a spec file (`/Users/jidong/Downloads/SPEC.md`) and said: "Build a detailed implementation plan first, write it as a markdown doc, then implement it."

The prompt that actually drove the session came after:

> "For each phase: implement it, give objective feedback on what was built, fix it — repeat up to 3 times until it's solid, then move to the next phase."

This is one of the highest-leverage patterns I've found with Claude Code. Implement → self-review → fix, max 3 iterations per phase. The key is adding "until it's solid" as a constraint. Without that, Claude finishes a phase and declares it done. With it, Claude sets its own quality bar and keeps pushing until it's satisfied.

Phase 0 hit a `workspace:*` protocol error — a known npm monorepo problem with cross-package references. Adjusted the reference format and continued. This session produced 70+ new files, which explains why Write ran 93 times (vs. Edit at roughly 0 for a greenfield project). Bash ran 149 times. High Bash counts with high Write counts is the signature of a build-from-scratch session.

One error worth calling out: `posix_spawnp failed` during Gemini CLI auth implementation. The subprocess spawning code had an execution permissions issue. The most effective fix pattern for system errors: paste the raw log directly — no explanation, no framing. Just the stack trace. Claude reads the context embedded in the trace, identifies root cause, applies the patch. Narrating what you think the problem is often sends it in the wrong direction.

## Session 3: Migrating a Site's Identity in One Evening

Evening session was `portfolio-site`.

`jidonglab.com` had been running as an AI news automation site — it pulls and summarizes AI news twice a day via cron. Technically interesting, but a bad portfolio. Any time I sent someone the link, the conversation went: "The news part is cool, but where do I see what you've actually built?" I didn't have a good answer.

The call: turn it into a project portfolio hub.

I wrote the spec beforehand and handed it to Claude. Opening prompt:

```
Implement the following plan:
# jidonglab Portfolio Hub Renewal
...
```

Markdown spec consistently outperforms natural language for implementation tasks. "Build something like this" produces variable output. "Implement this spec" produces repeatable output. Claude follows the spec structure linearly, so direction doesn't drift across sub-tasks.

The most valuable thing built in this session was `parse-sessions.py` — a script that reads the `.jsonl` files Claude Code writes to `.claude/projects/`, extracts session summaries, and drafts build log posts automatically. Every Claude Code session becomes a blog post seed without any manual writeup. The post you're reading now was bootstrapped from a summary that pipeline generated.

Mid-session, a GitHub API 403 surfaced:

```
github api error 403
```

An admin panel was calling the GitHub API directly to update project status, but the token was missing the required permission scopes. The instruction pattern that resolved it: "Test it and fix it until it fully works end to end." Not "here's the error, debug it step by step." When given the full-loop instruction, Claude tracks intermediate failure states on its own and keeps iterating until the complete flow passes — no hand-holding required.

## What the Numbers Tell You

Aggregate across all three sessions: 417 Bash calls, 200 Edit calls. Bash ran at 2x the rate of Edit.

That ratio is the actual shape of Claude Code work. It's not primarily a code-writing tool — it's a run/observe/adjust engine. The execution loop (Bash) turns twice as fast as the modification loop (Edit). You write less than you'd expect; you run and verify far more.

Context switching cost me almost nothing. `uddental` → `llmmixer` → `portfolio-site`. Each transition, I said "we're working on X now" and Claude re-read that project's context from scratch. That's it. The cognitive overhead that normally comes with switching between unrelated codebases was almost entirely offloaded.

The thing that can't be offloaded: direction. "Pivot this site from AI news to portfolio hub" is a judgment call. Claude will implement whatever direction you give it, faithfully and fast. But it won't tell you which direction is worth taking. That gap — deciding what's worth building, encoding it in a spec, and handing it off — is where the actual work lives now.

> After 949 tool calls, what's left isn't the code. It's the judgment about where to point it next.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
