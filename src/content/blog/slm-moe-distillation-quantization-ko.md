---
title: "작은 모델의 시대 — SLM, MoE, Distillation, Quantization 총정리"
date: 2026-03-09
description: "큰 모델만이 답이 아니다. 작은 모델을 효율적으로 쓰는 4가지 기술."
tags: ["slm", "moe", "distillation", "quantization", "edge-ai"]
lang: "ko"
source: "original"
---

GPT-4를 쓰면 비싸고, 로컬에서 돌리면 느리다. 이 딜레마에서 벗어나는 방법이 있다.

LLM 생태계는 지금 "작게, 빠르게, 싸게" 방향으로 움직이고 있다. 70B 파라미터 모델을 클라우드에 쏴야만 쓸만한 AI를 만들 수 있는 시대는 끝났다. 이 글은 그 변화를 만드는 4가지 기술을 정리한다.

---

## SLM: 작아도 충분히 강하다

SLM(Small Language Model)은 보통 1B~10B 파라미터 범위의 모델을 가리킨다. 파라미터 수만으로 성능을 논하던 시대는 지났다. 지금은 데이터 품질과 아키텍처 최적화가 성능을 결정한다.

### 대표 모델

**Microsoft Phi 시리즈**

`Phi-3-mini`는 3.8B 파라미터다. 128K context를 지원하고, 코딩과 수학 추론에서 7B 이상 모델과 경쟁한다. 훈련 데이터는 "교과서 품질"의 synthetic data 위주로 구성했다. 노이즈를 줄이고 밀도를 높인 접근이다.

`Phi-4-mini`는 AlpacaEval 기준 80.5점으로, Mistral-7B(77.0)를 넘어선다. 파라미터가 절반도 안 되는데 성능은 더 높다.

**Google Gemma 시리즈**

Gemma 2는 2B부터 시작한다. 노트북 한 대로 돌릴 수 있고, MMLU, HellaSwag, GSM8K 등 주요 벤치마크에서 준수한 점수를 낸다. Gemma 3n은 MT-Bench에서 8.7점으로, 훨씬 큰 모델과 비교해도 경쟁력 있는 수치다.

**Mistral AI**

Mistral 7B는 출시 당시 동급 최강이었다. 지금도 inference 속도와 raw 성능 균형 면에서 기준점으로 쓰인다. `Ministral-3B`는 vision encoder(0.4B)를 붙여 멀티모달까지 커버하면서 FP8 기준 8GB VRAM에 들어간다.

### SLM을 써야 하는 상황

- **엣지 디바이스**: 인터넷이 없거나 latency가 중요한 환경
- **비용 최적화**: 단순 분류, 요약, 키워드 추출 같은 태스크
- **프라이버시**: 데이터를 외부로 보내면 안 되는 경우
- **실시간 응답**: 클라우드 API의 네트워크 왕복 시간이 용납 안 될 때

단순한 작업을 GPT-4에 보내는 건 모든 소포를 특급 배송으로 보내는 것과 같다.

---

## MoE: 전문가를 쪼개서 필요할 때만 쓴다

Mixture of Experts는 모델의 파라미터를 여러 "전문가(expert)" 서브네트워크로 나누고, 입력마다 그 중 일부만 활성화하는 아키텍처다.

### 왜 효율적인가

일반 dense 모델은 모든 토큰 처리에 전체 파라미터를 사용한다. MoE는 다르다. 입력마다 router가 가장 적합한 expert를 선택하고, 선택된 expert만 계산에 참여한다.

`Mixtral 8x7B`는 총 46.7B 파라미터지만, 토큰당 활성화되는 파라미터는 12.9B에 불과하다. 메모리에는 46.7B를 전부 올려야 하지만, 실제 연산량은 13B 모델 수준이다.

### DeepSeek의 혁신

DeepSeek은 MoE 아키텍처를 가장 공격적으로 밀어붙인 팀이다.

