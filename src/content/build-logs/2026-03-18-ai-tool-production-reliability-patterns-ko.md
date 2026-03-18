---
title: "프로덕션 AI 도구 만들 때 놓치기 쉬운 안정성 패턴들"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer라는 AI 에이전트 도구를 만들면서 v0.3으로 메이저 업데이트를 했다. 커밋 로그만 보면 평범한 기능 추가 같지만, 실제로는 프로덕션에서 쓸 수 있는 도구와 데모용 프로토타입을 가르는 결정적인 차이들을 해결한 작업이었다. 이 과정에서 AI에게 어떻게 안정성 패턴을 학습시키고, 복잡한 비동기 시스템을 구조화해서 개발하는지 깊이 파봤다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 여러 LLM(Claude, GPT, Gemini)을 workflow 단위로 조합해서 복잡한 작업을 처리하는 도구다. 사용자가 요청을 던지면 여러 AI 모델이 협업해서 코드를 분석하고, 작업을 분해하고, 실행까지 해준다.

v0.2까지는 "일단 돌아가게" 만든 프로토타입이었다. 하지만 실제로 써보니 interactive CLI 작업에서 뻗거나, SSE 연결이 중복으로 쌓이거나, 세션 상태가 꼬이는 문제들이 계속 발생했다. 근본적으로 비동기 처리와 상태 관리 로직을 다시 설계해야 했다.

이번 작업의 목표는 단순했다. "프로덕션에서 믿고 쓸 수 있는 안정성"이다.

## node-pty 연동으로 배우는 AI 제약 조건 설계

가장 까다로웠던 부분은 `node-pty`를 써서 interactive CLI 명령어를 처리하는 기능이었다. `git commit -i`나 `npm init` 같은 명령어는 사용자 입력을 실시간으로 받아야 하는데, 이걸 AI 에이전트가 자동으로 처리하게 만들어야 했다.

**일반적인 접근법으로는 실패한다**

처음엔 이렇게 프롬프트를 줬다:

> "node-pty를 써서 interactive CLI 명령어를 처리하는 코드를 만들어줘. stdin/stdout을 연결해서 실시간으로 응답할 수 있게 해."

결과는 참혹했다. AI가 만든 코드는 기본적인 `pty.spawn()` 예제 수준이었고, 실제 프로덕션 환경에서 발생하는 문제들을 전혀 고려하지 않았다. lazy loading도 없고, error handling도 부실하고, memory leak까지 있었다.

**제약 조건부터 명확히 해야 한다**

문제는 AI에게 "뭘 만들어야 하는지"만 말하고 "어떤 제약 조건 안에서 만들어야 하는지"를 안 알려준 것이었다. 두 번째 시도에선 이렇게 접근했다:

> "node-pty 연동 코드를 만드는데, 다음 제약 조건들을 반드시 지켜야 한다:
> 
> 1. lazy loading: `require('node-pty')`는 실제로 필요할 때만 호출
> 2. singleton pattern: 동일한 session에서는 pty 인스턴스 재사용
> 3. timeout handling: interactive 명령어가 30초 넘게 응답 없으면 자동 종료
> 4. trust mode: auto-respond 플래그가 켜져 있으면 기본값으로 자동 응답
> 5. memory cleanup: pty 프로세스 종료 시 반드시 리소스 정리
> 
> 현재 시스템은 `BaseAdapter` 클래스를 상속받는 구조이고, `executeCommand()` 메서드 안에서 처리해야 한다. TypeScript로 작성하고, error는 structured logging으로 남겨야 한다."

이렇게 제약 조건을 구체적으로 주니까 AI가 만든 코드가 완전히 달라졌다:

```typescript
// lazy loading으로 memory footprint 최소화
let pty: typeof import('node-pty') | null = null;

async executeCommand(command: string, options: ExecuteOptions = {}): Promise<ExecuteResult> {
  if (this.isInteractive(command)) {
    if (!pty) {
      pty = require('node-pty');
    }
    return this.executeInteractive(command, options);
  }
  return this.executeNonInteractive(command, options);
}
```

**trust auto-respond 패턴이 핵심이다**

interactive CLI에서 가장 까다로운 부분은 "언제 자동으로 응답하고, 언제 사용자 입력을 기다려야 하는가"였다. AI에게 이런 패턴을 가르쳤다:

> "trust 모드가 켜져 있으면 일반적인 질문들(계속 진행할까요? y/N)에는 기본값으로 자동 응답한다. 하지만 중요한 설정값이나 비가역적인 작업(파일 삭제, 배포 등)은 반드시 사용자 확인을 받아야 한다. 
>
> 자동 응답 가능한 패턴을 정규식으로 정의하고, 매치되지 않는 경우엔 timeout 후에 safe default를 선택하게 만들어라."

이 프롬프팅으로 나온 코드가 정말 똑똑했다. `Continue? [Y/n]` 같은 건 자동으로 Y를 보내지만, `Delete all files? [y/N]` 같은 건 N을 보내면서 사용자에게 알림을 띄운다.

## SSE 중복 연결과 singleton 패턴의 함정

두 번째 큰 문제는 Server-Sent Events 연결이 중복으로 쌓이는 버그였다. 사용자가 브라우저를 새로고침하거나 여러 탭을 열면 SSE 연결이 계속 쌓이면서 같은 이벤트가 여러 번 전송되는 문제가 있었다.

**naive singleton은 오히려 독이다**

처음엔 단순하게 생각했다. "SSE 연결을 singleton으로 관리하면 되겠네." AI에게도 그렇게 요청했다:

> "SSE 연결을 singleton 패턴으로 관리해서 중복 연결을 방지해줘."

하지만 AI가 만든 코드는 전형적인 naive singleton이었다:

```typescript
// 이렇게 하면 안 된다
class SSEManager {
  private static instance: SSEManager;
  private connections: Response[] = [];
  
  static getInstance() {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }
}
```

문제는 웹 환경에서는 연결이 끊어졌는지 서버에서 감지하기 어렵다는 것이다. 사용자가 브라우저를 닫아도 `connections` 배열에는 끊어진 연결들이 계속 쌓인다.

**connection lifecycle을 명시적으로 관리해야 한다**

두 번째 프롬프트는 이 문제를 정면으로 다뤘다:

> "SSE 연결 관리 코드를 만드는데, 다음 요구사항을 지켜야 한다:
> 
> 1. client ID 기반으로 연결을 식별 (IP 주소 + user agent hash)
> 2. 새 연결이 오면 같은 client ID의 기존 연결은 명시적으로 close
> 3. heartbeat으로 dead connection을 5분마다 정리
> 4. connection close 이벤트를 listen해서 배열에서 즉시 제거
> 5. 메모리 leak 방지를 위해 WeakMap 사용 검토
> 
> Next.js API routes 환경에서 동작해야 하고, edge runtime 호환성도 고려해야 한다."

이 프롬프트로 나온 코드는 훨씬 robust했다:

```typescript
class SSEConnectionManager {
  private connections = new Map<string, Response>();
  private heartbeatInterval: NodeJS.Timeout;
  
  addConnection(clientId: string, response: Response) {
    // 기존 연결이 있다면 명시적으로 종료
    const existing = this.connections.get(clientId);
    if (existing) {
      this.closeConnection(existing);
    }
    
    this.connections.set(clientId, response);
    
    // connection close 이벤트 처리
    response.addEventListener('close', () => {
      this.connections.delete(clientId);
    });
  }
  
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.cleanupDeadConnections();
    }, 300000); // 5분
  }
}
```

## 멀티 adapter 시스템의 상태 관리

LLMMixer는 Claude, GPT, Gemini 등 여러 LLM을 동시에 사용할 수 있는데, 각 adapter가 독립적으로 동작하면서도 전체 workflow context를 공유해야 한다. 이게 생각보다 복잡했다.

**adapter간 상태 공유는 message passing으로**

초기엔 global state를 만들어서 모든 adapter가 참조하게 했다. 하지만 이러면 한 adapter에서 발생한 오류가 다른 adapter에까지 영향을 준다. AI에게 이런 구조를 제안했다:

> "각 LLM adapter는 stateless하게 만들되, 필요한 context는 message passing으로 전달받게 해줘. adapter끼리 직접 통신하지 말고, WorkflowEngine이 중앙에서 coordination하게 만들어라.
>
> adapter가 실패해도 전체 workflow는 계속 진행될 수 있게 isolation을 보장해야 한다. timeout, retry, circuit breaker 패턴을 적용해줘."

이렇게 접근하니까 각 adapter의 책임이 명확해졌다. Claude adapter가 뻗어도 Gemini adapter는 정상 동작하고, WorkflowEngine에서 fallback 로직을 처리할 수 있게 됐다.

**non-interactive mode 처리가 함정이다**

또 다른 문제는 같은 adapter라도 interactive mode와 non-interactive mode에서 동작이 달라야 한다는 것이었다. 예를 들어 코드 분석 작업은 non-interactive로 빠르게 처리하지만, 사용자 확인이 필요한 작업은 interactive mode로 전환해야 한다.

AI에게 이런 패턴을 가르쳤다:

> "BaseAdapter에 `mode` 필드를 추가하고, runtime에 동적으로 전환할 수 있게 만들어라. 하지만 mode 전환 중에는 다른 작업을 블록하면 안 된다. concurrent mode switching을 지원해야 한다."

```typescript
abstract class BaseAdapter {
  private mode: 'interactive' | 'non-interactive' | 'switching' = 'non-interactive';
  
  async switchMode(newMode: 'interactive' | 'non-interactive'): Promise<void> {
    if (this.mode === 'switching') {
      await this.waitForModeSwitch();
    }
    
    this.mode = 'switching';
    // mode-specific cleanup/setup 로직
    this.mode = newMode;
  }
}
```

## 더 나은 방법은 없을까

이번 작업을 마치고 보니 더 좋은 대안들이 몇 가지 보인다.

**MCP(Model Context Protocol) 활용**

Anthropic에서 최근 발표한 MCP를 쓰면 node-pty 연동 부분을 훨씬 깔끔하게 처리할 수 있다. MCP server로 terminal 기능을 분리하면 main process에서 subprocess 관리 부담이 줄어든다.

```json
{
  "mcpServers": {
    "terminal": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-terminal"],
      "capabilities": ["interactive_shell", "subprocess"]
    }
  }
}
```

**React Server Components for SSE**

Next.js 14의 Server Components와 Suspense를 조합하면 SSE 연결 관리가 더 간단해진다. connection lifecycle을 React가 알아서 처리해주기 때문이다.

**WebSocket 대신 EventSource 표준**

현재는 custom SSE 구현을 쓰고 있는데, 표준 EventSource API를 쓰면 browser-level에서 reconnection이나 error handling을 더 robust하게 처리할 수 있다.

**Temporal.io workflow engine**

복잡한 multi-step workflow는 Temporal.io 같은 전문 도구가 훨씬 낫다. retry, timeout, compensation 로직을 선언적으로 정의할 수 있어서 코드가 훨씬 간결해진다.

## 정리

- AI에게 제약 조건을 구체적으로 명시하면 프로덕션 레벨 코드가 나온다
- singleton 패턴은 lifecycle 관리와 함께 써야 의미가 있다
- 상태 공유보다는 message passing으로 isolation을 보장하는 게 안전하다
- interactive/non-interactive mode 전환은 runtime에 동적으로 처리해야 한다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>