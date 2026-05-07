---
title: "18 Sessions, 451 Tool Calls: 5 Parallel Redesigns, a Pre-Deploy Bug Catch, and a Dental SEO Pipeline"
project: "portfolio-site"
date: 2026-05-07
lang: en
pair: "2026-05-07-portfolio-site-ko"
tags: [claude-code, multi-agent, codex, design, parallel-agents, dental-ad, orchestration]
description: "18 Claude Code sessions, 3 domains, 451 tool calls: parallel design agents, a pre-deploy SRI bug catch, and compliance-first dental SEO reports."
---

451 tool calls across 18 sessions in a single day. Bash ran 175 times, 50 subagent dispatches, 41 web searches. Three completely different domains — coffeechat platform redesign, spoonai site migration, dental marketing diagnostics — all handled in parallel with Claude Code as the orchestrator.

**TL;DR**: Parallel agents expand your design search space, but initial direction matters more than generation speed. Codex cross-validation caught an SRI hash mismatch that browsers would have blocked in production. Dental marketing reports require hard separation between public data and metrics that need admin access — mixing them is a compliance risk.

## Why "All Five Are Bad" Was the Right Answer

The first major task: redesign `coffeechat.it.kr`, a mentoring platform connecting game industry professionals with candidates for 1:1 coffee chats, resume reviews, and mock interviews.

The brief was simple: "Give me at least 5 variations, I'll pick one."

I ran `plan-orchestrator` to drop a `plan.md`, then dispatched 5 `frontend-implementer` subagents simultaneously:

- V1: Editorial Magazine
- V2: Soft Brutalist
- V3: Floating Gradient
- V4: Object-Oriented UI
- V5: Brief Format

Each agent ran in an independent context — no cross-contamination. The output was an `index.html` comparison canvas where clicking a card opens the variation in a new tab.

Feedback: "None of these look professional. Check Inflearn or other edu platforms."

Correct. I had explored design trend variations but missed the core requirement: *trust signals for a professional education service*. I approached it with indie game aesthetic when the reference baseline was Inflearn, Class101, and FastCampus — polished, credibility-first platforms.

The lesson: parallel generation without reference alignment produces generic results. The bottleneck isn't generation speed — it's initial direction. "Make me 5 versions" without a reference produces 5 variations of the wrong thing.

Session 1: 78 tool calls, 28 agent dispatches, 25 bash commands.

## The SRI Hash Bug Codex Found Before the Browser Did

During the spoonai redesign, `design-reviewer` flagged V3 as a blocker. After fixing, I saved `diff.patch` and ran Codex cross-validation.

Codex found an SRI (Subresource Integrity) hash mismatch. V2 through V5 loaded `react.production.min.js` from CDN, but the `integrity` attributes were set to development build hashes.

```html
<!-- Wrong: production URL with development hash -->
<script src="react.production.min.js"
  integrity="sha384-development-hash...">
```

The browser compares the hash against the actual file content and blocks the script if they don't match. Locally, this is invisible — browser cache hides it. In production, you get `Integrity check failed` and a broken page.

The reason this slipped through: the model that wrote the code tends to validate its own output. When Codex reviewed the diff cold — with no context about how the code was written — it spotted what the original model missed. That's the value of external cross-validation. Not redundancy, but a genuinely different perspective.

Fix: replace all CDN links with correct production hashes.

## The 58KB Box Problem

Session 2 started with a screenshot: an article about OpenAI's deployment company, filled with `□□□□` glyphs. Labels like `Total Size`, `OpenAI Stake`, and `Structure` were rendering without any actual characters.

Root cause: a directly-produced infographic image with `credit: "spoonai"`. File `openai-deployment-company-tpg-10b-01.jpg`, 58KB — Korean font not embedded.

```bash
grep -r 'credit.*spoonai' src/content/posts/
```

Found two posts (ko/en) referencing the image. Removed the `image:` block from both frontmatters, deleted the JPG. 3 files, single commit, Vercel auto-deploy.

In the same session: spoonai redesign continued. From the initial 5 variations, `05-brief.html` won. Five more variations on that direction. `05a-editorial-premium.html` selected as final, applied to the production codebase — `feat/editorial-premium-redesign` branch, 7 files changed, 442 insertions, 725 deletions.

Session 2: 130 tool calls, 87 bash, 22 agent dispatches.

## Dental SEO Reports: Public Data vs. Admin-Only Metrics

Sessions 9–18 were a dental advertising diagnostics pipeline. Two clinics — Yatap NYU Dental and Dongbaek Seoul Pediatric Dental — each needed a free SEO/AEO diagnostic HTML report.

One hard rule governed the entire pipeline: **never fabricate metrics that require admin access**. Naver Place view counts, phone click rates, monthly search volume, CPC, CTR — all flagged as "requires authorization / unverified" and kept strictly separate from publicly observable data. Korean medical advertising law prohibits performance guarantees and exaggerated claims; those rules applied throughout.

Dongbaek had a naming confusion problem. A search on Mooodac returned "Dongbaek Seoul *Dental* Clinic" (Dongbaek 7-ro 83) — a completely different clinic from "Dongbaek Seoul *Pediatric* Dental Clinic," the actual target. Mixing those two means putting another clinic's data into the report.

Every search result was labeled "candidate / needs verification." The user confirmed the correct Naver Place link, which became the authoritative reference for all subsequent data.

Multi-session handoff used file-based state. Each session starts with fresh context, so `evidence.md` and `plan.md` were saved first, and the next session prompt included explicit file paths:

```
Continuation task. Web search not needed.
Input:
- .../research/yatap_nyu_public_evidence.md
- .../research/dongbaek_yu_public_evidence.md
```

Explicitly saying "web search not needed" prevents the model from re-searching already-verified data.

Codex cross-validation returned `request-changes`: missing `data-label` attributes on the comparison summary table for mobile responsive layout, and residual performance-guarantee phrases that needed removal. After fixes, a final piece of feedback arrived: "The design looks too AI-generated." So I built an 8-direction reference selection board in HTML before touching any redesign — direction-first, then execution.

## Orchestration Policy in Three Sessions

A meta-task ran alongside the implementation work: documenting the Hermes + Claude + Codex + OMX multi-model orchestration policy.

Session 5: initial draft. Session 6: verified against local environment (`~/.codex/AGENTS.md`, openclaw). Session 8: Codex review incorporated, v2 finalized.

Each session's output became the next session's input — same handoff pattern as code work.

One key correction surfaced: OMX is not a separate binary. It's a behavioral pattern composed of `~/.codex/AGENTS.md` + project `AGENTS.md` + Codex prompt/skill layers operating in heavy mode.

## Day Stats

| Metric | Count |
|---|---|
| Sessions | 18 |
| Total tool calls | 451 |
| Files created | 23 |
| Files modified | 9 |
| Bash | 175 |
| Agent | 50 |
| WebSearch | 41 |
| Edit | 32 |

Bash at 39% of all calls. CDN URL verification, git operations, build checks, dev server — all accumulated. The 50 agent dispatches split between parallel design generation and cross-validation calls.

> Parallel generation widens the exploration space. Cross-validation catches the bugs you'd otherwise find in production. Both are quality insurance — not speed optimizations.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
