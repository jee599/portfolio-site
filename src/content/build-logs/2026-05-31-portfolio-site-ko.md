---
title: "Claude Code 197 tool calls: 리서치 파이프라인 3개를 하루에 동시 가동"
project: "portfolio-site"
date: 2026-05-31
lang: ko
tags: [claude-code, claude-opus, web-search, research-automation, agent]
description: "하루 197 tool calls, Bash 73·WebSearch 40·Read 33회. Claude Opus로 SpoonAI 콘텐츠 인텔리전스·의료광고 리서치·글로벌 AI 수익 보고서를 동시에 완성했다."
---

하루에 Bash 73번, WebSearch 40번, Read 33번. 5개 세션에서 tool call 197번이 나왔고, 파일 6개가 새로 생겼다.

**TL;DR** Claude Opus로 성격이 전혀 다른 리서치 3개를 하루에 완성했다. SpoonAI 콘텐츠 인텔리전스 크론, 의료·치과 광고 데일리 리서치, 글로벌 AI 수익 플랫폼 보고서. 핵심 패턴은 두 가지다 — 전날 출력을 참조하는 컨텍스트 체인, 레인별 병렬 Agent 투입.

## 세션 3개, 성격이 전혀 다르다

오늘 의미 있는 세션은 셋이다.

**세션 1**은 SpoonAI 새 사이트용 콘텐츠 인텔리전스 수집이다. `2026-05-31-daily-intel-raw.json`에서 179개 항목을 읽고 일반용 카드뉴스 후보(8~15개)와 전문가용 인텔리전스 후보(10~20개)를 선별했다. 9 tool calls, 소요 시간 측정 불가 수준. 제일 먼저 한 게 원자료가 아니라 전날 출력 파일을 읽은 것이었다 — `general_angle`, `expert_notes`, `numbers`, `secondary_sources` 필드 형태를 역추적해 스키마를 맞췄다.

**세션 2**는 의료·치과 광고 데일리 리서치다. `serp-2026-05-31/summary.json`과 당일 수집 HTML을 입력으로 받아 일일 업데이트를 생성하고 누적 파일 2개를 업데이트했다. 22 tool calls 중 Read가 12번이다. 쓰기(Edit 3, Write 1)보다 읽기가 세 배 많은 건 낭비가 아니다 — `rolling-knowledge-base.md`는 며칠치 누적 데이터라 포맷을 모르고 append하면 일관성이 깨진다. 4분 안에 끝났다.

**세션 5**가 오늘의 메인이다.

## WebSearch가 "비어있다"고 느꼈던 순간

세션 4에서 먼저 구조를 잡았다(Agent 5회, 8 tool calls). 세션 5에서 풀 실행을 돌렸다(158 tool calls, 37분).

목표는 `brief_global_ai_10_research.md` 지시를 그대로 이행하는 것이었다. 글로벌 AI 수익 플랫폼 25개 이상을 공식 소스에서 수수료·지급 조건·한국 자격 요건까지 라이브로 검증하는 리서치다.

시작 직후 두 가지가 겹쳤다. `API Error: Overloaded`가 떴고, WebSearch 결과가 처음엔 비어 보였다. 다음 이터레이션에서 확인하니 결과는 다 들어와 있었다 — 릴레이 버퍼링 때문에 출력 표시가 지연된 것이었다. WebSearch, WebFetch, curl 모두 정상 작동 중이었다.

이걸 에러로 오해하고 포기했다면 라이브 검증 없이 정적 요약으로 끝났을 것이다.

## 40개 사실을 공식 소스에서 직접 확인한 방법

핵심 프롬프트는 이랬다:

```
Do not ask the user questions.
Use live web search where available.
If a source is blocked, record it as blocked and continue with another verifiable source.
```

"막히면 blocked로 기록하고 다음 소스로"가 중요하다. 막혔을 때 멈추지 않고 계속 진행했다. WebSearch 40회, WebFetch 22회로 약 40개 수수료·정책 사실을 공식 소스에서 확인했다.

검증 과정에서 중요한 정정이 여러 건 나왔다. Etsy는 Payoneer 경유로 한국에서 실제로 사용 가능하다는 것, Toloka는 PayPal을 드롭했다는 것, Upwork 수수료가 이제 가변(0~15%)이라는 것, Ko-fi 샵 판매 수수료가 0%가 아니라 5%라는 것. 단순 요약이 아니라 실제 정책 변경까지 잡아냈다.

> "레인을 쪼개서 병렬 에이전트를 투입한다"는 게 오늘 확인한 패턴이다. 플랫폼 25개를 순서대로 조사하면 지연이 쌓인다. 레인별로 분리하면 전체 완료 시간은 가장 느린 단일 레인에 수렴한다.

## 산출물 5개, 37분

세션 5에서 생성된 파일:

- `global_ai_10_revenue_report.md` — 한국어 상세 보고서, 27,872 bytes, 349줄
- `global_ai_10_revenue_report.html` — 동일 내용 HTML 렌더링
- `method_ledger_seed.json` — 플랫폼별 구조화 데이터
- `sources.json` — 검증된 소스 목록
- `_progress.md` — 실행 중 기록한 진행 로그

JSON 2종 유효성 통과, 파일 5종 생성 확인. Bash 60회가 가장 많았는데, curl로 직접 공식 URL을 때리고 파일 쓰기·검증에 집중됐다.

## 전체 통계

| 도구 | 횟수 |
|------|------|
| Bash | 73 |
| WebSearch | 40 |
| Read | 33 |
| WebFetch | 22 |
| Write | 12 |
| ToolSearch | 9 |
| Agent | 5 |
| Edit | 3 |
| **합계** | **197** |

세션 5개, 수정 파일 2개, 생성 파일 6개. "Say OK" 세션을 제외하면 4개 세션에서 197 tool calls가 나왔다. 세션 1·2 합쳐 31번, 세션 4·5 합쳐 166번 — 라이브 리서치가 얼마나 무거운지 숫자로 나온다.

## 크론 자동화에서 컨텍스트 체인이 중요한 이유

세션 1·2는 내일도 돌아가는 크론이다. SpoonAI 인텔리전스 크론은 매일 `raw crawl → 선별 → .md/.json 출력` 루틴, 의료 광고 리서치는 매일 `SERP 데이터 → 일일 업데이트 → 누적 KB append` 패턴이다. 두 경우 모두 Claude가 전날 출력을 참고해서 오늘 것을 만든다.

"어제 네가 만든 파일과 같은 형태로 써라"는 지침 하나가 스키마 문서 몇 페이지보다 안정적으로 동작한다. 누적 데이터가 쌓일수록 참고할 패턴도 많아지고, 모델이 자연스럽게 일관성을 유지한다.
