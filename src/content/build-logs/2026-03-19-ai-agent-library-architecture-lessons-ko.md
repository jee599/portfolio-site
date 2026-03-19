---
title: "AI 에이전트 라이브러리 만들기 — 35개 커밋에서 배운 구조화 전략"
project: "agentochester"
date: 2026-03-19
lang: ko
tags: [fix, feat, chore, typescript, css]
---

AgentCrow라는 AI 에이전트 관리 플랫폼을 35개 커밋에 걸쳐 구축하면서, AI 도구를 어떻게 효과적으로 활용했는지 정리한다. 단순한 CRUD 앱이 아니라 에이전트를 매칭하고, 실시간으로 실행하고, 8개 언어를 지원하는 복합적인 시스템이었다.

## 배경: 무엇을 만들고 있는가

AgentCrow는 YAML로 정의된 AI 에이전트들을 카탈로그로 관리하고, 사용자 요청에 맞는 에이전트를 자동으로 매칭해주는 플랫폼이다. Claude CLI와 연동해서 실제로 에이전트를 실행하고, 결과를 실시간 스트리밍으로 보여준다.

이 프로젝트에서 흥미로운 점은 **메타적 특성**이다. AI 에이전트를 관리하는 도구를 AI의 도움으로 만들었다. Claude Code를 써서 에이전트 매칭 로직을 짰고, 각 에이전트의 YAML 정의도 AI가 생성했다. 

브랜딩도 4번 바뀌었다. AgentClaw → purple shrimp → AgentCraw → AgentCrow. 로고도 새우에서 까마귀까지 계속 진화했다. 이런 반복 작업에서 AI 도구가 얼마나 효과적인지 확인할 수 있었다.

## TypeScript 타입 설계에서 AI 활용하기

복잡한 에이전트 시스템의 타입을 설계할 때 Claude Code가 특히 유용했다. 핵심은 **도메인 지식을 먼저 정리하고, 구조적 제약 조건을 명확히 제시**하는 것이다.

```typescript
interface AgentDefinition {
  identity: string;
  context: string;
  rules: string[];
  deliverables: string[];
  tags: string[];
  metrics?: Record<string, number>;
}
```

이 타입을 만들 때 사용한 프롬프트:

> "AI 에이전트를 YAML로 정의할 때 필요한 TypeScript 인터페이스를 만들어줘. 에이전트는 정체성(identity), 맥락(context), 규칙(rules), 결과물(deliverables)을 가져야 한다. tags는 매칭용이고, metrics는 선택적으로 성능 지표를 저장한다. validation이 쉽도록 flat한 구조로 해줘."

단순히 "인터페이스 만들어줘"라고 하면 안 된다. **사용 목적과 제약 조건**을 명시해야 한다.

Claude Code의 `CLAUDE.md`에는 이런 설정을 넣었다:

```markdown
# AgentCrow Development Context

## Architecture
- TypeScript + Next.js + Tailwind
- YAML-based agent definitions
- 3-tier matching: exact → semantic → fallback

## Patterns
- Prefer composition over inheritance
- Keep interfaces flat for easy validation
- Use discriminated unions for type safety
```

이렇게 하면 모든 생성 코드가 일관된 패턴을 따른다.

### 다단계 매칭 로직 구현

에이전트 매칭은 3단계로 구성된다:
1. **Exact match**: 태그 완전 일치
2. **Semantic match**: 키워드 유사도 기반
3. **Fallback**: 도메인별 기본 에이전트

이런 복잡한 로직을 AI에게 시킬 때는 **단계별로 쪼개서** 요청한다:

> "먼저 exact matching 함수만 만들어줘. tags 배열에서 교집합을 찾고, 점수는 일치하는 태그 수 / 전체 태그 수로 계산해."

> "이제 semantic matching을 추가해. keywords를 받아서 agent.tags와 유사도를 계산하되, exact match 점수가 0.5 이상이면 semantic은 건너뛰어."

> "마지막으로 fallback logic을 구현해. domain을 추론해서 ('frontend', 'backend', 'data', 'content' 중 하나) 해당 도메인의 기본 에이전트를 반환해."

