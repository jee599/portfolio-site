---
title: "Claude Code 28세션으로 글로벌 세일즈 파이프라인 완성 — 125개 실제 리드, 88개 이메일 초안 자동 생성"
project: "portfolio-site"
date: 2026-06-04
lang: ko
tags: [claude-code, automation, outreach, local-commerce-agent, gmail-api]
description: "Claude Code 28세션으로 글로벌 소규모 사업체 리드 125개를 실제 웹에서 수집하고 Gmail 초안 88개를 자동 생성했다. 에이전트 설계부터 dedupe 하드닝까지 하루 안에 완성한 AI 세일즈 파이프라인 구축 과정."
---

2026년 6월 4일 하루 동안 Claude Code 28개 세션을 돌렸다. 처음 질문은 단순했다: "미국 Amazon 상품 문구 최적화 서비스를 한국 1인 사업자가 어떻게 팔 수 있을까, 결제는 어떻게 받지?" 그 질문이 하루 만에 125개 실제 글로벌 소규모 사업체 리드 수집 → Gmail 초안 88개 자동 생성 → cross-run dedupe 시스템 구축으로 이어졌다.

**TL;DR** Claude Code를 실행자(executor)로, Hermes를 오케스트레이터(relay)로 분리한 이중 구조로 `local-commerce-agent` 파이프라인을 하루 안에 완성했다. 총 도구 호출 약 500회. 핵심 결과물: 스키마 검증 통과 125개 리드, 88개 개인화 이메일 초안, suppression 모듈, 59개 통과 테스트.

## 리서치 질문 하나에서 에이전트 설계로

첫 두 세션(각 16분, 총 34 tool calls)은 증거 수집이었다. Hermes가 브리프를 stdin으로 넘기면 Claude Code가 실행자로서 수행한다. Hermes는 relay일 뿐이고 작업 결정은 Claude가 한다. 이 구조가 하루 내내 반복됐다.

세션 1 결과물: `global_amazon_copy_payment_report.html`, `sources.json`, `summary.md`. 세션 2에서 같은 작업을 local evidence pack 기반으로 재실행했다. 웹 에이전트 대신 로컬 증거만 쓰는 속도 최적화다. 세션 3은 Codex가 요청한 변경사항 적용이었다 — Upwork 공식 페이지가 403으로 막혀 있는데 증거 없이 "확인됨"으로 표기한 게 blocking issue였다. Edit 9번, Read 5번으로 패치.

이 루프가 패턴이다: Claude 작업 → Codex 검토 → Claude 패치. Codex는 read-only reviewer로만 쓴다.

## 에이전트 설계: 스키마가 먼저다

세션 6(30 tool calls, 11분)에서 `jdlab-global-copy-outreach` 에이전트를 처음 만들었다. 핵심 설계 결정은 스키마 우선이었다. `jdlab_approval_queue_item.schema.json`을 먼저 정의하고, 그걸 검증하는 `validate-jdlab-queue.mjs`를 작성한 다음, 실제 데이터를 채웠다. 결과물: `.claude/agents/`, `.claude/commands/`, `data/schemas/`, `scripts/`, `test/` — 총 11개 파일 신규 생성.

세션 7에서 Codex가 `VERDICT: request-changes`를 반환했다. 세 가지 blocking issue가 있었다: `discovery_status`가 schema `required` 배열에 없음, free examples 최소 개수 미충족, unexpected property 검사 누락. Edit 10번, Read 5번, Bash 5번으로 픽스. 이렇게 하면 다음 번 에이전트가 잘못된 데이터를 생성해도 validator가 잡아낸다.

## 실제 리드 발굴: 4개 병렬 에이전트, 8개 채널

세션 8(39 tool calls, 16분)이 첫 번째 live pilot이었다. "illustrative examples"가 아닌 실제 웹 증거만 수집하는 제약을 걸었다. 4개 병렬 연구 에이전트를 동시에 디스패치했다. 각 에이전트는 채널을 분담했다: Shopify 스토어, US local 서비스, 숙박업, Yelp, B2B.

