---
title: "144 Tool Calls, 5 PDFs in One Day: How Claude Code Became a Report Factory"
project: "portfolio-site"
date: 2026-05-26
lang: en
pair: "2026-05-26-portfolio-site-ko"
tags: [claude-code, automation, pdf, report-generation, multi-agent]
description: "71 Bash calls, 5 professional PDFs, 10 Claude Code sessions. A breakdown of the Chrome headless pipeline, Hermes relay pattern, and session isolation strategy that made it work."
---

71 out of 144 tool calls were Bash. Nearly half of all AI operations in a day, just to run one command:

```bash
chromium --headless --no-sandbox \
  --print-to-pdf="report.pdf" \
  --print-to-pdf-no-header \
  file:///path/to/report.html
```

That number represents something concrete: five deliverable PDFs across three different domains — government startup support strategy, dental advertising SERP analysis, and AI data contest strategy — produced in a single working day across 10 Claude Code sessions.

**TL;DR** Chrome headless turns an HTML-to-PDF pipeline into something Claude Code can execute reliably at scale. Pair it with keyword validation via `pdftotext`, session isolation for revisions, and an explicit relay architecture, and you get a workflow that compounds — each iteration faster than the last.

## Why Half of All Calls Were Shell Commands

The bottleneck isn't writing. It's validation.

Here's the core pipeline pattern that every session followed:

1. Read existing report style (3–5 `Read` calls)
2. Write the HTML report (`Write` × 1)
3. Convert to PDF via Chrome headless
4. Validate required keywords are present
5. Update workflow state

Step 4 is what inflated the Bash count. For session 8 — the AI data contest strategy report — four specific Korean government dataset keywords had to appear in the final PDF: 경기도 공공데이터, 보건의료빅데이터, 지식재산 데이터, 공공조달데이터. Not style requirements. These were submission requirements — missing any one meant disqualification.

The validation loop ran multiple times per session:

```bash
pdftotext report.pdf - | grep -c "보건의료빅데이터"
```

Write HTML → convert → verify → find missing keyword → edit HTML → convert again → verify again. That's 4–6 Bash calls per report for conversion and validation alone, multiplied across five reports plus revision sessions.

## Five Reports Across Ten Sessions

**Session 1**: `2026-05-25_gov_startup_support_realistic_strategy`
10-page public startup support strategy guide, 2.5 MB. First-pass generation from a provided brief.

**Session 2** (13 tool calls): Revision
Codex had reviewed session 1 and flagged two items. A5 and B5 had an ambiguous phrase about direct cash support — "직접 현금 미확인". Fixed to a precise, audit-ready phrasing: "직접 현금성 지원은 1차 스크리닝에서 미확인 — 공고 첨부 확인 필요" (direct cash support unconfirmed at first screening — check attached announcement). Two lines, one isolated session.

**Session 3**: Failed
`API Error: The socket connection was closed unexpectedly` at Bash call 19. Claude was running a Python curation script for a news intelligence pipeline. Connection dropped mid-run. No output saved. More on this below.

**Session 4** (17 Read calls): `2026-05-26-medical-dental-ads-daily`
Daily dental advertising SERP analysis HTML. Read-heavy because the existing daily format required parsing multiple reference files before writing anything. Session 4 alone accounted for 17 of the day's 44 total Read calls.

**Sessions 5–6** (20 tool calls): Consistency repair
Two errors surfaced: a misclassified detection status in the executive summary, and inconsistent confidence level notation inside the HTML. Both fixed in one targeted revision session.

**Session 7** (5 tool calls): Anonymization
A specific hospital name had leaked into `competitive-serp-observations.md`. Five tool calls: read the file, locate the instance, replace with an anonymized description, verify. Clean and contained.

**Session 8** (18 tool calls, 8 minutes): `2026-05-26_ai_data_contest_strategy_report`
13-page AI data contest strategy, 2.9 MB. Most demanding keyword validation of the day — four required terms, each verified post-conversion.

**Session 9** (17 tool calls, 8 minutes): `2026-05-26_contest_prize_difficulty_mvp_playbook`
Deeper follow-on to session 8. Same domain, more complex content — same session time and one fewer tool call. The pattern was already established.

**Session 10**: State archiving and wrap-up.

## "You Are Claude CLI. Hermes Is Only the Relay."

Every session prompt contained this line.

Hermes is a Telegram bot that relays user requests to Claude CLI. It doesn't generate code, write reports, or make architectural decisions. Claude CLI does the work; Hermes delivers the message.

This sounds like a simple role label. The behavioral effect is not simple.

Claude has a tendency to drift into "orchestrator mode" when a task feels complex — it starts planning, proposing sub-agents, and architecting pipelines instead of executing. The identity statement prevents that drift at the start of each session.

Session 8 is the clearest example. Claude initially classified the task as `major` complexity. In this project's workflow, that triggers a full plan-orchestrator pipeline — slower, heavier, more overhead. With the identity statement in context, Claude self-corrected: "The actual work is single-file generation from a fully-provided spec — this is closer to `simple`." Correct classification, direct execution, 8 minutes.

