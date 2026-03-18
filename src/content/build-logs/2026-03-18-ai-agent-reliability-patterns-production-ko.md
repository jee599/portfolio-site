---
title: "production 빌드하면서 깨달은 AI 에이전트 신뢰성 설계 패턴"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

AI 에이전트로 코드를 생성할 때 데모는 잘 되다가 production에서 터지는 경우가 많다. 이번에 LLMMixer라는 AI workflow 툴을 v0.3으로 업그레이드하면서 겪은 신뢰성 이슈들과 해결 방법을 정리한다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 Claude, GPT, Gemini 같은 여러 LLM을 조합해서 복잡한 개발 워크플로우를 자동화하는 툴이다. 사용자가 "이 기능 만들어줘"라고 하면 여러 AI 에이전트가 협력해서 코드를 작성하고, 테스트하고, 배포까지 처리한다.

이번 작업의 목표는 단순했다. 데모용으로 돌아가던 v0.2를 실제로 쓸 수 있는 수준으로 만드는 것. 하지만 막상 production 환경에서 테스트해보니 온갖 edge case에서 터졌다.

## 비동기 스트리밍에서 AI가 자주 실수하는 부분

AI 에이전트가 실시간으로 여러 작업을 처리할 때 가장 문제가 되는 건 중복 처리와 상태 동기화다. 특히 SSE(Server-Sent Events)로 실시간 업데이트를 보내는 상황에서 더욱 그렇다.

### 프롬프팅 전략: 상태 관리 제약 조건을 명시하라

AI에게 비동기 처리 코드를 짜달라고 할 때 이렇게 요청하면 안 된다:

> "SSE로 실시간 업데이트 보내는 코드 짜줘"

이렇게 해야 한다:

> "SSE 스트림에서 중복 이벤트 방지가 핵심이다. 각 클라이언트별로 `Set<string>`으로 전송한 이벤트 ID를 추적해서, 같은 ID는 절대 두 번 보내면 안 된다. 클라이언트 연결이 끊기면 해당 Set을 정리해야 한다. 그리고 동시에 여러 요청이 와도 singleton 패턴으로 같은 세션은 하나만 실행되어야 한다."

구체적인 제약 조건을 주니까 AI가 훨씬 정확한 코드를 생성한다:

```typescript
// AI가 생성한 코드
const clientEventSets = new Map<string, Set<string>>();

export async function streamSSE(clientId: string, sessionId: string) {
  if (!clientEventSets.has(clientId)) {
    clientEventSets.set(clientId, new Set());
  }
  
  const sentEvents = clientEventSets.get(clientId)!;
  const eventId = `${sessionId}-${timestamp}`;
  
  if (sentEvents.has(eventId)) {
    return; // 중복 전송 방지
  }
  
  sentEvents.add(eventId);
  // SSE 전송 로직
}
```

### Claude Code 활용법: custom instructions에 동시성 규칙 넣기

`CLAUDE.md`에 이런 규칙을 추가했다:

```markdown
## Concurrency Rules
- 모든 async 함수는 race condition을 고려한다
- singleton이 필요한 경우 Map<key, Promise>로 중복 실행을 방지한다
- 리소스 정리 로직을 반드시 포함한다
- setTimeout/setInterval은 cleanup 함수와 쌍으로 만든다
```

이렇게 하니까 AI가 알아서 cleanup 로직까지 생성한다. 예전에는 이런 부분을 사람이 직접 체크해야 했는데 이제는 AI가 먼저 고려한다.

### 멀티 어댑터 패턴에서 interface 일관성 보장하기

LLMMixer는 Claude, GPT, Gemini을 모두 지원하는데, 각각 API 스펙이 다르다. AI에게 새로운 어댑터를 추가하라고 할 때 이런 패턴이 효과적이다:

> "새 LLM 어댑터를 만들 건데, 기존 `BaseAdapter`를 상속받아야 한다. `processMessage()`, `validateResponse()`, `handleError()` 메서드는 반드시 구현해야 하고, 각 메서드의 시그니처는 절대 바뀌면 안 된다. 기존 claude.ts와 gemini.ts를 참고해서 같은 패턴으로 만들어라."

이렇게 하면 AI가 interface를 깨트리지 않고 일관성 있는 코드를 생성한다. 특히 TypeScript 환경에서는 컴파일 타임에 체크되니까 더 안전하다.

## interactive CLI에서 node-pty 활용하는 법

AI 에이전트가 사용자와 실시간으로 상호작용해야 할 때가 있다. 예를 들어 git merge conflict가 생겼을 때 사용자 승인을 받는다거나, 민감한 파일 수정 전에 확인을 요청하는 경우다.

### 프롬프팅 전략: lazy loading과 error handling 강조

`node-pty`는 native dependency라서 설치 실패가 자주 있다. AI에게 이런 모듈을 다룰 때는 반드시 fallback 전략을 포함시켜야 한다:

> "`node-pty`를 써서 interactive terminal을 만들어라. 하지만 이 모듈은 native dependency라서 실패할 수 있다. 그래서 lazy loading으로 실제 필요할 때만 `require()`하고, 실패하면 graceful degradation으로 일반 `process.stdin`을 쓰도록 해라. 사용자는 기능이 제한된다는 걸 몰라야 한다."

