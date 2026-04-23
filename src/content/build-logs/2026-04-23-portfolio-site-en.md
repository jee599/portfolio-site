---
title: "Reverse-Engineering Claude Design's 422-Line System Prompt and Validating 66,745 Words with 5 Parallel Agents (201 Tool Calls)"
project: "portfolio-site"
date: 2026-04-23
lang: en
pair: "2026-04-23-portfolio-site-ko"
tags: [claude-code, multi-agent, claude-design, reverse-engineering, research-verification]
description: "How I ran 201 tool calls across 2 sessions to reverse-engineer Claude Design's system prompt and cross-validate a 66,745-word research doc with 5 parallel agents."
---

201 tool calls. Two sessions. A 66,745-word research document that would blow a single context window, and a 422-line system prompt from a tool that launched six days ago. Yesterday was dense.

**TL;DR** — Dispatched 5 parallel agents to cross-validate a 66,000+ word research doc and caught a reversed subject claim in the process. Then pulled apart Claude Design's published system prompt, reverse-engineered its internal architecture, and ported the reusable parts into a local CLI skill.

## Why 66,745 Words Can't Fit in One Context

The dental ad research directory at `/Users/jidong/dentalad/ads-research/` had accumulated 66,745 words across 24 documents — 12 V1 originals, 8 V2 verified versions, and 4 integrated summaries. Reading them sequentially in a single context isn't just slow; it blows the token budget entirely.

The fix: split by domain, dispatch five agents simultaneously.

```
1. Regulatory   — Korea AI Basic Law · FTC · Supreme Court · Medical Act
2. Competitors  — CareLabs + Top 5 domestic + global comparables
3. Platform     — Naver · Meta · ChatGPT market trends
4. Unit Econ    — cost structure · pricing · MRR model
5. Market Data  — CRM benchmarks · ROAS · LTV · TAM numbers
```

Each agent independently web-searched its domain and returned a verification report. Sequential execution would've taken four to five hours. Parallel brought it inside a single session.

## What the Agents Actually Caught

The most valuable finds weren't missing data — they were subtle factual errors that are easy to miss when reading linearly.

**Platform report: reversed subject.** The document claimed "ChatGPT blocked Naver." Wrong direction entirely. Naver blocked ChatGPT's crawler bots. The sentence was grammatically plausible in Korean; only an agent prompting specifically for "reasons this could be false" caught the reversal.

**Regulatory report: timing conflation.** The FTC virtual persona regulation was at the administrative notice stage, not enforcement. The 5x punitive damages provision had passed legislation in 2026 Q1, but the research doc conflated the announcement date with the enforcement date. In a live business context, that distinction matters significantly.

**Competitor report: new intel.** CareRabs — the dominant dental marketing platform in Korea — has been in active acquisition proceedings since October 2024. Nothing in the existing dossier mentioned this. An M&A process at the market leader changes the competitive landscape analysis considerably.

The pattern that made this work:

> Verification agents should be prompted to find reasons something could be wrong — not to confirm it's right.

"Confirm X is true" produces agreement bias. "Find reasons X might be false" produces actual verification. The prompting direction changes the output category.

## Pulling Apart Claude Design's 422-Line System Prompt

On 2026-04-17, Anthropic Labs released `claude.ai/design`. The same day, the system prompt appeared in the `elder-plinius/CL4R1T4S` GitHub repo: `ANTHROPIC/Claude-Design-Sys-Prompt.txt` — 422 lines, roughly 73KB.

The initial ask was "find Claude Design source code leaks." Short answer: there weren't any. The Claude Code TypeScript source (513,000 lines) had leaked via npm sourcemap on 2026-03-31, but that's unrelated — Design's React implementation hasn't surfaced publicly. What leaked was the system prompt and tool schema. That was enough.

Reverse-engineered internal structure from the prompt:

```
claude.ai/design (Next.js / React)
  ├── Live Preview iframe
  ├── Tweaks panel (palette / font / density)
  ├── Claude Opus 4.7 (model locked)
  └── Filesystem-based project workspace
```

The persona framing is precise: the model is configured as a **professional designer who uses HTML as a medium**, not a developer who writes HTML. The user is the creative director; the model is the practitioner. Everything — presentations, videos, prototypes — gets built in HTML. The key structural difference from standard Claude chat is the **filesystem-backed project workspace** with relative path references and cross-project isolation.

## Porting the Reusable Parts into a Local Skill

Live Preview and the Tweaks panel are host-dependent — those can't be reproduced in CLI. Four components can be:

- **Question methodology** — the 10 patterns Claude Design uses to extract context before generating anything
- **Context collection structure** — how it maps user intent to design decisions
- **Variation generation logic** — how it frames multiple directions without defaulting to one
- **AI-slop guards** — explicit rules to avoid generic output (excessive gradients, over-rounded corners, hollow icons)

Result: `~/.claude/skills/claude-design-lite/SKILL.md`. Invoking `claude-design-lite` now runs through the same context-gathering flow without loading the full system prompt each time.

The broader pattern: leaked or documented system prompts are behavioral specifications. You can replicate the core mechanic without the host environment. The interesting part of Claude Design wasn't the web UI — it was the context collection discipline and the variant generation structure.

## jidonglab.com Redesign: 4 Directions at Once

Immediately after the analysis, applied it. Generated four redesign directions in parallel into `~/jidonglab-redesign/`:

- `v1-notebook.html` — notebook aesthetic, editorial typography
- `v2-pro.html` — tech portfolio, dense information layout
- `v2-studio.html` — studio feel, light card grid
- `v3-labos.html` — experimental, system UI aesthetic

The `v2-pro` direction was the strongest fit. The copy direction that emerged from the review session:

> "Every day, documented. A year of commits, posts, and build logs on one screen. The slow days and the sprint days — none of it hidden."

That framing locked in the heatmap section direction: a GitHub-style activity grid that aggregates commits, blog posts, and build logs as a single daily count. Wiring up live GitHub API data is next session's work.

## Tool Usage Breakdown

Session 1 (dentalad research verification, 3h 12m):

| Tool | Calls |
|---|---|
| Bash | 31 |
| Edit | 23 |
| TaskUpdate | 18 |
| Write | 10 |
| TaskCreate | 9 |
| Agent | 5 |

Session 2 (Claude Design + redesign, 2h 5m):

| Tool | Calls |
|---|---|
| Edit | 37 |
| Bash | 24 |
| WebSearch | 11 |
| Write | 11 |
| Read | 8 |

Combined: Edit 60, Bash 55, 201 total tool calls. The `TaskCreate`/`TaskUpdate`/`Agent` spike in session 1 reflects parallel agent orchestration overhead — 5 dispatched agents, each tracked independently. The 11 WebSearch calls in session 2 were all Claude Design fact-checking: release date, repo source, Claude Code sourcemap incident timeline.

19 files created, 4 modified. The bulk: 5 verification reports (`verification/01–05.md`), the claude-design-lite skill file, and the 4 HTML redesign variants.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
