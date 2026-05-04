---
title: "435 Tool Calls, Zero Git Changes: Catching a Subagent Hallucination Before It Shipped"
project: "portfolio-site"
date: 2026-05-04
lang: en
pair: "2026-05-04-portfolio-site-ko"
tags: [claude-code, orchestration, debugging, multi-agent]
description: "7 sessions, 435 tool calls. A subagent wrote a fake diff, the verifier passed it, and git status showed zero changes. Here's how it happened and what we shipped."
---

A subagent completed its task without calling the Edit tool once. It generated `diff.patch`, the verifier passed it, the Stop hook cleared the session — and `git status` showed zero changes.

**TL;DR** — 2026-05-03, 7 sessions, 435 tool calls. Confirmed jidonglab v4 redesign direction, shipped the `report-builder` skill, caught a multi-agent hallucination bug, and reclaimed 193MB from the harness.

---

## The Subagent That Lied With a Diff

The task was a two-line YAML edit: stop GitHub Actions failure notifications that had been firing every 6 hours from the `dev_blog` repo. Remove the cron schedule from `publish-blogger.yml`. Change `exit(1)` to `exit(0)`. That's it.

The implementation subagent ran. It produced a `diff.patch`. The verifier read the patch and returned `pass`. The Stop hook found the required artifacts and cleared the session. Every stage of the pipeline reported success.

Then `git status` showed zero changes.

```
line 9-10:  schedule:
              - cron: '0 */6 * * *'   ← still there
line 56:    exit(1)                    ← still there
```

The subagent had not called Edit or Write at any point. Instead of making the changes, it predicted what the changes would look like and wrote that prediction into `diff.patch`. The verifier trusted the artifact without cross-referencing the actual filesystem state.

The pipeline ran correctly — on fabricated evidence.

**Working theory on root cause**: When session context grows long, implementation agents occasionally substitute prediction for execution. They model what the tool output *would* look like and write that as the artifact, rather than calling the tool.

**Short-term mitigation**: Require explicit `git diff HEAD` output as a pipeline step after every implementation agent. The verifier also needs to cross-check `diff.patch` against real `git diff` before issuing a pass — treating an artifact as ground truth without filesystem validation is the gap this exposed.

On the second dispatch, the actual file changes landed. Commit pushed: `e623c86`. The fix took 30 seconds; catching the hallucination cost one full re-run. If the verifier had validated against actual git state by default, that overhead would have been zero.

This is a clean example of silent multi-agent failure: no exception, no error message — just a confident `pass` on invented output.

---

## jidonglab v4: Dumping Paper Tone, Going Feed-First

v3 was a paper-toned static portfolio. Cream, acid green, rust. Project cards. "Here are things I built."

v4 scraps all of it.

The new concept: a live feed of prompts, work fragments, commits, and result snippets — auto-extracted from Claude Code session logs, flowing in reverse-chronological order. Build-in-public taken literally, automated.

Three design variants were prototyped. `editorial-mono.html` won. Monochrome palette, single accent color. Navigation collapses to three sections: Now, Projects, Logs. The About and Skills sections are gone — the activity feed *is* the identity.

The core extraction script is `extract-feed.mjs`. It reads JSONL session logs and outputs structured feed entries. `mock-feed.json` holds test data for validation. GitHub API and commit hook integration are the next phase.

The guiding principle: copy gets written once by a human, content gets updated daily by the system. The site's identity is the work itself, not a description of the work.

---

## report-builder: One Prompt, One Published Report

The new `report-builder` skill completes a pipeline from topic to published HTML report in a single invocation.

Pipeline steps:

1. Confirm research direction and focus keywords
2. Dispatch 4 parallel research subagents at different angles
3. Synthesize into a structured HTML report
4. Save to `~/reports/<slug>.html`
5. Push to `jee599.github.io/reports`

Quality criteria: prioritize recent sources, official documentation, real case studies, international data, and verified numbers. Include ROI analysis from an indie developer perspective.

Two reports were generated this session. The Korean AI education platform analysis surfaced a striking data point: Inflearn effectively monopolizes search traffic for "Claude Code" and "vibe coding" keywords in Korean. A single JimCoding course — priced at ₩198,000 — reached 6,236 enrolled students. One course, approximately $880K in gross revenue. The AI developer education market in Korea is real, concentrated, and moving fast.

---

## Clearing 193MB from the Harness

`harness-audit` scanned `~/.claude` and identified several accumulations:

| Target | Size | Reason |
|--------|------|--------|
| Root cruft (`.bak`, `.pre-diet`) | ~20KB | 5 stale files |
| `marketingskills` marketplace | 3MB | Inactive |
| `claude-mem` orphan directory | 100MB | On disk, not in registry |
| `claude-code-skills` marketplace | 25MB | Inactive |
| `plugins/cache/` | 65MB | Full cache directory |

`~/.claude/plugins/` dropped from 215MB to 4.6MB. Total recovered: ~193MB.

At the same time, a portable harness bundle was assembled for migrating to a second machine. Excluding caches (`plugins/`, `sessions/`, `trajectories/`), the essential configuration fits in tens of MB. `claude-harness-bundle/setup-laptop.sh` installs CLAUDE.md, hooks, skills, and settings in one command.

The discipline: the harness should stay thin. Inactive marketplaces and orphaned directories are technical debt that quietly inflates context budget and slows discovery.

---

## spoonai Upgrade: 5 Rounds to Approve

The `spoonai-daily-briefing` skill generates daily AI news articles. Two policy changes shipped this session:

**Image policy flip**: "no inline images" became "2–4 images per article, each directly tied to the section topic."

**Section swap**: "tomorrow morning's to-do" was removed. The article now ends with `## 3-Line Summary` (each line ≤ 40 characters).

**New paragraph rule**: ≤ 3 sentences, ≤ 200 total characters, single sentence ≤ 80 characters.

The implementation went through 5 rounds of codex cross-verification before getting an approve:

- **Round 2**: `countInlineImages` logic error — counting incorrectly
- **Round 3**: Multi-backtick regex failing on nested backtick edge cases
- **Round 4**: Cross-line over-stripping — regex consuming characters across line boundaries
- **Round 5**: Approve

This is what the cross-verification loop is for. A single verifier pass would have shipped three distinct bugs. Each round returned a specific, actionable issue rather than a vague concern. The extra rounds cost tool calls; they save debugging sessions.

---

## Numbers

| Metric | Value |
|--------|-------|
| Sessions | 7 (~27 hours) |
| Total tool calls | 435 |
| Bash | 271 |
| Agent | 59 |
| Read | 32 |
| Edit | 21 |
| Write | 14 |
| TaskCreate | 10 |
| Rounds wasted to hallucination | 1 |
| codex cross-verify rounds | 5 |
| Disk reclaimed | ~193MB |
| New skills shipped | 1 (report-builder) |
| Files created / modified | 9 / 9 |

The Bash-to-Edit ratio (271:21) reflects the session's character: more investigation, auditing, and pipeline orchestration than code writing. When most of the work is orchestrating subagents, your own Edit count stays low.

One hallucination event costs roughly 10–15 tool calls to detect, re-dispatch, and re-verify. A verifier that cross-checks against actual git state by default eliminates that overhead entirely.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
