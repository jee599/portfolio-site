---
title: "AI 에이전트 시스템을 0에서 100까지 만드는 프롬프팅 전략"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [fix, feat, chore, typescript, css]
---

복잡한 에이전트 시스템을 처음부터 끝까지 AI와 함께 만들었다. 타입 정의부터 웹 대시보드까지, 전체 아키텍처를 어떻게 단계별로 구조화해서 LLM에게 시켰는지 공유한다. 핵심은 "큰 그림을 먼저 그리고, 작은 조각으로 나눠서 각각 명확한 제약 조건을 주는 것"이다.

## 배경: 무엇을 만들고 있는가

AgentOchester라는 AI 에이전트 매칭 시스템을 만들고 있다. 사용자가 특정 태스크를 입력하면, 미리 정의된 수백 개의 에이전트 중에서 가장 적합한 것을 찾아주는 시스템이다. 

이번 작업의 목표는 명확했다: 타입스크립트 코어 라이브러리부터 Next.js 웹 대시보드까지, 전체 시스템을 구현하는 것. 총 12개 커밋에 8000+줄의 코드가 만들어졌다.

중요한 건 이 모든 작업을 혼자 한 게 아니라는 점이다. AI와 함께 했다. 어떻게?

## 아키텍처 우선 접근법 — 큰 그림부터 그린다

가장 먼저 한 일은 전체 시스템의 타입 정의를 만드는 것이었다. 이게 핵심이다.

### 타입 정의로 시작하는 이유

복잡한 시스템을 AI에게 맡길 때, 가장 큰 실수는 "회원가입 기능 만들어줘"처럼 뭉뚱그려서 요청하는 것이다. AI는 당신이 원하는 데이터 구조를 모른다.

먼저 이렇게 프롬프트했다:

> "에이전트 매칭 시스템의 핵심 타입들을 정의해야 한다. AgentDefinition은 이름, 설명, 태그, 제약조건을 가진다. Task는 사용자 입력과 요구사항을 담는다. CatalogEntry는 에이전트의 메타데이터와 점수를 포함한다. 각 타입은 validation이 가능하도록 명확한 필드를 가져야 한다."

결과적으로 만들어진 타입:

```typescript
interface AgentDefinition {
  name: string;
  description: string;
  tags: string[];
  expertise: string[];
  constraints?: string[];
  examples?: TaskExample[];
}

interface Task {
  description: string;
  domain?: string;
  priority: 'low' | 'medium' | 'high';
  constraints?: string[];
}
```

이 타입들이 정의되니까, 이후 모든 AI 프롬프트에서 "AgentDefinition 타입을 준수해서"라고 말할 수 있게 됐다. 매번 데이터 구조를 다시 설명할 필요가 없어졌다.

### CLAUDE.md로 컨텍스트 관리

프로젝트 루트에 `CLAUDE.md` 파일을 만들어서 AI가 항상 참고할 수 있게 했다:

```markdown
# AgentOchester Development Context

## Architecture
- Core: TypeScript library with agent matching logic
- Server: API handlers for agent operations  
- Dashboard: Next.js frontend with agent library and matching panel

## Key Types
- AgentDefinition: Core agent structure
- Task: User input representation
- CatalogEntry: Agent with matching metadata

## Constraints
- All functions must have test coverage
- Use functional programming patterns
- Error handling with Result<T, Error> pattern
```

이렇게 하니까 AI가 중간에 컨텍스트를 잃어버리지 않았다. "이전에 말한 대로 AgentDefinition을 사용해서"라고 매번 반복할 필요가 없어졌다.

## 파싱과 검증 로직 — 제약 조건이 핵심이다

두 번째 단계는 외부 데이터(마크다운 파일)를 내부 타입으로 변환하는 어댑터를 만드는 것이었다. 여기서 중요한 건 AI에게 명확한 제약 조건을 주는 것이다.

### 좋은 프롬프트 vs 나쁜 프롬프트

나쁜 프롬프트:
> "마크다운 파일을 파싱해서 에이전트 정의로 만들어줘"

