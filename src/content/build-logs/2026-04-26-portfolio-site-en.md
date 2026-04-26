---
title: "Reverse-Engineering Claude Design's 422-Line System Prompt — And Porting It to a Local Skill"
project: "portfolio-site"
date: 2026-04-26
lang: en
pair: "2026-04-26-portfolio-site-ko"
tags: [claude-code, claude-design, reverse-engineering, skill, jidonglab]
description: "Nine days after Claude Design launched, its 422-line system prompt appeared on GitHub. I analyzed it, ported the methodology to a local Claude Code skill, and redesigned jidonglab.com in the same session. 150 tool calls."
---

Nine days after Claude Design launched, its entire system prompt appeared on GitHub. 422 lines. The commit timestamp matched the product launch date down to the minute.

**TL;DR:** I fetched the leaked Claude Design system prompt, analyzed its architecture, and ported its question methodology and context-collection patterns to a local Claude Code skill. Then used that skill to generate four jidonglab.com redesign variants in one session. 150 tool calls total.

## The session that started with six characters

The initial prompt was short: "claude design 코드 유출된거 찾아줘" — "find the leaked Claude Design code."

No URL. No repo name. No context beyond the product name.

The model's first pass went sideways — it searched local project files, dug through old Claude Code documentation. Without knowing what "Claude Design code leak" pointed to, it had no anchor. This is worth understanding as a pattern: a model without context doesn't know what it doesn't know. It fills the gap with the most plausible interpretation it can construct from the available surface area.

The second prompt fixed it. I added the domain: `https://claude.ai/design`. That was enough.

WebSearch surfaced it: `elder-plinius/CL4R1T4S/ANTHROPIC/Claude-Design-Sys-Prompt.txt`. The commit history has exactly two entries — file created on 2026-04-17 at 19:55, renamed at 19:56. Claude Design launched on April 17, 2026. The timestamps match.

## What 422 lines actually tell you

WebFetch pulled the full text. Analyzing it reveals a design philosophy, not just a product spec. The structure is more coherent than most system prompts — it reads like someone thought carefully about what "a designer AI" should actually mean.

**The identity framing**

The role is defined as "a professional designer who uses HTML as a tool." That framing is deliberate. It doesn't say "an AI assistant that can generate HTML" — it establishes HTML as the *medium*, not the output format. That distinction shapes everything downstream.

**HTML as the primary medium**

Regular Claude defaults to prose. HTML is available but optional — you ask for it, or the model infers you want it from context. Claude Design inverts this. HTML is the default output for everything: prototypes, slides, video storyboards, diagrams. Other formats are derived from HTML downstream, not generated directly.

This creates a consistent surface. Whether you're asking for a landing page, a presentation, or a 3D scene, you get HTML back. Conversion to PDF, PPTX, or Figma happens through export tools, not at generation time. The generation layer stays homogeneous.

The practical implication: every output is immediately renderable in a browser. No "here's the code, now copy it somewhere to see it" step.

**Tool taxonomy (schemas were fully public)**

The prompt includes complete tool schemas — not just names but parameter structures, field types, constraints, and return types.

Generation tools (7): `createArtifact`, `generateImage`, `createPresentation`, `createVideo`, `create3DScene`, `createUI`, `createDiagram`.

Export tools (6): `exportToPDF`, `exportToPPTX`, `exportToFigma`, `exportToCode`, `createSite`, `exportToVideo`.

Reading the parameter schemas is where the actual reverse engineering happens. `createVideo` accepts duration bounds and a storyboard structure. `create3DScene` takes scene graph parameters. `createPresentation` enforces slide count constraints. These schemas reveal the real design decisions — what the team chose to expose, what they kept opaque, and where they drew the line between user control and model autonomy.

**The question methodology**

Claude Design doesn't generate immediately on request. It asks first. The system prompt includes a structured sequence that collects:

- Intent and goal
- Target audience
- Emotional tone and aesthetic keywords
- Reference examples or inspiration
- Technical constraints (output format, dimensions, target platform)
- Brand guidelines if applicable
- Success criteria

This isn't conversational padding. It's a signal extraction protocol. The questions bound the possibility space before any tokens go toward output. A user who writes "make me a landing page for my SaaS" has described a category of output, not a specification. The question methodology converts descriptions into specifications before generation begins.

## Designing the local port

The porting goal was precise from the start: extract the transferable methodology, drop the host-dependent features.

Claude Design runs on Claude.ai infrastructure. Live Preview (real-time HTML rendering in the sidebar), Tweaks (iterative adjustments via direct manipulation), and the native export pipeline all require the platform layer. These aren't portable.

What is portable:

1. The question methodology — structured context collection before generation
2. The HTML-first output philosophy — treating design output as HTML regardless of final format
3. The AI-slop prevention guardrails — specific instructions that push output away from generic patterns
4. The pre-invocation decision logic — should the skill even activate for this request?

