---
title: "훅 3개로 오케스트레이터를 강제하다 — Claude Code 하네스 엔지니어링 79 tool calls"
project: "portfolio-site"
date: 2026-05-02
lang: ko
tags: [claude-code, orchestrator, harness, hooks, multi-agent, codex]
description: "PreToolUse·Stop 훅 3개로 메인이 코드를 직접 못 짜게 강제하는 오케스트레이터 하네스를 구축했다. plan→implement→verify→codex 교차검증 파이프라인을 파일로 영속화하고, 단계 빠뜨리면 Stop 훅이 차단한다. 79 tool calls, 6h 44min."
---

79 tool calls, 6시간 44분. 이번 세션에서 코드를 한 줄도 직접 안 짰다. 정확히는, 짜지 못하도록 시스템이 막는 구조를 만들었다.

**TL;DR** PreToolUse·Stop 훅 3개로 메인 오케스트레이터가 코드를 직접 쓰지 못하게 강제하고, plan → implement → verify → codex 교차검증까지 파이프라인 전체를 `~/.claude/workflow/current/`에 파일로 영속화했다.

## "하네스 엔지니어링 되어 있지?"라는 질문부터

세션 시작 프롬프트:

> "codex cli mcp 로 연결해서 너 작업의 마지막 단계에서 교차 검증하는거 적용해줘. 지금 하네스 엔지니어링 되어 있지?"

확인해보니 부분만 돼 있었다. contextzip 토큰 절감 훅, protect-files, commit-cleanliness — 파일 보호와 커밋 위생은 있었지만 오케스트레이터 구조는 없었다. 메인이 계획도 짜고, 코드도 짜고, 리뷰도 직접 하는 구조.

다음 프롬프트:

> "아주 간단한 작업 제외하고 모든 건 강제해줘 훅으로 모든 과정을. claude.md 에 오케스트레이터 / agent에 각각에 대한 정의랑 컨텍스트 / 파일 기반으로 돌아가게 해줘 workflow에 기억에 놓고 쓰는거"

이게 세션의 핵심 요구였다.

## 리서치 먼저 — 4개 에이전트 병렬

설계 전에 레퍼런스가 필요했다. 어떤 구조가 공신력 있게 검증됐는지 모르는 상태에서 만들면 안 된다. 4개 도메인을 나눠 병렬로 던졌다.

- Multi-agent orchestration frameworks (AutoGen, LangGraph, CrewAI)
- Hermes agent 프레임워크 검증
- Claude Code hooks + 하네스 공식 문서
- 에이전트 강제·게이팅 패턴

`NousResearch/hermes-agent`(127k⭐)는 실존했다. 도구 호출을 함수 형식으로 구조화하는 파인튜닝 모델 계열이라 직접 가져올 건 없었다. 핵심 레퍼런스는 Claude Code의 `PreToolUse`·`Stop` 훅과 LangGraph의 state machine 패턴이었다.

`Agent(6)` — 이 세션에서 에이전트 호출이 6회로 낮은 건 리서치 에이전트 4개가 백그라운드로 돌았기 때문이다. 나머지 73개 call은 Bash(23)·TaskUpdate(21)·TaskCreate(10)·Write(9)로 설계와 구현이다.

## 파일 기반 상태머신 — 왜 파일인가

컴팩션이 문제다. 세션이 길어지거나 컨텍스트가 압축되면 Claude가 이전 단계를 기억하지 못한다. 메모리로 관리하면 컴팩션 후 파이프라인 상태가 소실된다.

해법은 파일이다:

```
~/.claude/workflow/
├── ORCHESTRATION.md     워크플로우 정의서
├── AGENTS.md            에이전트 카탈로그
├── current/
│   ├── state.json       task_id, complexity, stage, completed_stages
│   ├── plan.md          plan-orchestrator 산출물
│   ├── diff.patch       구현 결과 (git diff)
│   ├── verifier-report.md
│   └── codex-report.md
└── log/
    └── YYYYMMDD-HHMMSS/ 완료 작업 아카이브
```

`state.json`이 현재 작업의 stage를 안다. 컴팩션 후에도 `SessionStart` 훅이 이걸 읽어서 메인에 복원한다. `PreCompact` 훅은 압축 직전에 `state.json`을 stderr로 출력해 다음 컨텍스트에 살아남게 한다.