The relay architecture also means session state lives in files, not in context. The workflow state machine at `~/.claude/workflows/{project-slug}/current/state.json` tracks stage, task ID, and artifact paths. Each session reads inputs from files and writes outputs to files. When a session ends — or crashes — the state is preserved.

## Session Isolation: 30% Overhead That Saves More Than It Costs

Three of ten sessions were revision-only. The instinct is to handle fixes in the same session that created the work — it feels more efficient. It isn't.

Each revision session was triggered by a dedicated prompt file:

```
Read and execute /path/to/claude_consistency_repair.md
Read and execute /path/to/claude_named_leak_repair.md
```

The prompt file defines exactly what to change and where. Claude reads the spec and executes it. No ambient context from the original generation session. No risk of touching adjacent code that wasn't mentioned.

Compare that to an open-ended "fix the inconsistencies" prompt given to the original session. Claude might correct the target lines and then "improve" three nearby paragraphs it deemed inconsistent. The repair scope expands uncontrollably.

**Token efficiency**: Session 7 — the anonymization fix — was 5 tool calls. In the original session 4 context, that same task would have cost more: the context was loaded with competitive analysis, multiple report references, and domain data. Starting fresh stripped all that away.

**Auditability**: separate sessions produce separate, reviewable diffs. Session 2's fix is a clean two-line change. Mixing generation and revision produces a larger, harder-to-audit diff.

## Session 3: What a Socket Failure Teaches You

Session 3 hit `API Error: The socket connection was closed unexpectedly` at Bash call 19. Claude was running a Python script for an intelligence curation pipeline — a monolithic batch operation that processed multiple sources in sequence. Connection dropped. No output saved.

Session 8 ran to completion in 8 minutes with 18 tool calls.

The difference is granularity.

**Session 3**: one Python script, handles everything internally, single point of failure at the socket level. If the connection drops at step 15 of 20, nothing from steps 1–14 is recoverable.

**Session 8**: discrete Bash calls — one Chrome headless invocation per conversion step, one `pdftotext` call per keyword batch. Each step produces or verifies a file. If the connection drops after step 4, the output from steps 1–4 is still there.

For repetitive pipeline operations — convert, validate, convert, validate — the safer design:

1. Each iteration as a separate tool call, not a loop inside a script
2. Intermediate state written to files after each step
3. Session size under 30 tool calls where possible

This isn't just about crash recovery. When a validation fails in a discrete Bash call, you know exactly which step failed. When it fails inside a monolithic script, you're reading logs.

## The Tool Distribution, Decoded

| Tool | Count | Share | What It Represents |
|------|-------|-------|-------------------|
| Bash | 71 | 49% | Conversion + validation loops |
| Read | 44 | 31% | Style reference before every write |
| Edit | 16 | 11% | Surgical revisions — targeted line replacement |
| Grep | 8 | 6% | In-session content verification |
| Write | 5 | 3% | Initial HTML creation, one per report |

Write at 5 means five new documents were created. Every other operation was verification, conversion, or targeted modification.

**Edit (16) vs. Write (5)** is the key ratio to internalize. Even for 500-line HTML files, Edit is preferable to Write for revisions. Edit replaces only the targeted lines. Write overwrites the entire file, which can introduce subtle whitespace and encoding drift — particularly in reports with complex CSS or embedded data tables.

**Read at 44** breaks down as 3–5 reads per session for style reference, plus additional reads in repair sessions. Session 4's 17 reads reflect a domain where the format is established across multiple source files — Claude had to read all of them before writing anything useful.

**Grep at 8** covers in-session content checks. Distinct from the `pdftotext | grep` validation calls, which ran via Bash.

## Compounding Returns on Pattern Repetition

Session 8: 18 tool calls, 8 minutes.
Session 9: 17 tool calls, 8 minutes. Deeper report, same domain.

Once a domain pattern is established — template structure, required keywords, existing style reference files — the marginal cost of a new report approaches the cost of the conversion pipeline itself. Claude doesn't spend tool calls discovering format or requirements. Those are encoded in the prompt file and existing report references.

The first report in a new domain costs 25–35 tool calls: understand the format, discover the style, validate against requirements, iterate. By the third report in the same domain, that drops to 15–18. By the fifth, you're near minimum viable session size.

The practical implication: invest in clean prompt files and reference documents early. Session 7's 5-call anonymization was possible because `claude_named_leak_repair.md` was precise. Session 8's 8-minute deep report was possible because session 1 had already paid the format discovery cost.

## What Runs Tomorrow

Daily: dental ads SERP analysis. Weekly: contest report revisions before submission deadline.

The main variable between runs is whether keyword requirements change. If they do, it's a one-line update to the prompt file. The pipeline doesn't change.

The one thing worth improving after session 3's failure: the Python-based curation pipelines. The fix is to break the monolithic script into discrete steps that write intermediate results to files, and call each step as a separate Bash invocation. Same logic that made session 8 reliable applies directly.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
