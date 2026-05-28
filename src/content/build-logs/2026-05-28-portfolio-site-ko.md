---
title: "Claude Opus 하루 4세션 62 tool calls — AI 인텔·치과·매출 리포트 3종 자동화"
project: "portfolio-site"
date: 2026-05-28
lang: ko
tags: [claude-code, automation, research, claude-opus, hermes, orchestration]
description: "claude-opus-4-7 4개 세션, 62 tool calls로 SpoonAI 인텔 리포트·치과 광고 리서치·P1 매출 보고서를 하루에 완성. Hermes 릴레이 패턴과 Socratic Scope Gate가 어떻게 컨텍스트 낭비를 막는지 기록한다."
---

하루에 3개 도메인, 4개 세션, 62회 tool call. 그런데 생성된 파일은 단 1개다.

**TL;DR** claude-opus-4-7을 Hermes 릴레이 구조로 돌려 SpoonAI 인텔·치과 광고·매출 보고서를 하루 안에 처리했다. tool call 대부분은 Read/Bash — 쓰기 전 읽기가 전체의 절반 이상이다.

## 하루 4세션, 무슨 작업이 있었나

2026-05-28 기준 claude-opus-4-7이 처리한 세션은 네 개다.

**세션 1** — SpoonAI 새 사이트용 `2026-05-28-daily-intel-raw.json`을 받아 카드뉴스형 마크다운과 JSON으로 정리하는 작업이었다. 10번의 Bash 호출로 완료됐다. 파일 구조 확인, 전날 산출물 포맷 peek, 출력 디렉토리 검증이 모두 이 안에 들어 있었다.

**세션 2·3** — 치과 광고 리서치였다. SERP 샘플 15건(지역×진료 12건 + 위험표현 결합 2건 + 비용이벤트 결합 1건)을 분석해 누적 파일 5개를 업데이트했다. 흥미로운 점은 두 세션으로 쪼개졌다는 것이다. 첫 패스에서 `2026-05-28-daily-update.md`를 만들었지만 `rolling-knowledge-base.md`, `naver-ranking-hypotheses.md` 등 누적 파일 업데이트와 HTML 리포트가 빠졌다. Narrow Finish Pass로 나머지를 채웠다.

**세션 4** — P1 제품 4개(Dental AI, FortuneLab, SpoonAI, Shorts)의 통합 매출 보고서였다. `WebSearch` 4회로 당일 시장 신호를 가져와 HTML로 출력했다. 치과 SNS 사전심의 공황 같은 외부 이슈까지 리포트에 녹였다.

## Socratic Scope Gate — 진입 전 범위를 못 박는다

각 세션 프롬프트 앞에는 공통 구조가 붙어 있다.

```
1. Goal — 한 문장으로 목표 재진술
2. Scope — 건드릴 파일/디렉토리만 명시
3. Work to do — 실제 수행 단계
4. Non-scope — 하지 않을 것
5. 가정 — 막히지 않는 모호성 처리
```

이 구조가 없으면 모델이 scope를 스스로 추론하다 불필요한 파일까지 읽는다. Hermes 릴레이 경유 요청은 원래 프롬프트에서 컨텍스트가 유실되기 쉬운데, Scope Gate가 그 손실을 막는 완충재다.

치과 세션에서 효과가 드러났다. 첫 번째 패스가 5개 파일 중 1개만 완성하고 끝났을 때, 두 번째 프롬프트는 이미 완료된 파일을 건드리지 않았다. Non-scope 선언이 재작업을 차단했다.

## 세션을 쪼개는 패턴

세션 2와 3의 관계가 이 프로젝트의 전형적인 패턴이다. 큰 작업 하나를 한 세션에서 끝내려다 실패하고, 잔여 작업을 별도 세션으로 처리했다.

이런 분리가 생기는 이유는 명확하다. 첫 세션에서 컨텍스트가 쌓이면서 탐색·파악 비용이 올라가고, 산출물 작성 단계에 도달하기 전에 세션이 닫힌다. Narrow Finish Pass 패턴은 이 상황의 복구 전략이다 — 이미 완성된 것은 명시하고, 미완성 목록만 다음 세션에 넘긴다.

```
# 두 번째 세션 프롬프트 구조
The first artifact pass created 2026-05-28-daily-update.md
but did not finish cumulative files or HTML report.

## Scope
Only finish/update these existing required artifacts:
- rolling-knowledge-base.md
- source-index.md
- ...
```

이 구조가 없으면 두 번째 세션도 첫 번째와 같은 탐색부터 시작한다.

## tool call 분포가 말하는 것

| 도구 | 횟수 |
|------|------|
| Bash | 27 |
| Read | 24 |
| TaskCreate | 5 |
| WebSearch | 4 |
| Write | 1 |
| ToolSearch | 1 |

쓰기 1회, 읽기/확인 51회. Write 전에 입력 파일·기존 누적 파일·이전 산출물을 충분히 읽어야 일관된 스타일로 결과물을 낼 수 있다. 특히 치과 리서치처럼 주장마다 `공식/관찰/가설/수치미확인` 라벨을 붙여야 하는 경우, Read 단계를 건너뛰면 기존 문서와 형식이 어긋난다.

TaskCreate가 5회 나온 건 세션 4(P1 매출 보고서)에서 보고서 섹션을 단계별 태스크로 추적했기 때문이다. 세션 길이가 길어질수록 TaskCreate로 중간 체크포인트를 찍는 패턴이 유효했다.

## Hermes는 릴레이, Claude가 실행자

이 구조에서 Hermes는 프롬프트를 전달할 뿐이다. 디자인, 구현, 수정, 최종 검수는 Claude CLI가 담당한다.

언뜻 당연해 보이지만 실제 운영에서 경계가 흐려지기 쉽다. Hermes가 산출물 품질을 직접 판단하거나 파일을 수정하기 시작하면, 두 레이어가 같은 파일을 동시에 건드려 충돌이 생긴다. 오늘 세션에서는 프롬프트에 명시적으로 박았다.

```
너는 Claude CLI / Claude Code이며 실제 콘텐츠 인텔리전스 작성자다.
Hermes는 릴레이/오케스트레이터일 뿐이다.
```

이 한 줄이 모델의 역할 인식을 고정한다. 없으면 Hermes가 생성한 것처럼 응답이 돌아올 때가 있다.

## 오늘의 숫자

| 항목 | 값 |
|------|-----|
| 세션 수 | 4 |
| 총 tool calls | 62 |
| Bash | 27 |
| Read | 24 |
| Write | 1 |
| 생성 파일 | 1개 |
| 모델 | claude-opus-4-7 (전 세션) |

> Write 1번이 62번의 도구 사용을 대표한다. 읽기와 확인이 쓰기를 만든다.

---

*이 작업 로그는 Claude Code 세션 기록에서 자동 추출·생성된다.*
