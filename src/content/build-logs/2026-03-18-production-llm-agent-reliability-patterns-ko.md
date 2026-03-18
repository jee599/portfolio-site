---
title: "프로덕션 환경에서 LLM 에이전트 안정화하는 프롬프트 엔지니어링"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer라는 LLM 워크플로 엔진을 v0.3으로 업데이트하면서 프로덕션 환경에서 터지는 모든 문제를 AI와 함께 해결했다. 이 글에서는 복잡한 시스템을 안정화할 때 효과적인 AI 활용 패턴과 프롬프팅 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 Claude, GPT, Gemini를 하나의 워크플로로 연결해서 복잡한 작업을 자동화하는 엔진이다. 개발 단계에서는 잘 돌아가던 코드가 실제 사용자들이 들어오니까 온갖 edge case에서 터졌다.

주요 문제들:
- `node-pty` lazy loading 실패로 터미널 기능 죽음
- SSE(Server-Sent Events) 중복 메시지로 UI 깨짐
- adapter 상태 관리 race condition
- interactive CLI 모드에서 hang 걸림

이런 복잡한 디버깅 작업을 AI에게 맡기려면 단순히 "버그 찾아줘"로는 안 된다. 체계적인 접근이 필요하다.

## 시스템 컨텍스트를 AI에게 완벽하게 전달하는 법

복잡한 시스템 디버깅에서 가장 중요한 건 AI가 전체 아키텍처를 이해하게 만드는 것이다.

### 효과적인 시스템 분석 프롬프트

> TypeScript 기반 LLM 워크플로 엔진의 production reliability 이슈를 분석해줘.
> 
> **아키텍처 개요:**
> - Core: adapter pattern으로 Claude/GPT/Gemini 통합
> - Dashboard: Next.js 기반 웹 UI, SSE로 실시간 상태 동기화
> - CLI: node-pty로 interactive 터미널 모드 지원
> 
> **현재 문제:**
> 1. `node-pty` require() 시점에 따라 intermittent failure
> 2. SSE duplicate message causing state corruption
> 3. adapter non-interactive 모드에서 hanging
> 
> **분석 우선순위:**
> - Race condition 가능성 높은 부분 먼저
> - lazy loading pattern 검증
> - singleton persistence 로직 검토
> 
> 각 문제별로 root cause와 fix strategy를 제시해줘.

이렇게 하면 안 된다:
> "코드에 버그가 있는데 찾아줘"

차이점은 **컨텍스트의 구조화**다. AI가 어떤 관점에서 분석해야 하는지, 어떤 우선순위로 접근해야 하는지 명확하게 제시했다.

### CLAUDE.md로 지속적인 컨텍스트 유지

복잡한 시스템을 다룰 때는 세션 간에 컨텍스트가 유지되어야 한다. `CLAUDE.md`에 이런 식으로 작성한다:

```markdown
# LLMMixer v0.3 System Context

## Architecture
- Adapter pattern: base.ts → claude.ts/codex.ts/gemini.ts
- Session management: singleton with persistence
- CLI modes: interactive (node-pty) / non-interactive (stdio)

## Current Focus: Production Reliability
- node-pty lazy loading issues
- SSE deduplication
- adapter state race conditions

## Debugging Constraints
- Must maintain backward compatibility
- Interactive CLI 성능 저하 불가
- SSE 메시지 순서 보장 필수
```

이렇게 하면 새로운 대화를 시작할 때마다 전체 컨텍스트를 다시 설명할 필요가 없다.

## lazy loading 패턴을 AI와 함께 최적화하기

`node-pty`는 native dependency라서 모든 환경에서 사용할 수 없다. 그래서 lazy loading으로 처리해야 하는데, 이걸 AI에게 최적화하게 할 때 핵심은 **제약 조건을 명확하게 주는 것**이다.

### 제약 조건 기반 코드 생성 프롬프트

> `node-pty` lazy loading pattern을 production-safe하게 리팩토링해줘.
> 
> **제약 조건:**
> 1. `require('node-pty')` 실패해도 앱 전체가 죽으면 안 됨
> 2. CLI interactive 모드가 아닐 때는 node-pty 로드하지 않음
> 3. 첫 번째 로드 실패 후 재시도 메커니즘 필요
> 4. TypeScript에서 optional dependency 타입 안전성 확보
> 
> **현재 문제:**
> - `const pty = require('node-pty')` 동기 로딩으로 blocking
> - 실패 시 fallback 로직 없음
> - import 타이밍 race condition
> 
> **목표:**
> - graceful degradation
> - error boundary 패턴 적용
> - 성능 저하 없음

이 프롬프트의 핵심은 **구체적인 제약 조건**이다. "안전하게 만들어줘"가 아니라 정확히 어떤 조건을 만족해야 하는지 명시했다.

AI가 제안한 코드:

```typescript
let nodepty: any = null;
let nodeptyLoadAttempted = false;

async function loadNodePty(): Promise<any> {
  if (nodeptyLoadAttempted && !nodepty) {
    return null; // 이전에 실패했으면 재시도하지 않음
  }
  
  if (!nodeptyLoadAttempted) {
    try {
      nodepty = require('node-pty');
      nodeptyLoadAttempted = true;
    } catch (error) {
      console.warn('node-pty not available, interactive CLI disabled');
      nodeptyLoadAttempted = true;
      return null;
    }
  }
  
  return nodepty;
}
```

