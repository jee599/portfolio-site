---
title: "AI로 결제 시스템 구축하기 — 다중 PG사 통합할 때 놓치면 안 되는 프롬프팅 패턴"
project: "saju_global"
date: 2026-03-12
lang: ko
tags: [fix, typescript, css]
---

복잡한 결제 시스템을 AI와 함께 구축했다. 토스페이먼츠와 Paddle을 동시에 연동하고, 국가별 분기 처리, 웹훅 검증, i18n까지 한 번에 처리하는 과정에서 효과적인 프롬프팅 패턴을 발견했다. 이 글에서는 AI에게 복잡한 비즈니스 로직을 구현시킬 때 반드시 알아야 할 구조화 전략을 다룬다.

## 배경: 무엇을 만들고 있는가

사주 분석 앱에서 글로벌 결제 시스템을 구축 중이다. 한국 사용자에게는 토스페이먼츠, 해외 사용자에게는 Paddle을 제공해야 한다. 단순한 결제 연동이 아니라 국가별 분기, 환율 처리, 웹훅 검증, 실패/성공 페이지, i18n까지 모든 퍼널을 완성해야 했다.

이런 작업을 AI에게 시킬 때 가장 큰 함정은 "결제 시스템 만들어줘"라고 던지는 것이다. AI는 결제 로직은 만들어주지만 실제 서비스에 필요한 엣지 케이스, 보안 검증, 사용자 경험을 놓친다. 어떻게 해결했는지 보자.

## 결제 플로우 설계: 제약 조건부터 정의한다

AI에게 결제 시스템을 만들게 할 때 가장 중요한 것은 **제약 조건을 먼저 명시**하는 것이다. 기능 요구사항보다 제약 조건이 우선이다.

### 효과적인 프롬프트 구조

> "한국/해외 사용자를 위한 이중 결제 시스템을 구축한다. 제약 조건:
> 1. 한국(KR): 토스페이먼츠만, 원화 결제
> 2. 해외: Paddle만, USD 결제  
> 3. 국가 감지 실패 시 기본값은 해외로 처리
> 4. PCI DSS 준수 - 카드 정보는 절대 서버에 저장하지 않음
> 5. 웹훅 검증 실패 시 결제 상태 업데이트 금지
> 6. 모든 결제 페이지는 i18n 지원 필수
> 
> 현재 프로젝트 구조: Next.js App Router, `/api/checkout/[provider]/` 라우트 구조 사용"

이렇게 쓰면 안 된다:

> "토스페이먼츠랑 Paddle 결제 만들어줘"

제약 조건 없는 프롬프트는 AI가 임의로 판단한 로직을 만든다. 특히 결제처럼 민감한 영역에서는 치명적이다.

### Claude Code 설정: `CLAUDE.md`에 결제 컨텍스트 추가

```markdown
## Payment System Context

### Architecture
- Dual PG: TossPayments (KR) + Paddle (Global)
- Country detection via `/packages/shared/src/config/countries.ts`
- Webhook validation required for all state changes

### Security Rules
- Never store card data
- Always validate webhook signatures
- Rate limit all payment endpoints
- CSP headers for payment pages

### File Patterns
- Payment routes: `/app/api/checkout/[provider]/`
- Payment pages: `/app/[locale]/checkout/[provider]/`
- Tests: `/__tests__/api/checkout.test.ts`
```

이 설정이 없으면 AI가 매번 결제 로직의 전체 맥락을 다시 파악해야 한다. `CLAUDE.md`에 핵심 제약을 박아두면 일관성 있는 코드가 나온다.

## 웹훅 검증: 보안 로직을 AI에게 맡기는 법

결제 웹훅은 보안이 생명이다. 서명 검증 실패하면 해커가 임의로 결제 완료 처리할 수 있다. AI에게 웹훅을 만들게 할 때는 **검증 로직을 우선순위 1번으로** 잡아야 한다.

### 보안 우선 프롬프트 패턴

