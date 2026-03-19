---
title: "AI 에이전트 시스템을 밑바닥부터 만드는 법 — 프롬프트 분해와 역할 매칭의 기술"
project: "agentochester"
date: 2026-03-19
lang: ko
tags: [fix, feat, chore, typescript, css]
---

AgentClaw라는 AI 에이전트 오케스트레이션 시스템을 처음부터 만들었다. 복잡한 프롬프트를 자동으로 분해해서 적합한 에이전트들에게 배정하고, 실시간으로 실행 결과를 스트리밍하는 시스템이다. 이 글에서는 AI로 AI를 관리하는 시스템을 구축할 때 핵심이 되는 프롬프팅 전략과 아키텍처 패턴을 다룬다.

## 배경: 무엇을 만들고 있는가

AgentClaw는 하나의 복잡한 작업을 여러 전문 에이전트가 나눠서 처리하는 오케스트레이션 플랫폼이다. 사용자가 "새로운 결제 시스템을 설계하고 구현해줘"라고 입력하면, 시스템이 자동으로 이 작업을 분해해서 Product Manager, Backend Developer, QA Engineer 등 적합한 에이전트들에게 배정한다.

핵심 구성 요소는 세 가지다:
- **Decomposer**: Claude CLI로 프롬프트를 분석해서 하위 태스크로 분해
- **Matcher**: 각 태스크에 가장 적합한 에이전트를 3단계 점수 시스템으로 매칭
- **Orchestrator**: 모든 에이전트 결과를 종합해서 최종 산출물 생성

프로젝트는 42개 커밋에 걸쳐 진화했고, 8개 언어 i18n 지원과 실시간 SSE 스트리밍까지 구현했다.

## 프롬프트 분해: LLM으로 LLM을 관리하는 메타 프롬프팅

가장 핵심적인 부분은 복잡한 사용자 요청을 적절한 크기의 하위 태스크로 분해하는 것이다. 이걸 사람이 하드코딩으로 처리하면 한계가 있다. 대신 Claude 자체에게 이 분석을 맡겼다.

### 효과적인 분해 프롬프트 패턴

```javascript
// src/core/compose.ts의 decomposer 구현
const decomposePrompt = `
Analyze this user prompt and break it down into concrete, actionable tasks.
Each task should:
1. Be specific enough for a single specialist to handle
2. Include clear deliverables
3. Have measurable success criteria

User prompt: "${prompt}"

Return JSON array of tasks with: title, description, domain, complexity, deliverables
`;
```

이 프롬프트의 핵심은 **구체성과 측정가능성**이다. "설계해줘"가 아니라 "API 스펙 문서 작성", "데이터베이스 스키마 정의", "보안 검토 체크리스트 작성" 같은 구체적 단위로 분해하도록 지시한다.

좋지 않은 분해 프롬프트는 이런 식이다:
> "이 요청을 여러 작업으로 나눠줘"

이렇게 하면 AI가 추상적이고 모호한 태스크를 만든다. 대신 다음과 같은 제약 조건을 명시한다:

> "각 작업은 2시간 내에 완료 가능해야 하고, 결과물이 파일이나 문서 형태로 나와야 한다. 도메인별로 분류하고, 의존성 관계를 명시해라."

### 도메인 추론과 키워드 매칭

프롬프트에서 도메인을 자동으로 추론하는 부분도 중요하다. 단순히 키워드 매칭만 하면 한계가 있어서, LLM의 맥락 이해 능력을 활용한다.

```typescript
// 키워드 기반 1차 필터링
const domainKeywords = {
  'backend': ['API', 'database', 'server', 'authentication'],
  'frontend': ['UI', 'component', 'user interface', 'responsive'],
  'devops': ['deployment', 'CI/CD', 'infrastructure', 'monitoring']
};

// LLM 기반 2차 도메인 추론
const domainAnalysisPrompt = `
Given this task: "${task.description}"
What technical domain does this belong to? Consider context and implicit requirements.
Return one of: backend, frontend, devops, design, qa, product, research
`;
```

키워드 매칭으로 명확한 경우는 빠르게 처리하고, 애매한 경우만 LLM에게 다시 물어본다. 비용과 성능의 트레이드오프다.

