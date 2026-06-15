---
title: "342 Tool Calls, One Session: Building a Pokémon Card Price Tracker with Claude Code"
project: "portfolio-site"
date: 2026-06-16
lang: en
pair: "2026-06-16-portfolio-site-ko"
tags: [claude-code, ultracode, nextjs, neon-postgres, tcgdex, workflow]
description: "How I built a full-stack Pokémon card price tracker — real-time JPY/KRW, daily DB ingestion, sealed product EV — in one 20-hour ultracode session with 342 tool calls."
---

342 tool calls in a single session. That number surprised even me when I looked at the logs afterward.

96 Edit calls, 92 Bash, 84 Write. About 20 hours of wall-clock time. The output: a full-stack Japanese Pokémon card price tracker with real-time JPY/KRW conversion, daily database ingestion, and sealed product expected value (EV) calculation. Built from scratch, greenfield, starting with nothing but a vague idea and a blank repo.

This is what Claude Code's ultracode mode actually looks like from the inside.

## TL;DR

- Ultracode (multi-agent workflow mode) is the right tool for greenfield projects where the data source is unknown and the stack decision depends on what you find
- The single most important step was running a data source validation workflow *before writing a single line of application code*
- 342 tool calls across 20 hours produced 75 new files and touched 19 existing ones — roughly a 70% complete full-stack app
- The yuyutei scraping rabbit hole (5 probe scripts, `/tmp/probe-yuyutei*.mjs`) was the biggest time sink and is a textbook example of why fallback strategies matter
- Deployment + real DB ingestion is next session's problem

---

## The Prompt That Started It All

The initial prompt was deliberately vague:

> "I want to build a site where I can look up Pokémon card prices, see the full card list, check current and historical prices, understand rarity-based valuation, and get some sense of where prices are heading."

No spec. No wireframe. No database schema. Just an idea. This is exactly the kind of problem where ultracode mode earns its keep — when you don't know enough to write a detailed spec, you need an agent that can explore, validate, and build in parallel rather than waiting for you to resolve every uncertainty upfront.

Activating `/effort ultracode` enables Claude Code's dynamic workflow mode. Instead of a single linear execution path, it fans out into parallel subagents: one exploring data sources, one sketching the schema, one prototyping the UI layer — then converges on decisions as the exploration results come in.

## Why the Data Source Question Had to Come First

Before any application code was written, a data source validation workflow ran first. This turned out to be the most consequential decision of the entire session.

The obvious starting point for a Pokémon card tracker is `pokemontcg.io`. It's well-documented, has a generous free tier (20,000 requests/day with a free API key), and returns TCGPlayer market prices. For English cards, it's clean and comprehensive.

But the requirement was Japanese cards. That single constraint rewrote the entire architecture.

Japanese Pokémon cards exist in a separate ecosystem. `pokemontcg.io` is English-market-centric and OCG coverage is thin at best. The validation workflow surfaced two alternatives:

**TCGdex (`tcgdex.dev`)** — Free, no API key required, catalog across 10 languages. Fields like `pricing.tcgplayer.holofoil.marketPrice` actually return data. Crucially, it has solid Japanese set coverage.

**Yuyutei (`yuyutei.jp`)** — Japanese domestic pricing. Scrapeable HTML structure, but with rate limiting considerations and inconsistent page formats depending on card type.

Without this upfront validation, the default path would have been building on `pokemontcg.io` and discovering 30 minutes in that Japanese set coverage was a dead end. That's the kind of mistake that cascades — schema assumptions baked into migrations, API client code written around the wrong data shape, UI components expecting fields that don't exist.

The workflow step that feels like overhead is usually the one that saves you.

## Stack Decisions Derived From Data Constraints

Once the data sources were clear, the stack fell out almost mechanically from the data's characteristics.

Tens of thousands of cards. Images. Daily price snapshots accumulating over time. The requirement to show historical price trends ruled out a pure API-proxy approach immediately — you can't reconstruct history from a live endpoint. You need a database.

The final stack:

- **Next.js + TypeScript** — App Router, Vercel cron for scheduled ingestion
- **Neon Postgres + Drizzle ORM** — Serverless Postgres with a free tier that fits the access pattern
- **TCGdex** — Catalog and image source
- **Korean exchange rate API** — Daily JPY/KRW FX rate refresh

The schema in `src/db/schema.ts` landed on four tables: `cards`, `price_snapshots`, `sealed_products`, and `fx_rates`. Initial bulk ingestion via `scripts/ingest.ts`, daily incremental updates via `src/app/api/cron/refresh/route.ts`.

Nothing clever. The constraint was clear so the structure wrote itself.

