---
title: "nanochat — Karpathy가 보여주는 '$100으로 ChatGPT 만들기'의 전체 파이프라인"
date: 2026-03-10
model: etc
tags: [ai-news, etc, github, open-source, nanochat, karpathy, llm-training, pytorch, pretraining]
summary: "Andrej Karpathy의 nanochat은 $100, 2시간이면 GPT-2 수준의 LLM을 처음부터 훈련할 수 있는 프로젝트입니다. 토크나이저부터 사전 훈련, SFT, 평가, 채팅 UI까지 LLM의 전체 파이프라인을 하나의 코드베이스에 담았습니다. 4.6만 스타를 기록한 이 프로젝트의 구조와 LLM 훈련의 핵심 개념을 분석합니다."
sources: ["https://github.com/karpathy/nanochat"]
auto_generated: false
---

## 무슨 일이 있었나

`karpathy/nanochat`이 GitHub Trending에 올라 **45,883 스타**를 기록하고 있습니다. Andrej Karpathy — 전 OpenAI/Tesla AI 디렉터, 현재 AI 교육의 아이콘 — 가 만든 이 프로젝트는 한 줄로 요약됩니다: **"$100로 살 수 있는 최고의 ChatGPT"**.

2019년에 GPT-2를 훈련하는 데 약 $43,000이 들었습니다. nanochat은 같은 수준의 모델을 **H100 8-GPU 노드에서 약 2시간, $48**에 훈련합니다. 7년 사이에 하드웨어, 알고리즘, 데이터 파이프라인이 얼마나 발전했는지를 체감할 수 있는 프로젝트입니다.

