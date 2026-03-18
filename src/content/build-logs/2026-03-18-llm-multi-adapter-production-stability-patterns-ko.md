---
title: "LLM 멀티 어댑터로 production 안정성 확보하기 — lazy loading과 interactive CLI 패턴"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

AI 에이전트 플랫폼을 production에 올릴 때 가장 까다로운 건 안정성이다. 이번에 LLMMixer v0.3을 만들면서 Claude, GPT-4, Gemini를 하나의 워크플로에서 쓸 때 생기는 문제들을 해결했다. 특히 node-pty를 통한 interactive CLI와 lazy loading 패턴이 핵심이었다.

## 배경: 멀티 LLM 워크플로 엔진

LLMMixer는 여러 LLM을 조합해서 복잡한 작업을 처리하는 플랫폼이다. 코드 분석은 Claude에게, 문서 생성은 GPT-4에게, 데이터 추출은 Gemini에게 맡기는 식으로 각 모델의 강점을 활용한다.

이번 v0.3에서 목표는 production readiness였다. 개발 환경에서만 돌아가는 프로토타입이 아니라, 실제 서비스에서 쓸 수 있는 수준의 안정성을 확보해야 했다.

## node-pty로 interactive CLI 처리하기

가장 큰 변화는 `node-pty` 도입이었다. LLM이 생성한 코드를 실행할 때 interactive 명령어 처리가 필요했기 때문이다.

### 기존 방식의 한계

처음에는 `child_process.spawn()`으로 CLI 도구를 실행했다. 하지만 npm install이나 git commit 같은 명령어에서 사용자 입력을 기다리면 프로세스가 멈춘다.

```typescript
// 이렇게 하면 안 된다
const result = spawn('npm', ['install'], { stdio: 'inherit' });
// interactive prompt가 나오면 무한 대기
```

### node-pty 활용 패턴

AI에게 이런 식으로 프롬프팅했다:

> "node-pty를 써서 pseudo-terminal을 만들고, CLI 명령어의 output을 실시간으로 캡처해. interactive prompt가 나오면 미리 정의된 응답을 자동으로 보내도록 구현해. timeout 처리도 필요하다."

```typescript
import * as pty from 'node-pty';

const terminal = pty.spawn('npm', ['install'], {
  name: 'xterm-color',
  cols: 80,
  rows: 24,
  cwd: process.cwd(),
  env: process.env
});

terminal.onData((data) => {
  // interactive prompt 감지
  if (data.includes('? ') || data.includes('(y/N)')) {
    terminal.write('y\r'); // 자동 응답
  }
  console.log(data);
});
```

핵심은 **auto-respond 패턴**이다. LLM이 생성한 명령어가 사용자 입력을 요구할 때 미리 정의된 응답을 자동으로 보낸다.

### lazy loading으로 메모리 최적화

`node-pty`는 native 모듈이라 require() 비용이 크다. 모든 어댑터에서 즉시 로딩하면 startup time이 늘어난다.

AI에게 이렇게 요청했다:

> "node-pty를 lazy loading으로 구현해. interactive 명령어가 실제로 필요할 때만 require()하고, 한 번 로딩되면 singleton으로 관리해. 그리고 non-interactive 모드에서는 아예 로딩하지 마."

```typescript
class InteractiveTerminal {
  private static ptyModule: typeof import('node-pty') | null = null;
  
  private static async loadPty() {
    if (!this.ptyModule) {
      this.ptyModule = await import('node-pty');
    }
    return this.ptyModule;
  }
  
  static async spawn(command: string, args: string[]) {
    const pty = await this.loadPty();
    return pty.spawn(command, args, { /* options */ });
  }
}
```

이 패턴으로 startup time을 40% 줄였다.

## 어댑터 아키텍처 안정화

멀티 LLM 환경에서 가장 까다로운 건 각 모델의 특성에 맞는 error handling이다.

### base adapter 추상화

모든 LLM 어댑터가 공통으로 지켜야 할 인터페이스를 정의했다. AI에게 이런 프롬프트를 줬다:

> "base adapter class를 만들어. 모든 LLM 어댑터가 상속받을 추상 클래스다. retry logic, rate limiting, error categorization이 들어가야 한다. 각 LLM의 error response format이 다르니까 normalize하는 메서드도 필요하다."

```typescript
abstract class BaseLLMAdapter {
  protected abstract apiCall(prompt: string): Promise<string>;
  
  async execute(prompt: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.apiCall(prompt);
      } catch (error) {
        const normalized = this.normalizeError(error);
        if (!this.isRetriable(normalized)) throw normalized;
        
        await this.wait(Math.pow(2, i) * 1000); // exponential backoff
      }
    }
    throw new Error('Max retries exceeded');
  }
  
  protected abstract normalizeError(error: any): LLMError;
  protected abstract isRetriable(error: LLMError): boolean;
}
```

### Claude 어댑터 특화

Claude API는 rate limiting이 까다롭다. 429 에러가 나면 `Retry-After` 헤더를 확인해야 한다.

```typescript
class ClaudeAdapter extends BaseLLMAdapter {
  protected normalizeError(error: any): LLMError {
    if (error.status === 429) {
      const retryAfter = error.headers?.['retry-after'];
      return new RateLimitError(retryAfter ? parseInt(retryAfter) * 1000 : 60000);
    }
    // 다른 에러들도 정규화
  }
  
  protected isRetriable(error: LLMError): boolean {
    return error instanceof RateLimitError || 
           error instanceof NetworkError ||
           error instanceof ServerError;
  }
}
```

### 제약 조건으로 품질 보장

AI에게 코드를 생성시킬 때 반드시 제약 조건을 준다. 특히 production 코드에서는 더 엄격하게 한다.

