---
title: "하루 9세션 513 tool calls — Claude Code로 4개 프로젝트 동시 운영한 기록"
project: "portfolio-site"
date: 2026-06-22
lang: ko
tags: [claude-code, multi-agent, workflow, preterview, dental, i18n, debugging]
description: "Claude Code 하루 9세션에서 preterview i18n 버그, 치과 콘텐츠 자동화, 사업계획서 12-에이전트 팬아웃까지. 513 tool calls로 4개 프로젝트를 동시에 굴린 작업 기록."
---

하루에 세션 9개, tool call 513번. 치과 마케팅, AI 면접 플랫폼, 사주앱 X 봇, 네이버 광고 심의까지 — 완전히 다른 도메인 4개를 Claude Code 하나로 같은 날 돌렸다.

**TL;DR** 멀티에이전트 위임 패턴(dental-clinic 서브에이전트)과 동적 워크플로 팬아웃(12개 병렬 에이전트)이 핵심이었다. 단일 세션 최다는 193 tool calls — preterview i18n 버그 디버깅에서였다.

## 세션마다 맥락이 완전히 달랐다

| 세션 | 도메인 | 핵심 작업 | tool calls |
|------|--------|-----------|------------|
| 1 | 네이버 광고 | 1인 대행 구조 팩트 리서치 | 32 |
| 2 | preterview | i18n 버그 수정·배포·E2E 테스트 | 193 |
| 3 | 사주앱 | X 봇 발행 패턴 개선 | 49 |
| 4–5 | 치과 마케팅 | 정기 측정 + 주간 콘텐츠 준비 | 13 |
| 6 | 치과 광고 | 네이버 의료광고 심의필 추적 | 39 |
| 7 | preterview | 비주얼 면접 타당성 검토 | 58 |
| 8–9 | 스타트업 | 사업계획서 + 첫 결제/GTM 전략 | 129 |

Claude에게 넘긴 것들이 모두 "다음 기능 추가해줘" 같은 단순 구현이 아니었다. 도메인 리서치, 버그 근본 원인 추적, 외부 규제(의료광고법) 해석, 멀티에이전트 팬아웃까지 — 성격이 완전히 달랐다.

## 193 tool calls짜리 버그: scopeClientMessages

preterview의 i18n 버그가 가장 복잡했다. 증상은 단순했다 — 화면에 번역된 텍스트 대신 `interview.room.endInterview` 같은 raw 키가 그대로 보였다.

첫 의심은 번역 파일 누락이었다. 키는 양쪽 다 있었다. 그 다음은 `useTranslations` 호출 오류. 이것도 아니었다.

실제 원인은 `scopeClientMessages`였다. next-intl이 RSC에서 클라이언트로 보낼 메시지를 **경로(pathname) 기준으로 슬라이싱**하는 최적화 함수인데, 미들웨어가 주입하는 `x-cc-pathname` 헤더가 특정 조건에서 빈 값으로 전달되면서 클라이언트가 빈 메시지 맵을 받은 것이다.

```ts
// 헤더가 없으면 strippedPath = "/"
// → interview, portfolio 네임스페이스 전부 제외됨
const messages = scopeClientMessages(await getMessages(), strippedPath)
```

이걸 추적하는 데 Bash 116번, Read 25번, Edit 22번이 들어갔다. 수정 자체는 단순했지만 **"키는 있는데 왜 안 보이나"**를 next-intl 내부 동작 수준까지 파고드는 과정이 길었다.

이후 Playwright E2E 스펙(`e2e/i18n-softnav.spec.ts`)과 CI 워크플로(`.github/workflows/ci.yml`)를 추가해서 재발 방지까지 완료했다. 수정·생성 파일은 총 28개였다.

## dental-clinic 서브에이전트 패턴