### 점진적 개선 패턴

AI가 첫 번째 제안한 코드가 완벽하지 않을 수 있다. 이때 **점진적 피드백**을 주는 게 효과적이다:

> 위 코드에서 개선점:
> 1. `nodeptyLoadAttempted` flag만으로는 재시도 시점을 제어하기 어렵다
> 2. error logging이 너무 단순하다
> 3. TypeScript에서 `any` 타입 사용은 타입 안전성을 해친다
> 
> retry strategy와 proper typing을 추가해서 다시 작성해줘.

이런 식으로 구체적인 개선 포인트를 제시하면 AI가 더 정확한 코드를 생성한다.

## SSE 중복 제거와 상태 동기화 디버깅

실시간 웹 앱에서 SSE(Server-Sent Events) 중복 메시지는 치명적이다. 특히 상태 관리가 복잡한 시스템에서는 더욱 그렇다.

### 상태 동기화 문제 분석 프롬프트

> SSE 중복 메시지로 인한 state corruption을 해결해줘.
> 
> **현재 구조:**
> - Next.js API route에서 SSE stream 생성
> - multiple clients가 같은 workflow 구독
> - client side에서 EventSource로 실시간 업데이트 수신
> 
> **문제 상황:**
> - 같은 event가 multiple times로 전송됨
> - client state가 inconsistent해짐
> - browser에서 connection retry 시 duplicate subscription
> 
> **분석 포인트:**
> 1. server-side deduplication 로직 검토
> 2. client-side EventSource lifecycle 관리
> 3. subscription cleanup 메커니즘
> 
> 각 레이어별로 문제점과 해결방안을 제시해줘.

### 멀티 레이어 디버깅 전략

복잡한 실시간 시스템은 여러 레이어에서 문제가 발생한다. AI에게 **레이어별 분석**을 시키는 게 효과적이다:

> **Server Layer 분석:**
> - SSE connection pool 관리 방식
> - message broadcasting 로직
> - client reconnection handling
> 
> **Client Layer 분석:**
> - EventSource connection state
> - duplicate event filtering
> - cleanup on page unload
> 
> **Message Layer 분석:**
> - event ID 체계
> - timestamp 기반 deduplication
> - idempotency 보장

AI가 제안한 해결책:

```typescript
// Server-side deduplication
const sentMessages = new Map<string, Set<string>>();

function sendSSE(clientId: string, eventData: any) {
  const messageId = `${eventData.workflowId}-${eventData.stepId}-${eventData.timestamp}`;
  
  if (!sentMessages.has(clientId)) {
    sentMessages.set(clientId, new Set());
  }
  
  const clientMessages = sentMessages.get(clientId)!;
  if (clientMessages.has(messageId)) {
    return; // 이미 전송한 메시지
  }
  
  clientMessages.add(messageId);
  res.write(`id: ${messageId}\ndata: ${JSON.stringify(eventData)}\n\n`);
}
```

## 더 나은 방법은 없을까

이 글에서 다룬 패턴들보다 더 효율적인 대안들이 있다:

### Event Sourcing Pattern으로 상태 관리 단순화

SSE 중복 제거를 server에서 처리하는 대신, Event Sourcing 패턴을 쓰면 더 깔끔하다:

```typescript
// 각 client가 마지막 수신한 event ID를 기억
// server는 해당 ID 이후의 events만 전송
app.get('/api/sse/:lastEventId', (req, res) => {
  const lastEventId = req.params.lastEventId;
  const events = getEventsAfter(lastEventId);
  // ...
});
```

### WebSocket으로 양방향 통신

SSE는 단방향이라 client에서 server로 feedback을 줄 수 없다. WebSocket을 쓰면 connection state를 양쪽에서 관리할 수 있어서 더 안정적이다.

### Observable Pattern으로 상태 스트림 관리

RxJS 같은 observable library를 쓰면 복잡한 상태 동기화 로직을 declarative하게 작성할 수 있다:

```typescript
const workflowUpdates$ = fromEventSource('/api/sse')
  .pipe(
    distinctUntilKeyChanged('messageId'), // 중복 제거
    shareReplay(1) // 마지막 상태 캐싱
  );
```

### 최신 도구 활용

2024년 이후 나온 도구들을 보면:
- **Anthropic의 Model Context Protocol(MCP)**: 시스템 컨텍스트를 더 효율적으로 관리
- **Claude의 새로운 artifacts 기능**: 코드 생성과 즉시 실행을 한 번에
- **GitHub Copilot Workspace**: 전체 프로젝트 컨텍스트에서 디버깅

특히 MCP를 쓰면 프로젝트 구조, 의존성 관계, 설정 파일을 AI가 자동으로 인식해서 더 정확한 디버깅을 할 수 있다.

## 정리

- **시스템 컨텍스트 구조화**: AI가 전체 아키텍처를 이해하도록 우선순위와 제약 조건을 명확하게 제시한다
- **점진적 피드백**: 첫 번째 AI 결과물에 구체적인 개선점을 제시해서 반복적으로 품질을 높인다  
- **레이어별 분석**: 복잡한 문제를 여러 레이어로 나누어 각각 독립적으로 디버깅한다
- **제약 조건 기반 코딩**: "안전하게 만들어줘"가 아니라 구체적인 조건과 목표를 제시한다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags  
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements  
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence  
187e632 — feat: initial LLMMixer v0.3 implementation

</details>