---
title: "Claude Haiku 2,314 세션, tool call 0회 — 오케스트레이션 레이어 분리의 실제"
project: "portfolio-site"
date: 2026-04-11
lang: ko
tags: [claude-code, claude-haiku, automation, prompt-engineering, cost-optimization, pipeline]
description: "2,314 세션 동안 tool call이 한 번도 없었다. Claude Code로 설계하고 Haiku API로 실행하는 레이어 분리가 비용과 품질을 동시에 잡는 방법을 기록한다."
---

오늘 세션 기록에 2,314개가 쌓였다. tool call은 0회다. 이게 어떻게 가능한지, 왜 이 방식이 맞는지 정리한다.

**TL;DR** Claude Code 인터랙티브 세션이 아니라 Haiku API를 직접 호출하는 스크립트를 돌렸다. 설계는 Claude Code(Sonnet)가 하고, 반복 실행은 Haiku가 맡으면 비용 10배 절감에 품질도 유지된다.

## 2,314 세션인데 tool call이 없다는 것의 의미

세션 로그를 열면 패턴이 이상하다. 모델은 `claude-haiku-4-5-20251001`, 프롬프트는 `Generate a 3-paragraph compatibility description for rat and ox...`처럼 구조화된 콘텐츠 요청이다. Edit도 Bash도 Read도 없다. tool call이 아예 0이다.

이건 Claude Code 인터랙티브 세션이 아니다. 스크립트가 Anthropic API를 직접 POST한 것이고, Claude Code는 그 스크립트를 설계하고 실행시킨 역할만 했다. 이 구분이 핵심이다.

- **Claude Code 인터랙티브**: 파일 수정, 코드 리뷰, 설계 결정 → Sonnet 적합
- **프로그래매틱 API**: 동일 구조가 반복되는 배치 태스크 → Haiku 적합

## 왜 레이어를 나눴나

처음에는 Claude Code 안에서 직접 콘텐츠를 생성하려 했다. 세 가지 문제가 생겼다.

**비용**이 첫 번째다. Sonnet으로 1,152개 콘텐츠를 생성하면 Haiku 대비 10배 이상 비싸다. 구조화된 반복 태스크에서 창의성은 필요 없다. 일관된 포맷 준수만 필요하다.

**컨텍스트 오염**이 두 번째다. 단일 Claude Code 세션에서 수백 개 콘텐츠를 생성하면 대화 컨텍스트가 누적된다. 스크립트가 Haiku를 직접 호출하면 각 요청이 완전히 독립적인 세션이다. 출력 일관성이 올라간다.

**병렬화**가 세 번째다. 스크립트는 144가지 조합을 순회하면서 8개 언어를 병렬로 호출한다. Claude Code 인터랙티브 세션 하나로는 이 수준의 병렬도를 만들기 어렵다.

## 실제 구조

```
Claude Code (Sonnet) → 프롬프트 설계 / 스크립트 작성 / 디버깅
         ↓
Python 스크립트 → Haiku API 직접 호출 (144조합 × 8언어)
         ↓
JSON 응답 → DB 저장
```

Claude Code가 한 일은 네 가지다: 프롬프트 템플릿 설계, JSON 스키마 정의, 파이프라인 스크립트 작성, 첫 API 에러 디버깅. 이후 2,313 세션은 스크립트가 혼자 돌렸다.

## Haiku에게 포맷을 강제하는 방법

Haiku는 soft instruction을 무시하는 경향이 있다. "자연스럽게", "다양하게" 같은 표현은 효과가 없다. 대신 출력 형식을 프롬프트 레벨에서 명시적으로 강제했다.

```
Respond ONLY with valid JSON, no markdown fences:
{"description":["p1","p2","p3"],"faq":[{"q":"...","a":"..."},...]}
```

마크다운 펜스(` ```json `)가 섞이면 JSON 파싱이 깨진다. 이 한 줄로 원천 차단했다. 이후 파싱 에러 0회.

문단 역할도 구체적으로 지정했다:

```
Paragraph 1: Overall compatibility summary (2-3 sentences).
             Start with the core answer: reference the specific score and relationship.
```

`reference the specific score`가 없으면 Haiku가 점수(60/100)를 언급하지 않는 경우가 생겼다. 원하는 출력을 얻으려면 원하는 것을 명시해야 한다.

## Relationship Type: 점수 하나보다 강한 변수

프롬프트에 `Relationship:` 필드가 있다. 점수만 주는 게 아니라 관계의 성격을 명시한다:

- `generating` — 서로 에너지를 만들어내는 관계 (쥐-호랑이, 65점)
- `overcoming` — 차이를 극복해야 하는 관계 (쥐-소, 60점)
- `same` — 같은 띠끼리 (쥐-쥐, 50점)

이 한 단어가 3문단 전체의 톤을 통제한다. `generating`이면 "서로 이끌어내는" 뉘앙스가 흐르고, `overcoming`이면 "극복 노력"이 일관되게 나온다. 이 필드 없이 점수만 주면 문단마다 톤이 제각각이 된다. 변수 하나가 출력 일관성 전체를 제어하는 구조다.

## 다국어: 언어만 바꾸는 설계

8개 언어 지원에 언어별 별도 프롬프트를 만들지 않았다. 프롬프트 끝에 `"in the target language"` 한 줄이 전부다. 호출 시 시스템 프롬프트에 타겟 언어를 명시하면 Haiku가 알아서 해당 언어로 출력한다.

쥐-호랑이(65점)를 같은 프롬프트로 돌리면 이런 차이가 생긴다.

영어: *"The Rat and Tiger relationship scores a moderate 65/100—promising but requiring effort."*

일본어: *"相性スコアは65点です。発展途上というのは、互いに惹かれるものがある一方で..."*

중국어: *"鼠虎配对的兼容指数为65分，处于"生成"阶段，意味着你们需要主动建立和维护这段关系。"*

언어별로 문화적 뉘앙스가 자연스럽게 반영된다. 번역 후처리가 필요 없다.

한 가지 함정이 있다. 일본어로 요청했는데 JSON 키를 `"説明"`으로 반환하는 경우가 있다. 파싱이 깨진다. 프롬프트에 명시해야 한다:

```
Return JSON with these exact keys (do NOT translate the keys)
```

이 한 줄이 2,314번의 파싱 안정성을 보장한다.

## 지표

| 지표 | 수치 |
|------|------|
| 총 세션 수 | 2,314 |
| tool call 수 | 0 |
| 평균 세션 시간 | 0~1분 |
| 파싱 에러 | 0 (스키마 강제 이후) |
| 지원 언어 | 8개 (ko, en, ja, zh, vi, th, id, hi) |
| 생성 조합 | 144 (12×12) |
| 모델 | claude-haiku-4-5-20251001 |

## 언제 이 패턴을 쓰나

판단 기준은 간단하다.

**Claude Code 인터랙티브가 필요한 경우**: 파일 수정, 맥락이 쌓여야 하는 설계 결정, 에러 진단.

**프로그래매틱 API가 나은 경우**: 동일한 구조의 요청이 반복될 때, 입출력이 명확히 정의된 배치 작업, 비용 민감도가 높은 대규모 생성.

이 구분을 지키면 Claude Code는 고부가가치 판단 작업에만 쓰이고, 반복 작업은 Haiku가 최저 비용으로 처리한다.

> 도구를 올바른 레이어에 배치하면 비용과 품질을 동시에 잡는다.
