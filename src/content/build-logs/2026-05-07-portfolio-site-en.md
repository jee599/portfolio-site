---
title: "5 Parallel Design Variants and the SRI Hash Bug Codex Caught (208 Tool Calls)"
project: "portfolio-site"
date: 2026-05-07
lang: en
pair: "2026-05-07-portfolio-site-ko"
tags: [claude-code, design, redesign, debugging, parallel-agents, codex]
description: "5 coffeechat.it.kr redesign variants generated in parallel, Codex caught a React CDN SRI hash mismatch, and a Korean font rendering bug got traced and removed. 208 tool calls, 2 sessions, ~4h40m."
---

Two tasks landed at the same time: a full redesign of coffeechat.it.kr with at least 5 variants to choose from, and a Korean font rendering issue on spoonai showing `□□□□` instead of characters. Both done in one day. 208 tool calls across 2 sessions, about 4 hours and 40 minutes.

**TL;DR** Parallel variant generation genuinely speeds up design work. The bottleneck isn't generation speed — it's reading the service category correctly before round one. Codex cross-verification caught a React CDN SRI hash mismatch that would have silently broken pages in production.

## One Sentence of Feedback That Reset an Hour of Work

The coffeechat.it.kr redesign request came in with clear constraints: generate at least 5 distinct variants so the client could pick a direction.

First step was analyzing the site. coffeechat.it.kr is a mentoring platform for the Korean game industry — 1:1 coffee chats with active game developers and designers, resume reviews, and mock interviews. Clear target audience, so I mapped out 5 distinct design directions and dispatched them in parallel.

Five `frontend-implementer` agents fired simultaneously:

- V1 Editorial Magazine (Instrument Serif + cream beige)
- V2 Soft Brutalist (heavy borders + lime and pink)
- V3 Floating Gradient
- V4 Object-oriented UI
- V5 Brief Format

Each agent ran in an isolated context with no cross-contamination between variants.

The feedback came back: "These all look bad. None of them feel professional. Look at Inflearn or other ed-tech platforms."

The variants explored style, not service identity. I'd picked up on the game industry angle and pulled indie/creative aesthetics instead of the ed-tech trust signals that Inflearn, Class101, or FastCampus project. "Professional credibility of an educational platform" wasn't in my initial read of the service.

Reset. Reclassify. Restart.

The lesson is sharper than "get better feedback upfront." If you misread the service category — ed-tech vs. indie creative vs. SaaS — no amount of variant generation fixes it. Round one is entirely wasted. "What kind of platform is this, really?" has to be answered before any generation starts.

## The Bug Codex Caught That We Almost Shipped

Before the reset, `design-reviewer` flagged a blocker on V3: floating gradient blobs rendering incorrectly. Fixed that, then ran Codex cross-verification on the diff.

Codex came back with a finding across V2, V3, V4, and V5. All four variants loaded `react.production.min.js` from CDN, but the SRI `integrity` hash in each `<script>` tag matched the `.development.js` build — not production.

```html
<!-- Wrong — production file URL, development build hash -->
<script
  src="https://unpkg.com/react@18/umd/react.production.min.js"
  integrity="sha384-<development-hash-here>"
  crossorigin="anonymous">
</script>
```

Browser security policy is strict here: if the hash doesn't match the file content, the resource is blocked. This doesn't surface in local development because the browser caches the resource after the first load. In production, a fresh browser hits the CDN, gets the production file, computes the hash, finds a mismatch, and silently blocks the script.

End result: blank page and `Integrity check failed` in the browser console.

Fixed all four variants by aligning CDN URLs to the correct production SRI hashes. This class of bug — subtle, environment-specific, easy to miss in review — is exactly what external model cross-verification catches. A model that generated the code reads its own output charitably. An external model looking at the diff for the first time has no such bias.

## Tracking Down the Korean Font Rendering Issue

The second session started with a screenshot showing `□□□□` where Korean characters should be — labels like "total scale," "OpenAI stake," and "structure" rendering as empty boxes instead of text.

The search started with how spoonai tracks image attribution. Posts use a `credit` field to distinguish source: `"spoonai"` means directly produced, `"CNBC"` or `"TechCrunch"` means external.

```bash
grep -r 'credit.*spoonai' src/content/posts/
```

One result: a 58KB infographic with Korean labels, produced in-house, exported without embedding the font. Any system without the Korean font installed renders those glyphs as empty boxes. Two posts (Korean and English versions) referenced this image.

Removal was straightforward:

1. Delete the `image:` frontmatter block from both posts
2. Delete the image file
3. Build check
4. Commit and push

```bash
git commit -m "chore: remove self-generated infographic image with broken Korean fonts"
```

3 files changed. Vercel auto-deploy triggered, production updated 2 minutes later.

The `credit` field made the search fast. Without that attribution pattern, finding all self-generated images with the same potential font issue would have required manual inspection across every post.

## spoonai Redesign — The Two-Round Exploration Pattern

With the font bug resolved, the spoonai redesign ran in the same session. First round produced 5 variants. The feedback: "05-brief.html feels right. Give me 5 more iterations close to that direction."

This two-round pattern is efficient. Round one is wide — 5 variants to establish direction. Round two narrows — 5 more iterations off the variant that clicked. Effectively 10 explorations, but the user makes only two decisions.

Final direction: `05a-editorial-premium.html`. That became the base for actual codebase changes on the `feat/editorial-premium-redesign` branch: 7 files, 442 insertions, 725 deletions.

## By the Numbers

208 tool calls total across two sessions:

- **Bash: 112 (54%)** — CDN URL validation, hash verification, git operations, dev server
- **Agent: 50 (24%)** — parallel variant dispatch, design-reviewer, codex-cross-verify
- **Other: 46 (22%)** — file reads, edits, searches

Bash at 54% reflects how much validation and verification work sits alongside generation. The Agent calls are almost entirely the creative and review pipeline.

The bottleneck in parallel variant generation isn't generation speed. Five agents firing simultaneously is fast. The slow part is the judgment call before round one — reading the service correctly before any code gets written.

Codex cross-verification adds time. It's a quality gate, not a speed improvement. The SRI hash bug might never have surfaced consistently in production (browser caching makes it environment-dependent), or it might have broken a specific subset of users on cold cache. Finding it before deploy was worth the extra step.

> Parallel generation expands the exploration range. Cross-verification closes gaps that in-context review misses. Both are quality insurance, not speed tools.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
