---
title: "시간당 자동 실행 7회 — Claude Opus가 전 세계 소상공인 이메일을 직접 검증한 하루"
project: "portfolio-site"
date: 2026-06-07
lang: ko
tags: [claude-code, automation, outreach, local-commerce, claude-opus, web-scraping]
description: "7개 세션, 573 tool call, 19개 비즈니스 카테고리. Claude Opus가 매시간 실제 페이지를 방문해 이메일을 검증하는 아웃리치 파이프라인의 하루치 기록."
---

오전 0시 49분부터 오전 6시 50분까지, Claude Opus가 매시간 자동으로 깨어났다. `/jdlab-daily-cron` 커맨드 하나로 전 세계 소상공인 사이트를 뒤지고, 이메일을 검증하고, 맞춤 카피 진단 초안을 작성했다. 7회 실행, 총 573 tool call.

**TL;DR** 하루 7회 자동 실행되는 글로벌 아웃리치 파이프라인을 운용했다. WebSearch 요약 AI가 이메일 주소를 날조한다는 사실을 세션 7에서 실험적으로 확인했고, 그 이후 모든 리드는 `WebFetch`로 실제 페이지를 방문해 직접 검증한다.

## 7개 세션의 도구 사용 분포

각 세션은 동일한 `target=220` 목표로 실행됐지만, 내부 tool call 분포는 완전히 달랐다.

| 실행 시각 | 소요 시간 | tool call | WebFetch | WebSearch | Write |
|---------|---------|-----------|----------|-----------|-------|
| 00:49 | 31분 | 91 | 23 | 28 | 21 |
| 01:49 | 22분 | 71 | 33 | 15 | 19 |
| 02:49 | 40분 | 122 | 68 | 26 | 19 |
| 03:50 | 18분 | 76 | 30 | 22 | 19 |
| 04:50 | 19분 | 76 | 33 | 16 | 19 |
| 05:50 | 29분 | 90 | 44 | 20 | 19 |
| 06:50 | 18분 | 47 | 22 | 8 | 12 |

세션 3이 이상치다. 40분에 122회, WebFetch만 68회. 검증에 압도적으로 치우쳤다. 반대로 세션 7은 47회로 가장 적다. WebSearch 8회는 전 세션 중 최저치다. 세션 7에서 무언가를 발견했다.

## 세션 7의 발견: WebSearch가 이메일을 만들어낸다

세션 7은 처음부터 조심스러웠다. 에이전트가 실행 초반에 WebSearch 결과를 교차 검증하다가 이상한 패턴을 포착했다.

검색 요약에서 `austinpettingsservices.com`이라는 도메인이 나왔다. 실제 사업체는 `austinpetsittingservices.com`이었다. `info@walkatx.com`이라는 이메일도 나왔다. 실제 도메인은 `walkatxpets.com`이었다.

요약 AI가 그럴듯한 문자열을 조합한 것이다. 이 파이프라인은 실제 이메일을 자동 발송한다. 확인하지 않고 그대로 기록했다면 존재하지 않는 주소로 수십 건의 메일이 나갔을 것이다.

이 발견 이후 세션 7의 WebSearch 호출은 8회로 줄었다. WebFetch 직접 방문 22회로 대체했다.

## 검증 규율: 스니펫은 증거가 아니다

세션 1에서 실제로 발생한 사례다. Toyne이라는 사업체의 이메일이 검색 스니펫에서 `craig@`으로 나왔다. WebFetch로 실제 페이지를 열었더니 `admin@`이었다. Hair Studio Day Spa는 스니펫에서 `hairstudiodaypa@gmail.com`이었는데 실제와 한 글자 차이였다. 차이가 있다는 걸 모르면 발송된다.

파이프라인의 원칙은 하나다. 공개된 이메일을 WebFetch로 실제 페이지에서 직접 확인하지 못하면 `not_found`로 기록한다. 채울 숫자보다 정확한 숫자가 낫다.

## WebFetch도 완전하지 않다

세션 7이 추가로 확인한 제약이 있다. WebFetch가 이메일 주소를 `[email protected]`으로 치환한다. PII 리댁션을 도구 레벨에서 수행하는 것이다.

