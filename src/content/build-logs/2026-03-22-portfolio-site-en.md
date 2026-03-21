---
title: "289 Tool Calls, 6 Sessions, and the Git Config Line That Blocked Vercel for 2 Hours"
project: "portfolio-site"
date: 2026-03-22
lang: en
pair: "2026-03-22-portfolio-site-ko"
tags: [claude-code, automation, devto, vercel, blog]
description: "Built a 3-platform auto-publish pipeline with Claude Code. Then spent 2 hours debugging a Vercel block caused by a single git email mismatch."
---

289 tool calls. 6 sessions. 5 projects running in parallel — designmaker, agentcrow, saju_global, spoonai, portfolio-site.

That's a normal day now. What wasn't normal: I spent 2 hours debugging a Vercel deployment block that came down to one line of git config.

**TL;DR**: The `auto-publish` skill I built takes one piece of content and fires it to three platforms simultaneously — spoonai.me (Korean), DEV.to (English), and Naver Blog (Korean HTML). The pipeline works. But before I could test it end-to-end, every push was being rejected by Vercel with a "Git author must have access" error. Root cause: global `git config user.email` set to the wrong account.

Total session breakdown: Bash(127), Agent(38), Read(26), Edit(26).

## Publishing 4 Backlogged Posts in Under 5 Minutes

Four posts had been sitting in `src/content/build-logs/` — two on Claude Code channels architecture, two on dispatch and cowork patterns. Written. Never published.

I dropped the four file paths into Claude Code: "publish these to DEV.to."

Claude read each file, mapped them to the correct directory structure in my `dev_blog` repo, committed, and pushed. GitHub Actions picked it up and called the DEV.to API. All four went up as drafts.

Five minutes, start to finish.

Then I looked at the actual posts.

No SEO. No hooks. Titles were flat and descriptive — no numbers, no outcomes. Descriptions explained the content instead of pulling the reader in. Sections used bullet points, which my writing style rules ban. The tone was textbook, not personal.

Technically correct. Completely unremarkable.

I followed up: "Apply SEO, hooks, and all engagement techniques."

Claude laid out what was wrong: titles with no numbers → low click-through rate. Description is explanation, not invitation. Bullet points instead of prose. No personal voice. Section headings that are neutral when they should provoke curiosity.

Then I dispatched 4 parallel agents — one per post — for simultaneous rewrites. The files don't share state. There's no reason to run them sequentially.

## Why auto-publish Needed Brainstorming First

The initial request was vague: "I want to drop one piece of content and have it go out to multiple platforms automatically."

Before writing a line of code, Claude ran the brainstorming skill. That step isn't optional — it's what separates a pipeline that works from one that gets rebuilt halfway because the assumptions were wrong.

Brainstorming surfaced the questions that matter: What's the input interface — CLI, web, or Telegram? Which platforms, and how much is actually automatable? Where does image generation fit, and does it block publishing?

The answers locked in the architecture before implementation started.

Input accepts any of: URL, keyword, or file. One input generates three outputs — spoonai.me (Korean markdown), DEV.to (English markdown with frontmatter), Naver Blog (Korean HTML). Image generation is delegated to the `dental-blog-image-pipeline` skill, which calls Gemini for illustrations and Playwright for screenshot capture. `auto-publish` calls that skill; it doesn't duplicate it.

Naver is the interesting constraint. No API exists. The automation goes through Cowork — a browser controller that watches `~/blog-factory/naver-queue/` and publishes one post per day using Chrome automation. The publishing step for Naver isn't instant; it's a scheduled queue.

Once the design was locked, I used `writing-plans` to decompose tasks, then `subagent-driven-development` to execute them. Each agent owned one file and worked in parallel.

If I'd skipped brainstorming, the Naver approach would have been discovered mid-implementation — "wait, there's no API?" — and the whole structure would have needed rethinking. Instead, "use Cowork + queue folder" was decided in the design phase, before a single file was touched.

## The Vercel Block That Was One Line Away

The first real test: push to spoonai.me and watch it deploy.

spoonai.me showed a 404. I opened the deployment logs:

```
Deployment Blocked
Git author jidongs45@gmail.com must have access to the team
jee599's projects on Vercel to create deployments.
```

My git commit author email was `jidongs45@gmail.com`. The Vercel project was owned by `jee599`. Vercel's deployment protection requires the git commit author to be a recognized team member — and that email wasn't one.

First instinct: push again. Still blocked.

I hit Redeploy in the Vercel dashboard. "This deployment can not be redeployed." I added team members through Vercel settings. I pushed from a different account (`jidonggg`). Every variation: still blocked.

What I didn't try for a long time: check my local git config.

```bash
git config --list | grep email
```

There it was. Global `user.email` was set to `jidongs45@gmail.com` — an old account I hadn't cleaned up. Every commit I'd made was being authored by an email Vercel had never seen.

The fix:

```bash
git config --global user.email "jee599-account-email@gmail.com"
```

One line. Two hours gone.

I saved this to a memory file (`feedback_vercel_deploy.md`): any time a new repo connects to Vercel, check `git config user.email` before the first push. Pre-deployment step, not afterthought.

## What 38 Agent Calls Actually Means

Bash at 127 calls makes sense — git commands, terminal operations, file inspection. Agent at 38 is the more interesting number.

38 separate delegations: research tasks, parallel rewrites, isolated file edits. When tasks are independent, agents are the right tool. Running them sequentially would be slower for no reason.

The session ran to 22 hours 39 minutes because the Vercel debugging, the auto-publish skill design, and a stack of unplanned fixes all ran together. Long sessions create a specific problem: context compression. When a session runs long enough, earlier decisions get summarized or dropped. You end up asking "why did we do it this way?" and the context isn't there.

The defense: memory files. That day produced three — `project_auto_publish.md`, `project_spoonai_admin.md`, `feedback_vercel_deploy.md`. Critical decisions get written to disk so the next session starts with full context instead of reconstructing from git history.

The Vercel lesson is in memory now. Next time I connect a repo, the first thing Claude will surface is: check your git email.

## Skills Before Code

The pattern that held everything together: use the skill stack before touching any file.

Brainstorming before auto-publish → Naver architecture decided before implementation, not during it.

`writing-plans` before subagent dispatch → tasks decomposed into parallel-executable units with clear ownership.

`subagent-driven-development` for execution → each agent owned exactly one file, no conflicts.

The skill stack acts as a forcing function. It makes you define what you're building before you start, which is the opposite of what feels productive when you're itching to ship.

> A finished pipeline means the next post isn't manual work anymore.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
