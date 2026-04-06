---
title: "모바일 overflow 7번 수정하고 찾은 근본 원인 — Claude Code 15 세션, 757 tool calls"
project: "portfolio-site"
date: 2026-04-06
lang: ko
tags: [claude-code, spoonai, mobile, debugging, worktree, vercel, design, parallel-agents]
description: "같은 모바일 overflow 버그를 7번 수정했다. iOS Safari에서 overflow-x: clip이 작동 안 한다는 사실을 알기까지 15 세션, 757 tool calls가 걸렸다."
---

같은 버그를 7번 수정했다. 매 세션마다 "이번엔 확실히 잡았다"고 했는데, 다음 세션에서 사용자가 또 "좌우 드래그가 있어"라고 했다. 하루 동안 spoonai.me 전면 리디자인을 진행하면서 15 세션, 757 tool calls를 썼고, 그 중 가장 많이 반복한 작업이 모바일 horizontal scroll 수정이었다.

**TL;DR** `overflow-x: clip`은 iOS 15 이하 Safari에서 작동하지 않는다. `html`과 `body` 모두에 걸어야 하고, 네거티브 마진과 `100vw` 사용도 각각 잡아야 한다. 근본 원인 없이 증상만 수정하면 같은 버그가 계속 돌아온다.

## 7번 수정, 그리고 매번 달랐던 원인

세션 10부터 세션 15까지 모바일 좌우 드래그 문제가 계속 보고됐다. Claude Code가 수정한 내역을 시간순으로 보면:

세션 10에서는 `HomeContent.tsx` 카테고리 탭의 `-mx-5 px-5` 네거티브 마진을 제거했고, `BlogList.tsx`의 `-mx-4`도 잡았다. 세션 11에서는 `html { overflow-x: hidden }`을 추가했다. 이전엔 `body`에만 있었던 것이다. 세션 12에서 `overflow-x: clip`이 iOS 15 이하 미지원이라는 사실을 발견하고 `hidden`으로 교체했고, `ArticleCard.tsx`에 이미지 `onError` 핸들러도 추가했다. 세션 15에서는 다시 `clip`으로 돌아오면서 전역 `img { max-width: 100%; height: auto; }`를 추가하고 `ImageWithCredit.tsx` 컨테이너를 수정했다.

왜 이렇게 반복됐는가. 매번 한 가지 원인만 잡고 배포했기 때문이다. 네거티브 마진을 제거해도 `html`에 overflow가 없으면 다른 요소가 다시 넘친다. `body`에만 걸면 iOS Safari에서 `html` 자체가 스크롤된다.

세션 12에서 `systematic-debugging` 스킬을 사용한 게 유일하게 제대로 된 접근이었다. 스킬의 핵심 원칙은 **"NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"**다. 이 원칙대로 코드베이스 전체를 grep으로 뒤진 뒤 두 가지 근본 원인을 발견했다. `overflow-x: clip`의 iOS 호환성 문제와 이미지 `onError` 부재. 그 전 세션들은 증상만 수정했다.

```css
/* 최종 해결책 — globals.css */
html {
  overflow-x: clip;
}
body {
  overflow-x: clip;
}

/* 전역 이미지 안전장치 */
img {
  max-width: 100%;
  height: auto;
}
```

## Vercel CANCELED, 그리고 CLI 직접 배포

세션 3, 11, 15에서 반복된 또 다른 문제다. `git push`로 Vercel 자동 배포를 트리거하면 CANCELED가 떴다. 빠른 연속 push가 들어오면 Vercel이 이전 빌드를 자동 취소하는 정책 때문이었다.

세션 3에서 처음 발생했을 때는 빈 커밋을 하나 더 push해서 다시 트리거하려 했다. 결과는 그 커밋도 CANCELED. 연달아 push하면 더 나빠진다.

