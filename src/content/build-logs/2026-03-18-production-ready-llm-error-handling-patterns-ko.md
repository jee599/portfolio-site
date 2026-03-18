---
title: "프로덕션 ready LLM 시스템을 위한 에러 핸들링과 안정성 패턴"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

LLM을 활용한 복잡한 워크플로우 시스템을 프로덕션 환경에 배포하려면 개발 환경에서 보이지 않던 수많은 예외 상황과 마주한다. 이번에 LLMMixer를 v0.3으로 업데이트하면서 만난 실제 문제들과 이를 해결한 AI 협업 패턴을 정리했다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 여러 LLM을 동시에 활용해서 복잡한 작업을 자동화하는 시스템이다. Claude, Codex, Gemini 같은 서로 다른 모델들이 workflow 단계별로 협업한다. 사용자가 요청을 던지면 task decomposition부터 실행, 결과 합성까지 전체 과정이 자동으로 진행된다.

문제는 각 모델마다 API 호출 방식도 다르고, 중간에 실패하는 지점도 제각각이라는 점이다. 개발할 때는 happy path만 테스트해서 모든 게 잘 돌아가는 것처럼 보였지만, 실제 사용자가 써보니 connection timeout, rate limit, 중간 단계 실패 등으로 전체 workflow가 망가지는 경우가 빈발했다.

이번 작업의 목표는 이런 예외 상황들을 체계적으로 처리해서 프로덕션에서 안정적으로 동작하는 시스템을 만드는 것이었다.

## Claude로 에러 시나리오 발굴하기

프로덕션 환경에서 발생할 수 있는 에러들을 미리 파악하는 게 첫 번째 과제였다. 혼자 생각해서는 놓치는 케이스가 너무 많다. 이럴 때 Claude의 시스템적 사고 능력이 유용하다.

효과적인 프롬프트는 구체적인 아키텍처 정보와 제약 조건을 먼저 제공하는 것이다:

> "LLM adapter 시스템에서 Claude/Codex/Gemini API를 동시에 호출하고, 결과를 SSE로 스트리밍한다. 각 adapter는 독립적인 session을 가지고, workflow engine이 전체 orchestration을 담당한다.
> 
> 프로덕션에서 발생 가능한 failure 시나리오를 severity와 frequency 기준으로 분류해줘. 특히 cascade failure가 일어날 수 있는 지점들을 중점적으로."

이렇게 쓰면 안 된다:
> "에러 처리 어떻게 해야 할까요?"

첫 번째 프롬프트에서 Claude가 제시한 시나리오들:

1. **Network layer failures**: API timeout, DNS resolution, SSL handshake 실패
2. **Authentication issues**: API key rotation, rate limit exceeded, quota exhausted  
3. **Model-specific errors**: Claude의 safety filter, Codex의 context overflow, Gemini의 region restriction
4. **Concurrency issues**: Session collision, race condition in workflow state
5. **Resource exhaustion**: Memory leak in streaming, connection pool depletion

여기서 핵심은 각 시나리오에 대해 "어떤 상황에서 발생하는가"와 "다른 컴포넌트에 어떤 영향을 주는가"까지 함께 물어본 것이다. 단순히 에러 목록만 받으면 대응 방법을 찾기 어렵다.

## Adapter 패턴으로 에러 격리하기

각 LLM API마다 에러 발생 패턴이 다르기 때문에, base adapter에서 공통 에러 처리 로직을 만들고 각 모델별로 특화된 처리를 추가하는 구조로 설계했다.

Claude에게 이런 패턴을 구현하도록 지시할 때는 abstract method와 concrete implementation의 책임을 명확히 분리하는 것이 중요하다:

> "`BaseAdapter`에서 retry logic, circuit breaker, timeout handling을 담당한다. `ClaudeAdapter`는 anthropic-specific error code만 처리한다. 
>
> Exponential backoff는 base에서 구현하되, 각 모델의 rate limit policy에 따라 multiplier를 조정할 수 있게 해줘. 코드 생성할 때 error boundary와 graceful degradation 고려해서."

