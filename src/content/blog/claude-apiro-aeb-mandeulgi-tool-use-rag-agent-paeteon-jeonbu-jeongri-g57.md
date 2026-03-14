---
title: "Claude API로 앱 만들기 — Tool Use, RAG, Agent 패턴 전부 정리"
description: "API 호출만으로는 서비스가 안 된다. Tool Use, RAG, Agent 패턴까지 알아야 진짜 앱이 나온다."
date: "2026-03-03"
tags: ["ai", "webdev", "llm", "beginners"]
source: "devto"
---

Claude API를 호출하는 건 쉽다. `messages.create`에 프롬프트 넣으면 답이 온다.

근데 이것만으로는 서비스가 안 된다.

진짜 앱을 만들려면 3가지가 더 필요하다. **Tool Use, RAG, Agent/Workflow 패턴**.

## Tool Use — Claude에게 손을 달아주는 것

Tool Use를 쓰면 Claude가 외부 함수를 호출할 수 있다.

```json
[
  {
    "name": "get_apartment_price",
    "description": "특정 지역의 아파트 시세를 조회합니다",
    "input_schema": {
      "type": "object",
      "properties": {
        "district": {"type": "string"},
        "year": {"type": "integer"}
      },
      "required": ["district"]
    }
  }
]
```

흐름:
사용자 질문 → Claude가 도구 호출 제안 → 개발자가 실제 실행 → `tool_result` 반환 → Claude 최종 응답.

## RAG — Claude가 모르는 걸 알게 만드는 것

RAG는 외부 데이터를 검색해 Claude 프롬프트에 주입하는 구조다.

핵심 파이프라인:
1. 청킹
2. 임베딩
3. 검색(BM25 + 벡터)
4. 리랭킹
5. 컨텍스트 주입

이 과정을 넣으면 Claude가 “아는 척” 대신 실제 데이터 기반으로 답한다.

## Agent와 Workflow — 여러 단계를 엮는 패턴

- **병렬화**: 독립 작업 동시 실행
- **체이닝**: 이전 단계 출력이 다음 단계 입력
- **라우팅**: 입력 분류 후 다른 경로 처리

핵심 구분:
- Workflow = 예측 가능, 안정적
- Agent = 유연하지만 예측 어려움

실무에선 Workflow부터 시작하고, 가드레일 갖춘 뒤 Agent를 붙이는 게 안전하다.

## 실제 앱에 적용하면

사주 앱:
- Tool Use로 만세력/오행 계산 함수 연결
- RAG로 해석 DB 검색
- 체이닝으로 “기본 분석 → 상세 해석 → 조언”

부동산 앱:
- Tool Use로 시세 API 호출
- RAG로 정책/뉴스 검색
- 병렬 워크플로우로 다축 분석

> API 호출은 시작일 뿐이다. Tool Use로 손을, RAG로 기억을, Workflow로 두뇌를 준다.

[jidonglab.com](https://jidonglab.com)
