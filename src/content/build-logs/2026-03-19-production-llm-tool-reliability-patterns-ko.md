---
title: "프로덕션 LLM 도구 만들 때 마주하는 3가지 함정과 해결법"
project: "llmmixer_claude"
date: 2026-03-19
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer v0.3을 프로덕션 레디 상태로 만드는 작업을 했다. 7000줄이 넘는 코드를 추가하고 63개 파일을 건드리면서 배운 건 하나다. LLM 도구를 실제로 쓸 수 있게 만드는 건 생각보다 훨씬 복잡하다는 것이다. 이 글에서는 AI 기반 개발 도구를 만들 때 반드시 마주하게 되는 신뢰성 문제와 그 해결 패턴을 다룬다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 여러 LLM 모델을 하나의 워크플로우로 연결해서 복잡한 코드 작업을 자동화하는 도구다. Claude로 설계하고 Codex로 구현하고 Gemini로 테스트 케이스를 만드는 식이다. 

0.2 버전까지는 "일단 돌아가는" 상태였다. 하지만 실제 프로젝트에서 쓰려고 하니까 문제가 보였다. 세션이 갑자기 끊어지고, CLI 명령어가 중간에 멈추고, 같은 이벤트가 중복으로 발생한다. 전형적인 프로토타입의 한계였다.

이번 작업의 목표는 명확했다. **실제로 쓸 수 있는 도구로 만드는 것.**

## 함정 1: 비동기 처리를 과소평가하기

### 문제 상황

LLM API는 본질적으로 비동기다. 요청을 보내고 스트리밍으로 응답을 받는다. 여기에 여러 모델을 순서대로 실행하고, 중간 결과를 다음 단계로 전달하고, 사용자에게 실시간으로 진행 상황을 보여줘야 한다.

처음에는 단순하게 생각했다. `Promise`로 감싸고 `async/await`로 처리하면 된다고. 하지만 실제로는 훨씬 복잡했다.

```typescript
// 초기 버전 - 나쁜 예시
async execute() {
  const result1 = await this.claude.process(input);
  const result2 = await this.codex.process(result1);
  const result3 = await this.gemini.process(result2);
  return result3;
}
```

이렇게 하면 몇 가지 문제가 생긴다:
- 중간에 하나가 실패하면 전체가 멈춘다
- 진행 상황을 사용자에게 보여줄 수 없다
- 각 단계의 상태를 추적할 수 없다
- 취소나 재시도가 불가능하다

### AI를 활용한 설계 개선

이 문제를 해결하기 위해 Claude에게 다음과 같이 물어봤다:

> "복수의 LLM API를 순서대로 실행하는 워크플로우 엔진을 설계해야 한다. 각 단계는 비동기로 실행되고, 중간 결과는 다음 단계로 전달된다. 실패한 단계는 재시도 가능해야 하고, 전체 진행 상황은 SSE로 프론트엔드에 실시간 전송해야 한다. 
>
> 요구사항:
> 1. 각 단계의 상태 추적 (pending, running, completed, failed)
> 2. 단계별 재시도 로직
> 3. 전체 워크플로우 취소
> 4. 실시간 상태 업데이트
> 5. 에러 복구
>
> TypeScript로 구현하고, 상태 관리는 어떤 패턴을 쓰는 게 좋을까?"

Claude가 제안한 패턴은 State Machine과 Event Emitter를 조합한 구조였다:

```typescript
class WorkflowEngine extends EventEmitter {
  private sessions = new Map<string, WorkflowSession>();
  
  async execute(sessionId: string, steps: WorkflowStep[]) {
    const session = this.getOrCreateSession(sessionId);
    
    for (const [index, step] of steps.entries()) {
      try {
        session.updateStepStatus(index, 'running');
        this.emit('step:start', { sessionId, step: index });
        
        const result = await this.executeStep(step, session.context);
        
        session.updateStepStatus(index, 'completed');
        session.context = { ...session.context, ...result };
        this.emit('step:complete', { sessionId, step: index, result });
        
      } catch (error) {
        session.updateStepStatus(index, 'failed');
        this.emit('step:error', { sessionId, step: index, error });
        
        if (step.retryable && session.getRetryCount(index) < 3) {
          await this.retryStep(sessionId, index);
        } else {
          throw error;
        }
      }
    }
  }
}
```