치과 작업(세션 4·5)은 직접 처리하지 않고 `dental-clinic` 서브에이전트에 위임했다. 세션 4는 정기 측정 — SERP 순위, 블로그 인덱싱 상태, 플레이스 리뷰를 자동 실측해서 `history.json`·`monitoring/` 로그를 업데이트하는 작업이다. 메인 세션에서 쓴 tool call은 단 2개였다.

```
Agent(dental-clinic) → 측정 실행 → history/cache 갱신 → sync.sh → 커밋·Vercel 재배포
나 → 결과 다이제스트 확인 → 완료
```

세션 5(주간 콘텐츠 준비)는 서브에이전트가 도중에 멈췄다. `sync.sh` 중간에 에이전트가 죽어서 콘텐츠는 다 만들어졌는데 커밋이 안 된 상태였다. 파일시스템 직접 확인 → 의료법 컴플라이언스 린터 수동 실행 → 커밋까지 직접 마무리했다. 에이전트 결과는 믿지 말고 반드시 검증해야 한다.

## 12개 에이전트 병렬: 사업계획서 팬아웃

세션 8에서 치과 마케팅 자동화와 preterview 두 사업의 사업계획서를 동시에 작성했다. 단일 컨텍스트로 쓰면 각각 편향이 생기고 커버리지도 불완전하다 — 그래서 동적 워크플로로 팬아웃했다.

```
Foundation (병렬 6) → Plans (병렬 2, high effort) → Strategy (병렬 2) → Verify (적대적 검증)
```

12개 에이전트가 동시에 돌아갔고, 결과물은 약 127만 토큰 분량의 원고였다. 이걸 합쳐서 OD-equivalent 렌더러(`md2report/report.py`)로 HTML·PDF로 출력했다.

세션 9에서는 **"통과확률을 냉정하게 보정"**하는 워크플로를 추가로 돌렸다. 지원 프로그램 13개 유닛을 독립 추정 → 회의적 재보정 파이프라인으로 처리해서, 단일 추정의 낙관 편향을 걷어냈다. 프라이머 29기(preterview) 23%, 링크업 치과 31% 등 숫자로 정리됐다.

## X 봇 개선: 불규칙 발행 + AI 말투 제거

세션 3은 사주앱의 X 봇 개선이었다. 6시간 고정 발행(`20 */6 * * *`)이 자동화 티가 너무 났다. 세 가지를 고쳤다.

첫째, 슬롯 카운터 방식을 버리고 날마다 다른 4개 슬롯으로 불규칙화했다. 둘째, 스레드 포맷(연속 트윗)을 OFF하고 단일 트윗만 남겼다. 셋째, AI 말투 스크럽을 프롬프트 레벨에서 강화했다. `vercel.json` cron 표현식도 `*/15 * * * *`로 바꿔 슬롯 게이트를 앱 로직에서 직접 처리하게 했다.

## 의료광고 심의: 브라우저 자동화로 이력 추적

세션 6에서 네이버가 소재를 막았다. 이유는 "심의필번호 미기재". 기존 KDA 사전심의 신청 이력을 직접 확인해야 했는데, `mcp__claude-in-chrome`으로 `dentalad.or.kr`까지 탐색했다. computer 19번 + navigate 4번 조합으로 외부 관리 시스템을 탐색해서 2023년 발급된 심의필번호가 존재한다는 걸 확인했다.

## 통계 요약

총 세션 9개, tool calls 513회. Bash 245, Read 72, Edit 58, Write 33, mcp__claude-in-chrome 43. 수정 파일 23개, 생성 파일 31개. 단일 세션 최다는 193 calls(preterview i18n 버그). 서브에이전트는 dental-clinic × 2, dynamic workflow × 4.

하나의 Claude Code 세션에서 도메인 간 전환이 이 정도로 자연스러운 건, 라우팅 레이어를 명시적으로 세워뒀기 때문이다. dental-clinic 위임 / 동적 워크플로 팬아웃 / 직접 처리, 세 가지 경로를 상황에 따라 골라 쓰면 세션마다 컨텍스트를 다시 쌓는 비용 없이 작업을 이어갈 수 있다.
