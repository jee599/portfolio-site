---
title: "The Build Error Was Lying: Chasing a False YAML Exception Back to a Missing React Component"
project: "portfolio-site"
date: 2026-04-28
lang: en
pair: "2026-04-28-portfolio-site-ko"
tags: [claude-code, debugging, subagent, i18n]
description: "445 tool calls, 5 sessions. Vercel blamed YAML. The real blocker was a missing CountUp.tsx. One Telegram message triggered 5 parallel agents doing JP/SEA market research."
---

The Vercel build log said `YAMLException`. After parsing 481 files with `gray-matter` and finding zero errors, the actual culprit turned out to be a missing `CountUp.tsx` component that had never been created. Meanwhile, a single Telegram message triggered 5 parallel Claude Code agents doing market research on fortune-telling markets in Japan and Southeast Asia. Here's what 445 tool calls across 5 sessions looked like on April 28.

**TL;DR:** spoonai's Vercel deploys were CANCELED with a misleading YAML error. The real cause: `HomeContent.tsx` imported a `CountUp` component that didn't exist on disk. Two separate Claude Code sessions (91 and 117 tool calls respectively) investigated the same bug without sharing context — the first fixed it in 9 minutes by reproducing the build locally, the second spent 13 minutes on a full file audit and reached no conclusion. On the same day, one Telegram message triggered 5 parallel agents researching JP/SEA markets, which surfaced one real bug (inconsistent brand name across i18n files) and one false positive (a Korean currency symbol flagged as a localization issue that was actually scoped to the Korean checkout path only).

## The YAML Error That Had Nothing To Do With YAML

All spoonai Vercel deployments between April 27 and April 28 had the same status: CANCELED. The error was specific:

```
YAMLException: incomplete explicit mapping pair; a key node is missed;
or followed by a non-tabulated empty line at line 3, column 277
```

It even named a file: `/posts/2026-04-05-furiosa-ai-rngd-commercial-launch-en`. Hard to argue with that level of detail. The obvious starting point was auditing YAML.

`gray-matter` swept through `content/posts/`, `content/daily/`, `content/blog/`, and `content/weekly/`. 481 files. Zero errors. Then `js-yaml` ran the same pass. Also zero. Opening the named file directly showed 204 characters on line 3 — a valid, well-formed string. Git history confirmed: commit `3095c96` had already patched that exact file on April 14th.

The YAML error had been fixed two weeks earlier. The Vercel build log was surfacing a stale message from an old failure, not the current blocker.

Pulling the actual build trace revealed the real failure: `HomeContent.tsx` imported `CountUp`, but `CountUp.tsx` didn't exist in the project. Next.js 16 with Turbopack hit this module resolution failure and Vercel surfaced it as a YAML parse error in the output. The error message pointed at an already-resolved historical issue while the real build stopper sat undetected.

The fix was straightforward. Create `CountUp.tsx`. Then patch two daily posts — `2026-04-10-en.md` and `2026-04-10.md` — that had broken frontmatter: both were missing the closing `---` delimiter. Local build: 480 static pages generated clean. Committed as `8aa059b` and pushed. Vercel auto-deploy triggered.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>8aa059b</span> <span class=msg>fix: CountUp component missing + broken daily frontmatter (spoonai)</span></div>
<div class=commit-row><span class=hash>3b014bc</span> <span class=msg>feat: build logs 2026-04-28</span></div>
</div>

<div class=change-summary>
<table>
<thead><tr><th>Item</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td>spoonai Vercel deploys</td><td>CANCELED (Apr 27–28, all)</td><td>Auto-deploy resumed</td></tr>
<tr><td>CountUp.tsx</td><td>Missing (import existed)</td><td>Created</td></tr>
<tr><td>Broken frontmatter in content/daily</td><td>2 files (missing closing ---)</td><td>0</td></tr>
<tr><td>Local build</td><td>Failure</td><td>480 pages generated</td></tr>
</tbody>
</table>
</div>

## The Same Bug, Investigated Twice, With No Shared Context

The notable detail about this debugging run: it happened twice.

Session 4 ran for 9 minutes and made 91 tool calls. It reproduced the build failure locally, traced the missing `CountUp` import, created the component, patched the broken frontmatter, and shipped the fix.

Session 5 ran for 13 minutes and made 117 tool calls. It started fresh — different context window, no knowledge of what Session 4 had found — and spent most of its time on the exhaustive file audit. It reached the same intermediate conclusion: zero YAML errors across 481 files. But without the local build reproduction that Session 4 used to surface the module resolution failure, Session 5 ended without identifying the root cause.

