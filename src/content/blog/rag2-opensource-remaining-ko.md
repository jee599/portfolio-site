---
title: "RAG 2.0 시대, 오픈소스에 남은 것 — 검색 증강 생성의 현재와 미래"
date: 2026-03-09
description: "기본 RAG는 끝났다. GraphRAG, Agentic RAG, 그리고 오픈소스 생태계의 현주소."
tags: ["rag", "open-source", "vector-db", "langchain", "llm"]
lang: "ko"
source: "original"
---

기본 RAG는 2022년 기준으로 작동했다. 문서를 chunk로 잘라 vector DB에 넣고, 질문과 유사한 chunk를 꺼내 LLM에 넘기는 방식이다. 지금 그 방식으로 production에 올리면 accuracy 문제, hallucination 문제, multi-hop 질문 실패가 즉각 터진다.

2025~2026년 기준 RAG는 단순 retrieve-then-generate 파이프라인이 아니다. 검색 전략을 동적으로 결정하고, 여러 단계의 reasoning을 거치고, graph 구조로 entity 관계를 추적하는 시스템으로 진화했다. 이 글에서는 그 변화의 핵심을 짚고, 오픈소스 생태계가 어디서 여전히 유효한지 정리한다.

## RAG의 진화 경로

### Naive RAG의 한계

기본 RAG의 문제는 크게 세 가지다.

첫째, **retrieval 품질**. cosine similarity로 가장 가까운 chunk를 꺼내는 방식은 keyword mismatch에 취약하다. 질문이 "계약 해지 조건이 어떻게 되나요?"라면, "termination clause"가 들어간 문서를 제대로 찾지 못할 수 있다.

둘째, **context window 낭비**. 관련성 낮은 chunk가 context에 포함되면 LLM은 거기서 답을 만들어낸다. irrelevant context는 accuracy를 낮춘다.

셋째, **단순 질문 이상의 실패**. "A의 정책이 B의 정책보다 엄격한가?"처럼 두 문서를 비교해야 하는 질문은 naive RAG로 처리할 수 없다. 관련 chunk를 두 개 꺼낸다고 해결되지 않는다.

### Advanced RAG: 2.0의 핵심 기법들

**Hybrid Search**는 dense retrieval(벡터 유사도)과 sparse retrieval(BM25 키워드)을 결합한다. 두 방식의 결과를 Reciprocal Rank Fusion(RRF)으로 합산하면 단독 방식 대비 recall이 뚜렷하게 올라간다. Qdrant, Weaviate는 이를 기본 기능으로 제공한다.

**Reranking**은 retrieval 이후 단계다. 빠르게 후보를 많이 꺼낸 다음, cross-encoder 모델(Cohere Rerank, BGE Reranker 등)로 relevance를 재평가한다. top-k를 늘려 recall을 높이고, reranking으로 precision을 확보하는 two-stage 구조다.

**Query Decomposition**은 복잡한 질문을 sub-query로 분해한다. "2023년과 2024년 실적을 비교해줘"를 두 개의 독립 질문으로 나눠 각각 검색하고 결과를 합친다. RQ-RAG, RAG-Fusion이 이 접근을 구현한다.

**Contextual Chunking**은 chunk 경계를 문서 구조에 맞게 조정한다. 단순 글자 수 기준 분할 대신 문단, 섹션, 혹은 문서 계층을 따라 자른다. Anthropic이 발표한 Contextual Retrieval은 각 chunk에 문서 전체 맥락을 요약해 붙여 retrieval 품질을 높이는 방식이다.

## GraphRAG: 관계 구조를 아는 검색

Microsoft가 2024년 공개한 **GraphRAG**는 문서에서 entity와 관계를 추출해 knowledge graph를 구성한다. 벡터 유사도만으로는 찾기 어려운 "A와 B 사이에 어떤 관계가 있나?" 류의 질문을 처리할 수 있다.

GraphRAG의 강점은 community detection이다. 문서 집합 전체에서 주제 클러스터를 만들고, 글로벌 요약을 생성해 thematic question에 답한다. HotpotQA, MuSiQue 같은 multi-hop 벤치마크에서 기존 RAG 대비 F1 기준 4~10% 향상을 보인다.

