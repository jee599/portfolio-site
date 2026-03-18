---
title: "8가지 builtin 에이전트로 3-tier 매칭 시스템 구축하는 아키텍처 패턴"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [feat, fix, chore, typescript, css]
---

AI 에이전트 카탈로그 시스템을 처음부터 설계하면서 8개의 builtin 에이전트와 3단계 매칭 알고리즘을 구현했다. 이 글에서는 복잡한 시스템을 AI와 함께 단계별로 쌓아가는 방법과, 타입 안정성을 유지하면서 에이전트 파서를 구조화하는 패턴을 다룬다.

## 배경: 무엇을 만들고 있는가

`agentochester`는 여러 AI 에이전트를 관리하고 사용자의 task에 맞는 에이전트를 자동으로 매칭해주는 시스템이다. markdown으로 정의된 에이전트를 YAML 형태로 파싱하고, 3단계 매칭 알고리즘으로 최적의 에이전트를 찾아준다.

이번 작업의 목표는 core 시스템 구축이었다. 타입 정의부터 파서, 매칭 엔진, 그리고 Next.js 대시보드까지 한번에 만들어야 했다. 처음부터 끝까지 AI와 pair programming으로 진행했고, 특히 복잡한 타입 시스템과 테스트 케이스 작성에서 효과적인 프롬프팅 패턴을 발견했다.

## 타입 우선 설계로 AI와 함께 아키텍처 잡기

복잡한 시스템을 AI와 함께 만들 때 가장 중요한 것은 **타입 정의를 먼저 확정하는 것**이다. 타입이 명확해야 AI가 일관된 코드를 생성한다.

이 프로젝트에서 핵심 타입들을 정의할 때 사용한 프롬프트 패턴이다:

> "AI 에이전트 카탈로그 시스템의 core 타입을 정의해야 한다. 요구사항: 1) AgentDefinition은 name, version, description, capabilities, constraints를 포함 2) Task는 description, domain, priority를 가짐 3) 매칭 결과는 score와 reason을 포함 4) 모든 타입은 Zod로 validation 가능해야 함. TypeScript interface와 Zod schema를 함께 작성해줘."

이렇게 쓰면 안 된다:
> "에이전트 타입 만들어줘"

**핵심은 제약 조건을 구체적으로 명시하는 것**이다. "Zod로 validation 가능해야 함"이라는 조건을 주면 AI가 runtime validation까지 고려해서 타입을 설계한다.

결과적으로 `AgentDefinition`, `Task`, `CatalogEntry`, `AgentSource` 등 4개의 핵심 타입이 나왔고, 이후 모든 구현이 이 타입들을 기준으로 진행됐다.

타입 우선 접근의 장점:
- AI가 생성하는 코드가 일관성을 유지한다
- refactor 시점에서 타입 에러로 빠진 부분을 바로 발견한다
- 다른 개발자가 보더라도 시스템 구조를 바로 파악한다

## markdown에서 YAML로 파싱하는 adapter 구조화 전략

`.md` 파일에서 YAML frontmatter를 추출해서 `AgentDefinition`으로 변환하는 파서를 만들어야 했다. 이런 파싱 로직을 AI에게 시킬 때는 **에러 케이스를 미리 정의해주는 것**이 핵심이다.

효과적인 프롬프트:

> "markdown 파일에서 YAML frontmatter를 파싱해서 AgentDefinition으로 변환하는 adapter를 작성해줘. 처리해야 할 케이스: 1) YAML이 없는 파일 2) 잘못된 YAML 문법 3) 필수 필드 누락 4) capabilities가 배열이 아닌 경우 5) version이 semver 형태가 아닌 경우. 각 에러는 명확한 메시지와 함께 throw한다. gray-matter 라이브러리 사용."

이 프롬프트의 강점:
- 5가지 구체적인 에러 케이스를 나열했다
- 사용할 라이브러리를 명시했다
- "명확한 메시지와 함께 throw"로 에러 처리 방식을 지정했다

결과적으로 `adapter.ts`는 60줄 정도의 깔끔한 코드로 나왔고, 각 에러 케이스마다 적절한 validation이 들어갔다. 특히 `ALWAYS`/`NEVER` 같은 특수 키워드 파싱도 정확하게 처리됐다.

**AI에게 파서를 만들게 할 때 주의할 점:**
- 입력 데이터의 모든 edge case를 미리 나열한다
- 에러 메시지 형태를 구체적으로 지정한다
- 사용할 라이브러리나 패턴을 명시한다
- validation 로직과 transformation 로직을 분리하게 한다

## 3-tier 매칭 알고리즘을 점진적으로 구현하는 법

에이전트 매칭은 3단계로 설계했다: exact match → fuzzy match → fallback. 이런 복잡한 알고리즘을 AI와 함께 만들 때는 **단계별로 구현하고 각 단계마다 테스트를 먼저 작성**하는 패턴이 효과적이다.

1단계 프롬프트:
> "exact match 단계부터 구현하자. task.domain과 agent.capabilities 중에 정확히 일치하는 항목이 있으면 score 1.0을 준다. 일치 항목이 없으면 null을 반환. 테스트 케이스: 'frontend' task에 ['frontend', 'react'] capabilities를 가진 에이전트는 매칭, ['backend', 'api'] 에이전트는 매칭 안됨."

