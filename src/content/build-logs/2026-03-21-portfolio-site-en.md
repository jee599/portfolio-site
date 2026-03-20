---
title: "I Used Claude Code to Build a Claude Code Optimizer — 55 Hours, 62 Agents, 405 Tool Calls"
project: "portfolio-site"
date: 2026-03-21
lang: en
pair: "2026-03-21-portfolio-site-ko"
tags: [claude-code, rust, subagent, contextzip]
description: "Forked RTK, renamed to contextzip, shipped to NPM. 62 sub-agent calls, 405 tool calls, 55 hours. What multi-agent parallelism actually looks like in practice."
---

`npm install` dumps 150 lines. Docker logs hit 300. A Rust build error scrolls for 80. Every single line fills Claude's context window.

Then Claude forgets code from five minutes ago.

This isn't a capability problem — it's a noise problem. The context window fills with output garbage, and useful state gets pushed out. So I built a fix: `contextzip`, a CLI output compressor that strips noise before it reaches the model. The ironic part: I built it entirely using Claude Code.

**TL;DR** — Forked [RTK](https://github.com/rtk-ai/rtk), renamed it `contextzip`, published to NPM. 62 sub-agent calls, 405 tool calls, 55 hours. `npm install`'s 150 lines collapse to 3. `cargo build` errors surface only the signal. Available via `npx contextzip`.


## Three Minutes of Brainstorming That Shaped 55 Hours

The starting point was [RTK](https://github.com/rtk-ai/rtk) — an open-source CLI compression tool for Claude Code. The plan: fork it, rename it to `contextzip`, ship it.

I dropped the spec into Claude. Before touching code, the brainstorming skill activated. It surfaced decisions I hadn't consciously made yet.

"The repo is called `tokenzip` — what should the binary name be?"

"Full source fork of RTK, or use it as a dependency?"

"Implement everything at once, or gate it by week?"

Under normal circumstances I'd have just started building and figured these out as I hit them. Having them surface upfront forced real answers: binary name unified as `contextzip` across the board, full source fork, week-by-week validation gates.

Three minutes. Those three decisions shaped the entire 55 hours that followed.


## What 62 Agent Calls Actually Looks Like

After brainstorming, the planning skill produced a structured implementation plan: Week 1 through Week 3, broken into discrete tasks with clear dependencies.

Then the sub-agent driven development skill activated. Claude started distributing tasks to parallel agents.

Here's what that looked like in practice: Task 4 (LICENSE update), Task 7 (GitHub Actions CI/CD), and Task 6 (`install.sh`) ran simultaneously. Each agent sent a completion signal, and Claude kicked off the next batch. Tasks with no dependencies ran in parallel — always.

Over the full 55-hour session: **62 `Agent` tool calls, 176 `Bash`, 37 `Read`, 28 `Edit`**. I'd send a prompt, and while agents worked, I'd prepare the next batch or make architectural decisions.

The rename illustrated the speed difference most clearly. Replacing every `rtk` reference with `contextzip` across the entire source tree — Cargo.toml, data paths, string literals, binary names — is tedious solo work. Grep, edit, rebuild, verify, repeat. An agent reported "6 files changed, commit complete" in 15 minutes. Doing that alone would have taken most of a working day.


## Four Auditors Running Simultaneously

After implementation wrapped, I needed a cold assessment. The prompt:

```
Give me an honest, critical evaluation of everything — code quality, features, product readiness.
Hold it to "shippable as a real product" standards.
```

Claude hired four agents at once.

The **PM agent** audited market readiness. P0 issues: value proposition unclear in the README, RTK remnants still visible in user-facing copy.

The **senior engineer agent** reviewed code quality. 1,049 tests all passing — but `#[allow(dead_code)]` annotations scattered across multiple files.

The **UX/README agent** found documentation that didn't match actual behavior in several places.

The **QA agent** ran end-to-end tests by actually executing the binary. It caught that `--version` printed:

```
contextzip 0.1.0 (based on rtk 0.30.1)
```

The binary name was updated. The version string wasn't. `rtk` was hardcoded inside a string constant — not in an obvious location that a code reader would naturally find.

All four reports came back simultaneously. I worked through them in P0-first order, feeding fixes back to agents for implementation.

Reviewing alone, I'd have caught 1-2 of these angles. Four roles running in parallel surfaced the blind spots.


## The Bug That Static Code Review Would Have Missed

This one is worth its own section, because it illustrates something important about automated testing.

The renaming felt complete — grepping for `rtk` across the codebase returned nothing obvious. But the QA agent executed `contextzip --version` and read the actual output.

`rtk` was hardcoded inside a version string constant. It's not the kind of thing you catch by reading files. You catch it by running the binary.

This is the difference between reading code and executing it. Review that only reads files misses runtime behavior. The agent ran the command, saw the output, flagged the issue in the same report as everything else.

The session caught a few other execution-only bugs: negative savings percentages when compressing Java stack traces (a math bug only visible with real input), and an incomplete regex for Rust panic parsing. Each time, a fix agent went in, addressed it, committed.


## NPM Publishing and Promotion Automation

The install goal: `npx contextzip` as the single command for a Rust binary. The approach: wrap in an NPM package. `bin/install.js` detects platform and architecture at install time, downloads the appropriate prebuilt binary from GitHub Releases.

GitHub Actions CI/CD was agent-built from scratch: automatic tests on every push and PR, automatic binary builds and NPM publish on release tags. No manual release process.

Promotion was more complex. Reddit, Hacker News, DEV.to, X, LinkedIn — each platform needs a different angle and tone. Claude generated platform-specific posts for each, automated what was automatable via GitHub Actions, and prepared clean copy-paste text for platforms requiring manual submission.

One attempt failed: automatically submitting a PR to the Awesome Claude Code list. That repo explicitly blocks `gh` CLI submissions in its contribution rules. The agent attempted it, read the rules, and reported back: "needs to be submitted manually." It stopped rather than trying to force a workaround. That was exactly the right call.


## The Numbers

Full session stats:

| Tool | Calls | Purpose |
|------|-------|---------|
| `Bash` | 176 | Builds, tests, execution verification |
| `Agent` | 62 | Parallel sub-agent calls |
| `TaskUpdate` | 50 | Progress tracking |
| `Read` | 37 | File inspection |
| `Edit` | 28 | File modifications |
| **Total** | **405** | |

**55 hours 40 minutes.** Six new Rust modules shipped: `ansi_filter`, `error_cmd`, `web_cmd`, `build_cmd`, `pkg_cmd`, `docker_cmd`. 1,049 tests passing.

Implementing this scope in Rust solo — without parallel agents — would have been two weeks minimum.


## The Loop

`contextzip` is live. When Claude Code runs `npm install`, a hook intercepts it, pipes output through `contextzip`, and what hits the context is 3 lines instead of 150. `cargo build` errors surface only the relevant failure. Docker logs compress to signal.

The tool makes Claude Code more effective. Claude Code built the tool. The feedback loop is real.

> Build tools with Claude Code. Use those tools to make Claude Code better. The loop keeps getting tighter.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
