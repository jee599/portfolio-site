---
title: "AI 에이전트 라이브러리 구축하기 — 3-tier 매칭과 프롬프트 조립 패턴"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [fix, feat, chore, typescript, css]
---

AI 에이전트 시스템을 처음부터 만드는 프로젝트를 진행하면서, 8,000줄이 넘는 코드를 12개 커밋으로 구조화했다. 타입 정의부터 Next.js 대시보드까지 한 번에 만드는 과정에서 AI를 어떻게 활용했는지, 어떤 프롬프팅 전략이 효과적이었는지 정리했다.

## 배경: 무엇을 만들고 있는가

AgentOchester라는 프로젝트다. 다양한 AI 에이전트를 카탈로그화하고, 사용자가 입력한 작업에 가장 적합한 에이전트를 찾아주는 시스템이다. Markdown이나 YAML 형식으로 정의된 에이전트들을 파싱하고, 3단계 매칭 알고리즘으로 순위를 매긴 다음, 프롬프트를 조립해서 실행 가능한 형태로 만든다.

이번 작업의 목표는 MVP를 완성하는 것이었다. 타입 시스템부터 웹 인터페이스까지 전체 스택을 구축해야 했다. 각 레이어가 유기적으로 연결되도록 설계하면서도, 개별 모듈은 독립적으로 테스트 가능해야 했다.

## 구조 기반 프롬프팅 — 큰 그림부터 세부사항까지

복잡한 시스템을 AI에게 만들라고 할 때는 top-down 접근이 핵심이다. 처음부터 구현 세부사항을 물어보면 일관성이 떨어지고 나중에 통합할 때 문제가 생긴다.

이 프로젝트에서는 먼저 전체 아키텍처를 Claude에게 설명하고, 각 레이어의 책임을 명확히 했다:

> "AI 에이전트 매칭 시스템을 만든다. 4개 레이어로 구성한다:
> 1. Core Types — AgentDefinition, Task, CatalogEntry 인터페이스
> 2. Adapter Layer — .md/.yaml 파일을 AgentDefinition으로 변환  
> 3. Catalog & Manager — 3-tier 매칭 알고리즘 (exact/fuzzy/semantic)
> 4. API & UI — Next.js 대시보드와 REST endpoint
> 
> TypeScript로 작성하고, 각 레이어마다 완전한 테스트 커버리지를 갖춘다. Vitest 사용."

이렇게 먼저 전체 구조를 잡고 나서, 각 레이어별로 세부 구현을 요청했다. 핵심은 **의존성 방향을 명시**하는 것이다. Core Types는 다른 어떤 것에도 의존하지 않고, Adapter는 Core Types만 의존하고, 이런 식으로 레이어 간 경계를 확실히 그었다.

구조화 없이 "에이전트 매칭 시스템 만들어줘"라고 하면 Claude는 모든 걸 하나의 파일에 때려넣는다. 레이어를 명시하면 자연스럽게 모듈 분리가 된다.

또 다른 효과적인 패턴은 **제약 조건을 먼저 주는 것**이다:

> "다음 제약 조건을 지켜라:
> - 모든 함수는 순수함수여야 한다 (외부 상태 변경 금지)
> - async/await 대신 Promise 체이닝 금지 (가독성)  
> - 에러 처리는 Result<T, E> 패턴 사용
> - 테스트에서 mocking 없이 실제 데이터 사용"

제약 조건이 있으면 Claude가 더 일관된 코드를 만든다. 특히 "순수함수"라고 명시하면 side effect 없는 깔끔한 구조가 나온다.

## 3-tier 매칭 알고리즘 — 복잡한 로직을 단계별로 분해하기

이 프로젝트의 핵심은 사용자 작업에 가장 적합한 에이전트를 찾는 매칭 알고리즘이다. 3단계로 구성된다:

1. **Exact Match** — 태그 완전 일치
2. **Fuzzy Match** — Levenshtein distance 기반 유사도  
3. **Semantic Match** — 도메인 추론 및 키워드 매칭

이런 복잡한 로직을 AI에게 시킬 때는 **알고리즘을 의사코드로 먼저 설명**하는 게 효과적이다:

