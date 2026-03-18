---
title: "AI로 0부터 Agent 시스템 만들기 — 타입 설계부터 UI까지 한번에"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [fix, feat, chore, typescript, css]
---

12개 커밋으로 완전한 AI 에이전트 매칭 시스템을 만들었다. 타입 정의부터 시작해서 YAML 파서, 매칭 로직, API, React 대시보드까지. AI에게 어떻게 시켜야 이런 복잡한 시스템을 단계별로 구축할 수 있는지 보여준다.

## 배경: 무엇을 만들고 있는가

AgentOchester는 다양한 AI 에이전트들을 카탈로그로 관리하고, 사용자의 작업에 맞는 에이전트를 자동으로 매칭해주는 시스템이다. Markdown과 YAML 형식으로 정의된 에이전트들을 파싱해서 3단계 매칭 알고리즘(도메인, 태그, 의미적 유사도)으로 최적의 에이전트를 추천한다.

처음에는 "에이전트 매칭 시스템 만들어줘"라는 막연한 요구사항만 있었다. 하지만 AI에게 전체 시스템을 한번에 만들라고 하면 일관성이 떨어지고 테스트하기도 어렵다. 그래서 bottom-up 접근을 택했다. 가장 작은 단위인 타입 정의부터 시작해서 점진적으로 복잡도를 올려갔다.

## 타입부터 시작하는 AI 프롬프팅

복잡한 시스템을 AI에게 시킬 때는 **타입 정의부터 확정**해야 한다. 타입이 없으면 AI가 중간에 데이터 구조를 바꿔버리거나 일관성이 깨진다.

> "TypeScript로 AI 에이전트 시스템의 core type definitions을 만들어줘. 
> 
> 요구사항:
> - `AgentDefinition`: name, description, domain, tags, capabilities, constraints
> - `AgentSource`: markdown/yaml 원본 데이터
> - `CatalogEntry`: 검색용 메타데이터 + definition
> - `Task`: 사용자가 요청하는 작업 (description, domain, required_capabilities)
> - `MatchResult`: 매칭 점수와 근거
> 
> 모든 필드는 required/optional 구분하고, JSDoc으로 용도 설명해. union type이나 enum 써서 값 제한도 걸어줘."

이렇게 하면 안 된다:

> "에이전트 타입 만들어줘"

첫 번째 프롬프트는 **구체적인 필드명과 제약조건**을 명시한다. 두 번째는 AI가 추측해서 만들어야 하니까 나중에 바꿀 가능성이 높다.

타입이 확정되면 이후 모든 작업에서 이 타입을 기준으로 삼는다고 AI에게 계속 상기시켜야 한다. `CLAUDE.md`에 타입 정의를 넣어두거나, 매번 프롬프트에 "위에서 정의한 AgentDefinition 타입을 준수해서"라고 명시한다.

```typescript
export interface AgentDefinition {
  /** Unique identifier for the agent */
  name: string;
  /** Brief description of what this agent does */
  description: string;
  /** Primary domain this agent operates in */
  domain: AgentDomain;
  /** List of tags for categorization and matching */
  tags: string[];
  /** What this agent can do */
  capabilities: string[];
  /** What this agent cannot or should not do */
  constraints?: string[];
  /** Instructions for using this agent */
  instructions?: string;
  /** Examples of tasks this agent can handle */
  examples?: string[];
}
```

타입이 탄탄하면 나중에 파서 만들 때도, API 만들 때도, UI 만들 때도 AI가 헷갈리지 않는다.

## 복잡한 파싱 로직을 AI에게 시키는 법

Markdown과 YAML 파일을 `AgentDefinition`으로 변환하는 파서가 필요했다. 이런 복잡한 파싱 로직은 **concrete example**을 반드시 줘야 한다.

