---
title: "Claude Code 아웃리치 자동화 — 하루 34세션, WebSearch 이메일 환각 발견기"
project: "portfolio-site"
date: 2026-06-09
lang: ko
tags: [claude-code, automation, ai-agent, outreach]
description: "글로벌 로컬 비즈니스 아웃리치 파이프라인을 Claude Code로 자동화했다. 세션당 목표 220개 리드지만 실제 검증된 이메일은 15-20개. WebSearch 이메일 환각 문제를 WebFetch 직접 검증으로 해결한 기록."
---

하루에 34번, Claude Code가 스스로 글로벌 로컬 비즈니스를 발굴했다. 세션당 tool call은 47~122회. 목표는 매 시간 220개 신규 리드. 실제로 검증된 이메일은 15~20개였다.

**TL;DR** 글로벌 카피 아웃리치 파이프라인을 Claude Code로 자동화했다. 핵심 발견: WebSearch 요약 모델이 이메일 주소를 환각한다. WebFetch 직접 검증을 필수 단계로 만들어야 파이프라인이 신뢰할 수 있다.

## 파이프라인 구조: 15개 레인, 매 시간 실행

`/jdlab-daily-cron` 커맨드로 매 시간 트리거된다. 파라미터는 이렇다:

```
target=220
dedupe_against_existing=true
voice=human_specific_professional_trust_building_hooked_free_mini_diagnosis
```

15개 레인이 있다. `us_home_services`, `us_food_cafe`, `us_salon_spa`, `us_pet_services`, `us_auto_services`, `us_hospitality_bnb`, `us_wedding_events`, `specialty_retail_classes`, `shopify_dtc`, `woocommerce_independent`, `wix_squarespace_studio`, `b2b_service_firms`, `ca_local_services`, `uk_ie_local_services`, `anz_local_services`. 레인별로 JSON 파일을 생성하고, 중앙 validator가 schema + safety gate를 통과한 항목만 빌더에 넘긴다.

각 세션에서 Claude Code가 실행하는 순서는 명확하다: 스키마·validator 읽기 → WebSearch로 후보 발굴 → WebFetch로 이메일 직접 확인 → 레인별 JSON 파일 작성 → 요약 리포트 생성. 세션 1에서 이 흐름을 잡고, 나머지 33개 세션이 같은 패턴으로 돌아갔다.

## 목표 220개 리드, 현실은 15-20개

세션 3에서 에이전트가 스스로 이 불일치를 명시적으로 기록했다:

> "120 verified public emails would require 250+ successful fetches, which isn't feasible at honest quality in one session."

실제 수율을 측정해보면, WebFetch로 페이지를 읽을 때 약 40~50%만 공개 이메일을 노출한다. 나머지는 contact form, 전화번호만, 또는 403/404 오류다. 세션당 30~40회 WebFetch를 실행하면 현실적으로 12~20개의 검증된 이메일이 나온다.

220개 목표는 구조적으로 달성 불가능하다. 파이프라인이 그 사실을 정직하게 리포트하는 게 핵심이다. 에이전트가 숫자를 채우려고 검증되지 않은 이메일을 끼워 넣지 않는다.

## WebSearch가 이메일을 환각했다

세션 7에서 치명적인 문제를 발견했다. WebSearch의 요약 모델이 이메일 주소와 도메인을 실제와 다르게 합성해서 반환하는 것이다.

실제 포착된 케이스:
- 실제 도메인 `austinpetsittingservices.com` → 요약에서 `austinpettingsservices.com`으로 출력
- `walkatxpets.com`의 이메일로 `info@walkatx.com` 반환 (실제로 존재하지 않는 주소)
- 검색 snippet에 `craig@toyne.co.uk`가 표시 → 실제 페이지에서는 `admin@toyne.co.uk`

마지막 케이스가 특히 중요하다. 요약 모델이 그럴듯한 이메일을 만들어낸 것이다. 이걸 그대로 사용하면 auto-send 파이프라인에서 잘못된 주소로 이메일이 나간다. 세션 7 에이전트가 메모리에 직접 기록했다:

> "The summarizer model invents plausible-but-wrong emails/domains. Recording this critical calibration point."

