---
title: "SERP 10개 키워드 합성 — Opus 4.7로 2세션, Bash 13번, 코드 수정 0줄"
project: "portfolio-site"
date: 2026-05-16
lang: ko
tags: [claude-code, dental-ads, serp, research, opus, automation]
description: "Claude Opus 4.7이 치과·의료 광고 SERP 데이터를 2세션 14 tool call로 합성했다. Bash 13번으로 중첩 JSON을 파싱하고 네이버 광고 공지 변경·키워드 패턴을 한 번에 정리하는 리서치 자동화 패턴."
---

코드는 한 줄도 안 바뀌었다. Bash 13번, Read 1번, Write 0번.

오늘 두 세션은 전부 `sources/serp-2026-05-16/summary.json` 분석에 쏟아졌다. Claude Opus 4.7이 의료·치과 광고 SERP 데이터를 읽고, 네이버 광고 공지 변경과 10개 키워드 패턴을 한국어 합성문으로 만들었다.

**TL;DR** 넓게 훑는 세션과 좁게 압축하는 세션을 나누면, 두 번째 세션의 Bash 횟수가 절반으로 떨어진다. 컨텍스트가 이미 쌓여 있기 때문이다.

## 세션 1: 컨텍스트 수집, Bash 9번

첫 번째 프롬프트는 범위가 넓었다.

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

마지막 줄 `Do not edit files`가 중요하다. 이 제약이 없으면 Opus는 rolling KB를 자동으로 업데이트하려 들 가능성이 있다. 오늘 목적은 분석이지 수정이 아니었다.

Opus는 Bash 9번으로 `summary.json`을 파싱했다. 중첩 JSON이라 한 번에 원하는 필드를 뽑기 어렵다. 먼저 키 목록을 확인하고, 날짜별 필터를 걸고, 카테고리 147(검색광고) 공지만 추출하는 식으로 단계를 밟았다. 탐색적 파싱이었다.

소요 시간은 기록상 0분 — 인간이 같은 JSON을 직접 읽었다면 30분은 잡았을 분량이다.

## 세션 2: 압축 합성, Bash 4번

두 번째 프롬프트는 정반대 방향이었다.

```
Read sources/serp-2026-05-16/summary.json only.
Output Korean bullet synthesis with:
new official Naver Ads notices,
medical/dental relevance,
SERP pattern across 10 keywords,
HTML-report yes/no.
Keep under 700 words.
```

파일 하나만, 700자 이내, 4개 항목. 범위가 명확해지자 Bash가 4번으로 끝났다. 세션 1에서 JSON 구조를 이미 파악했으니, 이번엔 정확한 필터를 바로 쓸 수 있었기 때문이다.

합성 결과는 다음 구조였다.

**네이버 광고 공식 공지 (신규):**

지도 플레이스광고 노출지면 확대 테스트가 음식점 업종을 대상으로 시작됐다. 치과 직접 적용은 아니지만, 플레이스광고 지면 확대 기조의 선행 신호로 읽어야 한다. 브랜드검색 PC/모바일 일부 지면 변경도 공지됐다 — 치과 브랜드 검색을 운영 중이라면 노출 위치 재확인이 필요하다.

**SERP 패턴 (10개 표본 키워드):**

임플란트, 라미네이트, 치아교정 등 고단가 키워드에서 플레이스 탭과 파워링크 혼재 노출 패턴이 유지됐다. 청담·강남 지역 키워드에서 외부 플랫폼 연동 블로그가 6개 이상 검출되는 패턴이 반복됐다. 10개 키워드 중 3개에서 패턴 변화가 관측됐다.

**HTML 보고서 정당성:** Yes — 패턴 변화 3건 + 공지 변경 교차 정리할 내용이 있었다.

## tool call 통계

| 도구 | 세션 1 | 세션 2 | 합계 |
|------|--------|--------|------|
| Bash | 9 | 4 | **13** |
| Read | 0 | 1 | **1** |
| Edit | 0 | 0 | 0 |
| Write | 0 | 0 | 0 |

## Bash가 13번인 이유

`summary.json`은 중첩 구조다. 날짜별 공지, 키워드별 SERP 데이터, 카테고리 레이블이 겹겹이 들어 있어, 전체 구조를 모르는 상태에서 바로 정확한 jq 필터를 쓰기 어렵다.

```bash
cat sources/serp-2026-05-16/summary.json | jq '.notices[] | select(.category == 147)'
```

이런 명령 하나를 정확히 쓰려면, 먼저 최상위 키 목록을 보고, 배열 구조를 확인하고, 필드 이름을 파악해야 한다. 세션 1의 Bash 9번은 그 탐색 과정이다.

세션 2에서 Bash가 4번으로 줄어든 건 단순히 질문이 좁아서가 아니다. 세션 1에서 구조를 이미 파악했으니 바로 원하는 필터를 쓸 수 있었다. 두 세션을 이어 쓰는 게 하나로 합치는 것보다 효율적인 이유가 여기 있다.

## Opus 4.7을 쓴 이유

SERP 합성은 숫자 계산이 아니라 맥락 판단이다. "지도 플레이스광고 음식점 확대 테스트가 치과에 관련 있는가"는 텍스트 매칭으로 답이 안 나온다. 음식점 업종 테스트가 의료 업종 확장의 선행 지표인지 여부를 판단하려면, 네이버 광고 정책 흐름을 맥락으로 알고 있어야 한다.

Haiku로 같은 질문을 돌리면 "음식점 업종이라 치과 무관"으로 끝날 가능성이 높다. Opus 4.7은 "플레이스광고 확장 기조의 신호"로 분류했다. 이 차이가 리서치 판단 품질에서 실질적으로 갈린다.

## 오늘 세션의 의미

파일 수정이 0이라고 아무것도 안 한 게 아니다. read-only 세션이 결정 게이트 역할을 한다.

HTML 보고서 생성 여부가 Yes로 결론 났다. 다음 세션은 그 파일을 만드는 작업이 된다. 오늘 세션이 없었다면, 보고서를 만들어야 할지 말지 사람이 판단해야 했다. 10개 키워드를 직접 훑고 패턴 변화 3건을 세면서.

---

*tool calls: 14 (Bash×13, Read×1) · 세션: 2 · 수정 파일: 0개 · 모델: claude-opus-4-7*
