---
title: "Claude Code in 14 Sessions, 78 Tool Calls: The Review-Fix Loop That Shipped a Photographer's Site"
project: "portfolio-site"
date: 2026-05-18
lang: en
pair: "2026-05-18-portfolio-site-ko"
tags: [claude-code, claude-opus-4-7, workflow, review-fix, static-site]
description: "46% of tool calls were reads, 6 sessions touched zero code. How runner validation and a separated review pass made client delivery reliable."
---

14 sessions. 78 tool calls. 6 of those sessions touched exactly zero lines of code — and that wasn't a mistake.

This is a build log from wiring Claude Code into `daymoon-pic-site`, a static HTML/CSS site for a photographer client. The numbers tell a specific story: **Read dominated at 46%**, implementation was cleanly separated from review, and the most productive sessions produced no code at all.

**TL;DR** Start every new Claude Code project with runner validation before touching real code. Separating the review session from implementation sessions makes your pre-delivery fix list precise and your delivery predictable.

## Six Sessions, Zero Code — What Runner Validation Actually Costs

When you first connect Claude Code to a project, your automation pipeline needs to prove it can reach the model before you trust it with real work. The prompts for those six sessions looked like this:

```
Return exactly: CLAUDE_OK
Return exactly: CLAUDE_STDIN_OK
Return exactly: CLAUDE_PROJECT_OK
```

Each one validates a different case: can the runner open a session and get a response? Does stdin pass through correctly? Does the project context load? Does the skip condition work as expected?

Without these checks, when something fails during a real implementation session, you're debugging two things simultaneously: the pipeline and the code. That ambiguity compounds. A broken edit lands in the codebase, you assume it's a logic error, you spend 20 minutes chasing a bug that was actually a malformed stdin payload. The runner validation separates those failure modes cleanly.

All six sessions completed at 0 minutes, 0 tool calls. The overhead is negligible. The confidence is not.

This pattern generalizes beyond this specific project. Any time Claude Code gets attached to a new repo, a different language, or a new execution environment — runner validation comes first. It's the minimum viable evidence that the system works end-to-end before you trust it with actual client deliverables.

## The Four-Phase Loop That Makes Delivery Predictable

Once the pipeline was validated, the actual work followed four distinct phases. The key word is *distinct* — each phase ran as a separate Claude Code session with its own prompt and fresh context.

### Implementation (Sessions 2 and 4)

The client's requests went in all at once across two sessions:

- **Navigation reorder**: ABOUT / PRODUCT / NOTICE / GALLERY / RESERVATION
- **Product page structure**: Hero image at the top, then product configuration and pricing details below
- **Gallery**: Maximum 4 columns, ALL tab removed

Two sessions combined: Read 16, Bash 8. Both started by reading `PROJECT.md` and the existing CSS before touching anything. The read-first discipline at this stage prevents the class collision problems that show up later in the polish pass.

### Review (Session 12)

Implementation ended. Then nothing. No immediate review in the same session.

Session 12 was a dedicated read-only pass — the prompt said `Do not edit files` explicitly. The output was a severity-tagged bullet list:

```
✅ Nav order correct
✅ Product hero layout implemented
⚠️ Gallery mobile layout insufficient on 375px
🚨 about.html: placeholder text still visible in production
🚨 notice.html: dummy notice content remains
🚨 reservation.html: form labels incomplete
```

Read 5, Bash 4. No edits.

The rationale: when you build and review in the same session, you see what you intended to build. The context carries your intent. In a fresh session, with a fresh prompt and no prior knowledge of what was *supposed* to be there, you see what was actually built. These are not the same thing — and for client delivery, only the second one matters.

### Fix (Session 13)

Only the 🚨 must-fix items. Not the ⚠️ items. Not improvements. Not anything discovered incidentally. Just what blocks delivery.

The fixes: a visible placeholder in `about.html`, dummy announcement text in `notice.html`, and incomplete form field labels in `reservation.html`. 12 Edit calls across four files: `about.html`, `notice.html`, `reservation.html`, `styles.css`.

Scoped review produces scoped fixes. When the review outputs a clear severity taxonomy, the fix session stays focused and fast.

### Polish (Session 14)

Typography hierarchy. Paragraph spacing. Korean copy refinement. Duplicate button removal.

Before touching anything: verify all original client requests still hold. This is the regression check that matters — not automated tests, but a deliberate confirmation that the fix session didn't disturb the implementation session's work. Edit 11, Read 5, Bash 4.

## 36 Reads Out of 78 Tool Calls — The Read-First Discipline

Read was 36 of 78 total tool calls — 46%. Edit was 23 (29%), Bash 17 (22%), Grep 2 (3%).

On a static HTML/CSS/JS site with five pages and one stylesheet, that ratio looks excessive. It isn't.

`daymoon-pic-site` has a structure that appears simple but has tight coupling:

```
about.html
product.html
notice.html
gallery.html
reservation.html
styles.css         ← shared by all five pages
```

Every CSS change affects all five pages. Every structural HTML change may break the shared stylesheet's selectors. Before every edit, you need the current state of the file you're changing — and often the current state of the file that depends on it.

The Read → Edit chain was most visible in Session 14. During the polish pass, the pattern was consistent:

1. Read `styles.css` to find the existing class for the component being touched
2. Edit only the specific declaration that needed changing
3. Read the HTML page that uses that class to verify surrounding structure
4. Edit the HTML only if the class application was wrong

Skipping any Read in that chain means guessing. Guessing in a shared stylesheet produces duplicate declarations, overrides that don't stick, or changes that work on one page and silently break another. Even on a five-file project with no build step, no bundler, and no framework — read-first is the right discipline.

## Session 1 Was a Different Pipeline Entirely

The first session had nothing to do with `daymoon-pic-site`. It was a read-only review of a Korean medical advertising daily report HTML file from the `dentalad` project — a completely different client, different domain, different compliance context.

Read 6, approximately 0 minutes. Closed with no blocking issues.

This session is part of a separate automation pipeline: after a medical ad report file is generated, Claude reviews it for Korean medical advertising law compliance before the file moves to the next stage. The checks are specific:

- No prohibited efficacy guarantee phrasing
- No unverified statistics stated as factual claims
- No hospital name or personal identification exposure
- No before/after treatment comparisons without required disclaimers

The review runs read-only, produces a pass/fail verdict, and gates the downstream step. The same pattern as runner validation — a cheap verification pass that catches compliance failures before they become legal problems. Different domain, identical structure.

## By the Numbers

| Metric | Count |
|--------|-------|
| Total sessions | 14 |
| Total tool calls | 78 |
| Read | 36 (46%) |
| Edit | 23 (29%) |
| Bash | 17 (22%) |
| Grep | 2 (3%) |
| Files modified | 5 |
| Zero-code sessions | 6 |
| Model | claude-opus-4-7 |

## Two Patterns Worth Keeping

Both patterns from today generalize.

**Validation before implementation.** Six zero-code sessions isn't overhead — it's the foundation that makes every subsequent session debuggable. When an implementation session fails, you know it's the implementation, not the pipeline. That distinction saves compounding debugging time across every session that follows.

**Review as a separate context.** The review session (Session 12) produced a precise, actionable fix list because it ran with no knowledge of implementation intent — only what was actually present in the files. The must-fix items were obvious in that fresh context, but would have been easy to rationalize away if the review happened immediately after implementation in the same session. Separate context is not just a workflow preference; it's the mechanism that makes the review reliable.

Both apply to any Claude Code workflow where delivery quality matters: client projects, production deploys, automated content pipelines. The cost is a few extra sessions with 0 tool calls. The payoff is a fix list you can trust.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
