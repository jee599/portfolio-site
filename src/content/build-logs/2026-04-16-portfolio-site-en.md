---
title: "4 Sessions, 280 Tool Calls: Using Claude Code Beyond Coding"
project: "portfolio-site"
date: 2026-04-16
lang: en
pair: "2026-04-16-portfolio-site-ko"
tags: [claude-code, subagent, seo, toss-payments, workflow]
description: "280 tool calls across 4 sessions: payment contract review, 288 SEO pages generated, and an image bug that wasn't a bug."
---

280 tool calls. 4 sessions. Bash 159 times, Read 42, Agent 19. And none of it was what most people think Claude Code is for.

This week: draft a payment processor contract review reply, auto-generate 288 SEO landing pages, debug a UI issue that turned out to be a missing type field from the start. One session ended in 7 tool calls because the environment wasn't set up right. Claude Code is only as useful as the context you give it — and the permissions you grant.

**TL;DR** Claude Code handles business admin work, not just code. Subagents keep the main context clean. Missing system permissions kill sessions faster than bad prompts.

## Claude Drafted the Toss Payments Contract Reply

Session 1 wasn't a coding session. Toss Payments (Korea's Stripe equivalent) sent a contract review email asking for business info, refund policy, and product pricing. The prompt was minimal:

```
커피챗 프로젝트 접근해줘
```

Then I pasted the email. Claude read `/Users/jidong/projects/coffeechat/`, identified the stack (Next.js 16 + Supabase + Toss Payments), price structure, and where the refund policy lived. Draft reply ready in minutes.

It didn't stop there. When it found the business registration number field blank in `site-config.ts`, it added a conditional render to hide the number until it's filled — without me asking. Then it updated `Footer.tsx` to include a business address and phone number formatted to card issuer audit standards.

I never said "fix the footer." Claude read the context, identified what a payment processor would flag, and moved first.

Bash 42, Read 16, Edit 5. 27 minutes.

## Without Browser Permissions, Claude Is Flying Blind

Session 2 was a dead end. I asked Claude to review the spoonai mobile design, but it didn't have macOS Accessibility or Screen Recording permissions. The `computer-use` tool was available, but system permissions weren't granted.

```
computer use 열려있는데? chrome mcp는 왜 없어?
```

Chrome MCP wasn't installed in this session. `WebFetch` converts HTML to Markdown — it doesn't capture real layout. When `computer-use` can't see the screen, the only options are: grant the permissions in System Settings, or manually screenshot and paste.

7 tool calls. Session over.

The lesson: Claude's capability ceiling is defined by your environment setup. A smart model running blind is still blind.

## 288 SEO Pages, Distributed Across Subagents

Session 3 was the week's main work. The goal: implement 288 zodiac compatibility SEO landing pages for `saju_global`. Bash 111, Read 20, Agent 17, TaskCreate 7, TaskUpdate 14. 182 total tool calls.

Started with planning. The `writing-plans` skill ran against the spec file at `docs/superpowers/specs/2026-04-09-seo-compatibility-pages-design.md` and produced a structured implementation plan saved to `docs/superpowers/plans/2026-04-10-seo-compatibility-pages.md`.

Then `subagent-driven-development` kicked in. Each independent task dispatched to its own subagent. After each task: spec compliance review → code quality review. Two-pass verification, every time.

Content generation ran in the background:

```
nohup npx tsx scripts/generate-compat-content.ts > /tmp/compat-gen.log 2>&1 &
```

While the background task ran, the main thread kept working on other things. When I asked "how's it going?", Claude read the log file and reported progress. Final output landed in `apps/web/data/zodiac-compat-content.json`.

The subagent pattern's core value: main context stays clean. File exploration, implementation, and verification each run in isolated agents. The main thread only sees summaries — not 300 lines of grep output.

## The Archive Images Were Never There

Session 4. Images weren't showing in the spoonai archive. Looked like a rendering bug. It wasn't.

Read and Grep into the codebase: `ArchiveEntry` in `lib/types.ts` had no `image` field. The `getArchiveEntries()` function was explicitly dropping `meta.image` and only passing through `date`, `title`, and `summary`. `ArchiveList.tsx` rendered text-only cards — no thumbnail slot at all.

It wasn't "images not showing." The code was never built to show them.

Bash 6, Read 6, WebFetch 2, Grep 1. 1 hour 39 minutes to fully understand the situation.

## Week Summary

| Session | Work | Tool calls | Time |
|---------|------|-----------|------|
| 1 | Payment contract reply + footer fix | 73 | 27 min |
| 2 | Mobile design review attempt | 7 | — |
| 3 | 288 SEO pages: plan + generate | 182 | 105h cumulative |
| 4 | Archive image issue diagnosis | 16 | 1h 39min |

Using Claude Code only for coding leaves half its value on the table. Business context, contract replies, batch content generation — it handles all of it if you give it the right context and the right access.

Subagents are non-negotiable for large tasks. Split the work, receive only results. That's how you ship quality without burning context tokens on noise.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
