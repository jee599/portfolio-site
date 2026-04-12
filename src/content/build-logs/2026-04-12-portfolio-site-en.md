---
title: "288 SEO Landing Pages from 5 Lines of Input — Claude Code Multi-Agent Automation"
project: "portfolio-site"
date: 2026-04-12
lang: en
pair: "2026-04-12-portfolio-site-ko"
tags: [claude-code, seo, automation, subagent, saju_global]
description: "Generated 288 SEO compatibility landing pages using Claude Code's writing-plans + subagent-driven-development skill chain. 171 tool calls, 0 manual code."
---

171 tool calls. 67 hours 26 minutes of session time. My total input: five lines of text.

That's the summary of how I generated 288 SEO landing pages for the `saju_global` project. I didn't write a single line of code directly. The entire implementation ran through Claude Code's skill chain, with me showing up at three checkpoints to type "looks good."

**TL;DR** The `writing-plans` → `subagent-driven-development` skill chain can fully delegate large-scale content generation. You set the direction, agents do the rest — including planning, branching, scripting, executing, reviewing, and merging.

## Why 288 Pages, and Why Automate It

`saju_global` is a Korean astrology app. Compatibility readings between zodiac signs (12 × 12 = 144 pairs × 2 directions = 288 unique combinations) are high-traffic, long-tail SEO targets. Each page needs unique structured content — not just a template swap.

If I wrote each page manually at 30 minutes per page, that's 144 hours. I spent roughly 30 minutes total, including monitoring.

The spec was already written: `docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md`. The question was just execution.

## From Spec to Plan: What `writing-plans` Actually Does

My opening prompt was exactly this:

```
Implement 288 SEO compatibility landing pages in the saju_global project.
Spec: docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md
```

Claude fired the `writing-plans` skill first. It didn't just read the spec — it explored the existing codebase (20 Read calls, 4 Glob calls, dozens of Bash calls) to understand actual file structure, naming conventions, and existing patterns before writing a single line of the plan.

This matters. A plan built only from the spec describes what to build. A plan built from the spec *plus* the existing code describes what to build *and how it fits into what already exists*. The resulting plan landed at `docs/superpowers/plans/` with bite-sized tasks, dependency order, and clear acceptance criteria.

After the plan was ready, Claude asked: "Subagent-Driven (recommended) or Inline?" I typed `1`.

## The Execution Layer: `subagent-driven-development`

The `subagent-driven-development` skill took over. It:

1. Checked the `main` branch state
2. Created a `seo-compat-pages` git worktree
3. Initialized a task tracker
4. Started dispatching fresh subagents per independent task

The core of the work was a content generation script. Claude launched it as a background task:

```bash
nohup npx tsx scripts/generate-compat-content.ts > /tmp/compat-gen.log 2>&1 &
echo "Started PID=$!"
sleep 3
head -20 /tmp/compat-gen.log
```

Critically, it didn't tail the log and wait. It registered this as a `TaskCreate` background task and continued with other work while waiting for a completion notification. The session wasn't blocked. Long-running work ran in parallel with other tasks.

This pattern — background script + `TaskCreate` + completion callback — is how the skill chain handles work that takes hours without requiring you to babysit it.

## My Role in 171 Tool Calls

Here's every meaningful input I made during the entire session:

1. Initial task prompt (with spec path)
2. `1` — choosing subagent-driven mode
3. `merge it yourself then run the script again` — trigger worktree merge + second script run
4. `is it going okay?` × 2 — status checks
5. Domain/email follow-up (unrelated thread — more on this below)

Zero of the 171 tool calls were initiated by me.

## Tool Usage Breakdown

Bash dominated at 59% — mostly background script execution, log checks, and git operations. The 17 Agent calls represent 17 fresh subagent dispatches. Each subagent ran in its own context, executed a specific task, and returned only results to the main thread. That's why the main context stayed clean across a 67-hour session.

| Tool | Count | % |
|------|-------|---|
| Bash | 101 | 59% |
| Read | 20 | 12% |
| Agent | 17 | 10% |
| TaskUpdate | 14 | 8% |
| TaskCreate | 7 | 4% |
| Glob | 4 | 2% |
| Write | 3 | 2% |
| Skill | 2 | 1% |

Bash at 59% says something important about this task: it was more "execute and verify" than "write code." The agents were primarily running scripts, checking output, confirming file counts, and validating data shape.

## The Full Skill Chain Flow

```
User prompt (1 line)
  └─ writing-plans skill
       └─ Codebase exploration (Read/Glob/Bash)
       └─ Plan file created (docs/superpowers/plans/)
            └─ subagent-driven-development skill
                 └─ git worktree created
                 └─ Task tracker initialized
                 └─ Subagent dispatch × 17
                      └─ Individual task execution
                      └─ Spec compliance review
                      └─ Code quality review
                 └─ Worktree merge
```

Once this chain runs, the human only appears at checkpoints. Type "is it going okay?" and you get a task tracker summary. The chain handles the rest.

## The Failure Mode: Mixing Contexts Breaks Everything

Mid-session, while the background script was running, I dropped in unrelated topics: a domain email notification ("you were supposed to send payment status emails every morning") and a domain consolidation request ("merge everything under fortunelab").

Claude responded twice with some version of `I'm confused — what exactly do you want me to do?`

The cause is straightforward. When an unrelated context lands in the middle of an active multi-task session, the model doesn't know whether to respond to the ongoing work or the new request — especially when the new message is short and context-dependent (`manage it from Gabia`, `what does this have to do with coffeechat?`). These messages only make sense with prior context, and in a 67-hour session, context compression had already kicked in and dropped earlier conversation chunks.

The fix: don't mix threads. New topic = new session. If something comes up while a background task is running, open a fresh session and let the current one finish.

## What Got Built

- `apps/web/data/zodiac-compat-content.json` — structured content for all 288 compatibility combinations
- `docs/superpowers/plans/2026-04-10-seo-compatibility-pages.md` — the implementation plan Claude generated
- Worktree `STATUS.md` — per-task progress tracker showing completion state

288 pages. Each with unique content. Generated, reviewed, and merged without a human writing a single function.

## Takeaways

**The skill chain works at scale.** `writing-plans` → `subagent-driven-development` is purpose-built for large content generation tasks. The plan phase produces a structured task list; the subagent phase executes it without holding the main context hostage.

**Background scripts + TaskCreate is the right pattern for long jobs.** Don't tail logs in-session. Register the process as a background task and let the notification system tell you when it's done.

**Bash at 59% means this was an execution task, not a coding task.** When the ratio is that high, you're not writing software — you're orchestrating a pipeline. Claude Code handles both, but understanding which mode you're in helps you structure the session correctly.

**One session, one topic.** Multi-hour sessions with context compression are fragile when you inject unrelated requests. The compression is non-negotiable — the session discipline is under your control.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
