---
title: "10 세션, 1,212 tool call: claude-fable-5로 5개 프로젝트 동시 빌드한 72시간"
project: "portfolio-site"
date: 2026-06-13
lang: ko
tags: [claude-code, fable-5, ultracode, workflow, multi-agent, paypal, saju, coffeechat]
description: "6월 11~13일 72시간, 10개 세션 1,212 tool call. 사주 전면 리디자인(25h·356 calls), CoffeeChat 풀스택(27h·532 calls), 창업 프로그램 57개 전수 조사, SpoonAI P0 수선 22분. 병렬 에이전트 패턴과 삽질 기록."
---

532번. CoffeeChat 단일 세션의 tool call 수다. 27시간 48분 동안 `Bash` 190번, `Edit` 136번, `Write` 66번. 인증·결제·TTS·i18n·어드민 대시보드까지 한 세션에서 끝냈다. 같은 72시간 동안 사주 전면 리디자인(356 call), 치과광고 PPT(82 call), 창업 프로그램 전수 조사(62 call), SpoonAI P0 수선(56 call)도 병렬로 진행했다.

**TL;DR** 6월 11~13일 10개 세션, 1,212 tool call. 5개 프로젝트를 claude-fable-5 하나로 동시에 굴렸다. 병목은 모델 속도가 아니라 컨텍스트 분리였다.

## 세션 분포: 22분짜리와 27시간짜리가 공존한다

| 세션 | 소요시간 | tool calls | 주 작업 |
|---|---|---|---|
| CoffeeChat 풀스택 | 27h 48min | 532 | auth + PayPal + TTS + i18n + admin |
| 사주 리디자인 | 25h 26min | 356 | open-design + gpt-image-2 |
| AEO 콜드메일 전략 | 24h 48min | 105 | 전략 + Hermes 엔진 구현 |
| 치과광고 보고서 | 9h 57min | 62 | 딥리서치 + HTML 보고서 |
| 치과 PPT | 7h 6min | 82 | 원장님 브리핑 9장 |
| SpoonAI P0 수선 | 22min | 56 | 버그 수선 + 라이브 배포 |
| 데이문 상태확인 | 5min | 6 | 현황 파악 |
| 모델 오류 세션 | 2min | 0 | claude-fable-5 접근 불가 |

짧은 세션일수록 tool call 밀도가 높다. SpoonAI 세션은 22분 56 call — 분당 2.5회. 긴 세션은 병렬 에이전트 대기 시간이 포함된다.

## CoffeeChat: 532 tool call의 실체

시작 프롬프트가 단순했다.

> "admin 사이트에서 각 유저별로 이메일/비밀번호로 로그인하게 해줘. 토큰 얼마나 쓰는지 볼 수 있게. 필요한 모든 운영툴 붙여줘. 결제도. 글로벌."

"모든 운영툴"이 끝이 없었다. Turso DB 레이어 → JWT 세션 쿠키 인증 → 크레딧 계산 모듈 → PayPal 세 엔드포인트(`create-order`, `capture`, `webhook`) → 어드민 사용자 목록·상세·액션 → next-intl 7개 로케일 → OpenAI TTS → 포폴 심층보강 UI → 이력서 임포트·템플릿·export. 파일 70개 이상이 생성되거나 수정됐다.

기능 단위로 서브에이전트를 병렬 실행했다. `포폴 심층보강 인터랙티브 UI`, `이력서 임포트·템플릿·export UI`, `디자인 QA` 에이전트가 동시에 돌고 task notification으로 완료를 보고했다. 메인 컨텍스트는 오케스트레이션만 했다.

배포 직전에 Vercel이 커밋을 차단했다.

```
The deployment was blocked because the commit author email
(jidong@jidongui-iMac.local) is not valid.
```

`git config user.email`이 iMac 로컬 호스트명으로 설정돼 있었다. 25시간 작업 끝에 나온 블로커다. `git config --global user.email "jd@jidonglab.com"` 한 줄로 해결했지만, Claude가 직접 고칠 수 없는 환경 변수 문제는 항상 이런 식으로 터진다.

## 사주 리디자인: 포지셔닝 전환이 먼저였다

세션 초반에 전략 질문이 나왔다. "전통 사주로 하면 결제 플랫폼이 반려하지 않아?"

6/11 딥리서치 데이터가 이미 메모리에 있었다. Etsy 자연실험: 'AI Reading' 전면 샵은 1개월 판매 0건, 인간 페르소나 샵(연화 만신)은 1년 464건·리뷰 130개·$34 평균 객단가. 결제 플랫폼 심사역은 랜딩 카피가 아니라 **서비스 카테고리** 자체를 본다. 'AI 리포트'든 '전통 사주'든 점술 리포트 파는 서비스라는 사실은 심사에 동일하게 작용한다.

