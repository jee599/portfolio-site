---
title: "Cold-Emailing 185 Institutions & Live Paddle Payments: 600 Tool Calls Across 5 Claude Code Sessions"
project: "portfolio-site"
date: 2026-06-25
lang: en
pair: "2026-06-25-portfolio-site-ko"
tags: [claude-code, preterview, paddle, cold-email, dynamic-workflow]
description: "How 5 Claude Code sessions and 600 tool calls built a verified cold email list for 185 institutions, wired Paddle live payments, and stress-tested ad spend estimates with adversarial multi-agent verification."
---

600 tool calls. 5 sessions. One week of preterview launch prep.

The single heaviest session: 290 tool calls to build a cold email infrastructure targeting 185 institutions — university career offices, coding bootcamps, and IT training programs across Korea and internationally — each with a verified contact and personalized pitch. The lightest session handled ongoing client SEO monitoring in exactly 2 tool calls, entirely delegated to a subagent that restored its own context, ran its checks, and committed results without touching the main session.

**TL;DR:** A two-pass multi-agent Workflow scraped and cross-validated emails for 185 institutions. Paddle live payments got cleanly merged from a 23-commit-behind branch and configured via Browser MCP. An adversarial verification pass corrected 13 of 17 ad spend estimates before I trusted any of them. The one thing that definitively failed: embedding video in cold email.

## How a One-Line Prompt Scaled to 185 Personalized Emails

The starting prompt was a single sentence: "Write a cold email template for preterview, targeting university career offices."

preterview is an AI interview practice tool — the kind of product that career centers recommend to students preparing for job season. The scope kept growing with each follow-up:

"Make it 30–50 domestic institutions, 50+ international. Personalized copy per institution. Real contacts only — no guesses, nothing without a verifiable source."

That last constraint — *verified contacts only* — forced the architecture into a multi-agent Workflow. Sequential single-context scraping couldn't handle the cross-validation requirement at this scale. Two runs:

- **Round 1**: 95 institutions scraped, 92 with verified emails
- **Round 2**: 198 institutions scraped, 185 with verified emails

The list spans Samsung SSAFY, Woowa Tech Course (우아한테크코스), Multicampus, and other Korean programs, plus MIT CSAIL, international coding bootcamps, and university CS departments. Each institution: parallel-scraped from multiple sources, email cross-validated against an official page, contacts without a citable source explicitly excluded. No pattern-inferred addresses like `careers@university.edu` — if the email didn't appear on a real page, it got dropped.

Personalization wasn't template variable substitution. The pitch to a Yonsei University career office — framing preterview as a job prep tool for students navigating Korean corporate hiring — reads differently from one to a Stanford CS department where the framing shifts to developer job prep and portfolio review. Role context (career advisor vs. department coordinator), institution size, and student profile shaped the copy for each entry.

Final output: `send_outreach.py` with a 30-emails-per-day throttle, ready to run as a cron job. Gmail MCP (`mcp__claude_ai_Gmail__create_draft`) generated 20 draft emails automatically. I review each before it goes out — the automation handles the drafting, a human stays on approval.

Why 290 tool calls for one session? Bash (100), Edit (68), Read (47), Gmail MCP (20), Write (12). Not code generation on loop — the cycle was: scrape institution data → verify contacts → generate personalized drafts → get feedback → revise. Real data gathering at scale, not synthetic output.

## The Email Video Problem (And Why Hitting the Wall Is Faster)

Early drafts included a "▶ 30-second demo — click to play" section. The idea: show preterview in action without requiring a click-through.

We sent actual test emails. Neither Gmail nor Naver Mail played anything. Then the iteration cycle:

- `<video>` tag embed — blocked
- Animated GIF embed — rendered, but no interactive play
- Hosting video on `preterview.com` with an HTML overlay — broken elements
- Base64 inline HTML — also blocked

The conclusion: email clients block inline video playback as a near-universal security policy. This isn't a configuration issue. It's a stable constraint that every major client enforces the same way.

"If you can't fix this, just cut it."

Switched to a static screenshot with a link to the demo. Done in one change.

This segment consumed most of the middle portion of Session 2. The lesson: sometimes the fastest path through a constraint is running directly into it, confirming it's real rather than a misconfiguration, and pivoting. Engineering around a security policy that every client enforces identically has a known outcome.

## Merging 23 Commits of Paddle Checkout Without Dragging In PoC Code

`feat/paddle-checkout` was 23 commits ahead of `origin/main` and unmerged. Branch archaeology first: 14 commits of visual interview PoC work, then 4 Paddle payment commits stacked on top.

The two layers had no file overlap. Payment-specific files:

