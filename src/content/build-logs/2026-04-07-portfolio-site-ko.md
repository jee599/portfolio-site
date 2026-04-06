---
title: "Claude Code 17세션 전면 리디자인 — 모바일 스크롤 버그 하나에 7번 수정한 기록"
project: "portfolio-site"
date: 2026-04-07
lang: ko
tags: [claude-code, spoonai, parallel-agents, debugging, mobile, worktree]
description: "Claude Code 17개 세션, 600+ tool calls로 spoonai.me를 전면 리디자인했다. 병렬 에이전트·워크트리 전략과 iOS Safari overflow-x 버그에 7회 반복된 삽질 기록."
---

모바일 좌우 스크롤 버그 하나를 고치는 데 세션 7개가 걸렸다. 매번 "고쳤다"고 했는데 유저가 "아직도 드래그 된다"고 했다. 이 글은 그 삽질과, 그 사이에 병렬 에이전트로 하루 만에 전면 리디자인을 완료한 기록이다.

**TL;DR** spoonai.me 전면 리디자인을 Claude Code 17개 세션으로 완료했다. 병렬 에이전트 패턴이 핵심이었고, 모바일 `overflow-x` 버그 7번 반복의 근본 원인은 iOS Safari의 `clip` 미지원이었다.

## 17개 세션, 하루 만에 전면 리디자인

작업 규모를 먼저 말한다. 2026-04-05부터 04-06까지 17개 세션, 총 600+ tool calls. 세션 14 하나만 148 tool calls에 7시간 33분이었다.

프롬프트는 단순했다. "디자인 분석 결과 기반으로 전면 리디자인 구현해줘. 색상은 파란 계열로." 그 결과 다크모드, Cmd+K 검색 팔레트, 인디고 색상 시스템, 스크롤 리빌 애니메이션이 한 세션에 구현됐다. 새로 생성된 파일만 23개다. `ThemeProvider.tsx`, `SearchCommandPalette.tsx`, `ScrollReveal.tsx` 등이 새로 만들어지거나 전면 교체됐다.

## 병렬 에이전트 패턴: 파일 스코프를 나눠라

리디자인 작업에서 가장 자주 쓴 패턴은 AgentCrow 병렬 디스패치다. 세션 4에서 3개 에이전트를 이렇게 나눴다.

```
🐦 AgentCrow — dispatching 3 agents:
1. @frontend_developer → HomeContent.tsx + ArticleCard.tsx
2. @frontend_developer → PostContent.tsx
3. @frontend_developer → DailyBriefing.tsx + content.ts
```

핵심은 파일 스코프가 겹치지 않게 나누는 것이다. 같은 파일을 건드리는 에이전트가 두 개면 충돌이 난다. 도메인 기준으로 분리하면 병렬 실행이 안전하다.

세션 6에서는 여기서 한 단계 더 나아가 스킬을 먼저 로드했다. `ui-ux-pro-max/SKILL.md`(658줄)와 `frontend-design/SKILL.md`를 에이전트에게 읽힌 다음 구현하게 했다. 스킬 없이 진행했을 때보다 결과물 일관성이 눈에 띄게 달랐다.

## 워크트리 전략: 브랜치당 격리된 작업 공간

17개 세션 동안 매 작업마다 워크트리를 새로 생성했다. `angry-williams`, `keen-buck`, `silly-curie`, `pensive-hoover` 등. 워크트리를 쓰면 두 가지가 좋다. 실험이 `main`을 오염시키지 않고, 여러 에이전트가 각자 다른 워크트리에서 동시에 작업할 수 있다.

다만 Vercel 자동 배포가 연속 push를 CANCELED 처리하는 문제가 있었다. worktree 브랜치에서 작업 후 main에 머지할 때 push가 빠르게 연달아 들어가면 Vercel이 이전 빌드를 취소한다. 해결책은 `PATH="/opt/homebrew/opt/node@22/bin:$PATH" /opt/homebrew/bin/vercel --prod`로 CLI 직접 배포하는 것이었다. git push에만 의존하면 안 된다는 걸 세션 3, 11, 15를 반복하면서 배웠다.

