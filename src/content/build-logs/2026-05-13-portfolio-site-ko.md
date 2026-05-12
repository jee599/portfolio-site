---
title: "Claude Code로 포토그래퍼 사이트 Apple-like 리디자인 — 19세션, 436 tool calls"
project: "portfolio-site"
date: 2026-05-13
lang: ko
tags: [claude-code, design, static-site, animation, apple-design]
description: "하루에 19세션, 436 tool calls로 daymoon 포토그래퍼 사이트를 Apple-like으로 리디자인했다. 65KB CSS 전면 재작성부터 필기체 SVG 로고 애니메이션까지."
---

19개 세션, 436번의 tool call, 그리고 "Continue from where you left off"를 5번 이상 입력했다. `daymoon-pic-site` — 사진작가의 정적 HTML 사이트를 하루 만에 Apple-like으로 바꾼 기록이다.

**TL;DR** 65KB `!important` 범벅 CSS를 1373줄 클린 아키텍처로 전면 재작성했다. 필기체 로고 wipe 애니메이션은 `mask-position` 트릭으로 구현했다. 세션이 자꾸 중간에 끊겨서 "이어서 해줘" 패턴을 반복했다.

## 322개 파일, 6,827 insertions — 첫 커밋부터 시작

작업 시작 시점에 `daymoon-pic-site`는 git 레포가 아니었다. `.vercel/` 폴더가 있어서 배포는 되고 있었지만 버전 관리 없이 운영 중인 상태.

첫 번째 작업은 단순해 보였다. `.gitignore` 만들고 `git init` 후 커밋. 그런데 이때 Claude가 `.vercel/` 폴더를 민감 정보로 잡아내서 gitignore에 넣었다. Vercel 프로젝트 토큰이 들어있기 때문이다. 직접 했으면 실수할 수 있었던 부분이다.

첫 커밋은 `5cb7701` — 파일 322개, 6,827 insertions. 그 직후에 바로 Apple-like 리디자인 작업이 시작됐다.

## 65KB CSS를 왜 버렸나

기존 `styles.css`는 65KB였다. 레이어가 계속 쌓인 결과물이다.

```css
/* 이런 패턴이 수백 줄 */
.brand-text { font-size: 1.5rem !important; }
.header .brand-text { font-size: 1.8rem !important; }
@media (max-width: 768px) {
  .header .brand-text { font-size: 1.2rem !important; }
}
```

Claude가 상황을 정확하게 진단했다. "CSS 65KB는 시간이 지나면서 누적된 `!important` 오버라이드로 가득합니다. 깨끗한 Apple-style 재작성이 가장 효과적입니다."

결과 CSS는 1373줄. 구조는 CSS 토큰 → 리셋 → 타이포 → 레이아웃 → 헤더 → 드로어 → 애니메이션 → 섹션별 → 반응형 순서로 정리됐다. `!important`는 0개.

이 과정에서 Codex가 교차검증으로 `search-link`를 flagging했다. 돋보기 아이콘을 클릭하면 갤러리로 이동하는 가짜 검색 affordance였다. 사용자가 검색 기능으로 착각할 수 있는 UI 요소. 4개 HTML 파일과 CSS에서 전부 제거했다.

## "Continue from where you left off"의 반복

이 프로젝트에서 가장 많이 쓴 프롬프트는 아마도 이것이다.

```
Continue from where you left off.
```

또는 이런 형태.

```
Continue/finalize the current Daymoon changes. There are uncommitted changes
for script wordmark/intro/gallery tabs.
```

세션이 max turns에 걸려서 중간에 끊기는 패턴이 반복됐다. Claude는 매번 working tree diff를 읽어서 어디까지 됐는지 파악하고 이어서 진행했다. 실제로 문제는 없었다. 다만 "어디까지 됐지?"를 확인하는 시간이 발생했다.

이걸 줄이려면 작업 단위를 더 작게 쪼개야 한다. 지금은 "로고 + 인트로 + 갤러리 탭을 한 세션에"라고 시작했는데, 기능별로 세션을 나눴으면 중단이 덜 발생했을 것이다.

