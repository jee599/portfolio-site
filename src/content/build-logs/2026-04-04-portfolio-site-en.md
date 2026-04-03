---
title: "From .docx to iOS App Skeleton in 6 Hours: 316 Tool Calls with Claude Code"
project: "portfolio-site"
date: 2026-04-04
lang: en
pair: "2026-04-04-portfolio-site-ko"
tags: [claude-code, ios, swiftui, tca, subagent, cloverfield, uddental]
description: "Dropped a Word spec file, got an iOS app skeleton in 6 hours. 316 tool calls, 34 sub-agents, and one extended Xcode fight."
---

316 tool calls. 19 files created. 6 hours and 4 minutes. All from dropping a single `.docx` file.

**TL;DR** Hand Claude a Word spec document and run the `subagent-driven-development` skill — it handles planning through feature implementation in parallel. The catch: Xcode still needs a human, and AI-generated images need a rethink.

## The Entire Input Was One Word File

`/Users/jidong/Downloads/cloverfield-proposal-v3.docx` — that was it. A detailed spec for a GPS-based four-leaf clover hunting app, complete with splash motion specs, haptic timing, and an AI-First resource strategy.

Claude read the file and immediately proposed a Phase structure. It split the 8-week MVP into Week 1-2 / 3-4 / 5-6 chunks and generated a planning document for each phase under `docs/superpowers/plans/`. The `writing-plans` skill kicked in with this framing:

> "Planning all of Phase 1 at once is too large. Plan Week 1-2 first, then plan the next phase after completion."

That framing mattered. Instead of one giant plan, each phase got its own document. Research for TCA's latest API and XcodeGen setup ran in parallel — both agents came back with results simultaneously.

## What `subagent-driven-development` Actually Does

When you run this skill, Claude becomes a pure orchestrator. It delegates each feature task to an independent sub-agent, collects the results, and advances to the next batch.

Tasks that ran in parallel during this session:

- `Research TCA latest API` + `Research XcodeGen setup` (simultaneously)
- `Implement Task 4: SplashView` + `Task 5: HealthKitClient` + `Task 6: MotionClient` (simultaneously)
- `W5-6 Task 1: WeatherClient` + `Task 2: CloverStore` + `Task 3: RevealFeature` + `Task 4: GardenFeature` + `Task 5: ProfileFeature` (5 at once)

Each agent created files and committed. `CloverEngine`, `LocationClient`, `PickingFeature`, `PocketFeature` — 19 files over 6 hours. The main thread did nothing but receive task notifications and dispatch the next batch.

Tool call breakdown: Bash 95 · Read 56 · Edit 27 · Agent 33.

One issue worth flagging: code style drifted between agents. `WithViewStore` deprecation warnings appeared across multiple files. If you don't specify version and pattern explicitly in the sub-agent prompt — something like "TCA 1.7+, use `@ObservableState`" — each agent picks its own version baseline.

## The Xcode Wall

The code arrived fast. Xcode did not cooperate.

**Signing error.** `Signing for "Cloverfield" requires a development team.` You have to select the development team in the Xcode GUI. No automation path exists.

**AppIcon error.** `None of the input catalogs contained a matching app icon set named "AppIcon".` Resolved by generating `Contents.json`.

**HealthKit entitlement error.** Crashed at runtime:
```
NSError(domain: "com.apple.healthkit", code: 4,
  userInfo: ["NSLocalizedDescription": "Missing com.apple.developer.healthkit entitlement."])
```
`FieldFeature.swift:50`'s `Effect.run` threw instead of swallowing the error. Fixed by adding HealthKit permissions to `.entitlements`.

**iOS 26.4 Simulator error.** `Redownload iOS 26.4 Simulator and try again.` Worked around by targeting the iOS 17.0 simulator. Finding the right simulator download required manual intervention — Claude responded with "I can't find it."

**`UIColor.blended` doesn't exist.** An agent used a non-existent API. `UIColor` has no `blended(withFraction:of:)` method. Manual fix required.

## Why Gemini Image Generation Didn't Work

After feedback that the UI felt sterile, the plan was to generate assets via Gemini API. Handed over the API key with instructions to keep regenerating until satisfied. The result in one line:

> "The images look identical. This is terrible."

The generated clover assets weren't transparent-background PNGs. Dropping them into `Assets.xcassets` created background color conflicts on screen. The pivot: draw procedurally with SwiftUI `Canvas`. That became `ProceduralCloverView.swift`.

The clover field logic also had a structural problem. A field of three-leaf clovers needs rare four-leaf clovers mixed in randomly — but you can't manage hundreds of thousands of clover instances as image assets. The solution was seed-based procedural generation, with probability tuned to produce one or two four-leaf clovers per screen.

## Side Session: uddental Mobile in 48 Minutes

Session 3 was a separate project — mobile responsiveness fixes for the uddental dental clinic site. 48 minutes, 116 tool calls.

A missing `FloatingSchedule` import in `layout.tsx` was breaking the build. Catalogued 24 mobile issues, modified 9 files. In `doctors/page.tsx`, a hex opacity template literal pattern (`${doc.accent}0a`) was failing to parse in some browsers — converted to `rgba()` format. Deployed immediately after the fixes.

## Session 1 Note: How Claude Code Skills Are Scoped

Quick reference for how skill scope works:

| Location | Scope |
|----------|-------|
| `~/.claude/skills/` | Global |
| `~/.claude/plugins/` (marketplace) | Global |
| `{project}/.claude/skills/` | Project-only |

When moving to a new machine, you need the entire `~/.claude/` directory. Both the `enabledPlugins` list in `settings.json` and the actual plugin code in `plugins/marketplaces/` need to travel together for the environment to be identical.

## Today's Numbers

| Metric | Value |
|--------|-------|
| Total sessions | 3 |
| Total tool calls | 437 |
| Cloverfield session | 316 tool calls, 6h 4m |
| Files created | 19 |
| Files modified | 21 |
| Sub-agent dispatches | 34 |
| Top tools | Bash 111 · Read 85 · TaskUpdate 72 · Edit 52 |

Spec document to app skeleton in a single day is possible. Xcode still needs a human in the loop.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
