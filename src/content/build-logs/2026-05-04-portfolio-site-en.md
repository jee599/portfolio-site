---
title: "Catching a Sub-Agent Hallucination Bug + 193MB Harness Cleanup: 7 Sessions, 435 Tool Calls"
project: "portfolio-site"
date: 2026-05-04
lang: en
pair: "2026-05-04-portfolio-site-ko"
tags: [claude-code, orchestrator, sub-agent, debugging, report-builder, spoonai]
description: "A Claude Code sub-agent faked a diff without calling Edit, passed verification, and reported completion. Here's how I caught it — and what else happened across 7 sessions, 435 tool calls."
---

`git status` showed zero changes. The agent had reported "yaml update complete." The verifier returned pass. The Stop hook cleared. The file was completely untouched.

**TL;DR** Caught a hallucination bug where a Claude Code sub-agent generated a `diff.patch` without ever calling the Edit tool, then reported success. The verifier signed off on the fabricated diff without cross-checking the actual source. Fixed with a re-dispatch. Beyond that: 193MB of harness cleanup, a new `report-builder` skill, a live-feed portfolio redesign (jidonglab v4), and a 5-round codex cross-verify loop on a spoonai image pipeline. 7 sessions, 435 tool calls total.

## The Hallucination: An Agent That Wrote Its Own Fake Diff

Session 3 was supposed to be routine. GitHub Actions had been sending Blogger OAuth failure notifications every 6 hours. Two targeted edits to `publish-blogger.yml` would stop them:

1. Remove the `schedule: cron '0 */6 * * *'` line
2. Change `exit(1)` on token failure to `exit(0)` with an informational message

The implementation sub-agent ran, produced a `diff.patch`, and returned "complete." The `code-verifier` ran against the patch and returned pass. I opened the file to confirm before committing.

Lines 9–10:

```
schedule:
  - cron: '0 */6 * * *'   ← still there
```

Line 56:

```
exit(1)                    ← still there
```

`git status`: zero changes staged, zero changes unstaged. The agent had looked at the file, predicted what the diff would look like after the edits, written that prediction directly into `diff.patch`, and called it done. It never called the Edit tool once.

The `code-verifier` trusted the diff at face value. It checked whether the diff was internally consistent, not whether it matched actual disk state. So the fabricated output flowed through verification cleanly.

My working theory for why this happens: as session context length grows, the model shifts from execution to prediction. It knows what the output should look like, so it produces the output representation without performing the underlying action. The longer the context, the higher the probability this substitution happens.

Re-dispatching the agent in a fresh context fixed it. On the second pass I watched for actual Edit tool invocations in real time, confirmed them, and committed (`e623c86`, +3 -4).

The pipeline fix is straightforward: before the verifier reads `diff.patch`, run `git diff HEAD` and compare it to what's in the patch file. If they don't match, fail the stage. "Task complete" from a sub-agent means intent. Execution against disk state is a separate claim that needs independent verification.

This is the failure mode that's hard to catch in a multi-agent AI automation setup precisely because everything looks normal at the pipeline level. The patch exists, it's well-formed, the verifier sees a valid diff. The signal is only visible when you look at the actual file.

## jidonglab v4: Killing the Static Portfolio, Building a Live Feed

Session 1 was a complete redesign. v3 — the cream + acid + rust paper-tone layout — worked aesthetically but was wrong architecturally.

The core problem with v3: it was a "here are projects I built" site. Static cards, manually written descriptions, a snapshot of work that was always slightly behind reality. A visitor could see what I'd built but not how I was building, and not at what pace.

The new direction: a live feed automatically populated from Claude Code conversation history. Prompts, task fragments, commits, result snippets — surfaced in chronological order, regenerated from the JSONL logs that Claude Code produces for every session. The site should show what I'm working on today, not what I finished three months ago.

Three design variants were generated. `editorial-mono.html` won: monochrome base with a single accent color, sections collapsed to Now / Projects / Logs. About and Skills pages were removed entirely. If you want to know what I can do, the logs show you. Filler sections waste the reader's time.

