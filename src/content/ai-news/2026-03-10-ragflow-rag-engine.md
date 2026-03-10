---
title: "RAGFlow — 문서 파싱부터 하이브리드 검색까지, 7만 스타 RAG 엔진의 전체 구조"
date: 2026-03-10
model: etc
tags: [ai-news, etc, github, open-source, ragflow, rag, vector-search, python, document-parsing]
summary: "RAGFlow는 엔드투엔드 RAG 엔진으로, 문서 파싱, 지능형 청킹, 하이브리드 검색, LLM 생성까지 전체 파이프라인을 제공합니다. 7만 스타를 넘긴 이 프로젝트의 아키텍처와 RAG의 핵심 기술인 청킹 전략, 벡터 검색, 리랭킹을 심층 분석합니다."
sources: ["https://github.com/infiniflow/ragflow"]
auto_generated: false
---

## 무슨 일이 있었나

`infiniflow/ragflow`가 2026년 3월 기준 **74,589 스타**를 기록했습니다. RAG(Retrieval-Augmented Generation) 전용 엔진으로는 가장 높은 스타 수입니다.

RAG는 LLM의 가장 큰 한계인 **"최신 정보 부족"과 "환각(hallucination)"**을 해결하는 핵심 기술입니다. 외부 문서에서 관련 정보를 검색해서 LLM에게 컨텍스트로 제공하는 방식입니다. RAGFlow는 이 전체 파이프라인을 하나의 프로젝트로 제공합니다.

