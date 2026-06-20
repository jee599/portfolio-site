---
title: "77 Bugs Found, 46 Confirmed: Running a Multi-Agent Audit with Claude Code"
project: "portfolio-site"
date: 2026-06-21
lang: en
pair: "2026-06-21-portfolio-site-ko"
tags: [claude-code, multi-agent, debugging, workflow, mobile-ui]
description: "9 sessions, 584 tool calls, 69 files changed. How a parallel fan-out workflow surfaced 77 bugs and adversarial verification kept only the real ones."
---

9 sessions. 584 tool calls. 69 files changed across two days. This is what two days of intensive Claude Code work on the `preterview` and `JDLab` projects looks like in raw numbers.

**TL;DR** A 10-domain parallel audit surfaced 77 potential bugs. Adversarial verification cut that to 46 real ones. A mobile layout where `window.innerWidth` reported 2240px on a 390px iPhone viewport — caught only because browser automation ran actual measurements, not static analysis.

## Kicking Off a 162-Tool-Call Session With One Prompt

Session 2 was the biggest single session of the batch. The prompt was deliberately vague:

```
preterview ui/ux 나 기능상에 자잘한 버그들 없나 모두 찾아봐
(Find all the small bugs in preterview's UI/UX and functionality)
```

Manually reading ~9.4K lines of components, ~5.4K lines of pages, ~4K of lib code, and ~3.2K of API routes would take days. Instead, 10 finder agents ran in parallel — one per domain: interview room, resume builder, portfolio, auth, payments, dashboard, admin, landing, i18n, and shared components.

The workflow had three stages:

1. **10 finders in parallel** — each reads actual source files and flags suspicious patterns in its domain
2. **Adversarial verification** — a separate agent per finding re-checks against real code, kills false positives
3. **Dedup and prioritize** — overlapping findings merge into a single ranked list

Result: 77 found → 21 rejected → 56 confirmed → **46 after dedup**. Severity breakdown: high 2, medium 8, low 26, nit 10.

The key detail in Claude's explanation of the process: adversarial verifiers "re-read the actual source and traced control flow." This isn't "this probably breaks" — it's a second agent confirming the code actually does the wrong thing before the finding survives.

The most common theme across all 10 domains: **missing i18n strings** — Korean UI with English fallback text bleeding through, scattered across multiple components.

## A Second Pass Before Writing a Single Edit

46 confirmed bugs didn't go straight to `Edit` calls. First, another verification sweep:

```
고쳐야하는 것들 모두 진짜 고쳐야하는지, 고치고 나서 사이드 이슈는 없는지,
중요한 순으로 일단 모두 검증해줘
글로벌 서비스 / 유저사용성 / 보안 / 토큰 낭비는 없는지
(Re-score each bug across four lenses: global compatibility, UX, security, token waste.
 Flag any fix that introduces side effects.)
```

Each of the 46 bugs got re-scored across four lenses: global service compatibility, user experience, security, and token efficiency. Fixes with risky side effects got filtered out.

The final tally: 24 bugs fixed, delivered as 57 `Edit` calls. Files touched spanned the full app: `auth-context.tsx`, `InterviewRoom.tsx`, `storage.ts`, `lib/format.ts`, `messages/ko/*.json`, `messages/en/*.json`, and more.

## How Browser Automation Exposed a 2240px Viewport

Session 9 — 182 tool calls over 4 hours — started with a specific complaint: buttons breaking on mobile, English text mixing into Korean UI.

Static analysis has a ceiling here. The fix was to run the actual browser:

```js
// mcp__claude-in-chrome__browser_batch
// Set viewport: 390px (iPhone)
// Measured render width: 1568px
// window.innerWidth: 2240px
```

The page was overflowing horizontally and getting scaled down. A `viewport` meta configuration issue — the classic "looks fine on desktop, invisible on mobile" category of bug.

Finding this through static code review would mean hunting through every file that could affect overflow. Finding it through measurement meant: observe the number, trace backward to the source. Much faster.

Fixes applied to: `app/globals.css` (overflow handling), `layout.tsx` (viewport meta), `InterviewRoom.tsx` (mobile layout), `i18n/routing.ts` (language detection), plus a batch of `messages/ko/*.json` files for missing Korean strings.

## Domain Confusion Across 12 Files: The Other Kind of Bug

The JDLab sessions (1, 3, 4, 6) surfaced a different category of problem — not logic bugs, but configuration drift.

`tryjdlab.com` and `jidonglab.com` had accumulated different roles across different files with no single source of truth. Session 4 established the split: `jidonglab.com` for the public site, `jd@tryjdlab.com` for outbound email. Session 6 revealed `tryjdlab.com` itself was an invalid placeholder — requiring another round of corrections.

This kind of cascading correction happens when domain roles get hardcoded across multiple files at design time without clarity. The fix required touching 12 files in one sweep: footer module, prompt builder, config JSON, test fixtures.

## Tool Usage Breakdown

| Tool | Calls |
|---|---|
| Bash | 187 |
| Read | 134 |
| Edit | 134 |
| mcp (browser) | 26 |
| TaskUpdate | 23 |
| Write | 17 |
| Workflow | 7 |

Bash, Read, and Edit coming in nearly equal is the explore → confirm → fix loop showing up in the numbers. `Workflow` at 7 calls — every single one was a fan-out pattern. Multi-agent orchestration only when work units are genuinely independent.

## What Actually Works in Multi-Agent Debugging

The pattern that held up across all sessions: **find → adversarial verify → side-effect check**, three stages before a single edit.

Stage 1 casts wide — surface everything plausible. Stage 2 runs skeptical agents that try to refute each finding against actual code. Stage 3 scores each remaining fix for unintended consequences before committing to it. The combination dramatically reduces "fixed something that didn't need fixing."

Browser automation (`mcp__claude-in-chrome__browser_batch`) earns its place for rendering bugs specifically. The difference between "this CSS probably causes overflow" and "window.innerWidth is 2240 on a 390px viewport" isn't just precision — it's a completely different debugging trajectory. Measurement first, code second.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
