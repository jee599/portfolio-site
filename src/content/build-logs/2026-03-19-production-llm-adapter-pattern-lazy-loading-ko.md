---
title: "production LLM 시스템 구축하며 배운 adapter 패턴과 lazy loading 전략"
project: "llmmixer_claude"
date: 2026-03-19
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer v0.3을 production으로 올리면서 안정성 이슈를 전부 잡았다. 이 글에서는 멀티 LLM을 다루는 adapter 패턴 설계와, production 환경에서 critical한 lazy loading 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 Claude, OpenAI Codex, Gemini를 하나의 인터페이스로 관리하는 시스템이다. 각 모델의 특성에 맞게 워크플로우를 분해하고, 결과를 합치는 게 핵심이다.

이번 작업의 목표는 단순했다. v0.2에서 발견된 reliability 이슈들을 모두 해결하고, interactive CLI와 dashboard가 production 환경에서 안정적으로 돌아가게 만드는 것이었다.

## Adapter 패턴으로 멀티 LLM 통합하기

각 LLM 제공사마다 API 인터페이스가 다르다. Claude는 streaming을 기본으로 하고, Codex는 completion 중심이며, Gemini는 또 다른 response format을 쓴다. 이걸 하나의 일관된 인터페이스로 묶는 게 adapter의 역할이다.

### 프롬프팅 전략: AI에게 adapter 설계하게 하기

처음에 AI에게 이렇게 시켰다:

> "Claude, OpenAI, Gemini API를 통합하는 adapter 만들어줘"

결과는 엉망이었다. 각 모델의 고유한 특성을 무시하고 단순히 API wrapper만 만들었다.

효과적인 프롬프트는 이랬다:

> "멀티 LLM adapter 패턴을 설계해라. 요구사항:
> 1. base adapter에서 common interface 정의 (streaming, non-interactive mode 구분)
> 2. Claude adapter: message history 유지, streaming response 처리
> 3. Codex adapter: code completion 최적화, function call 지원
> 4. Gemini adapter: safety settings, generation config 분리
> 5. 각 adapter는 독립적으로 fallback 처리
> 
> 기존 코드 구조를 유지하면서 `BaseAdapter` 클래스를 확장하는 방식으로 해라."

이렇게 구체적인 제약 조건을 주니까 제대로 된 adapter hierarchy가 나왔다.

### 구조화 전략: 공통 인터페이스 vs 개별 최적화

`BaseAdapter`에는 모든 LLM이 공통으로 써야 하는 메소드만 정의했다:

```typescript
abstract class BaseAdapter {
  abstract processStream(prompt: string, options: StreamOptions): AsyncGenerator;
  abstract executeNonInteractive(task: Task): Promise<Result>;
  abstract handleFallback(error: Error): Promise<void>;
}
```

각 구현체에서는 모델별 특성을 살렸다. Claude는 `anthropic` SDK의 streaming을 그대로 쓰고, Codex는 OpenAI completion API에 맞게 response를 변환한다.

핵심은 **공통 인터페이스는 최소화하고, 각 adapter 내부에서는 해당 모델에 최적화된 로직을 쓴다**는 것이다. 무리하게 통일하려다가 성능을 잃는 실수를 피할 수 있다.

## node-pty와 lazy loading으로 메모리 최적화

production에서 가장 큰 문제는 메모리 사용량이었다. interactive CLI를 위해 `node-pty`를 import하는데, 이게 startup time을 200ms나 늘렸다. 모든 request에서 필요한 게 아닌데 말이다.

### 프롬프팅 전략: 성능 최적화 관점 제시

AI에게 단순히 "최적화해줘"라고 하면 premature optimization을 한다. 명확한 성능 목표를 줘야 한다:

> "node-pty import가 startup time 200ms 추가한다. 해결 방법:
> 1. lazy loading으로 실제 사용 시점에만 require()
> 2. singleton pattern으로 중복 초기화 방지  
> 3. non-interactive mode에서는 아예 로드 안 함
> 4. 기존 TypeScript import 구조는 건드리지 마
> 
> startup time을 50ms 이하로 만들어라."

구체적인 성능 목표(50ms)를 주니까 적절한 lazy loading 전략이 나왔다.

### 구조화 전략: 조건부 require()와 singleton 관리

최종 구현은 이랬다:

