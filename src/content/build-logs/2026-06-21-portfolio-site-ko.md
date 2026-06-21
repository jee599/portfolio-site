---
title: "Claude Code 7개 세션 489 tool calls — 두 프로덕트를 하루에 동시 운영한 기록"
project: "portfolio-site"
date: 2026-06-21
lang: ko
tags: [claude-code, next-intl, i18n, mobile-ui, multi-agent, preterview, dental-promo]
description: "7개 세션 489 tool calls, 35개 파일 수정. preterview i18n raw 키 버그 해결, 모바일 UI 22개 파일 일괄 수정, 12에이전트 사업계획서 자동 생성까지 하루치 Claude Code 운영 기록."
---

7개 세션, 489 tool calls, 수정 파일 35개. 오늘 Claude Code는 preterview와 치과 마케팅 자동화 두 프로덕트를 동시에 돌렸다.

**TL;DR** next-intl의 `scopeClientMessages`가 `x-cc-pathname` 헤더 부재 시 interview·portfolio 네임스페이스를 통째로 잘라버리는 버그를 113 tool calls만에 잡았다. 동시에 12에이전트 워크플로로 1.27M 토큰짜리 사업계획서 두 벌을 34분 만에 뽑았다.

## 하루 시작: 치과 측정은 서브에이전트에게

오전 제일 먼저 한 건 동백유디치과 정기 측정이었다. 6개 키워드 SERP 실측, inbox 신규 파일 확인, 점수 갱신, `sync.sh`까지 — 이걸 메인 세션에서 직접 하면 컨텍스트를 다 잡아먹는다. `dental-clinic` 서브에이전트에 위임하고 2 tool calls로 끝냈다.

결과: `동백 임플란트` 블로그 8→9위 1칸 하락(로테이션 노이즈), 나머지 5키워드 미진입 지속, 점수 무변경(33). 9분 세션이었다.

위임 패턴이 중요하다. 치과 하나의 6단계 측정→기록→다이제스트→커밋→배포까지 단일 에이전트가 컨텍스트를 유지하면서 처리하는 구조다. 메인 세션은 결과만 받는다. 프롬프트에 "점수 임의 재채점 금지, 측정치만 기록"을 명시해뒀기 때문에 에이전트가 수치를 건드리지 않았다.

## preterview 모바일 전면 수술: 4시간, 182 tool calls

세션 3이 가장 부피가 컸다. `/effort ultracode`를 켠 상태(xhigh 추론 + 다이나믹 워크플로)에서 시작했다.

```
preterview 사이트 지금 모바일에서 버튼도 깨지고 ui에 영어도 나오고 이상해,
전체적으로 모두 확인해서 이상한게 있는지, 자간이나 엔터를 잘못쳐서 늘어진거 확인해서 모두 고쳐
```

Dev 서버를 백그라운드로 띄우고 `mcp__claude-in-chrome__browser_batch`로 실제 모바일 뷰포트를 확인했다. iPhone 390px로 설정했는데 렌더는 1568px. JS 도구로 `window.innerWidth`를 직접 찍으니 **2240px**가 나왔다. 창 크기는 784px인데 콘텐츠가 2.8배 넘쳐 있었다. 모바일 깨짐의 근본 원인이었다.

정적 코드리뷰로는 이걸 잡으려면 오버플로 원인 파일을 일일이 추측해서 좁혀야 한다. 런타임 실측으로 수치를 먼저 확인하고 역추적하는 게 훨씬 빠르다.

한국어 설정인데 영어 버튼이 나오는 문제는 i18n 라우팅 이슈였다. 브라우저 `Accept-Language: en`을 감지해 `/en`으로 리다이렉트하는 로직이 원인이었다. `i18n/routing.ts`를 수정하고 `messages/ko/` 아래 누락된 번역 키를 채워 넣었다.

최종적으로 22개 파일이 수정됐다. `app/[locale]/layout.tsx`, `globals.css`, `components/interview/InterviewRoom.tsx`, `RadarChart.tsx`, `components/resume/steps/ItemHeader.tsx`, `i18n/routing.ts`와 en/ko 메시지 JSON 6개, admin 페이지 5개. 단순 반응형 수정이 아니었다 — 언어 전환 시 한국어 UI에 영어 버튼이 섞이는 문제, 줄바꿈 오버플로, 폰트 크기 계단현상까지 한 번에 잡았다.

**Bash 46, Edit 40, Read 35, browser_batch 26 — 총 182 tool calls, 4시간.** Edit이 Bash보다 많다는 건 탐색보다 실제 수정에 더 많은 시간을 썼다는 뜻이다.

## i18n raw 키 버그: 범인은 scopeClientMessages

세션 6에서 재발 확인이 들어왔다. 모의면접과 포트폴리오 점검 페이지에서 버튼 텍스트가 `interview.room.endInterview` 처럼 raw 키 형태로 그대로 출력됐다.

next-intl은 키를 못 찾으면 경로 전체를 출력한다. 처음엔 키 파일 문제로 봤다. 확인하니 en/ko 양쪽에 키가 있고, 컴포넌트도 `tr("room.endInterview")`로 올바르게 호출한다. 그런데도 raw 키가 나온다.

