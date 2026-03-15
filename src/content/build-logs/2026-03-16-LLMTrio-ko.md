---
title: "AI가 AI 오케스트레이터를 리뷰하다 — LLMTrio 개선 11세션, 버그 4개 수정"
project: "LLMTrio"
date: 2026-03-16
lang: ko
tags: [claude-code, llm, agent, code-review]
description: "LLMTrio는 여러 LLM을 오케스트레이션하는 CLI 도구다. Claude Code로 11세션, 76 tool calls를 써서 아키텍처를 분석하고 버그 4개를 수정했다. AI가 AI 에이전트를 고치는 작업의 기록."
---

LLMTrio는 아이러니한 프로젝트다. 여러 LLM 에이전트를 오케스트레이션하는 CLI 도구인데, 그 도구를 고치는 데 Claude Code를 썼다. AI가 AI 에이전트를 리뷰하고 디버깅한 셈이다.

**TL;DR** — 11세션, 76 tool calls로 LLMTrio의 아키텍처를 전수 점검하고 버그 4개를 수정했다. 그 과정에서 "아키텍트 프롬프트" 패턴이 Claude Code의 작업 품질을 올리는 데 효과적임을 확인했다.

## 아키텍트 프롬프트가 뭔가

이 작업의 모든 세션은 동일한 시스템 프롬프트로 시작했다.

```
You are a senior software architect designing a system.

Produce a clear technical plan (under 300 words):
Components, File Structure, Data Flow, Tech Stack.

No boilerplate. No "it depends." Make concrete decisions.
```

요점은 두 가지다. "구체적인 결정을 내려라"와 "300자 이내로". 이 제약이 Claude의 답변을 바꾼다. 제약이 없으면 Claude는 "이 방법도 있고, 저 방법도 있습니다"로 흐른다. 제약을 주면 "이렇게 한다"로 변한다.

같은 요청이라도 결과가 다르다. `hello world function in Python`을 던지면, 제약 없는 Claude는 여러 접근을 나열한다. 아키텍트 프롬프트를 준 Claude는 `hello.py` 하나에 함수와 main guard를 넣는 구조를 바로 결정한다. 단순한 예지만 패턴은 복잡한 요청에서도 동일하게 작동했다.

## `octopus-core.js` 전수 분석

세션 8이 핵심이었다. 18 tool calls. `Read` 13번, `Glob` 2번, `Bash` 1번, `Write` 1번, `Edit` 1번.

LLMTrio의 아키텍처를 파악하는 데만 Read를 13번 썼다. `octopus-core.js`는 2-phase 워크플로우 엔진으로, 태스크를 분해하고 에이전트를 spawn하고 상태를 관리한다. `dashboard-server.js`는 실시간 진행 상황을 브라우저에 보여주는 로컬 서버다. CLI는 `bin/llmtrio.js`에서 명령어를 파싱하고 라우팅한다.

파악하고 나서 `CLAUDE.md`와 `config/default-budget.json`을 업데이트했다. `default-budget.json`에 `workflow` 설정과 `timeout_seconds`가 README에는 문서화됐는데 실제 파일에는 없었다. 문서와 코드 사이의 괴리. 이런 건 사람이 직접 찾기 귀찮은 버그다.

## 코드 리뷰에서 나온 7개 이슈

세션 9에서 리뷰어 프롬프트로 전환했다.

```
You are a code reviewer examining the implementation.

Review format:
1. Critical Issues — Bugs that will cause failures
2. Security — Vulnerabilities
3. Performance — Bottlenecks
4. Improvements — Better patterns

For each issue: describe the problem, show the problematic code, suggest the fix.
Max 7 issues. Be specific, not generic.
```

"Max 7 issues. Be specific, not generic." 이 제약이 중요하다. 없으면 Claude는 10~15개를 나열하는데, 절반은 "변수명을 더 명확하게" 같은 의견이다. 7개로 제한하면 진짜 문제만 남는다.

결과로 나온 7개 중 Critical이 2개였다. `dashboard-server.js:944`에서 timeout이 0이면 60초로 변환되는 버그, `dashboard-server.js:84`에서 JSON 파싱 retry가 busy-wait로 이벤트 루프를 300ms 블로킹하는 버그. `octopus-core.js`는 이미 같은 문제를 고쳤는데 `dashboard-server.js`는 빠져 있었다.

## 테스트 16/16 통과 후 버그 수정

세션 10에서 먼저 테스트를 돌렸다. 16개 전부 통과. 통과한다고 버그가 없는 건 아니다. 실제로 세션 11에서 4개를 더 찾아 수정했다.

수정 내용을 구체적으로 보면, `octopus-core.js:9`에서 `TRIO_DIR` 환경변수를 완전히 무시하고 있었다. `process.env.TRIO_DIR ||` 하나 빠진 거다. `octopus-core.js:36`에서는 scaffold 태스크가 `implementation` type으로 실행됐다. `scaffold`로 바꿔야 했다. `dashboard-server.js`에서는 `parseInt`가 `NaN`을 반환할 때 `??` 연산자가 `NaN`을 통과시키는 문제, 그리고 POST body 크기 제한이 없는 보안 이슈가 있었다.

세션 11은 29 tool calls. `Edit` 15번, `Read` 11번, `Bash` 2번, `Grep` 1번. 전체 76 tool calls 중 38%가 이 세션 하나에서 나왔다.

## Claude Code 통계

```
총 세션: 11
총 tool calls: 76
  Read:  39 (51%)
  Edit:  16 (21%)
  Bash:  14 (18%)
  Glob:   3 (4%)
  Write:  2 (3%)
  Agent:  1 (1%)
  Grep:   1 (1%)

수정 파일: 5개
생성 파일: 2개
```

Read가 51%라는 게 의미 있다. Claude Code는 수정하기 전에 읽는다. 많이. 이게 맞는 작업 방식이다. 코드를 모르는 상태에서 수정하면 부작용이 생긴다.

아키텍트 → 리뷰어 → 구현 순서로 세션을 나눈 것도 효과적이었다. 한 세션에서 전부 하면 컨텍스트가 섞인다. 역할을 분리하면 각 단계의 품질이 올라간다. LLMTrio가 구현하려는 워크플로우와 동일한 원리다.

> AI 오케스트레이터를 만드는 가장 빠른 방법은, AI 오케스트레이터처럼 작업하는 것이다.