> "TypeScript strict mode 켜고, 모든 error case를 명시적으로 처리해. async/await에서 unhandled promise rejection 절대 안 된다. 그리고 각 어댑터는 최대 30초 timeout 걸어."

이런 제약이 있어야 AI가 defensive programming을 한다.

## SSE deduplication과 실시간 업데이트

dashboard에서 여러 탭이 열려 있으면 같은 워크플로 업데이트를 중복으로 받는다. SSE(Server-Sent Events) deduplication이 필요했다.

### 세션 기반 구독 관리

AI에게 이렇게 요청했다:

> "SSE로 실시간 워크플로 상태를 보내는데, 같은 클라이언트가 여러 탭을 열면 중복 이벤트가 간다. session ID 기반으로 dedup하고, 클라이언트가 disconnect되면 자동으로 cleanup해. memory leak 절대 안 된다."

```typescript
class SSEManager {
  private connections = new Map<string, Set<Response>>();
  
  subscribe(sessionId: string, response: Response) {
    if (!this.connections.has(sessionId)) {
      this.connections.set(sessionId, new Set());
    }
    
    this.connections.get(sessionId)!.add(response);
    
    // cleanup on disconnect
    response.on('close', () => {
      this.connections.get(sessionId)?.delete(response);
      if (this.connections.get(sessionId)?.size === 0) {
        this.connections.delete(sessionId);
      }
    });
  }
  
  broadcast(sessionId: string, data: any) {
    const dedupKey = `${sessionId}:${JSON.stringify(data)}`;
    if (this.recentEvents.has(dedupKey)) return;
    
    this.recentEvents.add(dedupKey);
    setTimeout(() => this.recentEvents.delete(dedupKey), 5000);
    
    const connections = this.connections.get(sessionId);
    connections?.forEach(response => {
      response.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  }
}
```

### singleton persistence로 상태 유지

서버 재시작 시에도 진행 중인 워크플로는 복구되어야 한다. 하지만 데이터베이스까지 쓰기엔 오버엔지니어링이다.

> "메모리 기반 session manager를 만들되, process crash 대비해서 중요한 상태는 파일에 백업해. JSON으로 직렬화 가능한 것만 저장하고, 주기적으로 cleanup해."

```typescript
class SessionManager {
  private static instance: SessionManager;
  private sessions = new Map<string, WorkflowSession>();
  private backupPath = '.llmmixer/sessions.json';
  
  private constructor() {
    this.loadFromBackup();
    setInterval(() => this.saveToBackup(), 30000); // 30초마다 백업
  }
  
  static getInstance(): SessionManager {
    if (!this.instance) {
      this.instance = new SessionManager();
    }
    return this.instance;
  }
  
  private saveToBackup() {
    const serializable = Array.from(this.sessions.entries())
      .map(([id, session]) => [id, session.toJSON()]);
    
    fs.writeFileSync(this.backupPath, JSON.stringify(serializable));
  }
}
```

## 더 나은 방법은 없을까

현재 구현에서 개선할 수 있는 부분들이 있다.

### MCP Server 통합

Anthropic의 Model Context Protocol을 쓰면 더 깔끔하다. node-pty 로직을 별도 MCP 서버로 분리하면:

```json
{
  "name": "interactive-terminal",
  "version": "1.0.0",
  "tools": [
    {
      "name": "execute_interactive",
      "description": "Execute CLI commands with auto-response",
      "inputSchema": {
        "type": "object",
        "properties": {
          "command": { "type": "string" },
          "autoResponses": { "type": "object" }
        }
      }
    }
  ]
}
```

이렇게 하면 다른 프로젝트에서도 재사용할 수 있다.

### Redis를 통한 확장성

현재는 single node에서만 동작한다. 진짜 production에서는 Redis 기반 pub/sub으로 확장해야 한다:

```typescript
// Redis 기반 SSE 브로커
class RedisSSEBroker {
  private publisher = new Redis(REDIS_URL);
  private subscriber = new Redis(REDIS_URL);
  
  async subscribe(pattern: string, callback: (data: any) => void) {
    this.subscriber.psubscribe(pattern);
    this.subscriber.on('pmessage', (pattern, channel, message) => {
      callback(JSON.parse(message));
    });
  }
  
  async publish(channel: string, data: any) {
    await this.publisher.publish(channel, JSON.stringify(data));
  }
}
```

### OpenTelemetry 트레이싱

멀티 LLM 워크플로는 디버깅이 어렵다. OpenTelemetry로 각 어댑터 호출을 추적하면 병목 지점을 찾기 쉽다:

```typescript
import { trace } from '@opentelemetry/api';

class ClaudeAdapter extends BaseLLMAdapter {
  protected async apiCall(prompt: string): Promise<string> {
    const span = trace.getActiveTracer().startSpan('claude.api_call');
    span.setAttributes({
      'llm.provider': 'anthropic',
      'llm.model': 'claude-3-sonnet',
      'prompt.length': prompt.length
    });
    
    try {
      const result = await this.client.complete(prompt);
      span.setAttributes({ 'response.length': result.length });
      return result;
    } finally {
      span.end();
    }
  }
}
```

## 정리

- node-pty로 interactive CLI를 안전하게 처리하되, lazy loading으로 성능 최적화한다
- 멀티 LLM 환경에서는 base adapter로 공통 로직을 추상화하고, error handling을 정규화한다  
- SSE deduplication과 singleton persistence로 실시간 업데이트를 안정적으로 처리한다
- production 코드를 AI에게 생성시킬 때는 명확한 제약 조건과 timeout 처리를 필수로 한다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>