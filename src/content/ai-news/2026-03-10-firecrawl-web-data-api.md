---
title: "Firecrawl — 웹 전체를 LLM이 읽을 수 있는 마크다운으로 바꾸는 9만 스타 프로젝트"
date: 2026-03-10
model: etc
tags: [ai-news, etc, github, open-source, firecrawl, web-crawling, rag, typescript, api]
summary: "Firecrawl은 웹사이트를 LLM이 소화할 수 있는 깨끗한 마크다운으로 변환하는 웹 데이터 API입니다. 9만 스타를 돌파한 이 프로젝트는 TypeScript로 작성되어 있으며, JavaScript 렌더링, 구조화된 데이터 추출, 대규모 크롤링을 지원합니다. 프로젝트 구조와 웹 크롤링 → AI 파이프라인의 핵심 기술을 다룹니다."
sources: ["https://github.com/mendableai/firecrawl"]
auto_generated: false
---

## 무슨 일이 있었나

`mendableai/firecrawl`이 2026년 3월 기준 **90,284 스타**를 기록했습니다. RAG 파이프라인에서 "웹 데이터를 어떻게 가져올 것인가"라는 문제를 정면으로 해결하는 프로젝트입니다.

LLM은 텍스트를 잘 이해하지만, 웹 페이지의 원본 HTML은 광고, 네비게이션, 스크립트 등의 노이즈로 가득합니다. Firecrawl은 이 HTML을 **깨끗한 마크다운**으로 변환해줍니다. 한 줄 API 호출로 어떤 웹 페이지든 LLM-ready 텍스트로 바꿀 수 있습니다.

