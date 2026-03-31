---
title: "Claude Agent SDK Deep Dive: What It Means to Use Claude Code as a Library"
published: true
description: "Anthropic's Claude Agent SDK ships Claude Code's agent loop, built-in tools, and context management as a Python/TypeScript library. Here's how the architecture works, what makes it different from LangGraph and CrewAI, and where the trade-offs are."
tags: ai, claude, agentsdk, programming
cover_image: https://r2.jidonglab.com/blog/2026/03/claude-agent-sdk-hero.jpg
canonical_url: https://jidonglab.com/blog/claude-agent-sdk-deep-dive-ko
---

![Claude Agent SDK architecture diagram](https://r2.jidonglab.com/blog/2026/03/claude-agent-sdk-hero.jpg)
*Image source: Anthropic / claude.com*

Six agent frameworks are competing for your codebase in 2026. Anthropic's entry takes a fundamentally different approach from all of them.

No graph topologies like LangGraph. No role assignments like CrewAI. Instead, Anthropic took Claude Code — the tool hundreds of thousands of developers already use daily — and shipped it as a library. The agent loop, the built-in tools, the context management. All of it, programmable in Python and TypeScript.

**Source:** [Building agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk) – Thariq Shihipar, Anthropic

## Why "Code SDK" Became "Agent SDK"

In late 2025, Anthropic renamed the Claude Code SDK to the Claude Agent SDK. This wasn't cosmetic. Claude Code started as a coding agent, but the SDK enables agents that go far beyond code — email assistants, research agents, customer support bots, finance portfolio analyzers.

The design philosophy fits in one sentence: **give agents a computer.** Not just API access, but file systems, shell commands, and code execution. The same way a human programmer works, the agent works.

The SDK demos repository already shows this breadth. There are non-coding agents that read files, search the web, manage calendars, and synthesize documents. The "Code" in the original name undersold what the SDK could actually do.

## Two Entry Points: query() and ClaudeSDKClient

The SDK offers two ways to run an agent, and the difference matters.

`query()` is the simple path. It's an async function that takes a prompt and returns an AsyncIterator of response messages. Fire and forget. Perfect for single-shot tasks.

```python
async for message in query(
    prompt="Find and fix the bug in auth.py",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"]),
):
    print(message)
```

`ClaudeSDKClient` is the production path. It supports bidirectional conversations, custom tools as callback functions, and hooks for lifecycle control. If you're building anything that needs to intercept, modify, or audit agent behavior, this is the one you want.

The contrast with the Anthropic Client SDK (the regular API) is instructive. With the Client SDK, you implement the tool loop yourself — check `stop_reason`, execute the tool, send results back, repeat. With the Agent SDK, Claude handles all of that autonomously. You provide the prompt and the tool whitelist. Claude decides what to call, checks the results, and iterates.

## Nine Built-in Tools, Zero Setup

This is where the Agent SDK diverges most sharply from every other framework.

LangGraph, CrewAI, OpenAI Agents SDK — they all start with an empty toolbox. You define every tool from scratch. Agent SDK ships with the exact tools that power Claude Code: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, and AskUserQuestion.

Want an agent that scans your codebase for TODO comments? Five lines:

```python
async for message in query(
    prompt="Find all TODO comments and create a summary",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Glob", "Grep"]),
):
    if hasattr(message, "result"):
        print(message.result)
```

No file-reading function to implement. No shell wrapper to write. No glob library to integrate. The SDK handles tool execution internally, including sandboxing and error recovery.

This matters most for the most common agent tasks — analyzing code, editing files, running tests, searching documentation. These are the tasks where other frameworks spend 80% of their setup time on tool boilerplate.

## Hooks: Deterministic Control Over Non-Deterministic Agents

Production agents need guardrails. The Agent SDK's hook system is where this gets serious.

Hooks are callback functions that fire at 18 different lifecycle events. `PreToolUse` fires before a tool executes. `PostToolUse` fires after. `Stop`, `SubagentStart`, `SubagentStop`, `Notification`, `PreCompact` — they cover nearly every point where you might want to intercept, block, log, or transform agent behavior.

Here's a hook that blocks `.env` file modifications:

```python
async def protect_env_files(input_data, tool_use_id, context):
    file_path = input_data["tool_input"].get("file_path", "")
    if file_path.split("/")[-1] == ".env":
        return {"hookSpecificOutput": {
            "permissionDecision": "deny",
            "permissionDecisionReason": "Cannot modify .env files",
        }}
    return {}
```

Register it with a `"Write|Edit"` matcher and it only fires for file-writing tools. Matchers are regex, so `"^mcp__"` catches all MCP tools at once. Multiple hooks chain in order, and deny always wins — if any hook returns deny, the operation is blocked regardless of what other hooks say.

The two-layer output design is clever. `hookSpecificOutput` controls the current operation (allow, deny, or modify the input). Top-level `systemMessage` injects context into the conversation so Claude knows *why* something was blocked and can adjust its approach. This prevents the agent from endlessly retrying a blocked operation.

Async hooks (`{"async_": True}`) let you fire side effects like logging or webhook notifications without making the agent wait. Small detail, big impact on latency.

## Custom Tools as In-Process MCP Servers

The custom tool architecture is worth understanding because it reveals how deeply MCP is embedded in the SDK's design.

When you define a custom tool with `@tool` (Python) or `tool()` (TypeScript), the SDK wraps it in an in-process MCP server. No separate process. No network overhead. Your Python function runs directly inside your application, but follows the MCP protocol internally.

```python
@tool("get_temperature", "Get current temperature",
      {"latitude": float, "longitude": float})
async def get_temperature(args):
    # Call weather API, return result
    return {"content": [{"type": "text", "text": "72°F"}]}

server = create_sdk_mcp_server(
    name="weather", version="1.0.0",
    tools=[get_temperature],
)
```

Tool names follow the `mcp__{server}__{tool}` pattern. Add the name to `allowed_tools` for auto-approval, or leave it out to require permission on each call.

Error handling has a meaningful design choice here. If a handler throws an uncaught exception, the entire agent loop stops. But if it catches the error and returns `is_error: True`, Claude sees the error as data and can retry or try a different approach. In production, always catch and return — never throw.

Tool annotations add metadata like `readOnlyHint: True`, which lets Claude batch read-only tools together for parallel execution. It's one line of configuration that can meaningfully speed up agents that do a lot of reading before writing.

## Subagents and Sessions for Complex Workflows

Complex tasks decompose into subagents. The main agent delegates, subagents run in isolated context windows, and only the results flow back. Each subagent gets its own tools, prompt, and instructions.

Sessions persist context across multiple queries. Capture `session_id` from the first query, pass `resume=session_id` to the second, and Claude remembers everything — files read, analysis done, conversation history. Pronouns work: "Read the auth module" → "Now find everywhere that calls it."

When the context window fills up, the SDK automatically compacts — summarizing the conversation to free space. A `PreCompact` hook lets you archive the full transcript before summarization kicks in.

## How It Compares to LangGraph, CrewAI, and OpenAI Agents SDK

As of March 2026, at least six production-grade agent frameworks are competing: LangGraph (1.0 GA), CrewAI (44,600+ GitHub stars), OpenAI Agents SDK (v0.10.2), Claude Agent SDK (Python v0.1.48 / TypeScript v0.2.71), and Google ADK (v1.26.0).

Each framework has a different philosophy. LangGraph designs agent workflows as graphs with nodes and edges — powerful for complex branching but verbose for simple agents. CrewAI assigns roles ("researcher," "writer," "editor") and orchestrates collaboration — intuitive but hard to debug when role communication gets complex. OpenAI Agents SDK uses handoff patterns between agents — clean and concise but without built-in tools.

The Claude Agent SDK's advantages cluster around three areas. First, built-in tools that eliminate the boilerplate of file system and shell access. Second, the deepest MCP integration of any framework — Playwright, Slack, GitHub, and hundreds of other servers connect with a single configuration line. Third, lifecycle control through 18 hook events that let you intercept nearly every point of agent execution.

## The Trade-offs You Should Know

The SDK is Anthropic-only. If your architecture needs to route between Claude, GPT, and Gemini based on task type, you'll need an orchestration layer on top.

There's no built-in persistence layer. Sessions don't survive server restarts unless you build that yourself. LangGraph has checkpointing built in, which gives it an edge for long-running workflows.

The Python and TypeScript SDKs aren't at feature parity. `SessionStart` and `SessionEnd` hooks are TypeScript-only as callbacks — Python only supports them as shell command hooks via settings files. If Python is your primary language, check the hook availability table before designing your architecture.

And authentication: Anthropic doesn't allow agents built with the SDK to use claude.ai login or rate limits. API key authentication only, though Bedrock, Vertex AI, and Azure are supported as alternative providers.

## What the Anthropic Team Recommends for Production

The Anthropic engineering team shared a practical checklist for improving agents. Start by checking whether your agent has the right tools for its task — no amount of prompt engineering compensates for missing capabilities.

Structure search APIs so the agent can actually find what it needs. When you see repeated failure patterns, add rules-based feedback via hooks rather than relying on LLM-as-judge evaluation. Lint checks, explicit validation rules, and result screenshots are faster and more reliable than having another model evaluate the output.

The agent execution loop itself is "gather context → take action → verify → repeat." The same way a human works. The difference is speed.

> Using Claude Code as a library means you can embed the exact way Claude writes code — reading files, running commands, checking results, retrying — inside your own product. That's a fundamentally different proposition from calling an API.

---
- [Agent SDK official docs](https://platform.claude.com/docs/en/agent-sdk/overview) – Anthropic
- [Building agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk) – Thariq Shihipar
- [claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python) – GitHub
- [claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript) – GitHub
- [claude-agent-sdk-demos](https://github.com/anthropics/claude-agent-sdk-demos) – GitHub
- [AI Agent Frameworks 2026 Comparison](https://letsdatascience.com/blog/ai-agent-frameworks-compared) – Let's Data Science
