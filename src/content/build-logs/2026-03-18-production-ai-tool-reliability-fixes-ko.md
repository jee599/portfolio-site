---
title: "프로덕션 AI 툴 안정화하기 — reliability critical issues 해결 전략"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer라는 AI 개발 툴을 만들면서 가장 힘든 단계를 지나왔다. v0.3으로 올리면서 겪은 프로덕션 안정성 문제들과, 이걸 AI와 함께 어떻게 해결했는지 공유한다. interactive CLI, SSE 중복 처리, lazy loading 같은 까다로운 문제들을 체계적으로 접근하는 법을 배울 수 있다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 여러 LLM 모델을 동시에 쓸 수 있는 개발 도구다. Claude, GPT, Gemini를 섞어서 쓸 수 있고, 워크플로우를 자동화할 수 있다. 지금까지는 기능 구현에 집중했는데, 이제 실제 운영 환경에서 쓸 수 있도록 안정성을 높여야 하는 단계다.

이번 작업의 핵심은 세 가지였다:
- interactive CLI를 위한 `node-pty` 통합 (pseudo terminal)
- SSE 스트리밍에서 중복 메시지 제거 
- lazy loading과 singleton 패턴으로 메모리 최적화

7356줄이 추가되고 523줄이 삭제된 대규모 리팩토링이었다. 이걸 혼자 했다면 며칠은 걸렸을 텐데, AI를 적극 활용해서 하루 만에 끝냈다.

## node-pty 통합: interactive CLI 구현하기

가장 복잡했던 건 `node-pty` 통합이었다. 일반 `child_process`로는 interactive shell 명령어(`git add -i`, `npm init` 같은)를 제대로 처리할 수 없다. pseudo terminal이 필요하다.

### 프롬프팅 전략

이런 시스템 레벨 작업을 AI에게 시킬 때는 **제약 조건을 명확히** 해야 한다. 

좋은 프롬프트:

> `node-pty`를 써서 interactive CLI 명령어를 실행하는 adapter를 만들어줘. 조건:
> 1. lazy loading으로 `require('node-pty')`는 실제 사용할 때만 
> 2. non-interactive 모드에서는 기존 `child_process` 유지 
> 3. Windows/Linux/macOS 모두 지원
> 4. terminal resize 이벤트 처리
> 5. 기존 `BaseAdapter` 인터페이스 호환

나쁜 프롬프트:
> `node-pty` 써서 터미널 기능 만들어줘

차이가 보이나? 첫 번째는 구체적인 아키텍처 결정을 포함한다. AI가 추상적으로 접근하지 않고 정확히 내가 원하는 방향으로 코드를 짠다.

### lazy loading 패턴 활용

`node-pty`는 native module이라 import 비용이 크다. 모든 사용자가 interactive CLI를 쓰는 건 아니니까 lazy loading을 적용했다.

```typescript
// Bad: 모듈 top-level에서 import
import { spawn as ptySpawn } from 'node-pty';

// Good: 필요할 때만 require
private lazyLoadNodePty() {
  if (!this.pty) {
    this.pty = require('node-pty');
  }
  return this.pty;
}
```

AI에게 이 패턴을 요청할 때는 "performance critical path"라는 용어를 썼다. 단순히 "최적화해줘"보다 구체적이다.

### 플래그 기반 모드 전환

interactive 모드와 non-interactive 모드를 자동으로 감지하게 하면 예상치 못한 동작이 생긴다. 명시적 플래그로 제어한다.

```typescript
interface ExecuteOptions {
  interactive?: boolean;
  trusted?: boolean;  // auto-respond to prompts
}
```

AI에게 boolean flag 설계를 맡길 때는 **default 값을 미리 정해줘야** 한다. 안 그러면 `undefined` 처리가 애매해진다.

## SSE 중복 제거: 실시간 스트리밍 품질 올리기

Server-Sent Events로 실시간 업데이트를 보내는데, 같은 메시지가 중복으로 가는 문제가 있었다. 사용자 경험이 엉망이 된다.

### 상태 기반 중복 제거 로직

단순한 message ID 비교로는 부족하다. 워크플로우 상태까지 고려해야 한다.

프롬프트 예시:

> SSE 메시지 중복을 제거하는 deduplication 로직을 만들어줘. 조건:
> 1. message ID + timestamp 조합으로 uniqueness 보장
> 2. workflow state 변화는 항상 전송 (중복이어도)
> 3. 같은 session 내에서만 dedup 적용
> 4. memory leak 방지를 위해 10분 후 자동 cleanup
> 5. concurrent 요청에서도 thread-safe

구체적인 edge case를 나열하는 게 핵심이다. AI가 이런 세부사항을 놓치는 경우가 많다.

### WeakMap으로 메모리 관리

중복 제거를 위해 메시지 히스토리를 저장해야 하는데, memory leak이 생기면 안 된다. `WeakMap`을 써서 session 객체가 GC될 때 자동으로 정리되게 했다.

```typescript
private dedupCache = new WeakMap<Session, Set<string>>();
```

이런 메모리 관리 패턴을 AI에게 요청할 때는 "garbage collection friendly"라고 명시한다. 단순히 "메모리 최적화"라고 하면 다른 방향으로 갈 수 있다.

## adapter 아키텍처 개선: 확장성과 안정성

여러 LLM provider를 지원하려면 adapter 패턴이 필수다. 하지만 각 provider마다 특성이 달라서 공통 인터페이스 설계가 까다롭다.

### 상속보다 composition

기존에는 `BaseAdapter`를 상속하는 구조였는데, 이걸 composition으로 바꿨다. mixin 패턴을 써서 필요한 기능만 조합할 수 있게 했다.

프롬프트:

> BaseAdapter를 composition pattern으로 리팩토링해줘. 요구사항:
> 1. StreamingMixin - SSE 스트리밍 기능
> 2. InteractiveMixin - CLI interaction  
> 3. CachingMixin - response 캐싱
> 4. 각 mixin은 독립적으로 테스트 가능
> 5. TypeScript interface segregation 원칙 준수

"interface segregation principle"처럼 디자인 패턴 용어를 쓰면 AI가 더 정확한 코드를 짠다.

### 에러 처리 표준화

각 adapter마다 에러 처리 방식이 달랐다. OpenAI는 HTTP status code를, Claude는 자체 error type을 쓴다. 이걸 통일하는 작업이 필요했다.

```typescript
interface AdapterError {
  code: 'RATE_LIMIT' | 'AUTH_FAILED' | 'NETWORK_ERROR' | 'UNKNOWN';
  provider: string;
  originalError: unknown;
  retryable: boolean;
}
```

AI에게 error mapping을 시킬 때는 각 provider의 공식 문서 링크를 같이 준다. AI가 최신 에러 코드를 정확히 매핑할 수 있다.

## 더 나은 방법은 없을까

이 글에서 다룬 방식들은 현재 시점에서 최선이었지만, 더 나은 대안들이 있다.

**Deno 활용**
`node-pty` 대신 Deno의 built-in subprocess API를 쓰면 더 간단하다. native dependency 없이 interactive shell을 처리할 수 있다. 하지만 Node.js 생태계와의 호환성을 포기해야 한다.

**Rust binding**
성능이 중요하다면 Rust로 core logic을 짜고 NAPI로 binding하는 게 낫다. 특히 대용량 워크플로우 처리에서는 JavaScript bottleneck이 심하다.

**GraphQL subscription**
SSE 대신 GraphQL subscription을 쓰면 type safety와 실시간 업데이트를 둘 다 얻을 수 있다. Apollo Server의 subscription resolver가 중복 제거까지 알아서 해준다.

**Temporal.io**
워크플로우 엔진을 직접 만들지 말고 Temporal을 써라. 복잡한 state management와 retry logic을 프레임워크가 처리해준다. reliability가 핵심이라면 이게 정답이다.

## 정리

- AI에게 시스템 레벨 작업을 시킬 때는 제약 조건과 edge case를 명확히 명시해야 한다
- lazy loading과 composition pattern으로 확장성과 성능을 동시에 잡을 수 있다  
- 프로덕션 도구에서는 error handling 표준화가 사용자 경험을 좌우한다
- memory management는 "GC friendly" 같은 구체적 용어로 AI를 가이드해야 한다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>