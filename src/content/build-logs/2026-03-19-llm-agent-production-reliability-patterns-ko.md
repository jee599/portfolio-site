---
title: "production LLM agent 배포할 때 놓치기 쉬운 3가지 신뢰성 패턴"
project: "llmmixer_claude"
date: 2026-03-19
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer v0.3을 프로덕션에 올리면서 하나씩 터지는 버그들과 싸웠다. 이 글에서는 LLM 에이전트를 실제 서비스로 만들 때 반드시 해결해야 하는 신뢰성 이슈들과, 각 문제를 AI에게 시킬 때 효과적인 프롬프팅 전략을 정리한다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 여러 LLM provider(Claude, GPT, Gemini)를 하나의 workflow로 연결하는 AI orchestration 도구다. 개발자가 복잡한 작업을 여러 단계로 쪼개고, 각 단계마다 최적의 모델을 선택해서 실행할 수 있게 한다.

이번에는 v0.2에서 v0.3으로 넘어가면서 interactive CLI 지원, SSE 기반 실시간 스트리밍, multi-session 관리 등 프로덕션급 기능을 추가했다. 7000줄 넘게 코드를 추가하면서 예상치 못한 edge case들이 하나씩 드러났다.

핵심은 "데모에서는 잘 됐는데 실제로 쓰니까 안 된다"는 문제들을 어떻게 체계적으로 찾고 고치는지였다.

## lazy loading으로 dependency hell 피하기

Node.js에서 `node-pty` 같은 native module을 쓸 때 가장 큰 문제는 import timing이다. 모든 환경에서 항상 필요한 게 아닌데, top-level에서 require하면 해당 패키지가 없는 환경에서 앱 전체가 크래시된다.

처음엔 이렇게 잘못 접근했다:

```typescript
// 이렇게 하면 안 됨
import * as pty from 'node-pty';

export class InteractiveCLI {
  spawn() {
    return pty.spawn(...);
  }
}
```

Claude에게 이 문제를 해결하라고 할 때 중요한 건 **조건부 로딩 패턴을 명확히 지시**하는 거다. 그냥 "optional dependency로 만들어줘"라고 하면 안 된다.

> "node-pty는 interactive mode에서만 필요하다. top-level import 대신 런타임에 require()로 로딩하고, 패키지가 없으면 graceful fallback하는 패턴으로 리팩토링해줘. try-catch로 import 에러를 처리하고, 에러 시 일반 child_process로 대체해."

이렇게 구체적으로 시키면 Claude가 이런 코드를 만들어준다:

```typescript
export class InteractiveCLI {
  private async spawn() {
    try {
      const pty = require('node-pty');
      return pty.spawn(command, args, options);
    } catch (error) {
      // fallback to child_process
      const { spawn } = require('child_process');
      return spawn(command, args, { stdio: 'pipe' });
    }
  }
}
```

여기서 핵심은 **AI에게 fallback strategy를 명확히 제시**하는 거다. 단순히 "에러 처리해줘"가 아니라 "A가 안 되면 B로 대체하고, 이때 인터페이스는 동일하게 유지해"라고 구체적으로 지시한다.

또 다른 패턴은 feature flag와 결합하는 거다:

> "INTERACTIVE_MODE flag가 false면 node-pty 로딩 자체를 스킵하고, CLI 모드에서는 일반 stdio로 처리해. 환경변수로 제어 가능하게 만들어."

이렇게 하면 Docker container나 serverless 환경에서도 문제없이 실행된다.

## SSE deduplication — 같은 메시지 중복 전송 막기

Server-Sent Events로 실시간 스트리밍할 때 가장 짜증나는 건 같은 메시지가 여러 번 전송되는 거다. 특히 LLM response를 chunk 단위로 스트리밍할 때 네트워크 지연이나 reconnection으로 인해 중복이 자주 발생한다.

이 문제를 AI에게 시킬 때는 **상태 관리 패턴을 명확히 정의**해야 한다:

> "SSE stream에서 메시지 중복을 방지하는 deduplication layer를 만들어줘. 각 메시지에 sequence number를 붙이고, 클라이언트 쪽에서 이미 받은 sequence는 무시하게 해. 서버에서는 최근 100개 메시지의 hash를 memory에 저장해서 중복 체크해."

단순히 "중복 제거해줘"라고 하면 안 된다. 구체적인 메커니즘을 제시해야 Claude가 올바른 구현을 만들어낸다.

실제로는 이런 형태가 된다:

```typescript
class SSEDeduplicator {
  private sentHashes = new Set<string>();
  private sequenceCounter = 0;

  send(data: any, response: Response) {
    const hash = this.generateHash(data);
    if (this.sentHashes.has(hash)) return;
    
    this.sentHashes.add(hash);
    response.write(`data: ${JSON.stringify({
      seq: ++this.sequenceCounter,
      payload: data
    })}\n\n`);
    
    // cleanup old hashes
    if (this.sentHashes.size > 100) {
      this.cleanup();
    }
  }
}
```

여기서 중요한 건 **cleanup strategy**다. 무한정 hash를 저장할 수 없으니까 적절한 시점에 정리해야 한다. AI에게 이 부분도 명시적으로 시켜야 한다:

> "hash Set 크기가 100을 넘으면 가장 오래된 50개를 제거해. LRU 패턴으로 관리하고, memory leak 방지해."

## singleton persistence — 상태를 어떻게 유지할 것인가

multi-session을 지원하는 LLM agent에서 가장 까다로운 건 상태 관리다. 각 session마다 독립적인 context를 유지하면서도, 전역적인 설정이나 캐시는 공유해야 한다.

