---
title: "AI 에이전트 카탈로그를 만들며 배운 LLM 협업 패턴 — 8000줄 TypeScript 프로젝트 회고"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [feat, fix, chore, typescript, css]
---

AI 에이전트 시스템을 처음부터 만들어보면서 LLM과의 협업 방식을 체계화했다. 11개 commit으로 8000줄이 넘는 TypeScript 프로젝트를 구축하며 발견한 효과적인 프롬프팅 패턴과 구조화 전략을 정리한다.

## 배경: 무엇을 만들고 있는가

`agentochester`는 AI 에이전트를 카탈로그화하고 작업에 맞는 에이전트를 자동으로 매칭해주는 시스템이다. 개발자가 "이런 작업을 하고 싶다"고 하면 수백 개의 에이전트 중에서 가장 적합한 것을 찾아주는 게 목표다.

핵심 구성 요소는 다음과 같다:
- TypeScript 기반 core engine (타입 정의, 파서, 매칭 알고리즘)
- YAML/Markdown 포맷으로 된 agent definition 파서
- 3-tier 매칭 시스템 (exact, fuzzy, semantic)  
- Next.js 대시보드 (agent library, 매칭 패널)
- 8개 builtin agent와 validation 테스트

이번 작업의 목표는 proof-of-concept를 넘어서 실제 사용할 수 있는 MVP를 만드는 것이었다.

## 계층별 프롬프트 전략 — 타입부터 UI까지

이 프로젝트에서 가장 중요한 발견은 **계층별로 다른 프롬프팅 접근법**이 필요하다는 것이다. 타입 정의부터 UI 컴포넌트까지 각 레이어마다 AI에게 요구하는 방식을 달리했다.

### 타입 정의 단계: 제약 조건이 핵심

타입 정의는 전체 시스템의 뼈대가 되기 때문에 가장 신중하게 접근했다. 이때 효과적인 프롬프트 패턴:

> "TypeScript 타입을 정의해줘. 제약 조건:
> 1. `AgentDefinition`은 name, description, capabilities, tags 필수
> 2. `capabilities`는 ALWAYS(필수 스킬)와 NEVER(금지 스킬) 배열
> 3. `tags`는 domain, complexity, output_format으로 분류
> 4. JSON serializable해야 함
> 5. 모든 필드는 validation 가능하게 optional/required 명확히"

이렇게 쓰면 안 된다:
> "에이전트 시스템용 타입 만들어줘"

차이점은 **구체적인 제약 조건**이다. 제약이 없으면 AI가 과도하게 복잡하거나 일관성 없는 타입을 만든다. `src/core/types.ts`에서 정의한 타입들이 이후 모든 코드의 기준이 되기 때문에 처음에 정확히 해야 한다.

### 알고리즘 구현: 테스트 케이스 먼저

매칭 알고리즘처럼 로직이 복잡한 부분은 **테스트 케이스를 먼저 작성**하게 했다. 이때 프롬프트:

> "3-tier agent 매칭 시스템을 구현해줘. 먼저 테스트 케이스부터:
> 
> **Tier 1 (Exact)**: 작업 키워드가 agent tags와 정확히 매치
> **Tier 2 (Fuzzy)**: Levenshtein distance로 유사 키워드 매칭  
> **Tier 3 (Semantic)**: description 기반 의미적 유사도
> 
> 각 tier별로 최소 3개 테스트 케이스 작성하고, edge case도 포함해. 그 다음에 구현해."

TDD 방식으로 접근하니 AI가 더 정확한 알고리즘을 만들었다. `tests/agent-manager.test.ts`의 테스트들이 구현 품질을 크게 높였다.

### UI 컴포넌트: 구체적인 behavior 명시

React 컴포넌트는 **사용자 상호작용 시나리오**를 구체적으로 제시했다:

> "AgentLibrary 컴포넌트를 만들어줘. 요구사항:
> 
> **데이터 흐름**: `/api/agents`에서 JSON 받아와서 카드 형태로 표시
> **필터링**: domain 태그별 필터 + 검색박스
> **카드 레이아웃**: 좌측 아이콘, 중앙 이름/설명, 우측 태그들
> **상호작용**: 카드 클릭 시 상세 모달, 태그 클릭 시 해당 태그로 필터
> 
> Tailwind CSS 사용, 반응형 grid, loading state 처리해줘."

