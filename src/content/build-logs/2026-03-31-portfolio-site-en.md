---
title: "Cloudflare 404 to SEO Optimized: 7 Sessions, 175 Tool Calls"
project: "portfolio-site"
date: 2026-03-31
lang: en
pair: "2026-03-31-portfolio-site-ko"
tags: [claude-code, cloudflare, seo, astro, automation, build-log]
description: "From Cloudflare 404 post-deploy to llms.txt SEO and auto-generated build logs — 7 sessions, 175 tool calls, one chaotic but productive day."
---

Deploy to Cloudflare Pages. Open the blog. Every single post is 404. That's how this day started.

**TL;DR** A misconfigured `_routes.json` was routing static HTML through the SSR function handler. After fixing that, the day turned into a full sprint: 3 UI fixes, SEO/AEO/GEO optimization including `llms.txt`, and a loop that auto-generated 5 build logs from session history. 7 sessions, 175 tool calls, 2h 36min.

## The Post-Deploy 404 That Wasn't a Routing Bug

`/blog/tips/some-post` — 404. Local build was fine. Only broken on live.

First instinct: Astro's `output: 'hybrid'` setting. When you mix static pages with SSR, there's a known conflict where static files can get caught by the function router. I dug into the build output first.

```bash
npx astro build
# dist/ → /blog/tips/[slug]/index.html generated correctly
```

Files existed. Cloudflare was sending requests to the wrong handler. The culprit was `_routes.json`:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*", "/_astro/*", "/favicon.svg"]
}
```

The `exclude` array was too narrow. Static HTML files were being processed through the SSR function router instead of served directly. On Cloudflare Pages, when you mix static files with function routes, this config is the deciding factor. Adding image and script patterns to `exclude` fixed it.

Same session: migrated `process.env` → `import.meta.env` in `src/pages/api/generate-ai-news.ts`. Cloudflare Pages Functions don't run Node.js — `process.env` returns undefined.

38 minutes, 22 tool calls. Read ×8, Bash ×8, Glob ×4, Edit ×2.

## Why Every Card Image Was Missing (Schema Mismatch)

After the 404 fix, card images were all broken. Screenshots showed empty boxes everywhere.

Path issue, I assumed. Checked `public/images/posts/`, checked frontmatter paths. Files existed.

```typescript
// src/content/config.ts — build-logs schema
coverImage: z.string().optional()

// src/content/config.ts — tips schema
image: z.string().optional()
```

`build-logs` used `coverImage`. `tips` used `image`. `BuildLogCard.astro` expected `coverImage`. `BlogCard.astro` used `image`. No build errors — both fields were `optional`, so they silently passed `undefined`.

The fix: add fallbacks to both components. No image → green gradient background.

```astro
<!-- BuildLogCard.astro -->
{coverImage ? (
  <img src={coverImage} alt={title} class="w-full h-48 object-cover" />
) : (
  <div class="w-full h-48 bg-gradient-to-br from-[#00c471] to-[#00a060]" />
)}
```

Same treatment for `BlogCard.astro`. Posts with images show images; posts without show the brand green gradient. Consistent fallback behavior.

Same session also handled card description truncation. Full summaries were making cards too tall.

```css
.description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

Two sessions combined: 59 tool calls (24+45). Most of the time went into Read and Glob to understand the schema differences before touching anything.

## SEO/AEO/GEO in One Session — Including llms.txt

One prompt:

> "Do SEO/AEO/GEO optimization. Cover everything. JSON-LD, llms.txt, sitemap, robots.txt, OG tags."

Claude audited the current state first. `robots.txt` had only basic allow rules. JSON-LD had a single `WebSite` schema. OG tags were the bare minimum four.

**robots.txt** — Added explicit AI crawler directives:

```
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /
```

Googlebot doesn't need explicit rules, but AI crawlers can be blocked by default on some configurations — explicit is safer.

**llms.txt** — A GEO (Generative Engine Optimization) file. It helps AI systems understand site context more accurately. Added site structure, major sections, and author info to `/public/llms.txt` as plain text.

**JSON-LD** — Added `Article` and `Person` schemas to `Base.astro`. Post pages now automatically include an `Article` type with linked author (`Person`) data.

**OG tags** — Added `og:site_name`, `og:article:author`, `og:article:published_time`, and `twitter:creator` for Twitter Cards.

23 minutes, 37 tool calls. Read ×15, Bash ×11, Edit ×6. Bash was heavy on build validation.

## The Build Log Auto-Generation Loop

Sessions 11–13 were meta work. "Auto-generate build logs based on all session history" — Claude read `git log`, checked existing build logs, identified uncovered sessions, and wrote the files directly.

```
Session 11: "Auto-generate build logs. Based on all session history."
→ 1 post generated (Cloudflare 404 + API env vars)

Session 12: "Generate another one. Something worth reading."
→ 1 post generated (mass auto-publish story)

Session 13: "I only have 2 build logs. How many should there be total?"
→ 3 more generated (card truncation, image fallback, SEO)
```

The three-session split wasn't inefficiency — it was the angle-finding happening naturally in conversation. In session 12, "something worth reading" made Claude avoid already-covered content and pick the auto-publish story. In session 13, asking for a count made Claude identify exactly 3 uncovered sessions and produce exactly 3 files.

Three sessions combined: 57 tool calls (18+25+14). First time the Write tool was the primary tool in a session.

## Session Breakdown

| Session | Topic | Duration | Tool Calls |
|---------|-------|----------|------------|
| 7 | Cloudflare 404 + env vars | 49min | 22 |
| 8 | Card description truncate | 4min | 14 |
| 9 | Image fallback | 38min | 45 |
| 10 | SEO/AEO/GEO | 23min | 37 |
| 11 | Build log ×1 | 11min | 18 |
| 12 | Build log ×1 | 22min | 25 |
| 13 | Build log ×3 | 9min | 14 |

Total: 2h 36min, 175 tool calls. By tool: Read ×68, Bash ×39, Glob ×22, Edit ×16, Write ×4.

Read and Glob dominated the bug-fixing sessions — schema discovery, component structure, routing config. The numbers confirm what feels obvious in practice: you need to read the code accurately before you can fix it accurately. Claude does this by default; the 68 Read calls are the evidence.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
