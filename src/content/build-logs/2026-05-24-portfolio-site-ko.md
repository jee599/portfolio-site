---
title: "Claude Opus 4.7로 치과 광고 리서치 에이전트 — 9분, 26 tool calls"
project: "portfolio-site"
date: 2026-05-24
lang: ko
tags: [claude-code, automation, research, dental, claude-opus]
description: "Claude Opus 4.7을 의료·치과 광고 데일리 리서치 에이전트로 투입했다. 9분 26 tool calls로 SERP 분석, 누적 KB 업데이트, HTML 보고서까지 한 번에 처리하는 패턴을 정리했다."
---

`claude-opus-4-7`을 리서치 에이전트로 투입하면 9분 안에 SERP 분석 보고서가 나온다. 프롬프트 한 번, 개입 없음.

**TL;DR** 의료·치과 광고 데일리 리서치 업데이트를 Opus 4.7로 자동화했다. 기존 파일을 읽고, 오늘자 업데이트를 생성하고, 누적 KB에 append하고, HTML 보고서까지 한 세션에 처리했다. 핵심 패턴은 "파일 경로를 명시하면 에이전트가 알아서 최적 경로로 읽는다"다.

## 작업 배경: 매일 쌓이는 SERP 데이터를 어떻게 정리할까

`dentalad/research/daily-medical-dental-ads/` 아래에는 날마다 SERP 스냅샷과 경쟁사 광고 데이터가 쌓인다. 수동으로 정리하면 30~40분은 기본이다. 더 큰 문제는 `rolling-knowledge-base.md`와 `naver-ranking-hypotheses.md`가 오래되면 동기화가 깨진다는 것이다.

해결책은 Opus 4.7에 역할을 주는 것이었다.

> "오늘의 SERP 요약 파일을 읽고, 기존 문서를 업데이트하고, 보고서를 만들어라"

## 프롬프트 구조: Socratic Intake 패턴

에이전트에 넘긴 프롬프트는 다음 형식이었다.

```
Goal: 의료·치과 광고 최신전략 리서치 에이전트
Scope: ~/dentalad/research/daily-medical-dental-ads/
원자료: sources/serp-2026-05-24/summary.json
기존 문서: 2026-05-23-daily-update.md, rolling-knowledge-base.md,
           source-index.md, competitive-serp-observations.md
```

목표, 범위, 읽어야 할 파일, 기존 문서 경로를 전부 명시했다. `sources/serp-2026-05-24/summary.json` 경로를 직접 넘긴 게 핵심이다. 파일 경로를 빠뜨리면 에이전트가 디렉터리를 탐색하다 토큰을 낭비한다.

## 26 tool calls의 흐름: Bash가 Read보다 많은 이유

세션 도구 사용 통계.

| 도구 | 횟수 |
|------|------|
| Bash | 12 |
| Read | 10 |
| Write | 2 |
| Edit | 2 |
| **합계** | **26** |

Bash가 Read보다 많다. 이유는 `summary.json`이 큰 파일이라 통째로 Read하면 context가 터진다. Claude가 스스로 판단해서 `grep`으로 핵심 키만 뽑는 경로를 택했다. 에이전트가 직접 최적화한 것이다.

실제로 Bash 사용 흐름을 보면 세 가지였다.

1. 파일 목록 확인 — `ls`로 디렉터리 구조 파악
2. 대용량 JSON에서 핵심 키 추출 — `grep`으로 SERP 요약 섹션만 뽑기
3. 누적 파일 최신 섹션 확인 — `tail`로 KB의 마지막 항목 확인

Edit이 2번뿐인 것도 눈에 띈다. `rolling-knowledge-base.md`와 `source-index.md`는 append 구조라 기존 내용을 재작성하지 않고 마지막에 오늘 날짜 섹션만 추가했다.

## state 헬퍼 없이도 막히지 않는 이유

세션 로그에 이런 메모가 있었다.

```
state 헬퍼는 없는 듯하니 산출물 생성을 진행합니다.
```

워크플로우 state 관리 스크립트(`lib/state.sh`)가 해당 경로에 없었다. 에이전트가 이를 감지하고, state를 기다리는 대신 바로 산출물 생성으로 넘어갔다. 블로킹 없이 목표를 달성한 셈이다.

파일 기반 워크플로우의 장점이다. `state.json`이 없어도 결과 파일이 있으면 다음 단계가 진행된다. 상태 머신보다 파일 존재 여부가 더 단순한 진실원이다.

## 9분 뒤 남은 파일 4개

```
생성: 2026-05-24-daily-update.md
      → 오늘자 SERP 분석, 경쟁사 광고 패턴, 키워드 동향

생성: reports/2026-05-24-cost-keyword-serp-split.html
      → 비용·키워드·SERP 분할 모바일 HTML 보고서

수정: rolling-knowledge-base.md
      → 5/24 누적 항목 추가

수정: source-index.md
      → 오늘 소스 인덱스 업데이트
```

HTML 보고서는 Write 한 번으로 나왔다. Claude가 누적 KB와 SERP 요약을 종합해서 모바일에서 바로 볼 수 있는 포맷으로 뽑아냈다. 이전에는 이 보고서를 수동으로 만드는 데 20분 이상 걸렸다.

## 배운 것: 파일 경로가 프롬프트의 절반이다

에이전트에게 "이 파일들을 읽어라"고 시키지 않아도 된다. "이 경로에 있다"고 알려주면 충분하다.

프롬프트에서 파일 경로를 명시하면 Opus가 알아서 Read → Bash 조합으로 효율적으로 처리한다. 큰 파일은 grep으로, 작은 파일은 Read로. 내가 지시하지 않아도 스스로 최적 경로를 찾는다.

치과 광고 리서치 자동화는 이제 Socratic Intake 프롬프트 + 파일 경로 명시 두 가지로 돌아간다. 내가 할 일은 매일 SERP 스냅샷을 `sources/` 아래에 떨어뜨리는 것뿐이다.
