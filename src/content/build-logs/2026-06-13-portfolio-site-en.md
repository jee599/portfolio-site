---
title: "13 Sessions, 1,492 Tool Calls: How I Shipped 4 Sites in 2 Days with Claude Code"
project: "portfolio-site"
date: 2026-06-13
lang: en
pair: "2026-06-13-portfolio-site-ko"
tags: [claude-code, multi-agent, open-design, ai-automation, build-log]
description: "13 Claude Code sessions, 1,492 tool calls, 4 simultaneous projects shipped in 48 hours — a detailed breakdown of multi-agent orchestration at its limits."
---

1,492 tool calls across 13 sessions in two days. One of those sessions alone hit 532 calls and ran for 27 hours and 48 minutes. That's not a typo — it's what shipping four simultaneous projects in parallel looks like when you push Claude Code's orchestration to its edge.

The four projects: a photography portfolio site rebuild, a Korean astrology service with a full UI overhaul and 7-locale translation, a coffee chat / mentorship platform with admin and payments, and a dental clinic briefing deck. All of it landed inside the same 48-hour window.

**TL;DR**

One developer, four projects, two days. Multi-agent orchestration and a hard-gated design system made it possible. Hit the session limit 4 times, had a concurrent session file collision, and generated 40+ files. The biggest lesson: shared state between parallel agents must live in files, not context.

---

## When a Session Hits 532 Tool Calls, Structure Isn't Optional

Most Claude Code sessions I run stay under 100 tool calls. A focused feature or a bug fix, maybe a refactor — the context window is comfortable, the agent stays coherent, and you get a clean result.

Session 11 was different. 532 tool calls. 27 hours and 48 minutes of continuous work. That session handled the Korean astrology service: landing page redesign, a loading screen casting sequence, a paywall page, a report page, and 7-locale translation — all running as 5 parallel agents simultaneously.

At that scale, you can't hold the structure in your head. You can't hold it in a single context window either. The only thing that keeps parallel agents coherent is the file system. Each agent got a scoped task and explicit file paths in its prompt. Shared state — payment platform status, design tokens, locale strings — lived in markdown files that every agent could read independently.

The `/effort ultracode` flag activates dynamic workflow mode, which is what enabled 5 agents to fan out concurrently. Without it, the work would have been sequential and taken three times as long. With it, the coordination overhead shifts from "Claude managing everything in one context" to "you managing a file-based contract between agents."

Session 10, which ran 356 tool calls, handled the photography site. Session structure across the full two days:

| Session | Tool Calls | Primary Work |
|---------|-----------|--------------|
| 1 | 175 | Dental clinic deck (first pass) |
| 6 | 216 | daymoon photo site (10h) |
| 7 | 82 | Dental clinic deck (revisions) |
| 10 | 356 | daymoon continued |
| 11 | 532 | Korean astrology full overhaul |
| Others | ~131 total | Coffee chat platform |

Thirteen sessions, 1,492+ total tool calls. The session limit appeared 4 times.

---

## daymoon: 293 Photos, One Admin System, and a File Collision

The daymoon photography portfolio had 293 existing photos across categories. The first decision was purely curatorial: which design direction fits the work?

The Open Design discovery process surfaced five directions. The photographer chose "White Curation" — full-bleed imagery, minimal chrome, generous whitespace. That decision locked the design system before a single line of code was written.

The site's core pieces:

- Full-width hero slideshow with 12 featured works, CSS cross-fade transitions
- Dynamic gallery grid with category filtering
- Admin panel with 3 tabs: photo upload, booking inbox, season settings
- Vercel Blob storage for direct 50MB original uploads

The Vercel Blob integration is worth calling out. Storing originals at full resolution matters for a photography portfolio — you don't want to compress before you've decided on output formats. The admin upload flow pipes directly to Blob, which means the photographer can manage everything from the browser without touching a deployment.

Session 6 ran for 10 hours and 216 tool calls. Somewhere in the middle of that, I opened a second session to handle a parallel task. This produced the only file collision of the project:

```
Error: Concurrent session conflict — session B overwrote OK files written by session A
```

The failure mode is straightforward: two sessions targeting overlapping file paths with no locking mechanism. The fix is equally straightforward — worktrees, or explicit path partitioning, or simply not opening parallel sessions on the same repo without a plan. I went with explicit path partitioning for the rest of the run.

