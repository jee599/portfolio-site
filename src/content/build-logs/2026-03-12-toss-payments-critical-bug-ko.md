---
title: "Toss 결제 파이프라인 구축, 그리고 한국 결제가 통째로 죽었던 이야기"
project: FateSaju
date: 2026-03-12
lang: ko
pair: claude-sonnet-4-6
tags: [toss-payments, webhook, email, i18n, production-bug, debugging]
---

새벽 0시 35분에 시작한 세션이었다. 목표는 간단했다. Toss Payments를 완전히 붙이는 것. 결제 위젯, 서버 사이드 검증, webhook, 영수증 이메일까지 한 번에.

그런데 12시간 뒤, 한국 결제가 통째로 죽어 있었다.

<hr class=section-break>

## Toss 파이프라인: 새벽 3시간

결제 페이지 → 서버 검증 → webhook → 이메일까지 파이프라인을 처음부터 끝까지 이었다. 각 단계가 독립적으로 실패해도 괜찮도록 설계했다.

`/checkout/toss` 페이지는 `@tosspayments/tosspayments-sdk` 위젯을 감싼 얇은 래퍼다. 결제가 완료되면 success 페이지로 리다이렉트하고, 거기서 서버에 검증 요청을 보낸다.

webhook은 HMAC-SHA-256으로 서명 검증을 구현했다. Toss가 비동기로 쏘는 결제 확정 이벤트를 놓치면 주문이 영원히 `pending` 상태로 남는다. 실제 서비스에서 이건 환불 요청의 씨앗이 된다.

```
POST /api/checkout/toss/confirm  (사용자 브라우저 → 서버, 동기)
POST /api/checkout/toss/webhook  (Toss 서버 → 서버, 비동기, HMAC 검증)
```

영수증 이메일은 `sendReceiptEmail.ts` 하나에 8개 로케일을 전부 넣었다. 310줄짜리 파일이지만 언어 분기가 전부다. 실제 HTML 렌더링 로직은 공통이다.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>2c58ca3</span> <span class=msg>feat: add Toss Payments integration and business info footer</span></div>
<div class=commit-row><span class=hash>eb3b125</span> <span class=msg>feat: add Toss webhook, payment receipt email (8-locale i18n)</span></div>
<div class=commit-row><span class=hash>5f7ef27</span> <span class=msg>feat: add coming-soon confirmation email, fix checkout test</span></div>
<div class=commit-row><span class=hash>6646720</span> <span class=msg>디자인 시스템 통일 및 이메일 업데이트</span></div>
</div>

<div class=callout-stats>
<div class=stat-grid>
<div class=stat-item><span class=stat-value>3</span><span class=stat-label>새 이메일 타입</span></div>
<div class=stat-item><span class=stat-value>8</span><span class=stat-label>지원 로케일</span></div>
<div class=stat-item><span class=stat-value>523</span><span class=stat-label>추가 라인 (webhook+영수증)</span></div>
</div>
</div>

<hr class=section-break>

## 디자인 시스템 정리

새벽 1시 27분 커밋. 코드보다 CSS였다.

`globals.css`에 폰트가 4개였다. Pretendard, Sora, Manrope, Italiana. 각자 다른 사람이 붙인 것처럼 뒤섞여 있었다. Pretendard(본문) + Outfit(디스플레이) 2개로 줄였다.

버튼 border-radius가 컴포넌트마다 8px, 12px, 16px로 제각각이었다. 14px로 통일했다. 카드 글래스모피즘도 일관성 없이 퍼져 있었다. 건드릴 때마다 다른 느낌이 나는 UI는 사용자 신뢰를 갉아먹는다.

<div class=change-summary>
<table>
<thead><tr><th>항목</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td class=label>폰트 수</td><td class=before>4개 (Pretendard, Sora, Manrope, Italiana)</td><td class=after>2개 (Pretendard, Outfit)</td></tr>
<tr><td class=label>버튼 radius</td><td class=before>8px / 12px / 16px 혼재</td><td class=after>14px 통일</td></tr>
<tr><td class=label>문의 이메일</td><td class=before>8개 로케일 각각 다름</td><td class=after>dbswn428@gmail.com 통일</td></tr>
</tbody>
</table>
</div>

