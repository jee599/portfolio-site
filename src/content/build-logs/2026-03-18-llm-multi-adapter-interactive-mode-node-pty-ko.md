---
title: "LLM 멀티 어댑터 시스템에서 interactive 모드 구현하기 — node-pty와 상태 관리의 함정"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer v0.3 작업을 하면서 Claude, Codex, Gemini 어댑터들에 interactive CLI 모드를 추가했다. 단순해 보이는 작업이었지만 `node-pty` lazy loading, 상태 persistence, SSE deduplication까지 손봐야 했다. 이 글에서는 멀티 LLM 시스템에서 안정성을 확보하는 프롬프팅과 구조화 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 여러 LLM을 하나의 워크플로우로 묶어서 사용하는 도구다. Claude는 코드 분석, Gemini는 문서 생성, Codex는 구현 이런 식으로 각자 잘하는 일을 맡긴다. 기존에는 API 기반 텍스트 교환만 지원했는데, 이번에는 터미널 세션처럼 대화형으로 작업할 수 있게 만들어야 했다.

문제는 각 어댑터마다 interactive 모드 구현 방식이 달랐다는 것이다. Claude는 streaming response, Gemini는 batch processing, Codex는 실시간 completion. 이걸 하나의 일관된 인터페이스로 통합해야 했다.

## AI에게 어댑터 패턴 리팩토링 맡기기

### 프롬프팅 전략

멀티 어댑터 시스템을 AI에게 리팩토링 맡길 때는 **제약 조건을 명확히** 줘야 한다. 각 어댑터의 특성을 무시하고 하나로 통일하려다 보면 성능이 망가진다.

> "3개 어댑터(`claude.ts`, `codex.ts`, `gemini.ts`)에서 interactive 모드를 지원하도록 refactor해라. 단, 각 어댑터의 기존 특성은 유지한다:
> - Claude: streaming response 유지
> - Gemini: batch processing 방식 유지 (chunk 단위)  
> - Codex: real-time completion 유지
> 
> `BaseAdapter`에 `supportsInteractive()` 메서드 추가하고, non-interactive 모드에서는 기존 동작 그대로 두어라. `node-pty` dependency는 lazy load로 처리한다."

이렇게 쓰면 안 된다:

> "어댑터들에 interactive 모드 추가해줘"

두 번째 프롬프트는 AI가 모든 어댑터를 똑같이 만들어버린다. 첫 번째는 각자의 특성을 보존하면서 공통 인터페이스만 추가한다.

### Claude Code 활용법

`CLAUDE.md`에 아키텍처 원칙을 명시해두면 일관성 있는 코드를 만들어준다:

```markdown
## Adapter Pattern Rules
- BaseAdapter 상속 시 기존 메서드 signature 변경 금지
- interactive 관련 기능은 optional로 구현
- 각 어댑터의 response format 통일하지 말 것
- node-pty는 runtime에만 require() 사용
```

이렇게 해두니 AI가 `BaseAdapter`를 건드릴 때 기존 코드를 안 깨뜨렸다. `/refactor` 명령어로 전체 구조를 바꿀 때도 이 원칙들을 지켰다.

### 구조화 전략

큰 작업을 쪼갤 때는 **의존성 순서대로** 진행한다:

1. `BaseAdapter`에 abstract 메서드만 추가
2. 각 어댑터에서 구현체 작성  
3. `WorkflowEngine`에서 interactive 모드 연결
4. dashboard API에서 SSE 통합

이 순서를 바꾸면 중간에 타입 에러가 쌓여서 AI가 혼란스러워한다. 특히 TypeScript 프로젝트에서는 컴파일 에러 없는 상태를 유지하면서 단계별로 진행해야 한다.

## node-pty lazy loading으로 production 안정성 확보하기

### 문제 상황

`node-pty`는 native dependency라서 Docker나 serverless 환경에서 문제를 일으킨다. 모든 어댑터가 시작할 때 무조건 로드하면 production에서 크래시가 난다.

### 프롬프팅 전략

> "`node-pty` require()를 lazy load로 바꿔라. `supportsInteractive()`가 true일 때만 로드하고, 로드 실패 시 graceful degradation으로 non-interactive 모드로 fallback한다. 
>
> 각 어댑터에서 `this.pty` 사용하기 전에 반드시 availability check를 넣어라. production 환경에서 interactive 기능이 없어도 core 기능은 정상 동작해야 한다."

이 프롬프트의 핵심은 **graceful degradation**이다. native dependency가 없어도 앱이 죽지 않게 만드는 것이다.

### 구현 결과

AI가 이런 패턴을 만들어줬다:

```typescript
private async ensurePty(): Promise<boolean> {
  if (this.ptyLoaded) return true;
  
  try {
    const pty = require('node-pty');
    this.ptyInstance = pty;
    this.ptyLoaded = true;
    return true;
  } catch (error) {
    console.warn('node-pty not available, falling back to non-interactive mode');
    return false;
  }
}
```

production에서 `node-pty`가 없으면 경고만 출력하고 계속 진행한다. interactive 기능만 비활성화되고 나머지는 정상 동작한다.

## SSE deduplication과 singleton 상태 관리

### 문제 상황

