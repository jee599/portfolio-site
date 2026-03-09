---
title: "Inference Scaling과 Reasoning 모델 — 더 큰 모델 대신 더 오래 생각하게 하는 법"
date: 2026-03-09
description: "o1, DeepSeek-R1, Claude extended thinking까지. test-time compute가 AI를 바꾸는 방식."
tags: ["inference-scaling", "reasoning", "o1", "deepseek", "claude"]
lang: "ko"
source: "original"
---

AI 업계의 패러다임이 조용히 바뀌었다.

2020년부터 2023년까지는 "더 크게"가 답이었다. GPT-3는 175B, GPT-4는 추정 1T+ 파라미터. 스케일 법칙(scaling law)이 지배했고, 더 많이 학습시키면 더 똑똑해졌다.

2024년부터 다른 게 작동하기 시작했다.

모델을 더 크게 만드는 대신, **추론 시점에 더 많이 생각하게 한다.** 이게 inference scaling이다.

---

## Training-Time vs. Test-Time Compute

기존 패러다임은 간단하다. 훈련에 돈을 쏟아붓고, 추론(inference)은 최대한 빠르고 싸게 처리한다.

Inference scaling은 이 방정식을 뒤집는다.

> "추론 시점에 compute를 더 쓰면, 훈련에 더 투자하는 것보다 효율적일 수 있다."

Google DeepMind의 연구가 이걸 수치로 보여줬다. 7B 파라미터 모델에 100배의 추론 compute를 붙이면, 70B 모델의 표준 추론과 맞먹는 성능이 나온다.

작은 모델 + 더 많은 생각 = 큰 모델 + 빠른 답.

트레이드오프는 명확하다. 비용과 latency가 올라간다. 그 대신 정확도가 올라간다.

---

## Chain-of-Thought가 왜 작동하는가

Chain-of-thought(CoT)는 단순하다. "단계별로 생각해"라고 시키면 모델이 중간 추론 과정을 토큰으로 생성한다. 그 과정에서 실수를 잡아내고 논리를 교정한다.

표준 CoT는 사람이 읽을 수 있는 수준이다. 2~3문장짜리 추론 체인.

Reasoning 모델의 CoT는 다르다. 수천 토큰에 걸친 내부 독백이다. backtracking이 있고, 가설을 세우고 반박하고, 여러 경로를 동시에 탐색한다.

```
표준 LLM:
질문 → 답변  (수백 토큰)

Reasoning 모델:
질문 → [생각 중...수천 토큰...] → 답변
```

이 "생각 중" 단계가 inference scaling의 핵심이다. 토큰을 더 쓰는 대신 품질을 산다.

---

## 주요 모델들이 각자 다른 방식으로 접근한다

### OpenAI o1 / o3

o1이 2024년 9월에 등장하면서 reasoning 모델 시대가 열렸다.

숨겨진 chain-of-thought를 내부적으로 돌리고 최종 답변만 보여준다. "thinking budget"으로 compute를 조절할 수 있다. o3는 그 다음 단계로, AIME(수학 올림피아드) 96.7% 정확도, SWE-bench(소프트웨어 엔지니어링) 71.7%를 기록했다.

비용은 무겁다. o1은 input $15/M, output $60/M 토큰이다.

### DeepSeek-R1

2025년 1월, DeepSeek가 오픈소스로 공개했다.

핵심 차별점은 훈련 방식이다. 순수 강화학습(RL)으로 reasoning 능력을 키웠다. 모델이 정답을 맞출 때 보상을 받고, 틀릴 때 패널티를 받는 식으로 스스로 reasoning 전략을 발전시켰다. SFT(supervised fine-tuning)는 이후 단계에서 일관성 보정용으로만 썼다.

아키텍처는 MoE(Mixture of Experts). 671B 파라미터지만 추론 시 37B만 활성화된다. 이게 비용 효율성의 비결이다.

o1 대비 90~95% 저렴하고, 오픈소스라 직접 돌릴 수 있다.

AIME에서 79.8%, SWE-bench에서 49.2%를 기록했다. o3보다 낮지만, 비용 대비 성능비는 다른 차원이다.

### Claude Extended Thinking

Anthropic은 다른 접근을 택했다. "extended thinking" 모드를 on/off로 전환할 수 있게 만들었다.

API에서 `budget_tokens` 파라미터로 thinking에 쓸 토큰을 직접 지정한다.

```python
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000  # thinking에 쓸 최대 토큰
    },
    messages=[{"role": "user", "content": prompt}]
)
```

thinking 토큰은 output으로 과금된다. $3/M input, $15/M output으로 o1보다 훨씬 저렴하다.

