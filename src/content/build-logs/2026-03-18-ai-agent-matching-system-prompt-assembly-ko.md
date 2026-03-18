---
title: "AI로 에이전트 매칭 시스템 만들기 — 프롬프트 어셈블리가 핵심이다"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [fix, feat, chore, typescript, css]
---

복잡한 프롬프트 시스템을 AI로 구축하고 싶다면 반드시 봐야 할 글이다. 12개 커밋으로 에이전트 매칭 시스템을 처음부터 완성시키면서, 어떤 프롬프팅 패턴과 구조화 전략이 효과적인지 실전 경험을 공유한다.

## 배경: 무엇을 만들고 있는가

agentochester라는 에이전트 매칭 시스템을 만들고 있다. 사용자가 작업을 입력하면 가장 적합한 AI 에이전트를 찾아주고, 여러 에이전트를 조합해서 복합 작업을 처리할 수 있게 하는 시스템이다.

핵심 구조는 이렇다:
- `AgentCatalog`: 수백 개 에이전트 정의를 로드하고 관리
- `AgentManager`: 3단계 매칭 시스템으로 최적 에이전트 선택
- `Assembler`: 선택된 에이전트들을 하나의 실행 가능한 프롬프트로 조합
- Next.js 대시보드: 실시간 매칭 결과를 보여주는 UI

이번 작업의 목표는 타입 정의부터 프론트엔드까지 end-to-end로 작동하는 MVP를 완성하는 것이었다.

## 프롬프트 어셈블리 — 에이전트를 실행 코드로 바꾸는 법

가장 핵심적인 작업은 `assembler.ts` 구현이었다. 개별 에이전트 정의를 받아서 실제로 실행할 수 있는 프롬프트로 변환하는 모듈이다.

### AI에게 어셈블리 로직을 설계하게 하는 프롬프트

처음에는 이렇게 막연하게 물어봤다:

> "에이전트 여러 개를 조합해서 하나의 프롬프트로 만드는 함수 짜줘"

결과는 형편없었다. 단순히 `system` 프롬프트를 concatenation하는 코드만 나왔다. 문제를 구체화해야 했다.

효과적인 프롬프트는 이렇게 짰다:

> "에이전트 정의에는 `system`, `instructions`, `constraints` 필드가 있다. 여러 에이전트를 조합할 때 발생하는 문제들을 생각해봐:
> 1. 같은 역할의 `system` 프롬프트가 중복될 때 어떻게 merge할 것인가
> 2. 에이전트 A의 constraints가 에이전트 B의 instructions와 충돌할 때 우선순위는?
> 3. 팀 작업 시 각 에이전트의 책임 범위를 어떻게 명확히 구분할 것인가
>
> 이 문제들을 해결하는 `assemblePrompt` 함수를 TypeScript로 구현해줘. conflict resolution 전략도 포함해서."

이번엔 훨씬 정교한 코드가 나왔다:

```typescript
export function assemblePrompt(agents: AgentDefinition[], task?: Task): string {
  // System contexts merge with deduplication
  // Instructions는 agent priority 순으로 정렬
  // Constraints는 AND 조건으로 누적
  // Conflict detection and resolution
}
```

핵심은 **문제를 구체적으로 나열**하는 것이다. AI는 추상적인 요구사항보다 구체적인 문제 시나리오에서 훨씬 좋은 솔루션을 만든다.

### 테스트 케이스로 검증하게 하는 패턴

`assembler.test.ts` 작성할 때도 AI를 활용했다. 하지만 단순히 "테스트 짜줘"가 아니라 **edge case를 찾게** 했다:

> "assembler 함수의 테스트를 짜는데, 이런 시나리오들을 반드시 커버해야 한다:
> - 단일 에이전트 vs 멀티 에이전트 어셈블리 결과 차이
> - 동일한 domain 에이전트들끼리 조합했을 때 중복 제거 로직
> - constraints 충돌 시 어떤 에러를 던지는지
> - task context가 있을 때와 없을 때 프롬프트 구조 차이
> 
> 각 케이스마다 expected output을 정확히 정의하고, 실패 조건도 명시해줘."

