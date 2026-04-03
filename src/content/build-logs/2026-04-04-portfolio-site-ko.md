---
title: "docx 기획서 → iOS 앱 뼈대, 6시간 316 tool calls"
project: "portfolio-site"
date: 2026-04-04
lang: ko
tags: [claude-code, ios, swiftui, tca, subagent, cloverfield, uddental]
description: "Word 기획서 파일 하나를 드롭했더니 Claude가 XcodeGen 셋업부터 SwiftUI 피처까지 혼자 돌렸다. 6시간, 316 tool calls, 19개 파일 생성. Xcode 삽질 포함."
---

Word 파일 한 장을 던졌을 뿐이다. 6시간 뒤에 iOS 앱 뼈대가 완성됐다.

**TL;DR** `.docx` 기획서를 컨텍스트로 주고 `subagent-driven-development` 스킬을 태우면, Claude가 플래닝부터 피처 구현까지 병렬로 돌린다. 단, Xcode 삽질과 이미지 품질 문제는 여전히 사람이 개입해야 한다.

## docx 하나로 앱을 시작하는 법

`/Users/jidong/Downloads/cloverfield-proposal-v3.docx` — 이게 전부였다. GPS 기반 네잎클로버 수집 힐링 앱 기획서. 스플래시 모션 스펙, 햅틱 타이밍, AI-First 리소스 전략까지 담긴 상세한 문서.

Claude는 파일을 읽고 바로 Phase 구조를 제안했다. 8주 MVP를 Week 1-2 / 3-4 / 5-6으로 쪼개고, 각 주차마다 구현 계획 문서를 `docs/superpowers/plans/`에 생성했다. `writing-plans` 스킬이 실행되면서 이렇게 됐다:

> "Phase 1 전체를 한 번에 계획하면 너무 크다. Week 1-2만 먼저 계획하고, 완료 후 다음 주차를 계획한다."

이게 핵심이다. 한 번에 다 짜려 하지 않고 주차 단위로 쪼갠 것. TCA 최신 API와 XcodeGen 셋업 리서치도 병렬로 돌렸다 — 두 에이전트가 동시에 결과를 갖고 돌아왔다.

## subagent-driven-development 스킬이 하는 일

스킬을 태우면 Claude는 오케스트레이터로만 행동한다. 각 피처 태스크를 독립 서브에이전트에게 위임하고, 결과를 받아서 다음 단계로 넘긴다.

이번 세션에서 병렬로 실행된 태스크들:

- `Research TCA latest API` + `Research XcodeGen setup` (동시)
- `Implement Task 4: SplashView` + `Task 5: HealthKitClient` + `Task 6: MotionClient` (동시)
- `W5-6 Task 1: WeatherClient` + `Task 2: CloverStore` + `Task 3: RevealFeature` + `Task 4: GardenFeature` + `Task 5: ProfileFeature` (5개 동시)

각 에이전트는 파일을 생성하고 커밋까지 완료한다. `CloverEngine`, `LocationClient`, `PickingFeature`, `PocketFeature` — 6시간 동안 19개 파일이 생겼다. 메인 스레드는 task-notification을 받아 다음 배치를 배포하는 역할만 했다. Bash 95회, Read 56회, Edit 27회, Agent 33회.

에이전트 간에 코드 스타일이 미묘하게 달라지는 문제는 있었다. `WithViewStore` deprecated 경고가 여러 파일에서 나왔다. 서브에이전트 프롬프트에 "TCA 1.7 이상, `@ObservableState` 사용"처럼 버전과 패턴을 명시하지 않으면 각 에이전트가 다른 버전 기준으로 코드를 쓴다.

## Xcode 삽질 로그

코드는 빠르게 나왔지만 Xcode가 발목을 잡았다.

**Signing 에러.** `Signing for "Cloverfield" requires a development team.` Xcode GUI에서 직접 개발팀을 선택해야 한다. 자동화 불가.

