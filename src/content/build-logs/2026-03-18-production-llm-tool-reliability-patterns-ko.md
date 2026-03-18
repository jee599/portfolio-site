---
title: "Production LLM 도구의 신뢰성 문제를 해결하는 아키텍처 패턴"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer라는 CLI-to-LLM 브릿지 도구의 production readiness를 확보하는 작업을 했다. 이 글에서는 interactive CLI 처리, adapter pattern 설계, SSE deduplication 등 복잡한 멀티모델 도구에서 마주치는 신뢰성 문제를 AI와 함께 해결한 과정을 다룬다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 Claude, GPT, Gemini 등 여러 LLM을 하나의 인터페이스로 섞어 쓸 수 있는 도구다. 사용자가 터미널 명령어를 입력하면 LLM이 실행하고, 결과를 웹 대시보드에서 실시간으로 볼 수 있다. 

v0.3에서는 `node-pty`를 도입해 interactive CLI 지원을 추가했다. `npm install -g some-cli`처럼 사용자 입력이 필요한 명령어도 처리할 수 있게 됐다. 하지만 production에서 쓰려면 신뢰성 문제부터 해결해야 했다.

주요 목표:
- Interactive CLI 명령어 안정적 처리
- 멀티 어댑터 간 consistency 확보  
- SSE 중복 이벤트 제거
- Singleton 인스턴스 persistence 보장

## Interactive CLI 처리 — lazy loading과 제약 조건이 핵심

`node-pty`는 pseudo-terminal을 만들어서 실제 shell처럼 동작한다. 문제는 이 패키지가 네이티브 모듈이라 import 시점에 실패할 수 있다는 점이다.

### 프롬프팅 전략

AI에게 이런 문제를 해결하게 할 때는 **제약 조건을 명확히** 줘야 한다:

> `node-pty`를 lazy loading으로 처리해서 import 실패 시에도 애플리케이션이 죽지 않게 만들어줘. 조건:
> 1. interactive 모드가 아닐 때는 `node-pty`를 로드하지 않는다
> 2. import 실패 시 graceful fallback으로 일반 `child_process.spawn` 사용
> 3. 기존 non-interactive 명령어는 영향받지 않는다
> 4. TypeScript 타입 안전성 유지

이렇게 쓰면 안 된다:
> "node-pty 문제 해결해줘"

구체적인 제약 조건을 주면 AI가 훨씬 정확한 솔루션을 제공한다.

### Claude Code 활용법

Claude Code에서 이런 작업을 할 때 효과적인 패턴:

```typescript
// packages/core/src/adapters/base.ts
private async loadNodePty() {
  if (!this.isInteractive) return null;
  
  try {
    const { spawn } = await import('node-pty');
    return spawn;
  } catch (error) {
    console.warn('node-pty not available, fallback to child_process');
    return null;
  }
}
```

`CLAUDE.md`에 이런 컨텍스트를 추가하면 더 좋은 결과가 나온다:

```markdown
## Error Handling Patterns
- Use lazy loading for optional native modules
- Always provide graceful fallbacks
- Log warnings, not errors for optional features
- Maintain backward compatibility
```

### 구조화 전략

큰 리팩토링을 AI에게 시킬 때는 단계별로 나눈다:

1. **Phase 1**: lazy loading 구조 설계
2. **Phase 2**: fallback 로직 구현  
3. **Phase 3**: 기존 코드와의 integration test
4. **Phase 4**: error case 검증

각 단계를 별도 커밋으로 만들면 문제 발생 시 롤백하기 쉽다.

## Adapter Pattern 일관성 — 멀티모델 환경의 함정

Claude, GPT, Gemini는 각각 다른 API 구조를 가진다. 하나의 인터페이스로 통일하려면 adapter pattern이 필수다. 문제는 각 모델마다 subtlety가 다르다는 점이다.

### 프롬프팅 전략

멀티 어댑터 작업 시 이런 프롬프트가 효과적이다:

> 3개 LLM adapter (Claude, GPT, Gemini)에서 `processCommand` 메서드의 시그니처를 통일해줘. 요구사항:
> 1. 모든 adapter가 동일한 interface 구현
> 2. streaming response 지원  
> 3. error handling 일관성 유지
> 4. 각 모델의 특수한 parameter는 `modelSpecific` 객체 안에
> 
> 현재 불일치: Claude는 `system` 메시지 분리, GPT는 `messages` 배열 통합, Gemini는 `parts` 구조 사용

**핵심은 현재 상태의 차이점을 구체적으로 명시하는 것이다.**

### 구조화 전략

base adapter에서 공통 로직을 추상화하고, 각 구현체에서 차이점만 override하게 만든다:

```typescript
// packages/core/src/adapters/base.ts
abstract class BaseAdapter {
  abstract transformMessages(messages: Message[]): any;
  abstract callModel(params: any): Promise<Response>;
  
  async processCommand(command: string, options: Options) {
    const messages = this.prepareMessages(command);
    const transformed = this.transformMessages(messages); // 각자 구현
    return this.callModel(transformed);
  }
}
```

이렇게 하면 새로운 모델을 추가할 때 `transformMessages`와 `callModel`만 구현하면 된다.

### 관련 기술 개념

**Adapter Pattern의 핵심은 interface segregation이다.** 각 외부 API의 복잡성을 숨기고, 내부에서는 단순한 인터페이스만 노출한다. 

