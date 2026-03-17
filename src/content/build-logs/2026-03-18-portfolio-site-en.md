---
title: "813 Tool Calls, 4 Projects, 3 Days: Running a Solo Dev Shop with Claude Code"
project: "portfolio-site"
date: 2026-03-18
lang: en
pair: "2026-03-18-portfolio-site-ko"
tags: [claude-code, monorepo, automation, multi-project]
description: "One SPEC.md, an empty repo, 370 tool calls — a full monorepo. Three days, four projects, 813 total tool calls. Here's what the raw data reveals."
---

813 tool calls. Four projects. Three days.

I didn't plan it that way. It just happened — an empty repo needed scaffolding, a portfolio needed restructuring, a client site needed content updates, and a payment processor wanted compliance fixes. All at once.

**TL;DR** — I fed a SPEC.md into an empty repo and got back a full Next.js monorepo after 370 tool calls. Across four sessions over three days, Claude Code touched four separate codebases. Here's what the breakdown actually reveals.

## One SPEC.md, One Empty Repo, 370 Tool Calls

The repo was `git@github.com:jee599/llmmixer_claude.git`. Zero commits. No scaffold, no README, nothing.

The starting prompt for Session 1 was embarrassingly simple:

```
/Users/jidong/Downloads/SPEC.md implement this.
First create a detailed implementation plan as a markdown file.
```

Claude didn't start writing code. It made `IMPLEMENTATION_PLAN.md` first — Phase 0 through 3, each phase clearly scoped. Phase 0 was project init. Phase 1 was CLI + dashboard server + Claude adapter. Phase 2 was LLM Decomposer + Router + WorkflowEngine. Phase 3 was Codex/Gemini adapters.

Then I gave one more instruction: implement each phase, self-review, make up to three revisions, then move to the next phase. The idea was to get Claude to run its own feedback loop before moving forward.

By the time Session 1 ended:

- 93 new files created
- `packages/core/` and `packages/dashboard/` both scaffolded
- `bin/` and `config/templates/` in place
- Tool call breakdown: Write ×93, Bash ×151, Read ×66, Edit ×52

One snag: the `workspace:*` protocol in `package.json`. npm doesn't support it — that's a pnpm/yarn convention. Build broke. Claude caught it, updated the manifest, continued.

The more interesting moment was the Phase 0 self-review. Without any prompt asking for it, Claude flagged three issues on its own: an `outputFileTracingRoot` warning in the Next.js config, unhandled dev server process cleanup on exit, and a `tsconfig.json` module compatibility mismatch. Nobody pointed these out. It found them during its own review pass.

That's what the "self-review loop" instruction actually buys. Not perfect code — but a second pass that catches the obvious things before they become your problem.

## Two Bugs That Reshaped the Architecture

Midway through Session 1, two errors surfaced back-to-back.

First: SSR hydration mismatch.

```
tree hydrated but some attributes of the server rendered HTML
didn't match the client properties
```

The usual suspects: date formatting that differs between server and client, `Math.random()` calls during render, code that assumes `window` exists on the server. I pasted the full error stack. Claude traced it to the specific component, added the `typeof window !== 'undefined'` guard. Resolved.

Second: Gemini CLI auth failure.

```
Please set an Auth method in your settings.json
```

This one changed the project's direction entirely. The original architecture planned direct Gemini API calls. But I use a Claude Code subscription — I didn't want to pay per-token for API calls when I already have CLI access.

```
I'm using the CLI subscription model, not direct API calls
```

Claude rewrote the adapter to spawn the Claude Code CLI as a subprocess instead. Because the adapter layer was cleanly separated from the start, only `adapters/claude.ts` needed to change. The router, the workflow engine, the dashboard — untouched.

This is what a clean architecture actually buys: when requirements shift, the blast radius stays contained.

## Portfolio Hub: Working Inside a 58KB File

Session 2 started differently. Instead of dropping a SPEC and letting Claude infer the goal, I pasted the implementation plan directly into the prompt:

```
Implement the following plan:

# jidonglab portfolio hub renewal

Convert jidonglab.com from an AI news/blog site
to a project portfolio hub.
```

This cuts the planning overhead entirely. Claude spends zero cycles figuring out what you want.

The main challenge: `admin.astro` was 58KB. A single file handling auth, content management, and all admin UI. Claude read the whole thing, built a model of the existing structure, then added Projects and Build Logs tabs — without breaking what was already there.

The data architecture:

- `scripts/project-registry.yaml` manages local git paths
- `src/content/projects/` holds per-project YAML
- A `visible` field controls public vs. private display

No database, no API. Just YAML and the filesystem.

Session 2 tool call distribution: Bash ×213, Edit ×44, Read ×41, Write ×19.

Bash being the dominant tool is counterintuitive until you look at what those calls are — checking if a file exists, verifying `npm install` output, running `git status`. Short, cheap commands that stack up. The actual code production (Edit + Write) adds up to less than half of Bash.

One error worth noting: `admin-projects.ts` was hitting GitHub API 403s. The root cause was architectural — it was calling the GitHub API to update data that lives in local YAML files. Wrong tool entirely. Claude removed the GitHub API calls, switched to direct filesystem access. The 403s went away. So did any rate limit concerns.

## The Korean Content Problem on DEV.to

Later in Session 2, I asked Claude to handle the Korean posts on DEV.to:

```
Take down all Korean-language posts on DEV.to.
Then check if the English posts are optimized for search visibility,
hooks, and traffic.
```

DEV.to's audience is English-speaking developers. Korean posts get minimal organic reach — the platform's discovery and tagging systems are built around English content.

Claude used the DEV.to API to bulk-set `published: false` on Korean articles, then reviewed existing English post titles and tags from an SEO angle.

The pattern Claude identified: titles with numbers and concrete outcomes pull more clicks than generic topic titles. "I automated my build logs using Claude Code's JSONL files — here's how" outperforms "Claude Code build log automation." The result is in the headline. The specificity creates the curiosity.

## 17 Minutes and 9 Minutes

Sessions 3 and 4 were client work — interesting precisely because of how fast they were.

**Session 3: 17 minutes, 73 tool calls.** Dental clinic website.

Three doctors with updated schedules. A surgical specialist credential to highlight in the implant section. Pediatric dentistry to remove. A new TMJ treatment section to add. Changes landed across `site-data.ts`, a reworked `doctors/page.tsx`, and a new `services/page.tsx`.

The session was fast because content was centralized in `site-data.ts`. Making changes didn't require hunting through component files — there was one place to touch.

**Session 4: 9 minutes, 39 tool calls.** Payment processor compliance.

TossPayments flagged the saju app during contract review:

```
1. Please list at least one purchasable product or service.
2. Please include business registration information in the footer.
```

I pasted the compliance email directly into the prompt. Verbatim. Not a summary — the original text.

The actual code problem turned out to be CSS. `.constellationPage` had `overflow: hidden; height: 100vh` set, which pushed the business registration footer outside the viewport. Nobody could see it — including the compliance reviewers.

Once the CSS was fixed, Claude also surfaced the pricing section. The i18n files already had `pricing` keys for all 8 locales. They'd been sitting there, unused. One CSS fix and they appeared.

## Skills and the Selection Problem

Between sessions, I explored the Claude Code skills ecosystem — installed superpowers, engineering-skills, product-skills, marketing-skills.

What I've actually used so far: superpowers' brainstorming and writing-plans workflows.

What I noticed: having more skills doesn't automatically make you faster. It adds a decision cost. Before each session, there's now a question: which skill applies here? For clear-cut tasks, that overhead isn't worth it. Skills earn their keep when the task type is genuinely ambiguous — when you want a structured workflow enforced before writing a single line.

The tooling is powerful. The judgment about when to reach for which tool is still yours.

## What 813 Tool Calls Actually Mean

Full breakdown across four sessions:

| Tool  | Count |
|-------|-------|
| Bash  | 395   |
| Read  | 137   |
| Write | 116   |
| Edit  | 116   |
| Grep  | 15    |
| Agent | 14    |

Files created: 77. Files modified: 40.

Two patterns were consistently effective.

**Plan first.** Session 2's approach — pasting the implementation plan directly into the prompt — eliminated the setup phase. The time Claude would spend inferring the goal went to zero. This matters most for larger tasks where scope can quietly drift.

**Paste the raw error or requirement.** Sessions 3 and 4 fed in compliance email text and error stacks verbatim. The specificity of real errors beats vague descriptions every time. "Why isn't this working?" is slower than the actual stack trace.

What didn't work: vague success criteria. Late in Session 1, I asked Claude to "fix everything and make all features work as intended." Vague goal, more revision cycles. The more precisely you define done, the faster you get there.

> A better prompt isn't for Claude's benefit. It's for yours.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
