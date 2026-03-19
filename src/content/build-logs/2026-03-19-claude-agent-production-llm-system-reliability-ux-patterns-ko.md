---
title: "Claude 에이전트로 프로덕션급 LLM 시스템 구축하기 — 신뢰성과 UX 개선 패턴"
project: "llmmixer_claude"
date: 2026-03-19
lang: ko
tags: [fix, feat, typescript, css]
---

LLM을 이용한 워크플로우 엔진인 LLMMixer v0.3을 개발하면서 프로덕션 환경에서 마주치는 실제 문제들을 Claude와 함께 해결했다. 이 글에서는 AI 시스템의 신뢰성을 높이고 사용자 경험을 개선하는 구체적인 프롬프팅 패턴과 개발 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 Claude, Codex, Gemini 같은 여러 LLM을 orchestration하는 워크플로우 엔진이다. 사용자가 복잡한 작업을 요청하면 이를 여러 단계로 분해하고, 각 단계를 적절한 LLM에 할당해서 실행한다.

이번 작업의 목표는 v0.2에서 발견된 치명적인 신뢰성 문제들을 해결하고, 실시간 터미널 인터랙션 기능을 추가하는 것이었다. 단순한 기능 추가가 아니라 프로덕션에서 안정적으로 동작할 수 있는 시스템을 만드는 것이 핵심이었다.

## Claude에게 시스템 아키텍처 리팩토링 시키기

복잡한 시스템을 리팩토링할 때는 Claude에게 단순히 "고쳐줘"라고 하면 안 된다. 구체적인 제약 조건과 우선순위를 명확히 해야 한다.

### 효과적인 아키텍처 리팩토링 프롬프트

> "이 LLM adapter 시스템에서 발생하는 race condition과 memory leak을 해결해야 한다. 현재 문제점:
> 1. 여러 세션이 동시에 실행될 때 상태가 꼬임 
> 2. `node-pty` 프로세스가 정리되지 않음
> 3. SSE 스트림에서 중복 이벤트 발생
> 
> 제약 조건:
> - 기존 API 인터페이스는 유지
> - singleton pattern 사용 금지 (테스트 어려움)
> - 메모리 사용량 < 100MB per session
> 
> 해결 순서: 1) 상태 관리 분리 2) 리소스 정리 자동화 3) 이벤트 중복 제거"

이렇게 쓰면 안 된다:
> "코드가 불안정해. 고쳐줘"

핵심은 **문제의 증상이 아니라 근본 원인**을 명시하고, **기술적 제약 조건**을 구체적으로 제시하는 것이다. Claude는 이런 구조화된 정보가 있어야 올바른 설계 결정을 내릴 수 있다.

### lazy loading과 resource management 패턴

특히 `node-pty` 같은 native dependency가 들어간 모듈은 require() 시점을 조절해야 한다. Claude에게 이런 패턴을 가르쳐주면 매우 효과적이다:

```typescript
// lazy loading 패턴
let nodeProcessInstance: any = null;

function getNodeProcess() {
  if (!nodeProcessInstance) {
    try {
      nodeProcessInstance = require('node-pty');
    } catch (error) {
      throw new Error(`node-pty not available: ${error.message}`);
    }
  }
  return nodeProcessInstance;
}
```

Claude에게 이 패턴을 알려주면서 "프로덕션에서 optional dependency를 다룰 때는 항상 이렇게 해"라고 명시했다. 결과적으로 다른 adapter들에서도 일관된 패턴을 적용할 수 있었다.

## 실시간 인터랙션을 위한 프롬프팅 전략

터미널 기반의 대화형 LLM 시스템을 만들 때 가장 어려운 부분은 **사용자 입력의 의도를 정확히 파악**하는 것이다. 사용자가 "yes"라고 입력했을 때, 이게 workflow 진행 승인인지 단순한 답변인지 구분해야 한다.

### context-aware 응답 처리 프롬프트

> "사용자 터미널 입력을 분석해서 적절한 action을 결정해야 한다.
> 
> 현재 workflow 상태: `${workflowState}`
> 대기 중인 approval: `${pendingApproval}`
> 사용자 입력: `${userInput}`
> 
> 판단 기준:
> - 'y', 'yes', 'ok', 'proceed' → approval
> - 'n', 'no', 'cancel', 'stop' → rejection  
> - 그 외는 일반 채팅으로 처리
> - approval 대기 상태가 아니면 모든 입력을 채팅으로 처리
> 
> 응답 형식: `{"action": "approve|reject|chat", "confidence": 0.95}`"

이 패턴의 핵심은 **workflow의 현재 상태를 context로 제공**하는 것이다. LLM이 단순히 텍스트를 분류하는 게 아니라, 시스템의 현재 상태를 고려해서 의도를 파악할 수 있다.

### auto-respond 기능 구현

반복적인 승인 과정을 자동화하기 위해 "trust mode"를 구현했다. 이때 Claude에게 다음과 같은 제약을 걸었다:

> "auto-respond가 활성화된 경우에만 자동 승인한다. 하지만 다음 상황에서는 반드시 사용자 확인을 받는다:
> - 파일 삭제 작업
> - 외부 API 호출
> - 5개 이상 파일 수정
> - error rate > 20%
> 
> 자동 승인 시 3초 countdown을 보여주고, 사용자가 중단할 수 있게 한다."

이런 **안전 장치가 포함된 프롬프트**를 작성하면 Claude가 더 신중하게 코드를 생성한다.

## SSE 스트림과 상태 동기화 해결하기

실시간 웹 대시보드에서 여러 클라이언트가 동시에 접속할 때 발생하는 이벤트 중복 문제를 해결해야 했다. 이런 동시성 문제는 Claude가 특히 잘 해결한다.

### 이벤트 중복 제거 프롬프트

> "SSE endpoint에서 다음 문제가 발생한다:
> 1. 같은 이벤트가 여러 번 전송됨
> 2. 클라이언트별로 다른 이벤트 순서
> 3. 연결이 끊어진 클라이언트에게도 전송 시도
> 
> 해결 방안:
> - 각 이벤트에 unique ID와 timestamp 추가
> - 클라이언트별 last_seen_event_id 추적
> - heartbeat으로 dead connection 감지
> - 최대 100개 이벤트만 메모리에 유지
> 
> Redis나 외부 의존성 없이 in-memory로 해결해야 함"

Claude는 이런 요구사항을 받으면 매우 체계적인 해결책을 제시한다. 특히 **메모리 효율성과 동시성을 모두 고려한 구현**을 만들어낸다.

```typescript
class EventBuffer {
  private events: Map<string, EventData> = new Map();
  private clientLastSeen: Map<string, string> = new Map();
  
  addEvent(event: EventData): void {
    this.events.set(event.id, event);
    if (this.events.size > 100) {
      const oldestKey = this.events.keys().next().value;
      this.events.delete(oldestKey);
    }
  }
  
  getEventsAfter(clientId: string, eventId?: string): EventData[] {
    // implementation...
  }
}
```

### 멀티 adapter 상태 관리

Claude, Codex, Gemini를 동시에 사용할 때 각 adapter의 상태를 독립적으로 관리하면서도 전체 workflow는 일관성을 유지해야 한다.

> "각 LLM adapter는 독립적인 상태를 가지지만, workflow engine에서 통합 관리한다.
> 
> Adapter interface:
> ```typescript
> interface LLMAdapter {
>   readonly id: string;
>   readonly capabilities: string[];
>   execute(task: Task, context: Context): Promise<Result>;
>   cleanup(): Promise<void>;
> }
> ```
> 
> 제약 조건:
> - adapter는 stateless해야 함 (session state는 별도 관리)
> - 5초 내 응답 없으면 timeout
> - 메모리 사용량이 50MB 넘으면 재시작
> - retry logic은 engine에서 처리"

이런 interface 수준의 설계를 Claude와 함께 하면 매우 일관성 있는 구현이 나온다.

## 더 나은 방법은 없을까

이번 작업을 하면서 몇 가지 더 나은 접근법을 발견했다.

### MCP 서버로 터미널 인터랙션 관리

현재는 `node-pty`를 직접 사용했지만, **Anthropic의 MCP(Model Context Protocol)**를 활용하면 더 깔끔할 것 같다. MCP 서버로 터미널 세션을 관리하면:

- 프로세스 격리가 자연스럽게 해결된다
- Claude가 터미널 컨텍스트를 더 잘 이해한다  
- 보안 경계가 명확해진다

```json
{
  "mcpServers": {
    "terminal": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-terminal"],
      "env": {
        "ALLOWED_COMMANDS": "git,npm,node"
      }
    }
  }
}
```

### Streaming response 최적화

현재 SSE 구현은 기본적인 수준이다. **Anthropic의 streaming API best practices**를 보면 더 효율적인 패턴이 있다:

- `delta` 방식으로 증분 업데이트만 전송
- client-side buffer와 reconciliation
- backpressure handling으로 느린 클라이언트 대응

### 프롬프트 체이닝 개선

현재는 각 작업을 독립적으로 처리하지만, **chain-of-thought prompting**을 workflow 레벨에서 구현하면 더 좋을 것이다:

```
Task 1: Analyze requirements → intermediate reasoning
Task 2: Design solution (using Task 1 reasoning) → refined approach  
Task 3: Implementation (using accumulated context) → final result
```

Claude의 최신 모델들은 이런 multi-step reasoning을 매우 잘 처리한다.

### 에러 복구 패턴

현재는 단순한 retry logic만 있지만, **exponential backoff**와 **circuit breaker pattern**을 추가해야 한다. 특히 LLM API는 rate limiting이 까다로워서 intelligent retry가 필수다.

## 정리

- **구체적인 제약 조건을 포함한 프롬프트**가 Claude로부터 더 나은 아키텍처를 이끌어낸다
- **lazy loading과 resource cleanup 패턴**을 일관되게 적용하면 프로덕션 안정성이 크게 향상된다  
- **context-aware한 사용자 입력 처리**로 자연스러운 대화형 인터페이스를 만들 수 있다
- **SSE 스트림에서 이벤트 중복 제거**는 메모리 효율적인 buffer 관리가 핵심이다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>