## 7번 반복된 모바일 좌우 스크롤 버그

가장 오래 걸린 건 모바일 horizontal scroll이었다. 세션 7부터 시작해서 세션 15까지 계속 나왔다.

시도한 것들 순서대로 나열하면 이렇다. `body { overflow-x: clip }` 추가, 네거티브 마진 `-mx-5` · `-mx-4` 제거, `html { overflow-x: hidden }` 추가, 이미지 `max-width: 100%` 추가, `100vw` 사용 제거. 매번 "근본 원인을 잡았다"고 했는데 유저는 계속 "아직도 된다"고 했다.

세션 12에서 `systematic-debugging` 스킬을 쓰고 나서 진짜 원인을 찾았다. `overflow-x: clip`은 iOS 15 이하 Safari에서 지원되지 않는다. 미지원 브라우저에서는 `visible`로 fallback되어 클리핑이 전혀 작동하지 않는다. 7번 반복된 이유가 여기 있었다. 매번 증상만 보고 패치했고, 브라우저 호환성 테이블을 확인하지 않았다.

최종 해결은 `html { overflow-x: clip }` 선언을 유지하되 fallback으로 `html { overflow-x: hidden }`을 먼저 선언하고, 전역 `img { max-width: 100%; height: auto; }`를 추가하는 것이었다. `clip`을 지원하는 브라우저는 `clip`이 적용되고, 구형 iOS는 `hidden`으로 처리된다.

`systematic-debugging` 스킬의 핵심 원칙은 "수정 전에 근본 원인을 먼저 찾아라"다. 처음부터 이 원칙을 지켰다면 3번이면 끝났을 문제였다.

## 이미지 최적화: 737KB → 49KB

세션 9에서 로딩 속도를 조사하다가 로고 이미지가 2220×1501px PNG에 737KB라는 걸 발견했다. 실제 표시 크기는 200×73px. `sips` 커맨드로 리사이즈하고 압축하니 49KB가 됐다. 93% 감소다.

Next.js `next/image`가 WebP로 자동 최적화해주지만, 소스 파일이 크면 cold start 시간과 git 저장소 크기에 영향을 준다. PNG를 리사이즈하는 과정에서 오히려 파일이 커지는 케이스도 있었는데, 그 파일들은 `git checkout`으로 복원했다. `sips`의 PNG 압축이 원본보다 덜 효율적인 경우가 있다.

## 스킬을 먼저 읽혀라

세션 7에서 가장 명확한 교훈이 나왔다. 유저가 프롬프트에 "스킬 제대로 읽고 리디자인해줘. 스킬을 읽지 않고 작업하면 안 됨"이라고 명시했다. 그 결과물이 이전 세션들보다 일관성이 높았다.

`ui-ux-pro-max` 스킬에는 터치 타겟 44px, spacing 규칙, 모바일 breakpoint 기준이 정의되어 있다. `frontend-design` 스킬은 "anti-AI-slop" 원칙으로 제네릭한 UI를 방지한다. 스킬을 에이전트 프롬프트에 직접 넣거나 `Read`로 먼저 숙지하게 하면 가이드라인이 구현에 반영된다. 에이전트가 알아서 "좋은 디자인"을 하길 기대하면 안 된다. 기준을 명시적으로 주입해야 한다.

## 수치 요약

총 세션 17개, 최장 세션은 148 tool calls에 7시간 33분. 생성된 컴포넌트 23개, 이미지 압축 93%, 모바일 스크롤 버그 반복 7회, 병렬 에이전트 최대 4개 동시 운용. 삽질이 있었지만 다크모드, 검색 팔레트, 인디고 색상 시스템, 반응형 모바일 UI가 하루 안에 완성됐다. 1인 개발자가 혼자서 하루에 할 수 있는 양이 아니다.
