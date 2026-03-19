---
title: "AI 에이전트로 복잡한 프로젝트 만들기 — LLM 기반 작업 분해와 오케스트레이션"
project: "agentochester"
date: 2026-03-19
lang: ko
tags: [fix, feat, chore, typescript, css]
---

41개 커밋에 6,000줄 코드를 써서 AI 에이전트 시스템을 만들었다. 이 과정에서 LLM을 활용한 작업 분해와 에이전트 오케스트레이션 패턴을 실험했는데, 몇 가지 핵심적인 프롬프팅 기법과 구조화 전략을 발견했다.

## 배경: 무엇을 만들고 있는가

AgentCrow(이전 agentochester)는 복잡한 작업을 여러 AI 에이전트에게 분해해서 시키는 시스템이다. 사용자가 "결제 시스템 만들어줘"라고 하면, 이걸 백엔드 개발자, 프론트엔드 개발자, QA 엔지니어 에이전트에게 적절히 나눠서 할당한다.

핵심은 두 가지다:
1. **Smart Decomposer**: Claude CLI가 복잡한 프롬프트를 분석해서 작업 단위로 쪼갠다
2. **Orchestrator**: 각 에이전트의 결과를 종합해서 최종 결과를 만든다

이번 작업의 목표는 이 시스템이 실제로 작동하는지 검증하고, 멀티 에이전트 워크플로우에서 LLM을 효과적으로 활용하는 방법을 찾는 것이었다.

## LLM을 작업 분해기로 쓰는 프롬프팅 전략

가장 중요한 발견은 Claude를 "작업 분해기"로 쓸 때의 프롬프트 패턴이다.

일반적으로 "이걸 여러 작업으로 나눠줘"라고 하면 답답한 결과가 나온다:

> "결제 시스템을 만들어줘"
> → "1. 요구사항 분석 2. 설계 3. 개발 4. 테스트"

이런 추상적인 분해는 쓸모없다. 실제로는 구체적인 **deliverable**과 **constraint**가 있어야 한다.

효과적인 프롬프트 패턴:

> "다음 요청을 분석해서, 각 전문 에이전트가 독립적으로 실행 가능한 작업으로 분해해줘:
> 
> [원본 요청]
> 
> 각 작업은:
> - 명확한 input/output이 있어야 함
> - 30분 내에 완료 가능해야 함  
> - 다른 작업과 병렬 실행 가능해야 함
> - 구체적인 파일명이나 API endpoint를 포함해야 함
> 
> 사용 가능한 에이전트: Backend Developer, Frontend Developer, QA Engineer, Technical Writer
> 
> JSON 형태로 반환: {tasks: [{agent, description, deliverables, dependencies}]}"

핵심은 세 가지다:
1. **제약 조건을 명시한다**: 30분 내, 병렬 실행 가능
2. **구체적인 deliverable을 요구한다**: "설계"가 아니라 "API 스펙 문서"
3. **구조화된 출력을 강제한다**: JSON으로 받아서 바로 파싱

이렇게 하면 "결제 API 엔드포인트 `/api/payment` 구현" 같은 실행 가능한 작업으로 나온다.

## Claude CLI를 에이전트 실행 엔진으로 활용하기

두 번째 핵심은 Claude CLI를 각 에이전트의 "실행 엔진"으로 쓰는 것이다.

일반적으로 AI 에이전트를 만들 때 API를 직접 호출하는데, 이 방식은 context 관리와 tool 사용이 복잡하다. 대신 Claude CLI를 subprocess로 실행하면 훨씬 간단하다:

```typescript
const executeAgent = async (task: Task, agent: AgentDefinition) => {
  const prompt = assemblePrompt(task, agent);
  
  const process = spawn('claude', [
    'chat',
    '-p',  // print mode
    '--no-stream'
  ], {
    input: prompt,
    env: { ...process.env }
  });
  
  // SSE로 실시간 스트리밍
  for await (const chunk of process.stdout) {
    sendSSE(response, { type: 'progress', data: chunk });
  }
};
```

