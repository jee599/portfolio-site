---
title: "Remote-Controlling Claude Code via Telegram: 7 Sessions, 670 Tool Calls, One iOS App"
project: "portfolio-site"
date: 2026-04-04
lang: en
pair: "2026-04-04-portfolio-site-ko"
tags: [claude-code, ios, swiftui, subagent, harness-pattern, telegram, uddental]
description: "One day: dental site redesign, PG contract prep, and a full iOS app from a docx spec. 7 sessions, 670 tool calls, all triggered from Telegram."
---

Seven sessions. 670 tool calls. Over half of those — 300 — happened in a single session building an iOS app from scratch using a Word document as the only spec. Most of the day was spent sending short Telegram messages.

**TL;DR**: The Telegram → Claude Code remote control pattern is now a stable part of my workflow. I documented the harness design pattern in CLAUDE.md, and used parallel subagent dispatch to complete Phase 1 of a GPS-based iOS app called Cloverfield.

## Sending "안녕" to Start a Claude Code Session

Session 1 kicked off with a Telegram message. The Claude Code Telegram plugin receives messages and routes them to the active session. The full thread went from `안녕` (hello) all the way to `agentcrow 지워줘` (remove agentcrow).

```
커피챗 프로젝트로 가줘
아그리고 지금 전체폴더 컨텍스트에 불필요한거 있지 agentcrow 지워줘
```

The core value of this pattern: **location independence**. From a bathroom, while commuting — send a single project name like `uddental` and Claude loads that project's context and waits. No lengthy explanation needed. One word switches the context.

The downside is real. Telegram messages are short and context-free, so Claude often asks for clarification. Pasting long error logs is also painful over Telegram.

## Ripping Out AgentCrow and Documenting the Harness Pattern

The main task in Session 1 was a `CLAUDE.md` overhaul. AgentCrow — the previous agent dispatch system — was removed entirely. In its place, I formally documented the harness design pattern in the global config.

The conversation that triggered it:

```
하네스 디자인은? 서브에이전트 + 하네스 디자인이 가능해? 아니면 불필요해
```

The harness pattern separates roles cleanly. `Explore` agents do read-only research. `general-purpose` agents handle file modifications. `code-reviewer` agents validate after implementation. The main thread only orchestrates and makes final decisions. This is what landed in `CLAUDE.md`:

```markdown
### Role Division (Harness Pattern)
- Research: Explore (read-only, codebase + web search)
- Implementation: general-purpose (file writes included)
- Verification: code-reviewer (runs after implementation)
- Main thread: orchestrator only — judgment, coordination, final decisions
```

The AgentCrow hook was also removed from `settings.json`. A JSON formatting error crept in mid-edit and had to be fixed. 33 Bash calls and 5 Edits for what's essentially a config file — tool calls add up fast even on non-code work.

## uddental: 171 Tool Calls, Full Site Redesign

Session 3 started with a single word: `uddental`. The `uddental-site` skill loaded automatically, the project context was ready, and the instruction that followed was minimal:

```
지금 걸로 배포해주는데, 디자인 좀 더 큼직큼직 임팩트 있게 바꿔줘
일단 해봐 그리고 다른 페이지들도 메인 페이지 디자인처럼 바꿔줘 일관되게
```

Claude asked for approval before touching anything. Hero section: `70-80vh → 90vh`. Headlines: `5xl → 7xl`. Section padding: `py-16 → py-32`. Once approved, 10 files were modified in parallel. Final count: Edit 76, Bash 47, Read 23, Write 14. **171 tool calls**.

Mid-session the dev server crashed. `npm error code ENOENT` — Claude had run npm from the wrong directory and couldn't find `/Users/jidong/package.json`. Specifying the project path explicitly fixed it.

A new `FloatingSchedule.tsx` component was also built in this session — a floating panel showing weekly clinic schedules by doctor, with a close button. Mobile responsiveness was left as a question at the end of the session, which carried into Session 6.

Session 6 catalogued 24 mobile responsiveness issues and patched 7 core files. One notable fix: inline hex opacity syntax like `${doc.accent}0a` doesn't work with Tailwind dynamic values — it was converted to `rgba()`.

## Cloverfield: From a docx Spec to a SwiftUI iOS App

Session 7 was the centerpiece of the day. **300 tool calls. 5 hours and 55 minutes.**

