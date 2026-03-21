---
title: "I Redesigned My Portfolio Projects Page 4 Times in One Day with Claude Code"
project: "portfolio-site"
date: 2026-03-22
lang: en
pair: "2026-03-22-portfolio-site-ko"
tags: [claude-code, astro, ui-ux, portfolio]
description: "Four complete redesigns in a single day: screenshot cards → hover overlays → split panel → iframe preview. What happens when AI automation makes iteration nearly free."
---

Four complete redesigns. One day. Same page.

On March 21, I rebuilt the Projects section of my portfolio from scratch four times. Browser mock screenshot cards, hover overlay reveals, a Finder-style split panel, and finally an iframe live preview. Each iteration took 20–40 minutes with Claude Code.

Without it, this would've been a week of work.

**TL;DR**: When Claude Code compresses iteration cycles to under an hour, speed stops being the constraint. Knowing when to stop and ship becomes the hard part.

## The Starting Point: Browser Mock Screenshots Looked Great on Paper

The first approach was inspired by the pattern you see on Notion's, Linear's, and Vercel's landing pages — product screenshots inside browser chrome frames, with a slow scroll-on-hover animation. When done well, it looks polished and instantly communicates "this is a real product."

My prompt:

```
Active projects: browser mock + scroll animation screenshot
Hero: centered layout + badges + stats
In development: 3-column grid
```

Claude Code wrote 105 lines in commit `02076c1`. The result looked convincing at first glance. Then I hovered over one of the cards.

The scroll animation was broken. `object-fit: cover` and `translateY` were fighting each other. Instead of the image scrolling smoothly inside the container, it was overflowing the bounding box and flying out of frame. Not a subtle glitch — visually jarring.

Two commits (`ef7d70a`, `57f5d09`) to fix the overflow behavior. And while I was debugging the CSS, a more important question surfaced.

"Why am I spending this much attention on scroll animations? Half my projects don't even have screenshots."

That's the real problem with the screenshot approach. It assumes every project has a polished visual to show. In reality, some projects are CLIs. Some are open source libraries. Some are early-stage enough that there's nothing visually interesting to capture yet. The design pattern works great for SaaS landing pages; it breaks down for a portfolio that spans multiple project types.

The animation was fixable. The structural mismatch wasn't.

## First Pivot: Hover Overlays

Dropped the screenshots entirely. Went card-based instead.

The idea: default state shows the essentials — title, status indicator, and tech stack. Hover reveals the full picture — description, build log links, external links. The transition is CSS `opacity` at 0.25 seconds, smooth and snappy.

161 lines changed in `ProjectCard.astro`. Claude Code handled it through Edit operations, Bash only for build verification. Mechanically, it worked exactly as designed.

Then I sat with it for about 30 minutes.

The problem wasn't the animation or the CSS. It was the information architecture. Hover is fundamentally a "hint" interaction — it surfaces a little more context, a preview, a tooltip. It's not designed to carry a full project description plus links plus metadata. When you try to load that much into a hover state, reading it becomes stressful. The user has to hold the mouse still while parsing a wall of text that appears and disappears.

The pattern was working against itself. Cards with hover reveals are great for image galleries and navigation menus. They're the wrong pattern for communicating depth about a portfolio project.

Second pivot.

## Second Pivot: Split Panel Layout

This is the iteration where the design actually clicked.

The mental model came from apps with heavy list-and-detail UX — Finder, Linear, GitHub's file browser, Notion. Left side: a scannable list. Right side: a detailed panel that updates when you click something on the left. Sticky panel so the detail view persists as you browse.

The spec I gave Claude Code:

```
Left: project list (color bar by status + name + stack + log count)
Right: detail panel for selected project (description + stack + site/GitHub links + build log list)
Click to switch, sticky right panel
Mobile: stack vertically
```

Commit `e831e42` — `index.astro` single file, 315 lines. 178 added, 137 deleted.

The interaction model is clean and familiar. Click a project in the list, the right panel replaces its content. Status colors give you a quick portfolio read without any clicking — green for live and running, yellow for active development, gray for shipped and done. Information density is high, but the two-column structure makes it scannable in a way that full-page cards never are.

One remaining gap: the detail panel was still all text. To see what any of these projects actually look like, you'd have to click an external link and open a new tab. The portfolio answered "what did you build?" but not "show me."

