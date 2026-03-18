---
title: "LLMMixer 0.3 — production 배포까지 AI 워크플로우 신뢰성 설계 패턴"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer v0.3을 production-ready로 만드는 과정에서 겪은 AI 워크플로우 엔진의 신뢰성 문제와 해결 과정을 정리했다. interactive CLI, SSE deduplication, adapter 모드 최적화까지 실전에서 검증된 패턴들을 다룬다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 여러 LLM을 동시에 활용하는 워크플로우 엔진이다. Claude, Codex, Gemini를 조합해서 복잡한 작업을 자동화하는 도구다. 이번 v0.3에서는 프로토타입을 벗어나 실제 production 환경에서 안정적으로 돌아가는 시스템을 목표로 했다.

핵심은 interactive CLI 지원과 adapter reliability 향상이었다. 기존 버전은 단발성 작업은 잘 했지만, 장시간 실행되는 워크플로우에서 connection drop이나 중간 실패 시 복구가 어려웠다. 7,000줄이 넘는 코드 변경으로 이 문제들을 해결했다.

## Interactive CLI로 AI와 대화하며 워크플로우 제어하기

### node-pty를 활용한 실시간 제어 패턴

기존에는 AI에게 "이 워크플로우를 실행해"라고 한 번 던지면 끝까지 기다려야 했다. 중간에 수정하거나 방향을 바꿀 수 없었다. 이번에 `node-pty`를 도입해서 터미널처럼 실시간으로 AI와 소통할 수 있게 했다.

```typescript
// packages/core/src/adapters/base.ts - lazy loading으로 성능 최적화
let pty: typeof import('node-pty') | null = null;

const getPty = async () => {
  if (!pty) {
    pty = await import('node-pty');
  }
  return pty;
};
```

중요한 건 lazy loading이다. `node-pty`는 네이티브 바이너리를 쓰는 무거운 패키지라서 처음부터 로드하면 startup time이 느려진다. 실제로 interactive mode가 필요할 때만 로드한다.

### AI에게 interactive 권한을 줄 때의 프롬프팅 전략

interactive CLI에서 가장 어려운 건 AI가 언제 사용자 입력을 기다려야 하는지 판단하는 것이다. 명확한 가이드라인이 없으면 AI가 무한정 기다리거나 반대로 너무 빨리 진행해버린다.

효과적인 프롬프트:

> "다음 상황에서만 사용자 확인을 요청해라:
> 1. 파일 삭제나 덮어쓰기 전
> 2. 외부 API 호출 시 비용이 $1 이상 예상될 때  
> 3. 워크플로우가 예상 시간(30초)을 초과할 때
> 4. 에러 발생 시 재시도 전략을 선택해야 할 때
> 
> 일반적인 코드 생성, 파일 읽기, 분석 작업은 자동으로 진행해라."

이렇게 하면 안 된다:

> "필요할 때 사용자에게 물어봐"

구체적인 조건이 없으면 AI가 매번 "이거 해도 돼요?"라고 묻는다. 워크플로우가 끊어진다.

### trust 모드와 auto-respond 조합

`trust` 플래그를 추가해서 반복 작업에서는 확인 과정을 건너뛴다:

```typescript
// 신뢰 모드에서는 위험하지 않은 작업을 자동 승인
if (this.config.trust && !isDangerousOperation(action)) {
  return this.autoRespond(action);
}
```

이 패턴은 AI 에이전트 운영에서 핵심이다. 사용자가 직접 제어할 때는 interactive하게, 배치 작업이나 CI/CD에서는 trust 모드로 완전 자동화한다.

## Adapter 신뢰성 — 멀티 LLM 환경에서 살아남기

### non-interactive 모드별 최적화

Claude, Codex, Gemini 각각 특성이 다르다. 같은 프롬프트라도 어떤 모델은 structured output을 잘 만들고, 어떤 모델은 creative writing을 잘한다. 각 adapter마다 non-interactive 모드를 다르게 설계했다.

Claude adapter:
```typescript
// 긴 작업에서는 중간 checkpoint 생성
if (this.mode === 'batch' && estimatedTime > 60) {
  await this.createCheckpoint(context);
}
```

Codex adapter:
```typescript  
// 코드 생성 시 syntax 검증을 실시간으로
if (this.mode === 'code-gen') {
  return this.validateAndRetry(response);
}
```

Gemini adapter:
```typescript
// 멀티모달 처리 시 리소스 관리
if (this.hasImages(input) && this.mode === 'analysis') {
  await this.optimizeImageSize(input);
}
```

