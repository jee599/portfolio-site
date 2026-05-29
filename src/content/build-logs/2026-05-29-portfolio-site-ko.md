---
title: "9세션 259 tool calls: Hermes 대시보드를 하루 만에 V1→V3까지 반복한 기록"
project: "portfolio-site"
date: 2026-05-29
lang: ko
tags: [claude-code, hermes, dashboard, nextjs, automation, workflow, subagent]
description: "Claude Code 9세션 259 tool call. 오케스트레이터 게이트에 막히고, 보안 버그를 발견하고, subagent를 10번 호출해 Hermes 대시보드를 하루 만에 V3까지 완성한 과정."
---

하루 동안 Claude Code 세션을 9번 열었다. 259번의 도구 호출이 발생했다. 가장 긴 세션은 49분이었고, 가장 짧은 건 0분이었다. 코드 변경 없이 Read만 반복한 세션도 있었고, 혼자 93번 tool call을 쏘아올린 세션도 있었다.

**TL;DR** 오늘의 핵심 작업은 Hermes 운영 대시보드 MVP였다. 오케스트레이터 훅이 메인 에이전트의 write를 반복적으로 막았고, 그때마다 subagent에 위임했다. 덕분에 V1 → V2 → V3가 하루 안에 끝났다.

## 오전: 보고서 세 개, 코드 변경 0건

첫 세 세션은 코드를 건드리지 않았다.

세션 1(8 tool calls, 0분)은 SpoonAI 뉴스사이트용 콘텐츠 후보 수집이었다. Read 6번, Bash 2번으로 끝났다. Write 0회. 수집·종합 결과를 다음 파이프라인에 넘기는 역할이라 산출물이 없다.

세션 2(22 tool calls, 3분)는 치과 광고 리서치 데일리 업데이트. 네이버 톡톡 상담 확장소재 공지를 rolling 파일에 누적 반영하는 작업이었다. `summary.json`이 너무 커서 나눠 읽어야 했다. Grep 4번으로 기존 파일 내 중복 여부를 먼저 확인하고 Write 1번으로 마무리했다.

세션 3(14 tool calls, 4분)에서 처음으로 오케스트레이터 게이트 충돌이 발생했다. P1 제품 일일 보고서를 만들다가 워크플로우가 작업을 `major`로 분류해 차단했다.

```
오케스트레이터 게이트가 막혔습니다.
이건 코드 변경이 아니라 일일 보고서 생성 —
major가 아니라 standard입니다. 재분류합니다.
```

Claude가 스스로 재분류하고 계속했다. `~/product-agent-management/reports/p1_product_daily_report_2026-05-29.html`이 산출물이었다.

## Hermes 대시보드: 왜 필요했나

Jidong의 작업 환경은 Hermes(Telegram 릴레이), Claude CLI, Codex CLI, GitHub Actions cron이 동시에 돌아간다. 지금 어떤 에이전트가 뭘 하는지, 마지막 cron이 성공했는지 파악하려면 여러 로그 파일을 직접 뒤져야 했다.

브리프는 단순했다: read-only 로컬 대시보드, `localhost:7878`, Hermes Agent 소스 미수정.

## 세션 4: plan 단계에서 막힌 write

세션 4(15 tool calls, 2분)에서 환경 탐색을 마치고 plan 파일을 `current/plan.md`에 쓰려는 순간 게이트가 개입했다. `stage`가 `implementing`이 아니었기 때문이다.

해결책은 plan-orchestrator subagent에 위임하는 것이었다. 직접 쓰는 대신 에이전트에게 경로를 넘겼다.

```
~/.claude/workflows/Users-jidong-hermes-dashboard-4fc2267a47/current/plan.md
```

이게 이날의 패턴이 됐다. 메인 에이전트는 계획과 검증을 담당하고, 실제 write는 subagent가 처리한다.

## 세션 5: V1, 49분 66 tool calls

