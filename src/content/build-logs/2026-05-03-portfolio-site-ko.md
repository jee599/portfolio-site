---
title: "Claude Code 오케스트레이터 하네스 구축 — 79번의 툴 콜로 완성한 강제 워크플로우"
project: "portfolio-site"
date: 2026-05-03
lang: ko
tags: [claude-code, orchestration, multi-agent, harness, workflow, hooks]
description: "Claude Code 훅으로 오케스트레이터-서브에이전트 워크플로우를 강제 구현. 79번 툴 콜·6시간 44분·9개 파일로 만든 멀티에이전트 하네스 엔지니어링 과정."
---

6시간 44분, 79번의 툴 콜. 그 결과로 생긴 파일은 9개다. 코드를 짠 게 아니라 **Claude Code가 혼자 멋대로 행동하지 못하도록 막는 구조**를 짰다.

**TL;DR** — `PreToolUse`, `Stop` 훅으로 오케스트레이터 강제 워크플로우를 구현했다. 이제 trivial 이 아닌 모든 작업은 plan → 구현 → verify → codex 교차검증 파이프라인을 통과해야 한다.

## 발단: "하네스 엔지니어링 되어 있어?"

처음 요청은 단순했다. "codex MCP로 마지막에 교차검증 넣어줘." 대화가 진행되면서 요청이 확장됐다. codex 교차검증만이 아니라, 애초에 AI가 계획 없이 코드를 짜거나 검증 없이 마무리하는 패턴 자체를 막고 싶다는 거였다.

문제 진단부터 했다. 당시 하네스 상태:

- `SessionStart` → `sticky-rules.sh` (컴팩션 후 룰 재주입)
- `PreToolUse(Bash)` → `contextzip-rewrite.sh` (토큰 절감)
- `PreToolUse(Edit|Write|MultiEdit)` → `protect-files.sh` (파일 보호)
- `Stop` → `commit-cleanliness.sh` (커밋 위생)

오케스트레이션은 **부분만** 적용돼 있었다. 서브에이전트 정의는 있었지만 강제 메커니즘이 없었다. 사용자가 어떤 작업을 주든 Claude가 알아서 직접 코드를 짜고 끝냈다.

## 리서치: 4개 에이전트 병렬 디스패치

구현 전에 레퍼런스를 찾았다. 오케스트레이터 패턴이 실제로 어떻게 구현되는지, Hermes 에이전트가 뭔지, Claude Code 훅으로 강제하는 구조가 있는지 — 4개 도메인을 병렬로 던졌다.

```
Agent 1: Multi-agent orchestration frameworks 조사
Agent 2: Hermes agent framework 조사
Agent 3: Claude Code harness and sub-agent enforcement 조사
Agent 4: Agent enforcement and gating patterns 조사
```

Hermes는 `NousResearch/hermes-agent` (127k ⭐)였다 — fine-tuned 모델이지, Claude Code 하네스 레이어가 아니었다. 직접 가져다 쓸 수 있는 게 아니었다. Claude Code hooks 공식 문서 패턴이 훨씬 실용적이었다.

리서치 결과를 합쳐서 `/Users/jidong/orchestrator-harness-research.html`로 정리했다.

## 설계: 파일 기반 상태머신

핵심 결정은 **메모리가 아니라 파일로 상태를 관리**하는 것이었다. Claude Code는 컴팩션이 일어나거나 세션이 끊기면 컨텍스트를 잃는다. `state.json`이 파일시스템에 남아 있으면 다음 세션에서도 이어받을 수 있다.

구조:

```
~/.claude/workflow/
├── ORCHESTRATION.md       # 워크플로우 정의서
├── AGENTS.md              # 에이전트 역할·트리거·산출물
├── current/
│   ├── state.json         # 활성 작업 상태
│   ├── plan.md
│   ├── research.md
│   ├── diff.patch
│   ├── verifier-report.md
│   └── codex-report.md
└── log/
    └── YYYYMMDD-HHMMSS/   # 완료된 작업 아카이브
```

