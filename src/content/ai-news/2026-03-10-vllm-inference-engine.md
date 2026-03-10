---
title: "vLLM — PagedAttention으로 LLM 추론 성능을 2~4배 끌어올린 서빙 엔진"
date: 2026-03-10
model: etc
tags: [ai-news, etc, github, open-source, vllm, llm, inference, cuda, performance]
summary: "vLLM은 UC Berkeley에서 시작된 고성능 LLM 추론 및 서빙 엔진입니다. PagedAttention이라는 혁신적인 메모리 관리 기법을 도입해 기존 대비 2~4배 높은 처리량을 달성했습니다. 7만 스타를 넘긴 이 프로젝트의 아키텍처와 핵심 기술을 분석합니다."
sources: ["https://github.com/vllm-project/vllm"]
auto_generated: false
---

## 무슨 일이 있었나

`vllm-project/vllm`이 2026년 3월 기준 **72,632 스타**를 기록했습니다. LLM 추론 엔진 카테고리에서는 사실상 표준(de facto standard)이 되었습니다. HuggingFace, Anyscale, AWS, 그리고 수많은 스타트업들이 프로덕션 LLM 서빙에 vLLM을 사용하고 있습니다.

vLLM의 가치는 명확합니다. **같은 GPU로 더 많은 요청을 처리할 수 있게 해줍니다.** GPU는 비싸고, LLM 추론은 메모리를 많이 먹습니다. vLLM은 메모리 효율을 극대화해서 비용을 절감합니다.

