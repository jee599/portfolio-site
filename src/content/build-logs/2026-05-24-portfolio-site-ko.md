---
title: "Claude Code 9분, 26 tool calls로 의료광고 리서치 KB 자동 갱신"
project: "portfolio-site"
date: 2026-05-24
lang: ko
tags: [claude-code, automation, research, dental-ad, knowledge-base]
description: "9분, 26 tool calls로 의료·치과 광고 데일리 리서치 KB를 완전 갱신했다. Bash 12번·Read 10번으로 파악하고 Write·Edit 4번으로 파일 4개를 뱉어내는 패턴."
---

9분. 26번의 tool call. 파일 4개. 이게 의료·치과 광고 데일리 리서치 KB 업데이트에 오늘 든 전부다.

**TL;DR** `claude-opus-4-7`을 리서치 에이전트로 투입해 SERP 분석, 누적 KB 갱신, HTML 보고서까지 한 세션에 처리했다. 핵심은 파일 경로를 미리 명시하면 에이전트가 Read와 Bash를 스스로 조합해 컨텍스트를 최적으로 소비한다는 것이다.

## 에이전트 역할 정의가 먼저다

`dentalad` 프로젝트에는 매일 SERP 스냅샷과 경쟁사 광고 데이터가 쌓인다. 사람이 수동으로 정리하면 30~40분이다. `rolling-knowledge-base.md`와 `naver-ranking-hypotheses.md`가 오래되면 동기화도 깨진다.

세션 시작 프롬프트는 역할 → 범위 → 원자료 경로 순서로 구성했다.

```
Goal: 의료·치과 광고 최신전략 리서치 에이전트
Scope: ~/dentalad/research/daily-medical-dental-ads/
원자료: sources/serp-2026-05-24/summary.json
기존 문서: 2026-05-23-daily-update.md, rolling-knowledge-base.md,
           source-index.md, competitive-serp-observations.md
```

파일 경로를 직접 넘기는 게 핵심이다. 경로를 빠뜨리면 에이전트가 디렉터리를 탐색하는 데 tool call을 낭비한다.

## Bash 12번 + Read 10번: 쓰기 전에 먼저 읽는다

26번 tool call의 84%가 Bash(12)와 Read(10)다. 산출물을 만들기 전에 파악에 집중하는 패턴이다.

`summary.json`은 덩치가 크다. 통째로 Read하면 context가 터진다. Claude가 스스로 판단해서 grep 경로를 택했다.

```bash
grep -n "keyword\|position\|title\|url" sources/serp-2026-05-24/summary.json | head -50
```

Bash의 나머지 사용은 두 가지였다. `ls`로 디렉터리 구조 확인, `tail`로 누적 KB의 마지막 섹션 확인. 큰 파일은 Bash로 핵심만 추출하고, 작은 파일은 Read로 전체를 읽는다. 내가 지시하지 않아도 스스로 최적 경로를 잡는다.

## state 헬퍼가 없어도 막히지 않았다

세션 로그에 이런 메모가 남았다.

```
state 헬퍼는 없는 듯하니 산출물 생성을 진행합니다.
```

워크플로우 state 관리 스크립트(`lib/state.sh`)가 해당 경로에 없었다. Claude가 이를 감지하고 블로킹 없이 산출물 생성으로 넘어갔다. 상태 머신 의존도를 낮추는 파일 기반 워크플로우의 장점이다. `state.json`이 없어도 목표 파일이 있으면 다음 단계는 돌아간다.

## Write 2번 + Edit 2번: 산출물 4개

| 파일 | 동작 |
|------|------|
| `2026-05-24-daily-update.md` | Write — 당일 SERP 분석, 경쟁사 광고 패턴, 키워드 동향 |
| `reports/2026-05-24-cost-keyword-serp-split.html` | Write — 비용·키워드·SERP 분할 모바일 HTML 보고서 |
| `rolling-knowledge-base.md` | Edit — 5/24 항목 append |
| `source-index.md` | Edit — 오늘 소스 인덱스 추가 |

누적 파일(`rolling-knowledge-base.md`, `source-index.md`)은 통째로 재작성하지 않고 오늘 날짜 섹션만 append했다. Edit이 2번인 이유다. 파일이 커질수록 Write보다 Edit이 낫다.

HTML 보고서는 Write 한 번으로 나왔다. 누적 KB와 SERP 요약을 종합해서 모바일에서 바로 볼 수 있는 포맷으로 뽑아낸 것이다. 수동으로 만들면 20분이 넘는 작업이다.

## 9분이 가능한 조건

사람이 같은 작업을 하면 최소 1~2시간이다. SERP 직접 확인, 엑셀 정리, 어제 문서 열고 항목 추가, HTML 보고서 작성.

26 tool calls로 같은 결과를 내는 건 단순히 빠르다는 문제가 아니다. **매일 반복할 수 있다**는 게 핵심이다. 1시간짜리 작업은 "오늘은 바빠서 패스"가 되지만, 9분짜리는 그렇지 않다.

> 자동화 투자의 진짜 가치는 속도가 아니라 빠지지 않고 누적되는 데이터에 있다.

치과 광고 리서치 자동화는 이제 Socratic Intake 프롬프트 + 파일 경로 명시 두 가지로 돌아간다. 내가 할 일은 매일 SERP 스냅샷을 `sources/` 아래에 떨어뜨리는 것뿐이다.
