---
title: "Claude Code: 10 Sessions, 633 Tool Calls — Verifying 42 Grants, Building Interview Demo GIFs, and Scraping Game Screenshots"
project: "portfolio-site"
date: 2026-06-22
lang: en
pair: "2026-06-22-portfolio-site-ko"
tags: [claude-code, multi-agent, workflow, automation]
description: "10 sessions, 633 tool calls over 2 days. Parallel agents verified 42 funding programs, Playwright built interview demo GIFs, Google Play CDN yielded game screenshots sans API."
---

10 sessions. 633 tool calls. 2 days.

The domains couldn't be more different — dental ad agency, AI interview platform, fortune-telling app X bot, government grant applications, mobile game recommendation catalog. All of it ran through a single session stream without switching tools or losing context between projects.

**TL;DR** Three patterns stand out from this stretch. A live-verify workflow that dispatched 6 parallel agents against 42 funding programs and confirmed their real-time status. Google Play CDN scraping to build a visual game catalog without a single external API call. A Playwright-based screenshot-to-GIF pipeline that turned an HTML mockup into a polished demo animation through iterative feedback loops.

## How 42 Funding Programs Got Verified by Parallel Agents

Session 9 was the largest by scope. The request: "Find all government and private funding programs that fit both preterview (AI interview platform) and a dental ad agency. Estimate pass probability for each and fill out the application forms."

The `~/funding/` directory already had 30 programs from a June 17 research run and business plan drafts from a June 21 workflow. The job wasn't fresh research — it was **live-verifying existing research and filling real application forms based on what's actually open right now**.

The workflow ran in two phases.

**Phase 1 — Verification.** Six agents split the program categories in parallel: VC equity accelerators, government non-equity grants, urban accelerators, tech commercialization programs, and global track programs. Each agent checked its category with live web access — currently accepting applications, deadline accurate, solo-founder eligible. Any program that had closed, changed its terms, or was unreachable got flagged and dropped.

**Phase 2 — Fill.** Twelve agents each drafted application content for the programs that survived verification. One agent per application draft, all running concurrently.

Final output: 42 verified programs, 12 application and business plan drafts in `~/funding/apply-2026-06-22/applications/`. Sample filenames: `01-primer29-preterview.md`, `13-K-Global-mentee-business-plan.md`, `15-solo-creator-center-business-plan.md`.

The part worth noting was running **two rounds of pass probability estimation**. Single-agent estimates trend optimistic — the agent researched the program, understands the fit, and wants to be helpful. Session 10 corrected for this by running 13 programs × business units through an "independent estimate → skeptical recalibration" pipeline. A separate agent re-evaluated each estimate with a critical lens, looking for reasons the application might fail rather than reasons it might succeed.

The final numbers were cold: Primer 29th cohort (preterview) 23%, Linkup Dental 31%. More useful than inflated first-pass numbers.

## Pulling High-Res Game Screenshots Directly from Google Play CDN

Session 8 was a "mobile games for 4–6 friends" recommendation report. The deliverable needed actual in-game screenshots — a visual catalog, not a text summary. The existing text renderer (`md2report/report.py`) wasn't designed for image-heavy layouts, so a catalog-format HTML had to be built from scratch.

Eight candidate games were selected: AFK Journey, Seven Knights Idle Adventure, Eversoul, Mushroom Survival, Legend of Slime, Blue Archive, Whiteout Survival, Last War. A research workflow spun up in the background while the screenshot extraction approach was validated.

```bash
# Direct pull from Google Play CDN — works with just the appId base URL
curl "https://play-lh.googleusercontent.com/{base_path}=w1080-h1920" -o screenshot.png
```

Trimming the URL to the base path before `=w` and appending a resolution suffix returns a clean PNG at that size. 7–14 screenshots per game — app icons and in-game screens — were pulled for all 8 games this way. No API key. No scraper setup. Just the CDN URL pattern.

Confirming these were actual gameplay footage and not promotional banners required visual inspection. A local HTTP server served a contact sheet of all collected images, and `mcp__claude-in-chrome` ran a visual verification pass. A few promo banners slipped in and got culled.

The URL pattern is stable enough to reuse on any future app catalog report. Google Play's CDN uses a consistent structure per appId, and the resolution suffix is predictable.

## Building a 30-Second Interview Demo as an Animated GIF

Session 7 included a request: "Make a 15–30 second animation showing the actual preterview interview flow and the results report. We need this for viral marketing."

The approach: Playwright renders `preterview-demo.html`, captures a timed sequence of screenshots, and stitches frames into a GIF. On the first run, a `--user-data-dir` flag caused a browser conflict and the process failed. Removing that flag on the second run worked cleanly.

Feedback came in three rounds:

1. "Too fast" — doubled the frame delay on AI response frames
2. "Show the user's answer too" — added answer text overlay to the interview frames
3. "The AI icon looks too AI-y" — replaced sparkle icon with a plain circle avatar

