---
title: "프로덕션 LLM 도구에서 신뢰성 확보하는 패턴 — node-pty와 lazy loading"
project: "llmmixer_claude"
date: 2026-03-19
lang: ko
tags: [fix, feat, typescript, css]
---

AI 개발 도구를 만들다 보면 반드시 맞닥뜨리는 문제가 있다. 개발 환경에서는 잘 돌던 게 프로덕션에서 죽는다. 특히 interactive CLI와 multiple LLM provider를 다루는 복잡한 시스템일수록 예측하지 못한 지점에서 터진다. 이번에 LLMMixer v0.3을 프로덕션 ready 상태로 만들면서 배운 신뢰성 패턴들을 정리한다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 여러 LLM provider(Claude, GPT, Gemini)를 동시에 활용해서 코드 작업을 자동화하는 도구다. 하나의 요청을 여러 모델에게 parallel하게 보내고, 결과를 비교 분석해서 최적의 output을 선택한다. 

이전 버전까지는 기본적인 API 호출과 단순한 workflow만 지원했는데, v0.3에서는 interactive CLI 지원과 실시간 dashboard, 그리고 production 환경에서의 안정성을 목표로 했다. 문제는 개발할 때는 몰랐던 edge case들이 실제 사용자 환경에서 계속 터지는 것이었다.

## node-pty로 진짜 interactive CLI 만들기

가장 큰 변화는 interactive CLI를 제대로 구현한 것이다. 기존에는 `child_process.spawn()`으로 외부 명령을 실행했는데, 이게 pseudo-terminal 환경에서는 제대로 동작하지 않는다.

### 문제: 가짜 interactive는 금방 들통난다

초기 구현은 이런 식이었다:

```typescript
// 나쁜 예 - 진짜 interactive가 아니다
const process = spawn('git', ['rebase', '-i'], {
  stdio: 'inherit'
});
```

이렇게 하면 대부분의 경우는 동작하지만, terminal escape sequence나 color output, 그리고 실제 user input이 필요한 상황에서는 완전히 망가진다. `git rebase -i`나 `vim`, `nano` 같은 editor들이 제대로 동작하지 않는다.

### 해결: node-pty로 real terminal emulation

`node-pty`를 도입해서 진짜 pseudo-terminal을 만들었다:

```typescript
import * as pty from 'node-pty';

const ptyProcess = pty.spawn(command, args, {
  name: 'xterm-color',
  cols: process.stdout.columns || 80,
  rows: process.stdout.rows || 24,
  cwd: this.workingDirectory,
  env: process.env
});

ptyProcess.on('data', (data) => {
  process.stdout.write(data);
});

process.stdin.on('data', (data) => {
  ptyProcess.write(data);
});
```

이제 모든 interactive command가 예상대로 동작한다. `git rebase -i`에서 editor가 열리고, vim에서 syntax highlighting도 제대로 나온다.

### 프롬프팅 전략: AI에게 terminal 호환성 설명하기

AI에게 이런 작업을 시킬 때는 단순히 "interactive CLI 만들어줘"라고 하면 안 된다. 구체적인 요구사항을 명시해야 한다:

> "TypeScript로 interactive CLI를 구현하는데, `child_process`가 아니라 `node-pty`를 써야 한다. 이유는 pseudo-terminal emulation이 필요하기 때문이다. `git rebase -i`, `vim`, `nano` 같은 interactive command들이 정상 동작해야 한다. terminal의 `cols`와 `rows`를 동적으로 감지해서 전달하고, stdin/stdout을 양방향으로 pipe해야 한다."

이렇게 쓰면 안 된다:
> "CLI 만들어줘"

### lazy loading으로 optional dependency 처리

`node-pty`는 native module이라서 설치 과정에서 문제가 생길 수 있다. 모든 사용자가 interactive CLI 기능을 쓰는 것도 아니니까 lazy loading으로 처리했다:

```typescript
async loadPty() {
  if (!this.pty) {
    try {
      this.pty = await import('node-pty');
    } catch (error) {
      throw new Error(
        'node-pty is required for interactive CLI. Run: npm install node-pty'
      );
    }
  }
  return this.pty;
}
```

이렇게 하면 interactive 기능을 실제로 사용할 때만 `node-pty`를 load하고, 없으면 명확한 에러 메시지를 보여준다.

## adapter 신뢰성 패턴 — non-interactive와 singleton

LLM provider adapter들을 안정화하는 과정에서 발견한 핵심 패턴들이다.

### non-interactive mode 구분

각 LLM provider마다 interactive 지원 여부가 다르다. Claude는 conversation 형태의 interactive가 자연스럽지만, Codex는 one-shot completion에 최적화되어 있다. 이걸 adapter level에서 명확히 구분했다:

```typescript
abstract class BaseLLMAdapter {
  abstract readonly supportsInteractive: boolean;
  
  async execute(prompt: string, interactive: boolean = false) {
    if (interactive && !this.supportsInteractive) {
      throw new Error(`${this.name} does not support interactive mode`);
    }
    
    return interactive ? 
      this.executeInteractive(prompt) : 
      this.executeOneShot(prompt);
  }
}
```

### 프롬프팅 전략: AI에게 adapter pattern 설명하기

AI에게 이런 architecture를 구현하게 할 때는 abstract base class의 역할을 명확히 해야 한다:

> "LLM adapter를 abstract base class로 설계하되, 각 provider마다 capability가 다르다는 �걸 type level에서 보장해야 한다. Claude는 interactive conversation을 지원하지만 Codex는 one-shot completion만 한다. `supportsInteractive` readonly property로 이걸 명시하고, runtime에서 validation하되 TypeScript에서도 이걸 체크할 수 있게 만들어줘."

