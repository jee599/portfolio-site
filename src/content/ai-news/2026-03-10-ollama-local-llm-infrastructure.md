---
title: "Ollama — Go로 만든 로컬 LLM 인프라가 16만 스타를 찍기까지"
date: 2026-03-10
model: etc
tags: [ai-news, etc, github, open-source, ollama, llm, local-ai, go, quantization]
summary: "Ollama는 Go로 작성된 로컬 LLM 실행 도구로, 2026년 3월 기준 GitHub 16만 스타를 돌파했습니다. 단순한 CLI 래퍼가 아니라, GGUF 모델 포맷 위에 자체 모델 레지스트리와 REST API 서버를 올린 완전한 로컬 AI 인프라입니다. 이 글에서는 Ollama의 프로젝트 구조, 핵심 기술, 그리고 로컬 LLM을 이해하기 위한 기반 지식까지 다룹니다."
sources: ["https://github.com/ollama/ollama"]
auto_generated: false
---

## 무슨 일이 있었나

`ollama/ollama`가 2026년 3월 기준 **164,678 스타**를 기록했습니다. Go 언어로 작성된 프로젝트 중에서는 단연 1위이고, AI 카테고리 전체에서도 Transformers와 함께 최상위를 차지하고 있습니다.

Ollama의 핵심 가치는 단 하나입니다. **로컬에서 LLM을 실행하는 것을 극도로 쉽게 만드는 것**. `ollama run llama3`라는 한 줄 명령어로 모델 다운로드부터 실행까지 완료됩니다. Docker가 컨테이너를 대중화한 것처럼, Ollama는 로컬 LLM을 대중화했습니다.

