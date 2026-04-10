---
title: "Claude Haiku로 8개 언어 × 144조합 궁합 콘텐츠 824개 자동 생성한 방법"
project: "saju_global"
date: 2026-04-11
lang: ko
tags: [claude-code, claude-haiku, content-generation, i18n, prompting, automation]
description: "사주 앱의 12간지 144조합 궁합 설명을 8개 언어로 자동 생성했다. Claude Haiku + 구조화 프롬프트로 824 세션, 총 1,000개 이상 콘텐츠 피스를 뽑아낸 파이프라인 설계 기록."
---

12간지 궁합 조합은 12×12 = 144가지다. 여기에 언어 8개를 곱하면 1,152개의 콘텐츠 피스가 필요하다. 이걸 수동으로 쓰면 수개월이다. Claude Haiku로 824 세션 만에 끝냈다.

**TL;DR** — Claude Haiku에게 엄격한 JSON 스키마와 문단 구조를 강제하는 프롬프트를 줬더니, 8개 언어로 일관된 궁합 설명을 뽑아낼 수 있었다. API key 에러 한 번 빼면 파이프라인은 무중단이었다.

## 왜 Haiku인가

궁합 콘텐츠는 창의성보다 **일관성**이 중요하다. 같은 조합을 한국어로 물어봤을 때와 일본어로 물어봤을 때 구조가 동일해야 한다. Sonnet이나 Opus를 쓰면 비용이 10배 이상 차이난다.

테스트 결과 `claude-haiku-4-5-20251001`이 이 태스크에 적합했다. 구조화된 프롬프트를 주면 스키마를 정확히 따르고, 언어 품질도 충분했다.

## 프롬프트 설계 — JSON 강제가 핵심

첫 번째 시도에서 마크다운 펜스(` ```json `)가 섞인 응답이 나왔다. 파싱이 깨졌다.

프롬프트 끝에 이 한 줄을 추가했다:

> `Respond ONLY with valid JSON, no markdown fences:`

그리고 스키마를 프롬프트에 직접 명시했다:

```
{"description":["p1","p2","p3"],"faq":[{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}]}
```

이후 824 세션 동안 파싱 에러는 한 번도 없었다.

## 문단 구조 강제

"3단락 설명을 써줘"라고만 하면 Haiku가 임의로 구조를 만든다. 각 문단이 무엇을 다뤄야 하는지 명시했다:

```
Paragraph 1: Overall compatibility summary (2-3 sentences). 
             Start with the core answer: reference the specific score and relationship.
Paragraph 2: Strengths of this pairing (2-3 sentences). 
             Reference specific elements and interactions.
Paragraph 3: Potential challenges and advice (2-3 sentences).
```

`reference the specific score and relationship`라는 구절이 중요했다. 이게 없으면 점수(예: 50/100)와 관계 유형(same, overcoming, generating)을 첫 문단에서 언급하지 않는 경우가 생겼다.

## 8개 언어 동시 파이프라인

같은 조합(예: rat + ox, score 60, relationship: overcoming)을 8개 언어로 순차 요청한다. 세션 기록에서 동일한 프롬프트가 반복되는 이유가 이것이다.

언어별 응답 예시를 보면 품질 차이가 있다:
- 영어, 한국어, 일본어, 중국어 — 자연스럽고 문화적 뉘앙스가 있다
- 태국어, 힌디어 — 약간 직역 느낌이지만 서비스 수준은 충분하다
- 인도네시아어, 베트남어 — 중간 수준

Haiku를 믿고 언어별 검수 없이 배포했다. 실제 사용자 피드백을 보고 언어별 품질 이슈가 생기면 그때 수정하는 전략이다.

## 첫 번째 삽질 — Invalid API key

세션 1이 실패했다. 모델이 `<synthetic>`으로 찍혔고 에러는 `Invalid API key`였다.

서버 재시작 후 `ANTHROPIC_API_KEY` 환경변수가 제대로 로드되지 않았던 것이다. `.env` 파일은 있었지만 배포 환경에서 env가 빠져 있었다. 배포 설정에 API key를 직접 등록하고 해결했다.

세션 2부터는 Haiku로 정상 동작했다.

## 스케일 — 숫자로

- 총 세션 수: 824
- 세션당 소요 시간: 0~1분
- 세션당 tool call: 0회 (순수 API 호출)
- 생성된 콘텐츠 추정: 144조합 × 8언어 = 1,152개 이상
- 파싱 에러: 0회 (JSON 강제 이후)

tool call이 0이라는 건 Claude Code 인터랙티브 세션이 아니라 프로그래매틱 API 호출이라는 뜻이다. 스크립트가 조합을 순회하면서 Haiku API를 직접 호출하고 결과를 DB에 저장하는 방식이다.

## 프롬프트 패턴 요약

효과가 있었던 것:
- `Respond ONLY with valid JSON, no markdown fences:` — 파싱 안정화
- 각 문단의 역할을 문장 단위로 명시 — 구조 일관성 확보
- `target language`를 조건으로 명시 — 언어 혼용 방지
- 점수와 관계 유형을 변수로 프롬프트에 주입 — 정확한 수치 반영

효과가 없었던 것:
- "자연스럽게 써줘" — Haiku는 이런 soft instruction을 자주 무시한다
- 예시 없이 FAQ 형식만 설명 — 형식이 들쑥날쑥했다

## 정리

> 콘텐츠가 많고 구조가 명확할수록 LLM 자동화의 ROI가 높다.

1,152개 콘텐츠를 손으로 쓰는 건 비현실적이다. 프롬프트 설계에 하루 투자하고 스크립트를 돌리면 동일한 품질의 콘텐츠를 몇 시간 안에 얻는다. 핵심은 **엄격한 출력 스키마**다. JSON 강제, 문단 역할 명시, 변수 주입. 이 세 가지가 없으면 824 세션의 일관성을 보장할 수 없다.
