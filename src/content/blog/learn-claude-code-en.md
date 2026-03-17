---
title: "learn-claude-code: 12 Sessions From a While Loop to Multi-Agent Teams, Zero Frameworks"
date: 2026-03-17
description: "A 23k-star project that teaches how AI coding agents work by building one from scratch. One loop, one tool, 12 progressive sessions."
tags: ["ai", "agent", "python", "opensource"]
lang: "en"
source: "original"
---

An agent is a while loop.

That single sentence is the core thesis of [learn-claude-code](https://github.com/shareAI-lab/learn-claude-code), a 23k-star project by shareAI-lab that reconstructs the internals of an AI coding agent like Claude Code from absolute zero. The starting point is literally one while loop and one bash tool.

<small>[Source: learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) — shareAI-lab</small>

## The Loop That Never Changes

Session 01 defines an `agent_loop` function. Call the LLM, check if `stop_reason` is `tool_use`, execute the tools, append results to messages, call again. This loop survives all 12 sessions without a single modification.

```python
def agent_loop(messages):
    while True:
        response = client.messages.create(
            model=MODEL, system=SYSTEM,
            messages=messages, tools=TOOLS,
        )
        messages.append({"role": "assistant", "content": response.content})
        if response.stop_reason != "tool_use":
            return
        results = []
        for block in response.content:
            if block.type == "tool_use":
                output = TOOL_HANDLERS[block.name](**block.input)
                results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": output,
                })
        messages.append({"role": "user", "content": results})
```

What changes is everything around the loop. Session 02 adds a tool dispatch map. Session 03 adds a `TodoManager` for planning. Session 04 introduces subagents with independent `messages[]` arrays. Session 05 injects skills via `tool_result` instead of the system prompt. Session 06 tackles context compaction with a 3-layer compression strategy.

Sessions 07 through 12 shift the paradigm from single-agent to multi-agent: file-based task graphs, background daemon threads, JSONL mailbox communication, team protocols, autonomous task claiming, and worktree isolation.

## One Dependency: `anthropic`

The `requirements.txt` contains exactly one package. No SQLite, no Flask, no Redis. Tasks are stored in JSON files. Team communication uses JSONL mailboxes. This is deliberate — an educational project that requires Docker + PostgreSQL + Redis setup loses half its learners at the install step.

The project is honest about what it omits. Event buses, permission governance, session lifecycle, MCP runtime — all explicitly declared out of scope. "Treat the team JSONL mailbox protocol in this repo as a teaching implementation, not a claim about any specific production internals."

## What LangChain Doesn't Teach

LangChain, AutoGen, and CrewAI teach framework usage — inherit this class, override that method. They don't explain how an agent works without the framework. learn-claude-code fills that gap. No abstractions, no magic methods, just raw API calls and a while loop.

The companion projects — Kode CLI (production coding agent), Kode Agent SDK (embeddable library), and claw0 (always-on assistant) — complete the "learn → build" pipeline.

> The model is the agent. Our job is to give it tools and stay out of the way.

- [learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) — shareAI-lab
- [Kode CLI](https://github.com/shareAI-lab/Kode-cli)
- [claw0](https://github.com/shareAI-lab/claw0)
