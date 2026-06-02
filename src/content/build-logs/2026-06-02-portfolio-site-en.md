---
title: "Porting Open Design to Claude Code: One Hook, 104 Tool Calls, Zero Cloud Dependency"
project: "portfolio-site"
date: 2026-06-02
lang: en
pair: "2026-06-02-portfolio-site-ko"
tags: [claude-code, open-design, hook, skill, automation, design-system]
description: "I ported claude.ai/design's open-source engine to Claude Code locally. One hook, three skill files, two HTML deliverables. Here's what 5 sessions and 104 tool calls look like."
---

Session 3 alone consumed 70 tool calls and ran for 1 hour 21 minutes. That was the core porting session — reading the Open Design repo structure, extracting the actual engine prompt files, and mapping them to Claude Code skill format. Not because it was hard, but because I was doing it right: reading source, not guessing.

The question that started it: *why is claude.ai/design cloud-only?*

The underlying engine — Open Design — is open source. The answer turned out to be: it doesn't have to be.

**TL;DR** I ported Open Design's discovery → 5-direction → design-system → build → 5-axis review loop into Claude Code as a local skill. Added a `UserPromptSubmit` hook (`design-router.sh`) that auto-routes visual requests through the OD pipeline — no "design" keyword required. Five sessions, 104 tool calls, one hook, three skill files, two HTML report deliverables.

## The Request That Made It Obvious

The prompt was direct:

> "I like Open Design. Can we make every design request go through that route? It's open source, so implement it locally."

Followed immediately by:

> "Make it automatic — even if I don't explicitly say 'design', it should route there."

Two distinct problems emerged: porting the actual OD engine prompt logic, and building a detection mechanism that doesn't require the magic word.

## Dissecting the Open Design Engine: RULE 1/2/3

Reading the Open Design repo, the loop has three layers:

**RULE 1 — Discovery first.** Before writing a single line of code, `AskUserQuestion` confirms deliverable type, platform, brand constraints, and tone. Direction gets locked in before execution begins. "Make it look good" is not an acceptable spec.

**RULE 2 — Five visual directions.** Each direction comes with a concrete OKLch color palette, typeface pairing, and layout principle. Vague requests ("make it feel premium", "something modern") get resolved into specific, comparable options the user can actually choose between.

**RULE 3 — Design system binding → build → P0 checklist + 5-axis self-review.** After the build, the model audits its own output across five axes: visual consistency, accessibility, mobile behavior, interaction quality, and emotional resonance. This runs before calling the work done.

The port was exact because Open Design publishes its actual prompt files. No reverse engineering. Read the source, transcribe to Claude Code skill format, verify with a test run.

Generated files:
- `~/.claude/skills/open-design/SKILL.md`
- `~/.claude/skills/open-design/reference/charter.md` — anti-slop rules
- `~/.claude/skills/open-design/reference/directions.md`

`charter.md` is the one that matters most for output quality. It doesn't list what to do — it lists what's banned, conditionally. Not "avoid gradients" but "gradients only when they serve a specific depth or state signal." Not "no dashboards" but "no fake dashboards with placeholder metrics that don't belong to the actual product." The distinction between a positive rule and a conditional ban is what prevents cargo-culting.

## The Hook: Detecting Visual Work Without "Design"

The harder engineering problem was auto-routing. A `UserPromptSubmit` hook runs before every Claude Code session starts processing. `~/.claude/hooks/design-router.sh` scans incoming prompts for visual work signals:

Keywords that fire the hook: "landing", "dashboard", "mockup", "slides", "prototype", "redesign", "wireframe", "poster", "card", "banner", "app screen", "pitch deck".

When matched, it injects a routing message that surfaces the OD skill and reminds Claude to follow RULE 1→2→3.

The routing rule is also pinned in `CLAUDE.md`:

> "Visual/UI design artifacts (landing pages, pitch decks, dashboards, prototypes, mockups, slides, posters, banners, app screens, components, and redesigns — even when the word 'design' is never said) default to the `open-design` skill. Follow RULE 1→2→3."

Config file over memory. Session changes don't drift the behavior. A rule written in memory can be forgotten or overridden by context pressure; a rule in `CLAUDE.md` loads at session start every time.

