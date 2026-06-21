---
title: "6 세션 388 tool call — Claude Opus 4.8로 하루에 4개 프로젝트 전부 돌린 기록"
project: "portfolio-site"
date: 2026-06-22
lang: ko
tags: [claude-code, multi-agent, workflow, preterview, saju, dental, funding]
description: "하루 6개 Claude Code 세션 388 tool call로 i18n 버그 추적·12에이전트 사업계획서·X봇 최적화까지. Claude Opus 4.8 멀티에이전트 실전 기록."
---

어제 하루 Claude Code 세션을 6개 열었다. 총 388번 tool call, Bash 210회, Read 63회, Edit 45회. 작업한 프로젝트가 preterview / saju_global / 치과 광고 / 펀딩 보고서까지 4개다.

**TL;DR** 멀티에이전트 워크플로를 쓰면 보고서·사업계획서처럼 대용량 텍스트 작업이 극적으로 빨라진다. 단, 모델이 Opus 4.8이어야 에이전트 지시를 제대로 따른다.

## i18n raw 키 버그 — 범인 찾는 데 Bash 116번

세션 2에서 가장 오래 걸린 건 preterview UI 버그였다. 증상은 단순했다: 면접 화면에서 버튼이 `interview.room.endInterview` 같은 raw 키로 노출됨.

처음엔 키 누락을 의심했다. `en.json` / `ko.json` 둘 다 확인했더니 키는 있었다. 코드도 `tr("room.endInterview")`로 정확히 호출하고 있었다. 그런데도 raw 키가 노출됐다.

프롬프트를 이렇게 바꿨다.

```
왜 raw 키가 보이는지 next-intl 메시지 로딩 경로를 따라가서 찾아줘
```

Claude가 `i18n/request.ts`의 `scopeClientMessages(await getMessages(), strippedPath)`를 찾아냈다. 라우트별로 클라이언트에 보낼 i18n 네임스페이스를 `x-cc-pathname` 헤더 기반으로 골라 보내는 최적화 함수였다. 헤더가 비어있으면 `strippedPath`가 `/`로 떨어지면서 interview / portfolio 네임스페이스를 통째로 제외해버리는 구조. 이 함수 하나가 범인이었다.

Read로 코드 경로를 전부 추적하면서 Bash 116번을 썼다. dev 서버를 올리고, 실제 렌더 HTML에 raw 키가 찍히는지 확인하고, 수정 후 `playwright.config.ts`까지 새로 붙였다. 브랜치 보호 설정도 이 세션에서 함께 처리했다. 모바일 320px 헤더 오버플로와 버튼 텍스트 한 글자씩 깨지는 문제도 같이 잡았다.

## 13개 유닛 × 적대적 재보정 — 펀딩 통과확률 숫자로 뽑기

세션 4는 `/effort ultracode`로 시작했다. 정부/민간 지원 프로그램 통과확률을 "냉정하게" 숫자로 뽑는 게 목적이었다.

기존 보고서에는 "중상/중/하" 같은 정성 평가만 있었다. 프롬프트:

```
preterview / 치과 각각 핏에 맞고 확률이 높은것들이랑, 얼마주는지, 냉정한 통과확률이랑 해서 심플하게 보고서로 줘
```

단일 추정으로 찍으면 편향이 들어간다. Claude가 스스로 판단해서 동적 워크플로를 띄웠다: 13개 프로그램×사업 유닛을 독립 추정 → 회의적 재보정(adversarial) 파이프라인으로 돌렸다. 결과는 `~/reports/funding-conclusion-2026-06-22.md`로 나왔다.

같은 세션에서 preterview 첫 결제 경로도 워크플로로 설계했다 — 6개 렌즈(Reddit/niche-forum, Product Hunt, 직접 영업 등) 병렬 설계 후 EV 랭킹. 결론은 Paddle(Merchant of Record)로 정착했다. 법인 없음·예산 $0·1인 제약 조건에서 세금·VAT 처리를 가장 적게 신경 쓰는 구조다.

