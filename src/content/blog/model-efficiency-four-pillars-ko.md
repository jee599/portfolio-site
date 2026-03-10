---
title: "14GB 모델을 3.5GB로 줄였더니 성능의 95%가 살아남았다 — 모델 경량화 4종 세트"
date: 2026-03-09
description: "SLM, MoE, Distillation, Quantization. 전부 같은 목표다: 큰 모델의 능력을 작은 비용으로"
tags: ["ai", "llm", "slm", "moe", "distillation", "quantization"]
lang: "ko"
source: "original"
---

"더 크면 더 좋다"는 공식이 깨졌다.

2026년 AI의 트렌드는 더 큰 모델이 아니라 더 현명한 배포다. SLM 아키텍처가 개선되고 양자화 기술이 발전하면서 특정 작업에서 대형 모델과 소형 모델 간 성능 격차가 좁아지고 있다. 대형 이커머스 업체가 GPT-3.5 API를 fine-tuned Mistral 7B로 교체했더니 90% 비용 절감, 3배 빠른 응답, 그리고 일반 질문에서 동등하거나 더 나은 정확도를 기록한 사례가 있다. 복잡한 쿼리만 GPT-4로 에스컬레이션하고, 75%의 티켓은 SLM이 처리한다.

모델을 더 작고, 빠르고, 싸게 만드는 기법이 네 가지 있다. 전부 같은 목표를 가지고 있지만 접근이 다르다.

## SLM: 처음부터 작게 만든 모델

SLM(Small Language Model)은 파라미터 수가 수백만~100억(10B) 사이인 언어 모델이다. LLM(수천억~수조 파라미터)의 대비 개념이다.

클라우드 API로 하루 10만 건의 고객 질문을 처리하면 월 $30,000 이상의 비용이 나올 수 있다. SLM을 단일 GPU 서버에서 돌리면 1만 건이든 1,000만 건이든 하드웨어 비용은 동일하다. 경제 구조 자체가 다르다.

SLM이 LLM에 근접할 수 있는 비밀은 데이터 품질에 있다. LLM이 인터넷 전체의 수조 토큰으로 학습되는 반면, SLM은 큐레이션된 고품질 데이터셋에서 이점을 얻는다. Microsoft의 Phi-3는 노이즈와 중복을 제거한 "교과서 품질"의 합성 데이터로 학습해서, 크기의 5%로 대형 모델 능력의 90% 이상을 유지했다.

2026년 대표 SLM으로는 Phi-4(14B, 추론/코딩), Qwen2.5(0.5B~72B, 다국어/수학), Llama 3.2(1B/3B, 모바일/엣지), Gemma 3(1B~27B, 경량 추론), Mistral 7B(텍스트 생성, MMLU 82%)가 있다.

## MoE: 700B 모델인데 37B만 활성화

Mixture of Experts(MoE)는 모든 파라미터를 매번 활성화하지 않고, 입력에 따라 관련 "전문가" 네트워크만 선택적으로 활성화하는 아키텍처다.

UE5의 Nanite 메시 시스템과 비슷하다. 화면에 보이는 삼각형만 렌더링하듯이, MoE는 필요한 뉴런만 활성화한다. 일반 Dense 모델은 입력이 들어오면 700B 파라미터가 전부 연산에 참여한다. MoE 모델은 라우터가 판단해서 Expert 3과 Expert 7만 활성화하고 나머지는 쉰다. 총 파라미터는 700B이지만 활성 파라미터는 37B, 비용은 5% 수준이다.

DeepSeek V3.2는 총 685B 파라미터에 활성 37B, 256개 전문가 중 8개만 활성화한다. Phi-3.5-MoE는 총 419억 파라미터이지만 토큰당 66억만 활성화한다.

장점은 같은 품질에 추론 비용이 극적으로 낮다는 것이다. 단점은 총 파라미터가 크니까 메모리(VRAM)는 여전히 많이 필요하다는 것이다. 685B 모델을 메모리에 올려야 하지만 연산은 37B만 한다. 비유하면 거대한 도서관 건물은 필요하지만 한 번에 읽는 책은 몇 권뿐인 셈이다.

