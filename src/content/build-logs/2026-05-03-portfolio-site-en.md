---
title: "From Static Portfolio to Build-in-Public Feed — jidonglab v4 Redesign"
project: "portfolio-site"
date: 2026-05-03
lang: en
pair: "2026-05-03-portfolio-site-ko"
tags: [claude-code, design, astro, refactor, workflow, multi-agent]
description: "8 sessions, 565 tool calls. How I scrapped a v3 portfolio and rebuilt jidonglab as a live build-in-public feed powered by Claude Code sessions."
---

565 tool calls across 8 sessions — and the most significant decision today wasn't a code change. It was a question of identity: what is this site actually for?

**TL;DR** — I converted jidonglab from a static portfolio into a build-in-public stream where Claude Code session records flow automatically. The `claude-design-lite` skill reproduced the claude.ai/design workflow locally, landing on an `editorial-mono` direction. Also: ripped out all AgentCrow remnants from 6 projects.

## Why I Scrapped v3

v3 used a cream + acid + rust paper tone palette. It looked fine. But when I asked myself "what does a visitor actually come here to see?", I couldn't answer it.

Project lists? Already on GitHub. Bio and work history? LinkedIn. Resume? Dozens of people have one.

The one thing that's genuinely different — the thing nobody else has — is a daily record of what I'm building with Claude Code and how. Not polished write-ups after the fact. The process itself, as it happens.

The specific moment of realization came during session 3, while looking at the v3 project cards. Each one was frozen in time: a screenshot, a description written when the project launched, a GitHub link. None of them conveyed what had changed since, what was currently being worked on, or what the project looked like under the hood. The portfolio was a museum exhibit, not a working record.

In 2026, a static portfolio communicates the wrong thing. It implies: "here are things I finished." For anyone building seriously with AI tooling, the more honest signal is the velocity — how often new things are being shipped, how the workflow is evolving, what tradeoffs are getting made in real-time. That's the thing that's hard to fake and hard to copy. It's also the thing that static portfolios structurally cannot show.

Build-in-public, as a solo developer, means something specific. It doesn't mean tweeting every commit or performing productivity for an audience. It means structuring your own output in a way that leaves a readable record — for yourself as much as anyone else. The Claude Code session logs already exist; the work was just routing them somewhere useful.

So I changed the site's core premise: copy gets written once, content gets updated daily by the system.

## Running a Design Workflow with claude-design-lite

In session 8, I typed "redesign" and the `claude-design-lite` skill kicked in. It's a local skill that ports the system prompt from claude.ai/design, so the workflow is nearly identical:

1. Enter designer persona, run a question round to gather constraints
2. Declare the design system — typography, color, spacing principles
3. Generate 3 HTML variants in parallel
4. Run `design-reviewer` validation, then pick a direction

The question round surfaced several decisions that would have gone unexamined otherwise. Should the design lean technical (monospace-heavy, terminal-adjacent) or editorial (serif-mixed, content-forward)? What's the hierarchy between the activity feed and the project grid — which one is the landing emphasis? How much visual weight should metadata like timestamps and tool-call counts carry? Those aren't questions I would have consciously written down before starting; the question round extracted them.

The three variants generated were: `editorial-mono.html`, `terminal-grid.html`, and `card-system.html`. `terminal-grid` went heavy on monospace and low-contrast green-on-dark, which fit the "developer tool" aesthetic but competed with the content — the feed entries got lost in the texture. `card-system` was clean but generic, the kind of design that could be a SaaS dashboard or a portfolio or a blog; it had no particular character. `editorial-mono` used a monotone base with IBM Plex Mono as the dominant typeface, a single green accent (`#00c471`), and treated whitespace as a structural element rather than padding.

The winner was `editorial-mono.html`. Monotone base, single accent color, content as the primary element with UI receding into the background. I confirmed the choice by opening `http://localhost:8765/editorial-mono.html` locally and comparing all three.

"UI receding into the background" is worth spelling out concretely. In `editorial-mono`, the nav has no background color — it's just text and spacing. Section headers are lighter than body text. The only element with significant color weight is the accent on active/hover states and the timestamp links. The result is that your eye goes directly to the feed entry content, not to the chrome around it. In a design where the content updates daily, that's the right trade. You don't want the frame competing with the picture.

> In a build-in-public stream, complex design buries the content. The more transparent the UI, the better.

The multi-agent structure here matters: generating three variants in parallel rather than sequentially means you're comparing options, not just iterating on one. The `design-reviewer` sub-agent running afterward as a separate pass catches things you miss when you're both designer and decision-maker.

## The Core Feature: Automatic Activity Feed

