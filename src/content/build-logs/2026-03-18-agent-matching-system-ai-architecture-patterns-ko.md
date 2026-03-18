---
title: "에이전트 매칭 시스템을 만들며 배운 AI 기반 아키텍처 설계법"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [feat, fix, chore, typescript, css]
---

에이전트 매칭 시스템을 처음부터 구축하면서 AI를 어떻게 활용했는지 정리한다. TypeScript 타입 설계부터 Next.js 대시보드까지, 11개 커밋에서 8천 줄 이상의 코드를 만들어낸 과정에서 발견한 프롬프팅 패턴과 구조화 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

AgentOchester는 YAML 형식으로 정의된 에이전트들을 카탈로그화하고, 사용자의 작업(Task)에 가장 적합한 에이전트를 매칭해주는 시스템이다. 기존에 산재되어 있던 `.md` 파일들을 파싱하고, 3단계 매칭 알고리즘으로 점수를 매겨 추천한다.

이번 작업의 목표는 백엔드 코어 로직부터 프론트엔드 대시보드까지 전체 파이프라인을 구현하는 것이었다. 특히 타입 안정성을 보장하면서도 확장 가능한 아키텍처를 만들어야 했다.

## 타입 우선 설계로 AI와 협업하기

처음부터 `AgentDefinition`, `Task`, `CatalogEntry` 같은 핵심 타입을 정의하고 시작했다. 이게 AI와 협업할 때 가장 중요한 전략이다.

### 프롬프팅 전략: 타입 기반 코드 생성

타입을 먼저 보여주고 구현을 요청하면 AI가 훨씬 정확한 코드를 만든다:

> "다음 타입 정의를 보고 `AgentManager` 클래스를 구현해줘:
> 
> ```typescript
> interface AgentDefinition {
>   name: string;
>   description: string;
>   tags: string[];
>   domain?: string;
>   constraints?: string[];
> }
> 
> interface Task {
>   description: string;
>   requiredCapabilities?: string[];
>   domain?: string;
> }
> ```
> 
> 3단계 매칭 로직이 필요하다: 1) 도메인 매칭, 2) 태그 유사도, 3) 설명 유사도. 각 단계별로 가중치를 다르게 줘야 한다."

이렇게 쓰면 안 된다:
> "에이전트 매칭하는 클래스 만들어줘"

타입 정보가 있으면 AI가 메서드 시그니처, 리턴 타입, 예외 처리까지 정확하게 구현한다. 특히 `CatalogEntry`에 `matchScore` 필드를 미리 정의해두니까 매칭 로직도 자연스럽게 이 구조를 따라갔다.

### Claude Code의 타입 추론 활용

`claude.md`에 프로젝트의 타입 정의를 전부 포함시켰다:

```markdown
# AgentOchester

## Core Types
- AgentDefinition: name, description, tags, domain, constraints
- Task: description, requiredCapabilities, domain  
- CatalogEntry: agent + source + matchScore

## Architecture
- adapter.ts: .md → AgentDefinition 파싱
- catalog.ts: AgentCatalog 관리
- agent-manager.ts: 매칭 로직
- assembler.ts: 프롬프트 조립
```

이 설정 하나로 모든 파일에서 일관된 타입을 사용할 수 있었다. AI가 새로운 메서드를 추가할 때도 기존 타입과 충돌하지 않는 코드를 만들어준다.

## 파싱 로직을 AI에게 맡기는 법

`.md` 파일을 `AgentDefinition`으로 변환하는 `adapter.ts`가 가장 까다로운 부분이었다. YAML frontmatter와 markdown 본문을 동시에 처리해야 하고, 에러 핸들링도 견고해야 한다.

### 프롬프팅 전략: 엣지 케이스를 먼저 정의

파싱 로직을 요청할 때 가능한 모든 엣지 케이스를 나열했다:

> "markdown 파일을 AgentDefinition으로 파싱하는 함수를 만들어줘. 다음 케이스들을 모두 처리해야 한다:
> 
> 1. YAML frontmatter가 있는 경우/없는 경우
> 2. description이 frontmatter에 있거나 본문 첫 문단인 경우  
> 3. tags가 배열이거나 쉼표 구분 문자열인 경우
> 4. 파일이 손상됐거나 빈 경우
> 5. YAML 문법 에러
> 
> 각 케이스별로 테스트 코드도 함께 만들어줘. `gray-matter` 라이브러리를 사용한다."

