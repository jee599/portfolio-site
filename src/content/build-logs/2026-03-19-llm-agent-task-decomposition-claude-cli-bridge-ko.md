---
title: "LLM 에이전트 시스템에서 지능형 태스크 분해와 실행 — Claude CLI 브릿지 패턴"
project: "agentochester"
date: 2026-03-19
lang: ko
tags: [feat, fix, chore, typescript, css]
---

복잡한 작업을 여러 AI 에이전트에게 나누어 맡기는 시스템을 만들고 있다. 이번에 만든 핵심은 "smart decomposer" — 사용자가 던진 모호한 요청을 Claude가 분석해서 실행 가능한 태스크들로 쪼개는 기능이다.

## 배경: 무엇을 만들고 있는가

AgentCrow는 AI 에이전트 오케스트레이션 플랫폼이다. 하나의 큰 작업을 여러 전문 에이전트(QA Engineer, Frontend Developer, Content Writer 등)에게 나누어 실행하는 게 목표다.

지금까지 만든 것:
- 8개 언어 다국어 지원 대시보드
- YAML 기반 에이전트 정의 시스템  
- 에이전트 매칭 알고리즘
- Claude CLI와의 브릿지

이번 작업의 핵심은 **지능형 태스크 분해**다. "웹사이트를 만들어줘"라는 요청을 받으면 Claude가 이걸 "UI 설계 → 컴포넌트 개발 → 테스트 케이스 작성"으로 쪼개고, 각각에 맞는 에이전트를 자동 매칭하는 것이다.

## LLM을 태스크 분해기로 활용하는 프롬프트 패턴

기존 에이전트 시스템들은 보통 룰 기반이나 하드코딩된 워크플로우를 쓴다. 하지만 LLM의 추론 능력을 쓰면 훨씬 유연한 분해가 가능하다.

### 구조화된 분해 프롬프트

`smart-decomposer.ts`에서 쓰는 프롬프트를 보자:

```typescript
const DECOMPOSE_PROMPT = `
Analyze this request and break it down into specific, executable subtasks.
Each subtask should be focused enough for a specialist agent.

Focus on these domains: ${domains.join(', ')}

Request: "${request}"

Return ONLY a JSON array of subtasks. Each item should have:
- task: clear, actionable description
- domain: primary expertise needed
- priority: 1-5 (5 = critical path)
- dependencies: array of task indices this depends on

Example output:
[
  {"task": "Design responsive header component", "domain": "frontend", "priority": 5, "dependencies": []},
  {"task": "Write unit tests for header", "domain": "qa", "priority": 3, "dependencies": [0]}
]
`;
```

여기서 핵심은 **제약 조건을 명확히 주는 것**이다:

1. **도메인 제한**: 현재 시스템에 있는 에이전트 도메인만 사용하게 한다
2. **JSON 구조 강제**: 파싱 가능한 형태로 출력하게 한다
3. **의존성 관계**: 태스크 간 실행 순서를 지정하게 한다
4. **우선순위**: 병렬 실행 시 리소스 배분 기준을 준다

이렇게 쓰면 안 된다:

> "이 작업을 여러 개로 나눠줘"

이유: 
- 출력 형태가 불분명하다
- 도메인 제한이 없어서 존재하지 않는 에이전트를 요구할 수 있다
- 의존성을 고려하지 않는다

### 키워드 기반 필터링 추가

분해 정확도를 높이기 위해 키워드 기반 사전 필터링도 넣었다:

```typescript
const KEYWORDS_BY_DOMAIN = {
  'frontend': ['ui', 'component', 'react', 'interface', 'responsive', 'design'],
  'backend': ['api', 'server', 'database', 'authentication', 'endpoint'],
  'qa': ['test', 'validation', 'quality', 'bug', 'coverage'],
  'devops': ['deploy', 'ci/cd', 'docker', 'infrastructure', 'monitoring'],
  'content': ['copy', 'documentation', 'guide', 'content', 'writing']
};
```

