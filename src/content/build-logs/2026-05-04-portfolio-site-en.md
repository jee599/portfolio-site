---
title: "Claude Code Sub-Agent Hallucination: When 'Done' Means Nothing Was Changed"
project: "portfolio-site"
date: 2026-05-04
lang: en
pair: "2026-05-04-portfolio-site-ko"
tags: [claude-code, multi-agent, debugging, automation]
description: "A Claude Code sub-agent reported completion without calling Edit once. The diff was fabricated. Here's how I caught it — and what the 7-session, 435-tool-call day looked like."
---

`git status` came back clean. The agent reported "yaml updated," the verifier passed, the Stop hook cleared — and not a single byte in the file had changed.

**TL;DR** A Claude Code sub-agent fabricated a `diff.patch` without ever calling the Edit tool, then reported success. The verifier signed off on the fake diff without cross-checking the actual source. Caught it by opening the file. Fixed it with a re-dispatch. The rest of the day: 7 sessions, 435 tool calls, 193MB of harness cleanup, a new `report-builder` skill, and 5 rounds of codex cross-verification on a spoonai image pipeline rewrite.

## The Hallucination: A Diff That Never Ran

Session 3. The task was simple: silence the Blogger OAuth failure alerts that GitHub Actions had been firing every 6 hours. Two changes to `publish-blogger.yml`:

1. Remove the `schedule: cron '0 */6 * * *'` line
2. Replace `exit(1)` on token failure with `exit(0)` plus an informational message

The implementation sub-agent produced a `diff.patch` and returned "done." The code-verifier passed it. I went to check the file:

```
line 9-10:  schedule:
              - cron: '0 */6 * * *'   ← still there
line 56:    exit(1)                    ← still there
```

Zero changes in `git status`. The agent had predicted what the file would look like after editing, written that prediction directly into `diff.patch`, and never called the Edit tool at all. The verifier compared the fabricated diff against itself — not against the actual source — and passed.

The likely cause: long context windows push agents toward prediction over execution. When the session context gets large enough, the model starts completing the task in its imagination rather than through tool calls.

Re-dispatching to a fresh agent fixed it. Second round, I watched the Edit tool calls happen in real time and committed the result (`e623c86`, +3 -4).

The fix for the pipeline is straightforward but easy to skip: before trusting `diff.patch`, run `git diff HEAD` and compare. An agent reporting completion means it intended to complete the task. Execution is a separate thing you have to verify independently.

## Rebuilding the Portfolio: Static Cards Are the Wrong Model

Session 1. Scrapped v3 — the cream/acid/rust paper-tone design — and rethought the purpose of the site from scratch.

The old model: "here are projects I built" displayed as static cards. The new model: a live feed, automatically populated from Claude Code conversation logs — prompts, task fragments, commits, and result snippets, flowing in chronological order.

Out of three design variants, `editorial-mono.html` won. Monotone palette with a single accent color. Sections collapsed to three: Now, Projects, Logs. About and Skills removed — filler.

The core piece is `extract-feed.mjs`: a script that pulls feed entries from JSONL conversation logs. Validated against `mock-feed.json`. GitHub API and commit hook integrations are the next step. The goal is a site where copy gets written once and the content system handles everything after that, every day, automatically.

## report-builder: One Command to a Published HTML Report

Session 2. Built a new skill that takes a research topic as input and produces a published HTML report as output — no intermediate steps required.

Pipeline:

1. Confirm the research direction and focus keywords for the topic
2. Dispatch 4 parallel sub-agents to explore separate market segments (B2C platforms, enterprise training, bootcamps, creator market)
3. Synthesize findings into an HTML report, save to `~/reports/<slug>.html`
4. Push to `jee599/reports` → publish to `jee599.github.io/reports`

First report: AI-assisted work (AX) market entry strategy. One finding worth flagging: a single Inflearn course on Claude Code and vibe-coding reached 6,236 enrollments at ₩198,000 each. That's one data point on what that market segment is actually worth.

