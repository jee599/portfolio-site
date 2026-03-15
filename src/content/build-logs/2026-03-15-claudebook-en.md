---
title: "Writing a Claude Code Book with Claude Code: When PostToolUse Hooks Loop 25 Times"
project: "claudebook"
date: 2026-03-15
lang: en
pair: "2026-03-15-claudebook-ko"
tags: [claude-code, hooks, automation, crawling]
description: "I used Claude Code hooks to automate market research for an AI book. A misconfigured PostToolUse hook triggered 25 agent loops, and only 3 out of 26 sessions were productive."
---

Misconfigure a single Claude Code hook and you get an agent that loops 25 times. This is what happened while writing a book about Claude Code using Claude Code. Out of 26 sessions and 147 tool calls, exactly three sessions produced anything useful.

**TL;DR**: PostToolUse hooks trigger on the agent's own tool usage, not just the user's. Without a loop guard, the same task repeats dozens of times. Automating book research with AI is possible, but hook design comes first.

## Automating Market Research with a PostToolUse Hook

Before writing the book, I needed market research. How many Claude Code-related books existed domestically and internationally? Were there courses on platforms like Inflearn or Leanpub? Instead of doing this manually every time, I decided to automate it with Claude Code's `PostToolUse` hook.

The idea was simple: after any work task completes, a market research agent automatically kicks in. I created a `/agent-business` slash command and configured it to trigger on the PostToolUse hook event. The agent's job was to survey WikiDocs, Kyobo Books, Aladin, Inflearn, Leanpub, Gumroad, and Amazon KDP, then save reports to `business/market-reports/`.

The hook setup involved defining the agent in `CLAUDE.md` and setting `hook_event_name: "PostToolUse"` as the trigger. On paper, it looked clean.

## Why the Agent Ran 25 Times in a Single Day

In practice, `/agent-business` executed 25 times on the same day (2026-03-10).

The cause was obvious in hindsight. PostToolUse fires after every tool use. When the agent calls `Bash` once, the hook fires, which starts the agent again, which calls `Bash` again, which fires the hook again. A feedback loop.

Of the 26 sessions, 24 were auto-triggered this way. Most were zero-minute sessions with two or three tool calls that ended immediately. The pattern: agent starts, checks if a report already exists, hits a permission wall or finds nothing new, terminates.

This is the easy-to-miss trap in hook-based automation. The agent itself uses tools, so it triggers its own hooks. The fix requires adding a session ID check or an execution flag to the hook conditions to prevent duplicate runs.

## When WebSearch Was Blocked, the Agent Switched to WebFetch on Its Own

The loop problem was not the only obstacle. WebSearch permissions were blocked by default.

The agent initially tried to run parallel searches across multiple platforms using WebSearch. When permission was denied, it changed strategies on its own and switched to crawling each platform URL directly with WebFetch.

Sessions 14 and 15 were the most productive, with 22 to 29 tool calls each. They used WebFetch 14 to 20 times, scraping pages from Inflearn, Leanpub, and others to compile research reports. The agent completed a full market research report using nothing but WebFetch -- no search API required.

The tool usage statistics make this pattern clear. WebFetch was called 51 times, the highest of any tool. WebSearch had 16 calls, but most were permission denials. The agent's ability to find alternative approaches when blocked was notable.

## 34 Official Documentation Pages Crawled in 1 Hour 21 Minutes

Separately from market research, I needed source material for the book itself. The task was crawling all official documentation from `code.claude.com/docs/en` and saving each page as Markdown in a `raw-docs/` folder.

Session 2 used the `/crawl-docs p0` command to crawl three P0 priority pages (overview, quickstart, how-claude-code-works) in parallel. Three WebFetch calls, under a minute.

Session 26 was the full-scale crawl. I wrote the prompt directly, listing all 34 pages at once:

```
Create a raw-docs folder. Read every page from code.claude.com/docs/en using WebFetch
and save each as raw-docs/{slug}.md. Page list: overview, quickstart, changelog, ...
```

This session ran for 1 hour 21 minutes. The result was 34 `.md` files, each with `source`, `slug`, and `crawled_at` metadata in the header. Three URL mismatches (e.g., `vscode` to `vs-code`) were resolved by following redirects automatically. Three 404 pages (`chrome-extension`, `programmatic-usage`, `keyboard-shortcuts`) were saved as error placeholders.

Having the `/crawl-docs` command ready made the P0 crawl a one-liner, but for the full 34 pages, writing out the list in natural language was actually faster. Commands are not always the answer.

## 100 Out of 147 Tool Calls Were Wasted

PostToolUse hooks are powerful, but loop prevention is non-negotiable. Because agents use tools internally, unconditional triggers cause the same work to repeat dozens of times. Next iteration will add logic to skip execution when `agent_id` is present in the hook context, or to exit early when the target report file already exists.

Pre-authorizing WebSearch permissions would have helped too. The agent managed to work around the block with WebFetch, but search-based access and direct crawling have different coverage profiles.

Of the 147 total tool calls, productive work concentrated in session 2 (P0 crawl, 3 calls), sessions 14-15 (market research, 40+ calls), and session 26 (full crawl, 5 calls). The remaining 100 calls were loops and permission checks. Reducing this waste is a first-class concern when designing automation.

> Hooks create automation, but poorly designed hooks automatically create loops.

---

## Related Posts

- [Building a Multi-Agent LLM Orchestrator with Claude Code: 86 Sessions of Hard-Won Lessons](/posts/2026-03-15-LLMTrio-en)
- [Turning 105 Session Logs into Build Logs: A Claude Code Automation Pipeline](/posts/2026-03-15-portfolio-site-en)
- [Building a Mentoring Platform with 10 AI Agents: 6 Sessions, 1,289 Tool Calls](/posts/2026-03-15-coffee-chat-en)