<small>[mendableai/firecrawl](https://github.com/mendableai/firecrawl)</small>

## 프로젝트 구조

Firecrawl은 **TypeScript** 기반의 모노레포입니다.

```
firecrawl/
├── apps/
│   ├── api/                    # 메인 API 서버
│   │   ├── src/
│   │   │   ├── controllers/    # 엔드포인트 핸들러
│   │   │   ├── scraper/        # 스크래핑 엔진
│   │   │   │   ├── scrapeURL.ts      # 단일 URL 스크래핑
│   │   │   │   └── WebScraper/       # 크롤링 로직
│   │   │   ├── lib/            # 마크다운 변환, 정제
│   │   │   │   ├── html-to-markdown.ts
│   │   │   │   └── LLM-extraction.ts # 구조화 데이터 추출
│   │   │   └── services/       # 큐, 캐시, 요금 제한
│   │   └── __tests__/
│   └── playwright-service/     # JS 렌더링 서비스
│       └── src/
│           └── server.ts       # Playwright 기반 렌더링
├── sdks/                       # 클라이언트 SDK
│   ├── python/                 # Python SDK
│   ├── node/                   # Node.js SDK
│   └── go/                     # Go SDK
└── docker-compose.yaml
```

크게 세 가지 레이어로 나뉩니다.

**1. API 서버** — `apps/api/`. Express 기반의 REST API 서버가 핵심입니다. `/v1/scrape`(단일 페이지), `/v1/crawl`(사이트 전체), `/v1/map`(사이트맵 추출) 등의 엔드포인트를 제공합니다.

**2. 스크래핑 엔진** — `apps/api/src/scraper/`. URL을 받아서 HTML을 가져오고, 마크다운으로 변환하는 핵심 로직입니다. 정적 페이지는 HTTP 요청으로, JavaScript가 필요한 페이지는 Playwright로 렌더링합니다.

**3. Playwright 서비스** — `apps/playwright-service/`. 별도 프로세스로 분리된 브라우저 렌더링 서비스입니다. SPA(Single Page Application)처럼 JavaScript 실행이 필요한 페이지를 처리합니다.

## 핵심 기술 스택

### HTML → 마크다운 변환 파이프라인

Firecrawl의 가장 핵심적인 기능은 **HTML을 깨끗한 마크다운으로 변환**하는 것입니다. 단순한 태그 변환이 아니라, 콘텐츠 추출까지 포함합니다.

```
[원본 HTML]
  ↓ JavaScript 렌더링 (필요 시)
[렌더링된 HTML]
  ↓ 콘텐츠 추출 (광고, 네비, 푸터 제거)
[본문 HTML]
  ↓ HTML → Markdown 변환
[깨끗한 마크다운]
  ↓ 후처리 (빈 줄 제거, 링크 정리)
[최종 마크다운]
```

**콘텐츠 추출** 단계가 중요합니다. 웹 페이지에서 실제 본문 콘텐츠만 골라내는 것인데, Mozilla의 Readability 알고리즘과 유사한 휴리스틱을 사용합니다. 텍스트 밀도, DOM 깊이, 시맨틱 태그(`<article>`, `<main>`) 등을 분석해서 본문 영역을 추정합니다.

### 구조화된 데이터 추출(Structured Extraction)

마크다운 변환을 넘어서, **LLM을 활용한 구조화 데이터 추출**도 지원합니다.

```typescript
// Firecrawl로 제품 정보를 구조화 추출
const result = await firecrawl.scrapeUrl("https://example.com/product", {
  formats: ["extract"],
  extract: {
    schema: {
      name: "string",
      price: "number",
      description: "string",
      features: "string[]"
    }
  }
});
// → { name: "MacBook Pro", price: 2499, description: "...", features: [...] }
```

JSON Schema를 정의하면, Firecrawl이 페이지 콘텐츠를 LLM에 넘겨서 스키마에 맞는 구조화된 데이터를 추출합니다. 웹 스크래핑과 데이터 파싱을 한꺼번에 해결하는 것입니다.

### 대규모 크롤링: BFS + 큐 시스템

`/v1/crawl` 엔드포인트는 사이트 전체를 크롤링합니다. 내부적으로 **BFS(너비 우선 탐색)**로 링크를 탐색하며, **BullMQ**(Redis 기반 작업 큐)로 크롤링 작업을 관리합니다.

```
시작 URL → 링크 추출 → 큐에 추가 → 병렬 처리 → 링크 추출 → ...
                                  ↓
                          rate limiting (도메인별)
                          중복 URL 필터링
                          depth 제한
                          robots.txt 준수
```

프로덕션 환경에서의 크롤링은 단순히 HTTP 요청을 보내는 것 이상입니다. Rate limiting, 중복 제거, `robots.txt` 준수, 에러 재시도 등을 모두 처리해야 합니다.

### 셀프 호스팅

Docker Compose로 전체 스택을 올릴 수 있습니다. Redis(큐), Playwright(렌더링), API 서버가 컨테이너로 분리되어 있어 스케일링도 가능합니다. Firecrawl 클라우드 서비스를 쓸 수도 있지만, 민감한 데이터를 처리하거나 비용을 절감하려면 셀프 호스팅이 선택지가 됩니다.

## 개념 정리

### 왜 RAG에 웹 크롤링이 필요한가

RAG(Retrieval-Augmented Generation)의 성능은 **검색 데이터의 품질**에 달려 있습니다. "Garbage in, garbage out"입니다. 웹에서 데이터를 가져올 때 HTML 태그, CSS, JavaScript가 섞인 원본을 그대로 넣으면 LLM의 컨텍스트 윈도우가 낭비되고 답변 품질이 떨어집니다.

Firecrawl이 해결하는 문제는 정확히 이것입니다. **노이즈를 제거하고, LLM이 이해하기 좋은 형태로 정제**하는 것입니다. 마크다운은 구조(헤딩, 리스트, 코드블록)를 유지하면서도 불필요한 시각적 정보를 제거합니다.

### JavaScript 렌더링의 필요성

현대 웹사이트의 상당수는 **SPA(Single Page Application)**입니다. React, Vue, Angular로 만들어진 이런 사이트는 초기 HTML에 콘텐츠가 없습니다. JavaScript가 실행되어야 콘텐츠가 렌더링됩니다.

```html
<!-- SPA의 초기 HTML -->
<div id="root"></div>
<script src="app.js"></script>
<!-- 단순 HTTP 요청으로는 빈 페이지만 얻는다 -->
```

Firecrawl은 이런 페이지를 감지하면 Playwright 서비스로 넘겨서 **실제 브라우저에서 JavaScript를 실행**한 후 렌더링된 HTML을 가져옵니다. 이 과정은 단순 HTTP 요청보다 느리고 리소스를 많이 쓰지만, 정확한 콘텐츠를 얻기 위해 필수적입니다.

### robots.txt와 윤리적 크롤링

`robots.txt`는 웹사이트 소유자가 크롤러에게 "이 경로는 크롤링하지 마세요"라고 요청하는 표준입니다. 법적 구속력은 국가마다 다르지만, **윤리적으로 준수하는 것이 원칙**입니다.

```
# robots.txt 예시
User-agent: *
Disallow: /admin/
Disallow: /private/
Crawl-delay: 10
```

Firecrawl은 기본적으로 `robots.txt`를 확인하고 준수합니다. `Crawl-delay`도 존중하여 서버에 과도한 부하를 주지 않습니다.

## 정리

Firecrawl은 **"웹 → AI"** 파이프라인에서 가장 중요한 첫 번째 단계를 담당합니다. 웹이라는 세계 최대의 데이터 소스를 LLM이 활용할 수 있는 형태로 변환하는 것입니다.

기술적으로 인상적인 것은 **문제 정의의 정확성**입니다. "웹 크롤링"이라는 오래된 문제를 "AI를 위한 웹 데이터 API"라는 새로운 프레이밍으로 재정의했습니다. HTML → 마크다운 변환, JavaScript 렌더링, 구조화 데이터 추출을 하나의 API로 통합한 것이 핵심 가치입니다.

9만 스타라는 숫자는 RAG 파이프라인의 보편화를 보여줍니다. LLM 앱을 만드는 모든 팀이 외부 데이터를 가져와야 하고, 그 데이터의 상당 부분이 웹에 있습니다. Firecrawl은 그 연결고리 역할을 하고 있습니다.

<small>[mendableai/firecrawl](https://github.com/mendableai/firecrawl)</small>
