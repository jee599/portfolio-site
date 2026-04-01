---
title: "330 Naver Blogs Scraped + Full SEO/AEO Overhaul — 3 Sessions, 604 Tool Calls"
project: "portfolio-site"
date: 2026-04-01
lang: en
pair: "2026-04-01-portfolio-site-ko"
tags: [claude-code, seo, aeo, automation, naver-api, scraping]
description: "Parsed 330 dental blogs via Naver API to extract top-ranking patterns, overhauled jidonglab SEO/AEO. 3 sessions, 604 tool calls, 13 hours."
---

The longest session today ran 13 hours and 13 minutes. 422 tool calls. I parsed 330 Naver blog posts, designed a dental blog auto-generation pipeline from scratch, and simultaneously overhauled SEO/AEO for jidonglab and spoonai.

**TL;DR** Session 2 strengthened search visibility with `llms-full.txt`, sitemap, and structured data. Session 3 analyzed 330 Naver blog structures and produced 8 HTML blog card templates based on S-tier patterns.

## The Telegram 409 That Kept Coming Back (15 min, 14 tool calls)

Session 1 lasted 15 minutes. Same problem as yesterday, same day.

I had just installed the `fakechat` plugin, so Claude initially connected it to the Telegram issue — they were completely unrelated. The actual cause was in the MCP server logs:

```
409 Conflict: Terminated by other getUpdates request;
make sure that only one bot instance is running
```

Every time a Claude Code session restarts, the Telegram MCP server spawns a new instance. If the previous process is still alive, Telegram's Bot API throws a conflict — only one `getUpdates` long-poll connection is allowed at a time. Releasing the polling lock and restarting via `/reload-plugins` fixed it.

> When Telegram MCP stops responding, check for duplicate processes before touching config. `ps aux | grep "bun server.ts"` tells you how many instances are running.

## Full SEO/AEO Overhaul (42 min, 168 tool calls)

Session 2 started with fixing broken images on spoonai and ended with a full AI search visibility strategy rollout.

### Why the Images Were Broken

Four article thumbnails had been saved as HTML files. `anthropic-mythos-01.jpg` was 919 bytes — if a `.jpg` is under 1KB, it's HTML. The image generation script was silently swallowing Gemini API errors and writing the raw HTTP response body to disk.

Two fixes: removed the `image` field from frontmatter on 8 broken articles — a missing image is better than a broken one. Added response file size validation to SKILL.md.

Four duplicate articles existed (Harvey AI was collected three times across 03-27, 03-29, 03-30) because deduplication was checking titles, not URLs. Slightly different titles slip through.

### llms-full.txt and AI Crawler Access

One prompt — "apply every effective strategy to maximize AI search result exposure" — had Claude modify 14 files and create 7 new ones.

Three core changes:

**`/llms-full.txt` route**: a new endpoint that exports full markdown content structured for LLM crawlers. Perplexity, ChatGPT, and other AI search engines prioritize this file when indexing.

**AI crawler allow rules in `robots.txt`**:

```
User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /
```

**JSON-LD structured data in `Base.astro` and `PostLayout.astro`**: Article, BreadcrumbList, and WebSite schemas. `sitemap.xml.ts` replaces Astro's auto-generated sitemap — each post's `date` now maps to `lastmod`.

## The Dental Blog Pipeline (13 hours, 422 tool calls)

Session 3 was the main event. Read 170, Bash 102, Edit 75, Write 48.

### From One URL to 330 Blog Posts

It started with a single Naver blog URL. That turned into "compare top 10 Bundang implant posts," which became a pipeline collecting the top 3 results across 16 regions × 7 procedures — 336 posts total.

Naver blogs use an iframe structure. The main URL is a 3KB wrapper; the actual content lives at the `PostView` URL. Claude's first Bash call pulled 292KB of HTML.

macOS `grep` doesn't support `-P` (Perl regex), so Claude switched to Python immediately after seeing the error — no instruction needed:

```python
import re
from collections import Counter

with open('sample_postview.html') as f:
    html = f.read()

classes = re.findall(r'class="([^"]*)"', html)
counter = Counter()
for c in classes:
    for cls in c.split():
        counter[cls] += 1
print(counter.most_common(20))
```

`se-text-paragraph` appeared 272 times, `se-module-image` 84 times. The Naver SmartEditor 3 structure pattern was now visible.

### Working Around contextzip

Naver API responses were disappearing. `contextzip` was compressing them to save tokens. The workaround: save to file first, then read with the Read tool.

```bash
# contextzip compresses responses — results vanish
# save to file and read separately
curl "https://openapi.naver.com/..." > /tmp/naver_results.json
# then use the Read tool
```

The same pattern handled all 300 HTML parse operations.

### Background Task + /compact

Collecting 330 blogs ran as a Background Task — other work continued while collection ran in parallel. That's why `TaskUpdate` appears 33 times in the log.

As the session stretched on, context hit its limit. Running `/compact` preserved the critical context (S-tier patterns, analysis state, next steps) in the summary, and the session continued without losing its thread. One `/compact` across 13 hours. A good summary means no interruption to flow.

### S-Tier Patterns and Image Caching Strategy

The top-ranked Bundang implant blog had 27 components, 36 images, and 26 slides. Analyzing all 330 posts the same way, the top 20% shared patterns that became `BLOG-DESIGN-GUIDELINE.md`, then a Claude Code skill. Now `/write-dental-blog` generates guideline-based posts in one command.

The image system was designed around pre-generation rather than on-demand: generate 30–50 base images with Gemini API upfront, cache them in `assets/manifest.json`, and use cache-first lookup during card generation.

```python
def get_or_generate(prompt_key: str, output_path: Path) -> Path:
    if output_path.exists():
        return output_path  # cache hit
    return generate_with_gemini(prompt_key, output_path)
```

### The Quality Feedback Loop

After the first draft of blog cards came back:

```
font / dark navy tone / logo image isn't working properly / the generated images are all bad
```

```
rewrite the logic from scratch.
```

75 of the Edit calls were concentrated in this feedback loop. The final output: 8 card types for an implant post — title, checklist, procedure steps, info+image cards (bone graft, digital guide, aftercare), doctor profile, legal notice, CTA.

## Tool Call Breakdown

```
Total: 604 tool calls (3 sessions)
- Read:       210 (35%) — HTML parse results, config files
- Bash:       164 (27%) — Python scripts, API calls
- Edit:       101 (17%) — HTML card revisions, SKILL.md updates
- Write:        53 (9%) — new file creation
- TaskUpdate:   33 (5%) — background task status
- TaskCreate:   15 (2%) — background task spawning
- Agent:         6 (1%) — parallel subagent processing
```

Read 35%, Bash 27%. Exploration (Read + Bash) outpaced implementation (Edit + Write) by 2.4×. Makes sense for a session that was primarily parsing 300 HTML files.

## What This Session Confirmed

When `contextzip` compresses API responses in the environment, saving large results to a file first and reading with the Read tool is the safe pattern. Diagnosing disappearing responses costs time.

Visual quality judgment requires a human. "The images are all bad" can't be encoded in a script. The 13-hour session stretched because the feedback loop ran multiple times. Next time: share reference images at the draft stage before generating anything.

The Background Task + `/compact` combination holds up for long sessions. Work in parallel while collection runs, compress when context fills, continue without losing state. That's how a 13-hour session finishes as a single coherent thread.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