> "Markdown 파일을 AgentDefinition으로 변환하는 adapter 함수를 만들어줘.
> 
> 입력 예시:
> ```markdown
> # Code Reviewer
> 
> 코드 리뷰와 개선 제안을 제공하는 전문 에이전트입니다.
> 
> **Domain:** development
> **Tags:** code-review, quality, testing
> **Capabilities:**
> - 코드 품질 분석
> - 성능 최적화 제안
> - 보안 취약점 검출
> 
> **Constraints:**
> - 프로덕션 코드 직접 수정 금지
> - 민감한 정보 로깅 금지
> ```
> 
> 출력: AgentDefinition 객체
> 
> 예외 처리:
> - 필수 필드 누락시 ValidationError
> - 알 수 없는 domain시 기본값 'general'
> - YAML frontmatter 있으면 우선 처리
> 
> 100% 테스트 커버리지로 vitest 테스트도 같이 만들어줘."

이렇게 하면 안 된다:

> "마크다운 파싱해줘"

구체적인 입출력 예시가 없으면 AI가 다른 형식을 가정해서 파서를 만든다. 특히 **예외 처리 시나리오**를 미리 명시해야 robust한 코드가 나온다.

파싱 같은 복잡한 로직은 TDD 방식이 효과적이다. AI에게 "테스트부터 만들어줘"라고 하면 edge case를 더 많이 고려한다.

```typescript
describe('adapter.ts', () => {
  it('should parse markdown with YAML frontmatter', () => {
    const markdown = `---
domain: development
tags: [testing, automation]
---
# Test Agent
Automated testing specialist`;
    
    const result = parseMarkdownToAgent(markdown);
    expect(result.domain).toBe('development');
    expect(result.tags).toEqual(['testing', 'automation']);
  });
  
  it('should throw ValidationError for missing required fields', () => {
    const invalidMarkdown = `# Agent without description`;
    expect(() => parseMarkdownToAgent(invalidMarkdown))
      .toThrow(ValidationError);
  });
});
```

## 3단계 매칭 알고리즘 구조화 전략

에이전트 매칭 로직이 이 시스템의 핵심이다. 도메인 매칭, 태그 매칭, 의미적 유사도 계산까지 3단계로 나뉘어져 있다. 이런 복잡한 알고리즘은 **단계별로 쪼개서** AI에게 시켜야 한다.

> "3단계 에이전트 매칭 시스템을 만들어줘. 각 단계는 독립적인 함수로 분리해.
> 
> **1단계: Domain Matching**
> - exact match: 100점
> - compatible domains: 80점 (development ↔ automation)
> - general domain: 50점
> - mismatch: 0점
> 
> **2단계: Tag Matching**
> - Jaccard similarity 사용
> - 공통 태그 개수 / (agent_tags ∪ task_tags)
> - 0.0~1.0 점수를 0~100으로 변환
> 
> **3단계: Semantic Similarity**
> - task description과 agent description 비교
> - TF-IDF 벡터 코사인 유사도 (외부 라이브러리 없이 구현)
> - 0.0~1.0 점수를 0~100으로 변환
> 
> **최종 점수 계산**
> - domain_score * 0.4 + tag_score * 0.4 + semantic_score * 0.2
> - 60점 이상만 결과에 포함
> - 점수 내림차순 정렬
> 
> 각 함수는 독립적으로 테스트 가능해야 하고, 점수 계산 근거도 반환해."

이렇게 세분화하면 AI가 각 단계에 집중할 수 있다. 그리고 나중에 특정 단계만 수정하기도 쉽다.

특히 **점수 계산 근거**를 반환하라고 했다. 이게 중요하다. 나중에 UI에서 "왜 이 에이전트가 매칭됐는지" 설명할 수 있고, 알고리즘 튜닝할 때도 도움된다.

```typescript
interface MatchResult {
  agent: CatalogEntry;
  totalScore: number;
  breakdown: {
    domain: { score: number; reason: string };
    tags: { score: number; commonTags: string[] };
    semantic: { score: number; similarity: number };
  };
}
```

## Next.js 대시보드 — UI 생성 프롬프팅 패턴

백엔드가 완성되면 이제 대시보드가 필요하다. AI에게 UI를 만들게 할 때는 **wireframe을 텍스트로 묘사**하고, **구체적인 컴포넌트 구조**를 제시해야 한다.

> "Next.js 13 App Router로 에이전트 대시보드를 만들어줘.
> 
> **레이아웃:**
> ```
> [Header: AgentOchester 로고 + 네비게이션]
> [Main Content]
>   [Left Panel: Agent Library (30%)]
>     - 검색창
>     - 필터 (domain, tags)
>     - 에이전트 리스트 (카드 형태)
>   [Right Panel: Matching Panel (70%)]
>     - 작업 설명 입력창
>     - "Find Agents" 버튼
>     - 매칭 결과 (점수 + 근거 표시)
> ```
> 
> **컴포넌트 구조:**
> - `app/page.tsx`: 메인 레이아웃
> - `components/AgentLibrary.tsx`: 좌측 패널
> - `components/AgentMatchPanel.tsx`: 우측 패널
> - `lib/agents-handler.ts`: 클라이언트 사이드 API 호출
> - `app/api/agents/route.ts`: API 엔드포인트
> 
> **기술 요구사항:**
> - Tailwind CSS 사용
> - TypeScript strict mode
> - 에러 처리 (loading state, error boundary)
> - responsive design (모바일에서는 세로 배치)
> - 기존 core 타입들 import해서 사용
> 
> **API 스펙:**
> - GET `/api/agents`: 전체 에이전트 목록
> - POST `/api/agents/match`: 매칭 요청 { task: Task } → MatchResult[]
> 
> 한 번에 모든 파일 만들어주고, package.json dependencies도 포함해."

이런 상세한 명세를 주면 AI가 일관성 있는 UI를 만든다. 특히 **API 스펙을 미리 정의**하는 게 중요하다. 프론트엔드와 백엔드가 다른 형식을 가정하면 나중에 디버깅이 어렵다.

Tailwind CSS 같은 유틸리티 프레임워크를 쓰라고 명시하면 AI가 더 현대적인 스타일링을 한다. 그리고 "responsive design" 요구사항을 주면 모바일 최적화도 같이 해준다.

## Claude Code / MCP 서버 활용

이런 대규모 작업에서는 Claude Code의 장점이 확실히 드러난다. 특히 MCP (Model Context Protocol) 서버를 연동하면 파일 시스템 전체를 컨텍스트로 유지할 수 있다.

**CLAUDE.md 설정:**

```markdown
# AgentOchester Development Context

