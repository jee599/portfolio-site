---
title: "코드 한 줄 없이 14 tool calls: Claude Opus로 의료광고 SERP 일일 분석"
project: "portfolio-site"
date: 2026-05-17
lang: ko
tags: [claude-code, claude-opus, serp, dental-ad, prompt-engineering, research]
description: "Claude Code를 코드 작성이 아닌 리서치 도구로 쓴 사례. Bash 13번, Read 1번으로 네이버 의료광고 SERP 데이터를 분석하고 일일 브리핑을 뽑아냈다. 수정 파일 0개."
---

어제 Claude Code 세션 2개에서 tool call이 14번 발생했다. 수정된 파일은 0개다.

**TL;DR** 의료·치과 광고 SERP 데이터를 Claude Opus 4-7로 분석하는 읽기 전용 리서치 파이프라인이다. 코드를 짜는 게 아니라, 쌓인 데이터를 빠르게 요약·종합하는 데 Claude를 쓰는 패턴.

## 배경: 왜 Claude Code로 SERP를 분석하나

치과 광고 프로젝트(`dental-ad-ops`)에는 매일 수집되는 네이버 SERP 데이터가 있다. `sources/serp-2026-05-16/summary.json` 같은 파일들이 날짜별로 쌓인다. 키워드 10개, 광고 공지, 업종별 패턴.

매일 이걸 직접 읽는 건 비효율적이다. 그래서 Claude에게 넘긴다. 코드 변경 없이, 파일을 읽고 한국어로 요약하는 역할만 맡긴다.

## 세션 1: 전체 KB 맥락 포함 종합 분석

첫 번째 프롬프트는 이랬다.

```
You are reviewing today's Korean medical/dental ads daily research data.
Read sources/serp-2026-05-16/summary.json and the existing rolling KB/source-index/SERP/hypotheses files.
Give a concise Korean synthesis:
(1) new official changes,
(2) SERP repeated patterns,
(3) what files should be updated,
(4) whether an HTML report is justified.
Do not edit files.
```

마지막 줄이 핵심이다. `Do not edit files.` Claude Code는 기본적으로 행동하려 한다. 분석 결과를 파일로 떨어뜨리거나, 요약 문서를 새로 만들거나. 여기서는 그게 필요 없다. 출력만 받으면 된다.

이 세션에서 Bash를 9번 썼다. json 파싱, 파일 목록 확인, 기존 KB 파일 읽기 등. 시간은 0분 — 사실상 즉시 완료였다.

## 세션 2: 700자 제한 압축 브리핑

두 번째 프롬프트는 범위를 더 좁혔다.

```
Read sources/serp-2026-05-16/summary.json only.
Output Korean bullet synthesis with:
new official Naver Ads notices, medical/dental relevance, SERP pattern across 10 keywords, HTML-report yes/no.
Keep under 700 words.
```

`summary.json only` — 첫 번째 세션에서 여러 파일을 읽다 보니 결과가 길어졌다. 두 번째에서는 단일 파일로 제한해서 속도를 높였다.

출력 결과의 핵심 내용은 이랬다:

- **지도 플레이스광고 지면 확대 테스트** — 음식점 업종 대상이지만, 플레이스광고 확대 기조의 연장선이라 치과에도 영향 가능
- **브랜드검색 PC 일정 변경** (2026-05-11) — 브랜드 키워드 운영 중인 치과는 모니터링 필요
- SERP 10개 키워드 중 의료 업종 직접 대상 공지는 없음
- HTML 리포트 불필요 — 패턴 변화 없음

Bash 4번, Read 1번. 총 5 tool calls, 1분.

## 읽기 전용 Claude의 효율

두 세션 합쳐서 Bash 13번, Read 1번, 총 14 tool calls. 파일 수정 0개, 파일 생성 0개.

Claude Code를 쓸 때 기본 전제는 "코드를 만드는 도구"다. 그런데 이 세션들은 반대다. 기존 데이터를 읽고, 사람이 30분 걸릴 분석을 1분 안에 요약해 준다.

이 패턴에서 프롬프트 설계가 중요한 이유가 있다. Claude는 기본적으로 뭔가를 하려 한다. `Do not edit files`나 `Keep under 700 words` 같은 명시적 제약을 안 걸면, 결과가 필요 이상으로 길어지거나 파일을 생성하려 한다.

## 프롬프트 설계의 두 가지 패턴

첫 번째 세션과 두 번째 세션의 프롬프트는 같은 목적이지만 전략이 달랐다.

**첫 번째**: 컨텍스트를 넓게 잡는다. KB 전체, 기존 가설 파일까지 읽게 해서 rolling 인사이트를 뽑아낸다. 처음 파이프라인을 돌릴 때나, 변화가 많은 날에 쓴다.

**두 번째**: 범위를 좁히고 출력 길이에 cap을 건다. `summary.json only` + `under 700 words`. 변화가 없는 날 빠른 확인용이다.

같은 데이터, 다른 프롬프트 → 다른 깊이의 결과. 매일 자동으로 어떤 프롬프트를 쓸지 결정하는 레이어를 붙이면 더 효율적인 파이프라인이 나올 것이다.

## 수치

| 항목 | 값 |
|------|-----|
| 총 세션 | 2 |
| 총 tool calls | 14 |
| Bash | 13 |
| Read | 1 |
| 수정 파일 | 0 |
| 생성 파일 | 0 |
| 소요 시간 | ~1분 |
| 사용 모델 | claude-opus-4-7 |

> 코드를 짜지 않는 Claude Code 세션도 있다. 그게 효율적일 때가 있다.
