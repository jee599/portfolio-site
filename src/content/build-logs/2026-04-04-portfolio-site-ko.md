---
title: "텔레그램으로 Claude Code 원격 조종: 7세션 670 tool calls로 iOS 앱까지 만든 기록"
project: "portfolio-site"
date: 2026-04-04
lang: ko
tags: [claude-code, ios, swiftui, subagent, harness-pattern, telegram, uddental]
description: "텔레그램 채널로 Claude Code를 원격 조종하며 하루 만에 치과 사이트 리디자인, coffeechat PG 계약, Cloverfield iOS 앱까지 처리했다. 7세션 670 tool calls의 기록."
---

하루 작업 로그를 보니 7개 세션, 670 tool calls였다. 그 중 절반 이상인 300 tool calls가 단일 세션에서 발생했다. docx 기획서 하나로 iOS 앱을 처음부터 만드는 세션이었다. 작업 대부분은 텔레그램 채널에 메시지를 보내는 방식으로 진행했다.

**TL;DR**: 텔레그램 → Claude Code 원격 조종 패턴이 정착됐다. 하네스 디자인 패턴을 CLAUDE.md에 반영했고, 서브에이전트 병렬 배포로 iOS 앱 Phase 1을 완성했다.

## 텔레그램으로 Claude Code 조종하는 법

세션 1은 텔레그램 메시지로 시작했다. `안녕`이라는 메시지에서 출발해서 `agentcrow 지워줘`까지 이어지는 흐름이다. Claude Code의 텔레그램 플러그인이 메시지를 받아 처리한다.

```
커피챗 프로젝트로 가줘
아그리고 지금 전체폴더 컨텍스트에 불필요한거 있지 agentcrow 지워줘
```

이 패턴의 핵심은 **작업 중 이동이 자유롭다**는 것이다. 화장실에서도, 이동 중에도 `uddental`이라고 한 줄 보내면 Claude가 해당 프로젝트 컨텍스트를 로드하고 대기한다. 긴 설명 없이 프로젝트 이름 하나로 컨텍스트 전환이 된다.

단점은 있다. 텔레그램 메시지는 짧고 맥락이 없어서 Claude가 추가 확인을 요청하는 경우가 많다. 그리고 에러 로그 같은 긴 텍스트를 붙여넣을 때는 텔레그램이 불편하다.

## AgentCrow 제거 → 하네스 디자인 패턴

세션 1의 주요 작업은 `CLAUDE.md` 대수술이었다. AgentCrow 관련 항목 전부를 제거하고, 하네스 디자인 패턴을 글로벌 설정에 반영했다.

```
하네스 디자인은? 서브에이전트 + 하네스 디자인이 가능해? 아니면 불필요해
```

하네스 패턴의 핵심은 역할 분리다. 리서치는 `Explore` 에이전트, 구현은 `general-purpose`, 검증은 `code-reviewer`가 담당한다. 메인 스레드는 조율과 최종 결정만 한다. CLAUDE.md에 반영된 내용:

```markdown
### 역할 분담 (하네스 패턴)
- 리서치: Explore (read-only, 코드베이스 탐색/웹 검색)
- 구현: general-purpose (파일 수정 포함)
- 검증: code-reviewer (구현 완료 후 리뷰)
- 메인 스레드: 오케스트레이터. 판단, 조율, 최종 결정만.
```

AgentCrow hook도 `settings.json`에서 제거했다. 작업 과정에서 JSON 포맷이 한 번 깨져서 다시 수정하는 삽질이 있었다. Bash 33회, Edit 5회 — 설정 파일 작업인데도 tool calls가 많이 나왔다.

## uddental: 171 tool calls, 전체 리디자인

세션 3은 `uddental`이라는 한 단어로 시작했다. `uddental-site` 스킬이 로드되면서 프로젝트 컨텍스트가 자동으로 세팅됐다.

```
지금 걸로 배포해주는데, 디자인 좀 더 큼직큼직 임팩트 있게 바꿔줘
일단 해봐 그리고 다른 페이지들도 메인 페이지 디자인처럼 바꿔줘 일관되게
```

Claude는 승인을 먼저 요청했다. 히어로 `70-80vh → 90vh`, 헤드라인 `5xl → 7xl`, 섹션 간격 `py-16 → py-32`. 승인 받고 병렬로 10개 파일을 동시에 수정했다. Edit 76회, Bash 47회, Read 23회, Write 14회. 171 tool calls.

중간에 dev 서버가 다운됐다가 다시 떴다. `npm error code ENOENT`가 뜨면서 `/Users/jidong/package.json`을 못 찾는 에러였다. Claude가 잘못된 디렉토리에서 npm을 실행했기 때문이다. 프로젝트 경로를 명시하니 해결됐다.

주간 진료 일정표 플로팅 컴포넌트(`FloatingSchedule.tsx`)도 이 세션에서 새로 만들었다. 원장님별 요일 표시, 닫기 버튼 포함. 모바일 고려 여부를 물어봐서 세션 6로 이어졌다.

세션 6에서는 모바일 반응형 점검을 24개 이슈 목록으로 정리하고, 7개 핵심 파일을 수정했다. `doctors/page.tsx`에서 hex opacity `${doc.accent}0a` 패턴이 Tailwind에서 작동하지 않아 rgba로 변환하는 작업이 포함됐다.

## Cloverfield: docx 기획서 → 서브에이전트 iOS 앱

세션 7이 이번 주의 핵심이다. 300 tool calls, 5시간 55분.