결과적으로 나온 구조:

```typescript
abstract class BaseAdapter {
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfig
  ): Promise<T> {
    // circuit breaker, exponential backoff, timeout 처리
  }
  
  abstract handleModelSpecificError(error: unknown): ErrorAction;
}

class ClaudeAdapter extends BaseAdapter {
  handleModelSpecificError(error: unknown): ErrorAction {
    if (error.type === 'overloaded_error') return 'RETRY_WITH_BACKOFF';
    if (error.type === 'invalid_request_error') return 'FAIL_FAST';
    return 'DELEGATE_TO_BASE';
  }
}
```

여기서 핵심 패턴은 각 adapter가 자신이 처리할 수 없는 에러는 base class로 위임한다는 점이다. 이렇게 하면 새로운 에러 타입이 나타났을 때 base adapter만 수정하면 모든 모델에 적용된다.

## Interactive CLI를 위한 node-pty 도입

LLM 시스템이 복잡해질수록 실시간 디버깅과 모니터링이 중요해진다. 특히 workflow가 여러 단계로 나뉘어 있을 때 중간 상태를 확인하고 개입할 수 있어야 한다.

기존에는 단순한 console.log로만 상태를 출력했는데, 이걸로는 실시간으로 변화하는 workflow 상태를 추적하기 어려웠다. `node-pty`를 도입해서 터미널 UI를 개선했다.

Claude에게 이 작업을 시킬 때는 performance constraint를 명확히 제시했다:

> "`node-pty`를 lazy load로 구현해서 프로덕션 빌드 크기에 영향 주지 마. terminal UI는 development 환경에서만 활성화되고, 기본적으로는 structured logging으로 fallback해야 한다.
>
> pseudoterminal이 workflow execution을 blocking하면 안 되니까 별도 process에서 돌려줘."

중요한 것은 새로운 dependency를 추가할 때 기존 시스템의 안정성에 영향을 주지 않도록 하는 것이다. `require()`를 dynamic import로 바꾸고, try-catch로 감싸서 `node-pty` 설치가 안 된 환경에서도 core functionality는 정상 동작하게 했다.

## SSE 중복 제거와 상태 동기화

Server-Sent Events로 실시간 workflow 상태를 브라우저에 스트리밍할 때 가장 까다로운 문제는 중복 이벤트 처리다. 여러 adapter가 동시에 실행되면서 같은 session에 대해 상태 업데이트를 보내면, 클라이언트에서 inconsistent state가 발생한다.

이 문제를 Claude와 함께 해결할 때는 event sourcing 패턴을 참고했다:

> "SSE event에 sequence number와 timestamp를 추가해서 클라이언트에서 out-of-order event를 handling할 수 있게 해줘. 같은 session_id + event_type 조합이면 최신 sequence만 적용하고 나머지는 discard한다.
>
> 서버에서는 event deduplication을 위해 sliding window buffer를 써서 최근 N개 이벤트의 hash를 저장해줘."

구현할 때 놓치기 쉬운 부분은 browser connection이 끊어졌다가 다시 연결될 때의 상태 복구다. 클라이언트가 마지막으로 받은 sequence number를 서버에 보내면, 그 이후의 missed event들을 일괄 전송하는 catch-up mechanism을 추가했다.

```typescript
// SSE reconnection 시 missed event 복구
app.get('/api/sse', (req, res) => {
  const lastSeq = parseInt(req.query.lastSeq) || 0;
  const missedEvents = eventBuffer.getEventsAfter(lastSeq);
  
  missedEvents.forEach(event => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });
});
```

## Session 격리와 동시성 제어

여러 사용자가 동시에 workflow를 실행할 때 session이 섞이는 문제가 있었다. 특히 같은 git repository를 대상으로 하는 작업들이 서로 간섭하면서 파일 충돌이 발생했다.

