---
title: "Claude Code 멀티에이전트로 피카츄 배구 만들기 — 6개 에이전트 병렬, 90/90 테스트 통과"
project: "agentochester"
date: 2026-03-20
lang: ko
tags: [claude-code, multi-agent, agentochester, game-dev]
description: "API 키 9번 실패로 시작해 AgentCrow 멀티에이전트 오케스트레이션으로 피카츄 배구 멀티플레이어를 하루 만에 구현. PM·데이터·게임디자이너·프론트·QA 6개 에이전트 병렬 실행, 90개 테스트 전부 통과한 과정."
---

처음 9개 세션이 전부 실패로 끝났다.

에러 메시지는 하나였다. "Invalid API key." 도구 호출 횟수는 0. 아무것도 안 됐다. 프로젝트 이름은 agentochester인데, API 키 설정도 없이 에이전트를 돌리고 있었던 것이다.

**TL;DR** AgentCrow 멀티에이전트 오케스트레이션으로 "피카츄 배구 멀티플레이어 만들어줘"를 6개 에이전트에 분배해 하루 만에 구현했다. 물리 엔진 8개 파일, 클라이언트 렌더러 7개 파일, 테스트 90개 — 전부 통과.

## API 키 9번 실패, 그리고 첫 번째 진짜 작업

세션 1부터 9까지 모두 `<synthetic>` 모델로 돌아갔다. Anthropic API 키가 없으면 에이전트도 없다는 걸, 9번 실패하고 나서야 잡았다. 키를 설정하고 세션 10에서 처음으로 "Hi! 👋"가 출력됐다.

인프라가 안 되면 에이전트도 없다. 당연한 말이지만 직접 겪어야 박힌다.

## 멀티에이전트 오케스트레이션의 실제 작동 방식

agentochester의 핵심은 `smart-decomposer.ts`다. 사용자의 프롬프트를 받아 역할별 에이전트 태스크로 쪼개는 컴포넌트다.

"피카츄 배구 리소스 받아와서 멀티로 만들어줘. 기획서부터 작성하고 구현해줘."

이 한 마디가 들어오면 decomposer가 6개 태스크로 분해한다.

```json
[
  {"role": "product_manager", "action": "기획서 — 게임 규칙, 네트워크 아키텍처, MVP 범위"},
  {"role": "data_pipeline_engineer", "action": "스프라이트시트, 사운드 에셋 크롤링"},
  {"role": "game_designer", "action": "물리엔진, 충돌 판정, 동기화 프로토콜"},
  {"role": "frontend_developer", "action": "Canvas 렌더링, 게임 루프, 키보드 입력"},
  {"role": "backend_architect", "action": "WebSocket 서버, 방 생성, 재접속 처리"},
  {"role": "qa_engineer", "action": "물리엔진 단위테스트, E2E, 입력 지연 검증"}
]
```

각 에이전트는 같은 프롬프트 패턴으로 실행된다.

```
You are Game Designer Agent Personality (game_designer).
[CRITICAL RULES]
- Do NOT ask questions. Make decisions yourself and proceed.
- Do NOT ask for confirmation. Just do the work.
[Task]
피카츄 배구 게임 메커닉 설계 — 2D 물리엔진...
[File Scope]
src/game/
```

`[CRITICAL RULES]`가 핵심이다. 이걸 넣지 않으면 에이전트가 계속 확인을 구한다. 초기 세션들에서 PM 에이전트는 "책의 형태가 어떤 걸 의미하는지?" 네 가지 선택지를 내놨고, 게임 디자이너는 "비주얼 컴패니언을 활용할까요?"를 물었다. 규칙을 명시하면 결정하기 시작한다.

## 에이전트별 실제 산출물