## mask-position으로 구현한 필기체 로고 애니메이션

인트로 시퀀스의 핵심은 `daymoon` 필기체가 손으로 써지는 것처럼 보이는 애니메이션이다.

접근법은 `mask-position` 트릭이다.

```css
.intro-mark-ink {
  -webkit-mask-image: linear-gradient(to right, black 50%, transparent 50%);
  -webkit-mask-size: 200% 100%;
  -webkit-mask-position: 100% 0;
  animation: inkReveal 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes inkReveal {
  from { -webkit-mask-position: 100% 0; }
  to   { -webkit-mask-position: 0% 0; }
}
```

글자 위에 그라디언트 마스크를 걸고, 마스크 위치를 오른쪽에서 왼쪽으로 이동시키면 왼쪽부터 글자가 드러나는 효과가 생긴다. `cubic-bezier(0.4, 0, 0.2, 1)`로 시작은 빠르게, 끝은 느리게 처리하면 붓 획처럼 느껴진다.

처음 구현할 때 타이밍 버그가 있었다. CSS 애니메이션이 1.8초 (200ms~2000ms)인데 JS 스케줄러가 2250ms에 `is-in` 클래스를 제거해버렸다. 250ms 겹침 — 워드마크가 완성 직전에 잘리는 현상. 스케줄을 2500ms로 늦추고 해결했다.

폰트는 Google Fonts의 Sacramento. CSS만으로는 원하는 수준의 필기체가 나오지 않아서 웹폰트를 추가했다. 4개 HTML 파일 모두에 preconnect와 `<link>` 태그를 넣고 cache-bust 버전을 `dm-script-20260512-4`까지 올렸다.

## 갤러리와 연락처 개선

갤러리는 모바일에서 2열이었다가 3열로 바꿨다. CSS 한 줄이다.

```css
.portfolio { grid-template-columns: repeat(3, 1fr); }
```

연락처 페이지는 폼 중심에서 Instagram DM 중심으로 바꿨다. 기존에는 이름/이메일/메시지 폼이 기본이었는데, 사진 문의는 실제로 인스타 DM으로 온다. `ig.me/m/daymoon_pic` 링크를 primary action으로 올리고 `assets/logo-instagram.svg`를 그대로 사용했다. 폼은 제거했다.

헤더 로고 중앙 정렬은 `position: absolute`로 해결했다. 왼쪽 햄버거 메뉴와 오른쪽 내비게이션이 있어서 flex 기반으로는 진짜 중앙이 나오지 않는다. 브랜드 텍스트를 `position: absolute; left: 50%; transform: translateX(-50%)`으로 띄우면 뷰포트 기준 정중앙에 고정된다.

## 도구 사용 통계

19세션, 436 tool calls의 분포는 이렇다.

Bash 202번 (46%), Read 113번 (26%), Edit 70번 (16%), Grep 31번 (7%), Write 8번, TodoWrite 4번, Agent 3번.

Read가 Edit의 1.6배다. 수정 전 읽기가 그만큼 중요하다는 뜻이기도 하지만, 세션이 끊길 때마다 working tree 상태를 다시 읽는 비용도 포함됐다. Bash가 Edit보다 거의 3배 많은 건 검증 → 실행 → 재확인 사이클이 반복됐기 때문이다.

생성 파일은 6개 (`.gitignore`, `WORKLOG.md`, `daymoon-wordmark.svg`, `contact.html`, `plan.md`, `verifier-report.md`), 수정 파일은 7개. 코드 변경 없이 git/admin 작업만 하는 세션이 5개 가까이 됐다. 커밋·푸시·WORKLOG 갱신만 하는 세션이 반복된 건 앞의 구현 세션에서 마무리를 안 한 채로 끊겼기 때문이다.

> 구현은 길게 해도 되지만, 커밋과 WORKLOG 업데이트는 구현 세션 안에 같이 끝내야 한다. 그게 분리되는 순간 "마저 해줘" 세션이 생긴다.
