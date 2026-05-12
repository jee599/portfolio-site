---
title: "From Zero Git to Apple-Style Portfolio: 19 Claude Code Sessions, 436 Tool Calls, One Day"
project: "portfolio-site"
date: 2026-05-12
lang: en
pair: "2026-05-12-portfolio-site-ko"
tags: [claude-code, redesign, css, animation, frontend]
description: "322 files live in production with no git. 19 Claude Code sessions, 436 tool calls, and one day to deliver a complete Apple-style photo portfolio redesign."
---

322 files live in production. No git. No version history. No `.gitignore`. Just a `.vercel/` folder in an otherwise untracked directory — that was the starting state when I opened `daymoon-pic-site`.

Nineteen Claude Code sessions and 436 tool calls later, the site had been fully redesigned in the Apple aesthetic. Everything completed in a single working day.

**TL;DR** Full ground-up redesign of `daymoon-pic-site` using Claude Code AI automation: git initialization from scratch, 65KB CSS rewrite eliminating hundreds of `!important` overrides, Sacramento handwriting font intro animation (4 sessions to get right), 3-column gallery grid, and an Instagram DM card replacing a bloated booking form. Tool distribution: Bash 202, Read 113, Edit 70, Grep 31, Write 8.

## The Site Had No Git

The original request was simple: "set up git for this static site." One directory listing later, the scope expanded. No `.git`. A photo portfolio site with 322 files — HTML, CSS, JavaScript, images — running in production with zero version control. Every change until that point had been made in-place, with no history and no rollback path.

Session 4 established the foundation in this order:

1. Created `.gitignore` covering `.vercel/`, `node_modules`, and credential files
2. Wrote `WORKLOG.md` — a running log of all changes, decisions, and session summaries
3. `git init` → first commit `5cb7701` → private repo `jee599/daymoon-pic-site` on GitHub → push

From that point, every change is tracked. But `WORKLOG.md` turned out to be as important as the git history itself.

In a multi-session Claude Code workflow, each session starts cold — no memory of prior sessions, no accumulated state. The session reads `git diff` and `WORKLOG.md` to reconstruct current state, identify what's in-progress, and scope its work to one specific area. Without this handoff artifact, each session would spend its opening context re-deriving what was done and why.

The pattern held across all 19 sessions: small, scoped task → commit → WORKLOG update → end session. The next session picks up exactly where the last one left off, but with a fresh context window and full accuracy.

## 65KB of CSS With Hundreds of `!important`

The redesign brief was "make it feel like Apple." That's a visual direction, not a specification — so the first step was auditing what existed. Opening `styles.css` revealed the problem immediately: 65KB of CSS with hundreds of `!important` declarations stacked across every component.

This is a familiar pattern in long-lived static sites. A rule is added. Later, something overrides it. Instead of refactoring the original, a new `!important` wins the specificity conflict. Repeat for two years. The result is CSS that functions, but can't be reasoned about — changing one rule requires hunting down every override that depends on it.

For a move toward Apple minimalism, partial patching wasn't viable. Apple's visual language relies on structural clarity: consistent spacing, clean hierarchy, system fonts, no decorative clutter. You can't build that on top of a tangled cascade. The only viable path was a complete rewrite.

The rewrite followed a deliberate layer order to prevent new cascade conflicts from forming:

```
CSS tokens → reset → typography → layout → header → drawer → reveal animations → per-section → responsive
```

All `!important` declarations were removed. Gallery navigation was replaced with an `.apple-filter` component styled after Apple's segmented control — a pill-shaped tab switcher with smooth active-state transitions. Google Fonts was dropped entirely in favor of the system font stack, eliminating one external blocking request per page load.

End result: 65KB → 1,373 lines. More importantly, the structure was now readable. Any rule in the file could be understood without tracing a chain of overrides.

A subsequent Codex AI automation cross-verification pass flagged one additional problem: a `.search-link` in the header — a magnifying glass icon that, on click, navigated to the gallery page instead of opening any search functionality. The affordance communicated "search," the behavior delivered "gallery." That's a user trust issue. It was removed from 4 HTML files and the corresponding CSS.

## When Vercel Rejected the Deployment

Right after pushing the redesign, Vercel returned an error:

```
Git author jidong@jidongui-iMac.local must have access
to the team jee599's projects on Vercel to create deployments.
```

The commit was authored as `jidong@jidongui-iMac.local` — the local machine hostname had ended up in the global git config as the email address. Vercel's deployment authorization checks commit authors against team accounts, and a hostname-based address doesn't map to anything in GitHub's user registry.

The fix was surgical — no code changes, just author correction:

```bash
git config user.name "jee599"
git config user.email "31664958+jee599@users.noreply.github.com"
git commit --allow-empty -m "chore: fix git author for Vercel deployment"
git push origin main
```

Vercel resolves commit authors via the GitHub noreply format (`user_id+username@users.noreply.github.com`). An empty commit carrying the corrected author was enough to unblock the deployment pipeline.

If you're setting up a new machine for Vercel-connected repos: verify `git config user.email` matches your GitHub noreply address before the first commit. The error Vercel returns doesn't make the root cause obvious.

## Why the Intro Animation Took 4 Sessions

The intro sequence consumed more iteration than any other single feature. The original brief was "an emotional first-load experience" — deliberately open-ended, which meant the direction evolved through use rather than specification.

**v1** (session 8): A sequence of poetic phrases fades in and out → daymoon wordmark appears → stagger reveal of portfolio photos. Functional, but felt like a generic photography site intro.

