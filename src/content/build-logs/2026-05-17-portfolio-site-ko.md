---
title: "Claude Opus를 의료광고 컴플라이언스 게이트로 — 9번의 도구 호출, 블로킹 이슈 0건"
project: "portfolio-site"
date: 2026-05-17
lang: ko
tags: [claude-code, compliance, prompting, automation]
description: "Claude Opus를 코드 작성이 아닌 의료광고 컴플라이언스 검토 게이트로 활용한 실전 패턴. 2세션 9 tool calls로 마크다운·HTML 두 파일을 교차 검증하고 블로킹 이슈 0건을 확인했다."
---

의료광고 컴플라이언스 검토에 Claude Code를 쓴다. 코드를 짜는 게 아니라, 생성된 콘텐츠가 배포 전에 법적 기준을 통과하는지 확인하는 게이트로 쓴다. 오늘은 그 패턴을 정리한다.

**TL;DR** Claude Opus에 블로킹 기준을 명확히 주면 2 tool calls만으로 마크다운 + HTML 두 파일을 교차 검증하고 pass/fail을 돌려준다.

## 왜 Claude Code를 컴플라이언스 게이트로 쓰나

치과 광고 자동화 프로젝트(`dentalad`)는 매일 키워드 분석 리포트를 생성한다. 여기서 문제가 생긴다. AI가 생성한 콘텐츠에는 다음이 섞여 들어올 수 있다.

- 두 파일 사이의 수치 모순 (daily update vs. HTML 리포트)
- 특정 병원명 또는 주소 노출 (의료광고법상 비교 광고 금지 위반)
- 출처 없는 단정적 순위 주장 ("1위 키워드" 식의 보장성 표현)
- 예약·매출 보장 뉘앙스

이걸 사람이 매번 읽으면 시간이 걸린다. 그냥 Claude한테 맡긴다.

## 첫 번째 시도 — 7 tool calls

처음 프롬프트는 범위가 넓었다.

```
Read the daily update and HTML report for 2026-05-17 under
/Users/jidong/dentalad/research/daily-medical-dental-ads.
Check for contradictions, unsupported claims, accidental
hospital names/addresses, or missing required labels.
Return concise blocking issues only, or OK if none.
```

이 프롬프트로 Bash 5번, Read 2번 — 총 7 tool calls가 나왔다. Bash 호출이 많다는 건 파일 탐색에 시간을 썼다는 뜻이다. 경로 패턴이 불명확해서 어떤 파일을 읽어야 하는지 Claude가 먼저 찾아야 했다.

결과는 이상 없음이었지만, 효율이 좋지 않았다.

## 두 번째 시도 — 2 tool calls

경로를 명시하고 블로킹 기준을 목록화했다.

```
Blocking review only. Read these two files:
research/daily-medical-dental-ads/2026-05-17-daily-update.md
research/daily-medical-dental-ads/reports/2026-05-17-info-keyword-ai-and-local-serp-patterns.html

Answer exactly OK if no blocking issue.
Blocking issues:
- contradictory facts between the two files
- named hospitals/addresses in user-facing content
- missing source/label caveats
- claims of guaranteed rankings/reservations/revenue
```

Read 2번만 사용하고 바로 결과가 나왔다. **OK**.

7 tool calls → 2 tool calls. 차이를 만든 건 프롬프트에서 두 가지다.

1. **파일 경로 직접 명시**: Claude가 파일을 찾는 데 Bash를 쓰지 않아도 된다.
2. **블로킹 기준 열거**: "이 네 가지 중 하나라도 있으면 fail, 없으면 OK"라고 딱 잘라 주면 Claude가 판단 범위를 좁힌다.

## 이 패턴에서 배운 것

**Claude Code는 코딩 도구가 아니다.** 정확히는, 코딩 이외에도 쓸 수 있다. 오늘 두 세션에서 수정된 파일은 0개다. 생성된 파일도 0개다. 그런데도 의미 있는 작업이 됐다.

콘텐츠 파이프라인에서 이런 게이트는 중요하다. AI가 생성한 콘텐츠를 다시 AI가 검토하는 구조는, 단순 반복처럼 보이지만 실제로는 역할 분리다. 생성 모델은 창의성을 극대화하고, 검토 모델은 제약 조건만 본다. 같은 Claude라도 프롬프트가 다르면 다른 역할을 한다.

**블로킹 기준을 명문화하는 게 핵심이다.** "잘못된 내용 있으면 알려줘"는 너무 모호하다. 무엇이 잘못인지 정의하지 않으면 Claude도 판단 기준을 만들어야 하고, 그 기준이 매번 달라진다. 의료광고법 위반 항목처럼 법적 리스크가 있는 영역에서는 기준을 코드처럼 명확히 써야 한다.

```
Blocking issues:
- contradictory facts between the two files
- named hospitals/addresses in user-facing content
- missing source/label caveats
- claims of guaranteed rankings/reservations/revenue
```

이 네 줄이 오늘 컴플라이언스 검토의 전부다.

## 세션 통계

| | 세션 1 | 세션 2 |
|---|---|---|
| 날짜 | 2026-05-16 | 2026-05-16 |
| 모델 | claude-opus-4-7 | claude-opus-4-7 |
| Tool calls | 7 (Bash×5, Read×2) | 2 (Read×2) |
| 결과 | OK | OK |
| 수정 파일 | 0 | 0 |

두 세션 합계: 9 tool calls, 블로킹 이슈 0건.

## 다음으로 할 것

현재는 매일 수동으로 이 프롬프트를 실행한다. GitHub Actions나 cron으로 자동화하면 사람 개입 없이 게이트를 유지할 수 있다. 블로킹 이슈가 발생하면 Slack 알림으로 받는 구조가 자연스러운 다음 단계다.