The admin panel ended up being more complex than the public-facing site. Three distinct user flows — upload with metadata tagging, booking request management with status transitions, and seasonal availability configuration — each needed their own state management. Keeping those tabs isolated as separate React components made the complexity manageable.

---

## The Korean Astrology Problem: Payment Platforms and a Natural Experiment

The Korean astrology service wasn't a greenfield project — it had an existing UI that needed a full overhaul and a global launch. Two things made this session the hardest of the two days.

First: payment platform rejection. Fortune-telling and astrology services get flagged by most payment processors as high-risk categories. Getting approved isn't just a form submission; the category itself triggers manual review. This wasn't a technical problem, but it was a blocking problem that shaped the product decisions throughout the session.

Second, and more interesting: there's an Etsy natural experiment sitting in the data. A shop presenting as "AI Reading" — explicit about being AI-generated — ran for one month and did 0 sales. A shop using a human persona for the same service ran for one year and did 464 sales. Same product category, same platform, dramatically different outcomes.

This data point changed the positioning. The UI wasn't just a visual refresh; it was a reframe of how the service presents itself.

The design direction landed on "Midnight Almanac": deep ink indigo backgrounds, gold hairline accents, Fraunces serif for display text. The goal was to read as an artisanal, human-crafted product rather than a software service. This is a deliberate departure from the clean SaaS aesthetic that most AI tools default to.

Technical pieces from this session:

- `three.js` star drift background — a slow cosmic particle field that loads before any UI interaction
- GPT-image-2 running in the background generating contextual imagery while the UI code was being built in parallel
- 7-locale translation (English, Korean, Japanese, Chinese Simplified, Chinese Traditional, Spanish, Vietnamese) scaffolded via parallel agents

The `three.js` background came with a lesson. The first implementation included a rotating saju (four pillars / Ba Zi) chart visualization with SVG shape animations. The feedback from the client was direct: "The spinning chart looks cheap." Removed. The lesson — motion for motion's sake reads as filler. A slow particle drift establishes atmosphere without demanding attention.

The session hit the limit twice. Both times, the recovery pattern was the same: dump current state to a memory file before the session closes.

```markdown
# project_saju_paypal.md

## Current Status
- PayPal application: under review (submitted 2026-06-12)
- Stripe: rejected (reason: category)
- Fallback: Paddle (supports digital goods, fewer category restrictions)

## Completed
- Landing page: /src/pages/landing.astro
- Paywall: /src/pages/paywall.astro
- Report template: /src/components/ReportPage.tsx
- Translations: /src/i18n/ (7 locales)

## Pending
- Payment provider integration
- Mobile viewport fixes on report page
```

When the session limit hits and you start a new session, this file is the first thing you load. Claude reads it, reconstructs context, and continues without you having to re-explain the state of the project. It's a manual checkpoint system, but it works.

---

## Dental Clinic Briefing: Translating Jargon into Numbers That Land

The dental clinic project was the most communication-focused work of the two days. The deliverable was a presentation deck for a clinic director — explaining digital marketing performance and strategy. Not a technical audience.

The first pass was 20 slides. The feedback after review: "I can follow the slides, but I'm not sure I understand what I'm looking at."

That's a specific kind of failure. The content was accurate; the translation layer was missing. AEO (Answer Engine Optimization) and CPC (Cost Per Click) are terms that make sense to someone running ad campaigns. They don't mean anything to someone running a dental practice.

The second pass went to 13 slides, with two rules:

1. Every metric gets translated into a plain-language equivalent. CPC doesn't appear on a slide without "approximately ₩37,000 per click" next to it.
2. No more than half the data points per slide that were in the first version.

The reduction from 20 to 13 slides wasn't about removing content — it was about removing the assumption that the reader shares the context needed to interpret the content. The clinic director needed to walk out of the meeting able to explain the numbers to someone else. That's a different bar than "understanding it when it's explained."

Session 1 ran 175 tool calls on the first pass. Session 7 ran 82 on revisions. The revision session was faster because the problem was well-scoped by then: it wasn't a layout problem or a content problem, it was a translation problem.

---

## The Open Design Hard Gate

