---
title: "멀티모달 LLM 프록시 서버 만들면서 배운 에이전트 협업 패턴"
project: "llmmixer_claude"
date: 2026-03-18
lang: ko
tags: [fix, feat, typescript, css]
---

LLMMixer 프록시 서버를 Claude, Codex, Gemini 3개 모델로 확장하면서 겪은 복잡한 비동기 처리와 상태 관리를 AI 에이전트와 협업으로 해결했다. 7,000줄 코드에서 발견한 효과적인 멀티 에이전트 협업 패턴과 프롬프팅 전략을 공유한다.

## 배경: 무엇을 만들고 있는가

LLMMixer는 여러 LLM 모델을 통합해서 워크플로우를 실행하는 프록시 서버다. Claude API 하나만 쓰던 걸 Codex와 Gemini까지 추가하면서 문제가 터졌다. 각 모델마다 응답 형식이 다르고, 비동기 처리 방식도 달라서 adapter 패턴으로 추상화했지만 edge case들이 계속 나왔다.

특히 production에서 SSE(Server-Sent Events) 중복 전송, 세션 persistence 실패, interactive CLI 명령어 처리 버그가 연쇄적으로 발생했다. 5개 커밋에서 63개 파일을 수정해야 했는데, 이걸 혼자 하면 최소 2주는 걸릴 작업이었다.

## AI 에이전트를 전문 분야별로 분업시키는 법

큰 시스템을 여러 에이전트에게 나눠 맡길 때 가장 중요한 건 **책임 범위를 명확히 나누는 것**이다. 파일 단위로 나누면 안 되고, 기능적 관심사로 나눠야 한다.

### 에이전트 역할 분담 전략

이번 작업에서 3개 에이전트를 이렇게 분업시켰다:

**Agent A: Adapter 전문가**
- Claude, Codex, Gemini adapter의 streaming 처리
- 각 모델별 응답 형식 정규화
- non-interactive/interactive 모드 분기 로직

**Agent B: Infrastructure 전문가**  
- SSE deduplication 로직
- session persistence와 singleton 관리
- node-pty를 이용한 CLI process spawning

**Agent C: API 전문가**
- Next.js API routes 최적화
- 에러 핸들링과 response validation
- dashboard UI와 backend 연동

각 에이전트에게 줄 프롬프트는 다음 패턴을 따른다:

> "당신은 [역할] 전문가다. [구체적 책임 범위]만 담당한다. 다른 영역은 건드리지 않는다. 
>
> 현재 문제: [구체적 버그나 요구사항]
>
> 제약조건:
> - 기존 인터페이스를 변경하지 않는다
> - [다른 에이전트가 작업 중인 파일들] 건드리지 않는다  
> - 변경 사항은 [구체적 범위]에만 국한한다"

실제로 Adapter 전문가에게 준 프롬프트:

> "당신은 LLM adapter 전문가다. Claude, Codex, Gemini의 streaming response 처리만 담당한다.
>
> 현재 문제: Codex가 interactive mode에서 응답을 중간에 끊는다. Claude는 정상 작동한다.
>
> 제약조건:
> - BaseAdapter 인터페이스 변경 금지
> - session-manager.ts나 workflow-engine.ts 수정 금지  
> - 오직 adapters/ 디렉토리 내 파일만 수정
> - streaming 중단 시 명확한 에러 메시지 필요"

이렇게 하면 각 에이전트가 서로 충돌하지 않고 병렬로 작업할 수 있다.

### 에이전트 간 의존성 관리

멀티 에이전트 작업에서 가장 까다로운 부분이 **인터페이스 변경**이다. A가 수정한 함수를 B가 호출하는 경우, 변경 순서가 중요하다.

이런 상황에서 쓰는 패턴:

1. **Contract-First 접근법**: 먼저 TypeScript 타입 정의를 확정한다
2. **Stub 구현**: 각 에이전트가 인터페이스만 구현하고 로직은 나중에 채운다  
3. **Integration 단계**: 모든 에이전트 작업이 끝나면 통합 테스트