이 문제를 해결하기 위해 session마다 독립적인 worktree를 생성하는 방식으로 바꿨다. Claude에게 이 작업을 지시할 때는 git worktree의 한계점도 함께 고려하도록 했다:

> "각 session마다 `git worktree add` 로 별도 working directory를 만들어줘. worktree 생성 실패 시에는 temporary directory + shallow clone으로 fallback한다. 
>
> session 종료 시 worktree cleanup이 중요한데, process가 갑자기 죽어도 orphaned worktree가 남지 않게 cleanup hook을 추가해줘."

session manager에서 reference counting을 도입해서 같은 repository에 대한 동시 접근을 제어했다:

```typescript
class SessionManager {
  private sessionRefs = new Map<string, number>();
  
  async createSession(repoPath: string): Promise<Session> {
    const refCount = this.sessionRefs.get(repoPath) || 0;
    this.sessionRefs.set(repoPath, refCount + 1);
    
    // 첫 번째 session이면 worktree 생성
    if (refCount === 0) {
      await this.createWorktree(repoPath);
    }
  }
  
  async destroySession(repoPath: string): Promise<void> {
    const refCount = this.sessionRefs.get(repoPath) || 0;
    
    // 마지막 session이면 worktree 정리
    if (refCount <= 1) {
      await this.cleanupWorktree(repoPath);
      this.sessionRefs.delete(repoPath);
    } else {
      this.sessionRefs.set(repoPath, refCount - 1);
    }
  }
}
```

## 더 나은 방법은 없을까

이번에 구현한 패턴들보다 더 효율적인 접근 방법들이 있다:

**Circuit Breaker Pattern 대신 Bulkhead Pattern**: 각 adapter를 완전히 독립적인 process로 분리하면 한 모델의 장애가 다른 모델에 영향을 주지 않는다. Kubernetes 환경에서는 각 adapter를 별도 pod으로 배포하는 것이 더 안정적이다.

**Event Sourcing 완전 도입**: 현재는 SSE에만 sequence number를 쓰고 있는데, workflow 전체 상태를 event sourcing으로 관리하면 arbitrary point-in-time 복구가 가능하다. Redis Streams나 Apache Kafka를 백엔드로 쓰면 더 robust한 시스템을 만들 수 있다.

**Distributed Tracing**: 현재는 session ID만으로 workflow를 추적하는데, OpenTelemetry를 도입하면 LLM API 호출부터 결과 합성까지 전체 lifecycle을 trace할 수 있다. 특히 latency bottleneck을 찾는 데 유용하다.

**Adaptive Timeout**: 고정된 timeout 대신 각 모델의 실시간 성능 metrics를 기반으로 dynamic timeout을 설정하는 방법이 있다. Anthropic이나 OpenAI API의 응답 시간은 시간대별로 편차가 크기 때문에 adaptive approach가 더 효율적이다.

**Model Router with Health Check**: 현재는 사용자가 모델을 직접 선택하는데, 각 모델의 실시간 상태를 체크해서 가장 빠르고 안정적인 모델로 자동 routing하는 시스템을 만들 수 있다. Vercel AI SDK의 model router가 좋은 참고 사례다.

## 정리

- **에러 시나리오 발굴**: Claude에게 구체적인 아키텍처 정보를 제공하면 놓치기 쉬운 failure case들을 체계적으로 찾을 수 있다
- **계층화된 에러 처리**: base adapter에서 공통 로직을 처리하고 각 모델별 특수 케이스만 분리하면 maintainability가 올라간다  
- **SSE 상태 동기화**: sequence number와 event deduplication으로 실시간 스트리밍의 consistency 문제를 해결할 수 있다
- **Session 격리**: git worktree와 reference counting으로 동시성 문제 없이 multi-user workflow를 지원할 수 있다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>