<small>[karpathy/nanochat](https://github.com/karpathy/nanochat)</small>

## 프로젝트 구조

nanochat은 **LLM 훈련의 전체 파이프라인**을 하나의 코드베이스에 담고 있습니다. 이것이 핵심 가치입니다.

```
nanochat/
├── nanochat/               # 코어 라이브러리
│   ├── tokenizer.py        # BPE 토크나이저 (GPT-4 스타일)
│   ├── model.py            # GPT Transformer 아키텍처
│   ├── engine.py            # 훈련 엔진 (분산 훈련 지원)
│   ├── optim.py            # 옵티마이저 (AdamW, Muon)
│   └── inference.py        # KV-cache 기반 추론 엔진
├── scripts/                # 파이프라인 스크립트
│   ├── pretrain.py         # 사전 훈련
│   ├── sft.py              # Supervised Fine-Tuning
│   ├── eval.py             # 평가 (MMLU, GSM8K, ARC 등)
│   ├── chat.py             # CLI 채팅
│   └── serve.py            # 웹 UI 서버
├── tasks/                  # 평가 데이터셋 및 태스크 정의
├── runs/                   # 레퍼런스 스크립트
│   ├── speedrun/           # 최소 시간 훈련 도전
│   └── scaling_laws/       # 스케일링 법칙 실험
├── dev/                    # 유틸리티 (합성 데이터 생성 등)
└── tests/                  # 유닛 테스트
```

### 단 하나의 다이얼: `--depth`

nanochat의 가장 인상적인 설계는 **모든 하이퍼파라미터가 `--depth` 하나에서 자동 결정**된다는 것입니다.

```bash
python scripts/pretrain.py --depth 12   # GPT-2 Small (124M)
python scripts/pretrain.py --depth 24   # GPT-2 Medium (350M)
python scripts/pretrain.py --depth 36   # GPT-2 Large (774M)
python scripts/pretrain.py --depth 48   # GPT-2 XL (1.5B)
```

`--depth`(Transformer 레이어 수)를 지정하면, 모델 폭(width), 어텐션 헤드 수, 학습률, 스케줄, 배치 크기, weight decay까지 **compute-optimal한 값이 자동 계산**됩니다. Chinchilla 스케일링 법칙에 기반한 설계입니다.

> 복잡성의 적은 선택지다. nanochat은 수십 개의 하이퍼파라미터를 하나로 줄여서, "LLM 훈련"이라는 복잡한 과정을 접근 가능하게 만들었다.

## 핵심 기술 스택

### 전체 훈련 파이프라인

LLM을 처음부터 만드는 과정은 크게 네 단계입니다. nanochat은 이 전체를 다룹니다.

```
[1. 토크나이저 훈련]
    텍스트 → BPE 토큰
        ↓
[2. 사전 훈련 (Pretraining)]
    대규모 웹 텍스트로 다음 토큰 예측 학습
        ↓
[3. SFT (Supervised Fine-Tuning)]
    대화 데이터로 지시 따르기 학습
        ↓
[4. 평가 & 추론]
    MMLU, GSM8K 등으로 능력 측정 → 채팅
```

### 1단계: BPE 토크나이저

`nanochat/tokenizer.py`는 GPT-4 스타일의 **BPE(Byte Pair Encoding)** 토크나이저를 구현합니다.

BPE의 원리는 간단합니다:
1. 텍스트를 바이트 단위로 쪼갠다
2. 가장 자주 나타나는 바이트 쌍을 찾아 병합한다
3. 원하는 어휘 크기가 될 때까지 반복한다

```
"learning" → ["l", "e", "a", "r", "n", "i", "n", "g"]
           → ["le", "a", "r", "n", "i", "ng"]    (le, ng 병합)
           → ["lear", "n", "ing"]                  (lear, ing 병합)
           → ["learn", "ing"]                       (learn 병합)
```

이렇게 하면 자주 나오는 단어("the", "and")는 하나의 토큰이 되고, 드문 단어는 여러 토큰으로 분할됩니다. 바이트 수준에서 시작하므로 어떤 언어, 어떤 문자든 처리할 수 있습니다.

### 2단계: 사전 훈련

`scripts/pretrain.py`가 핵심입니다. **다음 토큰 예측(next token prediction)**이라는 단순한 목표로 모델을 훈련합니다.

```python
# 사전 훈련의 핵심 (개념적 의사 코드)
for batch in dataloader:
    input_tokens = batch[:, :-1]    # "The cat sat on the"
    target_tokens = batch[:, 1:]     # "cat sat on the mat"

    logits = model(input_tokens)     # 모델의 예측
    loss = cross_entropy(logits, target_tokens)  # 정답과 비교

    loss.backward()                  # 그래디언트 계산
    optimizer.step()                 # 파라미터 업데이트
```

nanochat은 NVIDIA의 **ClimbMix**와 **Fineweb** 데이터셋을 사용합니다. 수십억 토큰의 웹 텍스트에서 다음 단어를 예측하는 과정을 수십억 번 반복하면, 모델이 언어의 구조, 사실, 추론 능력까지 학습합니다.

### 3단계: SFT (Supervised Fine-Tuning)

사전 훈련된 모델은 텍스트를 생성할 수 있지만, **대화**를 할 줄은 모릅니다. "서울의 날씨는?"이라고 물으면 "부산의 날씨는? 대전의 날씨는?"처럼 비슷한 질문을 이어서 생성할 수 있습니다.

SFT는 "질문 → 답변" 형식의 대화 데이터로 모델을 추가 훈련합니다. 이 과정을 거치면 모델이 지시를 따르고, 대화 형식으로 응답하는 법을 배웁니다.

### 옵티마이저: AdamW와 Muon

nanochat은 두 가지 옵티마이저를 지원합니다.

**AdamW**: LLM 훈련의 표준 옵티마이저입니다. Adam에 weight decay를 올바르게 적용한 변형입니다. 안정적이고 예측 가능합니다.

**Muon**: 최근 등장한 실험적 옵티마이저로, 분산 훈련 환경에서 더 빠른 수렴을 보입니다. nanochat의 "speedrun" 기록은 대부분 Muon을 사용합니다.

### 정밀도 관리: bfloat16

nanochat은 **bfloat16**(brain floating point 16)을 기본 정밀도로 사용합니다.

| 정밀도 | 비트 수 | 범위 | 정밀도 | 용도 |
|--------|--------|------|--------|------|
| float32 | 32비트 | 넓음 | 높음 | 기본, CPU |
| float16 | 16비트 | 좁음 | 중간 | 구형 GPU |
| bfloat16 | 16비트 | 넓음 | 낮음 | H100/A100 훈련 |

bfloat16은 float32와 같은 범위(exponent bits)를 가지면서 절반의 메모리만 사용합니다. 정밀도는 떨어지지만, LLM 훈련에서는 이 수준의 정밀도면 충분합니다. 메모리와 연산 속도를 2배 절약할 수 있습니다.

## 개념 정리

### 스케일링 법칙 (Scaling Laws)

2020년 Kaplan et al.과 2022년 Hoffmann et al.(Chinchilla 논문)이 발견한 법칙입니다. **모델 크기, 데이터 양, 연산량 사이에 멱법칙(power law) 관계**가 존재한다는 것입니다.

핵심 발견:
- 모델을 2배 키우면, 데이터도 2배 늘려야 최적이다 (Chinchilla 법칙)
- 고정된 연산 예산에서, 모델 크기와 데이터 양의 최적 비율이 존재한다
- 이 관계는 놀라울 정도로 예측 가능하다

nanochat의 `--depth` 파라미터가 자동으로 하이퍼파라미터를 결정할 수 있는 것도 이 법칙 덕분입니다. 모델 크기가 정해지면, 최적의 학습률, 배치 크기, 훈련 토큰 수를 계산할 수 있습니다.

### KV Cache와 추론 효율

`nanochat/inference.py`에 구현된 추론 엔진은 **KV Cache**를 사용합니다. 토큰을 하나씩 생성할 때, 이전 토큰들의 Key/Value를 재계산하지 않고 캐시에서 가져옵니다.

```
[KV Cache 없이]
"The" → 전체 계산 → "cat"
"The cat" → 전체 재계산 → "sat"        ← 중복 계산
"The cat sat" → 전체 재계산 → "on"     ← 더 많은 중복

[KV Cache 있음]
"The" → 계산, K/V 저장 → "cat"
"cat" → 새 토큰만 계산, K/V 추가 → "sat"   ← 효율적
"sat" → 새 토큰만 계산, K/V 추가 → "on"    ← 효율적
```

### CORE 점수와 GPT-2 벤치마크

nanochat은 **CORE(DCLM Comprehensive Rating Evaluation)** 점수로 모델 성능을 측정합니다. CORE ≥ 0.2565가 "GPT-2 수준"입니다. 이 기준을 달성하기까지의 최소 시간을 경쟁하는 **리더보드**가 있어서, 훈련 최적화 기법의 발전을 추적할 수 있습니다.

최신 기록은 **1.80시간**입니다. 자동화된 연구 기법(Automated Research)으로 달성된 이 기록은, 2019년에 수일이 걸렸던 같은 작업이 2시간 이내로 줄었음을 보여줍니다.

## 정리

nanochat은 **"LLM은 어떻게 만들어지는가"**라는 질문에 대한 가장 완전한 답변입니다. 토크나이저부터 사전 훈련, SFT, 평가, 추론, 채팅 UI까지 — 전체 파이프라인을 하나의 해킹 가능한 코드베이스에 담았습니다.

Karpathy의 이전 작품들(nanoGPT, minGPT)의 연장선이지만, nanochat은 **"교육용 코드"에서 "실제로 동작하는 ChatGPT"**로 한 단계 진화했습니다. $100과 2시간이면 실제로 대화할 수 있는 모델을 만들 수 있다는 것은, LLM 기술의 접근성이 근본적으로 변했음을 의미합니다.

4.6만 스타는 "LLM을 이해하고 싶다"는 전 세계 개발자들의 갈증을 반영합니다. nanochat은 그 갈증을 해소하는 동시에, "직접 만들어보는 것"이 여전히 가장 좋은 학습법임을 증명하고 있습니다.

<small>[karpathy/nanochat](https://github.com/karpathy/nanochat)</small>
