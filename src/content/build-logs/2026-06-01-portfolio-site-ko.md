---
title: "Opus 4.8 하네스 감사 — 훅 9개 미등록, 5세션 87 tool calls로 정비"
project: "portfolio-site"
date: 2026-06-01
lang: ko
tags: [claude-code, opus-4-8, harness, hooks, omc, workflow]
description: "하루 5세션 87 tool calls. 훅 스크립트 9개가 실행권한도 위치도 맞는데 아무것도 실행 안 됐다. settings.json에 hooks 키 자체가 없었기 때문이다."
---

`~/.claude/hooks/`에 스크립트 9개가 있었다. 실행권한도 있고, 파일명도 맞고, 위치도 맞았다. 그런데 아무것도 실행되지 않았다.

**TL;DR** `settings.json`에 `hooks` 키가 아예 없었다. `harness-audit` 스킬로 `~/.claude/` 전체를 감사하고, 깨진 링크 정리 + 훅 등록 + `omc-dial.sh` 신규 생성까지 1시간 33분 세션에서 처리했다. Opus 4.8에 맞는 OMC 다이얼 구조도 재편했다.

## 하루 5세션, 뭘 했나

2026-06-01 하루치 세션을 정리하면 이렇다:

| 세션 | 소요 | tool calls | 내용 |
|---|---|---|---|
| 1 | 2분 | 16 | Hermes 대시보드 플러그인 탐색 |
| 2 | 1h 33min | 41 | `~/.claude/` 하네스 전체 감사 |
| 3 | 1분 | 13 | 치과 광고 리서치 산출물 생성 |
| 4 | 1분 | 15 | 데일리 브리프 + WebSearch 재검증 |
| 5 | 5분 | 2 | 이커머스 상품 리라이트 보고서 착수 |

총 87 tool calls. `Bash(44)`, `Read(22)`, `WebSearch(7)`, `Edit(5)`, `Agent(3)`, `Write(2)`, `Grep(1)`, `Skill(1)`.

## 세션 2: settings.json에 hooks가 없었다

`harness-audit` 스킬을 트리거한 프롬프트:

```
지금 적용되어 있는 도구들 확인해봐 구조 관련해서,
하네스, 스킬, md 훅 이런거 모두
```

인벤토리 수집을 병렬로 시작했다. `settings.json`의 훅 등록 상태를 확인하는 명령에서 첫 번째 오류가 났다.

```bash
cat ~/.claude/settings.json | jq '.enabledPlugins, (.hooks | keys)'
# 오류: null | keys
```

`null | keys`로 실패한 이유 — `hooks` 키가 아예 없었다. `~/.claude/hooks/` 안에 9개 스크립트가 있었지만, Claude Code 입장에서는 존재하지 않는 것과 같았다.

인벤토리 전체 현황:

| 범주 | 갯수 |
|---|---|
| 스킬 (소유) | 11 디렉토리 |
| 에이전트 YAML | 12개 |
| 훅 스크립트 | 9개 (전부 미등록) |
| 깨진 심볼릭 링크 | 발견 후 정리 |

깨진 링크 정리와 `settings.json` 수정을 동시에 진행했다.

## OMX 정체 파악

감사 중 `/Users/jidong/dentalad/.omx`가 나왔다. 탐색 순서는 이랬다.

1. `ls .omx` → `cache/`, `logs/`, `state/` — 런타임 상태 폴더
2. 실제 코드를 찾아 상위로 올라감
3. `AGENTS.md`(17KB)에서 정의 발견

OMX = **"Oh My Codex"** — Codex 실행용 계획/상태 프레임워크다. 상태 폴더는 미실행 상태라 비어 있었다. Bash를 10번 이상 실행하고 나서야 "이건 코드가 아니라 런타임 아티팩트다"라는 결론에 도달했다. 디렉토리만 봐서는 알 수 없는 케이스였다.

## Opus 4.8에 가장 효과적인 구조

세션 중에 여러 번 방향이 바뀌었다. 대화 흐름을 그대로 보면:

```
"내가 명시적으로 호출하는것보다 알아서 잘 호출되는게 좋아"
"4.8에 가장 효과적인 구조로 짜줘"
```

결론: Opus 4.8은 문맥 이해도가 높아서 복잡한 라우팅 레이어가 오히려 걸림돌이 된다. 훅이 많을수록 모델이 어떤 훅이 트리거됐는지 파악하는 데 초반 컨텍스트를 쓴다. 최적 구조는 **`CLAUDE.md` 명확화 + 최소 훅** 조합이다.

`omc-dial.sh`를 새로 만들어서 작업 복잡도를 자동 분류하는 로직을 붙였다. `~/.claude/workflow/lib/classify.sh`도 함께 수정했다.

변경된 파일:

- `~/.claude/CLAUDE.md`
- `~/.claude/hooks/omc-dial.sh` (신규)
- `~/.claude/settings.json`
- `~/.claude/workflow/lib/classify.sh`
- `~/.claude/plans/audit-2026-06-01.md` (신규)

## 세션 1: sidebar 슬롯이 없었다

Hermes 대시보드에 Mission Control 플러그인을 붙이는 작업. 16 tool calls, 2분.

탐색 순서: 공식 문서 → SDK 소스 → `achievements` 플러그인(설치된 레퍼런스) → `kanban` 플러그인(더 복잡한 레퍼런스). 대시보드는 포트 9119에서 실행 중이었고, 액티브 테마는 `default-large`.

끝에서 발견한 것: 이 버전의 대시보드 셸에는 `sidebar` 슬롯이 렌더링되지 않는다. 붙이려던 위치가 없었다. `tiled`/`standard` 레이아웃 차이를 확인하고 세션을 닫았다. 슬롯 이름을 `Grep`으로 먼저 검색했다면 문서 탐색 10번 분을 아꼈을 것이다.

## 세션 4: WebSearch로 당일 상태 재검증

치과 광고 리서치 세션(4)에서는 WebSearch를 7번 돌렸다. 이미 알고 있는 정보여도 날짜가 바뀌면 fresh 검색을 먼저 실행하는 패턴이었다. Kmong과 숨고가 새로운 채널로 확인됐다. 네이버 광고 정책 변경(31829 예산 한도 상향 D-3, 31822 톡톡 확장소재 병의원 제외)을 rolling KB에 반영했다.

## 도구 통계 분석

```
Bash   ████████████████████████████████████████████ 44
Read   ██████████████████████ 22
WebSearch ███████ 7
Edit   █████ 5
Agent  ███ 3
Write  ██ 2
Grep   █ 1
Skill  █ 1
```

Bash가 50%를 넘는다. 구조 파악, 상태 확인, 디렉토리 탐색이 주를 이뤘기 때문이다. 실제 코드 수정은 Edit 5번뿐이었다. 탐색 비용이 작업 비용보다 큰 전형적인 감사 세션이다.

## 정리

훅이 안 되는 문제를 디버깅할 때 파일 위치나 실행권한보다 `settings.json` 등록 여부를 먼저 확인하는 게 빠르다. 존재하는 파일이 등록되지 않으면 Claude Code 입장에서는 없는 것과 같다.

Opus 4.8 최적화의 핵심은 훅 수를 늘리는 게 아니라 `CLAUDE.md` 품질을 높이는 것이다. 모델이 이미 문맥을 잘 파악하므로, 라우팅 레이어는 단순할수록 좋다.
