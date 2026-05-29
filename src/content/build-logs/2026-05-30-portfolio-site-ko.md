---
title: "Hermes 대시보드 미션 컨트롤 업그레이드 — 17세션, 440 tool calls, 삽질의 기록"
project: "portfolio-site"
date: 2026-05-30
lang: ko
tags: [claude-code, hermes, dashboard, next-js, mission-control, ui]
description: "같은 프롬프트를 7번 날렸다. 세션 12개를 쏟아부은 뒤에야 Hermes 대시보드가 진짜 미션 컨트롤이 됐다. 440 tool calls, 46개 파일 변경의 현장."
---

17개 세션을 열었는데 실제로 파일을 건드린 세션은 5개다. 나머지는 탐색하다 끊기거나, 같은 프롬프트를 재시도하거나, `CLEAN_OK` 한 마디만 반환했다. Hermes 오케스트레이터로 Claude를 굴릴 때 자주 일어나는 패턴이다.

**TL;DR** Hermes 로컬 대시보드를 작업 가시성 중심의 미션 컨트롤 UI로 재설계했다. 한국어 레이블, 크론 출력 패널, V2→V3 순차 업그레이드까지 총 46개 파일, 440 tool calls.

## 같은 프롬프트를 7번 날린 이유

세션 1, 3, 4, 5, 7, 9가 거의 동일한 프롬프트를 가지고 있다.

```
Goal: Upgrade the existing Hermes local GUI dashboard into a more visual
mission-control style dashboard for tracking ongoing Hermes/Claude/Codex/Cron work.
```

Hermes가 세션을 열고 → 탐색만 하다가 컨텍스트 한도에 걸리거나 → 오케스트레이터가 "이 세션은 기획만 했으니 다시"라며 재시도하는 루프다. 세션 6은 `<synthetic>` 모델이 "Not logged in · Please run /login"만 반환했다. 세션 8, 10, 11은 상태 확인용 원라이너(`CLEAN_OK`, `CLAUDE_LEAN_OK`, `CLAUDE_FINAL_LEAN_OK`)였다.

실제 구현은 세션 12부터 시작됐다.

## 세션 12: 한국어 레이블 전면 적용 (49분, 59 tool calls)

```
Goal: Improve the local Hermes dashboard at http://127.0.0.1:7878 so cron jobs,
skills, sessions, and internal identifiers are explained in clear Korean.
The user specifically complained that entries like `medical-dental-ads-daily-goal`,
`telegram-tech-report-html`, `daily-codex-cli-update` appear as raw text.
```

raw ID가 대시보드에 그대로 노출되는 게 문제였다. 사용자가 직접 불만을 제기한 케이스다.

Codex 교차검증이 블로커 2개를 잡아냈다.

> `CronOutputPanel.tsx` line 161: `{j.name || j.id}`에서 raw 텍스트가 primary label로 출력됨. `describeCronJob`을 import해서 한국어 레이블을 우선 표시해야 함.

`describeCronJob` 헬퍼를 만들어 7개 크론 잡 ID를 한국어로 매핑하는 방식으로 해결했다. Read 22회를 썼지만 Edit은 0회 — 구현은 `frontend-implementer` 서브에이전트에 위임했다. 이 세션에서 메인이 직접 변경한 파일은 `plan.md` 하나다.

## 세션 13: V2 업그레이드 — 보안 이슈 발견 (36분, 93 tool calls)

```
Read /Users/jidong/.hermes/tmp/hermes-dashboard-v2-brief.md and execute it fully.
Use Opus 4.8 xhigh. Do not modify Hermes Agent source.
Work until verified and committed, or report any blocker.
```

brief 파일 방식이 처음 등장한 세션이다. 스펙을 파일로 써두면 탐색 루프 없이 바로 구현에 들어간다.

크론 출력 디렉토리를 탐색하다가 보안 이슈를 발견했다. `~/.hermes/cron/output/<jobId>/<timestamp>.md` 파일에 `## Prompt` 섹션으로 전체 프롬프트가 그대로 포함돼 있었다. API 키나 내부 전략 내용이 대시보드 UI에 그대로 노출될 수 있는 구조였다. `allowlists.ts`에 프롬프트 섹션 redaction 레이어를 추가했다.

이 세션에서 만든 것들: `CronOutputPanel.tsx`, `NowStrip.tsx`, `ActiveWork.tsx`, 새 `/api/cron-output` 라우트. Bash 33회, Read 31회, Edit 17회, Write 10회.

## 세션 14: V3 풀 리디자인 — 2시간 20분 (122 tool calls)

