---
title: "Toss 결제 풀 통합 + 1줄 버그로 한국 결제 전체 다운"
project: "saju_global"
date: 2026-03-12
lang: ko
pair: "2026-03-12-toss-payment-integration-critical-fix-en"
tags: [toss, payment, webhook, email, i18n, bugfix, debug]
---

하루에 결제 시스템을 통째로 짰다가 마지막에 1줄 버그로 한국 결제가 전부 죽었다.

풀 통합 → 영수증 이메일 → 디자인 시스템 정리 → 디버그 3연타 → 크리티컬 픽스. 순서대로 진행됐지만 실제로는 마지막 픽스가 가장 중요한 작업이 됐다.

---

## Toss Payments 풀 통합

한국 결제를 Paddle로 임시 연결해뒀던 걸 Toss Payments SDK로 전환했다. 처음부터 Toss 쓰려고 했는데 이전 QA에서 Toss 미구현 상태에서 라우팅이 Toss로 가는 버그가 있어서 잠깐 Paddle로 돌려놨었다. 이번에 제대로 구현했다.

Claude에게 넘긴 작업 범위가 꽤 컸다.

> "Toss 결제 위젯 페이지 `/checkout/toss`, success/fail 리다이렉트 페이지, `/api/checkout/toss/confirm` 서버 사이드 검증, `usePaywall` 훅에서 한국 사용자를 Toss로 라우팅, 8개 로케일 사업자 정보 푸터 추가."

한 번에 다 나왔다. `@tosspayments/tosspayments-sdk` 설치부터 위젯 렌더링, HMAC 서버 검증, 성공/실패 흐름까지. 검토할 파일이 많았지만 각각의 변경이 작아서 리뷰가 빠르게 됐다.

<ul class=feature-list>
<li><span class=feat-title>결제 위젯</span><span class=feat-desc>`/checkout/toss` — 금액/주문명 파라미터 받아 Toss 위젯 렌더링</span></li>
<li><span class=feat-title>서버 검증</span><span class=feat-desc>`/api/checkout/toss/confirm` — paymentKey + amount 서버 사이드 더블체크</span></li>
<li><span class=feat-title>성공/실패 페이지</span><span class=feat-desc>Toss 리다이렉트 URL 처리, 실패 시 에러 메시지 로케일별 표시</span></li>
<li><span class=feat-title>사업자 정보</span><span class=feat-desc>8개 로케일 공통 푸터 — 상호, 대표자, 사업자등록번호, 주소</span></li>
</ul>

---

## Toss 웹훅 + 영수증 이메일

결제 확인을 두 경로로 받아야 했다. 사용자가 confirm API를 직접 호출하는 동기 경로, 그리고 Toss 서버에서 비동기로 오는 웹훅 경로. 둘 다 영수증 이메일을 트리거해야 한다.

웹훅은 HMAC-SHA-256 서명 검증을 넣었다. 키는 `TOSS_WEBHOOK_SECRET` 환경변수로 분리. Paddle 웹훅에도 동일한 영수증 이메일을 연결했다.

`sendReceiptEmail.ts`는 326줄짜리 파일이다. 8개 로케일 × 결제 금액/주문명/날짜 테이블 포함 HTML 템플릿. 브랜드 스타일, 고객 이메일, 다국어 CTA. Claude가 한 번에 뽑았는데 i18n 누락 없이 깔끔하게 나왔다.

Coming Soon 구독 확인 이메일(`sendComingSoonEmail.ts`)도 이 세션에서 같이 만들었다. 8개 로케일, 얼리버드 할인 약속, 런칭 알림 등록 확인 흐름.

---

## 디자인 시스템 정리

폰트가 4종류가 혼재했다. Pretendard + Outfit + Sora + Manrope + Italiana. CSS 전역에서 일관성 없이 섞여 있었다.

Pretendard(한글 본문) + Outfit(영문 디스플레이) 2종으로 통일하고 나머지를 전부 뺐다. 타이포그래피 스케일(h1~h3, body, button, input), 버튼 `border-radius 14px` 통일, 카드 글래스모피즘 정리.

`globals.css`가 207줄 변경됐다. 줄이 많이 달라보이지만 대부분 치환이라 실제 추가된 개념은 적다.

