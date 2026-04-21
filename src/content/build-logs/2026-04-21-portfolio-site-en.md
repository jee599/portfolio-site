---
title: "12 Parallel Claude Code Agents, 35,000 Words of Research in 3 Hours — Plus Two Pipeline Bugs"
project: "portfolio-site"
date: 2026-04-21
lang: en
pair: "2026-04-21-portfolio-site-ko"
tags: [claude-code, subagent, automation, dentalad, devto, spoonai]
description: "12 parallel Claude Code agents completed 35,000 chars of dental ad research in 3 hours. Also: a hardcoded published:False bug silently drafting every post, and a source.title display bug fixed."
---

12 Claude Code sub-agents running in parallel produced 35,000 characters of competitive market research in 3 hours. The same work done sequentially in a single context window would have taken a full day — probably more.

**TL;DR** Kicked off the `dentalad` project with 12 parallel sub-agents for domain research. Along the way, discovered a hardcoded `published: False` in `dev_blog/publish.yml` that had been silently draft-saving every post, and fixed a `source.title` display bug on spoonai.me that was rendering full article headlines next to the publication date. Four sessions, 493 tool calls total.

## One Telegram Message That Became a 12-Agent Research Session

The original request:

> "Research all profitable Korean companies currently running hospital and dental advertising... use 10+ sub-agents, have each process its findings, write it up as a report, and commit it to git"

The key insight here is domain decomposition. A single agent doing all of this would be bottlenecked at the context window and produce shallow coverage. Splitting by domain lets each agent go deep without competing for attention.

Dispatched 12 agents simultaneously, each owning a distinct slice:

- `01` Top domestic medical ad agency landscape
- `02` Naver SEO service market overview
- `03` Naver Search Ads & Power Content agency ecosystem
- `04` SNS performance marketing players
- `05` Influencer & viral marketing channels
- `06` Korean Medical Advertising Act — 2026 update
- `07` Hospital CRM & booking SaaS market
- `08` AI content generation tooling
- `09` Specialty strategies by procedure (implants, orthodontics, cosmetic)
- `10` Global AI medical marketing benchmarks
- `11` Deep-dive: top 5 profitable companies
- `12` 2026 dental industry news and trends

Each report came in at 2,500–4,500 words. All committed to `~/dentalad/ads-research/`. Wall-clock time to completion: 3 hours.

The next day, "verify and supplement" came in. Ran 8 more agents for a V2 pass — fact-checking, legal stress testing, MVP architecture costing. The critical finding from `A3-legal-stress-test.md`: CPA and performance-based billing models carry real Korean Medical Advertising Act violation risk. That's a showstopper that has to surface before finalizing any business model, not after.

> Wide-sweep agents gather breadth. Verification agents drill narrow. Running both passes is what makes the output trustworthy enough to act on.

## `published: False` — Every Post Was a Draft and Nobody Knew

The bug only surfaced because of a "publish these immediately" request for four Hermes 4 series posts. While building a 6-hour `launchd` publish queue, actually checking whether posts went live revealed the problem.

`dev_blog/.github/workflows/publish.yml:205`:

```yaml
"published": False
```

Hardcoded. Every post going through this pipeline was landing on DEV.to as a draft — regardless of what `published: true` said in frontmatter. Posts that were supposed to be live had been sitting in draft state the whole time.

The fix was a single line. `should_publish` was already being computed from frontmatter values further up in the workflow. The reference just wasn't being used at the API call site:

```python
# Before
payload = {
    "article": {
        "published": False,  # hardcoded, ignored frontmatter
    }
}

# After
payload = {
    "article": {
        "published": should_publish,  # read from frontmatter
    }
}
```

This is the category of bug that never shows up in code review because it's not obviously wrong — `False` looks intentional, like a safety default. It only becomes visible when you're watching what actually ships.

After the fix, set up `~/Library/LaunchAgents/com.jidong.blog-queue.plist` and `~/blog-factory/scripts/queue-publish.sh` to auto-publish on a 6-hour stagger: four Hermes 4 posts, a contextzip promo, a spoonai.me intro, and five LLM news pieces.

## The Article Title Was Leaking Into the Date Field

User feedback from spoonai.me:

> "Why is 'Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong' showing up next to the date?"

`components/ArticleCard.tsx:148` was rendering `post.source.title` next to the publication date. The component was working correctly — the data was wrong. `source.title` had the full article headline in it instead of the publisher name.

Before:
```yaml
source:
  title: "Chip giant ASML raises 2026 guidance as AI semiconductor demand stays strong"
  url: "https://cnbc.com/..."
```

After:
```yaml
source:
  title: "CNBC"
  url: "https://cnbc.com/..."
```

Fixed in two directions simultaneously. Both `~/spoonai-site/SKILL.md` and `~/.claude/skills/spoonai-daily-briefing/SKILL.md` were updated with an explicit rule: publisher name only, no article titles. That covers future generation. For the existing 24 markdown files, a bulk replacement mapped `source.url` domains to publisher names.

After pushing commit `703f6fc`, the Vercel deployment sat in `CANCELED` state. Root cause: Vercel cancels in-flight deploys when a newer deploy triggers on the same project in the same time window. Fixed with an empty commit to retrigger. Worth knowing before assuming a deploy failed for a code reason.

## "Just Clean Everything" — 83 Files, One Question

Midway through a session: "just clean everything up."

Two valid interpretations:

**A.** Delete the 22 `.claude/worktrees/*` temp directories — leftover worktree copies from previous sessions. Original files untouched. Safe.

**B.** `git reset --hard && git clean -fd` — wipe 83 uncommitted files, including `HomeContent.tsx` (+523 lines), `ArticleCard.tsx` (293 lines rewritten), `globals.css` (+257 lines). A full UI redesign, gone permanently.

Asked. Got back: "1." Went with A.

One clarifying question preserved a +1,700-line UI redesign that would have been unrecoverable. The cost of asking is near zero. The cost of silently picking the wrong interpretation is a full day of work. For irreversible operations with high blast radius, confirm scope before acting — even when the request sounds casual.

## Tool Usage Breakdown (4 Sessions, 493 Tool Calls)

| Tool | Count | Primary use |
|---|---|---|
| Bash | 211 | File execution, git, deploy triggers |
| Read | 46 | Understanding existing structure |
| Agent | 40 | Research, post writing, backfill |
| Telegram reply | 34 | Receiving and responding to requests |
| Edit | 30 | Targeted file modifications |

Agent count of 40 breaks down as: 12 first-pass research + 8 V2 verification + 5 post drafting + 5 article backfill + other. Anything with a repeating structure gets delegated. That's why the direct Edit/Write ratio is low — the high-volume repetitive work never reaches the top-level session.

The pattern: use the main session for decision-making, coordination, and one-off edits. Use agents for any task with a template you can define upfront.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
