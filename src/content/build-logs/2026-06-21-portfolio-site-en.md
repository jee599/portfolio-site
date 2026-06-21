---
title: "317 Tool Calls in a Day: Claude Code Fixed Mobile UI, Generated 6 Business Plans, and Tracked Dental SERP"
project: "portfolio-site"
date: 2026-06-21
lang: en
pair: "2026-06-21-portfolio-site-ko"
tags: [claude-code, claude-opus, subagent, workflow, mobile-ui, i18n, preterview, dental-promo]
description: "4 sessions, 317 tool calls: 24-file mobile UI patch, 6 business plans auto-generated, dental SERP tracked across 6 keywords — inside the 182-call debugging session."
---

`window.innerWidth` returned **2240px**. The browser window was 784px wide.

That number doesn't show up in a static code review. You have to run the thing, measure it at runtime, and let the number tell you where to look. That's how the preterview mobile debugging session started on June 20 — and it ended 4 hours and 182 tool calls later.

**TL;DR** — 4 sessions, 317 tool calls across one day. Mobile UI patched across 24 files, 6 business plan documents generated and delivered via Telegram, dental clinic SERP measured across 6 keywords and committed. All handled in one Claude Code cycle.

## The 9-Minute Session: Dental Monitoring Costs Almost Nothing

First task of the morning:

```
동백유디치과(dongbaek-uddental) 정기 측정이다. dental-clinic 서브에이전트에 위임해 수행하라.
키워드(임플란트 뼈이식·용인 임플란트·동백 임플란트·상악동거상술·동백 치과·용인 소아치과)의
블로그탭/통검 노출순위, inbox 신규 파일 처리, history.json 갱신, sync.sh 실행...
```

I didn't handle this directly. The request went to the `dental-clinic` subagent. **1 Agent call, 1 Bash call — 2 tool calls total, 9 minutes.**

The agent read `clinic.json` and `history.json` to restore context, ran live SERP measurements across all 6 keywords, generated `digests/measure-2026-06-21.md` (10KB), and pushed commit `2f49a72` to production.

One keyword (`동백 임플란트`) dropped from position 8 to 9. The agent flagged it as "rotation noise" rather than a meaningful signal — the prompt explicitly said "do not re-score, only record measurements" — so it left the numbers as-is and moved on.

This is the point of a single-clinic dedicated agent: context restore → measure → record → sync is a self-contained pipeline. The main session doesn't carry any of that state. It just receives the result.

9 minutes. 2 tool calls. Committed and deployed.

## `innerWidth: 2240px` — The Bug That Only Appears at Runtime

The preterview mobile session started with:

```
preterview is broken on mobile — buttons are misaligned, English text showing
up on Korean settings, general layout weirdness. Check everything, find whitespace
and line break issues stretching the layout, fix all of it.
```

The dev server went up in the background. Using `mcp__claude-in-chrome__browser_batch`, the session loaded the actual mobile viewport. The device was set to iPhone (390px). The render came back at 1568px. Then JavaScript ran `window.innerWidth` directly in the browser context: **2240px**.

Window: 784px. Content: 2240px. Root cause found before touching a single file.

This is why runtime measurement beats static analysis for layout bugs. Chasing viewport overflow through source files means guessing which component is the culprit and working inward. Measuring the rendered output first gives you a number, and the number points you to the file. The direction reverses — and it's much faster.

The second issue, English buttons appearing on Korean settings, turned out to be an i18n routing problem. The app detected `Accept-Language: en` from the browser and redirected to `/en`, overriding the user's explicit language preference. Fix: `i18n/routing.ts`.

Then came the translation keys. Several components were missing Korean translations entirely, so they fell back to English strings. Each missing key had to be located and filled.

**Files modified (24 total):**

- `app/globals.css` — root overflow causing the 2240px bleed
- `i18n/routing.ts` — language detection logic
- `components/interview/InterviewRoom.tsx`, `RadarChart.tsx` — mobile layout
- `messages/ko/common.json`, `dashboard.json`, `pricing.json`, `interview.json` — missing translation keys
- 5 admin pages — no mobile handling at all