`/Users/jidong/Downloads/cloverfield-proposal-v3.docx`를 첨부했다. GPS 기반 네잎클로버 수집 힐링 iOS 앱 기획서였다. Phase 1 MVP 스코프, 모션 스펙, 타임라인, 비용 예산($134)까지 담긴 상세한 문서였다.

```
하나씩 phase 별로 구현 - 확인 해주면서 진행해줘
```

Claude는 먼저 `brainstorming` 스킬로 요건을 정리하고, `writing-plans` 스킬로 구현 계획을 작성했다. 그다음 `subagent-driven-development` 패턴으로 태스크별 서브에이전트를 배포했다.

서브에이전트가 처리한 태스크 목록:
- Task 1: XcodeGen 프로젝트 구조 세팅
- Task 2: `CloverEngine` (클로버 생성 로직)
- Task 3: `LocationClient` (TCA DependencyKey)
- Task 4: `SpriteKit FieldScene` + `SplashView`
- Task 5: `HealthKitClient`, `MotionClient`
- Task 6: `PickingFeature`, `PocketFeature`, `RevealFeature`
- Task 7: `WeatherClient`, `CloverStore` (SwiftData), `GardenFeature`

각 서브에이전트가 완료되면 task-notification이 메인으로 올라왔다. 커밋 해시까지 포함해서. 7bc8285, e8d5c24, f3f33a7... 병렬 실행이라 순서가 뒤섞여 들어왔다.

## 삽질 3개 — Xcode, HealthKit, 클로버 이미지

**Xcode 시뮬레이터 설치**. `xcode-select --install` 이후 iOS 26.4 Simulator 다운로드 실패. exit code 70. iOS 17.0 Simulator로 교체해서 해결했다. 사용자가 직접 찾아야 했다 — `못찾겠어`라는 메시지가 있었다.

**HealthKit Entitlement 에러**. 빌드 성공 후 앱 실행하자마자:

```
NSError(domain: "com.apple.healthkit", code: 4,
  userInfo: ["NSLocalizedDescription": "Missing com.apple.developer.healthkit entitlement."])
```

`HealthKitClient`가 시뮬레이터에서 실제 HealthKit 데이터를 요청했기 때문이다. `.entitlements` 파일에 `com.apple.developer.healthkit`를 추가하고, 시뮬레이터에서는 mock 데이터로 폴백하도록 수정했다.

**클로버 이미지 투명 배경 문제**. Gemini API로 클로버 이미지를 생성했는데, 배경이 흰색으로 나왔다.

```
일단 이게 배경이 투명이 아니라 안되고, 매번 다른 네잎을 생성해야해서
어떤식으로 구현할지 고민해봐야돼 수십만개의 네잎이 표현될 수 있게
```

해결책은 이미지를 코드로 대체하는 것이었다. SpriteKit `SKShapeNode`로 클로버 잎 4개를 프로그래밍적으로 그리되, 난수 시드로 매번 다른 형태가 나오게 했다. 세잎과 네잎의 비율은 화면당 1~2개의 네잎이 섞이도록 조정했다.

## 서브에이전트 패턴의 실제 ROI

이번 세션에서 서브에이전트를 가장 많이 썼다. 300 tool calls 중 Agent 호출이 상당 부분을 차지한다. 각 에이전트는 독립된 컨텍스트에서 자기 태스크만 처리하고 커밋까지 완료한다. 메인 스레드는 task-notification을 받아서 다음 에이전트를 배포하는 역할만 한다.

이 패턴의 장점은 **메인 컨텍스트가 오염되지 않는다**는 것이다. 세션 7처럼 iOS 프로젝트 전체를 한 번에 만들 때, 모든 파일을 메인 컨텍스트에 올리면 금방 토큰 한계에 부딪힌다. 서브에이전트에게 "이 파일들만 봐, 이것만 만들어"라고 범위를 지정하면 각 에이전트가 집중도 있는 작업을 한다.

단점도 있다. 에이전트 간에 코드 스타일이 미묘하게 달라진다. `WithViewStore` deprecated 경고가 여러 파일에서 나온 것처럼, 각 에이전트가 TCA 최신 API를 다르게 이해하는 경우가 있다. 서브에이전트 프롬프트에 "TCA 1.7 이상, `@ObservableState` 사용"처럼 구체적인 버전과 패턴을 명시해야 한다.

## 디자인 폴리싱은 반복이다

```
지금 전체적으로 ui / icon / 내부 이미지 다 최악이야
```

세션 7 후반부에서 Cloverfield 디자인 폴리싱이 진행됐다. `FieldView`, `PocketView`, `SplashView`를 따뜻하고 힐링되는 디자인으로 교체하는 세 개의 에이전트를 병렬 배포했다. `Clover.Colors.cream`, `Clover.Colors.sage` 같은 디자인 토큰을 공유 파일로 정의하고 각 뷰에서 참조하게 했다.

Gemini 이미지 생성 API 키(`AIzaSyD...`)를 직접 채팅에 넣은 것도 이 세션이었다. 모델은 `gemini-2.0-flash-exp`가 아닌 `imagen-3.0-generate-001`로 검색해서 선택했다. 생성된 이미지는 `Assets.xcassets`에 넣었다.

결과물을 보고 `그림 바뀐 거 하나도 없는데? 최악이야`라는 피드백이 왔다. Xcode의 캐시 문제였다. `DerivedData`를 삭제하고 클린 빌드를 했더니 변경이 반영됐다.

---

7개 세션이 만든 것들: CLAUDE.md 하네스 패턴 전환, uddental 전체 리디자인 + 모바일 반응형, coffeechat PG사 계약 답변 준비, Cloverfield iOS Phase 1 골격. 텔레그램 메시지 몇 줄로 시작해서 각 세션이 독립적인 결과물을 냈다.
