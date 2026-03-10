---
title: "Dify — 13만 스타 에이전트 플랫폼의 아키텍처를 뜯어보다"
date: 2026-03-10
model: etc
tags: [ai-news, etc, github, open-source, dify, agent, rag, workflow, typescript, python]
summary: "Dify는 LLM 애플리케이션을 시각적으로 구축할 수 있는 오픈소스 에이전트 플랫폼입니다. 13만 스타를 넘긴 이 프로젝트는 RAG, 에이전트 워크플로, 도구 호출을 하나의 플랫폼에 통합합니다. Next.js 프론트엔드와 Flask 백엔드의 구조, 그리고 에이전트 아키텍처의 핵심 개념을 분석합니다."
sources: ["https://github.com/langgenius/dify"]
auto_generated: false
---

## 무슨 일이 있었나

`langgenius/dify`가 2026년 3월 기준 **131,812 스타**를 기록했습니다. AI 에이전트 플랫폼 중에서 Langflow(145K), LangChain(128K)과 함께 3강 구도를 형성하고 있습니다.

Dify의 포지셔닝은 **"프로덕션 레벨의 LLM 앱 개발 플랫폼"**입니다. 프롬프트 엔지니어링, RAG 파이프라인, 에이전트 워크플로, 모델 관리를 하나의 웹 UI에서 처리할 수 있습니다. 코드를 한 줄도 쓰지 않고 AI 에이전트를 만들 수 있다는 것이 핵심 가치입니다.

