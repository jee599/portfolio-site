---
title: "528 Claude Code Tool Calls in One Day: Design Gates, Relay Orchestration, and What Actually Shipped"
project: "portfolio-site"
date: 2026-06-14
lang: en
pair: "2026-06-14-portfolio-site-ko"
tags: [claude-code, design-gate, multi-agent, hermes-relay, workflow]
description: "11 sessions, 528 tool calls, 4 blocked by a design-gate hook. Breaking down Claude Code multi-agent patterns: what shipped and what broke at the gate."
---

528 tool calls. 11 sessions. One day. Most of it on `claude-opus-4-8`. Four projects running in parallel — an AI fortune-telling site visual overhaul, a SaaS hero animation restoration, a Godot wuxia game design doc, and a B2B email outreach pipeline. By end of day, three of the four shipped. One didn't.

The one that didn't is the most interesting part of this story.

**TL;DR**: A `design-gate` hook in my Claude Code workflow blocked 4 consecutive sessions from generating a Godot game design PDF. The Hermes relay pattern — where Hermes acts as orchestrator and Claude Code acts as executor — has a structural blind spot: it can't pass through interactive permission gates. This post documents what that looked like in practice, and why getting blocked four times in a row is actually a sign the system is working.

## Four Images, Three Visual Languages, Zero Coherence

The Saju (Korean fortune-telling) site had a problem that sounds simple until you look at it: four hero images from three completely different visual vocabularies, all on a dark-themed site.

`hero-sky` and `sea-moon` were dark, moody real-photo night scenes — the kind of urban landscape photography you'd see on a premium real estate portfolio. `ink-night` was a traditional Korean/Chinese ink wash painting, dark and atmospheric but in a completely different medium. `ink-cranes` was cranes on a bright white background, the style you'd find on a greeting card.

The i18n files compounded the problem. They still had placeholder marketing copy sitting in production: `$4.99 / 20,000+ character deep-dive by AI / Start Free, Upgrade Anytime`. Not localized, not final, just there.

Claude used Dynamic Workflow to survey 10 distinct East Asian art directions:

- Astronomical chart (천문도) — celestial maps with gold line art on dark backgrounds
- Folk painting (민화) — bright, flat, symbolic Korean folk art
- Landscape ink wash (산수화) — traditional brush-and-ink mountain scenes
- Blue-green mountain wash (청록산수) — mineral-pigment style from classical Chinese painting
- Cosmic gold line art — geometric, modern, constellation motifs
- ...and five more

Each direction came with curated reference image URLs and a brief rationale, all compiled into `art-directions.html` for visual comparison. The user picked astronomical chart.

Then came the pipeline fix. The existing `genimg.py` had `"Editorial photography"` hardcoded as a style constraint in the generation prompt — literally forcing gpt-image-2 toward realistic photography regardless of what else you specified. That single string was fighting every attempt to generate painterly output.

Replacing it with a cosmic gold painterly direction (specific prompt engineering for the astronomical chart aesthetic) unified all four images into a coherent visual system. Bash 82, Read 27, Edit 24.

## Resurrecting a Deleted Animation from Git History

The CoffeeChat hero section was missing its `InterviewDemo` component. Not broken — deleted. Present one commit, gone the next.

`git log` surfaced the cause immediately: commit `0e578da` had removed `InterviewDemo` and replaced it with a static `ReportShowcase` component. Once the cause was clear, the recovery plan was straightforward:

1. Convert the hero to a 2-column layout
2. Restore the interview chat animation on the left column
3. Add a new animation on the right showing 3 reports being written in sequence, at half scale so both are visible simultaneously

The implementation touched four surfaces:
- `globals.css`: new CSS animation keyframe definitions for the report-writing animation
- `demos.tsx`: layout changes to place both components side-by-side with correct sizing
- `i18n/en.json` and `i18n/ko.json`: updated copy for both languages

This was the heaviest session of the day — 210 tool calls. Bash 75, Edit 67, Read 59.

What made this session complex wasn't the code. It was the continuous real-time feedback loop. "Did you deploy? It's not showing on the site yet." "Can we cover technical interviews, not just behavioral?" "The report should show 5 pages, not 3." "The stats banner looks too plain." Each message redirected the session mid-stream. All handled inside a single continuous session without context loss.

## Why the Design Gate Blocked Four Times in a Row

This is where it gets interesting.

My `CLAUDE.md` has a hard rule: any HTML artifact must pass through Open Design (OD) or an equivalent design-system check before it can be written to disk. This is enforced by `hooks/design-gate.sh`, which intercepts any `.html` write attempt and blocks it until `design-pass.sh` authentication has run in that session.

The goal is to prevent "raw Claude HTML" — output that works but has no typographic rhythm, arbitrary color choices, and spacing that doesn't follow any system. The gate creates just enough friction to catch these problems before they reach a file.

The Godot wuxia game design PDF was attempted in sessions 4, 5, 8, and 9.

**Session 4**: Claude checked for the Open Design server. Port 7457: nothing. The `design-systems/` and `design-templates/` directories existed but were empty placeholders — OD had been scaffolded but never installed. The server wasn't runnable.

