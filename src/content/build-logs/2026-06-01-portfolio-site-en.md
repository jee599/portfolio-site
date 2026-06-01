---
title: "16 Sessions, 444 Tool Calls: Rebuilding My Claude Code Harness from the Ground Up"
project: "portfolio-site"
date: 2026-06-01
lang: en
pair: "2026-06-01-portfolio-site-ko"
tags: [claude-code, open-design, harness, opus-4-8, automation, hooks]
description: "9 hook scripts existed, all executable, none registered. One day, 16 sessions, 444 tool calls to audit the harness, port Open Design locally, and wire automatic design routing."
---

444 tool calls across 16 sessions. Not shipping features — rebuilding the infrastructure that Claude Code runs on. More than half the day went to the harness itself, not any product.

**TL;DR** `~/.claude/settings.json` had no `hooks` key. Nine scripts on disk, all with correct permissions, all silently ignored. A `harness-audit` run surfaced the gap. From there: pruned 8 dormant hooks, ported Open Design locally, and wired `design-router.sh` as a `UserPromptSubmit` hook — all in the same day.

## Session 11: One Prompt, 81 Tool Calls

Session 11 was the pivot. The prompt was deliberately loose:

```
Check everything structure-related — harness, skills, markdown hooks, all of it
```

The `harness-audit` skill triggered and ran inventory collection in parallel. The failure surfaced immediately during hook registration check:

```bash
cat ~/.claude/settings.json | jq '.enabledPlugins, (.hooks | keys)'
# Error: null | keys
```

No `hooks` key. At all. `~/.claude/hooks/` had nine scripts, all executable, correctly named — and Claude Code was ignoring every one of them because they weren't registered in `settings.json`. The runtime doesn't scan the hooks directory; it reads explicit registrations. A script that lives on disk but isn't registered is invisible.

**Debugging order matters**: when hooks don't fire, check `settings.json` registration before touching permissions or file paths. That's the first thing to verify, not the last.

Full audit snapshot:

| Category | Count | Status |
|---|---|---|
| Skills (owned dirs) | 11 | Active |
| Agent YAMLs | 12 | Active |
| Hook scripts | 9 | All unregistered |
| Broken symlinks | 3 | Cleaned |
| Dormant hooks | 8 | Pruned |

Cleanup: 41 Bash calls, 13 Edit calls.

## What Opus 4.8 Actually Wants From a Harness

After the audit fixed registration, the conversation shifted direction:

```
"I'd rather things trigger automatically than me calling them explicitly"
"Design the most effective structure for 4.8"
```

The conclusion was counterintuitive: **more hooks makes things worse**.

Every hook that fires costs context at the start of a turn — the model has to parse which hooks triggered, understand what they injected, and factor that into reasoning before getting to actual work. With 3–4 targeted hooks this overhead is negligible. With 9+ hooks across multiple event types, the model burns meaningful context just interpreting hook state.

Opus 4.8's situational understanding is already strong enough that complex routing layers become friction instead of signal. The hooks that scale with model capability are the ones that encode things the model genuinely can't do itself: deterministic file guards, system-level nudges on risky tasks.

Two hooks survived the pruning:

- `protect-files.sh` (PreToolUse) — a hard gate for secrets. No model intelligence involved; just a deterministic block.
- `omc-dial.sh` (UserPromptSubmit) — injects plan/scope/self-verify nudges on high-risk tasks only. Silent otherwise.

Forced pipelines and mandatory review loops stayed opt-in. The rest of the routing logic moved into `CLAUDE.md` where it belongs.

## Porting Open Design Locally

Session 14: 1 hour 21 minutes, 70 tool calls.

The starting point was curiosity about `claude.ai/design`. Exploring locally revealed that an `open-design` repo was already present with an `od mcp` command — a built-in MCP server that connects OD directly to Claude Code.

The decision: instead of reverse-engineering OD's behavior and guessing at its prompt structure, read the actual engine files and port them verbatim. Discovery flow (RULE 1/2/3), five visual direction archetypes with oklch palettes, the designer charter, the anti-slop checklist, the five-dimension self-review critique — all of it:

```
~/.claude/skills/open-design/SKILL.md
~/.claude/skills/open-design/reference/charter.md
~/.claude/skills/open-design/reference/directions.md
```

Verbatim porting over reimplementation means edge-case behavior matches what the original tool actually produces. Reimplemented prompts accumulate subtle divergences that only surface in practice.

## design-router: Routing Without Being Asked

A skill alone still requires the user to say "use open-design." The goal was zero explicit invocation for visual work.

Solution: `design-router.sh` registered as a `UserPromptSubmit` hook. When keywords like landing, mockup, dashboard, prototype, or redesign appear in a prompt, the hook auto-injects a system-reminder pointing toward the Open Design route. This runs at the prompt context level — no code execution, no latency overhead.

The same routing logic is mirrored in `CLAUDE.md` to enforce from both directions: the hook catches it at runtime, `CLAUDE.md` carries it in the model's instruction context.

Cost: 21 Edit calls, 9 Write calls, 18 modified files.

## The PDF Thread Running in Parallel

Sessions 6–10, 13, 15, and 16 ran a completely separate context: building HTML/PDF diagnostic reports for small business online storefronts.

The sequence: free diagnostic report → paid output sample → Open Design–styled v1 redesign. An independent Codex review returned `VERDICT: request-changes` with two specific blockers.

**Blocker 1 — Free PDF**: The last two rows of the coverage table were being clipped at page boundaries. A `.cov` block with `break-inside: avoid` was deleting rows rather than just preventing mid-element breaks.

**Blocker 2 — Paid PDF**: FAQ Q/A markers were CSS-generated pseudo-content only. No real text in the DOM, so copy-paste was broken. Separately, price numbers were wrapping mid-digit.

Session 16 resolved both: 30 Edit calls, print CSS fixes, converting markers to real `<span>` elements with actual text content, adding `white-space: nowrap` to price strings, then regenerating PDFs via Chrome headless.

## Tool Distribution

```
Bash        ██████████████████████████████ 220
Read        ██████████ 73
Edit        ██████████ 72
Write       ██ 19
WebSearch   ██ 15
Agent       █ 8
TaskUpdate  █ 8
ToolSearch  █ 7
```

444 calls total. Bash at 50% is the signature of audit-plus-research work — more time understanding current state than making changes. `Edit(72)` is a solid implementation number, but it's neck-and-neck with `Read(73)`, which tells the story: this was a day of understanding before acting.

There's no warning when Claude Code hooks silently fail. No log entry, no error message. The only signal is behavior that never happens. That's the argument for periodic harness audits — they're the only way to catch this category of silent misconfiguration before it costs more than a day of investigation.

## What's Next

`~/.claude/plans/harness-report-2026-06-01.md` and `opus48-cli-research-2026-06-01.md` are the starting files for the next session. `design-router.sh`'s keyword list needs tuning against actual usage patterns — no substitute for real prompt data.

One thing confirmed today: the Claude Certified Architect (CCA) exam launched in March 2026 but is currently gated to partner employees only.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
