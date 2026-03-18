---
title: "AI 에이전트 안정성 확보하기 — production 배포 전 반드시 처리해야 할 5가지"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer라는 AI workflow orchestration 도구를 production 레벨로 끌어올리는 작업을 했다. 총 5개 커밋으로 63개 파일을 수정하며 7000여 줄을 추가했는데, 대부분이 안정성 확보를 위한 작업이었다. 이 과정에서 AI 에이전트를 실제 서비스에 배포할 때 놓치기 쉬운 함정들과 그 해결 방법을 정리한다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 Claude, GPT, Gemini 같은 여러 LLM을 workflow 형태로 orchestrate하는 도구다. 사용자가 복잡한 작업을 요청하면 이를 여러 단계로 분해해서 각각 다른 모델에게 시키고, 결과를 취합해서 최종 결과물을 만든다. 

v0.3에서는 interactive CLI 지원, 다중 세션 관리, real-time SSE 스트리밍을 추가했다. 문제는 개발 환경에서는 잘 돌아가던 것들이 production에서는 race condition, memory leak, session corruption 같은 문제를 일으킨다는 것이었다.

## interactive CLI 구현 — node-pty lazy loading 전략

AI 에이전트가 CLI 명령을 실행해야 하는 경우가 많다. `git commit`, `npm install`, `docker build` 같은 작업들 말이다. 기존엔 `child_process.spawn`을 썼는데 interactive 명령어들이 제대로 동작하지 않았다.

### 프롬프팅 전략

이 문제를 AI에게 상담할 때 핵심은 "제약 조건을 명확히 하는 것"이었다.

> "Node.js에서 interactive CLI 명령어를 실행해야 한다. 요구사항:
> 1. Docker container 환경에서 실행 (Alpine Linux)  
> 2. Production build에서 native dependency 설치 불가
> 3. TTY가 없는 환경에서도 fallback 필요
> 4. Memory leak 방지 필수
> 5. 기존 `child_process.spawn` 코드와 호환성 유지
> 
> `node-pty` vs `spawn` 비교하고, conditional loading 패턴 제안해줘."

이렇게 쓰면 안 된다:
> "interactive CLI가 안 돼. 뭔가 방법 없나?"

### node-pty lazy loading 구현

결과적으로 나온 해결책은 lazy loading 패턴이었다:

```typescript
// packages/core/src/adapters/base.ts
let ptyModule: any = null;

async function tryLoadNodePty() {
  if (ptyModule === null) {
    try {
      ptyModule = await import('node-pty');
      return ptyModule;
    } catch (error) {
      console.warn('node-pty not available, falling back to spawn');
      ptyModule = false;
      return null;
    }
  }
  return ptyModule === false ? null : ptyModule;
}

async executeInteractive(command: string, options: any) {
  const pty = await tryLoadNodePty();
  
  if (pty && process.platform !== 'win32') {
    return this.executeWithPty(command, options, pty);
  } else {
    return this.executeWithSpawn(command, options);
  }
}
```

핵심은 `ptyModule = false`로 실패 상태를 캐싱하는 것이다. 매번 import를 시도하지 않으니 성능도 좋고, production에서 dependency가 없을 때도 graceful하게 fallback한다.

### AI 도구 활용법

이런 infrastructure 코드를 작성할 때는 Claude Code의 `/review` 명령이 유용했다. 특히 memory leak이나 race condition을 찾는 데 좋다:

```
/review packages/core/src/adapters/base.ts

메모리 누수나 race condition 위험이 있는 부분을 찾아줘. 
특히 process spawning, event listener 등록, async resource 관리 부분.
```

Claude가 지적한 부분들:
1. pty process의 `onExit` handler에서 cleanup 안 됨
2. multiple import 시도 시 race condition 
3. error handling에서 resource leak 가능성

## 멀티 어댑터 아키텍처 — 상태 격리가 핵심

LLMMixer는 Claude, GPT, Gemini를 동시에 쓸 수 있다. 문제는 각 어댑터가 서로 다른 state management 패턴을 가진다는 것이었다.

### 구조화 전략

큰 작업을 쪼갤 때는 "관심사별 분리"가 중요하다. AI에게 한 번에 모든 어댑터를 리팩토링하라고 하지 말고, 각 어댑터별로 나눠서 작업한다:

1. Base adapter interface 정의
2. Claude adapter 구현 (가장 복잡한 것부터)
3. GPT/Codex adapter 마이그레이션  
4. Gemini adapter 마이그레이션
5. Integration test

### 어댑터별 프롬프팅 차이점

각 LLM 벤더마다 API 특성이 다르니 프롬프트도 달라야 한다:

**Claude adapter 구현 시:**
> "Claude API의 message format을 고려해서 adapter를 구현해줘.
> - messages는 `user`/`assistant` 역할만 지원
> - system prompt는 별도 parameter
> - tool use는 `tools` array로 전달
> - streaming은 SSE 방식
> - rate limit은 tier별로 다름"

