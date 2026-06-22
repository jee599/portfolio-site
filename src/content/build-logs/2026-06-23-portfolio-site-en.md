---
title: "13 Claude Code Sessions, ~700 Tool Calls, 5 Projects: A Production Multi-Agent Orchestration Log"
project: "portfolio-site"
date: 2026-06-23
lang: en
pair: "2026-06-23-portfolio-site-ko"
tags: [claude-code, multi-agent, workflow, automation]
description: "700 tool calls, 13 Claude Code sessions, 5 projects in 2 days. Domain-specific subagents, 12-way fan-out, and adversarial verification in production."
---

700 tool calls. 13 sessions. 5 active projects. 2 days.

That's not a benchmark — it's what happened when I stopped running projects sequentially and let Claude Code's multi-agent system handle the orchestration across a dental clinic marketing pipeline, a Next.js i18n bug, two startup business plans, a social bot tuning session, and a medical advertising compliance form.

**TL;DR** The pattern that made this work: domain-specific subagents own their context entirely. The main session handles intent, verification, and approval gates — nothing else.

## The Dental Agent Pattern: a Full Deployment for 2 Tool Calls

Sessions 4 and 5 were dental clinic marketing work — keyword rank tracking, weekly content generation, medical advertising compliance checks, git commits, Vercel deploys.

The main session's contribution to Session 4: `Agent` (delegate) + `Bash` (verify). Two tool calls total.

The `dental-clinic` subagent restores its own context by loading persisted files:

```
Main session: "Run periodic measurement — delegating to dental-clinic agent"
→ Agent tool (subagent_type: dental-clinic)
   └─ Load ~/dental-promo/dongbaek-uddental/clinic.json
   └─ Run blog_probe.py for keyword rank measurement
   └─ Update history.json snapshot
   └─ sync.sh → commit + Vercel redeploy
Main session: Verify result digest (1 Bash call)
```

The goal isn't just efficiency — it's context isolation. Dental clinic operational data (keyword rankings, Korean medical advertising regulations, compliance rules) has nothing to do with the React codebase or funding research running in parallel sessions. Mixing them degrades reasoning in both domains.

But here's what happened in Session 5: the agent died mid-`sync.sh`. Garbage output, clean exit, no commit. The agent's final summary said it completed successfully.

```bash
git log --oneline -3   # no new commit
```

The main session caught it. The rule that matters here: never trust an agent's summary for side effects. If there's no commit, the deployment didn't happen, regardless of what the agent reported. After verifying the git state independently, I also ran the medical advertising compliance linter directly — not because the agent would have skipped it, but because that check is a hard gate before anything reaches production.

"Trust but verify" isn't just a phrase. In practice, it's a `git log` call.

## What 1.27 Million Tokens Bought in 34 Minutes

Session 7 consumed 1.27 million tokens. The task: generate business plans for two separate companies simultaneously — a dental marketing automation startup and an AI mock-interview platform — covering both government grant programs and private VC/accelerator funding tracks.

The fan-out structure:

```
Foundation phase (6 parallel agents)
├─ Dental product profile
├─ Interview platform product profile
├─ Government non-equity program research
├─ Private VC/AC program research
├─ Government PSST approval case study analysis
└─ Private IR pitch formula research

Plans phase (2 agents, high effort)
├─ Dental marketing automation business plan
└─ Interview platform business plan

Synthesis → Strategy → Review
```

Why not write both plans sequentially in a single context? The domain knowledge required is disjoint in ways that matter for reasoning quality. Dental plans require Korean medical advertising law, healthcare market sizing, and clinic acquisition economics. Interview platform plans require AI model benchmarking, enterprise hiring market data, and SaaS unit economics. Running them in the same context causes mutual contamination — framing assumptions from one domain leak into the other.

Isolated per-agent contexts let each agent go deep without interference. After the foundation phase completed in parallel, the two plan-writing agents each had focused, uncontaminated context for their domain.

Output: a 7,747-word report at `~/funding/bizplan-2026-06-21/REPORT.md`. This isn't a token-limit problem — a single context technically could fit this. The depth per domain is what requires parallel isolation. Sequential execution would have taken days; the fan-out completed in 34 minutes.

The tradeoff is explicit: 1.27M tokens for a 34-minute research cycle. That's a choice, not a default.

## Adversarial Probability Calibration Across 13 Funding Programs

Session 9 needed honest pass-probability estimates across 13 funding programs — 7 for the interview platform, 6 for dental. The naive approach is one model, one estimate per program. The problem is optimism bias: first-pass estimates trend high, especially when you're emotionally invested in the outcome.

The pipeline:

```
13 program units (interview platform × 7, dental × 6)
   ↓ Independent probability estimate per unit
   ↓ Adversarial re-calibration agent
   ↓ Sort by cold-eyed percentage
```

The adversarial agent's single job: argue against each estimate. "Why is this number too high? What specific disqualifiers are being glossed over?" It has no stake in the outcome and no knowledge of what the first estimate was trying to achieve.

When the initial estimate for TIPS Primer Round 29 came back at 25%, the adversarial pass pushed it down to 12% — citing the program's historical preference for hardware/deep-tech ventures and the interview platform's relative lack of proprietary IP claims. The 25% wasn't wrong in isolation; it was wrong given the specific program's selection criteria.

