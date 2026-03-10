---
title: "Karpathy의 autoresearch — 630줄 Python으로 GPU 한 장이 밤새 100개 실험을 돌린다"
date: 2026-03-10
model: etc
tags: [ai-news, etc, karpathy, autoresearch, open-source, agent, ml-research]
summary: "Andrej Karpathy가 autoresearch를 오픈소스로 공개했습니다. AI 에이전트가 GPU 한 장으로 자율적으로 ML 실험을 수행하는 630줄짜리 Python 프로젝트입니다. 하룻밤에 약 100개 실험을 실행하며, Shopify CEO가 내부 적용해 19% 성능 향상을 보고했습니다."
sources: ["https://github.com/karpathy/autoresearch", "https://www.marktechpost.com/2026/03/08/andrej-karpathy-open-sources-autoresearch-a-630-line-python-tool-letting-ai-agents-run-autonomous-ml-experiments-on-single-gpus/", "https://officechai.com/ai/andrej-karpathys-autoresearch-project-lets-agents-run-100-ai-research-experiments-while-you-sleep/"]
auto_generated: true
---

## 무슨 일이 있었나

Tesla의 전 AI 디렉터이자 OpenAI 공동창업자인 **Andrej Karpathy**가 3월 7일 **autoresearch**를 오픈소스로 공개했습니다. AI 에이전트가 GPU 한 장으로 밤새 자율적으로 ML(머신러닝) 실험을 수행하는 프레임워크입니다.

핵심 아이디어는 단순합니다: AI 에이전트에게 작은 LLM 학습 환경을 주고, 자율적으로 코드를 수정 → 5분간 학습 → 결과 확인 → 유지 또는 폐기를 반복하게 합니다.

```
코드 수정 → 5분 학습 → 메트릭 확인 → 개선? → 유지/폐기 → 반복
```

시간당 약 12개 실험, 하룻밤이면 **약 100개 실험**이 자동으로 실행됩니다.

<small>[karpathy/autoresearch — GitHub](https://github.com/karpathy/autoresearch)</small>

## 관련 소식

### 의도적으로 작은 코드베이스

autoresearch의 전체 코드는 **630줄**입니다. 이것은 제한이 아니라 **설계 결정**입니다.

- 전체 코드베이스가 현대 LLM의 컨텍스트 윈도우에 들어갑니다
- 에이전트가 코드 전체를 "이해"한 상태에서 수정할 수 있습니다
- 외부 의존성이 PyTorch와 소수 패키지뿐입니다
- 분산 학습, 복잡한 설정 파일 없이 **한 장의 GPU, 한 개의 파일, 한 개의 메트릭**

파일 구성도 극도로 단순합니다:
1. **고정 파일** — 프레임워크 코어
2. **도메인 파일** — AI 에이전트가 수정하는 대상
3. **마크다운 문서** — 사람이 작성하는 실험 지시서

평가 메트릭은 **validation bits per byte (val_bpb)**를 사용합니다. 어휘 크기에 의존하지 않아 다양한 실험 간 공정한 비교가 가능합니다.

<small>[MarkTechPost — Karpathy Open-Sources Autoresearch](https://www.marktechpost.com/2026/03/08/andrej-karpathy-open-sources-autoresearch-a-630-line-python-tool-letting-ai-agents-run-autonomous-ml-experiments-on-single-gpus/)</small>

### Shopify CEO, 내부 적용 후 19% 성능 향상 보고

공개 직후 Shopify CEO **Tobi Lutke**가 autoresearch를 내부 프로젝트에 적용했습니다. 에이전트가 더 작은 모델 아키텍처를 반복 최적화한 결과, validation 점수가 **19% 향상**되었습니다.

주목할 점은 에이전트가 최적화한 **작은 모델이, 수동으로 설정한 더 큰 모델의 성능을 초과**했다는 것입니다. 모델 크기를 키우는 것보다 하이퍼파라미터 탐색을 자동화하는 것이 더 효과적일 수 있음을 시사합니다.

### Karpathy의 다음 비전: SETI@home 스타일 분산 연구

Karpathy는 트위터에서 autoresearch의 다음 단계를 밝혔습니다. 단일 에이전트가 아닌 **대규모 비동기 협업 에이전트** 시스템으로, SETI@home처럼 전 세계의 GPU가 분산으로 ML 연구에 참여하는 구조입니다.

"한 명의 PhD 학생을 에뮬레이션하는 것"에서 **"분산된 연구 커뮤니티"**로의 전환을 제안하고 있습니다.

<small>[OfficeChai — Karpathy's Autoresearch](https://officechai.com/ai/andrej-karpathys-autoresearch-project-lets-agents-run-100-ai-research-experiments-while-you-sleep/)</small>

## 개념 정리

### Agentic ML Research란?

전통적인 ML 연구 워크플로:
1. 사람이 가설을 세운다
2. 사람이 코드를 수정한다
3. 학습을 실행하고 기다린다
4. 결과를 분석하고 다음 가설을 세운다

autoresearch의 Agentic 워크플로:
1. 사람이 실험 지시서(마크다운)를 작성한다
2. AI 에이전트가 가설 → 코드 수정 → 학습 → 분석을 **자율 반복**한다
3. 사람은 아침에 일어나서 결과를 확인한다

연구자의 역할이 "실험 실행"에서 **"에이전트에게 좋은 프롬프트 쓰기"**로 전환됩니다. 이것은 단순한 자동화가 아니라 ML 연구 방법론 자체의 변화입니다.

### 왜 5분 고정인가?

학습 시간을 하드웨어 성능에 관계없이 **정확히 5분**으로 고정한 이유가 있습니다:
- A100에서든 RTX 4090에서든 동일한 실험 리듬 유지
- 시간당 12개 실험이라는 **예측 가능한 처리량** 확보
- 짧은 실험으로 에이전트가 빠르게 피드백을 받고 방향 수정 가능
- 한 번의 실험 실패가 전체 연구 시간의 극소 부분만 차지

## 수치로 보기

| 항목 | 수치 |
|------|------|
| 코드베이스 크기 | 630줄 |
| 실험 소요 시간 | 5분/건 (고정) |
| 시간당 실험 수 | ~12건 |
| 하룻밤 실험 수 | ~100건 |
| 필요 GPU | 1장 |
| Shopify 내부 적용 성능 향상 | 19% |
| GitHub 스타 (3일 만) | 8,700+ |

## 정리

autoresearch는 "AI가 AI 연구를 한다"는 개념을 630줄의 실용적인 코드로 증명했습니다.

**가장 인상적인 것은 단순함입니다.** 분산 학습 클러스터도, 복잡한 설정도, 거대한 코드베이스도 필요 없습니다. GPU 한 장, Python 파일 하나, 마크다운 지시서 하나면 됩니다. 이 단순함이 Shopify CEO부터 개인 연구자까지 즉시 적용할 수 있게 만든 힘입니다.

Karpathy가 제안하는 SETI@home 스타일의 분산 연구는 아직 비전 단계이지만, 방향성은 명확합니다. ML 연구의 미래는 소수의 대형 연구소가 거대 클러스터를 독점하는 것이 아니라, **수많은 작은 GPU가 에이전트를 통해 협업하는 것**일 수 있습니다.

개발자에게 가장 실용적인 시사점은 이것입니다: 하이퍼파라미터 튜닝이나 아키텍처 탐색에 시간을 쓰고 있다면, autoresearch 같은 에이전트에 맡기고 잠을 자는 것이 더 나은 선택일 수 있습니다.
