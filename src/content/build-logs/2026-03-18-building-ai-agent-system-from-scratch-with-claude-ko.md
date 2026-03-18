---
title: "AI 에이전트 시스템 처음부터 끝까지 — Claude로 TypeScript 라이브러리와 Next.js 대시보드 한번에 구축하기"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [fix, feat, chore, typescript, css]
---

아직 한 번도 없던 AI 에이전트 관리 시스템을 12일 만에 처음부터 완성했다. TypeScript 라이브러리부터 Next.js 대시보드까지, 모든 코드를 Claude와 함께 작성했다. 이 글에서는 복잡한 시스템을 AI와 어떻게 체계적으로 구축하는지 그 전 과정을 공개한다.

## 배경: 무엇을 만들고 있는가

`agentochester`는 수백 개의 AI 에이전트를 카탈로그화하고 사용자 요청에 맞는 에이전트를 자동으로 찾아주는 시스템이다. 현재 개발사들이 각자 만든 에이전트들이 여기저기 흩어져 있는데, 이걸 한곳에서 관리하고 매칭해주는 게 목표다.

이번 작업은 완전히 빈 레포지토리에서 시작해서 동작하는 프로덕트까지 만드는 것이었다. 핵심 라이브러리, API 서버, 웹 대시보드까지 풀스택 구현이 필요했다.

## 시스템 설계를 AI에게 위임하는 법

가장 먼저 한 일은 Claude에게 전체 시스템 아키텍처를 설계하게 하는 것이었다. 하지만 막연하게 "시스템 설계해줘"라고 하면 절대 원하는 결과가 나오지 않는다.

### 제약 조건부터 명확히 하기

> "AI 에이전트 카탈로그 시스템을 설계해줘. 요구사항: 1) markdown 파일로 정의된 에이전트들을 파싱 2) YAML 형식 커스텀 에이전트 지원 3) 3단계 매칭 알고리즘 (exact/fuzzy/semantic) 4) TypeScript, 테스트 커버리지 100%, Node.js 환경 5) 나중에 웹 대시보드 붙일 예정. 디렉토리 구조와 핵심 타입 정의부터 시작해."

이렇게 구체적인 제약 조건을 주니까 Claude가 `src/core/types.ts`에서 `AgentDefinition`, `CatalogEntry`, `Task` 같은 핵심 타입들을 바로 잡아냈다. 

### 점진적 구체화 패턴

처음부터 모든 걸 한번에 구현하려고 하지 않는다. 대신 이런 순서로 진행했다:

1. 타입 정의 → 2. 파서 구현 → 3. 매칭 알고리즘 → 4. API 레이어 → 5. 프론트엔드

각 단계에서 Claude에게 이전 단계의 코드를 컨텍스트로 주고 다음 단계를 구현하게 했다. 이때 `CLAUDE.md` 파일이 핵심이다.

```markdown
# Agent Chester Development Context

## Current Implementation Status
- ✅ Core types defined (AgentDefinition, CatalogEntry, Task)
- ✅ Markdown parser with full test coverage
- 🔄 Currently working on: 3-tier matching algorithm
- ❌ TODO: API server, dashboard

## Code Style Rules
- Use explicit types, no `any`
- Test coverage must be 100%
- Error handling with Result<T, E> pattern
- Functional programming style preferred

## Architecture Decisions
- Adapter pattern for different agent formats (.md, .yaml)
- Scoring system: exact=100, fuzzy=60-90, semantic=30-70
```

이런 식으로 `CLAUDE.md`를 계속 업데이트하면서 Claude가 항상 최신 상태를 파악할 수 있게 했다.

## 복잡한 파싱 로직을 AI에게 맡기기

가장 까다로운 부분은 markdown으로 작성된 에이전트 정의 파일을 파싱하는 것이었다. 각 에이전트마다 형식이 조금씩 다르고, 메타데이터 추출 규칙도 복잡했다.

### 예외 케이스부터 정의하기

> "markdown 에이전트 파일을 파싱하는 함수를 만들어줘. 하지만 예외 케이스가 많다:
> - frontmatter가 없는 경우가 있음
> - description이 여러 줄일 수 있음  
> - tags는 배열이거나 쉼표로 구분된 문자열일 수 있음
> - some agents have ALWAYS/NEVER sections for constraints
> - domain은 파일명이나 directory에서 추론해야 할 수도 있음
> 
> 각 케이스별로 테스트 케이스 5개씩 만들고, 파싱 실패 시 meaningful error message 반환해."

이렇게 예외 케이스를 먼저 명시하니까 Claude가 `adapter.ts`에서 robust한 파싱 로직을 만들어냈다. 특히 `ALWAYS/NEVER` 섹션 파싱 같은 복잡한 부분도 정규식과 상태 머신으로 깔끔하게 처리했다.

