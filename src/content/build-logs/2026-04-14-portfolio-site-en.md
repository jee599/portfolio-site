---
title: "3 Claude Code Sessions, 207 Tool Calls: SEO Automation, Payment Research, and a 16-Day Silent Cron"
project: "portfolio-site"
date: 2026-04-14
lang: en
pair: "2026-04-14-portfolio-site-ko"
tags: [claude-code, subagent, seo, cron, automation]
description: "How I ran 3 Claude Code sessions across 3 projects in one day: 288 SEO pages generated, a payment provider myth busted, and a cron that silently died 16 days ago."
---

For two weeks, I blamed my spam filter. The real culprit was a cron job that had been silently dead since March 28.

**TL;DR** Three sessions. Three projects. 207 total tool calls. The biggest win was automating 288 SEO landing pages for a Korean astrology app. The most embarrassing discovery was a scheduler that had stopped sending emails 16 days before I noticed.

## The "Free" Payment Gateway That Wasn't

The first session started with a simple question:

```
What are the options for adding payments in Korea right now? Free ones.
```

Three WebSearch calls, one Read. Claude produced a table. TossPayments showed up as "no upfront cost." That looked promising, so I pushed further.

The real numbers surfaced: ₩220,000 signup fee, ₩110,000 annual management fee, 3.4% card processing fee. Not quite free.

The fix: route through PortOne (formerly I'mport). When you integrate a PG provider via PortOne, the signup fee is waived. You pay transaction fees only. Three more web searches confirmed this before I was confident enough to commit to the approach.

This was a research-only session. Fourteen tool calls, 39 minutes, no files written. The output was a decision: PortOne for the payment integration.

## How Do You Generate 288 Pages?

Session two was the main event. The goal: build 288 SEO-optimized compatibility landing pages for `saju_global`, a Korean astrology app.

The prompt was deliberately minimal:

```
Implement 288 SEO compatibility landing pages in saju_global.
Spec: docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md
```

The `writing-plans` skill fired first. Claude explored the entire codebase, mapped dependencies, and produced a structured implementation plan at `docs/superpowers/plans/2026-04-10-seo-compatibility-pages.md` before a single line of code was written. This matters — the plan becomes the contract that downstream subagents work against.

Then `subagent-driven-development` kicked in. Independent tasks get dispatched to separate agents, each with its own scoped context. After completion, both a spec-compliance review and a code quality review run automatically.

Midway through, I asked a reasonable question:

```
Can't we just use the CLI directly?
```

Good point. Instead of spawning agents for everything, we ran a TypeScript script directly from the terminal:

```bash
nohup npx tsx scripts/generate-compat-content.ts > logs/compat-gen.log 2>&1 &
```

Background execution, log monitoring. The key output file: `zodiac-compat-content.json` — a JSON with all 288 compatibility combinations.

**Worktree strategy**: all work happened in `.claude/worktrees/seo-compat-pages/`, keeping `main` clean throughout. When you're generating hundreds of files, branch contamination is a real risk. Worktrees eliminate it.

This session ran 182 tool calls over 92 minutes. Bash alone got called 111 times — mostly script execution and log checking.

## "Is It Still Running?" Three Times

Background processes have a UX problem: you don't know their state without checking.

During the content generation run, I asked the same question twice before it completed:

```
Is it still going?
Is it still going?
OK it's done — what did it actually do?
```

Each time, Claude read the log file and summarized the current state. This is the reality of background task management in Claude Code: no push notifications, no progress bars. You poll manually. The upside is that you can context-switch to other work and come back — which is exactly what happened with the third session.

Side conversations naturally emerged during the long session: email notification setup, domain consolidation from `coffeechat` to `fortunelab`. Big sessions always accumulate sidebar questions. 92 minutes is a long time to stay narrowly focused.

## The Cron That Died Sixteen Days Ago

Session three. One message:

```
Subscribers are on the list but emails aren't going out
```

Bash, check the logs. Last successful send: 2026-03-28. Today is April 13. Sixteen days of silence.

Diagnosis was fast:

```bash
crontab -l  # empty
# launchd plist: not found
```

The cause: the session cron created via `CronCreate` was registered without `durable: true`. When the session ended, the cron evaporated with it. The Cowork task it was meant to trigger — the `spoonai-daily-briefing` pipeline — had been sitting disabled the whole time.

The fix: re-enable the Cowork task and set the prompt to `run spoonai-daily-briefing skill`. The full pipeline comes back — crawling → article generation → images → deployment → email send.

The lesson is simple but easy to miss: a cron without `durable: true` is a temporary cron. If you need it to survive session restarts, you have to explicitly say so. I hadn't.

Eleven tool calls, 13 minutes. The fastest session by far.

## Session Stats

| Session | Duration | Tool Calls | Main Work |
|---------|----------|------------|-----------|
| Payment research | 39 min | 14 | PG provider evaluation |
| SEO page generation | 92 min | 182 | 288-page automation |
| Cron recovery | 13 min | 11 | Scheduler re-registration |

By tool type: Bash 120, Read 23, Agent 19, TaskUpdate 17. Bash's dominance reflects how much of this work happens at runtime — script execution, log reads, environment checks — rather than in file edits. Only one file was modified; two new files were created. Most of the work was ephemeral.

## The Real Cost of Switching Projects

Three projects in one day: `spoonai` → `saju_global` → `spoonai`. Each session started clean — either a `/clear` or a fresh terminal window.

The context switch cost is lower than it sounds. Every project has a `CLAUDE.md`, and Claude re-orients quickly from the first message. "Go to the spoonai folder" is enough to get directory structure, key files, and working state in a few reads.

The hard part is long-running background work. Scripts running in the background, crons registered in other sessions — these don't transfer. When you come back after a context reset, the only reliable way to know what's running is external state: log files, a `STATUS.md`, or just checking `ps`.

This is what the 16-day silent cron is really about. The cron wasn't broken — it was invisible. There was no persistent record that it had been registered, no health check, nothing to alert when it stopped. If you're running automation across sessions, you need some form of external state that survives session boundaries.

## What "Automation" Actually Looks Like

The 288-page SEO project sounds like a fully automated pipeline, but the workflow was messier than that:

1. Write a spec (done days before)
2. Have Claude write an implementation plan from the spec
3. Dispatch subagents for independent tasks
4. Realize a simpler approach (CLI script) is better
5. Run the script in the background
6. Poll manually three times
7. Review the output

Steps 4 and 6 are the honest parts. Automation doesn't eliminate human judgment — it compresses the time between decision points. The 92-minute session would have been a week of manual work.

The `writing-plans` → `subagent-driven-development` skill sequence is worth understanding. The plan step matters because it forces Claude to read the actual codebase before writing code. Without it, you get implementations that don't fit the existing structure. With it, the subagents have a shared contract to work against.

## Checklist for Multi-Session Projects

If you're running Claude Code across multiple projects or sessions, these patterns hold:

- **External state for long-running tasks**: log files, `STATUS.md`, anything that survives a `/clear`
- **`durable: true` on crons**: if you need it to persist, say so explicitly
- **Worktrees for large file generation**: keeps `main` clean when you're creating hundreds of files
- **Plan before code**: `writing-plans` before `subagent-driven-development` gives subagents a spec to work against
- **Research sessions are cheap**: 14 tool calls to validate a payment provider assumption is worth it

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
