---
title: "Redesigning a Photographer's Site with Claude Code: 19 Sessions, 436 Tool Calls"
project: "portfolio-site"
date: 2026-05-13
lang: en
pair: "2026-05-13-portfolio-site-ko"
tags: [claude-code, design, static-site, animation, apple-design]
description: "How I rebuilt a photographer's static HTML site into an Apple-like design in one day: 65KB CSS nuked, handwriting SVG animation, and a lot of 'continue where you left off'."
---

436 tool calls. 19 sessions. At least 5 times typing "Continue from where you left off." That's the build log for `daymoon-pic-site` — a photographer's static HTML site I rebuilt from scratch into an Apple-like design in a single day using Claude Code.

**TL;DR** Replaced a 65KB `!important`-riddled CSS file with 1,373 lines of clean, layered architecture. Built a handwriting logo reveal animation using the `mask-position` trick. Sessions kept hitting the turn limit mid-task, so session continuity became a recurring problem.

## 322 Files, 6,827 Insertions — Starting from Zero

The site had no git history when I started. There was a `.vercel/` folder indicating it was deployed to Vercel, but no version control at all.

The first task looked simple: create `.gitignore`, run `git init`, make the initial commit. What I didn't expect was that Claude caught the `.vercel/` folder and flagged it as containing sensitive credentials — specifically the Vercel project token. It got added to `.gitignore` before the first commit. Doing this manually, I'd probably have missed it.

First commit: `5cb7701` — 322 files, 6,827 insertions. The Apple-like redesign started immediately after.

## Why Throw Away 65KB of CSS

The original `styles.css` was 65KB. The product of years of layering on top of layers:

```css
/* hundreds of lines like this */
.brand-text { font-size: 1.5rem !important; }
.header .brand-text { font-size: 1.8rem !important; }
@media (max-width: 768px) {
  .header .brand-text { font-size: 1.2rem !important; }
}
```

Claude's diagnosis was accurate: "The 65KB CSS is dense with accumulated `!important` overrides. A clean Apple-style rewrite is the most effective path."

The output was 1,373 lines. Structure: CSS tokens → reset → typography → layout → header → drawer → animations → per-section styles → responsive. Zero `!important`.

During this process, Codex flagged a `search-link` in cross-verification. A magnifying glass icon that navigated to the gallery instead of triggering search — a fake search affordance. Users would reasonably expect it to be a search function. It got removed from four HTML files and the CSS.

## The "Continue from Where You Left Off" Pattern

The most-used prompt in this entire project was probably:

```
Continue from where you left off.
```

Or in more specific form:

```
Continue/finalize the current Daymoon changes. There are uncommitted changes
for script wordmark/intro/gallery tabs.
```

Sessions kept hitting max turns mid-task. Each time, Claude would read the working tree diff to reconstruct where things stood, then pick up from there. In practice this worked fine — no actual data was lost. But each handoff cost time on the "what's the current state?" step.

The fix is smaller task units. Kicking off a session with "logo + intro + gallery tabs in one go" is how you get interrupted mid-flight. Splitting by feature would have meant fewer continuations.

## The Handwriting Logo Animation: mask-position Trick

The intro sequence centers on `daymoon` appearing like it's being handwritten in real time.

The technique is a `mask-position` reveal:

```css
.intro-mark-ink {
  -webkit-mask-image: linear-gradient(to right, black 50%, transparent 50%);
  -webkit-mask-size: 200% 100%;
  -webkit-mask-position: 100% 0;
  animation: inkReveal 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes inkReveal {
  from { -webkit-mask-position: 100% 0; }
  to   { -webkit-mask-position: 0% 0; }
}
```

A gradient mask sits over the text. The mask position moves right-to-left, revealing the letters from the left edge outward. The `cubic-bezier(0.4, 0, 0.2, 1)` timing — fast start, slow finish — makes it feel like a brush stroke decelerating at the end.

There was a timing bug on the first implementation. The CSS animation runs 1.8 seconds (200ms delay → 2000ms end). The JS scheduler was removing the `is-in` class at 2250ms — a 250ms overlap that clipped the wordmark just before completion. Moving the scheduler to 2500ms fixed it.

The font is Sacramento from Google Fonts. CSS alone couldn't produce a script feel convincing enough, so the web font was added. All four HTML files got preconnect and `<link>` tags. Cache-busting version incremented to `dm-script-20260512-4` by the end.

## Gallery and Contact Improvements

The gallery was a one-line change — from two columns to three on mobile:

```css
.portfolio { grid-template-columns: repeat(3, 1fr); }
```

The contact page required more rethinking. The original had a name/email/message form as the primary affordance. But photography inquiries actually come through Instagram DM. The `ig.me/m/daymoon_pic` link became the primary CTA, using the existing `assets/logo-instagram.svg`. The form was removed entirely.

Header logo centering was a `position: absolute` solution. With a hamburger menu on the left and navigation on the right, flexbox centering produces a visually off-center result. Setting `position: absolute; left: 50%; transform: translateX(-50%)` on the brand text anchors it to true viewport center regardless of the surrounding elements.

## Tool Usage Breakdown

Across 19 sessions and 436 tool calls:

| Tool | Count | % |
|------|-------|---|
| Bash | 202 | 46% |
| Read | 113 | 26% |
| Edit | 70 | 16% |
| Grep | 31 | 7% |
| Write | 8 | 2% |
| TodoWrite | 4 | 1% |
| Agent | 3 | 1% |

Read at 1.6× Edit is the expected ratio for careful changes — read before modifying. But part of that Read count is session reconnect overhead: every time a session resumed, Claude re-read the working tree state before continuing.

Bash at nearly 3× Edit reflects the verify → execute → re-verify cycle that dominated this work. Most Bash calls were `git status`, `git diff`, and build checks between edits.

Six files were created (`.gitignore`, `WORKLOG.md`, `daymoon-wordmark.svg`, `contact.html`, `plan.md`, `verifier-report.md`), seven were modified. Nearly five sessions did nothing but git admin — commit, push, update WORKLOG. That's a direct consequence of implementation sessions ending before they committed.

> Implementation sessions can run long. But commit and WORKLOG update need to happen inside the same session. The moment they split off, you get a dedicated "finish this up" session.

## What Carries Forward

Three things worth keeping from this build:

**Smaller session scope beats mid-task recovery.** The "continue from where you left off" pattern works, but it has real cost. A session scoped to one feature — just the logo animation, just the gallery, just the contact page — ends cleaner and doesn't bleed into the next.

**Cross-verification catches affordance bugs.** The fake search icon would have shipped. It's exactly the kind of UX issue that passes code review but fails a user test. Having Codex flag it during the CSS rewrite was a genuine catch.

**CSS architecture decisions compound.** Starting fresh from a token layer instead of patching the existing 65KB file wasn't just cleaner — it made every subsequent change faster. The redesign that followed would have been significantly harder to execute on top of the old codebase.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