### 테스트 주도 개발 강제하기

Claude한테 코드만 짜달라고 하면 테스트 없는 코드를 준다. 하지만 이렇게 요청하면:

> "adapter.ts 구현하되, 먼저 `adapter.test.ts` 파일을 만들어. 각 파싱 케이스별로 describe 블록 나누고, edge case까지 커버하는 테스트를 15개 이상 작성해. 그 다음에 모든 테스트가 pass하는 구현체를 만들어."

이러면 Claude가 테스트부터 먼저 작성한다. `vitest`로 100% 커버리지가 나오는 테스트 코드를 먼저 만들고, 그걸 통과하는 구현체를 짠다. TDD 방식으로 AI를 활용하는 핵심 패턴이다.

## 3단계 매칭 알고리즘을 구조화하는 법

에이전트 매칭 알고리즘이 이 프로젝트의 핵심이었다. exact match → fuzzy match → semantic match 순서로 점수를 매기는 복잡한 로직이다.

### 알고리즘을 단계별로 분해하기

처음에 "매칭 알고리즘 만들어줘"라고 하니까 Claude가 단순한 문자열 비교만 했다. 하지만 이렇게 구체화하니까:

> "3단계 매칭 시스템을 구현해:
> 
> **Tier 1 (Exact Match, 100점):**
> - task.domain === agent.domain
> - task.keywords 중 하나가 agent.tags와 정확히 일치
> 
> **Tier 2 (Fuzzy Match, 60-90점):**  
> - Levenshtein distance 기반 유사도
> - stemming 적용한 키워드 매칭
> - 부분 문자열 포함 관계
> 
> **Tier 3 (Semantic Match, 30-70점):**
> - 나중에 embedding 연동 예정, 지금은 mock
> 
> 각 tier별로 별도 함수로 분리하고, 최종 점수는 가장 높은 tier 점수 사용. `AgentCatalog.findMatches()` 메서드에서 호출."

이렇게 티어별로 분해해서 요청하니까 Claude가 `src/core/catalog.ts`에서 깔끔한 구조로 구현했다. 각 매칭 함수가 독립적으로 테스트 가능하게 분리되어 있다.

### 성능 최적화까지 고려하기

> "매칭 성능 최적화해줘. 에이전트 1000개, 동시 요청 100개 상황을 가정하고. exact match에서 결과가 충분하면 fuzzy/semantic은 건너뛰게 하고, 결과를 메모이제이션해."

Claude가 early return 로직과 LRU 캐시를 추가해서 성능을 크게 개선했다. 이런 최적화 요청도 구체적인 수치와 시나리오를 주면 훨씬 실용적인 코드가 나온다.

## API와 프론트엔드를 동시에 개발하기

백엔드 라이브러리가 완성되고 나서 Next.js 대시보드를 만들어야 했다. 이때 핵심은 API 스펙부터 정의하고 프론트엔드와 백엔드를 동시에 작업하는 것이다.

### API 스펙 우선 정의

> "Next.js App Router 기준으로 API 설계해줘:
> - GET /api/agents: 전체 에이전트 리스트 반환
> - POST /api/agents/match: task 받아서 매칭 결과 반환
> - Response 형식은 { success: boolean, data: T, error?: string }로 통일
> - TypeScript 타입 정의도 함께 export해서 프론트엔드에서 import 가능하게"

먼저 API 스펙을 확정한 다음에, 프론트엔드 컴포넌트와 백엔드 핸들러를 병렬로 작업했다. `dashboard/lib/agents-handler.ts`에서 API 호출 로직을 추상화하고, React 컴포넌트는 이 핸들러만 사용하게 했다.

### 컴포넌트 단위로 분해하기

대시보드 UI를 만들 때도 한번에 전체를 구현하려고 하지 않았다:

> "대시보드를 3개 컴포넌트로 분리해서 구현해:
> 1. `AgentLibrary`: 전체 에이전트 목록, 검색/필터 기능
> 2. `AgentMatchPanel`: task 입력하면 매칭 결과 보여주는 패널  
> 3. `AgentDetail`: 선택한 에이전트 상세 정보
> 
> 각 컴포넌트는 독립적으로 동작하게 하고, Tailwind CSS로 깔끔하게 스타일링해. 반응형도 고려해."

Claude가 각 컴포넌트를 별도 파일로 만들고, props interface도 명확히 정의해서 재사용 가능한 구조로 만들었다.

## 버그 수정을 효율화하는 프롬프팅

개발 막바지에 QA 이슈들이 몇 개 발견됐다. 이때 버그를 하나씩 수정하지 말고 관련된 것들을 묶어서 처리하는 게 효율적이다.

### 버그를 카테고리별로 그룹핑