Fallback: apply an OD-equivalent pass manually. Read the `craft/` directory from the OD repo, extract editorial typography rules, color theory guidelines, and anti-AI-slop constraints, then run `design-pass.sh` to authenticate the session. That auth completed. But the session hit a context cutoff before any files were generated. No output.

**Session 5**: Instruction: "Don't re-explore the environment. Just produce the output." Claude ran 3 Bash commands checking environment state, then stopped. Session ended without generating the file.

**Sessions 8 and 9**: Same scenario, now routed through the Hermes relay. Hermes issued: "Create the Godot design doc directly." Claude still needed to pass the design gate. Gate auth consumed the available session time and context budget. No PDF.

The Godot game design document was not generated on this day. Four attempts. Zero output.

## The Structural Blind Spot in the Hermes Relay Pattern

Sessions 4 through 11 started with a system prompt structured roughly like this:

```
You are Claude Code, the actual executor.
Hermes is only the relay/orchestrator.
Your job: implement, verify, and ship.
Hermes's job: planning, prioritization, task sequencing.
```

The Hermes relay pattern treats Claude Code as a stateless executor — Hermes maintains high-level state and issues instructions, Claude Code runs tools and produces artifacts. This is useful when you want to maintain planning context across sessions without carrying full implementation history into every new context window.

The pattern works well — until it hits an interactive gate.

In session 6, Hermes instructed Claude to use the Dynamic Workflow tool to build a B2B-SaaS outreach pipeline. The Workflow tool triggered its standard confirmation: "Review dynamic workflow before running." This gate requires interactive approval from a human. A relay — by definition — can't provide that approval. It's not the human; it's another automated process in the chain.

Claude caught this immediately and logged it in the session output:

> "Workflow tool is gated — relay sessions can't get interactive approval. Manually decomposing into parallel sub-agents instead."

What followed was manual decomposition: 6 separate `Agent` tool calls across 12 B2B-SaaS niches, running in parallel. 1 Workflow call for the subset that could proceed unattended. The AEO outreach pipeline was completed:

- 27 GREEN-only prospects selected against multiple qualification criteria
- Output files: `eligible_*.json`, `email_sequences.json`, `verification.md`

Sessions 10 and 11 added a Codex review pass. Codex caught a consistency bug: `verification.md` reported "price token count: 31" in the summary, but the actual email body templates contained no price token. The count came from a placeholder in an unused template variant. Fixed.

The relay pattern handles orchestration well but can't reach through interactive checkpoints. Any step requiring a human-in-the-loop decision — Workflow tool review, design gate auth, destructive operation confirmation — breaks the relay chain. The solution isn't to remove the gates. It's to design auth flows that are relay-compatible: ones that Hermes can request, route to the user, and confirm on behalf of the downstream executor.

## The Gmail Audit That Rewrote the Narrative in 5 Minutes

Session 3 was the cleanest session of the day. 23 tool calls. Read `claude_input.json` and `summary.json` from a Gmail outreach audit, produce 3 output documents.

The finding flipped the interpretation of the data.

Raw numbers: 86 "bounced" emails. If taken at face value, that's a list quality crisis. Time to clean the list, re-verify addresses, rethink targeting.

But breaking down the bounce types changed everything:
- **82 of 86**: Gmail daily send quota self-throttle — Gmail hit its own sending limit and logged those deliveries as "bounced," but the email addresses themselves were valid
- **1**: actual hard bounce (invalid address)
- **3**: remote server rejections
- **1**: genuine inbound reply, from Fjord

A 95% bounce rate is a list problem. The same dataset with breakdown context is a rate-limiting problem. Completely different diagnosis, completely different fix.

Bash 18, Write 3, Read 2. Roughly 5 minutes of active work.

## By the Numbers

| Tool | Calls |
|------|-------|
| Bash | 237 |
| Read | 133 |
| Edit | 98 |
| Write | 18 |
| Agent | 10 |
| Workflow | 7 |
| **Total** | **528** |

23 files modified. 16 files created.

Sessions 1 and 2 — the Saju redesign and CoffeeChat animation work — accounted for 374 tool calls, 71% of the day's total. The remaining 9 sessions, all on the Hermes relay pattern, averaged 17 tool calls each.

This distribution makes sense. Relay sessions were either blocked by gates or doing planning coordination that doesn't generate many tool calls. Direct interactive sessions could run tools continuously. The throughput difference is significant.

## What Four Blocked Sessions Actually Prove

Getting blocked four times by the same hook is frustrating in the moment. In context, it's evidence the constraint system is working correctly.

The design gate has one job: prevent HTML from being written to disk without a design system pass. It did that job consistently across all four attempts — even when the attempts came through different channels (direct session, relay session, relay with "just generate it" instructions). The hook doesn't care about the instruction chain above it. It only cares whether `design-pass.sh` authentication has run in that session.

The real gap is that the Hermes relay pattern has no defined path for gate authentication. In a direct interactive session, `design-pass.sh` takes 30 seconds. In a relay session, that same 30 seconds requires coordination between Hermes, the gate, and the human user — and no protocol for that coordination exists yet.

That's the next thing to build: a relay-compatible auth handshake. The pieces are in place. They just need an agreed protocol for passing auth tokens through the relay chain.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