Claude CLI의 장점:
- **Built-in tool access**: `Write`, `Edit`, `Read`, `Bash`, `Glob`, `Grep` 자동 지원
- **Context persistence**: 세션 단위로 대화 히스토리 유지
- **OAuth 인증**: `ANTHROPIC_API_KEY` 없이도 작동
- **Error handling**: 토큰 제한, 레이트 리밋 자동 처리

특히 도구 사용이 중요하다. 에이전트가 파일을 읽고 쓸 수 있어야 실제 개발 작업이 가능하다.

에이전트에게 주는 instruction에서 핵심은 **결정권을 주는 것**이다:

> "질문하지 마라. 판단해서 바로 실행해라. 파일이 없으면 만들고, 디렉토리가 없으면 생성해라. 가정이 필요하면 reasonable한 가정을 해라."

이게 없으면 에이전트가 계속 "어떤 프레임워크를 쓸까요?" 같은 질문을 한다. 자율성을 주는 게 핵심이다.

## 멀티 에이전트 결과 통합 — Orchestrator 패턴

세 개 에이전트가 각각 다른 결과를 내놓으면, 이걸 어떻게 통합할 것인가가 문제다.

처음엔 rule-based로 하려고 했다: "Backend 결과 + Frontend 결과 + QA 결과". 하지만 실제로는 결과물의 형태가 너무 다양하다. 어떤 건 코드, 어떤 건 문서, 어떤 건 테스트 스크립트다.

더 나은 방법은 **Orchestrator 에이전트**를 따로 두는 것이다:

```typescript
const orchestratorPrompt = `
다음은 여러 에이전트가 수행한 작업 결과다:

${agentResults.map(r => `
## ${r.agent} 결과:
${r.output}
---
`).join('\n')}

이 결과들을 종합해서 사용자에게 제공할 최종 응답을 만들어라:
1. 각 결과의 핵심 내용을 요약
2. 누락된 부분이 있다면 지적  
3. 다음 단계 제안
4. 실행 가능한 명령어나 파일 구조 제시

원본 요청: ${originalTask}
`;
```

Orchestrator의 역할:
- **Integration**: 분산된 결과를 하나의 coherent한 답변으로
- **Quality assurance**: 누락된 부분이나 충돌하는 부분 발견
- **Next steps**: 사용자가 실제로 실행할 수 있는 액션 아이템

이렇게 하면 사용자는 각 에이전트의 raw output을 보지 않고, 정제된 최종 결과만 본다.

## 에이전트 매칭과 팀 구성 자동화

네 번째 핵심은 어떤 작업에 어떤 에이전트를 할당할 것인가다.

처음엔 keyword matching을 했다: "API"가 들어가면 Backend Developer. 하지만 "API 문서 작성"은 Technical Writer가 해야 한다.

더 정교한 매칭 시스템:

```typescript
const matchAgents = (task: string, availableAgents: AgentDefinition[]): Agent[] => {
  // 1. LLM-based semantic matching
  const semanticScores = await Promise.all(
    availableAgents.map(agent => calculateSemanticMatch(task, agent))
  );
  
  // 2. Keyword-based boost
  const keywordBoosts = availableAgents.map(agent => 
    calculateKeywordMatch(task, agent.keywords)
  );
  
  // 3. Domain-specific rules
  const domainScores = availableAgents.map(agent =>
    calculateDomainMatch(task, agent.domain)
  );
  
  // 가중평균으로 최종 점수
  const finalScores = semanticScores.map((score, idx) => 
    score * 0.6 + keywordBoosts[idx] * 0.2 + domainScores[idx] * 0.2
  );
  
  return selectTopAgents(finalScores, maxAgents);
};
```

여기서 `calculateSemanticMatch`가 핵심이다. 이건 또 다른 LLM 호출이다:

> "다음 작업에 대해 이 에이전트의 적합성을 0-100으로 평가해라:
> 
> 작업: ${task}
> 에이전트: ${agent.name} - ${agent.description}
> 
> 평가 기준:
> - 전문 영역 일치도
> - 필요한 스킬 보유도  
> - 산출물 적합성
> 
> 점수만 반환해라 (숫자만)."

