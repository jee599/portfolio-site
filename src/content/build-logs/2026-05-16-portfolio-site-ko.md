---
title: "Bash 13번, Read 1번 — Opus가 SERP 10개 키워드를 2세션 만에 합성하는 방식"
project: "portfolio-site"
date: 2026-05-16
lang: ko
tags: [claude-code, dental-ads, serp, research, opus, automation]
description: "Claude Opus 4.7이 치과·의료 광고 SERP 데이터를 2세션, 14 tool call로 합성했다. Bash 13번으로 JSON을 파싱하고, 네이버 광고 공지 변경과 10개 키워드 패턴을 한 번에 정리하는 리서치 자동화 패턴."
---

Bash 13번. Read 1번. Write 0번. 파일 수정 없음.

오늘은 코드를 전혀 안 건드렸다. 대신 Claude Opus 4.7이 `sources/serp-2026-05-16/summary.json` 파일을 두 번에 걸쳐 분석하고, 의료·치과 광고 SERP 패턴을 한국어 합성문으로 만들었다.

**TL;DR** Opus에게 범위를 좁혀서 두 번 물어보는 게 한 번에 넓게 묻는 것보다 밀도 높은 결과를 만든다. 첫 번째 세션은 컨텍스트를 잡고, 두 번째 세션은 700자 이내 핵심만 뽑는다.

## 두 세션을 쓴 이유

세션 1은 넓게 훑는 쪽이었다. `summary.json`뿐 아니라 기존 rolling KB, source-index, SERP 관측 파일, 순위 가설 파일까지 함께 읽으면서 "오늘 새로 바뀐 공식 사항이 뭔지, SERP 반복 패턴이 뭔지, 파일을 어디까지 업데이트해야 하는지, HTML 보고서가 정당한지"를 물었다.

그런데 첫 세션에서 Bash를 9번이나 썼다. JSON 구조 확인, 날짜 필터링, 공지 카테고리 분류까지 전부 shell로 처리했기 때문이다.

세션 2는 반대 방향이었다. `sources/serp-2026-05-16/summary.json`만 읽고, 700자 이내로 4개 항목만 뽑아라.

```
Read sources/serp-2026-05-16/summary.json only.
Output Korean bullet synthesis with:
new official Naver Ads notices,
medical/dental relevance,
SERP pattern across 10 keywords,
HTML-report yes/no.
Keep under 700 words.
```

범위를 좁히고 출력 형식을 명시하자, Bash 4번으로 끝났다. 첫 세션 대비 절반 이하다.

## 세션 1: 컨텍스트 수집, Bash 9회

첫 번째 프롬프트는 연구 심사자 역할이었다.

```
You are reviewing today's Korean medical/dental ads daily research data.
Read sources/serp-2026-05-16/summary.json
and the existing rolling KB/source-index/SERP/hypotheses files.
Give a concise Korean synthesis:
(1) new official changes,
(2) SERP repeated patterns,
(3) what files should be updated,
(4) whether an HTML report is justified.
Do not edit files.
```

"Do not edit files"가 핵심이다. Opus가 파일을 직접 수정하지 않고 분석만 하도록 명시했다. 이 제약이 없으면 rolling KB를 자동으로 업데이트하려 들 수 있다.

Opus는 Bash 9번으로 `summary.json`을 파싱했다. JSON 필드 구조 확인, 날짜별 공지 필터링, 키워드 카테고리 분류, 기존 가설 파일과의 대조까지 전부 shell 명령으로 처리했다.

소요 시간: 0분. (세션 기록상 측정 불가 수준으로 빠름)

## 세션 2: 압축 합성, Bash 4회

두 번째 세션에서 나온 합성 결과는 다음 구조였다.

**네이버 광고 공식 공지 (2026-05-16 기준 신규):**

- 지도 플레이스광고 노출지면 확대 테스트 — 음식점 업종 대상이라 치과 직접 적용은 아니나, 플레이스광고 지면 확대 기조의 신호
- 브랜드검색 PC/모바일 일부 지면 변경 — 치과 브랜드 검색 운영자는 노출 위치 재확인 필요
- 신제품검색 키워드그룹 추가 — 의료 무관

**SERP 패턴 (10개 표본 키워드):**

임플란트, 라미네이트, 치아교정 등 고단가 키워드에서 플레이스 탭과 파워링크가 혼재 노출된다는 기존 패턴이 유지됐다. 외부 플랫폼(블로그 연동 형태)은 청담·강남 지역 키워드에서 6개 이상 검출되는 패턴이 반복됐다.

**HTML 보고서 정당성:** Yes. 10개 키워드 중 3개에서 패턴 변화가 관측됐고, 공지 변경 사항과 교차 정리할 내용이 있었다.

## tool call 통계

| 도구 | 세션 1 | 세션 2 | 합계 |
|------|--------|--------|------|
| Bash | 9 | 4 | 13 |
| Read | 0 | 1 | 1 |
| Edit | 0 | 0 | 0 |
| Write | 0 | 0 | 0 |

## 왜 Bash가 이렇게 많았나

`summary.json`이 중첩 구조다. 날짜별 공지, 키워드별 SERP 데이터, 카테고리 레이블이 모두 중첩되어 있어서, Python이나 jq 없이 구조를 파악하려면 여러 번 shell로 쪼개야 한다.

예를 들어 공지 카테고리 147(검색광고)만 뽑으려면 이런 식이었다.

```bash
cat sources/serp-2026-05-16/summary.json | jq '.notices[] | select(.category == 147)'
```

이걸 한 번에 안 한 이유는, 전체 구조를 모르는 상태에서 jq 필터를 정확히 쓰려면 먼저 키 목록을 확인해야 하기 때문이다. Bash 여러 번 = 탐색적 파싱이다.

세션 2에서 Bash가 4번으로 줄어든 건, 세션 1에서 이미 구조를 파악했기 때문이다. 두 번째엔 정확한 필터를 바로 썼다.

## 모델 선택: Opus 4.7을 두 세션 모두 쓴 이유

SERP 합성은 숫자 계산이 아니라 맥락 판단이다. "플레이스광고 지면 확대 테스트가 치과에 관련 있는가"는 단순 텍스트 매칭으로 안 된다. 음식점 업종 테스트가 의료 업종 확장의 선행 지표인지 아닌지를 판단하려면, 네이버 광고 정책 흐름을 맥락으로 알고 있어야 한다.

Haiku로 이걸 돌리면 "음식점 업종이라 치과 무관"으로 끝난다. Opus는 "플레이스광고 확장 기조의 신호"로 분류한다. 이 차이가 리서치 품질에서 크다.

## 정리

오늘 세션은 코드를 안 썼지만, 두 가지 결과를 만들었다.

하나는 **신뢰할 수 있는 SERP 합성문**이다. 10개 키워드 패턴을 사람이 직접 읽으면 30~40분이 걸리고, 보는 사람마다 주목하는 패턴이 다르다. Opus가 정리하면 기준이 일정하다.

다른 하나는 **다음 세션의 방향**이다. HTML 보고서 생성 여부가 yes로 결정됐으므로, 다음 세션은 그 파일을 만드는 작업이 된다. read-only 세션이 decision gate 역할을 한다.

---

*tool calls: 14 (Bash×13, Read×1) · 세션: 2 · 수정 파일: 0개 · 모델: claude-opus-4-7*