에이전트 11개 리드를 반환한 후 오케스트레이터가 직접 고위험 클레임을 재확인했다. 5개 공개 이메일 주소를 각 원본 페이지에서 `WebFetch`로 독립 재검증. 에이전트가 fabricate하지 않았음을 확인한 다음에야 artifacts를 작성했다.

이 검증 패턴이 중요하다. 에이전트 결과를 그대로 쓰는 게 아니라 오케스트레이터가 핵심 클레임을 독립적으로 재확인하고 나서 최종 파일을 생성한다.

세션 9(60 tool calls, 27분 — 오늘 최장 세션)에서 100+ 규모로 확장했다. 6개 연구 에이전트를 병렬 실행해 125개 항목, 89개 실제 공개 이메일을 수집했다. dedupe 이슈 하나 발생했다: Amazon/Etsy/Walmart/eBay가 전부 같은 도메인으로 키잉되어 marketplace 항목들이 중복 제거됐다. 즉시 URL full-path 기반 키로 교체. validator 0 errors로 통과.

## Gmail 초안 100개 자동 생성의 현실

세션 16(96 tool calls, 31분)이 오늘 가장 무거운 작업이었다. hooks v2로 기존 Gmail 초안을 전부 업데이트했다. 89개 발송 가능 리드, 각 리드마다 실제 웹 페이지에서 추출한 hero headline 인용 + 구체적 Before/After 수정 제안 + 개인화된 subject line.

`rewrite-jdlab-draft-hooks-v2.mjs` generator를 짜다가 gate failure가 두 번 났다. 첫 번째: 브랜드명이 대문자일 때 subject line에 ALL-CAPS로 새어나오는 것. 두 번째: hero "before" 문장이 길면 2번 echo되어 길이 초과. 두 케이스 모두 조건 분기 추가로 해결했다.

핵심 제약은 `users.drafts.update`만 사용, 절대 send 금지이다. 사용자 승인 없이는 발송하지 않는다.

## Suppression으로 중복 아웃리치 방지

세션 22-24(합산 약 80 tool calls)에서 cross-run dedupe를 구현했다. 문제는 단순했다: 내일 cron이 돌 때 오늘 이미 연락한 리드를 다시 포함하지 않으려면 어떻게 할까.

`jdlab-suppression.mjs` 모듈이 해답이다. URL과 이메일을 normalize(lowercase, www 제거, path 정규화)해서 history 파일들과 비교한다.

까다로웠던 부분이 있었다. `lca_30_candidate_shortlist.json`은 다른 프로젝트(LCA-* ID)인데 blanket "any queue_type" 룰로 잘못 포함될 뻔했다. 재현 테스트: 100개 항목이 전부 `run: 'unknown'`으로 suppression됐다. 원인은 discovery batch 파일들(run ID 없는 원본)을 history로 잘못 읽은 것이었다. 파일 경로 패턴 기반 exclusion list로 수정해 해결했다. 59개 테스트 통과.

## Hook 감사: 88개 이메일 품질 점검

세션 25(15 tool calls, 10분)에서 88개 이메일 본문을 audit했다. Bash로 feature-extraction digest를 생성해 패턴을 분석했다: opt-out 포함 여부, hook 구체성, 위험 클레임 탐지.

위험 단어 스캔에서 false positive가 나왔다. `ROAS`가 "roasted"를, `CTR`이 "electric"을 잡았다. 실제 `guarantee`/`#1` 히트는 수신자 자신의 기존 카피를 인용한 것이라 합법적이었다. 수동 확인 후 무시했다.

최종 분류: good 65개, ok(generic opener) 23개, weak 0, blocker 0. 전부 사용자 검토 후 발송 가능.

---

오늘 총 도구 사용 분포: Bash 약 120회, Read 약 70회, Edit 약 55회, Agent 약 15회. 리서치-검증-수정의 반복 구조가 tool call 패턴에 그대로 나온다.

스키마와 validator가 안전망이다. 에이전트가 뭘 만들든 validator를 통과해야 다음 단계로 간다. 이 패턴이 있으면 대규모 자동화도 신뢰할 수 있다.
