---
title: "Reverse-Engineering Claude Design's 422-Line System Prompt Into a Local Claude Code Skill"
project: "portfolio-site"
date: 2026-04-26
lang: en
pair: "2026-04-26-portfolio-site-ko"
tags: [claude-design, reverse-engineering, skill, redesign, claude-code]
description: "Claude Design's system prompt leaked on GitHub the day it launched. I reverse-engineered 422 lines into a local Claude Code skill — 87 hours, 150 tool calls, 6 redesign variants."
---

The day `claude.ai/design` launched, its 422-line system prompt appeared on GitHub. Not inferred from probing. Not reconstructed from outputs. The full behavioral contract — every constraint, every tool schema, every interaction rule — committed at 19:55 on April 17, 2026, within hours of the product going live.

**TL;DR**: I reverse-engineered the leaked prompt, extracted Claude Design's core interaction model, and ported the useful parts into a local Claude Code skill. As a side effect: 6 jidonglab.com redesign variants fell out of the test run. Total: 87 hours and 22 minutes, 150 tool calls on `claude-opus-4-7`.

## How 422 Lines Ended Up on GitHub the Day of Launch

Claude Design is an Anthropic Labs product — not an update to the standard Claude interface, but a standalone workspace. It launched April 17, 2026. The defining characteristic: HTML is the native output format. Slides, dashboards, prototypes — everything ships as `.html` rather than markdown or component code. Pro/Max/Team/Enterprise only.

The repository `elder-plinius/CL4R1T4S` had been accumulating leaked system prompts before Claude Design launched. `Claude-Opus-4.7.txt` was there from April 16. `Muse_Spark` from April 8. On launch day, `Claude-Design-Sys-Prompt.txt` joined the collection. Exactly two commits in its history: create (19:55), rename (19:56). No mirrors, no forks — the original.

At 73KB, this is a dense behavioral specification. If you've only seen small system prompts, the scale is worth noting: this isn't a persona description or a list of rules. It's a full product spec implemented as natural language.

## What You Can Extract From a Behavioral Contract

Source code wasn't leaked. What leaked was the *contract* — the rules the model must follow. From a contract, you can reconstruct intent and often the implementation assumptions underneath it.

Key extractions from the 422 lines:

**Role definition**: "A professional designer who uses HTML as a tool." The user is the manager, the model is the implementer. This framing is deliberate — it shapes how the model handles ambiguity. A professional designer makes opinionated decisions; an AI assistant asks clarifying questions. The framing prevents the second behavior.

**Output canonicalization**: Everything is HTML. Decks, mockups, interactive prototypes — all rendered as `.html`. No markdown, no components, no format negotiation. If you can't express a design decision in HTML, you redesign until you can. The constraint is the discipline.

**Filesystem conventions**: `<relative path>` naming throughout. Other projects live under `/projects/<name>/`. Predictable structure enables stable references across sessions and parallel variant generation.

**13 explicit built-in capabilities**: File read, file write, directory traversal, browser preview, and 9 others. Knowing the tool surface tells you what the model can rely on without additional scaffolding — and where the edges of what's possible are.

**Brief extraction before implementation**: This is the part worth porting. Standard prompting: user types requirement → model builds thing. Claude Design: user types rough direction → model asks 10 structured questions → context established → model builds thing.

The 10 questions aren't conversational padding. They're structured to extract:
- Visual reference points
- Constraint scope (exploratory vs. hard requirements)
- Audience context
- Success definition
- Divergence budget

Front-loading disambiguation reduces revision cycles. Any good creative brief does this — the unusual thing is seeing it enforced at the system prompt level.

## What Doesn't Port and What Does

Claude Design has host-dependent features that can't be replicated in Claude Code. Live Preview requires a browser runtime. Tweaks mode hooks into the workspace UI. The native export pipeline integrates with a specific artifact rendering layer. All three got dropped.

Three things port cleanly:

**1. The questioning protocol**

10 structured questions, now living in `reference/question-templates.md`. The skill reads this before starting any design task and runs the relevant questions before touching a file.

The questions aren't meant to be run as a fixed script. The skill checks three gates first:

