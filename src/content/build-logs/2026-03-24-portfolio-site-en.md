---
title: "HTTP 200, No Email — Claude Code Found a 7-Day Silent Bug and Delivered to 11 Subscribers"
project: "portfolio-site"
date: 2026-03-24
lang: en
pair: "2026-03-24-portfolio-site-ko"
tags: [claude-code, agentcrow, email-pipeline, debugging, spoonai]
description: "A Claude CLI logout silently killed the news pipeline for 7 days. 8 sessions, 153 tool calls: diagnosis, recovery, redesign, full send."
---

For seven days, the pipeline was dead. Every morning at 09:03 KST, the cron job fired, the script ran, and nothing happened. No errors surfaced. No alerts fired. From the outside, it just looked like "no email today."

Today I found it. 8 sessions, 153 tool calls. Zero new features written.

**TL;DR** A Claude CLI logout silently killed the AI news crawl from March 17. AgentCrow dispatched 3 agents across 2 phases to recover it. Got HTTP 200 on a test send, still no email — turned out to be spam. Fixed the email design. Sent to all 11 subscribers. Then removed the feedback section entirely before the next run.

## The Bug That Hid for 7 Days

First session: 1 minute, 21 tool calls. Started with "why no email again today."

Scanned `~/spoonai/`. The cron log showed `generate-ai-news.sh` firing daily at 09:03 — but exiting with code 1 every time. The error was buried in the subprocess output:

```
Not logged in · Please run /login
```

Familiar error. The problem was the timestamp. The logs went back to **March 17 — seven consecutive days** of the same failure.

The cascade was clean once you saw it: Claude CLI logout → zero news generated → empty crawl JSON → email HTML can't render → 0 sends. The first step of the pipeline had been silently failing for a week while the symptom was just "no email."

Diagnosis took 21 tool calls: 15 Bash runs to read through logs, 3 Glob calls to check whether crawl JSONs existed.

## AgentCrow: 2-Phase Pipeline Recovery

After logging back in, the recovery session ran for 14 minutes across 13 tool calls.

The pipeline has a strict dependency order — crawling has to finish before article generation or email rendering can start. So I set up a sequential-then-parallel structure:

```
━━━ 🐦 AgentCrow ━━━━━━━━━━━━━━━━━━━━━
Dispatching 3 agents (2-phase sequential):

Phase 1:
🔄 @data_pipeline_engineer → crawl → ~/spoonai/crawl/2026-03-24.json

Phase 2 (parallel, after Phase 1):
🖥️ @senior_developer → generate article MDs + download images + git push
📝 @writer            → generate email HTML (ko/en)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Phase 1 collected 52 items, filtered down to 28 (TOP5, BUZZ3, PAPER1, QUICK17, GITHUB3). That JSON fed Phase 2.

Output: 6 article MDs (NVIDIA GTC, Anthropic Marketplace, Meta Llama 4 — both ko and en). 3 OG images failed to fetch, swapped to Wikimedia CC alternatives. Site deployed.

## HTTP 200, No Email

Test send session: 2 minutes, 9 tool calls. Sent to `jidongs45@gmail.com` via `send-email.js`. Resend API responded 200, message ID `ebf3a2a5-...`.

"Still not here."

Second send session kicked off (2 minutes, 8 tool calls). Re-confirmed file paths, checked an alternate output directory (`~/spoonai-site/data/output/`), explicitly specified the HTML file and script this time. Another send. ID `ad836686-...`, another 200.

Then: "Check the spam folder."

It was there. Both of them. The first send had worked fine — Resend had processed it successfully. I should have checked the delivery status dashboard before resending. Instead, I fired a second send immediately. Two test emails went out today.

## Email Redesign: 48 Tool Calls

Once delivery was confirmed, feedback came in: "The design changes I asked for earlier aren't applied."

Session 5: 9 minutes, 48 tool calls. Four things to fix: smaller keyword tags with more vivid colors, smaller link buttons, improved feedback section design, full TLDR style guide applied throughout.

Used `email-2026-03-21-ko.html` as a reference and diffed the CSS patterns. 14 Edit calls applied the changes to both ko and en HTML files. 7 TodoWrite calls tracked each of the four fix items.

After the fixes, generated two new base template files: `email-template-ko.html` and `email-template-en.html`. Next time, the structure doesn't need to be rebuilt from scratch.

## 11 Subscribers, 11 Sent, 0 Failed

One message after design review: "Send the full list."

Session: 4 minutes, 18 tool calls. `subscribers.txt` format is `ko,email@example.com`. Subscriber count: **ko 10, en 1**. Individual API calls per recipient.

| Lang | Subject | Recipients |
|------|---------|------------|
| ko | `[spoonai] 3/24 Mon — 젠슨 황이 터뜨린 1조 달러 AI 수주` | 10 |
| en | `[spoonai] 3/24 Mon — Jensen Huang's $1T AI Order Bombshell` | 1 |

Success: 11. Failed: 0. Bash ran 9 times to write and execute the send script.

## Remove the Feedback Section — Same Day

Right after the send completed: "Starting tomorrow, remove the 'how was this briefing' section. Update the skill too."

This took two sessions (session 7: 9 minutes, 26 tool calls; session 8: 0 minutes, 10 tool calls). Session 7 edited 2 SKILL.md files and both HTML templates. Session 8 ran `grep` to find leftover CSS class references and cleaned them out.

Two sessions for one task because session 7 wasn't complete. CSS class descriptions were still inlined in SKILL.md — missed on the first pass. Four Grep calls covered `feedback`, `피드백`, `어땠어`, and `survey` across the codebase.

> Skill files are instructions to Claude, not code. Stale content in a skill file means Claude will regenerate removed features in the next session.

## Tool Usage Breakdown

8 sessions. 153 total tool calls.

| Tool | Count | Purpose |
|------|-------|---------|
| Bash | 51 | Log inspection, send scripts |
| Read | 34 | File content review |
| Edit | 28 | CSS, HTML, skill file edits |
| Glob | 10 | File location checks |
| TodoWrite | 7 | Fix item tracking |
| Grep | 6 | Keyword search |

2 files created (`email-template-ko.html`, `email-template-en.html`), 6 files modified. No feature code written. Pipeline recovered, design fixed, 11 emails delivered.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
