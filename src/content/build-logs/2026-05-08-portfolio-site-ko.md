---
title: "Claude 병렬 에이전트 4개로 네이버 알고리즘 딥리서치 — 35 tool calls, 2세션"
project: "portfolio-site"
date: 2026-05-08
lang: ko
tags: [claude-code, research, multi-agent, naver, dental-ad]
description: "Claude Code research 스킬로 4개 에이전트를 병렬 디스패치해 네이버 검색·플레이스·광고 알고리즘 변화를 분석했다. API 과부하 오류를 겪으면서도 35 tool calls, 2세션으로 최종 보고서를 완성한 과정."
---

21분 세션에서 Opus 4.7 에이전트 4개를 동시에 던졌다. 네이버 검색·플레이스·광고 알고리즘 변화 리서치를 병렬로 돌리는 실험이었다. 중간에 API Overloaded 에러가 한 번 터졌지만, 2세션 합산 35 tool calls로 최종 보고서를 완성했다.

**TL;DR** `research` 스킬의 4-에이전트 병렬 패턴을 실전 투입했다. 공식 확인 사실과 업계 관찰을 분리하는 증거 규율이 이 작업의 핵심이었다.

## research 스킬 — 병렬 디스패치 구조

`research` 스킬은 주제를 4개 각도로 분해해 에이전트를 동시에 띄운다. 이번에는 네이버 알고리즘 리서치를 이렇게 나눴다:

1. **공식 공지 분석** — 네이버 광고 공식 채널의 변경 이력
2. **자연검색/플레이스 랭킹** — 업계 커뮤니티와 SEO 실무자 관찰
3. **광고 매칭·지표** — ADVoost, 연관지수, 확장검색 변화
4. **병의원/치과 소재** — 의료광고 규제와 플레이스광고 교차

스킬이 생성하는 프롬프트 골격은 이렇다:

```
You are Research Agent #2. Your angle: 자연검색/플레이스 랭킹.
- WebSearch + WebFetch 적극 활용
- 1500단어 이내 마크다운 리턴
- 출처 URL 필수
- 자매 에이전트와 중복 영역 플래그
```

단일 메시지에서 `Agent` 툴 호출 4개를 동시에 보내는 방식이다. 순차로 돌리면 80분이 걸릴 작업이 21분으로 끝났다.

## API Overloaded — 세션 중간에 터진 에러

세션 1 후반부에 `API Error: Overloaded`가 발생했다. Opus 4.7 에이전트 4개가 동시에 돌던 상황이라 용량 한계에 걸린 것이다. 이미 에이전트 4개의 리서치 결과는 다 들어온 상태였고, HTML 보고서 통합 직전에 뻗었다.

해결은 간단했다. 세션 1의 산출물(`research-minutes.md`, `claude_naver_research_report.md`)을 그대로 두고 세션 2에서 synthesis만 처리했다. 상태를 파일로 떨어뜨리는 워크플로우 덕분에 작업 손실이 없었다.

## 세션 2 — 증거 규율 편집

세션 2(5분, 11 tool calls)의 핵심은 세 파일의 교차검증이었다:

- `integrated_naver_change_report_draft.md`
- `codex_crosscheck_review.md`
- `naver_ads_notice_extracts.json` (15건 공식 공지 추출)

Codex 리뷰가 지적한 문제는 명확했다. "2026-05 플레이스광고 적용 공지"가 JSON 추출본에 없는데 보고서 본문에 포함돼 있었다. 이걸 `확인 필요`로 격하하는 것이 핵심 편집이었다.

최종 `claude_synthesis_review.md`에서 확립한 규칙:

```
공식 확인 가능 = 광고 공지에 명시된 것만
  확장검색, ADVoost, 연관지수, 병의원 소재 심사, 브랜드검색

공식 확인 불가 = "관찰", "업계 보고" 표현 사용
  자연검색/플레이스 일반 랭킹 변화
  2026-05 플레이스광고 적용 공지 (JSON 추출본에 부재)
```

알고리즘 변화를 다룰 때 "최근 알고리즘 변화로 인해..."처럼 쓰면 오보가 된다. 공식 공지와 업계 관찰을 분리하는 작업이 리서치의 실질적인 품질을 결정한다.

## 도구 사용 통계

| 도구 | 횟수 |
|------|------|
| Read | 9 |
| Bash | 8 |
| Agent | 8 |
| Write | 4 |
| TodoWrite | 3 |
| Grep | 1 |
| Skill | 1 |
| ToolSearch | 1 |
| **합계** | **35** |

생성 파일은 3개: `research-minutes.md`, `claude_naver_research_report.md`, `claude_synthesis_review.md`. 수정 파일은 0개.

## 병렬 리서치 패턴에서 배운 것

에이전트 4개를 동시에 던지면 속도는 4배가 되지만, 합성이 더 어려워진다. 각 에이전트가 독립적으로 "알고리즘 변화"를 다루다 보면 같은 사실을 서로 다른 확신도로 주장하는 상황이 생긴다. 이를 해결하는 방법은 두 가지다.

첫째, 에이전트 간 중복 영역을 명시적으로 플래그하게 한다. 스킬 프롬프트에 "자매 에이전트와의 중복 영역 플래그"를 넣는 이유다.

둘째, synthesis 단계에서 원본 소스(`naver_ads_notice_extracts.json` 같은 1차 자료)와 에이전트 요약을 교차검증한다. 에이전트는 환각할 수 있고, Codex crosscheck은 그걸 잡는다.

산출물을 파일로 유지하면 API가 죽어도 이어받을 수 있다. 세션이 중간에 끊겨도 손실 없이 재개한다는 것이 이번 작업에서 검증됐다.
