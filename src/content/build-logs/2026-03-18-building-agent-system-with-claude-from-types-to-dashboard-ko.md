---
title: "Claude로 에이전트 시스템 처음부터 구축하기 — 타입 정의부터 대시보드까지"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [fix, feat, chore, typescript, css]
---

에이전트 관리 시스템을 0부터 만들어야 했다. 타입 정의, 파서, 매칭 엔진, API 서버, React 대시보드까지 12개 커밋으로 완성했다. 이 과정에서 Claude를 어떻게 활용했는지, 어떤 프롬프팅 패턴이 효과적이었는지 정리한다.

## 배경: 무엇을 만들고 있는가

AgentOchester는 AI 에이전트를 카탈로그화하고 작업에 맞는 에이전트를 자동으로 매칭해주는 시스템이다. 기존에 마크다운으로 작성된 에이전트 정의들이 있고, 이걸 구조화된 시스템으로 만들어야 했다.

목표는 명확했다:
1. 마크다운을 파싱해서 `AgentDefinition` 타입으로 변환
2. 3단계 매칭 알고리즘으로 작업에 적합한 에이전트 찾기  
3. Next.js 대시보드에서 에이전트 탐색과 매칭 기능 제공

8,000라인이 넘는 코드를 12개 커밋으로 나눠서 체계적으로 구축했다.

## 타입 우선 설계 — AI에게 명확한 제약 주기

첫 번째 커밋에서 핵심 타입들을 정의했다. 이게 가장 중요한 단계였다.

AI와 협업할 때 타입 정의를 먼저 하는 이유는 간단하다. 모호함을 제거하기 때문이다. 프롬프트에 "에이전트 시스템 만들어줘"라고 하면 AI는 추측할 수밖에 없다. 하지만 명확한 타입이 있으면 AI가 그 제약 안에서 정확한 구현을 만든다.

내가 쓴 프롬프트:

> "AI 에이전트 관리 시스템의 핵심 타입들을 TypeScript로 정의해줘. 에이전트는 마크다운에서 파싱되고, 태그 기반 매칭이 가능해야 한다. 작업(Task)과 에이전트를 매칭하는 3-tier 시스템을 염두에 둬. 확장 가능한 구조로."

결과물:

```typescript
interface AgentDefinition {
  id: string
  name: string
  description: string
  tags: string[]
  capabilities: string[]
  constraints?: string[]
  examples?: string[]
}

interface Task {
  description: string
  domain?: string
  complexity?: 'low' | 'medium' | 'high'
  tags?: string[]
}
```

이렇게 하면 안 된다:

> "에이전트 관리하는 코드 만들어줘"

이 차이가 크다. 첫 번째는 AI가 구체적인 구조를 만들 수 있게 가이드를 준다. 두 번째는 AI가 임의로 추측해야 한다.

## 점진적 구현 전략 — 한 번에 하나씩

타입 정의 다음에는 파서부터 시작했다. 마크다운을 `AgentDefinition`으로 변환하는 `adapter.ts`를 만들 때 쓴 프롬프트:

> "마크다운 파일을 파싱해서 AgentDefinition으로 변환하는 adapter를 만들어줘. 
> 
> 입력 형식:
> - `# Agent Name` (h1이 이름)
> - description은 첫 번째 단락
> - `## Tags`, `## Capabilities` 섹션에서 리스트 파싱
> - frontmatter는 무시
> 
> 에러 핸들링:
> - 필수 필드 없으면 validation error
> - 빈 파일이나 잘못된 형식 처리
> 
> 테스트도 함께 작성해줘."

핵심은 **구체적인 예시**와 **명확한 제약 조건**이다. "마크다운 파서 만들어줘"라고 하면 AI는 어떤 형식을 기대하는지 모른다.

결과적으로 100% 테스트 커버리지를 가진 파서가 나왔다. 리팩토링 없이 바로 쓸 수 있는 수준이었다.

## 복잡한 로직은 단계별로 분해

매칭 엔진이 가장 복잡한 부분이었다. 3단계 매칭 알고리즘을 구현해야 했다:

1. **Exact match**: 태그가 정확히 일치
2. **Semantic match**: 도메인 추론으로 관련성 계산  
3. **Fallback**: 범용 에이전트 반환

이런 복잡한 로직을 AI에게 한 번에 시키면 실패한다. 대신 이렇게 나눴다:

**1단계 - 구조만 먼저**

> "`AgentCatalog` 클래스를 만들어줘. 3단계 매칭 메서드 구조만. 실제 로직은 TODO로 두고."

**2단계 - 각 매칭 로직 개별 구현**

> "exact match부터 구현해줘. 작업의 tags와 에이전트의 tags를 비교해서 교집합이 있으면 매칭."

> "semantic match 구현해줘. 작업 description에서 도메인을 추론하고, 에이전트 태그와의 관련성을 0-1 스코어로 계산."

**3단계 - 통합과 테스트**

> "3단계 매칭을 순서대로 시도하는 `findBestMatch` 메서드 완성해줘. 각 단계에서 결과가 없으면 다음 단계로."

