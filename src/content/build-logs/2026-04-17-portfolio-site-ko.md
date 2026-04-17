---
title: "Opus 4.7 출시 당일 속보 발행부터 contextzip v0.2 배포까지: 15세션 하루 기록"
project: "portfolio-site"
date: 2026-04-17
lang: ko
tags: [claude-code, contextzip, agents, harness, opus-4-7, auto-publish]
description: "Opus 4.7이 나온 날 232페이지 시스템 카드를 분석하고, contextzip v0.2를 5플랫폼 배포하고, 에이전트 하네스 6종을 구축했다. 15세션, 1,000+ tool calls 하루 작업 기록."
---

2026-04-17, Anthropic이 Opus 4.7을 출시했다. 오전에 시스템 카드 232페이지를 Claude에 넘겼고, 오후에는 DEV.to 글이 올라갔다. 저녁엔 contextzip v0.2.0이 GitHub Releases에 5개 플랫폼 바이너리로 올라갔다. 하루에 15개 세션을 열었고 tool calls는 1,000개를 넘었다.

**TL;DR** Opus 4.7 분석 → 속보 발행 → contextzip v0.2 출시 → 에이전트 하네스 6종 구축. 전부 당일 완료.

## Opus 4.7 출시 당일: 232페이지를 1시간 안에 소화하는 법

오전에 Anthropic이 공식 시스템 카드 PDF를 올렸다. 모델 ID `claude-opus-4-7`, $5/$25 per MTok, 1M 컨텍스트, 128k max output. 가장 큰 breaking change는 **adaptive thinking**이었다 — 기존 `budget_tokens` 파라미터 단독 사용이 불가해지고 `type: "enabled"` + `budget_tokens` 조합으로 바뀌었다.

첫 세션: `Read` 3번, `Bash` 2번. Claude에게 PDF URL을 던지고 핵심 섹션만 발췌하도록 했다.

```
https://cdn.sanity.io/files/...pdf 분석해줘
```

232페이지를 한 번에 읽을 수는 없다. 페이지 범위를 나눠서 `Read`를 여러 번 호출하는 방식으로 포지셔닝 → 벤치마크 → alignment 섹션 순서로 파악했다. 세션 시간 4분, 도구 호출 6번.

이어진 세션에서 글을 썼다. `auto-publish` 스킬로 **Opus 4.7이 `budget_tokens`를 바꾼 마이그레이션 가이드**와 **OpenAI duct-tape(GPT-Image 2 루머) 분석** 두 편을 동시에 작성해서 spoonai.me + DEV.to + Hashnode에 발행했다. 도구 사용: Bash 74번, Read 14번, Edit 8번. 세션 시간 1시간 1분.

모델 출시부터 DEV.to 게시 확인까지 걸린 총 시간: 약 3시간. 속보 발행의 병목은 프롬프트가 아니라 소재 수집이었다. The Information 단독 리크 확인 → 공식 출시 확인 → 시스템 카드 분석까지, `WebFetch` + `WebSearch` 조합을 썼지만 팩트 검증에만 전체 시간의 절반 이상이 들었다.

## contextzip v0.2: 서브에이전트로 검증하고 배포로 끝냈다

contextzip은 Claude Code의 tool output을 압축해서 토큰을 60~90% 절약하는 Rust CLI다. v0.1.1이 마지막 릴리스였고 그 이후 30+ 커밋이 쌓여 있었다.

고도화 세션(세션 7)은 **395 tool calls**를 기록했다 — Bash 85번, Edit 70번, Read 40번. 핵심 작업 중 하나는 컨텍스트 풋프린트 실측 분석이었다. Claude 응답에서 어떤 부분이 토큰을 가장 많이 잡아먹는지 10개 세션, 6,850개 응답을 분석했다:

```
Tool use (inputs)  : 46.4%  ← Edit old/new_string, Write 등
Tool results       : 39.4%  ← 명령 출력, 파일 내용
User text          : 10.1%
Assistant text     :  4.1%  ← Claude narration 등
```

Claude 자신의 응답(narration, apology 등)은 **4.1%**에 불과했다. 압축 레버는 tool input/output이었다. `Agent` 도구가 평균 2.9KB/input으로 가장 무거웠고, `Write`는 평균 5.3KB/input이었다.

