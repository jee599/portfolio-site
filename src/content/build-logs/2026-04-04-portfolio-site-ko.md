---
title: "docx 기획서 하나로 iOS 앱 첫날: 서브에이전트 33회, 6시간 만에 Phase 1 완료"
project: "portfolio-site"
date: 2026-04-04
lang: ko
tags: [claude-code, ios, swiftui, tca, subagent, xcode]
description: "docx 기획서 한 장을 Claude에 던지고 6시간 만에 SwiftUI + TCA iOS 앱 Phase 1을 완성했다. 서브에이전트 33회 병렬 구현, Xcode 삽질 전말, 힐링 UI 이터레이션 기록."
---

`cloverfield-proposal-v3.docx` 파일 하나를 Claude Code에 던졌다. 6시간 4분 후, Xcode에서 빌드 성공 알림이 떴다. 316 tool calls. SwiftUI + TCA로 GPS 기반 네잎클로버 수집 앱의 Phase 1이 완성됐다.

**TL;DR**: `brainstorming → writing-plans → subagent-driven-development` 스킬 체인으로 기획서에서 코드까지 원패스가 가능하다. Xcode 환경 설정은 여전히 인간이 직접 손봐야 한다.

## docx → 스펙 → 계획 → 구현

프롬프트는 단순했다.

```
하나씩 phase 별로 구현 - 확인 해주면서 진행해줘
```

Claude는 기획서부터 읽었다. GPS 기반 클로버 수집, SwiftUI + TCA, SpriteKit 풀밭 뷰, HealthKit + CoreMotion 걸음 트래킹, SwiftData 영속화. Phase 1 MVP를 8주 스코프로 잡고 비용 추산까지 담긴 문서였다.

`brainstorming` 스킬이 구현 전략을 정립했다. 모노레포로 갈지, 클라이언트/서버 분리할지. 한 가지 확인 후 바로 계획 작성으로 넘어갔다. `writing-plans` 스킬이 Week 1-2, 3-4, 5-6 단위로 구현 계획서를 `docs/superpowers/plans/`에 3개 파일로 떨궜다. 기획서는 `docs/superpowers/specs/2026-04-03-cloverfield-mvp-design.md`에 스펙 문서로 저장했다.

## 서브에이전트 33회 — 병렬 구현의 실제

`subagent-driven-development` 스킬이 핵심이었다. 계획의 각 태스크를 독립 서브에이전트에 위임하고, 두 단계 리뷰(스펙 준수 → 코드 품질)를 거쳤다.

계획 작성 전에 리서치 에이전트 2개를 병렬로 먼저 돌렸다.

```
Agent "Research TCA latest API"  → @ObservableState 마이그레이션 패턴 확인
Agent "Research XcodeGen setup"  → project.yml 스키마 확인
```

TCA 1.7+에서 `WithViewStore`가 deprecated되고 `@ObservableState`로 교체됐다는 걸 리서치에서 잡아냈다. 이 정보가 계획서에 반영됐고, 에이전트들이 처음부터 최신 API로 구현했다.

구현 단계에선 태스크가 거의 동시에 커밋됐다.

```
Agent "Implement Task 4: SplashView"      → commit 7bc8285
Agent "Implement Task 5: HealthKitClient" → StepData.swift 포함 3파일
Agent "Implement Task 6: MotionClient"    → commit feat: MotionClient
```

Week 5-6에선 `WeatherClient`, `CloverStore(SwiftData)`, `RevealFeature(카드 플립 3D 회전)`, `GardenFeature`, `ProfileFeature`를 에이전트 5개가 동시에 처리했다. 메인 스레드는 완료 알림을 받고 다음 배치를 보내는 오케스트레이터 역할만 했다.

Bash 95회, Agent 33회, Read 56회, Edit 27회. Agent가 33회인데 각 서브에이전트가 내부적으로 수십 번씩 돌리니 총 316 tool calls가 됐다.

## Xcode 삽질 전말 — 전체의 30%

코드는 빠르게 나왔는데 실행 환경이 문제였다. 이슈가 연달아 터졌다.

**Signing**: `Signing for "Cloverfield" requires a development team.` Xcode Signing & Capabilities에서 Team을 직접 선택해야 하는 GUI 작업이다. Claude가 파일로 해결할 수 없었다.

