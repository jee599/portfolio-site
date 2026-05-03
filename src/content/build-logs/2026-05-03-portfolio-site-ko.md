---
title: "병렬 에이전트 5개로 리서치 검증 — 3개 프로젝트 동시 진행 패턴"
project: "portfolio-site"
date: 2026-05-03
lang: ko
tags: [claude-code, multi-agent, parallel, devto, coffeechat, dentalad]
description: "5세션·382 툴 콜로 3개 프로젝트를 동시에 진행했다. DEV.to 글 5편 병렬 작성, 검증 에이전트 5개 동시 디스패치, Google Meet OAuth 통합까지 — 병렬 패턴이 어떻게 작동하는지."
---

5세션, 382번의 툴 콜. coffeechat, dentalad, DEV.to 콘텐츠를 동시에 진행했다. 프로젝트 사이를 오가면서 병렬 에이전트 패턴을 적극 썼다.

**TL;DR** — Claude Code에서 병렬 에이전트 디스패치가 실제로 얼마나 효과적인지 확인했다. 검증 에이전트 5개 동시 실행, DEV.to 글 5편 병렬 작성 — 두 케이스 모두 순차 처리 대비 체감 속도가 확연히 달랐다.

## DEV.to 5편을 한 번에

세션 1에서 "codex 관련 최신 소식 기반으로 DEV.to 글 5개 써줘"라는 요청이 들어왔다. 순차적으로 작성하면 각 글이 평균 2~3분이라 총 15분 이상. 병렬로 5개 에이전트를 동시에 던졌다.

주제는 리서치 먼저 했다. GPT Image 2, Symphony, Codex CLI 최신 동향을 확인한 후 5개 슬롯을 배분했다:

```
1. GPT Image 2 Inside Codex: My New Frontend Workflow
2. Symphony: Why OpenAI's PRs Jumped 500% in 3 Weeks
3. I Gave Codex My Mouse for a Day
4. The Codex Memory Problem (And How I Solved It)
5. Codex vs Claude Code: An Honest 2026 Comparison
```

에이전트 5개가 동시에 실행됐다. TaskCreate가 16번인 이유가 여기 있다. 문제가 하나 생겼다 — "failed"로 표시된 툴 콜이 실제로는 성공하면서 파일이 8개 생겼다. 5개만 남기고 중복을 정리하는 데 추가 시간이 들었다. 병렬 에이전트 사용 시 silent success 케이스를 미리 고려해야 한다는 걸 배웠다.

각 글은 devto-seo-rules.md 기준으로 검증했다. 10K char 제한, 불허 구문 체크, Sources 섹션 형식 — 통과.

## dentalad: 5개 검증 에이전트 병렬 실행

세션 2는 규모가 달랐다. 한국 AI 치과 광고 시장 리서치 V1(12건) + V2(검증 8건) + 통합 보고서 4종, 총 66,745단어가 쌓여 있었다. 이 자료에 교차검증이 필요했다.

5개 도메인으로 쪼갰다:

```
Agent 1: 규제 (AI 기본법·공정위·의료법)
Agent 2: 경쟁사 (케어랩스·상승기획 등 Top 5)
Agent 3: 플랫폼 (네이버·Meta·ChatGPT)
Agent 4: 유닛 이코노믹스 (원가·가격·MRR)
Agent 5: 시장 데이터 (ROAS·LTV·TAM)
```

결과가 흥미로웠다. V2가 V1을 이미 수정했지만 FINAL-REPORT는 V1 수치를 그대로 들고 있었다. 경쟁사 매출은 전반적으로 과대평가, 규제 시점 표현이 부정확 ("2025-12 시행" 표기였지만 실제는 발표일), ChatGPT/네이버 주어 관계가 반대로 쓰여 있었다 — 차단한 건 네이버였다.

이런 걸 순차적으로 한 명이 다 검증했으면 세션 하나가 규제만으로 끝났을 거다. 병렬 에이전트가 TaskUpdate를 64번 찍은 게 이 세션이다.

검증 결과는 5개 파일로 떨어졌다:

- `verification/01-regulation.md`
- `verification/02-competitors.md`
- `verification/03-platform.md`
- `verification/04-unit-economics.md`
- `verification/05-market-data.md`

이후 FINAL-REPORT, EXECUTIVE-SUMMARY, RISKS를 업데이트하고 HTML 리포트 3종도 만들었다.

## coffeechat: Google Meet OAuth 통합

