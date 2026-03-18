---
title: "Claude에게 3-tier 매칭 시스템 만들게 하는 구조화 프롬프팅"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [fix, feat, chore, typescript, css]
---

AI 에이전트 매칭 시스템을 설계하면서, 복잡한 아키텍처를 어떻게 Claude에게 단계적으로 시키는지 배웠다. 8천 줄 코드를 12개 커밋으로 나누고, 각 단계마다 명확한 제약 조건과 검증 패턴을 제공하는 게 핵심이다.

## 배경: 무엇을 만들고 있는가

`agentochester`는 AI 에이전트들을 카탈로그화하고, 사용자 task에 가장 적합한 에이전트를 자동으로 매칭해주는 시스템이다. Markdown으로 작성된 에이전트 정의를 YAML로 파싱하고, 3단계 매칭 알고리즘(exact → semantic → fallback)으로 best fit을 찾는다.

핵심은 TypeScript로 견고한 타입 시스템을 만들고, Next.js 대시보드에서 실시간 매칭을 시연하는 것이다. 12개 커밋에 걸쳐 core types → adapter → catalog → API → dashboard 순서로 진행했다.

## 타입 우선 설계로 AI에게 명확한 컨텍스트 제공하기

복잡한 시스템을 AI에게 만들게 할 때 가장 중요한 건 **타입 정의부터 시작**하는 것이다. Claude가 전체 아키텍처를 이해할 수 있는 skeleton을 먼저 제공한다.

> "다음 인터페이스들을 만들어줘:
> 
> 1. `AgentDefinition` — name, description, capabilities, constraints, examples 필드
> 2. `AgentSource` — file path와 raw content를 담는 wrapper
> 3. `CatalogEntry` — AgentDefinition + metadata (tags, domain, priority)
> 4. `Task` — user input과 context requirements
> 
> 각 타입은 Zod schema로 validation까지 포함. JSDoc으로 필드 설명도 추가."

이렇게 쓰면 안 된다:
> "에이전트 시스템 만들어줘"

타입을 먼저 정의하면 Claude가 이후 모든 구현에서 일관된 인터페이스를 사용한다. `src/core/types.ts`에서 시작해서, adapter와 catalog에서 같은 타입을 참조하게 된다.

**검증 패턴도 함께 요청한다:**

```typescript
export const AgentDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(10),
  capabilities: z.array(z.string()).min(1),
  constraints: z.object({
    always: z.array(z.string()).optional(),
    never: z.array(z.string()).optional(),
  }).optional(),
});
```

Zod를 쓰면 runtime validation과 TypeScript 타입이 자동으로 sync된다. AI에게 "타입 안전성을 보장하는 validation layer까지 포함해달라"고 명시하는 게 중요하다.

## Markdown 파싱을 단계별로 분해하는 프롬프트 패턴

복잡한 파싱 로직은 한번에 시키지 말고 **3단계로 나눈다**: tokenize → parse → validate.