가장 긴 세션이다. `claude-opus-4-8` xhigh로 2시간 20분.

```
Read /Users/jidong/.hermes/tmp/hermes-dashboard-v3-brief.md and execute it fully.
Use Opus 4.8 xhigh. Prioritize design quality and human-readable work-progress IA.
Work until verified, committed, and 7878 is restarted if safe.
```

중간에 `[Request interrupted by user]`가 들어왔다. Codex 교차검증이 완료된 뒤 이어받는 프롬프트가 별도로 왔다.

```
Codex cross-verification is done and codex-report.md exists. Continue: inspect
the Codex report for any blocking issues. If only minor/non-blocking, do not
over-polish; run final typecheck/build/diff-check, commit with message
'feat: redesign Hermes dashboard work control room', restart the 7878 dashboard safely.
```

V3에서 새로 만든 파일들:

```
src/
├── components/
│   ├── MissionControl.tsx     # 전체 레이아웃 재구성
│   ├── WorkBoard.tsx          # 진행 중인 작업 카드
│   ├── AgentProgressPanel.tsx # Claude/Codex 에이전트 상태
│   ├── CronIssueCards.tsx     # 크론 이슈 카드뷰
│   └── Collapsible.tsx
└── lib/
    ├── workStages.ts          # 상태 → 한국어 변환
    ├── issueTranslator.ts
    ├── workflows.ts
    └── controlRoomTypes.ts
```

기존 "mission-operations room" 디자인 언어(phosphor annunciator 램프, cool-slate 서피스, semantic glow)를 유지하면서 IA를 개편했다. 전면 재작성이 아니라 수술적 확장이었다. Bash 39회, Edit 29회, Read 28회, Write 22회.

## 세션 15: 네 번째 패스 — Workflow 도구 활용 (44분, 71 tool calls)

V3 이후에도 "현재 진행 중인 작업이 무엇인지 시각적으로 보인다"는 원래 목표를 완전히 채우지 못한 부분이 남았다. AI 뉴스 섹션은 필요 없다고 판단해 제거했다.

이 세션에서 `Workflow` 도구를 처음으로 활용했다.

```
Build diagrammatic mission-control wall:
contract → parallel components → integrate → typecheck
```

동적 워크플로로 Agent 6개를 병렬 디스패치해 컴포넌트별 구현을 나눴다. 메인 세션은 contract 정의와 최종 통합만 담당했다. Read 36회, Bash 27회.

## 도구 사용 분포

| 도구 | 횟수 | 비율 |
|------|------|------|
| Read | 191 | 43% |
| Bash | 141 | 32% |
| Edit | 46 | 10% |
| Write | 34 | 8% |
| Agent | 17 | 4% |
| 기타 | 11 | 3% |

Read가 43%다. 구현 전에 코드베이스를 철저히 파악하는 게 Opus의 기본 패턴이다. 새 컴포넌트를 작성하기 전에 관련 파일을 10개 이상 읽는다. 시간이 걸리지만 엉뚱한 인터페이스를 만드는 실수가 줄어든다.

## brief 파일 방식 vs 열린 프롬프트

이번 작업의 핵심 삽질은 오케스트레이터가 같은 작업을 여러 번 재시도하는 것이다. 세션 1~11 중 실제 코드를 건드린 건 0개다. Hermes가 탐색 → 기획 → "다음 세션에서 구현"이라는 루프를 반복했다.

brief 파일 방식(세션 13, 14)으로 전환했을 때 속도가 붙었다. `hermes-dashboard-v2-brief.md`처럼 스펙을 미리 써두면, 세션이 열릴 때마다 오케스트레이터가 재탐색하지 않고 파일을 읽고 바로 구현에 들어간다. 컨텍스트 재구성 비용이 파일 읽기 한 번으로 줄어든다.

> "Upgrade into a more visual mission-control style dashboard"처럼 열린 목표는 탐색 루프를 만든다. 오케스트레이션 비용이 배로 든다.

17세션이 필요하지 않았다. 처음부터 brief 파일로 시작했으면 5세션 안에 끝났을 것이다.

## 결과

`http://127.0.0.1:7878` 로컬 대시보드:

- 크론 잡 7개가 한국어로 표시됨
- 크론 출력 파일이 프롬프트 섹션 redaction 후 안전하게 제공됨
- 진행 중인 Claude/Codex 세션 상태 카드
- phosphor annunciator 램프 디자인 시스템 유지
- typecheck + build 통과 후 커밋, 7878 재시작

생성 파일 29개, 수정 파일 17개.
