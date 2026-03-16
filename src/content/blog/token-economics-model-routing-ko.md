---
title: "같은 질문, 모델만 바꿨더니 비용이 45배 차이 났다 — Token Economics 실전 가이드"
date: 2026-03-09
description: "Output 토큰이 Input보다 3~10배 비싸다. 이걸 모르면 API 청구서에서 놀란다"
tags: ["ai", "llm", "token-economics", "model-routing", "cost-optimization"]
lang: "ko"
source: "original"
---

GPT-4급 성능을 2년 전 대비 100분의 1 가격에 쓸 수 있는 시대다.

2026년 3월 기준 LLM API 시장에서 "저렴한" 모델과 "프리미엄" 모델 사이의 가격 격차는 1,000배를 넘긴다. Mistral Nemo은 백만 토큰당 $0.02이고, o3 Pro는 $375다. 같은 "LLM API 호출"인데 가격이 네 자릿수 차이가 난다.

이 격차를 이해하고 활용하는 기술이 Token Economics다. 그리고 그 격차를 자동으로 활용하는 시스템이 Model Routing이다.

## 토큰이라는 화폐

LLM의 세계에서 토큰은 돈이다. 문자 그대로.

토큰은 LLM이 처리하는 텍스트의 최소 단위다. 영어 기준으로 약 4글자가 1토큰이고, 한국어는 1글자가 대략 1~2토큰에 해당한다. "What's on my calendar today?"는 약 8토큰이다. 같은 의미를 "오늘 예정된 일정에 대한 포괄적 개요를 제공해주시겠어요?"라고 쓰면 18토큰이 넘는다. 같은 의도에 2배 이상 차이가 나는 셈이다.

LLM API는 이 토큰 단위로 과금한다. 여기서 대부분의 개발자가 모르는 핵심 디테일이 하나 있다.

**Output 토큰이 Input 토큰보다 3~10배 비싸다.**

Claude Sonnet 4.6을 예로 들면, Input은 백만 토큰당 $3이고 Output은 $15다. 5배 차이다. 챗봇이 Input 대비 Output을 2배 생성하는 게 일반적이니까, 실제 비용은 광고 가격 "$3"의 11배인 $33에 가깝다.

Output 토큰이 비싼 데는 계산학적 이유가 있다. 토큰을 오토리그레시브하게 생성하는 과정은 빔 서치, 온도 샘플링, 정렬 레이어를 수반하고, 이건 단순히 입력을 임베딩하는 것보다 GPU 시간과 메모리를 훨씬 많이 소비한다.

여기에 Reasoning Model의 경우 **Thinking Token**이라는 제3의 비용이 추가된다. 사용자에게 보이지 않는 내부 "생각" 토큰으로, 다단계 추론이나 스크래치패드 계산에 사용된다. 일반적으로 output 토큰과 동일하거나 더 높은 가격이 매겨진다. 일반 모델이 200 output 토큰으로 끝나는 답변을 Reasoning Model은 10,000 thinking 토큰 + 200 output 토큰으로 처리한다. 비용이 보이지 않는 곳에서 폭발하는 구조다.

## 2026년 3월, 실제 가격표

주요 모델의 백만 토큰당 가격을 나란히 놓으면 상황이 명확해진다.

```
모델                    Input      Output     품질점수(100)
Claude Opus 4.6         $5         $25        100
GPT-5                   $10        $30        ~95
Claude Sonnet 4.6       $3         $15        ~88
Gemini 2.5 Pro          $1.25      $10        ~85
DeepSeek V3.2           $0.14      $0.28      79
Gemini 2.0 Flash-Lite   $0.075     $0.30      ~60
GPT-5 Nano              $0.05      $0.20      ~50
```

같은 고객 지원 워크로드(월 100만 건 대화, 평균 2K 토큰)를 다른 모델로 처리할 때 월 비용은 DeepSeek V3.2로 약 $195, Claude Sonnet으로 약 $3,250, Claude Opus로 약 $8,750이다. 같은 일을 하는데 최대 45배 차이다.

## Model Routing: 60~80% 비용 절감의 핵심

