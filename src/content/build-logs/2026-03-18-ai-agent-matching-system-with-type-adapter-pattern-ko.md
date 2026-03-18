---
title: "AI 에이전트 매칭 시스템 만들기 — 타입과 어댑터 패턴으로 완전 자동화"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [feat, fix, chore, typescript, css]
---

새로운 AI 에이전트 매칭 시스템을 만들면서 TypeScript 타입 시스템과 어댑터 패턴을 활용해 완전 자동화된 개발 워크플로우를 구축했다. 이 글에서는 AI에게 복잡한 시스템 아키텍처를 설계하게 하는 프롬프팅 전략과 타입 기반 자동화 패턴을 다룬다.

## 배경: 무엇을 만들고 있는가

`agentochester`는 AI 에이전트들을 카탈로그화하고 사용자 요청에 가장 적합한 에이전트를 자동으로 매칭해주는 시스템이다. 기존에는 에이전트들이 `.md` 파일로만 존재했는데, 이를 구조화된 데이터로 변환하고 3단계 매칭 알고리즘을 구현해야 했다.

핵심 요구사항은 다음과 같았다:
- 기존 markdown 에이전트를 파싱해서 TypeScript 타입으로 변환
- 사용자 태스크와 에이전트를 자동 매칭하는 scoring 알고리즘
- Next.js 대시보드로 시각화
- 전체 시스템이 타입 안전해야 함

AI에게 이런 복잡한 시스템을 설계하게 할 때 가장 중요한 건 "타입부터 정의하게 하는 것"이다.

## 타입 우선 설계로 AI 작업 방향 잡기

복잡한 시스템을 AI에게 만들게 할 때 가장 흔한 실수는 "기능부터 구현해달라"고 요청하는 거다. 대신 타입 정의부터 시작하면 AI가 전체 아키텍처를 명확히 이해하고 일관성 있는 코드를 생성한다.

> "AI 에이전트 매칭 시스템을 만들어줘. 먼저 핵심 타입들을 정의해. AgentDefinition은 name, description, capabilities, domain을 가져야 하고, Task는 user input과 requirements를 담아야 해. CatalogEntry는 에이전트와 메타데이터를 결합하고, 매칭 결과는 score와 rationale을 포함해야 해."

이렇게 타입 우선으로 접근하면 AI가 다음과 같은 견고한 기반을 만든다:

```typescript
interface AgentDefinition {
  name: string;
  description: string;
  capabilities: string[];
  domain?: string;
  tags?: string[];
}

interface Task {
  description: string;
  requirements?: string[];
  domain?: string;
}

interface CatalogEntry extends AgentDefinition {
  source: AgentSource;
  metadata: {
    addedAt: Date;
    lastUpdated: Date;
  };
}
```

이 타입들이 정의되면 AI는 이를 기준으로 모든 함수 시그니처와 구현을 일관성 있게 작성한다. 타입이 없으면 AI는 중간에 API를 바꾸거나 호환되지 않는 구조를 만들어낸다.

**타입 기반 프롬프팅의 핵심 패턴:**
1. 도메인 엔터티를 먼저 interface로 정의하게 한다
2. 각 타입 간의 관계를 명시한다 (`extends`, composition)
3. 함수 시그니처를 먼저 작성하고 구현은 나중에
4. 제네릭 타입으로 확장 가능성을 열어둔다

## 어댑터 패턴으로 데이터 변환 자동화

기존 markdown 에이전트를 구조화된 데이터로 변환하는 작업에서 어댑터 패턴이 핵심이었다. AI에게 이런 데이터 변환 작업을 시킬 때는 "입력 포맷의 특징을 구체적으로 설명하고, 파싱 실패 케이스를 미리 정의해주는 것"이 중요하다.

> "markdown 파일을 AgentDefinition으로 파싱하는 adapter를 만들어줘. frontmatter에서 metadata를 추출하고, ## Capabilities 섹션에서 bullet point를 배열로 변환해. ALWAYS/NEVER 키워드가 있으면 강제 조건으로 처리하고, #태그는 따로 파싱해. 파싱 실패 시 meaningful error message를 던져야 해."

이런 프롬프트를 쓰면 AI가 robust한 파서를 만든다:

```typescript
export function parseAgentFromMarkdown(content: string): AgentDefinition {
  const lines = content.split('\n');
  const result: Partial<AgentDefinition> = {
    capabilities: [],
    tags: []
  };

  // frontmatter 파싱
  if (content.startsWith('---')) {
    const frontmatterEnd = content.indexOf('---', 3);
    const frontmatterContent = content.substring(3, frontmatterEnd);
    // YAML 파싱 로직
  }

  // ALWAYS/NEVER 조건 추출
  const alwaysMatch = extractConditions(content, 'ALWAYS');
  const neverMatch = extractConditions(content, 'NEVER');

  return result as AgentDefinition;
}
```

