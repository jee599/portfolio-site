---
title: "Codex가 7번 BLOCK한 파이프라인: 시간당 100개 아웃리치 자동화 구축기"
project: "portfolio-site"
date: 2026-06-06
lang: ko
tags: [claude-code, automation, outreach, pipeline, codex-review, safety]
description: "15세션·614회 도구 호출로 JDLab 글로벌 아웃리치 자동화 구축. Codex 리뷰 7라운드, $4,495 차단 버그, Bash 게이트까지 실전 Claude Code 안전 파이프라인 기록."
---

실제 이메일이 나가는 자동화를 만들 때 버그 하나는 스팸 발송이다. 그래서 이 파이프라인을 완성하는 데 하루가 통째로 들었다.

**TL;DR** JDLab 글로벌 아웃리치 파이프라인을 구축했다. 매시간 100개 소규모 사업체를 발굴·검증·초안 작성하는 완전 자동화다. 15세션, 614회 도구 호출, Codex 리뷰 7라운드를 돌아서 완성했다.

## 파이프라인의 구조

목표는 하나다. 매시간 전 세계 소규모 사업체(Shopify 쇼핑몰, 식당, 지역 서비스업체) 100개를 발굴하고, 각각의 웹사이트에서 실제 카피 문제를 찾아내고, 첫 번째 이메일 초안을 쓰는 것이다.

8개 레인으로 나눈다. `shopify_selfhosted`, `us_google_local`, `yelp_local_service`, `tripadvisor_hospitality`, `linkedin_b2b`, `etsy_seller`, `amazon_seller`, `walmart_ebay`. 각 레인마다 서브에이전트 하나를 병렬로 띄우고, `build-jdlab-hourly-queue.mjs`가 결과를 합쳐 100개를 뽑는다.

이게 어려운 이유는 "실제 발송" 때문이다. Hermes 래퍼가 이 파이프라인이 만든 큐를 Gmail로 실제 발송한다. 검증되지 않은 이메일이 들어가면 실제 사람에게 스팸이 간다.

## dedup: 529개 키를 피하는 문제

파이프라인이 쌓일수록 재발굴이 쉬워진다. 이미 연락한 업체에 또 연락하면 스팸 신고다. 세션 4에서 dedupe 인덱스를 구축했을 때 이미 529개 URL 키, 464개 도메인, 383개 이메일이 소진된 상태였다.

`build-jdlab-run-dedupe-index.mjs`를 만들어서 `outputs/approval_queue/` 아래 모든 prior 큐를 스캔하고, 레인 서브에이전트가 참조할 제외 목록을 생성하도록 했다. 서브에이전트 8개가 병렬로 뜰 때 이 인덱스를 읽으면 발굴 단계에서부터 중복을 걸러낸다.

세션 4에서 처음 100개를 뽑았을 때 결과: pool 123개에서 역대 중복 2개 제거, 용량 초과 21개 보류, 최종 100개. `0 duplicates against history`.

## `$4,495`가 이메일 100개를 막은 사건

세션 7의 핵심 버그다.

검증기(`validate-jdlab-queue.mjs`)는 첫 번째 이메일 초안에 `$\d` 패턴이 있으면 하드-실패다. 가격을 초안에 넣으면 스팸 필터와 불신 둘 다 유발한다. 문제는 Claude가 발굴한 사업체 홈페이지에 "$4,495 투어", "$60 Voodoo Experience" 같은 가격이 있었고, 그걸 카피 진단에 그대로 인용한 것이다. 사업체 본인 가격이지만 검증기 입장에서는 이유 불문 블락이다.

```
ValidationError: draft contains $4,495 — hard fail on $ + digit in first-touch copy
items affected: 6
```

해결 방식: `build-jdlab-hourly-queue.mjs`에 사전 필터를 추가했다. 풀 로드 직후에 `$\d` 패턴이 있는 아이템을 `held_out` 파일로 분리하고, 안전한 아이템만 scoring/selection 단계에 넘긴다. 검증기의 패턴 감지 코드를 공유 함수로 추출해서 빌더와 검증기가 동일한 로직을 쓰도록 통일했다.

## Codex 리뷰 루프: 구현 → BLOCK → 수정의 반복

