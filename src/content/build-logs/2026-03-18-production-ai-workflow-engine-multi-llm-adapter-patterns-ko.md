---
title: "프로덕션급 AI 워크플로 엔진 만들기 — 멀티 LLM adapter 설계와 신뢰성 패턴"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer라는 AI 워크플로 엔진을 v0.3으로 대폭 개편하면서 실제 프로덕션에서 돌아갈 수 있는 수준까지 끌어올렸다. 이 과정에서 멀티 LLM adapter 아키텍처를 설계하고, interactive CLI 처리, 세션 관리, 에러 복구 메커니즘을 구축했다. 이 글에서는 AI 에이전트들이 실제로 신뢰할 수 있게 동작하도록 만드는 구체적인 패턴들을 다룬다.

## 배경: AI 워크플로 엔진이란 무엇인가

LLMMixer는 복잡한 개발 작업을 여러 AI 모델에게 분산시켜 처리하는 워크플로 엔진이다. 단순히 "Claude야 코드 짜줘"가 아니라, 작업을 여러 단계로 분해하고, 각 단계에 최적화된 모델을 할당하며, 실패 시 복구하고, 결과를 검증하는 전체 파이프라인을 관리한다.

이번 v0.3 개편의 핵심 목표는 "데모에서 프로덕션으로"였다. 기존 버전은 happy path에서만 동작했지만, 이제는 네트워크 장애, 모델 응답 지연, 파일 충돌, 세션 중단 같은 현실적인 문제들을 모두 처리해야 했다.

## 멀티 LLM Adapter 패턴 — 각 모델의 특성을 살리는 법

가장 핵심적인 설계 결정은 adapter 패턴이었다. Claude, GPT, Gemini 각각이 서로 다른 강점과 약점을 가지고 있기 때문에, 하나의 인터페이스로 통합하되 각 모델의 특성은 살려야 했다.

### 추상화 레이어 설계

```typescript
// packages/core/src/adapters/base.ts
abstract class BaseLLMAdapter {
  abstract supportsInteractive(): boolean
  abstract executeTask(task: WorkflowTask): Promise<TaskResult>
  abstract handleRetry(failedTask: WorkflowTask, error: Error): Promise<TaskResult>
}
```

여기서 중요한 건 `supportsInteractive()` 메서드다. Claude는 대화형 작업에 강하지만, Codex는 일회성 코드 생성에 특화되어 있다. 이런 차이를 워크플로 엔진이 알고 있어야 적절한 모델을 선택할 수 있다.

### 모델별 특성 활용 전략

각 adapter에서 프롬프팅을 다르게 해야 한다는 걸 깨달았다. 같은 작업이라도 모델마다 최적화된 프롬프트 구조가 다르다.

**Claude adapter의 경우:**
> "다음 TypeScript 파일에서 타입 안전성을 높이고 싶다. 기존 API 호환성은 유지하되, 런타임 에러 가능성을 줄여라. 변경 사항은 단계별로 설명하고, 각 변경의 이유를 명시해라."

Claude는 맥락 이해와 단계적 추론에 강하므로 "왜"를 묻는 프롬프트가 효과적이다.

**Codex adapter의 경우:**
> "Input: TypeScript interface with runtime validation. Output: Zod schema + type guards. No explanations needed."

Codex는 pattern matching과 코드 변환에 특화되어 있으므로 input-output 패턴으로 간결하게 요청한다.

이 차이를 adapter 레벨에서 처리하면, 워크플로 엔진은 "타입 안전성 개선"이라는 추상적인 task만 던지고, 각 adapter가 자신의 강점에 맞게 프롬프트를 변환한다.

### 에러 처리와 fallback 메커니즘

프로덕션에서는 모델이 언제든 실패할 수 있다. API rate limit, 네트워크 timeout, 모델 자체의 응답 거부 등등. 이런 상황을 처리하는 패턴을 만들었다.

```typescript
async handleRetry(failedTask: WorkflowTask, error: Error): Promise<TaskResult> {
  if (error instanceof RateLimitError) {
    // exponential backoff with jitter
    await this.backoff(failedTask.retryCount)
    return this.executeTask(failedTask)
  }
  
  if (error instanceof ModelRefusalError) {
    // 프롬프트를 더 보수적으로 재작성
    const sanitizedTask = this.sanitizePrompt(failedTask)
    return this.executeTask(sanitizedTask)
  }
  
  // 다른 모델로 fallback
  throw new FallbackRequiredError(error)
}
```

핵심은 에러 타입에 따라 다르게 대응한다는 것이다. rate limit은 단순히 기다리면 되지만, 모델이 요청을 거부했다면 프롬프트 자체를 수정해야 한다.

## Interactive CLI 처리 — node-pty로 실제 터미널 환경 구현

AI 에이전트가 `npm install`이나 `git commit` 같은 interactive 명령을 실행해야 하는 경우가 많다. 처음에는 단순히 `child_process.spawn()`을 썼는데, 이건 실제 터미널 환경이 아니라서 많은 CLI 도구들이 제대로 동작하지 않았다.

### node-pty 도입과 lazy loading

```typescript
// packages/core/src/worktree.ts
private async getNodePty() {
  if (!this._nodePty) {
    try {
      // lazy load to avoid bundling issues
      this._nodePty = await import('node-pty')
    } catch (error) {
      throw new Error('node-pty required for interactive CLI support')
    }
  }
  return this._nodePty
}
```

