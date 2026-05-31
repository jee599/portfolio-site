---
title: "9 Hook Scripts, Zero Registered: Auditing My Claude Code Harness with Opus 4.8"
project: "portfolio-site"
date: 2026-06-01
lang: en
pair: "2026-06-01-portfolio-site-ko"
tags: [claude-code, harness, opus-4-8, hooks, omc]
description: "A harness-audit revealed 9 hook scripts sitting idle in ~/.claude/hooks/ — none registered in settings.json. Fixed in one session with Opus 4.8."
---

Nine hook scripts. None of them doing anything.

That's what `harness-audit` surfaced today. Every script in `~/.claude/hooks/` was correctly written, correctly placed — and completely invisible to Claude Code because `settings.json` had no `hooks` key at all.

**TL;DR** Ran the `harness-audit` skill to audit the full `~/.claude/` state. Found 9 unregistered hooks, broken symlinks, and an OMX directory I didn't fully understand. Fixed everything, created `omc-dial.sh`, and restructured the harness for Opus 4.8. Total session: 1h 33min across 3 sessions, 65 tool calls.

## The Setup That Was Quietly Broken

The inventory looked fine on the surface:

| Category | Count |
|---|---|
| Skills (owned) | 11 dirs |
| Agents (YAML) | 12 |
| Hook scripts | 9 |

Then the health check ran. The audit tried `jq '.enabledPlugins, (.hooks | keys)'` against `settings.json` and got `null | keys` — a hard failure. The `hooks` key didn't exist.

All 9 scripts were present on disk. Claude Code had no idea they existed.

The audit also turned up broken symlinks. A quick `find ~/.claude -type l ! -exec test -e {} \; -print` revealed several dangling references, plus leftover tmp files. All cleaned.

The uncomfortable part: this had probably been broken for a while. There's no error, no warning — the hooks just silently don't fire. The only way to know was to look.

## Down the OMX Rabbit Hole

During the audit, `/Users/jidong/dentalad/.omx` appeared in the inventory. First assumption: a separate tool or CLI I'd forgotten about.

It wasn't. After about 25 Bash calls — following directory trees, hitting empty folders, reading READMEs, backtracking up — the picture became clear: `.omx` is a **runtime state directory**. Cache, logs, state. No code. The actual definition lived in `AGENTS.md` (17KB) and the project's `CLAUDE.md`.

OMX stands for **"Oh My Codex"** — a planning and state framework for Codex execution. The state folder was empty because it had never been run. 25 Bash calls for a dormant directory.

This is a recognizable trap when auditing unfamiliar configs: filesystem presence implies activity, but runtime state folders are just waiting. Check for code before assuming something is live.

## Redesigning the Harness for Opus 4.8

Two questions came up during the session:

```
"Is applying a harness effective with Opus 4.8, or does it not matter?"
"Structure it for maximum effectiveness with 4.8."
```

The answer that emerged was simpler than expected. Opus 4.8 has strong context comprehension — it doesn't need a dense scaffold of hooks and directives to behave well. What it needs is **clean, clear context**.

More hooks don't help if the model can't extract signal from the routing logic. A well-structured `CLAUDE.md` with unambiguous routing rules outperforms a complex hook chain that adds noise.

Changes made:

- `~/.claude/CLAUDE.md` — clarified global routing policy, removed redundant directives
- `~/.claude/hooks/omc-dial.sh` — new script, auto-adjusts OMC settings based on task complexity
- `~/.claude/settings.json` — added the `hooks` key, registered all 9 scripts
- `~/.claude/workflow/lib/classify.sh` — updated classification logic

The philosophy behind `omc-dial.sh`: instead of manually selecting a mode for each task, the hook reads complexity signals from the incoming task and adjusts settings automatically. The model gets consistent context calibration without manual intervention per session.

## Session 1: Hermes Dashboard Extension

A separate short session the same day — 2 minutes, 16 tool calls — worked on adding a Mission Control panel to the Hermes dashboard.

Workflow: read official SDK docs → explore the actual runtime environment → reference existing plugins (achievements, kanban) as implementation patterns.

The dashboard was running on port 9119, active theme `default-large`. Session ended when it turned out the `sidebar` slot doesn't render in this version. Clean stopping point — nothing to patch until the slot is available upstream.

## Session 3: Medical Ad Research Automation

Session 3 (8 tool calls) generated 6 files under `/dentalad/research/daily-medical-dental-ads/`:

- Daily update log
- Rolling knowledge base
- Source index
- SERP observation notes
- Naver ranking hypotheses
- HTML report

All written from collected SERP data. Straightforward execution — the structure was already defined, this was just filling it in.

## Tool Usage Across All Three Sessions

| Tool | Calls |
|---|---|
| Bash | 38 |
| Read | 14 |
| Edit | 5 |
| Agent | 3 |
| Write | 2 |
| Grep | 1 |
| **Total** | **65** |

Bash at 58% reflects the nature of the work: structure discovery and state verification. Only 5 Edit calls means the actual code changes were minimal. Most of the session was understanding the environment, not changing it.

This is worth noting for time estimates. Audit work looks cheap in terms of file changes but expensive in terms of tool calls and elapsed time. The value is asymmetric: 1h 33min to find a problem that could have silently broken every hook-dependent workflow indefinitely.

## What Actually Matters for Opus 4.8

The core finding from today: the bottleneck in Opus 4.8 workflows isn't hook coverage — it's context quality.

A model with strong comprehension can work around ambiguous instructions, but it works *better* when the instructions are unambiguous. The same holds for routing: simple, clear routing logic in `CLAUDE.md` outperforms a complex hook chain that tries to handle every edge case programmatically.

The practical checklist from this session:

1. Run `harness-audit` periodically — filesystem presence and registration status can diverge silently
2. Verify `settings.json` has a `hooks` key before assuming hooks are active
3. Prefer context clarity over hook volume
4. Check runtime state directories before assuming they represent active tools

The 9 unregistered hooks were fixable in minutes once found. The harder part was knowing to look.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
