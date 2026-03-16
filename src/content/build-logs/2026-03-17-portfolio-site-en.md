---
title: "949 Tool Calls, 3 Projects, 1 Day: How I Ship with Claude Code"
project: "portfolio-site"
date: 2026-03-17
lang: en
pair: "2026-03-17-portfolio-site-ko"
tags: [claude-code, automation, portfolio, build-log]
description: "Ran 3 separate Claude Code sessions across 11 hours: dental site redesign, LLM router from scratch, and portfolio hub migration. 949 tool calls total."
---

Yesterday, Claude Code made 949 tool calls across three separate sessions. 11 hours. Three completely different projects.

**TL;DR** — Ran parallel Claude Code sessions for a dental clinic site redesign (`uddental`), a multi-agent LLM router built from zero (`llmmixer`), and a portfolio hub migration (`portfolio-site`). The key insight: Claude handles context switching, you handle direction.

## Session 1: A Dental Site Redesign in 4 Hours 52 Minutes

Morning was `uddental` — a redesign of a dental clinic website in Yongin, Korea.

The initial prompt was deliberately minimal: "Show the clinic photos cycling on the main page, with key info overlaid." No wireframes. No design mockups. Just that.

Claude built a hero slider: 6 photos crossfading every 4.5 seconds with clinic name and CTA overlaid. That part worked cleanly.

Then came the classic SSR trap. The code was rendering current appointment status using `Date.now()` on the server, which triggered a hydration error:

```
A tree hydrated but some attributes of the server rendered HTML
didn't match the client properties.
```

The cause was straightforward — server render time and client recalculation time diverged. A well-known Next.js SSR + `Date.now()` footgun. Fix: move the time calculation into `useEffect`, initialize state to a value that's identical on both server and client. Done.

This session saw 110 Bash calls and 105 Edit calls — nearly 1:1. That ratio tells you something: the work was iterative read-and-fix cycles, not bulk code generation.

For design direction, one screenshot was worth more than a paragraph of description. "Like this" + screenshot. Claude reads the layout from the image and translates it to code. Far faster than trying to describe spacing, hierarchy, and visual weight in words.

## Session 2: An LLM Router from an Empty Repo in 2 Hours 35 Minutes

The afternoon session was a different kind of work entirely. `llmmixer_claude` — a multi-agent orchestrator that routes tasks across Claude, Codex, and Gemini based on context.

The repo was empty. Zero commits.

I passed in a spec file at `/Users/jidong/Downloads/SPEC.md` and said: "Build a detailed implementation plan and write it as an implementation plan markdown."

Then came the prompt that drove the whole session:

> "Implement each phase, give objective feedback on what was built, and run fix cycles up to 3 times until it's right — then move to the next phase."

This is one of the most effective patterns when using Claude Code. Implement → self-review → fix, up to three iterations. Adding "until it's right" as a condition forces Claude to establish its own quality bar rather than stopping at "it compiles."

Phase 0 hit a `workspace:*` protocol error — a common npm monorepo issue with package references. Fixed and moved on. This session generated 70+ new files, which explains why Bash ran 149 times and Write ran 93 times. High Write counts correlate with greenfield work.

One error stood out: a `posix_spawnp failed` during Gemini CLI auth implementation. The subprocess spawning code had a permissions issue. The most efficient fix: paste the raw error log directly into the prompt, no explanation needed. Claude reads the stack trace, identifies context, and patches the cause.

## Session 3: Portfolio Site — From AI News Hub to Project Showcase

The evening session was `portfolio-site`.

`jidonglab.com` was originally running as an AI news automation site. But whenever I shared it with someone as a portfolio, the same problem surfaced: "The AI news section is cool, but where do I see what you've actually built?" I had no good answer.

Time to fix the positioning. Project portfolio hub.

I wrote the implementation spec beforehand and handed it to Claude. The prompt opened with:

```
Implement the following plan:
# jidonglab Portfolio Hub Renewal
...
```

Markdown spec beats natural language every time. "Build me something like this" produces inconsistent results. "Implement this spec" produces consistent ones. Claude follows the spec literally, so the direction doesn't drift.

The most valuable piece of work in this session was `parse-sessions.py` — a script that parses the `.jsonl` files accumulating under `.claude/projects/` and auto-generates build logs. Work I do in Claude Code automatically becomes a blog post draft. The post you're reading right now was seeded by a session summary from that pipeline.

Midway through the session, a GitHub API 403 appeared:

```
github api error 403
```

The admin panel had code that called the GitHub API directly to update project status — missing token permissions. Rather than narrating what went wrong, the better instruction is: "Test it and fix it until it fully works." Claude tracks intermediate error states on its own and iterates until the thing runs end-to-end.

## What 949 Tool Calls Actually Look Like

Across all three sessions: Bash ran 417 times, Edit ran 200 times. Bash was double Edit. That ratio matters — it means the execution/verify/re-execute loop runs more often than the code modification loop. Claude Code is less about writing code and more about running, observing, and adjusting.

Context switching was almost entirely on Claude's side. From `uddental` to `llmmixer` to `portfolio-site` — each time, Claude reads the project context from scratch. My job was to say "we're in portfolio-site now." That's it.

What Claude can't do is decide the direction. "Pivot from AI news site to portfolio hub" is a judgment call that only I can make. My role is making that call and encoding it into a spec. Claude's role is executing it faithfully.

> After 949 tool calls, what's left isn't just code — it's the judgment about where to focus next.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
