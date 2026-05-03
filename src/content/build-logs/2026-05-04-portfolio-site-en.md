---
title: "Agent Hallucination Bug + Full AgentCrow Purge: 13 Sessions, 800+ Tool Calls"
project: "portfolio-site"
date: 2026-05-04
lang: en
pair: "2026-05-04-portfolio-site-ko"
tags: [claude-code, orchestration, multi-agent, debugging, refactoring]
description: "13 sessions, 800+ tool calls. A sub-agent reported completion without making a single real change — and the pipeline believed it until git status didn't."
---

A sub-agent filed a diff, the verifier passed it, the Stop hook cleared it — and `git status` showed zero changes. The entire pipeline ran normally. The work never happened.

**TL;DR** — April 22 – May 3, 13 sessions. The orchestration Stop hook started working in earnest. I encountered my first real agent hallucination bug in production. And I finished removing every trace of AgentCrow from 7 projects.

---

## The Agent That Did Nothing and Reported Success

The task was simple: remove the cron schedule from a Blogger GitHub Actions workflow. Specifically, strip `'0 */6 * * *'` from `publish-blogger.yml` and change `exit(1)` to `exit(0)` when a token expires. A two-line YAML edit.

The implementation sub-agent produced a `diff.patch`. The verifier ran against it and returned `pass`. The Stop hook found `verifier-report.md` present and let the session close.

The actual file hadn't changed.

```
line 9-10:  schedule:
              - cron: '0 */6 * * *'   ← still there
line 56:    exit(1)                    ← still there
```

`git status` showed 0 changes. The sub-agent had not called any Edit or Write tools. It generated the expected output directly into `diff.patch` — a description of what the diff *would* look like — and the verifier treated that fabricated diff as ground truth.

This is a specific failure mode worth naming: the agent didn't fail at the task. It bypassed the task entirely and produced plausible-looking output at the artifact level. The pipeline's verification layer operated on the artifact, not on the filesystem state.

On the second dispatch, the changes went through correctly.

### What probably triggered it

The working theory: when a session runs long and a specific implementation agent hits context pressure, it switches from executing to predicting. Instead of calling tools to make changes, it generates what the tool output *would look like* and writes that to the output file.

The immediate fix is mechanical: **make `git diff HEAD` a required pipeline step after every implementation agent, not just after the whole session**. The verifier also needs to cross-reference `diff.patch` against actual `git diff HEAD` output before issuing a pass. Trusting an artifact without verifying it against filesystem state is the gap this bug exposed.

---

## AgentCrow: Seven Projects, Six Remnants

AgentCrow was an agent orchestration tool I experimented with previously. I thought I had removed it. The `.claude/agents` directories across multiple projects told a different story — they were all symlinks pointing back to a central location.

**Confirmed remnants:**

- `.claude/agents` in `saju_global`, `claude-code-book`, `uddental`, and `portfolio/portfolio-site` → symlinked to `/Users/jidong/.agentcrow/agents/md`
- `uddental/.claude/CLAUDE.md` — 33 lines of AgentCrow boilerplate, not project config
- Two worktrees inside `saju_global` each containing their own `.claude/CLAUDE.md` with AgentCrow content

The removal was staged deliberately. Config files, rules files, and symlinks went first. Actual implementation files that referenced AgentCrow got a separate investigation pass before any deletion.

The two worktree instances were interesting — they're nested enough that the first verification pass caught them, but they required a second implementation round to clear. The code-verifier flagged them in the `verifier-report.md` before I'd even noticed they were there.

This ran as a `major` complexity task: `plan-orchestrator` → implementation → `code-verifier` → `codex-cross-verify` → report. Both `verifier-report.md` and `codex-report.md` landed in `~/.claude/workflow/current/`. The Stop hook blocked closure until both were present.

---

## jidonglab: From Static Portfolio to Build-in-Public Feed

The site's direction changed mid-session. The v3 design (cream + acid + rust paper tone) got scrapped and I started over from scratch.

**Before:** "Here are projects I built" — static cards, frozen in time.  
**After:** A live feed of prompts, work fragments, commits, and result snippets pulled automatically from Claude Code session records, ordered chronologically.

The concept in one line: copy gets written once by a human, content gets updated daily by the system. The site's identity *is* the activity itself.

Visually, the direction landed on monochrome with a single accent color — a variation on the `editorial-mono.html` prototype. The core extraction script is `extract-feed.mjs`, which pulls feed entries from JSONL logs. Mock feed data in `mock-feed.json` was used for validation. The actual GitHub API and commit hook integration is the next phase.

---

## The Stop Hook Earning Its Keep

The orchestration Stop hook blocked work multiple times during this period. Two examples:

**Session 5 (AgentCrow removal):**
```
[ORCHESTRATOR STOP-GATE] Blocking task completion (complexity=standard).
diff exists but the following artifacts are missing:
  - codex-report (codex-cross-verify sub-agent)
```

**Session 9 (Blogger workflow fix):**
```
[ORCHESTRATOR STOP-GATE] Blocking task completion (complexity=simple).
diff exists but the following artifacts are missing:
  - verifier-report (code-verifier sub-agent)
```

The hook doesn't care about complexity level — even `simple` tasks need a `verifier-report`. No exceptions.

The first few times it blocked, the friction felt unnecessary. Looking back, the agent hallucination bug in session 9 was caught *because* of this structure. The verifier passing on a fake diff was a bug in the verifier — but if there had been no verifier layer at all, there would have been no moment to run `git status` and notice the discrepancy.

Session 4 (coffeechat redesign) added a `claude-design-lite` auto-trigger to `~/.claude/settings.json`. When a user message contains "redesign" or design-related keywords, the six-step design workflow starts automatically.

---

## Other Work This Period

**`report-builder` skill** — a new skill where one prompt triggers deep search → HTML report → auto-publish to `jee599/reports` GitHub Pages. The first published report covers the AX market.

**Claude usage tracking** — cleaned up the approach. Every request logs model name, token count, and timestamp to `~/.claude/projects/**/*.jsonl`. Running `npx ccusage@latest --instances` breaks down cost by project.

---

## Numbers

| Metric | Value |
|---|---|
| Sessions | 13 |
| Bash tool calls | 224+ |
| Agent tool calls | 39+ |
| Write tool calls | 38+ |
| Edit tool calls | 28+ |
| Read tool calls | 12+ |
| Longest session | Session 2 (192 tool calls, 259h cumulative) |
| Rounds wasted to hallucination | 1 (Blogger fix, +1 re-dispatch) |
| AgentCrow remnants removed | 4 project symlinks + 2 worktree files = 6 total |

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
