---
title: "Code Existed. Tweets Were Zero. 9 Claude Code Sessions in Two Days"
project: "portfolio-site"
date: 2026-06-18
lang: en
pair: "2026-06-18-portfolio-site-ko"
tags: [claude-code, automation, preterview, multi-agent, saju, dental-promo]
description: "9 sessions, 1,000+ tool calls, 3 projects: fixing a silent X bot, 37 parallel agents auditing a SaaS, and shipping KakaoPay with legal compliance pages."
---

The saju fortune-telling X bot was created on June 15th. When someone asked "is the bot running okay?" two days later, Claude Code dug through the project. The cron job was registered. The implementation files existed on disk. The directory structure looked complete.

Zero tweets.

`git ls-files apps/web/lib/xbot/` returned an empty line.

That single discovery triggered what became two days of work: 9 Claude Code sessions, 1,000+ tool calls across 3 projects, a 37-agent parallel audit with adversarial verification, a KakaoPay integration that required generating legal compliance pages from a statute, and a repo rename that revealed Vercel's CLI has no rename command.

**TL;DR**: One status check cascaded into fixing a silenced bot, running a 357-tool-call multi-agent audit, renaming a misbranded repo, and shipping a payment flow with auto-generated legal pages. 9 sessions. 3 projects. One pattern that repeated across all of it.

## Code on Disk, Nothing on Prod

Session 1 was a diagnostic. The saju project — a Korean fortune-telling social media bot — was supposed to be posting to X daily. It wasn't.

Claude Code ran the investigation:

- `git ls-files apps/web/lib/xbot/` → empty (files existed locally, never committed)
- Vercel production env: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` — all four absent
- Production endpoint `/api/cron/x-post` → HTTP 404

Three conditions broken simultaneously. The code was written in a session that ended without a commit. The cron job triggered against a route that didn't exist in production. Every scheduled execution had silently failed with no visible error.

This is the failure mode specific to agentic coding. A model can build a complete feature — routing, business logic, error handling — but `git add`, deployment confirmation, and secret configuration happen outside the model's context. When a session ends without explicitly running those steps, the feature lives on local disk in a perfectly consistent state. Production has no idea it exists.

Session 1 fixed all three at once: committed the bot files, set the four Vercel environment variables, generated a profile avatar via GPT image API (sunglasses aesthetic), triggered the first real post.

**5 hours 25 minutes. 58 Bash calls. 27 Read calls. 127 total tool calls.**

First tweet went out at 11:42 PM KST.

## The AI Tell Is Structural, Not Lexical

Next morning: "Does it sound AI-generated?"

The saju bot generates fortune-telling content for Korean users. The target format is casual and specific — the kind of post where a reader stops, wonders if it applies to them, and replies or retweets. Not mystical. Not generic.

`voices.ts` and `generate.ts` already had anti-AI rules built in:

```typescript
const BANNED_WORDS = [
  "soulful", "cosmos", "energies", "universe",
  "alignment", "journey", "transform", "transcend",
  // ~30 more
]

const TONE = "sharp friend who knows saju, not a mystical narrator"
```

Lowercase allowed. Sentence length capped. But reviewing the actual output, the sentence *structure* was still AI-patterned: abstract subject → transformation verb → broad collective noun. The kind of phrasing that sounds meaningful without anchoring to anything specific.

The fix: change what the tweet does structurally — from "say something true about everyone" to "say something specific that makes someone check if they're in it":

```typescript
// Old — abstract, claims to apply to everyone
"This year's energy brings transformation to water signs"

// New — specific, invites self-identification
"2003년생들 이번 달 진짜 좀 힘들 거야"
// "People born in 2003, this month is genuinely going to be rough"
```

Added `cohorts.ts` with birth-year and birth-month characteristic profiles. Updated generation templates to pull from cohort data instead of elemental descriptions. Restructured viral format templates around two mechanics: empathy ("this is exactly what I'm going through") and reply bait ("wait which year are you?").

**41 Bash calls. 16 Edit calls. 65 total tool calls.**

Banning AI vocabulary doesn't fix AI sentence structure. The content pattern has to change, not just the word choices.

## 37 Agents, One Sentence Prompt

Session 5 was a full audit of Preterview — an AI mock interview SaaS that conducts technical interviews, evaluates responses, and generates performance reports.

The prompt: *"Security check, resume analysis, portfolio review, interview patterns, token waste — audit deeply across multiple dimensions."*

37 agents ran in parallel.

Each dimension ran independently. Security agents combed authentication flows, webhook handlers, and API routes. Resume coverage agents evaluated how the system handled different candidate profiles. Interview realism agents analyzed question patterns across sessions. Token efficiency agents profiled prompt construction. Then adversarial verification agents cross-referenced every finding against actual source code.

| Dimension | Key Finding |
|---|---|
| Security Audit | SSRF defense strong; PayPal webhook signature verification absent |
| Resume Coverage | Developer-biased; designers and PMs underserved |
| Interview Realism | Pattern repetition across sessions; seniority calibration inconsistent |
| Report Design | Font inconsistency between sections; mobile layout incomplete |
| Token Efficiency | System prompt duplication across API calls confirmed |
| Adversarial Verification | 2 claims rejected outright; 8 findings downgraded in severity |

**357 total tool calls. 4 hours 5 minutes. 139 Edit calls.**

The adversarial verification step is what separates multi-agent review from running the same analysis multiple times. After dimension agents surface findings, a separate pass spawns agents with a single job: refute each finding. Check the source code, find the relevant implementation, determine whether the claim holds.

Two claims didn't hold — each was valid for a different file than the one the analysis agent examined. Eight more were accurate but overstated — real issues, smaller blast radius than initially reported. Single-context review doesn't have the working memory to hold all findings while simultaneously checking each against source. Explicit adversarial verification as a distinct pass catches this.

The 357 tool call count reflects the multi-agent architecture directly. Other 4-hour sessions in this sprint produced ~130 tool calls. Session 5 produced 357. The per-hour rate looks similar; the concurrency multiplier is what's different.

## Vercel Has No `project rename`

Session 8: "The repo is called coffeechat — rename everything related to git and the repo to preterview."

The product brand was Preterview. The infrastructure disagreed:

- GitHub repo: `jee599/coffeechat`
- Vercel project: `coffeechat`
- Local directory: `~/coffeechat`

GitHub:
```bash
gh api repos/jee599/coffeechat -X PATCH -f name=preterview
```

Git remote:
```bash
git remote set-url origin https://github.com/jee599/preterview.git
```

Vercel — checked CLI first:
```
vercel project --help
# ls, add, rm — no rename
```

No rename command. Routed through REST API:
```bash
curl -X PATCH \
  "https://api.vercel.com/v9/projects/coffeechat" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -d '{"name": "preterview"}'
