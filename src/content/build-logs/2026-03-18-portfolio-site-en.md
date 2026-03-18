---
title: "827 Tool Calls, 6 Sessions: What Claude Code Looks Like at Scale"
project: "portfolio-site"
date: 2026-03-18
lang: en
pair: "2026-03-18-portfolio-site-ko"
tags: [claude-code, portfolio, automation, astro]
description: "6 sessions, 827 tool calls, 117 files touched. Plus the accidental discovery: Claude Code already logs everything as JSONL — build logs can write themselves."
---

827 tool calls. 117 files. 6 sessions.

One week of Claude Code, measured in raw numbers. The work: build a monorepo from an empty repo, convert a portfolio site, fix a payment compliance issue, and ship dental clinic content updates. Nearly all of it delegated to Claude Code.

Along the way, one discovery changed how I think about build logs.

**TL;DR** Claude Code stores every session as JSONL under `~/.claude/projects/`. Parse those files and you get a full record: every prompt sent, every tool called, every file created or modified. Feed that into Claude API and build logs write themselves. That pipeline generated this post.

## One SPEC.md, Zero Commits, 370 Tool Calls

Session 1 started with a single prompt:

```
/Users/jidong/Downloads/SPEC.md implement this.
Create a detailed implementation plan first, as a markdown file.
```

The repo was completely empty. No commits, no scaffold, nothing. `git@github.com:jee599/llmmixer_claude.git`.

Claude made `IMPLEMENTATION_PLAN.md` before writing a single line of code — Phase 0 through 3: project setup, CLI + dashboard, LLM Decomposer + Router, then Codex/Gemini adapters. Once the plan existed, I gave one more instruction to drive the entire session:

```
Implement each phase, objectively review the implementation,
fix issues up to 3 times per phase until solid,
then move to the next phase
```

"Build → self-review → fix → next phase." One prompt. The whole loop.

The Phase 0 self-review caught three issues before I had to point them out: an `outputFileTracingRoot` warning in the Next.js config, unhandled dev server process cleanup, and a `tsconfig.json` module compatibility mismatch. Claude found them unprompted during its own review pass.

370 tool calls later: `packages/core/`, `packages/dashboard/`, `bin/`, `config/templates/` — 69 new files total, the full monorepo skeleton in place.

One snag mid-session: the `workspace:*` protocol in `package.json`. npm doesn't support that format — it's a pnpm/yarn convention. Build broke. Claude updated the manifest and kept going.

## When Your Own Blog Isn't Your Blog

jidonglab.com started as an AI news aggregator. GPT, Claude, Gemini news twice a day, automated. The pipeline ran fine.

Looked at honestly: this wasn't a blog. It was a content farm I happened to operate.

I'm running LLM Mixer, a saju fortune-telling app, a dental clinic site, a trading bot — all at the same time. I needed somewhere to show what I'm actually building. "What am I making with AI" should be the center of the portfolio, not a curated news feed.

Session 2 opened with the implementation plan pasted directly:

```
Implement the following plan:

# jidonglab Portfolio Hub Renewal

Convert jidonglab.com from AI news/blog site to
project portfolio hub.
```

`admin.astro` was 58KB — a single file handling auth, content management, and all admin UI. Claude read it, built a model of the existing structure, then added a Projects tab and Build Logs tab without breaking what was already there.

The data model: `scripts/project-registry.yaml` maps local git paths, `src/content/projects/` holds per-project YAML, and a `visible` field controls what's publicly shown.

Then came a `github api error 403`.

The admin projects GET endpoint was calling the GitHub API unnecessarily. The project data was already in local YAML files — no reason to burn API rate limits fetching it remotely.

```typescript
// Before: GitHub API call (burns rate limit)
const repos = await fetch(`https://api.github.com/user/repos`, { ... });

// After: Read local YAML directly
const registry = yaml.load(fs.readFileSync('scripts/project-registry.yaml'));
```

GitHub API calls removed entirely. Commit `bccb9c9`.

## The Build Logs Were Already Being Written

During one of the sessions, I asked:

```
How can we use the JSONL logs to document what happened in each project —
prompts, tool usage, what actually got built?
```

Claude Code saves every session to `~/.claude/projects/` as JSONL. Each line is one event:

```json
{"type":"user","message":"..."}
{"type":"tool_use","name":"Bash","input":{"command":"..."}}
{"type":"tool_result","content":"..."}
```

Parse this file and you get everything: every prompt, every tool called, every file created or modified. `scripts/parse-sessions.py` handles the extraction. `generate-build-log.sh` feeds the parsed output to Claude API and gets back a draft build log.

This post came through that pipeline.

It's not fully automated — reviewing and editing the draft still takes time. But "start from nothing and write a build log by hand" versus "review and refine a generated draft" are very different starting points. The data is already there. It just needs to be read.

## 9 Minutes, 39 Tool Calls, Payment Compliance Done

Session 4: 9 minutes, 39 tool calls. Task: handle TossPayments contract audit requirements for the saju app.

TossPayments is Korea's dominant payment gateway. Before activation they do a manual compliance review. I pasted the email from their review team directly into the prompt:

```
1. Please list at least one purchasable product or service on your homepage.
2. Please include business registration information in the footer.
```

Four requirements total. Two needed code changes. Two were outside the codebase.

The CSS was the culprit. `.constellationPage` had `overflow: hidden; height: 100vh` set — the business registration footer was sitting outside the viewport. Nobody could see it, including the compliance reviewers checking the live site.

The pricing section was already in the i18n files, all 8 locales ready. It just wasn't being rendered anywhere. One template change and it appeared.

The reason "paste the original email" beats "explain what needs to change": Claude gets exact context without translation loss. The compliance email took 9 minutes. Any paraphrase would have taken longer.

## What 827 Tool Calls Actually Look Like

Full breakdown across all 6 sessions:

| Tool  | Calls |
|-------|-------|
| Bash  | 400   |
| Read  | 142   |
| Edit  | 119   |
| Write | 116   |
| Grep  | 15    |
| Agent | 15    |
| Glob  | 10    |

Bash is nearly half. Build checks, server restarts, git status, process management — short commands that stack up fast. Edit + Write combined (actual code production) is still only half of Bash usage.

The 15 Agent calls are worth noting separately. Tasks like "translate 6 build logs to English" got delegated to sub-agents. They run in parallel without consuming the main session's context window. The longer a session runs, the more valuable this pattern becomes.

Two things showed up consistently across all 6 sessions.

Front-loading SPEC or a plan cuts exploration cost sharply. When the plan is in the prompt, Claude skips the "what are we building" phase and executes immediately. Session 2 — plan pasted, execution starts — is the clearest example.

Vague success criteria increased iteration count. "Fix everything and make all features work as intended" from late session 1 generated more back-and-forth than prompts with specific expected behavior. Same model, same codebase — the difference was how precisely "done" was defined.

> Better prompts aren't for Claude's benefit. They save your own time.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