단점은 명확하다. graph 구성 비용이 높다. 대용량 문서에 적용하면 LLM API 호출이 대량 발생하고, 그래프 갱신도 복잡하다. 오픈소스로는 `microsoft/graphrag` 패키지가 있고, RAGFlow도 GraphRAG를 지원한다. 하지만 production 수준의 관리 도구는 아직 미성숙하다.

## Agentic RAG: 검색 전략을 스스로 결정하는 시스템

**Agentic RAG**는 retrieval을 단순 함수 호출이 아닌 agent의 도구로 다룬다. agent는 질문을 분석하고, 어떤 데이터 소스에서 무엇을 검색할지 결정하고, 결과를 평가해 재검색 여부를 판단한다.

arXiv:2501.09136 (Agentic RAG Survey, 2025년 1월)에 따르면 agentic RAG의 핵심 패턴은 네 가지다.

- **Reflection**: 검색 결과의 충분성을 자기 평가
- **Planning**: 멀티스텝 작업을 단계별로 분해
- **Tool Use**: 벡터 검색, 웹 검색, SQL 쿼리를 상황에 따라 선택
- **Multi-agent Collaboration**: 역할이 다른 여러 agent가 병렬 혹은 순차로 협력

LangGraph는 이 패턴을 graph 기반 state machine으로 구현한다. 노드는 action, 엣지는 조건 분기다. 체크포인팅, human-in-the-loop, streaming이 기본 제공된다. 2025년 기준 아직 이 수준의 orchestration을 대체할 오픈소스는 없다.

## 오픈소스 생태계 현황

### Vector DB

| 도구 | 강점 | 적합한 상황 |
|------|------|-------------|
| **ChromaDB** | 설치 없이 바로 쓰는 embedded DB | 프로토타입, 로컬 개발 |
| **Qdrant** | Rust 기반 고성능, 강력한 payload filtering, hybrid search 내장 | Production, 대규모 |
| **Weaviate** | GraphQL API, knowledge graph 연동, multimodal | 엔터프라이즈 시맨틱 검색 |
| **Milvus** | 수십억 벡터 처리, 분산 아키텍처 | 대규모 인프라 |
| **pgvector** | PostgreSQL 확장, 기존 RDBMS 인프라 활용 | 벡터 DB 따로 운영 안 하려는 팀 |

ChromaDB는 2025년 Rust core 재작성으로 쓰기/쿼리 속도가 4배 향상됐다. 하지만 10M 벡터 이상은 Qdrant나 Milvus로 가야 한다.

Pinecone 같은 proprietary managed 서비스는 운영 부담이 없는 대신 비용이 선형적으로 오른다. 데이터 볼륨이 커질수록 오픈소스 자체 운영이 경제적으로 유리해진다.

### RAG Framework

**LlamaIndex**는 ingestion, indexing, retrieval 파이프라인에 특화돼 있다. LlamaHub을 통해 300개 이상의 데이터 커넥터를 제공하고, 문서 중심 RAG에서 기본 선택지다. GitHub 스타 44K+.

**LangChain**은 빠른 프로토타이핑과 광범위한 통합에 강하다. 단독으로 쓰기보단 LlamaIndex와 함께 쓰는 패턴이 많다. LlamaIndex로 ingestion/retrieval을, LangChain으로 orchestration을 담당시키는 구조다.

**LangGraph**는 LangChain 팀이 agentic workflow를 위해 만든 별도 라이브러리다. stateful graph 기반 orchestration, 체크포인팅, HITL을 지원한다. 2025년 기준 agentic RAG 구현의 사실상 표준이다.

**Haystack**은 evaluation과 compliance에 강하다. 금융, 의료처럼 정확도와 감사 추적이 중요한 환경에 적합하다. Python only라는 제약이 있지만 평가 파이프라인이 성숙해 있다.

**DSPy**는 다른 접근법이다. 프롬프트를 수동으로 작성하는 대신 목표 메트릭으로 전체 파이프라인을 최적화한다. 실험 단계가 아닌 본격 최적화 단계에서 유용하다.

