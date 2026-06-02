---
title: "4 Sessions, 58 Tool Calls, Zero Edits — Then a Full Portfolio Redesign in One Shot"
project: "portfolio-site"
date: 2026-06-02
lang: en
pair: "2026-06-02-portfolio-site-ko"
tags: [claude-code, redesign, worktree, astro, portfolio]
description: "Redesigned jidonglab.com from personal logbook to product-studio pitch using Claude Code worktrees — 58 tool calls of exploration before a single file was touched."
---

Before Claude Code modified a single file in my portfolio, it had already made 58 tool calls across 4 sessions. Every session ended the same way: read the file tree, read the components, check the data layer, session ends. Zero edits.

That pattern repeated four times in a row — sessions 6, 7, 8, and 9. And yet the implementation session that followed moved fast, with fewer reads than you'd expect for a first pass across 12 components. The 58 exploration calls weren't wasted. They were front-loaded context that made the implementation lean.

**TL;DR** Redesigned jidonglab.com from "personal logbook" to "product-studio pitch." Entire implementation ran inside a `claude/jidonglab-redesign-compare` worktree — main branch untouched throughout. Implementation session: 92 tool calls total — Edit ×28, Read ×24, Bash ×21, Write ×5, TaskCreate ×5. Before any of that: fixed a Claude Code hooks format mismatch flagged by `/doctor`.

## Why Claude Code Spent 4 Sessions Reading Without Editing

Sessions 6 through 9 all terminated without a single file change. The pattern was identical each time: traverse the file tree, read the components, inspect the data layer, end session.

The root cause was how tasks were being delivered. Work instructions came in through a Hermes cron job — a brief file (`jidonglab_portfolio_redesign_brief.md`) dropped into `/tmp`, then piped into the prompt. The early sessions had analysis-oriented prompts: *"Assess the current state and draft a redesign plan."* With that framing, exploration followed by a written proposal was the correct response.

The shift happened in session 8, when the prompt explicitly added: **"Do not only propose a plan."** Even then, the first actual file edit didn't land until session 13, when the worktree was properly isolated.

This is a real Claude Code workflow consideration. The distinction between *"analyze this"* and *"implement this"* isn't implicit — it has to be in the prompt. The default behavior when asked to assess something is to assess it, not change it. If you want code written, say so explicitly.

## One Decision Before Writing Code: Worktree or Not?

The redesign brief called for significant directional change — not a tweak, but a repositioning of what the homepage communicates. Before implementation started, there was a choice: work directly on `main`, or isolate in a worktree.

The decision was worktree.

A new directory `portfolio-site-claude-redesign/` was created, checked out on branch `claude/jidonglab-redesign-compare`. All implementation happened there. The `main` branch was never touched from start to finish.

For a redesign where you're genuinely unsure whether the output will be what you want, worktree isolation is the right default. The cost is low. The upside is real: if the implementation goes sideways, you delete the worktree. You can run both versions side-by-side to compare. The decision to deploy is decoupled from the decision to implement.

The changes live in `claude/jidonglab-redesign-compare`. Whether they get merged to main is a separate question, decided after reviewing the result — not before.

## The Doctor Ran First

As soon as the worktree session opened, `/doctor` flagged a warning:

```
hooks.SessionStart.0.hooks: Expected array, but received object
```

The `SessionStart` hook was using the old flat format. Claude Code had updated its hook group schema, and the config hadn't caught up.

```json
// old (flat)
{ "command": "bash protect-files.sh" }

// new (group)
{ "hooks": [{ "command": "bash protect-files.sh" }] }
```

`.claude/settings.json` was itself protected by `protect-files.sh`, so patching it required an explicit approval prompt. That was granted, the format was fixed, and then the actual implementation work started.

Fix your environment before starting substantive work. A misconfigured hook silently misfires; catching it with `/doctor` at session start is faster than debugging unexpected behavior mid-implementation.

## Turning a Logbook Into a Pitch

The existing homepage was built around a "paper/ink editorial logbook" aesthetic — clean, personal, considered. The problem wasn't the execution; it was the signal. A visitor trying to answer *"what does this person actually do and can I work with them?"* had to dig.

The redesign brief was direct:

> "Redesign so it works as Jidong's personal portfolio/business-card site, not a passive project archive."

The implementation worked component by component.

**`Hero.tsx`** — copy rewritten. Instead of enumerating a tech stack, it leads with the problem being solved. What category of work, what kind of outcome.

**`Capabilities.astro`** — reorganized from a tools list into a capability framing. What results can this person produce, not which tools do they know.

**`About.astro`** — tone shifted from resume-style biography to collaboration-oriented framing. Who this is for, not just who this is.

**`Contact.astro`** — new component, didn't exist before. The original site had no explicit CTA. A visitor who wanted to reach out had to go looking for contact info. This section makes the action explicit and removes the friction.

**`Method.astro`** — new component. Describes how the work happens, not just what work has been done. A project list tells you what someone has shipped. A working method section tells you what it's like to work with them — which is what a hiring manager or potential collaborator actually needs.

`home.ts`, the data layer, was updated in full. Every string the components pull from was rewritten to match the repositioned messaging.

10 components modified, 2 new components created.

## The Implementation Session by the Numbers

Session 13. 92 tool calls total.

| Tool | Count |
|---|---|
| Edit | 28 |
| Read | 24 |
| Bash | 21 |
| Write | 5 |
| TaskCreate | 5 |

The Read count at 24 is relatively high for an implementation session — but makes sense given the Astro + React hybrid architecture. When you change one component in this stack, you trace prop flow through the data layer, check TypeScript types, and verify nothing breaks downstream. A single component edit can ripple into `home.ts`, type definitions, and sibling components. Each ripple requires a Read before an Edit.

The 5 TaskCreate calls were background tasks: `npm ci` install, build verification, changed-file validation.

Bash at 21 calls — more than half were build checks. `npm run build` ran repeatedly throughout the session, not just at the end. Catching a type error or Astro compilation failure immediately after the relevant Edit is faster than debugging a pile of errors at the end. The build is cheap; running it often pays for itself.

## What 58 Exploration Calls Actually Bought

Four sessions with no file edits looks like wasted effort. The counter-evidence is in the implementation stats: Read appeared 24 times, not 50+. That's lower than expected for a first-time implementation across 12 components.

Sessions don't share context — each one starts cold. The implementation session had no memory of what sessions 6 through 9 had read. What it did have was a redesign brief that had been iteratively refined by those exploration sessions. The Hermes relay continuously updated the brief file with findings from each session. By session 13, the brief encoded the codebase structure, component dependencies, and data flow — concretely enough that the implementation could move directly into Edits.

> The 58 tool calls in exploration were spent buying down the Read count in implementation.

Front-loading context through a shared brief file is a viable substitute for shared session memory. It's not as efficient as true persistence, but it works. The key is the brief being updated between sessions rather than starting from scratch each time.

---

The changes are on `claude/jidonglab-redesign-compare`. Local review, then merge decision. That's the point of the worktree strategy — implementation complete and deployment decision are two separate steps.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
