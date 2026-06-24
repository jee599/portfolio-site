---
title: "Claude Code 8세션 · 933 tool call — Paddle 결제부터 185개 기관 콜드메일까지"
project: "portfolio-site"
date: 2026-06-25
lang: ko
tags: [claude-code, paddle, preterview, cold-email, dynamic-workflow, automation]
description: "사흘간 8개 세션, 총 933회 tool call. Paddle 결제 통합(271회), 다중 에이전트 경쟁사 분석, IT 교육기관 185곳 개인화 콜드메일까지 Claude Code 하나로 처리한 사흘치 기록."
---

단일 세션에서 tool call이 271번 나왔다. Bash 68, Chrome 67, Edit 36, Read 25, Navigate 17 — 이게 Claude Code로 실제 결제를 붙이는 과정이다.

**TL;DR** 사흘 동안 Preterview에 Paddle 결제를 붙이고, 코드잇 어센트를 다중 에이전트로 분석하고, IT 교육기관 185곳 콜드메일 초안까지 만들었다. 전부 Claude Code 하나로.

## 271번 tool call짜리 결제 통합

가장 무거운 세션은 Session 2였다. 23시간 40분, 271 tool call. 시작 프롬프트는 단 한 줄이었다: "paddle 결제 perterview에 붙일거야."

Claude가 먼저 한 건 프로젝트 구조 파악이었다. `feat/geo-payment-routing` 브랜치가 이미 머지돼 있었고, 기존 결제 구조(한국→PayApp, 해외→PayPal)가 완비된 상태였다. Paddle은 PayPal 자리를 대체하는 그림이 자연스러웠다.

구현 전에 공식 문서 실측을 먼저 돌렸다. "Paddle Billing API는 자주 바뀌고 웹훅 서명 검증을 틀리면 치명적"이라는 판단이었다. 그 판단대로 WebFetch 에이전트를 4개 영역으로 팬아웃해서 현재 통합 방식을 검증한 뒤에야 코드를 짰다.

최종적으로 생성된 파일은 `lib/payments/paddle.ts`, `app/api/pay/paddle/{create,webhook,confirm}/route.ts`, `components/pricing/PaddleBuy.tsx`, `docs/paddle-setup.md`다. Chrome 도구가 Bash만큼 나온 건 — 실제로 결제 화면을 띄워서 동작을 눈으로 확인하는 과정이 그만큼 많았다는 뜻이다. "지금 결제 paddle이 아니라 paypal 아니야?"라고 사용자가 스크린샷을 붙이면서 실측 디버깅이 이어졌다.

## 다중 에이전트로 경쟁사 해부

Session 4는 "코드잇에서 낸 내 프리터뷰랑 비슷한 기능이 있는 것 같은데 지금 기준 비교해줘"로 시작했다.

단순 검색이 아니라 dynamic workflow를 돌렸다. 4갈래 팬아웃 — 어센트 제품 정밀조사, 코드잇 회사·전략 맥락, 국내 AI 모의면접 경쟁 지형, 핵심 주장 교차검증. 검증 결과가 예상과 달랐다: "정면충돌이 아니라 인접 시장."

어센트는 한국 전 직군 취준용(113개 기업맞춤 면접, 마케팅·기획·PM 포함)이고, 프리터뷰는 글로벌 개발자 특화(GitHub/포트폴리오 분석, 영어 지원). 겹치는 건 "음성 양방향 모의면접 + 다차원 리포트" 골격뿐이었다. "어센트가 GitHub/포트폴리오 URL 분석 기능 있다"는 주장은 교차검증에서 refuted로 확정됐다.

같은 세션에서 클라이언트 행동 로깅도 붙였다. "안된다고 피드백이 왔는데 로그인하라는 알람이 안 떠?"가 트리거였다. `components/action-logger.tsx`, `app/api/client-log/route.ts`, `app/admin/logs/page.tsx` — 추적 시스템을 세션 하나에서 다 달았다.

## 185개 기관 콜드메일 자동화

Session 8이 가장 복잡한 세션이었다. 290 tool call. 시작은 이메일 초안 하나였다.

"preterview를 판매하는 이메일 양식을 만들어줘. 인플루언서 / 대학교취업지원 부분에 홍보하는 메일을."

여기서부터 이렇게 흘렀다: 이메일 HTML 제작 → 실제 발송 테스트(jee599@naver.com) → 이메일에서 영상 미리보기 안 되는 문제 발견 → GIF 대안 시도 → 결국 스크린샷 첨부 방식으로 결론. "이메일에서 영상 재생은 안 된다"는 클라이언트 제약을 실제로 부딪혀서 확인한 과정이다.

스케일 업 요청이 들어왔다: "엄선해서 국내 30~50개 / 국외 50개 이상. 각각 개별화된 문구로. 정확한 이메일로."

Dynamic workflow가 두 번 돌았다. 첫 번째(95개 발굴) → 사용자 피드백("워크숍 연계 이런 건 별로, 내가 할 수 없는 건 빼") → 두 번째(198개 발굴, 이메일 확인된 185개). 삼성SSAFY, 우아한테크코스, 멀티캠퍼스부터 MIT CSAIL, Stanford HAI까지. 추측 이메일은 명시적으로 금지(출처 없는 이메일은 제외)했고, 기관별 담당자 역할에 맞춰 개인화 문구를 각각 넣었다.

마지막 결정: "크론잡으로 하루에 30." 도메인 평판을 지키면서 스로틀 걸어 일일 30건씩 발송하는 구조다.

## 지원사업 두 번 서칭, 메모리가 SSOT

Sessions 5, 7에서 정부·민간 지원사업을 각각 서칭했다. 같은 기간에 두 번 하는 이유가 있었다 — 첫 번째(6/22)는 42건 라이브 검증, 두 번째(6/24)는 이틀 뒤 "오늘 기준 아직 열려있는 것만" 재검증이었다.

이 패턴에서 흥미로운 건 Claude가 `~/funding/` 로컬 디렉토리의 기존 조사 결과를 먼저 읽고, 중복 재조사 없이 변동분만 실측했다는 점이다. `project_primer_application.md` 메모리 파일이 세션 간 컨텍스트 복원의 SSOT 역할을 했다. 이틀 전 조사가 있으면 재탐색이 아니라 델타 검증만 하는 구조다.

## 수치 정리

| 세션 | 주요 작업 | tool calls |
|---|---|---|
| Session 8 | 콜드메일 자동화 | 290 |
| Session 2 | Paddle 결제 통합 | 271 |
| Session 4 | 경쟁사 분석 + 행동 로깅 | 168 |
| Session 3 | 이사 체크리스트 앱 | 79 |
| Session 7 | 지원사업 재서칭 + IR | 67 |
| Session 5 | 지원사업 서칭 | 51 |
| Session 1 | 치과 정기측정 | 2 |
| Session 6 | 쓰레드 전략 | 5 |

사흘 동안 한 작업이 맞다. Session 2와 Session 8은 각각 하루를 넘겼다. 총 933 tool call, 모델은 전부 `claude-opus-4-8`.
