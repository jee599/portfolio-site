---
title: "Claude Code가 스스로 코드 못 짜게 막는 오케스트레이터 하네스 구축"
project: "portfolio-site"
date: 2026-05-02
lang: ko
tags: [claude-code, orchestration, multi-agent, hooks, codex]
description: "훅 3개로 Claude Code를 오케스트레이터로만 동작시키는 하네스 엔지니어링. 5세션 355 tool calls, 서브에이전트 65회 디스패치, codex MCP 교차검증 파이프라인 구축."
---

355번의 tool call 중 Edit는 10번뿐이다. 나머지는 Bash(94), TaskUpdate(76), Agent(65)다. Claude Code에게 직접 코드를 쓰는 걸 막고, 모든 구현은 서브에이전트에 위임하도록 강제하는 구조를 만든 결과다.

**TL;DR** 훅 3개(`orchestrator-gate.sh`, `orchestrator-init.sh`, `orchestrator-stop.sh`)와 파일 기반 상태머신(`state.json`)으로 오케스트레이터 강제 워크플로를 구현했다. trivial이 아닌 모든 작업은 plan → implement → verify → codex 검증 파이프라인을 거친다.

## 발단: 5세션에서 같은 문제가 반복됐다

이번 주 Claude Code로 3개 프로젝트를 병렬 진행했다. 치과 광고 리서치(서브에이전트 12개 병렬, HTML 보고서 7종), DEV.to 글 5편 자동 발행, coffeechat Google Meet 통합. 총 5세션, 누적 작업 시간이 상당했다.

문제는 반복됐다. 계획 없이 바로 파일을 수정하는 경우가 있었다. 특히 멀티에이전트 작업에서 오케스트레이터 역할을 해야 할 메인 Claude가 직접 코드를 짜버렸다. 리뷰도, 검증도 없이. DEV.to 발행 세션에서도 "실패"한 tool call이 사실은 성공해서 파일이 중복으로 생겼다가 수동 정리한 일이 있었다.

서브에이전트 65번을 돌리면서 패턴이 명확해졌다. 좋은 에이전트는 plan을 읽고 diff를 뱉는다. 나쁜 에이전트는 컨텍스트 없이 파일을 건드린다. 메인도 마찬가지였다.

## 리서치: Hermes 127k⭐가 보여준 구조

4개 에이전트를 병렬 디스패치해서 오케스트레이션 프레임워크 레퍼런스를 조사했다. 찾은 것들:

- `NousResearch/hermes-agent` 127k⭐ — 실존하는 Hermes 에이전트 프레임워크
- Claude Code 공식 훅 문서 — `PreToolUse`, `Stop`, `SessionStart` 이벤트
- AutoGen, LangGraph 패턴 — 각각 오케스트레이터-워커 구조를 어떻게 강제하는지

핵심 인사이트는 두 가지였다.

하나, **상태는 파일로 영속**해야 한다. 컴팩션이 일어나면 대화 컨텍스트가 사라진다. `state.json`이 task_id, complexity, stage, completed_stages를 기록하면 세션이 끊겨도 어디까지 왔는지 복원된다.

둘, **강제는 훅으로**만 된다. Claude가 "다음엔 꼭 plan 먼저 만들겠다"고 약속해봤자 소용없다. `PreToolUse` 훅이 요청 자체를 deny하는 게 유일하게 작동하는 방법이다.

## 구현: 3개 훅 + 파일 상태머신

```
~/.claude/
├── workflow/
│   ├── ORCHESTRATION.md    # complexity 분류 + 파이프라인 정의
│   ├── AGENTS.md           # 에이전트 카탈로그 (역할·트리거·산출물 경로)
│   ├── lib/
│   │   ├── state.sh        # state_set, state_add_completed 헬퍼
│   │   └── classify.sh     # complexity 분류 휴리스틱
│   └── current/
│       ├── state.json      # 현재 태스크 상태
│       ├── plan.md         # plan-orchestrator 산출물
│       ├── diff.patch      # 구현 결과
│       ├── verifier-report.md
│       └── codex-report.md
└── hooks/
    ├── orchestrator-gate.sh   # PreToolUse: plan 없이 코드 못 짬
    ├── orchestrator-init.sh   # UserPromptSubmit: 분류 + state 초기화
    └── orchestrator-stop.sh   # Stop: diff 있는데 검증 없으면 차단
```

`orchestrator-gate.sh`의 핵심 로직은 단순하다. `state.json`에서 complexity를 읽어서 trivial이 아니면, stage가 `implementing`이 아니면, Edit/Write를 deny한다. 메인이 plan 에이전트를 호출하고 `state_set stage implementing`으로 전환한 후에야 서브에이전트가 파일을 건드릴 수 있다.

`orchestrator-stop.sh`는 반대 방향에서 막는다. `diff.patch`가 있는데 `verifier-report.md`가 없으면 응답 종료를 `exit 2`로 차단한다. standard 이상은 `codex-report.md`도 있어야 한다.

## Codex MCP 교차검증 — 마지막 게이트

`~/.claude/agents/codex-cross-verify.md`로 정의한 에이전트가 `mcp__codex__codex`를 호출한다. diff + plan + verifier-report를 외부 모델에 던지는 구조다.

```
Cross-check:
1. Does the diff match the plan?
2. Are there bugs the verifier missed?
3. Any breaking changes?

Return: VERDICT (approve|request-changes) + findings.
```

내부 검증 루프는 확증 편향이 있다. 같은 컨텍스트에서 만든 코드를 같은 컨텍스트에서 검증하면 blind spot을 놓친다. 외부 모델이 마지막에 한 번 더 보는 게 그 gap을 메운다.

## complexity 분류표

| complexity | 기준 | 파이프라인 |
|---|---|---|
| trivial | `~/.claude/**` ≤3줄, 또는 순수 질문 | 메인 직접 처리 |
| simple | 단일 파일 ≤30줄 | 구현 → verify |
| standard | 신규 기능·UI·다중 파일 ≤5 | plan → 구현 → verify → codex |
| major | 파일 6+·아키텍처 변경 | standard + code-reviewer |

임계치는 보수적으로 잡았다. 의심스러우면 한 단계 위로. 거의 모든 코딩 작업은 standard 이상이다.

## 숫자로 보는 이번 주

이번 주 5세션에서 Edit 10번은 대부분 이 하네스 자체를 구축하면서 발생했다. 생성된 파일 34개, 수정 파일 7개. 병렬 디스패치한 서브에이전트 65회가 실질적인 작업을 담당했다.

DEV.to 글 5편도 단일 에이전트가 아니라 5개 에이전트 병렬로 작성했다. 치과 광고 리서치는 12개 에이전트가 각 도메인을 나눠서 처리했다. 오케스트레이터가 직접 조사하거나 직접 쓰면 병목이 된다.

다음 작업부터 메인이 직접 파일을 건드리는 일은 없어야 한다. 훅이 막을 테니까.
