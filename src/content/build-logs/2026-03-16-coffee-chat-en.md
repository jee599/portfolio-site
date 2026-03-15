---
title: "23 Hours, 311 Tool Calls: Building a Full Consultation Flow with Claude Opus"
project: "coffee-chat"
date: 2026-03-16
lang: en
pair: "2026-03-16-coffee-chat-ko"
tags: [claude-code, toss-payments, nextjs, supabase, multi-agent]
description: "How a single Claude Opus session rewrote payment compliance, consultation flows, coupons, and crons — 311 tool calls, 28 edits, 14 new files."
---

23 hours. 311 tool calls. 28 modified files, 14 new files. One session.

That's what it took to go from "get our Toss Payments integration audit-ready" to a fully rebuilt consultation flow — with QA loops, automated crons, a coupon system, and a design review baked in.

**TL;DR** What started as payment compliance prep turned into a full product overhaul. I ran 4 parallel agents for diagnosis, set up per-phase QA loops with a 5-iteration cap, and let `claude-opus-4-6` drive the implementation from start to finish. Context compounding over 23 hours made the whole thing possible.

## The Two-Line Prompt That Opened 23 Hours

```
toss 결제 연동해야하는데, 키발급받기전에 관련 페이지나, 규정 이런거 다 지켜서 작업 해줘
```

*(Translation: "Need to integrate Toss Payments — before getting the API key, make sure all the related pages and policies are compliant.")*

Opus did a full sweep of the codebase. The `TossPayments` SDK integration already existed. So did the Terms of Service and Privacy Policy pages. But against Toss's actual review checklist, there were real gaps.

The subscription cancellation restrictions weren't documented. The privacy policy was missing the Toss Payments third-party data sharing entry. The refund policy was buried inside the general ToS. Business registration info was still placeholder text.

Fixing all of this in one session means Opus read the entire codebase → compared it against compliance requirements → identified gaps → filled them in. That's where Read 87 and Grep 42 came from.

Then the second prompt landed immediately after.

## Diagnosing the Product With 4 Parallel Agents

```
지금 기능들에 대해서 사업화, 상품화 하려면 어떤 부분 수정하고, 강화해야하는지
기획 코드 기능 디자인 각각 에이전트로 확인해서 정리해줘 모든 부분 디테일하게
```

*(Translation: "To commercialize the current features, what needs to be improved? Run separate agents for planning, code, features, and design — give me the full picture.")*

Agent tool: 26 invocations. Planning, code, features, and design agents ran in parallel, each auditing their slice of the product. The combined output became the roadmap for everything that followed.

This is the multi-agent pattern that makes Claude Code genuinely different. Instead of one long chain-of-thought, you get parallel domain experts reporting simultaneously.

## The QA Loop That Actually Had a Ceiling

```
각phase별로 완성하면 qa 돌리고, 수정하고 완벽하게 될때까지 확인 후 다음 phase로 넘어가는 루프 써줘. 최대 반복횟수는 5회
```

*(Translation: "After completing each phase, run QA, fix issues, loop until it passes — max 5 iterations per phase.")*

The interesting part here is the explicit cap. I built the guardrail into the prompt itself. Unbounded iteration loops are a real failure mode with autonomous agents — this prevents Opus from spinning forever on edge cases.

Opus structured it exactly as described: run tests → fix failures → rerun → advance only on green. Four test files were created through this process: `encryption.test.ts`, `env.test.ts`, `payment-confirm.test.ts`, `webhook.test.ts`. A significant portion of the 60 Bash calls were test executions.

The loop caught edge cases that wouldn't have surfaced in a linear implementation pass. Code quality was measurably better coming out the other side.

## Designing the Consultation Flow With Claude, Not Just Implementing It

```
상담 하는 과정이나, 상담 시작, 상담 종료, 내용 후기 같은 거는 어떻게 업체 단에서 관리할지 기획해봐
```

*(Translation: "How should the platform manage the consultation process — start, end, reviews?")*

This was a product design prompt, not a code prompt. Opus proposed three options:

- **A**: Freeform text reviews
- **B**: Structured questionnaire for both mentor and mentee
- **C**: LLM-generated auto-summary after each session

I picked B and specified the structure: mentors fill out a form covering the mentee's 5 concerns with a one-line solution each. Mentees log their expectations before the session, what actually got resolved, and their next action items.

The workflow here — compare options with Claude, make the product decision myself, hand off implementation — is what the Agent(26) number reflects. It's not just code generation; it's collaborative product design.

## 5 Crons I Didn't Know I'd Asked For

```
크론은 뭘 등록한거야 크론이 뭐야
```

*(Translation: "What crons did you register? What are they?")*

I asked this mid-session because Opus had created automated jobs I hadn't explicitly requested. Five of them:

- `auto-cancel-unconfirmed` — cancels unconfirmed bookings past the window
- `cleanup-bookings` — purges expired booking records
- `process-refunds` — handles refund processing automatically
- `weekly-settlement` — runs weekly payout calculations
- `auto-complete` — marks sessions as complete when both parties are done

Manual operations for all five would create real operational overhead at scale. Opus anticipated this and automated before I had to ask. The right call — especially when the service is still small enough that building these isn't painful.

## Coupon System in One Prompt

```
아 그리고 관리자 페이지에서 발행하는 50% 100% 쿠폰 생성하는 거 만들어줘.
```

*(Translation: "Also — add coupon generation (50%/100% off) to the admin page.")*

One prompt. Out came: `/api/admin/coupons/route.ts`, the admin UI component, and a DB migration file `20260315_coupon_percent_columns.sql`. A portion of the 75 Edit calls landed here.

Percentage-based discounts required new columns on the existing schema. Opus generated the migration, updated `supabase/types.ts`, and wired the API to the UI. No separate scaffolding step needed.

## Running a Design Review With a Skill

```
테스트 좀 더 추가해주고, 디자인 확인하고 싶은데 디자인 특화 ai 없어?
```

*(Translation: "Add more tests, and is there an AI specialized for design review?")*

I invoked the `web-design-guidelines` skill. An external scanner was blocked, so we switched to direct code review. `ConsultModal.tsx`, `Mentors.tsx`, `Testimonials.tsx`, and several other components were revised as a result.

Skill: 1 invocation. A single use, but it changed the direction of the design pass.

## Session Breakdown

| Tool | Calls |
|------|-------|
| Read | 87 |
| Edit | 75 |
| Bash | 60 |
| Grep | 42 |
| Agent | 26 |
| Write | 14 |
| Glob | 4 |
| Skill | 1 |

Payment compliance → product audit → consultation flow design → phase QA loops → crons and coupons → design review. All in a single session, because context persisted across the full 23 hours.

> Longer sessions don't just accumulate tool calls — they accumulate judgment. Every earlier decision informs every later one. 23 hours of compounding context, not 23 hours of waste.

---

*More projects and build logs at [jidonglab.com](https://jidonglab.com)*