> "다음 4개 버그를 한번에 수정해줘:
> 1. `/api/agents/match` endpoint가 404 (routing 문제)
> 2. fetch error handling 부족 (network 문제)  
> 3. 검색할 때 대소문자 구분함 (UX 문제)
> 4. React key warning (렌더링 문제)
> 
> 각 버그마다 root cause 분석하고, 비슷한 문제가 다른 곳에도 있는지 확인해. 수정 후 관련 테스트케이스도 추가해."

이렇게 여러 버그를 함께 주면 Claude가 공통 패턴을 찾아서 systematic하게 해결한다. 예를 들어 error handling 부족 문제를 발견하면 전체 codebase를 스캔해서 비슷한 문제가 있는 곳을 모두 찾아서 함께 수정한다.

### 방어적 프로그래밍 패턴 적용

> "앞으로 이런 버그가 재발하지 않게 방어적 프로그래밍 패턴을 적용해:
> - API 응답은 항상 schema validation
> - 사용자 입력은 sanitization + validation  
> - 비동기 작업은 timeout과 retry 로직
> - React component는 error boundary로 감싸기"

Claude가 이런 패턴들을 코드베이스 전체에 일관되게 적용해준다. 단순히 버그 수정이 아니라 시스템 전체의 안정성을 높이는 방향으로 접근한다.

## 더 나은 방법은 없을까

이 프로젝트를 진행하면서 몇 가지 개선점이 보였다.

### MCP 서버 활용의 한계

Claude Code에서 MCP 서버를 연동하면 외부 시스템과 실시간으로 통합할 수 있다. 하지만 이번 프로젝트는 완전히 새로 만드는 거라서 MCP보다는 전통적인 file-based development가 더 효과적이었다. MCP는 기존 시스템을 확장할 때 진가를 발휘한다.

### 더 체계적인 테스트 전략 필요

TDD로 접근하긴 했지만, integration test나 e2e test는 부족했다. Claude에게 이런 요청을 해볼 수 있었다:

> "Playwright로 e2e 테스트 시나리오 만들어줘. 사용자가 대시보드에 접속해서 에이전트 검색하고 매칭 결과 확인하는 전체 플로우를 테스트해."

### 성능 모니터링과 로깅

프로덕션 환경을 고려한다면 OpenTelemetry나 Sentry 같은 모니터링 도구 연동도 필요하다. 특히 매칭 알고리즘의 성능을 추적하려면:

> "매칭 성능 메트릭을 수집하는 middleware 만들어줘. 응답 시간, 매칭 성공률, 에러율을 tracking하고 /api/metrics 엔드포인트로 노출해."

### 더 정교한 semantic search

현재는 semantic matching을 mock으로 구현했는데, 실제로는 OpenAI embeddings나 Sentence Transformers를 써야 한다. 하지만 embedding 비용과 latency를 고려하면 하이브리드 접근법이 좋을 것 같다:

1. 첫 번째는 keyword 기반 pre-filtering
2. 후보군이 줄어들면 embedding similarity 계산
3. 결과는 Redis에 캐싱

## 정리

이번 프로젝트에서 얻은 핵심 인사이트 4가지다:

- **제약 조건이 창의성을 만든다**: Claude에게 막연한 요청 대신 구체적인 제약 조건을 줄수록 더 나은 결과가 나온다
- **점진적 구체화가 핵심**: 전체 시스템을 한번에 구현하려 하지 말고 단계별로 쌓아올린다  
- **테스트 우선 접근법**: AI에게 구현체보다 테스트를 먼저 작성하게 하면 코드 품질이 크게 올라간다
- **CLAUDE.md로 컨텍스트 관리**: 프로젝트 상태와 아키텍처 결정사항을 문서화해두면 일관된 개발이 가능하다

<details>
<summary>이번 작업의 커밋 로그</summary>

3e6c682 — chore: init project with TypeScript, Vitest, agency-agents submodule
f4c1673 — feat: add core type definitions (AgentDefinition, AgentSource, CatalogEntry, Task)  
48f2096 — feat: add adapter.ts — .md to AgentDefinition parser with full test coverage
49dd638 — feat: add 8 builtin custom YAML agents with validation tests
4521654 — feat: add AgentCatalog and AgentManager with 3-tier matching
174b32a — chore: add config.yaml and vitest configuration  
e30f077 — docs: add implementation plan for agent system
2d455ba — fix: recursive dir scan, ALWAYS/NEVER parsing, tag scoring, domain inference
72bb8a7 — feat: add assembler.ts — prompt assembly for agents and teams
68762ae — feat: add server API handler for agent listing and matching
922ae01 — feat: add Next.js dashboard with agent library and matching panel
aa00a70 — fix: QA issues — API match endpoint, fetch error handling, search case, React keys

</details>