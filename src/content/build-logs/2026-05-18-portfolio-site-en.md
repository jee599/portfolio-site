---
title: "Claude Code 18 Sessions, 145 Tool Calls: Health Checks and a Client Site Polish"
project: "portfolio-site"
date: 2026-05-18
lang: en
pair: "2026-05-18-portfolio-site-ko"
tags: [claude-code, claude-opus-4-7, workflow, review-fix, static-site, claude-runner]
description: "8 of 18 sessions returned only CLAUDE_OK. The other 9 polished a photographer's static HTML site with 39 edits, 0 new files."
---

8 of my 18 Claude Code sessions today had zero tool calls, zero edits, zero elapsed time. Each returned a single phrase: `CLAUDE_OK`, `CLAUDE_STDIN_OK`, `CLAUDE_SKIP_OK`.

That's not waste — those 8 sessions are the reason the other 9 sessions worked cleanly.

**TL;DR** — Today's work split between validating a Claude Code runner automation pipeline (8 health-check sessions, 0 tool calls each) and polishing a photographer's static site (`daymoon-pic-site`) across 9 sessions. 145 total tool calls. 8 files refined, 0 created.

## The 8 Sessions That Did Nothing — On Purpose

Sessions 3, 5, 6, 7, 8, 9, 10, and 11 all followed the same pattern:

```
User: Return exactly: CLAUDE_OK
Claude: CLAUDE_OK
```

```
User: Return exactly: CLAUDE_STDIN_OK
Claude: CLAUDE_STDIN_OK
```

When wiring Claude Code as an automated runner for a new project, the first engineering question isn't "will the AI produce good code?" It's "does the pipeline actually reach the model?"

The automation setup routes different input modes through different code paths. Each health-check session targets one failure mode in isolation:

- **`CLAUDE_OK`** — baseline stdin injection works
- **`CLAUDE_STDIN_OK`** — stdin piping with project context loaded correctly
- **`CLAUDE_PROJECT_OK`** — project-level context (`CLAUDE.md`, rules files) loads on startup
- **`CLAUDE_SKIP_OK`** — skip/abort routing sends the right response code

Each case gets a dedicated session because mixing them makes failures ambiguous. If a combined session fails, you don't know which path broke. If a single-purpose session fails, you know exactly where to look.

The overhead per session: 0 minutes, 0 tool calls. The alternative — skipping validation and debugging "why isn't my code change landing?" mid-project — costs far more. Debugging pipeline failures disguised as code failures is slow precisely because they look the same from the outside.

This pattern generalizes. Any time you have a multi-stage automation (generate → validate → publish → notify), validating each stage independently before running the full pipeline saves hours of mixed-signal debugging later.

## Daymoon: A Photographer's Static Site in 9 Sessions

`daymoon-pic-site` is a portfolio site for photographer Daymoon. The stack is intentionally minimal: five HTML pages (`about.html`, `product.html`, `notice.html`, `gallery.html`, `reservation.html`) plus a single `styles.css`. No React, no Vite, no build step. The client wanted a fast-loading site that could be updated without touching a terminal.

Client feedback came in multiple waves — some via KakaoTalk screenshots, some as written notes — so the work spread across 9 sessions rather than one long run.

### Sessions 2 and 4: The Same Prompt, Run Twice

Sessions 2 and 4 both started from the same prompt. Session 2 spent its entire context budget on exploration: 7 Reads, 3 Bash calls, mapping the file structure. It never reached an Edit.

This is a real failure mode in large-context Claude Code sessions. Exploration consumes tokens. If the first-pass scouting is thorough enough, the model runs out of runway before it starts writing. Session 4 ran the same prompt and succeeded because it was given explicit scope constraints — don't re-explore, start from these files, execute these changes.

The three changes from sessions 2/4:
- **Nav order**: ABOUT / PRODUCT / NOTICE / GALLERY / RESERVATION across all pages
- **Product page structure**: hero image at full width on top, composition details and pricing below
- **Gallery layout**: fixed 4-column grid, ALL tab removed (client wanted categorized views only)

### Session 12: Read-Only Review Before Showing the Client

After the initial implementation, session 12 ran a standalone review pass. Explicit constraint in the prompt: `Do not edit files.`

9 tool calls, 5 Reads, 4 Bash. Output: a Korean bullet list in three categories.

```
Review the current state of all pages. Do not edit files.
Return Korean bullet list: done, insufficient, must-fix before showing client.
```

The three-category constraint is the mechanism. Without it, the model produces assessments like "this section is mostly complete but could benefit from..." — technically accurate and useless for deciding what to fix. With `done / insufficient / must-fix`, every item has to land in exactly one bin. The model has to make a judgment, not hedge.

The output from session 12 became the literal scope definition for session 13. Every `must-fix` item in the bullet list was a task. Every `insufficient` item was flagged but deferred. Nothing from `done` was touched.

### Session 13: Must-Fix Items, Nothing Else

Session 13 touched four files based on session 12's output:

- `about.html`: placeholder text "대표 사진 영역 · 추후 교체" (a note to replace the hero photo) still visible in deployed HTML
- `notice.html`: dummy notice body copy still in the template
- `reservation.html`: form labels referencing internal notes instead of user-facing text
- `styles.css`: orphaned rules from early iterations

12 Edits. Scope discipline held — nothing outside the must-fix list was touched, even when "obvious" improvements were visible.

### Session 14: Full Polish Pass

With must-fix items resolved, session 14 ran a broader polish: font hierarchy consistency, paragraph spacing normalization, Korean copy review, duplicate button removal. This session also re-verified that original client requirements from sessions 2/4 survived the session 13 edits — a lightweight regression check embedded in the polish pass.

11 Edits, 5 Reads, 4 Bash.

### Session 15: Stripping the AI Template Aesthetic

The client's feedback on the product page: "It looks like an AI template."

This is a legitimate critique that gets harder to address the more you lean into common AI-generated design patterns. The specific culprits:

- Gradient cards with soft blue-to-purple fills
- Emoji icons used as decorative bullet points
- Heavy `box-shadow` stacking creating a "floating" card effect

Session 15 removed all three and moved to a flat, minimal layout. Tight typography, no decorative chrome, generous whitespace — closer to Apple's product photography page structure than the typical AI-generated portfolio aesthetic.

7 Reads, 7 Edits. The high Read count reflects careful checking before each CSS Edit — all styles live in one file, and the product page shares classes with other pages.

### Sessions 16, 17, 18: Three Discrete Feedback Loops

Each of the final three sessions was a single atomic client feedback unit:

**Session 16** — A KakaoTalk screenshot arrived. The `<dl class="product-meta">` block on each product panel — containing meta-labels for "recommended audience," "mood," and "composition type" — was adding clutter the client didn't want. Removed entirely from `product.html` and `styles.css`.

**Session 17** — The KakaoTalk channel URL (`https://pf.kakao.com/_TuhCn`) needed to be wired to the reservation CTA button. One change, one session.

**Session 18** — Remove the HOME link from the mobile navigation drawer. This sounds like a one-liner but touched 7 files: `about.html`, `contact.html`, `gallery.html`, `index.html`, `notice.html`, `product.html`, `reservation.html`. Same line, 7 deletions.

Treating each as its own session rather than batching them into one "feedback round" session keeps the diff clean and makes it easy to trace which client request caused which change.

## The Case for Separating Review From Implementation

Session 12's read-only pattern is deliberate and reusable. The core problem with reviewing your own implementation in the same session you built it: the model fills ambiguous gaps with its own intent. It sees what it meant to build, not what it actually built.

A fresh session with a clean context window has no preconceptions about what a section "should" look like. It reads what's there.

The three-category output format does more work than it looks like. It converts a subjective review into an actionable task list. Forcing every observation into one of three bins prevents the model from sitting in the comfortable middle ground of "could be improved." The output from one session's review becomes the input spec for the next session's implementation. Each step has clear boundaries.

## What the 43% Read Rate Reflects

145 total tool calls. Distribution:

- **Read: 63 (43%)**
- **Edit: 39 (27%)**
- **Bash: 32 (22%)**
- **Grep: 11 (8%)**

On a 5-file static site, you might expect the Read percentage to be lower. Everything fits in a short codebase. But the reason Read dominates is the `styles.css` architecture: all page styles in one file. Before each CSS Edit, the current class definitions need to be confirmed. Skip that Read, and you're writing CSS blind — duplicating declarations, overwriting rules, creating specificity conflicts that only show up visually.

The 43% Read rate isn't overhead. It's what prevents "I made a change and broke another page."

For static HTML projects especially, the read-first discipline matters more than in a componentized React setup where styles are scoped to components. A monolithic CSS file is a shared resource with hidden dependencies.

## Session 1: A Different Automation Pipeline

Session 1 was unrelated to `daymoon-pic-site`. It ran a compliance review on a daily report file from the `dentalad` project — checking for Korean medical advertising law violations before the report moved to the next pipeline stage.

Checked items:
- Guaranteed efficacy claims ("100% success rate," "certain to cure")
- Unverified statistics presented as established fact
- Exposed clinic names or addresses that shouldn't appear in automated content

Result: no blocking issues. 6 Reads, 0 edits, 0 minutes.

The architecture mirrors the health-check pattern: a single-purpose read-only session that runs at a pipeline stage boundary, produces a binary verdict, and either passes work forward or blocks it. The same modular session design applied in a completely different domain.

## Stats

| Metric | Value |
|--------|-------|
| Total sessions | 18 |
| Total tool calls | 145 |
| Read | 63 (43%) |
| Edit | 39 (27%) |
| Bash | 32 (22%) |
| Grep | 11 (8%) |
| Files modified | 8 |
| Files created | 0 |
| Code-free sessions | 8 |
| Model | claude-opus-4-7 |

> Isolating health-check sessions from implementation sessions means when something breaks, you know exactly which layer to investigate.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
