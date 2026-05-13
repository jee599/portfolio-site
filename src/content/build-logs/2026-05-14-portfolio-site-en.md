---
title: "Claude Code, 19 Sessions, 604 Tool Calls: Redesigning a Photographer's Portfolio Without the AI Look"
project: "portfolio-site"
date: 2026-05-14
lang: en
pair: "2026-05-14-portfolio-site-ko"
tags: [claude-code, frontend, design, iteration, daymoon]
description: "19 sessions, 604 tool calls, ~50 minutes: how Claude Code redesigned a photographer portfolio after the first attempt got rejected for looking 'too AI.'"
---

The first redesign was rejected in under 5 minutes. "AI-feeling." Back to zero.

That was session 7 of 19 in a single day's work on `daymoon-pic-site` — a portfolio site for photographer Daymoon. By end of day: 604 tool calls, roughly 50 minutes of active work, and a commercial-grade redesign that actually got approved.

This is a record of how that happened, including the parts that didn't go cleanly.

**TL;DR** The first redesign attempt was rejected immediately for looking "too AI/generic." The second attempt — after a specific, concrete prompt — converged on something resembling a real commercial photographer site. The next 15 sessions were spent on details: slideshow transitions, language tone decisions that changed 4 times, and one hook false positive that blocked a response.

## Before the Redesign: Intro Animation and Drawer Cleanup

Sessions 3–6 were incremental. Cursive logo intro animation (`script.js` FLIP morph), removing a duplicate DM button from the mobile drawer, unifying to Pretendard font, adjusting typography letter-spacing. Each session consumed 43–54 tool calls across repeated edits to `styles.css`, `index.html`, and `script.js`.

Session 3 was the most technically dense of this phase. The FLIP transition — where a handwritten wordmark appears centered on screen, then flies to the header logo position — required a CDP verification script at `/tmp/verify_intro_flip.py` to confirm `body` class transitions (`intro-active → intro-morphing → intro-done`) and coordinate values. One session: 13 Read calls, 10 Edits, 9 Bash.

## The "Do It Over" — When the First Direction Gets Rejected

Session 7 brought the first full redesign request. The feedback was direct:

> "Redo it. Proper commercial design — fonts, layout, structure that shows as many photos as possible. Built for product quality, both web and app."

Everything built up to that point — the cursive intro, the editorial caption layout — was "AI/generic." Sessions 8–9 invoked the `ui-ux-pro-max` skill and redesigned with a dense editorial layout: 5-column contact-sheet grid, product tab strip, mobile fixed DM bar. `styles.css` was rewritten from scratch.

Session 9 also introduced a habit that pays off consistently: before writing any image paths into HTML, run a Bash command to list actual files in `assets/blog/` category folders. Obvious in retrospect — broken image paths from non-existent files are easily avoided — but doing it by default from the start is what makes the difference in production quality.

## Throwing Out the Contact Sheet: The Slideshow Switch

Session 10 stripped the hero marketing copy and reduced the grid from 5 columns to 3. Then session 11 changed direction entirely:

> "Make the home page just one big photo that randomly fades in and out to the next image."

The contact-sheet grid was replaced with a full-screen slideshow. Rotation logic went into `script.js`, `.home-slideshow` was added to `styles.css`. Session 11 set the record at 64 tool calls — Bash alone accounted for 27, because CDP-based QA validation ran in the same session.

Session 13 changed the slideshow frame from full-bleed to an editorial portal style:

```css
.home-slideshow {
  width: min(760px, calc(100% - 28px));
  height: clamp(520px, 78svh, 860px);
  margin: 0 auto;
}
```

This session also produced the one hook false positive of the project. The worklog summary included a phrase mentioning zero instances of `console.log`, `debugger`, and `TODO`. The Stop hook detected "TODO" in that string and blocked the response. Rewording to "zero debug/residual markers" cleared it. Hooks match patterns, not intent — that distinction matters when writing worklog text that gets scanned.

## Four Language Decisions in Five Sessions

Sessions 14–18 were entirely about the product page language.

- Session 14: switched to English (`Product`, `Graduation`, `Couple` tabs)
- Session 15: reversed to Korean (`촬영 메뉴`, `졸업스냅`, `커플스냅`)
- Sessions 16–17: pushed Korean into page navigation as well
- Session 18: finalized as "content-only Korean" — nav reverted to English

Final state: site-wide nav (`Gallery / Product / Contact / DM`) in English, product page content (`촬영 메뉴`, tabs, panels, `문의하기`) in Korean.

Each session in this sequence averaged 15 Edit calls. This is what iterating on the same files back and forth looks like in Claude Code — because context resets per session, each one starts with a `Read` to get current file state, then applies only the diff needed. No external state tracking required; the file is always the source of truth.

## Tool Call Distribution Across 19 Sessions

604 total, broken down:

| Tool | Count | Role |
|------|-------|------|
| Bash | 193 | Validation, git diff, file listing |
| Read | 172 | File state check before each change |
| Edit | 141 | Actual modifications |
| Grep | 59 | Class/string location lookup |
| TodoWrite | 17 | Step-by-step checklists |

Read outpaces Edit by 31 calls. In a context-reset-per-session model, Claude Code consistently reads current file state before modifying — that's the mechanism that keeps results consistent across sessions without inter-session continuity. It's not a workaround; it's the correct operating mode.

Average: 32 tool calls/session, ~2.6 minutes/session. Longest session (11): 64 calls. Shortest: 5 calls.

## What This Project Actually Teaches

**Vague feedback multiplies iterations.** "Avoid the AI look" doesn't give the model anything to aim at. Session 7's prompt — "commercial fonts, layout, structure that shows as many photos as possible, both web and app" — produced a usable first result immediately. Abstract feedback costs sessions.

**Language and tone decisions are product decisions, not implementation failures.** The four-direction change across sessions 14–18 wasn't iteration on broken code. It was UX exploration. Claude Code is an execution tool; the decision itself belongs to the person. Keeping that distinction clear makes heavy iteration feel like progress rather than waste.

**Pattern-matching hooks produce false positives.** The Stop hook's TODO detection tripped on a summary string that mentioned zero TODOs — not an actual TODO. Narrowing hook regexes to word boundaries (`\bTODO\b`) eliminates this class of false positive. Small thing, but it adds up across a project.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
