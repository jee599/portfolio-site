---
title: "Building a Multi-Agent LLM Orchestrator with Claude Code: 86 Sessions of Hard-Won Lessons"
project: "LLMTrio"
date: 2026-03-15
lang: en
pair: "2026-03-15-LLMTrio-ko"
tags: [LLM, orchestration, multi-agent, claude-code, automation]
description: "I built a multi-agent orchestrator that runs 3 LLMs in parallel using Claude Code. 86 sessions revealed security bugs, context loss patterns, and prompt design principles."
---

The idea behind multi-agent LLM orchestration is deceptively simple. Run Claude, Codex, and Gemini simultaneously, then route tasks to whichever model handles them best. After 86 sessions, here is what actually happened: the same security bug surfaced three separate times, TypeScript configuration was ignored in every single session, and API credits ran dry in a single day.

**TL;DR**: In Claude Code multi-agent workflows, context must be injected explicitly -- there is no implicit sharing between agents. Discovered bugs must be committed to code immediately, not filed away for later. The tighter the prompt constraints, the more stable the output.

## One Command, Three LLMs Running in Parallel

Running `npx llmtrio` opens a browser dashboard where you type a task and three LLMs process it in parallel. Under the hood, it is a 2-phase workflow. Phase one generates a plan. Phase two executes it. `scripts/octopus-core.js` serves as the orchestration engine, and `scripts/dashboard-server.js` handles the browser UI.

The system has five core components: the CLI entry point (a `trio` bash script plus `bin/llmtrio.js`), the orchestration engine (`octopus-core.js`), the dashboard server, i18n support for Korean and English, and browser-based authentication. Published as npm package `llmtrio`, version 0.1.1.

## The Three-Phase Multi-Agent Workflow

The most interesting aspect of this project was using Claude Code itself as one of LLMTrio's orchestration targets while simultaneously developing LLMTrio with Claude Code.

The development workflow was locked to three phases. First, an **architect agent** outputs a design plan -- no code, under 200 words. Then a **scaffold agent** generates the skeleton code. Finally, a **code review agent** flags up to five issues across bugs, security, and improvements. Each phase receives the previous phase's output via a `--- Previous phase results ---` delimiter.

Here is what the architect prompt looks like:

```
You are an architect. DO NOT write code. Output a short plan (under 200 words):
components, file structure, interactions.

User request: "..."
```

Explicitly blocking code generation forces the architect to focus on design. Without this constraint, the architect immediately starts producing implementation code.

## Context Confusion: Why "claude book" Kept Appearing in LLMTrio Sessions

Scanning the session logs reveals the request `claude book -- check current project status` appearing dozens of times. These were requests about a completely different project (`/Users/jidong/claude-code-book`) fired inside the LLMTrio context.

A multi-agent pipeline does not maintain context on its own. Each agent only receives the previous phase's results. So every time, the agent had to re-infer whether "claude book" referred to LLMTrio or a separate project. In session 22, the code reviewer asked directly:

> "Wait -- does 'claude book' refer to this LLMTrio project, or is there a separate 'claude book' project? The current working directory is LLMTrio, and there are 4 uncommitted modified files."

The fix was straightforward. Specify the project name and path explicitly in `CLAUDE.md`, or include the full path in every request. Context loss is not a model problem. It is a prompt design problem.

## Why TypeScript Was Ignored for 86 Straight Sessions

The code reviewer flagged the same issue across all 86 sessions. The architect would plan in `.ts`, and the scaffold would implement in `.js`. Here are two examples:

Session 19 (Node.js HTTP server):
> "JavaScript instead of TypeScript. Plan says `server.ts`, scaffold wrote `server.js` with `require()`. Your global config says 'TypeScript first. Never use JavaScript.' Should be `.ts` with `import http from 'http'`."

Session 28 (to-do list CLI):
> "Design is TypeScript but implementation is JS -- architecture defined `types.ts`, `store.ts` and other TS structures, but scaffold produced a single `todo.js` file."

