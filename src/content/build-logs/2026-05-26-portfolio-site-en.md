---
title: "4 Parallel Claude Code Agents Completed a Golf App Market Study in 41 Minutes"
project: "portfolio-site"
date: 2026-05-26
lang: en
pair: "2026-05-26-portfolio-site-ko"
tags: [claude-code, multi-agent, parallel, research, automation, workflow]
description: "18 sessions, 302 tool calls, 4 parallel agents. How a 2×2 research matrix got done in 41 minutes—and why Codex cross-validation caught two logic errors before delivery."
---

Four AI agents ran simultaneously and produced 15,000+ words of structured market research in 41 minutes of wall-clock time. That's enough for a solo developer to map an entire market space and make product decisions in a single afternoon. Here's exactly how the workflow ran, where it broke, and what caught the errors before they shipped.

**TL;DR**: Parallel agents cut sequential research time by ~75%. But agents have no shared context, so everything—scope, exclusions, output paths, user profile—has to be explicit in every prompt. And cross-validation isn't optional: Codex caught two logic errors in final deliverables that I missed on the first read.

## What Actually Happens When You Launch 4 Agents at Once

The `golf-app-research` task needed a 2×2 matrix: two products (matching app / swing analysis) × two markets (Korea / global). Sequential agents at ~10 minutes each adds up fast. Parallel dispatch doesn't.

```python
Agent("Korea golf matching apps research", run_in_background=True)
Agent("Global golf matching apps research", run_in_background=True)
Agent("Swing analysis apps market research", run_in_background=True)
Agent("Solo-founder monetization GTM legal research", run_in_background=True)
```

All four launched in a single message. First completion notification: 14 minutes. Last: 41 minutes. Each agent wrote independently to its own output file:

- `outputs/research_kr_matching.md`
- `outputs/research_global_matching.md`
- `outputs/research_swing.md`
- `outputs/monetization_legal.md`

One consolidation pass afterward produced the final report. Wall-clock time matched running a single agent sequentially—but the research depth was 4×. While the agents ran, a separate session worked on report structure in parallel.

The critical constraint: agents start with fresh context. No memory of prior sessions, no awareness of other running agents, no shared project state. If you don't embed the project scope, exclusion list, and previous decisions into each agent's prompt, they'll make different judgment calls about what to include. Every agent in this session received a path to `brief.md` and an explicit user profile: `"Solo-founder, Seoul/Gyeonggi, AI product, single-developer build."` Without that, the Korean and global research outputs would have been written for different hypothetical users.

## When the Orchestrator Misclassifies Complexity

The most friction today came from workflow stage misclassification. The golf app research session was initially tagged `trivial` by the orchestrator. A P1 daily report session was over-classified as `major`. Both caused the Write hook to block file creation.

The fix is always the same: explicit reclassification at the start of the first response.

```bash
source ~/.claude/workflow/lib/state.sh
state_set complexity standard
state_set stage implementing
```

Two commands and file writes unlock. The classification logic is straightforward:

| Complexity | Condition |
|------------|-----------|
| `simple` | Single output file, complete spec |
| `standard` | 2–5 file changes, small feature, clear scope |
| `major` | Parallel agents needed, or 6+ file changes |

Getting this wrong forces unnecessary plan/codex loops (over-classification) or bypasses validation entirely (under-classification). Both outcomes are worse than the 30 seconds it takes to reclassify explicitly. The practical fix: add `complexity: standard` directly into research prompts so the orchestrator doesn't have to infer it.

## Codex Caught Two Bugs I Didn't

**Bug 1: The Internal Contradiction**

A dental advertising SERP report had an executive summary stating no external medical platforms were detected. Three sections below, the detailed findings showed Goodoc appearing 7 times. Direct contradiction in the same file.

I missed it on first read. Codex flagged it in the cross-validation pass.

The repair prompt went into `claude_consistency_repair.md` with exact replacement text:

```
Fix: executive summary line 7
from: "외부 의료 플랫폼이 모두 미검출"
to:   "광고·플레이스·심의필 미검출 + AI 브리핑 검출 + 굿닥 7회 검출"
```

Applied with the `Edit` tool in under 2 minutes.

**Bug 2: Internal Context in a Client-Facing Report**

A P1 daily report included a "things to drop today" section that listed out-of-scope product names: Daymoon, golf app, tobacco counter. Internal planning notes that had no business appearing in a deliverable. The report recipient would have seen working context that should have stayed internal.

Codex flagged it. `Edit` tool fixed it in 2 minutes.

**The pattern that makes this reliable**: generate the report first, then send the diff plus source to Codex for a read-only cross-validation pass. Logic contradictions and scope violations surface consistently because the validator operates on the output with fresh eyes—no attachment to the generation decisions. Separating the generation session from the validation session is the key.

## The Only PDF Pipeline That Works in This Environment

Seven reports generated today, all through the same three-step flow.

**Step 1: Generate HTML with inline CSS**

The `Write` tool produces a self-contained HTML file. Inline CSS keeps PDF rendering predictable—no external stylesheets, no loading failures, no font substitutions.

**Step 2: Convert with Chrome headless**

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless --disable-gpu \
  --print-to-pdf=output.pdf \
  input.html
```

**Step 3: Verify with pdftotext**

```bash
pdftotext output.pdf - | grep -c "required_keyword"
```

pandoc, wkhtmltopdf, weasyprint, and md-to-pdf were all confirmed missing from the current environment. Chrome headless is the only working PDF converter here. Once the pipeline is established, subsequent reports only need content changes—the conversion step stays identical.

Generated PDFs ranged from 521KB to 2.9MB, 4 to 13 pages depending on content density.

## 18 Sessions, 302 Tool Calls: The Full Breakdown

| Tool | Count | What it did |
|------|-------|-------------|
| `Bash` | 118 | PDF conversion, keyword verification, workflow state updates |
| `Read` | 59 | Existing style references, previous report checks |
| `TaskUpdate` / `TaskCreate` | 54 | Parallel agent state tracking |
| `Edit` | 20 | Codex-flagged corrections |
| `Write` | 18 | New report generation |
| `Agent` | 14 | Parallel research agent dispatch |
| `Grep` | 10 | Text location lookups |

`Read` at 59 is the most interesting number. It reflects a consistent pattern: reference existing implementations before writing new ones rather than generating from a blank slate. Output quality is reliably higher this way.

`Write` shows 18 calls against 15 generated files. The gap comes from pipeline artifacts—verifier reports and smoke test files—mixed into the deliverable count.

One session in the log has 0 tool calls: Session 11 responded to `Reply exactly CLAUDE_SMOKE_OK` with `CLAUDE_SMOKE_OK`. A Hermes communication channel ping to verify routing was intact. Nothing else.

## What This Scales To

Parallel agents work when research domains are genuinely independent. The 2×2 matrix was well-suited: Korean market research doesn't depend on global market research, and matching app analysis doesn't share state with swing analysis. Each agent can run to completion without waiting for the others.

What doesn't scale without careful prompting: consistent output quality across agents. Because each agent starts with no memory of the others, there's no natural convergence toward a shared framework unless you build it into the initial prompts. The `brief.md` approach—a shared project brief embedded in every agent prompt—is the practical solution. One file, referenced by path, gives all agents the same baseline.

The validation layer isn't optional overhead. Both errors Codex caught today were in reports that would have shipped without it. The math is obvious: 5 minutes of cross-validation against 45 minutes of parallel research. The only reason to skip it is if you're certain your generation pipeline produces error-free output—and today demonstrated that it doesn't.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
