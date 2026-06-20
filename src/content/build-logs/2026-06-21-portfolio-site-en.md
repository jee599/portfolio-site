---
title: "315 Tool Calls, 3 Sessions: Business Plans, GTM Analysis, and 24 Mobile Bugs"
project: "portfolio-site"
date: 2026-06-21
lang: en
pair: "2026-06-21-portfolio-site-ko"
tags: [claude-code, claude-opus, workflow, gtm, mobile-ui, i18n, preterview]
description: "Three Claude Code sessions over three days: six business plan docs auto-generated, Product Hunt GTM verified with adversarial agents, 24 mobile UI bugs fixed via browser automation."
---

315 tool calls. 29 files modified. 12 files created. Three Claude Code sessions over three days — each tackling something completely different.

**TL;DR** Claude Code compounds on repetitive, long-horizon tasks. Six business plan documents in one session. 24 mobile layout bugs caught by measuring actual runtime values instead of guessing from static code.

## Six Business Plans, One Session

The opening prompt was dense:

```
Analyze the LLM/technical architecture of both the dental ad automation project
and preterview. Write two detailed technical business reports.
Then find every realistic grant, contest, and investment opportunity
that fits my projects — validate each one, score the fit and pass probability,
and send results to Telegram.
```

Broken down: two technical analyses, two business plans (one per project), one funding fit report, everything delivered to Telegram. Six documents total.

98 tool calls, a 27-hour session. Dominant tools: Bash (35), TaskUpdate (18), Read (12), Write (11).

The first thing Claude did was scan `~/funding/`. Two days earlier (2026-06-17), a previous session had already validated 57 funding opportunities. Claude pulled that data and built the fit analysis on top — no redundant research from scratch. That's the right call. The documents it produced:

- `01_preterview_기술사업분석.md`
- `02_치과광고자동화_기술사업분석.md`
- `03_지원사업_공모전_투자_핏분석.md`
- `04_사업계획서_preterview.md`
- `05_사업계획서_치과광고자동화.md`
- `06_공고분석_제출서류_체크리스트.md`

Six documents, one session, delivered to the Telegram hermes channel. Writing a single business plan by hand takes at minimum two days. Six would be a week-plus project.

Mid-session, I added an instruction: any response longer than one A4 page should be output as an HTML file instead of markdown. From that point on, Claude switched to generating `.html` files you can open directly in a browser. Changing output format mid-conversation without restarting anything — that's one of the quietly useful things about Claude Code's interaction model.

## Should I Launch on Product Hunt?

Session 2 had a different character. The task: figure out where to sell preterview and whether Product Hunt is the right first move. 35 tool calls, heavy on Bash (22).

The first action was reading `preterview-global-gtm.html`, a document from a prior session. It already contained output from 25 research agents plus 16 fact-checked data points. Product Hunt was covered in that doc, tagged as "Channel ④ · SECONDARY · 1-day spike."

To validate the current PH landscape, Claude spun up 12 parallel agents via the Workflow tool. The pattern here was adversarial verify: instead of collecting information and summarizing, each headline claim got a dedicated skeptical agent whose job was to refute it.

Two specific findings from that pass:

- The "10x / 40–50x" growth multipliers frequently cited in PH success stories are anecdotal, not measured outcomes.
- The 8.7%/hour engagement stat comes from 2016 data.

After stripping the overstatements, the conclusion:

> Product Hunt isn't a question of *whether* — it's a question of *when*. Not now. Not as the first channel.

The session also covered SEO/AEO status for preterview. When I asked whether GEO/AEO groundwork was in place, Claude went into the actual codebase and verified: structured data markup, meta tags, `sitemap.xml` state. Giving it a reference URL and having it analyze the approach to set direction — this is a pattern where Claude Code is faster than a manual audit.

## The 2240px Mobile Mystery

Session 3 was the heaviest. Started with `/effort ultracode` enabled (xhigh reasoning + dynamic workflow mode).

The complaint:

```
preterview is broken on mobile — buttons are misaligned, English text showing
up on Korean settings, general layout weirdness. Check everything, find whitespace
and line break issues stretching the layout, fix all of it.
```

182 tool calls, 4 hours. Bash (46), Edit (40), Read (35), `mcp__claude-in-chrome__browser_batch` (26).

The key debugging moment: Claude launched a dev server and simulated a 390px iPhone viewport using the Chrome MCP tool. The browser inspector reported a rendered width of 1568px. Claude ran `window.innerWidth` directly via JavaScript — the actual value was **2240px**. The window was 784px wide. Content was overflowing at 2240px.

Finding this with static code review means guessing which files might cause overflow and checking them one by one. Getting the actual runtime measurement first and working backward to the source is faster by a large margin.

The i18n bug was a separate issue. Korean selected, English buttons appearing. Root cause: the browser sending `Accept-Language: en` triggered an automatic redirect to `/en`. Fix: `~/preterview/i18n/routing.ts`, plus filling missing translation keys under `messages/ko/`.

Files changed across Session 3:

- `app/globals.css` — overflow root fix
- `i18n/routing.ts` — language detection logic
- `components/interview/InterviewRoom.tsx` — mobile layout
- `messages/ko/common.json`, `dashboard.json`, `pricing.json` and others — removed residual English keys

24 files total. Doing that manually is 24 open-find-edit-save cycles. Claude identified the pattern and handled it with 40 Edit calls.

## Three Patterns Across All Sessions

**Context reuse compounds.** Session 1 leveraged the `~/funding/` validation data from two days earlier. Session 2 started from the GTM document built in a prior session. Each session didn't start from zero — it started from where the last one ended.

**Adversarial verify raises research quality.** The difference between "gather information" and "have separate agents try to disprove each claim" is significant. Session 2 caught stale and anecdotal numbers that would have made the GTM analysis unreliable. For every headline claim, a skeptical agent whose default is to refute — that's the pattern.

**Browser automation changes the UI debugging loop.** `innerWidth: 2240px` doesn't appear in any source file. You have to measure it at runtime. `mcp__claude-in-chrome__browser_batch` automates that measurement step, which means Claude can find the actual constraint before touching any code.

Three-session totals: Bash 103 calls, Edit 48 calls, Read 47 calls.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