**Codex adapter 구현 시:**  
> "OpenAI Codex API 특성 반영해서 구현해줘.
> - completion API 사용 (chat이 아님)
> - max_tokens 필수 parameter
> - temperature/top_p 조정 가능
> - stop sequences 지원
> - code generation에 특화된 prompting"

**Gemini adapter 구현 시:**
> "Google Gemini API 사용해서 구현해줘.
> - `parts` 배열 구조 사용
> - multimodal input 지원
> - safety settings 설정 필요
> - generationConfig로 parameter 조정"

### 상태 격리 패턴

각 어댑터가 독립적인 state를 가지도록 singleton 패턴을 적용했다:

```typescript
// packages/core/src/adapters/base.ts
export abstract class BaseAdapter {
  private static instances = new Map<string, BaseAdapter>();
  
  static getInstance<T extends BaseAdapter>(
    this: new (...args: any[]) => T,
    ...args: any[]
  ): T {
    const key = `${this.name}:${JSON.stringify(args)}`;
    if (!BaseAdapter.instances.has(key)) {
      BaseAdapter.instances.set(key, new this(...args));
    }
    return BaseAdapter.instances.get(key) as T;
  }
}
```

이렇게 하면 같은 configuration의 어댑터는 재사용되고, 서로 다른 어댑터들은 state corruption 없이 격리된다.

## SSE 스트리밍 최적화 — 중복 제거와 백프레셔 관리

Real-time 피드백을 위해 Server-Sent Events를 썼다. 문제는 여러 workflow가 동시에 실행될 때 message duplication과 memory buildup이 발생한다는 것이었다.

### 프롬프팅 전략

SSE 최적화 같은 low-level 작업은 구체적인 제약 조건을 줘야 한다:

> "Next.js App Router에서 SSE 구현 중이다. 문제점:
> 1. 같은 메시지가 중복으로 전송됨 (race condition)
> 2. Client disconnect 시 메모리 누수  
> 3. Multiple workflow 동시 실행 시 메시지 섞임
> 4. Backpressure 처리 안 됨
> 
> `ReadableStream`과 `TransformStream`을 써서 해결해줘.
> 기존 API 호환성 유지 필수."

### 중복 제거 구현

결과적으로 나온 해결책:

```typescript
// packages/dashboard/src/app/api/sse/route.ts
class SSEDeduplicator {
  private seenMessages = new Set<string>();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor(private maxAge = 30000) {
    this.cleanupInterval = setInterval(() => {
      this.seenMessages.clear();
    }, maxAge);
  }
  
  isDuplicate(message: string, sessionId: string): boolean {
    const key = `${sessionId}:${message}`;
    if (this.seenMessages.has(key)) {
      return true;
    }
    this.seenMessages.add(key);
    return false;
  }
  
  cleanup() {
    clearInterval(this.cleanupInterval);
    this.seenMessages.clear();
  }
}
```

핵심은 session별로 message key를 만들고, 주기적으로 cleanup하는 것이다. 메모리 사용량을 일정하게 유지하면서 중복도 방지한다.

### 백프레셔 관리

Client가 메시지 처리를 못 따라갈 때를 대비해서 backpressure 관리도 추가했다:

```typescript
const stream = new ReadableStream({
  start(controller) {
    const queue = [];
    const maxQueueSize = 100;
    
    function enqueue(data: any) {
      if (queue.length >= maxQueueSize) {
        queue.shift(); // 오래된 메시지 삭제
        console.warn(`SSE queue overflow for session ${sessionId}`);
      }
      queue.push(data);
      tryFlush();
    }
    
    function tryFlush() {
      while (queue.length > 0 && controller.desiredSize > 0) {
        controller.enqueue(queue.shift());
      }
    }
  }
});
```

`controller.desiredSize`로 클라이언트의 처리 능력을 확인하고, queue 크기를 제한해서 메모리 overflow를 방지한다.

## workflow engine 신뢰성 확보

AI workflow orchestration에서 가장 중요한 건 "실패 시 복구"다. 한 단계가 실패해도 전체 workflow가 멈추지 않고, 사용자가 재시도하거나 수동으로 개입할 수 있어야 한다.

### 상태 추적과 복구 지점

> "Workflow engine에서 실행 중 실패 시 복구 가능한 구조를 만들어줘.
> 요구사항:
> - 각 step의 성공/실패 상태 추적
> - 실패 지점부터 재시도 가능  
> - 중간 결과물 persistent storage
> - Manual intervention point 제공
> - Rollback 지원
> 
> DAG 구조 유지하면서 구현해줘."

결과적으로 checkpoint 패턴을 적용했다:

```typescript
// packages/core/src/workflow-engine.ts
interface WorkflowCheckpoint {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  timestamp: number;
  retryCount: number;
}

class WorkflowEngine {
  private checkpoints = new Map<string, WorkflowCheckpoint>();
  
  async executeStep(step: WorkflowStep): Promise<any> {
    const checkpoint = this.checkpoints.get(step.id);
    
    // 이미 성공한 step은 skip
    if (checkpoint?.status === 'completed') {
      return checkpoint.result;
    }
    
    // 재시도 제한 확인
    if (checkpoint?.retryCount >= this.maxRetries) {
      throw new Error(`Max retries exceeded for step ${step.id}`);
    }
    
    try {
      this.updateCheckpoint(step.id, 'running');
      const result = await this.runStep(step);
      this.updateCheckpoint(step.id, 'completed', result);
      return result;
    } catch (error) {
      this.updateCheckpoint(step.id, 'failed', undefined, error.message);
      throw error;
    }
  }
}
```

### 사용자 개입 지점 설계

AI가 실패했을 때 사용자가 수동으로 개입할 수 있는 UI도 중요하다. Dashboard에 retry, skip, manual override 버튼을 추가했다:

```typescript
// packages/dashboard/src/app/components/ResultsTab.tsx
function WorkflowStepCard({ step, onRetry, onSkip, onOverride }: Props) {
  if (step.status === 'failed') {
    return (
      <div className="border-red-500 border-2 p-4">
        <p>Step failed: {step.error}</p>
        <div className="flex gap-2 mt-2">
          <button onClick={() => onRetry(step.id)}>Retry</button>
          <button onClick={() => onSkip(step.id)}>Skip</button>
          <button onClick={() => onOverride(step.id)}>Manual Override</button>
        </div>
      </div>
    );
  }
}
```

사용자가 "Retry" 버튼을 누르면 해당 step부터 다시 실행되고, "Skip"을 누르면 해당 step을 건너뛰고 다음 step으로 진행한다.

## 더 나은 방법은 없을까

지금까지 설명한 방식들보다 더 나은 대안들이 있다.

### Durable execution framework 활용

현재 구현한 checkpoint 패턴 대신 Temporal이나 Azure Durable Functions 같은 durable execution framework를 쓰는 게 낫다. 이들은 workflow state persistence, automatic retry, human-in-the-loop 패턴을 기본 제공한다.

특히 AI workflow는 실행 시간이 길고 외부 API 의존성이 높으니 durability가 중요하다. 서버가 재시작되어도 workflow가 중단 지점부터 계속 실행되어야 한다.

### OpenTelemetry로 observability 확보  

Production에서 AI workflow를 운영하려면 tracing과 metrics가 필수다. 각 LLM 호출의 latency, token 사용량, error rate를 추적해야 한다.

```typescript
import { trace } from '@opentelemetry/api';

async function callLLM(prompt: string, model: string) {
  const span = trace.getActiveTracer().startSpan('llm_call', {
    attributes: {
      'llm.model': model,
      'llm.prompt_tokens': countTokens(prompt),
    }
  });
  
  try {
    const result = await adapter.generate(prompt);
    span.setAttributes({
      'llm.completion_tokens': countTokens(result),
      'llm.total_tokens': span.getAttributes()['llm.prompt_tokens'] + countTokens(result),
    });
    return result;
  } finally {
    span.end();
  }
}
```

### Circuit breaker 패턴으로 cascade failure 방지

여러 LLM API를 동시에 호출할 때 한 API가 다운되면 전체 시스템이 느려질 수 있다. Circuit breaker를 써서 실패하는 API는 일시적으로 차단하는 게 좋다.

```typescript
import { CircuitBreaker } from 'opossum';

const claudeBreaker = new CircuitBreaker(callClaudeAPI, {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 60000,
});

claudeBreaker.fallback(() => {
  // Fallback to GPT or Gemini
  return callGPTAPI(prompt);
});
```

### Event sourcing으로 audit trail 확보

AI가 생성한 결과물에 대한 추적성이 중요하다. 어떤 프롬프트로, 어떤 모델을 써서, 어떤 결과가 나왔는지 모든 이벤트를 저장해야 compliance나 debugging에 쓸 수 있다.

## 정리

이번 작업에서 배운 핵심 포인트들:

- AI에게 infrastructure 코드를 맡길 때는 제약 조건을 구체적으로 명시해야 한다. "안 돼"가 아니라 "왜 안 되는지, 어떤 환경에서, 어떤 요구사항 하에서"를 정확히 전달한다.
- 멀티 어댑터 아키텍처에서는 상태 격리가 핵심이다. Singleton 패턴으로 instance를 관리하고, 각 어댑터별로 독립적인 configuration을 가져야 한다.
- SSE 스트리밍에서는 중복 제거와 백프레셔 관리가 필수다. 특히 여러 workflow가 동시 실행될 때 메시지 섞임과 메모리 누수를 방지해야 한다.
- Production AI workflow는 실패 복구 시나리오를 반드시 고려해야 한다. Checkpoint 패턴과 사용자 개입 지점을 설계하는 게 중요하다.

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>