결과적으로 교차 검증이 필요해진다. 검색 스니펫에 이메일이 노출된 경우와 WebFetch 결과를 함께 본다. 두 신호가 일치할 때만 기록에 넣는다. 어느 하나만으로는 충분하지 않다.

세션 3에서 WebFetch를 68회 쓴 이유가 여기 있다. 검색이 후보를 많이 올렸고, 각각을 페이지 방문으로 확인했다.

## 15개 레인을 가로질러

각 세션은 15개 업종 레인에서 동시에 후보를 탐색한다. `us_home_services`, `us_food_cafe`, `us_pet_services`, `us_auto_services`, `us_salon_spa`, `us_wedding_events`, `us_hospitality_bnb`, `ca_local_services`, `uk_ie_local_services`, `anz_local_services`, `shopify_dtc`, `woocommerce_independent`, `wix_squarespace_studio`, `specialty_retail_classes`, `b2b_service_firms`.

레인마다 도달 가능성이 다르다. 미국 로컬 서비스 업종은 이메일이 있는 경우가 많다. UK/아일랜드, ANZ 레인은 예약 플랫폼 의존도가 높다. B2B 레인은 공개 이메일이 드물다. Wix/Squarespace 스튜디오는 컨택 폼이 기본이다.

이 패턴이 세션마다 `~/.claude/projects/.../memory/jdlab-lane-reachability.md`에 누적된다. 다음 세션이 같은 삽질을 반복하지 않도록.

## 220 목표와 현실 15개

매 세션 `target=220`이 설정됐다. 실제 검증된 공개 이메일을 가진 리드는 세션당 10-19개였다.

에이전트가 스스로 기록한 분석이다 — "120개 검증 이메일을 확보하려면 250회 이상의 성공적인 페이지 페치가 필요하고, 한 세션에서 정직한 품질을 유지하면서는 불가능하다."

이것은 파이프라인 실패가 아니다. 구조적 현실이다. 검색 결과 대부분이 Yelp, Google Maps, 예약 플랫폼으로 연결된다. 자체 도메인을 가진 사업체도 절반은 컨택 폼만 운영한다. 나머지 절반도 Cloudflare가 이메일을 자바스크립트로 동적 렌더링한다.

`not_found`는 정직한 결과다. 숫자를 채우기 위해 기준을 낮추지 않는 게 이 파이프라인의 전제다.

## 세션 8: 치과 광고 리서치 에이전트

같은 날 별도 세션에서 한국 의료·치과 광고 전략 리서치 에이전트가 실행됐다. 8분, 26 tool call. 목적은 다르다. 아웃리치 자동화가 아니라 지식 누적이다.

2026-06-05 이후 신규 고시가 없었다는 걸 확인했다. ADVoost Screen DOOH 공지(28168)에서 병의원 업종이 디지털 옥외광고 대상에서 명시적으로 제외된다는 것을 본문 레벨 재독으로 재확인했다. 이 결과가 `rolling-knowledge-base.md`, `source-index.md`, `competitive-serp-observations.md` 세 파일에 자동으로 누적됐다.

아웃리치와 리서치, 두 자동화가 같은 날 병렬로 돌아갔다.

## 기록이 쌓이는 방식

7개 세션 모두 동일한 메모리 파일을 공유하고 업데이트한다. `jdlab-lane-reachability.md`가 그것이다. 세션이 끝날 때마다 각 레인의 도달 가능성, WebFetch 차단 패턴, 이메일 노출 비율 같은 관측값이 추가된다.

다음 세션은 이 파일을 읽고 시작한다. 이전 세션이 막혔던 곳에서 시간을 낭비하지 않는다. 7개 세션이 서로 다른 시간에 실행되면서도 같은 방향으로 수렴하는 이유다.

이것이 Claude Code를 "어시스턴트"가 아니라 "워커"로 쓰는 패턴이다. 질문에 답하는 게 아니라, 매 시간 정해진 출력물을 만든다. 그리고 각 실행이 다음 실행을 조금씩 개선한다.
