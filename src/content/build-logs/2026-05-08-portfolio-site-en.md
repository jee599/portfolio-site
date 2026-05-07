---
title: "18 Sessions, 451 Tool Calls: Running 3 Client Projects in One Day with Claude Code"
project: "portfolio-site"
date: 2026-05-08
lang: en
pair: "2026-05-08-portfolio-site-ko"
tags: [claude-code, multi-agent, codex, workflow, ai-automation]
description: "18 sessions, 451 tool calls across a coffeechat redesign, dental ad reports, and a font bug fix — including how Codex caught an SRI hash mismatch that would've broken 4 of 5 prototypes."
---

18 sessions. 451 tool calls. One model, three unrelated client projects, all in a single day.

The breakdown: 175 Bash calls, 50 sub-agent dispatches, 41 WebSearch queries. And somewhere in the middle of all that, a Codex cross-verification pass caught an SRI hash mismatch that would've silently broken 4 of 5 HTML prototypes in every user's browser.

**TL;DR** Parallel design variant generation is fast — but it optimizes for output quantity, not target fit. Codex cross-verification in the major pipeline caught a bug that `code-verifier` missed. A single broken image file took 3 tool calls to track down and remove.

## When "Make 5 Variants" Backfires

The first session (1h 54m, 78 tool calls) was a redesign for coffeechat.it.kr — a Korean mentoring platform connecting aspiring game industry professionals with senior practitioners for 1:1 coffee chats, resume reviews, and mock interviews.

Standard approach: analyze the existing site, dispatch 5 parallel design variants. V1 Editorial Magazine (Korean indie zine aesthetic), V2 Soft Brutalist, V3–V5 in progressively different directions.

The feedback was blunt:

> "These all feel amateurish. None of them look like a professional service. Go look at Inflearn or other education platforms."

The variants were optimizing for *design style diversity* when the actual problem was *professional credibility signaling*. Five variants in parallel takes maybe 10 minutes. Understanding what makes your specific target audience feel "this is trustworthy" takes real research first.

Re-analyzed Inflearn, Class101, and FastCampus — focusing specifically on how they communicate expertise and authority, not just visual style. The second-pass redesign landed much better.

Lesson: parallel generation is a multiplier on direction quality, not a replacement for it. Get the direction right before scaling output.

## Codex Caught What the Verifier Missed

During the same coffeechat session, Codex cross-verification flagged a concrete bug.

The HTML prototypes loaded React from CDN with SRI hashes for integrity verification. The URL path was `react.production.min.js` — but the `integrity` attribute had the hash for `react.development.js`. Different files, different hashes.

```html
<!-- What was in the prototypes -->
<script
  src="https://unpkg.com/react@18/umd/react.production.min.js"
  integrity="sha384-[hash-from-development.js]"
  crossorigin="anonymous"
></script>
```

Browsers enforce SRI strictly. Hash mismatch → script blocked. The prototypes looked fine in local preview (no SRI enforcement in `file://` context) but would silently fail to load React in any real browser.

`code-verifier` passed all four affected files. Codex caught it.

Immediately replaced the hashes across 4 files with the correct `production.min.js` checksums. Without cross-verification, 4 of 5 prototypes would've gone out to the client as completely non-functional HTML.

This is the exact case where the `major` pipeline overhead pays off: when you're delivering HTML directly to clients, one round of external model review is worth the cost.

## Building Diagnostic Reports With Public Data Only

Sessions 2–17 were ad and search diagnostic reports for two dental practices: Yatap NYU Dental and Dongbaek Dental.

The core constraint shaped the entire structure: free diagnostics can only use publicly available data. Naver Place admin stats, ad account performance, call/booking/visit numbers — none of that is accessible without explicit account authorization. So every score in the report had to follow a strict pattern: **verified source → reason for deduction → condition for improvement**. No invented numbers. Everything that couldn't be confirmed from public sources got an explicit "data unavailable — requires account access" label.

Dongbaek Dental added a complication: searching for the clinic returned three different practices with nearly identical names. One of them — "동백서울치과의원" at Dongbaek 7-ro 83, with 18,273 Moduak reviews — was an entirely different practice. Correlating the right clinic to the right address required 20+ WebSearch queries just to resolve name and phone number candidates.

The reports also went through a design revision. User feedback: "These look AI-generated." That was a visual design problem, not a content problem. Built a reference board HTML with 8 style directions (McKinsey consulting doc, Notion Knowledge Document, academic report, Figma spec style, etc.), let the user select, and rebuilt all three reports in the chosen style.

Takeaway: explicit uncertainty labeling in client deliverables isn't a weakness — it's what makes them actually trustworthy.

## Tracking a Font Bug to a Single Image File

Session 18 (130 tool calls, the longest of the day) started with a bug report from spoonai.me: Korean characters were rendering as `□□□□` boxes in a published post.

The screenshot showed labels like "총 규모" (total scale), "OpenAI 지분" (OpenAI equity), and "구조" (structure) all broken. Not an external image — this was a self-produced card-style infographic.

Searched the entire codebase for images marked `credit: spoonai`. One result: `openai-deployment-company-tpg-10b-01.jpg` (58KB). Two posts (ko/en) were referencing it.

```
commit 8b55047
chore: remove self-generated infographic image with broken Korean fonts
3 files changed
```

Delete the JPG, remove the `image:` block from both markdown frontmatter files, commit, push. Vercel auto-deployed. 3 tool calls from diagnosis to deploy.

In the same session: spoonai site redesign. 5 initial variants → "make it simpler, more card-news style" feedback → 5 card-news variants → V5 (`05-brief.html`) tone selected → elevated to `05a-editorial-premium.html` → merged into the actual spoonai-site repo. 7 files, 442 insertions / 725 deletions.

## The Numbers

| Metric | Count |
|--------|-------|
| Total sessions | 18 |
| Total tool calls | 451 |
| Bash | 175 |
| Read | 59 |
| Agent (sub-agents) | 50 |
| WebSearch | 41 |
| Edit | 32 |
| Write | 26 |
| WebFetch | 16 |
| Files modified | 9 |
| Files created | 23 |

The 50 agent dispatches represent plan-orchestrator, frontend-implementer, code-verifier, design-reviewer, and codex-cross-verify running across multiple `major` pipelines. The plan → implement → verify → codex loop ran several times throughout the day.

The 41 WebSearch calls came almost entirely from the dental sessions. Cross-verifying practice names, addresses, and phone numbers for two clinics with similar names in the same geographic area generated a lot of search volume.

Codex cross-verification only ran in the major pipeline — catching the SRI hash mismatch and checking for restricted terms in medical advertising content. The overhead isn't worth it for small tasks. But when delivering 3+ HTML documents directly to clients in a single batch, one external model review pass earns its keep.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
