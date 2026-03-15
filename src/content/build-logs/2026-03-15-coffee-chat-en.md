---
title: "Building a Mentoring Platform with 10 AI Agents: 6 Sessions, 1,289 Tool Calls"
project: "coffee-chat"
date: 2026-03-15
lang: en
pair: "2026-03-15-coffee-chat-ko"
tags: [claude-code, multi-agent, nextjs, toss-payments]
description: "I built an AI mentoring platform using Claude Code with 10 parallel agents. 6 sessions, 1,289 tool calls, Toss Payments integration, and a QA loop that caught 136 issues."
---

Six sessions. 1,289 tool calls. 84 files modified, 26 files created. That is how much tool usage went into a single Claude Code project. It all started with one sentence: "Have 10 agents build a master plan."

**TL;DR**: Multi-agent is fast. But the more agents move, the less you do is a myth -- what actually happens is you have more to verify. QA works better as "find 5 at a time, repeat" than "find everything at once."

Coffee Chat is a 1:1 AI mentoring platform connecting game industry professionals with mentees. The tech stack: Next.js 16, Supabase, Toss Payments, Resend. When I started, it was practically an empty shell. Dependencies were not installed, there was no `.env.example`, and the README was the default create-next-app template.

Here is how Claude Code moved through it.

## 142 Tool Calls to Start: The Project Audit

The first prompt in session 1:

```
Do an initial project audit and make it runnable for local development.
Tasks:
1) Detect the tech stack and how to run/build/test
2) Install dependencies as needed.
3) Try to run the existing tests/build/lint. Fix straightforward issues.
4) Create or update README with exact local setup/run steps.
```

23 minutes, 142 tool calls. `Read` 55 times, `Edit` 36 times, `Bash` 27 times.

The build passed, but lint reported 22 errors and 40 warnings. Claude fixed the simple ones -- `prefer-const`, `<a>` to `<Link>` conversions -- and left architectural issues like `no-explicit-any` and `set-state-in-effect` alone.

> "The `no-explicit-any` and `set-state-in-effect` errors are architectural/design issues, not straightforward fixes. The build already passes cleanly."

On a fresh repo, removing blockers and deferring judgment on everything else is the right call. The prompt said "fix straightforward issues," and the agent respected that boundary.

The next prompt was a single line: `push it`. Auto-commit and push.

## "Have 10 Agents Build a Master Plan" -- Done in 6 Minutes

This one sentence in session 2:

```
masterplan -- have 10 agents build it
make the service fully functional
focus on design and usability
```

`TeamCreate` spun up 10 agents simultaneously. Each one took a slice: page/API routes, components, utilities/hooks, Supabase schema analysis. The session lasted only 6 minutes, with `Bash` 4, `Read` 3, `Task` 1, `TeamCreate` 1, `TodoWrite` 1 tool calls.

The real work carried over to session 3. I switched to Claude Opus 4.6 and focused on landing page conversion:

```
Goal: Progress coffeechat toward fast launch WITHOUT requiring Supabase CLI
Do:
1) Landing conversion improvements on / (mentee funnel)
2) Add a 3-metric stats strip above the fold (social proof placeholders ok)
3) Add a trust block: refund/no-show policy
```

Specifying "WITHOUT requiring Supabase CLI" was critical. Homebrew was blocked on the machine, so only tasks that could proceed without the CLI were included.

5 minutes, 43 tool calls. `Hero.tsx`, `TrustBlock.tsx`, `HomeClient.tsx` modified, plus 2 design documents generated.

## Context Ran Out 3 Times, but STATUS.md Kept Things Going

Session 4 ran 55 minutes with 216 tool calls. Something unusual showed up repeatedly in the prompt log:

```
This session is being continued from a previous conversation that ran out of context.
The summary below covers the earlier portion of the conversation.
```

The context window overflowed, and an auto-summary was appended to continue. This happened 3 times in session 4 alone. Four times in session 5. Similar numbers in session 6.

Work continued despite these breaks because Claude Code kept writing state to `docs/STATUS.md` and `docs/MASTER_PLAN.md`. When a new session started, a single "check current status" prompt was enough -- the agent read the docs and picked up exactly where it left off.

Session 4 also deployed three planner agents: `biz-planner`, `ux-planner`, `tech-planner`. Each wrote domain-specific documents under `docs/planning/`.

## The QA Loop: "Find 5 at a Time, Skip if None" Caught 136 Issues

Session 5 was the longest. 32 hours 43 minutes, 567 tool calls. The `Agent` tool was used 71 times.