<small>[ollama/ollama](https://github.com/ollama/ollama)</small>

## 프로젝트 구조

Ollama는 단순한 CLI 도구가 아닙니다. 내부적으로는 꽤 정교한 구조를 가지고 있습니다.

```
ollama/
├── cmd/            # CLI 엔트리포인트 (cobra 기반)
├── server/         # REST API 서버 (gin 프레임워크)
│   ├── routes.go   # /api/generate, /api/chat 등 엔드포인트
│   ├── sched.go    # GPU 스케줄링, 모델 로딩 관리
│   └── model.go    # 모델 레지스트리, Modelfile 파싱
├── llama/          # llama.cpp CGo 바인딩
├── gpu/            # GPU 감지 및 메모리 관리
│   ├── cuda.go     # NVIDIA CUDA 지원
│   ├── rocm.go     # AMD ROCm 지원
│   └── metal.go    # Apple Metal 지원
├── format/         # GGUF 파일 포맷 처리
├── api/            # Go 클라이언트 라이브러리
└── Modelfile       # Dockerfile과 유사한 모델 정의 파일
```

핵심은 세 가지 레이어로 나뉩니다.

**1. CLI 레이어** — `cmd/` 디렉토리. Go의 `cobra` 라이브러리를 사용해 `run`, `pull`, `push`, `list` 등의 서브커맨드를 정의합니다. CLI는 내부적으로 REST API 서버와 통신합니다. `ollama run`을 실행하면, 먼저 백그라운드에서 API 서버가 뜨고, 그 서버에 요청을 보내는 구조입니다.

**2. API 서버 레이어** — `server/` 디렉토리. Go의 `gin` 프레임워크로 구현된 HTTP 서버가 핵심입니다. `/api/generate`, `/api/chat`, `/api/embeddings` 등의 엔드포인트를 제공합니다. 중요한 건 **OpenAI API와 호환되는 엔드포인트**(`/v1/chat/completions`)도 제공한다는 점입니다. 이 덕분에 OpenAI SDK를 사용하는 기존 코드를 URL만 바꿔서 Ollama로 전환할 수 있습니다.

**3. 추론 엔진 레이어** — `llama/` 디렉토리. `llama.cpp`를 CGo를 통해 바인딩합니다. Go로 작성된 나머지 코드와 C/C++로 작성된 추론 엔진을 연결하는 역할입니다. GPU 가속은 `gpu/` 디렉토리에서 CUDA, ROCm, Metal을 각각 감지하고 적절한 백엔드를 선택합니다.

<small>[Ollama Architecture Discussion](https://github.com/ollama/ollama/blob/main/docs/development.md)</small>

## 핵심 기술 스택

### Go + CGo 하이브리드 아키텍처

Ollama가 Go를 선택한 이유는 명확합니다. **크로스 플랫폼 빌드가 쉽고, 단일 바이너리로 배포할 수 있기 때문**입니다. Python 기반 도구들은 의존성 설치가 복잡하지만, Ollama는 하나의 바이너리만 다운로드하면 됩니다.

하지만 LLM 추론은 C/C++로 구현된 `llama.cpp`가 담당합니다. Go와 C를 연결하는 CGo 바인딩이 이 간극을 메웁니다. 이 구조 덕분에 "Go의 배포 편의성 + C의 성능"을 동시에 확보할 수 있었습니다.

### llama.cpp 기반 추론

`llama.cpp`는 Georgi Gerganov가 만든 C/C++ LLM 추론 라이브러리입니다. GGUF 포맷의 양자화 모델을 CPU와 GPU에서 효율적으로 실행하는 것에 특화되어 있습니다. Ollama는 이 라이브러리를 내장하고, 그 위에 모델 관리와 API 서버를 얹은 것입니다.

### Modelfile — 모델의 Dockerfile

```dockerfile
FROM llama3
PARAMETER temperature 0.7
PARAMETER num_ctx 4096
SYSTEM "You are a helpful coding assistant."
```

`Modelfile`은 Docker의 `Dockerfile`에서 영감을 받은 선언적 모델 정의 파일입니다. 베이스 모델 위에 시스템 프롬프트, 파라미터, 어댑터(LoRA)를 올려서 커스텀 모델을 만들 수 있습니다. 이 모델은 `ollama push`로 Ollama 레지스트리에 공유할 수 있습니다.

### GPU 자동 감지 및 스케줄링

`server/sched.go`에 구현된 스케줄러는 사용 가능한 GPU 메모리를 확인하고, 모델을 GPU에 로드할 수 있는지 판단합니다. 모델이 GPU 메모리보다 크면 일부 레이어만 GPU에 올리고 나머지는 CPU에서 실행하는 **부분 오프로딩**을 자동으로 수행합니다.

## 개념 정리

### 양자화(Quantization)란

LLM의 파라미터는 원래 FP16(16비트 부동소수점)이나 FP32(32비트)로 저장됩니다. 양자화는 이 파라미터를 더 적은 비트(4비트, 5비트 등)로 변환하는 과정입니다. 정밀도는 약간 떨어지지만, 모델 크기와 메모리 사용량이 크게 줄어듭니다.

| 양자화 수준 | 비트 수 | 용량 (7B 모델 기준) | 품질 |
|-----------|--------|-------------------|------|
| FP16 | 16비트 | ~14GB | 원본 |
| Q8_0 | 8비트 | ~7GB | 거의 원본 수준 |
| Q5_K_M | 5비트 | ~5GB | 미세한 품질 저하 |
| Q4_K_M | 4비트 | ~4GB | 일상 사용 충분 |
| Q2_K | 2비트 | ~2.5GB | 품질 저하 체감 |

Ollama에서 `ollama run llama3`를 실행하면 기본적으로 `Q4_K_M` 양자화 버전을 다운로드합니다. 대부분의 사용 사례에서 4비트 양자화는 원본 대비 체감 차이가 크지 않습니다.

### GGUF 포맷

GGUF(GPT-Generated Unified Format)는 `llama.cpp`가 사용하는 모델 파일 포맷입니다. 이전의 GGML 포맷을 대체하며, 모델 메타데이터(아키텍처, 토크나이저 정보, 양자화 방식 등)를 파일 헤더에 포함합니다. 단일 파일에 모델의 모든 정보가 들어있어서 배포와 관리가 편리합니다.

### KV Cache와 컨텍스트 윈도우

LLM이 텍스트를 생성할 때, 이전 토큰들의 Key-Value 쌍을 메모리에 저장합니다. 이것이 KV Cache입니다. 컨텍스트 윈도우가 클수록(예: 4K → 128K) KV Cache가 더 많은 메모리를 차지합니다.

Ollama에서 `num_ctx` 파라미터로 컨텍스트 크기를 조절할 수 있습니다. 로컬 환경에서는 GPU 메모리가 제한적이므로, 모델 크기와 컨텍스트 크기 사이에서 트레이드오프가 발생합니다.

> 8GB VRAM 기준, 7B Q4 모델에 4K 컨텍스트가 일반적인 설정입니다. 컨텍스트를 32K로 늘리면 모델 일부가 CPU로 오프로드되어 속도가 크게 저하됩니다.

## 정리

Ollama가 16만 스타를 달성한 이유는 기술적 우수성만이 아닙니다. **"복잡한 것을 단순하게 만드는 능력"**이 핵심입니다.

기존에 로컬 LLM을 실행하려면 Python 환경 설정, CUDA 드라이버 확인, 모델 다운로드, 양자화 변환, 서버 설정 등 수많은 단계를 거쳐야 했습니다. Ollama는 이 모든 과정을 `ollama run` 한 줄로 추상화했습니다.

Go 단일 바이너리 배포, Docker 스타일의 Modelfile, OpenAI 호환 API — 이 세 가지 설계 결정이 Ollama를 "개발자를 위한 도구"에서 "모든 사용자를 위한 인프라"로 끌어올렸습니다.

로컬 AI 인프라의 중요성은 앞으로 더 커질 것으로 보입니다. 프라이버시, 비용, 지연시간이라는 세 가지 문제를 동시에 해결할 수 있는 유일한 방법이기 때문입니다. Ollama는 그 중심에 서 있습니다.

<small>[ollama/ollama](https://github.com/ollama/ollama)</small>
