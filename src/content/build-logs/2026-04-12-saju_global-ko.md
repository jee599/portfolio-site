---
title: "Claude Haiku로 사주 궁합 콘텐츠 2,356개 자동 생성 — 프롬프트 1개, 8개 언어"
project: "saju_global"
date: 2026-04-12
lang: ko
tags: [claude-code, claude-api, haiku, prompt-engineering, i18n, content-generation]
description: "Claude Haiku 하나로 12×12 사주 궁합 144쌍을 8개 언어로 생성했다. 2,356번의 API 콜, 프롬프트 1개. 구조화 출력과 다국어 전략을 정리한다."
---

쥐+호랑이 궁합 설명을 한국어, 일본어, 중국어, 힌디어, 태국어로 동시에 생성한다. 2,356번의 API 콜, 모델은 Haiku, 프롬프트는 단 하나다.

**TL;DR** 사주 궁합 콘텐츠 144쌍 × 8언어를 Haiku + 단일 프롬프트 템플릿으로 생성했다. 핵심은 "영어로 지시, 타겟 언어로 출력"하는 구조화 프롬프트 설계다.

## 문제: 1,152개의 빈 슬롯

사주_global은 12가지 띠의 모든 조합에 대한 궁합 설명이 필요하다. 12×12 = 144쌍. 여기에 서비스 언어인 한국어, 영어, 일본어, 중국어, 힌디어, 태국어, 인도네시아어, 베트남어 8개를 곱하면 최소 1,152개의 콘텐츠 블록이 필요하다.

각 블록은 단순 번역이 아니다. 궁합 점수와 관계 유형(`generating`, `overcoming`, `same`)에 따라 문장의 톤과 강조점이 달라야 한다. 이걸 수동으로 쓰면 몇 달이 걸린다.

선택지는 두 가지였다:
1. GPT-4o나 Claude Sonnet으로 고품질 소수 생성
2. Claude Haiku로 규모 있게 생성

비용 계산을 해보니 답이 나왔다. 1,152개를 Sonnet으로 돌리면 콘텐츠 생성 비용만 수십 달러. Haiku는 같은 작업을 10분의 1 비용으로 처리한다.

## 프롬프트 1개로 8개 언어를 다루는 법

핵심 전략은 단순하다. **지시문은 영어로, 출력은 "target language"로** 위임한다.

```
Generate a 3-paragraph compatibility description for rat and tiger
(Chinese Zodiac) in the target language.
Score: 65/100, Relationship: generating.

Paragraph 1: Overall compatibility summary (2-3 sentences).
Start with the core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences).
Reference specific elements and interactions.
Paragraph 3: Potential challenges and advice (2-3 sentences).

Also generate 3 FAQ Q&A pairs about this combination.
```

`target language`만 바꾸면 나머지는 동일하다. Haiku는 이 영어 지시를 정확히 이해하고 각 언어로 3문단 + FAQ 3개를 생성한다.

실제 출력을 보면 언어별로 톤이 자연스럽게 달라진다. 일본어는 정중한 서술체, 중국어는 간결하고 직설적, 한국어는 "-습니다" 없이 자연스러운 설명체. 프롬프트에 언어별 톤을 명시하지 않았는데도 각 언어의 문화적 문체를 따라간다.

## JSON 스키마 강제: 2,356번 실패 없이 파싱하려면

콘텐츠를 DB에 저장하려면 파싱이 가능해야 한다. 자유 텍스트 출력은 후처리 비용이 너무 크다.

출력 스키마를 명시했다:

```json
{
  "description": ["문단1", "문단2", "문단3"],
  "faq": [
    {"q": "질문1", "a": "답변1"},
    {"q": "질문2", "a": "답변2"},
    {"q": "질문3", "a": "답변3"}
  ]
}
```

Haiku는 이 구조를 거의 완벽하게 따른다. 2,356개 세션에서 파싱 실패는 사실상 없었다. 이건 Haiku의 instruction-following 성능이 이 작업에서는 Sonnet과 큰 차이가 없다는 증거다.

## 관계 유형이 품질을 결정한다

