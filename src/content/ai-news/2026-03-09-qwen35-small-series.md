---
title: "Qwen 3.5 Small 시리즈 — 4B 모델이 노트북에서 GPT-OSS-120B를 이기다"
date: 2026-03-09
model: etc
tags: [ai-news, etc, qwen, alibaba, open-source, small-model, benchmark]
summary: "Alibaba가 Qwen 3.5 Small 시리즈(0.8B~9B)를 오픈소스로 공개했습니다. 4B 모델이 262K 컨텍스트와 멀티모달을 지원하며 8GB VRAM으로 구동됩니다. 9B 모델은 자신보다 13배 큰 GPT-OSS-120B를 다수 벤치마크에서 능가합니다."
sources: ["https://venturebeat.com/technology/alibabas-small-open-source-qwen3-5-9b-beats-openais-gpt-oss-120b-and-can-run", "https://venturebeat.com/technology/alibabas-new-open-source-qwen3-5-medium-models-offer-sonnet-4-5-performance", "https://officechai.com/ai/alibaba-qwen-3-5-0-8b-2b-4b-9b-benchmarks/", "https://medium.com/data-science-in-your-pocket/qwen-3-5-explained-architecture-upgrades-over-qwen-3-benchmarks-and-real-world-use-cases-af38b01e9888"]
auto_generated: true
---

## 무슨 일이 있었나

Alibaba Cloud가 **Qwen 3.5 Small 시리즈**를 오픈소스로 공개했습니다. 0.8B, 2B, 4B, 9B 네 가지 크기로, **Apache 2.0** 라이선스로 상업적 사용이 가능합니다.

Qwen 3.5 패밀리는 세 차례에 걸쳐 공개됐습니다:

1. **Flagship** (2월 16일): Qwen3.5-397B-A17B (MoE, 397B 전체 / 17B 활성 파라미터)
2. **Medium** (2월 24일): Qwen3.5-27B, 35B-A3B, 122B-A10B
3. **Small** (3월 2일): Qwen3.5-0.8B, 2B, 4B, 9B

Small 시리즈의 핵심은 **"로컬에서 돌아간다"**는 것입니다. Qwen3.5-4B는 **262,144 토큰** 컨텍스트 윈도우를 지원하면서, **8GB VRAM**이면 충분합니다. 텍스트뿐 아니라 이미지, 영상까지 처리하는 멀티모달 모델입니다. 일반 노트북에서 26만 토큰 컨텍스트의 멀티모달 AI를 구동할 수 있다는 뜻입니다.

