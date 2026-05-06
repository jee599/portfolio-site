---
title: "10 Redesign Variants from 182 Tool Calls: Parallel Agents + Comparison Canvas with Claude Code"
project: "portfolio-site"
date: 2026-05-07
lang: en
pair: "2026-05-07-portfolio-site-ko"
tags: [claude-code, redesign, ui-ux, multi-agent, frontend-implementer, spoonai]
description: "Two redesign sessions, 182 tool calls, 10 spoonai variants and 5 coffee chat variants — driven by one pattern: parallel agents with a browser-browsable comparison canvas."
---

182 tool calls. Two sessions. 10 design variants for one site, 5 for another. It started with a broken font bug — and ended up revealing a repeatable pattern for AI-assisted design exploration.

**TL;DR** Back-to-back redesign sessions using Claude Code's multi-agent dispatch. Parallel `frontend-implementer` agents each produce an independent HTML prototype. A comparison canvas lets you click through all variants in one browser tab. The workflow is fast, but only if you nail the service category upfront — one session wasted a full round because "coffee chat" got read as social instead of ed-tech.

## The Bug That Started Everything

A screenshot triggered the first session. Korean labels rendering as box characters (`□□□□`). The culprit was immediately clear from the filename: `openai-deployment-company-tpg-10b-01.jpg` — an infographic Claude had generated directly, with Korean text embedded without font guarantees.

External-sourced images (CNBC, Anthropic, TechCrunch credits) rendered fine. Only items tagged `credit: spoonai` were affected. A grep across the codebase confirmed it was a single file.

Fix was straightforward:

```bash
rm public/images/posts/2026-05-06/openai-deployment-company-tpg-10b-01.jpg
```

Then removed the `image` block from two post frontmatter files:
- `2026-05-06-openai-deployment-company-tpg-10b-ko.md`
- `2026-05-06-openai-deployment-company-tpg-10b-en.md`

Commit `8b55047` — `chore: remove self-generated infographic image with broken Korean fonts`. 3 files changed, Vercel auto-deployed.

The lesson: when Claude generates images with Korean text, font embedding isn't guaranteed. Either avoid Korean text in generated infographics, or verify rendering immediately after generation.

## spoonai Redesign: 5 Variants → 10 Variants

After the bug fix, the session pivoted. "I'm going to redesign spoonai. Give me at least 5 options I can browse."

Multiple `frontend-implementer` sub-agents ran in parallel, each producing an independent HTML prototype under `~/spoonai-redesign/`. An `index.html` comparison canvas showed all 5 as cards with "View →" links opening in new tabs.

Round 1 results were scored per variant. The highest-rated was `05-brief.html` — minimal, text-heavy, generous whitespace, newsletter aesthetic.

"I like this tone. Give me 5 more evolved from this direction." Round 2 dispatched. Five additional variants built on top of the Brief style from `05-brief.html`.

`design-reviewer` ran verification on both rounds. `codex cross-verify` caught an SRI hash mismatch (a dev-build hash attached to a production bundle) — fixed immediately before the session closed.

Total output: 10 HTML prototype files across two rounds.

## Coffee Chat Redesign: When You Misread the Service Category

Second session. "I'm going to redesign the coffee chat site. Give me at least 5 options I can choose from."

First step: analyze `coffeechat.it.kr`. The site turned out to be a **1:1 mentoring platform for the Korean game industry** — coffee chats, resume reviews, mock interviews with industry professionals. Not a social app. Not a generic chat product. A structured ed-tech/mentoring service.

That context should have determined the design direction immediately. It didn't.

Round 1 produced 5 variants. Feedback: "These all look bad. None of them look professional. Look at Inflearn and other education platforms."

Accurate. The word "coffee chat" pulled the direction toward casual and social. The actual positioning is closer to Inflearn, Class101, Fastcampus — credibility-first, professional education services. After reclassifying the service category, round 2 started fresh with ed-tech platform references as the baseline.

The pattern this session exposed: in redesign work, misreading the service category poisons the entire first round regardless of how many variants you generate. "What kind of service is this?" needs to be locked before dispatching agents — not discovered during review.

## The Parallel Agent Design Exploration Pattern

Both sessions converged on the same workflow:

1. **Lock context** — analyze the site or clarify requirements until the service category is unambiguous
2. **Parallel dispatch** — spin up multiple `frontend-implementer` agents, each producing an independent variant
3. **Comparison canvas** — generate `index.html` with side-by-side cards, each opening its variant in a new tab
4. **Browser selection** — user browses and picks a direction directly, no file paths involved
5. **Focused round 2** — re-dispatch agents constrained to the winning direction

Step 3 is the load-bearing piece. Without the comparison canvas, the user has to manually open 5+ files. That friction compounds — slower feedback, fewer iterations, less precise direction signals. Removing that friction is what makes the loop fast enough to be useful.

The `Agent(46)` calls account for 25% of total tool calls precisely because each variant ran as an independent parallel agent. The parallelism is what makes 10 variants in one session viable.

## By the Numbers

| Metric | Value |
|--------|-------|
| Sessions | 2 |
| Total time | ~4 hours |
| Total tool calls | 182 |
| Bash | 92 |
| Agent | 46 |
| Write | 11 |
| Design variant files generated | 12 (spoonai ×10 + coffee chat ×2 rounds) |
| Files modified | 3 |
| Bug fix commits | 1 |
| `design-reviewer` rounds | 2 |

`Agent` calls at 25% of total is the clearest signal of where the work happens. Each parallel dispatch adds 5–10 agent calls at once. The Bash-heavy count (92) comes from the bug investigation, git operations, and the SRI hash fix that followed codex cross-verify.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