### 에이전트 매칭의 3단계 점수 시스템

각 태스크에 적합한 에이전트를 찾는 매칭 알고리즘은 3단계로 구성된다:

1. **Domain Score** (40%): 에이전트의 전문 영역과 태스크 도메인 일치도
2. **Skill Score** (40%): 에이전트가 가진 스킬셋과 태스크 요구사항 매칭
3. **Tag Score** (20%): 태그 기반 추가 점수

```typescript
// src/core/catalog.ts의 매칭 로직
class AgentManager {
  matchAgents(task: Task): AgentMatch[] {
    return this.agents.map(agent => {
      const domainScore = this.calculateDomainScore(agent, task);
      const skillScore = this.calculateSkillScore(agent, task);  
      const tagScore = this.calculateTagScore(agent, task);
      
      const totalScore = domainScore * 0.4 + skillScore * 0.4 + tagScore * 0.2;
      
      return { agent, score: totalScore, reasoning: this.getMatchReasoning(agent, task) };
    });
  }
}
```

점수 가중치는 실험을 통해 정한 것이다. 처음에는 스킬을 60%로 했는데, 도메인 미스매치가 자주 발생해서 도메인과 스킬을 동등하게 40%씩 배정했다.

## Claude CLI 통합: 안정적인 LLM 브릿지 구축

에이전트 실행은 Claude CLI를 통해 처리한다. 웹 인터페이스에서 Claude API를 직접 호출하는 대신 CLI를 경유하는 이유가 있다.

### stdin을 통한 프롬프트 전달

초기에는 positional argument로 프롬프트를 전달했는데 문제가 있었다:

```bash
# 이렇게 하면 안 된다
claude --allowedTools Write,Edit "긴 프롬프트 내용..."
```

`--allowedTools` 옵션이 positional argument를 먹어버려서 프롬프트가 잘렸다. stdin으로 전달하도록 수정했다:

```typescript
// src/core/bridge.ts의 수정된 구현
async function executeClaude(prompt: string, tools: string[]) {
  const process = spawn('claude', [
    '--allowedTools', tools.join(','),
    '-p'  // plain print mode
  ]);
  
  // stdin으로 프롬프트 전달
  process.stdin.write(prompt);
  process.stdin.end();
  
  return new Promise((resolve) => {
    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    process.on('close', () => resolve(output));
  });
}
```

### OAuth 인증 vs API 키

Claude CLI는 OAuth와 API 키 두 가지 인증 방식을 지원한다. 개발 환경에서는 OAuth가 더 편하다. `ANTHROPIC_API_KEY` 환경변수를 관리할 필요가 없고, 브라우저에서 한 번 로그인하면 CLI가 토큰을 자동으로 관리한다.

### 도구 권한 관리

에이전트가 사용할 수 있는 도구를 제한하는 것이 중요하다. 전체 권한을 주면 예상치 못한 부작용이 발생한다:

```typescript
// 에이전트 타입별 허용 도구 정의
const agentTools = {
  'backend-developer': ['Write', 'Edit', 'Read', 'Bash'],
  'qa-engineer': ['Read', 'Bash', 'Grep'],
  'product-manager': ['Write', 'Read', 'Glob'],
  'designer': ['Write', 'Read']
};
```

QA Engineer에게는 파일 수정 권한을 주지 않고 읽기와 테스트만 허용한다. Product Manager는 bash 실행 없이 문서 작업만 할 수 있다.

## 실시간 스트리밍과 UX 최적화

에이전트 실행 결과를 실시간으로 사용자에게 보여주기 위해 Server-Sent Events를 구현했다.

### SSE를 통한 진행 상황 스트리밍

