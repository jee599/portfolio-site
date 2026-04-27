---
title: "서브에이전트 12개 병렬 디스패치 — 하루 444 tool calls, 3개 프로젝트 동시 진행"
project: "portfolio-site"
date: 2026-04-27
lang: ko
tags: [claude-code, multi-agent, auto-publish, devto, parallel-agents]
description: "하루에 3개 세션, 444 tool calls, 3개 프로젝트 도메인. 서브에이전트 12개 병렬 디스패치로 치과 광고 리서치 보고서를 뽑고, DEV.to 3부작 시리즈를 발행하고, 사주 글로벌 결제 검증까지 한 날의 기록."
---

하루에 3개 세션, 444 tool calls. DEV.to 3부작 발행, 치과 광고 심층 리서치 6개 HTML 보고서, 사주 글로벌 Japan/SEA 시장조사까지. 모두 Claude Code 위에서 돌아갔다.

**TL;DR** 에이전트를 한 번에 12개씩 던지면 무엇이 가능한지, 그리고 그 결과물이 얼마나 믿을 수 있는지를 실험한 하루였다.

## DEV.to 3부작 — auto-publish 스킬이 실제로 어떻게 작동하나

시작은 단순한 요청이었다. "AI Git에서 유명한 프로젝트 4개 분석 글 DEV.to에 올려줘."

auto-publish 스킬은 Phase 1(소재 수집) → Phase 2(구조 제안) → Phase 3(콘텐츠 생성) → Phase 4(발행) 흐름으로 돌아간다. 프롬프트 하나가 스킬을 발동시키고, 스킬이 나머지 판단을 전부 한다.

Phase 2에서 나온 구조 제안:

| 편 | 제목 | 다룬 프로젝트 |
|---|---|---|
| Part 1 | Skills: When a Markdown File Got 100K Stars | `andrej-karpathy-skills` + `hermes-agent` |
| Part 2 | OpenClaw: The Local AI Gateway | OpenClaw (295K+ stars) |
| Part 3 | Terminal Agents | OpenCode + 오픈소스 터미널 에이전트들 |

4개 프로젝트를 테마별로 묶어서 3편으로 재구성했다. 각 편이 독립적으로 읽히면서 시리즈로 연결되는 구조. Part 1은 즉시 발행, Part 2·3은 DEV.to 드래프트로 올렸다(예약 발행 대기).

실제 발행된 Part 1: `2026-04-23 14:55 UTC`, DEV.to id=3542024.

여기서 흥미로운 부분이 있다. 기존에 작성해둔 OpenClaw 관련 글(`claude-code-channels-vs-openclaw-en.md`)이 이미 있었는데, 스킬이 이를 자동으로 감지해서 다른 앵글로 접근했다. "이미 다룬 프로젝트니까 내부 링크로 연결하겠다"는 판단은 사람이 내린 게 아니다.

## spoonai 기사 품질 문제 — 25일자와 26일자의 차이

세션 1 중반부는 spoonai 기사 품질 개선으로 넘어갔다. 사용자의 지적: "26일자 기사랑 25일자 기사의 퀄리티가 달라."

문제는 기사 구조였다. 기존 생성 로직이 뉴스 요약 + 모델별 목록 나열에 그쳤다. 요청은 세 가지였다:

1. 본문 요약 + 관련 지식 + 업계 인사이트 아우르기
2. 타이틀 이미지 + 본문 중간 이미지 삽입
3. 한 기사를 읽으면 관련 내용까지 쉽게 습득할 수 있게

`~/.claude/skills/spoonai-daily-briefing/SKILL-2-publish.md`를 수정하고 `self-critique.mjs` 자가 검증 로직을 업데이트했다. Cowork(GitHub Actions)에서 돌아가는 스케줄 3개가 앞으로 나오는 기사에 적용된다.

세션 1 통계: `claude-opus-4-7`, 75시간 58분, 191 tool calls. `Bash` 96 / `Agent` 11 / `Read` 14.

## 서브에이전트 12개 병렬 — 치과 광고 심층 리서치

세션 2는 `/Users/jidong/dentalad`에서 시작됐다. 요청: "AI 치과/병원 광고 업체들 모두 조사해서 어떤 방법 사용하는지 보고서 써주고, 최근 네이버 알고리즘 변화 기준 어떤 방법이 효과적인지."

서브에이전트 12개를 병렬로 던졌다. 각 에이전트는 다른 도메인을 맡아서 중복 없이 조사한다:

- 한국 AI 의료 광고 업체 지형도 (8개 카테고리)
- 네이버 C-Rank / D.I.A.+ 알고리즘 변화 분석
- 개별 업체 실제 산출물 수집 (블로그 샘플, 챗봇 데모, 포트폴리오)
- 5년/1년/90일 트렌드 비교

결과물로 6개 HTML 파일이 생성됐다. `TREND-COMPARISON-REPORT.html`, `AI-AGENCIES-DEEP-REPORT.html`, `AI-AGENCIES-PRIMER.html` 등. 브라우저에서 바로 읽을 수 있는 형태.

에이전트들이 가져온 자료에 신뢰도 등급을 붙였다. "실명+정량 (별 5개)", "이니셜+풍부한 수치 (별 4개)" 식으로. `호원앤컴퍼니`, `인블로그` 같은 업체는 실제 클라이언트 케이스 직링크까지 나왔다.

주목할 점: 에이전트들이 수집한 자료 중 일부는 사실 검증이 필요했다. 서브에이전트는 빠르게 넓게 가져오지만, 특히 경쟁사 클레임에 과장이 섞이는 경향이 있다. 리포트를 믿기 전에 핵심 수치는 직접 교차검증하는 게 맞다.

세션 2 통계: `claude-opus-4-7`, 2시간 26분, 63 tool calls. `Agent` 35 / `Bash` 9 / `Write` 6.

## Telegram → Claude Code → PayPal 결제 검증

세션 3은 특이한 방식으로 시작됐다. Telegram 채널 메시지가 Claude Code 컨텍스트로 직접 들어왔다:

```
사주 프러젝트 방문자나 결제한 사람 있어?
```

Telegram 플러그인이 연결되어 있어서 채널 메시지가 세션으로 흘러든다. 즉각 DB 직접 조회로 답했다: 누적 결제 30건(₩171K), 3월 이후 결제 끊김, 4월에도 트래픽 87세션 유입 중.

다음 요청: "동남아/일본 시장에 팔아서 무조건 수익을 내는 에이전트 하나씩 돌려줘."

에이전트 4개 백그라운드 실행:
- `JP fortune market data` — 일본 점술 앱 시장 규모, 결제 패턴
- `SEA fortune market data` — 태국/인도네시아/베트남 시장 데이터 (소스 81개)
- `Viral fortune video pattern decode` — 바이럴 영상 공식 역분석
- `Top-converting fortune site references` — 전환율 높은 사이트 레퍼런스

에이전트들이 돌아가는 동안 PayPal 라이브 엔드포인트를 직접 테스트했다. 실제 $1.99 주문 DB에 생성되고 승인 URL 발급 확인. `scripts/paypal-live-test.sh`로 결과 저장.

그리고 이 세션에서 중요한 반전이 있었다. CRO 에이전트가 "Thai 사용자에게 ₩ 심볼이 보인다"는 알람을 올렸는데, 직접 코드를 확인해보니 `toss` 네임스페이스 내부라서 Korean checkout에서만 렌더링됐다. 태국 사용자는 PayPal 호스팅 페이지로 라우팅되기 때문에 ₩를 볼 일이 없었다. 에이전트의 거짓 양성.

에이전트를 많이 쓸수록 거짓 양성이 늘어난다. 결과물을 분류하고 검증하는 레이어가 없으면 에이전트 수를 늘릴수록 노이즈가 커진다.

세션 3 통계: `claude-opus-4-7`, 12시간 41분, 190 tool calls. `Bash` 92 / `Read` 32 / `Edit` 25 / `mcp__plugin_telegram` 13.

## 하루 전체 통계

- 총 세션: 3개
- 총 tool calls: 444
- `Bash` 197 / `Agent` 53 / `Read` 46 / `Edit` 35
- 생성 파일: 12개 / 수정 파일: 28개

에이전트 53회 중 대부분이 세션 2·3에서 나왔다. 리서치 도메인에서 에이전트 효율이 가장 높다. 검색 범위가 넓고, 결과를 병렬로 수집하고, 개별 에이전트가 틀려도 전체 그림은 나온다.

반면 코드 변경에서는 에이전트보다 직접 `Edit`이 빨랐다. i18n 메시지 21개 파일을 수정하는 작업은 에이전트 없이 `Edit` 25회로 끝났다.

도구 선택이 곧 전략이다.
