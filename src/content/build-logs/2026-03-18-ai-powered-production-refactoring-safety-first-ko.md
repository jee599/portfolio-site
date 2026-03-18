---
title: "출시 직전 대규모 리팩토링을 AI에게 맡기는 법 — 안전장치가 핵심이다"
project: "coffeechat"
date: 2026-03-18
lang: ko
tags: [refactor, fix, feat, typescript]
---

coffeechat 멘토링 플랫폼을 출시하면서 87개 파일을 건드리는 대규모 작업을 진행했다. 테스트 80건 추가, logger 통일, 에러 수정 등을 AI와 함께 처리하면서 터득한 실전 패턴을 공유한다.

## 배경: 무엇을 만들고 있는가

coffeechat은 1:1 멘토링 매칭 서비스다. TossPayments 결제, 관리자 대시보드, 쿠폰 시스템, 세션 리포트까지 갖춘 상업용 플랫폼이다. 

출시 D-7 시점에서 해야 할 일들이 쌓였다. 런타임 에러 수정, 접근성 가이드라인 준수, logger 통일, 페이지네이션 구현, 사업자 정보 환경변수화... 하나하나는 간단하지만 87개 파일에 걸쳐있어서 사람이 하면 며칠 걸린다.

이런 상황에서 AI를 제대로 활용하면 반나절에 끝낼 수 있다. 단, 안전장치 없이 하면 더 큰 문제가 생긴다.

## 테스트 먼저 만들어서 AI가 망가뜨리지 못하게 한다

출시 직전 리팩토링의 핵심은 **기존 기능을 망가뜨리지 않는 것**이다. AI에게 코드를 수정하게 하기 전에 반드시 테스트부터 만든다.

### 테스트 생성 프롬프트 패턴

> "결제 API `/api/payment/confirm` 엔드포인트에 대한 integration test를 작성해줘. 다음 케이스들을 모두 커버해야 한다:
> 
> 1. 정상 결제 확인 (TossPayments webhook)
> 2. 이미 처리된 결제 중복 요청
> 3. 유효하지 않은 paymentKey
> 4. 쿠폰이 적용된 결제
> 5. 환불 후 재결제 시도
> 
> 테스트는 실제 DB 트랜잭션을 실행하고, logger 호출도 검증한다. setup/teardown으로 테스트 데이터를 격리한다."

이렇게 쓰면 안 된다:
> "결제 테스트 만들어줘"

**구체적인 edge case를 명시**하는 게 핵심이다. AI는 happy path만 테스트하려고 한다. 실제 운영에서 터지는 건 예외 상황들이다.

### Claude Code 테스트 자동화 설정

`CLAUDE.md`에 테스트 관련 지시사항을 명확히 적어둔다:

```markdown
## 테스트 정책

- 모든 API 수정 시 관련 테스트를 먼저 작성/수정한다
- integration test는 실제 DB를 사용한다 (test database)
- unit test는 mock을 최소화하고 실제 객체를 쓴다
- 테스트 실패 시 절대 "skip" 하지 않는다

## 명령어

`npm test -- --testPathPattern=payment` : 결제 관련 테스트만 실행
`npm run test:coverage` : 커버리지 확인
```

slash command `/test`를 쓸 때 이 정책이 자동으로 적용된다. AI가 "일단 테스트를 나중에 하자"고 제안하면 거부한다.

## 구조화된 리팩토링으로 사이드이펙트를 통제한다

87개 파일을 한번에 수정하면 뭐가 망가졌는지 파악하기 어렵다. 영역별로 쪼개서 단계적으로 진행한다.

### 1단계: Logger 통일

> "src/app/api 폴더의 모든 route handler에서 console.log를 찾아서 winston logger로 교체해줘. 
> 
> 기존: `console.log('Payment confirmed:', paymentKey)`
> 변경: `logger.info('Payment confirmed', { paymentKey, userId })`
> 
> 로그 레벨 규칙:
> - 에러/예외: logger.error
> - 사용자 액션: logger.info  
> - 디버그 정보: logger.debug
> 
> 민감한 정보(카드번호, 비밀번호)는 절대 로깅하지 마. 한 번에 5개 파일씩 처리하고, 각 파일 수정 후 해당 API의 테스트를 실행해서 확인한다."