```typescript
class TerminalManager {
  private static instance?: TerminalManager;
  private ptyProcess?: IPty;
  
  static getInstance(): TerminalManager {
    if (!this.instance) {
      this.instance = new TerminalManager();
    }
    return this.instance;
  }
  
  async initPty(): Promise<void> {
    if (this.ptyProcess) return; // 이미 초기화됨
    
    // lazy loading
    const { spawn } = await import('node-pty');
    this.ptyProcess = spawn(process.env.SHELL || 'bash', [], {
      name: 'xterm-color',
      cwd: process.cwd()
    });
  }
}
```

핵심 패턴은 3가지다:

1. **conditional require**: interactive mode일 때만 `import('node-pty')`
2. **singleton persistence**: 한번 초기화하면 재사용
3. **graceful fallback**: pty 실패 시 일반 child_process로 대체

## SSE deduplication과 신뢰성 개선

dashboard의 Server-Sent Events에서 중복 메시지 문제가 있었다. 같은 workflow update가 여러 번 전송되면서 UI가 깜빡이는 이슈였다.

### 프롬프팅 전략: 상태 관리 관점에서 접근

> "SSE로 workflow status를 전송하는데 같은 메시지가 중복 전송된다. 해결책:
> 1. client별로 마지막 전송 상태를 추적
> 2. 상태 변경이 없으면 전송 skip
> 3. connection drop 시 state cleanup
> 4. memory leak 방지를 위한 TTL 적용
> 
> React 18 StrictMode에서 useEffect가 2번 실행되는 것도 고려해라."

React StrictMode 조건까지 명시하니까 client-side deduplication도 함께 고려한 솔루션이 나왔다.

### 구조화 전략: 상태 추적과 메모리 관리

SSE deduplication은 간단해 보이지만 메모리 관리가 핵심이다:

```typescript
class SSEManager {
  private clientStates = new Map<string, { 
    lastSent: string, 
    timestamp: number 
  }>();
  
  send(clientId: string, data: WorkflowUpdate) {
    const key = `${data.sessionId}-${data.status}`;
    const lastState = this.clientStates.get(clientId);
    
    // deduplication check
    if (lastState?.lastSent === key) return;
    
    // send & update state
    this.sendSSE(clientId, data);
    this.clientStates.set(clientId, {
      lastSent: key,
      timestamp: Date.now()
    });
  }
  
  // cleanup old states (prevent memory leak)
  cleanup() {
    const now = Date.now();
    for (const [clientId, state] of this.clientStates) {
      if (now - state.timestamp > 300000) { // 5분
        this.clientStates.delete(clientId);
      }
    }
  }
}
```

여기서 놓치기 쉬운 부분은 **cleanup 주기**다. TTL을 너무 짧게 하면 valid connection도 정리되고, 너무 길게 하면 memory leak이 발생한다.

## 더 나은 방법은 없을까

이번 작업에서 쓴 패턴들보다 더 나은 대안이 있다:

**1. Adapter Pattern 대신 Plugin Architecture**

현재는 각 LLM마다 adapter class를 만들었는데, 최신 트렌드는 plugin-based architecture다. Anthropic의 MCP(Model Context Protocol)나 LangChain의 Runnable interface를 쓰면 더 유연하게 확장할 수 있다.

**2. lazy loading 대신 Worker Threads**

`node-pty` 같은 heavy module은 lazy loading보다는 worker thread로 분리하는 게 낫다. main thread blocking을 완전히 피할 수 있고, CPU intensive task도 함께 처리할 수 있다.

**3. SSE 대신 WebSocket + Message Queue**

실시간성이 중요한 workflow update는 SSE보다 WebSocket이 적합하다. Redis streams나 Bull Queue와 연동하면 scale-out도 쉬워진다.

**4. 성능 모니터링 도구 활용**

startup time이나 memory usage를 수동으로 측정하는 대신 `clinic.js`나 `0x` 같은 profiling 도구를 써야 한다. 병목 지점을 정확히 찾을 수 있다.

## 정리

- Adapter 패턴 설계 시 공통 인터페이스는 최소화하고 개별 최적화에 집중한다
- lazy loading은 구체적인 성능 목표를 정하고 singleton으로 중복 초기화를 방지한다  
- SSE deduplication에는 TTL 기반 cleanup이 필수다
- AI에게 시킬 때는 제약 조건과 성능 목표를 구체적으로 명시해야 한다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>