이 방식의 장점은 context-aware matching이다. "React 컴포넌트 만들기"와 "Vue 컴포넌트 만들기"를 다르게 처리할 수 있다.

## 더 나은 방법은 없을까

현재 구현에서 개선할 수 있는 부분들:

**1. MCP(Model Context Protocol) 서버 활용**

Claude CLI 대신 MCP 서버를 쓰면 더 정교한 도구 제공이 가능하다. 예를 들어:
- GitHub MCP 서버: PR 생성, issue 관리 자동화
- Filesystem MCP 서버: 프로젝트 구조 파악, 코드 의존성 분석
- Database MCP 서버: 스키마 수정, 마이그레이션 스크립트 생성

```typescript
// MCP 서버와의 연동
const mcpServers = [
  { name: 'github', tools: ['create-pr', 'list-issues', 'add-comment'] },
  { name: 'filesystem', tools: ['analyze-structure', 'find-dependencies'] },
  { name: 'database', tools: ['generate-migration', 'check-schema'] }
];

const executeWithMCP = async (task: Task) => {
  const requiredTools = analyzeRequiredTools(task);
  const availableServers = mcpServers.filter(s => 
    s.tools.some(tool => requiredTools.includes(tool))
  );
  
  // MCP 서버별로 context 구성
  const mcpContext = buildMCPContext(availableServers);
  const result = await claudeWithMCP(task, mcpContext);
  
  return result;
};
```

**2. Streaming과 Partial Results**

현재는 각 에이전트가 완료될 때까지 기다리지만, 중간 결과를 활용할 수 있다:

```typescript
const executeTeamWithStreaming = async (tasks: Task[]) => {
  const streams = tasks.map(task => executeAgentStream(task));
  
  for await (const partialResult of mergeStreams(streams)) {
    // 부분 결과로 다른 에이전트에게 context 제공
    updateSharedContext(partialResult);
    
    // 사용자에게 실시간 진행상황 전송
    sendSSE({ type: 'partial', data: partialResult });
  }
};
```

**3. Dynamic Agent Composition**

작업 복잡도에 따라 에이전트 팀을 동적으로 구성하는 방법:

```typescript
const composeDynamicTeam = async (task: string) => {
  // 1. 복잡도 분석
  const complexity = await analyzeComplexity(task);
  
  // 2. 필요한 역할 추출
  const requiredRoles = await extractRequiredRoles(task, complexity);
  
  // 3. 가용 에이전트에서 최적 조합 찾기
  const optimalTeam = await findOptimalTeamComposition(requiredRoles);
  
  return optimalTeam;
};
```

**4. Agent Learning과 Feedback Loop**

에이전트 성능을 지속적으로 개선하는 피드백 시스템:

```typescript
const collectPerformanceFeedback = async (execution: ExecutionResult) => {
  const feedback = {
    taskComplexity: execution.task.complexity,
    executionTime: execution.duration,
    outputQuality: await evaluateQuality(execution.output),
    userSatisfaction: execution.userRating
  };
  
  // 에이전트별 성능 히스토리 업데이트
  updateAgentPerformance(execution.agent.id, feedback);
  
  // 매칭 알고리즘 가중치 조정
  adjustMatchingWeights(feedback);
};
```

## 정리

이번 작업에서 발견한 핵심 패턴들:

- LLM을 작업 분해기로 쓸 때는 구체적인 제약조건과 구조화된 출력 형식을 강제해야 한다
- Claude CLI를 subprocess로 실행하면 복잡한 API 통합 없이도 강력한 에이전트를 만들 수 있다
- 멀티 에이전트 결과는 별도의 Orchestrator 에이전트로 통합하는 게 효과적이다
- 에이전트 매칭은 semantic, keyword, domain 점수의 가중평균으로 정확도를 높일 수 있다

<details>
<summary>이번 작업의 커밋 로그</summary>

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