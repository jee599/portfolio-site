---
title: "Claude Code로 2,357 세션 설계하기 — tool call 0회의 의미"
project: "portfolio-site"
date: 2026-04-11
lang: ko
tags: [claude-code, claude-haiku, automation, prompt-engineering, orchestration, batch]
description: "세션 2,357개, tool call 0회. Claude Code가 직접 실행한 게 아니라 실행 구조를 설계했다. 오케스트레이터와 실행자를 분리하면 비용과 품질이 동시에 잡힌다."
---

오늘 세션 로그에 2,357개가 쌓였다. 모두 `claude-haiku-4-5-20251001`. tool call은 전체 합산 0회다. Claude Code가 이만큼 실행되는 동안 파일 하나 건드리지 않았다는 뜻이다.

**TL;DR** Claude Code가 한 일은 스크립트를 설계하는 것뿐이다. 2,357번의 반복은 그 스크립트가 혼자 돌렸다. 도구를 레이어로 나누면 메인 컨텍스트가 깨끗해지고 비용이 10배 이상 줄어든다.

## 2,357 세션, tool call 0 — 이게 가능한 이유

Claude Code 세션 로그를 보면 패턴이 특이하다. 프롬프트는 반복 구조다:

```
Generate a 3-paragraph compatibility description for rat and tiger
(Chinese Zodiac) in the target language.
Score: 65/100, Relationship: generating.
```

Edit도 Bash도 Read도 없다. 순수 텍스트 생성만. 이건 Claude Code 인터랙티브 세션이 아니다. 스크립트가 Anthropic API를 직접 POST한 것이고, Claude Code는 그 스크립트를 만드는 데만 쓰였다.

이 구분이 핵심이다. Claude Code는 **오케스트레이터**다. 어떤 작업을 어떻게 쪼갤지 설계하고, 스크립트를 작성하고, 디버깅하는 단계에서만 개입한다. 2,357번의 실제 콘텐츠 생성은 스크립트가 맡는다.

## 왜 레이어를 나눠야 하는가

처음엔 Claude Code 안에서 직접 생성하려 했다. 세 가지 문제가 생겼다.

**컨텍스트 오염.** 단일 Claude Code 세션에서 수백 개 콘텐츠를 만들면 대화 기록이 쌓인다. 100번째 요청은 이전 99개 출력의 영향을 받는다. 스크립트로 분리하면 각 API 호출이 독립적인 컨텍스트로 시작한다. 출력 일관성이 올라간다.

**비용.** 같은 구조화된 반복 작업을 Sonnet으로 돌리면 Haiku 대비 10배 이상 비싸다. `Generate a 3-paragraph...` 같은 포맷 강제 작업엔 창의성이 필요 없다. 일관된 JSON 구조를 지키는 능력이면 충분하다. Haiku면 충분하다.

**병렬화.** 12×12 조합에 8개 언어를 곱하면 1,152개 콘텐츠가 필요하다. 스크립트는 병렬로 돌린다. Claude Code 인터랙티브 세션 하나로 이 수준의 처리량을 내는 건 구조적으로 불가능하다.

## Claude Code가 실제로 한 일

2,357 세션 중 Claude Code 인터랙티브가 관여한 건 초반 몇 번뿐이다. 한 일은 네 가지다.

1. 프롬프트 템플릿 설계 — 변수 4개(`sign_a`, `sign_b`, `score`, `relationship`)가 전체를 제어하도록 구조화
2. JSON 출력 스키마 정의 — 파싱 가능한 형태로 응답을 강제하는 instruction 작성
3. 파이프라인 스크립트 작성 — 144 조합 × 8언어를 순회하는 루프
4. 첫 번째 파싱 에러 디버깅 — JSON 키 번역 문제 발견 및 수정

이후 2,353 세션은 스크립트가 혼자 돌렸다. Claude Code가 없는 상태에서.

## 프롬프트 설계의 핵심 두 가지

**`Relationship` 필드.** 점수만 주면 문단마다 톤이 흔들린다. `Relationship: generating`을 넣으면 "서로 이끌어내는" 뉘앙스가 3문단 전반에 일관되게 흐른다. `overcoming`이면 "극복 과정"이, `same`이면 "같은 성향의 긴장"이 관통한다. 변수 하나가 출력 일관성 전체를 제어한다.

**JSON 키 번역 금지.** 다국어 bulk 생성에서 흔한 함정이다. 일본어로 요청하면 `description` 키를 `説明`으로 반환하는 경우가 생긴다. 파싱이 깨진다.

```
Return JSON with these exact keys (do NOT translate the keys):
{"description": [...], "faq": [{"q": "...", "a": "..."}]}
```

이 한 줄이 2,357 세션의 파싱 안정성을 보장했다.

## 같은 프롬프트, 8개 언어의 뉘앙스

`in the target language` 한 줄이 8개 언어를 커버한다. 언어별 별도 프롬프트는 없다. 쥐-호랑이(65점)를 각 언어로 생성한 첫 문장이다.

영어는 직접적이다:
> "The Rat and Tiger relationship scores a moderate 65/100—promising but requiring effort."

일본어는 관계 중심이다:
> "相性スコアは65点です。発展途上というのは、互いに惹かれるものがある一方で..."

중국어는 실용적이다:
> "鼠虎配对的兼容指数为65分，处于'生成'阶段，意味着你们需要主动建立和维护这段关系。"

베트남어는 솔직하다:
> "Chuột và Hổ được ghi 65/100—mức này có nghĩa là họ không hợp tự nhiên nhưng hoàn toàn có thể xây dựng được gì đó..."

같은 변수로 언어별 문화적 뉘앙스가 자연스럽게 반영된다. 번역 후처리 없이.

## 세션 통계

| 항목 | 수치 |
|------|------|
| 총 세션 수 | 2,357 |
| tool call 수 | 0 |
| 세션당 소요 시간 | 0~1분 |
| 지원 언어 | 8개 (ko, en, ja, zh, vi, th, id, hi) |
| 생성 조합 | 144개 (12×12) |
| 총 콘텐츠 | 1,152개 |
| 모델 | claude-haiku-4-5-20251001 |

## Claude Code를 언제 쓰고 언제 벗어나야 하는가

판단 기준은 단순하다.

**Claude Code 인터랙티브**: 파일 수정, 맥락이 쌓여야 하는 설계 결정, 에러 진단, 구조 변경.

**프로그래매틱 API 직접 호출**: 동일 구조 반복, 입출력이 명확히 정의된 배치 작업, 병렬 처리가 필요한 대규모 생성.

Claude Code에서 벗어나는 것이 Claude Code를 더 잘 쓰는 방법인 경우가 있다. 설계를 Claude Code에서 하고, 실행은 밖에서 한다. 그러면 메인 컨텍스트가 깨끗하게 유지되고, 반복 작업은 최적 모델이 최적 비용으로 처리한다.

> 오케스트레이터와 실행자를 분리하면 둘 다 제 역할에 집중할 수 있다.