이렇게 쓰면 안 된다:
> "adapter 만들어줘"

### singleton persistence로 메모리 누수 방지

각 adapter instance는 내부적으로 connection pool이나 authentication state를 가지고 있다. 매번 새로 만들면 메모리 누수가 생긴다:

```typescript
class AdapterManager {
  private static instances = new Map<string, BaseLLMAdapter>();
  
  static getInstance(provider: string, config: any): BaseLLMAdapter {
    const key = `${provider}:${JSON.stringify(config)}`;
    
    if (!this.instances.has(key)) {
      this.instances.set(key, this.createAdapter(provider, config));
    }
    
    return this.instances.get(key)!;
  }
}
```

이렇게 하면 같은 configuration의 adapter는 재사용되고, connection이 계속 살아있어서 성능도 좋아진다.

## SSE deduplication과 실시간 신뢰성

dashboard에서 여러 클라이언트가 동시에 접속했을 때 duplicate event가 발생하는 문제가 있었다.

### 문제: SSE에서 같은 이벤트가 여러 번

Server-Sent Events로 실시간 업데이트를 보내는데, 같은 workflow가 여러 번 trigger되거나 client가 reconnect할 때 중복 이벤트가 발생했다:

```typescript
// 나쁜 예 - deduplication 없음
clients.forEach(client => {
  client.write(`data: ${JSON.stringify(event)}\n\n`);
});
```

### 해결: event ID 기반 deduplication

각 이벤트에 unique ID를 부여하고, client side에서 deduplication하도록 했다:

```typescript
const eventId = `${sessionId}:${workflowId}:${Date.now()}`;
const eventData = {
  id: eventId,
  type: 'workflow_update',
  data: payload
};

clients.forEach(client => {
  if (!client.sentEvents.has(eventId)) {
    client.write(`id: ${eventId}\ndata: ${JSON.stringify(eventData)}\n\n`);
    client.sentEvents.add(eventId);
  }
});
```

### trust auto-respond 플래그

일부 workflow는 사용자 확인 없이 자동으로 진행되어야 한다. 특히 CI/CD 환경에서는 interactive approval이 불가능하다:

```typescript
interface WorkflowConfig {
  trustAutoRespond: boolean;
  maxAutoRetries: number;
  requireHumanApproval: string[]; // specific steps that always need approval
}
```

### 프롬프팅 전략: AI에게 신뢰성 요구사항 전달하기

이런 시스템적인 요구사항을 AI에게 설명할 때는 failure scenario를 구체적으로 명시한다:

> "SSE로 실시간 이벤트를 여러 클라이언트에게 broadcast하는데, 다음 상황들을 고려해야 한다: 1) 같은 클라이언트가 빠르게 reconnect할 때 duplicate event 2) 여러 workflow가 parallel하게 실행될 때 event ordering 3) client가 중간에 disconnect된 후 재접속했을 때 missed event recovery. event ID 기반 deduplication과 client-side event buffer를 구현해줘."

이렇게 쓰면 안 된다:
> "SSE 실시간 통신 만들어줘"

## 더 나은 방법은 없을까

현재 구현에서 개선할 수 있는 부분들을 살펴보자.

### WebSocket 대신 SSE를 쓴 이유

실시간 통신에서 WebSocket이 더 일반적이지만 SSE를 선택한 이유가 있다. SSE는 HTTP protocol 위에서 동작해서 proxy나 load balancer 통과가 쉽고, automatic reconnection이 browser level에서 지원된다. 하지만 unidirectional이라는 한계가 있다.

더 나은 방법은 WebSocket과 SSE를 hybrid로 사용하는 것이다. status update는 SSE로, user interaction은 WebSocket으로 분리하면 각각의 장점을 살릴 수 있다.

### lazy loading보다 optional peer dependencies

`node-pty` 같은 native module을 lazy loading으로 처리했지만, npm의 `peerDependencies`와 `optionalDependencies`를 활용하는 게 더 표준적이다:

```json
{
  "peerDependencies": {
    "node-pty": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "node-pty": {
      "optional": true
    }
  }
}
```

이렇게 하면 package manager level에서 dependency를 관리하고, 사용자에게 더 명확한 installation guide를 제공할 수 있다.

### MCP (Model Context Protocol) 활용

현재는 각 LLM provider의 native API를 직접 호출하지만, Anthropic에서 공개한 MCP를 사용하면 더 표준화된 방식으로 multiple provider를 관리할 수 있다. MCP server를 intermediate layer로 두고 tool calling이나 context sharing을 더 효율적으로 처리할 수 있다.

특히 interactive conversation을 여러 provider에서 일관되게 지원하려면 MCP의 session management가 유용하다.

### circuit breaker pattern

현재 adapter에서는 단순한 retry logic만 있지만, production에서는 circuit breaker pattern이 필요하다. 특정 provider가 계속 실패하면 일시적으로 차단하고 다른 provider로 fallback하는 방식이다:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

## 정리

- **node-pty + lazy loading**: native dependency를 optional하게 처리하되, 실제 기능은 타협하지 않는다
- **adapter capability 명시**: 각 LLM provider의 한계를 type level에서 표현해서 runtime error를 사전에 방지한다  
- **SSE deduplication**: 실시간 시스템에서는 event ID 기반으로 중복을 방지하고 client state를 관리한다
- **trust 플래그**: CI/CD 같은 automated 환경을 위해 human approval을 bypass할 수 있는 escape hatch를 만든다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>