> "Markdown 파일을 `AgentDefinition`으로 변환하는 `adapter.ts`를 만들어줘:
> 
> **단계 1**: frontmatter에서 YAML 추출 (gray-matter 사용)
> **단계 2**: body에서 sections 파싱 (## Capabilities, ## Constraints 등)
> **단계 3**: Zod schema로 validation 후 AgentDefinition 반환
> 
> **에러 핸들링**: 
> - 필수 section 누락 시 명확한 에러 메시지
> - YAML parsing 실패 시 line number 포함
> - validation 실패 시 어떤 필드가 문제인지 표시
> 
> **제약 조건**:
> - ALWAYS/NEVER parsing은 정확히 이 format: `- ALWAYS: do X`
> - 빈 파일이나 invalid markdown도 graceful handling
> - 100% test coverage로 모든 edge case 검증"

단계별 분해의 장점은 각 단계를 독립적으로 테스트할 수 있다는 것이다. `parseMarkdownSections()`, `extractConstraints()`, `validateAgentDefinition()` 함수가 각각 역할이 명확하다.

**실제 구현에서 나온 핵심 패턴:**

```typescript
function parseConstraints(content: string): AgentConstraints {
  const always = extractConstraintItems(content, 'ALWAYS');
  const never = extractConstraintItems(content, 'NEVER');
  
  return { always, never };
}

function extractConstraintItems(content: string, type: 'ALWAYS' | 'NEVER'): string[] {
  const regex = new RegExp(`^\\s*-\\s*${type}:\\s*(.+)$`, 'gim');
  const matches = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }
  
  return matches;
}
```

AI에게 regex 패턴을 직접 시키지 말고, "어떤 format을 파싱해야 하는지 예시"를 보여주고 구현은 맡긴다. Claude가 더 견고한 파싱 로직을 만든다.

## 3-tier 매칭 알고리즘의 구조화된 프롬프팅

매칭 시스템은 exact match → semantic similarity → fallback 순서로 동작한다. 각 tier마다 다른 전략이 필요하므로 프롬프트도 분리한다.

> "3단계 매칭 알고리즘을 구현해줘:
> 
> **Tier 1 — Exact Match** (threshold: 0.9+)
> - task keywords가 agent capabilities와 정확히 일치
> - domain tags 완전 매치 시 bonus score
> - 예시: "translate Korean" → agent with "translation" capability
> 
> **Tier 2 — Semantic Similarity** (threshold: 0.6-0.8)
> - TF-IDF 또는 simple word overlap으로 유사도 계산
> - constraints 위반 시 score penalty
> - 예시: "code review" → agent with "analysis", "feedback" capabilities
> 
> **Tier 3 — Fallback** (threshold: 0.3+)
> - priority score 기반 정렬
> - general purpose agents 우선 반환
> - 최소한 1개는 항상 반환 보장
> 
> **스코어링 함수**:
> - capability match: +0.3 per match
> - domain match: +0.2 bonus
> - constraint violation: -0.5 penalty
> - priority weight: high=1.2x, medium=1.0x, low=0.8x"

각 tier의 threshold와 scoring weight를 명시적으로 제공하는 게 중요하다. AI가 추상적인 "좋은 매칭"이 아니라 구체적인 수치로 판단할 수 있게 한다.

**실제 구현된 매칭 로직:**

```typescript
export class AgentMatcher {
  findBestMatches(task: Task, agents: CatalogEntry[], limit = 3): MatchResult[] {
    const scored = agents.map(agent => ({
      agent,
      score: this.calculateScore(task, agent),
      tier: this.determineTier(task, agent)
    }));
    
    return scored
      .filter(result => result.score >= this.getMinThreshold(result.tier))
      .sort((a, b) => b.score - a.score || this.compareTiers(a.tier, b.tier))
      .slice(0, limit);
  }
  
  private calculateScore(task: Task, agent: CatalogEntry): number {
    let score = 0;
    
    // Capability matching
    const capabilityMatches = this.countCapabilityMatches(task.description, agent.capabilities);
    score += capabilityMatches * 0.3;
    
    // Domain bonus
    if (task.domain && agent.tags.includes(task.domain)) {
      score += 0.2;
    }
    
    // Constraint penalties
    if (this.violatesConstraints(task, agent)) {
      score -= 0.5;
    }
    
    return Math.max(0, Math.min(1, score));
  }
}
```

스코어링 로직을 별도 함수로 분리하면 각 요소별로 unit test를 작성할 수 있다. `calculateScore()`, `countCapabilityMatches()`, `violatesConstraints()` 함수가 독립적으로 검증된다.

## Next.js API와 React 컴포넌트 연동 패턴

백엔드 로직이 완성되면 Next.js로 사용자 인터페이스를 만든다. 여기서 핵심은 **API 먼저, UI 나중** 순서다.

> "Next.js API handler를 만들어줘:
> 
> **Route**: `/api/agents`
> **GET**: 전체 에이전트 목록 반환 (pagination 지원)
> **POST**: task description 받아서 매칭 결과 반환
> 
> **Request/Response 타입**:
> ```typescript
> // POST /api/agents
> interface MatchRequest {
>   task: string;
>   domain?: string;
>   limit?: number;
> }
> 
> interface MatchResponse {
>   matches: Array<{
>     agent: AgentDefinition;
>     score: number;
>     tier: 1 | 2 | 3;
>     reasoning: string;
>   }>;
>   totalTime: number;
> }
> ```
> 
> **에러 처리**:
> - 400: invalid request body
> - 500: internal matching error
> - 모든 에러에 structured error message
> 
> **성능 요구사항**:
> - 매칭 시간 500ms 이내
> - 결과에 performance metrics 포함"

API를 먼저 정의하면 frontend 개발할 때 mock data 없이 바로 실제 데이터로 작업할 수 있다.

**React 컴포넌트 프롬프팅:**

> "`AgentMatchPanel` 컴포넌트를 만들어줘:
> 
> **기능**:
> - task input field (실시간 validation)
> - domain selector (dropdown)
> - 매칭 결과 리스트 (score와 reasoning 표시)
> - loading state와 error handling
> 
> **UI 요구사항**:
> - Tailwind CSS 사용
> - responsive design (mobile-first)
> - score를 progress bar로 시각화
> - tier별로 다른 색상 (1=green, 2=yellow, 3=red)
> 
> **UX 패턴**:
> - 300ms debounce로 API 호출
> - optimistic updates (즉시 loading state)
> - keyboard navigation 지원 (Enter로 검색)
> - 빈 결과일 때 helpful message"

UI 컴포넌트도 기능/디자인/UX로 나눠서 요청한다. Claude가 각 측면을 고려해서 더 완성도 높은 컴포넌트를 만든다.

## Claude Code로 QA 이슈를 효율적으로 처리하기

개발이 끝나면 QA 단계에서 여러 이슈가 발견된다. 이때 Claude Code의 `/fix` 명령어와 멀티 파일 수정이 효과적이다.

실제 QA에서 나온 이슈들:
- API endpoint 매칭이 안 됨
- fetch error handling 누락
- 검색 결과 대소문자 구분 문제
- React key props warning

**효과적인 QA 픽스 프롬프트:**

> "/fix 다음 4개 이슈를 한번에 해결해줘:
> 
> 1. `dashboard/app/api/agents/route.ts` — POST method가 404 반환
> 2. `dashboard/components/AgentMatchPanel.tsx` — fetch error를 catch하지 않음
> 3. `dashboard/lib/agents-handler.ts` — 검색 시 대소문자 구분으로 매칭 실패
> 4. `dashboard/components/AgentLibrary.tsx` — map에서 React key warning
> 
> **제약 조건**:
> - 기존 로직 변경 최소화
> - TypeScript strict mode 준수
> - console.error로 디버깅 정보 추가
> - 각 파일별로 어떤 변경했는지 주석 추가"

Claude Code는 여러 파일을 동시에 수정할 때 컨텍스트를 잘 유지한다. 하나씩 고치는 것보다 관련된 이슈를 묶어서 처리하는 게 더 효율적이다.

**실제 픽스 패턴:**

```typescript
// API route 수정
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 추가: request validation
    if (!body.task) {
      return Response.json({ error: 'task is required' }, { status: 400 });
    }
    
    const matches = await agentManager.findMatches(body.task);
    return Response.json({ matches });
  } catch (error) {
    // 추가: 구체적인 에러 로깅
    console.error('API matching error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 컴포넌트 error handling
const handleSearch = async () => {
  try {
    setLoading(true);
    const response = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: query })
    });
    
    // 추가: HTTP 에러 체크
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    setMatches(data.matches);
  } catch (error) {
    // 추가: 사용자 친화적 에러 메시지
    console.error('Search failed:', error);
    setError('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
  } finally {
    setLoading(false);
  }
};
```

## 더 나은 방법은 없을까

이번 작업에서 사용한 패턴들보다 더 효율적인 대안들이 있다:

**1. MCP (Model Context Protocol) 서버 활용**

현재는 Claude에게 매번 전체 컨텍스트를 설명했지만, MCP 서버로 프로젝트 구조를 persistent하게 관리할 수 있다:

```yaml
# claude_desktop_config.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "./src"]
    },
    "memory": {
      "command": "npx", 
      "args": ["@modelcontextprotocol/server-memory"]
    }
  }
}
```

MCP를 쓰면 타입 정의나 API 스펙을 재설명하지 않고도 Claude가 프로젝트 전체를 이해한다.

**2. Claude Code의 Skills 커스터마이징**

반복되는 패턴들을 Custom Skills로 등록하면 더 일관된 코드를 생성할 수 있다:

```yaml
# skills/typescript-api.md
## TypeScript API Handler Pattern

Always include:
- Zod validation for request body
- Structured error responses with HTTP status
- Performance logging with timing
- TypeScript strict mode compliance

Template:
...
```

**3. Cursor Composer vs Claude Code 비교**

Cursor의 Composer 모드는 멀티 파일 refactoring에서 더 나을 수 있다. 특히 import path 자동 수정이나 cross-file 타입 추론에서 장점이 있다. 하지만 프롬프트 컨텍스트 관리는 Claude Code가 더 직관적이다.

**4. 성능 최적화 방향**

현재 매칭 알고리즘은 O(n) linear search다. 실제 production에서는 vector database (Pinecone, Weaviate)를 쓰거나 elasticsearch로 indexing하는 게 낫다. 하지만 프로토타입 단계에서는 단순한 구조가 디버깅과 테스트에 유리하다.

## 정리

복잡한 시스템을 AI에게 만들게 할 때 핵심은 구조화된 단계별 접근이다. 타입 정의부터 시작해서 각 레이어별로 명확한 제약 조건과 검증 패턴을 제공한다. 한번에 모든 걸 시키지 말고 core → adapter → API → UI 순서로 진행한다. QA 이슈는 관련된 문제들을 묶어서 처리하고, 항상 더 나은 도구와 패턴을 찾아본다.

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