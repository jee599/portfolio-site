---
title: "docx 기획서 한 장으로 iOS 앱 뼈대 세우기: 서브에이전트 병렬 구현 패턴"
project: "portfolio-site"
date: 2026-04-05
lang: ko
tags: [claude-code, ios, swiftui, tca, subagent, naver-blog, uddental]
description: "docx 기획서 업로드 하나로 iOS 앱 구조 전체를 세웠다. 6시간, 316 tool calls, 서브에이전트 병렬 패턴으로 SwiftUI + TCA 스켈레톤 완성. 삽질 포함 전부 기록."
---

기획서 docx 파일 하나를 Claude에 던졌다. 6시간 뒤에 SwiftUI + TCA 프로젝트 뼈대가 완성됐다. 스플래시, HealthKit 걸음 트래킹, SpriteKit 풀밭, 클로버 뽑기, 리빌, 정원, 프로필 — 7개 피처가 커밋 단위로 쌓였다. tool calls 316번, Agent 33번.

**TL;DR**: 기획서가 상세할수록 첫 프롬프트가 짧아진다. 피처별 서브에이전트를 독립 태스크로 쪼개면 병렬 실행이 가능하다. Xcode 삽질은 세션 밖에서 해결해야 한다.

## docx 파일 하나에서 시작

첫 프롬프트는 파일 경로 하나였다.

```
/Users/jidong/Downloads/cloverfield-proposal-v3.docx
```

Claude가 읽었다. GPS 기반 네잎클로버 수집 힐링 앱. iOS 네이티브(SwiftUI 17+) + TCA + SpriteKit + SwiftData. 클라우드는 Cloudflare Workers + D1 + R2. MVP $134, 월 $10–15. 스크린별 모션 스펙이 햅틱 타이밍까지 나와 있었다.

다음 프롬프트: "하나씩 phase 별로 구현 — 확인해주면서 진행해줘."

Claude는 brainstorming 스킬을 호출했다. 기획서가 이미 구체적이라 대화는 짧았다. 확인한 것 두 가지 — 프로젝트 위치(`/Users/jidong/Projects/Cloverfield/`)와 Week 단위 스코프 분리. 그 다음 writing-plans 스킬로 Week 1–2, 3–4, 5–6 구현 계획을 3개 파일로 만들었다.

## 서브에이전트 병렬 구현 패턴

계획이 나오자 subagent-driven-development 스킬을 불렀다. 피처당 에이전트 하나. 독립 태스크면 병렬로, 의존성 있으면 순차로.

Week 1–2에서 리서치 에이전트 2개를 먼저 병렬로 돌렸다.

- `Research TCA latest API` — TCA 1.7 이상 `@ObservableState` 패턴 확인
- `Research XcodeGen setup` — `project.yml` 구조와 빌드 설정

리서치 결과가 오면 계획에 반영하고, 구현 에이전트를 태스크별로 디스패치했다.

```
Task 4: SplashView  →  commit 7bc8285
Task 5: HealthKitClient  →  commit e8d5c24
Task 6: MotionClient  →  commit feat: MotionClient...
```

각 에이전트가 파일을 만들고 커밋하면 태스크 알림이 돌아왔다. 메인 컨텍스트는 요약만 받았다. 에이전트 간 파일 충돌을 막으려면 스코프가 겹치지 않아야 한다 — 피처 디렉토리 단위로 경계를 잡는 게 핵심이다.

Week 3–4에서는 CloverEngine, LocationClient, SpriteKit FieldScene, PickingFeature, PocketFeature를 동시에 돌렸다. 5개 에이전트가 5개 커밋을 만들었다.

## Xcode 삽질: 세션 밖의 시간들

빌드가 처음 깨진 건 세 가지 이유였다.

1. `WithViewStore` deprecated — TCA 1.7에서 `@ObservableState`로 마이그레이션 필요
2. `AppIcon` 에셋 누락 — `Contents.json`이 없어서 빌드 실패
3. 서명 팀 미설정 — `Signing for "Cloverfield" requires a development team`

Claude가 1번과 2번은 고쳤다. 3번은 Xcode GUI에서 직접 선택해야 했다. iOS 시뮬레이터 다운로드는 exit code 70으로 실패했다. 결국 iOS 17.0 시뮬레이터를 직접 받아서 연결했다.

HealthKit 엔티틀먼트 에러도 나왔다.

```
NSError(
  domain: "com.apple.healthkit",
  code: 4,
  userInfo: ["NSLocalizedDescription": "Missing com.apple.developer.healthkit entitlement."]
)
```