실제 적용 예시:

```typescript
// 먼저 모든 에이전트가 합의한 인터페이스
interface StreamingResponse {
  chunk: string;
  isComplete: boolean;
  metadata?: Record<string, any>;
}
```

각 에이전트에게 이 인터페이스를 지키도록 강제했다. Gemini adapter 담당 에이전트에게는:

> "StreamingResponse 인터페이스를 반드시 준수해라. Gemini의 original response를 이 형식으로 변환하는 mapper 함수를 만들어라."

## node-pty와 interactive CLI 처리에서 발견한 프롬프팅 패턴

이번 작업에서 가장 까다로웠던 부분이 `node-pty`를 이용한 interactive CLI 처리였다. 터미널 프로세스를 spawn하고, stdin/stdout을 웹 인터페이스와 연결하는 작업인데 race condition과 memory leak이 계속 발생했다.

### 시스템 프로그래밍용 프롬프트 패턴

일반적인 웹 개발과 달리, 시스템 레벨 프로그래밍을 AI에게 시킬 때는 **안전성과 리소스 정리**를 강조해야 한다.

효과적인 프롬프트:

> "node-pty로 bash process를 spawn하는 함수를 만들어라.
>
> 필수 요구사항:
> - process가 죽으면 반드시 cleanup 함수 호출
> - 10초 timeout 후 자동 SIGKILL  
> - memory leak 방지를 위한 event listener 제거
> - concurrent access 방지용 mutex 적용
>
> 참고: 이 함수는 production에서 동시에 100개까지 호출될 수 있다."

이렇게 **운영 환경의 제약조건**을 구체적으로 알려주면 AI가 더 견고한 코드를 작성한다. 특히 "동시에 100개까지"라는 구체적 숫자가 중요하다.

반대로 이렇게 하면 안 된다:

> "터미널 연결하는 코드 만들어줘"

너무 추상적이라서 AI가 toy example 수준으로만 구현한다.

### lazy loading과 require() 이슈 해결

`node-pty`는 네이티브 모듈이라서 import timing이 중요하다. 특히 Next.js 같은 SSR 환경에서는 서버 사이드에서만 로드해야 한다.

이런 edge case를 AI에게 설명할 때 쓴 프롬프트:

> "`node-pty`를 dynamic import로 lazy loading해야 한다. 
>
> 문제 상황:
> - Next.js 빌드 시 'module not found' 에러
> - 브라우저 환경에서 native module 접근 시도
> - SSR과 CSR 간 hydration mismatch
>
> 해결 방법:
> - 함수 호출 시점에 `await import('node-pty')`
> - process.browser 체크로 환경 분기
> - 실패 시 graceful degradation"

구체적인 에러 메시지와 발생 조건을 알려주니까 AI가 정확한 해결책을 제시했다. 특히 "hydration mismatch"같은 Next.js 특화 용어를 쓰면 더 정교한 답변을 받을 수 있다.

## SSE deduplication과 상태 관리 패턴

프록시 서버에서 가장 복잡한 부분이 **여러 클라이언트에게 실시간 스트리밍**을 제공하는 것이다. 같은 요청에 대해 중복 응답이 전송되거나, 세션이 꼬이는 문제가 계속 발생했다.

### 상태 관리용 프롬프트 설계

복잡한 상태 관리 로직을 AI에게 맡길 때는 **상태 전이도**를 텍스트로 표현해서 프롬프트에 포함시킨다.

실제 사용한 프롬프트:

> "SSE 세션 관리자를 구현해라. 상태는 다음과 같이 전이된다:
>
> IDLE → CONNECTED (클라이언트 접속)
> CONNECTED → STREAMING (데이터 전송 시작)  
> STREAMING → CONNECTED (데이터 전송 완료)
> CONNECTED → IDLE (클라이언트 연결 해제)
> 
> 예외 상황:
> - STREAMING 중 클라이언트 연결 끊김 → CLEANUP → IDLE
> - 같은 sessionId로 중복 접속 → 기존 세션 terminate
>
> 구현 규칙:
> - 각 상태 전이마다 로그 출력
> - CLEANUP 시 pending promises 모두 정리
> - memory leak 방지용 WeakMap 사용"

