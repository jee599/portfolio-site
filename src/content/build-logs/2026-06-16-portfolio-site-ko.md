---
title: "AI SaaS 크레딧 설계부터 사주 X봇까지 — 3세션 457 tool call 기록"
project: "portfolio-site"
date: 2026-06-16
lang: ko
tags: [claude-code, saas, credits, workflow, xbot, coffeechat, fortunelab]
description: "커피챗 크레딧 단가 설계, 사주 프로젝트 매각 전략 수립, X 바이럴 봇 구축. 3개 프로젝트를 넘나든 3세션 457 tool call의 실제 흐름."
---

하루 3개 프로젝트, 3세션, 457번의 도구 호출. Bash 151회, Read 92회, Edit 75회, Write 36회.

가장 긴 세션은 12시간 24분이었다. 307 tool call을 써서 AI 취업 준비 SaaS "커피챗"의 크레딧 시스템을 설계하고, 어드민 페이지를 만들고, 글로벌 GTM 전략 보고서까지 뽑아냈다. 그 다음 세션은 Claude Code Opus 4.8 사용법 리서치, 마지막은 사주 프로젝트 매각 전략 + X 바이럴 봇 구축이었다.

**TL;DR** 크레딧 단가 하나를 잡는 데 10개 이상의 연산이 오갔다. 전략 판단 자체를 Claude에 위임하되, 숫자 검증은 직접 했다. 병렬 workflow는 시장 분석처럼 독립된 조각이 많을 때 실질적으로 빠르다.

## 크레딧 단가를 역산하는 데 1시간이 걸렸다

커피챗은 AI 패널 3명이 진행하는 모의 면접 + 이력서 리뷰 + 포트폴리오 분석 SaaS다. 핵심 문제는 하나였다: 면접 30턴에 얼마를 받을 것인가.

Opus 4.8 기준 API 원가를 먼저 계산했다. 면접은 3개 AI 패널이 동시에 응답하니까 단순 계산이 아니었다. 이력서 1회 분석, 포트폴리오 1회 분석, 면접 30턴을 Sonnet / Opus 조합으로 돌렸을 때 실제 원가가 얼마인지 물어봤다.

세션 기록의 프롬프트:

> "이력서 / 포폴 / 면접 20/30턴, 보고서 각각 sonnet / opus로 했을 때 얼마가 들고, 내부 크레딧으로는 얼마가 소모돼?"

API 원가 → 크레딧 환산 → 유저 판매가 순으로 역산했다. 5배 마진을 적용하면 30턴 면접이 크레딧 기준 900이 나왔다. 그다음은 크레딧 가격 설정이었다.

> "30턴에 7000원 정도 나오게 하고 싶어."

크레딧 100개 = 1달러 기준으로 계산했을 때 30턴 = 900크레딧 = 9달러. 환율 적용하면 12,000원 선. 목표 7,000원에는 못 미쳤다. 마진을 줄이거나 모델을 낮추거나, 아니면 캐싱으로 원가를 줄여야 했다.

결론으로 선택한 건 Anthropic의 프롬프트 캐싱이었다. 시스템 프롬프트가 고정이라 캐싱 적용 시 반복 호출 원가가 최대 90% 줄어든다. `lib/credits.ts`에 캐싱 로직을 구현했고, 실제로 30턴에 900크레딧 = 7,000원 목표치를 맞출 수 있었다.

## 어드민 페이지는 처음부터 전수 로그가 목표였다

> "admin 페이지 어디에 만들었어? 모든 유저들 동향 / 사용한 api 요금 유저별 어떻게 진행했는지, 방문자 수 몇인지, 각 기능별로 얼마나 사용했는지"

빠뜨린 게 많았다. 어드민은 초안이 있었지만 API 비용 추적이 없었다. `lib/audit.ts`를 새로 만들고, `app/api/track/route.ts`로 각 기능 호출마다 사용량을 기록하는 구조를 추가했다.

방문자 수는 별도 인프라가 필요했다. Resend API 키를 연결해서 이메일 인증을 전문적으로 붙이고(`app/api/auth/signup/route.ts`), 동시에 `page-tracker.tsx`로 페이지뷰를 추적했다. 어드민에서 유저별 크레딧 소비 + API 원가 + 기능별 사용률을 한 화면에서 볼 수 있게 됐다.

## 글로벌 GTM을 보고서 한 장으로 정리했다

> "지금 서비스 글로벌에 어떻게 접목시킬지 보고서 하나만 줘봐."

커피챗은 한국 취업 특화로 만든 서비스다. 그걸 해외에 어떻게 팔까. 면접 문화가 다르고, 산업군도 다르고, 가격 민감도도 다르다. 이 질문에 report-builder 스킬로 보고서를 뽑았다.

`~/reports/posts/2026-06-15-coffeechat-global-gtm.html`에 저장된 보고서의 핵심 결론: 영어권 시장은 "직군 다양화"가 먼저다. 취업 준비 서비스는 글로벌로 나가기 전에 국내에서 직군(개발·디자인→경영·마케팅·금융)을 먼저 확장하는 편이 낫다. 글로벌은 그다음 단계였다.

