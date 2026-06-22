---
title: "9 Sessions, 513 Tool Calls: Running 4 Unrelated Projects in One Day with Claude Code"
project: "portfolio-site"
date: 2026-06-22
lang: en
pair: "2026-06-22-portfolio-site-ko"
tags: [claude-code, multi-agent, workflow, preterview, dental, i18n, debugging]
description: "How multi-agent delegation and a 12-agent parallel workflow let me ship across dental marketing, AI interviews, a fortune-telling app, and startup pitches — all in one day."
---

Nine sessions. 513 tool calls. Four completely unrelated domains — all in one day.

Dental marketing audits, an AI interview platform's i18n bug, a fortune-telling app's X bot, and back-to-back startup pitch decks. I ran all of them through Claude Code on the same day, context-switching between Korean medical advertising regulations and Next.js middleware internals without losing the thread.

**TL;DR** — Two patterns made this possible: subagent delegation (the `dental-clinic` subagent handled dental work autonomously) and dynamic workflow fan-out (12 parallel agents for business plan research). The heaviest single session was 193 tool calls, chasing a `scopeClientMessages` bug deep inside next-intl.

## The Sessions at a Glance

| Session | Domain | Core Work | Tool Calls |
|---------|--------|-----------|------------|
| 1 | Naver Ads | Solo agency structure research | 32 |
| 2 | preterview | i18n bug fix + deploy + E2E tests | 193 |
| 3 | Saju App | X bot posting pattern overhaul | 49 |
| 4–5 | Dental marketing | Weekly metrics + content prep | 13 |
| 6 | Dental ads | Naver medical ad review tracking | 39 |
| 7 | preterview | Visual interview validity research | 58 |
| 8–9 | Startup | Business plans + first payment/GTM | 129 |

None of these were simple "add a feature" requests. Domain research, root cause debugging, regulatory interpretation (Korean Medical Advertising Act), multi-agent orchestration — the nature of work was completely different session to session. That variety is what makes the routing layer interesting.

## The Bug That Ate 193 Tool Calls

The preterview i18n bug looked trivial on the surface. Users were seeing raw translation keys — `interview.room.endInterview`, `portfolio.section.title` — instead of actual translated text. Classic "keys missing from translation file" symptom.

Except the keys weren't missing.

First hypothesis: missing translation file. Both `en.json` and `ko.json` had the keys. Second hypothesis: `useTranslations()` called with the wrong namespace. Also no. Third: locale detection failing at the middleware level. Nope — the locale was resolving correctly.

The actual culprit was `scopeClientMessages`. In next-intl, this optimization function slices the full message bundle before sending it to the client, keeping only the namespaces relevant to the current route. The slicing is based on the current pathname, which the middleware injects as an `x-cc-pathname` header. Under a specific set of conditions — a soft navigation immediately after an auth redirect — that header arrived empty on the server.

```ts
// when x-cc-pathname header is missing, strippedPath falls back to "/"
// "/" matches only the root namespace
// → interview, portfolio, and all other namespaces get excluded
const messages = scopeClientMessages(await getMessages(), strippedPath)
```

The client received an empty message map, resolved every key to itself, and rendered raw key strings. The fix was a one-liner: guard against the empty header case and fall back to the full path. But getting to that one-liner required going inside next-intl's source to understand how `scopeClientMessages` actually works.

That's where the 193 tool calls went: 116 Bash (running the dev server, checking headers in flight, reading next-intl internals), 25 Read, 22 Edit. Most of the Bash calls were one-liners checking middleware response headers under different navigation scenarios.

After landing the fix, I added regression coverage: a Playwright E2E spec (`e2e/i18n-softnav.spec.ts`) that specifically covers soft navigation after auth redirects, wired into CI (`.github/workflows/ci.yml`). Total files touched or created: 28.

The lesson: when a translation library isn't showing text, check the message delivery path before checking the message content. The translations were fine — the optimization layer was silently dropping them.

## Delegating Dental: The Subagent Pattern in Practice

Dental marketing work (sessions 4 and 5) never touched my main context. I delegated entirely to the `dental-clinic` subagent, which maintains its own persistent state in `~/dental-promo/{slug}/`: a `clinic.json` with clinic profile, `history.json` with metric timelines, and a `cache/` directory for SERP snapshots and content drafts.

Session 4 was routine measurement. The subagent ran the full stack: SERP rank checking, Naver blog index verification, Place review scraping, and updating `monitoring/` logs. My main session used exactly 2 tool calls — one to spin up the subagent, one to read the result digest.

```
Agent(dental-clinic) → load clinic.json + history.json → run measurements
  → update history.json + monitoring/ → sync.sh → commit + Vercel redeploy
me → check result digest → done
```

13 tool calls across sessions 4 and 5 combined. Not because the work was simple — SERP measurement with proper caching is nontrivial — but because the subagent handles execution and the main thread handles only intent and review.

Session 5 broke this clean pattern. The subagent died partway through `sync.sh`. Content was fully generated and written to disk, but the commit hadn't happened. I had to directly verify the filesystem state, run the medical law compliance linter manually (Korean medical advertising regulations require specific disclaimers), and commit the files myself.

The subagent's summary had said "completed." It wasn't. **Agent outputs describe intent, not guaranteed state.** Always verify the artifact, especially for operations that touch external systems or have compliance implications.

## 12 Agents in Parallel: The Business Plan Fan-Out