핵심은 각 모델의 강점에 맞춰 mode를 설계하는 것이다. 모든 adapter에 동일한 패턴을 적용하면 성능이 떨어진다.

### SSE deduplication으로 실시간 업데이트 안정화

워크플로우가 길어지면 같은 상태 업데이트가 여러 번 전송된다. 브라우저에서 중복 메시지 때문에 UI가 깨지는 문제가 있었다.

```typescript
// packages/dashboard/src/app/api/sse/route.ts
const seenMessages = new Set<string>();

const deduplicateMessage = (message: string) => {
  const hash = crypto.createHash('sha256').update(message).digest('hex');
  if (seenMessages.has(hash)) {
    return null;
  }
  seenMessages.add(hash);
  return message;
};
```

단순하지만 효과적이다. 메시지 내용을 해시로 만들어서 같은 내용이면 건너뛴다. 하지만 메모리 누수를 방지하려면 주기적으로 `seenMessages`를 정리해야 한다:

```typescript
// 1시간마다 해시 캐시 정리
setInterval(() => {
  seenMessages.clear();
}, 3600000);
```

### singleton persistence로 세션 관리

여러 브라우저 탭에서 같은 워크플로우에 접근할 때 상태 동기화 문제가 있었다. singleton pattern으로 세션을 전역 관리하도록 수정했다:

```typescript
// packages/core/src/session-manager.ts  
class SessionManager {
  private static instance: SessionManager;
  private sessions = new Map<string, WorkflowSession>();

  static getInstance() {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
}
```

이렇게 하면 탭 A에서 워크플로우를 시작하고 탭 B에서 결과를 확인할 수 있다. 특히 장시간 실행되는 작업에서 유용하다.

## 더 나은 방법은 없을까

### WebSocket 대신 SSE를 선택한 이유

실시간 업데이트에 WebSocket을 쓸 수도 있었다. 하지만 SSE를 선택한 이유는:

1. **Reconnection 자동화**: SSE는 connection drop 시 브라우저가 자동으로 재연결한다
2. **Proxy 친화적**: 많은 corporate firewall이 WebSocket을 막는다
3. **디버깅 용이성**: Network 탭에서 메시지 흐름을 쉽게 확인할 수 있다

하지만 양방향 통신이 필요하다면 WebSocket이 낫다. LLMMixer는 서버 → 클라이언트 업데이트가 주력이라 SSE가 맞았다.

### Redis 대신 in-memory 상태 관리

production 환경에서는 Redis같은 external store를 쓰는 게 일반적이다. 하지만 LLMMixer는 개발자 도구 성격이 강해서 설치와 설정을 최소화했다.

대신 graceful shutdown을 구현해서 프로세스 종료 시 중요한 상태를 파일로 저장한다:

```typescript
process.on('SIGINT', async () => {
  await SessionManager.getInstance().persistToFile();
  process.exit(0);
});
```

팀 환경이나 고가용성이 필요하면 Redis adapter를 추가하는 게 맞다. 하지만 개인 개발 환경에서는 over-engineering이다.

### codex 모델의 deprecated 대응

OpenAI Codex가 deprecated되면서 GPT-4를 code generation에 특화해서 쓰고 있다. 하지만 최신 o1 모델이나 Claude 3.5 Sonnet이 코딩에서 더 좋은 결과를 보인다.

현재 구조에서는 adapter만 바꾸면 된다:

```typescript
// 기존 codex adapter 대신
import { O1Adapter } from './adapters/o1';
import { ClaudeAdapter } from './adapters/claude';

const codeGenAdapter = new O1Adapter({ 
  mode: 'reasoning',
  temperature: 0.1 
});
```

모델이 바뀌어도 워크플로우 로직은 그대로 쓸 수 있게 abstraction을 잘 만들어둔 게 도움이 됐다.

## 정리

- **Interactive CLI + lazy loading**: 무거운 dependency는 필요할 때만 로드한다
- **Model별 adapter 최적화**: 각 LLM의 특성에 맞춰 mode와 파라미터를 다르게 설계한다  
- **SSE + deduplication**: 실시간 업데이트에서는 메시지 중복 제거가 필수다
- **Singleton session 관리**: 멀티 탭 환경에서 상태 동기화를 위한 전역 관리

이번 작업의 핵심은 reliability였다. AI 워크플로우는 deterministic하지 않기 때문에 실패 상황을 가정하고 복구 메커니즘을 미리 설계해야 한다. 특히 production에서는 사용자가 중간에 개입할 수 있는 escape hatch를 만들어두는 게 중요하다.

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags  
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements  
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence  
187e632 — feat: initial LLMMixer v0.3 implementation

</details>