한 번에 전체 로직을 요청하면 중간에 실수가 생겨도 디버깅이 어렵다. **점진적으로 복잡도를 높이는** 전략이 효과적이다.

## 실시간 스트리밍과 Claude CLI 연동

가장 복잡했던 부분은 Claude CLI를 통해 에이전트를 실행하고, 결과를 Server-Sent Events로 실시간 스트리밍하는 것이었다. 

여기서 핵심은 **AI에게 완성된 코드를 요청하는 게 아니라, 구조와 패턴을 먼저 물어보는** 것이다:

> "Next.js에서 Claude CLI를 spawn하고 stdout을 SSE로 스트리밍하고 싶다. 어떤 구조로 설계해야 할까? child_process, ReadableStream, SSE 연동 시 주의사항도 알려줘."

AI가 구조를 제안하면, 그 다음에 구체적인 구현을 요청한다:

> "위에서 제안한 구조로 `/api/execute` 엔드포인트를 만들어줘. Claude CLI 명령어는 `claude -p '${prompt}' -m '${model}'` 형태고, 실행 중에 클라이언트가 연결을 끊으면 child process도 정리해야 한다."

이 방식의 장점은 **내가 전체 아키텍처를 이해한 상태에서 코드를 받는다**는 점이다. AI가 생성한 코드를 블랙박스로 쓰는 게 아니라, 왜 이렇게 구현했는지 알 수 있다.

### 에러 처리와 경계 조건

AI가 생성한 코드는 보통 happy path만 다룬다. 에러 처리는 별도로 요청해야 한다:

> "위 코드에서 예외 상황들을 처리해줘: Claude CLI가 없을 때, invalid 프롬프트, timeout, memory 부족, 네트워크 단절. 각 에러마다 적절한 HTTP 상태 코드도 반환해."

이때도 **구체적인 시나리오**를 나열하는 게 중요하다. "에러 처리해줘"라고 하면 generic한 try-catch만 받는다.

## i18n 8개 언어 자동화 패턴

처음에는 한국어로만 개발하다가, 글로벌 서비스를 고려해서 8개 언어를 추가했다. 이런 대량 번역 작업에서 AI의 효과가 극명하게 드러난다.

효과적인 i18n 프롬프트 패턴:

> "다음 한국어 i18n 객체를 영어, 일본어, 중국어(간체/번체), 스페인어, 프랑스어, 독일어로 번역해줘. 기술 용어(Agent, Dashboard, API)는 번역하지 말고, 존댓말은 각 언어의 일반적인 비즈니스 톤으로 해줘. JSON 형태로만 답변해."

```json
{
  "ko": {
    "agent.library": "에이전트 라이브러리",
    "execute.button": "실행하기",
    "matching.score": "매칭 점수"
  }
}
```

이렇게 하면 8개 언어가 일관된 톤으로 번역된다. 각 언어별로 따로 요청하면 톤이 달라진다.

### 동적 콘텐츠 처리

에이전트별 역할 설명도 다국어로 만들어야 했다. 이때는 **템플릿 기반 접근법**을 썼다:

> "다음 agent role을 8개 언어로 설명해줘. 각 언어마다 2-3줄로, 해당 언어권 사용자가 이해하기 쉽게 의역해도 좋다:"
>
> ```yaml
> identity: "Senior QA Engineer specialized in comprehensive testing strategies"
> context: "Modern web applications with CI/CD pipelines"
> ```

이 방식의 핵심은 **직역이 아니라 의역을 허용**한다는 점이다. 각 언어권의 문화적 맥락에 맞게 조정되어서 더 자연스럽다.

## 브랜딩 변경과 SVG 로고 생성

프로젝트 이름을 4번 바꾸면서, 로고도 계속 새로 만들었다. 이런 반복 디자인 작업에서 AI가 특히 유용했다.

SVG 로고 생성 프롬프트:

> "AgentCrow 브랜드를 위한 까마귀 로고를 SVG로 만들어줘. 요구사항: 날카로운 실루엣, 강렬한 눈, 뾰족한 볏. 색상은 보라색 그라디언트. 32x32에서도 선명해야 하고, 복잡한 디테일은 피해줘."

AI가 생성한 첫 번째 시안:

```svg
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 2c-2 0-4 1-6 3l-2 4v8c0 4 2 8 6 10h4c4-2 6-6 6-10v-8l-2-4c-2-2-4-3-6-3z" 
        fill="url(#crow-gradient)"/>
  <circle cx="12" cy="12" r="1.5" fill="#fff"/>
  <defs>
    <linearGradient id="crow-gradient">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
</svg>
```

너무 단순해서 피드백을 줬다:

> "더 까마귀같게 만들어줘. 부리를 날카롭게, 눈을 더 작고 매서우게, 전체적으로 더 angular하게."

이런 식으로 3-4번 iteration을 거쳐서 완성했다. 디자이너 없이도 충분히 쓸만한 브랜드 아이덴티티를 만들 수 있다.

### 일관된 디자인 시스템

로고만 바뀌는 게 아니라 전체 UI 색상도 함께 업데이트해야 했다. 이때 Tailwind 색상을 일괄 변경하는 프롬프트:

> "AgentCrow 브랜딩에 맞게 Tailwind config를 수정해줘. primary는 보라색(#8b5cf6), secondary는 cyan(#06b6d4). 기존 코드에서 purple-500, blue-500 등을 찾아서 새 색상으로 바꿔줘."

이렇게 하면 브랜드 변경이 몇 분 만에 끝난다.

## 더 나은 방법은 없을까

이 프로젝트를 진행하면서 몇 가지 개선점을 발견했다.

### MCP 서버 활용

현재는 Claude CLI를 직접 spawn하는데, **Model Context Protocol** 서버를 쓰면 더 깔끔할 것 같다. Anthropic에서 공식 지원하는 `@modelcontextprotocol/server-filesystem` 서버를 쓰면:

- 파일 시스템 접근이 더 안전하다
- 에러 처리가 표준화된다
- 로깅과 모니터링이 쉽다

다음 버전에서는 MCP 서버 기반으로 리팩토링할 예정이다.

### AI SDK 통합

Vercel AI SDK를 쓰면 스트리밍이 더 간단해진다:

```typescript
import { streamText } from 'ai';

export async function POST(req: Request) {
  const result = await streamText({
    model: claude('claude-3-5-sonnet-20241022'),
    prompt: await req.text(),
  });
  
  return result.toAIStreamResponse();
}
```

현재 SSE 직접 구현하는 것보다 훨씬 간단하다.

### 에이전트 정의 표준화

YAML 포맷을 직접 만들었는데, **OpenAI Assistant API** 포맷이나 **Langchain Agent** 표준을 따르는 게 나을 수 있다. 생태계 호환성이 중요하다.

### 벡터 DB 활용

현재는 simple keyword matching을 쓰는데, **Pinecone**이나 **Supabase Vector**를 쓰면 semantic search가 더 정확해진다. 특히 다국어 지원에서 embedding 기반 매칭이 유리하다.

## 정리

이 프로젝트에서 얻은 핵심 인사이트들:

- **단계별 분해**가 가장 중요하다. 복잡한 기능을 한 번에 요청하지 말고 작은 단위로 쪼개서 검증하면서 진행한다.
- **구조를 먼저 물어보고 구현을 나중에** 요청한다. AI가 제안한 아키텍처를 이해한 후에 코드를 받는다.
- **제약 조건을 명확히** 제시한다. "validation 쉽게", "32x32에서도 선명하게" 같은 구체적 요구사항이 품질을 결정한다.
- **반복 작업에서 AI가 특히 강력**하다. i18n, 브랜딩 변경, 에러 처리 같은 패턴이 있는 작업은 거의 완전 자동화 가능하다.

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
a16f47a — fix: suppress hydration warning on html element (browser extension interference)
766cc93 — fix: replace emoji icons with text to prevent hydration mismatch
6d20419 — fix: set turbopack root to prevent workspace root inference issue
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