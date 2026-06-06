---
title: "포트폴리오 리포지셔닝 — '빌더'에서 '스튜디오'로, 10개 파일 수정"
project: "portfolio-site"
date: 2026-06-07
lang: ko
tags: [claude-code, astro, portfolio, repositioning, react]
description: "Astro 포트폴리오 10개 파일 수정. 'solo AI builder'에서 '1인 AI 제품 스튜디오'로 포지셔닝 전환. Hero 헤드라인, Capabilities 항목 재배치, Projects caseStatus 타입 추가, About CTA 구조화까지 기록."
---

프레임은 "나는 매일 만든다"였다. 바꿔야 할 이유는 하나였다 — 일을 의뢰하려는 사람이 먼저 보는 건 내가 얼마나 열심히 짜는지가 아니라 그게 자기 문제를 해결하는지다.

**TL;DR** `Hero.tsx`, `About.astro`, `Capabilities.astro`, `Projects.tsx`, `home.ts`, `index.astro` 등 10개 파일을 수정했다. "solo AI builder"에서 "1인 AI 제품 스튜디오"로 포지셔닝을 전환하고, 기능 나열 대신 산출물(MVP, 자동화, 진단 리포트) 중심으로 메시지를 재구성했다.

## "매일 운영한다"가 틀린 이유

기존 Hero 헤드라인:

```
AI 제품을 만들고, 고치고, 매일 운영한다.
```

이건 내 루틴이지 고객의 문제가 아니다. eyebrow 텍스트도 `independent AI product builder`로, 개인 개발자 포지셔닝에 가깝다.

After:

```
작은 사업 문제를 AI 제품·자동화·리포트·웹 MVP로 바꾼다.
```

eyebrow는 `one-person AI product studio`로 바꿨다. "builder" → "studio"는 1글자 바꿈이 아니다. builder는 무언가를 만드는 사람이고, studio는 의뢰를 받아 납품하는 조직이다. 1인이지만 studio 프레임이 고객 관계를 다르게 설정한다.

Hero 메타 블록도 `stack: TypeScript · Next.js · Astro`를 `output: 제품 · 자동화 · 리포트`로 교체했다. 스택보다 산출물이 먼저 보여야 한다. 버튼 순서도 [프로젝트 보기, 하는 일] → [하는 일, 작업 사례]로 바꿨다. 첫 버튼이 포트폴리오로 튀어나가는 것보다 "하는 일"을 먼저 설명하는 게 의뢰 흐름에 맞는다.

## Capabilities 4개 항목 전면 재배치

기존:

1. AI products end-to-end
2. 운영 자동화
3. **작은 웹 제품·사이트**
4. **빌드 로그·기술 글쓰기**

4번 "빌드 로그·기술 글쓰기"가 의뢰 전환에 기여하는지 의심이었다. 글쓰기는 능력이지만 고객이 살 수 있는 산출물이 아니다.

After:

1. AI 제품/MVP 제작
2. 비즈니스 자동화
3. **진단 리포트/HTML·PDF 산출물**
4. **웹/랜딩/운영 도구**

3번이 "작은 웹 제품"에서 "진단 리포트"로 바뀐 게 핵심이다. 치과 광고 진단, Open Design local 리포트 작업을 실제로 하면서 HTML/PDF 납품이 뚜렷한 의뢰 단위가 됐다. 이건 Capabilities에 올라와 있어야 할 항목이었다.

각 항목의 `ko_meta`도 내부 slug(`uddental · contextzip · agentcrow`) 대신 읽히는 이름(`Dental AI Ads · AgentCrow · dev.to mirror`)으로 정리했다.

## Projects: caseStatus 타입과 problem/did/output 필드

`home.ts`에 `CaseStatus` 타입을 추가했다.

```typescript
export type CaseStatus = '운영' | '검증' | '실험' | '보류';
```

기존 `status: 'live' | 'dev' | 'beta'`로는 "지금 쓰이는 중"과 "검증 중"을 구분할 수 없었다. `fortunelab`은 검증(결제 이관 중), `claudebook`은 실험, `coffeechat`은 보류. `Projects.tsx`도 `StatusTone` 타입을 추가하고 `cardMeta()`가 `caseStatus`를 우선 사용하도록 바꿨다.

`problem`, `did`, `output` 필드도 각 프로젝트에 추가했다. 카드 뷰에 바로 쓰이진 않지만, 프로젝트 상세에서 "문제 → 해결 → 결과" 구조를 미리 데이터 레이어에 만들어뒀다.

## About: CTA 구조화와 SEO

About 섹션에서 기존엔 이메일 링크가 본문 마지막 줄에 텍스트로 박혀 있었다. 이제 `contact-panel`로 분리했다. "문의할 땐 문제, 현재 쓰는 도구, 원하는 산출물, 마감만 보내면 된다." — 의뢰 단계에서 필요한 정보를 미리 정의해두는 방식이다.

spec 행도 `available: 컨설팅 · 외주 · 강연` → `MVP · 자동화 · 진단 리포트`로 바꿨다. `index.astro` SEO 제목도 "AI 프로덕트를 짓고 운영하는 한 사람"에서 "AI 제품, 자동화, 리포트를 만드는 1인 스튜디오"로 교체했다. Google 검색 snippet에 보이는 게 이 줄이다.

## 도구 사용

변경 파일 10개. Astro 컴포넌트 5개, React 컴포넌트 2개, TypeScript 데이터 파일 1개, Astro 페이지 1개, CSS 1개. 새 파일 없음. Read로 기존 구조 파악 → Edit으로 교체하는 흐름이었다.
