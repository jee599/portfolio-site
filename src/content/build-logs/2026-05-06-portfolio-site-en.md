---
title: "Claude Code Harness Audit: Dual Orchestrator Bug, 193MB Reclaimed, 4 Parallel Research Agents"
project: "portfolio-site"
date: 2026-05-06
lang: en
pair: "2026-05-06-portfolio-site-ko"
tags: [claude-code, workflow, harness, automation, multi-agent]
description: "8 sessions, 209 tool calls. Found two orchestrators running the same pipeline, reclaimed 193MB from ~/.claude, and researched a market with 4 parallel agents in one session."
---

193MB sitting in `~/.claude`, completely unused. Two orchestrators silently running the same four-stage pipeline on every task, neither aware the other existed.

Eight sessions, 209 tool calls. This wasn't a heavy coding period — it was a maintenance and infrastructure period. Most of the time went into auditing the Claude Code harness itself: finding what was broken, cleaning what was bloated, and using multi-agent parallelism to compress a day of research into two hours.

**TL;DR** — Discovered a dual-orchestrator conflict where `ORCHESTRATION.md` and OMX's `team_pipeline` were both enforcing the same plan→implement→verify→cross-verify flow on every task. Deleted 193MB of orphaned plugins and stale cache from `~/.claude`. Researched the Korean AI course market with 4 parallel agents in a single session.

## Two Orchestrators Were Running the Same Pipeline

The investigation started with a straightforward question: "Is the Claude Code + Codex + Oh My Codex setup over-engineered for the dentalad workflow?"

Reading through the config files, the answer became clear fast.

`workflow/ORCHESTRATION.md` defined a pipeline:
```
plan → implement → verify → cross-verify
```

OMX's `team_pipeline` defined a pipeline:
```
plan → implement → verify → cross-verify
```

Identical. Both independently enforcing the same four stages on the same tasks.

When a single task triggered both systems simultaneously, stages duplicated. Output paths split between `current/` and `.omx/state|plans|logs/` — no clean signal about which was authoritative. If `current/plan.md` and `.omx/plans/latest.md` disagreed, there was no way to know which to trust.

This is the kind of bug that doesn't crash anything. It silently doubles compute, produces redundant artifacts, and makes the system gradually harder to reason about.

**The second problem: the complexity classifier was over-escalating.**

The threshold for `standard` complexity was set too conservatively. Pure Q&A, read-only analysis, single clarifying questions — all of these were being pushed to `standard`, which automatically fired plan-orchestrator. A question like "what's in this config file?" was spinning up a planning agent.

Standard complexity means: planning agent, implementation context, verification step. That chain has real overhead. It should activate when there's actual risk to coordinate, not as a default for anything ambiguous.

The fix: encode "Lightweight First" as an explicit, written rule — not just an intention.

- No code changes → `trivial`: direct response
- Single file, under 30 lines → `simple`: direct edit + fast check
- When uncertain: judge by actual change scope, not assumed risk

The key shift is defaulting down, not defaulting up. An orchestration layer that fires on every task regardless of size isn't protecting quality — it's adding friction proportional to caution rather than proportional to complexity.

OMX's team pipeline becomes opt-in for genuinely large parallel workloads, not something that runs alongside every workflow task by default.

## harness-audit Found 93% Waste in One Directory

After fixing the orchestrator conflict, I ran the `harness-audit` skill against `~/.claude`.

Total footprint: **215MB**

Of that: **199MB was `plugins/` alone** — one subdirectory holding 93% of the entire harness.

Three deletion targets:

| Target | Size | Reason |
|--------|------|--------|
| `claude-mem` | ~100MB | Orphaned — not in registry, still on disk |
| `claude-code-skills` marketplace | ~25MB | Inactive plugin, never loaded |
| `plugins/cache/` | ~65MB | Pure cache |

Also cleared scattered `.bak` and `.pre-diet` backup files in the root — residue from a previous cleanup pass that never removed its own artifacts.

```bash
# Before
du -sh ~/.claude/plugins/
# 198MB  ~/.claude/plugins/

# After
du -sh ~/.claude/plugins/
# 4.6MB  ~/.claude/plugins/
```

Total recovered: **~193MB**

The cleanup took 88 Bash calls. The distribution was roughly 70% verification (`ls`, `du`, `cat` to confirm what each directory was before touching it) and 30% deletion. Conservative order: confirm orphaned directories first, then cache, then inactive plugins. `spoonai-daily-briefing` stayed untouched — it runs on an 8AM cron and isn't worth touching in a cleanup session.

**The meta point:** This kind of work is invisible in output metrics. It doesn't ship a feature or fix a user-facing bug. But a 215MB `~/.claude` with 93% waste means slower audits, ambiguity about what's active, and harder debugging when something breaks. Getting down to a 22MB harness with clearly intentional contents is real infrastructure work — even if no one sees the diff.