좋은 프롬프트:
> "adapter.ts를 만들어줘. parseMarkdownToAgent 함수는 마크다운 문자열을 받아서 AgentDefinition을 리턴한다. YAML frontmatter에서 name, description, tags를 추출한다. 본문에서 ## Expertise와 ## Examples 섹션을 파싱한다. 필수 필드가 없으면 에러를 던진다. 모든 케이스에 대한 테스트 코드도 같이 만들어줘."

차이점이 보이나? 두 번째 프롬프트는:
- 함수명을 명시했다
- 입력과 출력 타입을 명확히 했다  
- 파싱 규칙을 구체적으로 설명했다
- 에러 처리 방식을 지정했다
- 테스트 코드까지 요구했다

결과적으로 한번에 완성도 높은 코드가 나왔다. 수정 요청을 여러 번 보낼 필요가 없었다.

### 테스트 주도 개발로 품질 보장

모든 핵심 로직에 대해 테스트를 먼저 작성하게 했다:

> "parseMarkdownToAgent 함수의 테스트 케이스부터 만들어줘. 정상 케이스, frontmatter 누락, 잘못된 YAML, 필수 필드 누락, 빈 문자열 입력 등을 커버해야 한다."

AI가 테스트를 먼저 만들고, 그 테스트를 통과하는 구현체를 만들었다. 이렇게 하면 엣지 케이스를 놓치지 않는다.

## 매칭 알고리즘 — 복잡한 로직을 단계별로 나누기

에이전트 매칭은 3단계로 나뉜다: exact match, semantic match, fuzzy match. 이걸 한번에 AI에게 시키면 복잡해진다.

### 단계별 구현 전략

1단계: 인터페이스부터 정의
> "AgentManager 클래스의 인터페이스를 설계해줘. findBestMatch(task: Task): CatalogEntry[] 메서드가 핵심이다. 내부적으로는 exactMatch, semanticMatch, fuzzyMatch 세 단계로 나뉜다."

2단계: 각 매칭 전략을 개별 구현
> "exactMatch 함수를 만들어줘. task.domain과 agent.expertise가 정확히 일치하는 경우만 찾는다. 점수는 1.0으로 고정한다."

> "semanticMatch 함수를 만들어줘. 태그 기반으로 유사도를 계산한다. Jaccard similarity를 사용하고, 0.3 이상인 것만 리턴한다."

3단계: 통합 로직 구현
> "findBestMatch에서 세 단계 매칭을 순서대로 실행하고, 결과를 score 순으로 정렬해서 리턴해줘. 각 단계에서 최소 1개씩은 결과가 있어야 한다."

이렇게 나누니까 각 단계별로 디버깅도 쉽고, 테스트도 명확하게 작성할 수 있었다.

### 점수 계산 로직의 투명성

AI에게 점수 계산 공식을 명시적으로 지정했다:

> "점수 계산 규칙: exact match는 1.0, semantic match는 Jaccard similarity * 0.8, fuzzy match는 Levenshtein distance 기반으로 0.5 이하. 같은 점수일 때는 에이전트명 알파벳 순으로 정렬한다."

이렇게 하면 AI가 임의로 점수를 매기지 않는다. 일관된 결과가 나온다.

## API와 프론트엔드 — 레이어별 책임 분리

백엔드와 프론트엔드를 한번에 만들지 않았다. 레이어별로 나눠서 각각 명확한 책임을 부여했다.

### API 레이어 설계

> "Next.js API route를 만들어줘. /api/agents에서 GET 요청을 받는다. query parameter로 search, domain, limit를 받는다. 응답은 CatalogEntry[] 형태다. 에러는 {error: string} 형태로 리턴한다."

여기서 중요한 건 API 스펙을 먼저 정의한 것이다. 입력, 출력, 에러 형태를 명시하니까 AI가 일관된 API를 만들었다.

### 프론트엔드 컴포넌트 분리

