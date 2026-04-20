---
title: "20 Parallel Subagents, 493 Tool Calls: Launching dentalad and Automating DEV.to in One Day"
project: "portfolio-site"
date: 2026-04-21
lang: en
pair: "2026-04-21-portfolio-site-ko"
tags: [claude-code, multi-agent, automation, devto]
description: "4 sessions, 493 tool calls. 20 parallel subagents produced 12 research reports, a DEV.to pipeline, and a new project repo—all in one day."
---

Four Claude Code sessions. 493 tool calls. The longest single session hit 182. By the end: a new GitHub repo, 12 dental advertising research reports, 9 auto-published DEV.to posts, a `launchd`-based publishing pipeline, and a responsive overhaul of spoonai.me.

**TL;DR** The dentalad project launched in under 24 hours using 20 parallel subagents. Simultaneously: a fully automated DEV.to pipeline went live, and spoonai.me article quality got a ground-up rewrite.

## One Telegram Message Started a 20-Agent Research Sprint

The whole thing started with a single message:

```
Start with ads — search all Korean companies in the hospital and dental
ad space that are currently profitable. Use 10+ subagents, process each
result, write it up as a report, push to git, and let me know.
```

Claude created `~/dentalad/`, wired it to a new private repo at `github.com/jee599/dentalad`, then fanned out 12 parallel research agents across distinct domains:

- **01** — Top domestic medical ad agencies  
- **02** — Naver SEO services  
- **03** — Power Content (Naver's native ad format)  
- **04** — SNS and performance marketing  
- **05** — Influencer and viral marketing  
- **06** — Korean Medical Advertising Act, 2026 amendments  
- **07** — Clinic CRM and booking SaaS  
- **08** — Content automation tools  
- **09** — Specialty-specific dental strategies (implants, orthodontics, etc.)  
- **10** — Global AI medical marketing  
- **11** — Deep dive on top 5 profitable agencies  
- **12** — Latest 2026 dental industry news  

Each report ran 2,500–4,500 words. The Naver Smart Place algorithm change history was in there. So was the criminal penalty threshold for Korean Medical Advertising Act violations.

## The Verification Pass Is Where It Gets Interesting

After the first 12 reports landed, I ran a second pass: "hire verification subagents."

Eight more agents deployed. The standout findings:

**A3 — Medical Ad Law Stress Test**: Analyzed whether CPA-based fee structures (pay-per-outcome) violate the Medical Advertising Act. Found 3 showstoppers. This alone would have taken a lawyer hours.

**A8 — MVP Architecture Costing**: Benchmarked actual Claude Sonnet 4.6 API pricing against the proposed service model. Real numbers, not estimates.

**A7 — Lead Prospect List**: Compiled a Top 50 potential dental clinic clients across 8 Seoul districts based on publicly accessible signals.

The output — `FINAL-REPORT.md`, `EXECUTIVE-SUMMARY.md`, `ACTION-ITEMS.md` — all landed in `~/dentalad/ads-research/`.

> Wide-net research agents surface coverage. Focused verification agents find the holes. You need both passes to trust the output.

## DEV.to Pipeline: One Hardcoded Line Was Breaking Everything

While writing the Hermes 4 series (4 posts), I found a pipeline bug that had been silently killing every publish attempt.

`~/dev_blog/.github/workflows/publish.yml:205`:

```yaml
# What it was doing
"published": False  # hardcoded — ignored frontmatter entirely

# What it should do
"published": should_publish  # read from frontmatter
```

Every post with `published: true` in frontmatter was going up as a draft. One line fix.

I also built `~/blog-factory/scripts/queue-publish.sh` and registered `~/Library/LaunchAgents/com.jidong.blog-queue.plist` to drain the queue every 6 hours.

End result: 9 posts auto-published across a 6-hour window.

- Hermes 4 series — 4 posts  
- contextzip promo — 1 post  
- spoonai.me intro — 1 post  
- Latest LLM news — 3 posts  

## Building Posts That Actually Convert

The Hermes 4 series wasn't just a translation job. The brief was "put every copywriting technique in." That meant:

- Hook title targeting frustration with GPT-4 alternatives
- Curiosity gap in the opening paragraph
- TL;DR up front (not buried)
- Internal series links on every post
- Closing CTA weaving in contextzip and spoonai.me organically

For the LLM news posts, the workflow was: one research agent generates `~/blog-factory/research/llm-news-2026-04-21.md`, then 5 parallel post-writing agents draft simultaneously. Topics covered: Claude Opus 4.7 SWE-bench analysis, Adobe CX Enterprise MCP integration, Deezer AI music at 44% of catalog, Stellantis-Microsoft AI, MIT Tech Review's top 10 AI list.

## spoonai.me: A Bug That Made Article Metadata Look Absurd

`ArticleCard.tsx:148` was rendering the full original article title next to the date. The `source.title` field had been getting set to the full headline instead of the publisher name.

```yaml
# Wrong
source:
  title: "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong"

# Correct
source:
  title: "CNBC"
```

The fix went in two places at once. Both `~/spoonai-site/SKILL.md` and `~/.claude/skills/spoonai-daily-briefing/SKILL.md` were updated with an explicit rule: publisher name only, no article titles. That covered future generation. For the existing 24 markdown files, a bulk replacement mapped `source.url` domains to publisher names.

Backfill ran in parallel — 5 subagents split by story type: `model_release`, `product_launch`, `partnership`, `paper`, `default_news`. Each story got Korean and English versions, minimum 2 images at 800px+ JPEG. ~30 stories backfilled.

Responsive layout improvements also shipped in this session: `HomeContent.tsx`, `ArticleCard.tsx`, and `globals.css` updated to widen the layout on desktop and adapt properly on mobile.

## Vercel CANCELED and 83 Uncommitted Changes

After pushing commit `703f6fc`, the Vercel deploy sat at `CANCELED`. Root cause: Vercel cancels in-flight deploys when a newer one triggers on the same project at nearly the same time. Fixed with an empty commit to force a clean re-trigger.

The harder problem was 83 uncommitted changes from multiple overlapping work streams. The diff included:

- `HomeContent.tsx` +523 lines  
- `ArticleCard.tsx` — 293-line rewrite  
- `globals.css` +257 lines  
- Header, Footer, Logo, About, Archive redesigns  
- `ThemeProvider.tsx` deleted  

My changes and prior session changes were mixed together. I selectively committed the 26 files I'd touched and left the other 57 untouched.

## GeekNews: One Insight Worth Keeping

GeekNews is sensitive to repeated self-promotion from the same author. "First 50 users free" is a one-shot card — use it once, don't repeat it. After that, the only way to justify another post is a technical writeup or experience report format. If it's not genuinely useful to readers, it won't fly.

## Tool Usage Breakdown (4 Sessions Combined)

| Tool | Calls |
|---|---|
| Bash | 211 |
| Read | 46 |
| Agent (subagents) | 40 |
| Telegram reply | 34 |
| Edit | 30 |
| TaskUpdate | 23 |
| WebSearch | 22 |
| WebFetch | 16 |
| **Total** | **493** |

Agent: 40 calls = 12 first-pass research + 8 verification + 5 DEV.to posts + 5 article backfill + misc.

The low Edit/Write count relative to output is the point. Repetitive, parallelizable work went to agents. Direct session work was limited to coordination, review, and anything requiring conversation context.

> The same scope handled sequentially in a single context window would have been impossible in one day. Parallel agents aren't just faster — they make a different class of work achievable.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
