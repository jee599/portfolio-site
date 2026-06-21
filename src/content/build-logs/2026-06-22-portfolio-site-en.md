---
title: "7 Sessions, 489 Tool Calls: Hunting Down a next-intl Bug with Claude Code Multi-Agent"
project: "portfolio-site"
date: 2026-06-22
lang: en
pair: "2026-06-22-portfolio-site-ko"
tags: [claude-code, next-intl, i18n, multi-agent, ultracode]
description: "Ultracode mode fixed preterview's mobile UI, tracked a next-intl scopeClientMessages bug, and generated two business plans with 12 parallel agents in 34 min."
---

7 sessions. 489 tool calls. 35 files modified, 26 files created. Most of this week went into debugging [preterview](https://preterview.io)'s mobile UI and automating business documentation with multi-agent workflows.

**TL;DR**: Used ultracode mode to fix preterview's mobile UI in 182 tool calls, traced a next-intl `scopeClientMessages` bug causing raw key exposure across the app, then auto-generated a 7,747-word business plan with 12 parallel agents in 34 minutes using 1.27M tokens.

## When innerWidth Returns 2240 on a 784px Screen

`innerWidth: 2240px (window: 784px)` — that was the first number I saw on mobile. Accessing the page from a 390px viewport, the layout was overflowing horizontally and rendering scaled down. Not a minor visual glitch: users reported broken buttons, English text appearing regardless of language setting, and abnormal line breaks from letter-spacing issues.

I started the session with `/effort ultracode`. This enables `xhigh` reasoning effort plus dynamic workflow orchestration automatically — the agent plans, fans out, and self-verifies before closing.

182 tool calls burned across the session: Bash 46, Edit 40, Read 35, browser tools 26. 24 files modified:

```
app/[locale]/layout.tsx       ← viewport meta tag
i18n/routing.ts               ← default locale detection
messages/ko/*.json × 6        ← missing key additions
messages/en/*.json × 2
globals.css                   ← overflow source removed
```

The mixed-language display traced back to locale detection logic in `i18n/routing.ts`. When the browser sends `Accept-Language: en`, the home page redirects to `/en`. After the user switches to Korean in-app, some client components still referenced English messages — they never re-subscribed to the updated locale context. The affected components: `InterviewRoom.tsx`, `RadarChart.tsx`, `NaverBuy.tsx`.

## The Raw Key Bug — Suspect: scopeClientMessages

After deployment, a second session surfaced a different bug: buttons in the mock interview and portfolio review screens were rendering raw i18n keys like `interview.room.endinterview` instead of translated strings.

Type checks passed clean. All keys existed in both `en` and `ko` message files. next-intl outputs the full dot-notation key path when it can't resolve a key — so the issue wasn't missing keys. The signal pointed to **messages not reaching the client at all**.

The suspect: `i18n/request.ts` → `scopeClientMessages(await getMessages(), strippedPath)`.

This function optimizes client bundle size by sending only the i18n namespaces relevant to the current route, determined from the `x-cc-pathname` header. When that header arrives empty, `strippedPath` falls to `/`, and the `interview`, `portfolio`, and `resume` namespaces get excluded from the client payload entirely.

The intended chain: `proxy.ts` sets the header → next-intl middleware picks it up → propagates to RSC. On soft navigation (client-side routing within the app), this propagation broke in certain transitions. The fix was straightforward once found, but the discovery required manually tracing the request path — not something an agent fan-out would surface.

To prevent regression, I added a Playwright e2e spec:

```ts
// e2e/i18n-softnav.spec.ts
test('soft navigation preserves i18n namespace', async ({ page }) => {
  await page.goto('/ko/interview');
  // assert no raw key strings are visible in the DOM
});
```

Committed alongside `playwright.config.ts`. CI now catches i18n namespace loss on soft navigation automatically.

## 12 Agents, 34 Minutes, Two Business Plans

Session 7 used a multi-agent workflow to draft business plans for two ventures simultaneously: a dental marketing automation tool and preterview.

Workflow structure:

1. **Foundation** (parallel × 6) — two product profiles + government/private funding research + winning application case analysis
2. **Plans** (parallel × 2, high effort) — PSST grant application + IR pitch deck narrative
3. **Verify** — adversarial fact-check agent + completeness critique agent
4. **Integrate** — assembles verified sections into unified markdown
5. **Render** — HTML + PDF via `md2report/report.py`

Result: 34 minutes, 1.27M tokens, `~/funding/bizplan-2026-06-21/REPORT.md` at 7,747 words. Covered: PSST + IR + 3-year financials + unit economics + technical architecture + program catalog + execution calendar.

The rendering pipeline reused the existing `md2report/report.py`. First time testing markdown table rendering in this report; it worked without issues.

The 57 government programs researched in a prior session (2026-06-19) were stored in `~/funding/`. Rather than re-researching, I injected the existing files directly as context for the agents. Avoiding duplicate research saved tokens and kept the agent count lower.

## Naver Ad Agency Commission: The Assumption That Was Wrong

Starting the Dongbaek UDI Dental place ad pilot raised a question about ad agency commission structures. The campaign: `동백유디_플레이스_파일럿`, 5,000 KRW/day budget, zero impressions, zero clicks.

The assumption going in: "running ads under my own account yields a 15% commission margin." That was wrong. The 15% rebate is gated on **official Naver agency certification**, not account ownership. Research across 6 axes (business registration, sub-agency entry, medical advertising legality, invoice structure, direct signup benefits, solo practitioner rate benchmarks) — cross-verified with adversarial agents.

Conclusion: for solo operators starting short-term, the **sub-agency structure** (operating under a certified agency as a downstream partner) is the realistic entry point. Direct official agency certification requires a corporate entity, advertising business registration, and hitting a minimum monthly spend threshold.

## Tool Call Breakdown by Session

| Session | Task | Tool Calls | Key Tools |
|---------|------|-----------|-----------|
| 1 | Dongbaek UDI routine measurement | 2 | Agent, Bash |
| 2 | preterview GTM analysis | 35 | Workflow, Bash |
| 3 | Mobile UI full sweep | 182 | Bash, Edit, Read, Browser |
| 4 | Business tech docs + funding research | 98 | Bash, TaskCreate, Write |
| 5 | Naver ad agency research | 32 | Bash, WebSearch, WebFetch |
| 6 | preterview UI re-check + deploy | 113 | Bash, Edit, Read |
| 7 | Deep business plan generation | 27 | Workflow, Bash |

Across 489 total tool calls: Bash leads at 189 (39%), Read at 71, Edit at 66. All 26 browser tool calls were concentrated on preterview render verification.

## What This Week Actually Taught Me

Ultracode mode is not always the right answer. The `scopeClientMessages` bug wasn't caught by throwing more agents at it — it was caught by manually tracing the code execution path step by step. After the 182-tool-call session ended, the raw key bug was still there. Session 2 found it by moving slower and reading more carefully.

Agent fan-out pays off on **work that can be genuinely parallelized**. Writing 6 business plan sections simultaneously is a good use of fan-out. Debugging a request propagation chain in next-intl middleware is sequential reasoning — not a workflow job. Knowing which mode fits the problem is the skill that actually saves time.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
