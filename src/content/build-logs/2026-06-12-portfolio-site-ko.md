---
title: "Claude Fable 5 하루 1,400 tool calls — 치과 PPT부터 사주 사이트까지 5개 프로젝트 동시 진행"
project: "portfolio-site"
date: 2026-06-12
lang: ko
tags: [claude-code, claude-fable-5, workflow, open-design, multi-project]
description: "Claude Fable 5로 하루 11세션, 1,400 tool calls를 돌렸다. 치과 원장 프레젠테이션, spoonai 구독 퍼널 진단, 사주 글로벌 사이트 리뉴얼, 포토그래퍼 사이트 구축까지 — 세션별 도구 패턴과 세션 한계 도달 경험을 기록한다."
---

하루에 Claude Code 세션 11개, 도구 호출 1,394회를 돌렸다. 오전 치과 덱 제작부터 자정 CoffeeChat 어드민 구축까지 — 5개 프로젝트가 병렬로 진행됐고, 세 세션이 일일 한도에 걸렸다. 전부 `claude-fable-5`로 돌린 결과다.

**TL;DR** 세션 한도가 병목이다. 대신 한도 전까지는 컨텍스트가 유지돼 긴 작업을 끊기지 않고 이을 수 있고, 리서치 성격의 작업은 `Workflow` fan-out이 단일 세션보다 훨씬 빠르다.

## 치과 원장님 프레젠테이션 — 20장을 13장으로 줄이는 게 핵심이었다

세션 1, 2h 58min, 175 tool calls. 요청은 단순했다: "원장님한테 보여주면서 설명할 PPT랑 발표 스크립트 2개."

`open-design` 스킬이 붙었고 `~/dental-promo` 캐시에서 클리닉 데이터를 읽어 20장짜리 덱을 만들었다. Edit 68번, Bash 61번.

완성 직후 피드백이 왔다. "슬라이드만 봐서는 내용이 어렵고 길어." AEO, CPC 같은 전문 용어를 전부 풀어썼다. "클릭 1번 약 3만 7천 원"처럼 수치를 말로 바꾸고, 파트 구분 슬라이드를 제거해서 20장 → 13장으로 압축했다.

발표 스크립트는 `.md`로 썼다가 `.html`로 한 번 더 변환했다 — 발표 중 길 잃었을 때 슬라이드 번호 칩 클릭으로 바로 이동하는 기능 때문에. 최종 산출물:

```
~/dental-promo/dongbaek-uddental/2026-06-11/
├── 03-원장님-프레젠테이션.html   # 13장 덱, 방향키 넘김
└── 04-발표-스크립트.html         # 슬라이드별 대본 + 예상 질문 8건
```

## spoonai.me 감사 — 에이전트 12개가 퍼널 두 군데를 찾아냈다

세션 4, 39min, 30 tool calls. 짧지만 `Workflow` fan-out이 들어간 세션이다. 에이전트 11개, 감사 3종 + 딥리서치 4종 + 수치 적대검증.

발견한 게 명확했다. 구독 퍼널이 두 군데서 끊겼다. 사이트로 가입한 사람은 메일을 못 받는다 — 로컬 발송 스크립트에 `SUPABASE_SERVICE_ROLE_KEY`가 없어서 4월 13일 이후 신규 구독자 수신이 0. 받는 사람은 수신 거부를 못 한다 — 링크가 404를 반환한다.

결론은 한 줄: 다른 모든 고도화보다 퍼널 복구가 먼저다.

## daymoon 포토그래퍼 사이트 — 293장 실사진, 관리자까지 한 세션에

세션 7, 10h 13min, 216 tool calls. Blob Storage에 실제 사진 293장이 있었다. 갤러리를 동적 그리드로 새로 짰고, 관리자 페이지도 붙였다.

요청 흐름이 전형적인 패턴이었다. 처음은 "메인화면 이상하니까 갤러리로 바로 가게 해줘"였는데, 진행하면서 "고도화해줘, 관리자 메뉴에 시즌별 예약 관리도"로 확장됐다. 어드민 페이지는 비밀번호 없이 접근 가능하게 — 요청 그대로.

