---
title: "AI 에이전트 카탈로그를 구조화하는 프롬프팅 패턴 — 타입 정의부터 UI까지"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [fix, feat, chore, typescript, css]
---

TypeScript 기반 AI 에이전트 시스템을 처음부터 만들면서 발견한 구조화 프롬프팅 패턴을 정리했다. 타입 정의부터 Next.js 대시보드까지, 큰 시스템을 AI와 함께 체계적으로 구축하는 방법을 다룬다.

## 배경: 무엇을 만들고 있는가

`agentochester`는 AI 에이전트들을 카탈로그화하고 작업에 맞는 에이전트를 매칭해주는 시스템이다. 기존에 `.md` 형식으로 산재해 있던 에이전트 정의들을 구조화하고, 3-tier 매칭 알고리즘으로 최적의 에이전트를 찾아준다.

이번 작업의 목표는 MVP 시스템 구축이었다. 타입 정의, 파서, 매칭 엔진, API 서버, Next.js 대시보드까지 전체 스택을 2주 안에 완성해야 했다.

## 타입 먼저 설계하게 하는 프롬프팅

복잡한 시스템을 AI와 만들 때 가장 중요한 건 **타입 정의를 먼저 확정**하는 것이다. 구현부터 시키면 AI가 중간에 타입을 바꿔버려서 전체가 틀어진다.

### 효과적인 타입 정의 프롬프트

> "AI 에이전트 시스템의 핵심 타입들을 설계해줘. `AgentDefinition`은 에이전트 메타데이터와 프롬프트를 포함하고, `Task`는 사용자 요청을 나타낸다. `CatalogEntry`는 매칭에 필요한 스코어링 정보를 가져야 한다. 
> 
> 조건:
> - 모든 필드는 optional이 아닌 required로
> - 태그는 `string[]`가 아닌 구조화된 객체로
> - 매칭 알고리즘에서 쓸 numerical score 필드 포함
> - 나중에 UI에서 렌더링할 display 정보 분리
> 
> 구현 코드 없이 타입 정의만 먼저 완성해."

이렇게 쓰면 안 된다:
> "에이전트 시스템 만들어줘"

핵심은 **제약 조건을 구체적으로 주고, 구현과 설계를 분리**하는 것이다. AI는 한번에 모든 걸 하려고 하는데, 타입이 불안정하면 나중에 전체를 다시 짜야 한다.

### Claude Code의 타입 우선 워크플로

Claude Code에서는 `CLAUDE.md`에 이런 구조를 명시한다:

```markdown
## Type-First Development

1. 모든 새 기능은 타입 정의로 시작
2. 구현 전에 인터페이스 검토 필수
3. 타입 변경 시 전체 의존성 체크
```

그리고 custom instruction에 추가한다:

> "Always define types before implementation. If asked to build a feature, start with interfaces and type definitions, then ask for approval before proceeding to implementation."

이렇게 하면 AI가 성급하게 구현부터 시작하는 걸 방지할 수 있다.

## 단계별 구현을 강제하는 프롬프팅 패턴

전체 시스템을 한번에 만들라고 하면 AI가 중요한 부분을 놓친다. 의존성 순서대로 단계를 나눠서 시켜야 한다.

### 의존성 기반 작업 분할

> "타입 정의가 완료되었으니 이제 `adapter.ts`를 만들어줘. `.md` 파일을 `AgentDefinition`으로 파싱하는 역할만 한다.
> 
> 요구사항:
> - frontmatter YAML 파싱
> - markdown body에서 sections 추출
> - validation 로직 포함
> - error handling은 throw가 아닌 Result 타입 사용
> 
> 다른 모듈(catalog, matching 등)은 건드리지 말고 adapter만 완성해."

이런 식으로 **한 번에 하나의 모듈**만 시킨다. AI는 연관된 파일들을 같이 수정하려고 하는데, 이걸 막아야 한다.

### 테스트 주도 프롬프팅

각 모듈마다 테스트를 먼저 작성하게 시킨다:

> "`adapter.ts` 테스트부터 작성해줘. edge case 위주로:
> - 잘못된 YAML frontmatter
> - 필수 섹션 누락
> - 특수문자가 포함된 markdown
> - 빈 파일 처리
> 
> vitest 기반으로 하고, 테스트가 통과하도록 구현도 함께 수정해."