`DeepSeek-V2`(2024년 5월)는 fine-grained expert 방식을 도입했다. 큰 expert를 몇 개 두는 대신, 작은 expert를 많이 두고 더 유연하게 조합한다. 여기에 Multi-head Latent Attention(MLA)을 더해 KV cache 크기를 93% 줄였다.

`DeepSeek-V3`(2024년 12월)는 671B 총 파라미터에 토큰당 37B가 활성화된다. 256개 fine-grained expert를 쓰고, 보조 loss 없이 load balancing을 동적 bias 조정으로 해결했다. 훈련 비용은 H800 278만 GPU 시간. 동급 dense 모델 대비 압도적으로 저렴하다.

`DeepSeek-R1`(2025년 1월)은 V3 위에 reinforcement learning을 얹어 reasoning 능력을 끌어올렸다. 오픈소스이면서 OpenAI 모델과 경쟁하는 성능이 나왔다.

### MoE의 트레이드오프

장점만 있는 건 아니다. 전체 파라미터를 메모리에 올려야 하므로, 단일 GPU에서 돌리기 어렵다. Expert를 여러 GPU에 분산하는 expert parallelism이 필요하다. 서빙 인프라 복잡도가 올라간다.

2026년 현재 오픈소스 상위 10개 모델이 전부 MoE 아키텍처를 쓴다. Llama 4, Mistral Large 3, Gemini 시리즈도 포함이다. MoE는 이제 연구 주제가 아니라 프로덕션 표준이다.

---

## Knowledge Distillation: 큰 모델의 지식을 작은 모델로

Distillation은 큰 teacher 모델의 행동을 작은 student 모델이 모방하도록 훈련하는 기법이다.

### 어떻게 동작하나

일반 훈련은 정답 레이블만 보고 배운다. Distillation은 teacher 모델의 output 분포(soft label)를 함께 학습한다. "이 토큰이 정답"이라는 정보뿐만 아니라, "이 토큰은 0.3, 저 토큰은 0.15였다"는 확률 분포 정보까지 전달된다.

Teacher의 출력 분포에는 raw label에 없는 정보가 담겨 있다. 비슷한 개념들 사이의 관계, 모호한 케이스에서의 불확실성 같은 것들이다. 작은 모델이 이 정보를 흡수하면, 단순히 정답만 외운 모델보다 일반화 능력이 높아진다.

### 실전 사례

DeepSeek-R1을 훈련할 때 reasoning 데이터를 생성해서 더 작은 모델(Qwen, Llama 계열)에 distillation했다. 결과로 나온 `DeepSeek-R1-Distill-Qwen-7B`나 `DeepSeek-R1-Distill-Llama-8B` 같은 모델들은 원래 7B~8B 베이스보다 훨씬 강한 reasoning을 보인다.

Microsoft의 Phi 시리즈도 대규모 teacher 모델에서 생성한 고품질 synthetic data로 훈련한다. 이게 적은 파라미터로도 높은 성능을 내는 이유다.

### Distillation vs. 직접 훈련

| 항목 | 직접 훈련 | Distillation |
|------|-----------|--------------|
| 필요 데이터 | 많음 | 적음 (teacher가 생성) |
| 훈련 비용 | 높음 | 상대적으로 낮음 |
| 성능 상한 | Teacher를 넘을 수 있음 | 일반적으로 Teacher 이하 |
| 특화 능력 | 자유롭게 설계 | Teacher 능력에 의존 |

---

## Quantization: 모델을 압축해서 소비자 하드웨어에

Quantization은 모델 가중치의 수치 정밀도를 낮추는 기법이다. 16비트 float를 4비트 정수로 바꾸면 메모리 사용량이 4분의 1로 줄어든다.

70B 모델을 FP16으로 돌리려면 140GB VRAM이 필요하다. INT4로 quantize하면 35GB로 줄어든다. RTX 4090 한 장(24GB)에는 못 올라가지만, 48GB 설정이면 가능해진다. 7B 모델은 FP16 14GB에서 INT4 3.5GB로, 노트북에서도 돌아가는 크기가 된다.

