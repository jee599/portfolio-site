---
title: "AI 에이전트 매칭 시스템 구축하기 — 3-tier scoring과 YAML 파서로 프롬프트를 자동화하는 법"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [feat, fix, chore, typescript, css]
---

복잡한 에이전트 시스템을 만들 때 가장 어려운 건 "어떤 에이전트를 언제 써야 하나"를 자동화하는 것이다. 이번에 agentochester라는 프로젝트로 AI 에이전트 매칭 시스템을 구축하면서 3-tier scoring과 YAML 파서를 통해 이 문제를 해결했다. 

이 글에서는 AI로 복잡한 시스템 아키텍처를 설계하고 구현할 때 효과적인 프롬프팅 패턴과 구조화 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

agentochester는 AI 에이전트 카탈로그와 매칭 시스템이다. 사용자가 작업을 입력하면 8개 내장 에이전트 중에서 가장 적합한 것을 자동으로 골라주고, 프롬프트까지 조립해준다.

핵심 컴포넌트는 세 가지다:
- **AgentCatalog**: YAML/Markdown 에이전트 정의를 파싱하고 관리
- **AgentManager**: 3단계 매칭 알고리즘으로 최적 에이전트 선택  
- **Dashboard**: Next.js 기반 UI로 에이전트 라이브러리와 매칭 패널 제공

목표는 "AI에게 또 다른 AI 시스템을 설계하게 만드는 것"이었다. 단순히 코드를 짜게 하는 게 아니라 아키텍처부터 알고리즘까지 전체적인 시스템 설계를 맡기는 실험이었다.

## AI로 시스템 아키텍처 설계하기

가장 먼저 해야 할 일은 AI에게 "시스템 전체를 구상하게 만드는 것"이다. 개별 기능을 하나씩 요청하면 일관성 없는 코드가 나온다.

### 효과적인 아키텍처 설계 프롬프트

이렇게 요청했다:

> "AI 에이전트 매칭 시스템을 만들어야 한다. 사용자가 작업을 입력하면 가장 적합한 에이전트를 자동으로 선택하고 프롬프트를 조립해주는 시스템이다.
> 
> 요구사항:
> - TypeScript로 구현
> - YAML과 Markdown 파일에서 에이전트 정의를 읽어옴  
> - 3단계 매칭: 도메인 → 태그 → 키워드 순으로 점수 계산
> - 8개 내장 에이전트 지원
> - Next.js 대시보드 포함
> - 100% 테스트 커버리지
> 
> 먼저 전체 시스템 아키텍처와 주요 클래스 구조를 설계해줘. 구현은 나중에."

이 프롬프트가 효과적인 이유:
1. **최종 목표가 명확하다** - "에이전트 매칭"이라는 핵심 기능
2. **제약 조건이 구체적이다** - TypeScript, 3단계 매칭, 테스트 등
3. **구현과 설계를 분리했다** - 아키텍처부터 생각하게 만듦

반면 이렇게 하면 안 된다:

> "에이전트 시스템 만들어줘"

이런 애매한 요청은 AI가 추측으로 코드를 작성하게 만든다.

### 시스템 경계 명확하게 그리기

아키텍처 설계 후 다음 단계는 "어떤 부분을 AI에게 맡기고 어떤 부분을 사람이 할지" 결정하는 것이다.

AI에게 맡긴 부분:
- **타입 정의**: `AgentDefinition`, `Task`, `CatalogEntry` 등 핵심 인터페이스
- **파싱 로직**: YAML frontmatter와 Markdown 본문 분리
- **매칭 알고리즘**: 도메인/태그/키워드 기반 점수 계산
- **테스트 코드**: 각 컴포넌트별 단위 테스트

사람이 직접 한 부분:
- **비즈니스 로직**: 어떤 도메인과 태그를 쓸지 결정
- **UI/UX**: 대시보드 레이아웃과 상호작용 패턴
- **에이전트 정의**: 각 에이전트의 역할과 프롬프트 템플릿

핵심은 "AI가 잘하는 것"과 "사람이 잘하는 것"을 구분하는 것이다. AI는 일관된 패턴을 반복하는 건 잘하지만, 창의적 판단이나 사용자 경험 설계는 사람이 더 낫다.

## 3-tier 매칭 알고리즘을 AI로 구현하기

가장 복잡한 부분은 매칭 알고리즘이었다. 단순히 "비슷한 에이전트 찾아줘"가 아니라 체계적인 점수 계산이 필요했다.

