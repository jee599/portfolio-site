---
title: "멀티 에이전트 오케스트레이터 만들기 — Claude CLI로 프롬프트 분해부터 실행까지"
project: "agentochester"
date: 2026-03-19
lang: ko
tags: [feat, fix, chore, typescript, css]
---

프롬프트 하나 던지면 여러 AI 에이전트가 협업해서 결과를 만들어주는 시스템을 만들었다. Claude CLI를 브릿지로 쓰고, LLM이 직접 작업을 분해해서 적합한 에이전트에게 배정하는 구조다. 이 과정에서 발견한 프롬프트 분해 패턴과 멀티 에이전트 오케스트레이션 기법을 공유한다.

## 배경: AgentCrow라는 멀티 에이전트 플랫폼

사용자가 하나의 복잡한 요청을 보내면, 시스템이 알아서 작업을 쪼개고 여러 전문 에이전트에게 배분해서 실행하는 플랫폼을 만들고 있었다. 예를 들어 "랜딩페이지 만들어줘"라고 하면 UX Designer가 구조를 잡고, Frontend Developer가 구현하고, QA Engineer가 검증하는 식이다.

핵심 도전 과제는 두 가지였다:
1. 사용자의 자연어 요청을 어떻게 구조화된 작업으로 분해할 것인가
2. 여러 에이전트의 결과를 어떻게 일관성 있게 합칠 것인가

이번 작업에서는 특히 첫 번째 문제에 집중했다. Claude CLI를 실제 실행 엔진으로 쓰면서, LLM 자체를 "스마트 분해기"로 활용하는 패턴을 구현했다.

## LLM을 작업 분해기로 쓰는 프롬프팅 전략

일반적인 접근법은 규칙 기반으로 키워드를 매칭하거나 정규식을 쓰는 것이다. 하지만 이건 확장성이 떨어진다. 대신 Claude에게 작업 분해 자체를 맡겼다.

핵심은 **컨텍스트를 충분히 주되, 출력 형식을 엄격하게 제한**하는 것이다. `smart-decomposer.ts`에서 쓴 프롬프트를 보자:

> "다음 사용자 요청을 분석해서 필요한 작업들로 분해해줘. 각 작업은 하나의 전문가가 독립적으로 수행할 수 있어야 한다.
> 
> 가능한 작업 유형: frontend, backend, database, api, ui-design, content-writing, data-analysis, qa-testing, project-management, marketing
> 
> 응답 형식 (JSON):
> ```json
> {
>   "tasks": [
>     {
>       "type": "frontend", 
>       "description": "구체적인 작업 내용",
>       "priority": 1,
>       "dependencies": []
>     }
>   ]
> }
> ```
> 
> 사용자 요청: ${userPrompt}"

여기서 중요한 건 **제약 조건의 층위**다:

1. **도메인 제약**: 10개 작업 유형으로 한정
2. **구조 제약**: JSON 스키마 강제
3. **논리 제약**: 독립성과 의존성 명시
4. **품질 제약**: 구체성 요구

이렇게 하면 자유로운 창발성은 유지하되 시스템이 처리할 수 있는 형태로 결과가 나온다.

### 나쁜 프롬프트와의 비교

이렇게 쓰면 안 된다:

> "이 요청을 작업으로 나눠줘: ${userPrompt}"

이런 식으로 하면 매번 다른 형식으로 답이 나오고, 파싱도 어렵고, 에이전트 매칭도 불가능하다. LLM에게 자유도를 주되 **출력 인터페이스는 엄격하게** 통제해야 한다.

## Claude CLI를 실행 브릿지로 쓰는 패턴

Claude CLI를 단순 질문-답변 도구로 쓰는 게 아니라, 에이전트 시스템의 **실행 엔진**으로 활용했다. 핵심은 `bridge.ts`에서 구현한 spawn 패턴이다:

