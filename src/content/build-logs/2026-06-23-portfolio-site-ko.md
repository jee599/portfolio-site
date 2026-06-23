---
title: "HeyGen 실사 아바타 + Paddle 결제를 하루 만에: Claude Code 14시간 세션, 504번 도구 호출"
project: "portfolio-site"
date: 2026-06-23
lang: ko
tags: [claude-code, preterview, heygen, simli, paddle, 비주얼면접, 결제연동]
description: "Preterview에 HeyGen 실사 아바타 + Simli 립싱크 + Paddle 해외결제를 붙인 과정. 14시간 세션 324 tool calls, 삽질 포함 전부 기록."
---

6개 세션, 504번 도구 호출, 총 14시간 이상. 이번 주는 Preterview에 비주얼 면접 기능(HeyGen 실사 아바타 + Simli 립싱크)과 Paddle 해외 결제를 붙이는 데 대부분을 썼다.

**TL;DR** Claude Code에게 "Zoom처럼 면접관 3명 얼굴 띄우고 입모양 맞춰줘"라고 했더니 14시간 324번 도구 호출 끝에 작동하는 POC가 나왔다. 아바타 벤더 선택이 핵심이었다.

## "Zoom 같은 면접 만들어줘"에서 시작한 14시간

세션 4는 이 한 줄에서 시작했다.

> "실제 zoom 면접처럼 면접관 3명의 얼굴을 3D 랜더링으로 그리고, 입모양 싱크맞추고 내 화면까지 요구하고, 마이크쓰게하는 면접이야"

Claude가 먼저 한 일은 구현부터가 아니라 **스코프 분리**였다. 두 갈래로 정리해줬다.

**스코프 A**: 푸시투토크 방식. 내가 말하고 제출하면 면접관이 응답. 화면은 Zoom이지만 턴제.  
**스코프 B**: 진짜 실시간. 계속 듣고 있다가 끼어드는 방식. WebRTC + VAD 필요.

비용/공수의 90%가 스코프 B에 있다는 판단 아래 스코프 A로 결정했다. 이 분리 하나로 이후 벤더 선택이 훨씬 단순해졌다. 턴 기반이라 면접관 오디오를 미리 통째로 생성하고 타이밍을 추출하면 되기 때문에 비싼 실시간 스트리밍 API가 필요 없었다.

## 아바타 벤더 선택: 3D vs 실사의 갈림길

초기 구현에는 3D 모델이 들어갔다. 그런데 사용자 반응은 명확했다: "실사 아바타는 어떻게 전환해?"

Claude가 웹 검색으로 현재 옵션을 실측했다. HeyGen Streaming API와 Simli가 최종 후보가 됐다. 비용 계산이 핵심이었다.

"면접 한 번에 1달러 정도 해야돼 20분에 그 이하"라는 기준이 나왔고, Claude가 실제 요금표를 확인해서 경로를 좁혔다. LiveAvatar는 너무 비쌌다. 결국 **HeyGen으로 아바타 생성, Simli로 립싱크**하는 조합이 확정됐다.

생성된 파일 목록이 그 흔적이다.

- `~/preterview/components/interview/HeyGenAvatarTile.tsx`
- `~/preterview/components/interview/SimliAvatarTile.tsx`
- `~/preterview/components/interview/VisualInterviewPoc.tsx`
- `~/preterview/app/api/simli-token/route.ts`
- `~/preterview/app/api/heygen-token/route.ts`
- `~/preterview/lib/heygen.ts`, `~/preterview/lib/simli.ts`

실제로 브라우저에 직접 들어가서 확인하는 과정도 있었다. `mcp__claude-in-chrome__computer` 호출이 48번이다. 세션 중간중간 스크린샷을 받아서 UI 상태를 확인하면서 수정했다.

## 삽질: API 키, 3D 모델 잔존, 동시 세션

이번 세션의 실제 대화 흔적이 그대로 남아 있다.

```
"아직도 3d모델이 나와"
"안돼"
"서버 재시작 너가 해주면 되잖아"
```

`.env.local`이 없어서 API 키 연동이 안 됐고, 서버 재시작 없이는 변경이 반영이 안 됐다. Simli API 키를 직접 입력하는 장면도 있었다. 3개 아바타를 동시에 띄우려 했는데 1개만 됐던 문제도 있었다 — 동시 세션 제한 때문이었다.

