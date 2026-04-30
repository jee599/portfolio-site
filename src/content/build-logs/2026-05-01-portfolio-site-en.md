---
title: "12 Parallel Sub-Agents, 66 Agent Calls, 8 Posts Published — 3 Sessions, 335 Tool Calls"
project: "portfolio-site"
date: 2026-05-01
lang: en
pair: "2026-05-01-portfolio-site-ko"
tags: [claude-code, automation, devto, subagent, auto-publish]
description: "335 tool calls across 3 sessions. Ran 12 sub-agents in parallel for dental ad market research, auto-published 8 DEV.to posts, and learned when parallel agents break."
---

335 tool calls. 66 of them were `Agent`. That's the highest ratio I've ever hit in a single week.

The work spanned April 23–30, three sessions, two completely different domains: developer content publishing and dental advertising market analysis. Here's what actually happened.

**TL;DR** — Used the `auto-publish` skill to ship 8 DEV.to posts, dispatched 12 parallel sub-agents to produce 8 HTML market research reports, hit a `git push` rejection from CI drift, and found 8 duplicate files left behind by agents that "failed" but didn't. 119 Bash calls + 66 Agent calls defined this cycle.

## How a Throw-Away Request Became a 3-Part DEV.to Series

Session one started with a casual ask: "find 4 popular recent AI GitHub projects and write blog posts about them on DEV.to."

Four standalone posts about four unrelated projects would have no narrative thread. DEV.to's algorithm rewards series continuity, and readers follow series. Restructuring as a 3-part series was the better call.

Fired up the `auto-publish` skill and ran Phase 1 in keyword mode, collecting four projects:

- `andrej-karpathy-skills`
- `hermes-agent`
- `OpenClaw`
- `opencode`

Phase 2 produced the series architecture:

```
Series: The 2026 AI GitHub Playbook
Part 1 — Skills: When a Markdown File Got 100K Stars
Part 2 — OpenClaw: The Local Gateway Nobody Asked For
Part 3 — opencode: When Your Terminal Becomes an Agent
```

Part 1 published immediately. Parts 2-3 went up as drafts (`published: false` via the DEV.to API). This pattern is useful for series work — you fill the publishing queue while keeping editorial flexibility. DEV.to holds drafts indefinitely without a scheduler.

Session one tally: 11 Agent calls, 96 Bash, 23 TaskUpdate. When you're automating a publishing pipeline, more time goes into pipeline verification than actual writing. That ratio is expected, not a problem.

## Dispatching 12 Sub-Agents Against a Market No One Had Mapped

Session two was a domain pivot. The ask: analyze the Korean dental/medical AI advertising market — trends over the last 5 years, 1 year, and 3 months, plus Naver algorithm changes.

That scope, done serially, would take two hours minimum. The answer was parallel dispatch: 12 sub-agents, each owning a specific research slice.

The split:

- **Agents 1–3**: Channel-by-channel trend breakdown — 5yr, 1yr, 3mo
- **Agents 4–6**: Korean AI medical advertising firms, categorized by service type
- **Agents 7–9**: Naver algorithm evolution — C-Rank, D.I.A.+ changes
- **Agents 10–12**: Real deliverables and portfolios from individual agencies

When 12 agents finish simultaneously, results arrive in bulk. The core work was synthesizing that into structured HTML reports. Output: 8 files — `TREND-COMPARISON-REPORT.html`, `AI-AGENCIES-DEEP-REPORT.html`, `AI-AGENCIES-PRIMER.html`, and five supporting documents.

The primer ended up being the most useful artifact. It translates technical Naver concepts into plain business language:

- C-Rank → "a score measuring how seriously you focus on one topic area"
- D.I.A.+ → "does this content match what the user was actually searching for?"

Concept clarification comes first. Strategy recommendations follow. That ordering matters — the report structure mirrors how a client would actually absorb the information.

Session two: 47 Agent calls out of 85 total. More than half. Sub-agents weren't a support tool here — they were the main execution unit.

## The git Push Rejection Nobody Wanted

Session three: 5 DEV.to posts covering Codex and GPT Image 2. Research first, then 5 agents writing in parallel. Clean until the commit.

```
 ! [rejected] main -> main (fetch first)
error: failed to push some refs
```

GitHub Actions had been auto-committing CI runs while I worked locally. The local branch was behind. Fix:

```bash
git pull --rebase
git push
```

`--rebase` instead of merge keeps the history linear — no merge commits cluttering the log. In repos with active CI automation, this pattern comes up regularly. The rebase habit is worth building early.

The second problem was subtler. Five agents ran in parallel, and several appeared to fail mid-run. They hadn't. They'd created their output files and stopped reporting. Result: 8 duplicate files on disk.

I spot-checked all of them, kept 5, cleaned up 3. But this is a recurring failure mode with parallel agents. The fix is explicit naming conventions in the dispatch prompt:

```
File naming must follow this exact format: YYYY-MM-DD-{slug}-en.md
```

Without that constraint, each agent picks a name based on its own judgment. When agents share a workspace, that becomes a collision problem. Pin the convention, don't rely on inference.

## What 66 Agent Calls Actually Means

Across three sessions: 119 Bash, 66 Agent.

High Bash counts mean lots of execute-verify-retry cycles — running commands, checking outputs, adjusting. High Agent counts mean the work decomposed into independently delegatable units.

This cycle skewed heavily toward Agent. Parallel research and parallel writing — both would have taken 2–3x longer without delegation.

> Sub-agents are not a speed hack. They only work when task boundaries are real.

Direction decisions and quality judgment belong in the main context. Telling an agent "write a good post" produces generic output. "Write about this topic, with this structure, in this tone" produces something usable.

The constraint specificity is the real skill. The agent is execution. You're still the architect.
