---
title: "같은 버그를 6번 고친 날: iOS overflow-x와 전면 리디자인 624 tool calls 후기"
project: "portfolio-site"
date: 2026-04-09
lang: ko
tags: [claude-code, debugging, mobile, design, worktree, spoonai]
description: "하루에 14개 세션, 624 tool calls. 모바일 좌우 드래그 버그를 6번 수정했고, 다크모드와 Cmd+K 검색이 포함된 전면 리디자인을 완성했다."
---

하루에 같은 버그를 6번 고쳤다. 모바일 `overflow-x` 문제였다. 매번 "이번엔 확실히 잡았다"고 했는데 유저가 계속 드래그된다고 했다.

**TL;DR** 2026-04-06 하루, spoonai.me에서 14개 세션 624 tool calls가 발생했다. 모바일 overflow 버그의 근본 원인은 iOS Safari가 `overflow-x: clip`을 지원하지 않는다는 것이었다. 전면 리디자인(다크모드, Cmd+K 검색, 인디고 컬러)도 같은 날 병행했다.

## overflow-x를 6번 고친 이유

첫 번째 수정은 `body { overflow-x: clip }`이었다. 두 번째는 `html { overflow-x: hidden }` 추가. 세 번째는 `img { max-width: 100%; height: auto }` 전역 규칙. 네 번째는 `HomeContent.tsx`의 `-mx-5 px-5` 네거티브 마진 제거. 다섯 번째는 `BlogList.tsx`의 `-mx-4` 제거. 여섯 번째는 `ImageWithCredit.tsx`의 고정 `width={640}` 처리.

왜 이렇게 반복됐나. 원인이 하나가 아니었다.

첫 번째 근본 원인은 iOS 호환성이었다. `overflow-x: clip`은 iOS 15 이하 Safari에서 `visible`로 fallback된다. 세션 1에서 이걸 발견했지만, 세션 2에서 작업자가 달라지면서(다른 worktree) 같은 파일을 또 고쳤다. worktree 간 변경사항이 main에 머지되기 전에는 서로 독립적이라, 이전 수정이 없는 상태에서 다시 진단하게 된다.

두 번째 근본 원인은 레이어 구조였다. `body`에 `overflow-x: clip`을 걸어도 모바일에서는 `html` 자체가 스크롤되면 무시된다. 루트부터 막아야 한다는 걸 세션 6에서야 확인했다.

세 번째는 네거티브 마진이었다. 카테고리 탭에서 full-bleed 효과를 주려고 `-mx-5 px-5`를 쓰고 있었는데, 이게 뷰포트를 16px씩 넘겼다. `overflow-x: hidden` 아래에서는 안 보이다가, 조건에 따라 다시 나타났다.

```
# 세션 11에서 최종 확인된 수정 목록
1. HomeContent.tsx:98 — -mx-5 px-5 제거
2. BlogList.tsx:33 — -mx-4 제거
3. globals.css — overflow-clip-margin 추가, word-break: break-word
4. layout.tsx — html, body 모두 overflow-x: clip
```

이 목록을 세션 1부터 가지고 있었다면 두 번에 끝났을 것이다. 반복의 원인은 여러 worktree에서 독립적으로 작업하면서 이전 수정 내역을 공유하지 않은 것이었다.

## Systematic Debugging 스킬이 실제로 어떻게 작동하나

버그 세션마다 `superpowers:systematic-debugging` 스킬이 자동으로 로드됐다.

> "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"

스킬의 핵심 원칙이다. 실제로 이 스킬이 있을 때와 없을 때 차이가 있다. 스킬 없이 "horizontal scroll 고쳐줘"라고 하면 Claude가 증상을 보고 바로 `overflow: hidden` 한 줄 추가한다. 스킬이 로드되면 먼저 Grep으로 전체 컴포넌트에서 `100vw`, `-mx-`, `w-screen`을 다 찾고, `position: fixed` 요소가 뷰포트 밖으로 나가는지 확인한 다음에 수정을 시작한다.

세션 1에서 tool call이 54번 발생했다. Bash 22번, Read 13번, Edit 8번. Edit보다 Read가 많다. 수정 전에 읽은 게 더 많다는 뜻이다.