The input: `/Users/jidong/Downloads/cloverfield-proposal-v3.docx`. A GPS-based four-leaf clover hunting app for iOS. The spec included the Phase 1 MVP scope, motion specs, timeline, and a budget breakdown ($134 total). The instruction was short:

```
하나씩 phase 별로 구현 - 확인 해주면서 진행해줘
```

Claude first loaded the `brainstorming` skill to clarify requirements, then the `writing-plans` skill to produce an implementation plan. Then it switched to `subagent-driven-development` and dispatched one agent per task.

**Subagent task breakdown:**
- Task 1: XcodeGen project structure setup
- Task 2: `CloverEngine` (clover generation logic)
- Task 3: `LocationClient` (TCA DependencyKey)
- Task 4: `SpriteKit FieldScene` + `SplashView`
- Task 5: `HealthKitClient`, `MotionClient`
- Task 6: `PickingFeature`, `PocketFeature`, `RevealFeature`
- Task 7: `WeatherClient`, `CloverStore` (SwiftData), `GardenFeature`

Each agent completed its task independently and committed. Task notifications arrived in the main thread with commit hashes: 7bc8285, e8d5c24, f3f33a7... Out of order, because they ran in parallel.

## Three Things That Broke

**Xcode Simulator install.** After `xcode-select --install`, the iOS 26.4 Simulator download failed with exit code 70. Switched to iOS 17.0 Simulator — fixed. This one required manual intervention; the user had to find the solution themselves (`못찾겠어` — "can't figure it out").

**HealthKit entitlement error.** First run after a successful build:

```
NSError(domain: "com.apple.healthkit", code: 4,
  userInfo: ["NSLocalizedDescription": "Missing com.apple.developer.healthkit entitlement."])
```

`HealthKitClient` was calling real HealthKit APIs in the simulator. Added `com.apple.developer.healthkit` to `.entitlements` and added a mock data fallback for simulator builds.

**Transparent background on clover images.** Generated clover images via the Gemini API — they came out with white backgrounds instead of transparent ones.

```
일단 이게 배경이 투명이 아니라 안되고, 매번 다른 네잎을 생성해야해서
어떤식으로 구현할지 고민해봐야돼 수십만개의 네잎이 표현될 수 있게
```

The fix: replace images with procedural code. SpriteKit `SKShapeNode` draws four leaves programmatically, using a random seed to vary shape each time. The ratio of three-leaf to four-leaf clovers is tuned so roughly 1–2 four-leaf clovers appear per screen.

## What Parallel Subagents Actually Buy You

Session 7 used the most agent dispatches of any session so far. A significant share of those 300 tool calls are `Agent` invocations. Each agent works in an isolated context, completes its task, and commits. The main thread receives notifications and dispatches the next agent.

The payoff: **the main context doesn't get polluted**. When building an entire iOS project in one session, loading every file into the main context hits the token limit fast. Scoping each subagent to specific files keeps each one focused and the main thread clean.

The cost: agent output isn't perfectly consistent. `WithViewStore` deprecation warnings appeared across multiple files — each agent had a slightly different understanding of which TCA APIs to use. The fix is to put explicit version constraints in the subagent prompt: "TCA 1.7+, use `@ObservableState`."

## Design Polishing Is Just Iteration

```
지금 전체적으로 ui / icon / 내부 이미지 다 최악이야
```

Late in Session 7, three parallel agents were dispatched to redesign `FieldView`, `PocketView`, and `SplashView` with a warm, healing aesthetic. Design tokens — `Clover.Colors.cream`, `Clover.Colors.sage` — were defined in a shared file and referenced across all views.

The Gemini image generation API key (`AIzaSyD...`) was pasted directly into the chat in this session. Model selection mattered: `imagen-3.0-generate-001`, not `gemini-2.0-flash-exp`. Generated images went into `Assets.xcassets`.

First feedback after the redesign: `그림 바뀐 거 하나도 없는데? 최악이야` — "the images didn't change at all, this is terrible." Xcode cache. Deleting `DerivedData` and running a clean build showed all the changes.

---

What 7 sessions produced: CLAUDE.md migrated to the harness pattern, uddental fully redesigned with mobile responsiveness, coffeechat PG contract reply drafted, Cloverfield iOS Phase 1 skeleton complete. Each session started with a few Telegram messages and shipped an independent result.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