```typescript
// dashboard/app/api/execute/route.ts
export async function POST(request: Request) {
  const { prompt } = await request.json();
  
  const stream = new ReadableStream({
    start(controller) {
      executeAgentTeam(prompt, {
        onTaskStart: (task) => {
          controller.enqueue(`data: ${JSON.stringify({
            type: 'task_start',
            task: task.title
          })}\n\n`);
        },
        onTaskComplete: (task, result) => {
          controller.enqueue(`data: ${JSON.stringify({
            type: 'task_complete',
            task: task.title,
            result
          })}\n\n`);
        },
        onAllComplete: (finalResult) => {
          controller.enqueue(`data: ${JSON.stringify({
            type: 'complete',
            result: finalResult
          })}\n\n`);
          controller.close();
        }
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

### 에이전트 상호작용 제거

초기에는 에이전트가 사용자에게 질문을 하도록 했는데, 멀티 에이전트 환경에서는 혼란만 가중시켰다. 명확한 지시를 추가했다:

```typescript
const agentInstructions = `
You are ${agent.identity}. 
${agent.rules}

IMPORTANT: Do not ask questions. Make reasonable assumptions and proceed with execution.
If information is missing, use industry best practices as default.
`;
```

"합리적인 가정을 하고 진행하라"는 지시가 핵심이다. 완벽한 정보가 없어도 업계 모범 사례를 적용해서 결과를 만들어내도록 한다.

### 하이드레이션 경고 해결

Next.js에서 브라우저 확장 프로그램이나 서드파티 스크립트가 DOM을 수정해서 하이드레이션 미스매치가 발생했다. 이모지 아이콘을 텍스트로 바꾸고 `suppressHydrationWarning`을 적용해서 해결했다:

```jsx
// dashboard/components/AgentCard.tsx
<div className="agent-status" suppressHydrationWarning>
  {agent.status === 'active' ? 'ACTIVE' : 'IDLE'}
</div>
```

## 더 나은 방법은 없을까

현재 구현에서 개선할 수 있는 부분들이 있다.

### LangChain/LangGraph 도입 검토

지금은 자체 구현한 오케스트레이션 로직을 사용하는데, LangGraph를 쓰면 더 정교한 에이전트 워크플로우를 구성할 수 있다. 특히 conditional edges와 human-in-the-loop 패턴이 유용하다.

```python
# LangGraph를 사용한다면 이런 식으로 구성 가능
from langgraph.graph import Graph

workflow = Graph()
workflow.add_node("decomposer", decompose_task)
workflow.add_node("matcher", match_agents) 
workflow.add_node("executor", execute_agents)
workflow.add_node("orchestrator", synthesize_results)

workflow.add_conditional_edges(
    "matcher",
    should_human_review,
    {
        "review": "human_reviewer",
        "proceed": "executor"
    }
)
```

### MCP(Model Context Protocol) 서버 활용

Claude CLI 대신 MCP 서버를 직접 구현하면 더 세밀한 제어가 가능하다. 특히 에이전트 간 context sharing과 memory management 측면에서 유리하다.

### 에이전트 성능 메트릭과 피드백 루프

현재는 태스크 완료 여부만 추적하는데, 품질 점수와 실행 시간을 측정해서 매칭 알고리즘을 개선할 수 있다. 성공률이 낮은 에이전트-태스크 조합을 식별해서 가중치를 조정하는 식이다.

### 벡터 기반 시맨틱 매칭

현재는 키워드와 도메인 기반 매칭을 하는데, 임베딩을 활용한 시맨틱 유사도 계산을 추가하면 더 정확한 매칭이 가능하다. OpenAI의 `text-embedding-3-small`이나 Anthropic의 임베딩 모델을 활용할 수 있다.

## 정리

AI 에이전트 오케스트레이션 시스템을 구축할 때 핵심은 네 가지다:

- **메타 프롬프팅**: LLM에게 LLM용 태스크를 분해하게 할 때는 구체적 제약 조건과 성공 기준을 명시한다
- **점진적 매칭**: 키워드 필터링 → 도메인 분석 → 스킬 점수 → 태그 매칭 순으로 단계적으로 후보를 좁혀간다  
- **도구 권한 제한**: 에이전트별로 필요한 최소한의 도구만 허용해서 부작용을 방지한다
- **질문 금지**: 멀티 에이전트 환경에서는 상호작용보다 자율적 실행이 효과적이다

<details>
<summary>이번 작업의 커밋 로그</summary>

ac95045 — fix: pass prompt via stdin to claude CLI (--allowedTools eats positional arg)
98f10f5 — fix: instruct agents to not ask questions — decide and execute directly  
4c2e4b8 — feat: enable tools for agent execution (Write, Edit, Read, Bash, Glob, Grep)
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