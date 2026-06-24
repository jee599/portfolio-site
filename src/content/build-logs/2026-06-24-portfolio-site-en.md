---
title: "Claude Code 839 Tool Calls: Competitor Analysis, Paddle Payments, and Ad Pixels in 72 Hours"
project: "portfolio-site"
date: 2026-06-24
lang: en
pair: "2026-06-24-portfolio-site-ko"
tags: [claude-code, preterview, paddle, multi-agent, automation]
description: "How a solo founder used Claude Code multi-agent workflows to ship competitor analysis, Paddle payment integration, and ad pixels in 72 hours."
---

839 tool calls across 7 sessions. That's what Claude Code logged while I compressed roughly a week of startup work into 72 hours — competitor analysis, government grant research, sales email production, Paddle payment integration, ad pixel setup, and somehow a moving checklist app along the way.

**TL;DR** Dynamic Workflow (multi-agent fan-out) was the defining pattern of this sprint. Complex research got delegated to workflows; implementation was handled directly. Of the 839 total tool calls, Bash 286 · Edit 123 · Read 95 form the core triangle.

## Dynamic Workflow Became the Default Operating Mode

Every session this week settled into the same structure: a complex question comes in, Claude doesn't answer it directly — it spins up a Dynamic Workflow instead. Dozens of agents fan out in parallel doing web search, code analysis, and cross-verification. When they finish, a `<task-notification>` comes back.

A concrete example: "I want to run ads for preterview — is Instagram better? Search for objective benchmarks on which channel and targeting give the best bang for the buck, both domestic and global." That single prompt kicked off a workflow with 24 agents. Five research agents ran in parallel collecting real benchmark data across Naver, Meta, Google, Reddit, and TikTok. Seventeen verification agents then audited every number for credibility. Result: 13 major data points were revised or refuted. Roughly 880k tokens, 245 web tool calls.

Every research-shaped question went through this pattern. I counted more than 7 workflow runs just this week.

The efficiency gain isn't subtle. A research task that would take 3–4 hours of manual searching gets done in 15–20 minutes with adversarial verification baked in. The key insight is treating Claude not as a smarter search engine, but as an orchestrator — one that can spin up specialist agents and cross-check their findings before surfacing results.

## Dissecting a Competitor in Under 24 Hours

On June 17th, Codeit launched Ascent — an AI mock interview product that directly overlaps with Preterview's core feature set. I found out six days after launch.

I threw a single prompt: "Codeit just released something that looks similar to my preterview — compare them based on the current state." The workflow fanned out across four tracks simultaneously: detailed product investigation of Ascent, company and strategy context for Codeit (including their KADE and WhatTime acquisitions), the broader domestic AI mock interview competitive landscape, and adversarial verification of the five key claims that emerged.

The verification stage surfaced one important refutation: the initial claim that "Ascent has GitHub/portfolio URL analysis" came back refuted — it doesn't exist. What was confirmed through actual testing: Ascent supports both video and voice, covers all job categories (with ~113 company-specific interview profiles), and is Korean-only. That's a fundamentally different market position from Preterview's developer-focused, globally-oriented, GitHub-integrated product. Adjacent market, not head-to-head competition.

Total for this session: 163 tool calls. Bash 50 · Read 17 · Edit 14.

The speed matters. Manual competitive research for a product launch would realistically take a full day with uncertain coverage. Having adversarial verification built into the workflow means the analysis arrives with explicit confidence levels on each finding — much more useful than a summary that silently elides uncertainty.

## Paddle Integration: 271 Tool Calls and Browser Automation

The heaviest session of the week was Paddle payment integration: 23 hours 40 minutes elapsed, 271 tool calls.

Preterview already had geo-routed payments — Korean users go through PayApp, international users through PayPal. Paddle made sense as a PayPal replacement because it operates as a Merchant of Record, which handles international tax compliance automatically.

Before writing any code, Claude validated the current integration approach against Paddle's live documentation. The stated reason: "Paddle Billing API changes frequently, and getting webhook signature verification wrong is catastrophic." After that validation pass, the generated files were:

- `lib/payments/paddle.ts`
- `app/api/pay/paddle/create/route.ts`
- `app/api/pay/paddle/webhook/route.ts`
- `app/api/pay/paddle/confirm/route.ts`
- `components/pricing/PaddleBuy.tsx`

