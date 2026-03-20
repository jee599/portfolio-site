---
title: "539 Tool Calls in 37 Hours: What Multi-Agent AI Dispatch Actually Looks Like"
project: "portfolio-site"
date: 2026-03-20
lang: en
pair: "2026-03-20-portfolio-site-ko"
tags: [claude-code, agentcrow, multi-agent, ai-automation]
description: "23 sessions, 900+ tool calls. One session ran 37h with 539 calls and built SpoonAI from zero. Exact breakdown of parallel agent dispatch — where it wins, where it breaks."
---

The session ran for 37 hours and 13 minutes. 539 tool calls. 60+ files generated from scratch. By the end of it, SpoonAI had a working skeleton.

**TL;DR** I deployed AgentCrow — a multi-agent dispatch system built into my Claude Code setup — across real projects. Pikachu volleyball multiplayer took 1h 53m and 197 tool calls. SpoonAI, an AI news aggregation platform, went from zero code to full skeleton in one session. Here's what parallel agent dispatch actually looks like in practice, where it breaks down, and the exact lessons from 23 sessions and 900+ tool calls.

## "Build Me Pikachu Volleyball Multiplayer"

That was the entire prompt.

AgentCrow dispatched four agents immediately: `game_designer`, `frontend_developer`, `backend_architect`, `qa_engineer`. The first three ran in parallel — design doc, Next.js client, WebSocket server, all simultaneously. Once those three finished, `qa_engineer` wrote the tests.

Result: 1 hour 53 minutes. 197 tool calls. Build passed. Type checks clean. 92 tests, all green.

The user's response: "Are you serious?"

The sprites were wrong. The physics were off. The 8-directional spike was missing. Jump-then-dive input was broken. Agents had built something that ran — but it wasn't Pikachu volleyball. It was a functional multiplayer game wearing the name as a costume.

The second round gave agents explicit instructions: find the original source repository, reverse-engineer the physics engine and sprite logic. Ball initial y-coordinate. Dive deactivation mid-jump state. Enter + directional key combo for spike. Exact constants from the original code, restored.

The lesson is blunt. "Build Pikachu volleyball" is too abstract. "Find the original pikachu-volleyball repo and implement the physics identically" is the right prompt. Output quality scales directly with prompt specificity.

## From Spec to Skeleton in 37 Hours

SpoonAI is an AI news auto-aggregation → email newsletter → web platform. The spec was already written. Phase 1 through 3, fully documented. Zero lines of code.

Session 6 started here. 37h 13m. 539 tool calls. Write 84 times. Bash 242 times. Read 74 times. Edit 49 times.

Before writing any code, agents scaffolded the directory structure, locked down config files, then generated components in parallel. Page files simultaneously. Three pieces of test content auto-populated.

60+ files created in a single session. `app/`, `components/`, `lib/`, `content/` — the full project structure, one shot.

It wasn't smooth the entire 37 hours. The user kept changing the design. "Make it trendier overall." "Images cannot break, period." "Use this logo instead." Each change triggered a fresh dispatch: UI/UX designer, frontend implementer, typography + color specialist. Three agents redesigning simultaneously, build success verified at the end of each round.

SpoonAI triggered AgentCrow dispatch 10+ times across the session. Each dispatch handled independent tasks in parallel. The only sequential work: cases where two agents would've touched the same file.

## Three Sessions That Got Stuck on One Bug

The remark-gfm strikethrough bug was the most frustrating stretch.

The problem: remark-gfm v4 ships with `singleTilde: true` by default. In Korean, `~` is used constantly for ranges — `2~3년` (2–3 years), `~32억` (~3.2B KRW). When two tildes appear in the same markdown document, everything between them gets strikethrough formatting applied.

Session 10: dispatched 3 agents in parallel to fix `lib/content.ts` and replace tildes across existing markdown files. Deployed.

Then the session got stuck. Whether the deploy actually completed was unclear.

Session 11: "Previous session was stuck, starting fresh." Same work, again.

Session 12: same again.

Tool call breakdown: Session 10 was Bash 11 + Agent 3. Session 11 was Bash 17 + Edit 5. Session 12 was Bash 19 + Edit 5. Nearly identical patterns across all three sessions.

The fix itself was straightforward: `remarkGfm({ singleTilde: false })` in `lib/content.ts`, then replace all `A~B` range patterns with en-dash `A–B` across existing markdown files. Added a writing rule to the skill file so future AI-generated posts don't use `~` for ranges at all.

The lesson for stuck-session recovery: explicitly state current state in the restart prompt. "You may have already added `singleTilde: false` — check the current file state before making any changes." Without that, agents redo completed work and you burn three sessions on a single bug.

## Turning Off Vercel Auto-Deploy

Every `git push` was triggering a Vercel build attempt and sending error emails.

The cause was account mismatch. The account connected in the Vercel dashboard didn't match the account doing actual pushes, so auto-build failed structurally every time. The only deploy path that actually worked was:

```bash
vercel build --prod && vercel deploy --prebuilt --prod --archive=tgz
```

The fix was one line in `vercel.json`:

```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

No more error emails. Push-triggered auto-deploy is cleaner when it works — but with a tangled account configuration, it's pure noise. Prebuilt deploy is slower but reliable.

## When Parallel Agent Dispatch Actually Works

The pattern clarified after 23 sessions.

It works when tasks touch different files. "Server code changes" and "client UI changes" live in completely separate parts of the tree — zero conflict, full parallel. The SpoonAI typography agent and layout agent running simultaneously worked for exactly the same reason.

It doesn't work when two agents need to modify the same file. If both are editing `lib/content.ts`, whichever finishes second overwrites the first.

The 37-hour session was productive because most tasks were file-independent by nature. Next.js routing, component implementation, content generation — all happening in different directories simultaneously.

> Parallel agent dispatch is fundamentally a question of file scope. Non-overlapping scopes: parallel wins. Overlapping scopes: sequential is the answer.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
