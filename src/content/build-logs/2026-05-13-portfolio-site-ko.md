---
title: "AI가 AI를 검수한다 — Claude Opus로 의료광고 브리핑 QA 자동화"
project: "portfolio-site"
date: 2026-05-13
lang: ko
tags: [claude-code, ai-qa, dental-ads, automation, content-verification]
description: "AI가 생성한 의료광고 브리핑을 AI로 검수하는 메타 QA 워크플로. 2세션 13 tool calls로 Notice ID, SERP 통계, AI 브리핑 빈도수를 교차검증했다."
---

AI가 만든 결과물을 AI로 다시 검수한다. 2세션, 13번의 tool call, 파일 수정 0건. 오늘은 코드 한 줄도 안 썼다.

**TL;DR** `research/daily-medical-dental-ads/` 산출물을 Claude Opus로 교차검증했다. Notice ID, SERP 통계, 키워드별 AI 브리핑 빈도수가 `summary.json`과 정확히 일치했다. 차단 이슈 없음.

## "OK면 OK라고만 해줘" — 이게 프롬프트가 됐다

첫 세션의 프롬프트는 길었다.

```
Review today's medical/dental ads daily update artifacts for factual consistency,
label discipline, and Telegram safety. Read these files only:
research/daily-medical-dental-ads/2026-05-13-daily-update.md,
research/daily-medical-dental-ads/reports/2026-05-13-ai-briefing-info-keyword-and-place-d1.html,
research/daily-medical-dental-ads/sources/serp-2026-05-13/summary.json.
Report only issues that must be fixed before delivery; if none, say OK.
```

핵심은 마지막 줄이다. "이슈만 리포트하고 없으면 OK라고 해라." 일반적인 검수 요청은 "꼼꼼하게 봐줘"라고 열어두는데, 그러면 사소한 것까지 다 출력된다. 이 프롬프트는 차단 이슈 유무만 물어본다.

두 번째 세션은 더 빠르게 설계됐다.

```
Quick review for blocking problems only.
Focus on factual consistency, labels, no specific hospital names/addresses
in user-facing report, and no unsupported metric claims.
Return 'OK' if no blocking issues, otherwise list fixes.
```

"blocking problems only"로 범위를 좁혔다. 디자인 피드백이나 문장 개선 제안은 필요 없다. 배포 전에 막아야 할 문제만.

## 뭘 검증했나 — 3가지 체크포인트

의료광고 자동화 브리핑에서 검수해야 할 건 크게 세 가지다.

**데이터 일치성**: 마크다운 데일리 업데이트와 HTML 보고서의 숫자가 `summary.json` 원본과 맞는지. 이번 검증에서 확인한 Notice ID는 31509, 30960, 31453, 30865, 31287, 31426, 31006, 31243, 31120, 31126 — 10개 전부 원본과 일치했다. SERP 키워드 10개 (로컬+치료 8개, 정보성 2개) 분류도 일치.

**레이블 규율**: 병원명·주소가 사용자 대면 보고서에 직접 노출되지 않는지. 의료광고법상 특정 병원 노출은 별도 허가 영역이라 자동 보고서에는 넣지 않는다. Grep 1번으로 확인했다.

**AI 브리핑 통계**: `임플란트 통증 기간` 키워드에서 AI 브리핑이 6회 감지됐다고 마크다운에 기재돼 있었다. `summary.json`의 같은 필드값과 교차했다. 일치.

두 번째 세션에서 Opus가 리포트한 결과는 이렇다.

> Notice IDs, SERP totals, AI 브리핑 6회 on `임플란트 통증 기간` — 전부 summary.json과 매치. 차단 이슈 없음.

## 도구 사용 통계

2세션, 총 13 tool calls.

Read 9번 (69%), Bash 3번 (23%), Grep 1번 (8%). Edit, Write는 0번. 순수한 읽기+비교 작업이다.

Read가 압도적으로 많은 건 3개 파일을 두 세션에서 각각 읽었기 때문이다. `daily-update.md`, HTML 보고서, `summary.json` — 세션 1에서 한 번, 세션 2에서 다시. 총 6번이 기본이고 나머지 3번은 추가 확인.

Bash 3번은 JSON 파싱이나 파일 크기 확인용이었을 가능성이 높다. 구체적인 명령은 세션 로그에 남아 있다.

## AI QA 워크플로의 실용성

이 패턴의 핵심은 **AI가 생성한 결과물의 사실 일치 여부를 AI에게 맡기는 것**이다. 인간이 직접 Notice ID 10개를 JSON과 대조하면 실수가 나온다. 집중력 문제도 있고, 숫자를 보다 보면 눈이 흐려진다.

Claude Opus는 세 파일을 읽고 비교하는 데 약 0분 걸렸다. 정확히는 tool call 시간이 있으니 체감 30~60초. 그 결과가 "OK"든 "수정 필요"든 인간 검수보다 빠르다.

한계도 있다. 이 워크플로는 **기계적 일치**만 확인한다. 문장의 논리 흐름, 의료법 적합성의 맥락적 판단, 특정 병원을 우회적으로 연상시키는 표현 — 이런 건 여전히 인간 리뷰가 필요하다. 하지만 숫자 일치, 필드 존재 여부, 금지 키워드 노출 같은 규칙 기반 체크는 Opus가 더 빠르고 정확하다.

## 정리

오늘 세션의 결과물은 코드가 아니다. "배포해도 됩니다"라는 판단이다.

AI 자동화 파이프라인이 길어질수록 각 단계의 출력을 신뢰할 수 있는지 확인하는 QA 레이어가 필요해진다. 그 QA를 사람이 하면 병목이 생긴다. AI로 하면 파이프라인 안에 검증이 인라인으로 들어간다.

프롬프트 설계가 결과를 결정한다. "꼼꼼하게 봐줘"와 "blocking issues만 리포트하고 없으면 OK"는 완전히 다른 출력을 만든다. 후자가 운영 자동화에 맞다.
