---
title: "I Built a 3-Platform Blog Pipeline with Claude Code — Then Lost 2 Hours to One Git Email"
project: "portfolio-site"
date: 2026-03-22
lang: en
pair: "2026-03-22-portfolio-site-ko"
tags: [claude-code, automation, devto, vercel, blog]
description: "Built an auto-publish pipeline for spoonai, DEV.to, and Naver using Claude Code multi-agent dispatch. Then a single mismatched git email blocked Vercel for two hours."
---

289 tool calls. 6 sessions. 5 projects running simultaneously — designmaker, agentcrow, saju_global, spoonai, portfolio-site.

That's become a normal day. What wasn't normal: I spent two hours debugging a Vercel deployment block that came down to a single line in `~/.gitconfig`.

**TL;DR** The `auto-publish` skill takes one piece of content — a URL, keyword, or file — and publishes to spoonai.me (Korean), DEV.to (English), and Naver Blog (Korean HTML) simultaneously. The pipeline works. Getting there involved 289 tool calls and a Vercel incident that had nothing to do with Vercel. Session breakdown: Bash(127), Agent(38), Read(26), Edit(26).

## Publishing 4 Backlogged Articles Without Touching a Dashboard

Four articles had been sitting in `src/content/build-logs/` — two on Claude Code channels architecture, two on dispatch and cowork patterns. Written, reviewed, never published.

I dropped four file paths into Claude Code: "publish these to DEV.to."

Claude's execution was sequential and predictable: read each file → map to the `dev_blog` repo structure → place the markdown files → `git push`. GitHub Actions picked it up and called the DEV.to API. All four went up as drafts in under five minutes.

Then I actually read what had been published.

No SEO. The articles were written outside the blog skill workflow, so none of the hooking logic had been applied. I followed up: "Apply SEO, hooks, and everything that improves engagement."

Claude ran a gap analysis before touching anything:

- Titles had no numbers or outcomes — low click-through rate
- Descriptions were explanatory, not curiosity-driving
- Bullet points everywhere — explicitly prohibited by the writing style rules
- No personal voice; reads like documentation
- Section headings were neutral when they should provoke curiosity

Four parallel agents, one per article, rewrote them simultaneously. No shared state between articles means no reason to run them sequentially. The rewrites took about fifteen minutes. Doing it manually would have taken most of a workday.

## Why auto-publish Needed Brainstorming Before a Single Line of Code

The initial ask was vague: "I want to drop one piece of content and have it go out to multiple platforms automatically."

Before writing anything, Claude ran the brainstorming skill. That step isn't a formality — it's what separates a pipeline that gets built once from one that gets rebuilt halfway because the design assumptions were wrong.

Brainstorming surfaces the questions that matter: What's the input interface — CLI, web, or Telegram? Which platforms, and how much of each is actually automatable? Where does image generation fit — does it block publishing or run in parallel?

The answers defined the architecture before implementation started:

- **Input**: URL, keyword, or file — any of the three
- **Output**: three simultaneous publications
  - spoonai.me — Korean markdown, git-based deployment
  - DEV.to — English markdown, git push → GitHub Actions → DEV.to API
  - Naver Blog — Korean HTML, Cowork + Chrome automation, processes `~/blog-factory/naver-queue/` one post per day

Image generation is its own skill. The `dental-blog-image-pipeline` skill calls Gemini for illustrations and Playwright for capture. `auto-publish` calls that skill as a dependency — it doesn't duplicate the logic.

Naver is the interesting constraint. There's no public API. The automation runs through Cowork, a browser controller that watches the queue folder and publishes via Chrome automation. Naver publishing isn't instant; it's a scheduled queue.

The critical decision — "Naver goes through Cowork" — came out of brainstorming, before any file was touched. If that decision had been discovered mid-implementation instead, the entire structure would have needed rethinking with code already written.

Once the architecture was locked, `writing-plans` decomposed the work into tasks. `subagent-driven-development` executed them — one agent per file, running in parallel.

> Design first. Implementation is just execution.

## The Vercel Block That Was One Git Config Line Away

First real test: push to spoonai.me and watch it deploy.

spoonai.me returned 404. I opened the deployment logs:

```
Deployment Blocked
Git author jidongs45@gmail.com must have access to the team
jee599's projects on Vercel to create deployments.
```

My git commit author email was `jidongs45@gmail.com`. The Vercel project owner was `jee599`. Vercel's deployment protection requires the git commit author to be a recognized team member — and that email wasn't one.

My debugging path:

Push again → still blocked. Hit Redeploy in the Vercel dashboard → "This deployment can not be redeployed." Added team members through Vercel settings → still blocked. Pushed from a different GitHub account (`jidonggg`) → still blocked.

Every attempt targeted Vercel's configuration. None worked, because the problem wasn't Vercel's configuration.

```bash
git config --list | grep email
# user.email=jidongs45@gmail.com
```

My global `user.email` was set to `jidongs45@gmail.com` — an old account never cleaned up. Every commit I made, regardless of which GitHub account I pushed from, was authored by an email Vercel had never seen.

The fix:

```bash
git config --global user.email "jee599-account-email@gmail.com"
```

One line. Two hours gone.

I wrote this to `feedback_vercel_deploy.md` in the Claude Code memory system: before connecting any new repo to Vercel, verify `git config user.email` matches the Vercel account email. It's the first check, not the last resort.

## What 38 Agent Calls in One Session Actually Means

Bash at 127 calls is expected — git operations, terminal commands, file reads. Agent at 38 is the more telling number.

38 separate agent delegations across the day: research tasks, parallel rewrites, isolated file edits. When tasks are independent, multi-agent dispatch is the correct tool. Running them sequentially is slower for no reason. This is the multi-agent AI automation pattern at its most straightforward: identify independent tasks, dispatch in parallel, merge results.

The session ran to 22 hours 39 minutes — the Vercel incident, the `auto-publish` skill design, and a pile of unplanned fixes stacked together without a session break. Long sessions create a specific problem: context compression. When a Claude Code session runs long enough, earlier decisions get summarized out of context. Later in the session, you're asking "why did we structure it this way?" and the reasoning isn't there.

The defense is memory files. Three were created that day: `project_auto_publish.md`, `project_spoonai_admin.md`, `feedback_vercel_deploy.md`. Critical decisions get written to disk so the next session starts with full context instead of reconstructing from git history.

## The Skill Stack as a Forcing Function

What held the day together was a consistent sequence: invoke the relevant skill before opening any file.

Brainstorming before `auto-publish` → the Naver architecture was decided before implementation, not during it. No mid-build direction changes.

`writing-plans` before subagent dispatch → work decomposed into parallel-executable units with clear ownership and no shared state conflicts.

`subagent-driven-development` for execution → each agent owned exactly one file. No coordination overhead, no merge conflicts.

The skill stack acts as a forcing function. It makes you define the design — constraints, approach, non-obvious decisions — before writing any code. That feels counterproductive when you want to ship something fast. But skipping it means the "figuring out" happens during implementation, which costs more than doing it upfront.

The Vercel incident was the inverse: no amount of design work helps when the root cause is a config value you don't know is wrong. That's where systematic debugging matters — start from the error message, eliminate one variable at a time. I added variables instead of eliminating them, which is why two hours went by. The lesson is in the memory file now.

> A finished pipeline means the next post isn't manual work anymore.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