2단계 프롬프트:
> "이제 fuzzy match를 추가한다. exact match가 실패하면 Levenshtein distance로 유사도를 계산한다. distance가 2 이하면 score = (1 - distance/maxLength)로 계산. 'frontend' vs 'frontnd'는 매칭되어야 함."

3단계 프롬프트:
> "마지막으로 fallback 로직. fuzzy match도 실패하면 에이전트의 constraints에서 NEVER 키워드를 확인한다. task domain이 NEVER 목록에 없으면 기본 score 0.3을 준다. NEVER 목록에 있으면 null 반환."

**이 방식의 장점:**
- 각 단계가 독립적으로 테스트 가능하다
- 중간에 요구사항이 바뀌어도 특정 단계만 수정하면 된다
- AI가 전체 알고리즘을 한번에 이해할 필요가 없다

최종적으로 `AgentManager`의 `findBestMatch` 메서드는 30줄 정도로 깔끔하게 나왔고, 각 매칭 단계마다 명확한 점수 체계를 가지게 됐다.

## Next.js 대시보드를 빠르게 프로토타이핑하는 컴포넌트 구조

백엔드 시스템이 완성되면 빠르게 UI를 만들어서 테스트해야 한다. Next.js 대시보드를 AI와 함께 만들 때는 **컴포넌트를 기능별로 쪼개서 각각 독립적으로 구현**하는 것이 효율적이다.

대시보드 구조화 프롬프트:

> "Next.js 13 app router로 에이전트 대시보드를 만든다. 구조: 1) `/app/page.tsx`는 메인 페이지, AgentLibrary와 AgentMatchPanel 두 컴포넌트를 나란히 배치 2) AgentLibrary는 전체 에이전트 목록을 카드 형태로 표시 3) AgentMatchPanel은 task 입력 폼과 매칭 결과를 보여줌 4) `/app/api/agents/route.ts`에서 백엔드 AgentCatalog과 연동 5) Tailwind CSS 사용, 반응형 디자인"

각 컴포넌트별 세부 프롬프트:

> "AgentLibrary 컴포넌트를 구현해줘. 기능: 1) `/api/agents` 엔드포인트에서 에이전트 목록 fetch 2) 각 에이전트를 카드로 표시, name, description, capabilities 포함 3) 로딩 상태와 에러 상태 처리 4) capabilities는 badge 형태로 표시 5) `use client` directive 필요"

> "AgentMatchPanel 컴포넌트 구현: 1) task description 입력 텍스트박스 2) domain 선택 드롭다운 3) 'Find Best Match' 버튼 4) 매칭 결과는 에이전트 이름, score, reason 표시 5) 매칭 중일 때 loading spinner 6) React hooks로 상태 관리"

**컴포넌트별 구현의 장점:**
- 각 컴포넌트가 독립적으로 테스트 가능하다
- 하나의 컴포넌트에 문제가 생겨도 다른 부분은 영향받지 않는다
- 나중에 개별 컴포넌트만 refactor하기 쉽다

결과적으로 `AgentLibrary.tsx` (111줄)와 `AgentMatchPanel.tsx` (106줄) 두 컴포넌트가 나왔고, API 연동과 상태 관리가 깔끔하게 분리됐다.

## 더 나은 방법은 없을까

이 글에서 다룬 방식보다 더 효율적인 대안들이 있다:

**타입 정의 단계:**
- Anthropic의 공식 가이드에서는 prompt 내에서 TypeScript interface 예시를 제공하기보다는 JSON Schema를 먼저 정의하고 이를 바탕으로 타입을 생성하는 것을 권장한다. 이렇게 하면 frontend/backend 간 타입 불일치가 줄어든다.

**매칭 알고리즘:**
- 현재 3-tier 방식보다는 vector embedding을 활용한 semantic search가 더 정확할 수 있다. OpenAI의 text-embedding-3-small 모델로 agent capabilities와 task description을 embedding한 후 cosine similarity로 매칭하면 자연어 수준의 매칭이 가능하다.

**프롬프트 효율성:**
- Claude 3.5 Sonnet의 최신 features를 활용하면 한번의 프롬프트로 전체 시스템을 생성할 수 있다. artifacts 모드에서 multi-file codebase를 한번에 생성하고, 이후 iterative refinement로 개선하는 방식이 더 빠를 수 있다.

**컴포넌트 구조:**
- Next.js 14의 Server Components를 적극 활용하면 클라이언트 사이드 fetching을 줄일 수 있다. `AgentLibrary`를 Server Component로 만들고 `AgentMatchPanel`만 Client Component로 하는 hybrid 구조가 성능상 유리하다.

## 정리

- 복잡한 시스템은 타입 정의부터 시작해서 AI와 함께 점진적으로 구축한다
- 파서나 변환 로직을 만들 때는 모든 에러 케이스를 미리 나열해서 프롬프트에 포함한다  
- 다단계 알고리즘은 각 단계별로 테스트를 먼저 작성하고 순차적으로 구현한다
- UI 컴포넌트는 기능별로 쪼개서 독립적으로 구현하면 유지보수가 쉬워진다

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