> "토스페이먼츠 웹훅 엔드포인트를 구현한다. 처리 순서 강제:
> 
> 1. 서명 검증 (토스 공식 문서 기준)
> 2. 검증 실패 시 즉시 400 리턴, 로그 남김
> 3. 검증 성공 시에만 DB 업데이트
> 4. 멱등성 보장 - 같은 orderId 중복 처리 방지
> 5. 예외 발생 시 500 리턴하되 사용자에게 상세 에러 노출 금지
> 
> 기존 파일: `/app/api/checkout/paddle/webhook/route.ts` 참고해서 일관성 유지
> 
> 토스 서명 검증 로직:
> ```
> const signature = headers.get('toss-signature')
> const body = await request.text()
> const expectedSignature = createHmac('sha256', TOSS_SECRET).update(body).digest('base64')
> if (signature !== expectedSignature) throw new Error('Invalid signature')
> ```"

이런 프롬프트를 쓰면 AI가 보안을 우선시하는 코드를 만든다. 반대로 "웹훅 만들어줘"라고 하면 기능은 돌아가지만 보안 홀이 생긴다.

### Paddle vs 토스 웹훅의 차이점 명시

각 PG사마다 웹훅 구조가 다르다. AI가 혼동하지 않도록 **차이점을 명시적으로** 알려준다.

> "Paddle과 토스의 웹훅 차이점:
> - Paddle: `paddle-signature` 헤더, RSA 공개키 검증  
> - 토스: `toss-signature` 헤더, HMAC SHA256 검증
> - Paddle: transaction.completed 이벤트
> - 토스: DONE 상태값 확인
> 
> 각각 별도 validation 함수로 분리할 것"

이렇게 하면 AI가 두 PG사 로직을 섞지 않고 깔끔하게 분리한다.

## 국가별 분기 처리: 비즈니스 로직의 구조화

결제 시스템에서 가장 복잡한 부분은 국가별 분기다. 사용자 위치에 따라 다른 PG, 다른 통화, 다른 결제 방식을 제공해야 한다.

### 분기 로직 프롬프트 전략

> "`usePaywall` 훅을 수정한다. 국가 감지 로직:
> 
> ```typescript
> const getPaymentProvider = (countryCode: string) => {
>   // KR: 토스페이먼츠 (원화)
>   if (countryCode === 'KR') return 'toss'
>   // 그 외: Paddle (USD)  
>   return 'paddle'
> }
> ```
> 
> 폴백 전략:
> 1. URL 쿼리 `?country=KR` 우선
> 2. 없으면 IP 기반 국가 감지
> 3. 감지 실패 시 기본값 'paddle'
> 
> 기존 `/hooks/usePaywall.ts` 파일 구조 유지하되, `provider` 필드 추가"

여기서 핵심은 **폴백 전략을 명시**한 것이다. AI는 해피 패스는 잘 만들지만 예외 상황 처리를 놓친다. 모든 엣지 케이스를 프롬프트에 포함시켜야 한다.

### 환경 변수 분리 패턴

결제 시스템은 환경 변수가 많다. 토스용, Paddle용, 개발/운영 분리까지 하면 복잡해진다.

> "`.env.example` 업데이트. 결제 관련 환경 변수를 그룹별로 정리:
> 
> ```bash
> # TossPayments
> TOSS_CLIENT_KEY=test_ck_xxxxx
> TOSS_SECRET_KEY=test_sk_xxxxx  
> TOSS_WEBHOOK_SECRET=xxxxx
> 
> # Paddle  
> PADDLE_VENDOR_ID=xxxxx
> PADDLE_API_KEY=xxxxx
> PADDLE_WEBHOOK_SECRET=xxxxx
> 
> # Payment URLs
> PAYMENT_SUCCESS_URL=http://localhost:3000/checkout/success
> PAYMENT_FAIL_URL=http://localhost:3000/checkout/fail
> ```
> 
> 기존 `.env.example` 파일에 추가하되, 알파벳 순서로 정렬"

이렇게 하면 AI가 환경 변수를 체계적으로 관리하는 코드를 만든다.

## i18n 처리: 다국어 결제 페이지의 함정

결제 페이지의 다국어 처리는 까다롭다. 에러 메시지, 버튼 텍스트, 통화 표시까지 모두 번역해야 한다.

