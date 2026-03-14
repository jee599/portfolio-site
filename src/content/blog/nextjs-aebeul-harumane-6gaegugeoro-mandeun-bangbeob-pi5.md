---
title: "Next.js 앱을 하루만에 6개국어로 만든 방법"
description: "한국어, 영어, 일본어, 중국어, 베트남어, 힌디어. next-intl로 하루만에."
date: "2026-02-26"
tags: ["webdev", "nextjs", "beginners", "ai"]
source: "devto"
---

사주 앱을 6개국에 내놓기로 했다. 한국, 미국, 일본, 중국, 베트남, 인도.

사주가 동아시아 문화권 밖에서 먹힐까? 모르겠다. 근데 타로와 점성술이 전세계에서 먹히는 걸 보면, "AI가 당신의 운명을 분석합니다"는 어디서든 클릭을 부를 것 같았다.

문제는 하드코딩된 한국어가 모든 페이지에 박혀 있다는 거다.


## next-intl 선택 이유

Next.js 15 App Router에서 i18n 옵션은 몇 가지 있다. next-intl을 고른 이유는 단순하다 — App Router 네이티브 지원이 가장 깔끔하다. `[locale]` 동적 세그먼트에 미들웨어로 자동 리디렉트. Server Component에서도 Client Component에서도 같은 `useTranslations()` 훅.

```
apps/web/
├── app/
│   ├── [locale]/          ← 모든 페이지가 여기 안으로
│   │   ├── page.tsx
│   │   ├── result/page.tsx
│   │   └── layout.tsx     ← html lang={locale} 여기서
│   └── layout.tsx          ← 빈 껍데기
├── i18n/
│   ├── config.ts           ← locales, defaultLocale
│   ├── routing.ts          ← localePrefix: "as-needed"
│   └── navigation.ts       ← i18n Link, useRouter
├── messages/
│   ├── ko.json
│   ├── en.json
│   ├── ja.json
│   ├── zh.json
│   ├── vi.json
│   └── hi.json
└── middleware.ts            ← Accept-Language 감지
```

`localePrefix: "as-needed"`가 핵심이다. 한국어가 디폴트니까 `/`로 접속하면 한국어, `/en/`으로 가면 영어. 한국 사용자는 URL에 `/ko/`가 안 붙는다.


## 가장 큰 삽질: 중첩 html

Next.js App Router에서 root layout은 반드시 `<html>`과 `<body>`를 렌더링해야 한다고 알고 있었다. 그래서 root layout에도 넣고, `[locale]/layout.tsx`에도 `<html lang={locale}>`을 넣었다.

결과: **html 안에 html.** 브라우저는 조용히 무시하지만 완전히 잘못된 구조다.

```typescript
// app/layout.tsx — 이게 정답
export default function RootLayout({ children }) {
  return children;  // html/body 없이 그냥 패스스루
}

// app/[locale]/layout.tsx — 여기서 html/body 관리
export default function LocaleLayout({ children, params }) {
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
```

root layout이 그냥 `children`만 리턴해도 Next.js 15에서는 에러가 안 난다. `[locale]` layout이 html/body를 제공하니까.


## 나라별 가격이 다르다

같은 서비스라도 인도에서 $9.90을 받으면 아무도 안 산다. 각 나라 구매력에 맞춰 가격을 잡았다.

```json
// ko.json
"price": "₩12,900"

// en.json
"price": "$9.90"

// ja.json
"price": "¥1,490"

// zh.json
"price": "¥68"

// vi.json
"price": "199.000₫"

// hi.json
"price": "₹799"
```

번역 파일에 가격을 하드코딩한 거다. 나중에 결제 연동하면 서버에서 내려주겠지만, MVP 단계에서는 이게 가장 빠르다. placeholder 이름도 로컬라이즈했다 — 한국은 "홍길동", 일본은 "山田太郎", 인도는 "राहुल शर्मा".


## import 경로 지옥

`app/page.tsx`를 `app/[locale]/page.tsx`로 옮기면 모든 import가 한 단계씩 깊어진다.

```typescript
// Before — app/page.tsx
import { types } from "../lib/types";

// After — app/[locale]/page.tsx
import { types } from "../../lib/types";
```

15개 파일, 수십 개 import. 하나라도 틀리면 빌드가 깨진다. `report/[orderId]/page.tsx`는 4단계 깊이라 `../../../../lib/types`까지 갔다. TypeScript가 잡아주니까 망정이지.


## 결과

빌드 돌리면 각 locale별로 페이지가 생성된다.

```
├ /ko/result
├ /en/result
├ /ja/result
├ /zh/result
├ /vi/result
├ /hi/result
```

브라우저 언어가 일본어면 자동으로 `/ja/`로 리디렉트. 헤더의 드롭다운으로 수동 전환도 가능하다. 한국어 ↔ English ↔ 日本語 ↔ 中文 ↔ Tiếng Việt ↔ हिन्दी.

하루 작업치고 나쁘지 않다. 6개국에서 접속하면 각자 자기 언어로 "AI가 당신의 운명을 분석합니다"가 뜬다.

> "글로벌은 번역이 아니라 현지화다. 가격이 달라야 하고, 이름이 달라야 하고, 통화가 달라야 한다."

[jidonglab.com](https://jidonglab.com)
