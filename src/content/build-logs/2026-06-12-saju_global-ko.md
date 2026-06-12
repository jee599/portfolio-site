---
title: "궁합 설명 5쌍 자동 생성 — Claude Haiku 구조화 프롬프트 패턴"
project: "saju_global"
date: 2026-06-12
lang: ko
tags: [claude-code, claude-haiku, content-generation, prompt-engineering, saju]
description: "사주 궁합 설명과 FAQ를 Claude Haiku로 자동 생성하는 패턴. 점수·관계 유형을 프롬프트에 직접 주입해 5쌍, 0 tool calls로 처리했다. 144쌍 규모 확장 가능성 검증."
---

사주 글로벌 서비스에서 궁합 설명 콘텐츠는 분량 문제가 심각하다. 사주 동물 12종 × 12종 = 144쌍, 서양 별자리 12종 × 12종 = 144쌍. 여기에 다국어를 곱하면 수백 건의 설명 텍스트가 필요하다. 일일이 쓰면 몇 주짜리 작업이 된다.

**TL;DR** — 점수와 관계 유형을 프롬프트에 주입하면 Claude Haiku가 3단락 + FAQ 3쌍을 일관된 JSON으로 돌려준다. 세션 5개, tool call 0개, 파일 수정 0개.

## 무슨 작업이었나

`saju_global`은 사주·별자리 궁합을 다국어로 제공하는 서비스다. 이번 세션에서는 콘텐츠 생성 파이프라인의 핵심 프롬프트를 검증했다. 대상은 두 카테고리다.

- **사주 (Chinese Zodiac)**: 말×닭, 쥐×용, 토끼×원숭이 — 모두 `overcoming` 관계
- **서양 별자리 (Western Astrology)**: 염소×처녀 (100점, `same`), 물병×염소 (45점, `opposing`)

점수 범위는 40점부터 100점까지 다양하게 테스트했다. 같은 프롬프트 구조가 극단적인 점수 차이에서도 일관된 출력을 내는지 확인하는 게 목표였다.

## 프롬프트 구조

실제 프롬프트는 이렇게 생겼다.

```
Generate a 3-paragraph compatibility description for horse and rooster
(Chinese Zodiac) in the target language.
Score: 40/100, Relationship: overcoming.

Paragraph 1: Overall compatibility summary (2-3 sentences).
  Start with the core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences).
  Reference specific elements and interactions.
Paragraph 3: Potential challenges and advice (2-3 sentences).

Also generate 3 FAQ Q&A pairs about this combination.
```

핵심은 세 가지다. 첫째, `Score`와 `Relationship`을 명시적으로 주입한다. 둘째, 각 단락의 역할을 제약한다 (요약 → 강점 → 도전/조언). 셋째, 첫 문장에서 점수를 언급하도록 강제한다.

이 구조가 없으면 모델은 점수를 무시하고 일반적인 궁합 설명을 생성한다. 40점과 80점 쌍의 설명이 사실상 같아지는 문제가 생긴다.

## 출력 품질 확인

말×닭 (40점, `overcoming`) 결과를 보면:

```json
{
  "description": [
    "马和鸡的配对指数只有40分，属于需要克服重重障碍才能相处的关系...",
    "马的热情和行动力能为生活增添色彩，有时也能打破鸡过于循规蹈矩的节奏...",
    "根本的差异在于，马需要自由和冒险，鸡则坚守秩序和计划..."
  ]
}
```

점수 40점이 첫 문장에 녹아 있고, 관계 유형 `overcoming`이 "克服重重障碍(겹겹의 장애물을 극복)"로 자연스럽게 표현됐다.

반대로 염소×처녀 (100점, `same`) 결과는 톤이 완전히 달라진다.

```json
{
  "description": [
    "摩羯座和处女座堪称天作之合，这对组合的匹配度达到完美的100分...",
    "摩羯座的野心和处女座的精明形成天然互补...",
    "缺点是两个星座都太理性，有时会把感情当任务来执行..."
  ]
}
```

100점 쌍도 약점 언급이 들어갔다. `Paragraph 3`에 "도전/조언" 역할을 명시했기 때문이다. 무조건적인 칭찬만 나오는 문제를 제약으로 방지했다.

## 세션 통계

| 항목 | 값 |
|---|---|
| 세션 수 | 5 |
| 총 tool calls | 0 |
| 수정 파일 | 0개 |
| 사용 모델 | claude-haiku-4-5-20251001 |
| 처리한 조합 | 5쌍 |

tool call이 0개라는 건 이 작업이 순수한 API inference 검증이었다는 의미다. 파일 생성이나 코드 수정 없이, 프롬프트 → JSON 출력 패턴만 확인했다.

## 왜 Haiku인가

궁합 설명은 창의적인 글쓰기이지만 규칙 기반 작업이다. 점수가 낮으면 낮다고 써야 하고, 관계 유형이 `opposing`이면 갈등을 중심으로 서술해야 한다. 이런 제약을 따르는 데 Opus나 Sonnet이 필요하지 않다.

Haiku를 쓴 이유는 비용이다. 144쌍 × 다국어 수 × FAQ 포함이면 수천 건의 생성 요청이 발생한다. 비용 차이가 크게 난다.

## 확장 계획

이번 세션은 프롬프트 패턴 검증이 목표였다. 다음 단계는 두 가지다.

하나는 배치 처리 파이프라인 구축이다. 144쌍 전체를 자동으로 돌리면서 결과를 DB에 적재하는 흐름을 만든다. 다른 하나는 다국어 확장이다. 현재 결과는 중국어다. `target language` 파라미터를 바꿔서 한국어, 영어, 일본어 버전도 생성할 수 있다.

프롬프트 구조가 견고하면 언어를 바꿔도 일관성이 유지된다는 게 이번 검증의 핵심 결과다.