이 방식의 장점은 각 단계에서 검증할 수 있다는 것이다. AI가 만든 코드를 바로 테스트하고, 문제가 있으면 해당 단계만 다시 요청한다.

## Next.js 대시보드 — 컴포넌트 단위 프롬프팅

프론트엔드 작업에서는 **컴포넌트 단위**로 프롬프트를 나누는 게 효과적이다.

에이전트 라이브러리 컴포넌트를 만들 때:

> "에이전트 목록을 보여주는 `AgentLibrary` 컴포넌트를 만들어줘.
> 
> 요구사항:
> - 카드 형태로 에이전트 표시 (이름, 설명, 태그)
> - 태그별 필터링 기능
> - 검색창 (이름, 설명에서 검색)
> - Tailwind CSS 사용
> - TypeScript props 인터페이스 정의
> 
> 데이터는 `/api/agents` GET 요청으로 가져와."

결과물은 바로 쓸 수 있는 수준이었다. 스타일링도 일관되고, TypeScript 타입도 정확했다.

컴포넌트 프롬프팅에서 중요한 건 **구체적인 UI 요구사항**이다. "예쁘게 만들어줘"가 아니라 "카드 형태", "필터링 기능" 같은 명확한 스펙을 줘야 한다.

## API 설계 — RESTful 패턴 강제하기

서버 API를 만들 때는 RESTful 패턴을 명시적으로 요구했다:

> "에이전트 관리 API를 Next.js App Router로 만들어줘.
> 
> 엔드포인트:
> - `GET /api/agents` - 전체 에이전트 목록
> - `POST /api/agents/match` - 작업 매칭 (body에 Task 객체)
> 
> 응답 형식:
> - 성공: `{ success: true, data: T }`
> - 실패: `{ success: false, error: string }`
> 
> AgentCatalog 인스턴스를 재사용하고, 에러 핸들링 포함해줘."

AI는 일관된 API 패턴을 만들어냈다. 응답 형식도 통일되고, 에러 핸들링도 proper하게 됐다.

API 프롬프팅에서는 **응답 스키마**를 미리 정의하는 게 핵심이다. 그래야 프론트엔드와 백엔드가 seamless하게 연결된다.

## 테스트 주도 개발 — AI에게 품질 기준 제시하기

모든 핵심 로직에는 테스트를 함께 요청했다. 단순히 "테스트도 만들어줘"가 아니라 **구체적인 테스트 시나리오**를 제시했다:

> "adapter.ts 테스트를 Vitest로 작성해줘.
> 
> 테스트 케이스:
> - 정상적인 마크다운 파싱
> - 필수 필드 누락 시 validation error  
> - 빈 파일 처리
> - 잘못된 형식 (h1 태그 없음) 처리
> - edge case: tags나 capabilities 섹션 없음
> 
> 100% 커버리지 목표로."

결과적으로 51개 테스트가 생성됐고, 모두 통과했다. 리팩토링할 때도 안전했다.

AI가 만든 테스트의 품질이 높은 이유는 **명확한 시나리오**를 줬기 때문이다. AI는 edge case를 놓치지 않고, proper한 assertion을 작성한다.

## 더 나은 방법은 없을까

이 프로젝트를 다시 한다면 몇 가지를 다르게 할 것이다:

**Claude Projects 활용**
개별 프롬프트보다는 Claude Projects에서 전체 컨텍스트를 관리하는 게 나았을 것이다. 타입 정의부터 시작해서 점진적으로 context를 쌓아가면 더 일관된 결과를 얻을 수 있다.

**MCP Server 연동**  
파일 시스템 작업이 많았는데, MCP filesystem server를 쓰면 파일 읽기/쓰기를 더 효율적으로 할 수 있다. 특히 마크다운 파일들을 batch로 처리할 때 유용하다.

**Artifacts 활용**
컴포넌트 개발할 때 Claude Artifacts를 쓰면 실시간으로 결과를 보면서 iteration할 수 있다. 특히 UI 컴포넌트는 시각적 피드백이 중요하다.

**더 세분화된 커밋 전략**
12개 커밋으로 나눴지만, 더 세분화했으면 좋았을 것이다. 특히 매칭 엔진은 각 단계별로 커밋을 나누는 게 나았다. AI가 만든 코드를 단계별로 검증하기 더 쉬워진다.

**Schema-first Development**
타입 정의 외에도 JSON Schema나 Zod를 먼저 정의하고, 그걸 기반으로 validation과 타입을 생성하는 방식이 더 견고했을 것이다. 특히 API 요청/응답 검증에서 유용하다.

## 정리

- **타입 우선 설계**: AI에게 명확한 제약 조건을 주면 정확한 구현이 나온다
- **점진적 구현**: 복잡한 로직은 단계별로 나눠서 각각 검증한다  
- **구체적인 프롬프팅**: "예쁘게"가 아니라 "카드 형태, 필터링 기능" 같은 명확한 스펙을 준다
- **테스트 주도**: 구체적인 테스트 시나리오를 제시하면 100% 커버리지도 가능하다

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