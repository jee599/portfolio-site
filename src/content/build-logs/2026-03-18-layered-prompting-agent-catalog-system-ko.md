---
title: "AI 에이전트 카탈로그 시스템을 한번에 구축하는 레이어드 프롬프팅"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [fix, feat, chore, typescript, css]
---

12개 커밋에 8000줄을 추가하며 AI 에이전트 관리 시스템을 처음부터 끝까지 만들었다. 타입 정의부터 Next.js 대시보드까지 전체 스택을 AI와 협업해서 구축하는 과정에서 발견한 레이어드 프롬프팅 전략을 정리한다.

## 배경: 무엇을 만들고 있는가

`agentochester`는 여러 AI 에이전트를 카탈로그로 관리하고, 사용자 요청에 가장 적합한 에이전트를 매칭해주는 시스템이다. 마크다운과 YAML 형식으로 에이전트를 정의하면, 3단계 점수 기반으로 최적의 에이전트를 찾아준다.

이번 작업의 목표는 TypeScript 코어 엔진부터 웹 대시보드까지 완전한 시스템을 구축하는 것이었다. 단순한 CRUD가 아니라 복잡한 매칭 로직과 프롬프트 조립 엔진이 핵심이다.

## 아키텍처부터 시작하는 Bottom-Up 프롬프팅

대부분 AI에게 "Todo 앱 만들어줘"처럼 탑다운으로 시작한다. 하지만 복잡한 시스템은 바텀업이 훨씬 효과적이다.

먼저 코어 타입 정의부터 시작했다:

> "AI 에이전트 카탈로그 시스템의 TypeScript 타입을 설계해줘. AgentDefinition은 name, description, capabilities, constraints를 가진다. Task는 description, domain, priority를 가진다. 매칭 결과는 confidence score를 포함해야 한다."

일반적인 "시스템 만들어줘" 요청과 비교해보자:

> ❌ "AI 에이전트를 관리하는 시스템 만들어줘"

이렇게 하면 AI가 추상적인 구조만 제시한다. 구체적인 도메인 로직은 빠진다.

타입부터 정의하면 AI가 도메인을 정확히 이해한다. 이후 모든 구현이 이 타입을 기준으로 일관성을 유지한다.

```typescript
interface AgentDefinition {
  name: string;
  version: string;
  description: string;
  author?: string;
  capabilities: string[];
  domains: string[];
  // ...
}
```

타입이 확정된 후 어댑터, 매니저, API 순서로 레이어를 쌓아갔다. 각 단계마다 이전 레이어를 참조하는 프롬프트를 썼다:

> "앞서 정의한 `AgentDefinition` 타입을 사용해서 마크다운 파일을 파싱하는 `adapter.ts`를 만들어줘. frontmatter는 YAML이고, 본문은 프롬프트다. 파싱 실패 시 명확한 에러를 던져야 한다."

## Claude Code의 컨텍스트 파이프라인 활용

단일 파일 작업이 아니라 전체 시스템을 만들 때는 컨텍스트 관리가 핵심이다. Claude Code의 파이프라인 패턴을 적극 활용했다.

`CLAUDE.md`에 프로젝트 구조와 컨벤션을 명시했다:

```markdown
# Project: Agent Catalog System

## Architecture
- `/src/core/` — 타입과 비즈니스 로직
- `/src/server/` — API 핸들러
- `/dashboard/` — Next.js UI

## Conventions
- 모든 함수는 에러 처리 포함
- 테스트는 각 모듈마다 필수
- 외부 의존성 최소화
```

이후 모든 프롬프트에서 `@CLAUDE.md`를 참조했다. AI가 프로젝트 전체 맥락을 유지하면서 작업한다.

특히 **멀티 파일 수정**이 필요할 때 효과적이다:

> "QA에서 발견된 이슈들을 수정해줘:
> 1. API endpoint가 `/api/agents`인데 실제 파일은 다른 경로
> 2. fetch 에러 핸들링 누락
> 3. 검색에서 대소문자 구분
> 4. React key props 경고
> 
> `@dashboard/` 전체를 보고 관련 파일들을 함께 수정해줘."

단일 파일이 아니라 여러 파일을 동시에 수정하는 프롬프트다. Claude Code가 디렉토리 전체를 스캔해서 연관 파일을 찾는다.

## 제약 조건 기반 구조화 전략

AI에게 복잡한 로직을 구현시킬 때는 **제약 조건**을 명확하게 주는 게 핵심이다. 자유도를 줄여야 품질이 올라간다.

3단계 에이전트 매칭 로직을 구현할 때:

> "3단계 점수 기반 에이전트 매칭 시스템을 만들어줘:
> 
> **제약 조건:**
> - Tier 1: 정확한 키워드 매칭 (1.0점)
> - Tier 2: 도메인 일치도 (0.8점)
> - Tier 3: 의미적 유사도 (0.6점)
> - 최종 점수는 가중합, 0.7 이상만 반환
> - 최대 5개 결과만 반환
> - 점수가 같으면 name으로 정렬
> 
> 이 제약을 벗어나는 구현은 불가하다."

제약 없이 "매칭 시스템 만들어줘"라고 하면 AI가 임의로 로직을 결정한다. 나중에 수정하느라 더 많은 프롬프트를 쓰게 된다.

또 다른 예로, 프롬프트 조립 엔진:

> "에이전트 프롬프트를 조립하는 `assembler.ts`를 만들어줘:
> 
> **규칙:**
> - `{{variable}}` 형식으로 변수 치환
> - `#ALWAYS` 블록은 항상 포함
> - `#NEVER` 블록은 제거
> - `#IF condition` 블록은 조건부 포함
> - 조립 후 빈 라인 2개 이상은 1개로 정리
> 
> 이 문법을 정확히 따르는 파서를 구현해라."

