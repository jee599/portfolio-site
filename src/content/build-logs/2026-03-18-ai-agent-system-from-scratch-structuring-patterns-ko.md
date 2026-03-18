---
title: "AI 에이전트 시스템을 0에서 만들 때 필수 구조화 패턴 4가지"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [feat, fix, chore, typescript, css]
---

처음부터 AI 에이전트 시스템을 만들면서 Claude에게 복잡한 아키텍처를 구현시켰다. 이번 작업에서 발견한 핵심은 "AI가 헤매지 않게 만드는 구조화 전략"이었다. 에이전트 카탈로그, 매칭 시스템, 프롬프트 어셈블리까지 — 각 단계별로 효과적인 프롬프팅 패턴을 정리한다.

## 배경: 무엇을 만들고 있는가

`agentochester`는 다양한 AI 에이전트를 관리하고 매칭하는 시스템이다. 사용자가 작업을 던지면 가장 적합한 에이전트를 찾아서 연결해주는 플랫폼을 목표로 한다.

이번에 구현한 핵심 컴포넌트들:
- **Agent Catalog**: 에이전트들을 스캔하고 분류하는 라이브러리
- **Matching System**: 작업 요구사항과 에이전트 능력을 3단계로 매칭
- **Prompt Assembler**: 에이전트와 팀 구성을 위한 프롬프트 조립기
- **Dashboard**: Next.js 기반 관리 UI

11개 커밋으로 8,000줄 넘는 코드를 만들었는데, 90% 이상을 Claude가 담당했다. 문제는 이런 복잡한 시스템을 AI에게 어떻게 체계적으로 구현시키느냐였다.

## 타입부터 잡는다 — 전체 구조를 AI에게 각인시키기

복잡한 시스템을 Claude에게 만들라고 할 때 가장 먼저 해야 할 일은 **타입 정의**다. 타입은 AI에게 "우리가 뭘 만들고 있는지"를 정확히 알려주는 설계도 역할을 한다.

### 효과적인 타입 정의 프롬프팅

```
다음 요구사항을 만족하는 TypeScript 타입들을 설계해줘:

1. AgentDefinition: 에이전트의 메타데이터와 능력을 정의
2. Task: 사용자 요청을 구조화한 형태  
3. CatalogEntry: 카탈로그에 저장되는 에이전트 정보
4. AgentSource: 에이전트의 출처 (파일, URL, 내장형)

각 타입은:
- 필수/선택 필드를 명확히 구분
- union type으로 변형 가능성 표현
- 실제 JSON 예시도 함께 제공

타입 정의 후에 이 타입들이 어떻게 상호작용하는지 다이어그램으로 보여줘.
```

이렇게 하면 안 된다:
```
에이전트 시스템에 필요한 타입들 만들어줘.
```

### 왜 타입부터인가

타입을 먼저 정의하면 이후 모든 구현 작업에서 Claude가 일관성을 유지한다. `src/core/types.ts`에 핵심 타입들을 정의한 후, 모든 프롬프트에서 "이미 정의된 타입을 사용해라"고 명시했다.

```typescript
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  constraints?: string[];
  examples?: TaskExample[];
  metadata?: Record<string, unknown>;
}

export interface Task {
  description: string;
  domain?: string;
  requirements: string[];
  constraints?: string[];
}
```

이렇게 타입을 확정하고 나니 후속 작업에서 Claude가 **추측하지 않고** 정확히 구현한다.

## 테스트 주도로 AI 구현을 제어하기

두 번째 핵심 패턴은 **테스트부터 만들라고 시키는 것**이다. 특히 복잡한 로직일수록 테스트가 AI의 가드레일 역할을 한다.

### Adapter 구현 프롬프팅 예시

```
`src/core/adapter.ts`를 구현하기 전에 먼저 테스트를 작성해줘.

요구사항:
- Markdown 파일을 AgentDefinition으로 파싱
- YAML frontmatter 지원
- 잘못된 형식에 대한 에러 처리
- 필수 필드 검증

테스트 케이스:
1. 정상적인 .md 파일 파싱
2. YAML frontmatter가 있는 경우
3. 필수 필드 누락 시 에러
4. 잘못된 YAML 형식 처리
5. 빈 파일 처리

각 테스트마다 expect문을 구체적으로 작성하고, 테스트가 통과할 때까지 구현을 반복 수정해줘.
```