> "3-tier 매칭을 구현한다:
> 
> ```
> function matchAgents(task: Task, agents: Agent[]): MatchResult[] {
>   // Tier 1: Exact matching
>   exactMatches = agents.filter(a => task.tags.some(t => a.tags.includes(t)))
>   
>   // Tier 2: Fuzzy matching  
>   fuzzyMatches = agents.filter(a => levenshtein(task.description, a.description) < 0.7)
>   
>   // Tier 3: Semantic matching
>   semanticMatches = agents.filter(a => inferDomain(task) === inferDomain(a))
>   
>   return combineAndRank(exactMatches, fuzzyMatches, semanticMatches)
> }
> ```
> 
> 이 의사코드를 TypeScript로 구현해라. 각 tier마다 가중치를 다르게 준다 (exact=100, fuzzy=70, semantic=40)."

의사코드가 있으면 Claude가 구현 세부사항에 집중할 수 있다. "매칭 알고리즘 만들어줘"라고만 하면 어떤 방식으로 매칭할지 모호해서 일관성 없는 결과가 나온다.

또 하나 중요한 건 **스코어링 로직을 명확히 하는 것**이다:

> "스코어링 규칙:
> - ALWAYS 태그 매치 시 +50점
> - NEVER 태그 매치 시 해당 agent 제외
> - 도메인 일치 시 +30점
> - 키워드 매치 개수당 +10점
> - 최종 스코어는 (base_score * tier_weight) + bonus_points"

이렇게 점수 계산을 구체적으로 명시하면, Claude가 테스트 케이스까지 정확하게 만든다.

## Adapter 패턴으로 파일 포맷 통합하기

에이전트 정의는 Markdown과 YAML 두 포맷을 지원해야 했다. 서로 다른 구조의 데이터를 하나의 `AgentDefinition` 타입으로 변환하는 adapter가 필요했다.

이런 파싱 로직을 AI에게 만들게 할 때는 **입력/출력 예시를 구체적으로 보여주는 게 핵심**이다:

> "adapter.ts를 만든다. 다음 입력을 AgentDefinition으로 변환한다:
> 
> **입력 1 (Markdown):**
> ```markdown
> # Code Review Agent
> 
> Reviews code for best practices and security issues.
> 
> ## Tags
> - code-review
> - security  
> - ALWAYS:typescript
> 
> ## Skills
> - Static analysis
> - Security scanning
> ```
> 
> **입력 2 (YAML):**
> ```yaml
> name: "API Designer"
> description: "Designs RESTful APIs"
> tags: ["api", "design", "NEVER:graphql"]  
> skills: ["OpenAPI", "REST"]
> ```
> 
> **출력 (AgentDefinition):**
> ```typescript
> {
>   name: string,
>   description: string, 
>   tags: string[],
>   alwaysTags: string[],
>   neverTags: string[],
>   skills: string[]
> }
> ```
> 
> ALWAYS:/NEVER: 접두사는 별도 배열로 분리한다. frontmatter와 본문을 모두 파싱한다."

입출력이 명확하면 Claude가 정확한 파싱 로직을 만든다. 특히 "ALWAYS/NEVER 접두사 분리"같은 특수 요구사항은 반드시 예시에 포함해야 한다.

파싱 에러 처리도 구체적으로 명시했다:

> "에러 처리 규칙:
> - 필수 필드 누락 시 ParseError 던지기
> - 잘못된 YAML 문법 시 원본 에러 메시지 포함
> - 빈 파일이거나 빈 문자열 시 EmptyContentError
> - 모든 에러는 파일명과 라인 번호 포함"

이렇게 하면 Claude가 robust한 에러 처리 코드를 만든다.

## Claude Code의 프로젝트 설정 활용법

이 프로젝트에서는 Claude Code의 프로젝트 설정 기능을 적극 활용했다. `CLAUDE.md` 파일에 프로젝트 컨텍스트를 명시하고, custom instructions로 코딩 스타일을 고정했다.

`CLAUDE.md` 설정:

```markdown
# AgentOchester Project

## Architecture
- src/core/ — Type definitions and pure business logic
- src/adapter/ — File format parsers (.md, .yaml)  
- src/catalog/ — Agent matching and ranking
- src/server/ — API endpoints
- tests/ — Test files mirror src/ structure

## Coding Standards
- All functions are pure (no side effects)
- Use async/await consistently  
- Export interfaces from index.ts files
- Test coverage must be 100%
- Use descriptive variable names

## Dependencies
- TypeScript 5.0+
- Vitest for testing
- No external AI/ML libraries
- Node.js built-ins only for file operations
```

이렇게 설정하면 Claude가 새 파일을 만들 때 자동으로 프로젝트 구조와 코딩 스타일을 따른다.

특히 유용한 패턴은 **slash commands 활용**이다:

- `/implement` — 인터페이스 정의를 구체 클래스로 구현
- `/test` — 기존 코드에 대한 테스트 케이스 생성  
- `/refactor` — 코드 구조 개선 (기능 변경 없이)
- `/review` — 코드 리뷰 및 개선 제안

`/implement` 명령어로 `AgentCatalog` 인터페이스를 구현할 때:

> "/implement AgentCatalog interface with 3-tier matching. Use the scoring rules from CLAUDE.md. Include comprehensive error handling."

이렇게 하면 Claude가 프로젝트 컨텍스트를 참조해서 일관된 구현을 만든다.

## 멀티 파일 작업에서 컨텍스트 관리하기

8,000줄 코드를 여러 파일로 나누면서 가장 어려웠던 건 **파일 간 의존성 관리**였다. Claude가 한 번에 볼 수 있는 컨텍스트는 제한적이라, 전체 구조를 놓치기 쉽다.

효과적인 패턴은 **dependency graph를 먼저 만드는 것**이다:

> "파일 간 의존성 그래프:
> 
> ```
> types/index.ts (no dependencies)
> ↓
> adapter/index.ts (depends on types)
> ↓  
> catalog/index.ts (depends on types, adapter)
> ↓
> server/api.ts (depends on catalog)
> ↓
> dashboard/ (depends on server)
> ```
> 
> 이 순서대로 파일을 만든다. 각 단계에서 이전 단계 파일들을 import할 수 있지만, 역방향 의존성은 금지한다."

의존성 방향이 명확하면 Claude가 circular dependency 없는 깔끔한 구조를 만든다.

또 다른 유용한 패턴은 **barrel exports 사용**이다:

> "각 폴더마다 index.ts를 만들어서 public API만 export한다:
> 
> ```typescript
> // src/core/index.ts
> export type { AgentDefinition, Task, MatchResult } from './types';
> export { AgentCatalog } from './catalog';
> 
> // 내부 구현은 export하지 않는다
> ```
> 
> 다른 모듈에서는 './core'만 import하고 내부 파일 직접 접근 금지."

이렇게 하면 API 경계가 명확해지고, Claude가 리팩토링할 때도 public API를 건드리지 않는다.

## 프롬프트 조립 시스템 — 동적 컨텐츠 생성 패턴

에이전트 매칭이 끝나면 실행 가능한 프롬프트로 조립해야 한다. 사용자 작업, 선택된 에이전트, 컨텍스트 정보를 하나의 완성된 프롬프트로 만드는 `assembler.ts`가 핵심이다.

프롬프트 템플릿을 AI에게 만들게 할 때는 **출력 형태를 먼저 보여주는 게 중요**하다:

> "assembler.ts를 만든다. 다음 형태의 프롬프트를 생성한다:
> 
> ```
> You are a Code Review Agent specialized in TypeScript and security analysis.
> 
> Your skills include:
> - Static code analysis
> - Security vulnerability detection  
> - Performance optimization
> 
> Task: Review this React component for security issues and performance problems.
> 
> Context:
> - Project uses Next.js 14
> - Target: Production deployment
> - Focus areas: XSS prevention, bundle size
> 
> User Input:
> [actual user code here]
> 
> Please provide specific recommendations with code examples.
> ```
> 
> 이 템플릿을 AgentDefinition과 Task 객체로부터 동적 생성한다."