결과적으로 28개 줄이던 파서를 60개 줄로 확장하면서도 모든 엣지 케이스를 커버하는 견고한 코드가 나왔다. AI는 내가 놓쳤을 수도 있는 `matter.isEmpty` 체크나 `tags` 타입 검증도 추가해줬다.

### 구조화 전략: 테스트 우선 개발

파싱 로직은 복잡하니까 테스트부터 만들었다. AI에게 실패 케이스를 포함한 테스트 스위트를 먼저 요청하고, 그 테스트를 통과하는 구현체를 만들게 했다:

```typescript
describe('adapter', () => {
  it('parses valid markdown with frontmatter', () => {
    const input = `---
name: "Test Agent"
tags: ["coding", "review"]
---
This is a test description.`;
    
    expect(parseAgentFromMarkdown(input).name).toBe("Test Agent");
  });
  
  it('handles malformed YAML gracefully', () => {
    const input = `---
name: "Missing quotes
---`;
    expect(() => parseAgentFromMarkdown(input)).toThrow();
  });
});
```

이 방식이 효과적인 이유는 AI가 "테스트를 통과시키자"라는 명확한 목표를 갖기 때문이다. 단순히 "파싱 함수 만들어줘"보다 훨씬 정확한 구현체가 나온다.

## 매칭 알고리즘 설계와 점수 체계

3단계 매칭 로직이 이 시스템의 핵심이다. 도메인 일치도, 태그 유사도, 설명 유사도를 조합해서 최종 점수를 계산한다.

### 프롬프팅 전략: 수학적 공식을 자연어로 설명

복잡한 알고리즘일수록 수식보다는 자연어로 설명하는 게 낫다:

> "매칭 점수 계산 로직을 다음과 같이 구현해줘:
> 
> 1. 도메인 매칭 (40% 가중치): 정확히 일치하면 100점, 일치하지 않으면 0점
> 2. 태그 유사도 (35% 가중치): 공통 태그 수 / 전체 태그 수로 계산
> 3. 설명 유사도 (25% 가중치): 단어 중복도로 간단하게 계산
> 
> 최종 점수는 0-100 사이 정수로 리턴한다. 같은 점수면 name 알파벳 순으로 정렬해줘."

AI가 이 설명을 바탕으로 `calculateMatchScore` 메서드를 정확하게 구현했다. 가중치 계산, 정규화, 정렬 로직까지 모두 포함해서 말이다.

### 구조화 전략: 단계별 검증

매칭 로직은 복잡하니까 각 단계를 분리해서 검증했다. AI에게 `calculateDomainScore`, `calculateTagSimilarity`, `calculateDescriptionSimilarity`를 각각 만들게 하고, 마지막에 이들을 조합하는 `calculateMatchScore`를 구현하게 했다.

이렇게 하면 개별 함수의 정확성을 먼저 확인할 수 있고, 전체 로직에 문제가 있어도 어느 부분이 잘못됐는지 쉽게 파악할 수 있다.

## Next.js 대시보드 — 프론트엔드 구조화

백엔드가 완성되고 나니 이걸 시각화할 대시보드가 필요했다. Next.js App Router로 SPA를 만들고, 에이전트 목록과 매칭 결과를 보여주는 UI를 구현했다.

### 프롬프팅 전략: 컴포넌트 명세서 작성

React 컴포넌트를 AI에게 맡길 때는 props 인터페이스와 동작 방식을 구체적으로 명시한다:

> "다음 props를 받는 AgentLibrary 컴포넌트를 만들어줘:
> 
> ```typescript
> interface Props {
>   agents: CatalogEntry[];
>   onAgentSelect: (agent: AgentDefinition) => void;
> }
> ```
> 
> 요구사항:
> - 에이전트를 카드 형태로 나열
> - 각 카드에는 name, description, tags, matchScore 표시  
> - 카드 클릭하면 onAgentSelect 콜백 호출
> - matchScore 높은 순으로 정렬
> - 반응형 그리드 레이아웃 (desktop 3열, mobile 1열)
> - Tailwind CSS 사용"

