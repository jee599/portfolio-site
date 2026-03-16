---
title: "한 번 검색하고 끝내는 RAG는 죽었다 — 2026년 AI 키워드 총결산"
date: 2026-03-09
description: "Agentic RAG, 오픈소스 700M 다운로드, 스마트폰에서 돌아가는 LLM. 나머지 키워드를 한 번에 정리한다"
tags: ["ai", "llm", "rag", "open-source", "edge-ai", "multimodal", "ai-governance"]
lang: "ko"
source: "original"
---

"RAG"라는 단어 하나가 이제 근본적으로 다른 세 가지 아키텍처를 포괄하는 우산이 됐다.

2024년 RAG 붐 이후 "RAG는 죽었다"는 말이 돌았다. 데모를 만드는 건 몇 분이면 가능했지만, 기업 규모로 확장하려니 문제가 터졌다. 관련 없는 문서를 가져와도 그대로 LLM에 넣고, 검색이 한 번이라 복잡한 질문에 대응을 못 하고, 답변이 검색 결과와 맞는지 검증도 안 됐다.

RAG가 죽은 건 아니다. 단순한 1세대 RAG가 죽은 것이다.

## Naive RAG → Agentic RAG로의 진화

1세대(Naive RAG)는 질문 → 검색 → context에 넣기 → LLM 답변의 직선 파이프라인이었다. 2026년 1월 기준으로 이 방식을 여전히 쓰고 있다면 사용자를 실망시킬 확률이 높다.

Agentic RAG는 파이프라인이 아니라 루프다. LLM이 텍스트 생성기가 아니라 추론 엔진으로 동작한다. 검색이 관련 있는지 에이전트가 평가(Grading)하고, 관련 없으면 질문을 재작성(Query Rewriting)해서 다시 검색한다. 답변을 생성한 후에도 환각 체크(Hallucination Check)를 통해 문서에 근거하는지 검증한다.

핵심 차이는 더 나은 검색이 아니다. 모호함을 인지하고 반응하는 능력이다. Pipeline RAG는 한 번의 검색이면 충분하다고 가정한다. 그 가정이 맞으면 모든 게 단순하다. 맞지 않으면 시스템이 복구할 방법이 없다. Self-RAG 도입 후 프로덕션에서 불필요한 검색이 25~40% 줄었다는 결과가 있다.

Graph RAG는 한 단계 더 나간다. 답이 단일 문서 청크에 존재하지 않고, 여러 사실의 관계에만 존재할 때 쓴다. "아인슈타인이 상대성 이론을 개발할 때 어디서 일했나?"라는 질문에는 두 가지 사실을 연결해야 한다. 아인슈타인 → 상대성 이론 개발, 아인슈타인 → 특허청 근무. 텍스트 검색으로는 이 연결이 안 된다. 지식 그래프를 통해 엔티티 간 관계를 탐색해야 한다. GraphRAG 적용 사례에서 검색 정밀도가 99%까지 향상된 보고가 있다.

## 오픈소스 모델: 클로즈드를 따라잡다

2026년 2월 기준으로, 오픈 웨이트 모델이 12개월 전의 독점 모델과 정기적으로 동등하거나 능가한다. 일부 특화 벤치마크에서는 현재 최고 클로즈드 모델과도 경쟁한다.

DeepSeek과 Qwen이 글로벌 AI 시장의 15%를 점유하게 됐다. 1년 전 1%에서. Qwen은 Hugging Face에서 누적 7억 다운로드를 넘겼다. 세계에서 가장 많이 다운로드된 AI 모델 패밀리다.

비용 격차가 결정적이다. 자체 인프라에서 DeepSeek V3.2를 운영하면 백만 입력 토큰당 약 $0.028이다. 프론티어 독점 모델의 API 비용은 $2~$15다. 70배에서 500배 차이다.

오픈소스를 선택하는 기준은 명확하다. 민감한 데이터(의료, 금융, 법률)가 외부로 나가면 안 될 때, 대량 처리(월 수백만 건)로 API 비용이 자체 호스팅보다 비쌀 때, 도메인 특화 파인튜닝이 필요할 때, 벤더 종속을 피하고 싶을 때다. 반대로 소량 처리이거나, 인프라 관리 역량이 없거나, 빠른 프로토타이핑이 목적이면 클로즈드 API가 맞다.

셀프 호스팅의 손익분기점은 월 1,500만~4,000만 토큰이다. 그 이하에서는 API가 이미 더 저렴하다.

## Edge AI: 스마트폰에서 돌아가는 LLM

클라우드가 아닌 사용자 디바이스에서 직접 모델을 실행하는 것이 Edge AI다. SLM + Quantization의 결합이 이를 가능하게 만들었다.

iPhone 15 이상에서 Llama 3.2 1B(4-bit)가 20~30 tok/s로 동작한다. RTX 4060 Ti 노트북에서 Qwen 3.5 9B(4-bit)가 약 50 tok/s로 돌아간다. Ollama를 설치하고 `ollama run qwen3.5:9b` 한 줄이면 로컬에서 LLM이 실행된다.

