---
title: "CSS 배경 → Three.js CosmicBackground 전환, z-index 버그 4번 고치기"
project: "saju_global"
date: 2026-03-05
lang: ko
pair: "2026-03-05-threejs-cosmic-background-2-en"
tags: [three.js, css, z-index, ui, debugging]
---

CSS `body::before/::after`로 만들었던 오로라·별자리 배경을 걷어냈다.

Three.js `CosmicBackground`로 교체했다.

간단할 줄 알았는데 z-index 버그를 4번 고쳤다.


## 캔버스는 있는데 왜 안 보이냐

Three.js 캔버스가 `position: fixed`로 붙어 있는데 화면에 아무것도 안 보였다.

Claude한테 "캔버스는 있는데 왜 안 보이냐"고 물었더니, CSS reset의 `* { max-width: 100% }` 룰이 canvas를 죽이고 있다는 걸 찾아냈다.

```css
/* 문제: CSS reset이 canvas 너비를 0으로 만듦 */
* { max-width: 100%; }

/* 해결: canvas를 제외 */
*:not(canvas) { max-width: 100%; }
```

canvas를 reset에서 제외하는 것으로 첫 번째 픽스.


## body 배경색이 덮고 있었다

캔버스가 보이기 시작했다.

이번엔 body 배경색이 불투명 navy(`#0a0b2a`)로 전부 덮고 있었다.

`html`에 배경을 넘기고 `body`를 투명으로 바꿨다.

이 시점에 CSS aurora/star 코드 **51줄을 일괄 삭제**했다.

Three.js가 대체하니까 더 이상 필요 없어졌다.


## z-index가 가장 오래 걸렸다

`CosmicBackground` 캔버스가 `z-index: -2`였다.

이 값은 `html` 요소 스택 컨텍스트 밑으로 들어가서 결국 숨어버린다.

> "z-index -2는 html 루트 스택 컨텍스트 아래로 떨어진다. 캔버스를 0/1로 올리고 콘텐츠에 z-index: 2를 줘."

이 프롬프트 한 줄로 해결.

자기소개 페이지의 마그네틱 마우스 팔로우 CTA도 이 커밋에서 같이 제거했다.

복잡도 대비 효과가 없었다.


## 삽질 패턴

세 가지 원인이 독립적이었다.

| # | 원인 | 해결 |
|---|------|------|
| 1 | CSS reset이 canvas 너비를 0으로 | canvas를 reset에서 제외 |
| 2 | body 배경이 불투명 | body를 transparent로 |
| 3 | z-index 음수가 html 아래로 | z-index를 0/1로 올림 |

한 번에 하나씩 고쳐야 해서 커밋이 4개로 쪼개졌다.

결과적으로는 각 커밋의 목적이 명확해져서 오히려 좋았다.


---

### 커밋 로그

| 해시 | 메시지 |
|------|--------|
| `fcff7ec` | fix(ui): exclude canvas from max-width reset |
| `1ec4fcb` | fix(ui): remove CSS aurora/star backgrounds |
| `96a5555` | fix(ui): make body transparent for canvas |
| `052de6e` | fix(ui): fix z-index stacking, remove magnetic CTA |
| `2d71d3a` | fix: increase hook timeout to 180/240s |

### 변경 요약

| 항목 | Before | After |
|------|--------|-------|
| CSS 배경 코드 | 51줄 | 0줄 (Three.js로 이관) |
| 커밋 수 | — | 5개 (디버깅 4 + 설정 1) |
| husky timeout | 60s | 180s |

z-index 디버깅은 항상 예상보다 오래 걸린다.
