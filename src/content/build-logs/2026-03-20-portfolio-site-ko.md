---
title: "AgentCrow 실전 테스트 — 6개 에이전트가 피카츄 배구 게임을 하루 만에 만든 과정"
project: "portfolio-site"
date: 2026-03-20
lang: ko
tags: [claude-code, multi-agent, agentcrow, ai-automation]
description: "AgentCrow 멀티에이전트 시스템으로 피카츄 배구 멀티플레이어 게임을 만들었다. 79세션, 90개 테스트 전부 통과. 브레인스토밍 스킬이 에이전트를 막는 문제와 해결 과정."
---

79개 세션. 그 중 처음 9개는 전부 "Invalid API key"였다.

**TL;DR** AgentCrow의 멀티에이전트 오케스트레이션을 실제로 써봤다. "피카츄 배구 멀티로 만들어줘" 한 문장이 6개 에이전트로 분해됐고, PRD부터 90개 테스트 통과까지 하루 만에 끝났다.

## API key 오류부터 시작하는 게 AgentCrow 실전이다

AgentCrow는 자연어 프롬프트를 에이전트 태스크로 분해하고, 최대 5개 에이전트를 병렬로 실행하는 시스템이다. `.claude/agents/` 에 144개 에이전트 정의가 있다.

첫 번째 테스트는 처참했다. "ai 뉴스 크롤링해서 이메일로 보내주는 웹 만들어줘" — 세션 4개가 전부 같은 오류로 끝났다.

```
Invalid API key · Fix external API key
```

Tool call이 0개. 에이전트가 뜨기도 전에 죽었다. 환경변수 설정 문제였고, 고치는 데 10분도 안 걸렸다. 근데 이게 오히려 흥미로웠다. 설정이 잘못되면 에이전트가 아무것도 안 하고 즉시 실패한다는 게 확인됐다. 조용히 틀린 결과를 내놓는 것보다 낫다.

## "피카츄 배구 멀티로 만들어줘" 한 줄이 6개 태스크로

API key를 고친 뒤 진짜 테스트가 시작됐다. 사용자 입력:

```
피카츄 배구 리소스 받아와서 멀티로 만들어줘. 기획서부터 작성하고 구현해줘
```

Task Decomposer가 이 문장을 6개로 쪼갰다.

PM이 PRD를 쓰고, Data Pipeline이 에셋을 크롤링하고, Game Designer가 물리엔진을 설계하고, Frontend Developer가 Canvas 클라이언트를 구현하고, Backend Architect가 WebSocket 서버를 잡고, QA Engineer가 테스트를 짜는 구조다. 이론상 병렬 실행이 가능한 배분이다.

근데 실제로 실행하니 문제가 생겼다.

## 브레인스토밍 스킬이 에이전트를 9번 막았다

에이전트들이 계속 질문을 했다.

Game Designer 에이전트:

> 설계에 들어가기 전에 한 가지 질문부터 하겠습니다. **어떤 종류의 멀티플레이어 게임인가요?**

Backend Architect 에이전트:

> 브라우저에서 목업이나 다이어그램을 보여주면 설명이 더 쉬울 수 있는데, 이 기능은 아직 새롭고 토큰을 많이 씁니다. 사용해볼까요?

`brainstorming` 스킬이 에이전트마다 로딩되면서 구현 전에 반드시 질문하도록 강제하고 있었다. 스킬 코드에 `<HARD-GATE>: Do NOT invoke any implementation skill` 블록이 있었다.

브레인스토밍 스킬은 사람과 대화할 때는 좋다. 하지만 멀티에이전트 파이프라인에서는 독이다. 에이전트가 질문을 하면 파이프라인이 멈춘다. 승인을 기다리는 에이전트는 아무것도 하지 않는다.

해결책은 간단했다. AgentCrow가 에이전트를 디스패치할 때 프롬프트 앞에 CRITICAL RULES를 붙이도록 수정했다.

```
[CRITICAL RULES]
- Do NOT ask questions. Make decisions yourself and proceed.
- Do NOT ask for confirmation. Just do the work.
- If you need to choose between options, pick the best one and explain why.
- Create actual files and write actual code. Do not just describe what to do.
```

이 4줄을 붙인 이후부터 에이전트들이 실제로 파일을 만들기 시작했다.

## 병렬 6에이전트가 실제로 만든 것들

**PM 에이전트** (5 tool calls): `docs/pikachu-volleyball-prd.md` 생성. 코트 크기(432×304px), 서브/리시브/스파이크 메커닉, Authoritative Server 모델 + WebSocket 프로토콜, 15점 선취 규칙까지.

**Data Pipeline 에이전트** (28 tool calls): `gorisanson/pikachu-volleyball` 레포에서 스프라이트시트, 사운드 16개(WAV+M4A 듀얼), 애니메이션 프레임 데이터를 수집하고 `public/assets/manifest.json`과 `animations.json`을 생성했다. 8bit PCM WAV를 M4A로 변환할 때 `afconvert` 16bit 중간 변환이 필요했다.

**Game Designer 에이전트** (20 tool calls): `src/game/` 에 8개 파일. `physics.ts`, `collision.ts`, `animation.ts`, `scoring.ts`, `sync.ts`, `engine.ts`, `types.ts`, `constants.ts`. TypeScript 타입 체크 전부 통과.

**Frontend 에이전트** (43 tool calls): `src/game/client/` 에 렌더링 레이어. `sprite-loader.ts`, `sound-manager.ts`, `renderer.ts`, `input-manager.ts`, `network-client.ts`, `game-client.ts`, `GameCanvas.tsx`, `app/game/page.tsx`. 빌드 에러는 게임 코드가 아니라 `/_global-error` 사전 렌더링 문제(Next.js 16 기존 이슈)였다.

**QA 에이전트** (21 tool calls): 이게 가장 인상적이었다.

```
Test Files  4 passed (4)
Tests       90 passed (90)
Duration    330ms
```

90개 테스트가 전부 통과했다. `tests/physics/collision.test.ts` (충돌/반사/중력), `tests/network/websocket.test.ts` (연결/재접속/방 관리), `tests/performance/input-latency.test.ts` (200ms 이하 검증), `tests/e2e/two-player.test.ts` (2인 동시 플레이 시뮬레이션).

PRD 스펙 기반으로 구현 전에 테스트를 먼저 작성했다. 코드가 없어도 스펙이 있으면 테스트를 쓸 수 있다는 걸 QA 에이전트가 보여줬다.

## 삽질 정리: 같은 태스크가 6번 반복됐다

Task Decomposer 세션이 로그에 10번 넘게 찍혀 있다. 같은 "피카츄 배구" 태스크를 분해하는 세션이 반복됐다. AgentCrow의 오케스트레이션 로직이 태스크 상태를 제대로 추적하지 못하면, 이미 완료된 태스크를 다시 디스패치하는 문제가 생긴다.

멀티에이전트 시스템에서 "이 태스크는 이미 완료됐다"는 상태 관리가 얼마나 중요한지 이 삽질에서 다시 확인했다.

## portfolio-site도 리디자인했다

AgentCrow 테스트와 별개로 jidonglab.com 자체도 손을 봤다. 프로젝트 중심 홈페이지로 구조를 바꾸고, 프로젝트 정렬을 운영중 → 베타 → 개발중 → 중단 순으로 정리했다. AgentCrow와 ContextZip 상태를 운영중으로 업데이트.

> 에이전트가 질문을 하면 파이프라인이 멈춘다. 멀티에이전트 시스템에서 자율성은 기능이 아니라 요구사항이다.
