---
title: "One Line in CLAUDE.md Activated 144 Agents — AgentCrow Setup and Dark Theme Redesign"
project: "portfolio-site"
date: 2026-03-21
lang: en
pair: "2026-03-21-portfolio-site-ko"
tags: [claude-code, agentcrow, multi-agent, automation]
description: "One npx command initialized 144 agents. One line in ~/.claude/CLAUDE.md applied them to every project, forever."
---

1 hour 53 minutes into a dental clinic project session. 240 tool calls in. Five design agents running in parallel — updating Botox section copy, adding doctor schedules, iterating on UI layouts.

Then, mid-session, a different kind of instruction came through:

> "Turn on agent teams globally. And in the global CLAUDE.md, tell Claude to hire up to 4 appropriate agents before starting any task. You have 100+ pre-defined agents, right?"

This wasn't about the dental site. It was about changing how every project works. And it immediately changed portfolio-site too.

**TL;DR** — Added an agent dispatch rule to `~/.claude/CLAUDE.md`, ran `npx agentcrow init` to initialize 144 agent definitions, then used the new setup for a portfolio-site dark theme redesign. One configuration change, every project affected.

## ~/.claude/CLAUDE.md — The Config That Follows You Everywhere

Most people know about project-level `CLAUDE.md`. Drop it in your repo root and Claude Code picks up the rules for that project.

What's less obvious: `~/.claude/CLAUDE.md` is different.

It loads automatically every time Claude Code opens — regardless of which project you're in. It's global config in the truest sense. Rules written there apply to every session, every repo, every context.

I used the `update-config` skill to set up settings.json hooks, then added this to the global CLAUDE.md:

```
Before starting any task, hire up to 4 appropriate agents in parallel.
- Distribute independent tasks (no file conflicts) across parallel agents.
- Separate research/exploration from code modification and run them in parallel.
- Delegate verification tasks — UI audits, design critiques, code reviews — to agents.
```

Four sentences. From that point on, every project gets parallel agent dispatch by default. No per-project setup. No copy-pasting the same rule into every repo's CLAUDE.md. Write it once, get it everywhere.

The insight is easy to miss: global config is for behaviors you want *by default*, not behaviors you opt into per-project. Parallel agent dispatch is exactly that kind of default — useful everywhere, not specific to any one codebase.

## npx agentcrow init — 144 Agents Ready to Go

A global dispatch rule is only useful if there's an agent pool to dispatch from.

Running `npx agentcrow init` creates 144 agent definition files under `.claude/agents/`. Each file is a markdown document defining a specific role: what tasks it handles, which tools it uses, how it evaluates decisions.

`frontend_developer`, `qa_engineer`, `security_auditor_deep`, `korean_tech_writer`, `ui_designer`, `ux_researcher` — 144 of these.

The portfolio-site `.claude/CLAUDE.md` already had the AgentCrow dispatch format:

```
🐦 AgentCrow — dispatching N agents:
1. @agent_role → "task description"
2. @agent_role → "task description"
```

Before `npx agentcrow init`, agent names existed but definitions were sparse — role labels without actual behavioral instructions. After init, each agent has specific working guidelines. The `frontend_developer` agent specifies TypeScript-first, React + Next.js, functional components with hooks. When dispatched, it actually follows that protocol.

The difference: before, dispatching an agent was like assigning a task to a job title. After init, it's like assigning to someone who knows exactly how they work.

## Dark Theme Redesign — First Live Test

The setup was done. The first real test came immediately: a portfolio-site dark theme redesign.

The existing layout was a toss.tech-style light theme. The task: redesign `BaseLayout.astro` and complete dark theme in `global.css`, shifting to a developer portfolio tone while keeping the `#00c471` accent color.

Without agents, this would've been sequential. Understand current structure → design the theme → implement. Natural flow, but research and implementation pile up in the same context window, and the context gets heavier as it goes.

With agents, they separate. A research agent reads the current `BaseLayout.astro` and `global.css` structure. Simultaneously, a UI agent starts designing the dark theme. They're reading different files — no conflicts, no blocking.

Two commits came out in order:

```
feat: dark theme redesign — developer portfolio tone
feat: Base layout + global.css dark theme complete
```

Clean, no merge conflicts.

The structural value isn't just speed. It's context quality. When a single agent handles both "understand the current code" and "rewrite the current code," it's doing two cognitively different tasks in one window. Separating them keeps each agent's context focused on exactly one job.

## This Build Log Is Also Generated by Claude Code

There's a meta layer worth noting.

28 sessions of recorded work across projects. Each session: which prompts were used, which tools ran how many times, which files changed. From that data, Claude Code filters portfolio-site-related work, rewrites it following the `blog-writing` skill guidelines, and saves the file.

The human input: one prompt — "write the portfolio-site build log."

Claude Code invokes the `blog-writing` skill, filters session summaries for portfolio-site work, writes the post, generates the file with the Write tool. The global CLAUDE.md rules apply here too — if agents are useful, they get dispatched.

This is what global config actually unlocks. When the *system* knows how to work, individual tasks get handled correctly by default. Not because each task was carefully prompted, but because the operating rules are already in place.

One line in `~/.claude/CLAUDE.md` changes how 28 sessions of work get processed into a blog post. It changes how the dental site gets designed. It changes how portfolio-site gets rebuilt. Same line, everywhere.

That's the leverage point: not the individual task, but the system that handles tasks.

> One line in `~/.claude/CLAUDE.md` changes every project. Knowing when and how to write that line is the real configuration skill.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