**한 번에 5개 파일씩**이 핵심이다. 더 많이 하면 AI가 실수할 확률이 높아진다. 각 단계마다 테스트로 검증해야 rollback이 가능하다.

### 2단계: 환경변수 외부화

> "하드코딩된 사업자 정보를 환경변수로 빼내줘:
> 
> - 회사명: COMPANY_NAME
> - 사업자번호: BUSINESS_NUMBER  
> - 고객센터: CUSTOMER_SERVICE_EMAIL
> 
> `.env.example`에 예시값을 추가하고, 기존 하드코딩 부분을 `process.env.COMPANY_NAME || 'CoffeeChat'` 형태로 교체한다. 빌드 시점에 undefined인 환경변수가 있으면 에러를 던지도록 validation logic도 추가한다."

환경변수 작업은 한 번에 해도 비교적 안전하다. 타입스크립트가 undefined 체크를 해주기 때문이다.

### 3단계: 에러 핸들링 표준화

> "API route handler의 try-catch 블록을 표준 패턴으로 통일한다:
> 
> ```typescript
> try {
>   // 비즈니스 로직
> } catch (error) {
>   logger.error('API 작업명 실패', { 
>     error: error.message, 
>     userId, 
>     timestamp: new Date().toISOString() 
>   });
>   
>   if (error instanceof CustomBusinessError) {
>     return NextResponse.json({ error: error.message }, { status: 400 });
>   }
>   
>   return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
> }
> ```
> 
> 사용자에게 내부 에러 메시지를 그대로 노출하지 마. 로깅은 상세하게, 응답은 안전하게."

이 단계에서 보안 이슈를 함께 해결한다. AI가 놓치기 쉬운 부분이므로 프롬프트에서 명시적으로 언급한다.

## Claude Code hooks로 품질을 자동화한다

대규모 작업에서는 사람이 매번 검토하기 어렵다. pre-commit hook으로 AI가 품질 검사를 자동으로 하게 만든다.

### pre-commit 설정

`.claudehooks/pre-commit.md`:

```markdown
## Pre-commit 체크리스트

1. **테스트 실행**: 수정된 파일과 관련된 테스트가 모두 통과하는가?
2. **타입 체크**: tsc --noEmit 에러가 없는가?
3. **보안 검사**: 민감한 정보가 로그에 남지 않는가?
4. **성능 검사**: N+1 쿼리나 blocking operation이 추가되지 않았는가?
5. **접근성**: aria-label, alt text가 누락되지 않았는가?

체크리스트 중 하나라도 실패하면 commit을 거부한다.
```

Claude Code에서 `/commit` 명령어를 쓸 때 이 hook이 자동 실행된다. 87개 파일 중 일부에서 접근성 이슈가 발견되어 Web Interface Guidelines를 준수하도록 수정할 수 있었다.

### MCP 서버 연동으로 외부 검증

테스트 커버리지나 보안 스캔 같은 건 외부 도구가 더 정확하다. MCP (Model Context Protocol) 서버를 써서 Claude가 이런 도구들을 직접 실행하게 만든다.

`mcp-settings.json`:

```json
{
  "mcpServers": {
    "security-scanner": {
      "command": "npx",
      "args": ["audit-ci", "--config", ".auditrc"],
      "env": {}
    },
    "coverage-checker": {
      "command": "npm", 
      "args": ["run", "test:coverage", "--", "--threshold", "80"],
      "env": {}
    }
  }
}
```

AI가 코드를 수정한 후 자동으로 보안 스캔과 커버리지 체크를 실행한다. 기준에 못 미치면 추가 수정을 제안한다.

## 점진적 배포로 리스크를 분산한다

모든 수정을 한 번에 배포하면 문제가 생겼을 때 원인 파악이 어렵다. feature flag를 써서 점진적으로 배포한다.

### AI와 feature flag 설계

> "logger 통일 작업을 feature flag로 제어할 수 있게 설계해줘. 
> 
> - NEW_LOGGER_ENABLED=true일 때만 winston 사용
> - false면 기존 console.log 유지
> - 운영 환경에서 A/B 테스트 가능하도록
> 
> 성능 오버헤드는 최소화한다. 매 로그마다 환경변수를 읽지 말고, 앱 시작 시점에 한 번만 체크한다."

AI가 제안한 구조:

