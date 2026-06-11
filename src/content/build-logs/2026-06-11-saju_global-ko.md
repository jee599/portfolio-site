---
title: "Claude Haiku로 궁합 콘텐츠 자동 생성: 사주·별자리 조합을 JSON으로"
project: "saju_global"
date: 2026-06-11
lang: ko
tags: [claude-code, haiku, content-generation, multilingual, json, astrology]
description: "saju_global 앱에서 Claude Haiku를 활용해 동양 12지지·서양 별자리 궁합 설명을 다국어 JSON으로 자동 생성한 과정. 하루 5개 조합, tool call 0번."
---

하루 5개 궁합 조합, tool call 0번, 파일 수정 0개. saju_global에서 Claude Haiku가 하는 일은 코드 편집이 아니라 순수한 콘텐츠 생성이다.

**TL;DR** Claude Haiku에게 점수·관계 유형·언어를 넘기면 3단락 설명 + FAQ 3쌍을 구조화된 JSON으로 돌려준다. 사람이 직접 쓰던 궁합 설명을 모델이 대체한다.

## saju_global이 뭔가

글로벌 사주·별자리 궁합 서비스다. 동양 12지지(子·丑·寅...)와 서양 12별자리(양자리~물고기자리)를 아우르는 궁합 콘텐츠를 다국어로 제공한다. 오늘 세션에서 생성한 조합은 다섯 가지다.

- 말 × 닭 (Chinese Zodiac) — 40점, overcoming
- 쥐 × 용 (Chinese Zodiac) — 65점, overcoming  
- 토끼 × 원숭이 (Chinese Zodiac) — 40점, overcoming
- 염소자리 × 처녀자리 (Western) — 100점, same
- 물병자리 × 염소자리 (Western) — 45점, opposing

## 프롬프트 패턴

모든 세션의 프롬프트 구조가 동일하다.

```
Generate a 3-paragraph compatibility description for {animal_a} and {animal_b}
({category}) in the target language.
Score: {score}/100, Relationship: {relationship}.

Paragraph 1: Overall compatibility summary (2-3 sentences).
  Start with the core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences).
  Reference specific elements and interactions.
Paragraph 3: Potential challenges and advice (2-3 sentences).

Also generate 3 FAQ Q&A pairs about this combination...
```

`in the target language`가 핵심이다. 언어를 명시하지 않고 컨텍스트에서 타깃 언어를 추론하도록 한다. 오늘 출력은 모두 중국어(简体)였다.

## 출력 구조

반환값은 두 키를 가진 JSON이다.

```json
{
  "description": [
    "단락 1: 점수와 관계 유형을 명시한 전체 요약",
    "단락 2: 이 조합의 강점",
    "단락 3: 잠재적 갈등과 조언"
  ],
  "faq": [
    { "q": "...", "a": "..." },
    { "q": "...", "a": "..." },
    { "q": "...", "a": "..." }
  ]
}
```

점수가 100점(염소자리 × 처녀자리)이든 40점(말 × 닭)이든 구조는 똑같다. 차이는 내용 톤뿐이다. 100점 조합은 "天作之合(천생연분)"으로 열고, 40점 조합은 "需要克服重重障碍(수많은 장애를 넘어야)"로 시작한다.

## Haiku를 쓰는 이유

궁합 조합의 수를 생각하면 자연스러운 선택이다. 동양 12지지만 해도 12 × 12 = 144조합, 서양 12별자리도 144조합, 거기에 언어 수를 곱하면 수천 개다. 이걸 Opus나 Sonnet으로 돌리면 비용이 감당이 안 된다.

콘텐츠 요구사항도 Haiku에 적합하다. 형식이 고정돼 있고, 창의적 자유도가 낮고, 출력 구조가 명확하다. 모델이 "잘" 써야 하는 게 아니라 "일관되게" 써야 하는 작업이다.

## tool call이 0인 이유

이 세션들은 Claude Code 인터랙티브 세션이 아니다. saju_global 앱이 Claude API를 프로그래밍 방식으로 호출하는 것이고, 세션 기록에는 그 API 호출이 잡힌 것이다. 파일 편집도, Bash 실행도 없다. 입력 → 추론 → JSON 출력이 전부다.

Claude Code의 Edit/Write/Bash 같은 도구가 필요 없는 순수 생성 태스크다.

## 관계 유형별 톤 차이

`Relationship` 파라미터가 출력 톤을 결정한다. 오늘 세션에서 확인된 패턴이다.

- **same** (100점, 염소 × 처녀): 두 별자리가 같은 원소(土)라는 점을 강조. "말이 통한다"는 서사
- **overcoming** (40~65점): "차이가 크지만 노력하면 가능하다"는 서사. 65점(쥐 × 용)과 40점(토끼 × 원숭이)의 톤이 미묘하게 다르다
- **opposing** (45점, 물병 × 염소): 근본적 충돌을 솔직하게 인정. "相对克制的对立关系(상대적으로 억제된 대립 관계)"

점수와 관계 유형 두 파라미터가 모델에게 톤의 방향을 잡아준다. 프롬프트가 이 정보를 명시하지 않아도 모델이 적절히 반영한다.

## 다음 작업

- 언어별 출력 품질 검증 (중국어 이외 언어 테스트)
- 조합 생성 우선순위 정리 (자주 검색되는 조합 먼저)
- FAQ 다양성 확보 (같은 관계 유형 내 조합끼리 FAQ가 겹치는지 확인)
