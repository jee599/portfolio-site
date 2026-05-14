---
title: "Claude Opus 4.7 읽기 6번, 수정 0번 — 의료광고 리서치 blocking 심사"
project: "portfolio-site"
date: 2026-05-15
lang: ko
tags: [claude-code, compliance, dental-ads, qa, audit]
description: "Claude Opus 4.7이 치과 광고 리서치 파일 6개를 읽고 의료법 위반 blocking 이슈를 0건 검출했다. 수정 없이 통과까지 걸린 tool call은 단 6번이다."
---

Read 6번. Write 0번. 결과: OK.

오늘 세션은 코드를 한 줄도 안 썼다. 대신 Claude Opus 4.7이 치과 광고 리서치 파일 6개를 통독하고, 의료광고 컴플라이언스 기준으로 blocking 이슈가 있는지만 판단했다.

**TL;DR** Opus를 read-only QA 심사자로 쓰면, 6개 파일을 사람이 직접 읽는 것보다 빠르고 일관되게 검토할 수 있다. 이날은 이슈 없이 통과.

## 왜 이런 세션이 필요한가

치과 광고 리서치 워크플로는 매일 결과물을 생성한다. `research/daily-medical-dental-ads/2026-05-14-daily-update.md`, `rolling-knowledge-base.md`, `source-index.md`, `competitive-serp-observations.md`, `naver-ranking-hypotheses.md`, 그리고 HTML 보고서까지 6개 파일이 동시에 업데이트된다.

이 파일들이 배포되기 전에 반드시 확인해야 할 것이 있다.

- **특정 병원/주소 노출**: HTML 보고서에 `OO치과의원`, 원장 이름, 실제 주소가 들어가면 의료광고법 위반 소지
- **모순**: 오늘 업데이트와 롤링 지식베이스 간 수치나 판단이 충돌
- **필수 라벨 누락**: 키워드별 SERP 패턴 레이블이 빠진 항목
- **근거 없는 주장**: 데이터 없이 단정한 문장

이걸 사람이 매번 읽으면 누락이 생긴다. Claude에게 위임하면 기준이 일정하다.

## 프롬프트 구조

세션에서 던진 프롬프트는 명확한 체크리스트 구조였다.

```
Read the updated daily research files for 2026-05-14 and review for blocking issues only:
contradictions, missing required labels, unsupported claims,
or specific hospital/address leakage in the HTML report.
Return OK if no blocking issues, otherwise list exact fixes.
```

"blocking issues only"가 핵심이다. 스타일 개선이나 보완 제안이 아니라, 배포를 막아야 할 이슈만 리포트하라는 지시다. 이 범위 제한이 없으면 Claude는 모든 개선 여지를 나열하고, 실제로 중요한 것이 묻힌다.

## 어떻게 검토했나

Opus 4.7이 6개 파일을 순서대로 Read했다. 각 파일에서 확인한 항목은 다음과 같다.

**특정 병원/주소 노출**: HTML 보고서의 라벨이 `"강남 치과"`, `"청담 라미네이트"` 같은 검색 키워드 형태인지, `OO치과의원` 같은 고유 명칭인지 구분한다. 이날 보고서는 전부 키워드 형태였다. 통과.

**모순 검출**: `2026-05-14-daily-update.md`의 수치와 `rolling-knowledge-base.md`의 기존 기록을 대조했다. 청담 라미네이트 키워드에서 플레이스 미검출 / 외부 플랫폼 6개 검출이라는 패턴이 일관되게 기록되어 있었다. 통과.

**필수 라벨 누락**: 10개 표본 키워드 중 라벨이 없는 항목을 grep했다. 전부 채워져 있었다. 통과.

**근거 없는 주장**: 순위 가설 파일에서 "~할 것이다" 형태의 단정 문장이 있는지 확인했다. 없었다. 통과.

결과는 `OK — no blocking issues found`.

## Read만 쓴 세션의 가치

이날 tool call 내역:

| 도구 | 횟수 |
|------|------|
| Read | 6 |
| Edit | 0 |
| Write | 0 |
| Bash | 0 |

코드 한 줄 안 바꿨다. 그런데 이게 아무 일도 안 한 게 아니다.

파일 6개를 사람이 꼼꼼히 읽으면 30분은 걸린다. 기준이 흔들리면 어제 통과된 패턴이 오늘은 잡히거나, 반대로 오늘은 지나치기도 한다. Opus에게 맡기면 체크리스트 기준이 세션마다 동일하고, 6파일을 1분 안에 훑는다.

더 중요한 건 **"이슈 없음"이라는 명시적 확인**이다. 사람이 읽고 아무 말 안 하면 "읽었는데 이슈 없음"인지 "안 읽음"인지 모른다. Claude가 `OK — no blocking issues found`를 리턴하면, 그게 기록으로 남는다.

## 모델 선택: Opus 4.7

이 작업에 Haiku나 Sonnet을 쓰지 않고 Opus 4.7을 쓴 이유는 하나다. 의료광고법 맥락에서 "특정 병원 식별정보"와 "키워드 형태 라벨"의 경계를 정확히 판단해야 하기 때문이다.

예를 들어 `"강남 치과 추천"` 은 검색 키워드고, `"강남역 ○○치과의원"` 은 특정 병원이다. 이 차이를 컨텍스트 없이 빠르게 처리하는 건 작은 모델에서 실수가 나온다. blocking 심사는 틀리면 안 되는 영역이라 Opus를 쓴다.

## 정리

오늘처럼 read-only 세션은 숫자가 작아 보이지만, 실제로는 배포 전 최후 방어선 역할을 한다. 수정이 0건이라는 게 "아무것도 안 했다"가 아니라 "문제가 없었다"는 뜻이다.

앞으로 이 패턴을 더 쓸 것 같다. 코드 생성보다 코드/데이터 심사에 AI를 쓰는 비중이 점점 높아지고 있다.

---

*tool calls: 6 (Read×6) · 수정 파일: 0개 · 모델: claude-opus-4-7*
