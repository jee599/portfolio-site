---
title: "949 Tool Calls in One Day: Running 3 Claude Code Projects in Parallel"
project: "portfolio-site"
date: 2026-03-16
lang: en
pair: "2026-03-16-portfolio-site-ko"
tags: [claude-code, astro, next-js, llm-orchestration, automation]
description: "10 hours 49 minutes, 949 tool calls, three completely different projects shipped in one day. Here's what the data reveals about parallel Claude Code workflows."
---

949 tool calls. Three separate Claude Code sessions. Three completely different projects — a dental clinic website, an LLM routing dashboard, and this portfolio hub. All in the same day. Total wall-clock time: 10 hours 49 minutes, with Opus 4.6 running the whole time.

**TL;DR** Splitting projects into separate sessions keeps context clean, but you pay for it in repeated setup time and more rollback requests when UI direction isn't locked in upfront.

## Why I Asked for 5 Rollbacks on a Dental Website

The first session was `uddental` — a redesign of a dental clinic site in Yongin, Korea. 4 hours 52 minutes, 309 tool calls. Bash 110 times, Edit 105 times, Read 74 times.

The work got messy because the visual direction kept shifting in real time. It started simple: "cycle through the photos." Then: blur the background. More transparent. Remove the blur. Just a subtle blur. Actually, remove the blur again. This loop ran five times.

```
"a bit more blurred, make it more transparent"
"not stronger blur — more like seeing through to the background"
"don't blur it"
"just a very subtle blur"
```

Claude Code implemented each request faithfully. The problem was rollbacks.

> "Actually, revert what you just did."

When you're editing files directly with Edit instead of committing to git, rollbacks get complicated. Claude Code needs to remember the previous state, and that accuracy degrades as the session gets longer. We ended up converging on a workaround: take a screenshot, share it, and say "get it back to this version."

SSR/CSR hydration errors also caused friction. A component that calculated the current day and operating hours using `Date.now()` produced different values on server vs. client when rendered server-side in Next.js. The error:

```
A tree hydrated but some attributes of the server rendered HTML didn't match
the client properties.
```

Hit this twice. The fix is either rendering client-only via `useEffect` or using `suppressHydrationWarning`. Pasting the error message directly into Claude Code gets you the root cause immediately.

Near the end of the session, an interesting request came in:

> "Create a test button panel where I can pick from multiple colors for the background."

The `HeroBgPicker.tsx` component got built — a 10-color palette pulled from real hospital and professional brand colors, letting the client quickly settle on a visual direction. Building a design decision tool alongside the product is one of the more practical Claude Code patterns.

## How One SPEC.md File Drove 70+ Files of Architecture

Session two was `llmmixer_claude`. 2 hours 35 minutes, 368 tool calls. Bash 149 times, Write 93 times, Read 66 times, Edit 52 times.

The opening prompt was simple:

> "Read /Users/jidong/Downloads/SPEC.md and implement it. First write a detailed implementation plan as a markdown file."

Step one: read SPEC.md, produce `IMPLEMENTATION_PLAN.md` with phases 0 through 3. Then:

> "Implement each phase, give objective feedback on what you built, revise up to 3 times until it's solid, then move to the next phase."

This is the core prompt pattern. An explicit loop: implement → self-review → revise (max 3 rounds) → next phase. Claude Code ran Phase 0 self-review unprompted, surfaced issues in a list, and worked through them.

Starting from an empty repo, 70+ files were generated in 2 hours 35 minutes: a Next.js dashboard, a core package with adapters, router, and workflow engine, a CLI entrypoint, and SSE log streaming.

Mid-session, `npm install` failed. Root cause: `workspace:*` protocol in `package.json` — pnpm syntax that npm doesn't support. Claude Code fixed the dependency declarations. Build errors usually resolve as soon as you paste the error message in.

Gemini CLI auth also surfaced during adapter testing. One prompt handled it:

> "Gemini should be authenticated, but if it's not, wrap the dashboard so users can authenticate via CLI from the UI."

Claude Code built an auth state check that routes users to a Setup tab when credentials are missing. The principle: don't suppress errors, surface them as UI.

## Portfolio Hub Pivot + JSONL-Based Build Log Automation

Session three was this site, `portfolio-site`. 3 hours 20 minutes, 272 tool calls.

The core pivot: transform from an AI news aggregator into a **project portfolio hub**. The implementation plan went in as a prompt:

```
Implement the following plan:
# jidonglab Portfolio Hub Redesign
## Context
Convert jidonglab.com from an AI news/blog site
into a project portfolio hub.
```

The pattern: write the plan, paste it with "Implement the following plan:" prepended. Claude Code reads it and executes file by file.

Mid-session, an interesting question came up:

> "What's that .jsonl thing Claude Code saves locally in .claude?"

Claude Code sessions are stored as JSONL files under `~/.claude/projects/`. Every conversation turn, tool call, and result gets recorded. Parse that, and you can auto-generate build logs.

> "We should extract build logs from the JSONL directly."

`parse-sessions.py` got built to parse the JSONL, piped into `generate-build-log.sh` which hands the data to Claude. The post you're reading now is the first output of that pipeline.

**Before:** Build logs were written manually. Remembering what happened each session took 30–60 minutes per post. **After:** One `generate-build-log.sh` run extracts the session summary and generates a draft. Editing takes 10–15 minutes.

Toward the end, adding project status controls in the admin UI hit a GitHub API 403. The endpoint was committing YAML files directly, and the token was missing the right scope. One prompt:

> "Test this and keep fixing until it works perfectly."

That single line triggered a full loop: diagnose → fix → test → re-fix, automated.

## What Three Parallel Sessions Actually Look Like

Separate sessions mean clean context resets. Switching from `uddental` to `portfolio-site` means zero carryover confusion. The tradeoff is ramp-up time — each session has to re-orient to the project structure.

Tool usage ratios differed meaningfully across sessions:

- **uddental**: Bash 36% / Edit 34% — heavy UI iteration, lots of back-and-forth
- **llmmixer**: Bash 40% / Write 25% — new project, mostly creating files
- **portfolio-site**: Bash 58% / Edit 16% — existing codebase, lots of command execution

High Bash ratios mean frequent build-and-verify cycles. New greenfield projects push Write ratios up. Existing codebases run more commands.

Across all 949 tool calls, Bash led at 417 (44%). Running and verifying code is a much larger part of Claude Code work than writing it.

The other pattern that emerged: vague aesthetic prompts are expensive. "Make it more trendy" repeated five times burns tool calls fast. Session 1 hit 309 calls partly because visual direction wasn't locked. One reference screenshot beats 30 iterations.

> Let Claude own the "what" by writing the spec first. Write prompts that define outcomes, not instructions. The results improve significantly.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