퍼즐 풀기에서 21/28로 1위를 기록했고, 과학 계산 태스크에서 가장 좋은 결과를 보였다.

---

## 표준 LLM과 뭐가 다른가

단순히 "더 많이 생각한다"가 아니다. 작동 방식 자체가 다르다.

**표준 LLM**: autoregressive하게 다음 토큰을 예측한다. 각 단계에서 되돌아가지 않는다. 첫 번째 경로를 끝까지 간다.

**Reasoning 모델**: 여러 경로를 탐색하고, 막히면 백트래킹하고, 스스로 검증한다. 인간이 어려운 문제를 풀 때와 비슷한 과정이다.

이 차이가 왜 중요한가. 수학 문제에서 중간에 계산 실수를 하면, 표준 LLM은 그대로 밀어붙인다. Reasoning 모델은 중간에 "이 경로가 이상하다"는 걸 감지하고 수정한다.

---

## 언제 Reasoning 모델을 써야 하는가

쓸 때와 쓰지 말아야 할 때가 명확히 구분된다.

**Reasoning 모델이 유리한 경우**

- 수학/알고리즘 문제 (AIME, 코딩 챌린지)
- 복잡한 코드 디버깅과 리팩토링
- 법률/금융 문서 분석 (멀티홉 추론 필요)
- 에이전트 태스크 (여러 단계로 나뉜 계획 수립)
- 답이 틀리면 실제 피해가 발생하는 고위험 도메인

**표준 LLM이 더 적합한 경우**

- 글쓰기, 번역, 요약
- 단순 Q&A와 팩트 조회
- 실시간 응답이 필요한 챗봇
- 창의적인 컨텐츠 생성
- 비용 민감도가 높은 대량 처리

핵심 지표는 두 가지다. **"틀렸을 때 얼마나 큰 문제인가"**와 **"멀티스텝 추론이 필요한가."**

연구에 따르면 reasoning 모델로 전환했을 때 토큰 사용량이 평균 6.7배 증가하고, 성능 향상은 평균 4.9%다. 단순 태스크에 쓰면 비용 대비 효과가 없다.

---

## 비용 현실

숫자로 보면 차이가 크다.

| 모델 | Input | Output | 특이사항 |
|---|---|---|---|
| GPT-4o | $2.5/M | $10/M | 표준 |
| o1 | $15/M | $60/M | reasoning tokens 포함 |
| Claude 3.7 Sonnet | $3/M | $15/M | thinking tokens = output |
| DeepSeek-R1 (API) | $0.55/M | $2.19/M | 가장 저렴 |

DeepSeek-R1을 직접 호스팅하면 비용은 더 내려간다. 오픈소스라 가능한 옵션이다.

reasoning 모델을 쓰면 output 토큰이 많아진다. thinking 과정이 다 output으로 나오기 때문이다. 예산 설계 시 이걸 반드시 반영해야 한다.

코드 생성 파이프라인을 예로 들면: 단순 자동완성은 Haiku로 충분하다. 복잡한 알고리즘 설계는 o3 또는 extended thinking이 맞다. 이 라우팅 하나로 전체 비용의 50~70%를 절약할 수 있다.

---

## 시장은 어디로 가는가

2026년까지 inference compute 수요가 training의 118배를 넘을 것이라는 예측이 나온다. 2030년에는 전체 AI compute의 75%가 inference에 쓰일 것으로 본다.

NVIDIA의 Jensen Huang은 reasoning 모델이 일반 모델보다 100배 많은 compute를 쓴다고 말했다. 이게 H100, Blackwell 칩 수요의 진짜 드라이버다.

OpenAI는 o3와 o4-mini 이후로 GPT-5에서 reasoning과 일반 모델을 통합할 계획이라고 밝혔다. 앞으로는 "reasoning 모델"과 "표준 모델"의 구분이 사라지고, 모든 모델이 필요에 따라 thinking depth를 조절할 것이다.

> "더 큰 모델이 아니라 더 오래 생각하는 모델이 AI의 다음 단계다."

이미 그 전환이 시작됐다.

---

DeepSeek-R1이 오픈소스로 공개되면서 reasoning 모델에 접근하는 장벽이 낮아졌다. Claude API의 `budget_tokens`를 조절하면 비용과 품질의 균형을 직접 컨트롤할 수 있다.

중요한 건 모든 태스크에 reasoning 모델을 쓰는 게 아니다. 태스크의 복잡도와 위험도에 따라 routing하는 것이다. 이 판단이 inference scaling 시대의 엔지니어링 핵심이다.