대시보드를 두 개의 독립된 컴포넌트로 나눴다:
- `AgentLibrary`: 전체 에이전트 목록 + 검색 기능
- `AgentMatchPanel`: 태스크 입력 + 매칭 결과

각 컴포넌트에 대해 별도로 프롬프트했다:

> "AgentLibrary 컴포넌트를 만들어줘. 에이전트 목록을 그리드로 보여주고, 검색 입력창이 있다. 각 에이전트는 카드 형태로 이름, 설명, 태그를 표시한다. Tailwind CSS를 사용하고, 반응형으로 만들어줘."

### 상태 관리와 API 호출

프론트엔드에서 API를 호출할 때도 명확한 패턴을 지정했다:

> "agents-handler.ts에 API 호출 함수들을 만들어줘. fetchAgents(search?: string), matchAgents(task: Task) 함수가 있다. 모든 함수는 try-catch로 에러 처리를 한다. 로딩 상태도 관리할 수 있게 해줘."

결과적으로 컴포넌트 코드가 깔끔해졌다. API 로직과 UI 로직이 분리됐다.

## 더 나은 방법은 없을까

이번 작업을 돌아보면서 더 개선할 수 있는 부분들을 발견했다.

### MCP 서버 활용

현재는 에이전트 데이터를 로컬 파일로 관리하고 있다. 하지만 Model Context Protocol을 사용하면 더 효율적으로 할 수 있다:

```typescript
// MCP server로 에이전트 데이터 접근
const mcp = new MCPServer('agents');
const agents = await mcp.query('list_agents', { domain: 'coding' });
```

Anthropic 공식 문서에서 권장하는 방식이다. 대용량 데이터셋을 다룰 때 컨텍스트 윈도우 제한을 피할 수 있다.

### Claude Projects 활용

이번에는 개별 대화로 작업했지만, Claude Projects를 사용하면 더 체계적으로 관리할 수 있다. 프로젝트 지식으로 코드베이스 전체를 등록하고, custom instructions로 코딩 스타일을 고정할 수 있다.

### 에이전트 워크플로우 자동화

현재는 수동으로 각 단계를 프롬프트하고 있다. 하지만 최신 버전의 Claude에서는 multi-step reasoning이 강화됐다. 더 복잡한 워크플로우를 한번에 시킬 수 있다:

> "전체 시스템을 설계하고 구현해줘. 타입 정의 → 파싱 로직 → 매칭 알고리즘 → API → 프론트엔드 순서로, 각 단계마다 테스트 코드도 함께 만들어줘."

### 성능 최적화 패턴

대용량 에이전트 데이터를 다룰 때는 인덱싱이 필요하다. Elasticsearch나 Vector DB를 사용하는 것이 더 적합할 수 있다. 특히 semantic search에서는 embedding 기반 검색이 더 정확하다.

### 타입 안전성 강화

현재는 기본 TypeScript 타입만 사용했지만, Zod 스키마를 추가하면 런타임 검증도 가능하다:

```typescript
import { z } from 'zod';

const AgentDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(10),
  tags: z.array(z.string()).min(1),
  expertise: z.array(z.string()).min(1)
});
```

이렇게 하면 외부 데이터를 파싱할 때 더 안전하다.

## 정리

- **타입부터 정의하라**: 복잡한 시스템을 AI에게 맡길 때는 데이터 구조부터 명확히 한다
- **제약 조건을 구체적으로 명시하라**: "만들어줘"가 아니라 입력/출력/에러 처리까지 세부사항을 지정한다
- **큰 작업을 작은 단위로 나눠라**: 인터페이스 → 개별 함수 → 통합 로직 순서로 단계별 구현한다
- **테스트 주도로 품질을 보장하라**: AI에게 테스트 케이스부터 만들게 하면 엣지 케이스를 놓치지 않는다

핵심은 AI를 단순한 코드 생성기로 쓰지 말고, 명확한 요구사항을 가진 개발 파트너로 대하는 것이다. 당신이 더 구체적으로 요청할수록, AI는 더 정확한 결과를 만든다.

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