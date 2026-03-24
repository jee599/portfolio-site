---
title: "HTTP 200 OK, Email Not Delivered — Hunting a 7-Day Silent Pipeline Failure with Claude Code"
project: "portfolio-site"
date: 2026-03-24
lang: en
pair: "2026-03-24-portfolio-site-ko"
tags: [claude-code, agentcrow, debugging, email-pipeline]
description: "A Claude CLI logout silently killed my news pipeline for 7 days. 8 sessions, 153 tool calls to diagnose, recover, and send to 11 subscribers."
---

Eight sessions. 153 tool calls. Almost no code written.

That was today — tracking down a silent pipeline failure, recovering it, and finally sending a newsletter to 11 subscribers. The root cause turned out to be a Claude CLI logout that had been quietly killing my daily news pipeline since March 17.

**TL;DR** — A logged-out Claude CLI caused 7 consecutive days of crawl failures. I used AgentCrow to orchestrate a 3-agent recovery in two phases, got HTTP 200 from Resend but still no email in my inbox (sent it twice), fixed 4 design issues in 48 tool calls, and shipped to all 11 subscribers: 11 successes, 0 failures.

## The Bug That Hid for 7 Days

The first session started with: "Why didn't the email come today. Again."

I pointed Claude at `~/spoonai/` and let it dig through the logs. The cron job fires at 09:03 KST every day, calling `generate-ai-news.sh`, which internally invokes the Claude CLI. Exit code 1. Reason:

```
Not logged in · Please run /login
```

That error isn't unusual. What was unusual was the timestamp. The same error, every single day, **from March 17 to March 24 — 7 days straight**.

The failure chain was clean once you saw it: Claude CLI logout → 0 articles generated → empty crawl JSON → email HTML can't be built → 0 emails sent. The first stage of the pipeline had been dead for a week. From the outside, it just looked like "no email again today."

Diagnosis took 21 tool calls: 15 Bash calls to dig through log files, 3 Glob calls to confirm whether crawl JSONs existed.

## 2-Phase Pipeline Recovery with AgentCrow

After logging back in, I started a manual recovery session (14 min, 13 tool calls).

The pipeline has a hard dependency: crawling must complete before site publishing and email generation can begin. So I structured the AgentCrow dispatch as sequential phases with parallel execution inside Phase 2.

```
━━━ 🐦 AgentCrow ━━━━━━━━━━━━━━━━━━━━━
Dispatching 3 agents (2-phase sequential):

Phase 1:
🔄 @data_pipeline_engineer → crawl articles → ~/spoonai/crawl/2026-03-24.json

Phase 2 (parallel, after Phase 1):
🖥️ @senior_developer → generate article MDs + download images + git push
📝 @writer            → generate email HTML (ko/en)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Phase 1 returned 52 articles, filtered to 28 (TOP5, BUZZ3, PAPER1, QUICK17, GITHUB3). That JSON fed Phase 2.

Result: 6 article MDs published (NVIDIA GTC, Anthropic Marketplace, Meta Llama 4 — both ko and en), 3 failed OG image downloads replaced with Wikimedia CC images, site deployed.

## HTTP 200 OK, Email Not Delivered

Test send session: 2 min, 9 tool calls. `send-email.js` to `jidongs45@gmail.com`. Resend API responded 200, ID `ebf3a2a5-...`.

"It didn't arrive."

Second send session: 2 min, 8 tool calls. Re-confirmed file paths, checked an alternate output directory (`~/spoonai-site/data/output/`), explicitly specified the HTML file and script. Sent again. ID `ad836686-...`. Response 200.

In hindsight, the first send almost certainly landed correctly. I should have checked Resend's delivery status before sending a second time. Instead I fired again immediately. Two test emails went out today because of that.

> Check delivery status before resending. HTTP 200 means the API accepted it — not that it was delivered. Resend's dashboard shows the actual status.

## Email Design Fixes: 48 Tool Calls

Once the email arrived and was confirmed, feedback came in: "The design changes I requested before aren't applied."

Session 5: 9 min, 48 tool calls.

Four changes: keyword tags smaller with bolder colors, link buttons reduced in size, feedback section redesigned, the finalized TLDR style guide applied throughout.

I had Claude read `email-2026-03-21-ko.html` as a reference and compare the CSS patterns. Edit ran 14 times to apply changes to both the ko and en HTML files. TodoWrite ran 7 times to track all four items across both files.

After fixes were confirmed, I generated two new template files: `email-template-ko.html` and `email-template-en.html`. Next time, there's no need to rebuild the base structure from scratch.

## Sending to All 11 Subscribers: 11/11

One message: "Ship it to everyone."

Full-send session: 4 min, 18 tool calls.

`subscribers.txt` uses the format `ko,email@example.com`. Subscriber count: **10 in Korean, 1 in English**. One API call per recipient.

| Language | Subject | Recipients |
|----------|---------|------------|
| ko | `[spoonai] 3/24 Mon — 젠슨 황이 터뜨린 1조 달러 AI 수주` | 10 |
| en | `[spoonai] 3/24 Mon — Jensen Huang's $1T AI Order Bombshell` | 1 |

Success: 11. Failure: 0. Bash ran 9 times to write and execute the send script.

## Removing the Feedback Section — Same Work Done Twice

Right after sending, the next request arrived: "Starting tomorrow, drop the 'how was this briefing' section. Update the skill too."

This took two separate sessions (session 7: 9 min, 26 tool calls; session 8: 0 min, 10 tool calls).

Session 7 modified 2 SKILL.md files and 2 HTML templates. Session 8 used `grep` to find and remove leftover CSS class references that session 7 had missed.

The reason it took two passes: session 7 left inline CSS class descriptions inside the SKILL.md files. Grep ran 4 times across keywords — `feedback`, `피드백`, `어땠어`, `survey` — to catch everything.

> Skill files aren't code — they're instructions Claude reads at the start of each session. Stale content in a skill file means Claude will regenerate the feature you just removed in the next session.

## Tool Usage Breakdown

8 sessions, 153 total tool calls:

- **Bash** — 51 (log inspection, send script execution)
- **Read** — 34 (understanding file contents)
- **Edit** — 28 (CSS/HTML/skill file updates)
- **Glob** — 10 (locating files)
- **TodoWrite** — 7 (tracking fix items)
- **Grep** — 6 (keyword search)

2 files created (`email-template-ko.html`, `email-template-en.html`), 6 files modified. Zero lines of original code written. Pipeline recovered, design fixed, 11 subscribers reached.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