**v2** (session 17): The brief changed: "Remove the text. Make the logo write itself in cursive. And remove the trailing dot." Implemented using CSS `mask-position` animation — a gradient mask slides from right to left, progressively revealing letterforms as if being drawn:

```css
.intro-mark-ink {
  -webkit-mask-image: linear-gradient(to right, black 50%, transparent 50%);
  -webkit-mask-size: 200%;
  -webkit-mask-position: 100%;
  animation: handwriting-reveal 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes handwriting-reveal {
  to { -webkit-mask-position: 0%; }
}
```

The `cubic-bezier` curve gives the reveal a slight deceleration near the end, mimicking how a pen slows as it completes a stroke. The effect only works because Sacramento's letterforms are drawn left to right — the mask reveal direction matches the natural stroke direction of the font.

**v3** (session 18): Testing surfaced a timing bug. `script.js` was still managing a 2-stage intro schedule from the previous version. The HTML had been restructured to a single stage, but `stages[1]` in the animation scheduler now pointed to an element that didn't exist. That reference was silently becoming a no-op.

The consequence: the handwriting animation was being cut off at 2,250ms. The animation actually completes at 300ms (start offset) + 1,800ms (duration) = 2,100ms. The scheduler was firing the exit transition at 2,250ms — only 150ms of buffer. On slower devices or with reduced motion preferences, the wordmark hadn't finished drawing before the exit began.

Corrected schedule:

```js
// t=200ms:  add .is-in  — begin handwriting reveal
// t=2500ms: add .is-out — fade out wordmark
// t=3400ms: fire intro-done — begin photo stagger reveal
```

The 400ms gap between animation completion and `.is-out` creates a deliberate pause — the fully drawn wordmark holds on screen for a beat before the transition continues. That pause is what made the intro feel intentional rather than rushed.

**v4** (session 19): Full timing verified, committed with cache-bust suffix `dm-script-20260512-4` to force browsers to load the updated script.

## Sacramento, Gallery Grid, and the Contact Simplification

**Font selection**: The brief was "something more expressive — a handwritten logo feel." Sacramento from Google Fonts fit the requirements: monoweight cursive script, consistent stroke width, works well at display sizes in lowercase, and technically compatible with the CSS mask animation because its letterforms are drawn left to right. Generated `assets/daymoon-wordmark.svg` using Sacramento and applied it to both the header and the intro sequence.

**Gallery grid**: The request was a single sentence — "make it 3 columns." Simple in concept, but the CSS had three separate layout classes controlling different gallery views: `.portfolio`, `.split-grid`, and `.only-grid`. Each needed `grid-template-columns: repeat(3, 1fr)` applied individually. Mobile breakpoints used different column counts and were left untouched.

**Contact page**: The biggest behavioral change of the entire redesign. A multi-field booking form — name, preferred date, package selection, message, submit — was replaced with a single card: the Instagram logo and the handle `@daymoon_pic`. One tap opens `https://ig.me/m/daymoon_pic` directly in the Instagram DM interface. Used the existing `assets/logo-instagram.svg`. All form-related JavaScript and CSS was removed along with the form HTML.

This simplification reflects how the client actually receives inquiries. Most photography clients make first contact through Instagram DMs, not web forms. The form was creating friction on the primary contact path. Removing it reduced the page to a single, friction-free action.

**Product page**: Descriptions and context copy removed, leaving only the service menu — graduation portraits, couples, friendship/family, wedding. The page now functions as a quick reference rather than a sales pitch.

## Tool Call Breakdown

436 calls across 19 sessions:

| Tool | Count | Role |
|------|-------|------|
| Bash | 202 | Verification, git ops, workflow state, push |
| Read | 113 | Full file reads before every targeted edit |
| Edit | 70 | Surgical modifications |
| Grep | 31 | Debug code checks, cross-file selector searches |
| Write | 8 | New files: SVG assets, config, WORKLOG |
| Agent / TodoWrite / ToolSearch | 11 | Task tracking, delegated Codex cross-check |

Bash accounting for nearly half of all calls reflects a validation-heavy approach. Each session ended with the same checklist: grep for leftover `console.log` or debug comments, `tidy -e` for HTML syntax validation, `git diff --stat` to confirm the scope of changes matched the original intent, workflow state update, and push to origin.

The Read-to-Edit ratio (113:70) is intentional. Reading the complete file before editing prevents a common failure mode: making a change that conflicts with a rule or function 200 lines away that you didn't know existed. Grep filled the gaps when tracking a specific class or function reference across multiple files.

The 11 Agent/TodoWrite/ToolSearch calls included one Codex cross-verification dispatch — the pass that caught the misleading `.search-link` affordance described above. Cross-verification is most valuable after large structural changes, when the diff is too wide for a single-pass review.

## Why 19 Sessions in One Day

Nineteen sessions in a single day is a context management strategy. The intro animation alone spanned four sessions. Compressing everything into fewer sessions lets context accumulate, which degrades accuracy in later completions — the model starts making assumptions about code state instead of reading the current file.

The discipline: scope one task clearly, complete it, commit it, record it in `WORKLOG.md`, end the session. The next session opens `git diff` and `WORKLOG.md`, reconstructs current state in the first few exchanges, then works on the next scoped task from the start of a fresh context window.

> The commit-push cycle is what makes multi-session Claude Code work reliable. `git diff` is the objective record of current state — not session memory, not notes, not assumptions.

This holds across any AI coding tool, not just Claude Code. Keep sessions short, keep tasks scoped, and let git carry the state between them. The quality of each session stays high because each one starts clean.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
