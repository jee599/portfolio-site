---
title: "기획서 docx 한 장으로 iOS 앱 빌드까지, Claude Code 서브에이전트 파이프라인 (316 tool calls)"
project: "portfolio-site"
date: 2026-04-04
lang: ko
tags: [claude-code, subagent, ios, swiftui, tca, parallel-agents]
description: "Word 기획서를 넘겼더니 6시간 만에 SwiftUI + TCA iOS 앱 뼈대가 나왔다. brainstorm → writing-plans → subagent-driven-development 스킬 체인과 316 tool calls 과정 공개."
---

Word 파일 하나를 드롭했다. `cloverfield-proposal-v3.docx`. GPS 기반 네잎클로버 수집 힐링 앱 기획서다. 6시간 4분 뒤, Xcode에서 빌드 성공 알림이 떴다.

**TL;DR** Claude Code 스킬 체인(brainstorm → writing-plans → subagent-driven-development)에 병렬 리서치 에이전트를 붙이면 기획서에서 코드까지 원패스가 가능하다. 단, Xcode 환경 설정은 여전히 인간이 직접 손봐야 한다.

## docx → 구현 계획 → 코드, 스킬 체인이 작동하는 방식

세션을 시작하자마자 스킬 체인이 순서대로 실행됐다.

먼저 `brainstorming` 스킬이 기획서를 읽고 질문을 한 번만 던졌다. "모노레포로 갈지, 클라이언트/서버 분리할지?" 한 마디로 정리하고 구현 범위를 확정했다. 그다음 `writing-plans` 스킬이 8주 치 MVP를 Week 1-2 / 3-4 / 5-6으로 나눠 구현 계획서 3개를 `docs/superpowers/plans/`에 떨궜다. 각 파일에는 손댈 파일 경로, TCA 리듀서 구조, 테스트 방법까지 담겼다.

계획서가 완성되자 `subagent-driven-development` 스킬이 개별 태스크를 서브에이전트로 던지기 시작했다. `CloverEngine`, `LocationClient`, `HealthKitClient`, `MotionClient`, `SplashView`, `FieldScene`이 거의 동시에 커밋됐다. 메인 스레드는 조율만 했다.

이 세션에서 도구 사용 분포가 작업 방식을 그대로 보여준다. Bash 95회, Read 56회, Agent 33회, Edit 27회. Agent가 33회인데 서브에이전트가 태스크마다 내부적으로 수십 번씩 돌리니 실제 총 tool calls는 316회였다.

## TCA 최신 API, 리서치 에이전트 2개 병렬로

Week 1-2 계획을 쓰기 전에 리서치를 먼저 돌렸다. TCA(The Composable Architecture)는 버전마다 API가 크게 달라진다. `WithViewStore`가 1.7에서 deprecated되고 `@ObservableState`로 교체됐다. XcodeGen도 `project.yml` 스키마를 직접 확인해야 했다.

서브에이전트 2개를 병렬로 던졌다. "Research TCA latest API"와 "Research XcodeGen setup"이 동시에 돌았다. 두 결과가 돌아오자마자 바로 계획서 작성에 들어갔다. 순서대로 했으면 추가 10분이 걸렸을 리서치가 병렬로 처리됐다.

```
🐦 AgentCrow — dispatching 2 agents:
1. @research → "Research TCA latest @ObservableState API patterns for 1.7+"
2. @research → "Research XcodeGen project.yml schema for iOS 17+ targets"
```

## Xcode 환경 설정, 이건 Claude가 못 해주는 영역

코드 생성은 빠르게 됐는데 실행 환경이 문제였다. 이슈가 연달아 터졌다.

첫 번째는 signing 문제. "Signing for Cloverfield requires a development team." 개발팀 계정을 Xcode Signing & Capabilities에서 직접 선택해야 한다. Claude가 파일로 해결할 수 없는 GUI 작업이다.

