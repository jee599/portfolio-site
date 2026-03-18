---
title: "프로덕션급 LLM 도구 개발에서 배운 멀티 어댑터 패턴과 신뢰성 설계"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer라는 멀티 LLM 워크플로우 도구를 v0.3으로 업그레이드하면서 프로덕션 환경에서 돌릴 수 있는 수준까지 안정성을 끌어올렸다. 이 과정에서 Claude, Codex, Gemini 같은 서로 다른 LLM API를 하나의 일관된 인터페이스로 묶는 어댑터 패턴과 실시간 터미널 연동, 세션 관리 등 복잡한 상태를 다루는 방법을 정리했다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 여러 LLM을 조합해서 복잡한 작업을 자동화하는 워크플로우 엔진이다. 사용자가 "이 코드를 리팩토링하고 테스트도 짜줘"라고 하면, Claude가 분석하고 Codex가 구현하고 Gemini가 검토하는 식으로 각 모델의 강점을 활용한다.

지금까지는 MVP 수준이었는데, 실제 개발 환경에 통합하려니 여러 문제가 터졌다. API 호출이 실패하면 전체가 멈추고, 터미널 명령어 실행이 불안정하고, 여러 세션이 꼬이는 문제들이다. 이번 작업의 목표는 이런 문제들을 해결해서 실제로 쓸 수 있는 도구로 만드는 것이었다.

## 멀티 LLM 어댑터 패턴과 장애 처리

### 각 LLM의 특성을 하나의 인터페이스로 통합하기

Claude, Codex, Gemini는 각각 다른 API 구조와 응답 형식을 가진다. 이걸 일일이 처리하면 워크플로우 엔진이 복잡해진다. 해결책은 공통 어댑터 패턴이다.

```typescript
abstract class BaseLLMAdapter {
  abstract processRequest(prompt: string, options: RequestOptions): Promise<LLMResponse>
  abstract handleStreaming(callback: StreamCallback): void
  abstract validateResponse(response: any): boolean
}
```

각 LLM별로 이 인터페이스를 구현하되, 핵심은 **실패 시나리오를 어댑터 레벨에서 처리**하는 것이다. Claude API가 rate limit에 걸리면 자동으로 Gemini로 fallback하고, Codex가 응답하지 않으면 타임아웃 후 재시도한다.

이런 로직을 AI에게 구현하게 할 때 효과적인 프롬프트는:

> "TypeScript로 LLM 어댑터 패턴을 구현해줘. 각 어댑터는 `processRequest`, `handleStreaming`, `validateResponse` 메서드를 가져야 하고, API 실패 시 자동 재시도와 fallback 로직이 있어야 해. Claude는 rate limit, Codex는 timeout, Gemini는 quota exceeded 에러를 각각 다르게 처리해줘. 에러 타입별로 구체적인 처리 방식을 코드로 보여줘."

이렇게 하면 안 된다:

> "LLM API 연동해줘"

차이점은 **구체적인 요구사항과 제약 조건**이다. AI가 추상적인 요청을 받으면 일반적인 코드만 만든다. 하지만 실제 프로덕션에서는 각 API의 특수한 에러 케이스를 모두 고려해야 한다.

### non-interactive 모드의 함정

처음에는 모든 LLM 호출을 interactive 모드로 했다. 사용자가 각 단계마다 결과를 확인하고 승인하는 방식이다. 하지만 긴 워크플로우에서는 비효율적이다.

non-interactive 모드를 추가했는데, 여기서 중요한 건 **중간 실패를 어떻게 처리하느냐**다. interactive 모드에서는 사용자가 "이거 잘못됐네, 다시 해줘"라고 할 수 있지만, non-interactive에서는 자동으로 판단해야 한다.

```typescript
async processNonInteractive(workflow: Workflow): Promise<Result> {
  for (const step of workflow.steps) {
    const result = await this.executeStep(step)
    
    // 자동 검증 로직
    if (!this.isValidResult(result)) {
      await this.handleFailure(step, result)
      // fallback 전략 또는 워크플로우 중단
    }
  }
}
```

AI에게 이런 로직을 구현하게 할 때는 **검증 기준을 명확하게 정의**하는 게 핵심이다:

> "워크플로우의 각 단계별로 성공/실패 판단 기준을 정해줘. 코드 생성 단계면 syntax error 체크, 번역 단계면 언어 감지, API 호출 단계면 response status 확인. 각 실패 타입별로 재시도할지 다음 단계로 넘어갈지 워크플로우를 중단할지 결정 로직도 포함해줘."

## node-pty를 활용한 실시간 터미널 연동

### 터미널 명령어를 LLM 워크플로우에 통합하기

LLM이 코드를 생성한 후 `npm test`나 `git commit` 같은 명령어를 실행해야 하는 경우가 많다. 단순히 `child_process.exec()`를 쓰면 interactive 명령어나 colored output을 제대로 처리할 수 없다.

`node-pty`를 써서 실제 터미널 세션을 만들고, 여기서 명령어를 실행하도록 했다. 핵심은 **lazy loading**이다. 터미널이 필요한 시점에만 `node-pty`를 로드한다.

```typescript
let nodepty: any = null

async function getTerminal() {
  if (!nodepty) {
    nodepty = await import('node-pty')
  }
  return nodepty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.cwd()
  })
}
```

이렇게 하는 이유는 `node-pty`가 native module이라 번들링할 때 문제가 생길 수 있기 때문이다. 필요할 때만 로드하면 메인 애플리케이션은 가볍게 유지할 수 있다.

### 터미널 출력을 실시간으로 웹 대시보드에 스트리밍하기

