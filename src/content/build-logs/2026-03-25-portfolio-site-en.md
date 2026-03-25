---
title: "3 Sessions, 336 Tool Calls: i18n Fix, 3-Platform Publishing Pipeline, and a Security Audit"
project: "portfolio-site"
date: 2026-03-25
lang: en
pair: "2026-03-25-portfolio-site-ko"
tags: [claude-code, i18n, auto-publish, astro, security]
description: "One hardcoded line caused 50 tool calls. Then the same day turned into a full pipeline refactor, security audit, and 3-platform publishing automation."
---

One hardcoded line caused 50 tool calls. `var lang = 'ko'` — buried in `Base.astro`, quietly making an English-first portfolio site default to Korean on every load.

**TL;DR** 3 sessions, 336 tool calls. A language toggle bug triggered a chain: fix the default language → audit all translated copy → refactor the auto-publish pipeline → run a security audit → ship to 3 platforms simultaneously. One day, no new files.

## The Two-Word Prompt That Started Everything

Session 1 opened with the shortest possible brief:

> "portfolio site"

Claude Code ran the brainstorming skill first, mapped the stack (Astro 4 + React + Tailwind, Cloudflare Pages), then waited. The second prompt locked in the actual problem:

> "The translation button isn't working right. This is an English site, so English should be the default and everything needs to be properly translated."

Opening `Base.astro` revealed three problems stacked on top of each other: `<html lang="ko">` in the document root, `var lang = 'ko'` as the JavaScript initial state, and a toggle button that displayed "EN" when English was already active — the exact opposite of what it should show.

The fix itself was three lines: `<html lang="en">`, `var lang = 'en'`, button default `KO`. But the fix without verification is just hope. Every element with `data-ko`/`data-en` attributes needed its default text confirmed as English. That verification pass spawned 8 Agent calls to crawl the site systematically — Read 13 times, Edit 12 times, Bash 12 times across `Base.astro`, `PostLayout.astro`, and `blog/[slug].astro`.

24 minutes. 50 tool calls. Three files modified.

## Why Naver Got Cut from the Publishing Pipeline

Session 2 started with a question about existing tooling. The `auto-publish` skill existed, but it was built around three platforms: spoonai.me, DEV.to, and Naver. Naver was no longer a publish target.

The `SKILL.md` had Naver scattered across multiple sections: Agent 3 was "generate Naver Korean HTML," Phase 4 handled Naver publishing, Phase 5 checked the Naver queue, and the series logic had Naver-specific part-numbering rules. `naver-seo-rules.md` was in the references. Twenty-three Edit calls later, all of it was gone.

The replacement target was Hashnode. The new canonical structure came through as a single-line prompt:

```
jidonglab.com as the base, then spoonai.me / hashnode / dev.to
```

This configuration isn't just convenience — it's SEO architecture. Every post published to DEV.to and Hashnode carries `canonical_url: https://jidonglab.com/...`. Regardless of which platform Google crawls first, domain authority flows back to the origin site. Dual-platform distribution without duplicate content penalties.

Fetching the Hashnode publication ID via API hit a permissions wall. The response: "figure it out." That's one of the most effective prompts in practice. Claude Code found a workaround independently — took the token directly from the conversation, wrote it to config, and patched `publish-to-hashnode.mjs`. After that, three Claude-related article keywords went in, content generated, and all three platforms received simultaneous publishes.

45 minutes. 90 tool calls.

## Delegating a Security Audit to an Agent

Session 3 opened with a security check:

> "Does this site have any security issues? API attack surface, key exposure, anything that could get compromised?"

Instead of reading through the codebase manually, the `Fix security issues` agent got the call. It came back with specific findings: 1 CRITICAL issue patched, plus API key exposure vectors and missing input validation points. The agent located and fixed issues that would have taken significantly longer to find by hand.

Session 3 was the largest by volume — Bash 100 calls, Edit 33, Read 32. Thirteen Agent delegations ran the security audit and reference documentation improvements in parallel. 196 tool calls, but distributed.

## How Tool Usage Shifted Across Sessions

Each session had a distinct character that showed up in the tool breakdown:

**Session 1** was Read-heavy. The pattern: read thoroughly before touching anything. High Read/Edit ratio, methodical file-by-file verification.

**Session 2** was Bash-dominated. API calls to test Hashnode, publishing confirmation checks, writing config to disk. Seven WebSearch calls to pull Claude's latest news for the article content.

**Session 3** was Agent-distributed. The overall volume was largest, but individual complexity stayed manageable because work got split across parallel agents.

Full session total: 336 tool calls. Bash led at 149 (44%) — more time spent executing and verifying than editing. Edit: 68. Read: 54. Agent: 25.

Bash at 44% is worth pausing on. The majority of Claude Code's effort wasn't writing code — it was running things and confirming they worked. The editing is fast. The verification is what costs.

## The Prompts That Actually Worked

The most effective prompts were the shortest:

```
Translation button isn't working. Make English the default and add a Korean toggle.
```

No implementation instructions attached. Claude Code read the code, identified three simultaneous problems, and fixed three files. The less the prompt specifies *how*, the more room there is for Claude Code to apply judgment.

```
jidonglab.com as the base, then spoonai.me / hashnode / dev.to
```

One line. Three platforms separated by slashes, canonical domain stated once. The skill read this structure and rebuilt the entire publishing pipeline from it.

The "figure it out" pattern deserves explicit mention. When an approach hits a wall — a permissions error, an unavailable API — saying "figure it out" or "work around it" produces better results than trying to prescribe a specific alternative. It shifts Claude Code into problem-solving mode instead of waiting for a more detailed prompt.

## Results

The default language fix was three lines in one file. But because the change propagated across every translated element on the site, verification took longer than the fix itself. That's the real cost of a systemic change to shared state: the editing is fast, the confirmation is slow.

The auto-publish pipeline now runs spoonai.me + DEV.to + Hashnode with jidonglab.com as canonical origin. Naver is gone. A fresh publish hits all three platforms from a single invocation.

The security audit surfaced a CRITICAL issue via one agent call. The cost of finding that manually would have been much higher.

**12 files modified. 0 new files created.** All functionality added by changing existing code — no file bloat, no new abstractions.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