**데이터 엔지니어** (세션 20, 28 tool calls)는 `gorisanson/pikachu-volleyball` 오픈소스 레포에서 에셋을 수집했다. `sprite_sheet.png`(476×885), 사운드 파일 16개. WAV→MP3 변환에서 막혔다. `ffmpeg`이 없었기 때문이다. macOS 내장 `afconvert`로 전환했는데, 원본이 8bit PCM이라 직접 AAC 변환이 실패했다. 16bit 변환 후 M4A로 바꾸는 2단계로 해결했다.

**QA 엔지니어** (세션 28, 21 tool calls)는 게임 코드가 없는 상태에서 PRD만 보고 테스트를 먼저 작성했다. `vitest`를 설치하고 물리엔진 18개, WebSocket 18개, E2E 18개, 성능 18개를 만들었다. 나중에 게임 엔진이 나오고 나서 90개로 늘었고 전부 통과했다.

실행 과정에서 `forceBallDrop` 메서드의 버그를 QA 에이전트가 직접 발견했다. 공이 바닥 근처 생성 시 플레이어와 먼저 충돌해 튕겨나가는 문제였다. 플레이어 위치를 조정해서 해결했고, 이후 14점 테스트에서 `resetForServe`가 마지막 포인트에 호출되는 루프 버그도 잡았다.

**게임 디자이너** (세션 39, 20 tool calls)는 `src/game/`에 8개 파일을 만들었다. `constants.ts`, `physics.ts`, `collision.ts`, `animation.ts`, `scoring.ts`, `sync.ts`, `engine.ts`, `types.ts`. TypeScript 타입 내로잉 경고가 났는데, 로직 버그가 아닌 타입 시스템 이슈라고 직접 분석해서 처리했다.

**프론트엔드 개발자** (세션 43, 43 tool calls)가 가장 많은 도구를 썼다. `sprite-loader.ts`, `sound-manager.ts`, `input-manager.ts`, `network-client.ts`, `renderer.ts`, `game-client.ts`, 그리고 게임 페이지까지 7개 파일을 만들었다. 빌드 에러가 나왔는데 게임 코드 문제가 아니라 기존에 있던 Next.js `_global-error` 페이지 이슈였다. 게임 관련 TypeScript는 전부 통과했다.

## 같은 태스크를 열 번 넘게 decompose한 이유

세션 기록을 보면 decomposer가 "피카츄 배구" 관련 태스크를 10번 이상 반복 생성했다. 세션 15, 16, 17, 19, 21, 30, 31, 32, 33, 35, 36 — 거의 같은 JSON이 계속 나온다.

agentochester의 파이프라인 자체를 실험하는 과정이 그대로 찍혔다. 73개 세션 중 실제로 코드를 쓴 건 10개 내외다. 나머지는 decomposer 튜닝, 에이전트 역할 매핑 검증, 오케스트레이터 결과 합산 방식 실험이었다.

오케스트레이션 시스템을 만드는 데 오케스트레이션이 필요하다는 아이러니가 있다.

## 브레인스토밍 스킬이 계속 끼어든 이유

초기 세션들에서 `superpowers:brainstorming` 스킬이 계속 트리거됐다. PM, 게임 디자이너, 프론트엔드 개발자 — 실제 구현 직전에 스킬이 로드되면서 에이전트가 다시 질문 모드로 빠졌다.

`[CRITICAL RULES]`를 추가하고 나서야 이 루프가 끊겼다. 에이전트가 어떤 스킬을 트리거하더라도, 명시적인 실행 규칙이 질문을 막는다는 걸 확인하는 과정이었다.

## 90개 테스트가 전부 통과한다는 것의 의미

QA 에이전트가 남긴 결과.

```
Test Files: 4 passed
Tests:      90 passed
Duration:   330ms
```

물리엔진 충돌 판정, WebSocket 재연결 로직, 2인 동시 플레이 E2E, 입력 지연 200ms 이하 검증. 코드 한 줄 없이 PRD만 보고 만든 테스트들이 실제 구현이 나오고 나서 전부 통과했다.

TDD가 에이전트 간에도 작동한다.

> 오케스트레이터가 복잡할수록, 각 에이전트의 지시는 더 단순하고 명확해야 한다.
