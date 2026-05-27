---
title: "Claude Code 6세션 127 tool calls: Hermes 릴레이로 3개 프로젝트 하루 자동화"
project: "portfolio-site"
date: 2026-05-27
lang: ko
tags: [claude-code, automation, hermes, orchestration, build-log]
description: "Hermes가 하루 6세션으로 SpoonAI 뉴스 인텔리전스, 치과 광고 SERP 리서치, HTML 보고서 생성 3개 프로젝트를 오케스트레이션했다. 치과 리서치는 3세션에 Write 0번 — 프롬프트 한 줄로 해결됐다."
---

하루 6세션, tool call 127번. 코드는 한 줄도 바꾸지 않았다. SpoonAI 콘텐츠 인텔리전스 수집, 한국 치과 광고 규제 리서치, Hermes 에이전트 HTML 보고서 생성 — 전부 같은 날 Claude Code로 돌아갔다.

**TL;DR** Hermes가 릴레이하고 Claude CLI가 실행자 역할을 맡는 패턴이 안정적으로 작동한다. 예외는 치과 리서치였다. 세션 3개를 쓰고도 Write 0번 — "질문하지 말고 바로 진행" 한 줄이 해결사였다.

## 365KB JSON을 받아서 카드뉴스로 — SpoonAI 세션 1-2

세션 1의 입력은 `2026-05-27-daily-intel-raw.json`, 365KB짜리 raw JSON이었다. 목표는 일반용 카드뉴스형 콘텐츠 후보와 전문가용 인텔리전스 콘텐츠 후보를 뽑아서 두 파일로 떨어뜨리는 것.

프롬프트 핵심은 이렇다:

```
일반용 카드뉴스형 AI 전반 이해 콘텐츠와 전문가용 AI 인텔리전스 콘텐츠 후보를
오늘 수집 데이터에서 선별·정리한다.
/Users/jidong/spoonai/crawl/newsite/2026-05-27-daily-intel-raw.json만 근거로 사용한다.
```

Claude는 Bash 28번을 썼다. raw JSON을 파싱하고, 섹션별로 추출하고, 최종적으로 `.md`와 `.json` 두 파일을 생성했다. 2분, 32 tool calls.

세션 2는 성장/수익화 신호 수집이었다. Product Hunt, Show HN, GitHub Trending을 대상으로 했는데, 수집된 Reddit/HN 데이터가 비어 있었다. Claude는 WebFetch로 직접 긁었다 — 이날 WebFetch 15번 중 대부분이 여기서 나왔다. 이전 파일에서 포맷을 확인하고 `growth-sponsor-signals.md`를 생성하는 데 4분, 24 tool calls가 들었다.

## 세션 3개 쓰고 Write 0번 — 치과 광고 리서치 삽질

이날에서 가장 비효율적인 구간이다.

세션 3이 시작됐을 때 목표는 명확했다: `2026-05-27-daily-update.md`, `rolling-knowledge-base.md`, `source-index.md` 세 파일을 생성/업데이트. Claude는 기존 파일 구조를 파악하고 `plan.md`를 만들었다. Bash 18번, Read 5번, Write 1번 — 그런데 Write 1번은 `plan.md` 하나였다. 실제 산출물은 0.

세션 4에서 다시 시작했다. Read 13번, Bash 10번. 기존 파일 헤더를 확인하고, 포맷을 확인하고, 구조를 파악하는 데 1분을 썼다. Write 0번.

세션 5 프롬프트에 한 줄이 추가됐다:

```
Do not ask questions.
```

그제야 실행 단계로 넘어갔다. Read 11번, Bash 8번.

이 패턴이 생기는 이유가 있다. 세션이 나뉘면 이전 세션의 컨텍스트가 사라진다. 다음 세션은 다시 파일을 읽어서 "현재 상태 파악" 비용을 처음부터 지불한다. 큰 작업을 세션 여러 개에 나눠서 넘기면, 매번 이 비용이 반복된다.

해결책은 두 가지다. 이전 산출물 경로를 프롬프트에 명시하거나, 세션을 나누지 말고 한 번에 끝내는 것. "질문하지 말고 바로 진행"을 프롬프트 기본값으로 박아두는 것도 세션 낭비를 줄인다.

## 가장 효율적인 세션: 5 tool calls, 4분

세션 6의 프롬프트가 가장 짧았다:

```
Read brief.md and create the required report files exactly under outputs/.
You may use web only if available, but do not ask questions.
Keep evidence labels explicit.
Produce a clean mobile-friendly Korean HTML technical report for PDF export
and a concise short_summary.md.
```

결과: Bash 2번, Write 2번, Read 1번. tool calls 5번. `report.html`과 `short_summary.md` 두 파일 생성. 소요 시간 4분.

세션 1-5가 평균 22 tool calls를 쓴 것과 비교하면 차이가 크다. 비결은 `brief.md`에 모든 컨텍스트가 담겨 있었다는 것이다. Claude가 "현재 상태 파악"을 건너뛰고 바로 실행에 들어갔다.

## Hermes 릴레이 패턴이 실제로 작동하는 방식

이날 세션들을 보면 CLAUDE.md의 Hermes 규칙이 실제로 작동하고 있다.

Hermes는 사용자의 요청을 정리해서 Claude CLI에 넘긴다. `brief.md`, `plan.md`, 또는 긴 프롬프트 형태로. Claude CLI는 그걸 받아서 파일을 읽고, 판단하고, 산출물을 만든다. Hermes는 결과를 전달할 뿐이다.

세션 3에서 Hermes가 `plan.md`를 만든 것도 같은 구조다. plan은 오케스트레이션 인프라에 해당하기 때문에 Hermes가 직접 만들 수 있다. 실제 `daily-update.md`나 `rolling-knowledge-base.md`는 Claude CLI가 써야 한다.

## 도구 사용 통계

| 도구 | 횟수 | 주 용도 |
|------|------|---------|
| Bash | 71 | 파일 확인, JSON 파싱, 디렉토리 체크 |
| Read | 36 | 기존 파일 구조 파악, 포맷 확인 |
| WebFetch | 15 | Product Hunt, Show HN 직접 수집 |
| Write | 4 | 실제 산출물 생성 |
| ToolSearch | 1 | WebFetch 스키마 로드 |

Write 4번이 눈에 띈다. 6세션에서 실제로 파일을 생성한 횟수가 4번뿐이다. Read 36번의 상당수는 기존 파일 포맷을 확인하는 용도였다. Read 대 Write 비율이 9:1이라는 뜻은, 산출물 하나를 만들기 위해 기존 파일을 9개 읽는다는 것이다.

이 비율을 낮추려면 포맷 레퍼런스를 프롬프트에 직접 포함하거나, 표준 템플릿을 고정된 경로에 두면 된다. 세션 6의 `brief.md` 방식이 그 방향이다.

> 6세션, 127 tool calls. 실제 산출물은 파일 4개였다. 컨텍스트 전달 설계를 바꾸면 tool call 수는 절반으로 줄일 수 있다.