The center of the new site is automatic extraction of Claude Code session records. Prompts, task fragments, commits, and result snippets flow in chronological order. Each project card carries live "last activity" data.

```json
{
  "items": [
    {
      "type": "commit",
      "project": "coffeechat",
      "message": "feat: google meet oauth integration",
      "ts": "2026-05-01T14:23:00Z"
    },
    {
      "type": "session",
      "project": "portfolio-site",
      "summary": "jidonglab v4 리디자인 editorial-mono 방향 확정",
      "tool_calls": 57
    }
  ]
}
```

The pipeline combines the GitHub API with Astro Content Collections build logs, assembled at static generation time. At build time, Astro fetches recent commits from the GitHub API across a defined list of repos (the active project set), pulls per-repo metadata like last-push timestamps and open issue counts, and merges that with the build-log entries already living in `src/content/build-logs/`. The merged output gets written into the feed component as static props — no client-side fetching, no edge functions, just data baked in at generation.

The Astro Content Collections schema for build logs includes `project`, `date`, `lang`, `pair` (for the KR/EN pair link), `tags`, and `description`. The `pair` field is what makes the bilingual structure work — each EN post points at its KO counterpart by slug, and the language switcher resolves the link client-side without a full page reload.

It's not real-time — but with GitHub Actions running daily, updates land on a 24-hour cadence. For a build-in-public feed, that's more than enough. The tradeoff is explicit: real-time would require an API route with `prerender = false`, which means Cloudflare Worker compute on every page load and a dependency on GitHub API rate limits at request time. Static generation moves all of that to build time, where a rate-limit miss or a slow API response only affects the CI run, not the visitor experience. Daily cadence is also honest — it reflects actual session frequency rather than pretending activity is more granular than it is.

Right now, `mock-feed.json` is holding the position in the v4 HTML. Wiring it to real data is the next session's job.

## Hooking into claude-design-lite Automatically

Session 4 added a hook so I never have to type `/claude-design-lite` explicitly. When phrases like "redesign" or "fix the UI" show up, the skill fires automatically via a hook in `~/.claude/settings.json`.