결과물로 111줄짜리 완성도 높은 컴포넌트가 나왔다. 타입 안정성, 접근성, 스타일링 모두 기대한 수준이었다.

### API Route 패턴 활용

Next.js의 `/api/agents/route.ts`에서 백엔드 로직을 연결하는 부분도 AI가 처리했다. 중요한 건 백엔드의 `AgentManager` 클래스와 프론트엔드 컴포넌트 사이의 데이터 흐름을 명확하게 설계하는 것이다:

```typescript
// /api/agents/route.ts
export async function GET() {
  const manager = new AgentManager();
  await manager.loadAgents('./agents');
  const entries = manager.getCatalogEntries();
  return Response.json(entries);
}

export async function POST(request: Request) {
  const { task } = await request.json();
  const manager = new AgentManager();
  await manager.loadAgents('./agents');
  const matches = manager.findBestMatches(task, 5);
  return Response.json(matches);
}
```

이 API 설계가 좋은 이유는 RESTful 원칙을 지키면서도 프론트엔드에서 필요한 데이터를 정확히 제공하기 때문이다.

## 더 나은 방법은 없을까

이번 작업에서 쓴 방식들 중에서 개선할 수 있는 부분들을 생각해보자.

### Vector Embedding 기반 유사도 계산

현재는 단순한 단어 중복도로 설명 유사도를 계산하지만, OpenAI의 `text-embedding-ada-002`나 `text-embedding-3-small`을 쓰면 의미적 유사도를 더 정확하게 측정할 수 있다. 특히 "데이터 분석"과 "analytics" 같은 동의어 관계를 제대로 잡아낼 수 있다.

```typescript
async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
  const embedding1 = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text1
  });
  const embedding2 = await openai.embeddings.create({
    model: "text-embedding-3-small", 
    input: text2
  });
  
  return cosineSimilarity(embedding1.data[0].embedding, embedding2.data[0].embedding);
}
```

이 방식의 단점은 API 호출 비용과 지연시간이다. 실시간 매칭이 필요한 시스템이라면 embedding을 미리 계산해서 벡터 데이터베이스(Pinecone, Weaviate)에 저장하는 게 낫다.

### MCP 서버를 통한 agent 관리

현재는 로컬 파일시스템에서 `.md` 파일을 읽어오지만, Claude의 MCP(Model Context Protocol) 서버를 구축하면 더 동적으로 agent를 관리할 수 있다. GitHub API나 Notion API와 연동해서 agent 정의를 실시간으로 동기화하는 것도 가능하다.

```json
{
  "mcpServers": {
    "agent-catalog": {
      "command": "node",
      "args": ["./mcp-servers/agent-catalog.js"]
    }
  }
}
```

### Streaming Response로 UX 개선

매칭 결과가 많을 때는 Server-Sent Events나 WebSocket으로 점진적으로 결과를 보여주는 게 좋다. 특히 embedding 계산이나 복잡한 매칭 로직이 포함되면 사용자가 기다리는 시간을 줄일 수 있다.

### Zod를 통한 런타임 검증

현재는 TypeScript 타입으로만 검증하지만, Zod 스키마를 추가하면 런타임에서도 데이터 무결성을 보장할 수 있다:

```typescript
import { z } from 'zod';

const AgentDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  domain: z.string().optional(),
  constraints: z.array(z.string()).optional()
});

type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;
```

외부에서 들어오는 YAML 데이터를 파싱할 때 특히 유용하다.

## 정리

- **타입 우선 설계**: 핵심 타입을 먼저 정의하고 AI에게 보여주면 일관된 코드가 나온다
- **엣지 케이스 명시**: 복잡한 파싱 로직은 가능한 모든 실패 시나리오를 미리 나열해야 한다  
- **단계별 검증**: 복잡한 알고리즘은 작은 함수들로 분해해서 각각 검증한다
- **컴포넌트 명세서**: React 컴포넌트는 props 인터페이스와 동작 방식을 구체적으로 설명한다

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