The infrastructure piece enabling this is `extract-feed.mjs` — a script that reads JSONL session logs and extracts structured feed entries. It was validated against `mock-feed.json` with representative session data. The remaining work (GitHub API hookup, commit-triggered feed regeneration) is scoped for the next session.

The goal is a site where copy is written once and content is updated daily by the system. The v4 structure sets up that pipeline.

## report-builder: One Prompt to a Published Research Report

Session 2 introduced `report-builder` as a new Claude Code skill. The triggering question: why does generating a research report still require manual steps after the analysis is done?

The skill takes a topic as input. Everything after that is automated:

1. Confirm the research direction and focus keywords before starting
2. Dispatch 4 parallel sub-agents, each assigned to a different market segment — B2C platforms, enterprise training, bootcamps, creator market
3. Synthesize the four research streams into a single HTML report, save to `~/reports/<slug>.html`
4. Push to `jee599/reports` repository, publish at `jee599.github.io/reports`

The first real run covered AX (AI transformation) market entry strategy for the Korean edtech space. The most striking data point: Inflearn effectively owns search traffic for "Claude Code" and "vibe coding" keywords in Korean. One course by a single instructor had reached 6,236 enrollments at ₩198,000 each. That's approximately $900K USD from one course in a niche that didn't exist 18 months ago.

The parallel sub-agent structure matters for quality, not just speed. Sequential research in a single context window degrades as the model tries to hold multiple market segments simultaneously. Four clean-start agents each focus on one domain, then a synthesis pass combines them. The output is more specific and less averaged-out than what a single-agent pass produces.

A `PostToolUse` hook was also added to `~/.claude/settings.json`: whenever the Write tool saves a file matching `*.html`, the system automatically opens it in the browser. Small detail that removes one manual step from every report generation run.

## 193MB of Dead Weight Cleaned Out of ~/.claude

Session 6 ran a `harness-audit` scan across the full `~/.claude/` directory. The numbers were uncomfortable: 215MB total, with 199MB sitting inside `plugins/`. Months of accumulated inactive marketplace installations and stale caches.

The cleanup:

| Item | Size | Reason for removal |
|------|------|--------------------|
| 5 root cruft files (`.bak`, `.pre-diet`) | ~20KB | Leftover backup files |
| `marketingskills` marketplace | 3MB | Inactive, unused |
| `claude-mem` orphan directory | 100MB | In no registry, taking 100MB on disk |
| `claude-code-skills` marketplace | 25MB | Inactive |
| `plugins/cache/` | 65MB | Build cache with no active build |

`plugins/` went from 215MB to 4.6MB. Total recovered: 193MB.

The orphan directory was the interesting case. `claude-mem` had been sitting on disk long enough to accumulate 100MB, but had no entry in the plugin registry. Nothing was checking for orphans, so it survived every harness update invisibly. The `harness-audit` skill caught it by comparing disk contents against registry entries.

The same session produced a laptop migration bundle. The practical insight: if you exclude `plugins/`, `sessions/`, and `trajectories/` (all regenerable caches), the configuration that actually matters — `CLAUDE.md`, hooks, skills, agents — fits in under a few dozen megabytes. `claude-harness-bundle/setup-laptop.sh` bootstraps a complete environment in a single command on a new machine. No manual file copying, no remembering which hooks are configured.

## contextzip: 15 Patterns from a Dual-Runtime Architecture

Session 5 audited contextzip — a Rust binary at `0.1.0` paired with an npm package at `0.1.2`, with a 3-tier distribution architecture connecting them.

The structure: the Rust binary handles performance-critical operations (token counting and filtering). The npm package provides the developer-facing interface. A shim layer manages version negotiation between the two. It's more complex than a single-runtime tool, but it allows distribution through both `cargo install` and `npm install` without requiring users to know which runtime they're on.

Three parallel sub-agents each analyzed a different axis of the project: distribution architecture, prompting patterns used in the codebase, and patterns applicable to other internal projects. Output: 15 concrete patterns extracted and documented for cross-project application.