```typescript
export async function executeClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn('claude', ['-p', prompt], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Claude CLI exited with code ${code}`));
      }
    });
  });
}
```

여기서 주의할 점들:

1. **플래그 조합**: `-p` (print mode)를 써서 interactive 모드를 피한다
2. **쉘 이스케이핑**: 프롬프트에 특수문자가 있을 수 있으니 spawn 옵션에 `shell: true`를 넣는다
3. **스트림 처리**: stdout을 실시간으로 받아서 프론트엔드에 SSE로 전달할 수 있다

### OAuth vs API Key 트레이드오프

처음엔 `ANTHROPIC_API_KEY`를 환경변수로 쓰려다가 OAuth로 바꿨다. 이유는:

- API Key: 프로그래밍 방식으로는 편하지만 로테이션과 권한 관리가 어렵다
- OAuth: 초기 설정은 복잡하지만 사용자별 권한 분리와 토큰 갱신이 자동화된다

멀티 테넌트 환경에서는 OAuth가 맞다. 각 사용자가 자기 Claude 계정으로 인증하고, 사용량도 개별적으로 관리된다.

## 실시간 실행 결과를 스트리밍하는 SSE 패턴

에이전트가 여러 개 돌아가면 사용자는 뭐가 진행되는지 모른다. 그래서 Server-Sent Events로 실시간 피드백을 구현했다.

`execute/route.ts`의 핵심 부분:

```typescript
export async function POST(request: Request) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { agents, prompt } = await request.json();
        
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'start',
            message: '에이전트 실행 시작'
          })}\n\n`)
        );
        
        for (const agent of agents) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'agent_start',
              agent: agent.name
            })}\n\n`)
          );
          
          const result = await executeClaude(
            `${agent.prompt}\n\n사용자 요청: ${prompt}`
          );
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'agent_result',
              agent: agent.name,
              result: result
            })}\n\n`)
          );
        }
        
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

프론트엔드에서는 `EventSource`로 받는다:

```typescript
const eventSource = new EventSource('/api/execute');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'agent_start':
      setStatus(`${data.agent} 실행 중...`);
      break;
    case 'agent_result':
      appendResult(data.agent, data.result);
      break;
  }
};
```

이렇게 하면 각 에이전트의 진행 상황을 실시간으로 볼 수 있고, 중간에 실패해도 어디서 멈췄는지 알 수 있다.

## 멀티언어 환경에서 에이전트 메타데이터 관리

에이전트의 이름, 설명, 역할 같은 메타데이터를 8개 언어로 지원해야 했다. 하드코딩하면 유지보수가 불가능하니까 구조화된 접근을 했다.

`i18n.ts`에서 에이전트별로 번역을 관리한다:

```typescript
export const agentTranslations = {
  'frontend-developer': {
    ko: {
      name: '프론트엔드 개발자',
      personality: '사용자 경험에 집착하는 완벽주의자',
      description: 'React, Vue, Angular로 인터랙티브한 웹 UI 구현'
    },
    en: {
      name: 'Frontend Developer', 
      personality: 'UX-obsessed perfectionist',
      description: 'Build interactive web UIs with React, Vue, Angular'
    },
    // ... 6개 언어 더
  }
};
```

여기서 핵심은 **번역 단위를 의미론적으로** 나눈 것이다. 단순히 문자열별로 번역하는 게 아니라 `personality`와 `description`을 분리했다. 이렇게 하면:

1. 번역자가 맥락을 이해하기 쉽다
2. 에이전트 특성별로 톤앤매너를 다르게 가져갈 수 있다
3. 새 에이전트 추가할 때 템플릿이 명확하다

### Claude에게 번역 시키는 프롬프트

전체 번역 작업도 Claude에게 맡겼다. 효과적인 프롬프트:

> "다음 에이전트 메타데이터를 8개 언어(한국어, 영어, 일본어, 중국어 간체, 스페인어, 프랑스어, 독일어, 러시아어)로 번역해줘.
> 
> 규칙:
> - `name`: 직책명은 해당 언어권의 일반적 표현 사용
> - `personality`: 문화적 뉘앙스 고려, 3-7단어로 제한
> - `description`: 기술 용어(React, API 등)는 번역하지 않음
> - 기존 스타일과 일관성 유지
> 
> 형식은 기존과 동일하게 TypeScript object literal로."

이렇게 하면 일관성 있는 번역이 나온다. 중요한 건 **도메인별 제약**을 명시하는 것이다. 기술 용어는 번역하지 않고, 직책명은 현지화하고, 성격 묘사는 문화적 맥락을 반영한다.

## 더 나은 방법은 없을까

현재 구현한 방식보다 개선할 수 있는 부분들이 있다:

### 1. MCP (Model Context Protocol) 서버 활용

Claude CLI를 spawn으로 호출하는 대신 MCP 서버를 구축하면 더 효율적이다. Anthropic의 공식 문서에 따르면:

- **지속적 연결**: 매번 프로세스를 띄우지 않아도 된다
- **컨텍스트 유지**: 이전 대화 기록을 메모리에 보관할 수 있다  
- **스트럭처드 도구**: function calling으로 JSON 파싱이 더 안정적이다

MCP 서버 예시:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server(
  { name: 'agent-orchestrator', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'decompose_task',
      description: 'Break down user request into structured tasks',
      inputSchema: {
        type: 'object',
        properties: { prompt: { type: 'string' } }
      }
    }
  ]
}));
```

### 2. 에이전트 간 의존성 해결 알고리즘

현재는 단순히 순차 실행하지만, DAG(Directed Acyclic Graph) 기반 스케줄링이 더 효율적이다:

```typescript
function resolveDependencies(tasks: Task[]): Task[][] {
  // 토폴로지 정렬로 실행 순서 결정
  // 의존성 없는 태스크들은 병렬 실행
}
```

### 3. 결과 품질 검증 에이전트

현재는 각 에이전트 결과를 그대로 합치는데, Orchestrator가 품질 검증도 해야 한다:

> "다음 에이전트 결과들을 검토해서 일관성 문제나 누락된 부분이 있는지 확인하고, 필요하면 수정 요청을 보내줘."

### 4. 비용 최적화 전략

Claude API 호출이 많아질 수 있으니 caching과 batching을 고려해야 한다:

- **프롬프트 캐싱**: 같은 작업 분해 요청은 24시간 캐시
- **배치 처리**: 여러 에이전트 요청을 하나로 합쳐서 보내기
- **모델 선택**: 단순한 작업은 Claude 3.5 Haiku 사용

## 정리

- **LLM을 메타 도구로 활용**: 단순 질답이 아니라 작업 분해와 오케스트레이션 자체를 LLM에게 맡긴다
- **제약 조건 기반 프롬프팅**: 자유도는 주되 출력 형식은 엄격하게 통제한다
- **실시간 피드백 필수**: SSE로 멀티 에이전트 진행 상황을 투명하게 보여준다
- **의미론적 다국어화**: 단순 번역이 아니라 맥락별로 현지화 전략을 다르게 가져간다

<details>
<summary>이번 작업의 커밋 로그</summary>

954f584 — feat: add Orchestrator agent — synthesizes all agent outputs into final result
0cfe68f — feat: LLM-based smart decomposer — Claude CLI analyzes prompts for task breakdown
6884bac — fix: remove --dangerously-skip-permissions — use plain print mode
f8dabac — fix: use OAuth auth for claude CLI (remove ANTHROPIC_API_KEY from env)
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