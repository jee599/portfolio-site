---
title: "Claude Code ultracode 모드 실전기: 342 tool calls로 포켓몬 시세 사이트 빌드"
project: "portfolio-site"
date: 2026-06-16
lang: ko
tags: [claude-code, ultracode, nextjs, neon-postgres, tcgdex, workflow]
description: "ultracode 모드 켜고 포켓몬 카드 시세 사이트를 한 세션에 빌드했다. 342번의 tool call, 20시간, Edit 96번 Bash 92번 Write 84번. 무엇이 효과적이었고 어디서 막혔는지 기록한다."
---

한 세션에 342번의 tool call을 날렸다.

Edit 96번, Bash 92번, Write 84번. 소요 시간은 약 20시간. 결과물은 일본 포켓몬 카드 시세 사이트 — 실시간 JPY/KRW 전환, 매일 1회 DB 적재, 봉인 상품 기대값(EV) 계산까지 포함한 풀스택 앱이다.

**TL;DR** ultracode 모드는 대형 그린필드 프로젝트를 혼자 빠르게 검증하는 데 효과적이다. 다만 데이터 소스 탐색 단계에서 잘못된 가정을 붙들면 아키텍처 전체가 흔들린다 — 그 탐색 자체를 먼저 workflow로 검증하는 게 핵심이었다.

## 왜 ultracode 모드였나

세션 시작 프롬프트는 이것이었다.

> "지금 포켓몬 카드 시세 알아보고 모든 카드 리스트를 확인하고, 현재 시세 / 이전 시세 / 희귀도나 어느 가격 정도가 예상가인지, 앞으로 어떻게 될지 예측 이런 디테일한 정보를 알 수 있는 사이트를 만들고 싶어."

막연한 아이디어다. 실현 가능성을 모른다. 데이터 소스가 있는지도 모른다. 이런 상황에서 `/effort ultracode`를 켜면 dynamic workflow가 활성화된다 — 탐색·검증·구현을 자동으로 병렬화한다.

## 데이터 소스가 아키텍처를 결정한다

코드를 한 줄도 쓰기 전에 데이터 소스 검증 workflow를 먼저 돌렸다. 이게 핵심이었다.

영문 카드는 `pokemontcg.io`가 깔끔하게 처리한다. 무료 API 키로 하루 20,000건, 현재 TCGPlayer 시세까지 준다. 문제는 일본판이다. "일본 카드만 해줘"라는 한 마디가 스택 전체를 바꿨다.

일본판은 별도 생태계다. `pokemontcg.io`는 영미권 중심이라 OCG 카드를 거의 안 다룬다. 대신 두 가지를 찾았다.

