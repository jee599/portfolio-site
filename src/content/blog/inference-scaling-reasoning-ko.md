---
title: "28분 동안 '생각'하는 AI — Inference Scaling과 Reasoning Model의 실체"
date: 2026-03-09
description: "DeepSeek R1은 100K thinking 토큰을 생성하는 데 28분이 걸린다. 속도를 희생해서 정확도를 사는 거래"
tags: ["ai", "llm", "inference-scaling", "reasoning", "deepseek", "rlvr"]
lang: "ko"
source: "original"
---

AI 성능을 높이는 패러다임이 바뀌었다.

2023년까지의 공식은 명확했다. 더 큰 모델, 더 많은 데이터, 더 많은 GPU. GPT-3에서 GPT-4로, 수십억 달러를 학습에 투입하면 모델이 똑똑해졌다. 이걸 Training-Time Scaling이라 한다.

2025년부터 다른 접근이 주류로 떠올랐다. 학습된 모델은 그대로 두고, **응답을 생성하는 시점에** 더 많은 계산을 투입해서 품질을 높이는 것. Inference-Time Scaling이다. 인간이 복잡한 문제에 더 많은 시간을 들일수록 더 나은 답을 내는 것과 비슷한 원리다.

OpenAI의 o-시리즈가 이 패러다임을 대중화했다. 전통적 LLM(GPT-4o 등)이 "즉시 대답"하는 System 1 사고라면, o1/o3 같은 Reasoning Model은 "멈추고, 생각하고, 검증하고, 답하는" System 2 사고를 한다.

수치로 보면 이 전환의 규모가 드러난다. 분석가들은 추론 컴퓨팅 수요가 2026년까지 학습 수요의 118배를 초과할 것으로 예측한다. 2030년까지 추론이 전체 AI 컴퓨팅의 75%를 차지하며, 7조 달러의 인프라 투자를 이끌 전망이다. OpenAI의 2024년 추론 비용은 23억 달러로, GPT-4 학습 비용의 15배에 달했다.

## Reasoning Model이 내부에서 하는 일

일반 LLM에 "15억 아파트 취득세"를 물으면, 학습 데이터에서 패턴을 매칭해 즉시 답한다. 맞을 수도 있고 틀릴 수도 있다. 중간 과정이 없다.

Reasoning Model은 다르다. 답하기 전에 `<thinking>` 블록 안에서 단계별 추론을 생성한다.

```
[일반 LLM]
Q: 15억 아파트 취득세는?
A: 2,250만원입니다 (패턴 매칭, 검증 없음)

[Reasoning Model]
Q: 15억 아파트 취득세는?
<thinking>
1. 1주택자 기준
2. 6억 이하: 1% → 600만원
3. 6억~9억: 누진 → 약 300만원
4. 9억~15억: 3% → 1,800만원
5. 합계: 2,700만원
6. 검증: 법조항 대조...
</thinking>
A: 2,700만원입니다
```

이 `<thinking>` 부분이 사용자에게 보이지 않는 thinking 토큰이다. 여기서 비용이 폭발한다.

DeepSeek R1은 GPU에서 60 tokens/sec로 동작할 때, 100K thinking 토큰을 생성하는 데 28분이 걸린다. 일반 모델이 200 output 토큰으로 끝나는 답변을 Reasoning Model은 10,000~100,000 thinking 토큰 + 200 output 토큰으로 처리한다. 비용은 50배 이상 차이가 날 수 있다. 하지만 정확도는 극적으로 올라간다.

## 세 가지 핵심 기법

Inference-Time Scaling의 구체적 기법은 세 가지로 나뉜다.

**Chain-of-Thought(생각 사슬)**은 LLM이 바로 답하지 않고 중간 추론 과정을 생성하는 것이다. o1, o3, DeepSeek R1 모두 이 방식이다. 모델이 "생각하는 과정"을 텍스트로 출력하면, 복잡한 문제에서 정확도가 극적으로 올라간다.

**Self-Consistency(자기 일관성)**는 같은 질문에 대해 여러 번 응답을 생성하고 다수결로 최종 답을 고르는 것이다. 비용이 N배가 되지만, 수학 같은 영역에서 정확도가 크게 향상된다. DeepSeekMath-V2 논문은 Self-Consistency와 Self-Refinement 두 기법의 조합으로 수학 경시대회 벤치마크에서 금메달 수준을 달성했다.

