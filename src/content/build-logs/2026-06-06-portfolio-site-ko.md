---
title: "무인 Claude Code cron 운용: 26 세션, 3중 안전 게이트 구축기"
project: "portfolio-site"
date: 2026-06-06
lang: ko
tags: [claude-code, automation, cron, safety, outreach-pipeline]
description: "Claude Code를 매시간 무인 cron으로 돌리면서 겪은 안전 경화 3라운드. Codex 블로커 수정, Bash 툴 격리, 검증된 이메일만 발송하는 파이프라인까지 26 세션의 실전 기록."
---

하루에 26 세션, 총 600+ tool calls. Claude Code를 단순 어시스턴트가 아니라 **매시간 혼자 돌아가는 cron worker**로 운용하면서 생긴 일들이다.

**TL;DR** 아웃리치 파이프라인을 Hermes 크론으로 자동화했고, 무인 모드 Claude에서 Bash 툴을 제거하는 경화 작업까지 총 3라운드를 거쳤다. 핵심은 "Claude가 실제로 이메일을 보낸다"는 전제 하에 모든 안전 장치를 설계한 것이다.


## 파이프라인 구조: 8개 레인, 100 리드/시간

JDLab 글로벌 아웃리치 파이프라인의 기본 구조는 간단하다. 8개 발굴 레인(`shopify_selfhosted`, `us_google_local`, `yelp_local_service`, `tripadvisor_hospitality`, `linkedin_b2b`, `amazon_seller`, `etsy_seller`, `walmart_ebay`)에서 각각 후보를 찾고, 중앙 빌더(`build-jdlab-hourly-queue.mjs`)가 병합·중복 제거·100개 캡을 처리한다.

Hermes가 이걸 매시간 `jdlab_hourly_100_approval_queue.sh`로 실행하고, Claude Code가 실제 발굴과 드래프트 작성을 담당한다. 문제는 **Claude가 실제로 real 이메일을 발송한다**는 점이다. 가짜 이메일을 넣거나 검증 없이 통과시키면 실제 사업체에 엉뚱한 메일이 간다.

이 전제가 안전 설계의 모든 것을 결정했다.


## 중복 제거 인덱스: 429개 URL 키에서 시작

세션 1에서 처음 중복 제거 인덱스를 만들 때, 이미 429개의 선행 URL 키, 390개의 도메인, 316개의 이메일이 쌓여 있었다. 세션 4에서는 529 URL / 464 도메인 / 383 이메일로 늘어났다.

```
dedupe_against_existing=true
```

이 플래그 하나가 실제로 하는 일은, 모든 기존 `outputs/approval_queue/` 파일을 스캔해 정규화된 URL 키와 이메일 키를 뽑아내고, 새 발굴 결과와 교차 검증하는 것이다. 세션 4에서 123개 풀에서 2개의 역사적 URL 중복, 21개의 용량 초과를 제거해 정확히 100개를 만들었다.

`build-jdlab-run-dedupe-index.mjs`를 별도로 뽑아낸 이유가 여기 있다. 각 레인 서브에이전트가 독립적으로 발굴하면서 서로 충돌하지 않으려면, 공유 회피 목록이 미리 준비되어 있어야 한다.


## Codex 리뷰 3라운드: 블로커마다 설계 결정이 숨어 있었다

가장 흥미로운 부분이다. Codex 리뷰가 `VERDICT: BLOCK`을 반환할 때마다 단순한 버그가 아니라 설계 결정이 드러났다.

**1라운드 (세션 2)**: 락 파일 복구 레이스, cron PATH 문제, 같은 run 내 URL/이메일 중복. `~/.claude/settings.json`에 `Bash(*)`가 허용된 전역 설정이 있어도, cron 환경에서는 PATH가 다르게 잡힌다는 걸 놓쳤다. `jdlab_hourly_100_approval_queue.sh`, `validate-jdlab-queue.mjs`, 테스트 파일 3개를 수정했다. 총 Edit 12회, Bash 11회.

**2라운드 (세션 6, 7)**: 검증기가 첫 터치 카피에서 `$\d` 패턴을 하드-실패시키는 규칙이 있는데, 발굴된 사업체들이 자기 사이트에 가격을 적어둔다. "Starting at $4,495"가 있는 투어 회사를 발굴하면, 그 문장이 진단 내용으로 드래프트에 들어가고, 검증기가 큐 전체를 거부한다.

