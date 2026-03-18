---
title: "AI 에이전트 시스템 구축하며 배운 구조화 프롬프팅 — YAML부터 Next.js까지"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [fix, feat, chore, typescript, css]
---

8000줄 코드의 AI 에이전트 시스템을 12개 커밋으로 만들면서 깨달은 게 있다. AI에게 복잡한 시스템을 만들게 하려면 **구조화가 전부**라는 것이다. 이 글에서는 타입 정의부터 Next.js 대시보드까지, 어떤 프롬프팅 패턴이 효과적이었는지 공유한다.

## 배경: 무엇을 만들고 있는가

AgentOrchester라는 AI 에이전트 매칭 시스템을 구축 중이다. 사용자가 작업을 던지면 적합한 에이전트를 찾아 연결해주는 플랫폼이다. 핵심은 3-tier 매칭 알고리즘과 YAML 기반 에이전트 정의 시스템이다.

이번 작업의 목표는 명확했다. 백엔드 코어 로직부터 프론트엔드 대시보드까지 전체 파이프라인을 구축하는 것이다. 총 52개 파일, 8000줄이 넘는 코드를 생성해야 했다.

## 타입 우선 설계로 AI 혼선 방지하기

복잡한 시스템을 AI와 만들 때 가장 먼저 해야 할 일은 **타입 정의**다. 이걸 먼저 확정하지 않으면 AI가 중간중간 다른 구조로 코드를 생성한다.

### 효과적인 타입 정의 프롬프트

> "TypeScript로 AI 에이전트 시스템의 핵심 타입을 정의해줘. AgentDefinition, AgentSource, CatalogEntry, Task 네 가지가 필요하다. 
> 
> AgentDefinition은 YAML 파일에서 파싱될 구조고, name, description, capabilities, constraints를 포함한다. AgentSource는 에이전트의 출처(builtin, external, custom)를 나타낸다. CatalogEntry는 검색과 매칭을 위한 메타데이터를 담는다. Task는 사용자 요청을 구조화한 객체다.
> 
> 각 타입은 optional 필드와 required 필드를 명확히 구분하고, Union 타입을 적절히 활용해라."

이렇게 쓰면 안 된다:
> "에이전트 시스템에 필요한 타입들 만들어줘"

차이점이 보이는가? 첫 번째 프롬프트는 **구체적인 요구사항과 제약 조건**을 담고 있다. AI가 추측할 여지를 최소화했다.

### 타입 확정 후 단계적 구축

타입을 확정한 뒤에는 다음 순서로 작업했다:

1. `adapter.ts` — YAML 파서
2. `AgentCatalog.ts` — 에이전트 관리 로직  
3. `assembler.ts` — 프롬프트 조립기
4. `api.ts` — 서버 핸들러
5. Next.js 컴포넌트들

각 단계에서 이전에 만든 타입을 참조하도록 명시했다. "앞서 정의한 `AgentDefinition` 타입을 import해서 써라"라고 구체적으로 지시하는 식이다.

## YAML 파서에서 배운 제약 조건의 힘

YAML 파일을 `AgentDefinition` 객체로 변환하는 파서를 만들 때 중요한 걸 배웠다. AI에게 **명확한 제약 조건**을 주지 않으면 과도하게 복잡한 코드를 생성한다는 것이다.

### 제약 조건이 포함된 프롬프트

> "markdown 파일을 AgentDefinition으로 파싱하는 adapter.ts를 만들어줘. 
> 
> 제약 조건:
> - YAML frontmatter만 파싱하고, 본문 markdown은 description으로 처리
> - 필수 필드(name, description)가 없으면 파싱 실패로 처리
> - capabilities와 constraints는 string 배열로 파싱
> - 파싱 에러는 구체적인 에러 메시지와 함께 throw
> - external dependency 없이 Node.js 내장 API만 사용
> 
> 테스트 케이스도 함께 작성하되, 성공/실패/edge case 모두 커버해라."

결과적으로 깔끔하고 테스트 가능한 코드가 나왔다. 제약 조건이 없었다면 unnecessary한 라이브러리 의존성이나 과도한 추상화가 들어갔을 것이다.

### Claude의 테스트 우선 개발

특히 Claude에게 "테스트도 함께 작성해라"라고 하면 **TDD 방식**으로 더 견고한 코드를 만든다. 테스트를 먼저 고려하면서 API 설계가 더 명확해지는 효과가 있다.

```typescript
// AI가 생성한 테스트 코드 예시
describe('adapter', () => {
  it('should parse valid YAML frontmatter', () => {
    const content = `---
name: "Code Reviewer"
capabilities: ["code-review", "security-audit"]
---
Reviews code for quality and security issues.`;
    
    const result = parseMarkdownToAgent(content);
    expect(result.name).toBe('Code Reviewer');
    expect(result.capabilities).toEqual(['code-review', 'security-audit']);
  });
});
```

## 3-tier 매칭 알고리즘을 AI와 설계하기