### 알고리즘 설계 프롬프팅

> "3단계 매칭 알고리즘을 구현해야 한다:
> 
> 1. **Domain Match** (30점): 작업 도메인과 에이전트 도메인이 일치하면 만점
> 2. **Tag Match** (40점): 작업 태그와 에이전트 태그 교집합 비율로 계산  
> 3. **Keyword Match** (30점): 작업 설명에서 에이전트 키워드가 몇 개 나오는지
> 
> 각 단계별로 0-100% 점수를 매기고, 가중평균으로 최종 점수를 계산한다. 
> 
> `AgentManager.findBestMatch(task: Task)` 메서드로 구현하고, 각 단계별 점수도 반환해서 디버깅할 수 있게 만들어줘."

이 프롬프트의 핵심 요소:
- **수치가 명확하다**: 30점, 40점, 30점으로 가중치 지정
- **계산 방식이 구체적이다**: "교집합 비율", "키워드 개수" 등
- **디버깅을 고려했다**: 단계별 점수를 별도로 반환하라고 명시

AI가 생성한 코드는 이랬다:

```typescript
findBestMatch(task: Task): AgentMatch {
  const candidates = this.agents.map(agent => {
    // Domain matching (30%)
    const domainScore = this.calculateDomainMatch(task, agent);
    
    // Tag matching (40%)  
    const tagScore = this.calculateTagMatch(task, agent);
    
    // Keyword matching (30%)
    const keywordScore = this.calculateKeywordMatch(task, agent);
    
    const finalScore = domainScore * 0.3 + tagScore * 0.4 + keywordScore * 0.3;
    
    return {
      agent,
      score: finalScore,
      breakdown: { domainScore, tagScore, keywordScore }
    };
  });
  
  return candidates.sort((a, b) => b.score - a.score)[0];
}
```

### 엣지 케이스 처리하기

첫 번째 구현은 기본적인 경우만 다뤘다. 엣지 케이스를 처리하려면 추가 프롬프팅이 필요하다:

> "현재 매칭 알고리즘에 다음 엣지 케이스 처리를 추가해줘:
> 
> 1. `task.domain`이 null이거나 빈 문자열인 경우
> 2. `agent.tags`가 빈 배열인 경우  
> 3. 모든 에이전트 점수가 0점인 경우 (fallback 필요)
> 4. `ALWAYS`/`NEVER` 태그 처리 (무조건 포함/제외)
> 
> 각 케이스별로 어떻게 처리할지 로직을 명시하고, 테스트 케이스도 함께 작성해줘."

이런 식으로 점진적으로 보완하면 robust한 알고리즘이 나온다. 한 번에 모든 걸 요청하면 AI가 놓치는 부분이 생긴다.

## YAML 파서를 AI로 구현할 때 주의점

에이전트 정의는 YAML frontmatter + Markdown 본문 형태였다:

```yaml
---
name: "Code Reviewer"
domain: "development"  
tags: ["review", "quality", "testing"]
expertise: ["typescript", "react"]
---

# Code Review Agent

You are an expert code reviewer...
```

이런 복합 포맷을 파싱할 때 AI가 자주 실수하는 부분이 있다.

### 파싱 요구사항을 단계별로 나누기

> "Markdown 파일에서 YAML frontmatter와 본문을 분리하는 파서를 만들어야 한다.
> 
> 1단계: `---`로 감싸진 YAML 블록 추출
> 2단계: YAML을 `AgentDefinition` 타입으로 파싱  
> 3단계: 남은 Markdown 본문을 `content` 필드에 저장
> 4단계: 필수 필드 (`name`, `domain`) 검증
> 
> 각 단계에서 파싱 에러가 나면 명확한 에러 메시지와 함께 throw한다. 
> 특히 YAML 문법 오류와 필수 필드 누락을 구분해서 처리해줘."

이렇게 단계를 나누면 AI가 더 정확한 코드를 작성한다. 그리고 에러 처리도 명시적으로 요청해야 한다.

### 검증 로직 강화하기

첫 번째 구현 후 추가 프롬프팅:

> "현재 파서에 다음 검증 로직을 추가해줘:
> 
> - `domain`이 허용된 값 목록에 있는지 확인
> - `tags` 배열에 중복이 없는지 확인
> - `expertise` 배열이 비어있지 않은지 확인
> - Markdown 본문이 최소 100자 이상인지 확인
> 
> 각 검증 실패 시 구체적인 에러 메시지를 제공하고, 모든 검증을 통과한 경우에만 `AgentDefinition` 객체를 반환한다."