<small>[infiniflow/ragflow](https://github.com/infiniflow/ragflow)</small>

## 프로젝트 구조

RAGFlow는 Python 백엔드와 React 프론트엔드로 구성되어 있습니다.

```
ragflow/
├── api/                    # REST API 서버 (Flask)
│   ├── apps/               # 앱별 엔드포인트
│   │   ├── conversation_app.py  # 대화 API
│   │   ├── document_app.py      # 문서 관리 API
│   │   └── chunk_app.py         # 청크 관리 API
│   └── db/                 # 데이터베이스 모델
├── rag/                    # RAG 핵심 엔진
│   ├── nlp/                # 자연어 처리
│   │   ├── search.py       # 검색 엔진 (하이브리드)
│   │   └── rag_tokenizer.py # 토크나이저
│   ├── app/                # 파이프라인 오케스트레이션
│   │   ├── naive.py        # 기본 청킹
│   │   ├── paper.py        # 학술 논문 파싱
│   │   ├── book.py         # 도서 파싱
│   │   ├── table.py        # 테이블 추출
│   │   └── qa.py           # Q&A 쌍 추출
│   └── svr/                # 추론 서비스
├── deepdoc/                # 문서 파싱 엔진
│   ├── parser/             # 포맷별 파서
│   │   ├── pdf_parser.py   # PDF (레이아웃 인식)
│   │   ├── docx_parser.py  # Word
│   │   ├── excel_parser.py # Excel
│   │   └── html_parser.py  # HTML
│   └── vision/             # OCR, 레이아웃 분석
│       ├── ocr.py          # 광학 문자 인식
│       └── layout_recognizer.py  # 문서 레이아웃 분석
├── web/                    # 프론트엔드 (React + Ant Design)
├── conf/                   # 설정 파일
└── docker/                 # Docker Compose
    └── docker-compose.yml  # Elasticsearch, MinIO, MySQL, Redis
```

가장 주목할 부분은 **`deepdoc/`** 디렉토리입니다. RAGFlow가 다른 RAG 도구와 차별화되는 핵심이 바로 이 **문서 파싱 엔진**입니다.

### 아키텍처 레이어

**1. 문서 파싱(DeepDoc)** — PDF, DOCX, Excel, HTML, PPT 등 다양한 포맷을 파싱합니다. 단순 텍스트 추출이 아니라, **레이아웃 분석**까지 수행합니다. 컴퓨터 비전 모델을 사용해 페이지의 제목, 본문, 표, 그림 영역을 구분합니다.

**2. 청킹(Chunking)** — `rag/app/` 디렉토리에 문서 유형별 청킹 전략이 구현되어 있습니다. 논문용, 도서용, 테이블용 등 특화된 청킹 로직을 제공합니다.

**3. 인덱싱/검색** — Elasticsearch(키워드 검색)와 벡터 DB(의미 검색)를 함께 사용하는 하이브리드 검색을 구현합니다.

**4. API 서버** — Flask로 구현된 REST API가 프론트엔드와 외부 시스템에 서비스를 제공합니다.

## 핵심 기술 스택

### DeepDoc — 비전 기반 문서 파싱

대부분의 RAG 도구는 PDF에서 텍스트만 추출합니다. `PyPDF2`나 `pdfplumber` 같은 라이브러리로 텍스트를 뽑고, 적당히 나누는 것입니다. 하지만 이 방식은 **레이아웃 정보를 무시**합니다.

RAGFlow의 DeepDoc은 다릅니다. **컴퓨터 비전 모델**을 사용해 PDF 페이지의 레이아웃을 분석합니다.

```
[PDF 페이지]
  ↓ 이미지 변환
[페이지 이미지]
  ↓ 레이아웃 분석 (객체 감지 모델)
[영역 분류: 제목 / 본문 / 표 / 그림 / 헤더 / 푸터]
  ↓ 영역별 텍스트 추출
[구조화된 텍스트]
  ↓ 영역 관계 파악 (어떤 제목 아래 어떤 본문인지)
[문서 구조 트리]
```

이 방식의 장점은 명확합니다. **2단 레이아웃, 표, 각주** 등이 있는 복잡한 문서도 정확하게 파싱할 수 있습니다. 학술 논문, 재무 보고서, 기술 문서 같은 복잡한 포맷에서 특히 차이가 납니다.

### 지능형 청킹 전략

청킹(chunking)은 RAG 성능을 좌우하는 가장 중요한 단계입니다. RAGFlow는 여러 가지 청킹 전략을 제공합니다.

**나이브 청킹(Naive)**: 고정 크기(예: 512토큰)로 자릅니다. 구현이 간단하지만, 문장이나 문단 중간에서 잘릴 수 있습니다.

**시맨틱 청킹**: 문장/문단의 의미적 유사도를 기반으로 분할합니다. 인접한 문장들의 임베딩 유사도가 급격히 변하는 지점에서 청크를 나눕니다.

**문서 구조 기반 청킹**: 문서의 제목 계층(`h1 > h2 > h3`)을 기준으로 분할합니다. DeepDoc이 파악한 레이아웃 정보를 활용합니다.

| 전략 | 장점 | 단점 | 적합한 문서 |
|------|------|------|-----------|
| 나이브 | 빠르고 예측 가능 | 의미 단위 무시 | 단순 텍스트 |
| 시맨틱 | 의미 단위 보존 | 느림, 비용 발생 | 에세이, 블로그 |
| 구조 기반 | 계층 정보 유지 | 레이아웃 분석 필요 | 논문, 매뉴얼 |
| 테이블 | 표 구조 보존 | 테이블 전용 | 재무, 통계 |

### 하이브리드 검색

RAGFlow의 검색은 두 가지 방식을 결합합니다.

**벡터 검색(Semantic Search)**: 질문과 청크의 임베딩 벡터 간 코사인 유사도를 계산합니다. "의미가 비슷한" 청크를 찾습니다. "GPU 메모리 관리"로 검색하면 "VRAM 최적화"도 찾아줍니다.

**키워드 검색(BM25)**: 전통적인 TF-IDF 기반 검색입니다. 정확한 용어 매칭에 강합니다. "PagedAttention"이라는 고유 명사를 검색할 때 벡터 검색보다 정확합니다.

```
최종 점수 = α × 벡터유사도 + (1-α) × BM25점수
```

두 점수를 가중 합산하여 최종 순위를 결정합니다. 이 **하이브리드 접근**은 단독 벡터 검색이나 단독 키워드 검색보다 거의 항상 좋은 성능을 보입니다.

## 개념 정리

### RAG의 전체 흐름

```
[사용자 질문]
  ↓ 질문 임베딩
[질문 벡터]
  ↓ 벡터 DB 검색 + BM25 검색
[상위 K개 청크]
  ↓ 리랭킹 (Cross-Encoder)
[재정렬된 청크]
  ↓ 프롬프트 구성 (시스템 프롬프트 + 검색 결과 + 질문)
[LLM 입력]
  ↓ LLM 생성
[답변 + 출처 인용]
```

### 리랭킹(Reranking)이 필요한 이유

초기 검색(first-stage retrieval)은 빠르지만 정확도가 제한적입니다. 수만~수백만 개의 청크에서 상위 100개를 빠르게 뽑아야 하므로, **Bi-Encoder**(질문과 청크를 각각 독립적으로 임베딩) 방식을 사용합니다.

리랭킹은 이 상위 100개를 **Cross-Encoder**로 재정렬합니다. Cross-Encoder는 질문과 청크를 함께 입력받아 관련성을 직접 평가합니다. 느리지만 정확도가 훨씬 높습니다.

```
Bi-Encoder:  embed(질문)·embed(청크) → 유사도  (빠름, 덜 정확)
Cross-Encoder: model(질문 + 청크) → 관련성 점수   (느림, 더 정확)
```

RAGFlow는 Cohere Rerank, BGE Reranker 등의 리랭킹 모델을 지원합니다.

### 임베딩 모델의 선택

임베딩 모델은 RAG 성능에 직접적인 영향을 미칩니다. 2026년 기준 주요 임베딩 모델:

| 모델 | 차원 | 특징 |
|------|------|------|
| OpenAI text-embedding-3-large | 3072 | 범용 최강, API 비용 발생 |
| BGE-M3 | 1024 | 다국어, 로컬 실행 가능 |
| Cohere embed-v3 | 1024 | 다국어, 압축 지원 |
| E5-Mistral-7B | 4096 | 대형 모델, 높은 정확도 |

한국어 문서를 다룬다면 **다국어 모델(BGE-M3, Cohere)**이 필수입니다. 영어 전용 모델은 한국어 성능이 크게 떨어집니다.

## 정리

RAGFlow가 7만 스타를 넘긴 이유는 **RAG 파이프라인의 가장 어려운 부분을 정면으로 해결하기 때문**입니다. 문서 파싱, 청킹, 하이브리드 검색 — 이 세 가지는 RAG 성능의 80%를 결정하지만, 대부분의 도구는 이 부분을 "대충" 처리합니다.

특히 DeepDoc의 비전 기반 문서 파싱은 다른 RAG 도구에서 찾기 어려운 차별점입니다. PDF의 텍스트만 뽑는 것과 레이아웃을 이해하고 구조화하는 것은 완전히 다른 수준의 결과를 만들어냅니다.

RAG는 LLM 앱의 기반 기술입니다. ChatGPT도, Perplexity도, 기업 내부 AI 어시스턴트도 모두 RAG를 사용합니다. RAGFlow는 이 기반 기술을 오픈소스로 제공하며, "좋은 RAG는 좋은 파싱에서 시작한다"는 원칙을 증명하고 있습니다.

<small>[infiniflow/ragflow](https://github.com/infiniflow/ragflow)</small>