This only works because the calibrating agent is independent. When both estimates come from the same reasoning chain, the second just inherits the first's blind spots.

## The i18n Bug That Took 193 Tool Calls

Session 2 had the most tool calls: 193. The bug: raw translation keys appearing in the mock interview UI. Instead of "End Interview," users saw `interview.room.endInterview`.

Debugging arc:

**Hypothesis 1**: Key missing from translation files.
Checked `en.json` and `ko.json` — both had `room.endInterview` under the `interview` namespace. Wrong.

**Hypothesis 2**: Code calling the wrong key path.
Checked all call sites — `tr("room.endInterview")` with correct scoping. Wrong again.

The actual cause was in `i18n/request.ts`:

```typescript
function scopeClientMessages(messages, strippedPath) {
  // strippedPath must start with /interview
  // to include the interview namespace in the client bundle
  // If x-cc-pathname header is empty, strippedPath = "/"
  // → entire interview namespace excluded from client bundle
}
```

`proxy.ts` injects the `x-cc-pathname` header, which is supposed to propagate through next-intl middleware all the way to RSC, where `scopeClientMessages` reads it to decide which namespaces to include in the hydrated message bundle. Under certain request routing conditions, that header didn't survive the middleware chain. The client component never received the message bundle, so next-intl fell back to rendering the raw key string.

193 tool calls because the key files were the wrong abstraction to inspect. The bug lived in the message delivery path — you had to trace the full chain from header injection through middleware to client bundle assembly before the actual failure point was visible. Reading the translation files was a dead end.

The fix required patching the header propagation in the middleware layer, not touching the key files at all.

When translation keys appear raw, the key file is almost never where you should look.

## The "gownj" Commit: Trusting Partial Context

Session 3. A request came in as: `gownj` — that's the Korean word `해줘` ("do it") typed without switching the OS input method back to Korean. No other context.

Three changes were needed: randomize tweet publish times, disable thread format, strip AI-sounding phrasing from generated text. Rather than asking for clarification on the garbled input, I asked one confirming question to validate all three requirements, then proceeded. 49 tool calls: 25 Bash, 10 Edit.

The schedule change illustrates the approach:

```
before: cron "20 */6 * * *"   # fixed every 6 hours
after:  cron "*/15 * * * *"   # fires every 15 min...
```

The cron fires every 15 minutes, but internal logic checks whether the current time matches one of four randomized daily slots — calculated fresh each day from a seeded distribution. Net result: 4 posts per day at irregular, unpredictable times. The cron expression itself looks like a high-frequency schedule; the behavior is not.

Ambiguous input is usually recoverable from context. Asking for clarification on `gownj` would have been the wrong call.

## Browser Automation With a Human Gate in the Middle

Session 6 was structurally different. A dental clinic's Naver ad had been restricted for missing a medical advertising review approval number — a Korean regulatory requirement. The fix required submitting a review application on the Korean Dental Association's website.

Using `mcp__claude-in-chrome`: 36 browser-related tool calls (21 computer actions, 5 navigations, 10 JavaScript executions to handle the form's dynamic field states).

The automation stopped partway through. The form required a medical license number and the clinic owner's date of birth — PII that wasn't in the project files. The session flagged the specific fields, waited for the user to provide the values, then continued.

This is the right design: browser automation doesn't eliminate human authorization gates. It moves them to where they belong — the points where sensitive data or irreversible actions require explicit human sign-off. Everything before and after those gates can be automated. The gates themselves should stay human.

## When to Fan Out vs. When to Run Directly

After 13 sessions, the decision pattern is clear.

**Fan out when:**
- 10+ independent work units where results don't depend on each other
- Each unit's domain knowledge would contaminate adjacent reasoning contexts
- Wall-clock time savings from parallelism exceed orchestration overhead

Sessions that used fan-out: business plans (12 agents, 1.27M tokens), funding probability calibration (13 units), game recommendation research (8 units × research + adversarial verification).

**Run directly when:**
- Sequential steps in a single domain context
- Tight dependency chain where step N requires step N-1's exact output
- Domain knowledge is coherent across the entire task

Sessions that ran directly: dental content preparation, i18n bug fix, bot tuning.

The cost of fan-out is tokens. Session 7 burned 1.27M. The return was 34 minutes instead of multi-day sequential research. That's a deliberate choice — fan-out isn't a default setting, it's a response to a specific work shape.

## Tool Usage Across 13 Sessions

| Tool | Count | Primary use |
|---|---|---|
| Bash | 318 | Build, deploy, git, verification |
| Read | 86 | File inspection |
| Edit | 62 | Code changes |
| Write | 33 | File creation |
| Browser MCP | 36 | Form automation, screenshots |
| Agent/Workflow | 18 | Subagent delegation, fan-out |

Bash is 45% of all tool calls. That ratio matters: more execution than exploration. Sessions don't end with a plan or a summary — they end with a commit, a deployment, a verified state. The final Bash call is usually a git log or a curl to confirm the deploy landed.

The Agent/Workflow count (18) looks small relative to the total. But each of those 18 calls spawned a subagent running 50–200 tool calls internally. The main session's ~700 tool calls are the surface; the full count including subagent work is significantly higher.

The architecture goal: keep the main session's tool call count low by delegating context-intensively, verify side effects independently, close with evidence.

Subagent summaries describe what agents intended to do. `git log` describes what actually happened.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
