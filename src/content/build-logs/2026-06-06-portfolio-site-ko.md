---
title: "8레인이 시간당 17개밖에 못 찾은 이유 — Claude Code로 아웃리치 파이프라인 재설계"
project: "portfolio-site"
date: 2026-06-06
lang: ko
tags: [claude-code, automation, cron, safety, outreach-pipeline, codex-review]
description: "Claude Code Opus 4.8로 글로벌 소상공인 아웃리치 자동화. Codex 5라운드 블로커를 넘으며 3중 안전 게이트를 쌓고, 8레인→15레인으로 재설계한 32세션 기록."
---

하루 32세션. Codex가 `VERDICT: BLOCK`을 5번 찍었다. 매번 고쳤고, 매번 또 다른 문제가 나왔다. 결국 무인 cron에서 Claude Code가 Bash 없이 혼자 이메일을 발굴하고 드래프트를 쓰는 파이프라인이 나왔다.

**TL;DR** 글로벌 소상공인 아웃리치 파이프라인을 매시간 자동 실행되는 cron으로 운용하면서, Codex 리뷰 5라운드를 거쳐 안전 게이트를 쌓았다. 마지막엔 8레인 구조가 시간당 10~17개밖에 발굴 못 하는 근본 원인을 찾아 15레인 이상으로 재설계했다.

## 파이프라인의 전제: Claude가 실제로 이메일을 보낸다

구조는 단순하다. 8개 발굴 레인(`shopify_selfhosted`, `us_google_local`, `yelp_local_service`, `tripadvisor_hospitality`, `linkedin_b2b`, `amazon_seller`, `etsy_seller`, `walmart_ebay`)에서 후보를 찾고, `build-jdlab-hourly-queue.mjs`가 병합·중복 제거·100개 캡을 처리한다. Hermes가 `jdlab_hourly_100_approval_queue.sh`로 매시간 실행하고, Claude Code가 발굴과 드래프트를 담당한다.

이 파이프라인을 설계하는 모든 결정의 기준은 하나였다. **Claude가 실제로 real 이메일을 발송한다.** 가짜 이메일, 검증 없는 주소, 날조된 카피 진단이 들어가면 실제 사업체에 엉뚱한 메일이 간다.

이 전제가 Codex 블로커 5라운드를 각각 다른 방향에서 촉발했다.

## 중복 제거 인덱스: 529개 URL 키

세션 1에서 첫 실행 시 이미 선행 큐가 429개의 URL 키, 390개의 도메인, 316개의 이메일을 쌓아뒀다. 세션 4에서는 529 URL / 464 도메인 / 383 이메일로 늘었다.

`dedupe_against_existing=true` 플래그는 기존 `outputs/approval_queue/` 전체를 스캔해 정규화된 키를 추출하고 새 발굴과 교차 검증한다. 세션 4에서 123개 풀에서 2개의 역사적 URL 중복과 21개의 초과분을 제거해 정확히 100개를 만들었다.

`build-jdlab-run-dedupe-index.mjs`를 별도 스크립트로 추출한 이유가 여기 있다. 8개 레인 서브에이전트가 병렬로 발굴할 때 서로 충돌하지 않으려면, 공유 회피 목록이 실행 전에 미리 준비되어 있어야 한다.

## Codex 5라운드: 블로커마다 설계 결정이 달랐다

**1라운드 (세션 2)**: 락 파일 복구 레이스 컨디션, cron 환경 PATH 누락, 같은 run 내 URL/이메일 중복. `~/.claude/settings.json`에 `Bash(*)`가 있어도 cron 환경에서는 PATH가 다르게 잡힌다. `jdlab_hourly_100_approval_queue.sh`, `validate-jdlab-queue.mjs`, 테스트 3개를 수정했다. Edit 12회, Bash 11회.

**2라운드 (세션 6)**: 검증기가 첫 터치 카피에서 `$\d` 패턴을 하드-실패시키는 규칙이 있다. 그런데 사업체들은 자기 사이트에 가격을 쓴다. "Starting at $4,495" 투어 회사를 발굴하면 그 문장이 진단 내용으로 드래프트에 들어가고, 검증기가 큐 전체를 거부한다. 일반 결제 언어 패턴을 추가하고 테스트를 붙였다.

**3라운드 (세션 7)**: 2라운드 픽스가 원인을 해결하지 않고 패턴만 막았다는 블로커. 검증기에서 내용 체크 로직을 `detectHardFail()` 함수로 추출하고, 빌더에서 풀 로드 직후 하드-실패 후보를 사전 필터링하는 로직을 추가했다. 100개를 고르기 전에 안전한 풀만 남기는 방식이다.

**4라운드 (세션 9)**: Gmail 드래프트 스크립트에 `--allow-lead-ids-file` 없이 실행 가능한 경로가 남아있었다. `--only-lead-id` 수동 오버라이드도 차단이 안 됐다. Python 드래프트 스크립트의 게이트를 강화하고 래퍼 프롬프트 안에 JSON 쓰기 지침을 명시했다. Edit 12회, Read 11회.

**5라운드 (세션 12)**: Codex가 요구한 것: 무인 Claude가 cron에서 실행될 때 Bash 툴이 실제로 없다는 걸 경험적으로 증명하라는 것이었다.

```bash
claude --tools "" --no-settings-source user ...
```

이 플래그 조합으로 Claude를 실행하고, 내부에서 "Use the Bash tool to run: echo TAMPER_TEST"를 프롬프트로 보냈다. 응답이 돌아왔다.

```
NO_BASH — Bash tool not available here.
```

