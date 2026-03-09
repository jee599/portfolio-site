---
title: "Token Economics와 Model Routing — LLM API 비용을 절반으로 줄이는 법"
date: 2026-03-09
description: "모든 요청에 GPT-4를 쓸 필요 없다. 모델 라우팅과 비용 최적화 전략."
tags: ["token-economics", "model-routing", "cost-optimization", "llm-api"]
lang: "ko"
source: "original"
---

월 LLM 비용이 $1,000을 넘기 시작하면 두 가지 반응이 나온다.

하나는 "이 정도면 어쩔 수 없지"라고 넘기는 것. 다른 하나는 비용 구조를 뜯어보는 것.

뜯어본 사람과 그냥 넘긴 사람 사이의 격차는 청구서에서 드러난다. 같은 서비스를 80% 싸게 돌리는 팀이 있고, 아무 최적화 없이 그냥 굴리는 팀이 있다.

이 글은 전자가 쓰는 방법을 정리한 것이다.

---

## Token 과금 구조부터 이해한다

LLM API 비용은 전부 토큰 단위다. 영어는 1토큰이 대략 0.75단어, 한국어는 1~2글자 수준이다.

과금은 input과 output을 따로 매긴다. 그리고 여기에 핵심이 있다.

**output 토큰이 input보다 3~10배 비싸다.**

Claude Sonnet 4 기준으로 input이 $3/1M tokens인데 output은 $15/1M tokens이다. 5배 차이다. GPT-5 기준으로는 input $10, output $30으로 3배 차이다. DeepSeek V3.2는 둘 다 저렴한데 input $0.14, output $0.28이다.

이 구조가 의미하는 것은 단순하다. 모델에게 장문을 생성시키는 건 그냥 돈을 쓰는 게 아니라 빠른 속도로 소진하는 것이다.

`max_tokens`를 걸지 않으면 모델은 가능한 한 길게 답한다. 그게 전부 output 토큰이고, 전부 과금이다.

```python
# 비용 폭탄
response = client.messages.create(
    model="claude-sonnet-4",
    messages=[{"role": "user", "content": prompt}]
    # max_tokens 없음 — 모델이 알아서 500~2000 토큰 쏟아냄
)

# 비용 제어
response = client.messages.create(
    model="claude-sonnet-4",
    max_tokens=150,
    messages=[{"role": "user", "content": "한 문단 이내로 답해. " + prompt}]
)
```

output 제한 하나로 비용이 5~10배 차이 날 수 있다.

---

## 2026년 주요 모델 가격표

모델 선택이 곧 비용 설계다. 현재 시점 주요 모델 가격을 보면 차이가 극명하다.

| 모델 | Input ($/1M) | Output ($/1M) |
|------|-------------|--------------|
| DeepSeek V3.2 | $0.14 | $0.28 |
| Gemini 2.5 Flash | $0.15 (추정) | $0.60 (추정) |
| Claude Haiku 4.5 | ~$1.00 | ~$5.00 |
| Claude Sonnet 4 | $3.00 | $15.00 |
| GPT-5 | $10.00 | $30.00 |
| Claude Opus 4.6 | $5.00 | $25.00 |
| GPT-5.2 Pro | $21.00 | $168.00 |

GPT-5.2 Pro의 output이 $168/1M tokens다. Gemini Flash 대비 280배 비싸다. 같은 작업에 두 모델을 쓰면 비용이 280배 차이 난다.

같은 텍스트라도 토크나이저가 달라서 실제 토큰 수가 다르게 나온다. GPT 계열에서 140토큰으로 측정된 프롬프트가 Claude나 Gemini에서는 180토큰이 나오기도 한다. 가격 비교 시 이 부분을 무시하면 실제 청구액이 예상보다 높게 나온다.

---

## Model Routing — 작업에 맞는 모델을 쓴다

라우팅의 전제는 단순하다. 모든 요청이 동일한 지능을 필요로 하지 않는다.

사용자가 "오늘 날씨 어때?"를 물어볼 때와 "이 계약서의 법적 리스크를 분석해줘"를 물어볼 때, 같은 모델을 쓸 이유가 없다.

```python
def route_request(task_type: str, complexity: str) -> str:
    routing_table = {
        # 단순 분류, 감정 분석, 짧은 요약
        ("simple", "low"): "deepseek-v3",
        # 일반 대화, 콘텐츠 생성
        ("general", "medium"): "claude-haiku-4-5",
        # 코드 리뷰, 복잡한 분석
        ("complex", "high"): "claude-sonnet-4",
        # 다단계 추론, 전문 도메인
        ("reasoning", "critical"): "claude-opus-4-6",
    }
    return routing_table.get((task_type, complexity), "claude-haiku-4-5")
```