템플릿이 명확하면 Claude가 적절한 변수 치환 로직을 만든다.

프롬프트 조립에서 중요한 건 **컨텍스트 우선순위**다:

> "컨텍스트 우선순위:
> 1. Agent의 core skills (항상 포함)
> 2. Task 관련 제약조건 (NEVER 태그 확인)
> 3. 사용자가 제공한 추가 컨텍스트
> 4. 프로젝트 메타데이터 (선택적)
> 
> 프롬프트 길이가 4000 토큰 초과 시 우선순위 낮은 것부터 제거한다."

이런 우선순위 규칙이 있으면 Claude가 토큰 제한 상황에서도 중요한 정보를 보존한다.

## 더 나은 방법은 없을까

이 글에서 다룬 방식들보다 더 효율적인 대안들을 살펴보자.

**구조화 측면에서는** Domain-Driven Design(DDD) 패턴을 더 엄격하게 적용할 수 있다. 현재는 단순한 레이어 분리만 했지만, Aggregate Root, Value Objects, Domain Services 개념을 도입하면 더 견고한 구조가 된다. 특히 `AgentDefinition`을 Value Object로, `AgentCatalog`을 Aggregate Root로 모델링하면 불변성과 일관성을 더 잘 보장할 수 있다.

**AI 활용 측면에서는** Anthropic의 최신 Model Context Protocol(MCP)을 사용하면 더 정교한 컨텍스트 관리가 가능하다. 현재는 `CLAUDE.md`로 정적 컨텍스트만 제공했지만, MCP 서버를 만들면 실시간으로 프로젝트 상태를 Claude에게 전달할 수 있다. 예를 들어 현재 빌드 상태, 테스트 커버리지, 의존성 그래프 등을 동적으로 제공하는 것이다.

**프롬프팅 패턴에서는** Chain-of-Thought와 Tree-of-Thoughts를 더 체계적으로 활용할 수 있다. 복잡한 매칭 알고리즘을 만들 때 "단계별로 생각해봐" 같은 단순한 지시 대신, 구체적인 사고 과정을 명시하는 것이다:

> "다음 단계로 매칭 알고리즘을 설계해라:
> 1. 먼저 가능한 모든 매칭 전략을 나열해라
> 2. 각 전략의 장단점을 분석해라  
> 3. 성능과 정확도 트레이드오프를 고려해라
> 4. 최종 하이브리드 전략을 제안해라
> 5. 구현 우선순위를 정해라"

**테스트 전략에서는** Property-Based Testing을 도입할 수 있다. 현재는 단순한 unit test만 작성했지만, QuickCheck 스타일의 속성 기반 테스트를 사용하면 더 많은 edge case를 발견할 수 있다. 특히 매칭 알고리즘같은 복잡한 로직에는 "모든 valid input에 대해 결과는 정렬되어야 한다" 같은 속성을 검증하는 것이 효과적이다.

**성능 측면에서는** 현재의 동기식 매칭을 비동기 스트리밍으로 바꿀 수 있다. 에이전트 수가 많아지면 전체 매칭 완료를 기다리는 것보다, 매칭 결과를 점진적으로 스트리밍하는 게 사용자 경험에 좋다. Web Streams API를 사용해서 구현할 수 있다.

## 정리

AI를 활용한 복잡한 시스템 개발에서 핵심은 구조화된 접근이다. 큰 그림부터 세부사항으로 진행하고, 각 단계마다 명확한 제약 조건을 제시하는 것이 중요하다.

의사코드와 입출력 예시로 복잡한 로직을 명확히 전달하면 Claude가 정확한 구현을 만든다. 특히 3-tier 매칭 같은 알고리즘은 단계별 분해가 필수다.

프로젝트 설정과 컨텍스트 관리를 체계적으로 하면 멀티 파일 작업에서도 일관성을 유지할 수 있다. `CLAUDE.md`와 slash commands를 적극 활용하자.

템플릿 기반 동적 컨텐츠 생성에서는 출력 형태를 먼저 보여주고 우선순위 규칙을 명시하는 것이 효과적이다.

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