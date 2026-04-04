---
title: "One Word Doc to iOS App in 6 Hours: Claude Code Multi-Agent Pipeline (316 Tool Calls)"
project: "portfolio-site"
date: 2026-04-04
lang: en
pair: "2026-04-04-portfolio-site-ko"
tags: [claude-code, subagent, ios, swiftui, tca, parallel-agents]
description: "Dropped a Word spec file. 6 hours later, a SwiftUI + TCA iOS app skeleton built itself. Here's the brainstorm → plan → subagent skill chain that made it happen."
---

I dropped a single Word file into Claude Code. `cloverfield-proposal-v3.docx` — a product spec for a GPS-based four-leaf clover collecting app. 6 hours and 4 minutes later, Xcode showed a successful build.

**TL;DR** Chain three Claude Code skills — `brainstorming` → `writing-plans` → `subagent-driven-development` — with parallel research agents, and you can go from a product spec to working code in one session. The catch: Xcode environment setup is still human territory.

## How the Skill Chain Turns a Spec into Code

The moment the session started, three skills fired in sequence.

First, `brainstorming` read the spec and asked exactly one clarifying question: monorepo or separate client/server? One answer, scope locked. Then `writing-plans` broke an 8-week MVP into three plan files (Week 1-2 / 3-4 / 5-6) and dropped them into `docs/superpowers/plans/`. Each file came with target file paths, TCA reducer structure, and test strategy already written out.

Once the plans existed, `subagent-driven-development` started dispatching individual tasks to subagents. `CloverEngine`, `LocationClient`, `HealthKitClient`, `MotionClient`, `SplashView`, and `FieldScene` landed in commits nearly simultaneously. The main thread only orchestrated.

The tool call distribution tells the whole story: Bash 95, Read 56, Agent 33, Edit 27 — 316 total. Agent appears 33 times at the top level, but each subagent ran dozens of its own tool calls internally. That's where the number climbs.

## Two Research Agents Running in Parallel

Before writing the Week 1-2 plan, research ran first. TCA (The Composable Architecture) breaks its API across versions — `WithViewStore` was deprecated in 1.7 and replaced by `@ObservableState`. XcodeGen's `project.yml` schema needed direct verification too.

Two subagents went out in parallel:

```
🐦 AgentCrow — dispatching 2 agents:
1. @research → "Research TCA latest @ObservableState API patterns for 1.7+"
2. @research → "Research XcodeGen project.yml schema for iOS 17+ targets"
```

Both results came back, plan writing started immediately. Sequential would've added 10 minutes. Parallel made it free.

## The Parts Claude Code Can't Touch

Code generation was fast. The runtime environment was not.

**Signing.** "Signing for Cloverfield requires a development team." This is a GUI operation — Xcode Signing & Capabilities, pick an account from a dropdown. No file edit solves it.

**Simulator.** iOS 26.4 Simulator download failed with exit code 70. Switched to iOS 17.0. "No supported iOS devices are available" kept appearing. Found the device selector dropdown by sharing a screenshot.

**HealthKit entitlement.**

```
NSError(
  domain: "com.apple.healthkit",
  code: 4,
  userInfo: ["NSLocalizedDescription": "Missing com.apple.developer.healthkit entitlement."]
)
```

`FieldFeature.swift` threw an unhandled error from `Effect.run`. HealthKit needs a provisioning profile and entitlements file — code alone isn't enough. Added fallback handling to `HealthKitClient`'s live implementation to mock data in the simulator.

All three blockers had the same shape: they live outside the filesystem. Claude Code edits files. Xcode configuration lives in GUI state, Apple's signing infrastructure, and device management. That boundary is real and worth knowing before you start.

## Generating App Images with Gemini Inside the Session

No images meant empty boxes everywhere in the UI. One instruction — "use Gemini API with a precise prompt to generate images" — kicked off Gemini API calls directly inside the Claude Code session.

Gave it the API key and had it look up the latest available model. The plan: generate clover-themed healing images and write them directly into Assets.

First results missed. Opaque backgrounds instead of transparent PNGs. Clover style didn't match the app's visual tone. The fix was to split the approach: use Gemini for background and atmospheric assets, draw the clover itself procedurally in `ProceduralCloverView.swift`. SpriteKit's `CloverNode` generates three-leaf and four-leaf clovers at random ratios, tuned so 1-2 four-leaf clovers appear per screen.

## Session 3: 48 Minutes on Mobile Responsive

Same day, after the iOS session wrapped, a 48-minute session on the uddental site's mobile layout.

Called the `uddental-site` skill. It immediately identified the project location and stack, then surfaced 24 issues across 7 core files. The critical ones: a `FloatingSchedule` import error that was breaking the build entirely, spacing adjustments changing `gap-12` to `gap-6` on mobile, and converting hex opacity notation (`${accent}0a`) to `rgba()`.

116 tool calls, Read 28, Edit 25 — nearly equal. Read enough first, then edit. Build passed, deployed, session done.

## Where Claude Code Skills Actually Live — Session 1

Session 1 was a 3-minute question: "Where are Claude Code skills stored?"

```
~/.claude/skills/          # global skills
~/.claude/plugins/         # plugin skills (marketplace)
{project}/.claude/skills/  # project-local skills
```

Project-local skills only apply inside that directory. Moving your setup to a new machine or project requires the full `~/.claude/` directory — `settings.json` with `enabledPlugins`, plugin code under `plugins/marketplaces/`, and `CLAUDE.md`. Skills without plugins are half the setup.

Environment portability matters more than it looks like upfront.

> The skill chain isn't a tool — it's a workflow. Respect the order: brainstorm → plan → implement. The quality of each step depends on the one before it.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
