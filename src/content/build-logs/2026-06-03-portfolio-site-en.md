---
title: "Git Worktree + Claude Code: Full Site Redesign Without Touching Production"
project: "portfolio-site"
date: 2026-06-03
lang: en
pair: "2026-06-03-portfolio-site-ko"
tags: [claude-code, astro, redesign, worktree, codex-review]
description: "How I redesigned my homepage from dev log to client portfolio using Git worktree isolation and Claude Code — 18 sessions, 500+ tool calls."
---

18 sessions. 500+ tool calls. The page you're reading this from is the result.

**TL;DR** — I created an isolated branch in a separate Git worktree, rebuilt the entire homepage with Claude Code, ran a Codex blocker-only cross-review that caught a hardcoded URL mismatch, and shipped. Zero production breakage throughout.

## The Problem with a Site Built for Yourself

The original `jidonglab.com` homepage was built for me. A growing archive of build logs, a flat project list, timestamps and tags everywhere. Good for tracking my own work. Bad for someone who landed there without context.

The core issue: a visitor had about 30 seconds to decide whether to keep reading. The old structure required them to work through several layers — what is this site, who is this person, what do they actually build — before getting an answer. There was no clear statement: *this is what I ship, this is how I work, here's how to reach me.*

The redesign goal was precise:
- Make the site work as a portfolio and business card for potential clients and collaborators
- Keep the Astro/React/Tailwind stack unchanged
- Keep KO/EN bilingual support intact
- Keep existing project data and content collection routes
- Don't break anything currently working

The constraint list was as important as the goal. "Don't break bilingual support" and "keep content routes intact" eliminated a whole class of risky approaches upfront, before any code was written.

## The Worktree Decision

Before touching any code, I set up a Git worktree.

```bash
git worktree add ../portfolio-site-claude-redesign claude/jidonglab-redesign-compare
```

This creates `portfolio-site-claude-redesign/` as a completely separate directory on disk. It shares the `.git` object store with the original repo but has its own working tree, its own `HEAD`, and its own unstaged changes. Production `main` kept running exactly as before throughout the entire redesign.

The practical benefits were concrete:

**Immediate rollback.** If the redesign produced something worse, reverting was one command in the original directory. No stash juggling, no branch surgery.

**Clean diffs.** Comparing against `main` was a single `git diff main` with no risk of accidentally including unrelated changes.

**No contamination.** A broken build in the worktree stayed in the worktree. It couldn't affect `main` deploys on Cloudflare Pages.

For any significant redesign, starting with worktree isolation is the right call. The setup takes 30 seconds. The safety it provides is worth far more.

## What 17 Sessions of "Not Implementing" Looks Like

The timeline: 18 total sessions, 1 session block of actual homepage changes.

Sessions 1–11 covered:
- Full audit of existing component structure across `src/components/home/`
- Mapping dependencies between components to identify safe modification surfaces
- Analysis of which files could be extended vs. which needed full rewrites
- Information architecture: what should a visitor understand in 30 seconds, where does the CTA live, what's the right visual hierarchy
- Reference research: how other engineering portfolio sites handle the personal/professional tension
- Constraint verification: confirming bilingual `data-ko`/`data-en` attributes and `localStorage` lang state worked as assumed

None of this shows in the git diff. But it's the reason the implementation session was 112 tool calls instead of 400.

The pattern holds consistently in Claude Code-driven development: the quality of an implementation session scales directly with the preparation done before it. The tool doesn't replace thinking — it runs faster when the thinking is already complete.

## Session 12/13: The Implementation Block

Core implementation happened in one focused working block. The breakdown:

| Tool | Calls |
|------|-------|
| Edit | 33 |
| Bash | 31 |
| Read | 29 |
| Other | 19 |
| **Total** | **112** |

**Files modified:**

```
src/components/home/Hero.tsx           — full rewrite
src/components/home/About.astro
src/components/home/Capabilities.astro
src/components/home/Footer.astro
src/components/home/ShipLog.astro
src/components/home/Topbar.astro
src/components/home/Projects.tsx
src/data/home.ts                       — data layer
src/pages/index.astro
src/styles/home.css
```

