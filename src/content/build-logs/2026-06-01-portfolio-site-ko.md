---
title: "Opus 4.8 하네스 감사 — 훅 9개 미등록, 하루 만에 구조 정비"
project: "portfolio-site"
date: 2026-06-01
lang: ko
tags: [claude-code, harness, opus-4-8, hooks, omc]
description: "~/.claude/ 전체 감사 결과, 9개 훅 스크립트가 settings.json에 한 개도 등록 안 돼 있었다. omc-dial.sh 신규 생성, OMX 구조 분석, Opus 4.8 최적 워크플로 재설계까지 1h 33min 세션 기록."
---

`settings.json`에 `hooks` 키가 아예 없었다. 훅 스크립트 9개가 `~/.claude/hooks/`에 있었지만 Claude Code에 등록된 건 하나도 없었다는 뜻이다.

**TL;DR** `harness-audit` 스킬로 전체 상태를 점검했고, 깨진 링크 제거 + 훅 등록 누락 수정 + `omc-dial.sh` 신규 생성으로 하네스를 정비했다. Opus 4.8에 맞는 구조도 재설계했다.

## 하네스 감사 — 발견된 문제들

세션 2에서 `harness-audit` 스킬을 실행했다. 목적은 `~/.claude/` 전체 상태 파악 — 스킬, 훅, 에이전트, 플러그인, 메모리 인벤토리와 건강도 체크.

인벤토리 결과:

| 범주 | 갯수 |
|---|---|
| Skills (소유) | 11 dir |
| Agents (YAML) | 12개 |
| Hooks (스크립트) | 9개 |

문제는 건강도 체크에서 나왔다. `settings.json`의 `hooks` 키를 확인하려고 `jq '.enabledPlugins, (.hooks | keys)'`를 돌렸는데 `null | keys`로 실패. `hooks` 키 자체가 없었다. 9개 스크립트가 파일시스템에 존재하지만 Claude Code는 그걸 모르는 상태였다.

깨진 심볼릭 링크도 발견됐다. `find ~/.claude -type l ! -exec test -e {} \; -print`로 정리하고, tmp 잔여물도 함께 청소했다.

## OMX가 뭔지 파악하는 과정

감사 중에 `/Users/jidong/dentalad/.omx`가 나왔다. 처음엔 별도 도구라고 생각했는데 파고들어 보니 **런타임 상태 폴더**였다 — cache, logs, state만 있고 코드는 없었다.

실제 정의는 `AGENTS.md`(17KB)와 프로젝트 `CLAUDE.md`에 있었다. OMX = **"Oh My Codex"** — Codex 실행용 계획/상태 프레임워크다. 상태 폴더는 미실행 상태라 비어 있었다.

이 탐색 과정에서 Bash를 25번 실행했다. 디렉토리를 따라가다가 빈 폴더를 발견하고, README를 읽고, 다시 상위로 올라가는 패턴 반복이었다.

## Opus 4.8에 맞는 구조 재설계

사용자가 "명시적으로 호출하지 않아도 알아서 잘 작동하는" 구조를 원했다. 세션에서 이런 질문들이 나왔다:

```
"opus 4.8은 하네스를 적용하는게 효과적이야? 아니면 어떻게 효과적인거야?"
"4.8에 가장 효과적인 구조로 짜줘"
```

결론은 단순했다. Opus 4.8은 문맥 파악 능력이 높아서 명시적 지시보다 **컨텍스트 최적화**가 더 효과적이다. `~/.claude/CLAUDE.md`를 수정해서 전역 라우팅 로직을 명확히 했고, `omc-dial.sh` 훅을 새로 만들어서 작업 복잡도에 따라 자동으로 OMC 설정이 조정되도록 했다.

변경된 파일:

- `~/.claude/CLAUDE.md` — 전역 라우팅 정책 업데이트
- `~/.claude/hooks/omc-dial.sh` — 신규 생성 (복잡도 다이얼)
- `~/.claude/settings.json` — 훅 등록 추가
- `~/.claude/workflow/lib/classify.sh` — 분류 로직 수정

## 세션 1: Hermes 대시보드 확장

같은 날 짧은 세션(2분, 16 tool calls)이 하나 더 있었다. Hermes 대시보드에 Mission Control 확장을 추가하는 작업이었다.

작업 흐름은 공식 SDK 문서 → 실제 환경 탐색 → 기존 플러그인(achievements, kanban)을 레퍼런스로 확인하는 순서였다. 대시보드가 포트 9119에서 실행 중이었고, 액티브 테마는 `default-large`. 마지막에 `sidebar` 슬롯이 이 버전에서 렌더링되지 않는다는 걸 발견하고 세션이 끝났다.

## 세션 3: 의료 광고 리서치 자동화

세션 3(8 tool calls)는 `/dentalad/research/daily-medical-dental-ads/` 아래 6개 파일을 생성하는 작업이었다. daily update, rolling KB, source index, SERP 관찰, 네이버 랭킹 가설, HTML 보고서. SERP 수집 데이터를 바탕으로 작성했다.

## 도구 사용 통계

3개 세션 합산:

| 도구 | 횟수 |
|---|---|
| Bash | 38 |
| Read | 14 |
| Edit | 5 |
| Agent | 3 |
| Write | 2 |
| Grep | 1 |
| **합계** | **65** |

Bash 비중이 58%다. 구조 파악과 상태 확인 작업이 대부분이었기 때문이다. 코드 수정은 Edit 5번에 불과했다.

## 정리

`harness-audit`이 실제로 유용했다. 훅 9개가 등록 안 돼 있었다는 사실은 직접 확인하지 않으면 몰랐을 문제다. OMX도 코드를 보기 전까진 뭔지 불분명했다.

Opus 4.8 최적화의 핵심은 더 많은 훅이 아니라 **컨텍스트 품질**이다. `CLAUDE.md`를 명확하게 유지하고, 라우팅 로직을 단순하게 가져가는 게 오히려 모델이 잘 작동하는 조건이다.