> Is this a simple markup change or refactor? → Skip the questioning protocol  
> Did the user already provide rich context? → Condense or skip questions  
> Is this a follow-up? → Skip questions, go directly to revision  
> Is this a new exploration? → Full protocol  

The gates exist because the most common failure mode for structured workflows is becoming annoying. A workflow that interrupts more than it accelerates gets abandoned. The three checks are what separate a skill that gets disabled after one use from one that becomes part of the default workflow.

**2. Variant generation strategy**

One brief, multiple directions in parallel. The brief stays consistent; the directions diverge. Running variants simultaneously surfaces tradeoffs that sequential iteration hides — you discover you're comparing incompatible directions early, rather than after three rounds of revision that were never converging.

**3. Anti-slop rules**

The original prompt has an explicit list of visual clichés to eliminate. Extended into a pre-output checklist that runs before any file is written:

- No gradient hero with centered white text
- No floating card with hover shadow as the primary interaction
- No stock photo background with text overlay
- No glassmorphism by default
- No icon grid without clear information hierarchy

The final skill structure:

```
~/.claude/skills/claude-design-lite/
├── SKILL.md                        # Skill definition + activation conditions
└── reference/
    ├── question-templates.md       # 10-question brief protocol
    └── starter-kit.html            # Clean HTML boilerplate
```

The "Mocking from scratch" approach from the original prompt was kept as-is: when given a redesign task, ignore the existing design. Start from the brief. The goal is genuinely new output — not incremental improvement of what exists.

## The jidonglab Redesign That Came Out of the Test Run

Skills need real inputs. jidonglab.com went through the full protocol.

The prompt: "v2 looks decent — is there more we could push toward?" That triggered the full skill: 10 questions → 3 parallel directions → one selected → detail pass. One brief, six variants total.

| Variant | Concept | File |
|---|---|---|
| v1 | Notebook | `v1-notebook.html` |
| v2a | Pro Studio | `v2-pro.html` |
| v2b | Studio Dark | `v2-studio.html` |
| v3a | LabOS | `v3-labos.html` |
| v3b | Home | `v3/home.html` |
| v3c | Hero variations | `v3/hero-variations.html` |

One output that went beyond the initial brief: a GitHub-style activity heatmap. The stated requirement was "one screen, one year of data — commits, posts, and build logs." The heatmap UI generated in the first pass. More usefully, the session also produced `src/pages/api/now.ts` — an endpoint aggregating live data from three sources:

- GitHub API: commit history by day
- Astro content collection: post publish dates
- Build log frontmatter: date fields

One surface, three live sources, zero manual entry. The data layer materialized because the design made it necessary — without the heatmap prototype, the missing endpoint wouldn't have been obvious.

This is where "mocking from scratch" pays off in practice. v3a (LabOS) came from asking "if this wasn't a portfolio site, what would it be?" The answer: a personal OS — logs, current projects, active stack, recent activity on one screen. That direction wouldn't have surfaced from incremental iteration on v2. The brief-from-scratch approach forces confrontation with the structural assumptions of the current design, not just its surface.

## Session Numbers

- Total time: 87 hours 22 minutes (`claude-opus-4-7`)
- Total tool calls: 150

| Tool | Calls |
|---|---|
| `Bash` | 43 |
| `Edit` | 37 |
| `TaskUpdate` | 12 |
| `Write` | 15 |
| `Read` | 13 |
| `WebSearch` | 11 |
| `TaskCreate` | 6 |
| `WebFetch` | 5 |

11 `WebSearch` calls is high relative to the implementation volume. The breakdown: cross-referencing the leaked prompt against public Claude Design documentation, verifying the April 17 launch date, confirming the `elder-plinius/CL4R1T4S` commit history, checking that `Claude-Design-Sys-Prompt.txt` was the original upload and not a mirror.

This was a research-first session. The leaked material needed validation before anything could be built on its conclusions. If the timestamps were off, or the prompt had been modified from production, the extraction would be wrong. The 11 searches weren't overhead — they were what made the rest of the session valid.

12 files generated. 1 modified — `src/content/build-logs/2026-04-26-portfolio-site-ko.md`, the Korean version of this post.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