## Distillation: 큰 모델의 지식을 작은 모델로 복사

증류(Distillation)는 큰 모델(Teacher)의 지식을 작은 모델(Student)로 이전하는 기법이다. 학생 모델이 선생 모델의 출력뿐 아니라 추론 과정까지 모방하도록 학습시킨다.

Microsoft의 Phi-3 시리즈가 대표적이다. 훨씬 큰 모델에서 증류되어, 크기의 5%로 능력의 90% 이상을 유지했다.

DeepSeek R1(671B)의 추론 능력을 Qwen 1.5B~32B, Llama 8B~70B로 증류한 사례가 가장 극적이다. 671B의 추론 패턴을 1.5B 모델도 일부 재현할 수 있게 된 것이다. 스마트폰에서 돌아가는 모델이 수백B 모델의 "생각하는 방식"을 흉내 내는 셈이다.

한계는 명확하다. 증류는 기존 능력을 복사하는 거지, 새로운 능력을 만드는 건 아니다. Teacher가 못하는 건 Student도 못한다. 그래서 증류는 혁신을 주도하거나 차세대 추론 모델을 만들어내지는 못한다. 배포 최적화 도구이지, 연구 도구가 아니다.

## Quantization: 14GB를 3.5GB로 압축

양자화(Quantization)는 모델의 가중치를 높은 정밀도(16비트)에서 낮은 정밀도(4비트)로 변환하는 기법이다. 모델 구조는 그대로이고 숫자의 정밀도만 줄인다.

UE5의 텍스처 압축과 같은 개념이다. 4K 텍스처를 1K로 줄이면 파일 크기가 극적으로 줄지만, 게임에서 보면 거의 차이가 없다. 7B 파라미터 모델이 16비트 정밀도에서는 14GB 메모리가 필요하지만, 4비트로 양자화하면 3.5GB에 들어간다. 노트북에서 돌릴 수 있는 크기다.

현대 양자화 기법(GGUF 등)은 모델 품질의 95% 이상을 유지하면서 75% 크기 감소를 달성한다. 4비트 양자화 기준으로 2~3배 빠른 속도에 2% 미만의 정확도 손실이다.

## 네 기법의 조합: DeepSeek R1이 스마트폰까지 가는 과정

이 기법들은 배타적이 아니라 조합해서 쓴다.

DeepSeek R1의 여정이 이를 보여준다. 먼저 MoE 아키텍처(671B 총, 37B 활성)로 추론 비용을 절감한다. RLVR로 추론 능력을 학습시킨다. Distillation으로 1.5B~70B 크기의 작은 모델을 생성한다. Quantization으로 4비트 압축한다. 결과적으로 스마트폰에서도 추론 가능한 1.5B 모델이 671B 모델의 추론 패턴을 일부 재현한다.

실무적 판단 기준도 명확하다. API 비용이 너무 비싸면 Model Routing으로 싼 모델을 섞는다. 응답이 너무 느리면 SLM 또는 MoE 모델로 전환한다. 자체 서버에서 돌리고 싶으면 Quantization으로 VRAM에 맞춘다. 큰 모델의 능력이 필요하되 비용을 줄이고 싶으면 Distillation으로 작은 버전을 만든다.

> 2026년에 성공적인 AI 배포를 결정하는 건 어떤 모델을 쓰느냐가 아니다. 어떤 작업에 어떤 크기의 모델을 매칭하느냐다.

---

- [Introduction to Small Language Models 2026 — Machine Learning Mastery](https://machinelearningmastery.com/introduction-to-small-language-models-the-complete-guide-for-2026/)
- [Small Language Models 2026 Enterprise Guide — Iterathon](https://iterathon.tech/blog/small-language-models-enterprise-2026-cost-efficiency-guide)

---

*다른 플랫폼에서도 읽을 수 있다: [Dev.to](https://dev.to/jidonglab) · [Naver](https://blog.naver.com/jidonglab) · [Medium](https://medium.com/@jidonglab)*
