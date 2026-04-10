---
title: "Claude Haiku 839 세션 오케스트레이션: 0 tool call 파이프라인이 가능한 이유"
project: "portfolio-site"
date: 2026-04-11
lang: ko
tags: [claude-code, claude-haiku, automation, prompting, cost-optimization, pipeline]
description: "839 세션, tool call 0회. Claude Haiku를 프로그래매틱 API로 직접 호출해 대규모 콘텐츠를 생성하는 워크플로우와 Claude Code 오케스트레이션 전략을 기록한다."
---

오늘 Claude Code 세션 기록에 839개가 쌓였다. tool call은 0회다. 이게 어떻게 가능한지, 그리고 왜 이 방식이 맞는지를 정리한다.

**TL;DR** — Claude Code 인터랙티브 세션이 아니라 Haiku API를 직접 호출하는 스크립트를 돌렸다. 오케스트레이션 레이어와 실행 레이어를 분리하면 Claude Code는 설계·감독만 하고 비용은 Haiku로 최소화할 수 있다.

## Claude Code가 직접 쓰지 않은 839 세션

세션 기록을 보면 낯선 패턴이 있다. 모델은 `claude-haiku-4-5-20251001`이고, 사용자 프롬프트는 `Generate a 3-paragraph compatibility description for rat and ox...`처럼 구조화된 콘텐츠 요청이다. Edit도 Bash도 없다. Read도 없다. tool call이 아예 0이다.

이건 Claude Code의 인터랙티브 세션이 아니다. 스크립트가 Anthropic API를 직접 호출한 것이고, Claude Code는 그 스크립트를 설계하고 실행시킨 역할만 했다.

패턴을 구분하면 이렇다:

- **Claude Code 인터랙티브**: 파일 수정, 코드 리뷰, 설계 결정 → Sonnet/Opus가 적합
- **프로그래매틱 API**: 반복 가능한 구조화 태스크 → Haiku가 적합

## 왜 레이어를 나누는가

처음에는 Claude Code 안에서 직접 콘텐츠를 생성하려 했다. 몇 가지 문제가 생겼다.

첫째, 비용이다. Sonnet으로 1,152개 콘텐츠를 생성하면 Haiku 대비 10배 이상 비싸다. 구조화된 반복 태스크에서 창의성은 필요 없다. 일관성만 필요하다.

둘째, 컨텍스트 관리다. Claude Code 세션 하나에서 수백 개의 콘텐츠를 뽑으면 컨텍스트가 오염된다. 스크립트가 Haiku를 직접 호출하면 각 요청이 완전히 독립적인 세션이다.

셋째, 병렬화다. 스크립트는 조합을 순회하면서 언어별로 API를 호출한다. Claude Code 인터랙티브 세션으로는 이 수준의 병렬도를 만들기 어렵다.

## 오케스트레이션 패턴

내가 실제로 쓴 구조는 이렇다:

```
Claude Code (Sonnet) → 스크립트 설계/디버깅
         ↓
Python 스크립트 → Haiku API 직접 호출
         ↓
결과 → DB 저장
```

Claude Code가 한 일:
- 프롬프트 템플릿 설계
- JSON 스키마 정의
- 파이프라인 스크립트 작성
- 첫 번째 API key 에러 디버깅

이후 839 세션은 스크립트가 혼자 돌렸다. Claude Code는 감독자 역할만 했다.

## 세션 1의 에러와 진단

세션 1이 `<synthetic>` 모델로 찍히면서 `Invalid API key` 에러가 났다. Haiku가 아니라 synthetic 모델이 떴다는 건 API key 자체가 인식되지 않은 것이다.

배포 환경에서 `ANTHROPIC_API_KEY` 환경변수가 로드되지 않았다. `.env` 파일은 로컬에만 있었다. 배포 설정에 직접 등록하고 세션 2부터 정상 동작했다.

에러가 세션 1에서만 났다는 게 중요하다. 파이프라인이 fail-fast로 설계되어 있어서 첫 호출에서 문제를 잡았다. 나머지 838 세션은 무중단이었다.

## Haiku에게 일관성을 강제하는 법

Haiku는 soft instruction을 자주 무시한다. "자연스럽게", "다양하게" 같은 표현은 효과가 없다. 대신 출력 형식을 프롬프트 레벨에서 강제했다.

프롬프트 끝에 이 한 줄:

```
Respond ONLY with valid JSON, no markdown fences:
```

그리고 예상 스키마를 인라인으로 명시:

```
{"description":["p1","p2","p3"],"faq":[{"q":"...","a":"..."},...]}
```

마크다운 펜스(` ```json `)가 섞이면 파싱이 깨진다. 프롬프트에서 원천 차단했다. 이후 파싱 에러 0회.

문단 역할도 구체적으로 명시했다:

```
Paragraph 1: Overall compatibility summary (2-3 sentences).
             Start with the core answer: reference the specific score and relationship.
```

`reference the specific score`라는 지시가 없으면 Haiku가 점수(60/100)를 언급하지 않는 경우가 생겼다.

## 규모 지표

| 지표 | 수치 |
|------|------|
| 총 세션 수 | 839 |
| tool call 수 | 0 |
| 평균 세션 시간 | 0~1분 |
| 파싱 에러 | 0 (스키마 강제 이후) |
| 지원 언어 | 8개 |
| 생성 조합 | 144 (12×12) |
| 총 콘텐츠 피스 추정 | 1,152개 이상 |

## 언제 이 패턴을 쓰나

모든 Claude 작업을 Claude Code 인터랙티브 세션으로 할 필요가 없다. 판단 기준은 간단하다.

**Claude Code 인터랙티브가 필요한 경우:**
- 코드 수정이 필요한 작업
- 파일 시스템을 읽고 써야 하는 작업
- 맥락이 쌓여야 하는 대화형 설계

**프로그래매틱 API가 나은 경우:**
- 동일한 구조의 요청이 반복될 때
- 입력/출력이 명확히 정의된 배치 작업
- 비용 민감도가 높은 대규모 생성

이 구분을 지키면 Claude Code는 고부가가치 판단 작업에만 집중할 수 있고, 반복 작업은 Haiku가 최저 비용으로 처리한다.

## 정리

> 도구를 올바른 레이어에 배치하면 비용과 품질을 동시에 잡는다.

Claude Code가 모든 걸 직접 하려 하면 비싸고 느리다. 설계는 Claude Code로 하고, 실행은 Haiku API로 위임한다. 839 세션짜리 작업을 Claude Code 인터랙티브 세션 없이 돌린 게 그 증거다.
