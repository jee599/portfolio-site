---
title: "Dual Orchestrator Bottleneck: 3 Sessions, 20 Tool Calls, Zero Lines of Code Changed"
project: "portfolio-site"
date: 2026-05-05
lang: en
pair: "2026-05-05-portfolio-site-ko"
tags: [claude-code, oh-my-codex, workflow, over-engineering, orchestrator]
description: "Discovered a dual-pipeline bottleneck where Claude Code ORCHESTRATION.md and OMX team_pipeline both enforce the same plan→verify loop. Diagnosed in 20 tool calls across 3 sessions without touching a single file."
---

Two orchestrators were doing the same job twice.

**TL;DR** 3 sessions. 20 tool calls. 0 lines of code changed. I traced a structural conflict between Claude Code's `ORCHESTRATION.md` and Oh My Codex's `team_pipeline`, diagnosed the root cause, and drafted the MVP package for `dentalad`'s first real customer — all without touching a single file.

## Two Pipelines, One Job, Zero Agreement

While auditing the `dentalad` project workflow, I found a structural collision: Claude Code's `ORCHESTRATION.md` and OMX `team_pipeline` were each independently enforcing an identical `plan → implement → verify → cross-verify` sequence.

```
Claude ORCHESTRATION.md:  plan.md → diff.patch → verifier-report.md → codex-report.md
OMX team_pipeline:         plans/ → state/ → logs/ → cross-verify
```

When a task hits both pipelines, every stage runs twice. Artifact storage splits between `current/` and `.omx/state|plans|logs/`. There's no single source of truth, and every result requires checking two locations to confirm consistency.

The second problem was the classification heuristic. Even pure analysis requests — questions with no code change involved — were being promoted to `standard` complexity, which triggers a `plan-orchestrator` invocation. Zero-code analysis was being forced through a heavyweight multi-agent pipeline designed for architectural work.

## 9 Reads, 7 Bash Calls — Diagnosing a System Without Touching It

Session 1 closed at 16 tool calls. Nine `Read` calls covered four files:

- `CLAUDE.md` — Lightweight First principle and complexity classification rules
- `workflow/AGENTS.md` — subagent catalog and invocation conventions
- `.omx/README.md` — Oh My Codex team_pipeline structure
- `~/.codex/config.toml` — Codex global config

Seven `Bash` calls handled `git status`, `state.sh` helper invocations, and directory checks. No `Edit`. No `Write`. The session's entire output was understanding — reading the structure until the bottleneck became visible.

The diagnosis compressed to five findings:

1. **Dual orchestrator conflict** — two pipelines independently enforcing the same `plan → verify` flow
2. **Split artifact storage** — `current/` vs `.omx/` with no reconciliation between them
3. **Conservative task classification** — analysis and questions routed to `standard`, triggering heavy pipelines
4. **OMX `$team` / `$ultrawork` active by default** — swarm logic attaching to tasks that didn't explicitly request it
5. **Unnecessary Codex cross-verify** — external model validation loop firing on trivial tasks

## The Rule Was Already There — It Just Wasn't Being Enforced

The fix wasn't inventing something new. `ORCHESTRATION.md` already stated the principle: "don't attach a heavyweight pipeline to small tasks." The gap was enforcement in practice.

The corrected routing:

- `trivial` — main handles directly, no agents, no Codex invocation
- `simple` — direct edit, fast validation only
- `standard` — short checklist, implement, Codex optional
- `major` — full plan → verify → Codex cross-verify pipeline

OMX `$team` and `$ultrawork` are explicit heavy mode. They belong on genuinely parallel workloads and large PRD-driven builds — not on analysis queries, minor config changes, or single-file edits.

> More pipelines don't mean higher quality. The fastest path is the one sized to the actual task.

## Session 2: One Tool Call, Full Stop

Session 2 was a single `Bash` call. Checked the current workflow state: `task_id: 20260505-052532`, stage `classified`, no artifacts in flight. That was the entire session. One of the 20 total tool calls across the day.

A one-call session that confirms system state cleanly is a good session — it means the state machine is working as intended.

## First Real Customer: Building the Dental AI Pilot MVP

Session 3 ran three `Bash` calls. The subject was `dentalad`'s first pilot customer — a dental clinic in Yongin, Gyeonggi Province, South Korea.

`dentalad` is a project building AI-driven dental practice marketing automation: Naver blog generation, ad performance analysis, keyword gap identification, and Korean Medical Act compliance checking. The first pilot validates the workflow against a real clinic's actual needs.

Public data baseline: weekday hours 09:30–18:30, Saturday 09:30–14:30. Naver appointment booking available. Services span restorative, prosthetics, orthodontics, periodontics, oral surgery, and implants.

MVP structure, sequenced from Week 1:

**A. Ad Diagnostic Report (Week 1)** — a standalone, independently sellable deliverable. Scope:
- Naver Place, blog, map, and YouTube visibility audit
- Competitive comparison against five nearby clinics
- Keyword gap analysis: "Dongbaek implant", "Yongin orthodontics", "children's dentist Dongbaek"
- Korean Medical Act self-audit
- Five quick wins the clinic can act on immediately

**B. Medical Compliance Package** — mandatory prerequisite for dental marketing automation in Korea. Document the legal requirements before generating content. Apply a compliance checklist to every output.

The critical sequencing decision: sell the diagnostic report first, automation second. Diagnosis makes the problem visible. When the customer can see their own keyword gaps and competitor positions, the value of automated content generation becomes concrete. Week 1 builds trust through the report; the automation contract follows from that.

## The Numbers

| Item | Count |
|------|-------|
| Sessions | 3 |
| Total tool calls | 20 |
| Bash | 11 |
| Read | 9 |
| Edit / Write | 0 |
| Files modified | 0 |
| Files created | 0 |
| Total elapsed | ~3 minutes |

No code was written. Read-only sessions diagnosed a structural problem in the multi-agent workflow and clarified the go-to-market sequence for a new product. The sessions that produce zero diffs are sometimes the ones that produce the most clarity.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