The current rough edge: "API design" and "DB schema design" are false positives the keyword list can catch. Those are non-visual work. Narrowing the classifier — adding an exclusion list for "API", "schema", "architecture" adjacent contexts — is the next improvement.

## First Live Test: Soho Diagnostic Report Redesign

The hook's first production run came the day after setup:

> "Redesign this as a mobile-friendly diagnostic report a small business owner can understand in 30 seconds — free version and paid deliverable template. No fake dashboards. No AI-looking card designs."

OD route kicked in. RULE 1 confirmed deliverable format (HTML/PDF export), target audience (non-technical business owner), and constraints (mobile-first, 30-second comprehension). Two HTML files came out:

- `free-diagnostic-report.html` — leads with the problem, drives toward a purchase decision
- `paid-deliverable.html` — leads with the solution, structured as a copy-pasteable action plan

Same content, opposite information hierarchy. The free version asks "what's wrong with your business?" The paid version answers "here's exactly what to do about it." The framing difference *is* the product.

Session 5 came back with CSS refinements on the paid report: heavier emphasis on key callouts, slightly wider margins for breathing room. Not a redesign — just CSS. The right call was to skip OD discovery entirely and edit the file directly.

That judgment call — when to run the full OD loop versus when to just edit — matters as much as the loop itself. Forcing discovery when the scope is already defined adds friction without value.

## Tool Call Distribution Across 5 Sessions

| Tool | Count |
|---|---|
| Bash | 32 |
| Read | 27 |
| Edit | 21 |
| Write | 10 |
| WebSearch | 5 |
| AskUserQuestion | 4 |
| WebFetch | 2 |
| ToolSearch | 2 |
| **Total** | **104** |

Four `AskUserQuestion` calls is the OD fingerprint. The discovery phase is explicit and mandatory — direction gets confirmed before anything gets built. This is unusual compared to typical Claude Code sessions where `AskUserQuestion` shows up once or not at all.

Session 3 alone: 70 tool calls, 1 hour 21 minutes. The breakdown inside that session was heavy on Bash (repo exploration) and Read (extracting actual prompt content from OD source files). The Edit and Write calls at the end were fast because the reading was thorough.

## Side Quest: The CCA Exam Is Partners-Only

Session 4 detoured into investigating Anthropic's Claude Certified Architect exam — CCA, launched March 2026. The first official Anthropic technical certification. Stats: 301-level, 60 questions, 120 minutes, 720/1000 to pass.

The catch: CCA is **restricted to Claude Partner Network member organizations**. Skilljar gates the checkout behind a partner-verified email. You need `claude.com/partners` approved before you can even pay for the exam.

The chicken-and-egg problem for solo developers: the official requirement is "an organization bringing Claude to market" — loosely defined — but the partner track in practice requires existing client references or a demonstrated customer base. Independent developers actively building Claude-powered products are in an ambiguous middle ground.

Not a blocker, but worth knowing before expecting the exam to be publicly available.

## What Actually Made the Port Fast

1 hour 21 minutes for the core session — not because the work was simple, but because Open Design publishes its actual prompt files. The porting process was reading and transcribing, not inferring and guessing. When the source is readable, the port is accurate.

The constraint that saved time: I didn't try to abstract or improve the OD loop during porting. The goal was fidelity first — get the same loop running locally, then iterate. Adding "improvements" during a port is how ports break.

The constraint that would have saved more time: knowing upfront that `charter.md` conditional bans matter more than positive rules. I wrote a version with a flat list first, then rewrote it to conditional form. That rewrite was avoidable.

## What's Left

`design-router.sh` keyword matching is the known rough edge. Current false-positive surface:

- "Can you help me design the API schema?" → should not trigger OD
- "Let's design the database structure" → should not trigger OD
- "Redesign the auth flow" → ambiguous (could be UI, could be logic)

The fix is an exclusion layer before the keyword match: if the prompt contains "API", "schema", "architecture", "data model", or "system design" within N words of the trigger keyword, skip the OD route. A more robust approach would classify the entire prompt intent rather than matching individual words, but that adds latency to every session start.

Open Design running locally means the full design workflow — discovery, direction selection, system binding, build, review — happens in the same environment as the code it produces. No context switch to a cloud tool, no copy-pasting between interfaces. That was the goal.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
