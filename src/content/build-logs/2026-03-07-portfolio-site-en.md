---
title: "toss.tech-style redesign + view counter and reaction system"
project: "portfolio-site"
date: 2026-03-07
lang: en
pair: "2026-03-07-portfolio-site-ko"
tags: [astro, design-system, toss-tech, upstash-redis, engagement]
---

Redesigned the portfolio site with toss.tech aesthetics and added view counts, reactions, and comments. 15 commits, from design tokens to layout — everything got replaced.

## Why redesign

The old site was a vanilla Astro template with Tailwind slapped on top. As content grew, navigation became impossible. Borrowed toss.tech's **clean card layout + clear section separation** as the reference.

## Design tokens

First step: extract **design tokens** into CSS variables.

```css
:root {
  --color-heading: #191f28;
  --color-body: #333d4b;
  --color-muted: #8b95a1;
  --color-accent: #00c471;
  --color-bg: #f9fafb;
  --font-display: 'IBM Plex Sans KR', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

Centralizing tokens means "change the accent color" is a one-variable edit. When asking Claude to "extract design tokens into CSS variables," Tailwind's `@layer` conflicts came up — workaround was `is:inline` styles.

> Define design tokens before components. Without tokens, hardcoded color values spread everywhere.

## Hero + section layout

Main page split into 3 sections:

1. **Hero**: name, one-liner, GitHub/Dev.to links
2. **Articles**: latest build logs / tips / blog cards
3. **Projects**: project cards with status badges

Articles moved above projects — **showing content first improves dwell time**.

### Category filter buttons

Added category filters to `/posts` with pill buttons for Build Log, AI Tip, Blog.

```typescript
const categories = [
  { key: 'all', label: 'All', color: '#191f28' },
  { key: 'build-log', label: 'Build Log', color: '#00a85e' },
  { key: 'tip', label: 'AI Tip', color: '#d97706' },
  { key: 'blog', label: 'Blog', color: '#3b82f6' },
];
```

Each button gets a `data-category` attribute, filtered client-side with `display: none`. Simplest approach for an SSG site.

## View counter + reactions

Wired up Upstash Redis for **serverless counters**.

### Architecture

- `post:views:{slug}` — page views (incremented on load)
- `post:likes:{slug}` — like count
- `post:comments:{slug}` — comment list (Redis List)
- `visitors:{YYYY-MM-DD}` — daily visitor count

```typescript
await redis.incr(`post:views:${slug}`);

const key = `post:likes:${slug}`;
const current = await redis.get<number>(key) || 0;
await redis.set(key, current + delta);
```

Duplicate prevention via `localStorage`. Same browser, same post, second like = unlike.

### Cloudflare Workers compatibility

Initially imported `@anthropic-ai/sdk` directly — broke on Cloudflare Workers due to `node:` module errors. Switched to raw `fetch`.

```typescript
// ❌ Doesn't work on Cloudflare Workers
import Anthropic from '@anthropic-ai/sdk';

// ✅ Direct fetch
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({ model, messages, max_tokens }),
});
```

> In serverless environments, raw `fetch` beats SDKs for compatibility. Avoids Node.js-specific dependencies.

## Client-side i18n

Astro's SSG means generating locale-specific pages doubles build time. Instead, used **`data-ko`, `data-en` attributes** to swap text client-side.

```html
<p data-ko="빌드 로그, AI 팁, 블로그 글을 모아 놓은 곳이다."
   data-en="Build logs, AI tips, and blog posts all in one place.">
  빌드 로그, AI 팁, 블로그 글을 모아 놓은 곳이다.
</p>
```

Reads `lang` key from `localStorage` and swaps content. Build logs use the `lang` field to separate Korean/English versions, with `pair` field linking translations.

## Prose typography

Added toss.tech-style prose CSS for readability:

- Body `line-height: 1.8`, `letter-spacing: -0.01em`
- `h2` top margin `3rem` for section breaks
- Inline code with green background (`#e6f9f0`) + border
- Blockquotes with green left border

## Summary

- **Define design tokens first.** Hardcoding colors in components means find-and-replace later.
- **Content-first layout.** Articles above projects.
- **Upstash Redis for serverless counters.** `fetch` over SDK for Cloudflare Workers compatibility.
- **Client-side i18n** avoids build time increase for multilingual support.