Every HTML deliverable in this project was blocked by a shell hook until explicitly marked as an Open Design pass. This is a hard gate, not a soft reminder.

```bash
# hooks/design-gate.sh
# Blocks writes to .html/.htm files unless session is OD-flagged

if [[ "$FILE" =~ \.(html|htm)$ ]]; then
  if [[ ! -f ".claude/design-pass.flag" ]]; then
    echo "ERROR: HTML output requires an Open Design pass."
    echo "Run hooks/design-pass.sh to mark this session."
    exit 1
  fi
fi
```

The gate lives in `CLAUDE.md` as a hard policy: any HTML artifact must go through the Open Design skill. `hooks/design-gate.sh` enforces it at the file-write level. `hooks/design-pass.sh` marks the session as an OD pass, which unlocks writes.

The reason this exists: raw Claude Code HTML output is inconsistent. Given a design brief, Claude will produce something functional and sometimes decent. But "decent" varies enormously based on how the prompt was framed, what examples were in context, and how much design vocabulary was in the conversation. The Open Design process front-loads the design decisions — direction, design system, typography tokens, spacing — before any code is written. The code that comes out the other end is constrained by those decisions.

Without the gate, the default path is "write some HTML, see how it looks, iterate." With the gate, the default path is "make the design decisions first, then write HTML that implements them." The output quality difference is significant, and the gate makes it non-optional.

This matters particularly when running parallel agents. If 5 agents are producing UI simultaneously, you can't review each one's aesthetic decisions in real time. The design system established in the OD pass acts as the shared contract between agents, even though they don't share context.

---

## Three Things Ultracode Taught Me

**1. Parallel agents don't share context — shared state is a file contract**

This sounds obvious, but the implication isn't. When you run 5 agents simultaneously, each one starts with only what you explicitly give it. Any state that needs to be shared — design tokens, API response formats, component naming conventions, the fact that you already implemented the auth flow in session 8 — has to be in a file that you pass as input to each agent's prompt.

The practical pattern: before launching a multi-agent workflow, write a `context.md` that contains everything each agent needs to know about the state of the project. Then reference it explicitly in each agent's initial prompt. It's overhead, but it's the only reliable way to keep agents coherent with each other.

**2. The session limit is time-correlated, not just call-correlated**

The four times I hit the session limit, the pattern wasn't "too many tool calls." It was "session running for too long." A 532-call session that runs for 27+ hours is more likely to hit limits than a 532-call session that runs for 4 hours.

The implication for long-running work: commit checkpoints aggressively. Every time the work reaches a coherent state — a feature complete, a component working, a page deployed — make a commit and note the state in the memory file. If the session ends, the checkpoint is the recovery point.

```bash
git commit -m "chore: checkpoint — landing + paywall complete, payment integration pending"
```

It's a low-overhead habit that pays off exactly when you least want to spend time on recovery.

**3. "Continue" is a powerful prompt — but state management is still your job**

When a session hits its limit and you start fresh, the phrase "continue from [memory file]" is surprisingly effective at restoring Claude's working context. Claude reads the file, reconstructs the task list, and picks up close to where the previous session left off.

But "close to" isn't "exactly." The reconstructed context is a summary, not a replay. Anything that was in working memory but not in the file is gone. This is why the memory file discipline matters — not as a nice-to-have, but as the primary mechanism for session continuity.

The corollary: anything you'd be upset to lose when the session ends should be in a file before the session ends.

---

## Two Days, By the Numbers

| Metric | Value |
|--------|-------|
| Total sessions | 13 |
| Total tool calls | 1,492+ |
| Longest session | Session 11 — 532 calls, 27h 48m |
| Parallel agents (peak) | 5 |
| Session limit hits | 4 |
| Photos reviewed | 293 |
| Files generated | 40+ |
| Slides: first pass → final | 20 → 13 |
| Locales translated | 7 |
| Sites deployed | daymoon (Vercel), Korean astrology (Vercel) |
| Etsy natural experiment | 0 sales (AI-labeled) vs 464 sales (human persona) |

The throughput is real, but so is the overhead. Multi-agent orchestration at this scale requires active management: file contracts, checkpoint commits, explicit memory files, and a design system that constrains output before agents start generating. None of that is automatic. The tools enable the speed; the structure enables the tools.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
