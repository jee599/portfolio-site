---
title: "What is Vibe Coding — The New Way to Build Software with AI"
date: 2026-03-09
description: "Andrej Karpathy coined vibe coding. Here's what it means, how to do it well, and where it falls short."
tags: ["vibe-coding", "ai", "claude-code", "productivity"]
lang: "en"
source: "original"
---

In February 2025, Andrej Karpathy posted on X: "There's a new kind of coding I call 'vibe coding', where you fully give in to the vibes, embrace exponentials, and forget that the code even exists." The post hit 4.5 million views. Collins English Dictionary named it Word of the Year for 2025. Merriam-Webster added it as a slang and trending term in March 2025.

A year later, the term has moved past novelty into something that describes a real shift in how software gets built.

## What Vibe Coding Actually Is

The core idea: describe what you want in natural language, let the AI generate the code, review the output, iterate.

Traditional coding puts the developer at the level of implementation — writing every line, managing syntax, tracking variable state. Vibe coding raises the abstraction layer. The developer defines *what* the code should do. The AI handles *how*.

Karpathy described his workflow this way: "I just see stuff, say stuff, run stuff, and copy paste stuff, and it mostly works." He accepts Cursor's suggestions without deeply reading the generated code, trusts the AI to fix its own mistakes through follow-up prompts.

This is not fundamentally different from how programming languages themselves have evolved — from assembly to C, from C to Python, each transition moved developers further from machine-level details. Vibe coding is another step in that direction.

## The Tools

Three tools dominate the vibe coding landscape right now.

**Claude Code** is a terminal-first AI agent built by Anthropic. It reads your entire codebase, operates inside the shell, and handles multi-step workflows — mapping project structure, running tests, generating PRs, committing changes — without leaving the terminal. It maintains a reliable 200k token context window. On SWE-bench, Claude Sonnet 4 scores 72.7%, the highest of any model currently available. Claude Code is strongest on large, complex codebases where deep repo understanding matters more than raw autocomplete speed.

**Cursor** is a VS Code fork with AI at the core. Composer mode lets you describe changes across multiple files simultaneously. The `@` reference system lets you point the AI at specific files or functions to anchor its context. Agent mode chains together feature implementation, test writing, lint fixes, and PR creation from a single prompt. Context window is 128k in standard mode, 200k in Max Mode (though in practice Cursor may truncate older context to keep responses fast). Best fit for new projects and multi-file editing workflows.

**GitHub Copilot** layers on top of VS Code without requiring any tool change. Its strength is zero friction — it works inside the editor you already use. Autocomplete and chat are its primary modes; its agentic capabilities are less developed than Claude Code or Cursor's Agent Mode. At $10/month, it's the cheapest option and the lowest barrier to entry.

Choosing between them comes down to context. Large existing codebases with tangled architecture: Claude Code. New projects or heavy multi-file editing: Cursor. Existing VS Code workflow, want productivity gains without changing tools: Copilot.

## How the Workflow Changes

With vibe coding, the developer's role shifts from implementer to architect and reviewer.

Before:
1. Understand requirements
2. Design the solution
3. Write the code directly
4. Debug
5. Write tests
6. Review

With vibe coding:
1. Translate requirements into a clear natural language prompt
2. Review AI-generated code
3. Issue correction prompts, iterate
4. Validate the result

The time spent writing code decreases. The time spent evaluating AI output and directing the next step increases. The bottleneck moves from "can I type this fast enough" to "can I tell whether this output is correct."

Y Combinator's Winter 2025 batch reported that 25% of startups in the cohort had codebases that were 95% or more AI-generated.

## Where It Works and Where It Doesn't

### Works well

- **Boilerplate-heavy tasks**: CRUD endpoints, repetitive components, test case generation
- **Rapid prototyping on small projects**: validating a new idea in a day or two
- **Known library or API usage**: "implement pagination using the Stripe API" — clear, bounded, documentable
- **Refactoring**: restructuring existing code for readability, applying consistent patterns
- **Documentation**: comments, READMEs, API docs

### Works poorly

- **Large codebases**: AI context degrades as file count grows. Missing cross-file dependencies, misunderstanding architectural decisions — both become more common at scale
- **Security-critical code paths**: A December 2025 CodeRabbit analysis of 470 open-source pull requests found AI co-authored code had security vulnerabilities at 2.74x the rate of human-written code
- **Performance optimization**: Choosing the right algorithm, managing memory, profiling bottlenecks — these require domain-level expertise that AI doesn't reliably possess
- **Novel system architecture**: When there's no existing pattern to reference, AI extrapolates poorly
- **Deep business logic**: Code that encodes years of domain decisions doesn't translate cleanly into natural language prompts

## The Productivity Question

The numbers are more complicated than the hype suggests.

METR published a randomized controlled trial in July 2025 studying experienced open-source developers using AI coding tools. The result: developers using AI tools took 19% *longer* to complete tasks. They predicted they would be 24% faster, and afterward reported feeling 20% faster. Measured task completion time went the other direction.

One interpretation: experienced developers are already efficient. Adding AI tooling introduces overhead — reviewing generated code, correcting wrong turns, re-prompting — that outweighs gains for developers who already move fast.

The picture looks different for less experienced developers or unfamiliar tech stacks. Building something in a language you don't know well, or rapidly prototyping with an API you've never used — the productivity gain is real and measurable in those contexts.

> Vibe coding's productivity gains are largest when skill level is lower, tasks are well-defined, and codebases are small.

## Practical Tips

**Break tasks into small, specific prompts**

"Build a full authentication system" produces mediocre output. "Write a JWT validation middleware for Express that checks the Authorization header and returns 401 on failure" produces something usable. The more bounded the request, the more accurate the output.

**Read every line that touches security, data access, or business logic**

Accepting AI suggestions without reading them is viable for scaffolding and boilerplate. It is not viable for anything that handles user data, authentication, or complex conditional logic. Set a rule and keep it.

**Ask for a plan before implementation**

Before requesting code, ask: "Explain how you'd implement this feature." Review the approach. Correct it if needed. Then ask for the implementation. This catches wrong architectural decisions before they're embedded in code.

**Commit more frequently**

AI edits code in bulk. If something breaks, you want a recent checkpoint to roll back to. Treat small, frequent commits as mandatory when working in agentic mode.

**Request tests alongside code**

When asking for a function, add "and write tests for it." AI-generated tests force the model to specify what the code is supposed to do, which serves as lightweight validation.

**Maintain a project context file**

If you use Claude Code, `CLAUDE.md` at the project root loads automatically at session start. Put your coding conventions, architectural rules, and anti-patterns there. Without it, you'll repeat the same context setup on every session.

## Where This Is Going

Karpathy wrote in early 2026 that vibe coding is now passé. LLMs have improved enough that professional AI-assisted development looks less like "vibe coding" and more like "agentic engineering" — using LLM agents with deliberate oversight and scrutiny, not just accepting whatever the model produces.

The trajectory:

- **2023**: LLMs generate code snippets on demand
- **2025**: Vibe coding — hand natural language descriptions to AI, get full features back
- **2026**: Agentic engineering — AI agents plan, execute, and verify. Developers set direction and validate results

Stack Overflow's 2025 Developer Survey found 84% of developers use or plan to use AI tools in their workflow. This is no longer an early-adopter practice.

The tools will keep improving. What doesn't change: the ability to evaluate whether AI output actually solves the right problem, maintains security properties, and remains maintainable. Vibe coding well means being a rigorous reviewer, not just a fluent prompter.

The leverage is real. So is the responsibility for the output.
