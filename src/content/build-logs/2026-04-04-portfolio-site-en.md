---
title: "One .docx, 33 Subagents, 6 Hours: Building an iOS App with Claude Code Multi-Agent Pipeline"
project: "portfolio-site"
date: 2026-04-04
lang: en
pair: "2026-04-04-portfolio-site-ko"
tags: [claude-code, ios, swiftui, tca, subagent, xcode]
description: "Dropped a product spec docx into Claude Code and got a SwiftUI + TCA iOS app Phase 1 in 6 hours. 33 subagent dispatches, Xcode pain points, and a healing UI iteration."
---

I dropped `cloverfield-proposal-v3.docx` into Claude Code at 9am. At 3:04pm, Xcode showed a build success. 316 tool calls. A GPS-based four-leaf clover collection app — SwiftUI + TCA — Phase 1 done.

**TL;DR**: The `brainstorming → writing-plans → subagent-driven-development` skill chain makes spec-to-code possible in one pass. Xcode environment configuration still requires a human.

## From .docx to Spec to Plan to Code

The prompt was minimal:

```
implement phase by phase — check in with me as you go
```

Claude read the spec first. GPS-based clover collection, SwiftUI + TCA architecture, SpriteKit grass field view, HealthKit + CoreMotion step tracking, SwiftData persistence. An 8-week Phase 1 MVP scope with cost estimates.

The `brainstorming` skill settled the architecture strategy. Monorepo or split client/server? One clarification later, we moved straight to planning. The `writing-plans` skill broke the project into Week 1-2, 3-4, and 5-6 chunks, writing three plan files into `docs/superpowers/plans/`. The spec itself was saved as `docs/superpowers/specs/2026-04-03-cloverfield-mvp-design.md`.

## 33 Subagents — What Parallel Implementation Actually Looks Like

The `subagent-driven-development` skill was the engine. Each task in the plan was delegated to an independent subagent, then reviewed in two passes: spec compliance first, code quality second.

Before writing the plan, two research agents ran in parallel:

```
Agent "Research TCA latest API"  → verify @ObservableState migration patterns
Agent "Research XcodeGen setup"  → verify project.yml schema
```

The research caught a critical detail: `WithViewStore` was deprecated in TCA 1.7+ and replaced by `@ObservableState`. That went into the plan, and every agent implemented against the current API from the start. No mid-session API rework.

During implementation, commits landed almost simultaneously:

```
Agent "Implement Task 4: SplashView"      → commit 7bc8285
Agent "Implement Task 5: HealthKitClient" → StepData.swift + 2 files
Agent "Implement Task 6: MotionClient"    → commit feat: MotionClient
```

In Weeks 5-6, `WeatherClient`, `CloverStore (SwiftData)`, `RevealFeature (3D card flip)`, `GardenFeature`, and `ProfileFeature` ran on five agents simultaneously. The main thread acted only as an orchestrator — receiving completion signals, dispatching the next batch.

Final counts: Bash 95, Agent 33, Read 56, Edit 27. 33 top-level agent dispatches, each running dozens of internal tool calls, which is how you get to 316 total.

## The Xcode Tax — 30% of the Session

Code came fast. The runtime environment did not. Issues hit in sequence.

**Code signing**: `Signing for "Cloverfield" requires a development team.` This is GUI-only — you select a Team in Xcode's Signing & Capabilities tab. No file edit resolves it.

**Simulator download failure**: `xcodebuild -downloadPlatform iOS` exited with code 70. iOS 26.4 Simulator had a platform-level issue. Switched to iOS 17.0 Simulator. Even after that, "No supported iOS devices are available" kept appearing until I shared a screenshot showing where the device dropdown sits in Xcode's toolbar.

**Missing AppIcon**: `None of the input catalogs contained a matching app icon set named "AppIcon"`. Created `Assets.xcassets/AppIcon.appiconset/Contents.json` and added the path in `project.yml`.

**HealthKit entitlement crash**: Triggered the moment step tracking ran in the simulator.

```
NSError(domain: "com.apple.healthkit", code: 4,
  userInfo: ["NSLocalizedDescription": "Missing com.apple.developer.healthkit entitlement."])
```

`FieldFeature.swift:50`'s `Effect.run` threw an unhandled error. HealthKit requires an entitlement in the provisioning profile — code alone isn't enough. Added a dummy-data fallback to the `HealthKitClient` live implementation for simulator builds.

Every blocker shared the same shape: they live outside the filesystem. Claude Code edits files. Xcode configuration, Apple signing infrastructure, and device management do not.

## "Too Rigid" — Iterating Toward a Healing UI

The app built and ran in the simulator. Feedback came immediately:

```
The whole UI, icons, and images are terrible.
Can you make it more Apple-like and calming? It's too rigid. I want something warm and healing.
```

A `Clover.Colors` namespace went into `DesignSystem.swift` — `cream`, `sage`, `moss` palette, tokenized. All raw `Color(red:...)` values replaced. Three agents redesigned `FieldView`, `PocketView`, and `SplashView` in parallel.

One compile error surfaced: `CloverNode.swift` used `UIColor.blended`, which doesn't exist on `UIColor`. Implemented it directly using `CGFloat` lerp interpolation.

Clover rendering moved from SpriteKit particles to `ProceduralCloverView.swift` — drawing in SwiftUI with `Path` for stems and leaves, randomizing 1-2 four-leaf clovers per screen among regular three-leaf ones. Added `SKNode` pooling to keep rendering performant at tens of thousands of clovers.

App images were generated via Gemini API called directly from within the Claude Code session. Passed in an API key, used `gemini-2.0-flash-exp`, and wrote healing-tone clover images into `Assets.xcassets`. First result came back with an opaque background — requested transparent PNG regeneration.

## Same Day: uddental Mobile Responsiveness

Session three was a mobile audit of the uddental site. Invoking the `uddental-site` skill surfaced 24 issues across 7 core files. The critical ones: a `FloatingSchedule` import in `layout.tsx` that pointed to nothing (the build was broken entirely), spacing adjustments narrowing `gap-12` to `gap-6` on mobile, and converting hex opacity notation `${accent}0a` to proper `rgba()` values.

116 tool calls: Read 28, Edit 25. The ratio shows the pattern — read enough first, then touch the code. Build verified, Vercel deployed, all in one session.

## What the Skill Chain Actually Buys You

Running 316 tool calls in a single main-thread context would have blown the context window. Discovering TCA's deprecated API mid-implementation would have meant cascading rewrites across every feature file.

> The skill chain is a workflow, not a toolbox. `brainstorm → plan → implement` in that order cuts wasted work. The quality of each step depends on the one before it.

One `.docx`. Six hours. `build success`. Next session: WidgetKit + Live Activity.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