**AppIcon 에러.** `None of the input catalogs contained a matching app icon set named "AppIcon".` `Contents.json` 생성으로 해결.

**HealthKit entitlement 에러.** 런타임에 터졌다.
```
NSError(domain: "com.apple.healthkit", code: 4,
  userInfo: ["NSLocalizedDescription": "Missing com.apple.developer.healthkit entitlement."])
```
`FieldFeature.swift:50`의 `Effect.run`이 에러를 삼키지 않고 던졌다. `.entitlements`에 HealthKit 권한을 추가해서 해결.

**iOS 26.4 Simulator 에러.** `Redownload iOS 26.4 Simulator and try again.` iOS 17.0 시뮬레이터로 내려서 우회. 시뮬레이터 다운로드는 사용자가 직접 찾아야 했다 — `못찾겠어`라는 메시지가 나왔다.

**`UIColor.blended` 없음.** 에이전트가 존재하지 않는 API를 사용했다. `UIColor`에는 `blended(withFraction:of:)` 같은 메서드가 없다. 수동으로 수정.

## 이미지 생성: Gemini API의 한계

UI가 너무 딱딱하다는 피드백 이후 Gemini API로 이미지를 생성하려 했다. API 키를 건네주고 "만족할 때까지 다시 뽑아라"고 했는데, 결과는 한마디로 정리됐다:

> "그림 바뀐 거 하나도 없는데? 최악이야"

생성된 클로버 이미지가 투명 배경이 아니었다. `Assets.xcassets`에 박아넣었지만 앱 화면에서 배경색과 충돌했다. 결국 SwiftUI `Canvas`로 절차적으로 그리는 방향으로 전환했다. `ProceduralCloverView.swift`가 그 결과물이다.

클로버 자체도 구조적 문제가 있었다. 세잎 클로버 필드에서 네잎이 랜덤으로 섞여 나와야 하는데, 수십만 개의 클로버를 이미지 에셋으로 관리할 수 없다. 시드값 기반 절차적 생성으로 구현했다 — 화면당 1~2개 비율로 네잎이 나오도록 확률 조정.

## uddental 모바일 반응형: 48분

세션 3은 별도 프로젝트인 uddental 치과 사이트 모바일 이슈 수정이었다. 48분, 116 tool call.

`layout.tsx`에서 존재하지 않는 `FloatingSchedule` 임포트가 빌드 에러를 내고 있었다. 24개 모바일 이슈를 목록으로 정리하고 9개 파일을 수정했다. `doctors/page.tsx`에서 hex opacity 템플릿 리터럴 패턴(`${doc.accent}0a`)이 일부 브라우저에서 파싱이 안 됐다 — `rgba()` 형태로 변환해서 해결. 수정 후 바로 배포까지 완료.

## 세션 1 메모: Claude Code 스킬 구조

짧게 정리. 스킬 위치에 따라 적용 범위가 다르다:

| 위치 | 적용 범위 |
|------|-----------|
| `~/.claude/skills/` | 글로벌 |
| `~/.claude/plugins/` (마켓플레이스) | 글로벌 |
| `{프로젝트}/.claude/skills/` | 해당 프로젝트만 |

다른 머신으로 환경을 옮길 때는 `~/.claude/` 전체를 가져가야 한다. `settings.json`의 `enabledPlugins` 목록과 `plugins/marketplaces/`의 실제 플러그인 코드가 함께 있어야 동일한 환경이 된다.

## 오늘의 숫자

- 총 세션: 3개
- 총 tool call: 437회
- Cloverfield 세션 단독: 316 tool calls, 6시간 4분
- 생성 파일: 19개 / 수정 파일: 21개
- 서브에이전트 dispatch: 34회
- 도구 순위: Bash 111회 → Read 85회 → TaskUpdate 72회 → Edit 52회

기획서 → 앱 뼈대까지 하루에 가능하다. 단, Xcode는 여전히 사람 손이 필요하다.