- **[TCGdex](https://tcgdex.dev/)**: 무료, 키 불필요, 10개 언어 카탈로그. `pricing.tcgplayer.holofoil.marketPrice` 같은 필드가 실제로 내려온다.
- **유유테이 (yuyutei.jp)**: 일본 현지 시세. 스크래핑 가능한 구조지만 rate limit 고려 필요.

이 검증이 없었다면 `pokemontcg.io` 기반으로 30분 후 삽질하고 있었을 것이다.

## 스택 결정: 판단 기준

데이터 특성에서 스택을 역산했다.

카드 수만 장 + 이미지 + 매일 시세 스냅샷 누적. "하루 1번 갱신"이라는 요구사항은 DB가 필수다. 그냥 API 프록시로는 과거 히스토리를 쌓을 수 없다.

선택:
- **Next.js + TypeScript** — App Router, Vercel cron
- **Neon Postgres + Drizzle ORM** — 서버리스 Postgres, 무료 티어
- **TCGdex** — 카탈로그·이미지 소스
- **JPY/KRW FX** — 한국 거래소 API 일일 갱신

`src/db/schema.ts`에 `cards`, `price_snapshots`, `sealed_products`, `fx_rates` 4개 테이블을 잡고, `scripts/ingest.ts`로 초기 적재, `src/app/api/cron/refresh/route.ts`로 매일 증분 갱신하는 구조다.

## 봉인 상품 기대값은 어떻게 계산하나

"상자랑 팩별 기대값"을 요청받고 가장 재밌었던 부분이다.

`src/lib/ev.ts`에서 구현했다. 수식은 단순하다.

```
EV = Σ (카드 시세 × 팩 내 출현 확률)
```

풀레이트 데이터는 `src/lib/pull-rates-data.ts`에 세트별로 하드코딩했다. 공식 풀레이트가 없는 세트는 희귀도 분포로 추정한다. 이걸 `sealed_products` 테이블의 각 상품에 연결하면 "이 박스 한 통을 뜯으면 기대값이 얼마인가"가 나온다.

`src/components/forecast-bar.tsx`에서 시각화한다. 빨간색이면 손해 기대, 초록이면 이득 기대.

## 삽질: yuyutei 스크래핑

일본 현지 시세를 붙이려고 `src/lib/providers/yuyutei.ts`를 만들었다. 그런데 `/tmp/probe-yuyutei*.mjs` 파일이 5개나 생겼다.

`probe-yuyutei.mjs` → `probe-yuyutei2.mjs` → `probe-yuyutei3.mjs` → `probe-yuyutei4.mjs` — 매번 응답 구조가 달랐다. 페이지 타입마다 HTML 구조가 달랐고, 일부 카드는 단종 처리라 시세가 없었다.

결국 fallback 전략으로 정리했다. yuyutei 시세가 없으면 TCGdex USD 시세에 당일 FX를 곱해서 보여준다. 불완전하지만 동작한다.

> 삽질 흔적을 `/tmp/`에 남기는 습관이 있다. 나중에 다시 볼 일 없지만, 실험 스크립트는 메인 코드베이스 밖에서 빠르게 돌리는 게 맞다.

## 신호(signals) 레이어

"앞으로 어떻게 될지 예측"을 어떻게 구현하나.

ML 모델은 없다. `src/lib/signals.ts`에서 룰 기반 신호를 조합한다.

- 최근 7일 시세 변화율이 +15% 이상이면 `TRENDING_UP`
- 발매 3개월 이내 신제품이면 `NEW_RELEASE`
- EV가 소매가 대비 120% 이상이면 `HIGH_EV`
- 세트가 단종 발표 후 6개월 이내면 `SUNSET`

`src/components/signal-tags.tsx`에서 태그로 보여준다. `scripts/signals-test.mjs`로 검증했다.

## 결과

한 세션에서 나온 파일 수: **생성 75개, 수정 19개**.

주요 라우트:
- `/` — 인기 세트 + 신호 태그
- `/sets/[id]` — 세트별 카드 목록 + EV 차트
- `/cards/[id]` — 단일 카드 시세 히스토리
- `/sealed` — 봉인 상품 EV 비교
- `/search` — 카드명/세트명 검색

완성도 70% 정도다. Vercel 배포 + DB 마이그레이션 + 실제 데이터 ingestion은 다음 세션 과제로 남겼다.

## ultracode 모드를 쓰는 기준

이번 세션에서 확인한 것: ultracode는 **탐색 비용이 큰 그린필드**에 적합하다.

데이터 소스 불확실성이 있고, 스택 결정이 그 탐색 결과에 달려 있고, 컴포넌트가 독립적으로 병렬 개발 가능할 때 — 그때 workflow fan-out이 실질적으로 시간을 줄여준다.

반대로 기존 코드베이스의 버그 하나를 고칠 때는 오히려 노이즈다.

이번 주에는 이 외에도 Godot 게임 콘셉트 4개를 GPT Image-2로 스프라이트 생성 실험(`~/game-concepts-preview/`)하고, JDLab Codex cron 아키텍처를 6개 세션에 걸쳐 다듬었다. local-commerce-agent의 sendable-first discovery 파이프라인이 특히 복잡했는데, 그건 다음 로그에서 따로 다룬다.

<hr class="section-break">

<div class="change-summary">
<table>
<thead><tr><th>항목</th><th>수치</th></tr></thead>
<tbody>
<tr><td class="label">총 tool calls</td><td class="after">342회</td></tr>
<tr><td class="label">Edit</td><td class="after">96회</td></tr>
<tr><td class="label">Bash</td><td class="after">92회</td></tr>
<tr><td class="label">Write</td><td class="after">84회</td></tr>
<tr><td class="label">생성 파일</td><td class="after">75개</td></tr>
<tr><td class="label">세션 소요</td><td class="after">약 20시간</td></tr>
</tbody>
</table>
</div>