테스트를 먼저 만들면 AI가 **구현 범위를 명확하게 이해**한다. 그리고 나중에 리팩토링할 때도 안전하다.

## 3-tier 매칭 알고리즘 설계 프롬프팅

복잡한 알고리즘을 AI에게 시킬 때는 **수학적 모델을 먼저 정의**해야 한다. 그냥 "매칭해줘"라고 하면 naive한 구현만 나온다.

### 알고리즘 스펙 프롬프트

> "에이전트-태스크 매칭을 3단계로 나눠서 구현해줘:
> 
> **Tier 1: Exact Match (100점)**
> - 태스크의 domain과 에이전트의 specialty가 정확히 일치
> - 문자열 비교가 아닌 semantic equivalence 체크
> 
> **Tier 2: Tag Overlap (1-99점)**  
> - 공통 태그 개수 / 전체 태그 개수 비율로 점수 계산
> - weighted scoring (일부 태그는 더 중요함)
> 
> **Tier 3: Fuzzy Match (1-50점)**
> - 설명 텍스트의 키워드 유사도
> - TF-IDF 또는 간단한 word overlap 사용
> 
> 각 tier의 점수 계산 공식을 먼저 의사코드로 보여주고, 구현은 그 다음에."

이렇게 **수학적 모델을 명시**하면 AI가 일관성 있는 구현을 만든다. 그리고 나중에 튜닝할 때도 어떤 부분을 건드려야 하는지 명확하다.

### 스코어링 로직 검증

복잡한 알고리즘은 **edge case 테스트를 많이** 만든다:

> "매칭 알고리즘 테스트 케이스를 만들어줘:
> - 완전히 일치하는 경우 (100점)
> - 태그가 하나도 안 겹치는 경우 (fuzzy match만)  
> - 여러 에이전트가 같은 점수를 받는 경우
> - 빈 태스크나 빈 에이전트 처리
> - 비정상적인 입력 (null, undefined 등)
> 
> 각 케이스마다 예상 점수도 미리 계산해서 assert에 포함해."

AI는 happy path만 생각하는 경향이 있어서, **edge case를 명시적으로 요구**해야 한다.

## Next.js + TypeScript 컴포넌트 생성 전략

프론트엔드 컴포넌트를 AI로 만들 때는 **props interface부터 정의**하고, 스타일링과 로직을 분리해서 시킨다.

### 컴포넌트 설계 프롬프트

> "`AgentLibrary` 컴포넌트를 만들어줘. 에이전트 목록을 카드 형태로 보여주는 역할이다.
> 
> **Props Interface:**
> ```typescript
> interface AgentLibraryProps {
>   agents: CatalogEntry[]
>   onAgentSelect: (agent: CatalogEntry) => void
>   selectedAgent?: CatalogEntry | null
> }
> ```
> 
> **UI 요구사항:**
> - Tailwind CSS 사용
> - 반응형 grid layout (모바일 1열, 데스크톱 3열)
> - 선택된 에이전트는 border 하이라이트
> - hover 효과 포함
> 
> **기능 요구사항:**
> - 검색 필터링 (name, description, tags 대상)
> - 태그별 필터링 dropdown
> - 가상화는 나중에 추가할 예정이니 일단 제외
> 
> 로직과 스타일링을 명확히 분리해서 작성해."

이렇게 **interface를 먼저 고정**하면 부모 컴포넌트와의 연동이 깔끔해진다. 그리고 "나중에 추가할 예정"이라고 명시하면 AI가 over-engineering하는 걸 막을 수 있다.

### 상태 관리 패턴 지정

React 컴포넌트에서 상태 관리를 AI에게 맡길 때는 **패턴을 명시**해야 한다:

> "에이전트 매칭 패널에서 상태 관리를 이렇게 해줘:
> - 검색어: `useState<string>`으로 local state
> - 매칭 결과: `useSWR`로 서버 캐싱  
> - 선택된 에이전트: props로 받아서 부모가 관리
> - 로딩/에러 상태: `useSWR`의 built-in state 활용
> 
> Redux나 Zustand 같은 전역 상태는 사용하지 마. 컴포넌트 레벨에서만 관리해."

AI는 최신 라이브러리를 쓰려고 하는데, **프로젝트 복잡도에 맞는 선택**을 명시적으로 지시해야 한다.

## API 핸들러와 에러 처리 패턴