에이전트 매칭 시스템의 핵심인 3-tier 알고리즘을 설계할 때는 **수학적 로직과 비즈니스 로직을 분리**해서 프롬프팅했다.

### 알고리즘 설계 프롬프트 패턴

> "3단계 에이전트 매칭 알고리즘을 구현해줘.
> 
> Tier 1: Exact match (capability가 정확히 일치)
> Tier 2: Fuzzy match (Levenshtein distance < 3)  
> Tier 3: Domain inference (관련 도메인 추론)
> 
> 각 tier에서 점수를 매기되, 상위 tier일수록 가중치를 높게 둬라. 같은 tier 내에서는 confidence score로 정렬한다.
> 
> domain inference 로직은 별도 함수로 분리하고, 확장 가능하게 설계해라. 나중에 ML 모델로 대체할 수 있도록."

여기서 중요한 건 **확장성 고려 지시**다. "나중에 ML 모델로 대체할 수 있도록"이라는 한 줄이 AI로 하여금 더 모듈화된 코드를 생성하게 만든다.

### 복잡한 로직의 단계적 검증

매칭 알고리즘처럼 복잡한 로직은 AI가 한 번에 완벽하게 만들기 어렵다. 그래서 **단계적 검증** 패턴을 썼다:

1. 먼저 단순한 exact match만 구현
2. 테스트 케이스로 검증  
3. fuzzy match 추가
4. domain inference 추가
5. 전체 통합 테스트

각 단계마다 "이전 단계 테스트가 깨지지 않도록 해라"라고 명시했다.

## Next.js 컴포넌트에서 상태 관리 패턴

프론트엔드를 만들 때는 **상태 관리 복잡도**가 핵심 이슈였다. 에이전트 목록, 검색 필터, 매칭 결과를 동시에 관리해야 했다.

### 컴포넌트 설계 프롬프트

> "Next.js로 에이전트 라이브러리 컴포넌트를 만들어줘.
> 
> 요구사항:
> - Server Component로 초기 데이터 페칭
> - Client Component에서 검색/필터링 interactivity  
> - 실시간 매칭 결과 업데이트
> - 에러 상태와 로딩 상태 처리
> 
> 상태 관리는 useState hook만 사용하고, 외부 라이브러리 의존성 없이 구현해라. 각 컴포넌트는 단일 책임 원칙을 지켜라."

결과적으로 `AgentLibrary.tsx`와 `AgentMatchPanel.tsx` 두 컴포넌트로 깔끔하게 분리됐다.

### API 호출 에러 처리 패턴

특히 API 호출 부분에서 **에러 처리를 구체적으로 지시**하는 게 중요했다:

> "fetch 에러를 세 가지로 분류해서 처리해라:
> 1. 네트워크 에러 (사용자에게 재시도 유도)
> 2. 4xx 에러 (입력값 검증 메시지)  
> 3. 5xx 에러 (서버 문제 안내)
> 
> 각각 다른 UI 피드백을 보여주고, 에러 로깅도 포함해라."

이런 구체적 지시가 없으면 AI가 단순히 `console.error()`만 찍고 넘어간다.

## 더 나은 방법은 없을까

이번 작업을 돌이켜보면 **더 효율적으로 할 수 있는 방법**들이 보인다.

### MCP 서버 활용

현재는 YAML 파싱을 직접 구현했지만, Anthropic의 MCP(Model Context Protocol) 서버를 쓰면 더 효율적이다. 특히 파일 시스템 작업이 많을 때는 `filesystem` MCP 서버를 연동하는 게 좋다.

```bash
# MCP 서버 설정 예시
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/path/to/agents"]
    }
  }
}
```

### Claude Projects의 Knowledge Base

에이전트 정의 YAML 파일들을 Claude Projects의 Knowledge Base에 업로드하면 더 정확한 추천을 받을 수 있다. 현재는 하드코딩된 매칭 로직을 쓰는데, Claude가 직접 에이전트 특성을 파악해서 매칭해주는 방식이 더 정교할 수 있다.

### Cursor의 Composer 활용

멀티 파일 작업에서는 Cursor의 Composer 모드가 VSCode Claude보다 효과적이다. 특히 타입 정의를 여러 파일에서 일관되게 유지하는 작업에서 Composer의 cross-file context tracking이 유리하다.

### Anthropic API의 Tool Use

현재 서버 API는 단순한 JSON 응답만 하는데, Anthropic API의 Tool Use 기능을 활용하면 더 복잡한 에이전트 상호작용을 구현할 수 있다. 에이전트가 다른 에이전트를 호출하는 체이닝도 가능하다.

## 정리

이번 AI 에이전트 시스템 구축에서 배운 핵심 포인트는 다음과 같다:

- **타입 정의를 먼저 확정**하면 AI가 일관된 코드를 생성한다
- **구체적 제약 조건**이 과도한 복잡성을 방지한다  
- **단계적 검증 패턴**으로 복잡한 로직도 안정적으로 구축할 수 있다
- **에러 처리를 구체적으로 지시**해야 production-ready 코드가 나온다

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