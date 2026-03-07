---
title: "GLM-5, NVIDIA 없이 오픈소스 1위 달성 — Phi-4, Qwen3.5까지, 오픈소스 LLM 경쟁이 뜨겁다"
date: 2026-03-07
model: etc
tags: [ai-news, open-source, glm-5, phi-4, qwen, llm]
summary: "Zhipu AI의 GLM-5가 Huawei 칩만으로 훈련해 SWE-bench 오픈소스 1위를 기록했습니다. Microsoft는 15B 멀티모달 모델 Phi-4를, Alibaba는 Qwen3.5를 공개했습니다. 오픈소스 LLM 경쟁이 새로운 국면에 진입했습니다."
sources: ["https://www.buildfastwithai.com/blogs/glm-5-released-open-source-model-2026", "https://siliconangle.com/2026/03/04/microsoft-open-sources-multimodal-reasoning-model-15b-parameters/"]
auto_generated: true
---

## 무슨 일이 있었나

오픈소스 LLM 진영에서 한 주 만에 세 가지 주요 모델이 공개됐습니다.

### GLM-5 — MIT 라이센스, NVIDIA 없이 훈련

중국 Zhipu AI가 **GLM-5**를 **MIT 라이센스**로 공개했습니다.

- **744B 파라미터** (40B active, MoE 구조)
- **SWE-bench Verified 77.8%** — 오픈소스 모델 중 1위
- **Huawei Ascend 칩**으로만 훈련 (NVIDIA GPU 미사용)
- **API 가격**: $1.00/1M input, $3.20/1M output

<small>[BuildFast — GLM-5 Released: 744B Open-Source Model](https://www.buildfastwithai.com/blogs/glm-5-released-open-source-model-2026)</small>

### Phi-4-Reasoning-Vision-15B — 작지만 강한 멀티모달

Microsoft가 **Phi-4-reasoning-vision-15B**를 오픈소스로 공개했습니다.

- **15B 파라미터** — consumer GPU에서 로컬 실행 가능 (RTX 4090, M4 Max MacBook 등)
- **멀티모달 reasoning** — 이미지를 보고 논리적으로 추론
- **Adaptive chain-of-thought** — 간단한 질문에는 바로 답하고, 복잡한 문제에만 step-by-step 추론을 자동 활성화
- **240 NVIDIA B200 GPU, 4일 훈련** — 극적인 훈련 효율성

<small>[SiliconANGLE — Microsoft open-sources multimodal reasoning model](https://siliconangle.com/2026/03/04/microsoft-open-sources-multimodal-reasoning-model-15b-parameters/)</small>

### Qwen3.5-397B-A17B — Alibaba의 최신 플래그십

Alibaba가 **Qwen3.5-397B-A17B**를 공개했습니다.

- **397B 파라미터** (17B active, MoE 구조)
- 멀티모달 추론 + 초장문 컨텍스트 지원
- 이전 세대 대비 디코딩 처리량 **8.6x~19x** 향상

## 관련 소식

**GitHub 트렌딩에서 AI/LLM 프로젝트가 상위 독식**

오픈소스 LLM 생태계를 보여주는 지표로, 이번 주 GitHub 트렌딩 상위에 AI 관련 프로젝트가 대거 포진해 있습니다.

| 프로젝트 | Stars | 설명 |
|----------|-------|------|
| [ollama/ollama](https://github.com/ollama/ollama) | 164K+ | LLM 로컬 실행 도구. GLM-5, DeepSeek, Qwen 등 지원 |
| [langgenius/dify](https://github.com/langgenius/dify) | 131K+ | Agentic workflow 빌더 |
| [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl) | 89K+ | 웹 → LLM-ready markdown 변환 |
| [vllm-project/vllm](https://github.com/vllm-project/vllm) | 72K+ | LLM 서빙 엔진 (프로덕션 표준) |
| [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | 68K+ | AI 기반 소프트웨어 개발 플랫폼 |

**미국 칩 규제의 역설**

GLM-5가 NVIDIA 없이 Huawei Ascend 칩만으로 frontier급 성능을 달성한 것은, 미국의 대중국 AI 칩 수출 규제가 의도하지 않은 결과를 낳고 있다는 증거입니다. 단기적으로는 개발 속도를 늦췄을 수 있지만, 장기적으로는 대안 하드웨어 기반의 독자 생태계를 가속화하는 결과로 이어지고 있습니다.

## 수치로 보기

| 모델 | 파라미터 | Active | SWE-bench | 라이센스 |
|------|----------|--------|-----------|----------|
| GLM-5 | 744B | 40B | 77.8% | MIT |
| Phi-4-Vision | 15B | 15B | — | 오픈소스 |
| Qwen3.5 | 397B | 17B | — | 오픈소스 |

| 항목 | 수치 |
|------|------|
| GLM-5 API (input) | $1.00 / 1M tokens |
| GLM-5 API (output) | $3.20 / 1M tokens |
| Phi-4 훈련 기간 | 4일 (240x B200 GPU) |
| Qwen3.5 처리량 향상 | 8.6x ~ 19x |

## 정리

오픈소스 LLM 경쟁이 새로운 국면에 들어서고 있습니다.

**GLM-5**는 두 가지 면에서 의미가 있습니다. 첫째, NVIDIA 독점 체제에 대한 실질적인 대안이 존재한다는 것을 보여줬습니다. 둘째, MIT 라이센스로 상업적 사용에 아무 제한이 없습니다. Meta의 Llama가 열었던 오픈소스 시장에 강력한 경쟁자가 추가된 셈입니다.

**Phi-4**의 adaptive chain-of-thought도 주목할 만합니다. 모든 질문에 길게 사고하는 기존 reasoning 모델의 비효율을 해결하는 접근입니다. 이 기법이 범용 모델에 적용되면, 추론 비용과 지연 시간을 크게 줄일 수 있습니다. 그리고 15B 규모이기 때문에 개인 개발자나 소규모 팀이 로컬에서 바로 활용할 수 있다는 점이 실용적입니다.

전체적으로, "크고 비싼 모델이 최고"라는 공식이 점점 무너지고 있습니다. 오픈소스 진영은 MoE 아키텍처를 통해 큰 모델을 효율적으로 돌리거나, 작지만 강한 모델로 실질적인 접근성을 높이는 두 가지 전략을 동시에 추구하고 있습니다.

<small>출처: [BuildFast](https://www.buildfastwithai.com/blogs/glm-5-released-open-source-model-2026) · [SiliconANGLE](https://siliconangle.com/2026/03/04/microsoft-open-sources-multimodal-reasoning-model-15b-parameters/)</small>