A specific pattern kept repeating:

```
commit and run QA again, find 5 at a time, skip if there are none
check again, 5 at a time, are there really none left?
```

Not fixing everything at once, but finding 5 issues, fixing them, and running QA again. "Skip if none" served as the explicit exit condition. Running this loop 4 to 5 times caught 136 issues total.

Parallel execution was used too: "have 3 agents solve these separately." Two design agents crawled external sites (course platforms, social matchmaking sites) to compare color schemes and layouts.

But there was friction:

```
light mode only, no dark mode needed, for both phone and web
```

That was the request. Then later:

```
light mode isn't working?
```

Code was changed but either deployment did not happen, the cache was stale, or the changes were not properly applied. This exchange repeated 4 to 5 times in session 5 alone. The domain `coffeechat.it.kr` was explicitly mentioned with "open the browser and check."

```
open the browser yourself and check if the main page still has the beta popup,
what color is the background
nothing was actually fixed
```

If deployment verification is not explicitly included in the prompt, the agent changes code and moves on. "Verify it is deployed" needs to be part of the loop.

Later, the main color was also adjusted:

```
make the brown main color a trendier shade of brown, quality upgrade
```

And then:

```
5+ verified mentors / 2,000+ sessions completed / 4.8/5 average satisfaction
remove all the fake numbers
```

Placeholder numbers that were left in as "social proof placeholders ok" from the early sessions became technical debt that had to be cleaned up later.

## Toss Payments Integration: Terms of Service Came Before Code

Session 6, 23 hours 7 minutes, 311 tool calls. The opening prompt set the tone:

```
need to integrate Toss payments, but before getting API keys,
check all related pages and regulations and make sure we comply
```

"Regulations before keys" was stated explicitly. Claude built a checklist starting with terms of service, privacy policy, and refund policy pages:

- Terms of service: withdrawal limitation reasons must be specified
- Privacy policy: Toss Payments third-party data sharing must be disclosed, 2025 guidelines reflected
- Refund policy: requires a dedicated page

`/refund-policy/page.tsx` created, `terms/page.tsx` and `privacy/page.tsx` updated, refund notice added to `Pricing.tsx`, refund policy link added to `Footer.tsx`. Zero lines of payment code -- compliance came first.

Cron jobs were also registered in this session. Auto-completion, refund processing, weekly settlement, and auto-cancellation of unconfirmed bookings. All configured in `vercel.json`.

```
what cron jobs did you register? what is cron?
```

The user asked this directly. When agents take initiative and create things autonomously, a "summarize what you built" prompt becomes necessary afterward. The more agents move, the more "explain what you did" checkpoints are needed.

## 1,289 Tool Calls: Session-by-Session Breakdown

| Session | Duration | Tool Calls | Primary Work |
|---------|----------|------------|-------------|
| 1 | 23min | 142 | Initial audit, lint, README |
| 2 | 6min | 10 | Master plan with 10 agents |
| 3 | 5min | 43 | Landing conversion improvements |
| 4 | 55min | 216 | 3 planner agents, Phase 1-4 |
| 5 | 32h 43min | 567 | QA loop, design overhaul |
| 6 | 23h 7min | 311 | Toss payments, cron, coupons |

By tool: `Read` 328, `Bash` 324, `Edit` 244, `Grep` 110, `Agent` 97.

`Read` and `Bash` occupying the top two spots means the time spent reading and verifying before writing code is substantial. `Agent` at 97 calls reflects heavy use of sub-agents throughout the project.

## What Six Sessions Taught Me

Multi-agent is fast. Saying "have 10 agents build it" kicks off parallel processing immediately. But verifying and integrating those results is still a human job.

Even when context runs out, a single `STATUS.md` file is enough to restart. Documents maintain state. It is the documentation, not the code, that serves as the project's memory.

QA works better as "find 5, repeat" than "find everything at once." Specifying an exit condition prevents infinite loops.

> The more agents move, the less you do is wrong. The more agents move, the more you need to verify.

---

## Related Posts

- [Building a Multi-Agent LLM Orchestrator with Claude Code: 86 Sessions of Hard-Won Lessons](/posts/2026-03-15-LLMTrio-en)
- [Building an AI Trading Bot with Claude Code: 14 Sessions, 961 Tool Calls](/posts/2026-03-15-trading-bot-en)
- [Turning 105 Session Logs into Build Logs: A Claude Code Automation Pipeline](/posts/2026-03-15-portfolio-site-en)