결과적으로 `dashboard/components/AgentLibrary.tsx`는 한 번에 원하는 대로 나왔다. UI는 "어떻게 보일지"보다 "어떻게 동작할지"를 중심으로 설명하는 게 효과적이다.

## Claude Code와 MCP를 활용한 파일 구조화

이 프로젝트에서 Claude Code의 강력함을 제대로 경험했다. 특히 **멀티 파일 리팩토링**과 **일관성 유지**에서 빛났다.

### CLAUDE.md로 프로젝트 컨텍스트 관리

프로젝트 루트에 `CLAUDE.md`를 만들어 전체 구조와 컨벤션을 정의했다:

```markdown
# AgentOchester Project Context

## Architecture
- `/src/core`: 타입 정의, 파서, 매칭 엔진
- `/src/server`: API handlers  
- `/dashboard`: Next.js 프론트엔드
- `/tests`: Vitest 테스트 파일
- `/agents`: YAML agent definitions

## Code Conventions
- 모든 함수는 JSDoc으로 문서화
- 테스트 커버리지 80% 이상 유지
- 타입 안전성 우선 (any 사용 금지)
- 에러 핸들링은 Result<T, E> 패턴

## Current Focus
agent matching 정확도 개선, 대시보드 UX 완성
```

이렇게 하니 Claude가 새 파일을 만들 때마다 기존 패턴을 일관되게 따랐다. 프로젝트가 커질수록 더 중요해지는 패턴이다.

### /commit과 /review 활용

큰 변경사항을 만들 때는 단계적으로 접근했다:

1. **구조 설계**: `/review` 명령으로 현재 코드 분석
2. **구현**: 관련 파일들을 한번에 수정
3. **검증**: `/commit` 전에 테스트 실행
4. **커밋**: 의미 있는 단위로 분할

예를 들어 `adapter.ts` 파서를 개선할 때:

```bash
/review src/core/adapter.ts tests/adapter.test.ts
# 현재 파서의 문제점 파악

/edit src/core/adapter.ts
# ALWAYS/NEVER 파싱 버그 수정

/test tests/adapter.test.ts  
# 테스트 통과 확인

/commit "fix: recursive dir scan, ALWAYS/NEVER parsing, tag scoring, domain inference"
```

이 패턴으로 11개 commit 모두 깔끔하게 분리되었다.

### 멀티 파일 컨텍스트 관리

한 번에 여러 파일을 수정해야 하는 상황이 많았다. 특히 타입 정의가 바뀌면 연관된 파일들을 모두 업데이트해야 한다.

효과적인 접근법:

> "타입 정의를 변경하려고 한다. 영향받는 파일들:
> - `src/core/types.ts`: AgentDefinition에 priority 필드 추가  
> - `src/core/adapter.ts`: YAML 파서에 priority 파싱 로직
> - `src/core/agent-manager.ts`: 매칭 시 priority 고려
> - `tests/*.test.ts`: 모든 테스트 데이터에 priority 추가
> 
> 의존성 순서대로 수정해줘. 각 단계마다 컴파일 에러 없게."

Claude Code는 파일 간 의존성을 잘 이해하고 올바른 순서로 수정했다. 이런 리팩토링을 수동으로 했다면 하루는 걸렸을 것이다.

## 에이전트 정의 파싱의 복잡성 해결

이 프로젝트에서 가장 까다로운 부분은 `adapter.ts`였다. Markdown과 YAML 두 가지 포맷을 모두 지원하면서 복잡한 파싱 로직이 필요했다.

### 점진적 complexity 증가

처음에는 간단한 YAML 파서부터 시작했다:

> "YAML 에이전트 정의를 파싱하는 함수를 만들어줘. 필수 필드만 먼저:
> ```yaml
> name: "Code Reviewer"
> description: "Reviews code for best practices"
> tags:
>   domain: ["development"]
> ```"

동작하는 기본 버전을 만든 다음, 단계적으로 기능을 추가했다:

1. **Markdown frontmatter 지원**
2. **ALWAYS/NEVER capabilities 파싱**  
3. **재귀 디렉토리 스캔**
4. **에러 핸들링과 validation**

각 단계마다 테스트를 추가해서 regression을 방지했다. 한 번에 모든 기능을 요구했다면 버그투성이가 되었을 것이다.

### 에러 케이스 중심 프롬프팅

파서 같은 코드는 **에러 케이스**를 먼저 정의하는 게 중요하다:

> "YAML 파싱 시 발생할 수 있는 에러 케이스들:
> 1. 파일이 존재하지 않음
> 2. YAML 문법 오류  
> 3. 필수 필드 누락 (name, description)
> 4. 잘못된 타입 (tags가 배열이 아님)
> 5. 빈 파일 또는 빈 객체
> 
> 각각에 대해 명확한 에러 메시지와 함께 Result<AgentDefinition, ParseError> 반환해줘."

이렇게 하니 `adapter.ts`의 에러 핸들링이 매우 견고해졌다. `tests/adapter.test.ts`에서 모든 에러 케이스를 검증한다.

## 더 나은 방법은 없을까

이 프로젝트를 진행하면서 몇 가지 개선점을 발견했다.

### LangChain 같은 프레임워크 고려

현재는 직접 구현한 매칭 알고리즘을 쓰는데, LangChain의 `VectorStoreRetriever`를 쓰면 더 정확할 것 같다. 특히 semantic matching 부분은 embedding 기반으로 대체할 수 있다.

```typescript
// 현재 방식 (단순 키워드 매칭)
const semanticScore = description.includes(task.toLowerCase()) ? 0.7 : 0.0;

// 개선 방향 (embedding 유사도)
const embeddings = new OpenAIEmbeddings();
const vectorStore = new MemoryVectorStore(embeddings);
const similarity = await vectorStore.similaritySearch(task, 5);
```

### Agent definition 스키마 표준화

현재는 자체 YAML 포맷을 쓰는데, OpenAI의 GPTs 스키마나 AutoGPT의 agent config를 참고하면 더 호환성이 좋을 것이다. 특히 `capabilities`를 skills/tools/constraints로 세분화하는 게 맞다.

### 실시간 agent 업데이트

지금은 파일 시스템 기반이라 agent를 추가하려면 재시작이 필요하다. 프로덕션에서는 Redis나 database를 쓰고 hot-reload를 지원해야 한다.

### TypeScript 타입 생성 자동화

YAML 스키마에서 TypeScript 타입을 자동 생성하면 더 좋겠다. `json-schema-to-typescript` 같은 도구로 schema-first 개발이 가능하다.

## 정리

- **계층별 프롬프팅**: 타입 정의는 제약 조건, 알고리즘은 테스트 케이스, UI는 상호작용 시나리오 중심
- **점진적 complexity**: 기본 기능부터 만들고 단계적으로 확장, 각 단계마다 테스트 추가
- **에러 케이스 우선**: 파서나 API 같은 경계 코드는 실패 시나리오를 먼저 정의
- **CLAUDE.md 활용**: 프로젝트 컨텍스트를 문서화하면 일관성 있는 코드 생성 가능

<details>
<summary>이번 작업의 커밋 로그</summary>

922ae01 — feat: add Next.js dashboard with agent library and matching panel
68762ae — feat: add server API handler for agent listing and matching  
72bb8a7 — feat: add assembler.ts — prompt assembly for agents and teams
2d455ba — fix: recursive dir scan, ALWAYS/NEVER parsing, tag scoring, domain inference
e30f077 — docs: add implementation plan for agent system
174b32a — chore: add config.yaml and vitest configuration  
4521654 — feat: add AgentCatalog and AgentManager with 3-tier matching
49dd638 — feat: add 8 builtin custom YAML agents with validation tests
48f2096 — feat: add adapter.ts — .md to AgentDefinition parser with full test coverage
f4c1673 — feat: add core type definitions (AgentDefinition, AgentSource, CatalogEntry, Task)
3e6c682 — chore: init project with TypeScript, Vitest, agency-agents submodule

</details>