요청에서 키워드를 추출한 후 관련 도메인들만 LLM에게 전달한다. 이렇게 하면:
- 불필요한 도메인 고려를 줄여서 응답 속도가 빨라진다
- 더 정확한 도메인 매칭이 가능하다
- 토큰 사용량도 줄어든다

## Claude CLI 브릿지로 실시간 스트리밍 실행

에이전트 실행은 Claude CLI를 쓴다. 핵심은 **Server-Sent Events(SSE)로 실시간 스트리밍**하는 것이다.

### 프로세스 스포닝과 스트리밍

```typescript
export async function executeWithClaude(prompt: string): Promise<ReadableStream> {
  return new ReadableStream({
    start(controller) {
      const process = spawn('claude', ['-p'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      process.stdin.write(prompt);
      process.stdin.end();

      process.stdout.on('data', (data) => {
        controller.enqueue(`data: ${JSON.stringify({
          type: 'output',
          content: data.toString()
        })}\n\n`);
      });

      process.on('close', (code) => {
        controller.enqueue(`data: ${JSON.stringify({
          type: 'complete',
          code
        })}\n\n`);
        controller.close();
      });
    }
  });
}
```

여기서 중요한 부분들:

**1. CLI 플래그 최적화**
- `-p` (print mode): 결과만 출력, 메타데이터 제거
- `--dangerously-skip-permissions` 같은 플래그는 제거했다. 불필요한 복잡성이다

**2. 스트리밍 청크 처리**
- `data` 이벤트로 실시간 출력을 받는다
- JSON으로 래핑해서 프론트엔드에서 타입 구분이 가능하게 한다
- SSE 형식(`data: ... \n\n`)을 지킨다

**3. 에러 처리**
- `stderr`도 캡처해서 에러 메시지를 전달한다
- 프로세스 종료 코드로 성공/실패를 판단한다

### OAuth vs API Key 인증

처음에는 `ANTHROPIC_API_KEY` 환경변수를 썼는데, OAuth로 바꿨다:

```typescript
// 이전 방식 (문제있음)
process.env.ANTHROPIC_API_KEY = apiKey;

// 현재 방식 (OAuth)
// claude CLI가 자체적으로 OAuth 토큰을 관리한다
```

이유:
- API 키를 서버에 저장할 필요 없다
- 토큰 갱신을 CLI가 알아서 처리한다
- 보안상 더 안전하다

## 에이전트 시스템의 구조화 전략

### 3단계 매칭 시스템

에이전트 매칭을 3단계로 나누었다:

1. **키워드 매칭**: 요청에서 도메인 키워드 추출
2. **태그 스코어링**: 에이전트 태그와 요청의 유사도 계산  
3. **LLM 검증**: Claude에게 최종 적합성 판단 요청

```typescript
async matchAgents(task: string, limit = 3): Promise<MatchResult[]> {
  // 1단계: 키워드 기반 필터링
  const domainCandidates = this.filterByKeywords(task);
  
  // 2단계: 태그 스코어링
  const scored = this.scoreByTags(domainCandidates, task);
  
  // 3단계: LLM 최종 검증
  return await this.llmValidation(scored.slice(0, limit * 2), task);
}
```

이런 다단계 접근이 필요한 이유:
- 키워드만으로는 애매한 케이스가 많다 ("성능 최적화"는 frontend인가 backend인가?)
- LLM 호출만 쓰면 느리고 비싸다
- 하이브리드 방식이 정확도와 속도를 둘 다 잡는다

### YAML 에이전트 정의의 구조화

각 에이전트를 YAML로 정의했다. QA Engineer 예시:

```yaml
identity:
  name: "QA Engineer"
  personality: "meticulous, systematic, quality-focused"
  description: "Ensures software quality through comprehensive testing strategies"

capabilities:
  primary_skills:
    - "test case design"
    - "automated testing"
    - "bug identification"
  domains: ["qa", "testing", "quality-assurance"]
  tools: ["jest", "cypress", "playwright", "vitest"]

rules:
  - "ALWAYS write test cases before suggesting fixes"
  - "NEVER skip edge case testing"
  - "Focus on user experience impact"

deliverables:
  - "Detailed test plans with specific scenarios"
  - "Automated test scripts ready to run"
  - "Bug reports with reproduction steps"
```

