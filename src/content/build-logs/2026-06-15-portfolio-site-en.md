---
title: "Claude Designs, Codex Ships — 14 Sessions, 1,100+ Tool Calls"
project: "portfolio-site"
date: 2026-06-15
lang: en
pair: "2026-06-15-portfolio-site-ko"
tags: [claude-code, next-js, codex, multi-agent]
description: "14 sessions, 1,100+ tool calls: a Pokémon card price tracker, Claude-Codex cron architecture iterated 8 times, sprite gen, and a gitleaks audit."
---

14 sessions. ~1,100 tool calls. 342 of them went into a single Pokémon card price tracking site.

**TL;DR** Built a Japanese Pokémon card price tracker from scratch — data source validation through 95 files — in a single Claude Code session. While that was happening, a quieter but more architecturally interesting project evolved in parallel: a repeatable Claude-designs-Codex-executes pattern for autonomous cron jobs.

## Six /tmp Scripts Before a Single Line of Production Code

Session 2 was the heaviest this period. Edit 96×, Bash 92×, Write 84×, 342 tool calls total. ~20 hours of wall-clock time.

Starting prompt: "I want a Japanese Pokémon card price site. Current prices, historical prices, rarity, forecast, box/pack breakdown, dual JPY+KRW currency."

The first move wasn't writing code. It was validating data sources. `pokemontcg.io` is English-focused — Japanese card coverage is patchy. So before touching the actual codebase, six throwaway scripts probed the APIs: `/tmp/tcgdex-ja.mjs`, `/tmp/probe-yuyutei.mjs`, and four others to map response shapes.

Results:
- **TCGdex** — free, no key required. 10 languages including Japanese, full card catalog with images, rarity, and USD/EUR pricing
- **Yuyutei (遊々亭)** — Japan's largest single card market, real JPY transaction prices
- **PriceCharting** — historical data to fill the gap

Once sources were confirmed, the abstraction layer came first: `src/lib/providers/` with `tcgdex.ts`, `yuyutei.ts`, and `tcgcsv.ts` as independent adapters. Swapping to a paid API or replacing a source later won't require touching anything else.

Stack: Next.js 15 + React 19 + Tailwind v4 / Neon Postgres + Drizzle ORM / Vercel Cron. The "refresh once a day, serve everything else from DB" constraint drove the database selection. DB schema, provider adapters, price signal logic (`signals.ts`), and all UI components shipped in the same session. Final file count: 95.

## Escaping the 70KB Heredoc

Sessions 6–14 (8 sessions, ~575 tool calls combined) all went into `local-commerce-agent`.

The original problem was structural. All policy logic was hardcoded inside the heredoc of a 70KB bash worker. Changing a policy meant editing the entire bash file.

Session 6 (74 tool calls) redesigned the architecture around one principle: **Claude writes policy and contract files; Codex reads them on each cron tick and executes.** Logic was externalized into `jdlab-codex-cron-policy.json` and `jdlab-codex-lanes.json`. The operating contract lives in `docs/jdlab_codex_cron_operating_contract.md`.

The split matters because policies change more frequently than execution logic. When policy lives in a JSON contract that both human and agent can read, the system is auditable without diving into bash internals.

Session 7 (122 tool calls) was the hardest. Four independent Codex reviewers all returned `request-changes`. The shared blocker: country-gate was applied downstream. The pipeline assigned `priority_experiment_sendable` upstream, then filtered by country further down — causing a "8 priority, 2 green" leak on every run. Fixed by creating `jdlab-country-gate.mjs` and moving the filter upstream.

Sessions 8–14 were incremental:
- `min_per_lane` bumped 12→30 for throughput (session 8)
- Switched to sendable-first discovery logic (session 10)
- Crawling handed off to local Hermes scripts to bypass Codex sandbox DNS/HTTPS reliability issues (sessions 12–14)

The loop hardened into a pattern: Claude implements → Codex independent review → fix blockers → re-verify. After enough iterations, the system's contracts became clearer than the code itself. That's the signal the abstraction has stabilized.

## Why gitleaks Scans History, Not Just the Working Tree

Session 11 (34 tool calls) was a security audit across all `jee599` public repos.

Installed `gitleaks 8.30.1` and targeted git history — not just the current working tree. The reason: deleting a file doesn't remove it from commit history. If a secret was ever committed to a public repo, it's still there regardless of whether the file exists today. A grep-based check on the working tree misses this entirely.

The Daemun repo had 3 local commits pushed to origin during this session. Working tree was clean; history cleanup strategy was confirmed after the scan.

## GPT Image 2 and the Sprite Consistency Problem

Session 5 (141 tool calls) was game design review plus sprite generation experimentation.

Reviewed 4 game design documents in parallel — Guild Master (fantasy mercenary management sim) and three wuxia variants. While researching OSS sprite generation pipelines, generated walk animation sprites via the `gpt-image-2` API. The `gen_rows_gpt_image.py` script produced a 5-frame pixel art walk cycle sheet with alpha channel handling.

Feedback: "the walk looks a bit off." Prompt tuning, regenerate.

The lesson was concrete: for any text-to-sprite pipeline producing multi-frame animation, two inputs must stay fixed across all API calls — the character description seed and the negative prompt. The model has no memory between calls; the seed is the only thing holding the character's visual identity together across frames.

## What the Tool Call Distribution Actually Tells You

The tool type distribution across 14 sessions makes each session's character legible:

| Session | Bash | Edit | Write | Profile |
|---------|------|------|-------|---------|
| 2 (pokeprice) | 92 | 96 | 84 | greenfield build |
| 7 (cron final fix) | 35 | 36 | 12 | patch cycle |
| 5 (Godot) | 72 | 8 | 16 | exploration |

Heavy Bash → validation and exploration. Heavy Edit → modifying existing code. Heavy Write → net-new file creation. The ratio tells you whether a session was greenfield, a bug-fix cycle, or a research pass — before you read a single diff.

When you track these numbers across sessions on the same project, the shift from Write-heavy to Edit-heavy is the signal that the architecture has stabilized and you're in maintenance mode.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
