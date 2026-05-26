---
title: "18 Sessions, 302 Tool Calls: Orchestrating 6 Domains in One Day with Claude Code Parallel Agents"
project: "portfolio-site"
date: 2026-05-27
lang: en
pair: "2026-05-27-portfolio-site-ko"
tags: [claude-code, parallel-agents, automation, orchestration, build-log]
description: "18 sessions, 302 tool calls, 15 files created in one day. Parallel agent dispatch cut a 2–3 hour research job to 41 minutes — here's the pattern."
---

302 tool calls in a single day. 18 sessions across 6 completely different domains: startup funding strategy, dental ad SERP analysis, competition entry strategy, golf app deep research, P1 product daily reports. 15 files created, 9 modified.

**TL;DR**: The highest-leverage pattern was parallel agent dispatch in session 15. Four independent research agents ran simultaneously and finished the entire deep research brief in 41 minutes. Sequential would have been 2–3 hours. The critical detail that made it work: giving each agent an explicit output file path, not just a prompt.

## Spinning Up 4 Agents at Once

Session 15 was the pivot point of the day.

The brief was simple: research the Korean golf app market and the global swing analysis market, broken down by app category. Instead of running these searches one by one, I handed the entire brief to Claude and waited.

Claude dispatched four independent agents simultaneously:

- Agent "Korea golf matching apps" → `research_kr_matching.md`
- Agent "Global swing analysis" → `research_swing.md`
- Agent "Global golf matching" → `research_global_matching.md`
- Agent "Solo-founder monetization GTM legal" → `research_monetization.md`

Each agent ran in its own context, pulled sources from the web, and wrote directly to its assigned output file. Results came in as they completed:

```
[done] Global matching dossier — 4,769 words, 80+ source URLs
[done] Swing analysis dossier — 5,140 words, with confirmed/estimated/unverified labels
[done] KR matching dossier — saved
[done] Monetization/legal dossier — 4,199 words
```

Once all four files landed, Claude read them together and synthesized the final report. Total wall time: 41 minutes. Tool calls: 51.

The two sessions before this (12 and 14) both failed partway through — agents got killed mid-run. The fix was straightforward: sessions 12 and 14 gave agents a prompt only. Session 15 passed the brief as a file path and explicitly told each agent where to write its output. That's the entire difference between a failed parallel dispatch and a successful one.

If the agent doesn't know where to put its output, it either dumps everything inline or exits without saving. Explicit file paths turn a parallel dispatch into a reliable pipeline.

## The Chrome Headless PDF Pipeline

Five PDF reports were generated today. All five used the same one-liner:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless --disable-gpu \
  --print-to-pdf=output.pdf input.html
```

No wkhtmltopdf. No pandoc. No weasyprint. Just system Chrome.

This wasn't the plan originally. Session 15 included an attempt to install pandoc for converting the golf research markdown to PDF. It failed. The research output stayed as markdown files. That failed install is what cemented "Chrome headless is the reliable default" as a rule going forward.

The upside of HTML → Chrome → PDF is that CSS gives you precise control over the output:

```css
@media print {
  header, nav { display: none; }
  body { margin: 0; padding: 0; }
  @page { size: A4; margin: 20mm; }
}
```

Page breaks, A4 layout, font rendering — all controllable through CSS without any additional tooling dependency. The startup funding report came out at 10 pages, 2.5 MB. The competition strategy report at 13 pages, 2.9 MB. The P1 daily report at 4 pages, 522 KB.

## When the Orchestrator Gets the Complexity Wrong

One recurring friction point today: the orchestrator hook misclassifying task complexity and causing Claude to stall.

The workflow uses a four-level classification — `trivial / simple / standard / major` — and each level gates which tools and stages are allowed. Requests routed through an external relay (Hermes) occasionally got overclassified.

In session 13, writing a single `smoke.txt` file got classified as `major`. Claude explicitly self-corrected: "Reclassifying to trivial." In session 8, generating an HTML report got classified as `major`, which meant the session couldn't close without verifier and codex artifacts. Claude reclassified it down to `simple` and proceeded directly.

The correct rules are simple:

- No code changes → `trivial`
- Single file, under 30 lines → `simple`
- Writing an HTML report is writing one file → `simple`

The misclassification pattern was the heuristic reacting to keywords like "research" or "report" and bumping to `major`. The fix is making the heuristic check actual file change count, not topic keywords. Claude handled the self-correction gracefully, but the friction was real — each misclassification meant an extra round of output before the session could continue.

## The Codex Review Loop That Caught Two Real Bugs

Session 17 produced the P1 product daily report HTML. Session 18 ran a Codex read-only review against it and surfaced two blockers before the PDF was generated.

**Blocker 1**: The "Things to drop today" section listed specific product names — Daymoon, golf app, cigarette counter, pet widget, Open Design, trading bot. This is a P1 report. Non-P1 products shouldn't appear in the body by name.

**Blocker 2**: The date header showed `(Mon)`. May 26, 2026 is a Tuesday.

Both fixes were surgical:

- `line 365`: Replace the product name list with category labels — "non-P1 products / ideas pending validation / separate channel work"
- `line 229`: `(Mon)` → `(Tue)`

Two `Edit` calls, done. Then Chrome headless re-generated the PDF, and `pdftotext` confirmed the product names were gone from the output. Total: 19 tool calls, under a minute.

The Codex review pattern here is low-overhead quality control. Codex returns a structured blocker list. Claude works through it in order. The review itself costs little; the issues it catches are concrete and actionable, not stylistic opinions.

## What 302 Tool Calls Actually Looks Like

| Tool | Count |
|------|-------|
| Bash | 118 |
| Read | 59 |
| TaskUpdate | 28 |
| TaskCreate | 26 |
| Edit | 20 |
| Write | 18 |
| Agent | 14 |
| Grep | 10 |

Bash at 118 is the dominant cost. Most of it was repeated across three operations: PDF generation, `pdftotext` verification, file existence checks. Every PDF went through the same generate → verify loop, each loop touching Bash twice.

The Bash-to-Edit ratio is 118:20, roughly 6:1. That ratio tells you what kind of day it was. Not a coding day. A research, report generation, and data verification day. More execution cycles than source edits.

Agent at 14 is almost entirely session 15: four parallel dispatches plus follow-up synthesis calls.

Zero of the 18 sessions today were primarily about writing code. Every session was research, report generation, or document cleanup. The tool distribution reflects that exactly.

> 302 tool calls. The direction decisions were mine. Everything else — judgment, execution, synthesis — was Claude.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
