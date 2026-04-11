---
title: "Claude Haiku로 2356번 — 사주 궁합 콘텐츠 8개 언어 자동 생성 파이프라인"
project: "saju_global"
date: 2026-04-11
lang: ko
tags: [claude-code, haiku, content-pipeline, i18n, prompting, batch]
description: "144개 궁합 조합 × 8개 언어 = 1,152개 콘텐츠. Claude Haiku로 2356 API 호출, tool call 0번. 구조화된 프롬프트 하나가 전체 DB를 채웠다."
---

144개 궁합 조합에 8개 언어를 곱하면 1,152개 콘텐츠다. 이걸 수작업으로 쓰면 작가가 한 명이라도 수개월이 걸린다. Claude Haiku API를 2356번 호출해서 이틀 만에 끝냈다.

**TL;DR** 구조화된 프롬프트 하나와 `claude-haiku-4-5-20251001`로 사주 앱의 전체 궁합 콘텐츠 DB를 채웠다. tool call 0번, 순수 텍스트 생성만.

## 왜 1,152개가 필요한가

사주 궁합 앱의 핵심 콘텐츠는 두 가지다. 쥐띠와 호랑이띠가 만났을 때 어떤 관계인지 서술하는 **description**과, 사용자가 자주 묻는 질문에 미리 답하는 **FAQ**다.

띠는 12개. 조합은 12 × 12 = 144가지. 여기에 서비스 타깃 언어 8개(한국어, 영어, 일본어, 중국어, 힌디어, 태국어, 인도네시아어, 베트남어)를 곱하면 1,152개 콘텐츠가 필요하다. 각 콘텐츠당 문단 3개 + FAQ 3쌍. 한 편당 400~600자 분량. 사람이 쓰면 편당 30분만 잡아도 576시간이다.

온디맨드 생성 대신 **DB 사전 생성**을 선택했다. 사용자가 페이지를 열 때마다 LLM을 호출하면 응답 속도도 느리고 비용도 예측 불가다. 미리 채워두면 DB 조회 한 번으로 끝난다.

## 프롬프트 한 장으로 전체를 돌렸다

2356개 세션 전체가 동일한 프롬프트 템플릿을 사용했다. 실제 프롬프트다:

```
Generate a 3-paragraph compatibility description for {sign_a} and {sign_b}
(Chinese Zodiac) in the target language.
Score: {score}/100, Relationship: {relationship}.

Paragraph 1: Overall compatibility summary (2-3 sentences). Start with the
core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences). Reference specific
elements and interactions.
Paragraph 3: Potential challenges and advice (2-3 sentences).

Also generate 3 FAQ Q&A pairs about this combination. Each Q&A should
address a common question users have about this pairing...
```

변수는 4개뿐이다: `sign_a`, `sign_b`, `score`, `relationship`. 나머지는 고정이다. **템플릿이 고정되면 출력이 예측 가능해진다.**

출력은 JSON으로 받았다:

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

2356 세션 전부 이 구조를 유지했다. tool call 0번. 파일 읽기도 없고 코드 실행도 없다. 순수하게 텍스트를 생성하는 작업이기 때문이다.

## Relationship type이 품질을 바꾼다

프롬프트에 `Relationship:` 필드가 있다. 단순히 점수만 주는 게 아니라 관계의 성격을 명시한다:

- `generating` — 서로 에너지를 만들어내는 관계 (예: 쥐-호랑이 65점)
- `overcoming` — 차이를 극복해야 하는 관계 (예: 쥐-소 60점)
- `same` — 같은 띠끼리 (예: 쥐-쥐 50점)

이 한 단어가 출력 품질을 크게 바꾼다. `generating`이 있으면 "서로 이끌어내는" 뉘앙스가, `overcoming`이 있으면 "극복 과정"의 서사가 3문단 전반에 일관되게 흐른다. 없으면 같은 점수라도 문단마다 톤이 제각각이 된다.