해결은 두 단계였다. 먼저 검증기에서 내용 체크 로직을 공유 `detectHardFail()` 함수로 추출하고, 빌더에서 풀 로드 직후 하드-실패 후보를 걸러내는 사전 필터를 추가했다. 100개 큐를 만들기 전에 안전한 풀만 남기고 거기서 고르는 방식이다.

**3라운드 (세션 12)**: Codex가 요구한 것: 무인 Claude가 cron에서 실행될 때 Bash 툴이 실제로 없는지 경험적으로 증명하라는 것이었다.

```bash
claude --tools "" --no-settings-source user ...
```

이 플래그 조합으로 Claude를 실행하고, 내부에서 "Use the Bash tool to run: echo TAMPER_TEST"라고 프롬프트를 보내봤다. 응답이 `NO_BASH — Bash tool not available here.`였다. `~/.claude/settings.json`에 `Bash(*)`가 있어도 `--tools ""`가 오버라이드한다는 걸 실험적으로 확인했다.

이후 cron 래퍼에 `--tools ""` 플래그를 추가하고, Claude 종료 직후 중요 파일들의 해시를 캡처해 무결성을 검증하는 로직을 붙였다. Bash 12회, Edit 5회.


## 실제 발굴: WebFetch로 모든 이메일을 온페이지에서 확인한다

세션 13, 14, 15에서 실제 발굴 방식을 볼 수 있다. 서치 결과에서 후보가 나오면, 반드시 `WebFetch`로 해당 페이지를 직접 불러와 온페이지 이메일과 실제 카피 문제를 확인한다.

- 세션 13: WebFetch 30회, WebSearch 19회 → 16개 sendable + 13개 no-email
- 세션 14: WebFetch 36회, WebSearch 19회
- 세션 15: WebFetch 20회, WebSearch 12회

중요한 원칙이 하나 있다. 페이지가 401이나 403으로 막히면 해당 리드를 `browser_verified` 대신 `live_unverified`로 표시한다. 페이지를 볼 수 없으면 카피 문제를 그라운드할 수 없기 때문이다. 검색 요약에서 이메일이 추출됐더라도, WebFetch로 온페이지에서 직접 확인하지 못하면 `not_found`로 처리한다.

세션 15에서 버클리 크리크 B&B 홈페이지에서 직접 "INMERSE"라는 타이포를 발견한 게 좋은 예다. 서치 결과에는 보이지 않는다. 실제 페이지를 불러와야 보인다.


## 검증기 vs 드래프트 게이트: 두 계층으로 분리한 이유

`validate-jdlab-queue.mjs`와 `create-gmail-drafts-from-jdlab-queue.py`가 각각 별도로 안전 게이트를 갖고 있다. 중복처럼 보이지만 역할이 다르다.

검증기는 큐 파일 자체의 구조와 내용을 검사한다. 드래프트 게이트는 Gmail API를 호출하기 직전에 실행되는 마지막 방어선이다. `--allow-lead-ids-file` 없이 드래프트 스크립트를 실행하면 실패한다. 세션 9에서 `--only-lead-id` 플래그를 추가해 단일 리드 수동 오버라이드도 막았다.

`jdlab_gmail_reply_reconcile.py`가 드래프트 스크립트를 모듈로 임포트한다는 것도 확인했다. `load_credentials`와 HTTP 유틸만 재사용하고 `main()`은 절대 호출하지 않는다. 그래서 allowlist를 필수로 만들어도 Reply 플로우가 깨지지 않는다.


## 도구 사용 통계

주요 세션 합산: Bash 130회+, Edit 90회+, WebFetch 100회+, WebSearch 60회+, Read 80회+, Agent 18회+. Claude Code가 단순 에디터가 아니라 실제 발굴 워커로 동작하는 패턴이 수치에 그대로 드러난다.

다음 작업은 8개 레인을 15개 이상으로 확장하고, 검색 전략을 회전/무작위화하는 것이다. 현재 파이프라인이 시간당 발송 가능한 리드를 10~17개밖에 못 찾는 이유가 레인 반복에 있다는 진단이 세션 19에서 나왔다.