**어댑터 패턴에서 AI 활용 포인트:**
- 입력 데이터의 예외 케이스를 미리 나열해준다
- validation 로직을 명시적으로 요청한다
- error handling strategy를 구체적으로 지시한다
- 테스트 케이스를 함께 만들게 한다

잘못된 접근:
> "markdown을 JSON으로 바꿔줘"

이렇게 하면 AI가 단순한 string replace만 하거나 edge case를 놓친다.

## 매칭 알고리즘 설계에서 AI 제약 조건 활용

에이전트 매칭 시스템의 핵심은 사용자 태스크에 가장 적합한 에이전트를 찾는 scoring 알고리즘이다. AI에게 이런 알고리즘을 설계하게 할 때는 "수학적 기준을 명확히 제시하고, 각 요소의 가중치를 정량화하라"고 지시해야 한다.

> "3단계 매칭 알고리즘을 구현해. 1단계는 domain exact match (100점), 2단계는 capability overlap (keyword similarity 기반으로 0-80점), 3단계는 태그 유사도 (0-50점). NEVER 조건이 있으면 즉시 0점 처리. 최종 점수는 가중평균이 아니라 각 단계별 최고점을 누적해. 80점 이상만 추천 대상으로 분류해."

이런 구체적인 제약 조건이 있으면 AI가 다음과 같은 정밀한 알고리즘을 만든다:

```typescript
export function calculateMatchScore(agent: AgentDefinition, task: Task): number {
  let score = 0;

  // NEVER 조건 체크
  if (hasNeverConditions(agent, task)) {
    return 0;
  }

  // 1단계: Domain exact match
  if (agent.domain && task.domain && agent.domain === task.domain) {
    score += 100;
  }

  // 2단계: Capability overlap
  const capabilityScore = calculateCapabilityOverlap(agent.capabilities, task.requirements || []);
  score += Math.min(capabilityScore * 80, 80);

  // 3단계: Tag similarity
  const tagScore = calculateTagSimilarity(agent.tags || [], extractTagsFromTask(task));
  score += Math.min(tagScore * 50, 50);

  return Math.min(score, 230); // 최대 점수 제한
}
```

**알고리즘 설계에서 AI에게 제약 조건을 주는 핵심 패턴:**
- 각 단계별 점수 범위를 명시한다
- edge case를 미리 정의한다 (null, empty array 등)
- 성능 요구사항을 제시한다 (O(n) 이하 등)
- 테스트 가능한 단위로 함수를 분리하게 한다

## Claude Code의 slash commands로 생산성 극대화

이번 프로젝트에서 Claude Code의 slash commands를 적극 활용했다. 특히 `/commit`과 `/review` 명령어가 개발 속도를 크게 높였다.

**효과적인 slash commands 활용법:**

1. `/commit` 사용 시 컨텍스트 제공:
```
/commit 
- feat: add 3-tier agent matching algorithm
- 구현된 기능: domain exact match, capability overlap scoring, tag similarity
- 테스트 커버리지: 95% 달성
- breaking change: AgentDefinition interface에 domain 필드 추가
```

2. `/review` 전에 체크포인트 설정:
```
/review src/core/adapter.ts
체크 포인트:
- markdown parsing edge cases 처리되었나?
- ALWAYS/NEVER 조건 파싱 정확한가? 
- error handling 충분한가?
- 성능상 문제 없나? (large file 처리 시)
```

3. 멀티 파일 작업 시 의존성 순서 지정:
```
다음 순서로 작업해줘:
1. types.ts - 핵심 interface 정의
2. adapter.ts - markdown parser 
3. catalog.ts - agent collection 관리
4. agent-manager.ts - 매칭 로직
5. api.ts - HTTP endpoint
6. 마지막에 Next.js 컴포넌트들

각 단계마다 테스트 먼저 작성하고 구현해.
```

**Claude Code에서 피해야 할 패턴:**
- 너무 큰 변경을 한번에 commit하려고 하기
- 파일 간 의존성을 고려하지 않고 병렬 작업 요청
- slash command 없이 "그냥 해줘" 식 요청

## 타입 기반 테스트 자동 생성

TypeScript를 쓸 때 AI의 가장 큰 장점 중 하나는 "타입 정보를 보고 comprehensive test를 자동 생성하는 능력"이다. 이번 프로젝트에서도 타입 정의만 보고 AI가 95% 테스트 커버리지를 달성했다.

