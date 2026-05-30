---
title: "Claude Code 19세션, 473 tool calls로 Hermes 대시보드 V3 완성까지"
project: "portfolio-site"
date: 2026-05-31
lang: ko
tags: [claude-code, hermes, dashboard, next-js, orchestration, prompting]
description: "Claude Code 19개 세션과 473번의 도구 호출로 Hermes 로컬 대시보드를 미션 컨트롤 UI로 업그레이드. 초반 8세션 삽질, 프롬프트 패턴 돌파, 보안 이슈 발견까지."
---

473번의 도구 호출, 19개 세션, 그 중 8개는 코드 한 줄도 못 건드린 채 읽기만 하다 끝났다.

**TL;DR** Hermes 로컬 대시보드를 Next.js 미션 컨트롤 UI로 업그레이드하는 과정에서 Claude Code가 "계획 루프"에 빠지는 패턴을 발견했다. 이를 brief 파일 방식으로 돌파했고, Codex 교차검증에서 보안 이슈도 잡아냈다.

## 초반 8세션: 읽기만 하고 구현 안 하는 Claude

세션 1부터 9까지 동일한 요청을 반복했다. "Hermes 대시보드를 미션 컨트롤 스타일로 업그레이드해라." 매번 Claude는 같은 패턴을 보였다.

코드베이스 탐색 → 현황 분석 → 설계 제안 → 종료. 구현 없음.

세션 1: `Read` 16번, `Bash` 4번. 결과물 없음. 세션 3: 동일 패턴, 21 tool calls. 결과물 없음. 세션 7: "계획 금지, 지금 바로 구현해라"를 프롬프트에 직접 넣어봤지만, 또 탐색만 하다 끝났다.

문제는 Hermes 오케스트레이터가 Claude에게 넘기는 프롬프트 구조에 있었다. "먼저 이해하고, 제안하고, 승인 받아라" 흐름이 시스템적으로 박혀 있었던 것이다. 세션마다 스킬(`interface-design`, `brainstorming`)이 로드되면서 계획 단계를 강제하는 구조였다.

## 돌파구: 명시적 "승인 완료, 지금 바로 구현" 프롬프트

세션 12에서 프롬프트 구조를 바꿨다.

```
You are Claude Code implementing an approved UI upgrade. IMPORTANT: Do not enter plan mode,
do not invoke superpowers/skills, do not present another proposal. Directly edit files in
this repo, then run verification.
```

이것만으로는 부족했다. 탐색 단계가 여전히 길었기 때문에 brief 파일 방식으로 전환했다.

```
Read /Users/jidong/.hermes/tmp/hermes-dashboard-v2-brief.md and execute it fully.
Use Opus 4.8 xhigh. Work until verified and committed, or report any blocker.
```

`hermes-dashboard-v2-brief.md`에는 변경할 파일 목록, 정확한 데이터 구조, 구현 순서가 모두 담겨 있었다. Claude는 brief를 읽고 바로 구현으로 진입했다. 세션 12: 59 tool calls로 코어 레이블 시스템 완성. 세션 13: 93 tool calls로 V2 완성. 이 두 세션에서 실제 코드가 처음으로 나왔다.

## 보안 이슈: cron output에 전체 프롬프트가 노출

세션 13에서 `~/.hermes/cron/output/<jobId>/<timestamp>.md` 파일을 열어보다 발견한 것이다.

```markdown
## Prompt
<프롬프트 전체 내용 — API 키, 내부 경로, 시스템 정보 포함>

## Response
...
```

cron 출력 파일에 프롬프트 섹션이 그대로 기록되어 있었다. `/api/cron-output` 엔드포인트에서 이 파일을 그대로 서빙하면, 웹 UI에서 시스템 내부 정보가 노출되는 구조였다.

대응: `## Prompt` 섹션을 파싱 단계에서 제거하는 redaction 로직을 `src/lib/allowlists.ts`에 추가했다. 이 파일이 데이터 sanitization의 단일 진입점이 된 이유가 여기 있다.

## V3: 35개 파일, 한 세션에 2시간 20분

세션 14가 이 작업에서 가장 큰 세션이었다. 122 tool calls, 2시간 20분. V3 brief는 범위가 넓었다: 새 컴포넌트 5개, 새 API 라우트 3개, lib 파일 전면 재설계.

이 세션에서 생성된 주요 파일들:

- `src/components/WorkBoard.tsx` — 진행 중인 작업을 카드로 표시
- `src/components/AgentProgressPanel.tsx` — Claude/Codex 세션 진행 상황
- `src/lib/workflows.ts` — 워크플로우 상태 파싱
- `src/lib/workStages.ts` — 작업 단계 정의
- `src/app/api/control-room/route.ts` — 모든 데이터를 통합하는 단일 엔드포인트

Codex 교차검증도 이 세션에서 적용했다. `codex-report.md`에서 두 개의 blocking 이슈가 나왔다. `CronOutputPanel.tsx`가 `describeCronJob()` 헬퍼 대신 여전히 raw `{j.name || j.id}`를 렌더링하고 있다는 것, 그리고 타입 불일치. 두 이슈 모두 세션 분리해서 수정했다.

## 한국어 레이블: 내부 ID를 사람이 읽을 수 있게

이 작업의 출발점 중 하나가 "cron job 이름을 사람이 읽을 수 있게"였다. UI에 `medical-dental-ads-daily-goal`, `telegram-tech-report-html`, `daily-codex-cli-update` 같은 내부 식별자가 그대로 보이던 문제였다.

해결책은 `describeCronJob()` 헬퍼를 만들어 ID → 한국어 설명을 매핑하는 것이었다. 구현 자체는 단순했지만, 이걸 모든 컴포넌트에 제대로 적용하는 데 두 번의 시도가 필요했다. Codex가 `CronOutputPanel.tsx`에서 raw 이름이 여전히 노출된다고 지적했기 때문이다.

## 프롬프트 패턴 정리

이번 작업에서 유효했던 접근:

> 반복 실패 세션이 있다면, 프롬프트가 아니라 오케스트레이터 구조를 의심해라.

스킬/계획 모드가 강제되는 환경에서는 "계획 금지" 지시만으론 부족하다. 외부 brief 파일로 컨텍스트와 구현 지시를 분리해서 넘기는 방식이 효과적이었다. Claude는 brief를 읽고 바로 Edit/Write 단계로 진입했다.

## 통계

| 지표 | 값 |
|------|------|
| 총 세션 수 | 19개 |
| 실제 구현 세션 | 4개 (세션 12, 13, 14, 15) |
| 총 tool calls | 473 |
| Read | 209 (44%) |
| Bash | 153 (32%) |
| Edit | 46 (10%) |
| Write | 34 (7%) |
| Agent (서브에이전트) | 17 |
| 생성 파일 | 29개 |
| 수정 파일 | 17개 |

Read가 전체의 44%를 차지한다. 매 세션마다 컨텍스트를 새로 쌓아야 하기 때문이다. 반복 세션 패턴에서는 brief 파일로 컨텍스트를 미리 압축해 넘기는 것이 Read 호출 수를 줄이는 현실적인 방법이다.
