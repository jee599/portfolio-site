---
title: "Codex Caught a Lie in My Portfolio Copy: Redesigning with Claude Code"
project: "portfolio-site"
date: 2026-05-21
lang: en
pair: "2026-05-21-portfolio-site-ko"
tags: [claude-code, astro, redesign, copywriting, codex-review]
description: "14 Claude Code sessions, 194 tool calls to build a Capabilities section and sharpen portfolio positioning—plus how Codex cross-verification caught two false copy claims."
---

194 tool calls. 14 sessions. One new Astro component. And a two-model review loop that flagged marketing copy I didn't realize was factually wrong.

**TL;DR** — Built `Capabilities.astro` (a 4-card "what I do" section), rewrote Hero/Projects/ShipLog positioning copy, and ran Codex cross-verification twice. The second Codex pass caught an overclaimed sentence in the new component before it shipped. Sessions fragmented into 14 because the 30-turn max_turns limit kept hitting mid-task.

## The Three-Second Test My Old Portfolio Failed

Someone gets your portfolio URL. They have about three seconds before they decide to scroll or leave. In those three seconds, can they answer: *who is this person and what do they do?*

The old jidonglab.com couldn't pass it. There was a build log section, a projects section, an About section — a standard developer portfolio layout. Visitors had to piece together the story themselves by scrolling through five sections. It was fine as a reference document. It failed as a first impression.

The redesign had one criterion:

> Hand someone the URL and they immediately know who you are and what you do — like a business card.

That collapsed into two concrete changes: sharpen the Hero copy into a positioning statement, and add a new section that directly answers "what do you actually do." No mystery, no inferring from project names.

## What Gets Built When You're Serious About Positioning

The biggest change was a new file: `src/components/home/Capabilities.astro`.

Four cards. **Automation**, **Product Operations**, **AI Utilization**, **Writing**. Each card has a two-digit number (`01`–`04`), an English title, and a short Korean description. The intent is immediate: a visitor sees four labeled tiles and has a summary of the work in under ten seconds.

```astro
---
const items = [
  {
    no: '01',
    title: 'Automation',
    desc: '반복되는 운영 작업을 스크립트와 AI 에이전트로 대체한다.',
  },
  {
    no: '02',
    title: 'Product Operations',
    desc: '프로덕트를 직접 운영하고 지표를 측정한다.',
  },
  {
    no: '03',
    title: 'AI Utilization',
    desc: 'Claude Code, Codex, 멀티 에이전트 워크플로로 개발한다.',
  },
  {
    no: '04',
    title: 'Writing',
    desc: '진행 중인 작업을 한국어·영어 빌드 로그로 꾸준히 남긴다.',
  },
];
---
<section class="do-section">
  <div class="do-grid">
    {items.map(item => (
      <div class="do-card">
        <span class="do-no">{item.no}</span>
        <h3 class="do-title">{item.title}</h3>
        <p class="do-desc">{item.desc}</p>
      </div>
    ))}
  </div>
</section>
```

CSS namespace: `.do-grid`, `.do-card`, `.do-no`, `.do-title`, `.do-desc`. The component uses `--accent-soft` and `--paper` variables already defined in `home.css`, so there's no new design token surface. `.do-grid` has a 1-column fallback for mobile.

`home.css` got two new class groups: `.masthead-eyebrow` for the section kicker label, and the full `.do-*` family. The component is imported in `index.astro` and placed below the NowStrip — high enough that it's visible on most screens without scrolling.

The design principle here is economy: tell the visitor what you do before asking them to scroll. If a portfolio makes someone work to understand the person, it's already lost.

## Why a Simple Component Took 14 Sessions

Tool call breakdown across the full run: Read (91), Bash (61), Edit (30), Grep (8), Write (4). Model: claude-opus-4-7.

Read outpacing Edit nearly 3:1 is expected for a redesign — you spend more time understanding what's already there than changing it. But 14 sessions is high for the scope of the actual changes. Two factors drove that.

**The max_turns wall.** Claude Code sessions have a 30-turn cap. Sessions 3 and 4 hit it mid-task, producing identical partial work — both sessions read the same files and began the same edits before cutting off. Hermes (the orchestrator) issued `Continue the previous task` to restart, but the new session started from the same point, creating another duplicate cycle. Sessions 5 and 6 repeated the pattern.

This isn't a complaint about the 30-turn limit — it's a reasonable boundary. The problem is starting a large task without per-session scope. "Redesign the portfolio" is not a session-sized task. "Build `Capabilities.astro` from this spec" is. When scope is ambiguous, the orchestrator fills a session doing whatever it can before hitting the wall, then restarts with the same ambiguous task.

The fix for next time: before starting, break the work into session-sized chunks and assign a concrete deliverable per session. One session, one component. One session, copy pass. One session, verification.

**The Codex review loops.** Sessions 7–10 are the cross-verification cycles. Implementation finishes → Codex reviews the diff → requests changes → Claude applies fixes → Codex re-reviews. Three full cycles for this work. These loops are intentional (more on what they caught below), but each cycle costs a session.

Total sessions if the max_turns issue hadn't happened: probably 6–8. Still not trivial, but more proportionate to the actual scope.

## The Sentence That Wasn't True

Session 9 is the most interesting one.

The Writing card in `Capabilities.astro` originally had this copy:

```
EN: Every commit diff becomes a Korean/English build log.
KO: 커밋 diff를 한국어·영어 빌드 로그로 매일 쌓는다.
```