## 왜 Haiku인가

모든 세션에 `claude-haiku-4-5-20251001`을 썼다.

이 작업은 창의성보다 **일관된 포맷 준수**가 중요하다. "3문단 + FAQ 3개"라는 구조를 정확히 지키고 JSON을 파싱 가능한 형태로 뱉는 것. Haiku면 충분하다. Sonnet을 쓸 이유가 없다.

세션당 소요 시간은 0~1분. 병렬로 돌리면 2356 세션도 실제 경과 시간은 훨씬 짧다. 비용 대비 처리량이 이 작업의 핵심 지표였다.

## 같은 조합, 8개 언어의 뉘앙스 차이

쥐-호랑이(65점, generating)를 8개 언어로 생성한 첫 문장을 비교하면 흥미로운 차이가 보인다.

영어는 직접적이다:
> "The Rat and Tiger relationship scores a moderate 65/100—promising but requiring effort."

일본어는 관계 중심이다:
> "相性スコアは65点です。発展途上というのは、互いに惹かれるものがある一方で、ものの見方や行動パターンに根本的な違いが存在するということです。"

중국어는 실용적이다:
> "鼠虎配对的兼容指数为65分，处于'生成'阶段，意味着你们需要主动建立和维护这段关系。"

베트남어는 솔직하다:
> "Chuột và Hổ được ghi 65/100—mức này có nghĩa là họ không hợp tự nhiên nhưng hoàn toàn có thể xây dựng được gì đó nếu cả hai thực sự cố gắng."

같은 프롬프트인데 언어별로 문화적 뉘앙스가 자연스럽게 반영된다. "in the target language" 한 줄이 8개 언어의 표현 차이를 처리한다. 언어별 별도 프롬프트는 필요 없었다.

## JSON 키 번역 금지 — 놓치기 쉬운 함정

다국어 bulk 생성에서 흔히 생기는 문제가 있다. 일본어로 요청했는데 `description` 키를 `説明`으로 반환하는 경우다. 이걸 방지하려면 명시적으로 지정해야 한다:

```
Return JSON with these exact keys (do NOT translate the keys):
{"description": [...], "faq": [{"q": "...", "a": "..."}]}
```

키 이름 번역 금지를 명시하지 않으면 LLM이 가끔 번역한다. 이 한 줄이 2356번의 파싱 안정성을 보장한다.

## 파이프라인 구조

Claude Code는 이 **파이프라인 스크립트를 작성할 때** 사용했다. 실제 콘텐츠 생성 루프는 서버에서 독립적으로 돈다.

동작 방식: 스크립트가 144가지 조합 × 8개 언어 목록을 생성하고, 각 조합을 Claude API에 POST하고, 응답 JSON을 DB에 저장한다. 각 세션이 완전히 독립적이기 때문에 **이전 세션 출력에 의존하지 않는다**. 컨텍스트 오염 없이 일관된 품질을 유지할 수 있는 이유다.

## 숫자로

- 총 세션 수: 2,356
- 세션당 소요 시간: 0~1분
- 세션당 tool call: 0회
- 커버 언어: 8개 (ko, en, ja, zh, vi, th, id, hi)
- 생성된 콘텐츠: 144조합 × 8언어 × (설명 3문단 + FAQ 3쌍)

## 정리

- **프롬프트 하나, 언어만 바꾼다.** "in the target language" 한 줄이 8개 언어를 커버한다.
- **Relationship type을 넣으면 일관성이 올라간다.** 점수만 주면 문단마다 톤이 흔들린다.
- **Haiku면 충분한 작업이 있다.** 포맷 준수가 목적이면 비싼 모델은 낭비다.
- **JSON 키 번역 금지를 명시한다.** 이 한 줄이 bulk 생성에서 파싱 오류를 막는다.
- **사전 생성 vs 온디맨드.** UX와 비용 둘 다 사전 생성이 유리할 때가 많다.
