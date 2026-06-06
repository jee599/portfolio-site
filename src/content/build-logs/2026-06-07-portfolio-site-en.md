---
title: "From 'Builder' to 'Studio': Repositioning an AI Portfolio Across 10 Files with Claude Code"
project: "portfolio-site"
date: 2026-06-07
lang: en
pair: "2026-06-07-portfolio-site-ko"
tags: [claude-code, astro, portfolio, repositioning, react]
description: "10 Astro file edits to shift positioning from solo AI builder to deliverables-first one-person studio — Hero, Capabilities, Projects, About, and SEO."
---

Ten file edits. No new features. Same projects, same stack, same author. The portfolio now reads like something a client can commission, instead of a public log of someone who codes impressively.

**TL;DR** — Rewrote positioning across 10 files: `Hero.tsx`, `About.astro`, `Capabilities.astro`, `Projects.tsx`, `home.ts`, `index.astro`, plus four more. Core shift: "solo AI builder" → "one-person AI product studio," with deliverables (MVP, automation, diagnostic report) front and center instead of stack or daily habit. Added `CaseStatus` type to the projects data layer, restructured the About CTA into a brief template, and updated the meta title in `index.astro`.


## The Headline Was Describing My Routine, Not the Client's Problem

The old Hero headline:

```
I build, fix, and operate AI products — every day.
```

That's my routine. It isn't the client's problem.

The eyebrow text read `independent AI product builder`. Accurate — but "builder" positions you as someone who makes things, often for themselves. "Independent" reinforces the solo developer frame rather than a professional entity that takes briefs and delivers.

The rewrite:

```
Turning small business problems into AI products, automation, reports, and web MVPs.
```

Eyebrow: `one-person AI product studio`.

"Builder" → "studio" looks like a one-word cosmetic change. It's not. A builder makes things. A studio accepts commissions and ships deliverables. One person can absolutely run a studio — but the framing determines the entire client relationship from the first five seconds. Studio implies: there's a brief, a scope, a deliverable, a handoff. Builder implies: let me show you what I've been building.

The second frame is fine for a personal blog. It's the wrong frame for a portfolio that needs to convert.


## Two More Above-the-Fold Rewrites

**Meta block: stack → output**

Old:
```
stack: TypeScript · Next.js · Astro
```

New:
```
output: Products · Automation · Reports
```

Clients don't buy your stack. They buy what you produce with it. Stack details belong in project pages — not competing with the headline for attention in the above-the-fold meta line.

**Button order: portfolio-first → intent-first**

Old: `[View Projects]` → `[What I Do]`  
New: `[What I Do]` → `[Case Studies]`

The original order sent first-time visitors straight to the project gallery before they understood what I do. Flipping it matches how a real consulting conversation flows: establish intent first, then show proof. If the first CTA sends someone to your project gallery before they understand the frame, you've front-loaded proof without context — and proof without context is just noise.


## Why the Capabilities List Needed a Full Rebuild

The old four items:

1. AI products end-to-end
2. Business automation
3. **Small web products & sites**
4. **Build logs & technical writing**

Item 4 — "build logs & technical writing." Genuinely proud of this work. But it's not a deliverable clients can commission. Writing is a skill that enables other outputs; listing it in Capabilities signals "I document what I do" more than "here's what you can hire me for."

Item 3 — "small web products & sites." The word "small" undersells and pre-qualifies in the wrong direction. It frames the engagement as budget-constrained before any conversation starts.

The new four:

1. AI product / MVP
2. Business automation
3. **Diagnostic reports / HTML · PDF deliverables**
4. **Web / landing pages / operations tools**

Item 3 is where the real work happened. Diagnostic reports — structured audit reports for local businesses delivered as HTML or PDF — became a distinct, billable deliverable unit after running several of these: dental clinic ad performance audits, marketing channel coverage analysis, open-source design reports. This belongs in Capabilities. It has a clear input, a clear output format, and a repeatable pipeline.

"Small web products" → "web / landing pages / operations tools" removes the scope qualifier and describes the deliverable instead. A client scanning this doesn't care whether the scope is "small" — they want to know whether the output matches what they need.

The `ko_meta` display labels also got cleaned up. Internal project slugs (`uddental · contextzip · agentcrow`) got replaced with readable names (`Dental AI Ads · AgentCrow · dev.to mirror`). Slugs belong in routing logic, not in the section a potential client reads at 11pm deciding whether to send an email.


