---
title: "AI 비주얼 면접 + Paddle 결제: 13세션 335 tool calls짜리 Preterview 스프린트"
project: "portfolio-site"
date: 2026-06-23
lang: ko
tags: [claude-code, preterview, heygen, simli, paddle, 비주얼면접, ultracode]
description: "3일 동안 13개 세션, 가장 긴 단일 세션 27시간 28분 335 tool calls. Preterview에 AI 아바타 비주얼 면접과 Paddle 해외결제를 붙이면서 생긴 삽질과 비용 최적화 기록."
---

3일 동안 13개 세션을 돌렸다. 가장 긴 세션 하나가 27시간 28분에 335 tool calls다. Preterview에 AI 아바타 비주얼 면접(HeyGen + Simli), Paddle 해외결제, 공개 데모 페이지, 광고 전략을 동시에 밀어 넣은 기간이다.

**TL;DR** Claude Code를 프로젝트 매니저 겸 구현자로 쓰면서 "어떤 기술 스택, 얼마의 비용"부터 코드까지 단일 세션에서 처리할 수 있다는 걸 다시 확인했다. 외부 API가 얽히면 예상 시간의 두 배를 잡아야 한다.

## 335 tool calls — 비주얼 면접 세션

세션 5는 이 한 문장으로 시작했다.

> "실제 zoom 면접처럼 면접관 3명의 얼굴을 3D 랜더링으로 그리고, 입모양 싱크맞추고 내 화면까지 요구하고, 마이크쓰게하는 면접이야"

27시간 28분, 335 tool calls. 이 스프린트에서 단일 세션 최대 규모다.

Claude가 먼저 한 건 스코프 분리였다. 두 갈래로 나눴다. **스코프 A** — 푸시투토크. 내가 말하고 제출하면 면접관이 응답. 화면은 Zoom이지만 턴제다. **스코프 B** — 진짜 실시간. 계속 듣고 있다가 끼어드는 방식. WebRTC + VAD가 필요하고 비용/공수의 90%가 여기 있다.

스코프 A로 확정한 이유가 명확했다. "턴제"라서 면접관 오디오를 미리 생성해 타이밍을 추출할 수 있고, 실시간 스트리밍 강제가 없어서 무료 Web Speech를 유지할 수 있었다. `~/reports/preterview-scopeA-options.html`로 레이어별 옵션 비교 보고서를 먼저 뽑고 결정했다.

벤더 선택은 동적 워크플로우로 검증했다. HeyGen Streaming API, Simli, LiveAvatar, D-ID를 실측했고, 결론은 **HeyGen으로 아바타 스트리밍 + Simli로 실시간 립싱크** 조합이었다. 생성된 파일 8개 신규: `HeyGenAvatarTile.tsx`, `SimliAvatarTile.tsx`, `VisualInterviewPoc.tsx`, `heygen.ts`, `simli.ts`, API 라우트 3개.

세션 중 실제 대화 흔적이 그대로 남아있다.

```
"아직도 3d모델이 나와"
"안돼"
"서버 재시작 너가 해주면 되잖아"
```

`.env.local`이 없어서 API 키 연동이 안 됐고, 서버 재시작 없이 변경이 반영 안 됐다. 3개 아바타를 동시에 띄우려 했는데 1개만 됐던 문제도 있었다 — Simli 동시 세션 제한이었다. `mcp__claude-in-chrome__computer` 호출이 48번이다. 브라우저를 직접 제어하면서 UI 상태를 눈으로 확인하고 수정했다.

## "면접 한 번에 1달러 이하로 해야 돼"

같은 세션에서 비용 기준이 나왔다.

> "지금 너무 비싸 말도 안돼 면접 한 번에 1달러 정도 해야돼 20분에 그 이하"

LiveAvatar를 먼저 시도했다. 실제 API 키를 연동하고 테스트했는데 요금이 기준을 넘었다. Claude가 동적 워크플로우를 돌렸다 — `"Verify cheapest path to ≤$1 per 20-min 3-interviewer photoreal session"` 제목으로 벤더별 요금을 검증하고 $1/20분 예산에서 실현 가능한 경로를 좁혔다. 결론은 Simli Free tier 활용 + 아바타를 한 번만 생성해서 재사용하는 방식이었다.

## Paddle 결제: 기존 구조 읽기가 절반

세션 9 — "paddle 결제 perterview에 붙일거야" 한 마디로 시작했다. tool calls 67 + 63회(Chrome MCP + Bash).

Claude가 먼저 한 일은 현재 결제 구조 전체 파악이었다. `feat/geo-payment-routing` 브랜치가 이미 머지돼 있었다. 한국 → PayApp(₩), 해외 → PayPal($) 구조, 크레딧 팩 3종(9,900 / 49,000 / 99,000원), 멱등 적립 로직, 웹훅 기반 fulfillment 패턴까지 다 있었다.

결론: **해외 경로(PayPal)만 Paddle로 교체**. 한국 PayApp은 건드리지 않는다. 구현 전에 Paddle 공식 문서를 실측 검증했다 — 웹훅 서명 검증을 틀리면 치명적이기 때문이었다. 생성된 파일: `lib/payments/paddle.ts`, 세 개의 API 라우트(create/webhook/confirm), `PaddleBuy.tsx`, `docs/paddle-setup.md`.