AI는 "검증해줘"라고 하면 기본적인 것만 한다. 구체적인 검증 규칙을 명시해야 실용적인 코드가 나온다.

## Next.js 대시보드를 AI로 구축하기

프론트엔드는 AI가 상대적으로 잘하는 영역이다. 특히 컴포넌트 기반 UI는 패턴이 정해져 있어서 일관된 결과가 나온다.

### 컴포넌트 설계 프롬프팅

> "Next.js 13 App Router로 대시보드를 만들어야 한다. 
> 
> 페이지 구성:
> - `/`: 메인 대시보드 - AgentLibrary와 AgentMatchPanel 나란히 배치
> - `/agents`: 전체 에이전트 목록 페이지
> - `/api/agents`: 백엔드 API 엔드포인트
> 
> 컴포넌트:  
> - `AgentLibrary`: 8개 에이전트를 카드 형태로 표시, 클릭하면 상세 정보
> - `AgentMatchPanel`: 작업 입력받고 매칭 결과 표시, 점수 breakdown 포함
> 
> 디자인: Tailwind CSS 사용, 모던하고 깔끔한 스타일
> 
> API 연동: `/api/agents` 엔드포인트에서 에이전트 목록과 매칭 기능 제공
> 
> 먼저 전체 파일 구조와 각 컴포넌트의 props 인터페이스부터 설계해줘."

### 상태 관리와 데이터 플로우

React 컴포넌트는 상태 관리가 핵심이다. AI에게 명확한 데이터 플로우를 제시해야 한다:

> "`AgentMatchPanel` 컴포넌트의 상태 관리를 다음과 같이 구현해줘:
> 
> 1. `task` state: 사용자 입력 (description, domain, tags)
> 2. `matchResult` state: 매칭 결과와 점수 breakdown  
> 3. `isLoading` state: API 호출 중 표시
> 4. `error` state: 에러 메시지 표시
> 
> 플로우:
> - 폼 제출 시 `/api/agents/match` POST 요청
> - 로딩 중에는 버튼 비활성화
> - 성공 시 매칭 결과 표시 (에이전트 정보 + 점수 breakdown)
> - 실패 시 에러 메시지 표시
> 
> TypeScript로 작성하고, 모든 state와 props에 타입 지정해줘."

이렇게 구체적인 상태와 플로우를 명시하면 AI가 일관된 컴포넌트를 만든다.

## 더 나은 방법은 없을까

이번 작업에서 사용한 방식보다 더 효율적인 대안들을 살펴보자.

### MCP 서버 활용

현재는 API 엔드포인트로 에이전트 매칭을 처리했지만, MCP (Model Context Protocol) 서버로 구현하면 더 자연스러운 통합이 가능하다. Claude Desktop이나 다른 AI 클라이언트에서 직접 에이전트 매칭 기능을 쓸 수 있다.

### Vector Embedding 기반 매칭

3-tier scoring 대신 sentence embeddings을 사용하면 더 정교한 매칭이 가능하다. OpenAI의 `text-embedding-3-small`이나 Anthropic의 embedding API를 써서 작업 설명과 에이전트 설명의 semantic similarity를 계산하는 방식이다.

### Schema Validation

현재는 수동으로 검증 로직을 작성했지만, JSON Schema나 Zod를 써서 선언적으로 검증하는 게 더 안전하다. 특히 YAML 파싱 후 스키마 검증을 자동화할 수 있다.

### Dynamic Agent Loading

지금은 8개 내장 에이전트만 지원하지만, GitHub repository나 NPM package에서 에이전트를 동적으로 로드하는 플러그인 시스템이 더 확장성이 좋다. 

### Streaming Response

매칭 결과를 한 번에 반환하는 대신 streaming으로 처리하면 사용자 경험이 개선된다. 특히 복잡한 프롬프트 조립 과정을 실시간으로 보여줄 수 있다.

## 정리

- **아키텍처 먼저**: AI에게 개별 기능이 아닌 전체 시스템 설계부터 요청한다
- **단계적 복잡성**: 기본 구현 → 엣지 케이스 → 최적화 순으로 점진적으로 개선한다  
- **명확한 제약 조건**: 수치, 알고리즘, 검증 규칙을 구체적으로 명시한다
- **시스템 경계 설정**: AI가 잘하는 부분과 사람이 잘하는 부분을 명확히 구분한다

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