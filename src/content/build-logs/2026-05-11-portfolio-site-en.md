---
title: "5 Parallel Agents, 102 Tool Calls, and the SRI Hash Bug Only Codex Caught"
project: "portfolio-site"
date: 2026-05-11
lang: en
pair: "2026-05-11-portfolio-site-ko"
tags: [claude-code, agent, parallel, design, automation, codex]
description: "102 tool calls across two sessions: parallel agent dispatch cut design iteration time, Codex cross-verification caught a silent SRI hash mismatch, a cron agent shipped 6 artifacts in 7 minutes."
---

102 tool calls. Two sessions. Zero lines of code written manually.

One session was a scheduled cron agent handling dental advertising automation. The other was a full site redesign that went through multiple direction pivots before landing. Both ran without me touching an editor once.

**TL;DR**: Dispatched 5 parallel `frontend-implementer` agents simultaneously — total iteration time collapsed to roughly one agent's runtime. Codex cross-verification caught an SRI hash mismatch (production URL, development hash) across 4 components before they shipped. A cron agent completed 6 artifacts in 7 minutes with 23 tool calls.

## The Cron Agent: 7 Minutes, 6 Artifacts, No Input From Me

The first session was a daily automation run for the `dentalad` project — a dental advertising knowledge base I maintain. A cron agent triggered against goals defined in `medical_dental_ads_daily_goal.md`.

The agent:
1. Read `rolling-knowledge-base.md` to understand existing structure
2. Added §2.7 (dual pillars of site search ad placement guidance) and §2.8
3. Updated `competitive-serp-observations.md` with new SERP data
4. Refined `naver-ranking-hypotheses.md` with updated hypotheses
5. Created `2026-05-10-daily-update.md` as the daily digest
6. Generated `2026-05-10-place-ads-roas-serp-patterns.html` — a mobile-friendly HTML report

Tool distribution: Read(9), Edit(8), Bash(3), Write(2), Grep(1). Nine Read calls before writing anything. This isn't slow — it's correct. Writing into an existing knowledge base without reading first creates duplicates and breaks structural consistency. The Read-heavy pattern is intentional.

### Label Conservatism as a Constraint

The most important rule in this cron agent is **epistemic label conservatism**. The prompt enforces explicit source tags on all claims:

```
Official confirmation / Official help-based interpretation / Public SERP observation /
Industry observation / Reasonable inference / Needs verification / Unverified figure / High-spend estimate
```

Why this matters in medical advertising: if the agent invents a CPC or ROAS figure, that number gets saved to the knowledge base, gets referenced in future agent runs, and can inform real advertising decisions. In regulated domains, fabricated metrics aren't just inaccurate — they're a compliance liability.

I verify the agent holds this constraint daily by reviewing what got written. So far it's held consistently.

## "All Bad" — How Feedback Steers the Wheel

The second session was a redesign of `coffeechat.it.kr`. Starting prompt:

> "Redesign the coffeechat site. Give me at least 5 variations so I can choose."

After the first round: *"These are all bad. None of them look professional."*

This is how Claude Code should work. The first output is a starting point, not a result. The productive loop is: **output → feedback → direction reset → re-run**. The tighter this loop, the more useful the tool becomes.

Before generating anything else, I analyzed the site. The actual domain turned out to be specific: a **mentoring platform for people trying to enter the gaming industry**. 1:1 coffee chats with professionals at gaming companies, resume reviews, mock interviews focused on game QA, design, engineering, and production roles.

This context changes everything about the design direction. A generic "professional" look doesn't work for a platform where the target audience grew up playing games and wants to break into making them. The aesthetic needs to communicate both credibility (you'll get real career help here) and domain fit (this is for game industry people, not finance or consulting).

With that understanding in place, I wrote a plan before dispatching anything.

## Dispatching 5 Frontend Agents in Parallel

The plan went to `~/.claude/workflows/Users-jidong-fac058f9dd/current/plan.md` first. All agents read from this file before starting. This matters — dispatching 5 agents with verbal descriptions produces 5 variations that don't actually vary around anything coherent. A written plan gives every agent the same baseline.

Then I dispatched 5 `frontend-implementer` agents simultaneously:

| Variation | Concept | Key Choices |
|---|---|---|
| V1 Editorial Magazine | Korean indie magazine aesthetic, editorial whitespace | Instrument Serif · cream `#f4eee4` · 12-column grid |
| V2 Soft Brutalist | Bold borders, high contrast color blocks | Lime/pink palette, heavy typography |
| V3 Glassmorphism | Floating gradient blobs, dark background | Dark glass panels, layered depth |
| V4 Education Platform | Structured trust signals, clean layout | Light background, academic credibility cues |
| V5 Gaming Industry | Domain-specific visual language | Dark mode with game-industry accent colors |

Sequential generation of 5 variations takes 5× the time for one. Parallel generation takes roughly 1× the time for one, plus coordination overhead. In practice, the session time for all 5 was close to what a single variation would have taken sequentially. The 28 Agent tool calls in this session are mostly dispatch, review, and re-dispatch events — this pattern is the mechanism behind the time compression.

## Codex Caught What Design Review Missed

After parallel implementation finished, `design-reviewer` and `code-verifier` ran on each variation. V3 had a blocker — the floating gradient blobs weren't rendering correctly. Fixed immediately.

Then Codex cross-verification ran. It found something that both design review and code verification missed.

V2, V3, V4, and V5 were loading `react.production.min.js` but with SRI hashes generated for `react.development.js`. These are different build outputs with different content — the hashes don't match.

```html
<!-- Bug: production file URL with development build hash -->
<script
  src="https://unpkg.com/react@18/umd/react.production.min.js"
  integrity="sha384-[development-build-hash]"
  crossorigin="anonymous"
></script>
```

In any browser with Subresource Integrity enforcement, this script loads and is blocked at integrity check. React components fail silently. No console error explains why. You get broken UI with no obvious diagnosis path.

This bug is hard to catch visually because everything looks structurally correct: CDN URL format is right, `integrity` attribute is present, `crossorigin` is set. Only a reviewer checking whether the hash corresponds to the right build variant would catch it.

Codex reviewed the code independently — no shared context with the agents that generated it — and flagged the mismatch. This is the value of cross-verification: a second pass with no shared blind spots. After the fix, all 4 affected variations cleared verification.

## The Harder Problem: Trend Variations Without Domain Trust

With 5 variations open side by side, the structural problem became visible. I had 5 design trend explorations — none of which answered the question a user actually asks when landing on a mentoring platform: *"Will this actually move my career forward?"*

Design trend (glassmorphism, soft brutalism, editorial) is not the same thing as domain appropriateness. A game industry mentoring platform needs specific trust signals: visible mentor credentials, outcome data, social proof from people in comparable situations, clarity on what "coffee chat" actually means in practice. None of the 5 variations had this.

I analyzed what established learning platforms do — Inflearn, Class101, FastCampus — and the visual language became clearer. It's not about aesthetic trends. It's about information architecture that reduces uncertainty. That analysis triggered another redesign pass.

The session ran 85 hours and 21 minutes total. Not code time — direction-finding time. Three feedback loops, two analysis passes, multiple round trips between "what looks good" and "what communicates the right thing to the right person."

Claude Code doesn't shorten the direction-finding process. It shortens the distance between "we have a direction" and "we have working implementation." The direction problem is still a human problem.

## Session Stats

| | Session 1 (Cron) | Session 2 (Redesign) |
|---|---|---|
| Duration | 7 min | 85h 21min |
| Tool calls | 23 | 79 |
| Files | 6 created | 4 modified, 3 created |
| Primary tools | Read, Edit | Agent, Bash |

Full distribution across 102 tool calls: Bash(29), Agent(28), Read(9), Edit(8), TaskUpdate(7), TaskCreate(6), ToolSearch(5), WebFetch(5).

The distribution reflects the shape of the work. Cron automation — short, structured, repetitive — produces a Read-heavy, Edit-heavy fingerprint. Parallel design work produces an Agent-heavy, Bash-heavy fingerprint. The tool histogram is a reliable indicator of task type: if you see lots of Agent calls, something was parallelized; if you see lots of Read calls before Edits, the agent was building context before writing.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