## Sealed Product EV: The Interesting Part

The request to calculate "expected value per box and per pack" turned out to be the most interesting engineering problem in the session.

The implementation lives in `src/lib/ev.ts`. The formula is straightforward:

```
EV = Σ (card_market_price × pull_probability)
```

Pull rate data is hardcoded by set in `src/lib/pull-rates-data.ts`. For sets without published official pull rates, the calculation falls back to rarity distribution estimates — not perfect, but good enough to produce directionally useful numbers.

Each `sealed_products` table row links to a set, which links to the pull rate data, which produces an EV figure for that product. The question "if I crack one of these boxes, what's the expected value of the cards I pull?" gets a concrete answer, updated daily as market prices shift.

`src/components/forecast-bar.tsx` renders this visually. Red bar: you're expected to lose money relative to retail. Green bar: expected to come out ahead. Simple, but it's the kind of signal that's actually actionable.

## Five Probe Scripts: The Yuyutei Rabbit Hole

The most instructive failure of the session was the yuyutei scraping implementation.

The goal was straightforward: pull Japanese domestic market prices from yuyutei.jp and use them as the primary JPY pricing source. The client implementation started in `src/lib/providers/yuyutei.ts`. What followed was this sequence in `/tmp/`:

```
probe-yuyutei.mjs
probe-yuyutei2.mjs
probe-yuyutei3.mjs
probe-yuyutei4.mjs
probe-yuyutei5.mjs  (implicit)
```

Each probe revealed a different problem. The HTML structure varied by page type — single card pages, set list pages, and search result pages all had different DOM layouts. Some cards were discontinued and had no price data at all. Rate limiting kicked in before the full pattern could be established.

The resolution was a fallback chain: if a yuyutei price is available, use it. Otherwise, multiply the TCGdex USD price by the current day's FX rate from `fx_rates`. Imperfect but functional.

There's a practice worth naming here: experimental and probe scripts belong in `/tmp/`, not in the codebase. They get thrown away. The discipline of keeping exploratory code out of `src/` prevents the half-finished experiments from accreting into permanent technical debt. Five probe scripts produced zero production files — that's the right ratio.

## Signal Generation Without a Model

The original request included "predictions about where prices are heading." Implementing this without training a time-series model required a different framing: rule-based signals rather than predictions.

`src/lib/signals.ts` combines four signal types:

- **TRENDING_UP** — 7-day price change exceeds +15%
- **NEW_RELEASE** — Set released within the past 3 months
- **HIGH_EV** — Sealed product EV exceeds 120% of retail price
- **SUNSET** — Set discontinuation announced within the past 6 months

These aren't predictions. They're pattern flags that a human can interpret. The distinction matters: calling something a "prediction" implies a confidence interval and a model. These are observations about current state. `src/components/signal-tags.tsx` renders them as tags on each card and set listing. `scripts/signals-test.mjs` validates the logic against a sample of known cards.

## What 342 Tool Calls Produces

| Metric | Count |
|---|---|
| Total tool calls | 342 |
| Edit | 96 |
| Bash | 92 |
| Write | 84 |
| Files created | 75 |
| Session duration | ~20 hours |

The route structure at session end:

- `/` — Popular sets with signal tags
- `/sets/[id]` — Set card list with EV chart
- `/cards/[id]` — Single card price history
- `/sealed` — Sealed product EV comparison
- `/search` — Card name and set name search

Completion estimate: 70%. What's missing is the deployment layer — Vercel setup, database migrations against a real Neon instance, actual data ingestion run against production. That work is scoped for the next session. The architecture is done; what remains is wiring it to real infrastructure.

## When Ultracode Mode Actually Helps

This session made the conditions clearer. Ultracode's multi-agent fan-out is worth the overhead when:

1. **Data source uncertainty is high** — You don't know what APIs exist, what they return, or whether they'll support your requirements until you probe them
2. **Stack decisions depend on exploration results** — You can't commit to a schema until you know what shape the data comes in
3. **Components can be developed independently** — UI, database layer, ingestion pipeline, and signal logic don't need to block each other

The dynamic workflow parallelizes this naturally. A single linear session would have hit the data source uncertainty wall early and spent time in sequential exploration that the multi-agent setup runs in parallel.

The inverse case is equally clear: a single bug in an existing codebase is pure noise with ultracode. The overhead of spinning up subagents to fix one function is never worth it.

This week also included: prototyping 4 Godot game concepts with GPT Image-2 sprite generation (output in `~/game-concepts-preview/`), and six sessions refining the JDLab Codex cron architecture. The `local-commerce-agent` sendable-first discovery pipeline got particularly complex — that's a separate log.


---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
