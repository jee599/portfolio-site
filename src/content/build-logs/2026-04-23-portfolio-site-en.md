---
title: "Reverse-Engineering Claude Design's 422-Line System Prompt and Parallel-Verifying 66,745 Words with 5 Agents"
project: "portfolio-site"
date: 2026-04-23
lang: en
pair: "2026-04-23-portfolio-site-ko"
tags: [claude-code, multi-agent, claude-design, skill, research, reverse-engineering]
description: "201 tool calls, 5h 17min, zero lines of code written. Five parallel agents caught 12 errors in 66,745 words. Then I reverse-engineered Claude Design's leaked 422-line system prompt into a local skill."
---

201 tool calls. 5 hours 17 minutes. Two sessions. Zero lines of production code written.

All of it went to research verification, system prompt reverse engineering, and redesign prototyping. It's the kind of day that looks unproductive from the outside but changes how you work for months afterward.

**TL;DR** — Dispatched 5 parallel agents to fact-check a 66,745-word dental ad research document and caught 12 errors, including a subject/object swap that completely inverted a key claim about ChatGPT and Naver. Then reverse-engineered the leaked 422-line Claude Design system prompt and distilled the portable parts into a `claude-design-lite` local skill. Applied it immediately to generate 4 redesign directions for jidonglab.com.

## What Happens When You Split 66,745 Words Across 5 Simultaneous Agents

The `dentalad/ads-research/` directory had accumulated 66,745 words across 24 documents — 12 V1 originals, 8 V2 verified revisions, and 4 consolidated reports. V2 had already overturned 12 claims from V1: Naver's Cue: recommendation algorithm was assumed to be active, but it shut down on 2026-04-09; blog production costs were corrected from ₩26,000 to ₩1,700 + labor. The question was whether V2 itself was reliable.

Rather than reviewing sequentially (a 4–5 hour job), I split by domain and dispatched five agents simultaneously:

```
Regulation   → Korea AI Basic Act · FTC · Supreme Court · Medical Act
Competitors  → CareLabs + Top 5 domestic + global benchmarks
Platforms    → Naver · Meta · ChatGPT ecosystem trends
Economics    → Cost structure · pricing · MRR model
Market       → CRM benchmarks · ROAS · LTV · TAM numbers
```

Each agent had one constraint: "fact-check report, under 900 words." That ceiling matters — without it, agents expand their output and context windows saturate. The entire verification run finished within a single session.

### The Errors That Only Surface When You're Looking for Failures

Most of the 12 issues were stale data or outdated assumptions. But the most significant was a subject/object inversion in the platform research.

The document claimed: *"ChatGPT blocked Naver."*

What actually happened: **Naver blocked ChatGPT's web crawler.** The subject and object were completely reversed. The sentence was grammatically plausible in Korean; only an agent explicitly prompted to find reasons something could be false caught the reversal.

Two other findings worth noting:

- The FTC virtual persona advertising rule was listed as "in effect" — it was still at the administrative notice stage
- CareLabs (dominant dental marketing platform in Korea) has been in an active acquisition process since October 2024 — the agent surfaced this independently from outside the existing research corpus

After verification: updated `FINAL-REPORT.md`, `EXECUTIVE-SUMMARY.md`, `RISKS.md`, and generated `verification/01–05.md` as audit trails.

> The right prompt for a verification agent isn't "confirm this is true" — it's "find every reason this could be wrong."

## What Claude Design's 422-Line Leaked System Prompt Actually Tells You

Session 2 started from a single question: *"find leaked Claude Design code."*

`claude.ai/design` launched on 2026-04-17 as an Anthropic Labs product. Within days, the system prompt surfaced in the `elder-plinius/CL4R1T4S` GitHub repo: `ANTHROPIC/Claude-Design-Sys-Prompt.txt` — 422 lines, roughly 73KB. The commit timestamp matched the launch date exactly.

To be precise about what leaked and what didn't: no React source code was exposed. The Claude Code TypeScript leak (513,000 lines via npm sourcemap on 2026-03-31) was a separate incident — Design's frontend implementation hasn't surfaced publicly. What the 422 lines reveal is role definition and tool schemas. That's the behavioral layer, not the implementation — but it was enough.

Core identity established by the system prompt:

```
Role:        Professional designer using HTML as the primary medium
Output:      HTML is the only native format
Base model:  Claude Opus 4.7 (hardcoded)
Environment: Filesystem-based project workspace with relative path references
```

The sharpest difference from regular Claude.ai chat is **filesystem-based project isolation**. Context is scoped per project; files are referenced by relative paths. This isn't prompt engineering inside a chat window — it's a distinct web product, gated to Pro/Max/Team/Enterprise plans.

### Distilling It Into a Local Skill

Not all 422 lines are portable. Live Preview and the Tweaks panel require the actual web interface. What's extractable are the behavioral patterns: how it collects context, how it generates variants, and what it guards against.

I analyzed the 10 question patterns Claude Design uses when gathering requirements and embedded them into `~/.claude/skills/claude-design-lite/SKILL.md`. The skill focuses on four things:

- **Question technique** — structured elicitation before generating anything
- **Context collection** — what to capture about audience, function, and constraints
- **Variation generation** — how to produce meaningfully distinct directions, not cosmetic variants
- **AI-slop guards** — explicit checks against the visual patterns that make AI interfaces immediately recognizable as AI interfaces

## Building the Skill and Using It Immediately

The test case was jidonglab.com itself.

Four directions generated simultaneously into `~/jidonglab-redesign/`:

| File | Direction |
|------|-----------|
| `v1-notebook.html` | Notebook / dev-log aesthetic |
| `v2-pro.html` | Technical portfolio, dense layout |
| `v2-studio.html` | Studio / agency feel |
| `v3-labos.html` | Experimental, system UI |

`v2-pro` was the strongest direction. The follow-up request: visualize actual commit, post, and build log data as a heatmap. That produced the copy direction for the redesign:

> "Every day, documented. A full year of commits, posts, and build logs on one screen. The slow days and the sprint days — none of it hidden."

GitHub API integration is next session's work.

## Tool Usage Breakdown

| Tool | Session 1 | Session 2 | Total |
|------|-----------|-----------|-------|
| Edit | 23 | 37 | 60 |
| Bash | 31 | 24 | 55 |
| Write | 10 | 11 | 21 |
| TaskUpdate | 18 | — | 18 |
| Read | — | 8 | 14 |
| WebSearch | — | 11 | 11 |
| TaskCreate | 9 | — | 9 |
| Agent | 5 | — | 5 |

The 27 TaskCreate/TaskUpdate calls are parallel agent orchestration overhead — 5 dispatched agents, each tracked independently. The 11 WebSearch calls were all Claude Design fact-checking: release date, repo source, Claude Code sourcemap incident timeline. 19 files created, 4 files modified.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