<small>[VentureBeat — Alibaba's small, open source Qwen3.5-9B beats OpenAI's gpt-oss-120B](https://venturebeat.com/technology/alibabas-small-open-source-qwen3-5-9b-beats-openais-gpt-oss-120b-and-can-run)</small>

## 관련 소식

**Qwen3.5-9B vs GPT-OSS-120B — 13배 작은 모델의 역전**

가장 주목할 만한 결과는 Qwen3.5-9B의 벤치마크 성능입니다. **자신보다 13배 큰** OpenAI의 GPT-OSS-120B를 여러 벤치마크에서 능가했습니다.

| 벤치마크 | Qwen3.5-9B | GPT-OSS-120B | 차이 |
|----------|-----------|-------------|------|
| GPQA Diamond | **81.7** | 71.5 | +10.2 |
| HMMT Feb 2025 | **83.2** | 76.7 | +6.5 |
| MMMU-Pro | **70.1** | 59.7 | +10.4 |

GPT-5-Nano와의 비교에서도 우위를 보입니다. MMMU-Pro에서 70.1 vs 57.2, MathVision에서 78.9 vs 62.2로 큰 격차를 기록했습니다.

<small>[OfficeChai — Alibaba Releases Qwen 3.5 Small Model Series](https://officechai.com/ai/alibaba-qwen-3-5-0-8b-2b-4b-9b-benchmarks/)</small>

**Qwen3.5-4B — 가벼운 AI 에이전트의 새 기준**

4B 모델은 크기 대비 성능이 특히 돋보입니다. Video-MME(자막 포함) 벤치마크에서 **83.5**를 기록해, Google의 Gemini 2.5 Flash-Lite(74.6)를 크게 앞섰습니다. HMMT Feb 2025 수학 평가에서는 **74.0**을 기록했습니다.

이 수치의 의미는 명확합니다. 고수준 STEM 추론이 더 이상 대규모 컴퓨팅 클러스터를 필요로 하지 않는다는 것입니다. 엣지 디바이스에서의 AI 에이전트, 프라이버시가 중요한 온디바이스 AI, 비용에 민감한 프로덕션 환경에서 실질적인 선택지가 됩니다.

<small>[Medium — Qwen 3.5 Explained: Architecture and Use Cases](https://medium.com/data-science-in-your-pocket/qwen-3-5-explained-architecture-upgrades-over-qwen-3-benchmarks-and-real-world-use-cases-af38b01e9888)</small>

**Flagship Qwen 3.5 — Frontier 모델과의 비교**

Small 시리즈의 배경으로, Flagship Qwen 3.5의 frontier 모델 대비 위치도 주목할 만합니다.

| 벤치마크 | Qwen 3.5 | GPT-5.2 | Claude Opus 4.6 | Gemini 3 Pro |
|----------|---------|---------|----------------|-------------|
| AIME 2026 | 91.3 | **96.7** | 93.3 | - |
| IFBench | **76.5** | 75.4 | 58.0 | - |
| SWE-bench Verified | 76.4 | **80.0** | 80.9 | 76.2 |
| MathVision | **88.6** | 83.0 | - | 86.6 |

IFBench(지시 따르기)와 MathVision(수학적 시각 추론)에서 GPT-5.2를 앞서는 점이 눈에 띕니다. 오픈소스 모델이 특정 영역에서 클로즈드 frontier 모델을 능가하는 시대가 왔습니다.

**비용 우위**

API 가격 기준으로 Qwen 3.5는 Claude Opus 4.6보다 약 **13배 저렴**합니다. 오픈소스이므로 자체 호스팅 시 비용은 더 낮아집니다.

<small>[VentureBeat — Qwen3.5-Medium models offer Sonnet 4.5 performance](https://venturebeat.com/technology/alibabas-new-open-source-qwen3-5-medium-models-offer-sonnet-4-5-performance)</small>

## 수치로 보기

| 모델 | 파라미터 | 컨텍스트 | 최소 VRAM | 라이선스 |
|------|---------|---------|----------|---------|
| Qwen3.5-0.8B | 0.8B | 262K | ~2GB | Apache 2.0 |
| Qwen3.5-2B | 2B | 262K | ~4GB | Apache 2.0 |
| Qwen3.5-4B | 4B | 262K | ~8GB | Apache 2.0 |
| Qwen3.5-9B | 9B | 262K | ~16GB | Apache 2.0 |

| 특성 | Qwen3.5-4B |
|------|-----------|
| Video-MME (w/ subs) | 83.5 (vs Gemini Flash-Lite 74.6) |
| HMMT Feb 2025 | 74.0 |
| 멀티모달 | 텍스트 + 이미지 + 영상 |
| 지원 언어 | 201개 |

## 정리

Qwen 3.5 Small 시리즈는 "오픈소스 모델의 민주화"라는 트렌드를 가장 잘 보여주는 사례입니다. 9B 모델이 120B 모델을 이긴다는 것은 단순한 벤치마크 수치를 넘어, AI 접근성의 구조적 변화를 의미합니다.

실용적 관점에서 가장 흥미로운 건 4B 모델입니다. 8GB VRAM에서 구동되면서 262K 컨텍스트와 멀티모달을 지원한다는 것은, 일반 개발자가 노트북에서 상당한 수준의 AI 에이전트를 구축할 수 있다는 뜻입니다. 클라우드 API 의존 없이, 데이터 프라이버시를 유지하면서, 비용 부담 없이.

주의할 점도 있습니다. 벤치마크 수치가 실제 사용 경험을 완전히 반영하지는 않습니다. 특히 instruction following, 복잡한 대화 유지, edge case 처리 등에서 frontier 클로즈드 모델과의 격차는 여전히 존재할 수 있습니다. 하지만 "충분히 좋은" 수준의 로컬 AI가 가능해졌다는 것 자체가 의미 있는 변화입니다.

Apache 2.0 라이선스로 상업적 사용이 자유롭다는 점에서, 특히 비용에 민감한 스타트업이나 프라이버시가 중요한 분야(의료, 금융, 법률)에서 빠르게 채택될 것으로 보입니다.

<small>출처: [VentureBeat](https://venturebeat.com/technology/alibabas-small-open-source-qwen3-5-9b-beats-openais-gpt-oss-120b-and-can-run) · [OfficeChai](https://officechai.com/ai/alibaba-qwen-3-5-0-8b-2b-4b-9b-benchmarks/)</small>