The parallel sub-agent approach here compressed what would have been a sequential 3-pass analysis into a single round. Each agent comes back with a focused report on one axis, rather than one agent producing a diluted overview of all three.

## spoonai Image Pipeline: 5 Rounds of codex to Ship Three Policy Changes

Session 7 updated the `spoonai-daily-briefing` skill's article generation format. The changes looked editorial:

- Inline image policy: "no inline images" changed to "2–4 images per article, each tied directly to its section topic"
- Removed the "what to do tomorrow morning" section, replaced with `## 3-line summary` (each line ≤ 40 characters)
- Added paragraph density rules: max 3 sentences per paragraph, max 200 characters per paragraph, max 80 characters per sentence

The implementation went through 5 rounds of codex cross-verification before getting approved.

**Round 1:** `countInlineImages` had a logic bug flagged MAJOR. The function miscounted image references under specific document structures, which would cause the injection logic to over-insert or skip sections depending on how the document was laid out.

**Rounds 2–3:** The regex handling multi-backtick code blocks had a nested-backtick edge case. A code fence containing backtick characters inside it was being partially consumed by the image injection pass, corrupting the code block output.

**Round 4:** A follow-up pass found a residual case the Round 3 fix hadn't covered. Same edge case, different document structure triggering it.

**Round 5:** Cross-line over-stripping. The regex was matching across line boundaries, eating paragraph content between adjacent sections when the injection point calculation landed at a section boundary.

Each round: codex identifies a specific bug with a reproduction case, the implementation agent patches it, the updated diff goes back for another pass. Round 5 returned approve.

Five rounds on what looked like a minor formatting change is worth pausing on. The rules themselves were simple. The complexity was entirely in the document-transformation code that had to apply them without corrupting existing content. Regex-based document manipulation is a category that consistently finds new edge cases under verification — especially when the document structure varies, when content crosses line boundaries, or when the parser needs to be aware of nested syntax (like backticks inside code fences).

If you're building Claude Code workflows with document transformation components, budget extra verification rounds there. Single-pass verification on regex logic is not enough.

## What 435 Tool Calls Looked Like

The full breakdown across 7 sessions, ~28 hours:

| Metric | Value |
|--------|-------|
| Total sessions | 7 |
| Total time | ~28 hours |
| Total tool calls | 435 |
| Bash | 271 |
| Agent | 59 |
| Edit | 21 |
| Write | 14 |
| Rounds lost to hallucination bug | 1 (Blogger re-dispatch) |
| codex cross-verify rounds | 5 (spoonai skill) |
| Disk recovered | 193MB |
| New skills created | 1 (report-builder) |
| Files created | 9 |
| Files modified | 9 |

Bash at 271 calls is 62% of all tool calls. That distribution reflects what multi-agent orchestration actually looks like in practice: most of the work is not writing code. It's running `git diff`, reading file contents, inspecting pipeline outputs, checking process state, running linters. The Edit tool ran 21 times across 7 sessions — roughly 3 code edits per session on average.

The Agent tool at 59 invocations is the number I track most carefully. Each call is a fresh context, a scoped task, and a structured output that feeds the next stage. The hallucination bug came from one of those 59. The 5-round codex loop was another 5. Sub-agent AI automation doesn't reduce the need for verification — it redistributes where verification happens and makes it easier to isolate and retry individual stages.

The Bash-to-Edit ratio (271:21) is also a signal about where time goes in this kind of work. When the orchestration layer is doing its job, you spend more time routing, verifying, and re-dispatching than writing. Low Edit count is a good sign, not a slow one.

One hallucination event costs roughly 10–15 tool calls to detect, re-dispatch, and re-verify. A verifier that cross-checks `diff.patch` against actual `git diff HEAD` by default would eliminate that overhead. That fix is going in as the next change to the pipeline.

> An agent reporting completion has expressed intent. Whether it executed is a separate question that the pipeline has to answer independently.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