새 기능(세션 히스토리 압축, TOML 필터 확장, context-history 레이어, DSL 확장)은 각각 별도 서브에이전트에 검증을 맡겼다. 에이전트 4명이 병렬로 punch-list 검증 → 결과를 모아서 수정 반영. 구현자가 놓친 edge case를 독립적 시각에서 잡아내는 방식이다.

배포(세션 9)는 Bash 33번, Glob 8번, Read 4번, Edit 1번으로 끝났다. `Cargo.toml` 버전 0.1.0 → 0.2.0 bump, 커밋, 태그 push. GitHub Actions가 5개 플랫폼(linux-x86_64, linux-musl, macos-arm64, macos-x86_64, windows-x86_64) 바이너리를 자동 빌드해서 릴리스에 올렸다.

## 에이전트 하네스 구축: 6종 완성

세션 5에서 harness 설계 원리를 4명 서브에이전트로 병렬 리서치했다. 결론은 단순했다: **하네스의 첫 번째 원칙은 최소주의**. "관찰된 실패 이후에만 추가"가 Anthropic 공식 권고다. 현재 `~/.claude/`는 CLAUDE.md 82줄 + MEMORY 92KB + 스킬 20+개로 이미 무거운 상태였다.

세션 8에서 에이전트 4종을 추가로 만들었다:

| 에이전트 | 모델 | 역할 |
|---|---|---|
| `blog-writer` | sonnet | 3플랫폼 드래프트(spoonai·naver-dental·devto) |
| `design-reviewer` | sonnet | UI 5축 점수, 읽기 전용 |
| `frontend-implementer` | sonnet | TS + Next + Tailwind 구현 |
| `content-editor` | sonnet | AI 클리셰 제거, 교열 |

기존 `plan-orchestrator`, `code-verifier`까지 총 6종. `sticky-rules.md`에 체인 규약도 반영했다 — 구현 완료 후 `code-verifier` → `design-reviewer` → `content-editor` 순서로 검증하는 흐름.

에이전트 파일 하나는 400줄짜리 instruction이 아니다. 기존 포맷을 보면 역할, 모델, 핵심 제약 3~5개가 전부다. 짧을수록 컴팩션 이후에도 일관되게 동작한다.

## spoonai 디자인: 목업 10개 병렬 생성

spoonai.me 디자인 리팩토링(세션 10, 395 tool calls)에서 에이전트 병렬 디스패치를 실전에 썼다. bento grid, masonry, neo-brutalism, swiss tabular, japanese kinfolk, netflix cinema, Y2K chrome, dashboard ticker 등 10개 디자인을 에이전트 10명이 동시에 HTML 파일로 생성했다.

각 에이전트가 독립 실행되니 10개가 거의 동시에 완성됐다. masonry(2번) 채택, 나머지 9개는 버렸다.

"다 별로야"라는 피드백이 두 번 나왔다. 첫 번째는 목업 자체가 AI 클리셰 덩어리였고, 두 번째는 실제 구현에서 `top 뉴스` 배지가 모든 카드에 붙는 버그였다. 두 번 다 원인을 찾는 데 시간이 걸렸다 — 코드만 보면 레이아웃 버그 찾기가 어렵다. Bash로 서버 띄우고 직접 확인하는 단계를 생략하면 안 된다.

## 오늘 배운 것

병렬 서브에이전트는 **탐색 단계**에서 가장 효과적이다. 디자인 10개, 리서치 4개, 검증 4개 — 결과물이 서로 독립적일 때 병렬 디스패치가 시간을 압도적으로 줄인다. 반면 순서가 있는 작업(구현 → 검증 → 배포)은 순차가 맞다.

툴 사용 수는 복잡도의 proxy가 아니다. 세션 10이 395 tool calls를 찍었지만 대부분 Edit과 Bash 반복이었다. 반면 세션 3(147 calls)은 실제로 3개 레포에 글을 발행했다. 중요한 건 tool call 수가 아니라 어떤 결과가 나왔냐다.

속보 파이프라인에서 검증 단계는 생략할 수 없다. Opus 4.7 글을 쓸 때 "방금 나왔어"라는 프롬프트 하나로 시작했지만, 팩트 확인 없이 발행하면 틀린 정보가 올라간다. The Information 리크 → 공식 출시 페이지 확인 → 시스템 카드 분석까지 순서가 있었다.