결과적으로 `adapter.ts`는 48개의 테스트를 모두 통과하는 견고한 코드가 나왔다. AI가 "대충 돌아가는 코드"가 아니라 "검증된 코드"를 만들게 된 것이다.

### 테스트가 주는 명확성

테스트를 먼저 만들면 AI가 구현해야 할 것이 명확해진다. 특히 edge case 처리에서 차이가 크다.

```typescript
describe('adapter error handling', () => {
  it('should throw on missing required fields', () => {
    const invalidMd = '# Agent\n\nNo metadata here';
    expect(() => parseAgentFromMarkdown(invalidMd))
      .toThrow('Required field "id" is missing');
  });
  
  it('should handle malformed YAML gracefully', () => {
    const malformedMd = '---\ninvalid: yaml: content:\n---\n# Agent';
    expect(() => parseAgentFromMarkdown(malformedMd))
      .toThrow('Invalid YAML frontmatter');
  });
});
```

이런 테스트가 있으면 Claude가 예외 처리를 빠뜨리지 않는다.

## 계층별 구현 — 복잡성을 단계별로 쪼개기

세 번째 패턴은 **의존성 순서대로 구현을 진행**하는 것이다. 아키텍처가 복잡할수록 AI가 전체를 한번에 구현하려다 헤맨다.

### 구현 순서 전략

1. **Core Types** (`types.ts`) — 모든 것의 기반
2. **Adapter** (`adapter.ts`) — 데이터 파싱 로직
3. **Catalog** (`catalog.ts`) — 에이전트 저장소
4. **Agent Manager** (`agent-manager.ts`) — 매칭 로직
5. **Assembler** (`assembler.ts`) — 프롬프트 조립
6. **API Layer** (`api.ts`) — 서버 인터페이스
7. **Dashboard** (Next.js 컴포넌트들) — UI

각 단계별로 별도 프롬프트를 사용했다:

```
이전에 구현한 adapter.ts와 types.ts를 바탕으로 AgentCatalog 클래스를 구현해줘.

요구사항:
- 디렉토리 스캔으로 .md 파일 자동 로드
- 3단계 매칭 시스템 (exact, partial, fallback)
- 캐싱으로 성능 최적화
- 태그 기반 스코어링

이미 구현된 타입들을 import해서 사용하고, adapter.ts의 parseAgentFromMarkdown 함수를 활용해라.

구현 후 기본적인 테스트도 함께 작성해줘.
```

### 의존성 그래프 명시하기

각 단계에서 "이미 구현된 것들"을 명확히 알려주는 게 중요하다. Claude는 컨텍스트 윈도우 안에서만 기억하므로, 의존성을 명시적으로 언급해야 한다.

```
현재까지 완성된 모듈들:
- types.ts: AgentDefinition, Task, CatalogEntry 타입 정의
- adapter.ts: Markdown → AgentDefinition 파싱 (48개 테스트 통과)
- catalog.ts: 에이전트 저장소와 3단계 매칭 로직

이제 assembler.ts를 구현해줘. 위 모듈들을 import해서 사용하되...
```

이런 식으로 "지금까지의 진행 상황"을 매번 요약해서 알려주면 Claude가 기존 코드와 일관성 있게 구현한다.

## Next.js 대시보드 — UI 구현의 함정 피하기

네 번째 패턴은 **UI 컴포넌트 구현 시 제약 조건을 명확히 주기**다. Claude는 UI 코드를 만들 때 "그럴듯하지만 동작 안 하는" 코드를 자주 만든다.

### 효과적인 UI 구현 프롬프팅

