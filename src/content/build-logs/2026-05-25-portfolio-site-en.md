---
title: "I Scanned 481 YAML Files and Found Zero Errors — The Bug Was a Missing React Component"
project: "portfolio-site"
date: 2026-05-25
lang: en
pair: "2026-05-25-portfolio-site-ko"
tags: [claude-code, debugging, build-failure, vercel]
description: "Vercel reported a YAML parse error pointing to a specific file and line. Both were wrong. 481 files scanned, zero broken. The real cause: a missing CountUp.tsx."
---

The Vercel build failure came with a specific error message. A specific file. A specific line number. A specific column. It was wrong about all of them.

**TL;DR** — `YAMLException` pointing at a markdown file was a red herring. Scanning all 481 content files found zero YAML errors. The actual cause was `HomeContent.tsx` importing a `CountUp.tsx` component that didn't exist on disk. 11 sessions, 399 tool calls, roughly 75 minutes of Claude Code work — and this debugging session was the most expensive of the week.

## The Error Message Pointed at an Innocent File

Two consecutive Vercel deployments were canceled on April 27–28. The build log was specific:

```
YAMLException: incomplete explicit mapping pair; a key node is missed
  at 2026-04-05-furiosa-ai-rngd-commercial-launch-en.md line 3, column 277
```

Opening that file: line 3 was 204 characters long. Column 277 didn't exist.

The error message cited coordinates that didn't match the current file content. Something was off.

First decision point: patch the file the error was pointing at, or investigate further? Chose the latter.

## Scanning 481 Files Proved the Error Was Stale

Instead of modifying the file Vercel accused, ran a full scan against all 481 markdown files in the content collection:

```bash
node -e "
const matter = require('gray-matter');
const files = glob.sync('src/content/**/*.md');
let errors = 0;
files.forEach(f => {
  try { matter.read(f); }
  catch(e) { console.error(f, e.message); errors++; }
});
console.log('Total:', files.length, 'Errors:', errors);
"
```

Result: **Total: 481, Errors: 0**

Every file parsed clean. A batch fix in commit `3095c96` (April 14) had already resolved all YAML issues across the content directory. Running the same files through `js-yaml` confirmed the same result: zero errors.

The YAML exception Vercel was reporting wasn't happening now. It was leftover output from a previous failed deployment mixed into the current log stream.

## The Local Build Told a Different Story

With YAML ruled out, the next step was reproducing the failure locally with `npm run build`:

```
Error: Cannot find module './CountUp'
  at HomeContent.tsx:3:1
```

`HomeContent.tsx` was importing a `CountUp` component. The file didn't exist. Turbopack — Next.js 16's default bundler — failed on the missing module reference and the build exited.

The fix was two files:
- Update how `HomeContent.tsx` referenced `CountUp`
- Create `CountUp.tsx`

`npm run build` completed. 480 static pages generated. Committed as `8aa059b`, pushed, Vercel auto-deploy resumed.

Session 1 ran 76 `Bash` calls. Session 2 ran 100. That's 176 shell invocations across two sessions. One local build run would have been a faster diagnostic than scanning all 481 files.

> An error message pointing at a specific file is a hypothesis. Run the build locally before acting on it.

## Why the Same Prompt Was Sent Twice

Session 1 fixed the problem and ran `git push`. Session 2 started with the identical prompt from the user. The session 1 working path explains why:

```
~/spoonai-site/.claude/worktrees/confident-bartik-976291/components/CountUp.tsx
```

Work happened inside a git worktree — an isolated working directory that `git worktree add` creates. From the user's perspective, it wasn't obvious whether the fix had actually merged into `main` or which remote it landed on. Git worktrees don't make their push destination immediately visible without checking.

Session 2 took a different approach. It invoked the `systematic-debugging` skill first, then validated YAML parsing in layers: `gray-matter`, then `js-yaml`. In the process, it found things session 1 didn't look for:

- `validate-content.mjs` line 559 was overwriting files with `matter.stringify` — a silent mutation risk
- `content/daily/2026-04-10-en.md` was missing its frontmatter block entirely — a separate, unrelated bug

Two sessions, same starting point, different paths, different findings. Session 1 found and fixed the root cause quickly. Session 2 dug into the YAML path and surfaced secondary issues. The overlap wasn't wasted — both runs contributed something.

## The Orchestrator Keeps Getting Complexity Wrong

A pattern repeated across the week's 11 sessions: the task orchestrator classifying work as `major` (triggering the full plan → implement → verify → codex-review pipeline), only to have Claude CLI override it to `simple`.

Session 4 (SpoonAI growth signal research):

> "The orchestrator gate misclassified this as `major` requiring full plan/verify/codex pipeline. But this is just producing two artifact files per a well-defined spec — no code, no architecture, no migrations. Reclassifying to `simple`."

Session 9 (PDF report generation):

> "Formatting pre-existing research into two files (HTML + PDF) is `simple`."

The orchestrator appears to use file count as its main complexity signal. That's the wrong metric. Writing five output files from a completed research spec doesn't require architectural decisions. It can't cause data loss or state corruption. Complexity isn't about how many files you touch — it's about the nature of the change.

The right signal: does this require irreversible state changes? Does it involve structural decisions with downstream consequences? Code-free artifact generation is `simple` regardless of how many output files it produces.

The week saw four reclassifications from `major` to `simple`. Each one saved unnecessary pipeline overhead.

## 399 Tool Calls: Where the Time Actually Went

The week's 11 Claude Code sessions covered Vercel build debugging, SpoonAI content intelligence artifacts, dental advertising research updates, and two HTML/PDF reports.

| Tool | Count | Share |
|---|---|---|
| `Bash` | 252 | 63% |
| `Read` | 68 | 17% |
| `Edit` | 17 | 4% |
| `WebFetch` | 11 | 3% |
| `Grep` | 11 | 3% |
| `Write` | 10 | 3% |
| `TaskUpdate`/`TaskCreate` | 19 | 5% |

`Bash` at 63%. Local builds, Python-based YAML scanners, headless Chromium for PDF conversion — the shell handled most verification work. `Edit` appeared only 17 times. Roughly 15 verification steps per actual file change.

The HTML-to-PDF pipeline was a single line:

```bash
chromium --headless --print-to-pdf=output.pdf --no-pdf-header-footer input.html
```

13 pages, 1.2MB, no external libraries. Built in session 9. Session 10 (Codex) caught a table-of-contents numbering mismatch — two-line fix, PDF regenerated. Session 10 total: 1 minute, 15 tool calls.

Session durations ranged from 1 minute (sessions 3 and 10) to 13 minutes (session 2). The longest session was the one chasing the wrong hypothesis. Stale error messages are expensive.

> Check build log timestamps before acting on error messages. A log entry from a previous deployment can cost you an entire debugging session.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
