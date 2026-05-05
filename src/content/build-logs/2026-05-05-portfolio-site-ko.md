---
title: "Claude Code + OMX 이중 파이프라인 병목 발견: 코드 0줄, 3세션 20회 tool call"
project: "portfolio-site"
date: 2026-05-05
lang: ko
tags: [claude-code, oh-my-codex, workflow, over-engineering, dental-ai, orchestrator]
description: "Claude Code ORCHESTRATION.md와 OMX team_pipeline이 동일한 plan→verify 흐름을 두 번 강제하는 이중 파이프라인 병목을 발견했다. 3세션 20회 tool call, 코드 변경 0줄로 진단 완료."
---

이중 오케스트레이터가 같은 작업을 두 번 하고 있었다.

**TL;DR** 3세션 20회 tool call, 코드 변경 0줄. Claude Code `ORCHESTRATION.md`와 Oh My Codex `team_pipeline`이 충돌하는 구조를 진단했고, 첫 실제 고객(동백 유디치과)의 MVP 패키지를 설계했다.

## 이중 파이프라인이 충돌하는 구조

`dentalad` 프로젝트에서 워크플로를 점검하다 구조적인 충돌을 발견했다. Claude Code의 `ORCHESTRATION.md`와 OMX `team_pipeline`이 독립적으로 `plan → implement → verify → cross-verify` 흐름을 각자 강제하고 있었다.

```
Claude ORCHESTRATION.md:  plan.md → diff.patch → verifier-report.md → codex-report.md
OMX team_pipeline:         plans/ → state/ → logs/ → cross-verify
```

한 작업이 두 파이프라인에 걸리면 단계가 중복된다. 산출물 저장 위치도 `current/`와 `.omx/state|plans|logs/`로 갈린다. 어느 쪽이 진실원인지 모호해지고, 양쪽 결과를 모두 확인해야 하는 오버헤드가 생긴다.

두 번째 문제는 분류 휴리스틱이었다. 분석 요청이나 질문조차 `standard`로 분류돼 `plan-orchestrator` 호출이 붙었다. 코드 변경이 없는 순수 분석에 무거운 파이프라인이 강제됐다.

## Read 9회, Bash 7회 — 코드 없이 진단

세션 1은 16회 tool call로 끝났다. `Read` 9회로 네 파일을 점검했다.

- `CLAUDE.md` — Lightweight First 원칙과 complexity 분류 기준
- `workflow/AGENTS.md` — 서브에이전트 카탈로그와 호출 규약
- `.omx/README.md` — Oh My Codex team_pipeline 구조
- `~/.codex/config.toml` — Codex 전역 설정

`Bash` 7회는 `git status`, `state.sh` 헬퍼 호출, 디렉토리 확인에 쓰였다. Edit나 Write는 한 번도 없었다. 코드를 건드리지 않고 구조만 읽어서 병목을 찾아낸 세션이다.

진단 결과는 다섯 줄로 정리됐다.

1. 이중 오케스트레이터 충돌 — 동일 흐름을 두 파이프라인이 각자 강제
2. 산출물 위치 이중화 — `current/` vs `.omx/` 분기
3. 분류 보수성 — 분석·질문도 `standard`로 올라가 heavy 파이프라인 진입
4. OMX `$team` / `$ultrawork` 기본 활성화 — 명시 요청 없이 swarm이 붙는 경우 있음
5. 불필요한 Codex cross-verify — trivial 작업에도 외부 교차검증 루프가 발동

## 방향: Lightweight First를 실제로 적용

`ORCHESTRATION.md`에 이미 쓰여있는 원칙이었다. "작은 작업에 무거운 파이프라인을 붙이지 않는다." 실제 운영에서 지켜지지 않았을 뿐이다.

수정 방향은 단순하다. `trivial`은 메인이 직접 처리하고 에이전트·Codex를 붙이지 않는다. `simple`은 직접 수정 후 빠른 검증만 한다. `standard`는 짧은 체크리스트 후 구현하고 Codex는 선택 사항이다. `major`만 plan → verify → Codex 풀 파이프라인을 돌린다.

OMX `$team`과 `$ultrawork`는 명시적 heavy mode다. 병렬 작업이 필요하거나 대형 PRD 기반 빌드일 때만 쓴다. 분석·질문·설정 소폭 수정에 swarm을 붙이지 않는다.

> "파이프라인이 많다고 품질이 높은 게 아니다. 작업 크기에 맞는 경로가 가장 빠르다."

## 세션 2: 상태 확인 1회 tool call

세션 2는 `Bash` 1회였다. `status` 커맨드로 현재 workflow state를 확인하고 끝났다. `task_id: 20260505-052532`, stage: `classified`, 진행 중인 산출물 없음. 20회 tool call 중 1회가 이 세션이다.

## 첫 고객 분석: 동백 유디치과

세션 3은 `Bash` 3회였다. dentalad의 첫 파일럿 고객인 동백 유디치과에 대한 MVP 패키지 분석이었다.

공개 데이터로 확인된 기본값은 이렇다. 경기 용인시 기흥구 동백중앙로 273, 평일 09:30~18:30, 토요일 09:30~14:30. 네이버 예약 가능, 주차 가능. 진료과목은 보존·보철·교정·치주·구강외과·임플란트.

MVP를 Week 1부터 순서대로 설계했다.

**A. 광고 진단 리포트 (Week 1)** — 독립 판매 가능한 단위다. 네이버 플레이스·블로그·지도·유튜브 노출 현황, 동백·기흥 경쟁 5곳 비교, "동백 임플란트"·"용인 교정"·"어린이치과 동백" 키워드 갭, 의료법 자가 점검, Quick-win 5개.

**B. 의료법 준수 패키지** — 치과 광고 자동화에서 빠질 수 없는 단계다. 콘텐츠 생성 전에 의료법 기준을 명문화하고, 출력물마다 체크리스트를 적용한다.

핵심 판단은 하나다. 광고 자동화를 팔기 전에 진단 리포트를 먼저 판다. 진단이 들어가야 고객이 문제를 인식하고, 자동화 솔루션의 가치가 명확해진다. 첫 주에 리포트로 신뢰를 쌓고, 그 다음에 자동화 계약을 연결한다.

## 숫자

| 항목 | 수치 |
|------|------|
| 총 세션 수 | 3 |
| 총 tool calls | 20 |
| Bash | 11 |
| Read | 9 |
| Edit / Write | 0 |
| 수정 파일 | 0개 |
| 생성 파일 | 0개 |
| 총 소요 시간 | 약 3분 |

코드가 없는 날이었다. Read와 Bash만으로 구조 문제를 진단하고 사업 방향을 정리했다. "아무것도 만들지 않은 세션"이 때로 가장 명확한 결과를 낸다.
