---
title: "AI 에이전트 프로덕트를 한 번에 8개 언어로 만드는 프롬프팅 전략"
project: "agentochester"
date: 2026-03-18
lang: ko
tags: [fix, feat, chore, typescript, css]
---

AI 에이전트 시스템을 개발하면서 처음부터 8개 언어로 동시 출시해야 하는 상황에 부딪혔다. 이 글에서는 Claude를 활용해 멀티링구얼 프로덕트를 효율적으로 만드는 프롬프팅 패턴과 구조화 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

AgentCrow(현재는 AgentClaw로 리브랜딩)라는 AI 에이전트 매칭 시스템을 개발했다. 사용자가 작업을 입력하면 적합한 에이전트를 찾아주고, 팀으로 구성해서 실행하는 플랫폼이다.

처음부터 글로벌 서비스를 염두에 뒀기 때문에 한국어, 영어, 일본어, 중국어 간체/번체, 스페인어, 프랑스어, 독일어 총 8개 언어로 동시 출시가 목표였다. 단순히 번역 API를 쓰는 게 아니라, 각 언어권의 문화적 맥락에 맞는 자연스러운 인터페이스를 만들어야 했다.

## 멀티링구얼 i18n을 Claude로 한 번에 처리하기

### 구조화된 번역 프롬프팅

i18n 파일을 8개 언어로 만들 때 가장 중요한 건 **일관성**이다. 각 언어별로 따로따로 번역하면 톤이나 스타일이 제각각 된다.

효과적인 프롬프트 패턴을 찾았다:

> "이 JSON 구조를 8개 언어로 번역해줘. 각 언어별 특징을 반영해서:
> 
> - 한국어: 정중하지만 간결한 존댓말
> - 영어: 친근하지만 프로페셔널한 톤
> - 일본어: 정중한 경어, UI에서 자연스러운 표현
> - 중국어 간체/번체: 간체는 직관적, 번체는 정중한 표현
> - 스페인어: 국제적으로 통용되는 표준 스페인어
> - 프랑스어: 프랑스 본토 표준어
> - 독일어: 격식 있는 Sie 형태
>
> 브랜드명 'AgentClaw', 기술 용어 'agent', 'prompt', 'API'는 번역하지 마. 
> JSON 키는 그대로 유지하고 값만 번역해."

이렇게 쓰면 안 된다:
> "번역해줘"

차이점은 명확하다. 첫 번째 프롬프트는:
- 언어별 톤 가이드라인을 제시한다
- 번역하지 말아야 할 용어를 명시한다  
- 출력 형식을 구체적으로 지정한다

### CLAUDE.md로 번역 컨텍스트 유지하기

프로젝트 루트에 `CLAUDE.md`를 만들어서 번역 가이드라인을 저장했다:

```markdown
# Translation Guidelines

## Brand Terms (DO NOT TRANSLATE)
- AgentClaw
- agent, prompt, API
- Claude, GPT

## Tone by Language
- Korean: 존댓말, 간결
- English: Professional but friendly
- Japanese: 丁寧語
- Chinese: 简体用词简洁, 繁体较正式
- Spanish: Estándar internacional
- French: Français standard
- German: Sie-Form

## UI Context
This is an AI agent matching platform. Users input tasks, system finds suitable agents.
```

이제 Claude Code에서 `/commit` 할 때마다 이 컨텍스트가 자동으로 포함된다. 일관된 번역 품질을 유지하는 핵심이다.

### 반복 작업 자동화 패턴

8개 언어 파일을 동시에 수정할 때는 이런 프롬프트를 썼다:

> "dashboard/lib/i18n.ts 파일에서 새로운 키 3개를 추가했다:
> - `agent.detail.identity`
> - `agent.detail.rules`  
> - `agent.detail.deliverables`
>
> 기존 8개 언어 객체에 이 키들을 추가하되, 각 언어의 기존 스타일을 그대로 유지해. 에이전트 상세 정보를 보여주는 UI 컨텍스트야."