```typescript
// logger.ts
const USE_NEW_LOGGER = process.env.NEW_LOGGER_ENABLED === 'true';

export const logger = {
  info: USE_NEW_LOGGER ? winston.info : console.log,
  error: USE_NEW_LOGGER ? winston.error : console.error,
  // ...
};
```

이렇게 하면 문제가 생겨도 환경변수 하나만 바꿔서 즉시 rollback할 수 있다.

### 모니터링과 알림 자동화

> "새 logger가 활성화되면 에러 발생률을 추적해서, 기존 대비 20% 이상 증가하면 Slack으로 알림을 보내는 모니터링을 만들어줘. 
> 
> 1분 간격으로 체크하고, 3회 연속 임계값 초과 시 자동으로 feature flag를 비활성화한다."

Claude Code가 생성한 monitoring script는 cron job으로 실행된다. 사람이 24시간 모니터링하지 않아도 자동으로 대응한다.

## 더 나은 방법은 없을까

이 글에서 다룬 방식들보다 더 효율적인 접근법들이 있다.

### Anthropic의 최신 Computer Use API 활용

Claude 3.5 Sonnet의 Computer Use 기능을 쓰면 브라우저에서 직접 테스트할 수 있다. API 수정 후 실제 웹페이지에서 결제 플로우를 자동으로 테스트해서 regression을 잡아낼 수 있다.

현재는 수동으로 테스트 시나리오를 작성했지만, Computer Use로 "실제 사용자처럼" 테스트하면 더 많은 버그를 발견할 수 있다.

### GitHub Copilot Workspace vs Claude Code

대규모 리팩토링에서는 GitHub Copilot Workspace가 더 적합할 수 있다. repository 전체 컨텍스트를 보고 연관된 파일들을 자동으로 찾아서 수정한다. 

Claude Code는 현재 열린 파일 중심으로 작업하기 때문에, 87개 파일 작업에서는 컨텍스트 관리가 번거롭다. 다음에는 Copilot Workspace를 써볼 예정이다.

### Vercel v0 + shadcn/ui 조합

UI 접근성 수정 작업에서는 Vercel v0가 더 효과적이다. Web Interface Guidelines를 prompt로 입력하면 접근성을 준수하는 컴포넌트를 바로 생성한다.

수동으로 `aria-label` 추가하는 것보다, v0에서 컴포넌트를 다시 생성해서 교체하는 게 빠르다.

### Sentry + AI 자동 수정

런타임 에러 수정에서는 Sentry AI Autofix 기능이 유용하다. 실제 production 에러 로그를 보고 근본 원인을 찾아서 수정 코드를 제안한다.

이번에는 Claude Code로 수동 수정했지만, Sentry 연동으로 자동화할 수 있다.

## 정리

- **테스트 먼저**: AI가 코드를 망가뜨려도 즉시 발견할 수 있게 safety net을 구축한다
- **단계적 접근**: 87개 파일을 5개씩 나눠서 처리하면 사이드이펙트를 통제할 수 있다  
- **자동 검증**: pre-commit hook과 MCP 서버로 품질 검사를 자동화한다
- **점진적 배포**: feature flag로 언제든 rollback할 수 있게 만든다

<details>
<summary>이번 작업의 커밋 로그</summary>

7fb780f — refactor: 출시 준비 — logger 통일, 페이지네이션, 사업자 정보 환경변수화
027c470 — fix: Web Interface Guidelines 감사 — 접근성/디자인 수정
97d1094 — test: 테스트 80건 추가 (123→203)
53ba401 — fix: 런타임 에러 2건 + 데드코드 정리
f31c7d8 — feat: 쿠폰 DB 마이그레이션 + MyPage 세션 노트 표시
2d5fc7f — fix: 깨진 로직 7건 수정 — 쿠폰/이메일/정산/검증
7c4ae7b — feat: 관리자 50%/100% 쿠폰 발행 기능
1a15c04 — feat: 상담 경험 가이드 시스템 추가
7759940 — refactor: 세션 리포트를 고민→해결 매핑 구조로 재설계
24d7aed — feat: 세션 확인에 구조화 리포트 통합 (멘토/멘티)
6c43f73 — fix: 핵심 플로우 안정화 — 결제/리뷰/어드민/UX
e2084ba — feat: TossPayments 상품화 준비 — 법률/보안/자동화/UX

</details>