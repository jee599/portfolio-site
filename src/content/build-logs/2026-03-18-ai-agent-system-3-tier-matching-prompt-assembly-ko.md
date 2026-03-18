---
title: "AI 에이전트 시스템 구축기 — 3-tier 매칭과 프롬프트 어셈블리 패턴"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [fix, feat, chore, typescript, css]
---

이번에는 AI 에이전트 카탈로그 시스템을 처음부터 끝까지 만들었다. 핵심은 사용자 요청에 맞는 에이전트를 자동으로 찾아주는 3-tier 매칭 알고리즘과, 여러 에이전트를 조합해서 하나의 프롬프트로 만드는 어셈블리 패턴이다. 이 글에서는 복잡한 시스템을 AI와 함께 설계하고 구현할 때 어떤 프롬프팅 전략이 효과적인지, 어떻게 구조를 잡아야 하는지 다룬다.

## 배경: 에이전트 오케스트레이션이 필요한 시점

요즘 AI 에이전트들이 쏟아져 나오고 있다. 코딩용, 글쓰기용, 분석용 등 각자 전문 영역이 있다. 문제는 실제 작업에서는 여러 에이전트를 조합해야 하는 경우가 많다는 점이다. 

예를 들어 "블로그 포스트 하나를 완성하려면" 아이디어 생성 → 구조 설계 → 초안 작성 → 편집 → SEO 최적화 단계가 필요하다. 각 단계마다 다른 에이전트가 더 적합할 수 있다.

이번 프로젝트의 목표는 간단했다:
1. 사용자가 "이런 작업을 하고 싶다"고 하면 적절한 에이전트를 추천한다
2. 여러 에이전트를 조합해서 하나의 작업 파이프라인으로 만든다
3. 이 모든 것을 Next.js 대시보드에서 직관적으로 관리한다

## 타입 시스템부터 설계하라

큰 시스템을 AI와 만들 때 가장 중요한 건 타입 정의다. 처음에 이걸 확실히 해두면 나머지 작업이 훨씬 수월해진다.

내가 쓴 프롬프트:

> "AI 에이전트 카탈로그 시스템을 만들려고 한다. 에이전트는 `.md` 파일이나 `.yaml` 파일로 정의되고, 각각 name, description, tags, domain 정보를 가진다. 사용자가 Task를 입력하면 3단계 매칭(exact → fuzzy → semantic)으로 적절한 에이전트를 찾아준다.
> 
> 먼저 핵심 타입들을 TypeScript로 정의해줘. `AgentDefinition`, `Task`, `CatalogEntry`, `AgentSource` 같은 것들이 필요할 것 같다. 확장성을 고려해서 설계해줘."

이렇게 하면 안 된다:

> "에이전트 타입 만들어줘"

첫 번째 프롬프트는 **맥락**과 **제약 조건**이 명확하다. 파일 형식(`.md`, `.yaml`), 매칭 로직(3단계), 필요한 필드들을 구체적으로 제시했다. AI가 추측할 여지를 최소화한 것이다.

결과적으로 `AgentDefinition` 인터페이스에서 `always_include`, `never_include` 같은 세밀한 제어 옵션까지 포함된 타입 시스템이 나왔다. 이 부분은 내가 생각하지 못한 영역이었다.

```typescript
interface AgentDefinition {
  name: string;
  description: string;
  tags: string[];
  domain: string;
  always_include?: string[];
  never_include?: string[];
  prompt_template?: string;
}
```

타입을 먼저 정의하면 **AI가 일관된 구조로 코드를 생성한다**. 나중에 `AgentManager`나 `AgentCatalog` 클래스를 만들 때도 이미 정해진 인터페이스를 기준으로 작업하기 때문에 버그가 훨씬 적다.

## 3-tier 매칭 알고리즘을 단계별로 구현하기

에이전트 매칭 로직은 복잡했다. 정확한 키워드 매칭 → 퍼지 매칭 → 시맨틱 매칭 3단계로 나누어야 했다. 