<small>[vllm-project/vllm](https://github.com/vllm-project/vllm)</small>

## 프로젝트 구조

vLLM은 Python으로 작성되었지만, 성능 크리티컬한 부분은 CUDA C++와 Triton 커널로 구현되어 있습니다.

```
vllm/
├── vllm/
│   ├── engine/             # 추론 엔진 코어
│   │   ├── async_llm_engine.py  # 비동기 엔진 (API 서버용)
│   │   └── llm_engine.py        # 동기 엔진 (배치 추론용)
│   ├── worker/             # GPU 워커 프로세스
│   │   └── worker.py       # 모델 실행, KV Cache 관리
│   ├── model_executor/     # 모델 실행 백엔드
│   │   ├── models/         # 모델별 구현 (LLaMA, GPT, Mistral 등)
│   │   └── layers/         # 커스텀 레이어 (Attention, Linear 등)
│   ├── attention/          # PagedAttention 구현
│   │   └── backends/       # FlashAttention, FlashInfer 등 백엔드
│   ├── core/               # 스케줄러, 블록 매니저
│   │   ├── scheduler.py    # 요청 스케줄링
│   │   └── block_manager.py # 물리적/논리적 블록 매핑
│   ├── entrypoints/        # API 서버, CLI
│   │   └── openai/         # OpenAI 호환 API
│   └── _custom_ops/        # CUDA/Triton 커스텀 커널
├── csrc/                   # C++/CUDA 확장
│   ├── attention/          # PagedAttention CUDA 커널
│   └── quantization/       # 양자화 커널 (GPTQ, AWQ, SqueezeLLM)
└── benchmarks/             # 성능 벤치마크
```

핵심 구성 요소는 네 가지입니다.

**1. 엔진(Engine)** — 전체 추론 파이프라인을 관리합니다. 요청을 받고, 스케줄러에게 실행 순서를 결정하게 하고, 워커에게 실제 실행을 위임합니다.

**2. 스케줄러(Scheduler)** — `core/scheduler.py`에 구현되어 있습니다. continuous batching을 구현하는 핵심 컴포넌트입니다. 어떤 요청을 언제 실행할지, preemption(선점)이 필요한지 등을 결정합니다.

**3. 블록 매니저(Block Manager)** — `core/block_manager.py`. PagedAttention의 핵심인 물리적/논리적 블록 매핑을 관리합니다. OS의 가상 메모리 시스템과 유사한 역할입니다.

**4. 모델 실행기(Model Executor)** — 실제로 모델을 GPU에 올리고 forward pass를 실행합니다. 텐서 병렬(tensor parallelism)과 파이프라인 병렬(pipeline parallelism)을 지원합니다.

<small>[vLLM Paper - Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180)</small>

## 핵심 기술 스택

### PagedAttention — OS 가상 메모리에서 영감

PagedAttention은 vLLM의 핵심 혁신입니다. OS의 가상 메모리(virtual memory) 개념을 KV Cache 관리에 적용했습니다.

기존 방식에서는 각 요청에 대해 **최대 시퀀스 길이만큼의 KV Cache 메모리를 미리 할당**했습니다. 2048 토큰 길이의 요청이 들어오면, 실제로 10 토큰만 생성하더라도 2048 토큰분의 메모리가 점유됩니다. 이 **내부 단편화(internal fragmentation)** 때문에 GPU 메모리의 60~80%가 낭비되었습니다.

PagedAttention은 KV Cache를 고정 크기의 **블록(page)**으로 나눕니다. 토큰이 생성될 때마다 필요한 만큼만 블록을 할당합니다. 물리적 블록과 논리적 블록을 분리해서, 연속되지 않은 물리적 메모리도 논리적으로 연속된 것처럼 사용할 수 있습니다.

```
[기존 방식]
요청 A: [████████░░░░░░░░] ← 절반이 낭비
요청 B: [██░░░░░░░░░░░░░░] ← 대부분 낭비

[PagedAttention]
요청 A: [████][████]              ← 필요한 만큼만 할당
요청 B: [██]                      ← 필요한 만큼만 할당
빈 블록: [    ][    ][    ][    ]  ← 다른 요청에 사용 가능
```

이 방식으로 메모리 낭비를 거의 0에 가깝게 줄이고, 같은 GPU에서 더 많은 동시 요청을 처리할 수 있습니다.

### Continuous Batching

전통적인 배치 추론은 **static batching**입니다. 배치 내 모든 요청이 끝날 때까지 기다린 후 다음 배치를 처리합니다. 짧은 응답이 끝나도 긴 응답이 끝날 때까지 GPU가 놀게 됩니다.

vLLM은 **continuous batching(iteration-level scheduling)**을 구현합니다. 매 토큰 생성 단계(iteration)마다 완료된 요청을 빼고 새 요청을 넣습니다. GPU가 쉬는 시간이 최소화됩니다.

### Tensor Parallelism

대형 모델(70B, 405B 등)은 단일 GPU에 올라가지 않습니다. vLLM은 여러 GPU에 모델을 나눠 올리는 텐서 병렬을 지원합니다. `--tensor-parallel-size 4`로 실행하면 4개 GPU에 모델이 분산됩니다.

내부적으로는 NCCL(NVIDIA Collective Communications Library)을 사용해 GPU 간 통신을 처리합니다. Megatron-LM 스타일의 column/row parallelism을 적용합니다.

## 개념 정리

### KV Cache가 왜 병목인가

Transformer의 Self-Attention은 매 토큰 생성 시 이전 모든 토큰의 Key와 Value를 참조합니다. 이미 계산된 K, V 값을 다시 계산하지 않으려면 메모리에 저장해야 합니다. 이것이 KV Cache입니다.

문제는 KV Cache의 크기입니다. 예를 들어 LLaMA-2 70B 모델에서:
- 레이어 수: 80
- 어텐션 헤드 수: 64
- 헤드 차원: 128
- 시퀀스 길이: 4096
- 정밀도: FP16 (2바이트)

KV Cache 크기 = 2(K+V) × 80 × 64 × 128 × 4096 × 2바이트 ≈ **10GB (단일 요청)**

동시 요청이 10개면 KV Cache만 100GB입니다. A100 80GB GPU 하나로는 감당이 안 됩니다. 이것이 PagedAttention 같은 메모리 최적화가 절실한 이유입니다.

### Prefill vs Decode

LLM 추론은 두 단계로 나뉩니다.

**Prefill(프리필)**: 입력 프롬프트의 모든 토큰을 한꺼번에 처리합니다. 행렬 곱셈이 대부분이라 **compute-bound**(연산 제한)입니다. GPU를 최대한 활용할 수 있습니다.

**Decode(디코드)**: 한 번에 하나의 토큰을 생성합니다. KV Cache에서 값을 읽는 것이 대부분이라 **memory-bound**(메모리 제한)입니다. GPU 연산 능력은 남지만 메모리 대역폭이 병목입니다.

vLLM의 최적화는 주로 디코드 단계에 집중되어 있습니다. 메모리 효율을 높이면 더 많은 동시 요청을 배치에 넣을 수 있고, 이는 GPU 활용도를 높입니다.

### Speculative Decoding

vLLM은 **추측 디코딩(speculative decoding)**도 지원합니다. 작은 모델(draft model)이 먼저 여러 토큰을 빠르게 생성하고, 큰 모델(target model)이 이를 한꺼번에 검증하는 방식입니다. 검증에서 거부된 토큰만 다시 생성합니다. 수학적으로 출력 분포가 동일하면서도 속도가 2~3배 빨라질 수 있습니다.

## 정리

vLLM이 LLM 서빙의 표준이 된 이유는 **"같은 하드웨어로 더 많은 일을 하게 해주기 때문"**입니다. GPU는 비용의 대부분을 차지하는 자원이고, 그 자원의 활용 효율이 곧 서비스 비용을 결정합니다.

PagedAttention이라는 하나의 아이디어가 만든 차이는 압도적입니다. OS에서 수십 년간 쓰인 가상 메모리 기법을 GPU 메모리 관리에 적용했을 뿐인데, 처리량이 2~4배 향상되었습니다.

LLM을 프로덕션에 서빙해야 하는 모든 팀에게 vLLM은 사실상 필수 도구입니다. Ollama가 "로컬에서 쉽게 돌리기"라면, vLLM은 "서버에서 효율적으로 서빙하기"를 담당합니다. 두 프로젝트는 로컬과 클라우드라는 서로 다른 축에서 LLM 인프라의 양대 축을 이루고 있습니다.

<small>[vllm-project/vllm](https://github.com/vllm-project/vllm)</small>
