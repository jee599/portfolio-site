---
title: "Lemon Squeezy 결제 승인 거절 2가지 원인: KRW 버그 + 금지 키워드"
project: "saju_global"
date: 2026-03-28
lang: ko
tags: [claude-code, lemon-squeezy, payment, bug-fix, saju]
description: "사주 앱 결제 승인이 거절됐다. 원인은 두 가지였다. ₩5,900이 코드 버그로 ₩590,000이 됐고, fortune·reading 키워드가 심사를 막았다."
---

₩5,900짜리 상품이 결제 시스템에서 ₩590,000으로 처리되고 있었다. 100배 차이다. 그리고 상품명에 "fortune"이 들어가면 Lemon Squeezy 심사를 통과하지 못한다.

**TL;DR** KRW는 zero-decimal currency라서 금액에 `* 100`을 곱하면 안 된다. 점술 관련 키워드(fortune, reading, destiny)는 결제 플랫폼 심사에서 거부 사유가 된다.

## 상품 등록 폼부터 막혔다

Lemon Squeezy 대시보드에서 상품을 등록하다가 승인이 거절됐다. Claude에게 상황을 넘겼다. 스크린샷을 붙여넣으면서 짧게만 물었다.

> "그 운세 이런거 있으면 안되잖아."

Claude는 폼 상태를 보고 바로 문제 목록을 뽑았다. Name 비어있음, Description 비어있음, 가격이 이상함, 이미지 없음, 파일 없음. 그런데 여기서 가격 이야기가 나왔다.

> "Price ₩9.99 → KRW는 소수점 없음. 유효하지 않은 금액"

처음엔 폼 입력 문제로 보였다. 그런데 코드를 뜯어보니 더 큰 버그가 숨어있었다.

## KRW에 * 100을 곱하면 100배 비싸진다

`create/route.ts`를 열어보니 이런 코드가 있었다.

```ts
customPrice: customPriceKrw * 100
```

Stripe 기준으로 생각하면 당연한 패턴이다. USD에서 $5.90을 590 cents로 넘기는 방식. 그런데 KRW, JPY 같은 zero-decimal currency는 다르다. ₩5,900은 그냥 `5900`으로 넘겨야 한다. `* 100`을 하면 Lemon Squeezy API는 ₩590,000으로 해석한다.

수정은 단순했다.

```ts
// before
customPrice: customPriceKrw * 100

// after
customPrice: customPriceKrw
```

한 줄 수정이지만 임팩트는 크다. 사용자가 결제 화면에서 ₩590,000을 보고 이탈했을 거다.

## 점술 키워드는 결제 플랫폼 심사에서 걸린다

가격 버그보다 더 까다로운 문제가 있었다. 사주 앱 특성상 상품명에 "fortune", "reading", "destiny" 같은 단어가 들어갈 수밖에 없다. 그런데 이게 Lemon Squeezy 심사 거부 사유가 된다.

`productNames.ts`를 확인해보니 영어 상품명들이 문제였다.

- `Palm Reading` → reading은 점술 느낌
- `Tarot Reading` → 같은 문제
- `Annual Fortune Report` → fortune 직접 사용

이 이름들은 LS checkout 시 `productOptions.name`으로 전달돼서 결제 화면에 직접 노출된다. 심사자가 보면 바로 걸린다.

수정 방향은 의미를 유지하면서 점술 뉘앙스를 지우는 것이었다.

| 변경 전 | 변경 후 |
|---------|---------|
| `Palm Reading` | `Palm Line Analysis` |
| `Tarot Reading` | `Tarot Insights` |
| `Annual Fortune Report` | `Annual Outlook` |

## SEO 텍스트도 심사 대상이다

`productNames.ts`만 수정하면 끝날 줄 알았다. 그런데 Claude가 `countries.ts`의 SEO 필드도 확인했다. `seo.description`에 "destiny readings"가 들어있었다.

> "SEO description에 'destiny readings'가 있습니다. 이건 메타태그로 사이트에 노출되니 LS 심사자가 볼 수 있습니다."

사이트를 심사할 때 소스코드나 메타태그까지 본다는 거다. `framework`나 `sensitivities` 같은 LLM 프롬프트용 필드는 노출되지 않으니 그냥 두고, SEO 텍스트만 바꿨다.

## 세션 요약

1시간 25분, tool call 16번으로 3개 파일을 수정했다. Edit 6번, Read 5번, Agent 2번, Grep 2번, WebSearch 1번. 코드 탐색과 수정이 주였다.

| 파일 | 변경 내용 |
|------|-----------|
| `checkout/lemonsqueezy/create/route.ts` | KRW zero-decimal 버그 수정 |
| `productNames.ts` | 점술 키워드 → 중립적 표현 |
| `countries.ts` | SEO description 키워드 교체 |

이번 세션에서 Claude가 유용했던 건 코드 수정뿐만 아니라 "왜 거부됐는지"를 맥락으로 파악했다는 점이다. 결제 플랫폼 심사 기준, zero-decimal currency 스펙, SEO 텍스트 노출 경로까지 연결해서 짚어줬다. 나는 "그 운세 이런거 있으면 안되잖아" 한 문장만 던졌을 뿐이다.
