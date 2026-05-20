---
title: "Redesigning My Portfolio With Claude Code: 14 Components, 2 Codex Reviews, 7 Copy Passes"
project: "portfolio-site"
date: 2026-05-21
lang: en
pair: "2026-05-21-portfolio-site-ko"
tags: [claude-code, redesign, astro, tailwind, codex, portfolio]
description: "The first design got rejected — looked like an Apple clone. Here's how I rebuilt jidonglab.com from scratch: 14 components, two Codex rounds, and seven copy revision passes."
---

The first design got rejected. White space, large type, card grids — it looked like an Apple clone. I scrapped it and started over.

**TL;DR:** Rewrote 14 components in a single 17-minute Claude Code session, ran Codex cross-verification twice (request-changes → approve), and revised copy 7 times across multiple sessions. The hardest part wasn't the code — it was deciding what to actually show.

## The Design Direction Fit in One Sentence

There was no drawn-out design debate. The brief was clear in the prompt:

> "jidonglab isn't a landing page selling one product — it's a personal builder/lab/project operating system. The design should feel like 'developer lab + personal publishing + ops log + project index.'"

That collapsed into one direction: **personal lab logbook**. Not an agency landing page — a one-person research lab's ops dashboard. Information density over typography spectacle. Section kickers, status indicators, dates, and project metadata in mono font. Body copy in IBM Plex Sans KR.

The previous design's 104px Space Grotesk serif, cream/acid backgrounds, and oversized hero copy were all discarded. That stuff works for a SaaS landing page. It doesn't work for a site where someone wants to see what you've been building.

The two principles that guided every decision:

1. **Mono spine**: anything that operates like metadata — project status, date stamps, kicker labels — uses `JetBrains Mono`. It signals "this is data" without a legend.
2. **Information first**: if a section requires scrolling past decoration to reach content, the decoration is cut.

## 14 Components in One Session

Everything under `src/components/home/` got rewritten. The session ran 57 tool calls in 17 minutes.

Files rewritten or created from scratch:

- `Hero.tsx` — name, single-line description, status strip
- `Topbar.astro` — navigation
- `NowStrip.astro` — current in-progress indicator
- `Projects.tsx` — featured(1) + active grid + indexed archive
- `ShipLog.astro` — commit-based activity log
- `Writing.astro` — post index
- `About.astro` — short bio
- `Footer.astro`
- `src/styles/home.css` — complete rewrite

The CSS approach: CSS custom properties rather than Tailwind utility wrapping. `--color-accent: #00c471` and mono spine rules are defined as design tokens; components reference them directly. This keeps the token layer explicit and makes global theme changes a one-line edit.

```css
:root {
  --color-accent: #00c471;
  --font-mono: 'JetBrains Mono', monospace;
  --font-body: 'IBM Plex Sans KR', sans-serif;
}
```

`npm run build` passed on the first try.

## Codex Round 1: request-changes

Right after the build passed, I ran Codex cross-verification.

**Verdict: request-changes.**

One blocking issue: mobile grid mismatch in `Projects.tsx`. The CSS hid `.desc` and `.stack` columns below 960px — but the header `<span>` elements didn't carry those same class names. On mobile, header cell count diverged from row cell count. The grid broke.

```css
/* The CSS hid these below 960px */
.desc, .stack { display: none; }

/* But the header spans looked like this */
<span>Project</span>
<span>Status</span>  /* missing .stack */
<span>Description</span>  /* missing .desc */
```

The fix: add the same classes to the header spans so they hide at the same breakpoint. Two options — add classes to headers, or rewrite with `nth-child`. I took the former since it's more readable.

Non-blocking issues addressed at the same time:

- **No `prefers-reduced-motion` support** on the pulse animation in `NowStrip` → added `@media (prefers-reduced-motion: reduce)` block
- **Empty `data-ko="."` span** in `Hero.tsx` → removed the meaningless period character
- **`<strong>` inside `<p>` with conflicting lang scripts** in `ShipLog.astro` → restructured to avoid the nesting

## Codex Round 2: approve

Re-verification cleared all blocking issues. **Verdict: approve.**

Build passed. `git diff --check` came back clean. The mobile grid renders correctly at all breakpoints.

## User Feedback: Three Things

After code review cleared, user feedback arrived:

