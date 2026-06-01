---
title: "444 Tool Calls in One Day: Claude Code Harness Audit, OpenDesign Port, and Automated Reports"
project: "portfolio-site"
date: 2026-06-02
lang: en
pair: "2026-06-02-portfolio-site-ko"
tags: [claude-code, opus-4-8, open-design, harness, automation, design-system]
description: "16 sessions, 444 tool calls, Bash 220×, Edit 72×. Audited the entire Claude CLI harness, ported OpenDesign locally, and built PDF reports."
---

444 tool calls. One day. 16 sessions, Opus 4.8, 220 Bash invocations, 72 Edit calls. The output wasn't a feature or a new component — it was a redesign of how Claude Code itself operates.

**TL;DR** — Audited `~/.claude/` end-to-end, found 9 hook scripts that weren't actually registered anywhere, and purged 8 dormant hooks. Realigned the entire harness to Opus 4.8. Ported the OpenDesign engine from claude.ai/design as a local skill so every design request automatically routes through the OD loop without explicit invocation.

## The Harness Audit: 9 Hook Scripts That Did Nothing

Session 11 was the longest — roughly 17 hours, 81 tool calls. It started with one question: "Check what tools are actually active right now."

I ran the `harness-audit` skill and started pulling `~/.claude/` state in parallel. The first `jq` call against `settings.json` failed immediately. No `hooks` key. Nine hook scripts existed on disk, none of them registered.

```bash
cat ~/.claude/settings.json | jq '.enabledPlugins, (.hooks | keys)'
# null | keys → TypeError
```

Tracing the root cause: registration paths were scattered between `settings.json` and `settings.local.json`. Eight hooks were sitting dormant with no active registration. Three symbolic links were broken. Purged them all and rebuilt from a clean baseline.

> A hook file on disk without an entry in `settings.json` is not a hook — it's just a file.

After the cleanup, I unified all agents on Opus 4.8. `claude-fast`, `claude-work`, `claude-review`, `claude-heavy` — updated all four wrapper configs in one pass, and fixed a latency bottleneck in the `codex-cross-verify` pipeline.

## Porting OpenDesign: Running claude.ai/design Locally

Session 14 started with: "OpenDesign is great. Can every design request automatically go through that route?"

claude.ai/design launched in April 2026 as Anthropic's design loop. The flow: `discovery questions → direction selection → sandbox → 5-dimension self-review`. The open-source OpenDesign repo ships an `od mcp` CLI — which made porting to Claude Code straightforward.

I read the engine prompts directly: `reference/charter.md` and `reference/directions.md`. RULE 1/2/3 discovery flow, 5 directions with OKLch palettes, 5-dimension review criteria. Mapped the web UI's `<question-form>` and `<artifact>` rendering to terminal-native `AskUserQuestion` calls.

Output files:
- `~/.claude/skills/open-design/SKILL.md` — the OD route skill
- `~/.claude/skills/open-design/reference/charter.md`
- `~/.claude/skills/open-design/reference/directions.md`
- `~/.claude/hooks/design-router.sh` — UserPromptSubmit hook for auto-detecting design requests

Now when keywords like "design", "prototype", "mockup", "landing", "dashboard", or "redesign" appear, the hook intercepts first and routes to OD automatically. No explicit skill invocation needed.

The porting was faster than expected. If you can read a cloud service's engine prompts directly, the port is as accurate as the source. The OD repo publishes the engine prompts openly — which made this possible.

## The Report Project: 7 Sessions of Iteration

Across sessions 6–16, I built two versions of an online visibility diagnostic report for small business owners: a free diagnostic and a paid deliverable sample.

The sequence:

1. **Session 6** — Design direction research. Reviewed HubSpot Website Grader, SEMrush Site Audit, and Toss credit score UX as structural references
2. **Session 7** — Content structure HTML/PDF mockup (draft quality). Chrome headless PDF generation
3. **Sessions 8–9** — Paid deliverable sample. "Ready to hand to the client" format
4. **Session 10** — OpenDesign-style redesign. Chose **ink minimal** direction. `oklch(98.6% 0.005 95)` background, `oklch(23% 0.018 260)` ink
5. **Sessions 13, 15, 16** — Codex cross-review feedback fixes

Codex flagged two blocking issues. First: in the free PDF, a `.cov` block with `break-inside: avoid` was clipping the last table row. Second: in the paid PDF, a label was rendering as `Why we changed thisprevious` — string concatenation without a separator. Fixed in session 16 with 30 Edit calls.

The lesson that cost the most time: Chrome headless PDF only responds to `@media print` queries. A layout that looked correct on screen rendered completely differently in the output PDF. After that, I always verify with `pdfinfo` and `pdftotext` before calling anything done.

## Why Codex Cross-Review Catches Bugs That Self-Review Misses

In session 13, the Codex independent review returned `VERDICT: request-changes`. The pattern: Claude builds, Codex reviews read-only with no shared build context.

This works because self-review from within the same context creates structural blind spots. Codex doesn't share the session history, so it's genuinely a different perspective. It catches things like the PDF rendering bug — the author saw the layout on screen, assumed it was correct, and the print output was broken in a way that only a fresh reader would catch.

> It's not that Claude is wrong. It's that the same model checking its own output in the same session is structurally limited. A second reader with fresh context catches what the first one normalizes away.

## The Numbers

| Metric | Count |
|---|---|
| Total sessions | 16 |
| Total tool calls | 444 |
| Bash | 220 |
| Read | 73 |
| Edit | 72 |
| Write | 19 |
| WebSearch | 15 |
| Files modified | 18 |
| Files created | 18 |
| Longest session | Session 11 (~17 hours, 81 tool calls) |

## Takeaways

The harness audit's core lesson: a script in `~/.claude/hooks/` that isn't referenced in `settings.json` does nothing. Nine scripts, zero registered entries, zero effect. The audit made this visible; there was no other way to know.

The OpenDesign port confirmed something more general: if a cloud service publishes its engine prompts, local porting is a direct translation exercise. The OD repo's openness made a day's work possible.

What's still rough: `design-router.sh` occasionally intercepts non-visual tasks — API design sessions, DB schema discussions — because keyword matching is too coarse. A more precise intent classifier is next.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