Codex's verdict on the second review pass: **blocking issue**.

The problem is the word "every." Not every commit produces a build log. Some build logs are written manually after a series of commits. Some commits are purely mechanical — dependency bumps, typo fixes — and don't produce any log at all. The Korean version doubles down with "매일" (daily), which is also inaccurate.

This kind of claim is easy to write when you're building the feature and living in its context. "Every commit becomes a build log" feels true when you've been writing build logs regularly. It sounds right. But it's objectively overclaimed, and a first-time visitor who later notices the discrepancy will trust the site less.

Fix:

```
KO: 진행 중인 작업을 한국어·영어 빌드 로그로 꾸준히 남긴다.
EN: Work-in-progress captured as Korean and English build logs.
```

Changed absolute quantifiers ("every," "daily") to directional ones ("꾸준히" = consistently, "captured as"). The meaning survives. The overclaim doesn't.

The first Codex pass had flagged a smaller version of the same problem in `Hero.tsx`: two sentences in a row both used "매일" (daily). One use is emphasis. Two uses in a 40-word section is redundancy. One instance was removed.

This is the practical case for running copy through an external model. A self-review pass won't catch this — you're too close to the intent. A second model reading the copy cold, with a brief to check whether claims are factually supported, will flag absolutist language that a human reviewer rationalizes away. It's not that Claude Code misses these; it's that the model writing the copy is also the one reviewing it, which creates a blind spot.

For AI automation and multi-agent workflows, copy verification is a legitimate use case that gets overlooked.

## Hero and Projects Were Smaller Fixes

`Hero.tsx` needed one change: remove the duplicate "daily" that Codex flagged in the first pass. Two adjacent sentences both opened with "every day" or "daily." After the edit, one sentence carries that weight.

`Projects.tsx` had a section heading that said something to the effect of "currently operating" — but the list included projects still in active development. This isn't a bug in the traditional sense, but it's a misalignment between label and content. A visitor reading "operating" and seeing "in progress" items gets a small cognitive mismatch that adds up.

Changed the heading to cover both states: live projects and projects in development. Simple wording change, noticeable improvement in accuracy.

The full list of changed files:

- `src/components/home/Capabilities.astro` — new file, copy revised twice post-Codex
- `src/components/home/Hero.tsx` — positioning copy, duplicate "daily" removed
- `src/components/home/Projects.tsx` — section heading to match actual content
- `src/components/home/About.astro` — ongoing-tense revision
- `src/components/home/Topbar.astro` — nav cleanup
- `src/components/home/ShipLog.astro` — NowStrip data updated
- `src/data/home.ts` — data cleanup
- `src/pages/index.astro` — Capabilities import and placement
- `src/styles/home.css` — `.masthead-eyebrow` and `.do-*` classes added

## The i18n Bug That's Still Open

Sessions 11–14 address user feedback: "the Korean copy tone feels off."

Two issues were happening simultaneously. First, the `data-ko`/`data-en` attribute content across homepage sections was inconsistent — some sections written in formal register, some in the flatter toss-tech style the site is supposed to use throughout.

Second, a structural problem: `index.astro` doesn't extend `Base.astro`. The language toggle logic — which reads `localStorage.lang` and swaps between `data-ko` and `data-en` attribute content — lives in a script that `Base.astro` injects. Since the homepage bypasses `Base.astro`, the script never loads. You can have perfectly written bilingual attributes on every element and none of them switch, because nothing reads them.

Sessions 13 and 14 hit max_turns while reading files and exited without any changes. The issue is documented but not fixed.

The fix is one of two options: extend `Base.astro` from `index.astro`, or add an explicit `<script>` block in the homepage frontmatter that handles the language toggle directly. The second option is more surgical and avoids inheriting other `Base.astro` globals that the homepage currently doesn't use.

This is next.

## What Three Things This Build Taught

**Copy verification is a legitimate use for external model review.** The Codex cross-verification workflow is usually framed around code — catching mobile grid bugs, missing class names, performance issues. This redesign shows it catches something different: factual accuracy in marketing copy. Overclaimed absolute statements ("every commit," "daily") are invisible to the model that wrote them and visible to one that didn't. The two-model loop is worth the session cost for any public-facing copy.

**Large redesigns need per-session scope before you start.** The max_turns fragmentation in sessions 3–6 added at least 4–6 unnecessary sessions to the total count. The root cause is scoping — not the session limit itself. "Redesign the portfolio" is too broad for a 30-turn session. Assigning a concrete deliverable per session (one component, one copy pass, one verification run) prevents the orchestrator from spinning in ambiguous restart loops.

**Homepage i18n needs an explicit script injection strategy.** If a page doesn't extend the base layout, it doesn't inherit global scripts. This seems obvious in retrospect, but it's easy to miss when you're building the layout and the content page in separate sessions. The rule: any page that deviates from the base layout needs an explicit inventory of what scripts it's missing and how to get them back.

---

14 sessions and 194 tool calls for a single new component looks expensive. Strip out the max_turns restarts and the Codex review cycles, and the actual Capabilities build was probably 15–20 tool calls in a single session. The rest was verification, copy revisions, and repeated restarts from ambiguous scope.

> The code took an afternoon. The copy took the week. That ratio is consistent.

Code problems have correct solutions. Copy problems require reading with fresh eyes — ideally more than one pair, ideally from a model that didn't write the first draft.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