앱 설정에서 HealthKit capability를 수동으로 켜야 했다. Claude는 에러 메시지를 읽고 방법을 알려줬지만, Xcode 설정 파일을 직접 수정하는 건 사용자 몫이었다.

빌드 성공 메시지를 확인한 건 세션 시작 6시간 뒤였다.

## 디자인 이터레이션: "너무 딱딱해"

빌드가 되고 나서 시뮬레이터로 첫 화면을 봤다. 사용자 피드백: "이미지가 없어? 그리고 UI 더 고도화해야 할 것 같은데." "폰트랑 디자인 더 애플스럽고 힐링되게 못해? 너무 딱딱해."

디자인 이터레이션도 에이전트로 처리했다.

- `Polish FieldView warm healing design`
- `Polish PocketView warm healing`
- `Polish SplashView warm healing`

크림 베이지 배경, 따뜻한 초록 계열, SF Rounded 폰트. `DesignSystem.swift`에 컬러 토큰을 모아서 모든 뷰가 같은 팔레트를 쓰도록 했다.

그다음 피드백: "세잎 클로버 중에 네잎이 섞여있는 걸로 해줘 랜덤 배치해서, 화면당 한~2개로." SpriteKit `CloverNode`에서 랜덤 시드 기반으로 4번째 잎 생성 여부를 결정하는 코드를 추가했다.

## uddental: 모바일 반응형 + 블로그 3편 병렬 작성

같은 날 세션 3에서 uddental 사이트 모바일 반응형 점검을 했다. Read 47회로 전체 컴포넌트를 스캔하고 24개 이슈를 발견했다. 핵심은 `FloatingSchedule` 미존재 임포트(빌드 에러), `gap-12` → 모바일 `gap-6`, CTA 버튼 패딩 조정이었다.

빌드 성공 후에는 네이버 치과 블로그 3편을 병렬로 작성했다.

```
Agent "Write blog 001 implant bone graft"
Agent "Write blog 002 gum disease"
Agent "Write blog 003 pediatric dentistry"
```

3개 에이전트가 동시에 돌았다. 각각 5,000–6,000자, 네이버 알고리즘 스펙(H2 7–8개, 키워드 밀도, 이미지 태그 22–25개)을 기준으로 작성했다.

작성 완료 후 교차 검증을 3개 에이전트로 돌렸다 — 의료법 준수, S급 디자인 기준, 네이버 SEO 알고리즘. 피드백을 받아서 수정하고, 수정 후 다시 18개 항목 체크리스트로 재검증했다. 003편이 18/18으로 통과했고, 001, 002는 1–2개 항목을 추가로 수정했다.

마지막으로 Gemini API로 3D 일러스트를 생성했다. 에이전트 3개가 편당 6장씩, 총 18장을 병렬로 뽑았다. 뼈이식 단면 구조, 잇몸 출혈 원인, 유치 맹출 순서 같은 주제를 의료 3D 일러스트 스타일로.

## 통계로 보면

| 세션 | 시간 | tool calls | 주요 도구 |
|------|------|-----------|---------|
| 스킬 시스템 Q&A | 3분 | 5 | Glob, Read |
| Cloverfield iOS 앱 | 6시간 4분 | 316 | Bash(95), Read(56), Agent(33) |
| uddental + 블로그 | 20시간 35분 | 170 | Read(47), Edit(29), Agent(25) |

Agent 도구가 58회 호출됐다. 리서치, 구현, 검증을 에이전트로 분리하면 메인 컨텍스트가 오케스트레이터 역할만 한다. 컨텍스트가 깨끗할수록 다음 판단이 정확해진다.

TaskUpdate 72회는 서브에이전트 태스크 상태를 추적한 것이다. 병렬로 돌리면 언제 끝나는지 알 수 없으니 알림 방식이 필수다.

## 기획서 품질이 구현 속도를 결정한다

Cloverfield 세션에서 brainstorming이 짧게 끝난 이유는 기획서가 이미 모션 스펙, 햅틱 타이밍, 예산까지 다 담고 있었기 때문이다. 기획서의 밀도가 첫 프롬프트의 길이를 결정한다.

반대로 Xcode 설정과 시뮬레이터 연결은 Claude가 해줄 수 없는 영역이다. GUI 인터랙션이 필요한 작업, 개발자 계정 설정, 엔티틀먼트 활성화 — 이 세 가지는 사용자가 직접 해야 한다. 세션 밖에서 30분이 나갔다.

서브에이전트 패턴은 독립성이 전제다. 같은 파일을 두 에이전트가 건드리면 충돌이 난다. 피처 디렉토리 단위로 스코프를 명확히 지정하고, 에이전트 프롬프트에 "수정 범위: 이 디렉토리만"을 명시하는 게 기본이다.