`node-pty`는 native dependency라서 번들링이 까다롭다. 그래서 lazy loading으로 필요할 때만 로드하도록 했다. 이렇게 하면 interactive CLI가 필요 없는 환경에서는 `node-pty` 없이도 동작한다.

### 자동 응답 패턴

AI 에이전트가 CLI 도구와 상호작용할 때 가장 큰 문제는 예상치 못한 프롬프트다. "Are you sure? (y/N)", "Enter passphrase:", "Select option [1-5]:" 같은 것들.

이걸 해결하기 위해 trust 모드를 만들었다:

```typescript
async executeInteractiveCommand(command: string, trustMode: boolean = false) {
  const pty = spawn(shell, [], { cwd: this.workingDir })
  
  pty.onData((data) => {
    const output = data.toString()
    
    if (trustMode && this.isConfirmationPrompt(output)) {
      pty.write('y\r')  // 자동으로 yes 응답
      return
    }
    
    // 사용자에게 input 요청
    this.requestUserInput(output)
  })
}
```

`trustMode`가 켜져 있으면 일반적인 확인 프롬프트에 자동으로 응답한다. 하지만 패스워드나 중요한 선택은 여전히 사용자에게 넘긴다.

## 세션 관리와 상태 복구

AI 워크플로는 시간이 오래 걸린다. 중간에 브라우저를 닫거나, 네트워크가 끊어지거나, 서버가 재시작될 수 있다. 이런 상황에서도 작업을 이어갈 수 있어야 한다.

### 영속적 세션 스토리지

```typescript
// packages/core/src/session-manager.ts
class SessionManager {
  private sessions: Map<string, WorkflowSession> = new Map()
  
  async persistSession(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    
    // 세션 상태를 디스크에 저장
    await fs.writeFile(
      this.getSessionPath(sessionId),
      JSON.stringify(session.serialize())
    )
  }
  
  async restoreSession(sessionId: string): Promise<WorkflowSession | null> {
    try {
      const data = await fs.readFile(this.getSessionPath(sessionId), 'utf8')
      return WorkflowSession.deserialize(JSON.parse(data))
    } catch {
      return null
    }
  }
}
```

각 워크플로 세션은 진행 상태, 완료된 task들, 생성된 파일들, 에러 히스토리를 포함한다. 이걸 JSON으로 직렬화해서 디스크에 저장한다.

### SSE 중복 제거

Server-Sent Events로 실시간 상태를 전송하는데, 클라이언트가 재연결할 때 중복 메시지가 발생하는 문제가 있었다. 이걸 해결하기 위해 각 메시지에 sequence number를 붙였다:

```typescript
// packages/dashboard/src/app/api/sse/route.ts
let messageSequence = 0

function sendSSEMessage(controller: ReadableStreamDefaultController, data: any) {
  const message = {
    id: ++messageSequence,
    timestamp: Date.now(),
    data
  }
  
  controller.enqueue(`id: ${message.id}\n`)
  controller.enqueue(`data: ${JSON.stringify(message)}\n\n`)
}
```

클라이언트는 마지막으로 받은 message ID를 기억하고 있다가, 재연결 시 그 이후의 메시지만 요청한다.

## 더 나은 방법은 없을까

지금 구현한 패턴들도 나쁘지 않지만, 더 나은 접근법들이 있다.

### LangChain이나 LlamaIndex 사용

멀티 LLM orchestration은 이미 잘 정립된 영역이다. LangChain의 `ChatModel` 인터페이스나 LlamaIndex의 `LLMPredictor`를 쓰면 더 표준적인 방식으로 구현할 수 있다. 특히 prompt template, output parsing, retry logic 같은 부분은 바퀴를 다시 발명하지 말고 검증된 라이브러리를 쓰는 게 낫다.

### Temporal.io로 워크플로 관리

현재는 자체 구현한 세션 관리를 쓰고 있지만, Temporal.io 같은 전용 워크플로 엔진을 쓰는 게 더 robust하다. Temporal은 failure recovery, retry policy, 분산 실행을 모두 지원한다. 특히 long-running workflow에서는 Temporal의 activity heartbeat과 timeout 관리가 큰 도움이 된다.

### WebContainer로 안전한 코드 실행

지금은 host 시스템에서 직접 명령을 실행하는데, 이건 보안상 위험하다. StackBlitz의 WebContainer나 Docker sandbox를 쓰면 더 안전하게 AI가 생성한 코드를 실행할 수 있다. 특히 npm package 설치나 파일 시스템 조작을 할 때 isolation이 중요하다.

### OpenTelemetry로 관찰성 개선

현재는 단순한 로깅만 하고 있지만, OpenTelemetry를 도입하면 워크플로 전체의 trace를 볼 수 있다. 어떤 LLM adapter에서 얼마나 시간이 걸렸는지, 어떤 단계에서 실패가 자주 발생하는지 데이터 기반으로 분석할 수 있다.

## 정리

- 멀티 LLM 환경에서는 각 모델의 특성에 맞는 프롬프팅 전략을 adapter 레벨에서 처리한다
- Interactive CLI 지원은 node-pty + trust mode로 자동화와 안전성을 동시에 확보한다
- 장기 실행 워크플로는 영속적 세션 관리와 SSE 중복 제거가 필수다
- 프로덕션 신뢰성은 에러 타입별 다른 복구 전략에서 나온다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>