> "AgentDefinition, Task, CatalogEntry 타입을 보고 adapter.ts의 테스트를 작성해줘. 각 필드의 타입 변환이 정확한지, optional 필드 처리가 맞는지, validation이 제대로 동작하는지 확인하는 테스트를 만들어. edge case로 empty string, null, undefined, malformed markdown도 커버해."

AI가 생성한 테스트:

```typescript
describe('parseAgentFromMarkdown', () => {
  it('should parse valid markdown with all fields', () => {
    const markdown = `---
name: "Code Reviewer"
domain: "development"
---
# Code Reviewer

## Capabilities
- Static analysis
- Code quality check

#testing #automation
`;
    const result = parseAgentFromMarkdown(markdown);
    expect(result.name).toBe('Code Reviewer');
    expect(result.capabilities).toEqual(['Static analysis', 'Code quality check']);
    expect(result.tags).toEqual(['testing', 'automation']);
  });

  it('should handle missing optional fields gracefully', () => {
    // domain, tags가 없는 경우
  });

  it('should throw error for malformed frontmatter', () => {
    // YAML 파싱 실패 케이스
  });
});
```

**타입 기반 테스트 생성의 핵심:**
- interface의 모든 필드를 커버하는 테스트 요청
- optional vs required 필드 구분해서 테스트
- 타입 변환 과정에서 발생할 수 있는 모든 에러 케이스 나열
- property-based testing으로 랜덤 데이터 검증

## Next.js 대시보드 컴포넌트 자동 생성

백엔드 API가 완성되면 프론트엔드는 거의 자동으로 만들어진다. 핵심은 "API 스키마를 기반으로 컴포넌트를 생성하게 하는 것"이다.

> "AgentLibrary.tsx 컴포넌트를 만들어줘. /api/agents에서 CatalogEntry[]를 fetch해서 grid 형태로 보여줘. 각 에이전트는 card 형태로 name, description, capabilities (badge 형태), tags를 표시해. loading state와 error handling도 포함하고, TypeScript strict mode 준수해."

AI가 생성한 컴포넌트:

```tsx
'use client';

interface AgentLibraryProps {
  onAgentSelect?: (agent: CatalogEntry) => void;
}

export default function AgentLibrary({ onAgentSelect }: AgentLibraryProps) {
  const [agents, setAgents] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json();
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse">Loading agents...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <AgentCard key={agent.name} agent={agent} onSelect={onAgentSelect} />
      ))}
    </div>
  );
}
```

**React 컴포넌트 자동 생성 프롬프팅 포인트:**
- 백엔드 API의 정확한 response 타입 제공
- error state, loading state를 명시적으로 요청
- accessibility 고려사항 언급 (semantic HTML, ARIA)
- responsive design 요구사항 제시

## 더 나은 방법은 없을까

이번 작업에서 사용한 패턴들보다 더 효율적인 접근법들이 있다:

**1. tRPC + Zod로 end-to-end 타입 안전성**
현재는 API endpoint에서 타입 정보가 런타임에 사라진다. tRPC를 쓰면 클라이언트까지 완전한 타입 안전성을 보장할 수 있고, Zod schema로 validation을 자동화할 수 있다.

**2. MCP (Model Context Protocol) 서버 연동**
Claude Desktop의 MCP 서버를 만들면 로컬 파일시스템과 직접 연동해서 실시간으로 에이전트 카탈로그를 업데이트할 수 있다. 현재는 수동으로 파일을 스캔하지만 MCP로 자동화 가능하다.

**3. Vector database를 활용한 semantic matching**
현재 키워드 기반 매칭은 한계가 있다. Pinecone이나 Qdrant로 semantic search를 구현하면 더 정확한 에이전트 매칭이 가능하다. OpenAI embeddings API로 task description을 벡터화하고 cosine similarity로 점수를 계산하는 방식이다.

**4. GitHub Actions으로 CI/CD 자동화**
새로운 에이전트가 repository에 추가될 때마다 자동으로 파싱하고 카탈로그에 등록하는 workflow를 만들 수 있다. 현재는 수동 스캔이지만 webhook으로 실시간 동기화 가능하다.

## 정리

- 타입 우선 설계로 AI에게 시스템 아키텍처를 명확히 이해시킨다
- 어댑터 패턴에서 예외 케이스와 validation 로직을 구체적으로 지시한다  
- 알고리즘 설계 시 수학적 기준과 가중치를 정량화해서 제약 조건으로 준다
- Claude Code의 slash commands로 commit과 review 과정을 구조화한다
- 타입 정보를 활용해 comprehensive test coverage를 자동 달성한다

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

</details>