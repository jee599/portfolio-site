---
title: "231 Tool Calls in a Day: Claude Opus 4 Live-Verified 40 AI Platforms and Found 9 Dead Hooks"
project: "portfolio-site"
date: 2026-06-01
lang: en
pair: "2026-06-01-portfolio-site-ko"
tags: [claude-code, claude-opus-4, research, automation, harness]
description: "7 sessions, 231 tool calls. Opus 4 live-verified 40+ AI platform fees in 37 min, then audited a harness where 9 hook scripts were never registered."
---

231 tool calls across 7 sessions. One session alone accounted for 158 of them — in 37 minutes.

**TL;DR** — `WebSearch` ×40, `WebFetch` ×22, `Bash` ×60: Claude Opus 4 live-verified fee structures, payout policies, and Korea eligibility for 40+ global AI platforms and produced 5 report files. A follow-up session rewrote the report in 7 minutes after user feedback. Then a harness audit revealed that 9 hook scripts sitting in `~/.claude/hooks/` had never once been registered in `settings.json` — meaning they had never triggered.

## The Overload Error That Wasn't Actually Failing

Session 5 started with a brief at `/Users/jidong/ai-10-dollar-june/brief_global_ai_10_research.md`. The task: live-verify the official fee structures and payout policies of 25 platforms. Opus 4 read the brief and immediately decided:

> "There are too many platforms to hit sequentially. I'll fan out with parallel agents, one lane per category."

Five `Agent` calls went out. Batched `WebSearch` requests started firing. Then: `API Error: Overloaded`.

It looked like a failure. It wasn't. Every tool result had actually arrived — the error was relay buffering, not a real failure. Opus 4 logged it explicitly:

> "WebSearch, WebFetch, and curl all executed successfully — the previous response appeared empty due to relay buffering, not a tool failure."

That self-diagnosis mattered. Instead of retrying from scratch, Opus 4 continued from the existing results and ran 30 additional `WebSearch` calls to fill gaps and correct the draft.

What the live verification caught:

- **Etsy Korea**: payouts via Payoneer are available — the draft said otherwise
- **Upwork fees**: changed from a flat 20% to a sliding 0–15% based on lifetime billings with a client
- **Ko-fi shopping**: the draft listed 0% commission; actual fee is 5%

37 minutes. 158 tool calls. Five output files:

- `global_ai_10_revenue_report.md` — full Korean report (27,872 bytes)
- `global_ai_10_revenue_report.html` — HTML with visualizations
- `method_ledger_seed.json` — structured fee data
- `sources.json` — verification source index
- `_progress.md` — mid-session progress notes

## "I Can't Tell What I'm Actually Supposed to Do"

Immediately after session 5 finished, the feedback came:

> "The previous report is hard to read. I can't tell what I'm actually supposed to do with it."

The data was verified. The structure was wrong. Platform-by-platform lists don't tell you what action to take.

Session 6: read the four existing files, then rewrite. 7 minutes, 8 tool calls. Six `Read` calls to absorb the full content, two `Write` calls to produce `global_ai_10_action_report.md` and `global_ai_10_action_report.html`. The structure shifted from a platform inventory to **actionable decision cards** — grouped by what a creator in Korea can actually do right now.

The math here is worth noting: the verification took 37 minutes and cost 158 tool calls. The rewrite took 7 minutes and 8 tool calls. Fact-gathering is expensive. Restructuring verified facts for a different audience is cheap.

## The Harness Audit: 9 Hooks That Were Never Running

Session 7 was a full audit of `~/.claude/`. The `harness-audit` skill ran first, then 21 direct `Bash` calls to inspect the filesystem.

First anomaly: querying hook keys from `settings.json` failed immediately.

```bash
cat ~/.claude/settings.json | jq '.enabledPlugins, (.hooks | keys)'
# null | keys → parse error
```

The `hooks` key didn't exist in `settings.json` at all. But `~/.claude/hooks/` contained 9 scripts, all with execute permissions set. File existence does not equal registration. Without the `hooks` entry in `settings.json`, Claude Code never loads them — they had never triggered once.

The audit also mapped OMX (`Oh My Codex`). The `/Users/jidong/dentalad/.omx` directory existed as a runtime state folder and was empty. The actual definitions were in `AGENTS.md` and the project `CLAUDE.md`. Location confirmed; nothing broken there.

Audit results saved to `.claude/plans/audit-2026-06-01.md`.

## Three Patterns from Seven Sessions

Looking back across the day, three things repeated often enough to be worth noting.

**Parallel agents pay off for independent verification.** Querying 25 platforms in parallel lanes is faster than sequential — but the error surface is different. An `Overloaded` error in a parallel fan-out doesn't mean the work failed; check whether the tool results actually arrived before retrying.

**Rewrites are cheap when the facts are already verified.** The expensive part of the day was session 5. Session 6 repurposed everything session 5 produced in a fraction of the time. If you're going to rewrite, do the verification once and rewrite as many times as the audience requires.

**Structural audits need to check registration, not just existence.** A script in the right folder with the right permissions does nothing if it's not registered in the config. "The file is there" is not the same as "the hook runs."

---

**Tool call summary**: `Bash` ×94, `Read` ×40, `WebSearch` ×40, `WebFetch` ×22, `Write` ×15, `Edit` ×3. Files created: 9. Files modified: 2.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
