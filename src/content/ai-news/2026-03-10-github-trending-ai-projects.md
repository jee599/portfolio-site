---
title: "2026년 3월, GitHub에서 별이 쏟아지는 AI 프로젝트 15선 — Ollama 16만, Dify 13만 돌파"
date: 2026-03-10
model: etc
tags: [ai-news, etc, github, open-source, trending, llm, agent, rag]
summary: "2026년 3월 기준 GitHub에서 가장 많은 별을 받은 AI/LLM 프로젝트 15개를 분석했습니다. Ollama가 16만 스타를 돌파하며 로컬 AI의 대중화를 이끌고 있고, AI 에이전트 프레임워크가 전체 상위권을 장악하고 있습니다."
sources: ["https://github.com/ollama/ollama", "https://github.com/langgenius/dify", "https://github.com/langchain-ai/langchain", "https://github.com/open-webui/open-webui", "https://github.com/browser-use/browser-use", "https://github.com/firecrawl/firecrawl", "https://github.com/langflow-ai/langflow", "https://github.com/vllm-project/vllm", "https://github.com/infiniflow/ragflow", "https://github.com/OpenHands/OpenHands"]
auto_generated: false
---

## 무슨 일이 있었나

2026년 3월 기준, GitHub의 AI/LLM 관련 프로젝트들이 폭발적인 성장세를 보이고 있습니다. 불과 1년 전만 해도 10만 스타를 넘기는 AI 프로젝트는 손에 꼽았지만, 지금은 **10만 스타 이상 프로젝트가 6개**에 달합니다. 특히 눈에 띄는 건 AI 에이전트 플랫폼과 로컬 AI 인프라의 성장입니다.

이번 글에서는 최근 1주일 내 활발하게 업데이트된 프로젝트 중, 별이 가장 많은 15개를 골라 분석했습니다.