- `app/api/pay/paddle/*`
- `components/pricing/PaddleBuy.tsx`
- `lib/payments/paddle.ts`

Selectively merged these without pulling in the PoC. Clean merge, no experiment code in main.

Live key configuration happened via Browser MCP (`mcp__claude-in-chrome__browser_batch`, 17 calls) — directly interacting with the Paddle dashboard, not walking through UI instructions. Three plan Price IDs, webhook secret, all organized into a single copy-paste `export` block.

Domain approval is still pending, so the payment links aren't active. Code is fully configured on live keys. When approval clears, it activates without any additional changes.

## 24 Agents, 880k Tokens, and Why First-Pass Numbers Can't Be Trusted

"Should I run Instagram or Naver ads? What does ₩500,000 (~$370) actually reach?"

This triggered a Workflow: 24 agents, 880k tokens, 245 web searches.

The adversarial verification pass corrected **13 of 17 key metrics**. The initial "2025 Instagram CPM $8" became "$5.5" after cross-validation. Initial Naver PowerLink CPC estimates for competitive terms got revised upward. The numbers from a single research pass are not reliable — sources use different methodologies, have different recency, and often cite each other circularly.

The adversarial verify pattern: after the initial research agents produce estimates, a second set of agents is explicitly prompted to *refute* each finding — find contradicting sources, flag recency issues, surface methodological problems. What survives refutation is what gets used.

For a ₩500,000 budget targeting Korean users interested in job prep:

- **Naver PowerLink wins** on cost-efficiency for this audience
- Keywords like "면접 말버릇" (interview speech habits) and "AI 면접 연습" (AI interview practice) have lower CPC than generic job-prep terms with meaningfully higher purchase intent
- Instagram reach is wider but conversion intent is lower for this specific product category

GA4 (`G-ES6SENFGM2`) and Naver conversion tracking are now wired into `components/marketing/analytics-scripts.tsx`. A consent banner covering both tracking systems is in `components/marketing/consent-banner.tsx`.

The research session itself was 78 tool calls — not intensive, but deliberate. The 880k token count reflects the multi-agent Workflow overhead, not a single context ballooning.

## The Session That Cost 2 Tool Calls

Ongoing dental clinic SEO monitoring ran as a `dental-clinic` subagent. Total from the main session: one `Agent` call to spawn it, one `Bash` call to verify the output committed.

The subagent handled everything else: reading `clinic.json`, `history.json`, and cached position data to restore its own context from the last session, running keyword rank checks across 6 monitored search terms (blog tab and integrated search positions in Naver), writing the session digest, committing it.

One notable result: a target keyword had dropped out of the top 12 in the blog tab on the previous measurement. This session confirmed recovery to 3rd — turned out to be temporary displacement from competitor content spam, not an organic ranking decline.

This is why the delegation architecture exists. The main session context doesn't get consumed by client monitoring work. The subagent restores its own context from files, executes the measurement, records the result, and commits — without the main session holding any of that state. Two tool calls in, fully autonomous execution out.

## Session Breakdown

| Session | Work | Elapsed | Tool Calls |
|---------|------|---------|-----------|
| 1 | Dental clinic SEO monitoring | 12 min | 2 |
| 2 | Cold email infrastructure | 27h 53min | 290 |
| 3 | Paddle payment integration | 4h 44min | 163 |
| 4 | Ad strategy research | 27h 25min | 78 |
| 5 | Grant research + IR prep | 2h 52min | 67 |

**Total: 600 tool calls. Model: `claude-opus-4-8` throughout.**

Tool distribution: Bash (256), Edit (105), Read (84), Browser MCP (27), Write (24), Gmail MCP (20), Workflow (13).

Sessions 2 and 4 show 27-hour elapsed times because those sessions stayed open overnight. Actual focused work time was a fraction — elapsed measures session lifetime, not active usage.

## Three Patterns This Week Reinforced

**Workflow for anything needing parallel verified data.** The cold email infrastructure and ad research both hit the same wall in a single context: you either get unverified results fast or thorough results slowly. Multi-agent Workflow breaks that tradeoff — parallel scraping with a cross-validation layer is both faster and more reliable than sequential work at scale.

**Adversarial verify before trusting research output.** 13 of 17 metrics changed after verification. That's not failure — it's expected behavior when aggregating numbers across sources with different methodologies and recency. Building the verification pass into the Workflow means you never act on first-draft numbers.

**Some constraints only reveal themselves at runtime.** The video-in-email failure is knowable from documentation, but hitting the actual test confirmed it faster and more definitively than research would have. For infrastructure constraints that are unclear, the test is often cheaper than the research. The Paddle branch merge is the counterexample: five minutes of branch analysis before touching anything saved a much messier revert. Know which type of constraint you're dealing with.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