## 전면 리디자인: 스킬 2개로 "Apple 클론"을 탈출하다

세션 3, 8, 9, 12, 14가 디자인 관련이었다. 누적 tool calls 약 330번.

`ui-ux-pro-max`와 `frontend-design` 두 스킬을 설치하고, 모든 디자인 세션 시작 전에 Read하게 했다. 세션 9에서 분석만 먼저 진행했다.

> "Apple.com의 디자인 언어를 충실하게 참조한 사이트다. Pretendard 폰트, #fbfbfd 배경, #0071e3 브랜드 컬러, hairline 보더, backdrop-blur 헤더까지 — Apple의 시각적 문법을 잘 따르고 있다. 문제는 Apple 클론 느낌에 머물고 있다는 것."

이 분석을 기반으로 세션 12에서 전면 리디자인을 진행했다. 세션 12는 7시간 33분, 148 tool calls였다. 이날 세션 중 최대였다.

방향: 딥 인디고(`#4f46e5`) 기반, CSS 변수 전환, 다크모드, Cmd+K 커맨드 팔레트. Edit 43번, Bash 34번, Read 30번, Write 15번. Write가 높은 건 신규 컴포넌트를 여러 개 만들었기 때문이다. `ThemeProvider.tsx`, `SearchCommandPalette.tsx`, `ScrollReveal.tsx` 등 22개 파일이 생겼다.

스킬 두 개를 읽게 하면 프롬프트에 색상 코드나 폰트 이름을 일일이 안 써도 된다. "인디고 블루 계열로 전면 리디자인"이라고 하면 스킬이 팔레트와 페어링을 알아서 추천하고 코드에 적용한다.

## worktree 패턴과 Vercel CANCELED 문제

이날 worktree를 12개 이상 만들었다. `recursing-mccarthy`, `funny-chatelet`, `inspiring-babbage`, `keen-buck` 등.

Vercel CANCELED 문제가 반복됐다. 원인은 두 가지였다. 첫 번째는 연속 push 자동 취소. Vercel은 빠른 연속 push가 들어오면 이전 빌드를 취소한다. 두 번째는 worktree 브랜치가 main이 아니라 별도 브랜치라 자동 배포가 안 됐다.

해결책은 `PATH="/opt/homebrew/opt/node@22/bin:$PATH" /opt/homebrew/bin/vercel --prod`로 직접 배포하는 것이었다. git push로는 Vercel이 자동 취소하거나 worktree 브랜치를 무시했다.

세션 4에서는 빈 커밋으로 빌드를 트리거하는 방법을 썼다. 변경사항이 이미 main에 있는데 Vercel이 배포를 안 할 때 `git commit --allow-empty -m "chore: trigger build"` 후 push하면 새 빌드가 시작된다.

## 병렬 에이전트 디스패치

세션 14에서 3개 에이전트를 병렬로 디스패치했다. AgentCrow 패턴이다.

```
🐦 AgentCrow — dispatching 3 agents:
1. @frontend_developer → HomeContent.tsx + ArticleCard.tsx
2. @frontend_developer → PostContent.tsx
3. @frontend_developer → DailyBriefing.tsx + content
```

파일 도메인이 겹치지 않도록 스코프를 나눈 게 핵심이다. 세션 14는 26 tool calls였지만 실제로는 3개 에이전트가 병렬로 돌았으니 실제 작업량은 그 이상이다.

## 하루 전체 통계

- 세션 수: 14
- 총 tool calls: 624
- Bash: 218 / Read: 173 / Edit: 100 / TodoWrite: 38 / Write: 17 / Agent: 16 / Grep: 15
- 수정 파일: 39개 / 신규 파일: 17개

Bash가 Edit보다 두 배 이상 많다. 코드 수정보다 실행 → 확인 → 재실행 사이클이 훨씬 자주 돈다는 뜻이다.

> 같은 버그를 6번 고치는 건 Claude 실력의 문제가 아니다. worktree 간 컨텍스트 공유가 없고, 이전 수정 내역이 다음 세션에 자동으로 전달되지 않는다. "이전에 뭘 고쳤는지"를 프롬프트에 명시하거나, main 머지 후에 다음 세션을 시작하는 규칙이 필요하다.
