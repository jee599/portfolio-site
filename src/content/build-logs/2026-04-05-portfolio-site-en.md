---
title: "From a .docx Spec to iOS App Skeleton in 6 Hours: Claude Code Parallel Subagent Pattern"
project: "portfolio-site"
date: 2026-04-05
lang: en
pair: "2026-04-05-portfolio-site-ko"
tags: [claude-code, ios, swiftui, tca, subagent, multi-agent]
description: "316 tool calls, 33 agent dispatches, 6 hours: how a single .docx spec became a SwiftUI+TCA iOS skeleton using parallel subagents."
---

316 tool calls. 33 agent dispatches. One `.docx` file. Six hours later, a full SwiftUI + TCA iOS project skeleton was ready with 7 features committed — Splash, HealthKit step tracking, SpriteKit field, clover picking, reveal, garden, and profile.

**TL;DR**: The more detailed the spec, the shorter the first prompt. Splitting features into independent subagents enables true parallel execution. Xcode quirks are yours to solve outside the session.

## The First Prompt Was a File Path

```
/Users/jidong/Downloads/cloverfield-proposal-v3.docx
```

That was the entire first message. Claude read it. GPS-based four-leaf clover collection healing app. iOS native (SwiftUI 17+) + TCA + SpriteKit + SwiftData. Backend on Cloudflare Workers + D1 + R2. MVP cost: $134. Monthly: $10–15. Screen-level motion specs included haptic timing.

Next prompt: "Implement phase by phase — confirm before each step."

Claude invoked the brainstorming skill. Because the spec was already dense, the conversation was short. Two things to confirm: project path (`/Users/jidong/Projects/Cloverfield/`) and week-based scope separation. Then writing-plans skill generated three implementation plan files covering Week 1–2, 3–4, and 5–6.

## How Parallel Subagent Dispatch Actually Works

With the plan ready, subagent-driven-development skill kicked in. One agent per feature. Independent tasks run in parallel; tasks with dependencies run sequentially.

For Week 1–2, two research agents ran in parallel first:

- `Research TCA latest API` — confirmed `@ObservableState` pattern in TCA 1.7+
- `Research XcodeGen setup` — `project.yml` structure and build settings

Research results fed back into the plan, then implementation agents dispatched by task:

```
Task 4: SplashView       →  commit 7bc8285
Task 5: HealthKitClient  →  commit e8d5c24
Task 6: MotionClient     →  commit feat: MotionClient...
```

Each agent created files, committed, and returned a task notification. The main context only received summaries. Key rule: agent scopes cannot overlap. Feature directory boundaries are the unit of isolation — two agents touching the same file means a merge conflict.

Week 3–4 dispatched CloverEngine, LocationClient, SpriteKit FieldScene, PickingFeature, and PocketFeature simultaneously. Five agents, five commits.

## The Xcode Time Tax

The first build failed for three reasons:

1. `WithViewStore` deprecated — TCA 1.7 requires migration to `@ObservableState`
2. Missing `AppIcon` asset — no `Contents.json`, build fails
3. No signing team — `Signing for "Cloverfield" requires a development team`

Claude fixed 1 and 2. Number 3 required clicking through Xcode GUI manually. The iOS Simulator download failed with exit code 70 — downloaded iOS 17.0 simulator manually and connected it.

HealthKit entitlement error also surfaced:

```
NSError(
  domain: "com.apple.healthkit",
  code: 4,
  userInfo: ["NSLocalizedDescription": "Missing com.apple.developer.healthkit entitlement."]
)
```

Claude read the error and explained how to fix it. Actually enabling the HealthKit capability in Xcode settings was a manual step. These three things — Xcode config, simulator setup, entitlement activation — cost about 30 minutes outside the session. Claude can't do GUI interactions.

Build success confirmed 6 hours after session start.

## Design Iteration: "Too Stiff"

First look at the simulator. User feedback: "Where are the images? And the UI needs more polish." "Can you make the font and design more Apple-like and healing? It feels too stiff."

Design iteration also went through agents:

- `Polish FieldView warm healing design`
- `Polish PocketView warm healing`
- `Polish SplashView warm healing`

Cream beige backgrounds, warm greens, SF Rounded font. Color tokens consolidated into `DesignSystem.swift` so every view shares the same palette.

Next feedback: "Mix in some four-leaf clovers among the three-leaf ones, randomly placed, one or two per screen." Added random seed logic to `CloverNode` in SpriteKit to determine whether the fourth leaf generates.

## Parallel Dental Blog Writing: 3 Posts at Once

Same day, session 3 covered mobile responsive fixes for the uddental site. 47 Read calls to scan all components, 24 issues found. Critical ones: missing `FloatingSchedule` import (build error), `gap-12` → `gap-6` on mobile, CTA button padding.

After the build was clean, three Naver dental blog posts ran in parallel:

```
Agent "Write blog 001 implant bone graft"
Agent "Write blog 002 gum disease"
Agent "Write blog 003 pediatric dentistry"
```

Each post: 5,000–6,000 characters, meeting Naver algorithm specs — 7–8 H2 headings, keyword density targets, 22–25 image alt tags.

After writing, cross-validation ran with 3 agents: medical compliance, design quality, Naver SEO algorithm. Feedback applied, then re-validated against an 18-item checklist. Post 003 passed 18/18. Posts 001 and 002 needed 1–2 additional fixes.

Finally, Gemini API generated 3D medical illustrations — 3 agents, 6 images per post, 18 total in parallel. Topics: bone graft cross-section anatomy, gum bleeding causes, primary tooth eruption sequence — all in medical 3D illustration style.

## The Numbers

| Session | Duration | Tool Calls | Key Tools |
|---------|----------|-----------|-----------|
| Skills Q&A | 3 min | 5 | Glob, Read |
| Cloverfield iOS App | 6 hrs 4 min | 316 | Bash(95), Read(56), Agent(33) |
| uddental + Blog | 20 hrs 35 min | 170 | Read(47), Edit(29), Agent(25) |

Agent tool called 58 times total. Separating research, implementation, and validation into agents keeps the main context clean — the main thread only orchestrates. A clean context means more accurate decisions on what to do next.

72 TaskUpdate calls tracked subagent state. When agents run in parallel, you have no idea when they'll finish — notification-based task tracking is mandatory.

## What Spec Quality Actually Controls

The brainstorming phase was short in the Cloverfield session because the spec already included motion specs, haptic timing, and budget projections. Spec density determines first-prompt length.

The inverse is also true: the three things Claude cannot do for you are GUI interactions, developer account configuration, and entitlement activation. Plan for 30 minutes outside the session for these.

The subagent pattern requires independence as a precondition. Two agents modifying the same file causes conflicts. Scope agents by feature directory, and explicitly state "scope: this directory only" in each agent prompt. That's the baseline.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