두 번째는 시뮬레이터 문제. iOS 26.4 Simulator를 다운로드하다 exit code 70으로 실패했다. iOS 17.0 시뮬레이터로 전환했고, "No supported iOS devices are available" 에러가 계속 나왔다. Xcode 상단 디바이스 선택 드롭다운이 어디 있는지 스크린샷을 공유하면서 찾았다.

세 번째는 HealthKit entitlement 에러.

```
NSError(
  domain: "com.apple.healthkit",
  code: 4,
  userInfo: ["NSLocalizedDescription": "Missing com.apple.developer.healthkit entitlement."]
)
```

`FieldFeature.swift`에서 `Effect.run`이 unhandled error를 던졌다. HealthKit은 단순 코드 추가가 아니라 프로비저닝 프로파일과 엔타이틀먼트 파일이 필요하다. 시뮬레이터에서는 HealthKit 데이터를 목킹하도록 `HealthKitClient`의 라이브 구현에 fallback 처리를 추가했다.

## Gemini API로 이미지 생성, 세션 안에서

UI 이미지가 없으니 앱이 빈 박스 투성이였다. "Gemini 사용해서 정밀한 프롬프트로 이미지 뽑아"라는 한 줄 지시로 Gemini API 호출을 Claude Code 세션 안에서 바로 돌렸다.

API 키를 주고 최신 모델을 검색해서 쓰도록 했다. 클로버 힐링 톤 이미지를 Assets에 직접 박는 방식이다. 결과물이 처음엔 기대에 못 미쳤다. 투명 배경 PNG가 아닌 불투명 배경 이미지가 나왔고, 클로버 자체가 앱 톤과 맞지 않았다.

결론: Assets 이미지는 Gemini로 뽑고, 클로버 자체는 `ProceduralCloverView.swift`에서 코드로 그리는 방식으로 분리했다. SpriteKit `CloverNode`가 세잎/네잎을 랜덤 비율로 생성하고, 화면당 1~2개 네잎클로버가 섞이도록 확률을 조정했다.

## 같은 날 uddental 모바일 반응형 수정

세션 2가 끝나고 48분짜리 세션 3이 있었다. uddental 사이트 모바일 반응형 점검이다.

`uddental-site` 스킬을 호출하자 프로젝트 위치와 기술 스택을 즉시 파악하고 24개 이슈 목록을 뽑았다. 핵심은 7개 파일이었다. `FloatingSchedule` 임포트 에러(빌드 자체가 깨져 있었다), `gap-12`를 모바일에서 `gap-6`으로 좁히는 간격 조정, hex opacity 표기(`${accent}0a`)를 `rgba()`로 변환하는 작업이다.

116 tool calls 중 Read 28회, Edit 25회로 거의 같은 비율이다. 먼저 충분히 읽고 수정한다는 패턴이 수치로 보인다. 빌드 성공 확인 후 배포까지 한 세션에서 끝냈다.

## Claude Code 스킬 저장 구조 — 세션 1에서 배운 것

세션 1은 3분짜리 질문 세션이었다. "Claude skills는 어디에 저장돼?"

```
~/.claude/skills/          # 글로벌 스킬
~/.claude/plugins/         # 플러그인 스킬 (마켓플레이스)
{project}/.claude/skills/  # 프로젝트 로컬 스킬
```

프로젝트 `.claude/skills/`는 해당 디렉토리 안에서만 적용된다. 다른 머신이나 다른 프로젝트로 환경을 옮길 때 `~/.claude/` 전체가 필요하다. `settings.json`의 `enabledPlugins`, `plugins/marketplaces/`의 플러그인 코드, `CLAUDE.md`까지 세트로 가야 한다.

환경 이식성이 생각보다 중요했다. 플러그인 없이 스킬만 복사하면 반쪽짜리다.

> 스킬 체인은 도구가 아니라 워크플로우다. brainstorm → plan → implement 순서를 지키면 삽질이 줄어든다.
