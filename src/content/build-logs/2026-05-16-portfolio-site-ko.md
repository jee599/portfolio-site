---
title: "Claude Opus 14회 tool call로 마친 의료광고 SERP 분석 — 코드 0줄의 기록"
project: "portfolio-site"
date: 2026-05-16
lang: ko
tags: [claude-code, claude-opus, serp, 의료광고, 분석자동화]
description: "코드 수정 없이 2개 세션 14번 tool call. Claude Opus 4.7이 치과·의료광고 SERP 10개 키워드를 분석하고 네이버 광고 변경사항을 700자로 압축하는 과정을 기록한다."
---

코드를 전혀 수정하지 않은 세션이 있었다. 2개 세션, 14번의 tool call, 수정 파일 0개. 그런데 실제 유용한 결과가 나왔다.

**TL;DR** Claude Opus 4.7을 순수 분석가로 투입하면, 복잡한 SERP JSON 데이터도 700자 이내로 압축할 수 있다. 프롬프트에 출력 분량 제한을 명시하는 것이 핵심이다.

## 배경: 치과 광고 SERP를 매일 추적한다

이 프로젝트에는 `sources/serp-YYYY-MM-DD/summary.json` 형태로 매일 의료·치과 광고 관련 키워드 SERP 데이터가 쌓인다. 수동으로 읽기엔 양이 많고, 패턴 파악도 어렵다. Claude를 이 분석 단계에 그대로 투입했다.

## 세션 1: 맥락 포함 전체 종합

첫 번째 프롬프트는 광범위하게 던졌다:

```
You are reviewing today's Korean medical/dental ads daily research data.
Read sources/serp-2026-05-16/summary.json and the existing rolling
KB/source-index/SERP/hypotheses files. Give a concise Korean synthesis:
(1) new official changes, (2) SERP repeated patterns,
(3) what files should be updated,
(4) whether an HTML report is justified.
Do not edit files.
```

마지막 줄 `Do not edit files`가 핵심이다. 분석만 하고 파일을 건드리지 말라는 명시적 제약이다. 이 제약을 빼면 Claude는 뭔가 최적화하거나 파일을 수정하려 든다. 읽기 전용 분석을 원하면 반드시 명시해야 한다.

결과: 9번의 Bash 호출로 기존 KB 파일들을 읽고 `summary.json`을 파싱했다. 소요 시간 0분.

## 세션 2: 범위 좁혀서 재분석

첫 번째 결과가 길었다. 두 번째 프롬프트는 범위를 명확하게 제한했다:

```
Read sources/serp-2026-05-16/summary.json only.
Output Korean bullet synthesis with:
new official Naver Ads notices, medical/dental relevance,
SERP pattern across 10 keywords, HTML-report yes/no.
Keep under 700 words.
```

`only`와 `Keep under 700 words` — 이 두 단어가 결과를 완전히 바꿨다. 이번엔 Bash 4번 + Read 1번, 총 5회 tool call로 끝났다. 세션 1의 절반 수준이다.

## Claude가 추출한 핵심 인사이트

2026-05-16 기준 분석 결과에서 주목할 만한 것은 세 가지였다.

네이버 광고 공식 공지에서 지도 플레이스광고 노출지면 확대 테스트가 눈에 띄었다. 음식점 업종이 1차 대상이라 치과에 직접 영향은 없지만, 플레이스광고 지면 확장 기조가 확인됐다는 점에서 의미가 있다. 나머지 공지 2건(신제품검색 키워드 추가, 브랜드검색 일정 변경)은 의료광고와 무관했다.

SERP 패턴은 10개 키워드 전반에서 유의미한 변화가 없었다. 그리고 HTML 리포트 필요 여부 판단이 흥미로웠다 — "신규 공지 1건, 패턴 변화 미미, 리포트 불필요"라고 스스로 결론을 냈다. 보통 Claude는 뭔가 만들려고 하는데, "변화가 없으면 리포트도 없다"는 기준을 그대로 지켰다.

## 도구 사용 통계

| 도구 | 세션 1 | 세션 2 | 합계 |
|------|--------|--------|------|
| Bash | 9 | 4 | **13** |
| Read | 0 | 1 | **1** |
| Edit | 0 | 0 | 0 |
| Write | 0 | 0 | 0 |

수정 파일: 0개. 생성 파일: 0개.

Bash가 압도적으로 많은 건 자연스럽다. JSON 파싱, 파일 탐색, 기존 KB 검색 — 이 모든 게 Bash로 처리된다. Read 툴은 특정 파일 하나를 직접 열 때만 쓰였다.

## 세 가지 배운 것

**출력 분량 제한을 숫자로 박아라.** "concise"만 쓰면 길어진다. "under 700 words"를 명시하면 핵심만 나온다. 형용사보다 숫자가 효과적이다.

**분석 세션에는 `Do not edit files`를 명시해라.** 이 한 줄이 없으면 Claude는 읽는 김에 뭔가 고치려 한다. 순수 분석을 원할 때는 반드시 제약을 걸어야 한다.

**첫 번째 세션에서 넓게 훑고 두 번째에서 좁혀라.** 처음부터 완벽한 프롬프트를 만들려 하지 말고, 결과를 보고 즉시 범위를 재조정하는 것이 더 빠르다. 세션 2의 Bash가 4번으로 줄어든 건 세션 1에서 JSON 구조를 이미 파악했기 때문이다.

---

*tool calls: 14 (Bash×13, Read×1) · 세션: 2 · 수정 파일: 0개 · 모델: claude-opus-4-7*