## 오픈소스가 앞서는 영역

**비용 통제**. Pinecone은 편리하지만 수억 벡터 규모에서 월 수천 달러가 된다. Qdrant self-hosted는 그 비용의 일부로 동일한 성능을 낼 수 있다.

**데이터 주권**. 금융, 의료, 법률 데이터를 외부 managed service에 올리는 건 규제 리스크다. 오픈소스 스택은 데이터가 자체 인프라를 벗어나지 않는다.

**커스터마이징**. 도메인 특화 reranker를 훈련하거나 chunking 전략을 바꾸거나 평가 파이프라인을 수정하는 건 오픈소스에서만 가능하다. proprietary 플랫폼은 레이어를 추가할 수 없는 부분이 있다.

**실험 속도**. 새로운 retrieval 기법 논문이 나오면 오픈소스 구현이 몇 주 안에 따라온다. 새 기법을 제품에 빠르게 통합하려는 팀에게 오픈소스 스택이 유리하다.

## 오픈소스가 뒤처지는 영역

**운영 부담**. 벡터 DB 클러스터 관리, 인덱스 최적화, 스케일아웃은 전담 엔지니어가 필요하다. 한 중견 기업의 "간단한" RAG 프로젝트가 데이터 엔지니어, DevOps 엔지니어를 추가 투입하고 예산이 3배가 된 사례가 실제로 있다.

**평가 및 모니터링**. Production RAG에서 retrieval 품질, answer faithfulness, latency를 지속적으로 모니터링하는 도구는 오픈소스보다 LangSmith, Arize 같은 proprietary 플랫폼이 완성도가 높다.

**보안**. 오픈소스 RAG 스택의 보안은 팀이 직접 책임진다. 한 CISO가 자체 RAG 시스템이 응답에 내부 문서 제목을 노출하고 있음을 발견한 사례가 있다. role-based access control, audit log, PII 필터링을 모두 구현해야 한다.

**엔터프라이즈 기능의 성숙도**. 대시보드, SLA 보장, 고객 지원은 오픈소스가 아직 따라가지 못하는 영역이다.

## 2026년 기준 권장 스택

팀 규모와 상황에 따라 다르지만 다음 패턴이 합리적이다.

**소규모 팀, 빠른 검증이 목표**
- ChromaDB (embedded) + LlamaIndex + LangChain
- Hybrid search는 LlamaIndex의 `BM25Retriever` + `VectorIndexRetriever` 조합

**Production, 정확도가 핵심**
- Qdrant (self-hosted 또는 Qdrant Cloud) + LlamaIndex (ingestion) + LangGraph (orchestration) + Haystack (evaluation)
- Reranker: `BAAI/bge-reranker-v2-m3` 또는 Cohere Rerank API

**엔터프라이즈, 규정 준수 필요**
- Milvus (on-premise) + LlamaIndex + Haystack
- 평가: Ragas, DeepEval로 파이프라인에 자동화

**GraphRAG가 필요한 경우**
- `microsoft/graphrag` 또는 RAGFlow
- 단, 초기 graph 구성 비용과 갱신 전략을 사전에 설계해야 한다

## 결론

기본 RAG는 시작점이었다. 2026년 기준 실제 production 시스템은 hybrid search, reranking, query decomposition이 기본이고, 복잡한 use case는 agentic 패턴이나 GraphRAG를 필요로 한다.

오픈소스 생태계는 이 기법들을 대부분 구현했다. LangGraph, LlamaIndex, Qdrant 조합은 proprietary 플랫폼에 비해 기능상 크게 뒤지지 않는다. 뒤처지는 건 운영 편의성, 모니터링 완성도, 지원 체계다.

> 오픈소스를 쓸지 managed service를 쓸지는 기능의 문제가 아니라 팀 역량과 운영 비용의 문제다.

데이터 주권이 중요하거나, 커스터마이징이 필요하거나, 비용을 통제해야 한다면 오픈소스 스택은 여전히 유효하다. 하지만 그 스택을 운영할 역량이 없다면 managed service의 운영 비용이 더 저렴하다.