**Simulator 다운로드 실패**: `xcodebuild -downloadPlatform iOS`가 exit code 70으로 실패했다. iOS 26.4 Simulator 플랫폼에 문제가 있다는 에러. iOS 17.0 Simulator로 전환했다. 그 뒤에도 "No supported iOS devices are available" 에러가 계속 나왔고, Xcode 상단 디바이스 선택 드롭다운 위치를 스크린샷으로 공유하면서 찾았다.

**AppIcon 누락**: `None of the input catalogs contained a matching app icon set named "AppIcon"`. `Assets.xcassets/AppIcon.appiconset/Contents.json`을 생성하고 `project.yml`에 경로를 추가했다.

**HealthKit entitlement 에러**: 시뮬레이터에서 걸음 트래킹을 돌리자마자 터졌다.

```
NSError(domain: "com.apple.healthkit", code: 4,
  userInfo: ["NSLocalizedDescription": "Missing com.apple.developer.healthkit entitlement."])
```

`FieldFeature.swift:50`의 `Effect.run`이 unhandled error를 던졌다. 프로비저닝 프로파일에 HealthKit capability를 추가하고, 시뮬레이터 환경에선 더미 데이터로 fallback하는 처리를 `HealthKitClient` 라이브 구현에 넣었다.

## "너무 딱딱해" — 힐링 UI 이터레이션

빌드가 뜨고 시뮬레이터에서 확인했는데 반응이 바로 왔다.

```
지금 전체적으로 ui / icon / 내부 이미지 다 최악이야.
폰트랑 디자인 더 애플스럽고 힐링되게 못해? 너무 딱딱해 따뜻하고, 힐링되는 디자인
```

`DesignSystem.swift`에 `Clover.Colors` 네임스페이스를 만들었다. `cream`, `sage`, `moss` 팔레트로 토큰화. Raw `Color(red:...)` 값을 전부 교체하고, `FieldView`, `PocketView`, `SplashView`를 에이전트 3개가 동시에 리디자인했다.

`CloverNode.swift`에서 `UIColor.blended`를 쓴 코드가 컴파일 에러를 냈다. `UIColor`에는 `blended` 메서드가 없다. `CGFloat` lerp로 직접 구현했다.

클로버 렌더링은 SpriteKit 파티클 대신 `ProceduralCloverView.swift`로 SwiftUI에서 직접 그렸다. 줄기와 잎 모양을 `Path`로 구성하고, 세잎 중 화면당 1~2개만 네잎으로 랜덤 배치했다. 수십만 개를 렌더링해도 버티게 `SKNode` 풀링도 적용했다.

이미지는 Gemini API를 Claude Code 세션 안에서 직접 호출해 생성했다. API 키를 넘기고 최신 모델(`gemini-2.0-flash-exp`)로 힐링 톤 클로버 이미지를 `Assets.xcassets`에 직접 박았다. 첫 결과물이 불투명 배경이라 투명 PNG 재생성을 요청했다.

## 같은 날 uddental 모바일 반응형

세션 3은 uddental 사이트 모바일 점검이었다. `uddental-site` 스킬을 호출하자 24개 이슈 목록이 나왔다. 핵심 7개 파일 — `layout.tsx`에 존재하지 않는 `FloatingSchedule` 임포트(빌드 자체가 깨져 있었다), `gap-12`를 모바일에서 `gap-6`으로 좁히는 간격 조정, hex opacity 표기인 `${accent}0a`를 `rgba()`로 변환하는 작업.

116 tool calls 중 Read 28회, Edit 25회. 충분히 읽고 수정하는 패턴이 수치로 보인다. 빌드 성공 확인 후 Vercel 배포까지 한 세션에서 끝냈다.

## 스킬이 없었다면

`subagent-driven-development` 없이 316 tool calls를 메인 스레드에서 돌렸다면 컨텍스트가 터졌을 거다. `writing-plans` 없이 즉흥으로 구현했다면 TCA deprecated API를 구현 도중에 발견했을 거다.

> 스킬 체인은 도구가 아니라 워크플로우다. brainstorm → plan → implement 순서를 지키면 삽질이 줄어든다.

docx 한 장에서 시작해 6시간 만에 `build success`. 다음 세션은 WidgetKit + Live Activity다.