## Project Structure
- `/src/core/`: Type definitions and core logic
- `/src/server/`: API handlers and matching engine
- `/dashboard/`: Next.js frontend
- `/tests/`: Vitest test files

## Coding Standards
- TypeScript strict mode
- 100% type coverage for public APIs
- Jest/Vitest for testing
- ESLint + Prettier
- No `any` types allowed

## Key Types
[타입 정의 붙여넣기]

## Current Task Context
Building agent matching system with 3-tier algorithm.
Focus on maintainability and testability.
```

**효과적인 slash commands:**

- `/commit "feat: add agent parser with YAML support"` — 작업 단위별로 커밋
- `/test adapter.ts` — 특정 파일 테스트 생성
- `/review src/core/` — 디렉토리 전체 코드 리뷰
- `/fix typescript errors` — 타입 에러 일괄 수정

**agent 모드 vs interactive 모드 사용 시점:**

Agent 모드는 "전체 파일 생성"이나 "반복적인 작업"에 적합하다. 8개 builtin agent YAML 파일을 만들 때처럼 패턴이 명확한 작업에서 빛난다.

Interactive 모드는 "알고리즘 설계"나 "아키텍처 결정"에서 더 유용하다. 매칭 알고리즘의 가중치를 0.4/0.4/0.2로 할지 0.5/0.3/0.2로 할지 같은 판단이 필요한 상황에서.

## 에러 핸들링과 QA — AI의 약점 보완

마지막 커밋에서 QA 이슈들을 한번에 수정했다. API endpoint 매칭, fetch error 처리, search case sensitivity, React key 누락. 이런 세부적인 버그들은 AI가 놓치기 쉬운 부분이다.

**효과적인 QA 프롬프트:**

> "현재 대시보드에서 발생할 수 있는 모든 에러 시나리오를 점검해줘.
> 
> **체크리스트:**
> - [ ] API 호출 실패시 사용자에게 적절한 메시지 표시
> - [ ] Loading state 처리 (skeleton UI 또는 spinner)
> - [ ] Empty state (에이전트 없음, 매칭 결과 없음)
> - [ ] Input validation (빈 문자열, 너무 긴 텍스트)
> - [ ] React key prop 누락 (console warning 체크)
> - [ ] TypeScript strict mode 위반
> - [ ] Responsive breakpoint 동작
> - [ ] 브라우저 console에 error/warning 없는지
> 
> 각 이슈별로 수정 코드와 테스트 방법 제시해."

이렇게 구체적인 체크리스트를 주면 AI가 더 꼼꼼히 점검한다. 그냥 "버그 찾아줘"라고 하면 대충 훑고 지나간다.

**React 관련 흔한 실수들:**

```typescript
// 나쁜 예: key 누락
{agents.map(agent => <AgentCard agent={agent} />)}

