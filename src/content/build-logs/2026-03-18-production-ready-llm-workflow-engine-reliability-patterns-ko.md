---
title: "프로덕션 레디한 LLM 워크플로우 엔진 만들기 — AI 에이전트 아키텍처의 핵심은 신뢰성이다"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

지난 며칠간 LLMMixer v0.3을 구현하면서 깨달은 게 있다. AI 에이전트 도구를 만들 때 가장 어려운 건 LLM과 대화하는 게 아니라, **사용자가 믿고 쓸 수 있게 만드는 것**이다. 이 글에서는 프로덕션 환경에서 안정적으로 돌아가는 LLM 워크플로우 엔진을 만들면서 배운 아키텍처 패턴과 신뢰성 확보 전략을 다룬다.

## 배경: LLMMixer는 무엇인가

LLMMixer는 복잡한 개발 작업을 여러 AI 모델에게 분산 처리시키는 도구다. 사용자가 "이 기능 구현해줘"라고 하면, 작업을 쪼개서 Claude, GPT-4, Gemini에게 각각 맡기고, 결과물을 합쳐서 완성된 코드를 내놓는다.

v0.2까지는 proof of concept 수준이었다. 데모는 잘 돌아가지만 실제 프로젝트에 쓰면 중간에 멈추거나 이상한 결과가 나왔다. v0.3의 목표는 **프로덕션에서 믿고 쓸 수 있는 수준**으로 만드는 것이다.

## 에이전트 간 통신: 메시지 중복 제거와 상태 동기화

AI 에이전트 여러 개가 동시에 작업할 때 가장 큰 문제는 **통신 혼선**이다. 같은 메시지가 여러 번 전달되거나, 한 에이전트의 작업 결과를 다른 에이전트가 못 받는 경우가 생긴다.

### SSE dedup 패턴

Server-Sent Events로 실시간 상태를 전달할 때는 반드시 중복 제거 로직이 있어야 한다:

```typescript
// packages/dashboard/src/app/api/sse/route.ts
const eventId = `${sessionId}-${timestamp}-${hash(data)}`;
if (sentEvents.has(eventId)) return;
sentEvents.add(eventId);

encoder.encode(`id: ${eventId}\ndata: ${JSON.stringify(data)}\n\n`);
```

핵심은 **세션ID + 타임스탬프 + 데이터 해시**로 유니크한 이벤트 ID를 만드는 것이다. 단순히 타임스탬프만 쓰면 같은 밀리초에 발생한 이벤트끼리 충돌한다.

### Singleton 세션 관리

여러 에이전트가 같은 세션을 공유할 때는 싱글톤 패턴으로 상태 일관성을 보장한다:

```typescript
// packages/core/src/session-manager.ts
class SessionManager {
  private static instance: SessionManager;
  private sessions = new Map<string, WorkflowSession>();
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
  
  getOrCreateSession(id: string): WorkflowSession {
    if (!this.sessions.has(id)) {
      this.sessions.set(id, new WorkflowSession(id));
    }
    return this.sessions.get(id)!;
  }
}
```

이렇게 하면 메모리에 세션 상태가 하나만 존재하게 된다. 여러 API 엔드포인트에서 같은 세션에 접근해도 데이터 불일치가 없다.

### 프롬프팅: 에이전트에게 협업 규칙 가르치기

여러 AI가 함께 작업할 때는 **명확한 협업 규칙**을 프롬프트에 넣어야 한다:

> "너는 Claude 에이전트다. 작업 완료 후 반드시 `status: completed, output: {...}` 형식으로 응답해. 다른 에이전트의 작업이 필요하면 `requires: ['gemini-review', 'codex-test']` 배열을 포함해. 절대 다른 에이전트의 역할을 대신하지 마."

이런 구조화된 출력 규칙이 없으면 에이전트끼리 서로 일을 중복해서 하거나, 필요한 작업을 누락한다.