세션 15에서 패턴을 파악했다. `git push` → Vercel 자동 트리거는 신뢰성이 낮다. 대신 `vercel --prod` CLI로 직접 배포하면 항상 성공한다. PATH 설정이 필요한데:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" /opt/homebrew/bin/vercel --prod
```

Claude가 이 명령어를 메모리에 저장했다. 다음 세션부터는 바로 쓸 수 있다. 세션 중에 반복적으로 찾아야 하는 명령어는 메모리에 저장하는 습관이 세션 비용을 줄인다.

## 워크트리 패턴 — 하루 15 세션에서 충돌 없이

하루 동안 만들어진 워크트리 이름을 보면: `angry-williams`, `keen-buck`, `pensive-hoover`, `recursing-mccarthy`, `nifty-tereshkova`, `stoic-knuth`, `silly-curie`, `funny-chatelet`. 8개다.

워크트리를 쓴 이유는 명확하다. 세션 간에 작업 범위가 겹치지 않게 하기 위해서다. 세션 14에서 다크모드 + 검색 전면 리디자인을 `keen-buck` 워크트리에서 진행하는 동안, 세션 10에서 모바일 overflow 수정이 `pensive-hoover`에서 따로 진행됐다. main 브랜치는 안정 상태를 유지했다.

문제는 머지 타이밍이었다. 세션 14 마지막에 "keen-buck 브랜치의 전면 리디자인을 main에 머지해줘"가 들어왔는데, 다크모드/검색 구현이 들어있는 큰 PR이었다. 충돌 해결 + 빌드 확인 + 배포까지 진행하는 데 세션의 절반을 썼다. 워크트리는 병렬 작업에 유리하지만, 머지 시점을 너무 늦게 잡으면 오히려 복잡해진다.

> 워크트리를 오래 살려두면 머지 비용이 올라간다. 작업 단위가 끝나면 바로 머지하거나 버리는 게 맞다.

## AgentCrow 병렬 디스패치

세션 4, 6에서 AgentCrow 패턴을 썼다. 파일 도메인이 겹치지 않는 작업을 3-4개 에이전트로 동시에 던지는 방식이다.

세션 4 예시:
```
🐦 AgentCrow — dispatching 3 agents:
1. @frontend_developer → HomeContent.tsx + ArticleCard.tsx
2. @frontend_developer → PostContent.tsx
3. @frontend_developer → DailyBriefing.tsx + content.ts
```

각 에이전트는 자기 파일만 건드리도록 프롬프트에 명시적으로 스코프를 지정했다. 겹치면 git 충돌이 나기 때문이다. 3개 에이전트가 병렬로 완료되면 메인 스레드에서 빌드 확인 → 커밋 순서로 처리했다.

세션 14에서는 이 패턴을 더 크게 썼다. 다크모드(CSS 변수 + ThemeProvider), 검색 기능(SearchCommandPalette + API route), 컴포넌트 리디자인(Header, Footer, ArticleCard 등)을 병렬로 진행했다. 세션이 7시간 33분, 148 tool calls였는데 병렬 처리 덕분에 단일 스레드보다 훨씬 빠르게 진행됐다.

## 스킬 설치와 실제 활용

세션 5에서 `frontend-design`과 `ui-ux-pro-max` 스킬을 설치했다. 이후 세션 6, 7, 8, 9에서 매번 스킬을 먼저 읽도록 프롬프트에 명시했다.

```
## 필수 첫 단계: 스킬 읽기
1. .claude/skills/ui-ux-pro-max/SKILL.md — 658줄
2. .claude/skills/frontend-design/SKILL.md
이 스킬을 읽지 않고 작업하면 안 됨.
```

스킬을 "읽으라"는 지시가 없으면 Claude가 자체 판단으로 진행한다. 이 경우 스킬의 가이드라인(터치타겟 44px, 모바일 spacing 규칙, anti-AI-slop 원칙 등)이 코드에 반영되지 않는다. 스킬은 실제로 호출해야 의미가 있다.

`ui-ux-pro-max`는 658줄짜리 스킬이다. 50+ UI 스타일, 161 컬러 팔레트, 57 폰트 페어링이 들어있다. Claude가 이걸 전부 읽은 뒤 "Tech Editorial" 방향을 선택하고 `#0071e3` 브랜드 블루로 컬러 시스템을 잡았다. 사람이 직접 했다면 레퍼런스 리서치에만 몇 시간이 걸렸을 작업이다.

세션 8에서는 코드 수정 없이 분석만 요청했다. 결과가 흥미로웠다. "Apple.com 디자인 언어를 충실하게 참조한 사이트다. 문제는 Apple 클론 느낌에 머물고 있다는 것"이라는 평가가 나왔다. 이걸 받고 세션 14에서 전면 리디자인을 지시했다. 분석 → 방향 설정 → 구현으로 단계를 나누는 게 한번에 "고쳐줘"보다 결과물 품질이 높다.

## 하루 통계

| 지표 | 수치 |
|------|------|
| 총 세션 | 15개 |
| 총 tool calls | ~757 |
| 최장 세션 | 7시간 33분 (세션 14, 148 tool calls) |
| 최단 세션 | 2분 (세션 11, 14 tool calls) |
| 같은 버그 수정 횟수 | 7회 (모바일 overflow) |
| 생성된 워크트리 | 8개 |
| 주요 모델 | claude-sonnet-4-6 (빠른 반복), claude-opus-4-6 (대형 세션) |

세션 14에서 Opus를 쓴 이유는 다크모드 + 검색 + 전면 리디자인이 동시에 들어온 복잡한 작업이었기 때문이다. 단일 Sonnet 세션으로는 컨텍스트가 부족할 수 있다고 판단했다. Opus는 더 복잡한 연쇄 판단이 필요한 세션에 쓰고, Sonnet은 단순 버그 수정과 빠른 반복에 쓰는 게 비용 대비 효과적이다.

## 반복 버그에서 배운 것

같은 버그를 7번 수정한 건 비효율적이었다. 원인은 매번 "이번 변경으로 해결됐을 것"이라고 가정하고 배포했기 때문이다. 배포 후 사용자 확인까지 기다리는 대신, 수정 전에 더 철저히 코드베이스를 grep해서 동일한 패턴의 다른 원인을 먼저 제거했어야 했다.

`systematic-debugging` 스킬이 세션 12에서 처음 사용됐는데, 이걸 세션 10부터 썼다면 반복이 줄었을 것이다. 버그가 처음 보고됐을 때 스킬을 호출하고, 증거를 전부 모은 뒤 수정하는 순서가 맞다.

> 빠른 수정이 빠른 게 아니다. 근본 원인 없이 배포하면 같은 세션을 한 번 더 써야 한다.
