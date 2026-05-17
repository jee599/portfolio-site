---
title: "Claude Opus 4.7로 치과 광고 컴플라이언스 검수 자동화 — 9번의 도구 호출로 OK 판정까지"
project: "portfolio-site"
date: 2026-05-17
lang: ko
tags: [claude-code, compliance, dental-ad, automation, claude-opus]
description: "Claude Opus 4.7로 치과 광고 컴플라이언스를 자동 검수했다. 2세션, 9번의 tool call로 모순 사실·병원 실명 노출·보장성 표현 등 의료광고법 위반 여부를 체크하고 OK 판정까지 받는 과정을 기록한다."
---

2세션, 9번의 tool call, 결과는 단 두 글자 — **OK**.

치과 광고 컴플라이언스 검수를 Claude Opus 4.7에게 맡겼다. 수동으로 했다면 파일 두 개를 열고, 내용을 비교하고, 의료광고법 기준으로 항목별로 체크해야 했을 작업이다. Claude는 9번 도구를 쓰고 판정을 내렸다.

**TL;DR** Bash 5번, Read 4번으로 일일 업데이트 `.md`와 HTML 리포트를 교차 검수했다. 병원 실명 노출, 보장 표현, 출처 미표기 등 블로킹 이슈 없음.

## 검수가 필요한 이유

치과 광고에는 의료법 56조가 적용된다. "예약 보장", "효과 보장", "최고의 시술" 같은 표현이 들어가면 위반이다. 병원 이름이나 주소가 유저 대면 콘텐츠에 직접 노출돼도 문제다. 매일 생성되는 리포트마다 이걸 손으로 확인하는 건 비현실적이다.

자동화 포인트는 명확하다. 정해진 기준으로 파일을 읽고, 두 파일 간 사실 모순을 찾고, 블로킹 이슈 목록을 뽑으면 된다.

## 첫 번째 세션: 기준 설정과 탐색

첫 프롬프트는 이랬다:

```
Read the daily update and HTML report for 2026-05-17 under
/Users/jidong/dentalad/research/daily-medical-dental-ads.
Check for contradictions, unsupported claims, accidental
hospital names/addresses, or missing required labels.
Return concise blocking issues only, or OK if none.
```

Claude는 Bash 5번, Read 2번을 썼다. 파일 구조를 확인하고, 두 파일을 읽고, 기준에 맞게 내용을 검토했다. 이 세션에서 소요된 시간은 체감상 30초 이내.

## 두 번째 세션: 블로킹 기준을 명시적으로 열거

첫 세션 결과를 확인한 뒤 더 엄격한 기준으로 두 번째 검수를 돌렸다.

```
Blocking review only. Read these two files:
research/daily-medical-dental-ads/2026-05-17-daily-update.md
research/daily-medical-dental-ads/reports/2026-05-17-info-keyword-ai-and-local-serp-patterns.html.

Answer exactly OK if no blocking issue. Blocking issues:
contradictory facts between the two files,
named hospitals/addresses in user-facing summary/report,
missing source/label caveats,
or claims of guaranteed rankings/reservations/revenue.
```

기준을 더 명시적으로 열거했다. 모순 사실, 병원 실명/주소, 출처 미표기, 순위/예약/매출 보장 주장. Read 2번으로 두 파일을 읽고 판정: **OK**.

## 도구 사용 통계

| 도구 | 횟수 |
|------|------|
| Bash | 5 |
| Read | 4 |
| 합계 | 9 |

수정 파일: 0개. 생성 파일: 0개. 순수 검수만 했다.

## 프롬프트 설계에서 배운 것

두 세션의 차이는 프롬프트 구체성이다. 첫 번째는 "블로킹 이슈를 찾아라"는 방향을 줬고, 두 번째는 블로킹 이슈의 정의를 직접 열거했다.

두 번째 방식이 더 안정적이다. `guaranteed rankings/reservations/revenue`처럼 위반 표현을 명시하면 판단 기준이 고정된다. 모델이 알아서 해석하는 부분을 줄일수록 검수 결과의 일관성이 올라간다.

`Answer exactly OK if no blocking issue`라는 지시도 중요했다. 출력 형식을 고정해야 후속 파이프라인에서 파싱이 가능하다.

## 자동화 루프로 가는 방향

지금은 수동으로 프롬프트를 실행하는 구조다. 다음 단계는 GitHub Actions에 붙이는 것이다. 매일 리포트가 생성되면 자동으로 검수 세션을 돌리고, OK가 아니면 Slack으로 알림을 보내는 흐름이다.

Claude Opus 4.7은 이런 반복 검수 작업에 과스펙일 수 있다. Haiku나 Sonnet으로도 동일한 판정이 가능한지 비용 대비 품질 테스트가 남아 있다.