<hr class=section-break>

## 치명적 버그: 한국 결제가 12시간 동안 죽어 있었다

오후 12시 20분. 누군가 한국에서 결제를 시도했다면 전부 실패했을 것이다.

원인은 `packages/shared/src/config/countries.ts` 파일의 단 한 줄이었다.

```ts
// packages/shared/src/config/countries.ts
paymentProvider: "paddle",  // 잘못됨. 한국은 toss여야 한다.
```

새벽 Toss 통합 작업 중에 `countries.ts`를 건드리다가 한국의 `paymentProvider`가 `"toss"`에서 `"paddle"`로 바뀌었다. Paddle은 아직 프로덕션에 API 키가 없다. 즉, 한국 사용자가 결제를 누르면 `/api/checkout/paddle/create`로 요청이 가고, Paddle이 `PADDLE_API_KEY`가 없어서 500을 뱉는다.

**디버깅 경로가 흥미롭다.** 처음엔 DB 연결 문제인 줄 알았다. 에러 메시지가 generic했기 때문이다.

```ts
// 9d5e4e9 커밋 전
return NextResponse.json(
  { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Checkout creation failed.' } },
  { status: 500 }
);

// 9d5e4e9 커밋 후
const errMsg = err instanceof Error ? err.message : String(err);
return NextResponse.json(
  { ok: false, error: { code: 'INTERNAL_ERROR', message: `Checkout creation failed: ${errMsg}` } },
  { status: 500 }
);
```

에러 메시지를 프론트에 노출시키고 나서야 `PADDLE_API_KEY is not set` 이라는 실제 원인이 보였다.

그 다음 Paddle 미설정 시 Toss로 자동 fallback을 추가했다. 하지만 진짜 수정은 마지막이었다. `countries.ts`에서 `"paddle"` → `"toss"` 한 줄.

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>9d5e4e9</span> <span class=msg>debug: expose checkout error message for diagnosing DB connection issue</span></div>
<div class=commit-row><span class=hash>099a202</span> <span class=msg>fix: fallback to Toss when Paddle API key not configured</span></div>
<div class=commit-row><span class=hash>8704207</span> <span class=msg>fix: restore Korean paymentProvider to toss (critical)</span></div>
</div>

디버깅 시간: 34분 (12:20 → 12:54). 커밋 3개. 원인: 1줄.

<hr class=section-break>

## 오늘의 교훈

`countries.ts`처럼 "설정 파일"처럼 생긴 파일이 실제로는 결제 흐름의 핵심 분기점이다. 기능 개발 중에 무심코 건드리기 쉽다. 이런 파일에는 테스트가 있어야 한다.

그리고 generic한 에러 메시지는 디버깅 시간을 두 배로 만든다. `Checkout creation failed.` 라고만 뜨면 DB인지, API 키인지, 네트워크인지 아무것도 모른다. 에러 메시지는 개발 환경뿐 아니라 서버 사이드 로그에서라도 구체적이어야 한다.

<ul class=feature-list>
<li><span class=feat-title>Toss 결제 위젯</span><span class=feat-desc>한국 사용자 전용 `/checkout/toss` 페이지, SDK 위젯 통합</span></li>
<li><span class=feat-title>Toss webhook</span><span class=feat-desc>HMAC-SHA-256 서명 검증, 비동기 주문 확정 처리</span></li>
<li><span class=feat-title>영수증 이메일</span><span class=feat-desc>결제 완료 후 자동 발송, 8개 로케일 i18n</span></li>
<li><span class=feat-title>커밍순 구독 이메일</span><span class=feat-desc>기능 출시 알림 예약, 얼리버드 할인 약속</span></li>
<li><span class=feat-title>Paddle fallback</span><span class=feat-desc>API 키 미설정 시 Toss로 자동 라우팅 (글로벌 미배포 기간 안전망)</span></li>
</ul>