The existing PayPal code was preserved but hidden from the UI — a clean failover path without dead code removal.

What made this session unusual: `mcp__claude-in-chrome__computer` was called 67 times. Claude operated the browser directly — copying Price IDs from the dashboard, registering webhook endpoints, running sandbox payment tests. Browser automation as a first-class part of the implementation workflow, not a separate step.

Mid-session I caught an issue: "Wait, isn't the checkout going through PayPal still, not Paddle?" Claude took a screenshot of the browser state, confirmed the routing logic had a bug, and fixed it. The feedback loop between browser automation and code editing compressed a debugging cycle that would normally require switching contexts repeatedly.

## ₩500K Ad Budget, Three Workflow Runs, and Pixels on Every Page

The advertising session (8 hours 46 minutes, 69 tool calls) had a progressively narrowing structure. It started broad — "Is Instagram better?" — and tightened through several turns: "Let's cap the budget at ₩500K and keep it trendy" → "What's a pixel exactly?" → "Let's go with Naver — find me the most cost-efficient keywords."

Three sequential workflow runs handled the research side:

1. Channel, targeting, and budget benchmarks
2. Naver PowerLink setup, ad copy drafts, and pixel implementation checklist
3. Per-channel projected reach funnel model at the ₩500K budget

After settling on Naver, a fourth workflow run pulled real monthly search volume and CPC data to rank keywords by cost efficiency.

The pixel implementation was direct code work:

- `components/marketing/analytics-scripts.tsx` — Naver Click Choice pixel + Google gtag loading
- `lib/marketing/consent.ts` — GDPR consent state management
- `lib/marketing/track.ts` — conversion event wrappers

The advertiser scripts went into Next.js `layout.tsx`, with conversion events wired to the Paddle payment success page. The full funnel from ad click to purchase confirmation now has tracking coverage.

## The Stop Hook Caught Two Commits Worth Keeping Clean

Sessions 4 and 7 both hit the stop hook right before commit:

```
Stop hook feedback:
Found 2 debug leftover(s) in working tree.
```

The hook detects debug log residue and temporary comments, blocking the commit until they're cleaned. Session 4 caught leftover debug code from the email HTML work. Session 7 caught a temporary comment inside the pixel implementation. Both times the follow-up was: "Check that everything related is working correctly and there are no side effects" — and Claude did a full scope review before the commit went through.

The design gate also triggered repeatedly. Every time I generated HTML for the moving checklist app, a sales page, or an email template, it blocked until I specified the Open Design pass rationale. For the Preterview sessions, the gate cleared after confirming that `globals.css` verbatim tokens were bound to the generated output.

These hooks aren't friction — they're the mechanism that prevents "it compiles" from being confused with "it's ready." Over a 72-hour sprint with context switching between five completely different problem domains, automated guards on commit quality are worth more than any manual review process I could realistically sustain.

## Aside: A Moving Checklist App, Also Built with Claude Code

Session 5 (1 hour 3 minutes, 79 tool calls) had nothing to do with startups. I'm moving into a 34-pyeong apartment, merging two households. I needed a tool to help sort what to keep, sell, and throw away.

"Build it as a site and deploy it. Make sure it saves state."

Claude produced three CSVs — appliance decision table, furniture decision table, utilities/admin checklist — and built an interactive app with keep/sell/toss classification, live aggregate counts, and localStorage auto-save. Deployed.

This is a real pattern in solo founder Claude Code usage: personal life bleeds naturally into the work context. The same tool, the same workflow, the same session structure — the domain just changes. The overhead of spinning up a dedicated tool for a one-off personal project approaches zero.

## By the Numbers

| Category | Count |
|----------|-------|
| Sessions | 7 |
| Total tool calls | 839 |
| Bash | 286 |
| Edit | 123 |
| Read | 95 |
| mcp__claude-in-chrome__computer | 97 |
| Files modified | 30 |
| Files created | 45 |

The pattern that made this compression possible: research questions go to workflows, implementation is direct. That separation is what let 72 hours absorb what would normally take a full work week.

Multi-agent orchestration isn't magic — it's a specific architectural choice. Treat Claude as an orchestrator rather than a single-threaded assistant, give it tools that can fan out and verify in parallel, and the throughput increase is real and measurable. 839 tool calls is a lot. But 839 individual prompts would have taken a month.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
