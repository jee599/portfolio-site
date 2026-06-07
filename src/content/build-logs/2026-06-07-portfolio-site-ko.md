---
title: "Claude Code 자동화: 14세션 700+ tool call로 배운 이메일 발굴의 진실"
project: "portfolio-site"
date: 2026-06-07
lang: ko
tags: [claude-code, automation, outreach, local-commerce, claude-opus]
description: "하루 14세션, 700+ 도구 호출. Claude Opus로 글로벌 아웃리치 파이프라인 자동화. WebSearch는 이메일을 할루시네이트하고, 목표 220개 중 현실은 15개였다."
---

매 시간마다 자동 실행되는 Claude Opus가 전 세계 소상공인 사이트에서 이메일을 발굴하고, 맞춤 카피 진단 초안을 작성한다. 오늘 14세션, tool call 700회 이상을 돌리면서 하나의 진실이 드러났다 — WebSearch는 이메일 주소를 꾸며낸다.

**TL;DR** `/jdlab-daily-cron` 커맨드로 1시간마다 자동 실행되는 글로벌 아웃리치 파이프라인을 운용했다. 세션당 목표 220개 리드에서 실제 검증 가능한 공개 이메일은 15-20개가 현실 상한선이다. WebSearch 요약 모델이 이메일을 날조하는 문제를 세션 7에서 직접 확인했다.

## 파이프라인 구조

`/jdlab-daily-cron`이 트리거되면 Claude는 15개 레인에 걸쳐 공개 이메일을 가진 소규모 독립 사업체를 발굴한다. 레인은 `us_home_services`, `us_food_cafe`, `us_pet_services`, `uk_ie_local_services`, `shopify_dtc`, `woocommerce_independent` 등이다. 각 레인별로 `{items:[...]}` 형태의 JSON 파일을 생성하고, 검증된 리드만 최종 CSV와 Sheets 페이로드로 집계한다.

세션당 출력 구조:
- `outputs/outbound_runs/{date}/discovery_batches/{run_id}/` — 레인별 JSON 15개
- `data/exports/{run_id}.csv` — Gmail 빌더 입력
- `outputs/sheets_payloads/{run_id}.json` — Sheets 페이로드

downstream 빌더는 안전 게이트와 품질 게이트를 모두 통과한 항목만 선택한다. 잘못된 이메일 하나가 전체 런을 망친다는 전제 아래 설계됐다.

## 하루 7세션, 도구 사용 현황

오전에 집중된 아웃리치 세션 7개의 통계:

| 실행 시각 | 소요 시간 | tool call | WebFetch | WebSearch |
|---------|---------|-----------|----------|-----------|
| 00:49 | 31분 | 91 | 23 | 28 |
| 01:49 | 22분 | 71 | 33 | 15 |
| 02:49 | 40분 | 122 | 68 | 26 |
| 03:50 | 18분 | 76 | 30 | 22 |
| 04:50 | 19분 | 76 | 33 | 16 |
| 05:50 | 29분 | 90 | 44 | 20 |
| 06:50 | 18분 | 47 | 22 | 8 |

세션 3이 가장 길었다. 40분에 122번 호출, 그 중 WebFetch만 68번이다. 검색보다 검증에 두 배 이상의 도구 호출이 들어갔다.

## WebSearch는 이메일을 꾸며낸다

세션 7에서 가장 중요한 발견이 나왔다.

WebSearch의 요약 모델은 검색 결과를 요약하는 과정에서 존재하지 않는 이메일 주소와 도메인을 생성한다. 실제 사례: 검색 요약에서 `austinpettingsservices.com`이라는 도메인과 `info@walkatx.com`이라는 이메일이 나왔다. 실제 사업체 도메인은 `austinpetsittingservices.com`이었고, `walkatxpets.com`이 진짜 도메인이었다. LLM이 그럴듯한 문자열을 생성한 것이다.

이 파이프라인은 실제로 이메일을 자동 발송한다. WebSearch 요약을 믿고 기록했다면 잘못된 주소로 수십 건의 이메일이 나갔을 것이다. 이 발견 이후 모든 리드는 WebFetch로 실제 페이지를 방문해서 이메일을 직접 확인하는 방식으로만 처리한다.

## 검증 규율: 한 글자가 스팸이 된다

세션 1에서 실제로 일어난 일이다. Toyne이라는 사업체의 이메일이 검색 스니펫에서 `craig@`으로 나왔다. 실제 페이지를 방문했더니 `admin@`이었다. Hair Studio Day Spa는 스니펫에서 `hairstudiodaypa@gmail.com`, 실제와 한 글자 차이였다.

파이프라인 원칙: 검증되지 않은 이메일은 `not_found`로 정직하게 기록한다. 숫자를 채우기 위해 기준을 낮추지 않는다.

## WebFetch의 PII 리댁션

WebFetch도 완전한 해결책은 아니다. 세션 7에서 확인된 추가 제약: WebFetch가 대부분의 이메일 주소를 `[email protected]`으로 치환한다. 도구 레벨에서 PII를 리댁팅하는 것이다.

결국 교차 검증이 필요하다. 검색 스니펫에 이메일이 직접 노출된 경우와 페이지 방문 결과를 함께 보고, 두 신호가 일치할 때만 포함한다.

## 220 목표와 현실 15개

세션마다 `target=220`이었다. 실제 런마다 검증된 리드는 10-19개였다.

에이전트 실패가 아니다. 세션 3에서 에이전트가 스스로 기록한 것: "120개 검증된 공개 이메일에 도달하려면 250개 이상의 성공적인 페이지 페치가 필요하고, 한 세션에서 정직한 품질로는 불가능하다."

원인은 구조적이다. 검색 결과 대부분이 Yelp, Google Maps, 예약 플랫폼 같은 애그리게이터다. 자체 도메인 사업체도 절반 정도는 컨택 폼만 제공한다. 나머지 절반도 Cloudflare가 이메일을 자바스크립트로 동적 렌더링해 크롤러에 노출하지 않는다.

이 현실은 매 세션마다 `~/.claude/projects/.../memory/jdlab-lane-reachability.md`에 누적된다. 다음 세션이 같은 삽질을 반복하지 않으려면.

## 세션 8: 치과 광고 리서치 자동화

같은 날 별도 세션에서 의료·치과 광고 전략 리서치 에이전트도 실행됐다. 8분, 26번의 tool call. 네이버 광고 공지와 플레이스 랭킹 패턴을 `rolling-knowledge-base.md`, `source-index.md`, `competitive-serp-observations.md`에 자동 누적했다.

이번 확인 사항: 2026-06-05 이후 신규 고시 없음. ADVoost Screen DOOH 공지(28168)가 병의원 업종의 디지털 옥외광고 실행을 불가로 명시한 것을 본문 레벨 재독으로 재확인했다.

글로벌 아웃리치와 치과 광고 리서치, 서로 다른 두 자동화가 같은 날 병렬로 돌아갔다.

## 다음 단계

WebFetch 검증 병목이 여전하다. 세션당 22-68회의 WebFetch를 소모하면서 이메일 확보 성공률은 40-50%다. 레인 우선순위를 이메일 노출 가능성이 높은 순으로 재배열하거나, 검색 쿼리 패턴 개선으로 처리량을 올리는 게 다음 과제다.
