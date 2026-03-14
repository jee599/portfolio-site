---
title: "사주 앱 디자인: ‘사주 사이트’를 검색하면 안 되는 이유, 그리고 Three.js로 우주를 깐 이야기"
description: "사주 사이트 디자인 검색 → 쓰레기. 본질 분해 → A(i)strology 발견 → Three.js로 별 8,000개를 깐 과정"
date: "2026-03-06"
tags: ["ai", "webdev", "threejs", "design"]
source: "devto"
---

“사주 사이트 디자인”을 검색하면 나오는 건 전부 Cafe24 템플릿이다.
빨간 배경에 금색 글씨. 용과 구름 일러스트. 어디선가 본 듯한 타로 카드 아이콘.
2008년에 만들어진 것 같은 레이아웃.

Awwwards에서 “fortune telling”을 검색해도 마찬가지다.
결과가 아예 안 나오거나, 나와도 쓸 만한 게 없다.

사주 앱의 프론트엔드를 설계하면서 처음 부딪힌 문제가 이거였다.
만들고 싶은 건 A(i)strology 같은 몰입형 다크 UI인데,
참고할 레퍼런스를 카테고리명으로 검색하면 원하는 퀄리티가 절대 안 나온다.

## 카테고리로 찾지 말고, 본질로 찾는다

레퍼런스를 찾을 때 가장 흔한 실수가 있다.
만들려는 사이트의 **카테고리명**을 그대로 검색하는 것이다.

“사주 사이트”, “fortune website”, “쇼핑몰 디자인” —
이렇게 치면 해당 카테고리에서 가장 평균적인,
가장 템플릿스러운 결과가 나온다.

뛰어난 사이트는 카테고리 태그에 묻혀 있지 않다.
대신 사이트의 **본질을 분해**하는 게 먼저다.

사주 사이트의 본질을 쪼개보면 이렇다.
개인 데이터를 입력받고,
드라마틱하게 결과를 공개하고,
개인화된 해석을 전달한다.

이건 사주만의 패턴이 아니다.
성격 테스트, 건강 진단, 별자리 앱이 전부 같은 구조다.

이 분해가 끝나면 검색 키워드가 완전히 달라진다.

## 3축으로 키워드를 만든다

본질을 분해한 뒤에는 세 가지 축으로 검색어를 조합한다.

첫 번째는 **분위기 축**이다.
`dark mystical`, `cosmic`, `neon gradient`, `spiritual` —
원하는 무드를 직접 넣는다.

두 번째는 **인터랙션 축**이다.
`quiz experience`, `result reveal`, `card flip`, `personalized onboarding`
같은 동작 패턴을 넣는다.

세 번째는 **인접 산업 축**이다.
사주 대신 `astrology app`, `personality test`, `wellness diagnostic`, `meditation`
같은 비슷한 결의 산업을 넣는다.

“사주 사이트 디자인” 대신
“astrology app dark immersive”로 검색하면 세계가 달라진다.

## A(i)strology와 Co-Star, 정반대 두 개를 고른 이유

**A(i)strology**는 Wix Studio가 만든 Awwwards Honorable Mention 사이트다.
AI 생성 이미지, 마우스 패럴랙스, 스티키 스크롤, 다크 이머시브 UI.

**Co-Star**는 정반대다.
순수 흑백. 이미지 거의 없음. 타이포그래피 하나로 승부한다.

둘을 고른 이유는 단순하다.
사주 앱에 필요한 게 두 가지였기 때문이다.

- **첫인상의 몰입감**(A(i)strology)
- **텍스트의 힘**(Co-Star)

비주얼로 끌어들이고,
해석 텍스트로 붙잡는 구조.

## React + Three.js, 풀 3D 배경을 선택한 이유

3D 배경 구현에는 세 가지 선택지가 있었다.

1. CSS 그라데이션/블러
2. 2D Canvas 파티클
3. **Three.js 풀 3D**

A(i)strology가 준 몰입감에 가장 가까운 건 Three.js였다.
카메라가 3D 공간 안에 있으면 깊이감이 자연스럽게 생긴다.

구조는 단순하다.

```text
[Layer 0] Three.js Canvas — position: fixed, z-index: 0
[Layer 1] Glow Overlay — position: fixed, z-index: 1, pointer-events: none
[Layer 2] React UI — position: relative, z-index: 10
```

## 별 8,000개, 그리고 네모 문제

초기 버전에서 바로 나온 문제:
`PointsMaterial` 기본 파티클은 네모다.

밤하늘에 네모 별이 뜨면 몰입이 깨진다.
해결은 CanvasTexture로 원형 글로우를 직접 만들고 `map`에 넣는 것.

```js
function createCircleTexture(size, coreRatio) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(coreRatio, "rgba(255,255,255,0.8)");
  grad.addColorStop(coreRatio * 3, "rgba(255,255,255,0.2)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}
```

그 다음 별 8,000개 + 성운 1,000개 + 먼지 500개로 확장.

## 우주 속으로 빨려 들어가는 느낌

별이 정지해 있으면 그냥 배경화면이다.
핵심은 z축 드리프트.

```js
const driftSpeed = 16;
for (let i = 0; i < starCount; i++) {
  starPositions[i * 3 + 2] += driftSpeed * delta;
  if (starPositions[i * 3 + 2] > 2500) {
    starPositions[i * 3 + 2] = -2500;
    starPositions[i * 3] = (Math.random() - 0.5) * 5000;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 5000;
  }
}
```

카메라 앞으로 다가오고, 지나가고, 뒤로 사라지고, 다시 생성된다.
이 반복이 “우주를 통과하는” 체감을 만든다.

## 비네트와 글로우: 시선을 가운데로

별이 화면 전체에 균일하면 시선이 흩어진다.
그래서 가장자리를 어둡게 누르는 비네트 오버레이를 넣었다.

```css
radial-gradient(
  ellipse at 50% 50%,
  transparent 40%,
  rgba(2,2,8,0.3) 60%,
  rgba(2,2,8,0.85) 80%,
  rgba(2,2,8,1) 100%
)
```

중앙에는 미세한 보랏빛 글로우를 더해
폼/결과 카드에 시선이 머물게 했다.

## 프로토타입에서 확인한 것

지금 단계에서 검증한 건 “정답”이 아니라 “방향”이다.

- 다크 코스믹 무드가 사주 앱에 맞는가
- 별 밀도/속도/깊이감이 몰입을 만드는가
- 텍스트 중심 UI와 함께 갔을 때 과하지 않은가

아직 남은 건 많다.

- GSAP ScrollTrigger 기반 씬 전환
- R3F + postprocessing Bloom
- 별자리 클릭 인터랙션
- 모바일 성능 분기(파티클 동적 축소/2D fallback)

하지만 프로토타입의 목표는 완성이 아니라 방향 확인이다.

> 레퍼런스를 카테고리로 찾으면 평균을 만든다.
> 본질로 찾으면 자기만의 것을 만든다.

[jidonglab.com](https://jidonglab.com)