## Third Pivot: Live iframe Preview

The fix was direct. Embed an `<iframe>` in the right detail panel. Click a project, see the live site inside the panel without leaving the page.

```astro
<iframe
  src={project.siteUrl}
  class="preview-iframe"
  loading="lazy"
  sandbox="allow-scripts allow-same-origin"
/>
```

Started at 200px height. That was too compressed — you could barely tell what the site was. Doubled it to 400px in `7587f7c`.

Then added a scroll effect. On hover, the iframe content slowly pans downward, revealing more of the page. The implementation is CSS-only: `transform: translateY` controlled with a CSS transition. No JavaScript event listeners, no scroll syncing logic. The browser handles it.

Looking at the tooling pattern during this phase: Edit dominated throughout. Bash appeared only for `astro build` verification. Because `index.astro` was the single file changing across all iterations, there were no file conflicts — Claude Code could make sequential edits cleanly without state getting tangled between tool calls.

This is worth noting. The choice to keep all the logic in one Astro file (rather than splitting it into sub-components early) made the iteration loop faster. Less indirection, fewer files to coordinate, easier to see the full picture in one place. You can refactor for structure later. While you're still figuring out what the thing should be, concentration in a single file is a feature.

## Open Source Projects Are a Different Case

agentcrow and contextzip — two of my open source projects — don't have a `siteUrl`. They're GitHub repos with no deployed frontend. The iframe approach doesn't apply.

For these, I added `demoGif` support. Added the field to `config.ts`, referenced it in each project's YAML:

```yaml
# agentcrow.yaml
demoGif: /demos/agentcrow.gif
```

The homepage open source card now renders the GIF — dark background, 16:9 container, `loading="lazy"`. It's not as dynamic as a live iframe, but it communicates "here's what this thing actually does" without requiring the visitor to read a README.

This change touched 5 files: `config.ts`, `agentcrow.yaml`, `contextzip.yaml`, `projects.ts`, and `index.astro`. Claude Code processed them sequentially rather than in parallel — because the schema definition in `config.ts` has to land first before any consuming file can reference the new field correctly. The dependency graph determined the execution order, not any manual instruction.

This is a pattern worth paying attention to in multi-agent and AI automation workflows: independent tasks can be parallelized, but dependency chains have to run in order. Getting that distinction right is what separates fast iteration from broken builds.

## Cleanup: Nav Simplification

Removed `AI Posts` and `AI News` from the nav in commit `a6fc486`.

The portfolio's core job is to communicate what I've built. Auto-generated content feeds dilute that signal. A visitor arriving for the first time should immediately understand the work, not get sidetracked by an AI news aggregator. Simpler nav means more focus on what actually matters.

This is a UI decision but also a positioning decision. Every element in the nav is a claim about what the site is. Fewer claims, clearer identity.

## What Four Redesigns in One Day Actually Means

Let me be specific about the economics here, because this is the interesting part.

In a pre-Claude-Code workflow, each of these four design directions would be a day of work minimum. You write the component, style it, test on mobile, handle edge cases, debug the animations. By the time you've done that once, you've invested enough that you're reluctant to throw it away — even if you suspect it's not the right direction.

That reluctance is rational. Sunk cost thinking is usually bad, but when iteration is genuinely expensive, being conservative is the right call. You're not irrationally attached to your first idea; you're correctly accounting for the cost of switching.

Claude Code changes that calculation. Each of these four directions took 20–40 minutes from prompt to working implementation. That's fast enough to run actual experiments instead of committing to a direction based on intuition alone.

The browser screenshot approach: tried it, found the structural mismatch, moved on. No regret. 30 minutes.

The hover overlay: tried it, identified the interaction pattern problem, moved on. 30 minutes.

The split panel: tried it, validated that it works better, extended it. 40 minutes.

The iframe preview: added it on top of the split panel, evaluated the result, shipped it. 20 minutes.

There's a side effect to this speed, and it's worth being honest about. "I can build it fast, so let me just try it" becomes the default posture. That enabled four genuine experiments in one day. But it also means the loop doesn't have a natural stopping condition. You can keep iterating indefinitely without shipping anything.

The actual constraint is no longer execution speed. It's judgment — specifically, knowing which direction is worth developing and when "good enough to ship" has arrived.

> Claude Code brings iteration cost close to zero. That makes directional judgment the scarce resource.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