## Researching a Market in One Session with 4 Parallel Agents

Request: "Tell me the platforms and routes for teaching AI / vibe-coding / LLM courses in Korea."

Scope: B2C platforms, corporate training, government grants, bootcamps, solo creator economics, ROI estimates. Doing this manually and sequentially would take a full day, with context bleeding between domains as you jump between sources.

Instead: decompose into 4 independent domains, dispatch agents in parallel, synthesize.

**Agent 1 — B2C course platforms**
Inflearn, FastCampus, Coloso, Class101, Codeit, Learning Spoons. Pricing models, course count in AI/LLM category, top-earning course examples, creator economics.

**Agent 2 — Corporate training and government programs**
Multicampus, Hunet, KT AICE, K-Digital Training, NIPA-backed curricula. Contract structures, B2B pricing norms, how to enter as an external instructor.

**Agent 3 — Bootcamps and communities**
Code States, Sparta Coding Club, Likelion, Grow&Better. Curriculum structures, instructor pathways, community monetization routes.

**Agent 4 — Solo creator routes + ROI**
YouTube + Inflearn combination strategy, self-hosted LMS economics, mentoring pricing models, workshop structures. Comparable creator earnings at different audience sizes.

Each agent ran with a clean context window — no cross-contamination, no shared intermediate state. They returned results independently, then I synthesized into a single document.

Output: `~/.claude/plans/research-korea-ai-teaching-routes-20260504.md`, 30+ source URLs. Total: 37 tool calls, roughly 2 hours.

**The conclusion was specific:**

> Inflearn course + Inflearn mentoring + mini self-hosted LMS = triple entry point.

Inflearn effectively owns Korean search traffic for "Claude Code" and "vibe-coding." A single creator's course reached ₩198,000 × 6,236 enrollments — one course, one platform, one creator. Entry barrier is low, and a well-executed course creates durable leverage: SEO, inbound mentoring requests, workshop invitations.

The research task itself: 37 tool calls, ~2 hours, one session. Doing this sequentially — one domain at a time — would have taken 6+ hours and mixed contexts between domains. Parallel agents with clean scope boundaries was the right call here.

**When multi-agent AI automation research pays off:**
- Wide scope with clearly separable domains (each agent can be fully briefed without needing the others' results)
- Each domain requires synthesizing 20+ sources
- Domains don't need to coordinate mid-research

When it doesn't: narrow scope, single authoritative source, or domains that actually need each other's intermediate output. In those cases, one agent with a structured prompt is faster and cheaper.

## Laptop Migration: Three Options by Friction

"How do I get this entire harness onto a laptop without spending an afternoon on it?"

Three options, ordered by friction cost:

### Option 1: tar snapshot + setup script (5 minutes)

```bash
tar -czf claude-harness.tar.gz \
  --exclude='.claude/plugins' \
  --exclude='.claude/sessions' \
  ~/.claude/
```

Excluding `plugins/` and `sessions/` keeps the archive under 2MB. Transfer via scp, AirDrop, or a private repo. Pair with `setup-laptop.sh`:

```bash
#!/bin/bash
tar -xzf claude-harness.tar.gz -C ~/
echo "Done. Skills, agents, hooks, and settings ready."
```

Run once, done. Skills, agents, hooks, and settings drop immediately into `~/.claude/`.

### Option 2: Git repo + chezmoi or GNU stow (30 minutes initial)

Version-controlled, diffs visible, easy rollback. Makes sense if the harness changes frequently or you manage 2+ machines. `chezmoi` handles the `~/` prefix cleanly and supports templating for machine-specific values.

### Option 3: Ansible playbook (high overhead)

Full Mac provisioning — Homebrew packages, dotfiles, app installs, harness bootstrap. Worth building if you're imaging machines repeatedly. Not worth building for one-time parity.

`~/claude-harness-bundle/setup-laptop.sh` was built and tested — extract and run.

## What the Numbers Say

8 sessions across this period:

| Tool | Count | Context |
|------|-------|---------|
| Bash | 146 | Exploration, verification, deletion |
| Read | 20 | Config files, plugin manifests |
| Agent | 15 | Parallel research + harness audit |
| Write | 12 | Plans, research synthesis, configs |

Bash at 70% reflects the nature of the work: `ls`, `cat`, `du`, `rm`. Not construction — navigation and cleanup.

Agent at 15 breaks down: 4 for parallel market research, 1 for harness audit coordination, 3 for ContextZip investigation, the rest for sub-tasks. The pattern is consistent: agent dispatch earns its overhead when scope is wide and domains are independent. For narrow scope or single-source research, one agent is faster.

Files modified: 1. Files created: 10. Almost no application code was touched.

193MB gone. Dual-pipeline conflict resolved. Complexity classifier recalibrated to default lightweight.

> Not touching infrastructure is also work. Doing it with Claude Code is also work.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
