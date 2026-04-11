---
title: "Claude Haiku로 2,313개 다국어 궁합 콘텐츠 자동 생성 — 프롬프트 하나로 8개 언어"
project: "saju_global"
date: 2026-04-11
lang: ko
tags: [claude-api, haiku, content-generation, i18n, prompt-engineering]
description: "12간지 144조합 × 8개 언어, 총 2,313 세션으로 궁합 DB를 사전 생성했다. 프롬프트 하나에 언어만 바꿔서 돌리는 구조화 전략과 Haiku 선택 이유를 공개한다."
---

12간지 궁합 조합은 144가지다. 여기에 언어 8개를 곱하면 1,152개의 콘텐츠 피스가 필요하다. FAQ까지 붙이면 수천 개로 불어난다. 이걸 수동으로 쓰면 수개월이다. Claude Haiku API 호출 2,313번으로 하루 만에 끝냈다.

**TL;DR** 프롬프트 하나에 언어만 바꿔서 돌리는 방식으로 8개 언어 궁합 DB를 사전 생성했다. 모델은 Haiku — 비용 대비 품질이 이 작업에 최적이었다.

## 뭘 만들었나

사주 분석 앱 `saju_global`에 **띠별 궁합(Chinese Zodiac compatibility)** 기능을 추가했다. 12간지 × 12간지 = 144가지 조합마다 3문단 설명 + FAQ 3개를 제공해야 한다. 앱은 8개 언어를 지원한다: 한국어, 영어, 일본어, 중국어 간체, 베트남어, 태국어, 인도네시아어, 힌디어.

온디맨드로 생성하면 사용자마다 LLM 응답을 기다려야 한다. 대신 **DB에 사전 생성해두는 방식**을 선택했다. 이 결정이 프롬프트 설계 전략을 완전히 바꿨다.

## 핵심 프롬프트 구조

2,313개 세션 전체에서 같은 프롬프트 템플릿을 사용했다. 실제 프롬프트다:

```
Generate a 3-paragraph compatibility description for {sign_a} and {sign_b}
(Chinese Zodiac) in the target language.
Score: {score}/100, Relationship: {relationship_type}.

Paragraph 1: Overall compatibility summary (2-3 sentences).
Start with the core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences).
Reference specific elements and interactions.
Paragraph 3: Potential challenges and advice (2-3 sentences).

Also generate 3 FAQ Q&A pairs about this combination.
```

변수는 세 개뿐이다: `{sign_a}`, `{sign_b}`, `{score}/{relationship_type}`. **"in the target language"** 한 줄이 8개 언어를 커버한다. 언어별로 별도 프롬프트를 만들지 않았다.

## Relationship Type으로 품질을 올리는 방법

프롬프트에 `Relationship:` 필드가 있다. 단순히 점수만 주는 게 아니라 관계의 성격을 명시한다:

- `generating` — 서로 에너지를 만들어내는 관계 (예: 쥐-호랑이 65점)
- `overcoming` — 차이를 극복해야 하는 관계 (예: 쥐-소 60점)
- `same` — 같은 띠끼리 (예: 쥐-쥐 50점)

이 한 단어가 출력 품질을 크게 바꾼다. `Relationship: generating`이 있으면 "서로 이끌어내는" 뉘앙스가, `overcoming`이 있으면 "극복 과정"이 3문단 전반에 일관되게 흐른다. 없으면 같은 점수라도 문단마다 톤이 제각각이 된다.

## 왜 Haiku인가

모든 세션에 `claude-haiku-4-5-20251001`을 썼다. 선택 이유는 세 가지다.

**속도**: 세션당 0~1분, 대부분 0분이다. 2,313번 호출해도 병렬로 돌리면 얼마 걸리지 않는다.

**비용**: 이 작업은 창의성보다 **일관된 포맷 준수**가 중요하다. "3문단 + FAQ 3개"라는 구조를 지키는 것, Haiku면 충분하다. Sonnet이나 Opus를 쓸 이유가 없다.

**다국어 품질**: 세션 기록을 보면 한국어, 일본어, 중국어, 힌디어, 태국어, 베트남어, 인도네시아어 모두 자연스럽다. 힌디어로 생성된 결과도 데바나가리 문자로 정확히 출력됐다.

## tool call이 0인 이유

전체 2,313 세션 중 `tool calls: 0`이다. Claude Code가 파일을 읽거나 수정하는 작업이 아니기 때문이다.

실제 동작 방식: 스크립트가 144가지 조합 × 8개 언어 목록을 생성하고, 각 조합을 Claude API에 직접 POST하고, 응답 JSON을 DB에 저장한다. Claude Code는 **이 파이프라인 스크립트 자체를 작성할 때** 사용했다. 실제 콘텐츠 생성 루프는 서버에서 독립적으로 돈다.

## 같은 조합, 8개 언어의 뉘앙스 차이

쥐-호랑이(65점, generating)를 8개 언어로 생성하면 흥미로운 차이가 생긴다.

영어는 직접적이다: "The Rat and Tiger relationship scores a moderate 65/100—promising but requiring effort."

일본어는 부드럽다: "相性スコアは65点です。発展途上というのは、互いに惹かれるものがある一方で、ものの見方や行動パターンに根本的な違いが存在するということです。"

중국어는 실용적이다: "鼠虎配对的兼容指数为65分，处于"生成"阶段，意味着你们需要主动建立和维护这段关系。"

같은 프롬프트지만 언어별 문화적 뉘앙스가 자연스럽게 반영된다. 언어별로 별도 프롬프트를 쓰지 않아도 된다는 게 핵심이다.

## JSON 키 번역 금지 — 놓치기 쉬운 함정

다국어 bulk 생성에서 흔히 생기는 문제가 있다. 일본어로 요청했는데 `"description"` 키를 `"説明"`으로 반환하는 경우다. 이걸 방지하려면 프롬프트에 명시해야 한다:

```
Return JSON with these exact keys (do NOT translate the keys):
{"description": [...], "faq": [{"q": "...", "a": "..."}]}
```

키 이름은 번역하지 말라는 명시가 없으면 LLM이 가끔 번역한다. 이 한 줄이 2,313번의 파싱 안정성을 보장한다.

## 숫자로

- 총 세션 수: 2,313
- 세션당 소요 시간: 0~1분
- 세션당 tool call: 0회 (순수 API 호출)
- 커버 언어: 8개 (ko, en, ja, zh, vi, th, id, hi)
- 생성된 콘텐츠: 144조합 × 8언어 × (설명 3문단 + FAQ 3쌍)

## 정리

- **프롬프트 하나, 언어만 바꾼다.** "in the target language" 한 줄이 8개 언어를 커버한다.
- **Relationship type을 넣으면 일관성이 올라간다.** 점수만 주면 문단마다 톤이 흔들린다.
- **Haiku면 충분한 작업이 있다.** 포맷 준수가 목적이면 비싼 모델은 낭비다.
- **JSON 키는 번역 금지를 명시한다.** 이 한 줄이 bulk 생성에서 파싱 오류를 막는다.
- **사전 생성 vs 온디맨드.** UX와 비용 둘 다 사전 생성이 유리할 때가 많다.
