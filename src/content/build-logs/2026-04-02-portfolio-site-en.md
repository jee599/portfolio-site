---
title: "671 Tool Calls in a Single Claude Code Session: Analyzing 300 Dental Blogs and Building an Automated Card Pipeline"
project: "portfolio-site"
date: 2026-04-02
lang: en
pair: "2026-04-02-portfolio-site-ko"
tags: [claude-code, automation, naver, gemini, playwright]
description: "25 hours, 671 tool calls, 5 /compact resets: how I analyzed 300 Naver dental blogs, extracted S-tier patterns, and shipped a card generation pipeline in one Claude Code session."
---

671 tool calls. 25 hours and 55 minutes. One session.

That's what it took to go from "analyze this dental blog URL" to a fully automated pipeline: scrape 330 Naver blogs, extract S-tier structural patterns, and generate branded card images via Gemini API + Playwright.

**TL;DR** — I used Claude Code to collect and analyze 330 Naver dental blog posts across 112 keyword combinations, extracted the structural DNA of top-ranked posts, and built a reusable card generation pipeline. I had to use `/compact` three times as context limits hit. Read 277 times, Bash 191 times.

## The Request That Started It All

The initial ask was simple: "analyze the top 10 Bundang implant blogs on Naver."

I dropped a single URL into the chat. Claude had to figure out that the iframe wrapper was only 3 KB while the actual `PostView` content was 292 KB — a non-obvious URL structure that took a few Bash calls to map.

First roadblock on macOS: `grep -P` doesn't exist. No Perl regex. Switched to Python:

```python
# macOS doesn't support grep -P, so Python for class frequency extraction
import re
from collections import Counter
# ...
```

One thing Claude can't do: log into the Naver Developer Console to generate an API key. Authentication steps that require a human login are a hard boundary. I grabbed the key manually and pasted it in.

First analysis result: the #1 ranked blog (Seoul Leaders Dental) had 27 components, 36 images (including 26 in a slider), and 77 text paragraphs. That structure became the definition of an S-tier post.

## Scaling to 330 Posts: The Background Task Pattern

Starting from "Bundang implant," I expanded to 16 regions × 7 procedures. That's 112 keyword combinations, top 3 results each — roughly 336 posts. Feeding all of that directly to Claude in one go would have blown the context window immediately.

The solution: Background Tasks.

```
TaskCreate → "Run full dental blog collection pipeline"
(receive exit code 0 when complete)
```

Instead of having Claude process every HTTP request inline, I wrote a Python collection script and ran it as a background task. Claude waited for the completion signal, then read the output files. This pattern also worked around a `contextzip` compression issue where API responses were being squeezed — by saving results to disk first, we avoided losing data in transit.

The tool usage stats tell the story: **Read 277 times, Bash 191 times.** File reads heavily outweighed direct execution. That ratio is what you want when processing large datasets in Claude Code.

## Three `/compact` Calls: Fighting the Context Ceiling

A 25-hour session means context accumulates fast. I used `/compact` three times — each time when the context was approaching its limit, I'd let Claude summarize the session state and continue fresh.

After the second compact, the session summary read:

> "Primary Request: User wants to build a data-driven dental blog marketing automation pipeline. Analyze 330+ posts to create S-tier HTML card templates..."

From Claude's perspective after a compact, it's a fresh start. The summary has to carry enough information about decisions made and current state, or subsequent compacts will lose critical context. The lesson: don't rely on Claude's auto-summary alone. Explicitly confirm key decisions before hitting compact, so the essential state survives.

Three compacts in 25 hours felt about right. Too early and you lose working context; too late and Claude starts forgetting earlier decisions.

## Visual Feedback Loops: Screenshots Over Text

The card image generation phase introduced a different kind of iteration: **visual feedback instead of code review**.

The loop looked like this:

```
Playwright screenshot → user pastes image → Claude diagnoses → HTML fix → re-capture
```

This loop ran dozens of times. One screenshot communicates a layout problem in ways that paragraphs of text can't. Claude Code reads images directly, which made this practical rather than just theoretically useful.

The longest debugging chain was the logo. It was rendering faint due to an `opacity` value in the source SVG. The fix: directly crawl `logo2W.svg` (the white version designed for dark backgrounds) and embed it inline.

Final card structure:

```
┌─────────────────────────────┐
│  Gemini API medical illustration  │
│  ──────────────────────────  │
│  Main headline (IBM Plex Sans KR) │
│  3–4 lines of supporting text     │
│  ──────────────────────────  │
│     UD Dental logo (centered)     │
└─────────────────────────────┘
```

Medical illustrations generated via Gemini API include a disclaimer: "This image is an example to aid understanding of the procedure." Using generated illustrations instead of real clinical photos is a deliberate choice — cleaner, safer, and faster to produce at scale.

## What Shipped at the End

The session produced reusable infrastructure, not just one-off output:

- **`generate-blog-cards` command**: input procedure name → render HTML template → generate Gemini medical illustration → capture PNG via Playwright
- **`write-dental-blog` command**: wraps the above, handles full blog post structure design
- **Image cache**: 30–50 background images generated upfront, recombined across posts
- **`BLOG-DESIGN-GUIDELINE.md`**: structural patterns extracted from S-tier reference posts — a reusable spec document

## Parallel Sessions Running Concurrently

While the dental analysis session was running, other Claude Code sessions were handling unrelated work in parallel.

**spoonai image rendering bug**: A CDN issue where HTML files were being saved with a `.jpg` extension caused broken images. Fixed by removing the `image` frontmatter from 4 files and adding image validation logic to `SKILL.md`. Also cleaned up 4 duplicate articles (the same topic had published on 3–4 consecutive days).

**jidonglab SEO overhaul**: `robots.txt`, sitemap, JSON-LD structured data, RSS feed, and OpenSearch support — updated across two sites (jidonglab + spoonai) simultaneously. 168 tool calls, 42 minutes.

**refmade mobile fix**: 42 iframes each rendering at 1440×6000px were causing Safari on mobile to hit memory limits, kill the tab, and enter a reload loop. Diagnosed with a `useIsMobile` hook, switched anything below 768px to use thumbnail PNGs instead. Diagnosis to fix: under 10 minutes.

## What Hardened as Patterns

**Background Tasks are not optional for I/O-heavy work.** If Claude processes 300 HTTP requests inline, you burn through context on raw data instead of analysis. Write the script, run it in the background, read the output file. That's the pattern.

**An image is worth a thousand tokens.** Describing a layout bug in text is slow and imprecise. Pasting a screenshot is instant and unambiguous. Claude Code reading images directly changes how you do UI iteration — stop describing, start showing.

**Context management is the user's job.** Claude can't decide when to compact on your behalf. You have to feel when the context is getting heavy and when the current task set is at a clean checkpoint. In a 25-hour session, three well-timed compacts meant no critical state was ever lost.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