이렇게 **상태도와 예외 처리**를 명시하면 AI가 edge case까지 고려한 코드를 작성한다.

### singleton 패턴의 함정

Node.js 환경에서 singleton을 구현할 때 자주 빠지는 함정이 있다. 특히 hot reload나 process restart 상황에서 상태가 꼬인다.

AI에게 이 문제를 설명할 때:

> "SessionManager를 singleton으로 구현하되, Next.js dev mode의 hot reload를 고려해라.
>
> 문제 상황:
> - 코드 수정 시 module이 다시 로드되면서 새로운 singleton 인스턴스 생성
> - 기존 연결들은 old instance에 남아있어서 cleanup 안 됨
> - 결과적으로 memory leak과 orphan connections
>
> 해결책:
> - globalThis에 instance 저장해서 hot reload 간에도 유지  
> - 새 instance 생성 시 기존 instance의 cleanup() 호출
> - process.exit handler로 graceful shutdown"

이런 환경 특화 이슈를 구체적으로 설명하면 AI가 더 실용적인 해결책을 제시한다.

## 더 나은 방법은 없을까

이번에 사용한 멀티 에이전트 협업 패턴은 효과적이었지만, 몇 가지 개선점이 있다.

### MCP(Model Context Protocol) 활용

Anthropic이 최근 공개한 MCP를 쓰면 에이전트 간 컨텍스트 공유를 더 체계적으로 할 수 있다. 특히 코드베이스가 큰 경우 각 에이전트가 필요한 컨텍스트만 선별적으로 로드할 수 있다.

현재 방식:
- 각 에이전트에게 전체 코드베이스 전달
- 불필요한 파일까지 컨텍스트에 포함
- token 낭비와 응답 품질 저하

MCP 활용 시:
- 에이전트별로 필요한 파일만 동적 로드
- 의존성 그래프 기반 컨텍스트 관리  
- token 효율성 대폭 개선

### 구조화된 에이전트 워크플로우

현재는 에이전트별 작업을 수동으로 조율했지만, LangGraph나 CrewAI 같은 프레임워크를 쓰면 더 체계적으로 관리할 수 있다.

특히 이번 작업에서 "Adapter 수정 → Infrastructure 업데이트 → API 테스트" 순서가 중요했는데, 이런 dependency를 워크플로우로 정의하면 자동화할 수 있다.

### AI 코드 리뷰 프로세스

7,000줄 코드 변경에서 휴먼 리뷰만으론 한계가 있다. Claude의 코드 리뷰 기능을 체계적으로 활용하면 더 좋다.

효과적인 AI 리뷰 프롬프트:

> "다음 관점에서 코드를 리뷰해라:
> 1. Race condition 가능성 (특히 async/await)
> 2. Memory leak 위험성 (event listener, timer 등)  
> 3. Error boundary 누락
> 4. Type safety 이슈
> 
> 각 이슈마다 구체적인 수정 방안 제시해라."

## 정리

- **에이전트 분업 시 기능별 관심사로 나누고, 인터페이스를 먼저 확정**한다
- **시스템 프로그래밍용 프롬프트는 안전성과 동시성을 강조**해야 한다  
- **복잡한 상태 관리는 상태 전이도를 텍스트로 표현**해서 AI에게 전달한다
- **환경 특화 이슈(Next.js, hot reload 등)를 구체적으로 설명**하면 더 실용적인 해결책을 얻는다

<details>
<summary>이번 작업의 커밋 로그</summary>

86357ca — fix: node-pty require() lazy load, trust auto-respond, codex flags
4e71b99 — fix: critical reliability issues for production readiness  
bec39bf — feat: node-pty for interactive CLI, UX improvements
0086dcc — fix: adapter non-interactive modes, SSE dedup, singleton persistence
187e632 — feat: initial LLMMixer v0.3 implementation

</details>