세션 1 후반부에 coffeechat으로 전환했다. "상담 시작하면 구글 밋 생성하는 로직 있어?"라는 질문에서 시작해서 실제 구현까지 이어졌다.

OAuth 2.0 + Google Calendar API 연동이 필요한 작업이었다. 생성된 파일:

- `src/lib/google/oauth.ts` — 인증 플로우
- `src/lib/google/calendar.ts` — 미팅 생성
- `src/lib/google/booking-hook.ts` — 예약 트리거
- `src/app/api/mentor/google/connect/route.ts` — 연결
- `src/app/api/mentor/google/disconnect/route.ts` — 해제
- `src/app/api/mentor/google/status/route.ts` — 상태 확인
- `src/components/mentor/GoogleConnectCard.tsx` — UI

테스트 파일도 3개 생성했다. Bash가 50번인 건 실제 OAuth 플로우를 검증하고 미팅 생성 API 응답을 확인하는 과정이 많았기 때문이다.

결제 흐름은 무통장으로 먼저 구현하고 Toss 계약 이후 붙이는 방향으로 결정했다. 무통장 확인 로직을 `payment/confirm/route.ts`에 넣었다.

## Claude 사용량 추적: ccusage 리서치

세션 3은 별개 주제였다. "구독 모델에서 얼마나 썼는지 알 수 있는 방법이 없어?"라는 질문.

`~/.claude/projects/**/*.jsonl`에 모든 요청 기록이 남는다는 걸 확인했다. `ccusage` 패키지가 이걸 파싱해서 프로젝트별·일별 토큰/비용을 보여준다.

Mac 메뉴바 앱으로 상시 표시하는 것도 가능하다. 이미 만들어진 앱이 10개 넘게 있었다:

- **Usage for Claude** — Product Hunt 출시, iOS 동반 앱, GitHub-style 그리드
- **ClaudeBar** — 메뉴바 특화, 가장 가벼움
- **Claude Token Monitor** — 5분마다 폴링

다 공통적으로 `~/.claude/` JSONL을 읽는다. 실시간 연동은 아니고 파일 시스템 기반이라 폴링 주기가 있다.

구독 모델은 raw 토큰 수를 공식적으로 안 주고 % 단위만 준다. 정확한 수치를 보려면 로컬 로그 파싱이 유일한 방법이다.

## 도구 사용 패턴

382 툴 콜 분포:

| 도구 | 횟수 | 주요 용도 |
|------|------|-----------|
| Bash | 143 | API 검증, git, 파일 시스템 탐색 |
| TaskUpdate | 64 | 병렬 에이전트 진행 상황 업데이트 |
| Read | 37 | 기존 파일 확인 |
| TaskCreate | 34 | 병렬 에이전트 디스패치 |
| Write | 33 | 신규 파일 생성 |
| Edit | 27 | 기존 파일 수정 |
| WebSearch | 18 | 외부 레퍼런스 확인 |
| Agent | 16 | 서브에이전트 직접 호출 |

TaskCreate와 TaskUpdate 합계가 98번이다. 전체 툴 콜의 26%가 병렬 작업 관리에 쓰인 셈이다. 병렬 에이전트 패턴이 실제로 얼마나 많은 오버헤드를 만드는지 숫자로 보면 명확하다.

수정 파일 6개, 생성 파일 29개. 세션당 평균 7개 파일이 생겼다.

## 병렬 에이전트 패턴 — 실제 한계

이번 5세션을 돌아보면 병렬 패턴이 효과적인 케이스와 그렇지 않은 케이스가 명확히 갈린다.

효과적: 독립적인 도메인 검증, 독립적인 콘텐츠 생성. dentalad 5개 에이전트가 각자 다른 도메인을 조사했을 때 서로 결과에 영향을 주지 않는다. DEV.to 5편도 주제가 겹치지 않아서 병렬이 깔끔하게 작동했다.

한계: 같은 파일을 건드리는 작업은 병렬로 못 돌린다. coffeechat의 mentor dashboard는 여러 컴포넌트가 연결돼 있어서 순차로 처리해야 했다. 병렬로 던졌다가 충돌 해결하는 게 더 느린 경우가 있다.

그리고 silent success 문제 — DEV.to 글 8개가 생긴 것처럼, 에이전트가 "실패했다"고 보고해도 실제 파일이 생겼을 수 있다. 병렬 에이전트 이후엔 결과물 검증이 필수다.