## 훅 3개로 강제하는 파이프라인

강제 메커니즘의 핵심은 세 개 훅이다.

**`orchestrator-init.sh` (UserPromptSubmit)** — 매 사용자 요청마다 분류·라우팅 룰을 컨텍스트에 재주입한다. 컴팩션 후에도 메인이 룰을 잊지 않는다.

**`orchestrator-gate.sh` (PreToolUse: Edit|Write|MultiEdit)** — `state.complexity != "trivial"` AND `stage != "implementing"`이면 파일 수정을 거부한다. 계획 없이 코드를 못 짜게 차단하는 핵심 훅이다.

**`orchestrator-stop.sh` (Stop)** — diff가 있는데 `verifier-report.md`나 `codex-report.md`가 없으면 응답 종료를 막는다. 검증 없이 작업을 끝낼 수 없다.

결과적으로 complexity가 `trivial`이 아닌 작업은 반드시 이 순서를 거친다:

```
1. plan-orchestrator → current/plan.md 생성
2. (orchestrator-gate 통과) 구현 에이전트 → current/diff.patch
3. code-verifier → current/verifier-report.md
4. codex-cross-verify → current/codex-report.md
5. (orchestrator-stop 통과) 사용자 보고
```

## complexity 분류 — "거의 다 standard"

분류 테이블을 만들면서 임계치를 보수적으로 잡았다.

| 등급 | 기준 | 파이프라인 |
|------|------|-----------|
| `trivial` | `~/.claude/**` 변경 ≤ 3줄, 또는 순수 질문 | 메인 직접 처리 |
| `simple` | 단일 파일 ≤ 30줄, 명확한 spec | 구현 → verify |
| `standard` | 신규 기능·UI·다중 파일 ≤ 5 | plan → 구현 → verify → codex |
| `major` | 6+ 파일·아키텍처·새 의존성 | standard + code-reviewer |

> "거의 모든 코딩 작업은 standard 이상으로 분류한다. trivial은 진짜 트리비얼한 메모리·설정·질문일 때만."

이 원칙이 없으면 "간단한 것 같으니까 바로 짜도 되겠지"라는 판단이 들어온다. 훅이 작동하려면 분류 기준이 엄격해야 한다.

## Codex MCP 교차검증 — 외부 모델이 마지막에 본다

standard·major는 마지막 단계에서 codex MCP를 통해 외부 모델이 검증한다. `~/.claude/agents/codex-cross-verify.md`가 이 로직을 래핑한다.

```
You are an external code reviewer. Read these files and verify:
- PLAN: <plan.md 내용>
- DIFF: <diff.patch 내용>
- VERIFIER: <verifier-report.md 내용>

Cross-check:
1. Does the diff match the plan?
2. Are there bugs the verifier missed?
3. Any backward-compat or breaking changes?

Return: VERDICT (approve|request-changes) + bullet list of findings.
```

동일 컨텍스트에서 검토하면 같은 blind spot을 공유한다. 외부 모델이 보면 다른 관점의 지적이 나온다.

## 세션 통계

| 도구 | 횟수 |
|------|------|
| Bash | 23 |
| TaskUpdate | 21 |
| TaskCreate | 10 |
| Write | 9 |
| Agent | 6 |
| Edit | 5 |
| Read | 2 |
| Skill | 2 |
| **합계** | **79** |

생성 파일 9개, 수정 파일 3개. `Write(9)`가 많은 건 새 파일을 만들어서다. `TaskUpdate(21)`·`TaskCreate(10)`은 파이프라인 각 단계를 태스크로 관리한 결과다.

## 훅이 강제하지 않으면 지켜지지 않는다

메인 Claude가 직접 코드를 짜면 두 가지 문제가 생긴다.

첫째, 컨텍스트 오염. 구현 세부사항이 메인 컨텍스트에 쌓이면 이후 판단에 영향을 준다. 서브에이전트는 fresh context로 시작해서 노이즈가 없다.

둘째, 강제 불가. "계획 먼저"는 좋은 원칙이지만 Claude가 스스로 지키기 어렵다. 훅으로 물리적으로 막아야 지켜진다. `orchestrator-gate.sh`가 없으면 "이건 간단하니까"라는 자기 설득이 들어온다.

> 훅은 의지 대신 구조로 워크플로를 강제하는 장치다.
