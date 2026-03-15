---
title: "Building a Dental Clinic Website in 8 Minutes with Claude Code"
project: "uddental"
date: 2026-03-16
lang: en
pair: "2026-03-16-uddental-ko"
tags: [next.js, typescript, claude-opus, frontend-design, v0]
description: "Claude Code built a complete dental clinic website in 8 minutes: 17 files, 10 routes, zero build errors. Then two more sessions were spent discovering what AI tools cannot do."
---

The entire AI website build took 8 minutes. 17 files, 10 routes, zero build errors. These numbers demonstrate the speed of Claude Code for frontend work. The problem came afterward -- an additional requirement to "generate design mockups with a design AI first" consumed two more sessions and produced nothing.

**TL;DR**: A clear brief plus explicit reference file paths in the prompt makes Claude Code frontend work an 8-minute job. External service integrations (v0, etc.) require verifying feasibility before requesting execution.

## 8 Minutes, 17 Files, Zero Build Errors

The prompt was straightforward:

```
Read the project brief and proceed with planning/design + implementation.
Required references: project-brief-korean-simple-pro.md, data.md, photo/
Requirements:
1) Write a planning/design document: PLAN.md
2) Implement pages with Next.js + TypeScript (simple + professional + friendly Korean dental clinic tone)
3) Minimum pages: Home, About, Services, Doctors, Facilities/Equipment, Location/Hours, Consultation/Booking
```

Read 19, Write 17, Bash 7. Total 51 tool calls. Session length: 8 minutes.

Claude started by surveying the entire photo directory. 3 exterior shots, 4 hallway/treatment room images, 3 Vatech CT equipment photos, 1 waiting room, 3 reception desk images, 1 hours signboard. After cataloging all 17 photos, it wrote `PLAN.md` and immediately started building.

The output was surprisingly polished. Navy and mint color scheme with Pretendard font. All 16 real photos placed in Hero sections, galleries, and individual pages using actual file paths. Mobile-first responsive design with hamburger menu and 1-to-2-to-3 column grid transitions. Running `next build` produced zero errors across all 10 routes.

Under `~/uddental/implementations/claude/app/`: `layout.tsx`, `globals.css`, `page.tsx` (home), and 6 subpages. Header and Footer components included, 17 files total delivered in a single pass.

## "Generate Mockups with v0 First" -- An Unexecutable Requirement

Two minutes after the first session, an additional requirement arrived:

```
Design must reflect results from a design-specialized AI.
At minimum, generate 2-3 home mockups with v0 (or equivalent design AI) first,
then implement based on those.
Document which design AI mockups were referenced in PLAN.md or README.md.
```

Claude spent Read 5 and Bash 4 calls understanding the project structure. Then it stopped:

> "v0.dev is an interactive service requiring authentication -- direct API calls are not feasible."

Two options were proposed. Option A: use the `frontend-design` skill to generate v0-style mockups internally. Option B: the user generates mockups in v0 and shares screenshots. The session ended there. 10 tool calls, 0 minutes of productive output.

## Trying Vercel MCP for v0 Access -- Also Not Possible

One minute later, the same additional requirement came in again. Claude spent Read 9 and Bash 2 calls re-examining the full project. Then it attempted to reach v0 through Vercel MCP tools:

```
Approach:
1. Generate 3 mockups with v0 -- send prompts to v0 via Vercel MCP tools
2. Analyze mockups -> make design decisions
```

One Agent tool call was made, but direct v0 access proved impossible. The session ended in 2 minutes.

## Read 33, Write 17 -- Understanding Comes Before Building

Across three sessions, 73 total tool calls. Read at 33 calls was the highest. The data shows more time spent on context understanding than implementation.

All 17 Write calls happened in the first session. The second and third sessions had zero Write calls. When requirements are unclear or infeasible, Claude focuses on understanding and verification rather than writing.

The first prompt was clear, so all implementation completed in session one. The "generate v0 mockups first" requirement was outside Claude's execution scope, and two sessions were effectively wasted.

## Cross-Tool AI Collaboration Is Still Manual

Claude Code excels at code writing and filesystem operations. Directly accessing external services like v0 is not possible. Web services requiring authentication remain inaccessible even through MCP.

"Reflect design AI mockups in the implementation" is a reasonable requirement in principle. But the execution method needs to be explicit. Either use the `frontend-design` skill to generate mockups within Claude, or generate mockups in v0 separately and provide screenshots/code as context.

The 8-minute first session produced all the core value. 17 real photos powering a Korean dental clinic website in Next.js. `next build` with zero errors. The two additional sessions confirmed tool limitations and nothing more.

## Reference File Paths in the Prompt: That Is What Makes 8 Minutes Possible

Specifying the brief document and photo directory as reference files was the key enabler. Claude could examine all 17 photos individually and embed real paths in the code because the prompt said "look at the photo/ directory" from the start.

The "generate v0 mockups first" instruction had incomplete execution conditions. Requesting a process without verifying tool access leads to Claude either stopping or asking for workarounds. Next time, the prompt should read: "use the frontend-design skill to generate 3 mockups instead of v0, pick one, and implement based on it."

---

## Related Posts

- [Building a Mentoring Platform with 10 AI Agents: 6 Sessions, 1,289 Tool Calls](/posts/2026-03-15-coffee-chat-en)
- [Turning 105 Session Logs into Build Logs: A Claude Code Automation Pipeline](/posts/2026-03-15-portfolio-site-en)
- [Building a Multi-Agent LLM Orchestrator with Claude Code: 86 Sessions of Hard-Won Lessons](/posts/2026-03-15-LLMTrio-en)