Sessions 8 and 9 were structurally the most interesting. I needed business plans for two businesses — a dental marketing automation SaaS and preterview, an AI interview platform — produced simultaneously, at a quality level suitable for startup program applications.

Writing both in a single context produces cross-contamination: the framing of one business leaks into the other, and a single agent's perspective doesn't cover the full research surface. So I kicked off a dynamic workflow with explicit phase structure:

```
Foundation (parallel 6)
  ├─ Market analysis (dental automation)
  ├─ Market analysis (AI interviews)
  ├─ Competitor mapping (both)
  ├─ Regulatory landscape (Korean healthcare)
  ├─ Revenue model benchmarks
  └─ Technology stack assessment

Plans (parallel 2, high effort)
  ├─ Business plan draft A (dental SaaS)
  └─ Business plan draft B (preterview)

Strategy (parallel 2)
  ├─ GTM + first payment strategy
  └─ Investor narrative

Adversarial Verify
  └─ Independent critic: challenge assumptions across both plans
```

12 agents running concurrently. Combined raw output: approximately 1.27 million tokens of draft material. That got synthesized and pushed through `md2report/report.py` to produce structured HTML and PDF.

Session 9 added a calibration pass: 13 startup program applications, each independently scored, then run through a skeptic re-calibration pipeline. Goal was stripping optimism bias from first-pass estimates. Results after calibration: Primer 29th cohort (preterview) 23%, Linkup Dental 31%, with per-program reasoning attached.

Parallel agents aren't inherently better than single-pass. But for work where **diversity of framing matters** — business plans need to consider market, product, regulatory, and investor perspectives simultaneously — the quality floor from parallel independent agents is measurably higher.

## The X Bot Didn't Sound Human Enough

Session 3 was the smallest by complexity, but the changes had the clearest behavioral impact.

The saju app's X bot was posting on a fixed 6-hour schedule (`20 */6 * * *`). Exact 6-hour intervals are immediately recognizable as automation. Three changes:

**Randomized daily slots.** Replaced the fixed cron with four randomized posting windows per day, recalculated daily. The bot posts at human-plausible times rather than exactly 00:20, 06:20, 12:20, 18:20.

**Dropped threaded format.** The bot was posting in threads (sequential reply chains). Single tweets only now. Threads from a bot account look like attempted engagement farming regardless of content quality.

**Prompt-level AI tone scrub.** Added explicit negative examples to the generation prompt: no "I", no "fascinating", no overly structured phrasing. Fortune content should read like an enthusiast wrote it, not like an LLM was asked to "write an engaging tweet about fortune telling."

Also changed `vercel.json` cron from `20 */6 * * *` to `*/15 * * * *` — every 15 minutes — with the slot gate logic moved into the app. The cron just wakes the function; the function decides whether it's time to post. This separates trigger cadence from publish logic, making it easier to tune without touching cron syntax again.

## Tracking a Medical Ad Approval with Browser Automation

Session 6 started with Naver blocking an ad creative. Reason given: "medical advertising approval number not included." Korean medical advertising regulations require that dental ads referencing clinical outcomes carry a pre-approval number from the Korean Dental Association (KDA).

The approval existed — obtained in 2023 — but finding the reference number required accessing the KDA's approval lookup system at `dentalad.or.kr`, which has no API.

I used `mcp__claude-in-chrome` for the lookup: 19 computer tool calls + 4 navigate calls. The tool navigated to the site, authenticated, searched by clinic name and date range, and returned the approval record. The creative got updated with the approval number, resubmitted, and cleared.

This kind of task — navigating a legacy government-adjacent web portal to retrieve a specific piece of information — is exactly where browser automation earns its keep. The alternative is a 15-minute manual process involving login, pagination, and hoping you find the right record.

## What Made the Context Switching Work

513 tool calls across 9 sessions in completely different domains could easily become chaos. An explicit routing layer kept it coherent:

**`dental-clinic` subagent** handles all dental domain work. Main session provides intent, reviews output. Domain knowledge, measurement infrastructure, compliance linting, and content generation all live inside the subagent's persistent state. The main context stays clean.

**Dynamic workflow fan-out** for broad parallel work: research across multiple dimensions, independent drafts that need synthesis, calibration passes. Kicking off the 12-agent workflow for the business plans took one tool call from the main session.

**Direct main session** for focused engineering work: the preterview i18n debug, CI config, code edits. When you need to go deep in one codebase, staying in the main context is right — you want the full history of what you tried and why.

Without this routing, session 2's 193-call debugging session would have contaminated context for every session after it. With it, the dental sessions ran in 13 tool calls combined, and the main thread stayed clear for the engineering work that needed depth.

The routing decisions aren't magic. They're three modes — delegate, fan-out, go direct — chosen based on whether the work is domain-isolated, breadth-first, or depth-first.

## By the Numbers

- **Total sessions**: 9
- **Total tool calls**: 513
- **Breakdown**: Bash 245, Read 72, Edit 58, Write 33, mcp__claude-in-chrome 43
- **Files modified**: 23
- **Files created**: 31
- **Heaviest session**: 193 calls (preterview i18n bug)
- **Subagents deployed**: dental-clinic × 2, dynamic workflow × 4

The Bash count (245 of 513) is the most telling stat. Most of it is concentrated in session 2. Deep debugging burns through Bash calls fast — each header inspection, each test run, each middleware trace is a separate call.

The dental sessions' 13 combined tool calls are the contrast. Same amount of work by output (measurement + content generation for a full marketing operation), near-zero main-session cost because the subagent absorbed it. That's the subagent pattern working as intended.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