문법을 먼저 정의하고, AI가 그 문법을 구현하게 했다. 자유도를 제한하니까 더 정확한 결과가 나왔다.

## Next.js 대시보드에서 에러 핸들링 패턴

프론트엔드는 에러 상황이 많다. fetch 실패, 데이터 없음, 로딩 상태 등을 모두 고려해야 한다.

단순한 프롬프트:
> ❌ "에이전트 목록을 보여주는 React 컴포넌트 만들어줘"

개선된 프롬프트:
> "에이전트 목록 컴포넌트 `AgentLibrary.tsx`를 만들어줘:
> 
> **필수 상태:**
> - Loading: 스켈레톤 UI
> - Empty: "에이전트가 없습니다" 메시지
> - Error: 에러 메시지와 재시도 버튼
> - Success: 카드 레이아웃으로 에이전트 표시
> 
> **API:**
> - `/api/agents` GET 요청
> - 네트워크 에러 시 toast 알림
> - 5초 타임아웃 설정
> 
> **성능:**
> - 초기 로딩만 SSR, 이후 CSR
> - 검색은 디바운스 300ms
> - 무한 스크롤 없이 페이지네이션"

AI가 모든 엣지 케이스를 고려한 컴포넌트를 만든다. 이후 QA에서 발견되는 이슈가 현저히 줄어든다.

실제로 생성된 컴포넌트에는 try-catch, 로딩 상태, 에러 바운더리가 모두 포함됐다:

```tsx
const [agents, setAgents] = useState<AgentDefinition[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  fetchAgents();
}, []);
```

## slash commands로 워크플로우 자동화

Claude Code의 slash commands를 적극 활용했다. 반복 작업을 자동화하는 커스텀 명령어를 만들었다.

`/test-coverage`를 만들어서 새로운 모듈에 대한 테스트를 자동 생성한다:

> "/test-coverage src/core/assembler.ts — 모든 공개 함수와 에러 케이스를 포함한 테스트 스위트를 생성해줘. describe 블록은 함수별로 나누고, 각 테스트는 AAA 패턴을 따라라."

`/commit-msg`로 일관된 커밋 메시지를 생성한다:

> "/commit-msg — 현재 staged changes를 분석해서 conventional commit 형식으로 메시지를 제안해줘. feat/fix/docs/chore 중 선택하고, 50자 이내로 요약해라."

이런 명령어들을 반복 사용하다 보니 코드 품질과 커밋 품질이 일정하게 유지됐다.

## MCP 서버 연동으로 외부 도구 활용

Agent 시스템을 테스트하기 위해 실제 AI 에이전트들의 정보가 필요했다. GitHub API MCP 서버를 연동해서 `agency-agents` 레포지토리의 에이전트 정의를 가져왔다.

```bash
# MCP 설정
npx @anthropic-ai/mcp-cli init github
```

이후 프롬프트에서 직접 외부 데이터를 참조할 수 있었다:

> "@github/agency-agents/agents/ 디렉토리의 마크다운 파일들을 분석해서, 내 시스템의 AgentDefinition 형식으로 변환해줘. frontmatter의 capabilities와 domains를 추출하고, 본문을 prompt 필드에 넣어라."

AI가 GitHub에서 실시간으로 데이터를 가져와서 변환 작업을 수행한다. API 키 설정이나 별도 스크립트 없이 가능하다.

## 더 나은 방법은 없을까

이번 작업을 돌아보면 몇 가지 개선점이 보인다.

**Anthropic의 새로운 Projects 기능 활용:**
`CLAUDE.md` 대신 Projects에서 Knowledge Base를 설정하는 게 더 효과적이다. 문서, 코드 샘플, 스타일 가이드를 구조화해서 관리할 수 있다.

**Tool Use API로 더 정교한 제어:**
단순한 프롬프트 대신 Function Calling을 써서 AI의 출력을 구조화할 수 있다. 특히 코드 생성에서 일관성을 보장한다.

```typescript
const tools = [{
  name: "generate_component",
  description: "Generate React component with error handling",
  input_schema: {
    type: "object",
    properties: {
      componentName: { type: "string" },
      props: { type: "array" },
      errorHandling: { type: "boolean" }
    }
  }
}];
```

**GitHub Copilot Workspace 병행:**
큰 리팩토링이나 아키텍처 변경은 Copilot Workspace에서 계획을 세우고, Claude Code에서 구현하는 하이브리드 접근이 효과적이다.

**Cursor Composer vs Claude Code:**
멀티 파일 수정은 Cursor Composer가 더 나을 수 있다. 전체 코드베이스를 인덱싱해서 더 정확한 컨텍스트를 제공한다.

**성능 최적화 관점:**
이번 구현에서는 in-memory 매칭을 썼지만, Vector DB(Pinecone, Weaviate)를 쓰면 의미적 유사도 계산이 더 정확해진다. AI에게 Embeddings API 연동을 맡기는 것도 가능하다.

**테스트 전략 개선:**
Vitest 대신 Playwright를 써서 E2E 테스트를 AI가 작성하게 할 수 있다. 실제 사용자 시나리오를 커버하는 테스트가 더 가치있다.

## 정리

- **바텀업 프롬프팅**: 타입부터 시작해서 레이어별로 구축하면 일관성 있는 시스템이 나온다
- **제약 조건 명시**: 자유도를 제한할수록 AI 출력 품질이 올라간다
- **컨텍스트 파이프라인**: `CLAUDE.md`와 디렉토리 참조로 전체 프로젝트 맥락을 유지한다
- **slash commands 활용**: 반복 작업을 자동화해서 일관된 품질을 유지한다

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