이 발견 이후 모든 세션에서 WebSearch snippet은 후보 발굴에만 쓰고, 이메일은 반드시 WebFetch로 원본 페이지에서 확인하는 규칙이 고정됐다.

## WebFetch 직접 검증이 유일한 해법인 이유

규칙은 단순하다. 모든 리드를 WebFetch로 실제 페이지를 읽어 이메일을 확인한다. 추가로, WebFetch가 이메일을 `[email protected]`으로 redact하는 경우도 있었다 (Cloudflare 이메일 난독화 + PII 보호). 이 경우에는 `not_found`로 기록하고 해당 리드를 드랍한다.

레인 파일에 포함되려면 세 가지를 만족해야 한다. WebFetch로 확인된 실제 이메일 주소, 페이지에서 직접 읽은 헤드라인이나 카피 (진단 근거), Before→After 카피 제안 (quality gate 통과 조건). 하나라도 빠지면 validator가 통과시키지 않는다.

세션 1에서 이 원칙이 실제로 효과를 발휘한 케이스가 있었다. Toyne의 실제 주소는 `admin@toyne.co.uk`인데 snippet에는 `craig@toyne.co.uk`가 보였다. 검증하지 않았으면 잘못된 주소로 발송됐을 것이다. "The verification discipline is already proving its worth"라고 에이전트가 직접 기록했다.

## 레인별 이메일 노출 패턴

34세션을 돌리면서 레인별 특성이 데이터로 쌓였다.

이메일 노출이 높은 레인은 `us_home_services` (전기·배관·도장), `us_food_cafe` (독립 카페·레스토랑), `b2b_service_firms` (소규모 IT/MSP)다. 독립 사업자가 직접 운영하는 사이트일수록 이메일을 공개 노출한다.

이메일 노출이 낮은 레인은 `us_wedding_events` (예약 플랫폼 종속), `us_pet_services` (Cloudflare 이메일 난독화 많음), `anz_local_services` (예약 포털 위주), `uk_ie_local_services` (contact form only 비율 높음)이다.

`us_hospitality_bnb`는 중간 정도인데, 대형 체인이나 Airbnb 리스팅을 필터링해야 독립 운영 BnB의 이메일이 나온다. 이 패턴 데이터가 `jdlab-lane-reachability.md`에 누적되면서 다음 세션의 discovery 전략에 반영된다.

## Claude Code에 배운 것: 정직한 실패 보고가 더 가치 있다

직접 코드를 짠 게 아니다. Claude Code에게 프롬프트를 주고 파이프라인을 운영했다. 그 과정에서 배운 것이 있다.

목표 수치가 현실과 맞지 않을 때, 에이전트가 솔직하게 말하게 설계해야 한다. "target=220"이지만 달성 불가능하다는 걸 에이전트 스스로 기록하고 메모리에 저장했다. 이게 없으면 파이프라인은 가짜 숫자를 채워서 목표를 달성한 척 할 것이다.

auto-send 파이프라인에서는 데이터 품질이 코드 품질보다 중요하다. WebSearch 환각 이메일 하나가 실제 사람에게 엉뚱한 이메일을 보내는 결과로 이어진다. 코드가 아무리 잘 돌아도 입력 데이터가 틀리면 무의미하다.

Claude Code의 tool call 통계가 실제 작업 밀도를 드러낸다. 세션 3은 122회, 세션 7은 47회. WebFetch 비중이 높은 세션일수록 검증 밀도가 높고, 실제로 신뢰할 수 있는 리드를 더 많이 생산했다.

<div class="change-summary">
<table>
<thead><tr><th>항목</th><th>Before (목표)</th><th>After (실제)</th></tr></thead>
<tbody>
<tr><td class="label">세션당 리드 수</td><td class="before">220개</td><td class="after">15~20개</td></tr>
<tr><td class="label">이메일 소스</td><td class="before">WebSearch snippet</td><td class="after">WebFetch 직접 확인</td></tr>
<tr><td class="label">환각 이메일</td><td class="before">걸러지지 않음</td><td class="after">validator 드랍</td></tr>
<tr><td class="label">레인 수</td><td class="before">-</td><td class="after">15개</td></tr>
<tr><td class="label">총 세션</td><td class="before">-</td><td class="after">34세션 / 1일</td></tr>
</tbody>
</table>
</div>