```

Token was handled in a subshell — not visible in output or shell history. GitHub auto-redirects old repo URLs after rename. Vercel production URL is unaffected until explicitly changed.

## Payments, Then the Statute

Same session: integrate KakaoPay.

KakaoPay's checkout flow uses a Ready/Approve pattern — Ready creates the payment session, Approve captures it after user authorization:

```typescript
// /api/payment/ready
// /api/payment/approve
```

`KakaoBuy.tsx` component, redirect handling, payment state. A few hours of code work.

The blocking issue: Korean PG providers require merchant review before going live. The review isn't purely technical — it checks legal compliance under the Korean Electronic Commerce Act (전자상거래 등에서의 소비자보호에 관한 법률).

Ran the same multi-agent audit pattern from the Preterview security review, this time targeting the statute:

- **12 E-Commerce Act disclosure items missing**: business registration number, telecom sales registration number, physical address, contact info, refund policy notice
- **Refund/cancellation policy**: existing copy wasn't compliant with the statutory 7-day withdrawal rights language
- **Terms of service and privacy policy**: both had unfinished placeholder sections

Generated in the same session:
- `/refund` — refund policy with statutory language
- `/terms` — complete terms of service
- `/privacy` — privacy policy compliant with Korean PIPA (개인정보보호법)
- Footer updates across all pages with all 12 E-Commerce Act required disclosures

One session: KakaoPay code + legal compliance pages + footer items. Ready for merchant review submission.

## Dashboard Cleanup

Session 7 — `dongbaek-uddental`, a dental clinic project.

The dashboard displayed 6 versions of the same diagnostic report as 6 separate rows. No grouping. No "latest" indicator. Finding the current report meant reading the date column on every row.

Fix: group by report type, show latest by default, collapse version history inline.

```
Principal's Diagnostic Report | Latest: 06-17  [▼]
                                Previous: 06-11, 06-10, 06-05, 06-03-v2, 06-03
```

Also updated the blog content generation templates — clarified the line under Korean medical advertising law (의료법). Treatment outcome claims require prior Medical Association review; informational format content (explaining procedures without outcome claims) doesn't. Runbook updated with placement ad keywords and execution links.

**64 Bash calls. 20 Edit calls. 132 total tool calls.**

## The Numbers

| Session | Project | Duration | Tool Calls |
|---|---|---|---|
| 1 | saju_global — X bot | 5h 25m | 127 |
| 2 | dental-promo | 1h 32m | 85 |
| 4 | Grant research | 3h 17m | 29 |
| 5 | Preterview audit | 4h 05m | **357** |
| 6 | saju_global — AI tone | 1h 16m | 65 |
| 7 | dental-promo dashboard | 3h 32m | 132 |
| 8 | Preterview payments | 3h 42m | 175 |
| 9 | Preterview international | 1h 12m | 24 |

Session 5's 357 is the statistical outlier. Other sessions average 40–50 tool calls per hour. Session 5 averaged 87/hour — but with 37 concurrent agents, not 1. Tool call volume scales with concurrency.

## The Pattern

Nine sessions, three projects, the same structure throughout:

**"Is this working?" → investigate → something's broken → understand why → fix.**

The X bot: code existed, three conditions broken simultaneously, zero posts. The Preterview audit: system functioned on the surface, real security gaps and coverage holes underneath. KakaoPay: integration code correct, 12 legal items unmet.

None of these started as fix requests. All three started as status checks.

This matters with Claude Code. A fix request without grounding leads to assumption-filling — the model fixes what seems broken, not what is broken. An investigation request produces ground truth first. The bot's failure wasn't visible without running `git ls-files`. The legal compliance gaps weren't visible from the code — they required checking against the actual statute text.

Starting with "what's the current state" rather than "fix this" keeps scope honest. The model understands what's actually broken before making changes.

The bot had been silent since it was written. It posted its first tweet at 11:42 PM.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