Adding `TypeScript only. Never use JavaScript.` to the scaffold agent's prompt solves this. Catching violations at the generation stage is always better than catching them at review.

## The Same Path Traversal Bug Was Found Three Times Independently

The same path traversal vulnerability in `dashboard-server.js` was independently discovered in sessions 3, 26, and 59.

```js
// Vulnerable code (dashboard-server.js:204)
const taskId = pathname.split('/api/result/')[1];
serveJson(res, path.join(RESULTS_DIR, `${taskId}.json`));
```

Passing `../../etc/passwd` as `taskId` reads arbitrary files from the filesystem. The fix is a single line:

```js
const taskId = path.basename(pathname.split('/api/result/')[1]);
```

The same bug surfaced three times because each session operates independently. In a multi-agent workflow, security issues found during review must be committed to the codebase immediately. If the fix only lives in session notes, the next session's reviewer will find the exact same vulnerability. The discover-then-note-then-fix-later pattern does not work with agent workflows.

## Running Three Opus Instances in Parallel Burned Through Credits in One Day

During sessions 13 through 15, the model identifier showed `<synthetic>` and every response returned `Credit balance is too low`. Running three agents in parallel drains API credits fast. When architect, scaffold, and reviewer all run against a single task, token consumption triples.

Starting from session 16, I switched to `claude-opus-4-6` and topped up credits. Model selection should match task complexity. Using Opus for design and review while running Sonnet for scaffolding delivers better quality per dollar.

## The Official Documentation Crawling Pattern That Failed Every Time

Sessions 44 through 61 included multiple attempts to crawl Claude Code's official documentation. Each attempt hit the same wall:

1. The architect outputs a crawler design (`docs/crawler/fetcher.ts`, etc.)
2. The scaffold tries to generate the code
3. WebFetch requests to `docs.anthropic.com` get redirected to `code.claude.com`
4. The code reviewer reports "the script does not exist yet" because no files were created

In session 59, the reviewer attempted to fetch the docs directly via `WebFetch` and discovered the redirect issue. The log reads: "Documentation redirected to `code.claude.com`. Retrying with the new URL." Crawling requires redirect handling and robots.txt checks before any fetch logic -- simple HTTP requests are not enough.

## Tool Usage Across 62 Sessions

Here is the tool call breakdown across 62 sessions:

| Tool | Calls |
|------|-------|
| `Bash` | ~70 |
| `Read` | ~55 |
| `Agent` | ~15 |
| `Glob` | ~12 |
| `Write` | 4 |
| `WebFetch` | 4 |
| `ToolSearch` | 2 |
| `AskUserQuestion` | 1 |

`Read` and `Bash` dominate because each agent in the multi-agent workflow repeats file exploration to build context. Reducing this overhead requires injecting sufficient project context at the architect phase, or documenting the project structure thoroughly in `CLAUDE.md`.

## Design Principles from 86 Sessions of Multi-Agent Orchestration

What I learned from this project had less to do with LLMTrio itself and more to do with **multi-agent workflow design**.

Context must be injected explicitly. There is no implicit sharing between agents. Discovered bugs must be applied to the codebase immediately to prevent duplicate reports in the next session. The more constraints you put on prompts -- no code generation, TypeScript enforcement -- the more stable the output quality becomes. And credits disappear faster than you expect, especially when running three Opus instances in parallel.

Next steps: applying the path traversal fix and adding TypeScript enforcement to the scaffold prompt.

---

## Related Posts

- [Writing a Claude Code Book with Claude Code -- When PostToolUse Hooks Loop 25 Times](/posts/2026-03-15-claudebook-en)
- [Building a Mentoring Platform with 10 AI Agents: 6 Sessions, 1,289 Tool Calls](/posts/2026-03-15-coffee-chat-en)
- [Building an AI Trading Bot with Claude Code: 14 Sessions, 961 Tool Calls](/posts/2026-03-15-trading-bot-en)