## 사업계획서 12에이전트 — 127만 토큰, 34분

세션 6이 이날의 하이라이트다. 치과 마케팅 자동화 + preterview 두 사업 사업계획서를 "기술적·상업적으로 뛰어나게" 써달라는 요청이었다.

Claude가 작업 디렉터리 `~/funding/bizplan-2026-06-21/`를 만들고 12개 에이전트를 fan-out했다.

- Foundation (병렬 6): 제품 프로파일 × 2 / 정부·공공 비지분 프로그램 / 민간 VC·AC / 정부 PSST 합격설계도 / 민간 IR 합격공식
- Plans (병렬 2, high effort): 각 사업 완결 사업계획서 (PSST + IR + 3개년 재무 + 단위경제 + 기술아키텍처)
- 이후 Strategy / Critique / Assemble 단계 순차 실행

34분, 약 127만 토큰. `REPORT.md` 약 7,747단어로 완성됐다. 이걸 `md2report/report.py`(Pretendard 폰트, 인쇄/PDF용 OD-equivalent 렌더러)로 HTML+PDF 변환했다.

멀티에이전트 워크플로의 실질적인 장점이 여기서 드러났다. 한 컨텍스트에서 PSST 합격설계도를 분석하면서 동시에 IR 합격공식을 연구하고, 재무 모델을 뽑고, 적대적 검증까지 병렬로 돌린다. 순차적으로 했으면 몇 시간이 걸렸을 작업이다.

## X봇 개선 — 6h 고정 스케줄에서 불규칙 슬롯으로

세션 3, saju_global X봇 작업은 짧지만 클린한 케이스다.

"봇 돌리는 게 너무 안 좋은데?" 한 마디로 시작했다. 확인해보니 스팸봇 타입은 아니었다 — 6시간마다 공식 X API로 1건 발행하는 구조. 문제는 발행 시간이 예측 가능하고, 스레드 포맷이 스팸 패턴처럼 보일 수 있다는 점이었다.

세 가지를 패치했다.

`rotate.ts`에서 `slotCounter`(6h 고정)를 제거하고 매일 바뀌는 4개 불규칙 슬롯 로직으로 교체했다. `formats.ts`에는 스레드 포맷 OFF 스위치와 `ACTIVE_FORMATS`를 추가했다. `generate.ts`에는 AI 말투 스크럽 강화 + 모델 업그레이드를 적용했다.

`vercel.json` cron도 `20 */6 * * *` → `*/15 * * * *`로 바꿨다. 15분마다 cron을 돌리되 내부 스케줄 게이트로 실제 발행 시간을 제어하는 패턴이다.

이 세션은 Bash 25회, Read 13회, Edit 10회. 경량 작업이었지만 의도가 조금 모호한 부분은 `AskUserQuestion`으로 한 번 확인하고 진행했다.

## 하루 작업 수치 정리

388 tool call 중 Bash가 210번(54%)이다. 이 비율이 높은 이유는 두 가지다. 서버 실행·배포·playwright 실행처럼 터미널이 필요한 검증 작업이 많았고, 멀티에이전트 워크플로가 에이전트마다 bash 명령을 여러 번 호출한다.

Opus 4.8 기준으로 동적 워크플로가 가장 빛난 작업은 사업계획서와 펀딩 분석이었다. 에이전트를 "찍어내는" 게 아니라 pipeline → adversarial verify 구조로 설계할 때 결과물 신뢰도가 올라간다.

i18n 버그 추적처럼 단일 컨텍스트에서 코드 경로를 따라가는 작업은 에이전트 없이 직접 Read + Bash + Edit 루프가 더 효율적이었다. tool call 수가 많아도 빠르다. 작업 성격에 따라 도구를 가려 써야 한다는 건 결국 당연한 결론이다.