사용자가 Paddle 대시보드에서 직접 API 키와 웹훅 시크릿을 발급하는 과정을 같이 진행했다. 샌드박스 API 키(`pdl_sdbx_apikey_...`)를 직접 받아 넣고, 체크아웃 페이지와 성공 리다이렉트까지 Chrome MCP로 실측했다. `mcp__claude-in-chrome__computer`가 67번 호출됐다.

## 공개 데모 페이지: 비용 계산 먼저, 구현 나중

세션 6 — 공개 데모 페이지(5~7턴 무료 체험). 1시간 10분, 43 tool calls.

구현 전에 실제로 1턴을 태워서 비용을 측정했다. `scripts/demo-cost.mjs`를 만들고 Opus 4.8 기준 5~7턴 면접 토큰 수를 계산했다. 결과를 근거로 IP당 레이트 리밋 정책을 결정했다.

데모 라우트 구조는 기존 `/interview` 패턴을 그대로 따랐다 — 얇은 async server page + 클라이언트 컴포넌트 `DemoInterview.tsx` + 스탠드얼론 API 라우트 `app/api/demo/turn/route.ts`. 사전 설계가 잘 돼 있으면 구현은 빠르다.

## PRD: 코드 읽고 나서 다시 쓴 문서

세션 7 — preterview PRD PDF 작성. 10분, 23 tool calls.

첫 번째 버전을 뽑고 나서 사용자가 "모의면접 부분이 핵심인데 좀 더 강화시켜달라"고 피드백을 줬다. Claude가 실제 면접 기능 코드를 다시 읽고 PRD를 재작성했다. 모의면접 섹션이 6개 하위 섹션으로 상세화됐다 — 면접 세팅 3단계, 면접관 패널 3인 역할표, 라이브 면접방 기능, 꼬리 질문 루프, 리포트, 재면접. 그 다음 요청이 "글씨 모바일에서 안 보여" — CSS 폰트 크기 조정 후 재렌더링.

## 광고 전략: 에이전트 13개, 수치 13개 전부 수정

세션 10 — `/effort ultracode`로 시작. "인스타가 나아? 얼마를 어떤 타겟에 태우는게 가장 효과적인지 객관적인 수치랑 근거로 서칭해줘. 국내 / 글로벌 모두"

동적 워크플로우 두 번 돌아갔다. 첫 번째: 5개 에이전트가 병렬로 네이버 파워링크 CPC, 메타 코리아 CPM, 카카오모먼트, 글로벌 메타·Reddit 2024~2025 실측 벤치마크를 수집했다. 적대적 검증을 돌렸더니 핵심 수치 13개 중 13개가 수정됐다. 에이전트 단일 추정은 낙관 편향이 있다.

두 번째 워크플로우: 네이버 파워링크 셋업, Reddit 광고 소재 3개, 픽셀+랜딩 체크리스트를 플랫폼 제약에 맞게 QA 검증하면서 만들었다. 총 69 tool calls.

## 그 외: 데모 영상, 동백유디치과, JDLab 보고서

세션 4(38분, 45 tool calls) — `preterview-demo.html`을 게임 개발자 포트폴리오 기반 면접으로 재작성하고 영상으로 뽑았다. Playwright로 프레임을 추출하고 ffmpeg로 인코딩했다. `preterview-demo-ko.mp4`와 `preterview-demo-en.mp4`, 각 1280×720·30fps·39.5초.

세션 2(13분, 1 tool call) — `Agent(dental-clinic)`에 위임하고 다이제스트만 확인했다. 동백유디치과 `동백 임플란트` 블로그탭 순위 측정, history.json 갱신, sync.sh 푸시까지 에이전트가 처리했다. 1 tool call은 위임 한 번이다 — 메인 세션 tool calls에는 에이전트 내부 호출이 잡히지 않는다.

세션 1(5분, 17 tool calls) — JDLab 크론 현황을 파악하고 보고서 PDF를 뽑았다. 26건 발송 완료, PDF 4페이지 776KB.

## 전체 통계

| 세션 | 소요 시간 | tool calls | 핵심 |
|------|----------|-----------|------|
| 1 | 5분 | 17 | JDLab 크론 현황 보고서 |
| 2 | 13분 | 1 | 동백유디치과 정기 측정 위임 |
| 3 | 1시간 4분 | 20 | 모두의 창업 유출 사건 리서치 |
| 4 | 38분 | 45 | preterview 데모 영상 |
| 5 | 27시간 28분 | 335 | 비주얼 면접 POC (Simli + HeyGen) |
| 6 | 1시간 10분 | 43 | 공개 데모 페이지 |
| 7 | 10분 | 23 | preterview PRD PDF |
| 8 | 2시간 44분 | 51 | 정부·민간 지원사업 리서치 |
| 9 | 23시간 21분 | 249 | Paddle 해외 결제 |
| 10 | 8시간 46분 | 69 | 광고 전략 리서치 (ultracode) |
| **합계** | **64시간** | **853** | |

세션 5(비주얼 면접)가 전체 tool calls의 39%다. 세션 9(Paddle)가 29%. 두 세션의 공통점은 기존 코드베이스를 먼저 깊게 읽었다는 것 — 탐색이 많으면 Bash와 Read 호출이 쌓인다.

남은 것: Simli 립싱크 품질 개선(시선 처리가 아직 어색하다), Paddle 샌드박스 왕복 테스트, 공개 데모 배포 확인.
