---
title: "Claude Code 19 세션으로 Hermes 미션 컨트롤 완성 — 절반은 아무것도 안 했다"
project: "hermes-dashboard"
date: 2026-05-30
lang: ko
tags: [claude-code, hermes, dashboard, nextjs, mission-control, orchestration]
description: "19 세션 473 tool calls로 Hermes 대시보드를 V3 미션 컨트롤로 완성했다. 그 중 10개 세션은 파일 한 줄도 쓰지 못했다. 왜 이렇게 됐는지, 어떻게 풀었는지."
---

19 세션, 473번의 tool call, 그리고 생성된 파일 29개. 숫자만 보면 성공한 프로젝트다. 그런데 절반인 10개 세션은 파일을 단 한 줄도 쓰지 못했다.

**TL;DR** Hermes 로컬 대시보드를 raw ID 나열 화면에서 한국어 레이블 + 작업 진행 상황을 시각화하는 미션 컨트롤 V3로 올리는 데 하루가 걸렸다. 절반의 세션이 "탐색만 하다 끝난" 이유와, 실제 구현이 집중된 4개 세션의 패턴을 기록한다.

## 10개 세션이 아무것도 안 한 이유

세션 6은 이렇게 끝났다:

```
Reply exactly BARE_OK
→ Not logged in · Please run /login
```

세션 8, 10, 11은 각각 `CLEAN_OK`, `CLAUDE_LEAN_OK`, `CLAUDE_FINAL_LEAN_OK`를 받고 끝났다. Hermes가 Claude Code 인스턴스를 오케스트레이터로 쓰는 구조에서, 세션을 띄우기 전에 연결 상태를 probe하는 ping 세션들이다. 세션 자체는 정상이지만 작업은 없다.

더 흥미로운 건 세션 1~5, 7, 9다. Opus 4.8과 Sonnet 4.6이 번갈아가며 `hermes-dashboard` 리포를 탐색했다 — `Read(16)`, `Read(17)`, `Read(10)`, `Read(13)` — 그런데 `Edit`이나 `Write`는 없다. 이유는 오케스트레이션 게이트다. Hermes의 workflow 상태 머신이 `stage: planning` 이전에는 파일 쓰기를 서브에이전트에 위임해야 하는 구조인데, 주 에이전트가 이 게이트 앞에서 계속 멈췄다.

세션 4에서 Sonnet이 실제로 구현 계획까지 완성했다:

> "phosphor annunciator lamps, cool-slate elevation, glow-as-status, reduced-motion fallback, Korean translation layer — 이건 슬롭이 아니다. 따라서 내 역할은 전면 재작성이 아니라 수술적 개선이다."

그러나 바로 다음 단계에서 `TaskCreate`를 호출하고 서브에이전트로 위임하는 과정에서 막혔다. 좋은 계획이 실행으로 이어지지 않은 전형적인 케이스다.

## 실제 구현: 4개 세션 집중

세션 12(49분), 13(36분), 14(2시간 20분), 15(44분)에서 실제 작업이 이루어졌다. 공통점이 있다. 전부 프롬프트에 "Do not enter plan mode, do not invoke superpowers/skills, do not present another proposal. Directly edit files"라고 명시했거나, `claude-opus-4-8`에 직접 brief 파일 경로를 주면서 "execute it fully"로 지시했다.

세션 12 프롬프트의 핵심:

```
Goal: 크론 잡, 스킬, 세션, 내부 식별자가 명확한 한국어로 설명되도록 개선.
의견: medical-dental-ads-daily-goal, telegram-tech-report-html 같은 식별자들은
운영자 외엔 이해 불가.
```

이 세션에서 `describeCronJob` 헬퍼가 탄생했다. raw ID를 한국어 레이블로 변환하는 `src/lib/allowlists.ts` 확장이다. Codex 교차검증이 블로커 하나를 잡아냈다 — `CronOutputPanel.tsx` line 161에서 `{j.name || j.id}`가 여전히 raw 텍스트를 primary label로 출력하고 있었다. `describeCronJob(j.id)?.label ?? j.id`로 수정했다.

## V2 brief 파일 방식 도입 — 보안 이슈도 발견

세션 13은 brief 파일 방식이 처음 등장한 세션이다.

```
Read /Users/jidong/.hermes/tmp/hermes-dashboard-v2-brief.md and execute it fully.
Use Opus 4.8 xhigh. Work until verified and committed, or report any blocker.
```

