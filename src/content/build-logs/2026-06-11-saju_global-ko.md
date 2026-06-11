---
title: "claude-haiku로 사주 궁합 콘텐츠 자동 생성 — 5가지 띠·별자리 조합, 0줄 수정"
project: "saju_global"
date: 2026-06-11
lang: ko
tags: [claude-code, claude-haiku, content-generation, saju, astrology, multilingual]
description: "saju_global 프로젝트에서 claude-haiku-4-5로 12간지·서양 별자리 궁합 텍스트를 자동 생성. 5세션, 0줄 코드 수정, 구조화된 JSON 출력."
---

5개 세션, tool call 0회, 수정 파일 0개. `saju_global`에서 Claude Haiku가 한 일은 코드 수정이 아니라 순수한 콘텐츠 생산이었다.

**TL;DR** `claude-haiku-4-5-20251001`을 콘텐츠 생성 API로 써서 12간지·서양 별자리 궁합 텍스트를 다국어로 자동 생산한다. 프롬프트 템플릿만 잘 짜면 JSON 포맷 그대로 나온다.

## 뭘 만드는 앱인가

`saju_global`은 글로벌 사주·별자리 궁합 서비스다. 12간지(Chinese Zodiac)와 서양 별자리(Western Astrology) 두 축으로 궁합을 계산하고, 각 조합에 대한 설명 텍스트를 다국어로 제공한다.

오늘 세션에서 생성한 조합은 다섯 가지다. 말 × 닭(40점), 쥐 × 용(65점), 토끼 × 원숭이(40점)가 Chinese Zodiac 쪽이고, 염소자리 × 처녀자리(100점)와 물병자리 × 염소자리(45점)가 서양 별자리 쪽이다. 관계 유형은 `same`, `overcoming`, `opposing` 세 가지로 분류되고, 오늘은 `overcoming`이 세 쌍으로 가장 많았다.

## 프롬프트 구조가 핵심이다

모든 세션의 프롬프트는 동일한 템플릿을 따른다.

```
Generate a 3-paragraph compatibility description for {animal1} and {animal2}
({system}) in the target language.
Score: {score}/100, Relationship: {relationship}.

Paragraph 1: Overall compatibility summary (2-3 sentences).
  Start with the core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences).
Paragraph 3: Potential challenges and advice (2-3 sentences).

Also generate 3 FAQ Q&A pairs about this combination...
```

`{system}` 자리에 `Chinese Zodiac` 또는 `Zodiac Sign (Western Astrology)`가 들어가고, 점수와 관계 유형이 함께 주입된다. `target language`는 클라이언트에서 동적으로 주입되는 언어값이다. 오늘 세션들의 출력은 전부 중국어 간체(简体中文)였다.

## 출력 포맷: 구조화된 JSON 응답

Haiku가 돌려준 결과는 일관된 JSON 구조다.

```json
{
  "description": [
    "단락 1 텍스트",
    "단락 2 텍스트",
    "단락 3 텍스트"
  ],
  "faq": [
    { "q": "질문 1", "a": "답변 1" },
    { "q": "질문 2", "a": "답변 2" },
    { "q": "질문 3", "a": "답변 3" }
  ]
}
```

별도 파싱 로직 없이 프론트에서 바로 쓸 수 있는 형태다. 프롬프트에서 구조를 명시하면 Haiku는 이 포맷을 잘 지킨다.

## 100점 조합 vs 40점 조합, 톤이 다르다

점수별 톤 차이가 흥미롭다. 염소자리 × 처녀자리(100점, same) 첫 단락은 이렇다.

> 摩羯座和处女座堪称天作之合，这对组合的匹配度达到完美的100分。两个土象星座天生就说同一种语言——务实、稳重、坚定，他们用行动而非甜言蜜语来证明爱意...

반면 말 × 닭(40점, overcoming)은 이렇게 시작한다.

> 马和鸡的配对指数只有40分，属于需要克服重重障碍才能相处的关系。两个生肖在性格和价值观上差异很大，但如果彼此足够坚定，这段关系并非没有可能。

프롬프트에서 `Score`와 `Relationship`를 명시적으로 주입한 덕분에 Haiku가 이걸 그대로 반영한다. "只有40分"(겨우 40점), "达到完美的100分"(완벽한 100점)처럼 점수를 자연스럽게 문장에 녹여낸다.

## 왜 Haiku인가

12간지 조합만 144가지(12×12), 서양 별자리도 144가지다. 다국어까지 지원하면 텍스트 생성 요청 횟수는 수백~수천 건이 된다. Opus나 Sonnet을 쓰면 API 비용이 현실적으로 감당이 안 된다.

궁합 설명 텍스트는 창의적 글쓰기보다 패턴화된 정보 전달에 가깝다. 프롬프트가 충분히 구체적이라면 Haiku로도 충분한 품질이 나온다. 오늘 세션 결과물을 보면 자연스러운 중국어 문장에 점수·관계 유형 반영도 정확하다.

## 다음 단계

`overcoming` 관계 조합이 오늘 세 쌍이나 나왔는데, 부정적 뉘앙스를 과하지 않게 조율하는 게 UX 상 중요하다. 현재 프롬프트는 "challenges and advice" 단락을 별도로 지정해서 부정적 내용을 마지막에 모으는 구조인데, 이 패턴이 유저 이탈을 줄이는 데 실제로 효과가 있는지 A/B 테스트 여지가 있다.

FAQ 3쌍도 매번 생성하고 있는데, SEO 관점에서 꽤 쓸만한 구조다. 향후 페이지별 FAQ 스키마 마크업을 붙이면 검색 노출에 직접적으로 기여할 수 있다.
