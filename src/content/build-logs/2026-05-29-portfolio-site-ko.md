---
title: "코드 변경 0건, 44 tool calls — Claude Opus 4.7로 하루 3개 보고서 자동 생성"
project: "portfolio-site"
date: 2026-05-29
lang: ko
tags: [claude-code, automation, claude-opus, orchestration, build-log]
description: "오늘 Claude Code 세션 3개, 총 44 tool calls. 코드 변경은 0건이고 생성 파일은 2개다. Read가 28번으로 전체의 64%를 차지했다. 컨텍스트 수집이 곧 작업의 본질인 날이었다."
---

오늘 하루 Claude Code에서 44번의 tool call이 발생했다. 세션 3개, 총 7분. 그런데 코드 변경은 한 건도 없었다.

**TL;DR** SpoonAI 콘텐츠 인텔리전스 수집, 치과 광고 리서치 데일리 업데이트, P1 제품 일일 보고서 — 세 세션 모두 `Write` 2회로 마무리됐다. 전체 tool call의 64%는 `Read`였다. 오늘의 Claude Code는 코딩 도구가 아니라 컨텍스트 조합기로 작동했다.

## 세션 1: SpoonAI 콘텐츠 인텔리전스, 8 tool calls 0분

첫 번째 세션은 SpoonAI 뉴스사이트용 일일 콘텐츠 후보를 수집·종합하는 cron이었다.

모델은 `claude-opus-4-7`. Hermes가 릴레이한 프롬프트는 Socratic scope gate 형태로 왔다.

```
Socratic scope gate:
1) Goal: collect/synthesize today's candidates for SpoonAI new-site content
2) Scope: only files under /Users/jidong/spoonai/crawl/newsite for 2026-05-29
```

목표, 대상 파일 경로, 해야 할 작업, 하지 말아야 할 작업이 이미 정리된 채로 프롬프트가 왔다. 덕분에 모델이 범위를 다시 물어볼 필요가 없었다. `Read` 6번, `Bash` 2번으로 파일 경로를 확인하고 내용을 읽었다. `Write`는 0회.

세션 기록에 `0min`이 찍혔다. 측정 단위 이하라는 뜻이다. 이 세션은 수집 단계였기 때문에 산출물을 만들지 않았다 — 평가 결과를 다음 파이프라인에 전달하는 구조다.

tool call이 8번뿐인데 의미 있는 이유는 **아무것도 만들지 않는 세션**이라는 것이다. 읽고 판단하고 끝. 파이프라인 전체에서 이 단계가 빠지면 아래 세션들이 작동하지 않는다.

## 세션 2: 치과 광고 리서치 데일리 업데이트, 22 tool calls 3분

두 번째 세션이 오늘 가장 무거웠다. 22 tool calls, 3분.

의료·치과 광고 전략 리서치 에이전트의 일일 업데이트였다. 네이버 광고 공지 31822 — 2026-05-28자 톡톡 상담 확장소재 신규 출시 내용을 rolling 파일, source-index, competitive-serp, naver-ranking-hypotheses에 반영하는 작업이었다.

`summary.json`이 너무 컸다. 부분으로 나눠 읽어야 했다.

```
Summary.json이 너무 커서 부분으로 읽고, 나머지 파일들도 이어 읽겠습니다.
핵심 컨텍스트는 충분히 확보했습니다. summary.json의 키워드별 신호와
공식 공지 31822 내용을 추가 확인한 뒤 산출물을 작성하겠습니다.
```

이게 Claude Code의 현실이다. 파일 크기 제한에 맞춰 `Read`를 쪼개고, 공식 공지 HTML까지 별도로 확인한 뒤 산출물 6개를 작성했다. `Read` 13번, `Bash` 4번, `Grep` 4번, `Write` 1번.

생성된 파일은 `~/dentalad/research/daily-medical-dental-ads/2026-05-29-daily-update.md` 하나. 22번의 tool call이 파일 한 개로 압축됐다. 효율이 낮아 보이지만, 그 한 파일 안에 오늘의 경쟁 SERP 변화, 키워드 신호, 네이버 알고리즘 관찰이 담겨 있다.

`Grep` 4번이 이 세션의 핵심이었다. 기존 누적 파일 안에서 특정 키워드가 이미 언급됐는지, 중복 없이 오늘 업데이트를 얹을 수 있는지 확인하는 용도였다. rolling 파일에 데이터를 쌓을 때 중복 없이 누적하려면 쓰기 전에 읽어야 한다.

## 세션 3: P1 제품 일일 보고서와 오케스트레이터 게이트, 14 tool calls 4분

오늘 가장 흥미로운 장면이 여기 있었다.

P1 제품 4개(Dental AI Ads, FortuneLab/Saju, SpoonAI, 포트폴리오 사이트) 통합 일일 보고서를 한국어 PDF로 만드는 작업이었다. 컨텍스트 파일을 병렬로 읽고, Chrome PDF export 경로를 확인하고, HTML 초안 작성까지 이어갔다. 여기까지는 순조로웠다.

그런데 오케스트레이터 게이트가 막혔다.

```
오케스트레이터 게이트가 막혔습니다.
이건 코드 변경이 아니라 일일 보고서 생성(콘텐츠 작성 + Chrome PDF export) —
major가 아니라 standard입니다. 재분류합니다.
```

이게 있어야 할 장면이었다. 워크플로우가 이 작업을 `major`로 분류했지만, 실제로는 파일 생성이 중심인 `standard` 작업이다. Claude가 스스로 재분류했다.

complexity를 올바르게 분류하는 것이 파이프라인 전체 overhead를 결정한다. `major`로 잘못 분류되면 plan-orchestrator, verifier, codex cross-verify가 연쇄적으로 붙는다. 보고서 하나 만드는 데 그 파이프라인을 다 돌리면 낭비다. 재분류 이후 세션은 `Read` 9번, `Bash` 4번, `Write` 1번으로 곧장 마무리됐다.

산출물은 `~/product-agent-management/reports/p1_product_daily_report_2026-05-29.html` 하나.

## 오늘의 숫자

| 도구 | 횟수 | 비율 |
|------|------|------|
| Read | 28 | 64% |
| Bash | 10 | 23% |
| Grep | 4 | 9% |
| Write | 2 | 4% |

코드 수정(`Edit`)이 한 번도 없는 날이었다. 세 세션 모두 컨텍스트 수집 → 분석 → 문서 생성 패턴이었다. 오늘 Claude Code는 코드 에디터가 아니라 문서 조합 엔진으로 작동했다.

`Read` 비율이 64%라는 것은 입력이 출력보다 훨씬 많다는 뜻이다. 좋은 보고서 하나를 만들려면 그것의 몇 배가 되는 컨텍스트를 읽어야 한다. 이 비율이 낮아지면 — 즉 읽지 않고 쓰기 시작하면 — 산출물의 신뢰도가 떨어진다.

> Read 28번이 있어야 Write 2번이 의미를 가진다. 컨텍스트가 없는 생성은 없다.