Result: `~/.claude/skills/claude-design-lite/` with three files.

**SKILL.md**

The skill opens with three self-checks before the question phase runs:

1. *Is this actually a design task?* A "build me a button component" request doesn't need questions about emotional keywords. If the request is mechanical and well-specified, skip to generation.
2. *Has the user already given sufficient context?* If someone pastes a detailed brief, the question phase is redundant.
3. *Is this a follow-up or a fresh start?* Mid-session iteration — editing a variant, adjusting one element — should not restart the question sequence.

These three gates prevent the skill from becoming annoying, which is the most common failure mode for structured workflows. A workflow that interrupts more than it accelerates gets abandoned. The gates are what separate a skill that gets disabled after one use from one that becomes part of the default workflow.

**reference/question-templates.md**

Ten context questions extracted from Claude Design's methodology, each tagged with what information it collects and why that matters for generation quality. Designed to be used selectively — pull the relevant questions for the specific request, not all 10 every time.

**reference/starter-kit.html**

A base HTML skeleton with structural patterns that consistently produce non-generic output. Specific CSS custom properties for spacing and type scale, semantic markup conventions, placeholder patterns for common design output types. Every generation starts from an established convention, not a blank file.

## The jidonglab redesign as stress test

"Redesign jidonglab.com" was the validation prompt. Deliberately underspecified — no reference links, no existing design system, no stated goals.

The skill fired 10 questions. Answers were kept deliberately minimal: one word or one character per response. "No existing identity", "all visitors", "toss green", "c". The test was whether structured questions can extract enough signal from low-effort answers to produce useful first variants. They can.

Four variants came back:

**v1-notebook.html** — notebook metaphor, heavy visual weight, typographically dominant. Reads as considered on first glance, dated by the second. Rejected.

**v2-pro.html** — tech portfolio direction with an activity heatmap and contribution statistics as the hero element. This one generated the most discussion.

"Is the heatmap data real?"

It wasn't. Hardcoded placeholders. This is a failure mode worth flagging explicitly: when a design includes data visualization that resembles a familiar pattern — GitHub contribution graph, in this case — the prototype's placeholder values read as real data. Visual familiarity creates an implicit authenticity assumption. Nobody questions whether lorem ipsum is real text, but a contribution heatmap that looks like GitHub's immediately triggers "wait, is that my actual data?"

**v2-studio.html** — studio aesthetic, lower information density, cleaner hierarchy.

**v3/home.html** + **hero-variations.html** — minimal and trendy direction, multiple hero section experiments in a single file.

After v2-pro, the iteration loop intensified: "simpler, more trendy, and the heatmap needs real data." Most of the session's 37 Edit calls came from this phase. The heatmap data question didn't stay a design question — it became an engineering requirement.

The session ended with `src/pages/api/now.ts`, a new API endpoint pulling real GitHub activity data to feed the heatmap component. The redesign process surfaced a missing data layer piece that wouldn't have been obvious from a pure engineering perspective. That's the most useful outcome from the session.

## Tool call breakdown

| Tool | Count | Notes |
|---|---|---|
| Bash | 43 | Mostly `open` for browser preview + dev server starts |
| Edit | 37 | Real code changes, concentrated in iteration phase |
| Write | 15 | New files — HTML variants, new API endpoint |
| Read | 13 | Reading existing files for context |
| WebSearch | 11 | Leak discovery + cross-referencing |
| WebFetch | 5 | Fetching the system prompt, official docs |
| Other | 26 | Glob, Grep, directory operations |
| **Total** | **150** | |

Bash 43 is notable: the majority were `open [filename].html` commands to render variants in the browser. You can't evaluate layout from a diff. The review loop for design output is fundamentally visual — write HTML, open in browser, assess, edit, repeat.

Edit 37 being the second-highest count confirms where the actual work happened: not in generating initial variants, but in the iteration cycle after feedback.

## Reverse engineering isn't about reading code

The instinct is to think reverse engineering means finding the implementation and working backward. System prompt reverse engineering is different. There's no source code. The prompt *is* the implementation.

What you can read from a system prompt is behavioral contracts enforced through structure:

- What tools exist, and what their schemas require
- What output formats are valid, and which is the default
- What the model will and won't do in given situations
- What questions it asks before acting, and why

These aren't implementation details. They're design decisions made explicit. The 422 lines of Claude Design's system prompt contain a clearer statement of product intent than most PRDs do — because the prompt *is* the product behavior. There's no gap between specification and execution.

Porting to `claude-design-lite` wasn't about producing identical output on different infrastructure. It was about replicating the reasoning structure: the same pre-generation questions, the same HTML-first philosophy, the same decision gates that determine when context collection is necessary.

Different platform. Different constraints. Same thinking.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