립싱크와 시선 처리는 "조금 아쉬운" 상태로 세션이 끝났다. 완성이 아니라 POC까지가 이번 범위였다.

도구 사용 통계: `Bash(105)`, `Edit(67)`, `mcp__claude-in-chrome__computer(48)`, `mcp__claude-in-chrome__navigate(21)`, `Write(18)`. 브라우저 제어가 전체 호출의 거의 1/3이다.

## Paddle 결제: 기존 구조 파악이 먼저

세션 5는 "paddle 결제 perterview에 붙일거야" 한 마디로 시작했다.

Claude가 먼저 한 일은 현재 결제 구조를 완전히 파악하는 것이었다. `feat/geo-payment-routing` 브랜치가 이미 머지되어 있었고, 한국 → PayApp(₩), 해외 → PayPal($) 구조가 갖춰져 있었다. 크레딧 팩 3종(9,900 / 49,000 / 99,000원), 멱등 적립 로직, 웹훅 기반 fulfillment 패턴까지.

파악하고 나서 내린 결론은 명확했다: **해외 경로(PayPal)만 Paddle로 교체**. 한국 PayApp은 손대지 않는다.

구현 전에 Paddle 공식 문서를 실측 검증했다. 웹훅 서명 검증을 틀리면 치명적이기 때문이었다. 4개 영역(클라이언트 체크아웃, 웹훅 서명, 주문 생성, 크레딧 적립)을 별도로 확인한 뒤에 코드를 썼다.

생성된 파일:

- `~/preterview/lib/payments/paddle.ts`
- `~/preterview/app/api/pay/paddle/create/route.ts`
- `~/preterview/app/api/pay/paddle/webhook/route.ts`
- `~/preterview/app/api/pay/paddle/confirm/route.ts`
- `~/preterview/components/pricing/PaddleBuy.tsx`
- `~/preterview/docs/paddle-setup.md` — 계정 셋업 가이드 포함

도구 사용: `Bash(39)`, `Read(17)`, `Edit(10)`, `Write(6)`. 비주얼 면접에 비해 Read가 많다. 기존 코드 패턴을 정확히 따르는 데 시간을 더 썼다는 뜻이다.

## 정부 지원사업 42개 실측 검증

세션 3은 다른 종류의 작업이었다. `/effort ultracode`로 시작해서 동적 워크플로우를 돌렸다.

"프리터뷰 / 치과 광고대행프로젝트로 지원할 수 있는 핏한 정부 / 민간 지원사업 모두 찾고, 형식에 맞게 내용채워서 지원하게 해줘"

18개 에이전트가 병렬로 돌아가면서 42개 프로그램을 실측 검증했다. 단순 목록이 아니라 오픈 상태, 마감일, 1인 창업자 지원 여부, 실제 지원 URL까지 확인한 결과였다. 12개 지원서를 개별 파일로 작성해서 `~/funding/apply-2026-06-22/applications/`에 저장했다.

`~/funding/apply-2026-06-22/HIGHPROB.md`가 이 세션의 핵심 산출물이다. 통과 확률 상위 프로그램과 각 기준, 필요 서류가 정리돼 있다.

## 전체 통계

| 항목 | 수치 |
|---|---|
| 총 세션 | 6개 |
| 총 tool calls | 504회 |
| 가장 긴 세션 | 14시간 10분 (비주얼 면접) |
| Bash 호출 | 183회 |
| Edit 호출 | 81회 |
| 브라우저 제어 | 52회 |
| 생성 파일 | 26개 |
| 수정 파일 | 17개 |

비주얼 면접 한 세션이 전체 tool calls의 64%를 차지한다. 브라우저 직접 제어가 이렇게 많이 쓰인 건 처음이었다. UI를 실제로 보면서 수정하는 패턴이 효과적이었다.

## 다음

Simli 립싱크 품질 개선이 남아 있다. 시선 처리도 아직 어색하다. Paddle은 샌드박스 테스트가 필요하다 — Price ID를 env로 주입해야 하기 때문에 계정 셋업 전까지는 실측 확인이 안 된 상태다.