핵심 장점은 프라이버시(데이터가 안 나감), 오프라인 동작(인터넷 불필요), 비용($0), 레이턴시(50~200ms)다. 의료/금융/법률처럼 데이터가 외부로 나가면 안 되는 서비스에서 Edge AI의 가치가 크다.

## Multimodal AI: 텍스트만의 시대는 끝났다

2026년 프론티어 모델의 기본 사양이 멀티모달이다. 텍스트, 이미지, 오디오, 비디오를 동시에 이해하고 생성한다. GPT-5와 Gemini 2.5 Pro는 텍스트, 이미지 이해, 이미지 생성, 오디오, 비디오를 전부 지원한다.

실전 활용으로는 Figma 디자인 스크린샷을 보여주면 React 컴포넌트를 생성하고, 의료 이미지를 보고 소견을 작성하고, 회의 영상을 넣으면 요약과 액션 아이템을 추출한다. UE5 개발 관점에서는 UI 스크린샷을 Claude에 보여주고 UMG Widget 코드를 생성하게 하는 것이 이미 가능하다.

## AI Governance: EU AI Act가 시행 중이다

2024년 8월 발효된 EU AI Act가 2026년 8월 고위험 AI 의무 전면 시행을 앞두고 있다.

위험 등급에 따라 규제 수준이 달라진다. 실시간 원격 생체인식 감시나 소셜 스코어링은 금지된다. 의료 진단, 채용, 신용 평가 AI는 고위험으로 분류되어 적합성 평가, 투명성, 인간 감독이 필수다. 챗봇은 "AI임을 고지"해야 하고, 딥페이크는 라벨링이 필수다. 스팸 필터나 게임 AI 같은 최소 위험 카테고리는 규제가 거의 없다.

한국에서 서비스한다면 EU 규제의 직접적 영향은 적지만, 글로벌 서비스를 고려한다면 "AI가 생성한 콘텐츠"임을 표시하는 투명성 의무를 미리 적용해두는 게 안전하다.

## Diffusion LLM: 다음 패러다임 후보

기존 LLM은 토큰을 하나씩 순서대로 생성한다(Autoregressive). Diffusion LLM은 이미지 생성 AI(Stable Diffusion)와 같은 원리로 전체 텍스트를 동시에 생성하고 점진적으로 정제한다.

Autoregressive의 근본적 한계는 토큰을 순차적으로 생성해야 한다는 것이다. 200토큰을 만들려면 200번의 순차 추론이 필요하고, 긴 텍스트일수록 느려진다. Diffusion LLM은 전체 시퀀스를 동시에 생성하고 병렬 처리할 수 있어서 레이턴시 감소 가능성이 있다.

아직 연구 단계다. Google의 Gemini Diffusion이 가장 앞서 있지만, 범용 LLM 수준의 품질에는 도달하지 못했다. 2026~2027년에 추론 비용과 레이턴시를 극적으로 낮출 수 있는 패러다임 전환 후보로 주시할 가치가 있다.

## 전체 키워드 맵

2026년 3월 기준 AI 키워드의 전체 그림이다.

에이전트 시스템(Agentic AI, MCP, Context Engineering)이 중심축이고, 그 주변을 비용 최적화(Model Routing, Token Economics, Prompt Caching), 모델 효율화(SLM, MoE, Distillation, Quantization), 추론 강화(Inference Scaling, Reasoning Models, RLVR), 데이터/검색(RAG 2.0, Agentic RAG, Graph RAG), 개발 방식(Vibe Coding → Agentic Engineering), 생태계(Open Source, Multimodal, Edge AI, AI Governance)가 둘러싸고 있다.

각 키워드가 독립적으로 존재하는 게 아니라, 서로 연결되어 있다. Model Routing은 SLM과 LLM 사이에서 작동하고, Context Engineering은 RAG와 만나고, Agentic AI는 MCP와 Tool Use 위에서 돌아간다. 하나를 이해하면 나머지가 자연스럽게 따라온다.

> 2026년 AI의 핵심은 기술이 아니라 조합이다. 어떤 모델을, 어떤 크기로, 어떤 작업에, 어떤 비용으로 매칭하느냐. 이 판단이 엔지니어의 새로운 핵심 역량이다.

---

- [Choosing the Right RAG Architecture in 2026](https://medium.com/@skyhawkbytecode/choosing-the-right-rag-architecture-in-2026)
- [Open Source LLM Leaderboard February 2026](https://awesomeagents.ai/leaderboards/open-source-llm-leaderboard/)
- [DeepSeek V4 and Qwen 3.5 — Particula](https://particula.tech/blog/deepseek-v4-qwen-open-source-ai-disruption)
- [O'Reilly Signals for 2026](https://www.oreilly.com/radar/signals-for-2026/)

---

*다른 플랫폼에서도 읽을 수 있다: [Dev.to](https://dev.to/jidonglab) · [Naver](https://blog.naver.com/jidonglab) · [Medium](https://medium.com/@jidonglab)*