여기서 핵심은 **각 단계를 별도 함수로 분리해서 AI에게 시키는 것**이다. 한 번에 전체 알고리즘을 만들어달라고 하면 논리적 구멍이 생긴다.

첫 번째 단계부터:

> "사용자 Task에서 키워드를 추출하고, 에이전트 tags와 정확히 일치하는 항목을 찾는 함수를 만들어줘. 
> 
> - 대소문자 무시, 복수형 처리
> - tag scoring: 일치하는 태그 개수 / 전체 태그 개수
> - 0.3 이상만 후보로 선정
> 
> 함수명: `exactMatch(task: Task, agents: AgentDefinition[]): ScoredAgent[]`"

단계별로 나누니까 각각의 로직이 명확해졌다. 특히 scoring 공식을 구체적으로 명시한 게 중요했다. AI가 "적절히" 점수를 매기지 않고 정확한 수식을 사용했다.

두 번째, 세 번째 단계도 마찬가지로 분리해서 구현했다:

> "exactMatch 결과가 부족할 때 사용할 fuzzyMatch 함수를 만들어줘. Levenshtein distance 기반으로 유사한 키워드를 찾는다. 임계값은 0.7로 설정."

> "시맨틱 매칭은 일단 placeholder로 두고, 나중에 embedding API를 연동할 수 있게 인터페이스만 만들어줘."

각 함수가 완성되면 바로 테스트 케이스를 작성했다. 이것도 AI에게 시켰다:

> "방금 만든 exactMatch 함수에 대한 vitest 테스트를 작성해줘. edge case들도 포함: 빈 입력, 태그 없는 에이전트, 대소문자 혼합, 복수형 처리 등"

테스트 케이스가 있으면 리팩토링할 때 안전하다. 나중에 성능 최적화나 버그 수정을 할 때 기존 동작이 깨지지 않는다는 확신을 가질 수 있다.

## Next.js와 백엔드를 동시에 개발하는 프롬프팅 패턴

프론트엔드와 백엔드를 동시에 만들 때는 **API 명세부터 확정**하는 게 핵심이다. 양쪽에서 서로 다른 데이터 구조를 예상하면 디버깅이 지옥이 된다.

API 설계 프롬프트:

> "에이전트 목록 조회와 매칭 기능을 제공하는 REST API를 설계해줘.
> 
> - `GET /api/agents` - 전체 에이전트 목록
> - `POST /api/agents/match` - Task 기반 매칭
> 
> 응답 형태를 먼저 JSON으로 보여주고, 그 다음 Next.js API route를 구현해줘. 에러 핸들링도 포함."

먼저 JSON 응답 구조를 확정하고, 그걸 기준으로 프론트엔드와 백엔드를 각각 구현했다. 이렇게 하면 타입 불일치 오류가 거의 발생하지 않는다.

React 컴포넌트를 만들 때는 **state 관리 패턴을 명시**했다:

> "AgentLibrary 컴포넌트를 만들어줘. 에이전트 목록을 카드 형태로 표시하고, 검색/필터링 기능이 있다.
> 
> - useState로 agents, loading, error 상태 관리
> - useEffect로 마운트 시 데이터 fetch
> - 검색은 name, tags에서 실시간 필터링
> - 에러 상태일 때 사용자 친화적인 메시지 표시
> 
> Tailwind CSS 사용하고, 반응형 그리드 레이아웃으로 만들어줘."

구체적인 요구사항을 나열하니까 일관된 패턴의 컴포넌트가 나왔다. 특히 에러 처리와 로딩 상태까지 포함된 완성도 높은 코드였다.

## 프롬프트 어셈블리 패턴의 핵심 아이디어

가장 흥미로운 부분은 프롬프트 어셈블리(`assembler.ts`) 구현이었다. 여러 에이전트를 하나의 작업 파이프라인으로 합치는 기능이다.

기본 아이디어는 이렇다:
1. 각 에이전트의 `prompt_template`을 가져온다
2. `always_include`, `never_include` 조건을 확인한다  
3. 사용자 Task에 맞게 템플릿 변수를 채운다
4. 최종 프롬프트를 하나로 합친다