## The Data Model Shouldn't Lie About Project State

The old project status type in `home.ts`:

```typescript
status: 'live' | 'dev' | 'beta'
```

This flattened meaningfully different states into a single label. `fortunelab` was live with real traffic but mid-migration on the payment system — "live" was technically accurate but hid the fact that it was in active flux. `claudebook` was experimental with no users. `coffeechat` was parked indefinitely.

Added `CaseStatus` to `home.ts`:

```typescript
export type CaseStatus = '운영' | '검증' | '실험' | '보류';
// operating | validating | experimental | parked
```

In `Projects.tsx`, `cardMeta()` now checks `caseStatus` first before falling back to `status`. The change is backward-compatible — projects without `caseStatus` still render using the original field.

Also added `problem`, `did`, `output` fields to each project entry:

```typescript
{
  id: 'uddental',
  problem: 'Dental clinic ad performance was invisible — no structured audit existed.',
  did: 'Built a Claude Code diagnostic pipeline: scrape → score → generate HTML/PDF report.',
  output: 'Delivered 2 audit reports. One clinic renegotiated ad budget based on findings.',
}
```

These fields don't appear in the card view yet. They're in the data layer now so a project detail page can render a proper "Problem → What I Did → Output" structure without retrofitting the data model later. Deciding what to say about each project is the hard part — doing it once in a focused session beats scattering it across future editing passes.


## About Section: From an Email Address to a Brief Template

Old About CTA: email address sitting in the last line of body text. One line. No structure around it.

New — extracted into a `contact-panel`:

> When reaching out, include: the problem, the tools you're currently using, the deliverable you need, and your deadline.

This does two things. First, it pre-qualifies at the page level — people who send vague "let's grab coffee" messages rarely convert into actual work. Second, it communicates how I think about client engagements: problem-first, deliverable-defined, deadline-aware. Someone reading this knows whether they have enough context to reach out.

The spec line changed alongside:

Old: `available: consulting · freelance · speaking`  
New: `available: MVP · automation · diagnostic reports`

The first version lists engagement types — it describes the relationship structure. The second lists what you get — it describes the output. A client scanning the About section cares about output, not relationship taxonomy.


## The SEO Meta Title — Eight Words in Google's Snippet

In `index.astro`:

Old:
```
AI 프로덕트를 짓고 운영하는 한 사람
→ One person building and operating AI products
```

New:
```
AI 제품, 자동화, 리포트를 만드는 1인 스튜디오
→ One-person studio for AI products, automation, and reports
```

This is the line in Google's search snippet. The old version describes a personal habit. The new version describes a service. When someone searches for "AI product freelance" or "automation consultant," the snippet needs to answer "is this what I'm looking for?" in under ten words. The old title answered "what does this person do daily." The new title answers "what can I get from here."


## What the Claude Code Session Actually Looked Like

Ten files. Zero new files created.

Changed:
- 5 Astro components (`About.astro`, `Capabilities.astro`, `ShipLog.astro`, `Footer.astro`, `Topbar.astro`)
- 2 React components (`Hero.tsx`, `Projects.tsx`)
- 1 TypeScript data file (`home.ts`)
- 1 Astro page (`index.astro`)
- 1 CSS file (`home.css`)

The workflow with Claude Code was: `Read` to understand existing structure → identify what needed changing → `Edit` in targeted passes → verify in browser. No rewrites, no refactors unrelated to the goal, no new abstractions introduced just because they seemed cleaner.

The harder work was upstream — deciding what the reframe should be. "Studio, not builder" took time to commit to. It's not a copywriting decision; it's a commitment to a client model. If the framing says "studio," then everything else has to be consistent:

- The contact process (brief template, not open inbox)
- The deliverable labels (Products · Automation · Reports, not TypeScript · Next.js · Astro)
- The project statuses (operating vs. validating vs. parked, not live vs. beta)
- The capabilities list (what clients can commission, not what I personally enjoy doing)

That internal consistency is why it touched 10 files instead of just the headline.


## What Didn't Change

The projects are the same. The stack didn't change. The work I've actually done is identical to before this session.

Repositioning isn't inventing a new persona — it's being more accurate about which version of yourself the client is engaging. The build logs stay. The ship log stays. Technical writing is still central to how I work. It just moved off the Capabilities list (where it implied "hire me to write") and into the background (where it supports credibility without claiming to be a standalone billable deliverable).

The portfolio was telling a true story before. The edit was to tell it in the right order for the right reader.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
