---
title: "프로덕션 Claude 에이전트의 신뢰성 문제 해결하는 구조화 패턴"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer 프레임워크를 프로덕션에 올리면서 Claude 에이전트가 실제 서비스에서 겪는 핵심 문제들을 해결했다. 이 글에서는 interactive CLI, lazy loading, 중복 응답 처리 등 에이전트를 안정적으로 운영하기 위한 구조화 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 Claude, GPT, Gemini 같은 LLM들을 하나의 워크플로우에서 혼합 사용할 수 있게 해주는 프레임워크다. 이번 작업은 v0.3을 처음 구현하고 나서, 실제 프로덕션 환경에서 발생한 신뢰성 문제들을 해결하는 것이었다.

핵심 목표는 두 가지였다. 첫째, Node.js 환경에서 interactive CLI 명령어를 안전하게 실행할 수 있게 만들기. 둘째, 여러 LLM 어댑터가 동시에 작동할 때 생기는 경합 조건과 중복 응답 문제 해결하기.

## interactive CLI 실행을 위한 lazy loading 전략

Node.js에서 CLI 도구와 상호작용하는 에이전트를 만들 때 가장 큰 문제는 `node-pty` 모듈이다. 이 모듈은 pseudo-terminal을 생성해서 실제 터미널처럼 작동하게 해주지만, 플랫폼 dependency가 크고 require 시점에 에러가 나면 전체 프로세스가 죽는다.

### 기존 방식의 문제점

```javascript
// 나쁜 예: 모듈 최상단에서 require
import * as pty from 'node-pty';

class CLIAdapter {
  async execute(command) {
    const term = pty.spawn(command, args);
    // ...
  }
}
```

이렇게 하면 `node-pty`가 설치되지 않은 환경이나 권한 문제가 있는 환경에서는 앱 전체가 시작되지 않는다.

### lazy loading으로 해결

```javascript
class CLIAdapter {
  private pty: typeof import('node-pty') | null = null;
  
  private async getPty() {
    if (!this.pty) {
      try {
        this.pty = await import('node-pty');
      } catch (error) {
        throw new Error('node-pty not available. Install with: npm install node-pty');
      }
    }
    return this.pty;
  }
  
  async executeInteractive(command: string, args: string[]) {
    const pty = await this.getPty();
    const term = pty.spawn(command, args, {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: process.env
    });
    
    return new Promise((resolve, reject) => {
      let output = '';
      
      term.on('data', (data) => {
        output += data;
        this.handleInteractivePrompt(data, term);
      });
      
      term.on('exit', (code) => {
        resolve({ code, output });
      });
    });
  }
}
```

### 프롬프트 전략: 에이전트에게 CLI 권한 위임하기

에이전트가 CLI 명령어를 실행할 때는 명확한 제약 조건을 줘야 한다:

> "이 명령어는 interactive prompt가 나올 수 있다. Y/N 질문이 나오면 기본값으로 응답해라. 패스워드를 요구하면 즉시 중단하고 사용자에게 알려라. 30초 이상 응답이 없으면 timeout으로 처리해라."

이렇게 쓰면 안 된다:
> "CLI 명령어 실행해줘"

구체적인 제약 조건이 없으면 에이전트가 무한정 대기하거나 예상치 못한 명령어를 실행할 수 있다.

## 멀티 어댑터 환경에서 응답 중복 처리

LLMMixer에서는 Claude, GPT, Gemini를 동시에 사용할 수 있다. 이때 가장 큰 문제는 같은 요청에 대해 여러 모델이 동시에 응답을 생성하면서 생기는 중복과 경합 조건이다.

### SSE deduplication 패턴

Server-Sent Events로 실시간 응답을 스트리밍할 때, 같은 내용이 중복으로 전송되는 문제가 있었다:

```typescript
class SSEManager {
  private sentMessages = new Set<string>();
  private responseBuffer = new Map<string, string>();
  
  dedupAndSend(sessionId: string, data: any) {
    const messageHash = this.hashMessage(data);
    const key = `${sessionId}:${messageHash}`;
    
    if (this.sentMessages.has(key)) {
      return; // 이미 전송된 메시지는 스킵
    }
    
    this.sentMessages.add(key);
    this.sendSSE(sessionId, data);
    
    // 메모리 누수 방지를 위해 일정 시간 후 정리
    setTimeout(() => {
      this.sentMessages.delete(key);
    }, 30000);
  }
  
  private hashMessage(data: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
  }
}
```

### singleton persistence로 세션 관리

여러 어댑터가 동시에 작동할 때 세션 상태가 꼬이는 문제를 해결하기 위해 singleton 패턴을 썼다:

```typescript
class SessionManager {
  private static instance: SessionManager;
  private sessions = new Map<string, SessionState>();
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
  
  lockSession(sessionId: string): Promise<() => void> {
    return new Promise((resolve) => {
      const session = this.getSession(sessionId);
      
      const checkLock = () => {
        if (!session.locked) {
          session.locked = true;
          session.lockTime = Date.now();
          
          const release = () => {
            session.locked = false;
            session.lockTime = null;
          };
          
          resolve(release);
        } else {
          // 5초 이상 락이 걸려있으면 강제 해제
          if (Date.now() - session.lockTime! > 5000) {
            session.locked = false;
            checkLock();
          } else {
            setTimeout(checkLock, 100);
          }
        }
      };
      
      checkLock();
    });
  }
}
```