결과적으로 이런 패턴이 나온다:

```typescript
let nodepty: any = null;

async function createInteractiveSession() {
  if (!nodepty) {
    try {
      nodepty = require('node-pty');
    } catch (error) {
      console.warn('node-pty unavailable, falling back to basic mode');
      return createBasicSession();
    }
  }
  
  return nodepty.spawn('bash', [], {
    name: 'xterm-color',
    cwd: process.cwd(),
  });
}
```

### 신뢰성 패턴: trust 레벨을 단계별로 구분하기

AI 에이전트가 자동으로 실행할 수 있는 작업과 사용자 확인이 필요한 작업을 구분해야 한다. 이걸 AI에게 시킬 때는 구체적인 기준을 줘야 한다:

> "trust level을 3단계로 나눠라. HIGH는 파일 읽기, 코드 분석 등 안전한 작업. MEDIUM은 새 파일 생성, 설정 변경. LOW는 파일 삭제, 시스템 명령어 실행. MEDIUM 이하는 반드시 사용자 확인을 받아야 한다."

```typescript
enum TrustLevel {
  HIGH = 'high',    // 자동 실행 OK
  MEDIUM = 'medium', // 확인 필요
  LOW = 'low'       // 명시적 승인 필요
}

const actionTrust = {
  'readFile': TrustLevel.HIGH,
  'writeFile': TrustLevel.MEDIUM,
  'deleteFile': TrustLevel.LOW,
  'execCommand': TrustLevel.LOW,
};
```

이렇게 하니까 AI가 위험한 작업을 자동으로 실행하는 일이 줄어들었다.

## 대규모 리팩토링을 AI에게 안전하게 시키기

이번에 63개 파일, 7000줄 이상을 한 번에 리팩토링했는데, 이걸 AI에게 시키려면 단계적 접근이 필수다.

### 구조화 전략: 의존성 그래프 순서로 작업하기

큰 리팩토링을 AI에게 시킬 때 가장 중요한 건 순서다. 의존성이 있는 파일들을 잘못된 순서로 수정하면 중간에 빌드가 깨진다.

> "리팩토링 순서가 중요하다. 먼저 `packages/core/src/adapters/base.ts`부터 수정해라. 이게 모든 어댑터의 부모 클래스다. 그 다음에 개별 어댑터들(`claude.ts`, `gemini.ts`, `codex.ts`)을 수정하고, 마지막에 이들을 사용하는 상위 모듈들(`workflow-engine.ts`, `session-manager.ts`)을 수정해라. 각 단계가 끝나면 `npm run build`로 컴파일 에러가 없는지 확인하고 다음 단계로 넘어가라."

이렇게 하면 AI가 dependency 순서를 지켜가면서 안전하게 리팩토링한다.

### slash commands로 코드 리뷰 자동화

Claude Code에서 `/review` 명령어를 커스터마이징했다:

```markdown
# Custom /review command
- 타입 안전성 체크 (any 타입 사용 금지)
- async/await 패턴 일관성
- error handling 누락 여부
- memory leak 가능성 (event listener, timer 정리)
- race condition 위험성
```

이렇게 하니까 AI가 코드 리뷰할 때도 일관된 기준을 적용한다. 사람이 놓치기 쉬운 memory leak 같은 부분까지 잡아낸다.

## 더 나은 방법은 없을까

지금까지 설명한 방법들보다 더 효율적인 대안들이 있다.

**MCP(Model Context Protocol) 서버 활용**: 이번에는 직접 API를 호출했지만, 최근 나온 MCP 서버를 쓰면 더 깔끔하다. 특히 `@modelcontextprotocol/server-git`을 쓰면 git 워크플로우를 AI가 직접 처리할 수 있다. 다음 버전에서는 이걸로 교체할 예정이다.

**GitHub Copilot Workspace vs Claude Code**: 이런 대규모 리팩토링은 Copilot Workspace가 더 적합할 수도 있다. 전체 repository context를 한 번에 파악하는 능력이 Claude Code보다 낫다. 하지만 fine-grained control은 Claude Code가 더 좋다.

**Streaming vs Batch processing**: 지금은 실시간 스트리밍으로 했지만, 복잡한 워크플로우는 batch로 처리하고 결과만 알림 주는 게 더 안정적일 수 있다. 특히 네트워크 불안정한 환경에서는 더욱 그렇다.

**Type-first development**: TypeScript 타입을 먼저 정의하고 AI에게 구현하라고 시키는 게 더 안전하다. 이번에는 기존 코드를 리팩토링하느라 이 방식을 못 썼는데, 새 프로젝트에서는 이 패턴을 쓸 예정이다.

## 정리

- AI에게 비동기 코드 짤 때는 race condition과 cleanup 로직을 명시적으로 요구해야 한다
- `CLAUDE.md`에 concurrency 규칙을 넣으면 AI가 더 안전한 코드를 생성한다
- 대규모 리팩토링은 의존성 그래프 순서로 단계별로 진행해야 한다
- native dependency는 반드시 lazy loading과 fallback 전략을 포함해야 한다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>