### 실제 적용에서 배운 것

이 구조를 실제로 구현하면서 몇 가지 추가 고려사항이 있다는 걸 배웠다:

1. **Session Persistence**: 서버가 재시작되어도 진행 중인 워크플로우를 복구할 수 있어야 한다
2. **Memory Management**: 완료된 세션은 자동으로 정리해야 한다
3. **Concurrent Sessions**: 여러 워크플로우가 동시에 실행될 때 리소스 관리

이런 부분은 AI가 제안한 초기 설계에는 없었다. 실제 구현하면서 추가로 고민해야 할 지점들이다.

## 함정 2: CLI 통합을 단순하게 생각하기

### 문제 상황

LLM 도구의 핵심은 사용자 경험이다. 웹 대시보드도 중요하지만, 개발자들은 터미널에서 바로 쓸 수 있는 CLI를 원한다. 

처음에는 단순했다. `child_process.exec()`으로 git 명령어를 실행하고 결과를 받아오는 정도였다. 하지만 실제로는 다음과 같은 문제들이 있었다:

- Interactive한 명령어 처리 (`git add -p`, `git rebase -i`)
- 실시간 출력 표시 (progress bar, streaming output)
- 사용자 입력 처리 (y/n 확인, 패스워드 입력)
- 터미널 세션 관리

### AI를 활용한 해결 과정

이 문제를 해결하기 위해 Claude에게 구체적인 요구사항과 함께 질문했다:

> "Node.js에서 git과 같은 interactive CLI 도구를 완벽히 지원하려면 어떻게 해야 할까? `child_process.spawn()`으로는 한계가 있다. 
>
> 해결해야 할 문제들:
> 1. `git add -p` 같은 interactive 모드
> 2. 사용자 키보드 입력을 그대로 전달
> 3. 터미널 색상, 포맷팅 유지
> 4. PTY (pseudo-terminal) 필요한지 판단
>
> 라이브러리 추천과 구현 예시를 보여줘."

Claude의 답변에서 핵심은 **node-pty**였다:

```typescript
import * as pty from 'node-pty';

class InteractiveCLI {
  private ptyProcess: pty.IPty | null = null;
  
  async executeInteractive(command: string, args: string[]) {
    return new Promise((resolve, reject) => {
      this.ptyProcess = pty.spawn(command, args, {
        name: 'xterm-color',
        cols: process.stdout.columns || 80,
        rows: process.stdout.rows || 24,
        cwd: process.cwd(),
        env: process.env
      });
      
      // 출력을 사용자에게 실시간 전달
      this.ptyProcess.onData((data) => {
        process.stdout.write(data);
      });
      
      // 사용자 입력을 프로세스에 전달
      process.stdin.on('data', (data) => {
        if (this.ptyProcess) {
          this.ptyProcess.write(data.toString());
        }
      });
      
      this.ptyProcess.onExit(({ exitCode }) => {
        if (exitCode === 0) {
          resolve(exitCode);
        } else {
          reject(new Error(`Process exited with code ${exitCode}`));
        }
      });
    });
  }
}
```

### 실제 구현에서 마주한 추가 문제들

AI가 제안한 기본 구조는 좋았지만, 실제 프로덕션에서는 더 많은 고려사항이 있었다:

**1. Lazy Loading**
`node-pty`는 네이티브 모듈이라 로드 시간이 오래 걸린다. 모든 CLI 명령어에서 필요한 건 아니므로 lazy loading을 적용했다:

```typescript
let pty: typeof import('node-pty') | null = null;

async function getPty() {
  if (!pty) {
    pty = await import('node-pty');
  }
  return pty;
}
```

**2. Non-Interactive Mode 판단**
모든 명령어가 interactive한 건 아니다. `git status`는 단순히 출력만 하면 되지만, `git add -p`는 사용자 입력이 필요하다. 이를 자동으로 판단하는 로직이 필요했다:

```typescript
const INTERACTIVE_COMMANDS = new Set([
  'git add -p', 'git add --patch',
  'git rebase -i', 'git rebase --interactive',
  'git commit --amend'
]);

function needsInteractive(command: string): boolean {
  return INTERACTIVE_COMMANDS.has(command) || 
         command.includes('-i') || 
         command.includes('--interactive');
}
```

**3. 터미널 상태 복구**
Interactive 세션이 끝난 후 터미널 상태를 원래대로 돌려놔야 한다. 그렇지 않으면 다음 명령어 입력이 이상하게 나온다.

이런 디테일한 부분들은 AI가 처음에 제안하지 않은 부분이다. 실제 사용하면서 하나씩 발견하고 해결해야 했다.

## 함수 3: 상태 동기화 문제

### 문제 상황

LLM 도구는 보통 여러 컴포넌트로 구성된다. 백엔드 워크플로우 엔진, 프론트엔드 대시보드, CLI 인터페이스. 이들이 모두 같은 상태를 공유해야 한다.

예를 들어 CLI에서 워크플로우를 시작했다면, 웹 대시보드에서도 실시간으로 진행 상황을 볼 수 있어야 한다. 반대로 웹에서 워크플로우를 취소했다면, CLI도 즉시 중단되어야 한다.

처음에는 단순하게 생각했다. SSE(Server-Sent Events)로 상태를 브로드캐스트하면 된다고. 하지만 실제로는 더 복잡했다:

- 같은 이벤트가 중복으로 발송된다
- 클라이언트가 연결을 끊었다가 다시 접속했을 때 상태 싱크가 맞지 않는다
- 메모리 누수가 발생한다

### AI를 활용한 아키텍처 설계

이 문제를 Claude에게 질문할 때는 구체적인 시나리오를 제시했다:

> "여러 클라이언트(웹 대시보드, CLI)가 하나의 워크플로우 상태를 공유하는 시스템을 설계해야 한다.
>
> 시나리오:
> 1. CLI에서 `llmmixer run deploy`를 실행한다
> 2. 웹 대시보드를 열면 실시간으로 진행 상황이 보인다
> 3. 웹에서 중간에 취소하면 CLI도 즉시 중단된다
> 4. 네트워크가 끊어졌다가 다시 연결되면 최신 상태로 동기화된다
>
> SSE를 쓰려고 하는데, 이벤트 중복 방지와 상태 동기화를 어떻게 처리해야 할까? 코드 예시로 보여줘."

Claude가 제안한 핵심은 **Event Sourcing** 패턴이었다:

```typescript
class StateManager {
  private events: Map<string, WorkflowEvent[]> = new Map();
  private subscribers: Map<string, Set<EventSubscriber>> = new Map();
  private lastEventId = 0;

  emit(sessionId: string, event: WorkflowEvent) {
    // 이벤트에 고유 ID 부여
    event.id = ++this.lastEventId;
    event.timestamp = Date.now();
    
    if (!this.events.has(sessionId)) {
      this.events.set(sessionId, []);
    }
    this.events.get(sessionId)!.push(event);
    
    // 구독자들에게 전송 (중복 체크 포함)
    const subs = this.subscribers.get(sessionId) || new Set();
    subs.forEach(sub => {
      if (sub.lastEventId < event.id) {
        sub.send(event);
        sub.lastEventId = event.id;
      }
    });
  }
  
  subscribe(sessionId: string, fromEventId = 0): EventSubscriber {
    const subscriber = new EventSubscriber(fromEventId);
    
    if (!this.subscribers.has(sessionId)) {
      this.subscribers.set(sessionId, new Set());
    }
    this.subscribers.get(sessionId)!.add(subscriber);
    
    // 누락된 이벤트가 있다면 즉시 전송
    const events = this.events.get(sessionId) || [];
    const missedEvents = events.filter(e => e.id > fromEventId);
    missedEvents.forEach(event => subscriber.send(event));
    
    return subscriber;
  }
}
```

### 실제 구현에서의 추가 고려사항

