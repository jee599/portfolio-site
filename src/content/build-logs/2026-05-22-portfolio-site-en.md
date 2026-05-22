---
title: "86 Tool Calls, 7 Sessions, 3 Domains: What a Real Claude Opus 4.7 Production Day Looks Like"
project: "portfolio-site"
date: 2026-05-22
lang: en
pair: "2026-05-22-portfolio-site-ko"
tags: [claude-code, automation, opus, orchestration, build-log]
description: "7 Claude Code sessions, 86 tool calls, 3 domains in one day. Socket errors, Stop hook false positives, complexity misclassification — and how a file-based pipeline absorbs all three."
---

The socket dropped at the worst possible time. Session 1, fourteen tool calls deep, right before the final output landed — `The socket connection was closed unexpectedly` — and the artifact came out half-finished. That was the first of three things that broke on May 22nd.

**TL;DR** On 2026-05-22, Claude Opus 4.7 ran 7 Claude Code sessions, 86 tool calls across three completely different domains: SpoonAI content intelligence, dental advertising research, and a technical MVP report. This post documents three specific failure modes — a socket drop, a Stop hook false positive, and a complexity misclassification — and how a file-based pipeline handles them without full restarts.

## Three Domains in One Day

The session breakdown for May 22:

- **SpoonAI (sessions 1–2, 5, 6)**: Content intelligence collection from raw crawl data, HTML report generation, marketing strategy consultation
- **Dental advertising (sessions 3–4)**: SERP-based research on medical advertising regulations and current strategy trends
- **Tech report (session 7)**: MVP feasibility analysis for a cigarette inventory recognition mobile app

These domains have nothing in common except the pipeline. Each one follows the same structure: read raw data → refine and structure → output HTML or Markdown. Claude Opus 4.7 runs this loop repeatedly. What changes is the domain knowledge required, the source files, and the target output format.

The numbers: 7 sessions, 86 total tool calls, average 12.3 calls per session, average session duration ~4 minutes. That average is skewed by session 2 (2 calls, effectively instant — just a verification pass). Excluding verification-only sessions, the working sessions averaged around 20 tool calls each.

The heaviest session was session 3: 41 calls, 47.7% of the entire day's tool call volume. It ran SERP collection scripts, updated 5 knowledge base files, and hit a timeout before finishing.

## Session 1: A Socket Error That Wasn't Actually a Problem

Session 1 was reading SpoonAI's raw crawl JSON — several thousand lines of scraped content — and organizing it into general-audience and expert-level content candidates. The plan was straightforward: 14 Bash calls to run the collection scripts, 1 Read to verify the output. Then, with one tool call left:

```
API Error: The socket connection was closed unexpectedly.
For more information, pass `verbose: true` in the second argument to fetch()
```

The session ended. The artifact was incomplete.

Here's the thing: it wasn't actually a problem. The files the pipeline had written were already on disk. Session 2 picked up immediately — not to redo the work, but only to verify it. Two Read calls, schema compliance check on the MD and JSON outputs. Result: PASS.

The session split happened naturally. Session 1 broke; session 2 picked up the verification. Because intermediate state lived in files — not in memory — the handoff was clean. No "start from scratch." The next session just needed to know what files to check.

This is the core purpose of `current/state.json`. It's not a log file. It's a prompt for the next session: here's what exists, here's what still needs to happen, here's where to start. When a session fails mid-run, the state file makes the recovery path identical to the success path.

## Sessions 3–4: A 41-Call Session That Timed Out

Session 3 was the most intensive of the day. Dental advertising research: pull SERP results for medical ad regulation queries, parse them, update 5 knowledge base files with structured findings.

41 tool calls. Bash for SERP collection scripts, Read for KB file context, Edit for incremental KB updates, Grep for content markers. The session ran until it hit a natural boundary from the orchestration layer — not an error, just a timeout imposed by the multi-session structure.

Session 4 picked up where session 3 stopped: HTML report generation only. The KB files were already updated. Session 4's job was to read those files and produce structured HTML output. 7 Bash, 4 Read, 3 Grep, 1 Write.

The pattern mirrors sessions 1–2. A computation-heavy session interrupted at a natural boundary, followed by a focused output session. The key: the long session writes to files continuously rather than batching everything into a final write. This means an interruption at any point still leaves a usable, partially-complete artifact.

The split isn't a fallback — it's the intended architecture. Large sessions break at natural boundaries. Designing for that means the recovery path is the same as the success path.

## Session 6: The Stop Hook That Fired on Zero Lines of Code

Session 6 was a pure consulting session. SpoonAI's `/newsite` product direction — marketing framing, feature prioritization, positioning feedback. No files touched. No code written. The session output was a Markdown analysis with structured recommendations.

At session end, the Stop hook fired:

```
Stop hook feedback:
Found 3 debug/TODO leftover(s) in working tree. Clean them up or confirm intentional before stopping.
```