**Files created:**

```
src/components/home/Contact.astro      — contact/CTA section
src/components/home/Method.astro       — how I work section
```

The new-file decision was deliberate. Modifying existing components means touching files with established behavior and shared styling. Adding `Contact.astro` and `Method.astro` as net-new files meant those sections couldn't accidentally break existing ones — they had no prior behavior to regress. The integration points were limited and explicit.

Tradeoff: more files in the component directory. Benefit: clear isolation between new additions and existing behavior. Worth it.

## The Worktree Node Modules Problem

First `npm run build` in the worktree: failed immediately.

A Git worktree is a separate checkout. It shares the `.git` directory but has its own working tree — which means no `node_modules`. Expected behavior, not a bug, but easy to forget.

```bash
cd ~/portfolio/portfolio-site-claude-redesign
npm ci
npm run build
```

Build passed after the install. The principle: every new worktree needs its own dependency install before running anything.

More importantly: don't commit until the build passes in the environment you're committing from. A broken build in the worktree is a broken Cloudflare Pages deploy if that branch gets promoted to production. The 30-second check saves the investigation later.

## Codex Cross-Review: The URL Claude Code Missed

After implementation, I ran a Codex blocker-only review pass. Verdict: **APPROVE**. No blocking issues.

One non-blocking finding: `Contact.astro` contained `https://dev.to/jee599` — an old username. The actual profile is `https://dev.to/ji_ai`. `Footer.astro` had the same stale URL.

This is the kind of defect that slips through automated checks. The build passes. TypeScript is happy. The page renders correctly. The only wrong thing is that clicking the link goes somewhere outdated. A functional test wouldn't catch it. A lint rule wouldn't catch it.

Cross-review with a different model, reading the diff from scratch, caught it.

The reason: Claude Code was deep in implementation context during the session. `Contact.astro` was new content — there was no prior correct reference to compare against. A fresh reviewer reading the full diff spotted the inconsistency that the implementation pass had no way to flag.

I fixed both URLs, made no other changes (scope discipline), and ran `npm run build` again to confirm.

## Two-Step Deploy: Preview → Main

Cloudflare Pages served `claude/jidonglab-redesign-compare` as a preview URL before anything touched `main`. This is standard Cloudflare behavior for non-main branches, and it's worth treating as a deliberate step.

The preview gave a production-faithful render — real CDN, real edge, not localhost. After confirming the preview looked right, the branch merged to `main`. A background polling task ran against `jidonglab.com` post-merge to confirm actual serving.

Preview-then-merge is one more validation layer that costs nothing to use.

## What the Ratio Actually Means

18 sessions, 500+ tool calls. One session did the actual homepage work. The other 17 were preparation.

That ratio — heavy preparation, concentrated execution — shows up consistently in AI-assisted development. The "AI just writes everything" framing misses it. Session 12/13 was clean and focused precisely because sessions 1–11 had already resolved the hard questions about structure, constraints, and risk.

Multi-agent review adds a second dimension. Claude Code for implementation, Codex for review. These aren't redundant — they're complementary. A reviewer with fresh context reads output differently than the model that produced it. The DEV.to URL wasn't visible to Claude Code during implementation because it was new content with no reference to correct against. Codex read the full diff and spotted the inconsistency. Different cognitive tasks, different catches.

## Four Principles That Held

**1. Isolate redesigns with worktree.** A separate directory gives you a one-command rollback and clean diffs. There's no good reason to run a large redesign directly on `main`.

**2. Build verification before commit.** `npm ci && npm run build` in the worktree directory is a gate, not a formality. Verify in the actual environment before committing to it.

**3. Cross-review catches context errors.** Implementation review and output review are different tasks. Use both. The cross-review isn't to find logic bugs — it's to find things that require reading the output against context that wasn't in the implementation prompt.

**4. New components over modified components when adding features.** Regression surface grows with every existing file you touch. A new file limits the blast radius to the integration point. When adding functionality, prefer `Contact.astro` over adding more to `About.astro`.

---

The number that matters isn't 500 tool calls. It's one — the session where work actually happened, and the 17 sessions that made it possible.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
