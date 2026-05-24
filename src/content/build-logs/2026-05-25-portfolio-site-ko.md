---
title: "Claude Code 리서치 에이전트 — 9분, 26 tool calls로 의료광고 데일리 KB 완성"
project: "portfolio-site"
date: 2026-05-25
lang: ko
tags: [claude-code, automation, research, dental-ad]
description: "Claude Opus 4.7로 의료·치과 광고 데일리 리서치를 자동화했다. 9분, 26 tool calls로 누적 KB 업데이트 + HTML 보고서 생성까지 완료한 에이전트 패턴을 정리한다."
---

26번의 tool call, 9분. `rolling-knowledge-base.md` 업데이트, 데일리 리포트 생성, 경쟁사 SERP 관찰 기록, HTML 보고서까지 한 세션에 끝났다.

**TL;DR** Claude Opus 4.7을 리서치 에이전트로 써서 의료·치과 광고 경쟁분석 KB를 데일리로 자동 업데이트하는 패턴을 검증했다. 핵심은 대용량 JSON을 grep으로 먼저 뽑고, 기존 문서에 append-only로 붙이는 방식이다.

## 배경: 반복 리서치를 에이전트에 넘기다

의료·치과 광고 캠페인을 운영하면서 경쟁사 SERP와 키워드 비용 추이를 매일 추적해야 했다. 기존 방식은 수동으로 `daily-update.md`를 작성하고, `rolling-knowledge-base.md`에 항목을 붙이고, 소스 인덱스를 관리하는 일이었다. 반복적이고 구조적이라 에이전트에 넘기기 좋은 작업이다.

세션은 아래 요청으로 시작했다:

> "의료·치과 광고 최신전략 리서치 에이전트로서 2026-05-24 공식/준공식 자료와 공개 SERP 표본을 반영해 데일리 업데이트, 누적 KB, 소스 인덱스, 경쟁 SERP 관찰, 상위노출 운영 가설을 업데이트하고 필요 시 모바일 HTML 보고서를 만든다."

소크라테스식 인테이크 없이 곧바로 작업 지시를 담아 보냈고, Claude는 파일 확인부터 시작했다.

## 에이전트가 실제로 한 일

세션을 분해하면 크게 세 단계다.

**1단계 — 컨텍스트 파악 (Read 10회)**

먼저 기존 산출물을 전부 읽었다. `2026-05-23-daily-update.md`, `rolling-knowledge-base.md`, `source-index.md`, `competitive-serp-observations...`까지. 큰 파일은 chunked read로 나눠 읽었고, 이미 어디까지 작성됐는지 파악한 뒤 오늘 분량만 추가하는 전략을 택했다.

**2단계 — 대용량 JSON 처리 (Bash 12회)**

`sources/serp-2026-05-24/summary.json`은 통째로 읽기엔 너무 컸다. 여기서 Bash grep을 적극적으로 썼다:

```bash
grep -E '"keyword"|"cpc"|"position"' sources/serp-2026-05-24/summary.json | head -100
```

전체 JSON을 Read 도구로 로드하지 않고 필요한 키만 추출했다. 이 패턴이 token 낭비를 막는 핵심이었다. Bash가 12번 중 절반 이상이 이런 grep·head 조합이었다.

**3단계 — 산출물 생성 (Write 2회, Edit 2회)**

파악이 끝난 뒤 Write 2회로 신규 파일 두 개를 만들었다:

- `2026-05-24-daily-update.md` — 오늘 분석 요약
- `reports/2026-05-24-cost-keyword-serp-split.html` — 모바일 최적화 HTML 보고서

Edit 2회는 기존 `rolling-knowledge-base.md`와 `source-index.md`에 5/24 항목을 append하는 데 썼다.

## 대용량 파일 처리 패턴

리서치 에이전트를 쓸 때 가장 흔한 실수는 모든 파일을 처음부터 통째로 로드하는 것이다. 이 세션에서 효과적이었던 패턴은 두 가지다.

**grep-first 패턴**: JSON이든 마크다운이든, 우선 grep으로 필요한 줄만 뽑는다. 전체를 읽는 건 마지막 수단이다.

**append-only 편집**: 기존 문서를 통째로 수정하지 않고 끝에 오늘 날짜 섹션만 추가했다. Edit 범위가 최소화되고, diff가 명확해진다.

```bash
# rolling-knowledge-base.md 끝부분 확인 후 append 위치 특정
tail -30 rolling-knowledge-base.md
```

Read 대신 Bash tail로 끝 부분만 확인하고, Edit old_string에 마지막 단락을 넣어 그 뒤에 신규 내용을 붙였다.

## tool call 분포

| 도구 | 횟수 | 주요 용도 |
|------|------|-----------|
| Bash | 12 | grep, head, tail, state 설정 |
| Read | 10 | 기존 파일 chunked 읽기 |
| Write | 2 | 신규 파일 생성 |
| Edit | 2 | 기존 KB append |

Read가 10회인 이유는 큰 파일을 분할해서 읽었기 때문이다. `rolling-knowledge-base.md`는 세 번에 나눠 읽었다. 통째로 한 번에 읽는 것보다 원하는 섹션을 offset으로 지정해서 읽는 게 훨씬 효율적이다.

## 모델 선택: Opus 4.7을 쓴 이유

이 세션은 `claude-opus-4-7`로 돌렸다. 리서치 에이전트에서 Opus를 택하는 기준은 단순하다. 여러 문서의 맥락을 동시에 유지하면서 새 내용을 일관된 톤으로 작성해야 할 때, Sonnet보다 Opus가 훨씬 안정적이다.

데일리 업데이트처럼 이전 날의 패턴을 이어받아야 하는 작업은 모델이 컨텍스트를 오래 붙잡고 있어야 한다. 9분 세션에서 10개 파일을 읽고 4개 산출물을 냈다는 게 그 결과다.

## 자동화 한계와 다음 단계

이번 패턴의 한계도 명확하다. SERP 데이터 수집 자체는 아직 수동이다. `sources/serp-2026-05-24/summary.json`은 사람이 직접 만들어 넣어야 한다. 다음 단계는 Google Custom Search API나 Playwright로 SERP 표본을 자동 수집해서 에이전트에 넘기는 파이프라인을 붙이는 것이다.

또 HTML 보고서는 생성됐지만 배포가 자동이 아니다. Cloudflare Pages에 자동으로 올라가도록 GitHub Actions와 연결하면 진짜 "수동 개입 없는" 데일리 리포트가 된다.

## 정리

- grep-first + append-only 패턴이 리서치 에이전트의 token 낭비를 막는다
- 대용량 JSON은 Read 말고 Bash grep으로 먼저 키를 뽑는다
- 9분, 26 tool calls면 데일리 KB 업데이트 + HTML 보고서까지 충분하다
- Opus 4.7은 다문서 컨텍스트 유지가 필요한 리서치 작업에 적합하다
