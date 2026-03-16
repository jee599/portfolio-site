---
title: "How I Automated Build Logs by Parsing Claude Code's JSONL Files (272 Tool Calls)"
project: "portfolio-site"
date: 2026-03-16
lang: en
pair: "2026-03-16-portfolio-site-ko"
tags: [claude-code, automation, portfolio, build-log]
description: "Built a pipeline that parses Claude Code's .claude JSONL session files to auto-generate build logs. Converted portfolio to a project hub in 272 tool calls."
---

Every session ended with me trying to reconstruct what I'd done from memory. That's how build logs stay unwritten.

**TL;DR** Claude Code stores every conversation as JSONL under `.claude/projects/`. I built a pipeline that parses those files and auto-generates build logs. While I was at it, I converted my portfolio from an AI news aggregator into a proper project hub.

## From "What's JSONL?" to a Working Pipeline

Midway through a session I asked: "You mentioned `.claude` stores local conversations — how can I actually use that?"

The answer: `.claude/projects/` contains one JSONL file per project directory. Each line is a message event — user prompts, assistant responses, tool call results, everything.

The connection was immediate. If I can parse this, I can automatically reconstruct what I asked and what Claude did.

`scripts/parse-sessions.py` does the extraction: pull out user prompts, count and categorize tool calls, list modified files. That structured output goes back to Claude to draft the build log.

`scripts/generate-build-log.sh` chains the whole thing: run `parse-sessions.py` → pass results to Claude → generate markdown → save to `src/content/build-logs/`.

```bash
./scripts/generate-build-log.sh portfolio-site 2026-03-16
```

It's semi-automatic, not fully automatic. Someone still needs to review the parsed context before handing it to Claude — the signal-to-noise ratio in raw JSONL isn't perfect. Full automation is the next iteration.

## Why Rebuild the Portfolio Now

[jidonglab.com](https://jidonglab.com) had started looking like an AI news site. Daily news posts at 9 AM, projects tucked into a corner tab. Not the first impression I wanted.

The data problem: 11 local git projects, only 7 listed on the portfolio. Build logs were manually written, so they were sporadic. A visitor couldn't tell what kind of builder I am.

The new structure: a project registry mapping slugs to local git paths, YAML-based project metadata in `src/content/projects/`, a `visible` field to control what's shown, and an admin UI to manage it all. Auto-generated build logs attach to each project automatically.

`scripts/project-registry.yaml` defines the slug → local path + branch mapping. Flipping `visible` in admin should instantly control production visibility. That's where the first real problem showed up.

## GitHub API 403 and the Permissions Rabbit Hole

Changing a project's `status` in admin returned `github api error 403`.

The cause was straightforward: updating Content Collections YAML through an API requires committing directly to GitHub, which requires `contents: write` scope. The token I was using was read-only.

Created a new Fine-grained Personal Access Token with `Contents: Read and write`. Problem solved — except it wasn't.

The token worked, but changes to YAML files needed to trigger a Cloudflare Pages redeploy. Wiring that end-to-end took another 30 minutes: `api/admin-projects.ts` → GitHub API call → commit creation → Cloudflare webhook trigger.

The chain now works. Flip status to `active` in admin, the YAML commits, production reflects it within 5 minutes.

## Translating 6 Build Logs in Parallel with Agents

After generating the first build log, I went to publish it to DEV.to and realized: no English version. Six Korean build logs needed translation all at once.

I launched a single subagent with the Agent tool: "Translate 6 build logs to English." Twelve files (6 Korean/English pairs) came back in one shot.

The prompt specifically asked for rewrites from an English developer's perspective, not direct translation. Korean-specific context got a one-sentence explanation; sections less relevant to a global audience got deprioritized. The output quality was solid.

The reason parallel agents work well here is context isolation. Processing 6 long documents sequentially in the main thread fills up the context window — later translations degrade because the model is juggling too much. Each subagent starts clean.

## What 272 Tool Calls Actually Looked Like

Bash led at 158 calls — git status checks, YAML file creation, Python script runs, API tests. Heavy terminal work throughout. Edit was 43, Write was 19.

The pattern that worked: ask Claude to write a plan document first, review and approve it, then say "Implement the following plan:" with the spec attached. Claude knows exactly what to build, so iteration time drops.

The pattern that didn't: "Fix this until it works perfectly" with a vague target. The GitHub API 403 debug loop was that case. Giving Claude the specific error message and the exact expected behavior is faster every time.

> The JSONL was always there. I just wasn't using it.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