**Self-Refinement(자기 개선)**은 한 번 생성한 답을 스스로 비판하고 수정하는 것이다. 에이전트의 Reflection 패턴과 본질이 같다. 1차 생성 → 자기 비판 → 2차 생성 → 재비판 → 최종 답변.

## DeepSeek R1 vs OpenAI o3

두 모델의 접근이 다르다.

o3는 Dense 트랜스포머 위에 대규모 강화학습과 테스트 시점 탐색을 적용했다. 내부적으로 여러 후보 추론 경로를 생성하고 평가하지만, 그 과정을 사용자에게 공개하지 않는다. 모든 파라미터가 처리 중 활성화되어 완전한 컨텍스트를 포착하지만, 막대한 계산 자원이 필요하다.

DeepSeek R1은 MoE(Mixture of Experts) 아키텍처 위에 순수 강화학습(RLVR)을 적용했다. 사용자에게 보이는 명시적 Chain-of-Thought을 생성해서 추론 과정이 투명하고 감사하기 쉽다. 입력에 따라 파라미터의 일부만 활성화해서 비용이 저렴하다. o1에 필적하는 성능을 70% 낮은 비용으로 달성했다.

핵심 차이를 한 줄로 정리하면, o3는 비싸지만 강력하고 불투명한 반면, R1은 저렴하고 투명하며 거의 동등한 성능이다.

## RLVR: Reasoning 능력은 어디서 오는가

DeepSeek R1의 추론 능력은 RLVR(Reinforcement Learning with Verifiable Rewards)에서 왔다. "검증 가능한 보상"으로 강화학습하는 기법이다.

수학 문제를 모델에게 던지고, 답이 맞으면 보상, 틀리면 벌칙. 이걸 수천만 번 반복한다. 놀라운 발견은 인간 피드백 없이 순수 RL만으로 추론 능력이 자연 발현했다는 것이다. 아무도 "단계별로 풀어라"고 가르치지 않았는데, 모델이 스스로 Chain-of-Thought을 만들어냈다. AIME 벤치마크 정확도가 15.6%에서 71%로 뛰었다.

이 접근이 가능한 조건은 "정답이 자동으로 검증 가능해야 한다"는 것이다. 수학은 정답이 명확하고, 코드는 실행해서 테스트를 통과하는지 확인할 수 있다. 에세이나 창작 같은 주관적 영역에서는 RLVR이 작동하지 않는다. 그래서 RLHF(인간 피드백 기반)가 여전히 필요하다.

2026년 트렌드는 RLVR이 수학/코드를 넘어 화학, 생물학, 법률 등 "검증 가능한" 다른 도메인으로 확장되는 것이다.

## 실전 판단: 언제 Reasoning Model을 쓰는가

모든 질문에 Reasoning Model을 켤 필요는 없다. 핵심 기준은 "틀리면 얼마나 큰 문제인가"다.

번역이 약간 어색해도 큰 문제가 아니다. 하지만 세금 계산이 틀리면 법적 문제가 생긴다. 정확도가 비용보다 중요한 곳에 Reasoning Model을 쓰고, 나머지는 일반 모델로 처리한다. 이것이 Model Routing과 연결되는 지점이다. "이 질문은 깊게 생각해야 하는가?"를 먼저 판단하고 필요한 경우에만 추론 모드를 활성화하는 Selective Reasoning이 2026년의 다음 단계다.

> 학습에 수억 달러를 쓰는 시대는 지나가고 있다. 추론에 어떻게 투자하느냐가 2026년의 승부처다.

---

- [Understanding Reasoning LLMs — Sebastian Raschka](https://magazine.sebastianraschka.com/p/understanding-reasoning-llms)
- [DeepSeek-R1 Technical Report](https://arxiv.org/abs/2501.12948)
- [Inference-Time Scaling — Introl](https://introl.com/blog/inference-time-scaling-research-reasoning-models-december-2025)

---

*다른 플랫폼에서도 읽을 수 있다: [Dev.to](https://dev.to/jidonglab) · [Naver](https://blog.naver.com/jidonglab) · [Medium](https://medium.com/@jidonglab)*