### 세 가지 주요 방법

**GPTQ**

4비트 범위까지 압축한 첫 번째 방법이다. 2차 미분 정보(Hessian)를 활용해 quantization 오차를 최소화한다. calibration dataset이 필요하고, 데이터 품질이 결과에 영향을 미친다. GPU inference에 특화돼 있고, Marlin 커널과 결합하면 FP16보다 빠른 throughput이 나온다.

**AWQ (Activation-Aware Weight Quantization)**

activation 분포를 관찰해서 중요한 가중치를 보호하는 방식이다. GPTQ처럼 backpropagation을 쓰지 않아서 calibration 데이터가 덜 필요하다. 일반화 능력 유지 면에서 GPTQ보다 낫다는 평가가 많다. Marlin-AWQ는 741 tok/s로 현재 가장 빠른 구현 중 하나다.

벤치마크 기준으로 AWQ는 원본 대비 약 95% 품질을 유지한다. GGUF는 92%, GPTQ는 90% 수준이다.

**GGUF**

`llama.cpp`에서 사용하는 포맷이다. CPU와 Apple Silicon에서 돌리는 데 최적화돼 있다. 특정 레이어만 GPU에 offload하는 하이브리드 실행도 지원한다. INT4와 INT8을 레이어별로 혼합해서 쓰는 방식이다.

GPU가 없어도 돌릴 수 있다는 게 핵심이다. MacBook Pro M3에서 7B 모델을 40 tok/s 이상으로 돌리는 게 가능하다. `llama.cpp`는 GitHub star 7만을 넘겼다.

### 포맷 선택 기준

| 상황 | 추천 포맷 |
|------|-----------|
| CUDA GPU, throughput 최우선 | AWQ (Marlin 커널) |
| 품질과 속도 균형 | AWQ |
| CPU / Apple Silicon | GGUF |
| 크로스플랫폼 배포 | GGUF |

Quantization은 distillation, pruning과 스택 가능하다. NVIDIA Minitron은 prune + distill 후 quantize하는 파이프라인을 쓴다.

---

## 네 가지 기술을 어떻게 조합하나

현실적인 시나리오별로 정리한다.

**비용 최적화가 목표**

단순 태스크(분류, 요약, 키워드 추출)는 SLM에 라우팅한다. Phi-4-mini나 Gemma 2 2B가 충분한 경우가 많다. 복잡한 추론이 필요할 때만 큰 모델을 쓴다.

**로컬 배포가 목표**

GGUF로 quantize된 7B 모델을 `llama.cpp`로 돌린다. MacBook이나 일반 Windows PC에서 실용적인 속도가 나온다. 인터넷 없이, API 비용 없이 돌아간다.

**엣지 디바이스 배포**

SLM + INT4 quantization 조합이다. Phi-3-mini를 AWQ로 quantize하면 스마트폰 수준 하드웨어에서도 동작할 수 있는 크기가 된다.

**고성능 오픈소스 추론**

MoE 구조 모델(DeepSeek-V3, Mixtral)을 서버에 올린다. 총 파라미터는 크지만, 활성화 파라미터는 적어서 연산 비용 대비 성능이 높다.

---

## 정리

> 파라미터 수는 성능의 지표가 아니다. 데이터 품질, 아키텍처 효율, 압축 기법이 실제 성능을 결정한다.

큰 모델이 필요한 태스크는 분명 존재한다. 하지만 대부분의 실용적인 태스크는 잘 훈련된 SLM으로 커버된다. 거기에 quantization을 얹으면 소비자 하드웨어에서도 돌아간다.

SLM, MoE, Distillation, Quantization은 서로 독립적인 기술이지만 함께 쓸 때 시너지가 크다. 이미 프로덕션에서 이 조합을 쓰는 팀들이 API 비용을 70~90% 줄이고 있다.

2026년의 LLM 활용법은 "어떤 큰 모델을 쓸까"가 아니라 "어떻게 작게, 빠르게, 싸게 만들까"다.