LLM 도구에서 특히 중요한 부분:
- **Message format normalization**: 모든 모델이 다른 메시지 구조 사용
- **Streaming handling**: GPT는 delta, Claude는 full chunk
- **Error classification**: rate limit vs auth vs service error 구분

## SSE Deduplication — 실시간 이벤트의 신뢰성

Server-Sent Events로 실시간 로그를 스트리밍할 때 중복 이벤트 문제가 발생했다. 브라우저에서 connection을 재연결하면서 같은 이벤트가 여러 번 전송되는 상황이다.

### 프롬프팅 전략

이런 문제는 AI가 놓치기 쉬운 edge case가 많다. 구체적인 시나리오를 제시한다:

> SSE 이벤트 중복 제거 로직을 만들어줘. 시나리오:
> 1. 클라이언트가 connection 끊김 후 재연결
> 2. 서버에서는 계속 이벤트 발생 중
> 3. 재연결 시 이미 전송된 이벤트 중복 방지
> 
> 요구사항:
> - 각 이벤트에 sequence ID 부여
> - 클라이언트가 `Last-Event-ID` 헤더로 마지막 수신 ID 전송
> - 서버는 해당 ID 이후 이벤트만 전송
> - 메모리 leak 방지를 위한 이벤트 history cleanup

### 구조화 전략

SSE deduplication은 state management가 핵심이다. 단순한 배열 대신 circular buffer를 쓴다:

```typescript
// packages/dashboard/src/app/api/sse/route.ts
class EventBuffer {
  private events = new Map<string, StoredEvent>();
  private maxSize = 1000;
  
  addEvent(event: Event) {
    if (this.events.size >= this.maxSize) {
      // LRU eviction
      const oldest = this.events.keys().next().value;
      this.events.delete(oldest);
    }
    this.events.set(event.id, event);
  }
  
  getEventsSince(lastId: string): Event[] {
    // lastId 이후 이벤트들만 반환
  }
}
```

**메모리 관리가 critical하다.** 무한정 이벤트를 저장하면 memory leak이 발생한다.

### Claude Code 활용법

SSE 디버깅은 브라우저 dev tools로 어렵다. Claude Code의 `/test` slash command로 curl 명령어를 생성해서 테스트한다:

```bash
curl -N -H "Accept: text/event-stream" \
     -H "Last-Event-ID: 12345" \
     http://localhost:3000/api/sse
```

이런 테스트 명령어를 만들 때도 AI에게 시키면 된다:

> SSE endpoint 테스트용 curl 명령어 만들어줘. `Last-Event-ID` 헤더 포함해서 deduplication 동작 확인할 수 있게

## 더 나은 방법은 없을까

이번 작업에서 쓴 패턴들보다 더 효율적인 대안이 있다.

**Interactive CLI 처리**에서는 `node-pty` 대신 WebContainer API를 고려할 수 있다. Stackblitz가 브라우저에서 Node.js를 실행할 때 쓰는 기술이다. 네이티브 의존성 없이 full terminal 환경을 제공한다. 다만 아직 experimental이라 production에서는 위험하다.

**Adapter Pattern**에서는 OpenAI의 새로운 structured outputs API를 활용하면 response parsing이 더 안정적이다. JSON schema를 미리 정의하면 모델이 해당 구조로만 응답한다. Anthropic도 비슷한 기능을 beta로 제공 중이다.

**SSE Deduplication**은 Redis를 쓰면 더 robust하다. 현재는 in-memory Map을 쓰는데, 서버 재시작 시 이벤트 history가 사라진다. Redis Streams를 쓰면 persistence와 horizontal scaling을 동시에 해결할 수 있다.

**MCP (Model Context Protocol)** 관점에서 보면, 각 LLM adapter를 별도 MCP 서버로 분리하는 게 낫다. Anthropic이 공개한 MCP spec을 따르면 다른 도구와의 interoperability가 높아진다.

```typescript
// MCP 서버로 분리한 구조
const claudeServer = new MCPServer('claude-adapter');
const gptServer = new MCPServer('gpt-adapter');

// 각 서버가 독립적으로 scaling 가능
await Promise.all([
  claudeServer.start(port: 8001),
  gptServer.start(port: 8002)
]);
```

**성능 측면**에서는 현재 모든 모델에 동시 request를 보내는 "racing" 모드를 구현할 수 있다. 가장 빠른 응답을 채택하고 나머지는 cancel한다. 비용은 늘지만 latency가 크게 줄어든다.

## 정리

이번 작업에서 얻은 핵심 인사이트:

- **제약 조건이 명확할수록 AI가 더 정확한 솔루션 제공한다** — "해결해줘"가 아니라 조건과 제외사항을 구체적으로
- **Production 도구에서는 graceful fallback이 필수다** — optional 기능 때문에 전체가 죽으면 안 된다  
- **멀티모델 환경에서는 adapter pattern + interface 통일이 복잡성을 줄인다** — 각 모델의 특수성은 내부에 숨긴다
- **실시간 시스템에서는 state management와 memory cleanup이 critical하다** — 무한정 저장하면 memory leak 발생

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags

4e71b99 — fix: critical reliability issues for production readiness  

bec39bf — feat: node-pty for interactive CLI, UX improvements

0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence

187e632 — feat: initial LLMMixer v0.3 implementation

</details>