결론: 포장을 바꾸는 게 아니라 점술을 허용하는 결제 레일로 이동하는 것이 맞다. 이 판단을 메모리 파일(`project_saju_paypal.md`)에 업데이트했다.

리디자인은 "Midnight Almanac" 컨셉으로 진행했다. 딥 잉크 인디고 + 골드 헤어라인 + Fraunces 세리프. 코스믹 3D 배경은 라이브 사이트의 Three.js 컴포넌트를 이식하되 별 색상을 골드 틴트로, 드리프트 속도를 낮췄다. v1(무애니메이션) → v2(3D + 패럴랙스) → v3(gpt-image-2 실사) 순서로 이터레이션했다.

gpt-image-2로 수묵화 이미지를 생성했는데 배경과 안 어울렸다. "회전하는 사주차트는 유치해. 더 트렌디하고 기술적으로." 이 피드백 이후 SVG 도형 차트를 전부 걷어냈다. 이미지 생성을 백그라운드 Task로 돌려놓고 그동안 v3 HTML을 만들었다. 생성 완료 알림이 오면 이미지를 끼워 넣는 방식 — 여기서 병렬 처리가 실제로 시간을 줄였다.

## ultracode + dynamic workflow: 57개 프로그램 전수 조사

Primer 시드 지원 검토 요청에서 처음으로 `/effort ultracode`를 걸고 dynamic workflow를 풀로 썼다. 5개 카테고리로 검색 에이전트를 병렬 fan-out했다.

정부지원(DIPS Link-up 등)·민간 액셀러레이터·대기업 오픈이노베이션·AI특화/글로벌·상시 프로그램. 209회 검색·검증, 57개 프로그램 실측. 1인 창업자·AI 자동화 B2B·실 트랙션 조건으로 거르면 즉시 사용 가능한 카드 7개, 공고 임박 모니터링 2개.

이 방식의 핵심은 에이전트마다 2026년 6월 현재 모집 상태를 공식 출처에서 독립 검증한다는 점이다. 혼자 순차 검색하면 하루가 걸릴 작업이다.

## SpoonAI P0: 22분에 배포까지

가장 짧고 밀도 높은 세션이었다. 버그 두 건 — 신규 구독자가 메일을 영구히 못 받는 것 + `/unsubscribe` 404.

`scripts/send-email.js`의 구독자 목록 로직이 신규 등록자를 포함하지 않았다. `/api/unsubscribe` GET이 즉시 삭제하는 대신 확인 페이지로 302 리다이렉트하게 수정하고, `/unsubscribe`·`/feedback` 페이지를 새로 만들었다.

```
/unsubscribe → 200 ✓
/feedback → 200 ✓  
/api/unsubscribe GET → 302 → /unsubscribe?email=... ✓
```

커밋 `4a3c598` 배포, 라이브 검증까지 22분. 이 속도가 나오는 이유는 목표 범위가 처음부터 명확했기 때문이다. "현황 파악 → 다음 할 것?" 같은 열린 질문 없이 P0 두 건만 집었다.

## 모델 오류로 세션이 통째로 날아간 경험

세션 8이 2분에 tool call 0으로 끝났다. `claude-fable-5`에서 `<synthetic>` 모델로 바뀌면서 세션 자체가 무너졌다.

```
There's an issue with the selected model (claude-fable-5[1m]).
It may not exist or you may not have access to it.
```

환경 변수 하나가 세션을 통째로 날린다. 접근 불가 상태가 된 모델을 세션 초반에 감지하지 못하면 이렇게 된다. `/model` 커맨드로 확인 후 진행하는 습관이 필요하다.

## 메모리 파일이 세션 간 연속성을 만든다

10개 세션 전부 `/clear`로 시작했다. 각 프로젝트 메모리(`MEMORY.md` + 개별 파일)를 읽어서 컨텍스트를 복원한다. 치과 프로젝트는 `~/dental-promo/{slug}/clinic.json`, 사주는 `project_saju_paypal.md`, CoffeeChat은 `project_coffeechat_jobprep.md`.

6/11 딥리서치 결과가 6/12 전략 결정의 근거로 쓰인다. 세션이 끊겨도 메모리 파일에서 읽어오기 때문에 흐름이 이어진다. 단, 메모리가 오래될수록 오래된 가정을 그대로 쓸 위험이 있다. 실측으로 뒤집힌 사실은 즉시 업데이트해야 한다 — 이번에도 `project_saju_paypal.md`를 한 번 수정했다.

10 세션, 1,212 tool call. 다음 사이클: 사주 결제 레일 전환, CoffeeChat Vercel 배포 완료, SpoonAI 구독자 그로스 실험.
