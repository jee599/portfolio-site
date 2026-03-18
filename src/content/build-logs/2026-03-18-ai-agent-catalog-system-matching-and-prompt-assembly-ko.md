---
title: "AI 에이전트 카탈로그 시스템 구축하기 — 3단계 매칭과 프롬프트 조립 패턴"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [feat, fix, chore, typescript, css]
---

복합적인 AI 시스템을 만들 때 가장 어려운 건 에이전트들을 체계적으로 관리하고 적절한 프롬프트를 동적으로 조립하는 것이다. 이번에 에이전트 카탈로그 시스템을 만들면서 발견한 효과적인 패턴과 프롬프팅 기법을 정리한다.

## 배경: 무엇을 만들고 있는가

`agentochester`는 다양한 AI 에이전트를 관리하고 특정 작업에 맞는 에이전트를 자동으로 매칭해주는 시스템이다. 현재까지 완성된 부분:

- 8개 built-in YAML 에이전트 정의
- `.md` 파일을 `AgentDefinition`으로 파싱하는 adapter
- 3단계 매칭 알고리즘 (exact → fuzzy → semantic)
- 프롬프트 동적 조립 시스템
- Next.js 대시보드 UI

목표는 단순하다. 개발자가 "코드 리뷰해줘"라고 하면 시스템이 적절한 에이전트를 찾아서 최적화된 프롬프트를 만들어주는 것이다.

## 타입 정의부터 시작하는 프롬프팅 전략

복잡한 시스템을 AI로 만들 때 가장 중요한 건 **타입부터 정의하는 것**이다. 막연히 "에이전트 시스템 만들어줘"라고 하면 AI가 헤맨다.

이렇게 프롬프트를 구성했다:

> "TypeScript로 AI 에이전트 관리 시스템의 core 타입을 정의해줘. 다음 요구사항을 만족해야 한다:
> 
> 1. `AgentDefinition`: name, description, prompt, capabilities, tags 포함
> 2. `Task`: 사용자 요청을 구조화한 객체
> 3. `CatalogEntry`: 매칭 스코어와 메타데이터 포함
> 4. 각 필드는 optional/required 구분 명확히
> 5. validation을 위한 union type도 필요"

단순히 "타입 만들어줘"가 아니라 **비즈니스 로직의 핵심 요소들을 나열**한 게 포인트다. AI가 도메인 컨텍스트를 이해할 수 있게 해준다.

결과적으로 생성된 타입들:

```typescript
export interface AgentDefinition {
  name: string;
  description: string;
  prompt: string;
  capabilities: string[];
  tags: string[];
  version?: string;
  constraints?: AgentConstraints;
}

export interface Task {
  query: string;
  context?: Record<string, any>;
  domain?: string;
  priority?: 'low' | 'medium' | 'high';
}
```

이 타입들이 있으니까 이후 모든 구현에서 AI가 일관성 있게 작업할 수 있었다.

## 3단계 매칭 알고리즘 구현 패턴

에이전트 매칭은 복잡한 로직이다. 한 번에 다 만들어달라고 하면 품질이 떨어진다. 단계적으로 나눠서 프롬프트를 줬다.

**1단계: exact matching**
> "`AgentCatalog` 클래스에 `findByExactMatch(task)` 메서드를 구현해줘. 
> task.query의 키워드와 agent.tags를 정확히 매칭하는 로직이다. 
> 매칭 스코어는 1.0으로 고정하고, 매칭된 태그 개수도 리턴해야 한다."

**2단계: fuzzy matching 추가**
> "이제 `findByFuzzyMatch()` 메서드를 추가해줘. 
> Levenshtein distance 사용해서 비슷한 단어도 매칭하고, 
> 유사도에 따라 0.6-0.9 스코어를 줘. 
> exact match에서 결과 없을 때만 실행되게 해줘."

**3단계: semantic matching**
> "마지막으로 `findBySemantic()` 추가. 
> task.domain과 agent.capabilities의 의미적 유사성으로 판단. 
> 'code review' → 'static analysis', 'quality check' 매칭되게.
> 스코어는 0.3-0.6 범위."

이렇게 3단계로 나누니까 각 단계의 로직이 명확하고 테스트하기도 쉬웠다. 전체를 한 번에 만들었으면 디버깅이 지옥이었을 것이다.

핵심은 **fallback 순서를 명시**한 것이다. exact → fuzzy → semantic 순서로 시도하고, 첫 번째에서 결과가 나오면 다음 단계는 건너뛴다.

## 프롬프트 동적 조립의 핵심 패턴

가장 복잡했던 부분은 `assembler.ts`다. 런타임에 에이전트의 base prompt와 사용자 입력을 조합해서 최적화된 프롬프트를 만드는 로직이다.

여기서 발견한 핵심 패턴:

**1) 템플릿 엔진이 아니라 객체 조립 방식**

기존에는 string template으로 접근했는데, 이렇게 하니까 복잡도가 폭발했다:

```typescript
// 이렇게 하면 안 된다
const prompt = `${agent.prompt}\n\nUser: ${task.query}\nContext: ${task.context}`;
```

대신 **구조화된 조립 방식**을 썼다:

> "`assembler.ts`에 `assemblePrompt(agent, task, options)` 함수를 만들어줘.
> 
> 1. agent.prompt를 base로 시작
> 2. task.context가 있으면 structured format으로 삽입
> 3. constraints가 있으면 별도 섹션으로 추가
> 4. 최종 user query는 맨 마지막에
> 5. 각 섹션은 명확한 구분자로 분리
> 
> 결과물은 string이 아니라 `AssembledPrompt` 객체로 리턴. sections 배열 포함해서."

이렇게 하니까 각 섹션을 개별적으로 테스트할 수 있고, 나중에 특정 섹션만 수정하기도 쉬웠다.

**2) 컨텍스트 주입 순서가 중요하다**

AI 에이전트에게 프롬프트를 줄 때 **정보의 순서**가 성능에 큰 영향을 미친다는 걸 발견했다.

효과적인 순서:
```
1. Role definition (agent.prompt)
2. Constraints and rules
3. Context data
4. Examples (if any)  
5. Current task
```

역순으로 하면 에이전트가 맥락을 제대로 파악하지 못한다. 특히 constraints를 마지막에 두면 무시되는 경우가 많다.

## YAML 에이전트 정의와 validation 패턴

8개 built-in 에이전트를 YAML로 정의할 때도 체계적으로 접근했다. 

> "다음 도메인별로 8개 YAML 에이전트를 만들어줘:
> - code-reviewer: static analysis, security, best practices
> - test-writer: unit test, integration test, edge cases  
> - refactor-specialist: clean code, performance, maintainability
> - api-designer: REST, GraphQL, documentation
> - ui-optimizer: accessibility, responsive, performance
> - data-analyst: SQL, visualization, insights
> - deployment-engineer: CI/CD, infrastructure, monitoring
> - technical-writer: documentation, tutorials, API docs
> 
> 각 에이전트마다:
> 1. 명확한 capabilities 리스트
> 2. 적절한 태그 (3-5개)
> 3. 구체적인 constraints
> 4. version field 포함"

중요한 건 **validation 로직도 함께 만들어달라**고 한 것이다:

```typescript
export const validateAgent = (data: any): AgentDefinition => {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Agent name is required');
  }
  // ... 더 많은 validation
};
```

이 validation이 있어서 잘못된 YAML 파일이 들어와도 명확한 에러 메시지를 볼 수 있었다.

## Next.js 대시보드에서 server/client 경계 다루기

대시보드 UI를 만들 때 가장 까다로운 부분은 **server-side 에이전트 로직을 client-side에서 어떻게 쓸 것인가**였다.

이런 프롬프트가 효과적이었다:

> "`/api/agents` route를 만들어줘. GET 요청으로 전체 에이전트 리스트 리턴하고, POST로 매칭 요청 처리해줘.
> 
> 주의사항:
> 1. src/core의 AgentManager를 import해서 써야 함
> 2. 매칭 결과는 스코어 순으로 정렬
> 3. client에서 쓸 수 없는 서버 전용 로직은 제외
> 4. error handling은 적절한 HTTP status code로"

그리고 client component에서는:

> "`AgentLibrary.tsx`와 `AgentMatchPanel.tsx` 컴포넌트 만들어줘.
> 
> AgentLibrary: 전체 에이전트 목록을 카드 형태로 보여줌
> AgentMatchPanel: 검색어 입력하면 매칭된 에이전트들을 스코어와 함께 표시
> 
> 둘 다 /api/agents를 fetch해서 쓰고, loading state도 처리해줘.
> Tailwind CSS로 깔끔하게 스타일링."

핵심은 **server/client 책임을 명확히 구분**해서 프롬프트에 포함한 것이다. AI가 `'use client'` directive를 어디에 써야 하는지 헷갈리지 않게 해준다.

## 더 나은 방법은 없을까

이번 구현에서 몇 가지 개선할 점들을 발견했다:

**1) Semantic matching을 vector embedding으로 교체**

현재는 단순 키워드 매칭으로 semantic search를 구현했는데, 실제로는 OpenAI embeddings이나 local embedding model을 써야 더 정확하다. `@modelcontextprotocol/server-everything`에서 제공하는 semantic search MCP를 쓰면 더 좋을 것이다.

**2) Agent composition pattern**

지금은 단일 에이전트만 매칭하는데, 복잡한 작업은 여러 에이전트를 조합해야 한다. "코드 리뷰하고 테스트도 작성해줘"라는 요청에는 `code-reviewer` + `test-writer`를 sequential하게 실행하는 패턴이 필요하다.

**3) Context-aware prompting**

현재 프롬프트 조립은 정적이다. 하지만 사용자의 이전 대화 기록이나 프로젝트 컨텍스트를 반영해서 동적으로 프롬프트를 최적화하는 게 더 효과적이다. Claude의 custom instructions처럼.

**4) Performance monitoring**

각 에이전트의 응답 품질을 추적하는 메트릭이 없다. 매칭 정확도, 응답 시간, 사용자 만족도 같은 지표를 수집해서 시스템을 개선해야 한다.

## 정리

- 복잡한 AI 시스템은 **타입 정의부터** 시작하면 일관성을 유지할 수 있다
- 매칭 알고리즘 같은 복잡한 로직은 **단계별로 나눠서** 구현하는 게 효과적이다  
- 프롬프트 조립에서 **정보의 순서**가 AI 성능에 큰 영향을 미친다
- Server/client 경계를 명확히 해서 프롬프트를 주면 Next.js 구조를 AI가 잘 이해한다

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