The hook had found `console.log` calls in `scripts/post-to-x.ts`, `scripts/send-email.ts`, and a log statement in `app/api/subscribe/route.ts`. None of these were written in session 6. The scripts use `console.log` as their primary mechanism for printing to stdout. Removing those logs would break the CLI utilities.

The fix: Grep to map the distribution of flagged lines across the working tree, confirm which files they were in, prove that session 6 wrote zero lines to any of those files. The hook cleared.

But the underlying issue remains. The Stop hook rule is global — it scans the entire working tree for `console.log`, `TODO`, and `debugger`. It can't distinguish between "code written this session" and "intentional existing patterns in unrelated files." For CLI utilities that depend on stdout output, the hook will always fire.

The fix is per-project exception paths in the hook configuration — patterns like `scripts/*.ts` that should be excluded from the `console.log` scan. That's the next item on the backlog.

The broader lesson: hooks that inspect full working tree state need a baseline. Without knowing what the tree looked like before the session started, a hook can't determine what changed. Until that's implemented, false positives are unavoidable in projects with intentional log calls.

## Declaring a Complexity Reclassification

Both sessions 6 and 7 triggered complexity reclassifications mid-session.

The orchestration setup auto-injects complexity context on every user prompt: `complexity=simple, stage=implementing`. This classification comes from heuristics — file count estimates, task keywords, domain type.

Session 6 was flagged as `simple` but was actually `trivial`. No files would be touched. Pure text analysis. The `simple` classification implies a verification pass at the end, which adds overhead to a session with no code changes.

Session 7 was more instructive. The task: generate a single HTML report from already-prepared research data. Single file, defined content, known output format. That's `simple`. The orchestration hook initially classified it as `major` — likely because the task description mentioned "MVP analysis," "multi-domain research," and referenced multiple source files as inputs.

The reclassification in session 7:

> "The complexity classification is wrong. Generating a single HTML file from existing research data is `simple` scope. Reclassifying and proceeding without plan-orchestrator or codex cross-verify."

After that declaration: 4 Bash calls, 2 Write calls. Done.

If the `major` pipeline had run as classified: plan-orchestrator call, `research.md` generation, code-verifier pass, codex cross-verify. That's 3–4 additional orchestration steps for an output that took 6 tool calls.

The reclassification isn't just about efficiency. It's about not creating process theater — running verification loops that can't catch anything meaningful in a single-file content write with no logic. The rule: classify by actual scope, declare misclassification immediately when you see it, switch to the lighter path. Don't wait until halfway through a `major` pipeline to notice the mismatch.

## Breaking Down 86 Tool Calls

Full distribution across 7 sessions:

| Tool | Count | % | Primary use |
|------|-------|---|-------------|
| `Bash` | 47 | 54.7% | SERP scripts, state updates, directory ops |
| `Read` | 23 | 26.7% | Raw JSON, KB files, style references |
| `Write` | 6 | 7.0% | Final HTML and Markdown output |
| `Edit` | 6 | 7.0% | Incremental KB file updates |
| `Grep` | 4 | 4.7% | Log scanning, content marker search |

Bash at 54.7% is the expected distribution for a data-heavy pipeline. SERP collection scripts, Python crawler invocations, `state.sh` helper calls, directory checks — all route through Bash. In a pure UI or code-writing session, that ratio would drop significantly.

Write ran 6 times, but each call was substantial: either a 20K+ HTML report or several thousand words of structured Markdown. The per-call output volume was much higher than the count suggests.

Session 3's 41 calls (47.7% of the day's total) isn't an anomaly — it reflects the actual work distribution. That session handled the most "real" computation: external SERP queries, multi-file KB updates, content parsing. Tool call volume tracks complexity accurately here.

## Three Failure Modes, Three Recovery Patterns

**Socket errors** recover through file-based state. The pipeline writes to disk continuously — it doesn't hold state in memory between tool calls. When a socket drops, the next session reads `current/state.json`, sees what's been written, and picks up from there. No rollback, no retry loop. The failure is absorbed structurally.

**Hook false positives** recover through evidence. When a Stop hook fires on code you didn't write, the response is: grep the file distribution, trace the provenance of flagged lines, prove the session delta is zero. The hook clears. The longer fix — per-project exception paths for CLI utility logs — goes on the backlog.

**Complexity misclassification** recovers through early declaration. Auto-classification heuristics are wrong sometimes. When they're wrong, state the reclassification explicitly and switch paths. One sentence of overhead. Don't run `major` pipeline steps on `simple` tasks because the initial classification said so.

Smooth automation runs are the exception. On any given day, at least one of these failure modes shows up. The architecture's job isn't to prevent failures — it's to make recovery cheap. File-based state, evidence-driven hook clearing, and explicit reclassification declarations all serve that goal.

The reason to log it: the next time a socket drops mid-session, or a hook fires on an unchanged file, or a classification drifts high, the recovery pattern is already documented.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
