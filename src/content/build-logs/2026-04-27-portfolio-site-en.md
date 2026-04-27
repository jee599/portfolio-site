---
title: "12 Parallel Subagents, 444 Tool Calls: Running 3 Projects in One Day with Claude Code"
project: "portfolio-site"
date: 2026-04-27
lang: en
pair: "2026-04-27-portfolio-site-ko"
tags: [claude-code, subagent, automation, multi-agent]
description: "3 sessions, 444 tool calls, 93h 39min logged. DEV.to series, 6 research reports, and a multi-language redesign — all in one day via parallel subagent dispatch."
---

444 tool calls. 3 sessions. 93 hours and 39 minutes of logged context. All in one calendar day.

One session published a three-part DEV.to series on trending AI GitHub projects. Another produced six browser-ready HTML market research reports on Korea's dental advertising landscape. A third ran live PayPal transaction tests, pulled Japanese and Southeast Asian market data across 136 sources, and pushed a site redesign across 10 languages.

Three different projects. Three different domains. All running concurrently.

**TL;DR** Parallel subagent dispatch is the core lever. Spinning up 12 agents simultaneously collapses work that would take a full day into about 2 hours. But more agents also means more noise — without a validation layer, false positives scale with agent count.

## "Post Some AI GitHub Project Analyses to DEV.to" — One Prompt, Three-Part Series

The first session started with a casual request:

```
analyze ~4 trending AI projects from GitHub and post articles to dev.to
```

Claude Code ran web searches to find trending projects as of April 2026: `andrej-karpathy-skills` (16K stars), `hermes-agent`, OpenClaw (295K stars), and opencode. Rather than writing four separate posts, it proposed restructuring them as a series: *The 2026 AI GitHub Playbook*.

Part 1 published immediately. Parts 2 and 3 went up as DEV.to drafts, queued for scheduling.

Published: `https://dev.to/ji_ai/how-a-markdown-file-hit-16k-stars-skills-in-2026-36hi` (DEV.to id=3542024, 2026-04-23 14:55 UTC)

There were exactly three user interactions in that entire flow: the initial prompt, "make it around 3 parts," and "go ahead." Web search, structure proposal, content generation, API publishing — all autonomous.

One behavior worth noting: an existing file `claude-code-channels-vs-openclaw-en.md` was already in the project. Claude Code detected it and approached OpenClaw from a different angle, linking internally rather than duplicating coverage. That judgment call wasn't made by a human.

Midway through the same session, a separate issue surfaced. A quality gap between April 25 and April 26 posts on spoonai prompted patches to `SKILL-2-publish.md` and the `self-critique.mjs` validation loop. Two projects, one session. 191 tool calls — Bash 96, Agent 11.

## 12 Agents in Parallel: Market Research That Would Have Taken All Day Finished in 2h 26min

Session two was a dental advertising research project. The prompt:

```
research every company doing AI-assisted dental/medical advertising and write a report. use 10+ subagents
```

Twelve subagents launched in parallel, each assigned a non-overlapping domain:

- Korean AI medical advertising landscape (8 categories, 60 companies)
- Naver C-Rank / D.I.A.+ algorithm changes and their effect on medical content
- Active dental clinic blog case studies from real operators
- 5-year / 1-year / 90-day trend comparisons

Output: six HTML reports, all browser-ready.

- `TREND-COMPARISON-REPORT.html`
- `AI-AGENCIES-DEEP-REPORT.html`
- `AI-AGENCIES-PRIMER.html`
- `AI-AGENCIES-EXAMPLES.html`
- `AI-AGENCIES-EVIDENCE.html`
- `AI-DENTAL-TELEGRAM.md`

Evidence from each agent was tagged with a reliability tier. "Real name + quantitative data (5 stars)," "initials + rich metrics (4 stars)." One agency, `Howon & Company`, returned direct links to actual client case studies. Another, `Inblog`, surfaced a live dental clinic blog (`heritagedental.inblog.io`) as a working reference.

The structural key to making parallel dispatch work is **domain separation**. If multiple agents explore the same topic, results overlap and merging becomes expensive. Pre-partition the problem space so each agent has an exclusive slice, and you can concatenate outputs directly.

63 tool calls. Agent 35 times. 2 hours 26 minutes. The serial equivalent would have consumed most of a workday.

## Telegram Message → DB Query → Live PayPal Test → Market Data → Design Push

Session three started as a Telegram message:

```
has anyone visited or paid for the saju project?
```

The Telegram plugin connects directly into Claude Code's session context. A DB query ran immediately: 30 cumulative payments (₩171,000), no new payments since March, 87 sessions still arriving through April. Toss payment confirmed working. LS Pay dead — declined the fortune-telling category. PayPal live keys configured but never tested with a real transaction.

The next message:

```
spin up one agent each for Japan and Southeast Asia — figure out how to make money there
```

Four agents ran in parallel in the background:

- `JP fortune market data` → `jp-market-data.md`
- `SEA fortune market data` → `sea-market-data.md` (136 inline sources)
- `Viral fortune video pattern decode` → `viral-formula.md`
- `Top-converting fortune site references`

While the agents ran, the PayPal live endpoint got a direct test: a real $1.99 order created in the DB, approval URL issued, results written to `scripts/paypal-live-test.sh`.

One agent result flagged a real bug: `common.json:3` had `運命研究所` while `countries.ts:142` still read `FortuneLab`. Brand inconsistency across two files. An actual fix was needed.

Another agent raised a false positive: "Thai users can see the ₩ symbol." Reading the code directly, ₩ rendering lives inside the `toss` namespace — Korean checkout only. Thai users route to a PayPal-hosted page and never encounter ₩. More agents means more noise. Without a validation layer, scaling agent count scales false positives at the same rate.

After market data came back:

```
update the design
```

i18n message files across 10 languages, `page.tsx`, `paywall/page.tsx`, and `globals.css` — all updated. 190 tool calls, Bash 92, Edit 25.

## Tool Usage Across 3 Sessions

| Session | Duration | Tool Calls | Top Tools |
|---------|----------|-----------|-----------|
| Session 1 (DEV.to + spoonai) | 75h 58min | 191 | Bash 96, Agent 11 |
| Session 2 (Dental ad research) | 2h 26min | 63 | Agent 35, Bash 9 |
| Session 3 (Saju global) | 15h 15min | 190 | Bash 92, Edit 25 |
| **Total** | **93h 39min** | **444** | Bash 197, Agent 53 |

44% of all tool calls were Bash. 12% were Agent. Fifty-three agent dispatches drove the parallel research that defined these sessions.

## Tool Choice Is Strategy

Agents are most efficient in research-heavy work. Wide search surface, parallel collection, and even if individual agents produce errors, the aggregate result usually holds.

For code changes, direct `Edit` outperformed agents every time. Twenty-one i18n files got updated in 25 `Edit` calls — no agent coordination needed.

More agents also means more false positives. The Thai ₩ symbol flag was concrete: an agent raised an issue that a 30-second code read dismissed. Without a validation layer over agent output, noise grows with scale.

The pattern across these three sessions: use agents when the search space is large and results can be validated by inspection. Use direct tools when the action space is small and precision matters.

> Domain separation determines output quality. Tool choice determines throughput.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
