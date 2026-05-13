---
title: "FLIP 인트로 애니메이션부터 상업적 리디자인 요청까지 — Claude Code 7세션 198 tool calls"
project: "portfolio-site"
date: 2026-05-13
lang: ko
tags: [claude-code, animation, css, ui-design, daymoon]
description: "Daymoon 사진작가 포트폴리오에 FLIP 기법 인트로 애니메이션을 구현하고 모바일 드로어·타이포그래피를 정리한 7세션 198 tool calls. 마지막엔 사용자가 전체 리디자인을 요청했다."
---

필기체 로고가 헤더 위치로 날아가는 인트로 애니메이션을 하루 만에 구현했다. 그리고 같은 날 사용자가 "다시해"라고 했다.

**TL;DR** Daymoon 사진작가 포트폴리오 사이트에 FLIP 기법 인트로 애니메이션을 붙이고, Instagram 실제 로고 통합과 모바일 드로어 정리까지 마쳤다. 7세션 198 tool calls. 마지막 세션에서 사용자가 상업적 리디자인을 요청하면서 하루가 끝났다.

## 하루 시작 — 의료광고 브리핑 QA

오전 세션 두 개는 코드가 아니었다. AI가 자동 생성한 의료광고 브리핑의 사실 일치 여부를 Claude Opus로 교차검증하는 작업이었다.

프롬프트 설계가 핵심이었다.

```
Report only issues that must be fixed before delivery; if none, say OK.
```

"blocking problems only"로 범위를 좁혔다. Notice ID 10개, SERP 통계, AI 브리핑 빈도수가 `summary.json` 원본과 전부 일치했다. 결과는 OK. 2세션 13 tool calls, 파일 수정 0건. 이 패턴의 실용성은 명확하다 — 숫자 대조와 필드 존재 여부 같은 규칙 기반 검증은 AI가 더 빠르고 정확하다.

## 필기체 로고가 잘린다 — 본론 시작

오후부터 Daymoon 사진작가 포트폴리오 작업이 시작됐다. 사용자 요청은 두 가지였다.

첫째, `daymoon` 필기체 로고 하단이 잘린다. 둘째, 로고가 써지고 나서 메인 헤더 위치로 자연스럽게 이동하는 애니메이션을 원한다.

잘리는 문제부터 봤다. `script` 계열 글꼴의 디센더(descender)가 베이스라인 아래로 내려가는데, 컨테이너 `overflow: hidden`에 걸렸다. `padding-bottom`을 조금 풀고 `line-height`를 재조정했다.

## FLIP 기법으로 인트로 → 헤더 전환

인트로에서 헤더로 이동하는 애니메이션에는 두 방향이 있다. 인트로를 페이드아웃하고 헤더를 페이드인하거나, FLIP(First, Last, Invert, Play) 기법으로 실제 요소를 날리거나.

FLIP을 택했다. 단순 페이드는 두 요소가 교차하면서 어색하다. FLIP은 인트로 워드마크가 헤더 브랜드 박스 좌표까지 실제로 이동하기 때문에 연속성이 있다.

`script.js`에서 인트로 IIFE 전체를 교체했다.

1. 인트로 워드마크의 현재 좌표를 `getBoundingClientRect()`로 기록 (First)
2. 헤더 브랜드 박스 좌표를 기록 (Last)
3. 두 좌표 차이로 `translate`·`scale`을 역방향 적용 (Invert)
4. CSS transition을 켜고 `transform: none`으로 돌려보내면 실제로 날아가는 것처럼 보인다 (Play)

검증은 CDP(Chrome DevTools Protocol)로 했다. 로컬 서버를 띄우고 `body` 클래스 전환 시퀀스를 추적했다.

```bash
# CDP 검증 결과
body class: intro-active → intro-morphing → intro-done ✓
ink element lands on brand box (607,13–672,37) ✓
no console errors ✓
```

4500ms 안에 완료. Read 13회, Edit 10회, Bash 9회. Bash 9회 중 4회가 CDP 검증 스크립트였다.

