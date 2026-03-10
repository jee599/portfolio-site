---
title: "Vercel → Cloudflare migration + admin dashboard + AI news automation"
project: "portfolio-site"
date: 2026-03-10
lang: en
pair: "2026-03-10-portfolio-site-ko"
tags: [cloudflare, github-actions, admin-dashboard, ai-news, devto]
---

Moved portfolio site infrastructure from Vercel to Cloudflare Pages, built an admin dashboard, and set up an AI news auto-generation pipeline. 20+ commits over 3 days.

## Vercel → Cloudflare migration

Vercel's cron requires the Pro plan. Needed twice-daily AI news generation but couldn't use cron on the free tier. Moved to Cloudflare Pages and separated cron into **GitHub Actions**.

### Migration checklist

1. Change adapter to `@astrojs/cloudflare` in `astro.config.mjs`
2. Add `wrangler.toml`
3. Register environment variables in Cloudflare dashboard
4. Disable Preview builds (deploy main branch only)
5. Set up 3 GitHub Actions cron jobs

```yaml
# .github/workflows/cron-ai-news.yml
on:
  schedule:
    - cron: '0 0,12 * * *'  # UTC 0, 12 = KST 9AM, 9PM
```

> Cloudflare Pages has fast builds and a generous free tier. However, SDKs using `node:` built-in modules won't work.

## AI news auto-generation

Generates AI news automatically twice daily (KST 9AM, 9PM).

### Source collection

Crawls 5 sources for AI-related news:

1. **Google Custom Search** — "AI" keyword search
2. **Hacker News** — `/topstories` API
3. **Reddit** — hot posts from `/r/artificial`, `/r/MachineLearning`
4. **X (Twitter)** — AI trending topics
5. **GitHub Trending** — today's trending repos

### Post generation with Claude

Collected news goes to Claude Haiku, which generates individual deep-dive posts per topic. Initially used model-grouped (Claude, GPT, Gemini) list posts, then switched to **topic-based individual posts**.

Switched model from Sonnet 4 to **Haiku 4.5** — generating 20+ posts daily made cost an issue. Quality difference was negligible.

## Admin dashboard

Built `/admin` page for at-a-glance site operations monitoring.

### Tabs

- **Overview**: visitor heatmap, stat cards, build logs by project, Top Engagement
- **Quick Actions**: AI news generation, site rebuild, Dev.to sync
- **Content**: full content list with type filters
- **Comments**: comment management with delete

### Visitor heatmap

GitHub Contributions-style calendar heatmap. Fetches 90 days from Upstash Redis. Includes month labels, day labels, and hover tooltips.

## Dev.to cross-posting

GitHub Actions workflow auto-publishes content to Dev.to.

### How it works

1. Detects changes in `src/content/` subdirectories
2. Queries Dev.to API for existing articles (dedup via canonical_url)
3. Publishes only new posts via `POST /api/articles`

Posts tagged with `devto-migration` source are excluded (they originated from Dev.to). Rate limit handled with 3-second intervals.

## Gotcha: SDKs on Cloudflare Workers

Importing `@anthropic-ai/sdk` on Cloudflare Workers triggers `node:events` module errors. Workers run on V8 isolates, not Node.js.

Solution: use `fetch` directly instead of the SDK.

## Summary

- **Cloudflare Pages + GitHub Actions cron** enables scheduling without Vercel Pro.
- **AI news automation**: 5-source crawl → Claude Haiku post generation → twice daily.
- **Admin dashboard**: SSR API + client-side rendering for quick setup.
- **Use `fetch` over SDKs on Cloudflare Workers.** Libraries with Node.js dependencies won't work.