> "Design itself is good, but there's translation smell and too much info — also would be nice to have project images."

Three distinct problems: translation artifacts, information overload, missing visuals.

### Removing Translation Smell

Translation smell is what happens when you design in English and translate to Korean as a second step. The phrasing ends up grammatically correct but not native — slight stiffness, word choices that map too directly to English equivalents.

Phrases like "ops index," "AI builder," and "things I'm experimenting with" were scattered through the copy. Cleaning this up took three separate sessions and is the kind of task where speed is actively harmful — you have to read each phrase cold to notice the stiffness.

### Information Diet

The original copy had a density problem. Too many details that were interesting to the person who built the site but irrelevant to someone seeing it for the first time. The edit pass removed anything that answered "how" before answering "what."

### Adding Project Images

Eight screenshots from `public/images/projects/` were available. The rest of the projects got CSS/token-based visual fallbacks — a colored background derived from the accent token.

Implementation: added a `PROJECT_IMAGE` mapping to `src/data/home.ts`, imported it in `Projects.tsx`, and wired the image path to a `<img>` tag in each project card. Fallback via CSS `background` property.

One mistake made here: the `PROJECT_IMAGE` mapping was added to `home.ts` but `Projects.tsx` wasn't updated to import it. The build passed because the data layer and the component layer were disconnected — no TypeScript error, no build error, just silently missing images at runtime. `Thumbnails.tsx` was also in a no-op state. Fix: explicitly wire the import and render path.

## Stripping Internal Infrastructure from Public Copy

This took more rounds than expected, and it's worth explaining why.

The request was: "apply to production, remove daily-running toolchain references, fix the overall tone."

The problem: cron schedules, internal pipeline descriptions, and tool names had leaked into public-facing copy. The `Lab` section was the worst offender. "Runs automatically at 08:00 KST daily," "Claude Code hooks," "multi-agent orchestration" — all on the front page.

Things removed:

- Entire `Lab` section (removed import from `src/pages/index.astro`)
- `08:00 KST` timestamp from `NowStrip`
- "AI news auto-publish pipeline" in `src/data/home.ts` for the `spoonai` project → changed to "AI news archive"
- "All projects are built with Claude Code" from `src/pages/about.astro`
- MCP server, multi-agent orchestration, and hook references from `public/llms.txt`
- "Built with Claude Code" from `src/layouts/Base.astro` footer

The principle: someone landing on the site for the first time doesn't want to know how sophisticated your cron schedule is. They want to know what you built. Internal infrastructure belongs in build logs (like this one) — not in site copy.

There's also a practical reason: implementation details change. If the site says "built with X" and X is replaced six months later, that copy becomes noise at best and misleading at worst.

## Fixing .gitignore

Codex flagged this last: `.claude/agent-memory/`, `.claude/worktrees/`, and `.wrangler/` were untracked but missing from `.gitignore`. Without the fix, local state directories would end up in production commits.

Added entries:

```
.claude/agent-memory/
.claude/worktrees/
.wrangler/
```

Also cleaned up a duplicate `.vercel/` entry that had been there since the initial setup.

## By the Numbers

Stats across the full redesign (excluding duplicate sessions):

| Metric | Count |
|--------|-------|
| Sessions | 10+ |
| Bash calls | ~70 |
| Read calls | ~65 |
| Edit calls | ~40 |
| Write calls | ~15 |
| Codex rounds | 2 |

The distribution is telling: Read was nearly as frequent as Edit+Write combined. Understanding what was already there before changing it saved multiple rounds of "why did this break."

Copy revisions took more rounds than code changes. The mobile grid bug: one session. Removing translation smell and internal toolchain references: 6–7 sessions. Code problems have discrete solutions. Copy problems require reading with fresh eyes.

## Local Preview Constraints

`astro preview` doesn't support the Cloudflare adapter — you have to serve `dist/` directly via `wrangler pages dev`. There was no public preview URL available during this session (Cloudflare API token not set up, Vercel MCP permissions not granted), so verification was local-only.

Production deployment: merge to `main` → Cloudflare Pages auto-build.

---

The sequence that worked: lock the direction first (one sentence), build fast with Claude Code, run automated code review with Codex, then spend the most time on copy. The code was done in an hour. The copy took the week.

> Deciding *what* to show takes longer than building it. Once that's clear, Claude moves fast.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