// 좋은 예
{agents.map(agent => <AgentCard key={agent.name} agent={agent} />)}
```

```typescript
// 나쁜 예: fetch error 무시
const response = await fetch('/api/agents/match', {
  method: 'POST',
  body: JSON.stringify({ task })
});
const results = await response.json();

// 좋은 예
const response = await fetch('/api/agents/match', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ task })
});

if (!response.ok) {
  throw new Error(`Match request failed: ${response.status}`);
}

const results = await response.json();
```

이런 패턴들을 `CLAUDE.md`에 "Don't" 섹션으로 추가해두면 AI가 실수를 줄인다.

## 더 나은 방법은 없을까

이 글에서 다룬 방식보다 더 효율적인 대안들이 있다:

**1. Cursor IDE + Composer 활용**

Claude Code 대신 Cursor의 Composer 모드를 쓰면 멀티파일 편집이 더 자연스럽다. 특히 타입 정의를 바꿀 때 관련된 모든 파일을 한번에 업데이트할 수 있다.

**2. GitHub Copilot Workspace**

프로젝트 전체 컨텍스트를 유지하면서 이슈 기반으로 작업을 진행할 수 있다. "Agent matching algorithm 성능 개선"같은 큰 단위 작업에 적합하다.

**3. AI Coding Assistant 조합**

- 아키텍처 설계: Claude (긴 컨텍스트)
- 코드 생성: Cursor (IDE 통합)
- 테스트 작성: GitHub Copilot (반복 패턴 학습)
- 문서화: Notion AI (자연어 처리)

각 도구의 강점에 맞게 역할을 분담하면 더 효율적이다.

**4. 더 나은 프롬프팅 패턴**

Anthropic의 최신 권장사항에 따르면 "Constitutional AI" 방식이 더 좋은 결과를 낸다:

```
You are a TypeScript expert building production-grade systems.

<rules>
- Always provide complete, runnable code
- Include error handling for all external dependencies
- Use strict TypeScript (no any, unknown over object)
- Write tests for public APIs
- Follow functional programming principles where possible
</rules>

<context>
[현재 프로젝트 상황]
</context>

<task>
[구체적인 작업 요청]
</task>

Think step by step about the architecture before implementing.
```

이런 구조화된 프롬프트가 더 일관된 결과를 만든다.

**5. 성능/비용 최적화**

- GPT-4o mini: 단순 코드 생성 (비용 1/10)
- Claude 3.5 Sonnet: 복잡한 로직 설계
- Llama 3.1 405B (via Together AI): 오픈소스 대안

작업 복잡도에 따라 모델을 선택하면 비용을 크게 줄일 수 있다.

## 정리

AI로 복잡한 시스템을 만들 때 핵심은 **구조화된 접근**이다. 타입부터 확정하고, 단계별로 쪼개서, 구체적인 예시와 제약조건을 제시한다. 그리고 마지막에는 반드시 QA 프롬프트로 세부 버그를 잡아낸다.

12개 커밋으로 8,000줄 코드를 만든 건 결국 **올바른 순서와 명확한 프롬프팅** 덕분이다. AI는 도구일 뿐이고, 어떻게 써야 하는지는 사람이 알아야 한다.

<details>
<summary>이번 작업의 커밋 로그</summary>

aa00a70 — fix: QA issues — API match endpoint, fetch error handling, search case, React keys
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