---
title: "26 Silent GitHub Actions Failures and the Design Gate I Built to Stop Bad HTML"
project: "portfolio-site"
date: 2026-06-04
lang: en
pair: "2026-06-04-portfolio-site-ko"
tags: [claude-code, github-actions, automation, open-design, harness]
description: "26 consecutive GitHub Actions failures went unnoticed across my repos. Claude Code audited 56 repos in 34 min, then I built a hard Design Gate hook into the harness."
---

26. That's how many consecutive times my `Generate AI News` workflow had been failing. Not 2, not 5 — 26 runs in a row, all red, completely silent.

**TL;DR** Scanned 56 GitHub repos, disabled 4 broken workflows, and wired a `design-gate.sh` hook into the Claude Code harness to hard-block any HTML output that hasn't gone through a design pass. The portfolio-site change was a two-minute side effect of a much larger cleanup.

## The GitHub Actions Graveyard Nobody Was Watching

In session 10, I ran a sweep: all 56 repos under the `jee599` account, extracting workflow failure state in a single pass. The pattern was immediate:

```
portfolio-site / Generate AI News → 26/26 failures
dev_blog / Publish to Hashnode   → 16/16 failures (HASHNODE_TOKEN expired)
saju / CI                        → latest failure (dependency conflict)
contextzip / CI                  → 8/8 failures (Rust build error)
```

Each of these had been failing silently for weeks. No alerts, no noise. Just a small red icon on a GitHub tab nobody had open.

For `Generate AI News`, the root cause was an API key issue — fixable in five minutes. But before fixing it, I asked a better question: *is this workflow still needed?*

The answer was no. The local execution structure had already replaced it. The workflow wasn't broken in a "needs a fix" way — it was broken in a "should be retired" way.

I chose `disable` over `delete`. One command, fully reversible:

```bash
gh workflow disable "Generate AI News" --repo jee599/portfolio-site
```

Total cost for the whole audit: 60 tool calls across 35 Bash, 11 Read, and 2 AskUserQuestion calls. Wall clock: 34 minutes. Start to verified finish in a single session.

## The Question That Spawned a Hard Gate

The same day, a longer session kicked off — session 15, 124 tool calls, 14 hours 20 minutes. It started with one question:

> "Are all HTML outputs from Claude Code actually forced to go through Open Design?"

The honest answer: no. `design-router.sh`, the existing hook, detected visual design keywords in prompts and injected a soft recommendation. It nudged. It didn't block.

That gap was the problem. A soft prompt is easy to ignore, skip, or miss entirely. If the policy is "all user-facing HTML must go through a design system pass," soft routing doesn't enforce that — it just reminds you.

The fix was to make it structural.

## Design Gate: A Shell Hook That Actually Blocks

The logic is straightforward. Before any `Write`, `Edit`, or `MultiEdit` tool call completes, `design-gate.sh` checks:

1. Is the target file a `.html` or `.htm`?
2. Has this session been acknowledged as a design pass?

If both are true, proceed. If the first is true and the second isn't, `exit 2` — the tool call is blocked.

```bash
# hooks/design-gate.sh core logic
if [[ "$tool_name" =~ ^(Write|Edit|MultiEdit)$ ]]; then
  if [[ "$file_path" =~ \.(html|htm)$ ]]; then
    if ! session_acknowledged; then
      echo "Design pass required. Run: design-pass.sh \"reason\""
      exit 2
    fi
  fi
fi
```

Acknowledging the session takes one command:

```bash
design-pass.sh "reason for this design pass"
```

After that, the gate stays open for the rest of the session. A new session starts locked again.

Build paths — `/tmp/`, `dist/`, `vendor/` — are auto-exempted. Blocking automated build output would defeat the purpose.

Seven smoke test cases verified the behavior: blocked without acknowledgment, passes after acknowledgment, acknowledgment persists within session, re-blocked in new session, non-HTML files pass freely, build paths auto-exempt.

## Skills That Already Have Design Systems Get Pre-exempted

After wiring up `design-gate.sh`, an immediate problem surfaced. Skills like `report-builder`, `owner-briefing`, and `medical-report` already have their own embedded design systems — they produce polished HTML as part of a structured workflow, not as raw AI output.

Requiring a manual acknowledgment before every one of those runs adds friction with no safety benefit.

The solution: each skill's `SKILL.md` now calls `design-pass.sh` automatically at session start, declaring itself as an "OD-equivalent design pass." The gate opens automatically when the skill loads.

`~/.claude/CLAUDE.md` was updated to document the full harness state. Previously it only mentioned `protect-files.sh` and `omc-dial.sh`. The two new hooks — `design-gate.sh` and `design-router.sh` — are now documented alongside them.

## The First Real Hit

The Design Gate went live and was immediately tested. A dental clinic audit report for Dongbaek UDental ran through the `dental-promo-audit` skill — real crawl data from Naver Place, blog SEO metrics, and site structure analysis, all rolled into a single HTML report.

First HTML write attempt: blocked.

```bash
design-pass.sh "dental-promo-audit OD-equivalent pass"
```

Second attempt: passed. Report landed at `~/dental-promo/dongbaek-uddental/2026-06-03/01-원장님-진단보고서.html`.

It worked exactly as designed. The first real-world gate trigger confirmed the implementation was correct.

## Current Harness State

Four hooks are now running across every Claude Code session:

- `protect-files.sh` — blocks writes to `.env`, `.ssh`, credentials files
- `design-gate.sh` — blocks `.html/.htm` output until a design pass is acknowledged
- `omc-dial.sh` — steers complex/multi-file tasks toward explicit planning and self-verification
- `design-router.sh` — detects visual design intent in prompts, routes to the `open-design` skill

The direct portfolio-site change this cycle was minimal: one workflow disabled. The actual work was harness-level — infrastructure that applies across every project, not just this one.

Next: reconnect the AI News generation pipeline in the new local-execution structure.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
