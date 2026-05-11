---
title: "Bash 훅 차단 한 줄로 Read 8개가 날아간 날 — 오케스트레이션이 스스로를 막은 12 tool calls"
project: "portfolio-site"
date: 2026-05-11
lang: ko
tags: [claude-code, hooks, orchestration, debugging, dentalad]
description: "state.sh Bash 호출 한 줄이 같은 응답에 묶인 Read 4개를 연달아 취소시켰다. 재시도도 동일 패턴으로 막혔다. 12 tool calls, 수정 파일 0개. PreToolUse 훅이 trivial 작업을 통째로 차단한 과정."
---

`source ~/.claude/workflows/.../lib/state.sh` 한 줄이 세션 전체를 멈췄다. 의료/치과 광고 리서치 파일 4개를 읽고 15줄 요약을 내는 작업이었다. 코드 변경도 없고 배포도 없다. 그런데 12 tool calls 끝에 수정 파일은 0개, 결과물도 0개였다.

**TL;DR** `trivial` 수준의 읽기 작업인데 오케스트레이션 workflow context가 주입되면서 state 업데이트 Bash가 딸려 들어갔다. PreToolUse 훅이 Bash를 차단하자 같은 응답에 병렬로 묶인 Read 4개가 연쇄 취소됐다. 재시도도 같은 구조, 같은 결과였다.

## 작업 목표: SERP 요약 읽고 15줄 제안

2026-05-11 의료·치과 광고 일일 리서치 루틴이었다. 사용자 프롬프트는 이렇게 시작했다:

> "오늘 2026-05-11 의료/치과 광고 데일리 리서치 산출물을 작성하려고 한다. 아래 파일들을 읽고, 기존 지식베이스에 추가할 핵심 변경점/유지할 가설/HTML 보고서 생성 필요 여부를 한국어로 15줄 이내로 제안해줘."

읽어야 할 파일은 네 개였다.

- `sources/serp-2026-05-11/summary.json`
- `2026-05-10-daily-update.md`
- `rolling-knowledge-base.md`
- `source-index.md`

코드를 건드리지 않는다. 파일을 읽고 요약을 반환하면 된다. 모델은 `claude-opus-4-7`이었다.

## 첫 응답에서 무슨 일이 일어났나

오케스트레이션 시스템은 새 요청을 받을 때 `state.json`의 stage를 `implementing`으로 업데이트한다. 이 업데이트가 Bash 호출로 들어간다. `source lib/state.sh && state_set stage implementing` 형태다.

문제는 이 Bash와 Read 4개가 같은 응답에 병렬로 묶였다는 점이다. PreToolUse 훅이 Bash를 차단하자, Claude Code의 동작 방식상 같은 응답 내 병렬 도구 호출 중 하나가 실패하면 나머지도 취소될 수 있다. Read 4개가 Bash 차단의 부수 피해로 함께 날아갔다.

두 번째 프롬프트("Continue from where you left off")로 재시도했다. 동일한 구조, 동일한 결과였다.

세 번째 프롬프트에서 전략을 바꿨다: "이전 요청의 결과만 15줄 이내로 출력해줘. 더 이상 파일을 읽지 말고 지금까지 읽은 내용으로 요약." 파일을 한 번도 읽지 못했으니 요약할 내용이 없었다.

## 도구 사용 통계

| 도구 | 횟수 | 결과 |
|---|---|---|
| Read | 8 | 전부 취소 |
| Bash | 4 | 전부 차단 또는 취소 |
| Edit / Write | 0 | — |

총 12 tool calls. 유효한 산출물: 없음. 세션 소요 시간: 0분(기록 없음).

## 왜 Bash와 Read가 같은 응답에 묶였나

오케스트레이션 훅은 `UserPromptSubmit`에서 complexity를 분류하고 workflow context를 주입한다. 이 케이스는 `simple`로 분류됐다. `simple` 등급이라도 workflow context가 주입되면 모델이 state 업데이트 코드를 첫 응답에 포함시킨다. 이건 자연스러운 흐름처럼 보인다 — 단계를 추적하려면 상태를 업데이트해야 하니까.

문제는 순차 의존성이 있는 호출을 병렬로 묶은 것이다. Bash(state 업데이트)는 Read보다 먼저 완료될 필요가 없다. 오히려 Bash 실패 여부와 무관하게 Read는 독립적으로 실행 가능하다. 그러나 같은 응답에 묶이면 하나가 막혔을 때 나머지도 막힌다.

더 근본적인 문제는 분류다. 코드 변경 없는 파일 읽기 + 요약은 `trivial`이다. `trivial`이면 state 업데이트 코드가 붙지 않아야 한다. 오케스트레이션 라우팅이 읽기 전용 작업을 `simple`로 올려 보냈다.

## 재발하지 않으려면

방법은 두 가지다.

첫째, 분류를 정확히 한다. 코드 변경이 없는 읽기·분석 요청은 `trivial`로 내려야 한다. `trivial`은 state 업데이트가 붙지 않는 경로다. 파일 수정 여부가 complexity 분류의 1차 기준이어야 한다.

둘째, Bash와 Read를 같은 응답에 묶지 않는다. state 헬퍼를 먼저 실행하고 성공 확인 후 Read를 보낸다. 병렬로 묶어야 할 이유가 없는 호출은 순차로 보내는 게 안전하다.

## 실패한 세션도 빌드 로그가 된다

결과물이 없어도 기록한다. 성공한 세션보다 실패한 세션이 더 많은 것을 알려준다.

오케스트레이션 시스템이 자기 자신을 막을 수 있다는 것, Bash 하나가 Read 여러 개를 연쇄 취소시킬 수 있다는 것, `trivial` 분류가 정확하지 않으면 단순 읽기 작업도 완전히 실패한다는 것 — 이 케이스들은 코드를 읽어서는 알 수 없다. 실제로 막혀봐야 보인다.

> Bash 차단이 Read 취소의 원인이 된다는 사실은 세션 기록 없이는 추적하기 어렵다. trivial 분류가 틀렸다는 진단도 마찬가지다.
