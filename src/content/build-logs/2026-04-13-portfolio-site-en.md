---
title: "288 SEO Pages, 3 Sessions, 207 Tool Calls: How Multi-Agent Claude Code Actually Works"
project: "portfolio-site"
date: 2026-04-13
lang: en
pair: "2026-04-13-portfolio-site-ko"
tags: [claude-code, subagent, seo, multi-agent, automation]
description: "Payment research, 288 auto-generated SEO pages, and a 2-week dead cron — all in one week. The exact workflow with tool call counts, no fluff."
---

288 SEO pages. Generated in a single session. That's not a headline — that's the actual output from 182 tool calls across roughly 4 hours of Claude Code work.

This week covered three separate projects across three sessions: payment integration research for a Korean payment gateway, generating 288 zodiac compatibility landing pages for saju_global, and debugging an email cron that had silently died two weeks ago. Total: 207 tool calls, 3 sessions.

The code was secondary. How I structured the Claude Code workflow was the actual work.

**TL;DR** For any task with significant scope: write the plan first, isolate in a git worktree, delegate to sub-agents, and keep the main thread as orchestration only. This pattern scaled to 288 pages without breaking.

## Why I Spent 39 Minutes on Payment Research Without Writing a Single Line of Code (Session 1)

The first session wasn't about building anything — it was a research conversation. Prompt:

```
What are the options for adding Korean payment processing? Free to start?
```

Three `WebSearch` calls later, Claude had mapped out Toss Payments, PortOne, KakaoPay, and NHN KCP with current pricing. When I pushed back on Toss being expensive, it drilled deeper: direct signup costs ₩220,000 onboarding + ₩110,000/year maintenance, but routing through PortOne can waive the onboarding fee entirely.

The pattern here is conversational narrowing. Reading search results directly is slower than iterating with a research partner who synthesizes on the fly. By the end, I'd shifted direction entirely — from payment integration to a ₩5,900/month subscription model for spoonai. The `brainstorming` skill kicked in automatically and worked through the implications before any implementation started.

14 tool calls. 39 minutes. No code written. That's a win — I didn't build in the wrong direction.

## 288 Pages in One Session: Sub-Agent Driven Development at Scale (Session 2)

This was the main event. The prompt:

```
In the saju_global project, implement 288 SEO compatibility landing pages.
Spec: docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md
```

**Why 288?** Zodiac compatibility requires combinations. 12 zodiac signs × 12 zodiac signs = 144 pairs. Flip gender order and you get 288 distinct pages. Each page needs unique content — otherwise search engines treat them as duplicate thin content. That's not a scale you can handle manually.

The workflow had three distinct phases.

### Phase 1: Write the Plan Before Touching Anything

The `writing-plans` skill triggered before any code was touched. The spec file path didn't match what was in the repo, so Claude ran Glob to find it, then did 20 Read calls to understand existing codebase patterns, then generated `docs/superpowers/plans/2026-04-10-seo-compatibility-pages.md`.

This step exists for one reason: sub-agent scope needs to be unambiguous. A vague plan means agents overlap, conflict, or duplicate work. A written plan with explicit file ownership prevents all three.

### Phase 2: Worktree Isolation

Before touching anything, Claude checked git status and created a worktree:

```bash
git worktree add .claude/worktrees/seo-compat-pages feature/seo-compat-pages
```

Writing 288 entries in one pass is the kind of operation that's painful to roll back. The worktree keeps `main` clean while you validate the approach. Merge only after the output is confirmed correct.

### Phase 3: Sub-Agent Delegation

The `subagent-driven-development` skill structured how tasks were broken up and dispatched. The main thread orchestrated. Sub-agents implemented. Content generation ran in the background:

```bash
nohup npx tsx scripts/generate-compat-content.ts > /tmp/compat-gen.log 2>&1 &
```

My actual messages mid-session:

```
Me: How's it going?
Claude: [checks log] 73/288 pages complete.

Me: Merge it and run step 2
Claude: [runs git merge, executes script twice]
```

I asked myself mid-session: *couldn't I just use the CLI for this?* Yes. The difference is judgment. The CLI executes. A sub-agent decides — if the script stalls, hits an API rate limit, or produces malformed output, it adapts without being asked.

### Tool Call Breakdown

| Tool | Count | Why |
|------|-------|-----|
| Bash | 111 | Script execution, log monitoring, git ops |
| Read | 20 | Understanding existing patterns |
| Agent | 17 | Sub-agent dispatch |
| TaskUpdate | 14 | Progress tracking |

Bash at 61% reflects what this session actually was: execution and monitoring, not editing. Total files created: 2 (`zodiac-compat-content.json` and the plan file).

## The Cron That Had Been Dead for Two Weeks Without Anyone Noticing (Session 3)

```
Users are in the subscriber list but emails aren't going out
```

13 minutes. 11 tool calls. 8 of them Bash.

The log trail told the story: last successful send was 2026-03-28, last archive 2026-03-30. Two weeks of silence with no error surfaced to anyone.

Root cause: a session-based cron registered with `CronCreate` had expired when the session ended. No `durable: true` flag set. `crontab -l` was empty, no launchd plist, no persistent scheduler anywhere.

Then additional context came in: "it runs via Cowork, not cron." That shifted the diagnosis — an inactive or error-terminated Cowork task, not a missing scheduler entry.

The lesson is blunt: **don't trust session-based crons for anything that needs to run when you're not there.** GitHub Actions or launchd are the right tools. Session crons evaporate with the session. Two weeks of missed emails is the concrete cost of that assumption.

## Full Stats

| Session | Time | Tool Calls | What Happened |
|---------|------|-----------|---------------|
| 1 | 39 min | 14 | Payment research, subscription planning |
| 2 | ~4 hours | 182 | 288 SEO pages |
| 3 | 13 min | 11 | Cron failure diagnosis |

Aggregate tool distribution: Bash(120), Read(23), Agent(19), TaskUpdate(17), TaskCreate(9). Two files created, one modified.

## Four Patterns That Held Across All Three Sessions

**Write the plan before touching code.** The 288-page session worked because sub-agent scope was defined in a document before any agent ran. Ambiguous plans produce overlapping, conflicting agents.

**Worktrees for experimental scale.** Any operation that's hard to roll back belongs in a worktree. Merge into main after validation, not before.

**Sub-agents need explicit file ownership.** The way to avoid agent conflicts is to assign each agent a non-overlapping set of files. If two agents can write to the same file, eventually they will — at the same time.

**Persistent schedules don't belong in sessions.** Session crons seem convenient until they're not. Put anything that needs to survive session end in GitHub Actions, launchd, or a proper cron daemon.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