The loop: edit → build → browser reload → screenshot → find next issue → repeat.

**Bash 46, Edit 40, Read 35, `browser_batch` 26 — 182 tool calls, 4 hours.**

The `browser_batch` calls were load-bearing. Each one gave a real screenshot at the actual viewport — not a simulated rendering, not DevTools emulation. Every round of fixes got verified against what actually appeared on screen before moving forward.

## 12 Agents Ran in Parallel to Verify a Single Business Decision

After the mobile work:

```
Where and how should I sell preterview? Do I need to launch on Product Hunt?
```

There was already a `preterview-global-gtm.html` from a prior session — 25 research agents plus 16 fact-checked metrics. Product Hunt had been categorized as "Channel ④ · SECONDARY · one-day spike." The question wasn't new. But the ask was to verify it.

A Workflow launched 12 agents in parallel. The pattern was adversarial: for each headline claim, a separate agent tried to refute it. Two things got caught:

- The "10x / 40–50x" multipliers in Product Hunt coverage data were conventional wisdom, not measured values.
- The 8.7%/hour engagement rate cited was from 2016 data.

Both corrections went into the final answer. The rest of the GTM analysis held.

Conclusion from the session:

> Product Hunt isn't a question of *whether* to launch — it's *when*. Not now. Not as a first channel.

The same session handled a question about AEO/GEO readiness. Claude searched the preterview codebase directly — structured data, meta tags, `sitemap.xml` — and reported the actual state rather than making assumptions. **35 tool calls, Bash-heavy (22).**

## Six Business Plans in One Session

```
For both the dental ad automation project and preterview — analyze the LLM
and marketing architecture in depth. Generate detailed technical reports
and business plan documents. Deliver results via Telegram (hermes).
```

First move: search `~/funding/`. Two days earlier (2026-06-17), 57 government funding programs had already been researched and validated. No starting from scratch — the fit analysis used that data as its base.

Six documents generated:

- `01_preterview_기술사업분석.md` — Technical analysis of preterview's LLM stack
- `02_치과광고자동화_기술사업분석.md` — Technical analysis of the dental automation project
- `03_지원사업_공모전_투자_핏분석.md` — Fit analysis against 57 funding programs
- `04_사업계획서_preterview.md` — Full business plan, preterview
- `05_사업계획서_치과광고자동화.md` — Full business plan, dental automation
- `06_공고분석_제출서류_체크리스트.md` — Submission checklist per program

After generation, `hermes` sent a summary plus all 6 files to the Telegram channel.

**Bash 35, TaskUpdate 18, Read 12, Write 11 — 98 tool calls.**

A single business plan typically takes a person two full days minimum. Six came out of one session.

Mid-session, the instruction was added: "For any answer longer than one A4 page, output it as an HTML report." From that point forward, Claude produced HTML files directly — openable in a browser immediately. Changing output format mid-conversation works without any setup.

## The Numbers

| Session | Duration | Tool Calls | What Happened |
|---------|----------|------------|---------------|
| Dental monitoring | 9 min | 2 | SERP 6 keywords + commit |
| GTM analysis | ~22 min | 35 | PH judgment + 12-agent verify |
| Mobile UI | 4 hours | 182 | 24 files patched |
| Business plans | ~27 min | 98 | 6 docs generated + Telegram |

**317 total tool calls. 29 files modified. 12 files created.** Bash led at 104 calls — dev server, SERP measurement, builds, hermes delivery, all of it runs through Bash.

The most efficient session by ratio: dental monitoring. 9 minutes, 2 tool calls. Hand context to a dedicated agent, the agent runs its internal pipeline, main session receives the commit hash.

The most instructive session: mobile debugging. `innerWidth: 2240px` is not in the source code. It only exists at runtime, in the browser, when the page is actually rendered. Browser automation is the only way to catch it.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
