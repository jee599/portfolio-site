---
title: "55 Hours, 62 Agents, 405 Tool Calls: Building a Claude Code Optimizer with Claude Code"
project: "portfolio-site"
date: 2026-03-21
lang: en
pair: "2026-03-21-portfolio-site-ko"
tags: [claude-code, rust, subagent, contextzip]
description: "Forked RTK, renamed to contextzip, shipped to NPM. 62 sub-agent calls, 405 tool calls, 55 hours. What multi-agent parallelism actually looks like in practice."
---

`npm install` dumps 150 lines. Docker logs scroll for 300. A Rust build error fills 80 lines. All of it goes straight into Claude's context window.

Then Claude forgets code from five minutes ago. Not a capability failure — a noise problem. The window fills with output garbage, and useful state gets pushed out.

So I built a fix: `contextzip`, a CLI that automatically compresses noisy command output before it reaches the model. The ironic part: I built it entirely with Claude Code.

**TL;DR** — Forked [RTK](https://github.com/rtk-ai/rtk), renamed it `contextzip`, published to NPM. 62 sub-agent calls, 405 tool calls, 55 hours. `npm install`'s 150 lines collapse to 3. `cargo build` errors surface only the 5 relevant lines. Available via `npx contextzip`.


## A Spec File, and Then Questions Came First

The source material was [RTK](https://github.com/rtk-ai/rtk) — an open-source CLI compression tool built for Claude Code. The plan: fork it, rename it to `contextzip`, ship it.

I dropped the spec into Claude. Before a single line of code was written, the brainstorming skill activated. Three questions appeared.

"The repo is called `tokenzip` — what should the binary name be?"

"Full source fork of RTK, or use it as a dependency?"

"Build everything at once, or gate it week by week?"

Under normal circumstances I'd have just started building and resolved these as I hit them. Having them surface upfront forced actual decisions: unify everything as `contextzip` (repo, binary, crate), full source fork, week-by-week validation gates.

Three minutes. Those three decisions shaped the entire 55 hours that followed.

The skill was surfacing "what do you need to decide" rather than "how to implement it." That distinction matters. Claude can't know what I want until I've decided it — and it turns out a structured prompt gets those decisions out before they become mid-session blockers.

After brainstorming came the plan. Week 1 through Week 3, 16 tasks total, each with target files, verification steps, and expected commit messages. One prompt sealed in the gates:

```
After each week, stop for validation before moving to the next.
```

That single instruction created mandatory checkpoints. Without it, 55 hours could have run off in any direction.


## What Happens When 62 Agents Work While You Decide

Once the plan existed, sub-agent driven development started. Claude began distributing tasks to parallel agents.

Task 4 (LICENSE update), Task 6 (`install.sh`), Task 7 (GitHub Actions CI/CD) launched simultaneously. Each agent sent a completion report; Claude kicked off the next batch. Any tasks without file conflicts ran in parallel — always.

The full 55-hour session breakdown:

| Tool | Calls | Primary use |
|------|-------|-------------|
| `Bash` | 176 | Builds, tests, execution verification |
| `Agent` | 62 | Parallel sub-agent dispatches |
| `Read` | 37 | File inspection |
| `Edit` | 28 | File modifications |
| **Total** | **405** | |

My own direct prompts across the entire session: roughly 80. The rest was agents.

The rename illustrated the speed gap most clearly. Replacing every `rtk` reference with `contextzip` across the source tree — Cargo.toml, data paths, string literals, binary names — is tedious manual work. Grep, edit, rebuild, verify, repeat. An agent reported "6 files updated, committed" in 15 minutes. Doing that solo would have taken most of a morning.

My role shifted from implementer to decision-maker. "Does this naming make sense?" "Move to Week 2." "Give me a cold audit of everything." The agents handled execution; I handled direction.


## Four Roles Auditing at the Same Time

As implementation wrapped up, I needed a cold assessment — not a rubber stamp.

```
Give me an honest, critical evaluation of everything — code quality,
features, docs, product readiness. Hold it to "shippable" standards.
```

Claude hired four agents simultaneously.

The **PM agent** audited market readiness. P0 issues: value proposition was unclear in the README. The page didn't answer "why contextzip over RTK." RTK remnants were still visible in user-facing copy.

The **senior engineer agent** reviewed code quality. 1,049 tests all passing — but `#[allow(dead_code)]` annotations were scattered across `build_cmd.rs`, `error_cmd.rs`, and several other files. Technical debt that needed clearing before the release.

The **UX/README agent** flagged documentation that didn't match actual behavior. Some savings percentages cited in the README differed from what the test suite actually measured. The verdict: rewrite the README from real numbers.

The **QA agent** ran end-to-end tests by actually executing the binary. It caught this:

```
contextzip 0.1.0 (based on rtk 0.30.1)
```

The binary name had been updated. The version string hadn't. `rtk` was hardcoded inside a string constant in a non-obvious location — not something a code reader naturally finds. You only find it by running the binary and looking at the output.

Four reports landed simultaneously. I worked through P0 issues first, feeding each fix back to agents for implementation.

Reviewing alone, I'd have caught 1-2 of these angles. Four roles in parallel exposed the blind spots across code, docs, marketing, and runtime behavior at the same time.

Performance validation happened in the same phase. An agent built 100 test cases covering each compression type, executed them, and produced aggregated results. The README now cites real numbers, not estimates.


## The Bug Category That Code Review Misses

The `--version` issue is worth expanding on, because it represents a whole class of problems.

After the renaming felt complete — grepping for `rtk` across the codebase returned nothing obvious — the QA agent executed `contextzip --version` and read the actual output. One word: `rtk`. Still there.

This is the difference between reading code and executing it. Review that only reads files misses runtime behavior. The agent ran the command, saw the output, flagged it in the same report alongside everything else.

Two other execution-only bugs surfaced the same way. When compressing Java stack traces, savings percentages went negative — the compressed output was *longer* than the original. The regex was capturing framework lines too narrowly, stripping lines that contained useful signal alongside the noise. Rust panic parsing had a similar gap: the pattern only matched standard panic format, missing variations where the thread name was prefixed.

The prompt that caught these: "What did you do here? Is it fully working?"

That's different from "What did you implement?" The first asks about behavior. The second asks about code. Agents respond to what you ask.


## Shipping a Rust Binary via NPM

The install goal: one command to get a Rust binary, no Rust toolchain required.

```bash
npx contextzip
```

The wrapper approach: `bin/install.js` detects OS and architecture at install time, downloads the appropriate prebuilt binary from GitHub Releases. Mac ARM, Mac x86, Linux each get their own binary. Windows turned out to be non-trivial to support correctly, so it was deferred.

GitHub Actions was built from scratch by an agent: automatic tests on every push and PR, automatic binary builds and NPM publish on release tags. Drop an NPM token into the repo secrets; CI handles `npm publish` from there.

This is the kind of work that feels like a half-day solo because of the configuration overhead — Actions syntax, platform matrix, NPM publish config. The agent wrote the YAML, committed it, and moved on.


## Promotion Automation and the Walls It Hit

Once the build was solid, the problem shifted: how to distribute it.

Claude generated platform-specific posts for Reddit (r/claudeai, r/rust), Hacker News, DEV.to, and X. Different angles, different tones, different lengths. A GitHub Actions workflow was set up to handle scheduled promotion.

One attempt was blocked immediately: automatically submitting a PR to the Awesome Claude Code list. That repo's contribution guidelines explicitly state that `gh` CLI submissions are auto-closed. The agent tried, read the rules, and reported: "Manual submission required." It stopped rather than finding a workaround. That was the right call.

X was also blocked. New accounts hit API rate limits for a period after creation — no workaround exists. Direct posting required.

Reddit likewise: new accounts can't auto-publish. The agent prepared clean, ready-to-paste post text for each platform. Manual submission became a five-minute task instead of a thirty-minute one.

The pattern Claude applies consistently: automate what's automatable, surface the blockers clearly, prepare the fallback. It doesn't try to brute-force past platform constraints.


## The First Reddit Comment Changed the README

After posting, feedback started coming in. One comment pointed out that contextzip is already used by Claude as an official hook — and asked where to see how to wire it up.

That made clear the README was missing its most practical section: the Claude Code hook integration. The workflow where `git`, `cargo`, and `npm` outputs are automatically piped through `contextzip` before reaching the model was buried or absent.

An agent rewrote the README. Then rewrote it again after another round of review. Then added translations.

English first, then Korean, Japanese, Chinese, German, French, Spanish, Portuguese, Russian — ordered by speaker population. Each version was written by an agent, reviewed for accuracy against the actual behavior, committed.

The README ended up being the most-revised file in the entire project. It's also, in retrospect, the most important one. "Install in 5 seconds, visible effect immediately" has to be legible in those first few lines. If it isn't, the tool doesn't spread regardless of how well it works.


## What This Session Actually Taught About Multi-Agent Claude Code

55 hours distilled into observable patterns:

The brainstorming skill surfaces "what to decide" before "how to implement." Three minutes of upfront clarity shapes everything downstream.

The plan skill creates structure that week-gate prompts enforce. "Stop after each week for validation" is a single instruction that prevents 55 hours of unchecked drift.

Sub-agents parallelize everything that doesn't share state. Independent files run simultaneously. This is where the speed comes from.

Four-role simultaneous audit exposes blind spots in code, docs, marketing, and QA at the same time. Any single-reviewer pass misses at least two of those angles.

And prompts matter more than they look. "Is it fully working?" is not the same question as "What did you implement?" One asks about behavior, one asks about code. The QA quality lives in that distinction.

**Session totals:** 405 tool calls, 62 agent dispatches, ~80 user prompts. 6 new Rust modules, 1,049 tests, NPM published, README in 9 languages.

Implementing this scope in Rust solo — no parallel agents — would have been two weeks minimum.

> Build tools with Claude Code. Use those tools to make Claude Code better. The loop keeps getting tighter.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