The hook mechanism in Claude Code works through `UserPromptSubmit` hooks defined in `settings.json`. When a user message arrives, the hook script runs first. The structure looks like this:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/design-trigger.sh"
          }
        ]
      }
    ]
  }
}
```

`design-trigger.sh` receives the prompt text via stdin, runs a keyword check against a list of design-related terms (`redesign`, `UI`, `layout`, `prototype`, `visual`, `color`, `typography`, `wireframe`), and exits 0 if no match. When a match fires, the script injects `additionalContext` into the hook response that tells Claude to invoke the `claude-design-lite` skill before proceeding. The skill then runs its full 6-step workflow — question round, design system declaration, parallel variant generation, reviewer pass, direction confirmation — without any manual invocation.

The trigger conditions live in `~/.claude/hooks/design-trigger.sh`. Keyword match → skill invocation, no intermediate confirmation prompt. The 6-step design workflow starts immediately.

This is a pattern worth noting: quality enforcement through structure, not through manually remembering to run the right command. If you rely on remembering to invoke the design workflow, you'll skip it when you're in a hurry. A hook removes the decision entirely. The same principle applies to the `code-verifier` invocation after every implementation — it runs because the pipeline enforces it, not because I remember to type it. Automation removes the cognitive load of process adherence and makes the process reliable by construction.

## Purging AgentCrow from 6 Projects

Session 5 was mostly cleanup. An earlier experiment with AgentCrow had left symbolic links and boilerplate scattered across 6 projects.

AgentCrow was an early attempt at a centralized agent configuration system — the idea was to define shared agent specs once in `.agentcrow/agents/md/` and symlink them into each project's `.claude/agents/` directory. The theory was good: single source of truth for agent definitions, no duplication. The practice was that it introduced filesystem coupling between projects that had no other dependency on each other, and when AgentCrow stopped being maintained, every project had dangling symlinks and embedded config sections that referred to a tool that no longer existed.

Three categories of artifacts to remove:

1. **`.claude/agents` symlinks** — 6 projects (`saju_global`, `claude-code-book`, `uddental`, `portfolio/portfolio-site`, and two others) each had a symlink pointing to `.agentcrow/agents/md`
2. **AgentCrow sections in `CLAUDE.md`** — 8 files had these embedded
3. **AgentCrow entries in `settings.local.json`**

The cleanup script walked each project directory, removed symlinks matching the `.agentcrow` target, stripped AgentCrow config blocks from `CLAUDE.md` files using a sed pattern that matched the section boundaries, and removed the relevant keys from `settings.local.json`.

On the first pass, the `code-verifier` sub-agent caught 3 files inside the `saju_global` worktree that the cleanup script had missed — the scan hadn't descended into worktrees. Second pass got them all.

This is exactly the kind of thing you miss without a verification step. The initial implementation looked complete. It wasn't. The `find` command in the cleanup script used `-maxdepth 3`, which was enough for standard project layouts but not for projects with active worktrees checked out at `.claude/worktrees/`. Having `code-verifier` run as a separate agent after every implementation pass is what caught it. The verifier re-ran the scan with no depth limit and found the residual files. That's the value of an independent check: it doesn't share the assumptions that shaped the initial implementation.

## Building the report-builder Skill

Session 7 produced a new skill: `report-builder`. The trigger phrase is "보고서" / "리포트" / "report", and the pipeline runs end-to-end without manual steps:

```
Trigger: "보고서", "리포트", "report"
→ One clarification round (confirm deep-search direction)
→ 4 sub-agents run parallel research
→ Generate HTML report
→ git push → publish to GitHub Pages (jee599/reports)
```

The 4-agent parallel pattern works because the research sub-problems are genuinely independent. For a market report, the four threads might be: recent news and events, quantitative data and statistics, competitive landscape, and expert opinion or analysis. None of those depends on the output of the others. Running them sequentially would mean each agent starts fresh anyway — you gain nothing from ordering them, and you pay the full latency of each in series. Parallel dispatch cuts the wall-clock time to roughly that of the slowest single agent, which in practice means a full research pass completes in the same time as one sequential search.

The synthesis pass runs after all four complete. It reads all four research outputs, reconciles contradictions, identifies gaps, and generates the final HTML report. The synthesis agent is the only one that sees the full picture; the research agents are deliberately scoped to avoid over-anchoring on each other's framing.

The HTML report output is a self-contained single-file document: inline styles, no external dependencies, structured with a cover section, executive summary, main body with subsections, and a sources appendix. It's designed to be readable directly from GitHub Pages without a build step or a framework. The publishing step is a single `git push` to the `jee599/reports` repo with the report file, and GitHub Pages serves it immediately.

This isn't directly wired to the portfolio site, but it's a reusable infrastructure piece for solo-developer market research. I ran it for the first time on an AX job market report — specifically looking at demand for AI experience operators versus traditional automation roles across Southeast Asia, where the skills premium for AI tooling proficiency is visible in posted salaries but not yet in hiring volume. The report found a 6-month lag between capability availability and employer awareness of what to ask for, which is useful context for timing.

The interesting part is the parallel dispatch: 4 sub-agents researching independently, then a synthesis pass. With Claude Code's multi-agent support, this takes roughly the same wall-clock time as a single deep search, but covers more ground. The bottleneck shifts from "how long does research take" to "how good is the synthesis."

## The Numbers

8 sessions, 565 tool calls. Tool distribution: Bash 242, TaskUpdate 71, Read 50, Agent 37, Edit 32.

The Agent count of 37 is the notable one. That's 37 sub-agent invocations — research, implementation, and verification each delegated to separate agents rather than handled inline. The main orchestrator stayed focused on routing and reporting, which is the intent.

A Bash:Agent ratio of roughly 6:1 (242 vs 37) tells you something about the session structure. The majority of tool calls are direct operations — file reads, git commands, script executions. The Agent calls are the delegation points: each one launches a sub-agent with fresh context and a defined scope. At 37 across 8 sessions, that's an average of about 4-5 sub-agent invocations per session. Some sessions (session 5, the cleanup) were mostly Bash; session 7 (report-builder) and session 8 (redesign) each had higher Agent counts because those workflows are explicitly parallel.

For comparison: without multi-agent, the same session content would likely show a similar Bash count but near-zero Agent calls. The work doesn't disappear — it just concentrates in the main context, which means the orchestrator spends cognitive capacity on implementation details rather than routing. The practical effect is context bleed: when you're implementing and verifying and researching all in the same thread, each task is slightly worse because the context it's operating in contains noise from the others. Separate agents have clean contexts.

32 files created, 9 files modified. Session 8 alone — 57 tool calls — finalized the jidonglab redesign direction and defined the `mock-feed` data structure.

## What's Next

`mock-feed.json` is a placeholder in the v4 HTML. The next session connects it to real data: GitHub API for commits and activity, Astro Content Collections for session build logs. When the feed populates with live data at build time, v4 is done.

Section layout is decided: cut anything redundant, lead with active projects. The site should read like a dashboard of what's being built right now, not a record of what was built before.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