`~/.claude/settings.json`에 `Bash(*)`가 있어도 `--tools ""`가 오버라이드한다는 걸 실험적으로 확인했다. 이후 cron 래퍼에 플래그를 추가하고, Claude 종료 직후 중요 파일들의 해시를 캡처해 무결성을 검증하는 로직을 붙였다.

5라운드를 통해 나온 안전 레이어는 세 겹이다. 검증기(`validate-jdlab-queue.mjs`) → 드래프트 게이트(`create-gmail-drafts-from-jdlab-queue.py`의 allowlist 강제) → cron 래퍼의 Bash 격리 + 해시 무결성 검증.

## 실제 발굴: 모든 이메일은 페이지에서 직접 확인한다

세션 13·14·15에서 실제 발굴 세션의 tool call 분포가 드러난다.

- 세션 13: WebFetch 30회, WebSearch 19회 → 16개 sendable + 13개 no-email
- 세션 14: WebFetch 36회, WebSearch 19회
- 세션 15: WebFetch 20회, WebSearch 12회

서치 결과에서 후보가 나오면 반드시 `WebFetch`로 해당 페이지를 불러와 온페이지 이메일과 실제 카피 문제를 확인한다. 페이지가 401/403으로 막히면 `browser_verified` 대신 `live_unverified`로 표시한다. 검색 요약에서 이메일이 추출됐더라도, WebFetch로 온페이지에서 직접 확인하지 못하면 `not_found`다.

세션 15에서 버클리 크리크 B&B 홈페이지에서 직접 "INMERSE"라는 타이포를 발견한 것이 이 방식의 전형적인 결과다. 서치 결과에는 나타나지 않는다. 실제 페이지를 불러와야 보인다.

레인별로 WebFetch 가능 여부에도 차이가 있다는 걸 세션 15에서 메모리로 기록했다. Shopify/자체호스팅 사이트와 로컬 비즈니스는 대부분 WebFetch로 열리지만, Amazon/Etsy 마켓플레이스 레인은 대부분 차단된다. 이 특성이 8레인의 효율 문제와 직결된다.

## 8레인이 시간당 17개밖에 못 찾은 이유

세션 19는 이 날의 전환점이다. 파이프라인이 시간당 100개 목표에 맞게 큐를 만들지만, 실제로 공개 이메일이 확인된 `sendable` 리드는 10~17개밖에 안 된다는 문제가 진단됐다.

원인은 두 가지였다.

첫째, 8개 레인 중 Amazon/Etsy/Walmart_eBay 3개는 마켓플레이스 레인이라 이메일 자체가 없다. 이 레인들이 큐의 30~40%를 차지하면서 sendable 비율을 떨어뜨린다.

둘째, 레인별 WebSearch 쿼리가 회전되지 않았다. 매 시간 같은 쿼리로 같은 결과를 탐색한다. 529개 URL 키로 늘어난 히스토리 중복과 맞물려, 사실상 매 시간 같은 좁은 공간을 다시 뒤지는 구조였다.

해결 방향: 15개 이상의 레인으로 확장하고, 레인별 쿼리를 회전·무작위화한다. 마켓플레이스 레인은 이메일 발굴 목표가 아닌 카피 진단 샘플 레인으로 역할을 재정의한다.

세션 19에서 기존 구조를 전부 읽고 계획을 세우는 것까지 나왔다. Bash 파일 읽기, 검증기와 테스트 파악에 총 5개 파일을 순차로 읽으면서 기존 레인 패턴과 전환 로직을 파악했다.

## 사이드로 돌린 두 cron

세션 16에서 한국 의료·치과 광고 최신 전략 리서치 cron이 실행됐다. 오늘 새로운 공식 공지 두 건이 나왔다. `32028` 동물병원 플레이스광고 업종 개편 (2026-06-11 적용), `28168` ADVoost Screen DOOH 엘리베이터 미디어 추가. 두 건 모두 실제 공식 페이지를 WebFetch로 확인한 뒤 리포트에 반영했다. Bash 21회, Read 6회, Write 2회.

세션 17·18은 "AI로 하루 $10 버는 방법" 일일 리포트 생성이었다. 세션 17에서 리포트를 만들고, 세션 18에서 Codex 리뷰에서 올라온 `카카오페이` 미지원 참조를 `계좌/Toss 직접송금`으로 교체했다. Bash 8회, Edit 3회, 총 14 tool calls.

두 프로젝트 모두 cron 형태로 자동 실행되는 패턴이다. Claude Code를 "질문에 답하는 어시스턴트"가 아니라 "정해진 시간에 정해진 아웃풋을 뽑는 워커"로 쓰는 것이 이 날의 일관된 패턴이었다.

## 도구 사용 통계

32세션, 600+ tool call. 주요 세션 합산: Bash 130회+, Edit 90회+, WebFetch 90회+, WebSearch 60회+, Read 80회+, Agent 16회+.

Edit이 많은 세션(2, 5, 6, 7, 9)은 Codex 블로커 픽스 세션이다. WebFetch/WebSearch가 많은 세션(13, 14, 15)은 실제 발굴 세션이다. 발굴 세션에서 Edit이 거의 없는 게 인상적이다. 탐색과 구현이 세션 단위로 분리된다.

Codex 리뷰 루프가 유용한 이유는 구현 당시 보이지 않는 경계 조건을 잡기 때문이다. 5라운드 블로커 중 가장 중요한 것은 3라운드(사전 필터링)였다. 검증기가 거부하는 패턴이 발굴 단계 후에야 드러나는 구조적 문제를 잡아냈다. 구현 당시엔 "검증기가 통과시키면 된다"고 생각했는데, Codex는 "발굴 단계에서 이미 걸러야 한다"고 봤다.
