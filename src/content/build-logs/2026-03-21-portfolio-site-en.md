---
title: "55 Hours Using Claude Code to Build a Tool That Makes Claude Code Better"
project: "portfolio-site"
date: 2026-03-21
lang: en
pair: "2026-03-21-portfolio-site-ko"
tags: [claude-code, rust, subagent, contextzip]
description: "I forked RTK into contextzip using 62 subagents, 405 tool calls, and 55 hours. npm install went from 150 lines to 3. Here's the full build report."
---

150 lines of `npm install` output. 300 lines of Docker logs. 80 lines of Rust build errors. All of it filling Claude's context window.

Claude forgets earlier code when the context is packed with noise. That's not a limitation — it's physics. A context window flooded with irrelevant terminal output has less room for the code that actually matters.

So I built a fix: `contextzip`, a CLI that automatically compresses tool output before it reaches the model. The irony? I built it with Claude Code.

**TL;DR**: Forked [RTK](https://github.com/rtk-ai/rtk) into contextzip. 62 subagent calls, 405 tool calls, 55 hours. `npm install` went from 150 lines to 3. `cargo build` errors from 80 lines to 5 essential ones. Published to npm. The loop closes: Claude Code builds the tool that makes Claude Code better.


## Three Questions Before a Single Line of Code

The source material was [RTK](https://github.com/rtk-ai/rtk) — an open-source CLI compression tool for Claude Code. The plan was simple: fork it, rename everything to `contextzip`, ship it.

I dropped the spec file into Claude. Instead of starting immediately, a brainstorming skill triggered. Claude surfaced three questions.

"The repo is called `tokenzip` in the spec — what should the binary name be?"

"Are you forking RTK's source, or using it as a dependency?"

"One continuous session, or weekly validation gates?"

Left to myself, I would have started coding and hit these decisions mid-implementation — the most expensive time to make them. Having them front-loaded forced clarity before a single file was touched.

The answers: binary/repo/crate all named `contextzip`, full source fork, weekly gates.

Three minutes. Fifty-five hours of direction set.

The pattern is worth noting. Claude's brainstorming approach doesn't ask "how should we implement this?" It asks "what do you need to decide first?" I provide direction, Claude executes. The quality of decisions upstream determines the quality of output downstream.

After brainstorming came the plan: Week 1 through Week 3, broken into 16 tasks. Each task specified files to modify, a verification method, and an expected commit message. Not vague milestones — concrete, checkable units.

One prompt shaped the entire structure: "Validate and confirm before moving to the next week."

That single constraint created automatic quality gates at zero overhead.


## What 62 Agents Did While I Made Decisions

With a plan in place, parallel agents started distributing tasks.

Here's how it actually looked: Task 4 (update LICENSE with RTK attribution), Task 6 (write install.sh), and Task 7 (set up GitHub Actions CI/CD) started simultaneously. Each agent reported completion, Claude queued the next batch. Any tasks without file conflicts ran in parallel.

Task 4 — updating the LICENSE file with proper RTK attribution — took 15 minutes with an agent. If I'd done it myself: find the file, read RTK's original license, decide how to format the attribution, write it, commit. Probably an hour.

Across the full 55-hour session, the `Agent` tool was invoked 62 times. `Bash` ran 176 times — mostly builds, tests, verification. Agents implement, Claude runs and checks. `Read` 37 times, `Edit` 28 times. My direct prompts across the entire session: roughly 80.

My role shifted from implementer to decision-maker. "Is the naming consistent?" "Move to Week 2." "Cold audit everything." The work changed character, not just volume.


## The Bug That Code Review Would Have Missed

Renaming RTK → contextzip seemed complete. Late in Week 3, a QA agent ran the binary directly and checked the actual output.

```
contextzip 0.1.0 (based on rtk 0.30.1)
```

The binary name was updated. The version string still had `rtk` hardcoded. Not in an obvious place — embedded in version formatting logic that grep wouldn't surface without the right query.

This is why a QA agent that *runs* things is different from a review agent that *reads* things. Static analysis missed it. Execution caught it.

Two other bugs surfaced the same way. Java stack traces were producing negative savings — the compressed output was longer than the input. The regex was too aggressive, collapsing framework lines and core application lines together, stripping more than it should. Rust panic parsing had a similar gap: only standard panic format was handled, missing variants with thread names in the output.

The prompt that surfaced these: "What did you do here? Is everything actually working?"

That's a different question from "what did you implement?" The first asks for a feature list. The second asks for evidence of function. QA quality lives in which question you ask.


## Running Four Audits Simultaneously

Near the end of implementation, I asked for a hard evaluation.

"Give me an objective assessment of everything. Code, features, all of it. Be brutal. Commercial-release standard."

Claude spawned four agents at once.

The PM agent audited market readiness. Value proposition was unclear — "why contextzip over RTK?" had no answer in the README. RTK artifacts still present. P0.

The senior engineer agent reviewed code quality. 1,049 tests passing, but `#[allow(dead_code)]` annotations scattered across `build_cmd.rs`, `error_cmd.rs`, and others. Technical debt to clear before release.

The UX/README agent found documentation mismatches. Savings percentages in the README didn't match actual test results. "The README needs to be rewritten from real benchmarks."

The QA agent ran end-to-end tests. That's where the `--version` string issue was caught.

Four reports arrived simultaneously. I worked through them P0-first, dispatching fix agents in order.

Solo review covers 1-2 perspectives. Four simultaneous roles surface code, documentation, marketing, and QA blind spots at once. The 100-test-case performance validation also ran here — agents generated cases, executed them, aggregated results. Real numbers that could actually appear in the README.


## Shipping a Rust Binary via npm

The goal: `npx contextzip` installs and works. No Rust toolchain required.

The approach: npm wrapper. `bin/install.js` detects OS and architecture, downloads the correct pre-built binary from GitHub Releases. Mac ARM, Mac x86, Linux. Windows was assessed by the agent and deferred — support complexity wasn't worth it for v1.

GitHub Actions was written entirely by the agent. Push/PR triggers test runs. Release tags (`v*`) trigger platform-specific binary builds, upload to GitHub Releases, and the npm package downloads from those releases on install.

I handed over an npm token. The agent wrote the CI configuration and committed it. The full pipeline — tag → build → release → publish — assembled without me touching a YAML file.

Building this from scratch manually, from CI design through implementation: half a day, conservatively. With agents: one pass.


## Promotion Automation and the Walls

Once the tool was built, the problem changed. How to get it in front of people?

Claude drafted Reddit posts for r/claudeai and r/rust, a Hacker News submission, a DEV.to article, and a GitHub Actions workflow for automated promotion.

The Awesome Claude Code list was the first wall. The agent attempted to submit via `gh` CLI. Blocked immediately — the repo's CONTRIBUTING guide explicitly states "no automated submissions via gh CLI, they're auto-closed." The agent read the rules, reported "manual submission required," and stopped.

That's the right call. The alternative — brute-forcing past stated repository policies — would have gotten the submission permanently ignored.

X (Twitter) API restrictions blocked automation for new accounts. No workaround. Reddit new-account restrictions prevented automated posting too.

The agent prepared copy-paste ready posts for each platform. Manual posting became a 5-minute task instead of a research exercise.

Automate what can be automated. Report what can't. Prepare the fallback. Claude handles this triage correctly.


## Reddit, Then Iteration

After posting, one piece of feedback stood out: users wanted to understand how contextzip integrates with Claude Code hooks. The connection between hook configuration and actual compression behavior wasn't obvious from the README.

The agent rewrote the README to make the hook integration flow explicit. That became the most-revised file in the project — written, reviewed, rewritten, reviewed again. Ten-plus language translations were added in order of speaker count: Korean, Japanese, Chinese, German, French, Spanish, Portuguese, Russian.

The lesson: a README is a marketing document. The one metric that matters is whether someone can understand what the tool does and how to use it in 10 seconds. If the answer is no, the implementation doesn't matter.


## Patterns from 55 Hours

A few things that repeated throughout:

**Brainstorming before building surfaces decisions, not implementation steps.** The 3-minute session at the start shaped every hour after. Decisions made upstream are cheap. Mid-implementation decisions are expensive.

**Weekly gates prevent drift.** "Validate before moving forward" as a constraint turns a continuous session into verified checkpoints. Without it, 55 hours flows in any direction.

**Parallel agents for non-overlapping tasks.** Any work that doesn't share files runs simultaneously. This is where speed actually comes from.

**Four-role audit over solo review.** PM, engineer, UX, QA together expose blind spots any single perspective misses.

**"Did it work?" is a different question than "what did you build?"** The second surfaces feature lists. The first surfaces gaps.

Session stats: 405 total tool calls, 62 agent invocations. My direct prompts: ~80. Everything else was agents working.

Doing this scope in Rust solo — 6 new modules, 1,056 tests, npm publishing, multilingual documentation — would have taken two weeks. 55 hours sounds long until you look at the output.

> Claude Code builds the tool. The tool makes Claude Code better. The loop compounds.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