<div class=change-summary>
<table>
<thead><tr><th>항목</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td class=label>폰트 종류</td><td class=before>5종 (Pretendard, Outfit, Sora, Manrope, Italiana)</td><td class=after>2종 (Pretendard, Outfit)</td></tr>
<tr><td class=label>버튼 radius</td><td class=before>혼재</td><td class=after>14px 통일</td></tr>
<tr><td class=label>타이포 스케일</td><td class=before>임의 값</td><td class=after>h1~h3, body, button, input 정의</td></tr>
<tr><td class=label>연락처 이메일</td><td class=before>다름 (8개 로케일 파일마다 각각)</td><td class=after>dbswn428@gmail.com 통일</td></tr>
</tbody>
</table>
</div>

---

## 1줄 버그, 한국 결제 전체 다운

여기서 꼬였다.

영어 브라우저(`/en/` 로케일)로 접속하면 결제 시도 시 500 에러가 났다. 원인은 `PADDLE_API_KEY` 미설정. `/en/` 로케일이 Paddle로 라우팅되는데, Paddle 설정이 아직 프로덕션에 없었다. 이건 Paddle fallback → Toss로 내부 redirect 처리로 우선 막았다.

그런데 디버그하다가 더 심각한 게 나왔다.

`packages/shared/src/config/countries.ts`에 한국 설정이 있다.

```ts
// packages/shared/src/config/countries.ts
paymentProvider: "paddle",  // ← 이게 문제였다
```

이전 QA(2026-03-10)에서 "한국 Toss 미구현 상태라 Paddle로 임시 연결"하는 커밋을 넣었다. 그 다음 이번 세션에서 Toss를 풀 구현했는데, `countries.ts`를 다시 `"toss"`로 되돌리는 걸 빠뜨렸다. 결과적으로 한국 사용자는 Toss 위젯 대신 Paddle로 라우팅됐고, Paddle은 설정이 없어서 500.

픽스는 1줄이었다.

```ts
paymentProvider: "toss",  // ← 복원
```

커밋 메시지에 (critical)을 달았다. 실제로 critical이었다.

<div class=callout-stats>
<div class=stat-grid>
<div class=stat-item><span class=stat-value>7</span><span class=stat-label>기능 커밋 수 (머지 제외)</span></div>
<div class=stat-item><span class=stat-value>72</span><span class=stat-label>변경된 파일 수</span></div>
<div class=stat-item><span class=stat-value>2,591</span><span class=stat-label>추가된 줄</span></div>
<div class=stat-item><span class=stat-value>1</span><span class=stat-label>크리티컬 픽스 줄 수</span></div>
<div class=stat-item><span class=stat-value>2</span><span class=stat-label>이메일 템플릿 신규 (영수증, coming-soon)</span></div>
<div class=stat-item><span class=stat-value>8</span><span class=stat-label>지원 로케일</span></div>
</div>
</div>

---

## 커밋 로그

<hr class=section-break>
<div class=commit-log>
<div class=commit-row><span class=hash>2c58ca3</span> <span class=msg>feat: add Toss Payments integration and business info footer</span></div>
<div class=commit-row><span class=hash>eb3b125</span> <span class=msg>feat: add Toss webhook, payment receipt email (8-locale i18n)</span></div>
<div class=commit-row><span class=hash>5f7ef27</span> <span class=msg>feat: add coming-soon confirmation email, fix checkout test</span></div>
<div class=commit-row><span class=hash>6646720</span> <span class=msg>디자인 시스템 통일 및 이메일 업데이트</span></div>
<div class=commit-row><span class=hash>9d5e4e9</span> <span class=msg>debug: expose checkout error message for diagnosing DB connection issue</span></div>
<div class=commit-row><span class=hash>099a202</span> <span class=msg>fix: fallback to Toss when Paddle API key not configured</span></div>
<div class=commit-row><span class=hash>8704207</span> <span class=msg>fix: restore Korean paymentProvider to toss (critical)</span></div>
</div>

---

세션 말미에 디버그 커밋 3개가 연속으로 나온 게 찝찝하다. 구현이 크고 변경 파일이 많을수록 이런 "복원 누락" 류의 버그가 생긴다. 다음에 큰 feature 브랜치를 머지할 때는 변경된 config 파일을 따로 diff해보는 게 맞겠다.
