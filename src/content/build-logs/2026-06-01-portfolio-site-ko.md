---
title: "Claude Opus 4로 7세션 231회 도구 호출 — AI 수익 리포트부터 하네스 감사까지"
project: "portfolio-site"
date: 2026-06-01
lang: ko
tags: [claude-code, claude-opus-4, research, automation, harness]
description: "하루 7세션, 총 231회 도구 호출. Opus 4가 37분 만에 글로벌 AI 플랫폼 40개 수수료를 라이브 검색으로 검증하고, 9개 훅이 settings.json에 미등록된 사실을 스스로 발견했다."
---

하루 7개 세션에서 도구 호출이 231회 발생했다. 그중 37분짜리 세션 하나에서만 158회가 집중됐다.

**TL;DR** `WebSearch` 40회, `WebFetch` 22회, `Bash` 60회로 글로벌 AI 플랫폼 40여 개의 수수료·지급·한국 자격 정보를 라이브 검증해 리포트 5개 파일을 생성했다. 이후 하네스 감사에서 9개 훅 스크립트가 `settings.json`에 등록조차 안 돼 있던 게 드러났다.

## 오버로드 에러, 그런데 실제로는 작동 중이었다

세션 5는 `/Users/jidong/ai-10-dollar-june/brief_global_ai_10_research.md`를 읽고 25개 플랫폼의 공식 수수료·지급 정책을 라이브로 검증하는 작업이었다. 브리프를 읽은 직후 Opus 4는 이렇게 판단했다.

> "플랫폼 수가 많으니 레인별 병렬 에이전트로 분산하겠다."

`Agent` 5개를 띄우고 `WebSearch`를 배치로 쏘기 시작했는데, 중간에 `API Error: Overloaded`가 떴다. 실패로 보였지만 실제 도구 결과는 다 도착해 있었다. 릴레이 버퍼링 문제였다. Opus 4가 로그에 남긴 내용:

> "WebSearch, WebFetch, curl 모두 실제로 작동했다 — 이전 응답이 비어 보인 건 릴레이 버퍼링 때문이었다."

이후 `WebSearch` 30회 추가 검색으로 사실을 보정했다. Etsy가 한국에서 Payoneer로 수령 가능하다는 사실, Upwork 수수료가 고정 20%에서 변동 0~15%로 바뀐 것, Ko-fi 쇼핑 판매 수수료가 0%가 아니라 5%라는 것 등 초안에 틀린 정보가 여럿 있었다. 그게 전부 교정됐다.

37분, 158회 호출. 최종 산출물은 다섯 파일이었다.

- `global_ai_10_revenue_report.md` — 한국어 상세 보고서 (27,872 bytes)
- `global_ai_10_revenue_report.html` — 시각화 포함 HTML
- `method_ledger_seed.json` — 수수료 구조 정형 데이터
- `sources.json` — 검증 소스 인덱스
- `_progress.md` — 세션 중간 경과 기록

## "읽기 어렵다" → 7분 만에 executor-first 리라이트

리포트가 완성된 직후 사용자 피드백이 왔다.

> "이전 리포트는 읽기 어렵고 내가 실제로 할 수 있는 게 뭔지 정리가 안 돼."

세션 6에서 기존 파일 4개를 전부 읽고 `global_ai_10_action_report.md`와 `global_ai_10_action_report.html`을 새로 썼다. 7분, 8회 호출. `Read` 6회로 기존 내용을 전부 흡수하고 `Write` 2회로 마무리했다. 구조를 플랫폼별 목록에서 **실행 가능한 액션 카드** 중심으로 바꿨다.

Before/After가 명확한 세션이었다. 같은 검증된 데이터로 독자 목적에 맞게 재편집하는 데 7분이면 충분하다는 것도 확인됐다.

## 9개 훅이 등록조차 안 돼 있었다

세션 7은 `~/.claude/` 하네스 전체 감사였다. `harness-audit` 스킬을 먼저 실행하고, 이후 직접 `Bash` 21회로 파일시스템을 뜯었다.

첫 번째 이상 징후: `settings.json`에서 `jq '.hooks | keys'`가 실패했다. `hooks` 키 자체가 없었다.

```bash
cat ~/.claude/settings.json | jq '.enabledPlugins, (.hooks | keys)'
# null | keys → 파싱 에러
```

실제 `~/.claude/hooks/` 폴더에는 스크립트 9개가 있었다. 실행권한도 있었다. 그런데 `settings.json`에는 등록이 안 돼 있었다. 즉 9개 훅이 파일로는 존재하지만 실제로는 한 번도 트리거된 적이 없는 상태였다.

추가로 OMX(`Oh My Codex`)의 위치도 파악했다. `/Users/jidong/dentalad/.omx`는 실행 상태 폴더였고 비어 있었다. 실제 정의는 `AGENTS.md`와 프로젝트 `CLAUDE.md`에 있었다.

감사 결과는 `.claude/plans/audit-2026-06-01.md`에 저장했다.

## 패턴 메모

이날 7세션을 돌아보면 몇 가지 패턴이 반복됐다.

병렬 에이전트는 독립적인 검증 작업에서 실속이 있었다. 플랫폼 25개를 레인별로 나눠 동시에 조회하면 순차보다 빠르다. 단, 결과가 릴레이 버퍼에서 지연될 수 있으므로 에러 메시지만 보고 실패로 판단하면 안 된다.

리라이트는 검증보다 싸다. 세션 5에서 37분 쓴 검증 결과물을, 세션 6에서 7분 만에 독자에 맞게 재편집했다. 사실 검증 비용이 크고 편집 비용은 작다.

구조 감사는 주기적으로 필요하다. 파일이 있다고 기능이 작동하는 게 아니다. 등록 여부를 직접 확인해야 한다.

---

도구 사용 요약: `Bash` 94회, `Read` 40회, `WebSearch` 40회, `WebFetch` 22회, `Write` 15회, `Edit` 3회. 생성 파일 9개, 수정 파일 2개.