궁합에는 4가지 관계 유형이 있다. `generating`(생성), `overcoming`(극복), `same`(동일 띠), `ideal`(이상적). 이 유형을 프롬프트에 넣으면 같은 점수라도 다른 방향의 글이 나온다.

예시를 보면 차이가 확실하다:

- `rat + tiger (65점, generating)`: "처음엔 끌리지만 시간이 필요한 관계" 프레이밍
- `rat + ox (60점, overcoming)`: "근본적으로 다르지만 극복하면 강해지는" 프레이밍
- `rat + rat (50점, same)`: "너무 닮아서 오히려 부딪히는" 프레이밍

점수가 더 낮은 `overcoming`(60점)이 `generating`(65점)보다 더 긍정적으로 읽히는 경우도 있다. **숫자보다 관계 프레임이 독자 경험을 결정한다.**

## Haiku vs Sonnet: 이 작업에서의 판단

콘텐츠 생성 파이프라인에서 모델 선택은 곧 비용 전략이다. Haiku를 선택한 이유:

1. **형식이 고정돼 있다** — 3문단 + FAQ 3개. 창의적 자유도가 낮을수록 Haiku가 충분하다.
2. **검증이 가능하다** — JSON 파싱으로 출력 구조를 확인할 수 있다. Sonnet의 더 나은 추론력이 필요하지 않다.
3. **규모가 크다** — 2,356개를 Sonnet으로 돌리면 비용이 수십 배 오른다.

반면 Haiku를 쓰면 안 되는 경우도 있다. 각 언어별 FAQ의 질문이 종종 비슷하거나 너무 일반적이다. "X와 Y 궁합은 어떤가요?" 같은 질문은 사실상 모든 쌍에서 동일하게 나온다. Sonnet이라면 각 쌍의 특성에 맞는 고유한 FAQ를 생성했을 것이다.

이 트레이드오프를 수용하기로 했다. FAQ의 다양성보다 비용 효율이 이 단계에서 더 중요하다.

## 세션 로그가 보여주는 것

2,356개 세션은 모두 `0 tool calls`, 대부분 `0min`. 순수 텍스트 생성이다. 코드 실행이나 파일 접근이 전혀 없다.

이건 콘텐츠 생성 파이프라인의 특성이다. API 서버가 요청을 받을 때마다 Haiku에 프롬프트를 던지고 JSON을 파싱해서 DB에 저장한다. Claude Code의 도구 사용 없이 순수 추론 능력만 활용하는 패턴이다.

`rat + rabbit`(55점)의 한국어와 영어 버전을 비교하면 흥미롭다:
- 한국어: "쥐의 민첩함과 재기발랄함은 토끼띠의 신중한 태도에 활력을 불어넣을 수 있다"
- 영어: "the Rat admires the Rabbit's quiet grace"

같은 관계를 바라보는 프레임 자체가 다르다. 한국어는 에너지 교환, 영어는 감정적 매력에 초점. 프롬프트는 동일했는데 문화적 맥락이 자동으로 반영됐다.

## 다음 단계

현재는 띠 조합별로 단일 설명을 생성한다. 개선 방향은 두 가지다:

**1. 관계 맥락별 다중 버전**
연인, 비즈니스 파트너, 가족 등 관계 맥락에 따라 다른 설명을 생성한다. 프롬프트에 `relationship_context` 파라미터를 추가하면 된다.

**2. 동적 재생성**
고정 콘텐츠 대신 사용자의 구체적인 생년월일 데이터를 반영한 맞춤형 설명 생성. 이 경우엔 Haiku 대신 Sonnet이 필요할 수 있다.

## 정리

- **1개 프롬프트 템플릿이 8개 언어를 커버한다** — 영어 지시, 타겟 언어 출력 패턴은 다국어 콘텐츠 생성의 기본 전략이다.
- **JSON 스키마를 명시하면 파싱 실패가 거의 없다** — 2,356개 중 파싱 오류는 사실상 0.
- **관계 유형이 점수보다 콘텐츠 방향을 결정한다** — `generating`, `overcoming`, `same`은 단순 레이블이 아니라 글의 프레임이다.
- **Haiku는 형식이 고정된 대량 생성에 최적이다** — FAQ 다양성을 포기하는 대신 비용을 10분의 1로 줄였다.