세션 2, 6, 7, 9, 12 — 전부 Codex가 `VERDICT: BLOCK`을 냈고, 다음 세션에서 Claude가 수정하는 사이클이다.

세션 9의 블로커 목록이 전형적이다.

1. **쉘 스크립트 lock 복구 레이스**: 빈 PID 파일로도 락이 제거되는 경로 존재
2. **같은 세션 내 URL/이메일 중복 허용**: cross-run dedup은 있는데 same-run이 없었다
3. **Gmail 초안 스크립트 `--allowlist` 없이 실행 가능한 경로**: 허점 있는 gate

각각 수정 후 `jdlab_draft_gate.test.js`와 `jdlab_wrapper_safety.test.js`를 함께 작성했다. Codex가 "BLOCK"을 냈을 때 실제로 의미 있는 버그였다. 구현이 빠르기 때문에 외부 리뷰어 시점이 오히려 더 중요해진다.

## 핵심 안전장치: Bash 없는 Claude

세션 12에서 가장 중요한 변경이 들어갔다.

Hermes cron에서 Claude를 비대화형으로 실행할 때, 잘못된 프롬프트나 외부 주입으로 셸 명령이 실행될 수 있다. `~/.claude/settings.json`에 `Bash(*)`가 있어도, 작업별 설정 파일과 플래그 조합으로 Bash 도구를 제거할 수 있다는 것을 실증했다.

프로브 테스트 두 단계: 세션 10에서 `PROBE_OK`만 반환하는 프롬프트를 날렸고 응답이 돌아왔다. 세션 11에서 `Bash` 사용을 요청했더니 `NO_BASH — Bash tool not available here`가 반환됐다. Bash `tool_use` 0건 확인. 이 두 세션이 하드닝 전후의 검증이다.

`capture_critical_hashes()` 함수를 래퍼에 추가해서 Claude 실행 전후로 핵심 파일의 해시를 비교한다. Claude가 수정하면 안 되는 파일이 바뀌면 cron이 중단된다.

## 발굴 품질: WebFetch로 직접 검증

세션 13-15에서 방향이 바뀐다. 이전까지는 WebSearch 결과로 추정했다면, 이후부터는 WebFetch로 실제 페이지를 열어서 이메일과 카피를 직접 확인한다.

세션 14에서 WebFetch를 36회 사용한 게 그 결과다. `[email protected]`처럼 의도적으로 숨긴 이메일은 `not_found` 처리, 페이지에서 직접 발견한 이메일만 `public_email`에 넣는다. "INMERSE" 같은 실제 오타, "email a picture" 같은 모호한 CTA를 직접 확인하고 진단 근거로 삼는다. 추정이 아니라 증거 기반이다.

세션 14 최종 sendable 리드: `browser_verified` 34개, `not_found` 66개. 34개만 실제 발송 큐에 들어간다.

## 도구 사용 통계

15세션, 614회 도구 호출:

- `Bash` 140회 — 검증 실행, 스크립트 테스트
- `Read` 103회 — 스키마, 큐 파일, 레퍼런스 확인
- `WebFetch` 94회 — 리드 직접 검증
- `Edit` 80회 — 파일 수정
- `Write` 57회 — 큐 JSON, 설정 파일 생성
- `WebSearch` 50회 — 후보 발굴
- `TaskUpdate` 40회, `TaskCreate` 24회

수정 파일 13개, 생성 파일 56개.

## 오늘 확인한 것들

검증 루프를 얼마나 타이트하게 가져가냐가 핵심이다. Codex 리뷰 7라운드는 과한 게 아니다. 실제 이메일이 나가는 자동화에서 블로커 하나를 놓치면 스팸 신고나 도메인 평판 훼손으로 직결된다. Claude가 빠르게 구현하는 만큼, 외부 시점의 리뷰도 빠르게 돌아야 균형이 맞는다.

공유 감지기 함수 하나로 빌더와 검증기를 통일하는 게 맞다. `$\d` 패턴을 두 군데에 따로 구현하면 한쪽만 업데이트됐을 때 구멍이 생긴다. 중복 구현은 유지보수 부채다.

dedup은 발굴 단계에서부터 해야 한다. 조립 단계에서 제거하면 서브에이전트 8개가 중복 작업을 한 것이다. 제외 인덱스를 미리 주면 발굴 결과 자체가 달라진다.