<small>[langgenius/dify](https://github.com/langgenius/dify)</small>

## 프로젝트 구조

Dify는 전형적인 **모노레포** 구조로, 프론트엔드와 백엔드가 하나의 저장소에 있습니다.

```
dify/
├── web/                    # 프론트엔드 (Next.js + TypeScript)
│   ├── app/                # App Router 기반 페이지
│   ├── components/         # React 컴포넌트
│   │   ├── workflow/       # 워크플로 에디터 (ReactFlow 기반)
│   │   ├── datasets/       # RAG 데이터셋 관리 UI
│   │   └── app/            # 앱 설정, 프롬프트 에디터
│   └── service/            # API 호출 래퍼
├── api/                    # 백엔드 (Flask + Python)
│   ├── controllers/        # REST API 컨트롤러
│   ├── core/               # 핵심 비즈니스 로직
│   │   ├── agent/          # 에이전트 실행 엔진
│   │   ├── rag/            # RAG 파이프라인
│   │   ├── workflow/       # 워크플로 실행 엔진
│   │   ├── model_runtime/  # 멀티 모델 프로바이더 추상화
│   │   └── tools/          # 외부 도구 통합
│   ├── models/             # SQLAlchemy ORM 모델
│   └── tasks/              # Celery 비동기 작업
├── docker/                 # Docker Compose 설정
│   └── docker-compose.yaml # Redis, PostgreSQL, Weaviate 등
└── sdks/                   # 클라이언트 SDK (Python, Node.js)
```

### 프론트엔드: Next.js + ReactFlow

웹 UI는 **Next.js App Router** 기반입니다. 가장 흥미로운 부분은 워크플로 에디터입니다. **ReactFlow** 라이브러리를 사용해 노드 기반의 시각적 워크플로 빌더를 구현했습니다. LLM 호출, 조건 분기, 코드 실행, HTTP 요청 등의 노드를 드래그 앤 드롭으로 연결합니다.

### 백엔드: Flask + Celery + PostgreSQL

API 서버는 **Flask**로 구현되어 있습니다. ORM은 **SQLAlchemy**, 비동기 작업 처리는 **Celery + Redis**, 벡터 저장소는 **Weaviate, Qdrant, Pinecone** 등 다양한 벡터 DB를 지원합니다.

`core/model_runtime/`이 주목할 만합니다. OpenAI, Anthropic, Google, Ollama 등 수십 개의 모델 프로바이더를 **통일된 인터페이스**로 추상화합니다. 어떤 모델을 사용하든 같은 API로 호출할 수 있습니다.

### 인프라: Docker Compose 한 방

```yaml
# docker-compose.yaml의 핵심 서비스
services:
  api:        # Flask API 서버
  worker:     # Celery 워커
  web:        # Next.js 프론트엔드
  db:         # PostgreSQL
  redis:      # 캐시 + 메시지 브로커
  weaviate:   # 벡터 데이터베이스
  nginx:      # 리버스 프록시
```

`docker compose up -d` 한 줄로 전체 스택을 올릴 수 있습니다. PostgreSQL(메타데이터), Redis(캐시/큐), Weaviate(벡터 검색)까지 포함된 완전한 셋업입니다.

## 핵심 기술 스택

### RAG 파이프라인

Dify의 RAG 구현은 `core/rag/` 디렉토리에 있습니다. 전체 파이프라인은 다음과 같습니다:

1. **문서 파싱** — PDF, DOCX, HTML, Markdown 등을 텍스트로 변환
2. **청킹(Chunking)** — 텍스트를 적절한 크기의 조각으로 분할
3. **임베딩(Embedding)** — 각 청크를 벡터로 변환 (OpenAI, Cohere 등)
4. **인덱싱** — 벡터 DB에 저장
5. **검색(Retrieval)** — 사용자 질문과 유사한 청크를 검색
6. **리랭킹(Reranking)** — 검색 결과를 재정렬하여 관련성 향상
7. **생성(Generation)** — 검색 결과 + 질문을 LLM에 전달

Dify는 **하이브리드 검색**을 지원합니다. 벡터 검색(의미 기반)과 키워드 검색(BM25)을 함께 사용하여 검색 정확도를 높입니다.

### 워크플로 엔진

`core/workflow/` 디렉토리에 구현된 워크플로 엔진은 **DAG(Directed Acyclic Graph)** 기반입니다. 각 노드는 독립적인 실행 단위이고, 노드 간 연결(edge)이 데이터 흐름을 정의합니다.

지원하는 노드 타입:
- **LLM**: 모델 호출 (프롬프트 템플릿 + 변수)
- **Knowledge Retrieval**: RAG 검색
- **Code**: Python/JavaScript 코드 실행 (샌드박스 내)
- **HTTP Request**: 외부 API 호출
- **IF/ELSE**: 조건 분기
- **Iterator**: 반복 실행
- **Variable Aggregator**: 변수 병합
- **Answer**: 최종 응답 출력

### 도구 호출(Tool Use)

에이전트 모드에서 Dify는 LLM에게 도구를 쥐어줍니다. 검색, 계산, 코드 실행, API 호출 등의 도구를 LLM이 자율적으로 선택하고 실행합니다. 내부적으로 OpenAI의 function calling 또는 Anthropic의 tool use 프로토콜을 사용합니다.

## 개념 정리

### 에이전트 아키텍처 패턴

LLM 에이전트에는 크게 두 가지 패턴이 있습니다.

**ReAct(Reasoning + Acting)**: LLM이 "생각(Thought) → 행동(Action) → 관찰(Observation)" 루프를 반복합니다. 자유도가 높지만 예측 불가능할 수 있습니다.

```
Thought: 사용자가 서울 날씨를 물어봤다. 날씨 API를 호출해야 한다.
Action: weather_api(location="Seoul")
Observation: 서울, 맑음, 15°C
Thought: 결과를 자연어로 정리해서 답변하자.
Answer: 현재 서울은 맑고 기온은 15°C입니다.
```

**워크플로(Workflow)**: 미리 정의된 그래프를 따라 실행합니다. 예측 가능하고 디버깅이 쉽지만, 유연성이 떨어집니다. Dify는 두 패턴을 모두 지원하며, 프로덕션 환경에서는 워크플로 패턴을 권장합니다.

### 벡터 데이터베이스

RAG에서 벡터 DB는 임베딩된 문서 청크를 저장하고 유사도 검색을 수행하는 역할입니다. Dify가 지원하는 벡터 DB들의 특징을 비교하면:

| 벡터 DB | 특징 | 적합한 시나리오 |
|---------|------|---------------|
| Weaviate | 하이브리드 검색 내장, GraphQL API | 소규모~중규모 |
| Qdrant | Rust 기반, 고성능, 필터링 강점 | 대규모, 메타데이터 필터 |
| Pinecone | 관리형 SaaS, 운영 부담 없음 | 운영 인력 부족 시 |
| pgvector | PostgreSQL 확장, 별도 DB 불필요 | 기존 PG 사용자 |

### 임베딩(Embedding)이란

텍스트를 고차원 벡터(숫자 배열)로 변환하는 것입니다. 의미가 유사한 텍스트는 벡터 공간에서 가까이 위치합니다. 예를 들어 "고양이"와 "cat"은 서로 다른 문자열이지만, 임베딩 벡터는 매우 가까울 것입니다. 이 성질을 이용해 "의미 기반 검색"이 가능합니다.

## 정리

Dify는 "LLM 앱 개발의 전체 스택을 한곳에"라는 비전을 가장 잘 실현한 플랫폼입니다. RAG, 에이전트, 워크플로, 모델 관리 — 각각 별도 도구가 필요했던 기능들을 하나의 플랫폼으로 통합했습니다.

기술적으로 인상적인 부분은 **모델 프로바이더 추상화**입니다. 수십 개의 LLM API를 통일된 인터페이스로 감싸서, 모델을 바꿔도 나머지 코드를 수정할 필요가 없습니다. 이것은 실제 프로덕션에서 매우 중요한 설계입니다. 특정 모델에 락인(lock-in)되지 않기 때문입니다.

13만 스타는 "코드 없이 AI 앱을 만들고 싶다"는 수요가 얼마나 큰지를 보여줍니다. AI 에이전트의 시대가 왔지만, 모든 팀에 에이전트를 밑바닥부터 구축할 여력이 있는 것은 아닙니다. Dify는 그 간극을 메우고 있습니다.

<small>[langgenius/dify](https://github.com/langgenius/dify)</small>