API 라우트 4개(`photos`, `bookings`, `settings`, `upload`)를 Vercel Functions로 붙이고 프로덕션 배포까지 완료했다. Bash 70번, Write 27번, Edit 22번 순이다. 10시간이 걸린 건 배포 확인 + 브라우저 검증 루프 때문이지 코드 작성 때문이 아니었다.

## 사주 글로벌 사이트 — 포지셔닝 역전과 337 tool calls

세션 9, 11h 33min, 337 tool calls. 당일 가장 큰 세션이었다.

시작 지점이 흥미로웠다. "'AI 리포트'라고 하면 결제가 안 붙지 않아?" — 대답은 반대였다. 6월 11일 딥리서치에서 실측한 Etsy 자연 실험 데이터 기준으로, 'AI Reading'을 전면에 내세운 샵은 1개월 판매 0건, 인간 페르소나 샵(연화 만신)은 1년간 판매 464건, 리뷰 130개였다. 결제 플랫폼이 반려하는 기준은 카피가 아니라 서비스 카테고리 자체(점술/운세)라서 포지셔닝을 바꿔도 반려 리스크는 동일하다.

디자인 방향은 "Midnight Almanac" — 딥 인디고 + 골드 헤어라인. 이전 라이브 사이트의 three.js 코스믹 배경을 이식하고, gpt-image-2로 실제 이미지를 생성했다. 이미지 생성 중 "이미지 생성 한도 늘려줄게 기다려"가 한 번 있었다 — 백그라운드 태스크로 4장, 2장 나눠 돌렸다.

7로케일 번역은 서브에이전트로 분리했는데, 그 에이전트가 세션 한도에 걸려서 반환이 없었다. Bash 127번, Edit 85번, Read 51번.

## CoffeeChat — 476 tool calls, Turso + PayPal + TTS를 하루에

세션 10, 14h 23min, 476 tool calls. 하루 최대였다.

유저별 이메일/비밀번호 로그인, 토큰 사용량 추적, 결제, 음성 면접(TTS), 글로벌 언어 지원을 한 세션에 다 붙이겠다는 요청이었다. 구현 스택: Turso (SQLite edge DB), PayPal Payments, OpenAI `tts-1`.

중간에 Vercel 배포가 막혔다: `commit author email (jidong@jidongui-iMac.local) is not valid`. git config를 `jd@jidonglab.com`으로 수정 후 재푸시했다.

TTS 비용 질문이 왔다. "비쌔?" — `tts-1` 기준 글자당 $0.015/1K, 면접 1회 약 $0.05~0.10으로 계산 후 "써"로 결정됐다.

## 세션별 도구 호출 분포

| 세션 | 시간 | tool calls | 주요 도구 상위 3 |
|---|---|---|---|
| 치과 PPT | 2h 58min | 175 | Edit 68, Bash 61, Read 15 |
| spoonai 감사 | 39min | 30 | Workflow fan-out, Bash 17 |
| daymoon | 10h 13min | 216 | Bash 70, Write 27, Edit 22 |
| 사주 리뉴얼 | 11h 33min | 337 | Bash 127, Edit 85, Read 51 |
| CoffeeChat | 14h 23min | 476 | 복합 |

세션 한도는 사주, JDLab DSN, CoffeeChat 세션에서 각 1회씩 떴다. 한도에 걸릴 때는 작업이 완전히 끊기는 게 아니라 핵심 코드가 작성된 상태에서 멈췄다 — 다음 세션에서 "계속해서 해"로 이어갈 수 있었다.

`Workflow` fan-out을 쓴 세션(spoonai, Primer 리서치)은 짧은 시간 안에 많은 데이터를 처리했다. Primer 리서치는 57개 프로그램을 209회 검색/검증으로 30분 안에 끝냈다. 단일 세션에서 같은 작업을 했으면 훨씬 길었을 것이다.

## 다음 작업

spoonai 퍼널 복구(`SUPABASE_SERVICE_ROLE_KEY` 주입, 수신거부 링크 수정)가 가장 급하다. CoffeeChat Vercel 배포 상태 확인과 치과 원장 미팅 후 피드백 반영이 그 다음이다.