```
Next.js 14 App Router로 에이전트 관리 대시보드를 만들어줘.

기술 스택 제약:
- TypeScript 필수
- Tailwind CSS로 스타일링  
- Server Components 우선, Client Components는 필요시에만
- 상태 관리는 useState만 사용 (외부 라이브러리 금지)

컴포넌트 요구사항:
1. AgentLibrary: 에이전트 목록 표시, 검색/필터링
2. AgentMatchPanel: 작업 입력하면 매칭 결과 표시
3. 각 컴포넌트는 별도 파일로 분리

API 연동:
- /api/agents 엔드포인트 사용
- fetch로 데이터 로드, loading state 처리
- 에러 처리와 빈 상태 UI도 포함

실제 동작하는 코드를 만들어라. 컴파일 에러나 런타임 에러가 없어야 한다.
```

### 동작하지 않는 코드의 함정

Claude가 자주 만드는 "그럴듯한 코드":

```typescript
// 이런 코드는 컴파일은 되지만 실제로 동작 안 함
const [agents, setAgents] = useState([]);

useEffect(() => {
  // API 호출 코드가 있지만 에러 처리 없음
  fetchAgents().then(setAgents);
}, []);

return (
  <div>
    {agents.map(agent => (
      // key prop 없음, 타입 불일치
      <AgentCard agent={agent} />
    ))}
  </div>
);
```

제약 조건을 명확히 주니 이런 코드가 나왔다:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { AgentDefinition } from '../../../src/core/types';

export default function AgentLibrary() {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/agents');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setAgents(data.agents || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Load failed');
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, []);

  // 실제 검색/필터링 로직과 UI 렌더링...
}
```

## 더 나은 방법은 없을까

지금까지 설명한 패턴들보다 더 효율적인 방법들이 있다.

### Claude Projects와 Custom Instructions

개별 프롬프트마다 컨텍스트를 반복 설명하는 대신, **Claude Projects**를 활용할 수 있다. 프로젝트 단위로 다음을 설정:

- `CLAUDE.md`: 프로젝트 전체 아키텍처와 코딩 컨벤션
- Knowledge base: 핵심 타입 정의와 API 문서  
- Custom instructions: "타입부터 만들고, 테스트 주도로 구현하라"

이렇게 하면 매 프롬프트마다 배경 설명을 반복하지 않아도 된다.

### Anthropic의 새로운 Computer Use API

최신 Anthropic API는 파일 시스템 직접 조작을 지원한다. 이를 활용하면:

1. Claude가 직접 `git status`로 현재 상태 파악
2. 테스트 실행 후 결과 확인해서 자동 수정
3. 타입 체크 에러를 보고 즉시 수정

현재 방식은 사람이 중간에서 복붙하는 단계가 많은데, Computer Use를 쓰면 완전 자동화가 가능하다.

### MCP 서버로 개발 워크플로 통합

Model Context Protocol을 활용하면 더 강력한 개발 환경을 만들 수 있다:

- **Git MCP**: 커밋 히스토리와 브랜치 상태를 Claude가 직접 확인
- **Test Runner MCP**: 테스트 실행과 커버리지 체크 자동화
- **TypeScript MCP**: 컴파일 에러와 타입 체크를 실시간 피드백

이런 도구들을 연결하면 "구현 → 테스트 → 수정" 사이클을 Claude가 자동으로 돌릴 수 있다.

### 에이전트 팀 구성 패턴

복잡한 시스템은 단일 Claude 인스턴스보다 **전문화된 에이전트들의 협업**이 더 효과적이다:

- **Architect Agent**: 전체 설계와 타입 정의 담당
- **Implementation Agent**: 비즈니스 로직 구현 전문  
- **Test Agent**: 테스트 코드와 품질 검증 담당
- **UI Agent**: 프론트엔드 컴포넌트만 집중

각 에이전트에게 명확한 역할과 제약 조건을 주면, 단일 에이전트보다 품질 높은 코드가 나온다.

## 정리

AI로 복잡한 시스템을 만들 때 핵심은 **구조화**다:

- **타입부터 정의**해서 AI에게 명확한 설계도를 제공한다
- **테스트 주도 개발**로 AI의 구현을 검증 가능하게 만든다  
- **의존성 순서대로 단계별 구현**해서 복잡성을 관리한다
- **UI 구현 시 구체적 제약 조건**을 줘서 동작하지 않는 코드를 방지한다

이런 패턴을 따르면 Claude가 8,000줄 넘는 시스템도 일관성 있게 구현할 수 있다.

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