`state.json` 스키마는 `task_id`, `complexity`, `stage`, `completed_stages`, `artifacts` 필드를 갖는다. 이게 진실원(source of truth)이다.

## 훅: 실제로 강제하는 구조

3개 훅이 파이프라인을 강제한다.

**`orchestrator-gate.sh` (PreToolUse)**
`Edit | Write | MultiEdit` 호출 전에 실행된다. `state.json`의 `complexity`가 `trivial`이 아닌데 `stage`가 `implementing`이 아니면 deny를 반환한다. plan 없이 코드를 짤 수 없다.

**`orchestrator-init.sh` (UserPromptSubmit)**
매 사용자 요청마다 `additionalContext`로 분류·라우팅 룰을 재주입한다. 컴팩션 이후에도 오케스트레이터가 룰을 잊지 않는다.

**`orchestrator-stop.sh` (Stop)**
응답 종료 전에 실행된다. diff가 있는데 `verifier-report.md`나 `codex-report.md`가 없으면 `exit 2`를 반환한다. 검증 없이 응답을 못 끝낸다.

complexity 분류는 의도적으로 보수적으로 설정했다. 의심스러우면 한 단계 위로 올린다. trivial은 진짜 트리비얼한 메모리·설정·질문일 때만.

| 등급 | 기준 | 파이프라인 |
|------|------|-----------|
| `trivial` | `~/.claude/**` 변경 ≤ 3줄, 또는 순수 질문 | 메인 직접 처리 |
| `simple` | 단일 파일 ≤ 30줄 | 구현 → verify |
| `standard` | 신규 기능·다중 파일 ≤ 5 | plan → 구현 → verify → codex |
| `major` | 파일 6+ · 아키텍처 변경 | standard + reviewer |

## codex 교차검증 에이전트

`~/.claude/agents/codex-cross-verify.md`로 정의했다. standard·major 작업의 verify 통과 후 `mcp__codex__codex`를 호출해서 외부 모델이 diff를 본다.

codex에 던지는 프롬프트 구조:

```
You are an external code reviewer. Read these files and verify:
- PLAN: <plan.md>
- DIFF: <diff.patch>
- VERIFIER: <verifier-report.md>

Cross-check:
1. Does the diff match the plan?
2. Are there bugs the verifier missed?
3. Any backward-compat or breaking changes?

Return: VERDICT (approve|request-changes) + bullet list.
```

산출물은 `current/codex-report.md`로 떨어진다. 다음 세션에서 이 파일이 없으면 Stop 훅이 차단한다.

## 결과

도구 사용 통계: Bash(23), TaskUpdate(21), TaskCreate(10), Write(9), Agent(6), Edit(5), Read(2), Skill(2)

생성된 파일 9개:

- `~/.claude/agents/codex-cross-verify.md`
- `~/.claude/hooks/orchestrator-gate.sh`
- `~/.claude/hooks/orchestrator-init.sh`
- `~/.claude/hooks/orchestrator-stop.sh`
- `~/.claude/workflow/AGENTS.md`
- `~/.claude/workflow/ORCHESTRATION.md`
- `~/.claude/workflow/lib/classify.sh`
- `~/.claude/workflow/lib/state.sh`
- `~/orchestrator-harness-research.html`

TaskUpdate가 21번인 건 리서치 에이전트 4개가 각각 진행 상황을 업데이트했기 때문이다. Write가 9번인 건 파일을 하나씩 만들었기 때문이다.

이제 `trivial` 이 아닌 작업은 훅이 강제한다. plan 없이 Edit 호출하면 deny. verify 없이 응답 끝내면 `exit 2`. codex 리포트 없으면 또 `exit 2`. 이론상 완벽한 파이프라인이고, 다음 세션부터 실전 테스트가 시작된다.