실제 프로덕션에서는 complexity를 자동 분류하는 게 필요하다. 이때 작은 모델로 복잡도를 먼저 판단하고, 그 결과로 라우팅하는 패턴을 많이 쓴다.

```python
async def classify_and_route(user_input: str) -> str:
    # 저렴한 모델로 복잡도 먼저 판단
    complexity = await classify_complexity(user_input, model="deepseek-v3")

    if complexity == "simple":
        return await call_model(user_input, model="gemini-flash")
    elif complexity == "complex":
        return await call_model(user_input, model="claude-sonnet-4")
    else:
        return await call_model(user_input, model="claude-haiku-4-5")
```

라우팅 분류 비용이 라우팅으로 아끼는 비용보다 작아야 의미 있다. DeepSeek V3.2처럼 싼 모델로 분류하면 분류 비용 자체가 거의 없다.

실제 사례를 보면, RAG 파이프라인에서 쿼리 복잡도에 따라 모델을 달리 써서 비용을 27~55% 줄인 케이스가 있다. 연구 결과에서는 라우터를 활용해 최대 85% 비용 절감을 달성하면서 품질을 95% 수준으로 유지한 사례도 있다.

---

## OpenRouter와 LiteLLM — 인프라 레이어

라우팅을 코드로 직접 짜는 것 외에, 게이트웨이 레이어를 쓰는 방법이 있다.

**OpenRouter**는 SaaS 형태로 600개 이상의 모델을 단일 API로 접근하게 해준다. 요청에 `max_price` 파라미터를 붙이면 가격 조건을 만족하는 가장 저렴한 프로바이더로 자동 라우팅된다. `:floor` suffix를 붙이면 비용 최적화 모드로 동작한다.

```python
# OpenRouter로 비용 최적화 라우팅
response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={"Authorization": f"Bearer {OPENROUTER_KEY}"},
    json={
        "model": "openai/gpt-4o:floor",  # 가장 저렴한 provider 자동 선택
        "messages": [{"role": "user", "content": prompt}],
        "provider": {
            "max_price": {"prompt": 1.0, "completion": 2.0}  # $/1M tokens 상한
        }
    }
)
```

단점은 요청당 약 40ms 레이턴시가 추가되는 것과, 데이터가 OpenRouter 서버를 경유한다는 점이다.

**LiteLLM**은 오픈소스 프록시다. 100개 이상 프로바이더를 OpenAI 호환 포맷으로 통일한다. 자체 서버에 띄우면 데이터가 외부를 경유하지 않는다. 팀별, 프로젝트별 예산 제한을 걸 수 있고, 모든 요청의 비용을 추적한다.

```yaml
# litellm config.yaml
model_list:
  - model_name: fast-model
    litellm_params:
      model: gemini/gemini-2.5-flash
      max_budget: 0.001  # 요청당 최대 비용
  - model_name: smart-model
    litellm_params:
      model: anthropic/claude-sonnet-4

router_settings:
  routing_strategy: cost-based-routing  # 비용 기반 자동 라우팅
  fallbacks:
    - fast-model: [smart-model]  # fast-model 실패 시 fallback
```

LiteLLM은 초당 500 요청 이상에서 Python GIL 때문에 병목이 생긴다. 대규모 트래픽에서는 이 점을 감안해야 한다.

---

## Prompt Caching — 반복 처리를 없앤다

시스템 프롬프트가 길다면 caching이 가장 확실한 비용 절감 수단이다.

구조는 단순하다. 처음 요청에서 시스템 프롬프트를 처리하고 캐시한다. 이후 요청은 캐시에서 읽는다.

Anthropic의 캐시 read 가격은 $0.30/1M tokens로, 일반 input 가격 $3.00의 10% 수준이다. 90% 절감이다. 캐시 write는 기본 가격보다 25% 비싼데, 2회 이상 캐시 히트면 손익분기를 넘는다.

```python
response = anthropic.messages.create(
    model="claude-sonnet-4",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": long_system_prompt,  # 2000토큰짜리 시스템 프롬프트
            "cache_control": {"type": "ephemeral"}
        }
    ],
    messages=[{"role": "user", "content": user_message}]
)

# 캐시 사용 확인
usage = response.usage
print(f"cache_creation: {usage.cache_creation_input_tokens}")
print(f"cache_read: {usage.cache_read_input_tokens}")
```