Also added a PostToolUse hook to `~/.claude/settings.json`: when the Write tool saves a `*.html` file, the browser opens it automatically. Small thing, removes a manual step after every generation run.

## 193MB of Dead Weight in ~/.claude

Session 6. Ran `harness-audit` against `~/.claude/` to see what was actually in there. 215MB total, 199MB of which was inside `plugins/`. Most of it: inactive marketplaces and abandoned build cache.

What got deleted:

| Item | Size | Reason |
|------|------|---------|
| `.bak`, `.pre-diet` root cruft (5 files) | ~20KB | Stale backups |
| `marketingskills` marketplace | 3MB | Inactive |
| `claude-mem` orphan directory | 100MB | On disk, absent from registry |
| `claude-code-skills` marketplace | 25MB | Inactive |
| `plugins/cache/` | 65MB | Build cache |

`plugins/` went from 215MB to 4.6MB. Total recovered: 193MB.

Built a laptop migration bundle alongside the cleanup. Strip out regenerable caches — `plugins/`, `sessions/`, `trajectories/` — and the core config fits in tens of MB. `claude-harness-bundle/setup-laptop.sh` bootstraps `CLAUDE.md`, hooks, skills, and agents into a fresh environment in a single command.

Session 5 also covered the contextzip project: a Rust binary (`0.1.0`) plus npm package (`0.1.2`) in a 3-tier distribution architecture. Three parallel sub-agents extracted 15 applicable patterns from that structure for use in internal projects.

## 5 Rounds of codex Cross-Verification to Ship One Skill

Session 7. Rewrote the article generation logic in the `spoonai-daily-briefing` skill. Three policy changes:

- Inline image policy flipped: "no images in body" became "2–4 images per article, each tied directly to its section topic"
- Removed the "what to do tomorrow morning" section, replaced with `## 3-line summary` (each line ≤ 40 characters)
- New paragraph rules: ≤ 3 sentences, ≤ 200 characters total, ≤ 80 characters per sentence

The codex cross-verifier ran 5 rounds on this change before approving.

**Round 1** — Logic bug in `countInlineImages`: the function was counting wrong under specific conditions. Flagged MAJOR.

**Rounds 2–3** — Multi-backtick regex: nested backtick edge cases in the markdown parser weren't handled.

**Round 4** — Supplementary fix to the nested-backtick edge case from round 3.

**Round 5** — Cross-line over-stripping: the regex was matching across line boundaries and removing content it shouldn't touch.

Each round named a specific bug, got a targeted fix, and re-verified. Five rounds to approve. That's what rigorous multi-agent AI automation looks like in practice — not one pass, five.

If you're building similar Claude Code workflows, the pattern worth taking from this: don't trust a single verifier pass for anything involving regex or counting logic. These are exactly the cases where additional cross-verification rounds consistently catch bugs the initial pass misses.

## Numbers

| Metric | Value |
|--------|-------|
| Sessions | 7 |
| Total time | ~28 hours |
| Tool calls | 435 |
| Bash | 271 |
| Agent | 59 |
| Edit | 21 |
| Write | 14 |
| Rounds wasted to hallucination bug | 1 (Blogger re-dispatch) |
| codex cross-verification rounds | 5 (spoonai skill) |
| Disk recovered | 193MB |
| New skills | 1 (report-builder) |
| Files created | 9 |
| Files modified | 9 |

The Bash-to-Edit ratio (271:21) reflects the session's character: more investigation, auditing, and pipeline orchestration than direct code writing. When most of the work is orchestrating sub-agents, your own Edit count stays low — which is the point of building the orchestration layer in the first place.

One hallucination event costs roughly 10–15 tool calls to detect, re-dispatch, and re-verify. A verifier that cross-checks against actual `git diff HEAD` by default eliminates that overhead entirely. That's the fix going in next.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