타입체크 통과, i18n 키 정합성 검사 통과. 이 시점에서 원인은 키 자체가 아니라 **클라이언트로 메시지가 전달되는 경로**에 있다는 걸 알 수 있다.

원인은 `lib/i18n/request.ts`의 `scopeClientMessages`였다. 이 함수는 `x-cc-pathname` 헤더 값을 읽어 라우트별로 클라이언트에 전달할 i18n 네임스페이스를 골라 보내는 최적화 로직이다. 문제는 헤더가 없거나 경로가 `/`로 떨어질 때 interview·portfolio 네임스페이스를 통째로 제외한다는 것이었다.

```
stripped = "/" → interview/portfolio 네임스페이스 없음 → raw 키 출력
```

`proxy.ts`가 헤더를 주입하는데, next-intl 미들웨어를 거치면서 해당 헤더가 RSC까지 전파되지 않는 경우가 있었다. 수정 방향은 두 가지였다: 헤더 전파를 보장하거나, 클라이언트 메시지 범위를 덜 공격적으로 잘라내거나. 후자로 갔다.

`app/[locale]/layout.tsx` 수정 + Playwright e2e 테스트(`e2e/i18n-softnav.spec.ts`) 추가로 재발 방지까지 완료했다. **Bash 64, Read 14, Edit 13, Write 10 — 총 113 tool calls.** Bash가 압도적으로 많은 건 dev 서버 구동, curl로 헤더 추적, 빌드 확인, Playwright 실행이 전부 Bash로 통하기 때문이다.

## 멀티에이전트 사업계획서: 34분, 12에이전트, 1.27M 토큰

세션 7이 토큰 기준으론 가장 무거웠다. "치과 자동화와 preterview 각각 기술적·상업적으로 뛰어난 사업계획서 + 정부·민간 지원사업 분석"이라는 요청이었다.

기존 자료부터 확인했다. `~/funding/`에 56건 + 프라이머 29기 대안 57건이 이미 있었다. 프라이머 29기 치과 지원 마감이 6/28, DIPS Link-up이 6/22(내일)였다. 컨텍스트가 충분했다.

워크플로 구성: 5단계 파이프라인, 12 에이전트.

1. **Foundation** (병렬 6) — 제품 프로파일 2건, 정부·공공 비지분 프로그램, 민간 VC·AC, 정부 PSST 합격 설계도, 민간 IR 합격 공식
2. **Plans** (병렬 2, high effort) — 치과·preterview 각각 PSST + IR + 3개년 재무 + 기술 아키텍처
3. **Strategy** — 매칭·실행 캘린더
4. **Verify** — 팩트 검증 + 완전성 비평
5. **Assemble** — 통합

34분 뒤 `~/funding/bizplan-2026-06-21/REPORT.md` 7,747 단어가 생성됐다. PSST·IR·재무·아키텍처·지원사업 카탈로그·실행 캘린더·적대적 검증 노트 포함. OD-equivalent 렌더러(`tools/md2report/report.py`)로 HTML 변환해서 최종 납품했다.

에이전트별로 섹션 마크다운을 독립적으로 생성하고 마지막에 조립하는 구조가 핵심이다. 순차 작성보다 품질과 속도 모두 올라간다. 직접 쓰면 며칠 걸렸을 분량이다.

## 하루 통계

| 세션 | 시간 | tool calls | 핵심 작업 |
|------|------|------------|-----------|
| 치과 측정 | 9분 | 2 | SERP 6키워드 + 커밋 |
| preterview GTM | 22시간 | 35 | PH 판단 + 검증 |
| 모바일 UI | 4시간 | 182 | 22파일 전수 수정 |
| 사업계획서 | 27시간 | 98 | 6편 생성 + 텔레그램 |
| 네이버 대행 분석 | 38분 | 32 | 1인 대행 플레이북 |
| i18n 버그 수정 | 50분 | 113 | scopeClientMessages 패치 + e2e |
| 사업계획서 v2 | 58분 | 27 | 12에이전트 워크플로 + HTML |

도구별 — Bash 189, Read 71, Edit 66, Write 26, browser_batch 26, TaskCreate 16, TaskUpdate 29. Bash가 압도적으로 많은 건 dev 서버 구동, SERP 측정, 헤더 추적, 빌드 확인 등 검증 작업이 전부 Bash로 통하기 때문이다.

두 프로덕트를 동시에 돌리면서 세션 간 컨텍스트를 유지하는 게 관건이었다. 치과는 서브에이전트 위임, preterview는 메인 세션 직접 처리. 용도에 따라 라우팅을 다르게 가져가는 패턴이 자리를 잡았다.

가장 많은 걸 배운 세션은 i18n 버그였다. 타입체크·키 정합성 검사가 모두 통과해도 런타임에서만 보이는 버그가 있다. `scopeClientMessages`처럼 최적화 레이어가 중간에 끼면 정적 분석으로는 안 보인다. 실측이 먼저다.