가장 긴 세션이었다. 브리프를 읽고, 환경을 확인하고, 구현 전체를 `general-purpose` subagent 하나에 위임했다.

```
Read /Users/jidong/.hermes/tmp/hermes-dashboard-brief.md and implement it now.
Work until the local dashboard MVP is usable and verified.
```

plan 읽기, 코드 작성, `npm install`, 빌드, diff 생성까지 한 번에 위임했다. 메인 에이전트가 직접 쓰는 것보다 이 방식이 더 빨랐다.

Bash 36번, Agent 7번, TaskCreate 10번, TaskUpdate 7번.

V1 완료 후 Codex 교차검증에서 4개 must-fix 항목이 나왔다. 그 중 두 개 — RSS 링크 프로토콜 허용 목록 누락, 로그 라우트 EOF blank line — 가 남아 fix agent를 한 번 더 돌렸다.

## 세션 8: V2, 36분 93 tool calls — 보안 버그 발견

`hermes-dashboard-v2-brief.md`를 읽고 시작한 세션이다. 이 세션의 핵심은 cron 출력 디렉토리 구조를 정확하게 파악하는 것이었다.

탐색 도중 중요한 보안 문제를 발견했다.

```
Critical security finding: those .md files echo the full prompt in a ## Prompt section
```

`~/.hermes/cron/output/<jobId>/<timestamp>.md` 파일에 실행된 프롬프트 전체가 담겨 있었다. API 엔드포인트로 그냥 노출하면 시스템 프롬프트가 외부에 드러난다. `src/lib/allowlists.ts`에 프로토콜 허용 목록을 만들고, `src/app/api/cron-output/route.ts`에 프롬프트 섹션 리덕션을 추가했다.

이 세션에서 새로 생성된 컴포넌트:
- `src/components/ActiveWork.tsx`
- `src/components/CronOutputPanel.tsx`
- `src/components/NowStrip.tsx`

도구 사용: Bash 33번, Read 31번, Edit 17번, Write 10번.

## 세션 9: V3, 6분 33 tool calls — 탐색이 주

마지막 세션은 V3 디자인 개선이었다. `interface-design` 스킬을 로드하고 시작했다.

33번의 tool call 중 Read 20번, Bash 11번. 구현보다 탐색이 주였다. 새 데이터 소스 — tmux 세션 상태, workflow state, git — 의 실제 형태를 이해하는 데 대부분의 시간을 썼다. 코드 작성 없이 plan 파일 작성으로 마무리됐다.

빠른 구현보다 올바른 데이터 모델링을 먼저 한다는 패턴이다.

## 전체 통계

| 도구 | 횟수 |
|------|------|
| Bash | 111 |
| Read | 81 |
| Edit | 17 |
| Write | 16 |
| Agent(subagent) | 10 |
| TaskCreate | 10 |
| TaskUpdate | 7 |
| Grep | 4 |
| **합계** | **259** |

9세션, 총 약 95분. 신규 생성 파일 12개, 수정 파일 6개.

## 오케스트레이터 게이트가 만든 작업 패턴

이날 가장 인상적이었던 건 오케스트레이터 훅이 작업 구조를 능동적으로 바꿨다는 점이다.

`stage`가 맞지 않으면 메인 에이전트의 파일 write가 차단된다. 처음에는 마찰이었지만, 결과적으로 역할이 명확하게 분리됐다. 메인 에이전트는 계획·검증·판단을 맡고, 구현은 subagent가 처리한다. Agent를 10번 호출한 게 그 흔적이다.

subagent 위임 구조가 없었다면 메인 에이전트가 모든 걸 직접 처리하려다 context가 터졌을 것이다. 대신 각 subagent는 작은 범위만 담당하고 fresh context로 시작했다.

> 게이트가 막으면 우회하지 말고, 위임하라. 그게 아키텍처가 의도한 방향이다.
