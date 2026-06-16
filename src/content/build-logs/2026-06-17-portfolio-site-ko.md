---
title: "포트폴리오 홈 포지셔닝 전면 교체 — 'AI 개발자'에서 '원맨 스튜디오'로"
project: "portfolio-site"
date: 2026-06-17
lang: ko
tags: [claude-code, portfolio, positioning, case-study, astro, react]
description: "Hero 카피·역량 섹션·프로젝트 카드 3개를 동시에 갈아엎었다. 'AI 제품을 만든다'가 아니라 '사업 문제를 AI로 푼다'로 포지셔닝을 이동시켰다. 10개 파일, 418 줄 변경."
---

포트폴리오 홈 전체를 다시 썼다. Hero 카피, 역량 섹션, 프로젝트 카드 포맷 3개가 동시에 바뀌었다. 변경 규모는 10개 파일, 418줄 순증.

**TL;DR** "나 이런 거 만든다"에서 "사업 문제를 이렇게 풀었다"로 프레임을 바꿨다. 카피 한 줄이 아니라 데이터 모델(`home.ts`)과 컴포넌트(`Projects.tsx`) 구조를 같이 바꿔야 했다.

## Hero 카피가 왜 틀렸는지

이전 h1은 "AI 제품을 만들고, 고치고, 매일 운영한다"였다. 이건 내가 하는 일(what I do)이다. 방문자 입장에서 중요한 건 내가 무엇을 할 수 있는지(what's in it for you)다.

바꾼 h1: "작은 사업 문제를 AI 제품·자동화·리포트·웹 MVP로 바꾼다."

byline도 교체했다. 이전: "LLM 서비스, 운영 자동화, 작은 웹 제품을 혼자 끝까지 만든다. 어제 짠 코드가 오늘도 돌고, 그 기록을 이 사이트에 쌓는다." — 이건 일지다. 새 카피: "Jidong이 혼자 만든다. LLM 서비스, 광고·콘텐츠 자동화, 진단 HTML/PDF, 랜딩과 운영 도구까지. 큰 플랫폼 말고 지금 쓸 수 있는 작은 시스템."

`role` 메타 행도 `solo AI builder` → `AI product studio`로 바꿨다. `stack` 행은 아예 `output`으로 교체했다: `제품 · 자동화 · 리포트`. 기술 스택은 이력서에 쓰는 거다. 포트폴리오에서 클라이언트가 보고 싶은 건 산출물이다.

## 프로젝트 카드를 케이스 스터디 포맷으로 바꿨다

이전 카드 구조는 제목 + 태그라인 + 스택 뱃지였다. "뭘 만들었는지"를 나열하는 구조다.

새 구조는 `problem` / `output` 두 칸을 추가했다. `home.ts`에 6개 필드가 생겼다:

```ts
caseStatus?: CaseStatus;   // '운영' | '검증' | '실험' | '보류'
problemKo?: string;        // 실제 문제 한 줄
problem?: string;
didKo?: string;            // 무엇을 했는지
did?: string;
outputKo?: string;         // 산출물 한 줄
output?: string;
```

`Projects.tsx`에 `p-case` 블록이 생겼다. 카드 안에 문제와 산출물이 나란히 보인다. 그리드는 3컬럼에서 2컬럼으로 줄였다 — 읽을 게 많아지면 셀이 좁으면 안 된다.

각 프로젝트에 직접 채워 넣었다:

```ts
// FortuneLab
problemKo: '사주 해석을 그냥 프롬프트로 던지면 계산과 해석이 섞인다.'
didKo:     '만세력 계산은 코드로 고정하고, LLM은 해석 레이어에만 썼다.'
outputKo:  '웹 서비스 · 결제 전환 검증 중'

// ContextZip
problemKo: '에이전트 작업에서 터미널 출력이 컨텍스트를 너무 빨리 먹었다.'
didKo:     'Claude Code 훅 앞단에 Rust 필터를 두고 노이즈를 잘라냈다.'
outputKo:  'Rust CLI · OSS'
```

"뭘 만들었나" 말고 "어떤 문제를 어떻게 풀었나"가 보이면 포트폴리오가 영업 자료가 된다.

## 상태 태그를 실제 운영 상태로 교체

이전 상태 뱃지는 `live / oss / dev / beta`였다. `beta`는 아무 의미가 없다.

새 `CaseStatus`는 `운영 / 검증 / 실험 / 보류` 4개다. 실제 상태를 그대로 쓴다:

- `운영`: 지금 돌아가고 있다
- `검증`: 만들었고 실제 반응을 보는 중
- `실험`: 아이디어를 코드로 테스트 중
- `보류`: 일단 멈췄다

`Projects.tsx`의 `cardMeta` 함수가 `caseStatus`를 읽어 CSS 클래스(`StatusTone`)로 변환한다. `home.css`에 색상 토큰을 추가했다: verify → `var(--warn)`, lab → `#6f5a1f`, hold → `var(--ink3)`.

## 역량 섹션 재구성

Capabilities 4개 항목 전부 교체했다.

이전 항목: AI products, automation, web product, writing

새 항목:
- **AI MVP**: 문제 좁히기 → LLM+인증+결제+UI+배포 한번에
- **자동화**: 광고 리서치·뉴스·콘텐츠·반복 점검을 스크립트+에이전트로
- **진단 리포트**: HTML/PDF 산출물 — 가짜 대시보드 말고 의사결정용
- **웹/랜딩/운영 도구**: 디자인·배포·도메인·분석까지 묶어서

"writing"을 제거한 게 맞다. 빌드 로그는 결과물이지 서비스가 아니다. 대신 "진단 리포트"를 넣었다 — 치과 광고 진단처럼 HTML/PDF로 납품 가능한 실체가 있는 산출물.

## 이 변경이 나온 맥락

이전 2일 동안 coffeechat(AI 면접 SaaS), FortuneLab(사주 앱), 동백유디치과 세 프로젝트를 동시에 작업했다. 공통점이 있었다: 셋 다 기술 구현보다 "실제 사업 문제를 좁히는 것"이 먼저였다.

커피챗 세션에서 크레딧 단가를 설계할 때 API 원가 → 마진 → 유저 가격을 역산했다. 치과 사이트 세션에서는 "AI 티 없이 상위권 수준으로"가 먼저였고 기술은 그 다음이었다. FortuneLab GTM 분석에서는 트래션이 너무 얇다는 결론에서 전략 방향이 바뀌었다.

포트폴리오가 "내가 이런 기술을 쓸 줄 안다"를 보여주는 공간이면 충분하지 않다. 실제로 어떤 문제를 어떻게 풀었는지가 보여야 한다.

## 변경 요약

| 파일 | 핵심 변경 |
|---|---|
| `src/data/home.ts` | `caseStatus` + problem/did/output 6개 필드 추가, 전 프로젝트에 채움 |
| `src/components/home/Projects.tsx` | `StatusTone` 타입, `p-case` 블록, 2컬럼 그리드, primaryLabel 동적화 |
| `src/components/home/Hero.tsx` | h1 카피, byline, role/output 메타 행 교체 |
| `src/components/home/Capabilities.astro` | 4개 역량 항목 전면 교체 |
| `src/styles/home.css` | verify/lab/hold 상태 색, f-case 3열 그리드, p-case 스타일 |

도구 분포: Edit 위주. 데이터 스키마 변경 → 컴포넌트 수정 → CSS 추가 순으로 순차 작업이라 병렬이 맞지 않는 케이스였다.