Next.js API routes를 AI로 만들 때는 **에러 처리 전략을 미리 정의**해야 한다. AI가 만든 API는 보통 에러 핸들링이 부실하다.

### 구조화된 API 응답 프롬프트

> "Next.js API handler를 만들어줘. `/api/agents` 엔드포인트에서 에이전트 목록과 매칭 기능을 제공한다.
> 
> **응답 타입 통일:**
> ```typescript
> type ApiResponse<T> = {
>   success: true
>   data: T
> } | {
>   success: false  
>   error: string
>   code: number
> }
> ```
> 
> **엔드포인트:**
> - `GET /api/agents` → 전체 에이전트 목록
> - `POST /api/agents/match` → 태스크 기반 매칭
> 
> **에러 처리:**
> - validation 실패 → 400
> - 파일 시스템 에러 → 500  
> - 매칭 결과 없음 → 200이지만 빈 배열
> 
> try-catch로 감싸고, 에러 로깅도 포함해. console.error 대신 구조화된 로그 사용해."

이런 식으로 **에러 처리 전략을 명시**하면 프로덕션에서 디버깅하기 쉬운 코드가 나온다.

### 타입 안전성 보장

API와 프론트엔드 사이의 타입 불일치를 방지하려면:

> "API response 타입을 shared types로 분리해줘. `src/types/api.ts`에 정의하고, 클라이언트와 서버에서 모두 import해서 사용하게 해.
> 
> 런타임 validation도 추가해. zod 스키마를 만들어서 API 요청/응답을 검증하고, 타입 불일치 시 명확한 에러 메시지 출력해."

타입 안전성은 AI가 놓치기 쉬운 부분이라서 **명시적으로 요구**해야 한다.

## 더 나은 방법은 없을까

이 글에서 다룬 구조화 프롬프팅보다 더 효과적인 방법들이 있다:

### MCP 서버 활용

Claude의 Model Context Protocol을 쓰면 프로젝트 구조를 AI가 더 잘 이해한다. `@codebase` MCP 서버를 설정하면:

```yaml
# claude_desktop_config.json
{
  "mcpServers": {
    "codebase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

이렇게 하면 매번 파일 내용을 복사 붙여넣기 할 필요 없이 전체 코드베이스 컨텍스트에서 작업할 수 있다.

### GitHub Copilot Workspace 패턴

Copilot Workspace의 planning 단계를 참고해서 AI에게 **구현 계획을 먼저 세우게** 하는 것도 좋다:

> "전체 구현을 시작하기 전에 작업 계획을 세워줘. 각 단계별로 어떤 파일을 만들고, 어떤 의존성이 있는지 명시해. 그리고 각 단계가 완료되면 어떤 테스트로 검증할지도 포함해."

### agent.yml 활용

이번 프로젝트에서는 수동으로 에이전트 정의를 관리했는데, OpenAI의 agent configuration 패턴을 쓰면 더 체계적이다:

```yaml
# .agent.yml
name: "TypeScript System Architect"
role: "Design and implement TypeScript-based systems with proper type safety"
constraints:
  - "Always define interfaces before implementation"
  - "Use dependency injection for testability"  
  - "Prefer composition over inheritance"
skills:
  - "typescript"
  - "system-design"
  - "testing"
```

### 성능 최적화 고려사항

대규모 에이전트 카탈로그를 다룰 때는 **매칭 알고리즘을 웹워커로 분리**하는 게 좋다. 메인 스레드를 블로킹하지 않고 복잡한 스코어링을 처리할 수 있다.

또한 에이전트 정의를 런타임에 파싱하지 말고 **빌드 타임에 JSON으로 pre-compile**하는 것도 고려할 만하다. Next.js의 `generateStaticParams`와 조합하면 성능이 크게 향상된다.

## 정리

- **타입 정의를 먼저 확정**하고 구현은 나중에 — AI가 중간에 타입을 바꾸는 걸 방지한다
- **의존성 순서대로 단계를 나눠서** 시키기 — 한번에 전체 시스템을 만들라고 하면 놓치는 부분이 생긴다  
- **수학적 모델을 명시**해서 복잡한 알고리즘 구현 — 그냥 "매칭해줘"보다 구체적인 공식을 제시한다
- **에러 처리 전략을 미리 정의** — AI가 만든 코드는 보통 happy path만 고려한다

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