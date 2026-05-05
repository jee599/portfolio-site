---
title: "Claude Code 하네스 대청소 — 이중 오케스트레이터 충돌 발견, 193MB 정리, 4개 에이전트 병렬 리서치"
project: "portfolio-site"
date: 2026-05-06
lang: ko
tags: [claude-code, workflow, harness, automation, research]
description: "8개 세션, 209 tool calls. 이중 오케스트레이터 충돌을 발견하고, ~/.claude에서 193MB를 정리하고, 한국 AI 강의 시장을 4개 에이전트로 병렬 조사했다."
---

8개 세션, 209 tool calls. 코드를 많이 짠 기간은 아니었다. 대신 Claude Code 하네스 자체를 뜯어보고, 분석하고, 정리했다.

**TL;DR** 이중 오케스트레이터가 동일한 파이프라인을 두 번 돌리고 있었다. 193MB 불필요 플러그인을 삭제했다. 한국 AI 강의 시장은 4개 에이전트를 병렬로 돌려 한 세션 만에 조사했다.

## 발견: 두 오케스트레이터가 같은 일을 하고 있었다

`dentalad` 워크플로우 분석 요청이 들어왔다. "Claude Code + Codex + Oh My Codex 조합이 과도하게 설계됐나?"

파일을 읽다 보니 문제가 명확했다. `workflow/ORCHESTRATION.md`와 OMX `team_pipeline`이 **동일한 흐름**을 각자 강제하고 있었다.

```
Claude 워크플로: plan → implement → verify → cross-verify
OMX 파이프라인: plan → implement → verify → cross-verify
```

한 작업이 두 파이프라인에 동시에 걸리면 단계가 중복된다. 산출물 경로도 갈린다 — `current/`와 `.omx/state|plans|logs/`가 분리돼 있어서 어느 쪽이 최신인지 알 수 없다.

더 큰 문제는 분류 기준이 너무 보수적이라는 것이었다. 순수 질문이나 분석 작업조차 `standard`로 올라가는 바람에 plan-orchestrator가 불필요하게 실행됐다. `trivial` 판단이 과소하면 작은 질문 하나에 에이전트 3개가 붙는 구조가 된다.

해결 방향은 `Lightweight First` 원칙을 명시적으로 세우는 것이었다. 코드 변경 없는 분석은 `trivial`, 단일 파일 수정은 `simple`. 의심스러울 때 위로 올리는 게 아니라 실제 변경 범위로 판단한다.

## 193MB 정리

`harness-audit` 스킬을 돌렸다. 결과가 인상적이었다.

`~/.claude/` 전체 215MB 중 **199MB가 `plugins/`** 였다. 플러그인 디렉토리 하나가 전체의 93%를 차지하고 있었다.

삭제 대상은 3가지였다. `claude-mem` — 레지스트리에는 없는데 디스크에 남아 있던 고아 디렉토리(100MB). `claude-code-skills` 마켓플레이스 — 비활성(25MB). `plugins/cache/` — 전부 캐시(65MB). 루트에 흩어져 있던 `.bak`, `.pre-diet` 같은 백업 파일들도 함께 정리했다.

```
plugins/ 정리 전: 198MB
plugins/ 정리 후:   4.6MB
총 회수:           ~193MB
```

Bash를 88번 썼다. 대부분 `rm`, `du`, `ls`였다. 뭘 지워도 되는지 확인하는 과정이 대부분의 시간을 차지했다. `spoonai-daily-briefing`은 건드리지 않았다. 매일 오전 8시 크론으로 돌아가는 자동화 스킬이다.

## 한국 AI 강의 시장을 한 세션에 조사하기

"한국에서 AI/바이브코딩/LLM 강의하는 플랫폼과 강사 루트 알려줘"

이 정도 범위는 직접 조사하면 하루가 걸린다. 4개 에이전트로 병렬 분해했다.

- Agent 1: B2C 강의 플랫폼 (인프런, 패스트캠퍼스, 콜로소, 클래스101, 코드잇, 러닝스푼즈)
- Agent 2: 기업 교육·정부 공공 (멀티캠퍼스, 휴넷, KT AICE, K-디지털 트레이닝, NIPA)
- Agent 3: 부트캠프·커뮤니티 (코드스테이츠, 스파르타, 멋사, 그로우앤베터)
- Agent 4: 1인 크리에이터 루트 + ROI 분석

완료 후 합성해서 `~/.claude/plans/research-korea-ai-teaching-routes-20260504.md`로 저장했다. 소스 URL 30개 이상.

결론은 명확했다.

> 인프런 강의 1개 + 인프런 멘토링 + 자체 LMS 미니강의 = 트리플 시작.

인프런이 한국에서 "Claude Code·바이브코딩" 키워드 트래픽을 사실상 독점한다. 짐코딩 단일 강의가 ₩198,000 × 6,236명에 도달한 시장이다. 진입 장벽은 낮고, 강의 하나가 지렛대가 된다.

이 조사 자체는 37 tool calls, 세션 시간 2시간 정도였다.

## 랩탑 이전 문제

"노트북에 같은 하네스를 딸깍으로 세팅하려면?"

옵션 3가지를 마찰 순으로 정리했다.

1. `tar -czf` 스냅샷 + `setup-laptop.sh` — 5분, 일회성, 가장 빠름
2. Git 레포화 + `chezmoi` 또는 `stow` — 버전 관리 가능, 초기 세팅 30분
3. Ansible playbook — 새 맥 전체 세팅 자동화, 고오버헤드

지금 당장 노트북이 필요하면 옵션 1이다. `--exclude='.claude/plugins' --exclude='.claude/sessions'` 플래그로 캐시와 세션 로그를 빼고 압축하면 2MB 이하로 나온다.

`~/claude-harness-bundle/setup-laptop.sh`를 만들어서 압축까지 뽑았다. 실행하면 `~/.claude/`에 skills, agents, hooks, settings가 바로 들어간다.

## 이 기간의 패턴

8개 세션 통계:

| 도구 | 횟수 |
|---|---|
| Bash | 146 |
| Read | 20 |
| Agent | 15 |
| Write | 12 |

Bash가 압도적으로 많다. 이번엔 코드 작성보다 탐색·확인·삭제 작업이 많았기 때문이다. `ls`, `cat`, `rm`, `du` 같은 명령이 대부분이었다.

Agent가 15번이다. 병렬 리서치에서 4개, 하네스 감사에서 1개, ContextZip 조사에서 3개. 리서치 범위가 넓거나 독립적인 도메인이 2개 이상이면 에이전트 분리가 시간을 확실히 아껴준다.

수정 파일 1개, 생성 파일 10개. 코드를 거의 안 건드렸지만 하네스 구조가 훨씬 가벼워졌다. 193MB가 사라졌고, 이중 파이프라인이 정리됐다.

> 인프라를 안 건드리는 것도 작업이다. 그걸 Claude Code로 하는 것도.
