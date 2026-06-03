---
title: "596 Tool Calls in One Day: Building Two Production Systems in Parallel with Claude Code"
project: "portfolio-site"
date: 2026-06-04
lang: en
pair: "2026-06-04-portfolio-site-ko"
tags: [claude-code, automation, dental-marketing, outreach, multi-agent]
description: "10 sessions, 596 tool calls, two production systems shipped in one day. How Claude Code's context isolation makes parallel projects viable."
---

596 tool calls. 10 sessions. 79 files touched. One session ran for 11 hours straight and consumed 389 of those calls on its own.

That was yesterday. Two separate production systems went from idea to deployed in the same 24-hour window: a dental clinic marketing diagnostics system for the Korean market, and a global outreach pipeline targeting US small business owners. Neither was a prototype—both are running today.

**TL;DR** Claude Code's session-level context isolation makes it possible to run completely unrelated projects in parallel without cognitive bleed. The catch: you have to externalize state explicitly, or you lose continuity between sessions.

## Session 5: Where 389 Tool Calls Went

"Show me the dental report" is how the session opened. What existed when it closed:

**`dental-promo-audit` skill** — Crawls Naver Place rankings, blog positions, Instagram presence, and ad spend using real browser automation. Design constraint: only values measured directly go into the score. Estimates don't count.

**`dental-clinic` agent** — Per-clinic context caching in `clinic.json` and `history.json`. Every new session starts by restoring this state, so the agent doesn't re-derive what it already knows. Blog writing, ad analysis, and report generation run in one continuous flow from a single agent.

**`dental-ads` agent** — Dedicated to Naver PowerLink and Place ad performance. Pulls metrics, learns keyword efficiency, closes the optimization loop.

**`dental-promo/_tracker/index.html`** — A bar-chart dashboard visualizing per-clinic channel scores, deployed to Vercel behind auth.

Tool call breakdown for Session 5:

| Tool | Count |
|------|-------|
| Bash | 139 |
| Edit | 119 |
| Read | 44 |
| Write | 36 |
| browser_batch | 26 |

That `browser_batch` count is via Claude-in-Chrome—actual browser tab control, not HTTP requests.

## Why `WebFetch` Doesn't Cut It on Naver

Direct `WebFetch` to Naver returns 403. Cloudflare WAF, CAPTCHA, and a login wall make curl-based scraping effectively impossible for the data that matters.

Two routes worked:

**Naver Search API** (`search.naver.com`) — No auth required. Good for coarse signals like blog post rankings. Fast, reliable, public.

**Claude-in-Chrome** — The Chrome extension controls the browser under a logged-in user session. This is how you reach Naver Place admin screens and ad performance dashboards that only render post-login. The workflow: generate throwaway scripts like `/tmp/naver_place.py` or `/tmp/naver_probe.py`, inject them into open tabs.

To verify the extension is live: call `tabs_context_mcp`. Non-error response means it's active.

During the session, the Naver session expired and the extension went dark. After a "I re-logged in" message, it came back. That confirmed the assumption: MCP extension state is coupled to browser login state—not to Claude Code.

## The GPT Image 2 Permission Wall

Dental blog image quality wasn't matching what top-ranked Korean dental clinics publish. Those clinics put out card-news format images: information-dense, logo-stamped, consistent. Switched to GPT Image 2 and hit this:

```
Not Available
You do not have permission to access this page in this project or organization
(required permission: api.model.images.request)
```

Organization-level image generation permission wasn't enabled for the project key. Swapped keys, got access.

The image pipeline lives in `dental-blog-image-pipeline/scripts/pipeline.py`. It generates 5 blog images plus 4 card-news panels. Logo goes in the corner without overlapping critical content. Korean medical law compliance is baked in: no before/after comparisons, no surgical outcome images, no price disclosures—all auto-excluded.

## Sessions 7–10: 125 Leads, 89 Verified Emails

Completely different project, same day.

The outreach pipeline targets US Amazon sellers and small business owners with a product copy improvement service pitch. Eight lanes: Shopify, Yelp, Amazon, B2B directories, and four others. Four research agents ran in parallel, each covering separate lanes.

End-of-day count: **125 leads, 89 public emails, 0 validator errors**.

The validator (`validate-jdlab-queue.mjs`) is what makes this reliable. It catches schema problems before any artifact gets generated: missing `discovery_status` fields, fewer than two free examples, disallowed keys. Pre-flight validation, not post-hoc cleanup.

On email verification: agent-found emails weren't trusted at face value. Five samples were independently re-verified via `WebFetch` against the source pages. All five were genuinely public on the pages claimed.

Gmail drafts are handled by `create-gmail-drafts-from-jdlab-queue.py`: one smoke-test draft → validation pass → full batch. Human review before anything sends.

## When the Reviewer Filed a REQUEST_CHANGES

After Claude's work in Session 3, an independent review pass flagged something real.

The research report had bundled "Upwork/Fiverr" together and attributed marketplace escrow, dispute handling, and payment processing claims to both. The problem: Upwork's official pages were returning 403 across the board. No actual source existed for those claims.

Checking `logs/upwork_sources.json` confirmed it—every Upwork official URL was 403.

The fix:

- "Upwork/Fiverr" → "Fiverr (verified)"
- Upwork entries in `sources.json` flagged as "official page 403 — unverified"
- HTML report, summary markdown, and `sources.json` all updated together

Don't present unverified information as confirmed. That's the baseline rule for this pipeline.

## How Two Tracks Run Without Interfering

Sessions 1–3 were global outreach research. Session 5 was dental system construction. Sessions 7–10 were outreach pipeline implementation. The two projects interleaved across the same 24 hours without any friction.

The reason: each Claude Code session starts with a clean context window. Dental session context never leaks into outreach sessions. No shared in-memory state at the session level.

What makes continuity work despite the isolation: explicit external state files.

- `clinic.json` — current marketing state per clinic
- `history.json` — completed work log per clinic

Every dental session opens by reading these files. Every session closes by writing back. The session boundary is irrelevant to the work's continuity.

> Context isolation is the feature, not the limitation. You get a clean slate per session. The cost: you have to externalize state explicitly. Skip this, and you restart from scratch every time.

## Full-Day Tool Usage

| Tool | Count |
|------|-------|
| Bash | 193 |
| Edit | 144 |
| Read | 91 |
| Write | 62 |
| browser_batch | 26 |
| Agent | 18 |
| WebFetch | 13 |
| ToolSearch | 10 |
| Other | 39 |

Bash 193 covers script execution, git checks, and validation commands across all sessions. Edit 144—119 of those came from Session 5 alone. One long session assembling a system from many files produces that kind of concentrated edit distribution.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