결제는 PortOne으로 결정했다. 토스는 해외 결제가 막혀있고, PortOne은 국내 PG + 해외 카드를 한 SDK로 처리한다. 연동 비용 없음을 확인하고 붙였다.

## 두 번째 세션: Claude Code 잘 쓰는 법을 직접 검색했다

52분, 41 tool call. 공식문서 / GitHub 생태계 / 커뮤니티 트렌드 세 갈래로 병렬 리서치했다.

에이전트 5개가 동시에 돌았다. 공식 Anthropic 문서, Claude Code GitHub 레포, Reddit/Hacker News 최신 스레드, 그리고 실무 사례. 결과를 하나로 종합한 뒤 report-builder로 HTML 보고서를 만들었다.

최신에 가장 실질적인 변화가 있는 건 Dynamic Workflow였다. 세션에서 따로 깊게 파도록 추가 리서치를 요청했다. 공식 문서 갈래 + 실전/예제 갈래로 나눠 병렬 서칭. 결과는 기존 보고서에 섹션으로 추가했다.

보고서 경로: `~/reports/posts/2026-06-15-claude-code-opus-48-best-practices.html`

## 세 번째 세션: 사주 프로젝트 매각 전략 + X봇

1시간 57분, 109 tool call. 가장 많은 Write(19회)가 발생한 세션이다.

먼저 프로젝트 현황 파악부터 했다. `~/saju_global/STATUS.md`에서 실제 지표를 꺼냈다.

- 누적 유료 주문 30건 (전부 KR Toss, 해외 PayPal 0건)
- 4월 세션 87회
- 프로덕션이 44일 동안 배포가 끊겨 있었음
- 글로벌 첫 결제 아직 미달성

이 상태에서 "팔아야 돼, 전략 수립해줘"라는 요청이 왔다. 5개 분석 에이전트를 병렬로 돌렸다: KR 시장 분석, 단위경제 분석, 제품 진단, 채널 분석, 자산 매각 전략.

한국 점술/운세 시장 규모는 약 1.4조원(InnoForest/매거진한경 추산). 글로벌 spiritual 앱 시장은 2027년까지 연평균 10% 성장 예상. 숫자는 크다. 문제는 이 서비스의 실제 유저 기반이 너무 얇다는 거였다. 5개 분석 결과가 모두 같은 결론으로 수렴했다: **먼저 트래션부터.**

그래서 X봇을 만들었다.

> "x 계정에 영어로 6시간마다 사주 풀이 하는건 어때? 특정 타겟층 대상으로"

특정 출생연도/월로 타깃을 좁혀서 사주 분석을 X에 올리는 자동화 봇. `lib/xbot/` 디렉토리에 7개 모듈이 생겼다: `cohorts.ts`(타깃 코호트), `formats.ts`(포스트 형식), `viral.ts`(바이럴 최적화), `voices.ts`(페르소나 목소리), `rotate.ts`(형식 로테이션), `xClient.ts`(X API), `generate.ts`(콘텐츠 생성). Vercel Cron에 `/api/cron/x-post/route.ts`를 추가해서 6시간마다 자동 발행 구조를 잡았다.

계정 브랜딩용 이미지는 `gpt-image-2`로 생성했다. `genimg-x-brand.py`, `genimg-x-brand2.py`, `genimg-x-brand3.py` 세 번에 걸쳐 시도했다. 아바타·배너·페르소나 이미지를 여러 스타일로 뽑고 HTML 프리뷰(`x-brand/avatar-preview.html`)로 비교했다.

## 병렬 workflow가 실질적으로 빠른 조건

이번 세션들에서 workflow fan-out이 효과적이었던 경우는 분석 단위가 독립적일 때였다. 사주 프로젝트의 KR 시장 분석, 단위경제, 채널, 매각 전략은 서로 의존하지 않는다. 5개가 동시에 돌면 1개씩 순서대로 돌리는 것보다 실질 소요 시간이 1/5에 수렴한다.

반대로 크레딧 단가 계산은 순차였다. 원가 → 마진율 → 크레딧 가격 → 보너스 조정 순서로 앞 결과가 다음 입력을 결정했다. 이건 workflow가 아니라 직접 대화가 더 빠른 케이스였다.

세션 성격이 다르면 도구 분포가 달라진다. 이번 3세션의 분포:

<hr class="section-break">

<div class="change-summary">
<table>
<thead><tr><th>항목</th><th>수치</th></tr></thead>
<tbody>
<tr><td class="label">총 tool calls</td><td class="after">457회</td></tr>
<tr><td class="label">Bash</td><td class="after">151회</td></tr>
<tr><td class="label">Read</td><td class="after">92회</td></tr>
<tr><td class="label">Edit</td><td class="after">75회</td></tr>
<tr><td class="label">Write</td><td class="after">36회</td></tr>
<tr><td class="label">Agent (workflow)</td><td class="after">23회</td></tr>
<tr><td class="label">수정 파일</td><td class="after">34개</td></tr>
<tr><td class="label">생성 파일</td><td class="after">32개</td></tr>
<tr><td class="label">세션 총 소요</td><td class="after">약 15시간</td></tr>
</tbody>
</table>
</div>