여기서 까다로운 건 **조건부 로직**이었다. 어떤 에이전트는 특정 키워드가 있을 때만 포함되어야 하고, 어떤 에이전트는 반대로 특정 상황에서는 제외되어야 한다.

내가 사용한 프롬프트:

> "프롬프트 어셈블리 함수를 만들어줘. 여러 AgentDefinition을 받아서 하나의 통합 프롬프트를 생성한다.
> 
> 로직:
> 1. 각 에이전트의 always_include 조건 체크 - Task에 해당 키워드가 있어야 함
> 2. never_include 조건 체크 - Task에 해당 키워드가 있으면 제외
> 3. 통과한 에이전트들의 prompt_template을 순서대로 합침
> 4. {{task}}, {{context}} 같은 변수는 실제 값으로 치환
> 
> 함수명: `assemblePrompts(agents: AgentDefinition[], task: Task, context?: any): string`
> 
> 각 단계별로 어떤 에이전트가 포함/제외되는지 로깅도 추가해줘."

복잡한 비즈니스 로직을 AI에게 설명할 때는 **단계적 시퀀스**를 명확히 해야 한다. "이걸 먼저 하고, 그 결과를 바탕으로 이걸 하라"는 식으로.

결과적으로 나온 `assemblePrompts` 함수는 내가 예상한 것보다 훨씬 정교했다. 조건 체크 로직뿐만 아니라 템플릿 변수 처리, 에이전트 우선순위 정렬까지 포함되어 있었다.

## 빌트인 에이전트 8개를 YAML로 정의하기

시스템을 테스트하려면 실제 에이전트 데이터가 필요했다. 코딩, 글쓰기, 분석, 디자인 등 다양한 영역을 커버하는 8개 에이전트를 만들기로 했다.

여기서 핵심은 **일관된 패턴을 유지**하는 것이다. AI에게 첫 번째 에이전트 예시를 보여주고, 나머지는 같은 패턴으로 만들게 했다.

> "다음 구조로 코딩 전문 에이전트를 YAML로 만들어줘:
> 
> ```yaml
> name: "Full-Stack Developer"
> description: "웹 개발 프로젝트를 처음부터 끝까지 처리"
> domain: "development"
> tags: ["javascript", "react", "nodejs", "database", "api"]
> always_include: ["코딩", "개발", "프로그래밍"]
> never_include: ["디자인", "마케팅"]
> prompt_template: |
>   당신은 풀스택 개발자입니다. 
>   작업: {{task}}
>   다음 순서로 진행하세요:
>   1. 기술 스택 선정
>   2. 아키텍처 설계
>   3. 단계별 구현
> ```
> 
> 이 패턴을 유지하면서 나머지 7개 에이전트도 만들어줘:
> - Technical Writer (문서작성)
> - Data Analyst (데이터 분석) 
> - UI Designer (인터페이스 설계)
> - Marketing Strategist (마케팅 기획)
> - Product Manager (제품 기획)
> - DevOps Engineer (인프라 관리)  
> - QA Engineer (품질 검증)
> 
> 각각의 domain, tags, 조건들을 해당 역할에 맞게 설정해줘."

패턴을 명시하니까 8개 에이전트가 모두 일관된 구조로 나왔다. 특히 `always_include`와 `never_include` 조건이 각 역할의 특성을 잘 반영했다.

예를 들어 `Technical Writer`는 `always_include: ["문서", "설명", "가이드"]`이고 `never_include: ["코딩", "개발"]`로 설정되었다. 이렇게 하면 "API 문서 작성" 같은 Task에는 매칭되지만 "API 구현" Task에는 매칭되지 않는다.

## 에러 핸들링과 사용자 경험 개선

초기 구현에서는 몇 가지 QA 이슈가 있었다. 특히 React에서 `map` 함수를 쓸 때 `key` prop이 없다거나, API 응답이 빈 배열일 때 에러가 발생하는 문제였다.

이런 문제들을 AI에게 일괄 수정시킬 때는 **구체적인 에러 메시지**를 제공하는 게 좋다:

> "다음 QA 이슈들을 수정해줘:
> 
> 1. Warning: Each child in a list should have a unique "key" prop
>    → AgentLibrary.tsx, AgentMatchPanel.tsx에서 map 사용 부분
> 
> 2. TypeError: Cannot read property 'length' of undefined  
>    → API 응답이 null/undefined일 때 처리
> 
> 3. 검색에서 대소문자 구분 문제
>    → toLowerCase() 누락된 부분들
> 
> 4. /api/agents/match 엔드포인트 404 에러
>    → route.ts에서 POST 핸들러 확인
> 
> 각 파일별로 수정 사항을 보여주고, 왜 그렇게 고쳤는지 설명도 추가해줘."

에러 메시지와 발생 위치를 구체적으로 알려주니까 정확한 수정이 가능했다. 특히 "왜 그렇게 고쳤는지 설명"을 요청한 게 중요했다. 나중에 비슷한 문제가 생겼을 때 패턴을 알 수 있다.

## 더 나은 방법은 없을까

이번 구현에서 아쉬운 부분들이 있다. 더 좋은 방법을 생각해보자.

### 1. 시맨틱 매칭 구현

현재는 키워드 기반 매칭만 구현했다. 하지만 OpenAI Embeddings API나 sentence-transformers를 쓰면 의미 기반 매칭이 가능하다:

```typescript
async function semanticMatch(task: Task, agents: AgentDefinition[]) {
  const taskEmbedding = await getEmbedding(task.description);
  const agentEmbeddings = await Promise.all(
    agents.map(agent => getEmbedding(agent.description))
  );
  
  return agents.map((agent, i) => ({
    agent,
    score: cosineSimilarity(taskEmbedding, agentEmbeddings[i])
  })).filter(item => item.score > 0.8);
}
```

### 2. MCP (Model Context Protocol) 서버 연동

Claude Desktop의 MCP 서버로 만들면 더 자연스러운 워크플로우가 가능하다. 사용자가 Claude와 대화 중에 `/find-agent 블로그 글쓰기 도움`이라고 입력하면 바로 적절한 에이전트를 추천받을 수 있다.

MCP 서버 구현:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "find_agent",
        description: "Find best agents for a given task",
        inputSchema: {
          type: "object",
          properties: {
            task: { type: "string" },
            domain: { type: "string", optional: true }
          }
        }
      }
    ]
  };
});
```

### 3. Agent Composition 자동화

현재는 수동으로 여러 에이전트를 조합한다. 하지만 Task 복잡도를 분석해서 자동으로 필요한 에이전트들을 조합하는 것도 가능하다:

```typescript
function autoComposeAgents(task: Task): AgentDefinition[] {
  const complexity = analyzeComplexity(task);
  const requiredSkills = extractSkills(task);
  
  return findOptimalCombination(complexity, requiredSkills);
}
```

### 4. 성능 최적화

현재는 모든 에이전트를 메모리에 로드한다. 에이전트가 수백 개가 되면 성능 문제가 생길 수 있다. Redis나 SQLite 캐싱, 인덱싱이 필요하다.

특히 tag 기반 검색은 inverted index를 쓰면 훨씬 빠르다:

```typescript
// 현재: O(n * m) - n개 에이전트, m개 태그
agents.filter(agent => 
  agent.tags.some(tag => taskKeywords.includes(tag))
);

// 개선: O(k) - k개 일치하는 에이전트만
const matchingAgents = tagIndex[keyword] || [];
```

## 정리

이번 AI 에이전트 시스템 구축에서 배운 핵심 포인트들:

- 복잡한 시스템은 타입 정의부터 시작한다. AI가 일관된 구조로 코드를 생성한다.
- 알고리즘을 단계별로 나누어서 구현하면 각 부분의 품질이 올라간다.
- API 명세를 먼저 확정하고 프론트엔드/백엔드를 동시 개발하면 타입 불일치를 방지할 수 있다.
- 빌트인 데이터를 만들 때는 첫 번째 예시의 패턴을 명시해서 일관성을 유지한다.
- QA 이슈 수정 시에는 구체적인 에러 메시지와 위치를 제공하면 정확한 수정이 가능하다.

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