결과적으로 114개 라인의 comprehensive test suite가 나왔다. AI가 생각하지 못한 edge case도 몇 개 추가했지만, 기본 골격은 충분히 견고했다.

## 3단계 매칭 시스템 — LLM이 놓치는 함정들

`AgentManager`의 매칭 로직 구현에서 흥미로운 패턴을 발견했다. AI에게 매칭 알고리즘을 설계하라고 하면 대부분 semantic similarity만 고려한다. 하지만 실제로는 더 복잡한 조건들이 필요하다.

### 매칭 알고리즘 설계 프롬프트

처음 시도:

> "사용자 task에 가장 적합한 agent를 찾는 매칭 함수 만들어줘"

결과: 단순한 keyword matching이나 vector similarity 코드만 나온다.

개선된 프롬프트:

> "에이전트 매칭을 3단계로 나누어 설계해야 한다:
> 1. **Filtering**: task의 domain/category와 agent의 specialization이 overlap하는지 확인
> 2. **Scoring**: capability match, constraint compatibility, performance history 종합 점수
> 3. **Ranking**: 최종 우선순위와 confidence score
>
> 각 단계에서 false positive를 줄이는 게 핵심이다. 예를 들어 'code review' task에 'creative writing' agent가 높은 점수를 받으면 안 된다.
>
> 이 3단계 파이프라인을 구현해주되, 각 단계의 threshold와 weight를 조정할 수 있게 만들어줘."

이때부터 실용적인 매칭 시스템이 나오기 시작했다.

### AI가 놓치는 실전 고려사항

하지만 AI 코드에는 여전히 문제가 있었다:

1. **ALWAYS/NEVER 태그 파싱 오류**: `tags: "ALWAYS:code,NEVER:creative"` 같은 복합 태그를 제대로 파싱하지 못했다
2. **Domain inference 부족**: task description에서 implicit domain을 추출하지 못했다
3. **Recursive directory scan 버그**: 중첩된 agent 파일을 읽을 때 무한루프 가능성

이런 부분들은 AI가 생성한 코드를 실제로 돌려보고 디버깅하면서 직접 수정했다. 

핵심 교훈: **AI는 해피패스 코드는 잘 짜지만, edge case와 에러 핸들링은 여전히 사람이 검토해야 한다.**

## Next.js 대시보드 — UI 작업에서 AI 활용법

프론트엔드 작업에서는 다른 접근이 필요했다. API부터 컴포넌트까지 연결되는 full-stack 작업이라 컨텍스트 관리가 중요했다.

### API 설계부터 시작하는 패턴

`app/api/agents/route.ts` 구현할 때는 백엔드 로직을 먼저 확정하고 프론트를 만드는 순서로 진행했다:

> "`AgentManager`와 `AgentCatalog`을 사용해서 Next.js API route를 만들어야 한다. 
> GET /api/agents: 전체 agent 목록 반환
> POST /api/agents: task를 받아서 matching된 agents와 confidence score 반환
>
> 응답 형식은 이렇게:
> ```json
> {
>   "agents": [...],
>   "matches": [{"agent": {...}, "score": 0.85, "reasoning": "..."}],
>   "error": null
> }
> ```
>
> 에러 핸들링은 try-catch로 감싸고, 500 에러 시 상세 스택 대신 generic message만 클라이언트에 노출해."

API 스펙을 명확히 정의한 후 컴포넌트를 만드니 타입 안정성도 보장되고 디버깅도 쉬웠다.

### React 컴포넌트 프롬프팅 전략

`AgentLibrary.tsx`와 `AgentMatchPanel.tsx` 구현할 때는 **UI 요구사항을 구체적으로** 명시했다:

> "`AgentLibrary` 컴포넌트를 만들어줘. 요구사항:
> - agent 목록을 grid layout으로 표시 (responsive)
> - 각 card에는 name, description, domain, tags 표시
> - search bar로 실시간 필터링 (name, domain, tags 검색)
> - domain별 카테고리 필터
> - loading/error state 처리
>
> TypeScript + Tailwind CSS 사용하고, `useState`로 상태 관리해. API call은 `useEffect`에서 `/api/agents` 호출."

