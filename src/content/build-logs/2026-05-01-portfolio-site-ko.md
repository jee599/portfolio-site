---
title: "서브에이전트 12개 병렬 투입 — AI 치과 광고 시장 전수조사 + DEV.to 5편 발행"
project: "portfolio-site"
date: 2026-05-01
lang: ko
tags: [claude-code, agents, research, automation, devto]
description: "AI 치과 광고 시장 조사에 Claude Code 서브에이전트 12개를 병렬로 투입했다. 276 tool calls, HTML 보고서 7종과 DEV.to Codex 시리즈 5편을 한 사이클에 처리한 방법을 정리한다."
---

4개 세션, 276 tool calls. 가장 큰 세션에서는 서브에이전트를 12개 동시에 띄웠다. 한국 AI 치과·병원 광고 시장 전체를 커버하는 리서치였는데, 에이전트 하나하나에 서로 다른 도메인을 할당하고 병렬로 돌렸다.

**TL;DR** 서브에이전트를 12개까지 병렬로 투입하면 단일 세션으로는 불가능한 규모의 조사가 가능하다. DEV.to 글 5편도 같은 방식으로 병렬 생성해서 한꺼번에 발행했다.

## 치과 광고 시장에 에이전트를 12개 투입한 이유

한국 AI 치과·병원 광고 시장은 업체 수가 많고 카테고리도 제각각이다. SEO 특화 에이전시, 영상·쇼츠 제작사, 자체 SaaS 툴, AI 콘텐츠 생성 플랫폼이 뒤섞여 있다. 하나씩 조사하면 며칠이 걸리는 작업이다.

해결책은 도메인 분리였다. 12개 에이전트에 각각 다른 조사 영역을 할당했다.

실제 입력한 프롬프트:

```
지금 ai로 광고하는 치과 / 병원 홍보 업체들 모두 조사해줘
한국꺼 모든 업체 조사해서 정리해줘 내가 알아야하는 모든 정보
서브에이전트 여러개 써서
```

AgentCrow가 12개를 병렬 디스패치했다. 각 에이전트는 `WebSearch` + `WebFetch`로 자신의 영역만 파고, 완료 후 결과를 반환했다.

- 에이전시 유형별 딥다이브 (3개)
- 실제 결과물·포트폴리오 수집 (2개)
- 네이버 알고리즘 변화 추적 (2개)
- 규제·법적 리스크 분석 (2개)
- 가격 구조·ROI 분석 (2개)
- 빈 시장 기회 탐색 (1개)

## 결과물: HTML 리포트 7종

생성된 파일 목록이다.

| 파일명 | 내용 |
|--------|------|
| `TREND-COMPARISON-REPORT.html` | 5년·1년·90일 트렌드 비교, 7개 축 |
| `AI-AGENCIES-DEEP-REPORT.html` | 60곳 업체 카드 분해, 9섹션 |
| `AI-AGENCIES-PRIMER.html` | 전문용어 없는 입문서 |
| `AI-AGENCIES-EXAMPLES.html` | 실제 산출물 갤러리, 검증 URL 포함 |
| `AI-DENTAL-MASTER.html` | 200곳 이상 업체 통합 디렉토리 |
| `AI-DENTAL-AD-HOW-IT-WORKS.html` | 작동 메커니즘 + 다음 액션 플랜, 49KB |

마지막 리포트는 Pretendard + IBM Plex Serif, 크림 페이퍼 배경(`#f5f3ed`), 녹색 액센트(`#0d4d3a`). 기존 `HOW-ADS-WORK.html` 스타일 시스템을 그대로 이어받았다.

최종 통합 리포트는 에이전트 4개로 각도별 분석을 분리해서 백그라운드로 돌렸다: 결과물 사례 / 작동 메커니즘 / 규제·리스크·갭 / 상위 업체 딥다이브. 4개 모두 완료된 후 한 번에 통합 작성했다.