Each round regenerated the full GIF and confirmed the output before moving to the next change. The final 28-second animation covered question delivery, user answer display, and AI follow-up — a realistic pass through the interview loop.

For additional viral surface area, three purpose-built HTML files were created alongside the demo: `preterview-demo.html` (live interview flow), `preterview-portfolio.html` (portfolio review screen), `preterview-product.html` (product landing). Each was screenshot-captured at a specific viewport for platform-specific use.

## Breaking the 6-Hour Fixed Publishing Cadence

Session 3. The saju (Korean fortune-telling) app's X bot was running on `20 */6 * * *` — posting every 6 hours at the exact same minute past the hour. The fixed cadence was a dead giveaway for automation.

Three changes shipped:

**Slot randomization.** Dropped the `slotCounter` approach entirely. Each day now samples 4 different time slots from a weighted distribution that avoids clustering. The day's slots are calculated once at midnight and stored.

**Thread format removal.** Consecutive-tweet threads were removed from `ACTIVE_FORMATS`. They read as scheduled content more than single posts do.

**AI-tone scrub + model upgrade.** Strengthened the scrubbing pass in `viral.ts` and `generate.ts` to strip hedging language, filler phrases, and construction patterns that pattern-match to generated text.

`vercel.json` cron changed to `*/15 * * * *`. The publish gate in `route.ts` handles the slot logic at the app layer — checking whether the current 15-minute window matches one of the day's sampled slots before actually posting. 7 files changed, Bash 25, Edit 10, Read 13.

## Agent Delegation: One Clean Case, One Recovery

**Session 4** (regular dental measurement) took 2 tool calls. Delegated to `Agent(dental-clinic)`, received the result digest. `Dongbaek implant` holding #8 in Naver, score 33 unchanged. Nothing to do.

**Session 5** (weekly dental content) had a subagent die mid-`sync.sh`. Content was fully written, but the commit hadn't happened. The agent's final message came through as: "That was a course-syntax error. Running sync.sh." Clipped. No confirmation.

Rather than trust the partial output, the filesystem was checked directly:

```bash
git status               # confirmed uncommitted files
# ran medical compliance linter manually
# validated HTML structure
git commit               # finished it
```

Linter results: 101 sentences, 0 warnings. No markdown symbols in body text. Then `sync.sh` manually, commit `91a6704`, 12 files +429 lines, pushed, Vercel redeployed.

Delegating to a subagent means delegating the work, not the verification. The main session owns the finish line.

## Navigating a Government Medical Ad Portal with Browser Automation

Session 6: Naver blocked a dental PowerLink ad creative. Stated reason: "Missing review approval number." Used `mcp__claude-in-chrome` to navigate `dentalad.or.kr` directly — 21 computer actions, 5 navigates, 10 javascript executions.

First hit was an SSL error. Re-confirmed the correct path (`dentalad.or.kr/main/`), navigated in, and located the login flow and account history pages. The history view showed a prior approval from 2023: `P_2023032120119` (conditional approval). No login credentials were available to go further, so only confirmed facts were reported — the number exists, it's conditional, it predates the current campaign.

This is exactly where browser automation earns its place: external administrative systems with no API, everything behind a UI.

## Session-by-Session Breakdown

| Session | Date | Tool Calls | Key Work |
|---------|------|-----------|----------|
| 1 | 6/21 | 32 | Naver ad solo-agency fact research |
| 2 | 6/21 | 193 | preterview i18n bug + E2E tests |
| 3 | 6/21 | 49 | X bot publishing pattern overhaul |
| 4 | 6/22 | 2 | Dental regular measurement (delegated) |
| 5 | 6/22 | 11 | Dental weekly content + manual recovery |
| 6 | 6/22 | 72 | Medical ad review number via browser |
| 7 | 6/21 | 120 | 12-agent business plans + preterview demo GIF |
| 8 | 6/22 | 68 | Game catalog HTML + screenshot automation |
| 9 | 6/22 | 51 | 42-program live-verify + 12 applications |
| 10 | 6/21 | 35 | Pass probability recalibration + preterview payments |

Tool breakdown: Bash 269, Read 127, Edit 85, Write 48, mcp__claude-in-chrome 54, Agent 4 (subagent delegation), Workflow 5 (dynamic workflows).

Bash leads by a wide margin. Server start, screenshot extraction, SERP measurement, build checks, commits, linter runs — all go through Bash. A session where Bash exceeds Edit is exploration and verification-heavy. A session where Edit leads is implementation-heavy. Sessions 8 and 9 skew Bash; session 2 skews Edit.

Sessions 2 (193 calls) and 7 (120 calls) are the two extremes. Session 2 was a single-bug deep-dive that traced a next-intl hydration issue through the framework internals. Session 7 combined a 12-agent fan-out for grant applications with Playwright-based multimedia production — two different categories of complexity in the same session block.

The agent failure in Session 5 was the only case where a delegated task needed direct main-session recovery. The pattern it exposed: when a subagent's final message is ambiguous or truncated, don't interpret it charitably. Check the filesystem directly before reporting success.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