Model Routing의 정의는 간단하다. 요청의 복잡도를 판단해서 적절한 모델로 분배하는 시스템이다. 간단한 질문에 Opus를 쓸 이유가 없고, 복잡한 아키텍처 설계에 Haiku를 쓸 이유가 없다.

```
사용자 요청
    ↓
[Router]
    ├── 간단 → Haiku ($0.25/1M)   "오늘 날씨 어때?"
    ├── 중간 → Sonnet ($3/1M)      "이 코드의 버그를 찾아줘"
    └── 복잡 → Opus ($5/1M)        "이 아키텍처를 재설계해줘"
```

현실적 절감 효과는 대부분의 애플리케이션에서 60~80%다. 핵심은 "어떤 모델을 쓸지"를 자동으로 판단하는 방법이다.

가장 실전적인 접근은 **가장 싼 모델로 복잡도만 판단**시키는 것이다. Haiku에게 "이 요청이 1~3 중 몇 수준이냐"만 물으면 된다. 라우팅 1건의 비용은 약 $0.00003, 사실상 무료다.

```python
async def route(query: str) -> str:
    classification = await haiku.call(
        system="요청의 복잡도를 1~3으로만 답해라. 숫자만.",
        user=query
    )
    level = int(classification.strip())
    if level == 1: return "haiku"
    elif level == 2: return "sonnet"
    else: return "opus"
```

한 가지 주의할 점이 있다. 라우팅 실패의 비용이 비대칭이라는 것이다. 복잡한 작업을 Haiku로 보내면 사용자가 재질문한다. 재질문은 추가 비용이다. 반면 단순한 작업을 Opus로 보내면 돈만 좀 더 쓰고 답변은 좋다. 그래서 애매하면 한 단계 위 모델로 보내는 게 안전하다.

## 라우팅 이외의 비용 최적화 기법

**Prompt Caching**은 같은 시스템 프롬프트와 도구 정의를 반복 호출할 때 캐싱해서 비용을 줄인다. Anthropic의 경우 캐싱된 토큰에 대해 최대 90% 할인을 제공한다. 에이전트처럼 같은 설정으로 수십 번 호출하는 구조에서 필수다.

**Batch API**는 실시간 응답이 필요 없는 작업에 대해 50% 할인을 제공한다. 보고서 생성, 대량 분류, 일괄 번역 같은 비동기 작업에 적합하다.

**Output 길이 제한**은 가장 쉬운 최적화다. API 호출 시 `max_tokens`를 설정하고 프롬프트에 "50단어 이내로 답해"를 포함하면, Output 토큰이 Input보다 3~5배 비싸니까 불필요하게 긴 응답만 막아도 상당한 절감이 가능하다.

**RAG 최적화**는 검색 파이프라인을 정리하는 것이다. 팀들이 4~8개의 긴 문서를 프롬프트에 전달하는 경우가 흔한데, 실제로는 짧은 스니펫이면 충분하다. 검색을 2~3개 짧은 청크로 제한하면 정확도 손실 없이 input 토큰을 절반 이상 줄일 수 있다.

**Semantic Caching**은 의미적으로 유사한 쿼리에 대해 이전 응답을 캐시에서 반환한다. "오늘 날씨 어때?"와 "지금 날씨 어떤가?"가 같은 캐시 엔트리를 히트할 수 있다. LLM 호출 자체를 안 하니까 비용이 $0이다.

이 기법들을 조합하면 단일 기법보다 훨씬 큰 절감이 가능하다. Model Routing으로 60~80%, 거기에 Prompt Caching으로 추가 절감, Batch API로 비동기 작업 절감. 최종적으로 원래 비용의 10~20%만 남는 경우도 드물지 않다.

> 가장 비싼 최적화는 "모든 요청에 최고 모델을 쓰는 것"이다. 가장 효과적인 최적화는 "어떤 요청에 어떤 모델을 쓸지 판단하는 것"이다.

---

- [LLM API Pricing Guide (March 2026)](https://costgoat.com/compare/llm-api)
- [LLM Token Optimization — Redis](https://redis.io/blog/llm-token-optimization-speed-up-apps/)

---

*다른 플랫폼에서도 읽을 수 있다: [Dev.to](https://dev.to/jidonglab) · [Naver](https://blog.naver.com/jidonglab) · [Medium](https://medium.com/@jidonglab)*
