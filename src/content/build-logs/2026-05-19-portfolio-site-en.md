---
title: "Claude Code Client Delivery Pattern: 18 Sessions, 145 Tool Calls, One Day"
project: "portfolio-site"
date: 2026-05-19
lang: en
pair: "2026-05-19-portfolio-site-ko"
tags: [claude-code, workflow, static-site, client-work, daymoon]
description: "18 Claude Code sessions, 145 tool calls, 8 files changed — how a review-first, scope-sliced pattern delivered a photographer's site in a single day."
---

18 Claude Code sessions in one day. 8 of them returned a single word. The remaining 10 did the actual work — 145 tool calls, 8 files changed — bringing the Daymoon photographer site to a state ready to show a real client.

**TL;DR** Run a read-only review session before implementation. Slice implementation into single-concern sessions. Use runner ping sessions to validate your automation environment before committing long runs. This pattern produced client-delivery quality in one day.

## Why 8 Sessions Just Say "OK"

Looking at the session list, these stand out immediately:

```
Session 3:  "Say OK only"                                         → OK
Session 5:  "Return exactly: CLAUDE_OK"                          → CLAUDE_OK
Session 6:  "In this repo ... return exactly CLAUDE_PROJECT_OK"  → CLAUDE_PROJECT_OK
Session 7:  "Return exactly: CLAUDE_SKIP_OK"                     → CLAUDE_SKIP_OK
Session 8:  "Return exactly: CLAUDE_STDIN_OK"                    → CLAUDE_STDIN_OK
Session 9:  "Claude runner is operating normally on Daymoon."
Session 10: (same)
Session 11: (same)
```

These are runner health checks for the Claude Code automation pipeline. Before handing any real work to Claude, the execution environment needs to be verified as stable. If a session fails or returns nothing, subsequent implementation sessions don't trigger.

Eight checks because the environment setup and connection method changed several times during initial configuration.

It looks wasteful. It's the opposite. Starting a long implementation session with an unstable runner means it dies mid-run, leaving files in a partially modified state. That's the more expensive failure.

## Run the Review Session First

Session 12 is unusual: 19 tool calls, zero file modifications.

```
Session 12: prompt includes "Do not edit files. Review whether the client request was implemented."
            → Read(5), Bash(4)
            → Returns ✅/⚠️/🔴 three-tier report
```

This is intentional. Before implementation starts, evaluate current state in read-only mode. The review caught exactly one blocker: placeholder and TODO text exposed on public-facing pages. Without this session, the client would have found it instead.

The review session prompt structure:

> "Do not edit files. Review whether the client request was implemented: [checklist]. Return bullet list: done, insufficient, must-fix before showing client."

Classifying findings into `must-fix` and `done` automatically scopes the next implementation session. No need to re-read the entire project.

## Slice Implementation by Concern

Six implementation sessions, each owning one concern.

**Session 13 — Remove public-facing blockers** (20 tool calls, 12 edits)
- `about.html`: removed placeholder captions
- `notice.html`: removed TODO comments, wrote actual notice content
- `reservation.html`: replaced incomplete form guidance
- `styles.css`: cleaned up unnecessary fallback styles

**Session 14 — Copy and typography polish** (20 tool calls, 11 edits)
- Normalized heading hierarchy and paragraph spacing
- Removed duplicate buttons
- Re-confirmed prior client requests still applied before proceeding

**Session 15 — Product page design** (18 tool calls, 7 edits)
- Goal: strip the AI/template aesthetic
- Changes limited to `product.html` and `styles.css`

This session had an interesting moment. A grep result came back mangled. Claude switched strategies without prompting:

> "The grep output got mangled. Let me read the actual product CSS section."

Tool choice is fluid. grep fails, Read takes over. This works naturally.

**Session 16 — Remove product-meta block** (12 tool calls)
- Triggered by KakaoTalk screenshot feedback from the client
- Full removal of `<dl class="product-meta">...</dl>`
- Associated CSS cleaned up in the same pass

**Session 17 — KakaoChannel integration** (18 tool calls, 2 edits)
- Added KakaoChannel link to `reservation.html`
- Verified `https://pf.kakao.com/_TuhCn` URL before wiring it in
- Applied `target="_blank" rel="noreferrer"`

**Session 18 — Remove HOME button from mobile drawer** (19 tool calls, 7 edits)
- Same pattern applied across 7 HTML files
- Brand link preserved, only the HOME row in the drawer removed
- CSS/JS cache-busting included

## Tool Usage Breakdown

| Tool | Count | Share |
|------|-------|-------|
| Read | 63 | 43% |
| Edit | 39 | 27% |
| Bash | 32 | 22% |
| Grep | 11 | 8% |

Read outnumbers Edit by 1.6x. This reflects the pattern of understanding current state before modifying it. Editing without reading first often breaks existing structure in ways that aren't immediately visible.

Bash's 32 calls were mostly commits, cache-bust verification, and file existence checks — not build or server operations. Static HTML means there's no build step to run.

## What 18 Sessions Taught About Prompt Design

**State constraints explicitly.** Negative instructions like "Do not edit files", "Do not commit/deploy", "Do not use Codex" lock the session scope. Without them, Claude tends to interpret scope broadly.

**Make it re-confirm prior work.** Session 14's prompt included:

> "Confirm the prior client request remains applied."

When implementation sessions iterate, earlier changes can regress. A re-confirmation check at session start prevents expensive rollbacks later.

**Define done with content, not intent.** "Ready to show the client" is too abstract. "No placeholder text visible on public pages" is a specific, checkable condition. The latter produces more accurate results.

## The Pattern

18 sessions total: 10 real work, 8 infrastructure validation. 145 tool calls for a small static site polish pass sounds like a lot — it's what the review-implement-reconfirm loop naturally produces.

Three things that made this work:
- Runner ping sessions before any implementation run
- Read-only review session to catch blockers before touching files
- One concern per implementation session, no exceptions

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
