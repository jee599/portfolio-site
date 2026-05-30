---
title: "Claude Code 19 세션 473 calls — Claude 자신을 감시하는 대시보드 삽질기"
project: "portfolio-site"
date: 2026-05-30
lang: ko
tags: [claude-code, hermes, dashboard, next-js, automation]
description: "같은 프롬프트를 6번 시도하고 echo probe 5개를 거친 뒤에야 구현이 시작됐다. Hermes 대시보드 V1→V3, 크론 ID 한국어화, 보안 이슈 발견까지 473 tool calls의 기록."
---

19 세션, 473 tool calls. 그런데 실제 파일 변경은 세션 12부터다.

**TL;DR** Claude Code로 Claude 작업을 모니터링하는 Hermes 대시보드를 V1→V3으로 순차 업그레이드했다. 같은 프롬프트가 6번 반복됐고, 작업 도중 cron 출력 파일에서 보안 이슈를 발견했다.

## 같은 프롬프트가 6번 실행됐다

세션 1, 3, 4, 5, 7, 9는 모두 동일한 프롬프트로 시작한다. "Hermes 대시보드를 미션 컨트롤 스타일로 업그레이드하라." Read 도구와 Bash 도구로 코드베이스를 탐색하는 작업만 반복됐고, 파일을 한 줄도 바꾸지 않았다.

중간에는 `HELLO`, `BARE_OK`, `CLEAN_OK`, `CLAUDE_LEAN_OK`, `CLAUDE_FINAL_LEAN_OK` echo 세션이 끼어들었다. Hermes가 Claude Code를 relay로 쓰는 구조에서 컨텍스트 라우팅이 올바른지 확인하는 probe였다. 5개 세션, 0 tool calls.

실제 구현은 세션 12에서 시작됐다. 프롬프트 구조가 이렇게 바뀌었다.

```
"You are Claude Code, the actual implementer.
Hermes is only the relay/orchestrator."
```

이 한 문장으로 루프가 끊어졌다. LLM orchestration에서 agent 역할 분리를 명확히 하지 않으면 같은 탐색을 반복하게 된다.

## Hermes 대시보드가 뭔지

`http://127.0.0.1:7878`에서 돌아가는 로컬 Next.js 앱이다. Claude Code 세션, Codex 세션, cron 작업, tmux 세션, 워크플로우 상태를 실시간으로 보여준다. Claude가 Claude 자신의 작업을 추적하는 구조다.

문제는 UI였다. `medical-dental-ads-daily-goal`, `telegram-tech-report-html`, `daily-codex-cli-update` — cron 작업 ID가 원시 문자열로 노출됐다. 어떤 작업인지 대시보드만 봐서는 알 수 없었다. 사용자 불만이 거기서 시작됐다.

## 세션 12: 한국어 레이블 도입 (49분, 59 tool calls)

`describeCronJob` 헬퍼를 새로 만들고, 7개 cron job ID에 한국어 설명을 1:1 매핑했다. 모든 컴포넌트에서 `{j.name || j.id}` 대신 `describeCronJob(j.id)`를 쓰도록 수정했다.

Codex cross-review가 blocking 피드백 두 개를 냈다. 첫째, `CronOutputPanel.tsx` 161번째 줄이 여전히 raw ID를 primary label로 쓰고 있었다. 둘째, 새 헬퍼가 `import`되지 않은 컴포넌트가 있었다. 두 blocker를 수정하고 typecheck/build를 통과시킨 뒤 커밋했다.

이 세션의 도구 분포가 흥미롭다. Bash 32회, Read 22회, Agent 4회, Write 1회. Agent 4회는 Codex cross-review와 `frontend-implementer` 서브에이전트 위임이었다. 수정 파일이 8개 이상이라 단일 컨텍스트로 처리하기엔 범위가 너무 넓었다.

## 세션 13: V2 — cron 출력 패널 (36분, 93 tool calls)

`~/.hermes/tmp/hermes-dashboard-v2-brief.md`를 받아서 실행했다. 신규 컴포넌트 3개(`ActiveWork.tsx`, `CronOutputPanel.tsx`, `NowStrip.tsx`)와 API route(`/api/cron-output`)를 추가했다.