<small>[GitHub Search API](https://docs.github.com/en/rest/search)</small>

## 별이 가장 많은 AI 프로젝트 TOP 15

| 순위 | 프로젝트 | 스타 | 언어 | 카테고리 |
|------|---------|------|------|---------|
| 1 | **Ollama** | 164,678 | Go | 로컬 LLM 실행 |
| 2 | **Transformers** | 157,669 | Python | 모델 프레임워크 |
| 3 | **Langflow** | 145,450 | Python | 에이전트 워크플로 빌더 |
| 4 | **Dify** | 131,812 | TypeScript | 에이전트 플랫폼 |
| 5 | **LangChain** | 128,875 | Python | 에이전트 프레임워크 |
| 6 | **Open WebUI** | 126,446 | Python | AI 인터페이스 |
| 7 | **Generative AI for Beginners** | 107,742 | Notebook | 교육 |
| 8 | **awesome-llm-apps** | 101,202 | Python | 앱 컬렉션 |
| 9 | **Gemini CLI** | 97,054 | TypeScript | CLI 에이전트 |
| 10 | **Firecrawl** | 90,284 | TypeScript | 웹 데이터 API |
| 11 | **LLMs-from-scratch** | 87,547 | Notebook | 교육 |
| 12 | **Browser Use** | 80,051 | Python | 브라우저 에이전트 |
| 13 | **RAGFlow** | 74,589 | Python | RAG 엔진 |
| 14 | **LobeHub** | 73,353 | TypeScript | AI 워크스페이스 |
| 15 | **vLLM** | 72,632 | Python | 추론 엔진 |

## 관련 소식

### Ollama — 로컬 AI의 절대강자, 16만 스타

`ollama/ollama`가 **164,678 스타**를 기록하며 AI 카테고리 1위를 굳히고 있습니다. Go로 작성된 이 프로젝트는 Kimi-K2.5, GLM-5, DeepSeek, Qwen 등 최신 모델을 로컬에서 한 줄 명령어로 실행할 수 있게 해줍니다.

Ollama의 성공 요인은 명확합니다:
- **극도의 단순함**: `ollama run llama3` 한 줄이면 끝
- **빠른 모델 추가**: 새 오픈소스 모델이 나오면 며칠 내 지원
- **API 호환성**: OpenAI API 포맷을 지원해서 기존 도구와 바로 연동

> 복잡한 설정 없이 AI를 로컬에서 돌릴 수 있다는 것 — 이것이 16만 스타의 본질입니다.

<small>[ollama/ollama](https://github.com/ollama/ollama)</small>

### AI 에이전트 프레임워크의 3파전

**Langflow**(145K), **Dify**(131K), **LangChain**(128K)이 에이전트 플랫폼 영역에서 치열한 경쟁을 벌이고 있습니다.

**Langflow**는 시각적 워크플로 빌더로, 코드 없이 AI 에이전트를 조합할 수 있는 것이 강점입니다. 최근 145K 스타를 달성하며 LangChain을 추월했습니다.

**Dify**는 프로덕션 레벨의 에이전트 플랫폼을 지향합니다. TypeScript 기반으로, RAG, 도구 호출, 워크플로를 통합 제공합니다. 중국 시장에서의 강력한 지지가 성장을 견인하고 있습니다.

**LangChain**은 "에이전트 엔지니어링 플랫폼"으로 리브랜딩하며 단순 체이닝 프레임워크에서 벗어나고 있습니다. LangGraph(25K 스타)와 함께 상태 기반 에이전트 아키텍처를 밀고 있습니다.

<small>[langflow-ai/langflow](https://github.com/langflow-ai/langflow) · [langgenius/dify](https://github.com/langgenius/dify) · [langchain-ai/langchain](https://github.com/langchain-ai/langchain)</small>

### Browser Use — 브라우저 자동화의 새 패러다임

`browser-use/browser-use`가 **80,051 스타**를 기록했습니다. AI 에이전트가 웹 브라우저를 직접 조작할 수 있게 해주는 프로젝트로, Selenium이나 Playwright 위에 LLM 레이어를 얹은 구조입니다.

실제 사용 사례:
- 특정 웹사이트에서 데이터를 자동으로 수집
- 반복적인 폼 입력, 예약, 주문 자동화
- QA 테스트 자동화

<small>[browser-use/browser-use](https://github.com/browser-use/browser-use)</small>

### Firecrawl — AI를 위한 웹 데이터 API

`firecrawl/firecrawl`이 **90,284 스타**로 급성장했습니다. 웹사이트 전체를 LLM이 읽을 수 있는 마크다운으로 변환해주는 API입니다. RAG 파이프라인에서 웹 데이터를 가져올 때 필수 도구로 자리잡고 있습니다.

TypeScript로 작성되어 있고, 셀프 호스팅도 가능합니다. 웹 크롤링 → 마크다운 변환 → LLM 피드라는 파이프라인이 이제 표준이 되어가고 있음을 보여주는 프로젝트입니다.

<small>[firecrawl/firecrawl](https://github.com/firecrawl/firecrawl)</small>

### Gemini CLI — Google의 터미널 에이전트

`google-gemini/gemini-cli`가 **97,054 스타**를 기록하며 CLI 에이전트 카테고리를 선점했습니다. Google이 공식으로 내놓은 오픈소스 터미널 AI 에이전트로, Gemini 모델의 파워를 터미널에서 바로 쓸 수 있습니다.

Anthropic의 Claude Code, OpenAI의 Codex CLI와 함께 "터미널 AI 에이전트 3강" 구도를 형성하고 있습니다.

<small>[google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)</small>

## 수치로 보기

### 카테고리별 분포

| 카테고리 | 프로젝트 수 | 대표 프로젝트 | 평균 스타 |
|---------|-----------|-------------|----------|
| 에이전트/워크플로 | 5 | Langflow, Dify, LangChain | 115K |
| 로컬 AI 인프라 | 3 | Ollama, Open WebUI, vLLM | 121K |
| 웹/브라우저 AI | 2 | Browser Use, Firecrawl | 85K |
| RAG | 2 | RAGFlow, Haystack | 50K |
| 교육/컬렉션 | 3 | Gen AI Beginners, LLM-from-scratch | 99K |

### 언어별 분포

- **Python**: 8개 (53%) — 여전히 AI 생태계의 기본 언어
- **TypeScript**: 4개 (27%) — 프로덕션 플랫폼에서 강세
- **Go**: 1개 (7%) — Ollama가 유일하지만 1위
- **기타**: 2개 (13%) — Notebook, HTML

### 2025년 대비 성장률

주목할 만한 성장을 보인 프로젝트:
- **Langflow**: 2025년 3월 대비 **약 5배** 성장 (추정)
- **Browser Use**: 2025년 초 출시 후 **8만 스타** 달성
- **Gemini CLI**: 2025년 중반 출시 후 **9.7만 스타** 달성
- **Firecrawl**: 2025년 3월 대비 **약 3배** 성장 (추정)

## 정리

2026년 GitHub AI 프로젝트 지형에서 읽히는 세 가지 트렌드가 있습니다.

**첫째, 에이전트가 주류가 되었습니다.** TOP 15 중 5개가 에이전트/워크플로 관련 프로젝트입니다. 단순히 LLM을 호출하는 시대는 끝났고, 도구를 쓰고 판단하고 실행하는 에이전트 아키텍처가 표준이 되었습니다.

**둘째, 로컬 AI 인프라가 성숙했습니다.** Ollama(16만), Open WebUI(12만), vLLM(7만)이 보여주듯, 클라우드 API에 의존하지 않고 로컬에서 AI를 실행하려는 수요가 폭발적입니다. 프라이버시, 비용, 지연시간 — 세 가지 문제를 한꺼번에 해결하기 때문입니다.

**셋째, 웹과 AI의 융합이 가속화되고 있습니다.** Firecrawl(9만), Browser Use(8만)의 성장은 AI가 웹이라는 거대한 데이터 소스와 직접 상호작용하는 시대가 왔음을 의미합니다. 앞으로 이 영역에서 더 많은 혁신이 나올 것으로 보입니다.

오픈소스 AI 생태계는 이미 "실험" 단계를 넘어 "프로덕션" 단계에 들어섰습니다. 별 수는 그 증거입니다.
