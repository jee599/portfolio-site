---
title: "Hermes 대시보드 V1→V4: 11세션 478 tool call로 만든 에이전트 작업 현황판"
project: "portfolio-site"
date: 2026-05-30
lang: ko
tags: [claude-code, hermes, dashboard, next-js, orchestration]
description: "로컬 에이전트 작업을 시각화하는 Hermes 대시보드를 Claude Code로 하루 만에 V1에서 V4까지 반복했다. 11세션, 478 tool call, 보안 발견까지."
---

11개 세션, 478번의 tool call, 총 5시간 가까운 작업 끝에 로컬 에이전트 현황판이 완성됐다.

**TL;DR** Claude Code의 오케스트레이터 게이트 패턴을 활용해, Hermes 대시보드를 MVP → V2 → V3(미션 컨트롤 디자인) → V4(한국어 레이블)로 하루 만에 반복했다. 중간에 보안 이슈도 발견했다.

## 왜 대시보드가 필요했나

Hermes, Claude Code, Codex, cron 자동화가 동시에 돌아가다 보니 "지금 뭐가 실행 중인지"가 안 보였다. tmux 세션을 열고, `ps aux`를 치고, 로그 파일을 뒤지는 방식은 시간이 너무 많이 든다. 로컬에서 `localhost:7878`로 바로 볼 수 있는 read-only 대시보드가 필요했다.

## V1 MVP: 49분, 66 tool call

세션 4에서 brief 파일을 먼저 플래닝에 썼다. `~/.hermes/tmp/hermes-dashboard-brief.md`를 작성하고, plan-orchestrator 에이전트에게 넘겼다. 세션 5에서 general-purpose 에이전트가 실제 구현을 담당했다.

오케스트레이터 게이트가 처음에 막혔다. 메인 Claude가 직접 `Edit`/`Write`를 하려 했는데, `stage: implementing`이 아니라서 차단됐다. 상태를 `implementing`으로 바꾸고 나서야 서브에이전트 write가 풀렸다.

```bash
source ~/.claude/workflows/.../lib/state.sh
state_set stage implementing
```

V1 완성 후 Codex가 4가지 must-fix를 찾아냈다. RSS 링크 프로토콜 allowlist 누락, 로그 라우트 EOF 빈 줄 등이었다. 바로 픽스 에이전트를 디스패치해서 처리했다.

## V2: 보안 발견

V2 작업(세션 8, 36분, 93 tool call) 중 cron 출력 디렉토리를 탐색하다가 중요한 것을 발견했다.

`~/.hermes/cron/output/<jobId>/<timestamp>.md` 파일에 **전체 프롬프트가 `## Prompt` 섹션으로 그대로 포함**돼 있었다. API 키나 내부 전략이 담긴 프롬프트가 대시보드 UI에 그대로 노출될 수 있는 구조였다. `allowlists.ts`에 프롬프트 섹션 redaction 로직을 추가하고 나서야 안전하게 cron 출력을 보여줄 수 있었다.

실제 데이터를 먼저 탐색하지 않았으면 놓쳤을 이슈다. 이번 작업에서 Bash로 실제 파일을 들여다보는 단계(33 Bash calls)가 구현보다 먼저였던 이유다.

## V3: 미션 컨트롤 리디자인

세션 9가 가장 길었다. 2시간 20분, 122 tool call. `interface-design` 스킬을 로드했는데 유저가 중간에 요청을 인터럽트했고, 이후 Codex cross-verify 결과를 받아 이어서 진행했다.

V3의 핵심 변화는 UI 언어였다. "AI News" 섹션을 없애고, 에이전트 진행 패널, 크론 이슈 카드, 워크보드를 새 컴포넌트로 분리했다. `globals.css`에 `cool-slate` 테마와 램프 효과가 들어갔다. 생성된 파일만 20개가 넘는다.

```
~/hermes-dashboard/src/
├── components/
│   ├── AgentProgressPanel.tsx   # 새 컴포넌트
│   ├── CronIssueCards.tsx       # 새 컴포넌트
│   ├── MissionControl.tsx       # 새 컴포넌트
│   └── WorkBoard.tsx            # 새 컴포넌트
└── lib/
    ├── controlRoomTypes.ts
    ├── workStages.ts
    └── workflows.ts
```

`Workflow` 도구를 한 번 사용했다. "contract → parallel components → integrate → typecheck" 4단계를 병렬로 처리하는 동적 워크플로였다.

## V4: 한국어 레이블

세션 11(49분, 59 tool call)은 UX 문제를 해결했다. `medical-dental-ads-daily-goal`, `telegram-tech-report-html` 같은 내부 식별자가 그대로 화면에 노출됐다. 사용자가 직접 불편함을 언급했다.

해결 방식은 간단했다. `describeCronJob` 헬퍼 함수를 `src/lib/cronLabels.ts`에 만들고, 모든 레이블 렌더링 컴포넌트에서 raw ID 대신 이 함수를 통하도록 수정했다. ~9개 파일에 걸친 변경이라 `standard`로 분류하고 `frontend-implementer` 서브에이전트에 위임했다.

## 오케스트레이터 패턴이 실제로 어떻게 동작했나

이번 작업에서 오케스트레이터 게이트를 여러 번 마주쳤다. 핵심은 두 가지다.

첫째, 메인 Claude가 직접 파일을 쓰려면 `stage: implementing` 상태여야 한다. 상태를 올려주지 않으면 `Edit`/`Write` 도구 사용이 차단된다.

둘째, `major` 작업은 plan → 구현 에이전트 → verifier → codex 순서를 강제한다. 귀찮아 보이지만, V1에서 Codex가 실제로 버그를 잡아냈고, V3에서도 Codex report의 blocking findings를 받아 픽스했다.

```
plan.md → 구현 → diff.patch → verifier-report.md → codex-report.md → 최종 보고
```

세션 6~7처럼 `config`만 보낸 경우에도 메인 에이전트가 workflow state를 읽어 맥락을 복원했다. 상태 파일(`state.json`)이 세션 간 연속성을 유지하는 핵심이다.

## 숫자로 정리

| 항목 | 수치 |
|------|------|
| 총 세션 수 | 11개 |
| 총 tool call | 478회 |
| Bash | 198회 |
| Read | 147회 |
| Edit | 46회 |
| Write | 39회 |
| Agent | 23회 |
| 생성 파일 | 32개 |
| 수정 파일 | 17개 |
| 최장 단일 세션 | 2시간 20분 (V3) |

Read가 Bash 다음으로 많다는 게 특징적이다. 구현보다 탐색에 더 많은 call이 쓰였다. 실제 데이터를 먼저 보고 설계하는 방식이 이번 작업 전반에 걸쳐 유효했다.
