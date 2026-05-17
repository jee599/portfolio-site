---
title: "치과 광고 의료법 컴플라이언스 자동 검토: Claude Code 9번 tool call로 차단 이슈 0건"
project: "portfolio-site"
date: 2026-05-18
lang: ko
tags: [claude-code, compliance, dental-ads, automation, 의료법]
description: "Claude Code 2개 세션·9번의 tool call로 치과 광고 의료법 컴플라이언스 자동 검토. 허위 사실·병원명 노출·미표기 차단 기준을 명시한 프롬프트 설계와 Read+Bash 패턴."
---

치과 광고 문서 두 개를 읽고 "의료법 위반 소지 있으면 알려라"고 Claude Code에 던졌다. 2개 세션, 9번의 tool call, 결과는 `OK`. 30분짜리 검토 작업이 0분이 됐다.

**TL;DR** 차단 기준을 프롬프트에 명시하면 Claude Code는 Read + Bash 패턴으로 문서를 훑고 일관된 판정을 내린다. 기준이 명확할수록 결과가 안정적이다.

## 무엇을 검토했나

`dentalad` 프로젝트의 일일 업데이트 문서와 HTML 리포트가 대상이었다. 두 파일은 동일한 날짜(`2026-05-17`)의 내용을 담고 있다. `2026-05-17-daily-update.md`는 마크다운 요약본이고, `2026-05-17-info-keyword-ai-and-local-serp-patterns.html`은 렌더링된 분석 보고서다.

의료광고에서 문제가 되는 건 크게 네 가지다. 첫째, 두 문서 사이의 **사실 모순**. 같은 날짜 데이터인데 수치나 결론이 다르면 신뢰성 문제다. 둘째, **근거 없는 주장** — "1위 보장", "예약 보장", "매출 보장" 같은 표현은 의료법 위반이다. 셋째, **병원명·주소 노출** — 특정 병원을 실명으로 지목하는 건 광고 심의 위반 소지가 있다. 넷째, **출처·주의 표기 누락** — 조사 데이터와 AI 생성 콘텐츠는 반드시 출처와 한계를 명시해야 한다.

이 네 가지를 사람이 직접 확인하면 매번 20~30분이 걸린다. Claude Code에 위임하면 반복 작업이 사라진다.

## 첫 번째 세션: 포괄적 검토

첫 세션의 프롬프트는 이랬다:

```
Read the daily update and HTML report for 2026-05-17 under
/Users/jidong/dentalad/research/daily-medical-dental-ads.
Check for contradictions, unsupported claims, accidental
hospital names/addresses, or missing required labels.
Return concise blocking issues only, or OK if none.
```

"blocking issues only"가 핵심 지시어다. 사소한 문체 문제가 아니라, 실제로 배포를 막아야 하는 이슈만 돌려달라는 뜻이다. 잡음을 줄이기 위한 설계다.

Claude Code는 `Read` 2번으로 두 파일을 읽고, `Bash` 5번으로 파싱과 패턴 검색을 수행했다. HTML 파일에서 특정 텍스트를 추출하려면 `grep`이나 `sed` 같은 쉘 명령어가 필요하다. 순수 읽기만으로는 HTML 태그를 걷어낸 텍스트 비교가 어렵기 때문이다.

## 두 번째 세션: 기준을 명시한 재확인

첫 번째 검토로 충분할 수도 있었다. 그런데 두 번째 세션을 추가로 돌린 이유가 있다. 첫 프롬프트는 열거식 설명이었고, 두 번째는 **체크리스트 방식**으로 바꿔서 재확인했다.

```
Blocking review only. Read these two files:
research/daily-medical-dental-ads/2026-05-17-daily-update.md and
research/daily-medical-dental-ads/reports/2026-05-17-info-keyword-ai-and-local-serp-patterns.html.
Answer exactly OK if no blocking issue. Blocking issues:
contradictory facts between the two files, named hospitals/addresses
in user-facing summary/report, missing source/label caveats, or
claims of guaranteed rankings/reservations/revenue.
```

두 번째 프롬프트의 차이점은 두 가지다. 차단 기준을 불릿 형태로 나열했고, 이상 없으면 정확히 `OK`라고만 답하도록 강제했다. 모호한 "문제없어 보입니다" 대신 명확한 `OK` 한 단어를 받기 위해서다.

결과는 `Read` 2번, tool call 2개, 답변 `OK`. 첫 번째 세션(9 tool call)과 다른 건 프롬프트 설계의 밀도 차이다.

## 프롬프트 설계의 원칙

이 두 세션에서 배울 수 있는 건 프롬프트 설계다.

**기준이 모호하면 Claude는 주관적으로 판단한다.** "이상한 게 있으면 말해줘"는 너무 넓다. 어떤 날은 이슈로 잡고 어떤 날은 넘어갈 수 있다. 자동화 파이프라인에서 이런 비일관성은 치명적이다.

**기준이 명확하면 Claude는 게이트키퍼가 된다.** "다음 중 하나라도 해당하면 차단"이라는 형식은 체크리스트처럼 작동한다. 판단이 아니라 매칭이 된다.

**출력 형식을 강제하면 파싱이 쉬워진다.** `OK` 한 단어 또는 "BLOCK: 이유" 형식으로 강제하면, 이 결과를 다음 파이프라인에서 바로 쓸 수 있다. 사람이 읽고 해석할 필요가 없다.

## 세션 통계

| 항목 | 값 |
|------|-----|
| 세션 수 | 2 |
| 총 tool calls | 9 |
| `Read` | 4 |
| `Bash` | 5 |
| 수정 파일 | 0 |
| 생성 파일 | 0 |
| 차단 이슈 | 0 |

수정·생성 파일이 0개인 건 이 작업의 특성이다. 검토는 읽기와 판단만 한다. 코드를 바꾸지 않는다.

## 이 패턴이 쓸 수 있는 곳

Read + Bash 기반 컴플라이언스 검토 패턴은 치과 광고에만 국한된 게 아니다. **기준이 명확한 규칙 기반 검토**라면 어디든 적용된다.

법적 면책 문구 누락 확인, 개인정보 포함 여부 체크, API 응답에서 특정 필드 누락 감지, 릴리즈 노트의 breaking change 표기 누락 등 구조가 동일하다. "이 조건 중 하나라도 해당하면 차단, 아니면 OK"라는 패턴이다.

자동화의 가치는 이런 반복 검토 작업에서 나온다. 판단 기준이 안정적일수록 Claude를 신뢰할 수 있고, 사람의 시간은 예외 케이스에 집중할 수 있다.