## DEV.to 글 5편을 병렬로 쓴 방법

같은 기간에 `auto-publish` 스킬로 DEV.to에 Codex 시리즈를 발행했다.

```
dev to에 codex 관련해서 글 써줘 최신 소식 기준으로 5개 정도
gpt image2나 심포니 같은것들
```

흐름은 이랬다: 병렬 `WebSearch`로 최신 동향 리서치 → 주제 후보 5개 제시 → 확인 (`ㅇㅇ`) → 에이전트 5개 동시 생성.

| # | 제목 | 분량 |
|---|------|------|
| 1 | GPT Image 2 Inside Codex: My New Frontend Workflow | ~9.0K |
| 2 | Symphony: Why OpenAI's PRs Jumped 500% in 3 Weeks | ~9.0K |
| 3 | I Gave Codex My Mouse for a Day | ~9.0K |
| 4 | Codex vs Claude Code: A Pragmatic Comparison | ~9.0K |
| 5 | The Reasoning Tax: What O-Series Thinking Costs | ~9.0K |

시리즈명 "Codex April 2026 Deep Dive"로 묶어 발행했다.

## 삽질: 실패로 착각한 성공한 tool call

DEV.to 글 생성 중에 `Write` 도구가 "실패"로 표시됐다. 다시 시도했더니 파일이 8개가 됐다.

원인은 silent success였다. tool call이 실제로 완료됐는데 응답이 늦게 왔고, 에이전트가 실패로 판단해서 재시도했다.

```
I see duplicates — earlier "failed" tool calls actually succeeded silently,
leaving 8 files. Let me clean up and keep the 5 within-spec versions.
```

파일 점검 후 5개로 정리해서 커밋. 이어서 `git push`가 거절됐다. remote에 CI 커밋이 앞서 있었기 때문이다.

```bash
git pull --rebase origin main
git push
```

에이전트가 에러 로그를 읽고 `pull --rebase`까지 혼자 결정했다. CI가 붙어있는 레포에서는 이 패턴이 반복된다.

병렬 에이전트를 많이 쓸수록 이런 타이밍 이슈가 생긴다. 에이전트마다 파일명 컨벤션을 명시적으로 지정해야 한다. 지정 안 하면 각자 판단한다.

## 커피챗 Google Meet 연동

치과 리서치 사이에 커피챗 프로젝트에서 Google Meet 자동 생성 로직을 붙였다. 상담 예약 확정 시 자동으로 Meet 링크가 생성되는 구조다.

OAuth 플로우:

- `GET /api/mentor/google/connect` — OAuth 시작
- `GET /api/mentor/google/callback` — 토큰 저장 (Supabase)
- `src/lib/google/booking-hook.ts` — 예약 확정 훅, Calendar API 호출

결제는 토스 계약 전이라 무통장 임시 운영. `payment/confirm/route.ts`에 실제 API 키만 교체하면 전환된다. 마이그레이션 파일과 유닛 테스트 3종(`oauth.test.ts`, `calendar.test.ts`, `booking-hook.test.ts`)도 함께 작성했다.

## 도구 사용 통계

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

`Agent` 59회, 전체의 21%. 리서치·생성·분석을 에이전트에 위임하고, `Bash`는 파일 확인과 git 작업 위주로만 썼다. 총 세션 4개, 생성 파일 25개, 수정 파일 4개.

## 핵심: 위임 가능한 경계가 먼저다

> 서브에이전트는 속도 도구가 아니다. 작업을 쪼갤 수 있는 경계가 있을 때만 효과가 나온다.

경계가 없는 작업 — 방향 결정, 품질 판단 — 은 메인 컨텍스트에서 해야 한다. 이번 두 세션 모두 위임 전에 구조를 먼저 잡았다. 12개 에이전트에 "겹치지 않는 도메인"을 줬기 때문에 중복 없이 돌아갔다. 그게 병렬 디스패치를 효과적으로 만든 이유다.