## Instagram 실제 로고 — CSS 상속 충돌

다음 요청: DM 문의 버튼에 Instagram 로고를 실제로 써달라.

`logo-instagram.svg`가 `assets/`에 이미 있었다. 문제는 CSS였다. `.simple-nav .book img`에 `filter: invert(1)`이 적용되어 있어서 SVG가 흰색으로 뒤집혔다. 헤더 배경이 어두울 때를 위한 규칙인데 DM 링크까지 같이 적용됐다.

스코프 오버라이드로 해결했다. `.simple-nav .book.dm-link img { filter: none }`을 추가해서 DM 링크 이미지만 원래 색을 유지하도록 했다.

그리고 `.drawer-row.icon-link`가 `.icon-link`의 `justify-content: center`를 상속받아 모바일 드로어에서 아이콘이 중앙 정렬되는 문제도 같이 잡았다. Read, Grep으로 선택자 계층을 추적하고 Edit 2회로 끝냈다.

작은 변경이지만 두 군데가 얽혀 있어서 한 번에 보지 않으면 원인 찾기가 어렵다.

## 모바일 드로어 중복 제거 + 타이포그래피 통합

모바일 드로어를 열면 상단에 `daymoon / DM 문의`가 있고, 하단 nav에도 `DM 문의`가 따로 있었다. 두 개다.

`.drawer-login` 영역의 DM 링크를 제거하고 하단 nav의 Instagram 로고 링크만 남겼다. 드로어 상단은 브랜드명만 유지.

타이포그래피는 `letter-spacing`이 파일마다 달랐다. 헤딩에 `-0.04em`에서 `-0.07em`까지 제각각이었다. `-0.045em`으로 통일했다. Pretendard 폰트 로드도 4개 HTML에 일괄 적용했다.

```css
/* 통합 전 */
.hero-title { letter-spacing: -0.07em; }
.section-label { letter-spacing: -0.04em; }

/* 통합 후 */
h1, h2, .display { letter-spacing: -0.045em; }
```

`index.html`, `gallery.html`, `product.html`, `contact.html`, `styles.css`, `script.js` — Edit 26회, Bash 17회로 처리했다.

## 마지막 세션 — "다시해"

마지막 세션 사용자 요청:

> "다시해 제대로 상업적인 디자인 폰트 / 레이아웃 / 사진이 최대한 여러장 보이는 구조로 상품성있게 웹 / 앱 모두 고려해서"

AI가 만든 generic 디자인을 거부한 것이다. 사진 포트폴리오인데 레이아웃이 텍스트 위주로 흘렀다고 판단했다.

이 세션은 구현까지 들어가지 못하고 파일 탐색과 현황 파악으로 끝났다. `PROJECT.md`와 `WORKLOG.md`를 읽고 기존 에셋 구조를 파악하는 데 Bash 12회, Read 8회를 썼다. 다음 세션에서 실제 리디자인이 이어진다.

## 198 tool calls의 분포

7세션, 총 198 tool calls. Bash 62회, Read 61회, Edit 55회 순이었다.

Read와 Bash가 거의 동수인 게 특징이다. 코드를 바꾸기 전에 현재 상태를 확인하고, 바꾼 다음에 CDP나 grep으로 결과를 확인하는 루틴이 반복됐다. 수정 1회당 확인 1회가 붙는 구조다.

작은 CSS 문제일수록 원인 추적에 시간이 더 걸렸다. `filter` 상속이나 `letter-spacing` 불일치는 선택자 계층 전체를 추적해야 한다. 반면 FLIP 애니메이션 같은 큰 변경은 요구사항이 명확해서 오히려 빨랐다.

> 사용자가 구체적으로 말할 때 AI가 가장 빠르다. "AI/generic 거부"라는 피드백도 방향은 분명하다 — 상업적 레이아웃, 사진 중심, 반응형. 다음 세션 재료는 충분하다.