처음엔 간단하게 in-memory Map으로 처리했는데, 서버가 재시작되면 모든 session이 날아갔다. 하지만 Redis 같은 external storage는 오버엔지니어링이었다.

이런 경우 AI에게 **hybrid approach**를 시킬 수 있다:

> "session 상태는 메모리에 저장하되, 중요한 데이터는 파일시스템에 백업해. 서버 재시작 시 자동으로 복구하고, 30초마다 dirty session만 disk에 동기화해. JSON 형태로 저장하고, corrupted file은 무시하고 새로 시작해."

Claude가 만든 코드는 대략 이렇다:

```typescript
class SessionManager {
  private sessions = new Map();
  private dirtySet = new Set();
  private persistPath = './sessions';

  constructor() {
    this.loadFromDisk();
    setInterval(() => this.syncToDisk(), 30000);
  }

  private async syncToDisk() {
    for (const sessionId of this.dirtySet) {
      const session = this.sessions.get(sessionId);
      await fs.writeFile(
        `${this.persistPath}/${sessionId}.json`,
        JSON.stringify(session)
      );
    }
    this.dirtySet.clear();
  }
}
```

핵심은 **AI에게 성능과 신뢰성의 트레이드오프를 명확히 알려주는 것**이다. "모든 변경을 즉시 저장"하면 너무 느리고, "메모리만 사용"하면 데이터가 날아간다. 그 중간 지점을 찾아서 구체적으로 지시한다.

또한 **error recovery 시나리오**도 미리 정의해야 한다:

> "disk에서 session 로딩 중 JSON parse 에러가 나면 해당 파일을 .corrupted로 rename하고 빈 session으로 시작해. 로그에 warning 남기고 계속 진행해."

## adapter pattern으로 non-interactive mode 통합하기

LLM provider마다 API 스펙이 다르다. Claude는 messages format, GPT는 chat completions, Gemini은 또 다른 구조다. 각각 다르게 처리하면 코드가 spaget화된다.

이걸 AI에게 리팩토링시킬 때는 **interface-first approach**로 접근한다:

> "모든 LLM adapter가 동일한 interface를 구현하게 리팩토링해줘. `BaseAdapter`를 만들고 `invoke()`, `stream()`, `configure()` 메소드를 정의해. 각 provider별 차이점은 내부에서만 처리하고, 외부에서는 동일하게 사용할 수 있게 해."

그런데 여기서 함정이 있다. AI가 만든 adapter pattern이 너무 generic하면 각 provider의 고유 기능을 활용할 수 없다. 예를 들어 Claude의 function calling이나 GPT의 structured output 같은 걸 못 쓰게 된다.

이때는 **progressive enhancement 패턴**을 추가로 시킨다:

> "기본 interface 외에 optional capabilities를 지원하게 해. `hasCapability('function_calling')` 메소드로 런타임에 체크하고, 지원하면 해당 기능을 사용하고 안 하면 graceful fallback하게 만들어."

```typescript
abstract class BaseAdapter {
  abstract invoke(prompt: string): Promise<string>;
  abstract stream(prompt: string): AsyncGenerator<string>;
  
  hasCapability(cap: string): boolean { return false; }
  
  // optional methods
  invokeWithFunctions?(prompt: string, functions: Function[]): Promise<any>;
}

class ClaudeAdapter extends BaseAdapter {
  hasCapability(cap: string): boolean {
    return ['function_calling', 'structured_output'].includes(cap);
  }
  
  invokeWithFunctions(prompt: string, functions: Function[]) {
    // Claude-specific implementation
  }
}
```

이렇게 하면 각 provider의 장점을 살리면서도 일관된 API를 유지할 수 있다.

## 더 나은 방법은 없을까

이 글에서 다룬 패턴들은 Node.js 환경에서 검증된 방법들이지만, 더 나은 대안들이 있다.

**dependency injection container 사용**: manual lazy loading 대신 `awilix` 같은 DI container를 쓰면 dependency lifecycle을 더 깔끔하게 관리할 수 있다. conditional registration도 지원한다.

**Redis Streams for SSE**: in-memory deduplication 대신 Redis Streams를 쓰면 horizontal scaling도 가능하고 automatic cleanup도 지원한다. 다만 인프라 복잡도가 올라간다.

**SQLite for session persistence**: 파일 기반 JSON 저장 대신 SQLite를 쓰면 transaction 보장과 쿼리 최적화를 얻을 수 있다. Node.js의 `better-sqlite3` 패키지가 성능도 좋다.

**OpenTelemetry integration**: 각 adapter별로 manual logging 대신 OpenTelemetry를 연동하면 distributed tracing과 메트릭 수집을 자동화할 수 있다.

특히 프로덕션 환경이라면 **circuit breaker pattern**도 필수다. LLM API가 down되거나 rate limit에 걸렸을 때 전체 시스템이 망가지지 않게 `opossum` 같은 라이브러리로 보호해야 한다.

성능 면에서는 **connection pooling**도 중요하다. HTTP/2 기반 provider들은 keep-alive connection을 재사용하면 latency를 크게 줄일 수 있다.

## 정리

프로덕션급 LLM agent를 만들 때 놓치기 쉬운 핵심 포인트들:

- lazy loading으로 optional dependency 문제 해결하고, fallback strategy를 명확히 정의한다
- SSE 중복 전송을 sequence number와 hash 기반으로 제거하되, memory cleanup을 잊지 않는다  
- session 상태는 메모리 + 주기적 disk 백업의 hybrid 방식으로 관리한다
- adapter pattern 쓸 때 progressive enhancement로 provider별 고유 기능을 살린다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>