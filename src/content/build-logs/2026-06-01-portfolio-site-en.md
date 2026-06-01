---
title: "9 Hook Scripts That Silently Did Nothing: Auditing a Claude Code Harness in 87 Tool Calls"
project: "portfolio-site"
date: 2026-06-01
lang: en
pair: "2026-06-01-portfolio-site-ko"
tags: [claude-code, opus-4-8, harness, hooks, omc, workflow]
description: "9 hook scripts with correct permissions and location, all silently ignored. One missing JSON key in settings.json was the culprit. Here's the full audit across 5 sessions, 87 tool calls."
---

Nine hook scripts. All executable. All correctly named. All in the right directory. None of them ran.

That's what a `harness-audit` run revealed on 2026-06-01. The scripts in `~/.claude/hooks/` were properly written, properly placed — and completely invisible to Claude Code because `settings.json` had no `hooks` key at all. This is a log of that audit, plus four other sessions from the same day.

**TL;DR** The `harness-audit` skill scanned `~/.claude/` and found 9 unregistered hooks, broken symlinks, and an OMX directory worth investigating. Fixed in session 2 of 5. Also rebuilt the harness structure for Opus 4.8: fewer hooks, clearer `CLAUDE.md`. Total: 5 sessions, 87 tool calls, 5 changed files.

## Five Sessions, 87 Tool Calls

The full day:

| Session | Duration | Tool Calls | What Happened |
|---|---|---|---|
| 1 | 2 min | 16 | Hermes dashboard — looked for a sidebar slot that didn't exist |
| 2 | 1h 33min | 41 | Full `~/.claude/` harness audit, hook registration, OMC restructure |
| 3 | 1 min | 13 | Dental ad research output generation |
| 4 | 1 min | 15 | Daily brief + same-day WebSearch re-validation |
| 5 | 5 min | 2 | E-commerce product rewrite report kickoff |

Tool distribution: `Bash(44)`, `Read(22)`, `WebSearch(7)`, `Edit(5)`, `Agent(3)`, `Write(2)`, `Grep(1)`, `Skill(1)`.

Bash at 50% of all calls is the signature of an audit session. Most of the work is exploration and state verification, not implementation.

## The Bug That Looked Like Something Else

Session 2 started with a loose prompt:

```
check what tools are currently applied — structure-wise,
harness, skills, md hooks, all of it
```

The `harness-audit` skill triggered. Inventory collection ran in parallel — skills directories, agent YAML files, hook scripts, `settings.json` state. The first failure came from the hook registration check:

```bash
cat ~/.claude/settings.json | jq '.enabledPlugins, (.hooks | keys)'
# error: null | keys
```

`null | keys` — jq failed because `.hooks` returned `null`. The `hooks` key didn't exist in `settings.json`.

Here's what the filesystem looked like:

```
~/.claude/
├── hooks/
│   ├── pre-commit.sh      ← chmod +x ✓, correct name ✓
│   ├── post-tool.sh       ← chmod +x ✓, correct name ✓
│   ├── on-stop.sh         ← chmod +x ✓, correct name ✓
│   └── ... (6 more)       ← all chmod +x ✓
├── settings.json          ← no "hooks" key
├── skills/                ← 11 directories
└── agents/                ← 12 YAML files
```

Nine scripts, all correct on disk. `settings.json` — the file Claude Code reads to know what hooks to run — had no `hooks` key. From the runtime's perspective, the hooks directory was irrelevant.

### Full Inventory

| Category | Count | Status |
|---|---|---|
| Skills (owned) | 11 directories | Active |
| Agent YAML files | 12 | Active |
| Hook scripts | 9 | All unregistered |
| Broken symlinks | Several | Found and cleaned |

Broken symlink cleanup and `settings.json` patching ran concurrently. The fix itself was a single JSON edit — adding the `hooks` key with event mappings for each script. The time cost was the inventory work: traversing the full `~/.claude/` tree, cross-referencing disk contents with registered state, identifying which scripts were needed vs. accumulated dead weight.

> When hooks don't fire, check `settings.json` registration before checking file permissions. Claude Code doesn't scan the hooks directory — it reads what's explicitly registered. An unregistered script is invisible regardless of what's on disk.

## Chasing OMX Down a Rabbit Hole

During the audit, `/Users/jidong/dentalad/.omx` surfaced. The directory name explained nothing.

Investigation path:

1. `ls /Users/jidong/dentalad/.omx` → `cache/`, `logs/`, `state/` — runtime-looking folders
2. No source code here — traced upward through the parent directory
3. Found definition in `AGENTS.md` (17KB)

OMX = **"Oh My Codex"** — a planning and state management framework for Codex execution workflows. The `cache/`, `logs/`, and `state/` subdirectories are runtime artifacts that get created when the system runs. They were empty because OMX had never actually been run in this environment.

This took 10+ Bash calls to resolve. The directory structure gave no indication of what it was. Reading `AGENTS.md` was the only path to understanding it.

> If a directory contains only runtime subfolders (cache, logs, state), look for the source or config file that defines the system — not more runtime output. Filesystem presence doesn't imply activity.

OMX was unrelated to the portfolio harness. Filed and moved on.