Claude가 기존 파일의 패턴을 파악해서 일관되게 추가해준다. 중요한 건 **컨텍스트**를 명확히 주는 것이다. "UI 컨텍스트"라고 하면 Claude가 사용자 인터페이스에 맞는 간결한 표현을 선택한다.

## 로고와 브랜딩을 SVG로 구현하기

### 시각적 개념을 코드로 전환하는 프롬프팅

로고를 여러 번 바꿨다. 새우 → 사마귀 → 까마귀 → 집게발 순서로 진화했는데, 각 단계마다 Claude에게 SVG를 그리게 했다.

효과적인 시각 디자인 프롬프트:

> "AgentClaw 로고용 SVG를 만들어줘. 요구사항:
> 
> **시각적 컨셉**: 날카로운 까마귀 실루엣, 각진 형태, 날카로운 눈, 뾰족한 벼슬
> **색상**: #8B5CF6 (보라) 단색, 그라데이션 없음
> **크기**: 32x32px 기준, viewBox 최적화
> **스타일**: 미니멀, 아이콘화 가능, 작은 크기에서도 식별 가능
> **용도**: 네비게이션 바, 파비콘으로 사용
>
> React 컴포넌트로 export해줘."

이렇게 쓰면 안 된다:
> "까마귀 로고 만들어줘"

차이점은:
- 구체적인 시각 요소를 나열한다
- 기술적 제약사항을 명시한다 (크기, 색상, 용도)
- 출력 형식을 지정한다 (React 컴포넌트)

### 브랜드 일관성 유지 패턴

리브랜딩할 때마다 모든 파일의 색상 팔레트를 바꿔야 했다. 이때 쓴 프롬프트:

> "프로젝트 전체에서 색상 팔레트를 변경한다:
> 
> **기존**: 파랑 계열 (#3B82F6, #1E40AF)
> **신규**: 보라/사이언 계열 (#8B5CF6, #06B6D4)
> 
> 변경할 파일들:
> - dashboard/app/globals.css
> - dashboard/components/Logo.tsx  
> - dashboard/components/AgentLibrary.tsx
>
> 각 파일에서 색상 관련 클래스나 CSS 변수를 찾아서 일관되게 바꿔줘. hover 상태나 그라데이션도 신규 팔레트에 맞춰서."

Claude가 여러 파일을 동시에 수정하면서도 각 파일의 맥락에 맞는 색상 조합을 선택한다.

## 실시간 실행 스트리밍 구현하기

### Claude CLI를 Next.js API와 연결하기

가장 복잡한 부분은 Claude CLI를 백엔드에서 실행하고 결과를 실시간으로 스트리밍하는 것이었다. Server-Sent Events(SSE)를 써서 구현했다.

시스템 통합 프롬프트:

> "Next.js API 라우트에서 Claude CLI를 실행하고 결과를 SSE로 스트리밍하는 엔드포인트를 만들어줘.
>
> **요구사항**:
> - POST /api/execute
> - body에 agents 배열과 prompt 받기
> - 각 agent별로 `claude -p {prompt}` 실행
> - stdout을 실시간으로 클라이언트에 전송
> - 에러 처리: CLI 실패, 인증 오류, 타임아웃
> - TypeScript 타입 안전성
>
> **제약사항**:
> - shell injection 방지
> - 동시 실행 제한 (최대 3개)
> - 30초 타임아웃
>
> 프론트엔드용 React hook도 함께 만들어줘."

핵심은 **제약사항**을 명확히 주는 것이다. AI가 보안 이슈를 놓칠 수 있으니 shell injection 방지, 타임아웃 같은 조건을 미리 지정한다.

### 에러 처리 패턴

Claude CLI가 실패할 수 있는 케이스가 많다. 인증 오류, 네트워크 타임아웃, 잘못된 플래그 등. 이런 프롬프트로 견고한 에러 핸들링을 만들었다:

> "Claude CLI 실행에서 발생할 수 있는 모든 에러 케이스를 처리해줘:
>
> 1. **인증 실패**: `claude: authentication failed`
> 2. **네트워크 오류**: timeout, connection refused  
> 3. **잘못된 플래그**: `-p` 대신 `--print` 쓸 때
> 4. **프로세스 종료**: SIGTERM, SIGKILL
> 5. **출력 파싱 오류**: invalid JSON response
>
> 각 케이스별로 사용자 친화적인 에러 메시지와 복구 방법을 제안해. SSE 스트림에서 에러 이벤트로 전송하는 형태로."

이렇게 하면 Claude가 각 에러 타입별로 적절한 처리 로직을 생성한다.

## 컴포넌트 상태 관리를 AI에게 맡기기

### React 상태 로직 자동화

에이전트 상세 패널 같은 복잡한 컴포넌트는 상태 관리가 까다롭다. 이런 프롬프트를 썼다:

> "AgentLibrary 컴포넌트에 상세 패널 기능을 추가해줘.
>
> **동작**:
> - 에이전트 카드 클릭 시 오른쪽에 상세 패널 표시
> - 패널 내용: identity, rules, deliverables, metrics
> - ESC 키로 닫기, 외부 클릭으로 닫기
> - 애니메이션: 슬라이드 인/아웃
>
> **상태 설계**:
> - selectedAgent: AgentDefinition | null
> - isDetailOpen: boolean
> - API 호출: /api/agents/detail?id={agentId}
>
> **제약사항**:
> - 기존 에이전트 목록 레이아웃 유지
> - 모바일에서는 fullscreen modal로 변경  
> - TypeScript strict mode 준수
> - 접근성 (ARIA labels, focus management)
>
> 기존 컴포넌트 코드를 최소한으로 수정하면서 구현해."

마지막 줄이 핵심이다. AI가 무작정 새로 짜는 게 아니라 **기존 코드를 보존하면서** 필요한 부분만 추가하게 한다.

### 상태 최적화 프롬프트

컴포넌트가 복잡해지면서 불필요한 리렌더링이 발생했다. 이런 식으로 최적화를 요청했다:

> "AgentLibrary 컴포넌트에서 성능 이슈를 최적화해줘:
>
> **문제점**:
> - selectedAgent 변경 시 전체 목록 리렌더링
> - 검색 입력마다 필터링 로직 재실행
> - API 호출 중복 (같은 agent 반복 클릭)
>
> **해결 방법**:
> - React.memo로 개별 에이전트 카드 최적화
> - useMemo로 필터링 결과 캐싱
> - 커스텀 hook으로 API 호출 캐싱
>
> 기존 동작은 그대로 유지하면서 성능만 개선해."

Claude가 적절한 최적화 패턴을 적용해서 렌더링 성능을 크게 개선했다.

## 더 나은 방법은 없을까

### Anthropic의 공식 베스트 프랙티스 적용

Anthropic 공식 문서에서 권장하는 프롬프팅 패턴을 적용하면 더 좋은 결과를 얻을 수 있다:

**시스템 프롬프트 활용**: 프로젝트별 컨텍스트를 시스템 프롬프트에 고정하고, 개별 작업은 user 프롬프트로 분리한다. 번역 가이드라인 같은 반복되는 지침은 시스템 프롬프트로 옮기면 토큰을 절약할 수 있다.

**Function calling 사용**: Claude 3.5의 function calling을 쓰면 API 응답을 구조화된 JSON으로 받을 수 있다. 특히 에이전트 매칭 같은 작업에서 스코어링 결과를 정확한 형식으로 받기 좋다.

### MCP 서버로 워크플로 자동화

Model Context Protocol(MCP)를 활용하면 반복 작업을 더 효율적으로 자동화할 수 있다:

**파일 시스템 MCP**: 여러 i18n 파일을 동시에 읽고 쓰는 작업을 MCP 서버로 처리하면 컨텍스트 관리가 훨씬 쉬워진다.

**Git MCP**: 커밋 메시지 생성이나 브랜치 전략을 MCP로 자동화하면 개발 워크플로가 개선된다.

### 최신 Claude Code 기능들

2024년 말부터 추가된 Claude Code의 새 기능들을 쓰면 더 효율적이다:

**Custom Skills**: 프로젝트별 반복 패턴을 skill로 저장해서 재사용한다. i18n 번역이나 컴포넌트 생성 같은 작업을 skill로 만들어두면 일관된 결과를 얻는다.

**Agent Mode**: 복잡한 멀티스텝 작업은 agent mode로 처리한다. "8개 언어로 번역하고, 로고 업데이트하고, README 생성하기" 같은 복합 작업을 한 번에 시킬 수 있다.

### 성능과 비용 최적화

토큰 사용량을 줄이는 패턴들:

**델타 업데이트**: 전체 파일을 다시 생성하지 말고 변경 부분만 diff로 요청한다. 특히 큰 i18n 파일에서 효과적이다.

**배치 처리**: 비슷한 작업들을 묶어서 한 번에 처리한다. 8개 언어 번역을 하나씩 8번 요청하지 말고, 한 번에 모두 요청한다.

**컨텍스트 압축**: CLAUDE.md에 너무 많은 정보를 넣지 말고, 현재 작업과 직접 관련된 것만 포함한다.

## 정리

AI를 활용한 멀티링구얼 프로덕트 개발에서 얻은 핵심 인사이트들이다:

- **구조화된 프롬프팅**이 일관성의 핵심이다. 언어별 톤 가이드라인과 번역 제외 용어를 명시한다
- **제약사항을 명확히** 주면 AI가 더 안전하고 정확한 코드를 생성한다. 특히 보안과 성능 요구사항은 필수다  
- **CLAUDE.md로 컨텍스트 관리**하면 모든 AI 상호작용에서 일관된 품질을 유지할 수 있다
- **반복 작업은 패턴화**해서 재사용한다. i18n, 로고, 컴포넌트 생성 등의 템플릿을 만들어둔다

<details>
<summary>이번 작업의 커밋 로그</summary>

39b44ea — fix: simplify agent detail to 2 lines — personality + description
85957ee — feat: agent detail panel — shows identity, rules, deliverables, metrics on click
6879fca — feat: rename to AgentCrow + clickable agent detail panel in library
c714f99 — docs: add README in 8 languages — quick start, architecture, examples
085898c — feat: sharp crow profile logo — angular silhouette, fierce eye, spiked crest
60a0689 — feat: rename to AgentCraw — purple crow face logo
e4e5e3c — feat: purple mantis logo with praying arms, compound eyes, translucent wings
f642c22 — feat: chunky cute shrimp logo with gradient, big eye, pincer claw
30bb61b — fix: i18n division labels — translate per language, no hardcoded Korean
97d0550 — feat: purple shrimp logo
47e440f — feat: rebrand to AgentClaw — vibrant violet/cyan palette, logo, full i18n
6a80dab — feat: redesign dashboard — dense industrial-editorial aesthetic
edf576e — feat: add QA Engineer builtin agent
887f079 — feat: i18n support (8 languages) + agent role descriptions
7a5d280 — feat: real-time execution streaming via SSE
6df1fc9 — fix: use correct claude CLI flags (-p instead of --print -m)
837bd8b — fix: shell escape error in CLI spawn + expand decomposer keywords
7695444 — fix: suppress hydration warning on body element (browser extension)
75487ae — feat: add executor — Claude CLI bridge + execute API + team execution UI
c9cd3af — feat: add compose system — prompt decomposition + auto agent matching

</details>