AI가 제안한 기본 구조에서 실제 프로덕션 적용을 위해 추가해야 할 부분들이 있었다:

**1. 메모리 관리**
완료된 워크플로우의 이벤트를 계속 메모리에 보관하면 메모리 누수가 발생한다. TTL 기반 정리 로직이 필요하다:

```typescript
// 1시간 후 자동 정리
private readonly EVENT_TTL = 60 * 60 * 1000;

private cleanupOldEvents() {
  const now = Date.now();
  for (const [sessionId, events] of this.events) {
    const validEvents = events.filter(e => 
      now - e.timestamp < this.EVENT_TTL
    );
    if (validEvents.length === 0) {
      this.events.delete(sessionId);
    } else {
      this.events.set(sessionId, validEvents);
    }
  }
}
```

**2. Connection Health Check**
SSE 연결이 끊어진 클라이언트를 자동으로 정리해야 한다:

```typescript
class EventSubscriber {
  private heartbeatInterval?: NodeJS.Timeout;
  
  constructor(private response: Response) {
    // 30초마다 heartbeat 전송
    this.heartbeatInterval = setInterval(() => {
      try {
        this.response.write('event: heartbeat\ndata: {}\n\n');
      } catch {
        // 연결이 끊어진 경우
        this.cleanup();
      }
    }, 30000);
  }
}
```

**3. 순서 보장**
여러 워크플로우가 동시에 실행될 때 이벤트 순서가 꼬이지 않도록 해야 한다. 세션별로 독립적인 시퀀스를 관리하는 게 안전하다.

## 더 나은 방법은 없을까

이 글에서 다룬 패턴들은 모두 직접 구현한 것들이다. 하지만 더 검증된 대안들이 있다:

**1. 워크플로우 엔진**
직접 구현하는 대신 [Temporal](https://temporal.io/)이나 [Inngest](https://www.inngest.com/) 같은 워크플로우 엔진을 쓰는 방법이 있다. 특히 Temporal은 복잡한 비동기 워크플로우를 처리하는 데 최적화되어 있다. 재시도, 상태 관리, 에러 복구 등을 모두 제공한다.

**2. CLI 프레임워크**
`node-pty`를 직접 다루는 대신 [Ink](https://github.com/vadimdemedes/ink)나 [Pastel](https://github.com/vadimdemedes/pastel) 같은 React 기반 CLI 프레임워크를 쓸 수 있다. 복잡한 인터랙션이 필요하다면 이쪽이 더 관리하기 쉽다.

**3. 실시간 상태 동기화**
Event Sourcing을 직접 구현하는 대신 [Redis Streams](https://redis.io/docs/data-types/streams/)나 [Apache Kafka](https://kafka.apache.org/)를 쓰는 방법이 있다. 특히 Redis Streams는 consumer group과 메시지 순서 보장을 기본으로 제공한다.

**4. LLM 통합**
각 LLM API를 직접 연동하는 대신 [LangChain](https://langchain.com/)이나 [Vercel AI SDK](https://sdk.vercel.ai/)를 쓰면 훨씬 간단하다. 에러 처리, 재시도, 스트리밍 등이 모두 추상화되어 있다.

하지만 이런 도구들을 쓸 때도 본질적인 문제는 같다. 비동기 처리의 복잡성, CLI 통합의 어려움, 상태 동기화의 까다로움. 도구가 해결해주는 건 구현의 번거로움이지, 설계 관점에서 고민해야 할 지점들은 여전히 남아있다.

## 정리

- **비동기 워크플로우는 State Machine + Event Emitter 패턴**으로 접근하되, session persistence와 메모리 관리까지 고려해야 한다
- **CLI 통합은 node-pty + lazy loading**이 핵심이지만, interactive/non-interactive 모드 판단과 터미널 상태 복구까지 챙겨야 한다  
- **상태 동기화는 Event Sourcing**이 효과적이지만, 이벤트 중복 방지와 connection health check가 필수다
- **AI는 초기 아키텍처 설계에 도움**이 되지만, 프로덕션 레벨 디테일은 직접 경험하며 보완해야 한다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>