---
title: "서브에이전트 12개 병렬 — 리서치 자동화·DEV.to 5편 발행·Google Meet 연동까지"
project: "portfolio-site"
date: 2026-05-01
lang: ko
tags: [claude-code, multi-agent, research, auto-publish, devto]
description: "AI 치과 광고 리서치에 서브에이전트 12개를 병렬로 투입해 60곳 업체 데이터와 HTML 보고서 7종을 뽑았다. 같은 사이클에 DEV.to 5편 발행, coffeechat Google Meet OAuth 연동. 4 세션 276 tool calls."
---

4개 세션, 276 tool calls. 가장 큰 세션에서는 서브에이전트를 12개 동시에 띄웠다. 한국 AI 치과·병원 광고 시장 전체를 커버하는 리서치였다. 에이전트 하나하나에 서로 다른 도메인을 할당하고 병렬로 돌렸다. 결과물은 HTML 보고서 7종, 업체 60곳 디렉토리.

**TL;DR** 서브에이전트를 12개까지 병렬 투입하면 단일 세션으로는 불가능한 규모의 조사가 한 세션 안에 끝난다. 동일 기간 DEV.to 글 5편도 같은 방식으로 병렬 생성해서 발행했다.

## "서브에이전트 10개 이상"이라는 지시가 들어왔을 때

프롬프트 원문:

> "서브에이전트 10개 이상 사용해서 조사하고 별도의 에이전트들로 조사해봐"

이걸 받고 조사 도메인을 12개로 쪼갰다. 카테고리별로 겹치지 않게 할당하는 게 핵심이다. 공유 상태가 없으면 에이전트끼리 충돌이 없다.

- SEO·블로그 자동화 업체 (3개 에이전트)
- 실제 산출물·포트폴리오 수집 (2개)
- 네이버 알고리즘 변화 추적 (2개)
- 규제·의료광고법 리스크 (2개)
- 가격 구조·ROI 매트릭스 (2개)
- 빈 시장 기회 탐색 (1개)

각 에이전트는 `WebSearch` + `WebFetch`로 자신의 영역만 파고들었다. 완료 후 결과를 반환하면 메인 컨텍스트에서 통합했다.

도구 분포: `Agent(47)` + `Bash(14)` + `Write(11)` — 세션 1의 96 tool calls.

## 에이전트 품질 편차, 어떻게 처리했나

12개를 돌리면 결과물 품질이 균일하지 않다. 실명+URL을 가져온 에이전트(검증 가능)와 "업체가 있다고 주장"만 돌아온 에이전트(미검증)가 섞인다.

통합 리포트에선 증거 강도로 재분류했다:

```
별 5개 — 실명+정량+URL 직접 확인
별 4개 — 이니셜+풍부한 수치
별 3개 — 업체명+수치 있으나 URL 미확인
별 2개 이하 — 클레임만, 증거 없음
```

`AI-AGENCIES-DEEP-REPORT.html` 9섹션 구성: 60곳 업체 일람표 → 5개 표준 운영 패턴 → 가격·ROI 매트릭스 → 규제 리스크 지도. 파일 크기 21KB.

## DEV.to 5편 병렬 발행 — 그리고 silent success 함정

`/auto-publish` 스킬로 Codex 시리즈를 발행했다. 리서치 → 주제 확정 → 5개 병렬 생성 → 발행 순서다.

발행 직전에 두 가지 문제가 연속으로 터졌다.

**첫째**, `Write` 도구가 실패 응답을 반환했는데 실제로는 성공한 경우였다. 에이전트가 재시도하면서 파일이 8개로 늘었다. 10KB 글자 제한 기준으로 통과하는 5개만 남기고 정리했다.

**둘째**, `git push`가 거절됐다. CI가 먼저 remote에 커밋을 올린 상태였다.

```bash
! [rejected] main -> main (fetch first)
```

에이전트가 에러 로그를 읽고 `git pull --rebase`까지 혼자 판단해서 실행했다. rebase 후 재push로 해결됐다.

발행된 5편:

| # | 제목 |
|---|------|
| 1 | GPT Image 2 Inside Codex: My New Frontend Workflow |
| 2 | Symphony: Why OpenAI's PRs Jumped 500% in 3 Weeks |
| 3 | I Gave Codex My Mouse for a Day |
| 4 | Building a Full RAG App with Codex in One Session |
| 5 | Codex vs Claude Code: My 2-Week Comparison |

시리즈명 "Codex April 2026 Deep Dive"로 묶었다. 편당 ~9.0K 글자.

## coffeechat Google Meet 자동 생성 연동

"상담 시작하면 구글 밋 생성하는 로직 있어?" — 없었다. 같은 세션에 붙였다.

구조: 멘토가 Google OAuth로 계정을 연결하면, 예약 확정 시 Calendar API를 통해 Meet 링크가 자동 생성된다.

생성된 핵심 파일:

```
src/lib/google/oauth.ts            — Google OAuth 2.0 PKCE 플로우
src/lib/google/calendar.ts         — Meet 링크 포함 이벤트 생성
src/lib/google/booking-hook.ts     — 예약 확정 훅, Calendar 트리거
supabase/migrations/20260501_mentor_google_oauth.sql
```

테스트 3종(`oauth.test.ts`, `calendar.test.ts`, `booking-hook.test.ts`)도 함께 작성했다. 결제는 Toss 계약 전이라 무통장 임시 운영. `payment/confirm/route.ts`에 실제 API 키만 교체하면 전환된다.

도구 분포: 이 세션은 `Bash(50)` + `Read(20)` + `Write(12)` — 코딩 세션이라 `Agent` 비중이 낮고 `Bash`가 지배적이다.

## 4 세션 합산 통계

| 도구 | 횟수 |
|------|------|
| Bash | 71 |
| Agent | 59 |
| TaskUpdate | 55 |
| Write | 25 |
| TaskCreate | 25 |
| Read | 22 |
| Edit | 5 |
| **합계** | **276** |

생성 파일 25개, 수정 파일 4개. `Agent 59회`가 전체의 21%. 리서치 세션에서 이 비율이 높아지고, 코딩 세션에선 `Bash`로 비중이 이동한다.

## 병렬화가 효과적인 조건

> 서브에이전트는 속도 도구가 아니다. 작업을 쪼갤 수 있는 경계가 있을 때만 효과가 나온다.

IO 바운드 작업(검색, fetch, 추출)은 병렬화 이득이 크다. CPU 집약적 작업(복잡한 추론, 코드 생성)은 제한적이다. 경계가 없는 작업 — 방향 결정, 품질 판단 — 은 메인 컨텍스트에서 해야 한다.

이번 리서치 세션에서 12개가 충돌 없이 돌아간 이유는 하나다. 에이전트마다 겹치지 않는 도메인을 명시적으로 할당했기 때문이다.