터미널에서 실행되는 명령어의 출력을 웹 대시보드에서 실시간으로 보려면 SSE(Server-Sent Events)를 써야 한다. WebSocket보다 단순하고 HTTP 프록시 환경에서도 잘 작동한다.

```typescript
// SSE 엔드포인트
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      terminal.onData((data) => {
        const sseData = `data: ${JSON.stringify({ type: 'output', data })}\n\n`
        controller.enqueue(encoder.encode(sseData))
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

여기서 중요한 건 **중복 이벤트 처리**다. 터미널 출력이 빠르게 들어오면 같은 데이터가 여러 번 전송될 수 있다. 클라이언트에서 `Set`을 써서 중복을 제거한다.

AI에게 이런 실시간 통신 로직을 구현하게 할 때는:

> "Next.js에서 SSE를 써서 터미널 출력을 실시간 스트리밍하는 API를 만들어줘. `node-pty`로 터미널을 생성하고, 출력 데이터를 JSON으로 감싸서 SSE 형식으로 전송해줘. 클라이언트에서는 EventSource로 받아서 화면에 표시하되, 중복 이벤트와 연결 끊김 처리도 포함해줘."

## 세션 관리와 상태 동기화

### 여러 워크플로우가 동시에 실행될 때 상태 격리하기

LLMMixer는 여러 워크플로우를 동시에 실행할 수 있다. 사용자 A가 코드 리뷰를 요청하는 동안 사용자 B가 번역 작업을 시킬 수 있다. 문제는 각 세션의 상태를 어떻게 격리하느냐다.

초기에는 메모리에 `Map<sessionId, SessionState>`로 관리했는데, 서버가 재시작되면 모든 세션이 날아간다. 지속성을 위해 파일 시스템에 저장하도록 바꿨다.

```typescript
class SessionManager {
  private sessions = new Map<string, Session>()
  private persistencePath = './sessions'
  
  async saveSession(sessionId: string, session: Session) {
    this.sessions.set(sessionId, session)
    await fs.writeFile(
      path.join(this.persistencePath, `${sessionId}.json`),
      JSON.stringify(session, null, 2)
    )
  }
  
  async loadSession(sessionId: string): Promise<Session | null> {
    try {
      const data = await fs.readFile(
        path.join(this.persistencePath, `${sessionId}.json`),
        'utf-8'
      )
      const session = JSON.parse(data)
      this.sessions.set(sessionId, session)
      return session
    } catch {
      return null
    }
  }
}
```

핵심은 **싱글톤 패턴**이다. 여러 API 엔드포인트에서 같은 `SessionManager` 인스턴스를 공유해야 한다. Next.js의 API Routes는 각각 별도 프로세스처럼 동작할 수 있어서 주의해야 한다.

### trust auto-respond 모드

interactive 모드에서 매번 사용자 승인을 기다리는 건 비효율적이다. 특정 조건에서는 자동으로 다음 단계를 진행하는 `trust auto-respond` 모드를 추가했다.

```typescript
interface AutoRespondRule {
  condition: (result: LLMResponse) => boolean
  action: 'approve' | 'retry' | 'skip'
  maxRetries?: number
}

const autoRespondRules: AutoRespondRule[] = [
  {
    condition: (result) => result.confidence > 0.9 && result.hasNoErrors,
    action: 'approve'
  },
  {
    condition: (result) => result.hasSyntaxError,
    action: 'retry',
    maxRetries: 3
  }
]
```

AI에게 이런 규칙 기반 시스템을 설계하게 할 때는:

> "LLM 응답의 품질을 자동으로 판단해서 사용자 개입 없이 다음 단계를 진행할지 결정하는 시스템을 만들어줘. 신뢰도 점수, 구문 오류 여부, 예상 출력 형식과의 일치도를 기준으로 판단해줘. 각 판단 기준별로 구체적인 구현 코드와 테스트 케이스도 포함해줘."

## 더 나은 방법은 없을까

이 글에서 다룬 패턴들보다 더 효율적인 접근법들이 있다:

**1. LangChain/LangGraph 활용**
직접 어댑터 패턴을 구현하는 대신 LangChain의 표준화된 LLM 인터페이스를 쓰면 더 많은 모델을 쉽게 지원할 수 있다. 특히 LangGraph는 복잡한 멀티 에이전트 워크플로우를 시각적으로 설계할 수 있게 해준다.

**2. Redis를 활용한 세션 관리**
파일 시스템 대신 Redis를 쓰면 여러 서버 인스턴스 간 세션 공유가 가능하다. 또한 TTL 설정으로 자동 정리도 할 수 있다.

**3. WebSocket 대신 tRPC subscriptions**
SSE보다는 tRPC의 subscription 기능을 쓰면 타입 안전성과 함께 실시간 통신을 구현할 수 있다. 특히 TypeScript 전체 스택에서는 더 일관된 개발 경험을 제공한다.

**4. Docker 기반 샌드박스**
`node-pty`로 직접 터미널을 실행하는 대신 Docker 컨테이너에서 명령어를 실행하면 보안과 격리 측면에서 더 안전하다. 특히 사용자가 임의의 코드를 실행할 수 있는 환경에서는 필수다.

## 정리

- 멀티 LLM 환경에서는 공통 어댑터 패턴으로 각 API의 특성을 추상화하고 장애 상황을 개별적으로 처리한다
- `node-pty` lazy loading으로 네이티브 모듈 의존성을 최소화하면서 실시간 터미널 연동이 가능하다
- SSE와 세션 영속성을 조합하면 프로덕션급 상태 관리를 구현할 수 있다
- trust auto-respond 같은 규칙 기반 자동화로 사용자 개입을 최소화하면서도 품질을 유지할 수 있다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>