구조화의 핵심:
- **identity**: LLM이 역할을 이해할 수 있는 정보
- **capabilities**: 매칭 알고리즘이 사용할 스킬/도메인 데이터
- **rules**: 에이전트 프롬프트에 들어갈 제약 조건
- **deliverables**: 결과물 품질 기준

## 더 나은 방법은 없을까

현재 구현보다 개선할 수 있는 부분들:

### 1. MCP(Model Context Protocol) 서버 활용

Claude CLI 대신 MCP 서버로 직접 연결하면:
- 더 세밀한 제어 가능
- 커스텀 도구 연동 가능  
- 컨텍스트 관리가 더 정교해짐

```typescript
// MCP 연결 예시
const mcpClient = new MCPClient({
  serverUrl: 'claude-mcp://localhost:3001',
  tools: ['file_editor', 'terminal', 'web_search']
});
```

### 2. 에이전트 협업 패턴

현재는 순차 실행만 지원하는데, 에이전트 간 협업을 위해:
- **Shared Context**: 여러 에이전트가 공통 작업 컨텍스트 공유
- **Handoff Protocol**: 한 에이전트의 출력을 다른 에이전트가 이어받는 명확한 규칙
- **Conflict Resolution**: 에이전트 간 의견 충돌 시 중재 메커니즘

### 3. 동적 프롬프트 어셈블리

지금은 정적 YAML인데, 태스크에 따라 동적으로 프롬프트를 조합하면:

```typescript
const assemblePrompt = (agent: AgentDefinition, task: Task, context: Context) => {
  return [
    `You are ${agent.identity.name}: ${agent.identity.description}`,
    `Task: ${task.description}`,
    `Context: ${context.previousResults.join('\n')}`,
    `Rules: ${agent.rules.join(', ')}`,
    `Expected deliverable: ${agent.deliverables[0]}`
  ].join('\n\n');
};
```

### 4. 실행 결과 검증 시스템

현재는 에이전트가 뭘 출력하든 그대로 받는데, 품질 검증을 위해:
- **Output Validation**: 정해진 형식에 맞는지 검사
- **Cross-Agent Review**: 다른 에이전트가 결과를 리뷰
- **Success Metrics**: 태스크 완료도를 수치화

## 정리

- **구조화된 분해**: LLM에게 태스크 분해를 시킬 때 JSON 형태와 의존성을 강제하면 실행 가능한 결과가 나온다
- **하이브리드 매칭**: 키워드 → 스코어링 → LLM 검증의 3단계로 정확도와 속도를 둘 다 잡는다  
- **실시간 스트리밍**: Claude CLI 출력을 SSE로 스트리밍하면 사용자 경험이 크게 개선된다
- **YAML 기반 정의**: 에이전트 스펙을 구조화하면 매칭 정확도가 올라가고 프롬프트 어셈블리가 쉬워진다

<details>
<summary>이번 작업의 커밋 로그</summary>

0cfe68f — feat: LLM-based smart decomposer — Claude CLI analyzes prompts for task breakdown
6884bac — fix: remove --dangerously-skip-permissions — use plain print mode  
f8dabac — fix: use OAuth auth for claude CLI (remove ANTHROPIC_API_KEY from env)
39b44ea — fix: simplify agent detail to 2 lines — personality + description
85957ee — feat: agent detail panel — shows identity, rules, deliverables, metrics on click
6879fca — feat: rename to AgentCrow + clickable agent detail panel in library
c714f99 — docs: add README in 8 languages — quick start, architecture, examples
75487ae — feat: add executor — Claude CLI bridge + execute API + team execution UI
c9cd3af — feat: add compose system — prompt decomposition + auto agent matching
922ae01 — feat: add Next.js dashboard with agent library and matching panel
4521654 — feat: add AgentCatalog and AgentManager with 3-tier matching
49dd638 — feat: add 8 builtin custom YAML agents with validation tests

</details>