OpenAI는 prefix caching을 자동으로 적용한다. 명시적인 설정 없이 동일한 prefix가 반복되면 50% 할인이 된다. Anthropic처럼 90%까지는 안 되지만, 코드 변경 없이 적용되는 장점이 있다.

캐싱에서 중요한 제약이 하나 있다. **캐시는 prefix 기반이다.** 프롬프트 앞부분이 바뀌면 캐시 전체가 무효화된다. 고정된 내용(시스템 프롬프트, 문서, 예시)을 앞에 두고, 가변적인 내용(사용자 입력)을 뒤에 두어야 캐시 히트율이 높아진다.

실제 수치로 보면, 시스템 프롬프트 2000토큰에 일 1,000 요청이 들어오면 캐싱 없이 200만 input 토큰이다. 캐싱 히트율 90% 기준이면 20만 토큰 수준이 된다. Sonnet 기준 월 약 $162 절감이다.

---

## Batch API — 실시간이 필요 없는 작업에 쓴다

즉각 응답이 필요 없는 작업이라면 Batch API가 정답이다.

OpenAI Batch API는 24시간 내 처리를 조건으로 **50% 할인**을 제공한다. Anthropic Message Batches도 유사한 구조다.

```python
# OpenAI Batch API 예시
import json

requests = [
    {
        "custom_id": f"req-{i}",
        "method": "POST",
        "url": "/v1/chat/completions",
        "body": {
            "model": "gpt-5",
            "messages": [{"role": "user", "content": text}],
            "max_tokens": 500
        }
    }
    for i, text in enumerate(texts_to_process)
]

# JSONL 파일로 저장 후 배치 제출
with open("batch_requests.jsonl", "w") as f:
    for req in requests:
        f.write(json.dumps(req) + "\n")
```

Batch API가 적합한 케이스는 다음과 같다.

- 대량 문서 요약, 분류, 번역
- 데이터셋 레이블링
- 야간 리포트 생성
- SEO 콘텐츠 대량 생성

실시간이 필요한 챗봇, 검색 보강에는 쓸 수 없다. 그 외 대부분의 배치성 작업에는 Batch API가 비용 최적화의 가장 간단한 방법이다.

---

## 비용 최적화 우선순위

전략이 여러 개면 어디서 시작해야 할지 모호해진다. 임팩트 순서로 정리하면 이렇다.

> 1. **모델 라우팅** — 구현 난이도 낮음, 임팩트 가장 큼 (50~70% 절감 가능)
> 2. **Prompt Caching** — 시스템 프롬프트가 길다면 즉시 적용 (input 최대 90% 절감)
> 3. **Batch API** — 실시간 불필요한 작업에 적용 (50% 할인)
> 4. **Output 제한** — `max_tokens` + 프롬프트 길이 지시 (output 비용 직접 제어)
> 5. **Semantic Caching** — 반복 쿼리가 많은 서비스에 추가 구현 (20~50% 추가 절감)

조합하면 이론적으로 전체 비용의 70~85%를 줄일 수 있다. 하지만 서비스 특성에 따라 효과가 다르다. 대화형 서비스는 캐싱 효과가 크고, 다양한 요청이 들어오는 서비스는 라우팅 효과가 크다.

---

## 실전 설계 원칙

코드를 쓰기 전에 비용 구조를 설계하는 것이 맞다.

나중에 최적화하는 것보다 처음부터 라우팅 레이어를 넣어두는 게 리팩토링 비용이 훨씬 낮다. 시스템 프롬프트는 캐싱을 염두에 두고 구조화해야 한다. output이 짧아도 되는 곳에 길이 제한을 안 거는 건 그냥 돈을 버리는 것이다.

모델 가격은 계속 떨어지고 있다. 오늘 $15/1M tokens인 모델이 2~3년 후에는 $1.50이 될 수 있다. 특정 가격에 맞춰 최적화하는 게 아니라, 가격 변동에 유연하게 대응하는 아키텍처를 만드는 게 장기적으로 더 중요하다.

> "비용 최적화는 서비스를 배포한 후에 하는 것이 아니다. 설계 단계에서 비용 구조를 잡는 것이다."

실제로 $1,000/월을 쓰는 팀이 라우팅 + 캐싱만 적용해도 $200~$400 수준으로 내려오는 경우가 많다. 하루 이틀의 엔지니어링 시간이 연간 수백만 원을 아끼는 구조다.