### 결제 페이지 i18n 프롬프트

> "결제 성공/실패 페이지에 i18n 적용. 번역 key 규칙:
> 
> ```json
> {
>   \"payment\": {
>     \"success\": {
>       \"title\": \"Payment Successful\",
>       \"description\": \"Your payment has been processed\"  
>     },
>     \"fail\": {
>       \"title\": \"Payment Failed\", 
>       \"retry\": \"Try Again\"
>     }
>   }
> }
> ```
> 
> 기존 `/i18n/messages/en/common.json` 구조 유지
> 통화 표시: KR 사용자에게는 '₩', 해외 사용자에게는 '$'
> 
> 페이지별 번역 key:
> - `/checkout/toss/success`: payment.success.*
> - `/checkout/toss/fail`: payment.fail.*"

여기서 중요한 건 **번역 key 네이밍 컨벤션**을 명시한 것이다. AI가 임의로 key를 만들면 나중에 정리하기 어렵다.

### 동적 번역값 처리

결제 금액, 주문번호 같은 동적 값을 번역에 포함시킬 때도 패턴이 필요하다.

> "동적 값이 포함된 번역 처리:
> 
> ```typescript  
> t('payment.success.amount', { amount: formatCurrency(price, currency) })
> ```
> 
> 번역 key:
> ```json
> {
>   \"payment.success.amount\": \"Amount paid: {{amount}}\"
> }
> ```
> 
> `formatCurrency` 함수는 통화별로 다르게 포맷팅:
> - KRW: 1,000원
> - USD: $10.00"

이런 세부 사항까지 프롬프트에 포함시켜야 AI가 일관성 있는 코드를 만든다.

## 더 나은 방법은 없을까

이 글에서 다룬 방식 외에 더 효율적인 패턴들이 있다.

### Anthropic의 최신 Computer Use API 활용

Claude의 Computer Use 기능을 쓰면 실제 결제 플로우를 브라우저에서 테스트하면서 코드를 수정할 수 있다. 결제 페이지 UI/UX 개선에 특히 효과적이다.

```bash
# Claude Desktop에서 Computer Use 활성화
# 결제 페이지를 실제로 조작하면서 개선점 발견
```

### Stripe의 결제 설계 패턴 참고

Stripe 공식 문서의 webhook 처리 패턴이 이 글보다 더 견고하다. 특히 idempotency key 처리와 retry 로직은 Stripe 방식이 업계 표준이다.

### MCP 서버로 결제 로직 검증

Model Context Protocol 서버를 만들어서 결제 로직의 보안 검증을 자동화할 수 있다. 웹훅 서명 검증 누락, 환경 변수 하드코딩 같은 문제를 commit 전에 잡아낼 수 있다.

### TypeScript 타입 우선 설계

이 글에서는 프롬프트로 제약 조건을 전달했지만, TypeScript 인터페이스로 먼저 타입을 정의하고 AI에게 구현시키는 게 더 안전하다.

```typescript
interface PaymentProvider {
  createPayment(amount: number, currency: string): Promise<PaymentResult>
  verifyWebhook(signature: string, body: string): boolean
}
```

타입이 있으면 AI가 실수할 여지가 줄어든다.

## 정리

- 결제 시스템을 AI에게 맡길 때는 기능보다 제약 조건을 먼저 명시한다
- 웹훅 검증 같은 보안 로직은 처리 순서를 강제로 지정해야 한다  
- 국가별 분기 로직에서는 모든 엣지 케이스와 폴백 전략을 프롬프트에 포함시킨다
- i18n과 결제를 함께 다룰 때는 번역 key 네이밍 컨벤션을 미리 정한다

<details>
<summary>이번 작업의 커밋 로그</summary>

c759b45 — Claude/check status planning ipml m (#15)
41602f1 — Claude/check status planning ipml m (#14)  
e4d94a2 — Claude/check status planning ipml m (#13)
a57c38b — Claude/check status planning ipml m (#12)
df7c2d9 — fix: report page Suspense, remove /api/events rate limit, CSP blob: for palm
121086b — fix: QA critical fixes — Korean Paddle migration, security, email i18n, palm validation

</details>