---
title: "Turning 105 Session Logs into Build Logs: A Claude Code Automation Pipeline"
project: "portfolio-site"
date: 2026-03-15
lang: en
pair: "2026-03-15-portfolio-site-ko"
tags: [automation, claude-code, build-log, admin, devto]
description: "I built a pipeline that parses 105 Claude Code session logs and auto-generates build log posts. From session parsing to Claude CLI calls to git push -- fully automated."
---

I had 105 Claude Code session logs sitting in `.jsonl` files. Writing build logs meant opening each one, extracting the interesting parts, and assembling them into coherent posts. I never got around to it. So I built an automation pipeline instead. It handles session parsing, build log generation via Claude CLI, git push, and Cloudflare deployment in one pass.

**TL;DR**: I built a pipeline that parses Claude Code `.jsonl` sessions and auto-generates build logs using the Claude CLI. The raw material was always there -- the reason I never wrote those posts was laziness, not lack of content.

## Every Build Log Ingredient Was Already in the Session `.jsonl` Files

Claude Code stores project sessions under `~/.claude/projects/` as `.jsonl` files. Each line contains a single message as JSON: user prompts, Claude's responses, tool call results, and timestamps.

Parse these files and you get "who asked what, which tools Claude used and how many times, and which files were touched." Everything a build log needs was already sitting in those files.

## How the Claude Code Automation Pipeline Works

`scripts/parse-sessions.py` parses `.jsonl` sessions and produces a work summary in Markdown. Pass it a project slug and a date range, and it finds matching sessions, then compiles prompts, tool usage statistics, and changed file lists.

```python
python3 scripts/parse-sessions.py --project portfolio-site --since 2026-03-10 --output summary.md
```

`scripts/generate-build-log.sh` feeds this summary into the Claude CLI. The prompt looks like this:

```
Write a build log for the "portfolio-site" project.
Below is a work summary extracted from Claude Code session logs.
...
You must use the Write tool to create the file.
```

The Claude CLI runs with `--allowedTools "Write Read"`, directly creating files under `src/content/build-logs/`. Once the file is generated, the script auto-runs git commit + push, which triggers a Cloudflare Pages build.

`scripts/project-registry.yaml` defines the mapping between project names and their `.claude/projects` directories. Six projects are registered: `portfolio-site`, `saju_global`, `LLMTrio`, and three others.

Tool usage across the pipeline sessions: Read 19, Write 17, Bash 30, Agent 4.

## The Build Was Broken Before the Pipeline Work Even Started

Before I could build the pipeline, I had to fix a broken production deployment. The portfolio site had been sitting in a failed state.

The error message read:

```
src/content/blog/huggingface-ai-teureiding-arenaeseo-1wi-jeonryageul-humcyeowassda-37oc.md:3:7
"a multiline key may not be an implicit key"
```

The root cause was a `title` field containing a colon (`:`) without being wrapped in quotes. Astro's YAML parser interprets the colon as a key-value separator and throws a multiline key error. This pattern was repeating across several auto-generated AI news files from DEV.to.

The fix was simple -- open the file, wrap the title in quotes. The problem was that multiple files had the same issue. I had Claude scan the entire `src/content/blog/` directory and batch-fix every title containing a colon.

Next was `src/lib/devto.ts`. The DEV.to API sync had stopped working due to a type mismatch in the response handling logic. `src/pages/api/sync-devto.ts` needed fixes too.

Nearly half of the 30 Bash calls went toward fixing build errors. The cycle was: run `npx astro check` for type errors, analyze the build failure log, fix the file, repeat.

## Platform View Counts on the Admin Page

After reviving the build, I added admin features. A platform-specific view count display was added to `src/pages/admin.astro`, backed by two new API endpoints: `src/pages/api/admin-build-logs.ts` and `src/pages/api/admin-projects.ts`.

The overview section now shows view count cards for DEV.to, Medium, and Naver. Having the numbers visible at a glance makes it immediately clear which platform drives traffic.

`src/lib/projects.ts` and `src/content/config.ts` were also updated. Platform view count fields were added to the project schema, displayed via `src/pages/projects/[slug].astro`.

## A Recursive Structure: Calling Claude CLI from Inside Claude Code

The most interesting part of the pipeline is `generate-build-log.sh` calling `claude -p` internally.

```bash
claude -p \
  --model sonnet \
  --permission-mode bypassPermissions \
  --allowedTools "Write Read" \
  --max-budget-usd 1.0 \
  --no-session-persistence \
  "$PROMPT_CONTENT"
```

The `--no-session-persistence` flag ensures each build log generation runs as an independent session. `--allowedTools "Write Read"` restricts file access to prevent unexpected behavior. `--max-budget-usd 1.0` caps spending per generation.

If the session summary exceeds 50KB, it gets truncated with `head -c 50000` to stay within Claude's context limits.

## One Cron Line Generates Build Logs for Six Projects

Running in cron mode makes the entire process automatic. The script checks each project's last build log date, identifies projects with newer sessions, and queues them for processing. After generating all logs, it runs `git commit` + `git push` in one shot. Once pushed, Cloudflare Pages automatically triggers a build.

Adding the `--interactive` flag shows the project list and lets you choose which ones to process. The post you are reading right now was generated by this pipeline.

> The work logs were already there. The reason I never wrote them up was laziness, not lack of raw material.

---

## Related Posts

- [Building a Multi-Agent LLM Orchestrator with Claude Code: 86 Sessions of Hard-Won Lessons](/posts/2026-03-15-LLMTrio-en)
- [Writing a Claude Code Book with Claude Code -- When PostToolUse Hooks Loop 25 Times](/posts/2026-03-15-claudebook-en)
- [Building a Mentoring Platform with 10 AI Agents: 6 Sessions, 1,289 Tool Calls](/posts/2026-03-15-coffee-chat-en)