여러 클라이언트가 같은 workflow에 접속하면 중복 SSE 스트림이 생긴다. 상태도 각자 따로 관리해서 inconsistency가 발생했다.

### 프롈프팅 전략

상태 관리 문제를 AI에게 맡길 때는 **race condition 시나리오**를 구체적으로 제시한다:

> "SSE route에서 중복 connection 문제를 해결해라. 시나리오:
> 1. Client A가 workflow-123에 SSE 연결
> 2. Client B가 같은 workflow-123에 SSE 연결  
> 3. workflow 상태 변경 시 A, B 모두에게 한 번씩만 전송
> 4. A가 연결 끊으면 B는 계속 받아야 함
> 5. 모든 client가 끊어지면 workflow cleanup
>
> SessionManager에서 Map<workflowId, Set<Response>> 구조로 관리하고, connection cleanup hook 추가해라."

이렇게 시나리오를 나열하면 AI가 edge case까지 고려한 코드를 만든다. 단순히 "중복 제거해줘"라고 하면 기본적인 dedup만 하고 끝난다.

### 구현된 패턴

AI가 만들어준 SessionManager:

```typescript
private sseConnections = new Map<string, Set<Response>>();

addSSEConnection(workflowId: string, response: Response) {
  if (!this.sseConnections.has(workflowId)) {
    this.sseConnections.set(workflowId, new Set());
  }
  this.sseConnections.get(workflowId)!.add(response);
}

broadcast(workflowId: string, data: any) {
  const connections = this.sseConnections.get(workflowId);
  if (!connections) return;
  
  connections.forEach(response => {
    if (!response.writableEnded) {
      response.write(`data: ${JSON.stringify(data)}\n\n`);
    } else {
      connections.delete(response); // cleanup dead connections
    }
  });
}
```

connection이 끊어진 response는 자동으로 정리하고, 살아있는 것들에게만 broadcast한다.

## trust auto-respond로 UX 개선하기

### 배경

interactive 모드에서 사용자가 매번 "계속 진행해도 되나요?"를 확인받는 건 번거롭다. 특히 코드 generation 작업에서는 중간에 멈추면 컨텍스트가 끊긴다.

### 프롬프팅 전략

> "workflow에서 `trustAutoRespond` flag 추가해라. true일 때는 intermediate step에서 user confirmation 없이 자동으로 다음 단계 진행한다. 
>
> 단, 다음 경우는 예외로 반드시 user input 받는다:
> - 파일 삭제나 overwrite
> - API 호출이나 external service 연결
> - git push나 deploy 같은 irreversible action
> 
> `WorkflowEngine`에서 각 step의 `requiresConfirmation` 속성을 체크해서 판단한다."

이 프롬프트는 **안전한 자동화**에 초점을 맞췄다. 위험한 작업은 여전히 확인받지만, 읽기 전용이나 local 작업은 자동으로 넘어간다.

### 실제 적용

AI가 workflow step 분류를 이렇게 처리했다:

```typescript
const SAFE_AUTO_STEPS = ['analyze', 'generate', 'format', 'validate'];
const RISKY_STEPS = ['delete', 'overwrite', 'deploy', 'publish'];

shouldAutoRespond(step: WorkflowStep): boolean {
  if (!this.config.trustAutoRespond) return false;
  return !RISKY_STEPS.some(risk => step.action.includes(risk));
}
```

사용자가 trust mode를 켜면 안전한 작업들은 자동으로 진행하고, 위험한 건 여전히 물어본다.

## 더 나은 방법은 없을까

이 글에서 다룬 방식들보다 더 좋은 대안들이 있다:

**node-pty 대신 Web Workers 활용**
최신 브라우저에서는 Web Workers로 terminal emulation을 구현할 수 있다. `xterm.js` + Web Workers 조합이 더 안정적이고 cross-platform compatibility도 좋다. native dependency를 피할 수 있어서 Docker나 serverless 환경에서 문제가 없다.

**SSE 대신 WebSocket with heartbeat**
SSE는 단방향이라 client가 연결 끊어진 걸 server에서 감지하기 어렵다. WebSocket + ping/pong heartbeat 패턴이 connection management 측면에서 더 robust하다. 특히 mobile network에서 connection drop을 빠르게 감지할 수 있다.

**Singleton 대신 Redis pub/sub**
지금은 in-memory Map으로 상태를 관리하지만, 서버가 restart되면 모든 상태가 날아간다. Redis pub/sub으로 바꾸면 persistence와 horizontal scaling이 가능하다. multiple server instance 간 state sync도 자동으로 해결된다.

**trust 모드 대신 capability-based security**
현재는 binary flag(`trustAutoRespond`)로 처리하지만, 더 세밀한 permission system이 필요하다. "파일 읽기는 OK, API 호출은 특정 domain만" 같은 capability-based approach가 보안 측면에서 더 안전하다.

## 정리

- node-pty 같은 native dependency는 lazy loading + graceful degradation으로 처리한다
- 멀티 어댕터 리팩토링 시 각 어댑터의 고유 특성을 보존하는 제약 조건을 명시한다  
- SSE deduplication은 구체적인 race condition 시나리오를 제시해서 AI가 edge case까지 고려하게 한다
- 자동화 기능은 안전한 작업과 위험한 작업을 명확히 구분해서 구현한다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>