중요한 건 **제약조건을 명시**하는 것이다. "responsive", "실시간 필터링", "loading state" 같은 키워드를 넣으면 AI가 해당 패턴을 자동으로 구현한다.

### QA 프로세스 자동화

개발 완료 후 QA 과정도 AI로 체계화했다:

> "방금 구현한 agent matching 시스템을 테스트해야 한다. 발생할 수 있는 버그들을 체크리스트로 만들어줘:
> - API 관련 (timeout, malformed request, error handling)
> - UI 관련 (빈 상태, 긴 텍스트, responsive breakpoint)
> - 비즈니스 로직 (매칭 정확도, edge case)
>
> 각 항목마다 재현 방법과 expected behavior를 명시해."

실제로 이 체크리스트를 따라 테스트하면서 4개의 주요 버그를 발견했다:
- API endpoint path 오타
- fetch error handling 누락
- 대소문자 구분 검색 문제
- React key prop 누락

## 더 나은 방법은 없을까

이 프로젝트에서 쓴 접근 방식들을 되돌아보면 몇 가지 개선점이 보인다.

### MCP (Model Context Protocol) 활용

현재는 각 작업마다 프롬프트를 수동으로 작성했지만, MCP 서버를 구축하면 더 체계적으로 할 수 있다:

```json
{
  "name": "agent-dev-assistant",
  "tools": [
    {
      "name": "generate_agent_definition", 
      "description": "Create YAML agent with validation"
    },
    {
      "name": "test_matching_logic",
      "description": "Run matching algorithm against test cases"
    }
  ]
}
```

Anthropic의 공식 MCP documentation에 따르면, 반복적인 코드 생성 작업은 custom tool로 만드는 게 정확도가 높다고 한다.

### Claude Projects + Custom Instructions

매번 긴 프롬프트를 작성하는 대신 Claude Projects에 이런 custom instructions를 설정할 수 있었다:

```
When working on agent systems:
1. Always consider conflict resolution in multi-agent scenarios
2. Include comprehensive error handling for external dependencies  
3. Design APIs with clear response schemas
4. Generate test cases that cover edge cases, not just happy paths
5. Use TypeScript strict mode and provide full type definitions
```

이렇게 하면 매번 같은 제약조건을 반복 설명할 필요가 없다.

### Agent-as-Code 패턴

현재는 YAML로 agent를 정의하지만, 더 진보된 방식은 **agent를 코드로 관리**하는 것이다:

```typescript
export const codeReviewAgent = AgentBuilder
  .create("code-reviewer")
  .withSystemPrompt("You are a senior code reviewer...")
  .withConstraints(["NEVER suggest breaking changes", "ALWAYS explain reasoning"])
  .withCapabilities(["typescript", "react", "node.js"])
  .build();
```

이렇게 하면 타입 안정성, IDE 지원, 리팩토링 도구 등 모든 개발자 경험을 활용할 수 있다.

### 성능 최적화 관점

현재 매칭 시스템은 모든 agent를 순차적으로 평가하지만, 대규모 agent catalog에서는 병목이 될 수 있다. 더 나은 접근:

1. **Vector embeddings**: Agent descriptions를 미리 embedding해서 similarity search 최적화
2. **Caching layer**: 동일한 task pattern에 대한 매칭 결과 캐싱
3. **Lazy loading**: UI에서 agent 정보를 점진적으로 로딩

OpenAI Cookbook의 "Semantic Search" 섹션에서 권장하는 패턴이다.

## 정리

- **문제 시나리오 기반 프롬프팅**: 추상적 요구사항보다 구체적 문제 상황을 제시하면 AI가 더 실용적인 솔루션을 만든다
- **3단계 구조화**: 복잡한 로직은 filtering → scoring → ranking 같은 파이프라인으로 나누어 각각 프롬프팅한다  
- **API 우선 개발**: 백엔드 스펙을 확정한 후 프론트엔드를 만들면 타입 안정성과 디버깅 효율성이 올라간다
- **AI 코드 검증은 필수**: 해피패스는 잘 만들지만 에러 핸들링과 edge case는 직접 확인해야 한다

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