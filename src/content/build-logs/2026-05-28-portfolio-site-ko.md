---
title: "Claude Code로 하루 9세션, 코드 0줄 — 보고서·리서치·인텔 자동화 패턴"
project: "portfolio-site"
date: 2026-05-28
lang: ko
tags: [claude-code, automation, hermes, research, workflow]
description: "141 tool calls, 9개 세션, 코드 변경 0줄. Claude Code를 코딩 도구가 아닌 리서치·보고서 자동화 엔진으로 쓴 하루의 기록이다."
---

141번의 tool call이 발생했다. 세션은 9개. 근데 수정된 코드 파일은 0개다.

**TL;DR** Claude Code를 코딩 도구가 아니라 리서치·인텔 수집·보고서 생성 엔진으로 썼다. Hermes가 요청을 중계하고, Claude CLI가 실제 분석·작성을 담당하는 역할 분리 패턴이 핵심이었다.

## Read 42번, Write 5번 — 이게 리서치 세션의 비율이다

이날 도구 사용 분포는 이랬다.

- Bash: 78번
- Read: 42번
- WebFetch: 15번
- Write: 5번
- ToolSearch: 1번

Read가 42번, Write가 5번. 비율이 약 8:1이다. 코딩 세션이었다면 Edit이 압도적으로 많았을 것이다. 이날은 데이터를 읽고 종합하는 작업이 대부분이었다.

Bash 78번은 주로 파일 존재 확인, 디렉토리 탐색, 이전 산출물 tail 확인이었다. 실행 결과를 보고 다음 판단을 내리는 사이클이 78번 돌았다는 뜻이다.

## 세션 패턴: 짧게 쪼개고, 명확하게 넘긴다

9개 세션의 소요 시간을 보면 특이한 패턴이 보인다.

- 0분짜리 세션 2개
- 1~2분짜리 세션 4개  
- 4분짜리 세션 2개
- 8분짜리 세션 1개

대부분 4분 이하다. 짧다고 작업 품질이 낮은 게 아니다. 각 세션에 목표와 범위가 명확하게 정의되어 있었기 때문이다. 세션을 짧게 유지할 수 있는 건 프롬프트 설계 덕분이다.

스펙이 좋은 프롬프트의 구조는 이랬다.

```
# Socratic intake

Goal: 2026-05-27 한국 의료·치과 광고 데일리 리서치 결과를 정리한다.
Scope: /Users/jidong/dentalad/research/daily-medical-dental-ads/ 아래만 생성/업데이트
실제 작업: 일일 업데이트, rolling-knowledge-base, source-index 생성
하지 않을 작업: 기존 사이트/배포/이메일 수정
가정: ...
```

목표·범위·제외 항목을 명시하면 Claude가 확인 질문 없이 바로 실행한다. "이게 맞나요?" 같은 루프가 없어진다.

## Hermes → Claude CLI: 중계와 실행의 분리

이날 세션들은 대부분 Hermes가 중계한 요청이었다. Hermes는 Telegram이나 다른 채널에서 요청을 받아 Claude CLI에 넘긴다. 여기서 중요한 설계 원칙이 있다.

> Hermes는 작업자가 아니다. 디자인·구현·수정·산출물 제작은 Claude CLI가 한다.

실제 프롬프트에는 이게 명시되어 있었다.

```
너는 Claude CLI, the actual report writer. Hermes is only the relay.
```

이 구분이 없으면 Hermes가 직접 HTML이나 보고서를 만들어버리는 문제가 생긴다. Hermes가 만든 결과는 검증이 안 된다. Claude CLI가 파일을 읽고, 웹을 조회하고, 실제 산출물을 쓰는 작업자여야 한다.

세션 7은 극단적인 예시였다. 2번의 tool call만 발생했다. Read 1번, Bash 1번. 브리프를 읽고 바로 판단해서 처리했다.

## WebFetch 15번: 실시간 데이터가 필요한 순간

SpoonAI 성장 신호 수집 세션에서 WebFetch가 15번 발생했다. 이 세션은 Product Hunt, Show HN, GitHub trending에서 AI 제품 출시 신호를 직접 긁어오는 작업이었다.

raw JSON 데이터만으로는 부족한 부분이 있었다. Reddit/HN 데이터가 비어있고, GitHub은 대형 repo 위주였다. 그래서 Product Hunt와 Show HN을 직접 조회했다.

```
Product Hunt, Show HN을 직접 조회하겠습니다.
추가 소스를 병렬로 수집하겠습니다.
경쟁 뉴스레터와 Show HN 추가 확인하겠습니다.
```

세션 중간에 이런 의사결정이 일어났다. 처음 계획에 없던 소스를 추가하는 판단을 Claude가 했다. 이게 단순한 스크립트 실행과 다른 점이다. 데이터가 비어있으면 다른 소스를 찾는 판단을 한다.

## 삽질: 세션이 너무 길어졌을 때

세션 9는 8분이었다. 이날 가장 길었다. 사용자가 중간에 요청을 중단했다.

```
[Request interrupted by user]

중단. 너무 오래 생각하지 말고 admission_cases_brief.md 기준으로
바로 두 파일만 작성해. Write tool만 사용해.
```

생각이 너무 길어졌다. 브리프를 읽고 파악하는 데 시간이 걸렸던 것이다. 사용자가 끊고 다시 명확하게 지시하자, 즉시 실행으로 전환됐다. 이후 Bash 3번, Read 3번, Write 1번으로 완료했다.

이런 패턴에서 배울 점이 있다. 출력 파일이 2개뿐인 단순 작업은 처음부터 "Write tool만 사용해"를 명시하는 게 빠르다. 복잡한 계획 수립 없이 바로 작성으로 들어가도 결과 품질이 떨어지지 않는다.

## 오늘 만들어진 것들

Write 5번으로 생성된 파일들이다.

- `2026-05-27-growth-sponsor-signals.md` — SpoonAI 성장 신호 보고서
- `2026-05-27-daily-intel.md` + `.json` — AI 인텔 데일리 요약
- `report.html` + `short_summary.md` — SpoonAI/fortunelab 분석 보고서
- `ai_masters_admission_cases_interview_report.html` — 석사 입학 케이스 보고서

코드 파일은 없다. 전부 분석 산출물이다. Claude Code를 코드 생성이 아닌 구조화된 리서치 도구로 썼을 때의 일일 출력물이다.

> 코딩보다 판단이 많은 날은 tool call 비율이 바뀐다. Bash > Read >> Write. 이 패턴이 나오면 그날은 리서치 모드다.