## Interactive CLI: 사용자 신뢰를 얻는 UX 패턴

AI 도구에서 가장 중요한 건 **사용자가 뭐가 일어나고 있는지 알 수 있게** 하는 것이다. 블랙박스처럼 작동하면 아무도 안 쓴다.

### node-pty를 활용한 터미널 시뮬레이션

실제 CLI 명령어를 실행할 때는 `node-pty`로 가상 터미널을 만든다:

```typescript
// packages/dashboard/src/app/api/auth-terminal/route.ts
const ptyProcess = spawn('/bin/bash', [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: workingDir,
  env: process.env,
});

ptyProcess.onData((data) => {
  // 실시간으로 터미널 출력을 브라우저에 스트리밍
  sendSSEEvent({ type: 'terminal-output', data });
});
```

사용자는 브라우저에서 실제 터미널과 똑같은 경험을 한다. `git commit`, `npm install` 같은 명령어가 실행될 때마다 실시간으로 진행 상황을 볼 수 있다.

### Trust 모드와 Auto-respond

사용자에게 **제어권 선택지**를 준다:

```typescript
interface WorkflowConfig {
  trustMode: boolean;      // true면 확인 없이 바로 실행
  autoRespond: boolean;    // 대화형 프롬프트에 자동 응답
  requireApproval: string[]; // 승인이 필요한 작업 타입들
}
```

처음 쓸 때는 모든 단계마다 승인을 받는다. 사용자가 도구를 신뢰하게 되면 `trustMode: true`로 설정해서 자동으로 실행하게 할 수 있다.

### Lazy Loading으로 성능 최적화

`node-pty`처럼 무거운 네이티브 모듈은 실제 사용할 때만 로드한다:

```typescript
let pty: typeof import('node-pty') | null = null;

async function getTerminal() {
  if (!pty) {
    pty = await import('node-pty');
  }
  return pty;
}
```

앱 시작 시간이 훨씬 빨라진다. 터미널 기능을 안 쓰는 사용자는 불필요한 모듈 로딩 시간을 기다리지 않는다.

## Adapter 패턴: 멀티 LLM 통합의 핵심

Claude, GPT-4, Gemini는 API 스펙이 다르다. 각각 다른 방식으로 요청하고 응답을 파싱해야 한다. 여기서 Adapter 패턴이 빛을 발한다.

### Base Adapter의 공통 인터페이스

모든 LLM 어댑터가 구현해야 하는 기본 인터페이스를 정의한다:

```typescript
// packages/core/src/adapters/base.ts
abstract class BaseLLMAdapter {
  abstract chat(messages: Message[]): Promise<string>;
  abstract streamChat(messages: Message[]): AsyncGenerator<string>;
  
  // 공통 기능들
  protected validateConfig(config: LLMConfig): boolean { ... }
  protected retryOnFailure<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> { ... }
  protected formatSystemPrompt(prompt: string): Message { ... }
}
```

각 어댑터는 이 기본 클래스를 상속받아서 자기만의 API 로직을 구현한다.

### Non-interactive 모드 지원

배치 작업이나 CI/CD에서 쓸 때는 사용자 입력을 받을 수 없다. 각 어댑터마다 non-interactive 모드를 지원해야 한다:

```typescript
// packages/core/src/adapters/claude.ts
class ClaudeAdapter extends BaseLLMAdapter {
  async chat(messages: Message[], options: ChatOptions = {}): Promise<string> {
    if (options.nonInteractive) {
      // 확인 프롬프트 없이 바로 실행
      return this.directChat(messages);
    }
    
    // interactive 모드에서는 중간 중간 사용자 확인
    return this.interactiveChat(messages);
  }
}
```

### 프롬프팅: 각 모델의 특성에 맞춘 전략

모델마다 잘하는 게 다르다. 프롬프트도 달라져야 한다:

**Claude용 프롬프트:**
> "코드 리팩토링을 해줘. 기존 로직은 유지하되 가독성과 성능을 개선해. 변경 사항은 주석으로 설명해. 테스트 케이스도 함께 작성해."

**Codex용 프롬프트:**
> "다음 함수를 최적화해. 알고리즘 복잡도를 개선하고 엣지 케이스를 처리해. 코드만 출력해."

**Gemini용 프롬프트:**
> "이 코드의 잠재적 버그를 찾아줘. 보안 취약점, 성능 이슈, 예외 처리 누락을 중심으로 분석해. 개선 방안도 제시해."

같은 작업이라도 모델 특성에 맞게 프롬프트를 조정하면 훨씬 좋은 결과가 나온다.

## 더 나은 방법은 없을까

이번에 구현한 방식보다 더 효율적인 대안들을 살펴보자.

### Anthropic의 Computer Use API 활용

Anthropic에서 최근 발표한 Computer Use API를 쓰면 터미널 시뮬레이션 없이도 Claude가 직접 시스템을 조작할 수 있다:

```python
# Anthropic Computer Use API 예시
response = anthropic.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=[{"type": "computer_20241022", "name": "computer"}],
    messages=[{
        "role": "user", 
        "content": "git에서 브랜치를 만들고 코드를 커밋해줘"
    }]
)
```

이 방식이 더 간단하지만 아직 베타 단계라 프로덕션에서는 위험하다. 안정화되면 `node-pty` 기반 구현을 대체할 수 있을 것이다.

### Langchain/LlamaIndex의 Agent Framework

직접 구현하는 대신 기존 프레임워크를 쓰는 것도 고려할 만하다:

- **LangChain Agent**: 더 많은 도구와 통합, 활발한 커뮤니티
- **LlamaIndex Workflow**: 복잡한 워크플로우 관리에 특화
- **AutoGPT/CrewAI**: 멀티 에이전트 협업에 최적화

하지만 이런 프레임워크들은 **무겁다**. 간단한 작업에도 많은 설정이 필요하고, 커스터마이징이 어렵다. 특별한 요구사항이 있으면 직접 구현하는 게 나을 수 있다.

### MCP (Model Context Protocol) 서버 연동

Anthropic이 제안한 MCP를 쓰면 외부 도구와의 연동이 더 표준화된다:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    },
    "git": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/path/to/repo"]
    }
  }
}
```

현재 구현한 어댑터 패턴보다 더 모듈화되고 재사용 가능하다. MCP 서버가 더 많아지면 이쪽으로 마이그레이션하는 게 좋을 것 같다.

### 성능 최적화: 스트리밍과 병렬 처리

현재는 에이전트들이 순차적으로 작업한다. 병렬 처리로 속도를 높일 수 있다:

```typescript
// 현재 방식 (순차)
const step1Result = await claudeAdapter.chat(messages);
const step2Result = await geminiAdapter.chat([...messages, step1Result]);
const finalResult = await codexAdapter.chat([...messages, step1Result, step2Result]);

// 개선안 (병렬)
const [reviewResult, testResult] = await Promise.all([
  geminiAdapter.chat(messages), // 코드 리뷰
  codexAdapter.chat(messages),  // 테스트 생성
]);
const finalResult = await claudeAdapter.chat([...messages, reviewResult, testResult]);
```

서로 독립적인 작업은 병렬로 처리해서 전체 시간을 줄인다.

## 정리

- **에이전트 간 통신은 메시지 중복 제거와 싱글톤 세션 관리가 핵심**이다
- **사용자 신뢰를 얻으려면 실시간 피드백과 제어권 선택지를 제공**해야 한다
- **Adapter 패턴으로 여러 LLM을 통합하되, 각 모델 특성에 맞춘 프롬프팅 전략**을 써라
- **프로덕션 환경에서는 lazy loading, non-interactive 모드, 에러 복구 같은 신뢰성 패턴**이 필수다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>