## Opus 4.8 and the Routing Layer Trap

After registering the hooks, the session shifted direction:

```
"I'd rather have things trigger automatically than call them explicitly"
"Structure it for maximum effectiveness with 4.8"
```

The core question: given Opus 4.8's context comprehension, what's the optimal harness architecture?

The answer was counterintuitive. Opus 4.8 is strong enough contextually that a dense hook scaffold doesn't help — it adds overhead. Every hook that fires costs initial context: the model needs to parse which hooks triggered, understand what they signal, and factor that into the turn. With 3–4 well-placed hooks, that overhead is negligible. With 9+ hooks on various events, the model burns non-trivial context just on hook-state interpretation before getting to actual work.

The pattern that held up: **fewer hooks, clearer `CLAUDE.md`**. The model's context comprehension can handle ambiguity — but it performs better when the static context is unambiguous. A well-structured `CLAUDE.md` with clear routing rules outperforms a complex hook chain.

### What Changed

`omc-dial.sh` was created as a new hook to auto-classify task complexity:

```bash
classify_task() {
  local prompt="$1"

  if [[ "$prompt" =~ (migration|schema|deploy|production|refactor) ]]; then
    echo "heavy"
  elif [[ "$prompt" =~ (audit|review|debug) ]]; then
    echo "standard"
  else
    echo "fast"
  fi
}
```

The classification feeds `~/.claude/workflow/lib/classify.sh` to route work to the appropriate execution mode (`claude-fast`, `claude-work`, `claude-heavy`) without manual mode selection per session.

Files changed in session 2:

```
~/.claude/CLAUDE.md                  (updated global routing policy)
~/.claude/hooks/omc-dial.sh          (new — auto-classifies task complexity)
~/.claude/settings.json              (added hooks key, registered all 9 scripts)
~/.claude/workflow/lib/classify.sh   (updated classification logic)
~/.claude/plans/audit-2026-06-01.md  (new — audit summary)
```

## Session 1: The Slot That Didn't Exist

Before session 2, a 2-minute session worked on adding a Mission Control plugin to the Hermes dashboard. Goal: attach a panel to the sidebar.

Traversal: official docs → SDK source → `achievements` plugin (simple installed reference) → `kanban` plugin (more complex installed reference). Dashboard was live on port 9119, active theme `default-large`.

Conclusion: this version of the dashboard shell doesn't render a `sidebar` slot. The layout only exposes `main` and `header`. The mounting point for the plugin didn't exist.

Lesson here: grep for slot names before reading docs.

```bash
grep -r "sidebar" ~/.local/share/hermes/ --include="*.js" -l
```

Thirty seconds instead of ten minutes of doc traversal. The answer was in the source, not the documentation.

## Session 4: Treat Every New Day as a Cache Miss

Session 4 ran 15 tool calls on dental practice ad research — 7 of them WebSearch. Even for topics covered in previous sessions.

The pattern: when the date changes, run fresh searches before trusting prior session knowledge. This caught two things that would have been stale otherwise:

1. **New channels confirmed**: Kmong and Soomgo validated as active channels for dental practice advertising
2. **Ad policy updates**: Two Naver policy changes not in the prior session's knowledge base — budget cap increase coming D-3 (policy 31829), and Talktalk extended materials exclusion for medical institutions (policy 31822)

Ad platform policies and channel landscapes move fast. The overhead of 7 WebSearch calls is minimal compared to shipping a response built on stale data.

## What the Tool Distribution Actually Says

```
Bash      ████████████████████████████████████████████ 44 (50.6%)
Read      ██████████████████████ 22 (25.3%)
WebSearch ███████ 7  (8.0%)
Edit      █████ 5  (5.7%)
Agent     ███ 3  (3.4%)
Write     ██ 2  (2.3%)
Grep      █ 1  (1.1%)
Skill     █ 1  (1.1%)
          ──────────────────────────────
          87 total
```

`Bash(44) + Read(22)` = 75.9% of all calls. Structure traversal, state verification, file reading. `Edit(5)` is actual implementation.

For comparison, a typical implementation session flips this ratio: more Edits, fewer Bash calls. This distribution is what audit work looks like — exploration cost massively exceeds implementation cost. The value is asymmetric: 1h 33min to surface problems that had probably been silently broken for weeks.

The uncomfortable implication: there's no error when hooks don't fire. No warning, no log entry. The only signal is behavior that never happens. Periodic audits aren't optional overhead — they're the only way to catch this class of silent misconfiguration.

## The Checklist

From this session:

1. **Check `settings.json` registration first** when hooks don't fire — before permissions, before file naming
2. **Run `harness-audit` periodically** — disk state and registered state diverge silently over time
3. **Fewer hooks, better `CLAUDE.md`** — Opus 4.8's context comprehension makes complex routing layers friction, not signal
4. **Look for source files, not runtime artifacts** — if a directory only has cache/logs/state, the definition is elsewhere
5. **Treat each day's WebSearch as fresh** — knowledge bases in fast-moving domains (ad platforms, model releases) go stale fast

The 9 unregistered hooks were a 5-minute fix once found. Finding them took 90 minutes. That's not unusual for audit work — and it's why the audit is worth doing.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