`~/.hermes/cron/output/<jobId>/<timestamp>.md` 구조를 파악하는 과정에서 예상치 못한 것을 발견했다. 출력 파일 안에 `## Prompt` 섹션이 있었고, 전체 프롬프트 내용이 그대로 기록돼 있었다. API가 이 파일을 그대로 노출하면 민감한 프롬프트가 클라이언트에 전달된다.

기능 요구사항에 없던 처리였다. 코드를 실제로 읽다가 파일 구조를 확인하면서 발견한 케이스다. `/api/cron-output` route에 `## Prompt` 섹션 redact 필터를 추가했다.

이 세션에서만 Bash 33회, Read 31회, Edit 17회, Write 10회가 나왔다. 파일을 새로 만들 때 Write 횟수가 급격히 높아지는 패턴이다. 이 세션에서만 14개 파일을 생성/수정했다.

## 세션 14: V3 — 전면 재설계 (2시간 20분, 122 tool calls)

가장 무거운 세션이다. `hermes-dashboard-v3-brief.md`로 시작했다.

코드베이스를 탐색하는 데만 Read 28회, Bash 10여 회를 썼다. 실시간 데이터를 직접 확인했다: cron 작업 7개, 워크플로우 상태 26개, Claude 프로세스 3개 활성, 서버 정상 가동. 이 숫자들이 새 컴포넌트 설계의 기반이 됐다.

세션 중간에 유저가 인터럽트를 걸었다. Codex cross-verification 완료 후 이어받는 프롬프트가 별도로 왔다:

```
Codex cross-verification is done. Continue: inspect the Codex report for any
blocking issues. If only minor/non-blocking, do not over-polish; run final
typecheck/build/diff-check, commit, restart the 7878 dashboard.
```

"over-polish 금지" 지시가 핵심이다. Codex가 minor 이슈만 리포트하면 그냥 커밋하라는 뜻이다. 완벽주의 루프를 끊는 명시적 지시다. Codex report에 true blocker가 없었다. typecheck/build를 통과시키고 `feat: redesign Hermes dashboard work control room` 커밋을 넣었다. 생성/수정 파일만 35개였다.

## 도구 사용 통계

전체 473 tool calls 중 Read가 209회(44%)다. 구현보다 탐색이 두 배 이상 많다. Bash가 153회(32%), Edit이 46회(10%), Write가 34회(7%)다.

Edit과 Write 합계가 80회인데 실제 생성/수정 파일은 46개다. 파일당 평균 1.7회 수정이다. `allowlists.ts`와 `page.tsx`는 세션마다 반복적으로 손댔다. 한 번에 완성하지 못한 파일이 많다는 뜻이다.

Agent(17)은 Codex cross-verify와 `frontend-implementer` 위임이다. 주 에이전트가 모든 걸 직접 쓰지 않고 verification loop를 외부에 위임한 구조다.

## brief 파일이 탐색 루프를 끊는다

세션 1~11, 11개 세션에서 파일 변경이 없었다. 원인은 orchestration 구조였다. Hermes가 중간에서 Claude Code 세션을 관리할 때 세션 context가 올바르게 전달됐는지 확인하는 과정이 반복됐고, 오케스트레이터가 탐색 → 기획 → "다음 세션에서 구현" 루프를 빠져나오지 못했다.

brief 파일 방식(세션 13, 14)으로 전환했을 때 속도가 붙었다. `hermes-dashboard-v2-brief.md`처럼 스펙을 파일로 써두면 세션이 열릴 때마다 재탐색하지 않고 파일을 읽고 바로 구현에 들어간다.

> "Upgrade into a more visual mission-control style dashboard"처럼 열린 목표는 탐색 루프를 만든다. brief 파일로 구체화하면 컨텍스트 재구성 비용이 파일 읽기 한 번으로 줄어든다.

19 세션이 필요하지 않았다. 처음부터 brief 파일로 시작했으면 5 세션 안에 끝났을 것이다.