### 프롬프트 전략: 어댑터별 역할 분담

여러 LLM을 동시에 쓸 때는 각각의 강점에 맞는 역할을 명확히 나눠줘야 한다:

> "Claude는 코드 리뷰와 구조 분석을 담당한다. GPT는 자연어 설명과 문서화를 한다. Gemini는 테스트 케이스 생성과 edge case 검증을 한다. 각자 담당 영역 외의 작업은 하지 마라."

이렇게 하면 중복 작업을 피하고 각 모델의 장점을 최대한 활용할 수 있다.

## 에러 핸들링과 auto-respond 구현

프로덕션 환경에서는 에이전트가 예상치 못한 상황에서도 적절히 대응해야 한다. 특히 trust mode에서 auto-respond 기능을 구현할 때는 안전장치가 필수다.

### trust mode 설계

```typescript
interface TrustSettings {
  autoApprove: boolean;
  allowedCommands: string[];
  forbiddenPaths: string[];
  maxFileSize: number;
  requireConfirmation: string[]; // 확인이 필요한 작업들
}

class WorkflowEngine {
  async executeStep(step: WorkflowStep, trustSettings: TrustSettings) {
    // 위험한 작업인지 먼저 체크
    if (this.isDangerous(step, trustSettings)) {
      return await this.requestUserConfirmation(step);
    }
    
    // auto-approve 조건 확인
    if (trustSettings.autoApprove && this.isSafe(step, trustSettings)) {
      return await this.executeDirectly(step);
    }
    
    return await this.requestApproval(step);
  }
  
  private isDangerous(step: WorkflowStep, settings: TrustSettings): boolean {
    // 삭제 작업
    if (step.type === 'file_delete' || step.command?.includes('rm ')) {
      return true;
    }
    
    // 금지된 경로 접근
    if (settings.forbiddenPaths.some(path => 
      step.targetPath?.startsWith(path)
    )) {
      return true;
    }
    
    // 큰 파일 수정
    if (step.fileSize && step.fileSize > settings.maxFileSize) {
      return true;
    }
    
    return false;
  }
}
```

### 프롬프트 전략: 안전한 자동 실행

에이전트에게 trust mode에서 작업할 때의 가이드라인을 명확히 줘야 한다:

> "trust mode가 활성화됐다. 다음 작업은 자동 승인된다: 파일 읽기, 텍스트 수정, 새 파일 생성. 다음 작업은 반드시 사용자 확인이 필요하다: 파일 삭제, system 명령어, package.json 수정, .env 파일 접근. 확신이 없으면 사용자에게 물어봐라."

## 더 나은 방법은 없을까

이번 작업에서 쓴 패턴들보다 더 효율적인 방법들이 있다.

### MCP 서버로 CLI 관리 개선

`node-pty` 대신 Model Context Protocol 서버를 써서 CLI 작업을 처리하면 더 안전하다. Anthropic에서 제공하는 MCP 서버 템플릿을 쓰면:

```typescript
// @modelcontextprotocol/server-cli 사용
import { CLIServer } from '@modelcontextprotocol/server-cli';

const server = new CLIServer({
  allowedCommands: ['git', 'npm', 'node'],
  workingDirectory: process.cwd(),
  timeout: 30000,
  interactive: true
});
```

이렇게 하면 플랫폼별 dependency 문제도 없고, 보안도 더 강화된다.

### React Query 패턴으로 중복 요청 처리

SSE deduplication을 직접 구현하는 대신 React Query의 stale-while-revalidate 패턴을 서버사이드에 적용할 수 있다:

```typescript
import { QueryClient } from '@tanstack/react-query';

class ResponseCache {
  private queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,
        cacheTime: 30000,
      }
    }
  });
  
  async getCachedResponse(key: string, fetcher: () => Promise<any>) {
    return await this.queryClient.fetchQuery([key], fetcher);
  }
}
```

### 최신 Anthropic API features 활용

Claude 3.5의 새로운 tool use 기능을 쓰면 더 정교한 제어가 가능하다:

```typescript
const tools = [{
  name: "execute_cli",
  description: "Execute CLI commands with safety checks",
  input_schema: {
    type: "object",
    properties: {
      command: { type: "string" },
      confirm_dangerous: { type: "boolean" },
      timeout_seconds: { type: "number", default: 30 }
    }
  }
}];

// function calling으로 더 구조화된 응답을 받을 수 있다
```

## 정리

프로덕션 Claude 에이전트의 신뢰성을 높이기 위한 핵심 패턴들을 정리하면:

- lazy loading으로 의존성 문제를 런타임에 처리하고, 전체 시스템 안정성 확보
- SSE deduplication과 session locking으로 멀티 어댑터 환경에서 응답 중복과 경합 조건 해결  
- trust mode에서는 명확한 안전장치와 자동 승인 규칙으로 사용자 경험과 보안 균형 맞추기
- 에이전트에게 구체적인 제약 조건과 역할 분담을 명시해서 예측 가능한 동작 보장

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>