Two Claude Code agents, same failing build, no shared context, different investigation strategies, different outcomes. Session 4 got there by reproducing first. Session 5 did a more exhaustive audit of the wrong layer.

This is a workflow problem more than a tool problem. When multiple sessions are working on the same issue without coordination, duplicate investigation is inevitable. The fix is making sure sessions with overlapping scope can share findings rather than starting from scratch — which in this case would have meant storing the intermediate result from Session 4 somewhere Session 5 could access before starting its audit.

> Error messages describe what surfaced, not what caused it. Reproduce first, then read the logs.

## One Telegram Message, Five Parallel Agents

Same day, different project. saju_global is a four-pillar astrology (사주) web app that had been targeting Korean users. The session trigger was a Telegram message asking whether anyone had visited or paid recently.

Direct DB query:

- Lifetime payments: 30
- Total revenue: ₩171,000
- Payments since March: 0
- April sessions: 87
- Payment platforms: Toss operational (29 validated transactions), LS Payment dead (fortune-telling is a blocked category on their platform), PayPal configured for live but zero actual completed transactions

The follow-up message:

```
Run agents to generate revenue in SEA and Japan. Use everything — ads, site redesign, viral.
```

Five Claude Code agents launched as parallel background tasks:

- `JP fortune market data` → `jp-market-data.md`
- `SEA fortune market data` → `sea-market-data.md` (136 inline sources)
- `Viral fortune video pattern decode` → `viral-formula.md`
- `Top-converting fortune site references`
- `Site CRO audit JP/TH` → `cro-audit-jp-th.md`

While the agents ran, the PayPal live endpoint got manual testing independently: a real $1.99 order created in the DB, approval URL generated, complete flow saved to `scripts/paypal-live-test.sh`. The point was confirming payment infrastructure actually works before spending any effort driving traffic to it.

## What Agents Got Right, and Where They Went Wrong

When the five agents finished, their outputs needed code-level cross-checking before anything could become an action item.

**The real bug:** The Japanese locale had `運命研究所` in `common.json:3`. But `countries.ts:142` referenced the same product as `FortuneLab`. Two different brand names for the same app, in the same codebase. Any Japanese user who encountered both strings would see inconsistency. A legitimate i18n defect that had slipped through.

**The false positive:** The CRO audit agent flagged that Thai users were seeing the `₩` (Korean won) symbol. Sounds like a localization problem. Looking at the actual code: that rendering path lives inside the `toss` namespace, which only executes in the Korean Toss checkout flow. Thai users route to a PayPal-hosted payment page. They never reach the code that renders `₩`. The agent flagged it without enough context to distinguish checkout routing from display logic.

One real issue, one phantom. The ratio matters because false positives consume investigation time. The more agents running in parallel, the more cross-validation work lands on the human reviewing the results. Each agent brings its own pattern-matching surface area and its own failure modes. Running 5 agents in parallel doesn't mean 5× the signal — it means the signal-to-noise ratio drops unless there's a verification pass before any output becomes action.

> Agents retrieve answers fast. Verifying those answers against the actual code paths is a separate job that can't be skipped.

---

After reviewing the agent reports, the next instruction was direct:

```
Update the design.
```

Modified i18n message files for 10 languages (`ko`, `en`, `ja`, `th`, `id`, `hi`, `zh`, `vi`, and others), updated `page.tsx`, `paywall/page.tsx`, and `globals.css`. Deployed.

## Tool Usage Breakdown

| Session | Duration | Tool Calls | Top Tools |
|---------|----------|-----------|-----------|
| saju_global JP/SEA | 33m 47s | 237 | Bash(126), Edit(25), TG reply(18) |
| spoonai recovery A | 9m | 91 | Bash(76), Read(13) |
| spoonai recovery B | 13m | 117 | Bash(100), Read(9) |
| **Total** | — | **445** | **Bash(302), Read(56), Edit(26)** |

68% of today's tool calls were Bash. The pattern that emerged without being planned: agents handle research, Bash handles verification. DB queries, build reproduction, PayPal endpoint testing — all shell. Agents handled broad information gathering across the JP/SEA market research. Bash handled everything that needed to be confirmed against the actual running system.

The two spoonai sessions running independent investigations of the same bug illustrates the other side of this. Context isolation keeps sessions clean, but it also means the same work gets done twice when sessions aren't coordinated. That overhead doesn't show up in individual session call counts — it shows up when you add them together and notice that 208 of the 445 total calls were spent on the same problem.

> Research goes to agents. Verification goes to Bash. Both are necessary; neither replaces the other.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