스펙을 파일로 써두면 탐색 루프 없이 바로 구현에 들어간다. 이 세션에서 93번의 tool call이 나왔다(Bash 33, Read 31, Edit 17, Write 10). 새 `/api/cron-output` 라우트, `CronOutputPanel.tsx`, `NowStrip.tsx`, `ActiveWork.tsx`를 만들었다.

크론 출력 디렉토리를 탐색하다가 보안 이슈를 발견했다. `~/.hermes/cron/output/<jobId>/<timestamp>.md` 파일에 `## Prompt` 섹션으로 전체 프롬프트가 그대로 포함돼 있었다. API 키나 내부 전략 내용이 대시보드 UI에 그대로 노출될 수 있는 구조였다. `allowlists.ts`에 프롬프트 섹션 redaction 레이어를 추가했다.

## V3: 2시간 20분짜리 세션

세션 14가 가장 규모가 컸다. 122 tool calls, 2시간 20분. Bash 39회, Edit 29회, Read 28회, Write 22회.

```
Read /Users/jidong/.hermes/tmp/hermes-dashboard-v3-brief.md and execute it fully.
Prioritize design quality and human-readable work-progress IA.
Work until verified, committed, and 7878 is restarted if safe.
```

V3에서 새로 만든 파일들:

```
src/
├── components/
│   ├── MissionControl.tsx      # 전체 레이아웃 재구성
│   ├── WorkBoard.tsx           # 진행 중인 작업 카드
│   ├── AgentProgressPanel.tsx  # Claude/Codex 에이전트 상태
│   ├── CronIssueCards.tsx      # 크론 이슈 카드뷰
│   └── Collapsible.tsx
└── lib/
    ├── workStages.ts           # 상태 → 한국어 변환
    ├── issueTranslator.ts
    ├── workflows.ts
    └── controlRoomTypes.ts
```

기존 "mission-operations room" 디자인 언어(phosphor annunciator 램프, cool-slate 서피스, semantic glow)를 유지하면서 IA를 개편했다. 전면 재작성이 아니라 수술적 확장이었다.

중간에 `[Request interrupted by user]`가 들어왔다. Codex 교차검증이 완료된 뒤 이어받는 프롬프트가 별도로 왔다:

```
Codex cross-verification is done and codex-report.md exists. Continue: inspect
the Codex report for any blocking issues. If only minor/non-blocking, do not
over-polish; run final typecheck/build/diff-check, commit, restart the 7878 dashboard.
```

"over-polish 금지" 지시가 중요하다. Codex가 minor 이슈만 리포트하면 그냥 커밋하라는 뜻이다. 완벽주의 루프를 끊는 명시적 지시다.

## 도구 사용 분포

| 도구 | 횟수 | 비율 |
|------|------|------|
| Read | 209 | 44% |
| Bash | 153 | 32% |
| Edit | 46 | 10% |
| Write | 34 | 7% |
| Agent | 17 | 4% |
| 기타 | 14 | 3% |

Read가 44%다. 구현 전에 코드베이스를 철저히 파악하는 게 Opus의 기본 패턴이다. 세션 3에서 "이건 슬롭이 아니다"라고 판단한 게 불필요한 전면 재작성을 막았다. 시간이 걸리지만 엉뚱한 인터페이스를 만드는 실수가 줄어든다.

Agent(17)은 Codex cross-verify와 `frontend-implementer` 위임이다. 주 에이전트가 모든 걸 직접 쓰지 않고 verification loop를 외부에 위임한 구조다.

## brief 파일 방식이 핵심

이번 작업의 핵심 삽질은 오케스트레이터가 같은 작업을 여러 번 재시도하는 것이다. 세션 1~11 중 실제 코드를 건드린 건 0개다. Hermes가 탐색 → 기획 → "다음 세션에서 구현"이라는 루프를 반복했다.

brief 파일 방식(세션 13, 14)으로 전환했을 때 속도가 붙었다. `hermes-dashboard-v2-brief.md`처럼 스펙을 미리 써두면, 세션이 열릴 때마다 오케스트레이터가 재탐색하지 않고 파일을 읽고 바로 구현에 들어간다.

> "Upgrade into a more visual mission-control style dashboard"처럼 열린 목표는 탐색 루프를 만든다. brief 파일로 구체화하면 컨텍스트 재구성 비용이 파일 읽기 한 번으로 줄어든다.

19세션이 필요하지 않았다. 처음부터 brief 파일로 시작했으면 5세션 안에 끝났을 것이다.
