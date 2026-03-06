---
title: "CSS 배경 → Three.js CosmicBackground 전환, z-index 버그 4번 고치기"
project: "saju_global"
date: 2026-03-05
lang: ko
pair: "2026-03-05-threejs-cosmic-background-2-en"
tags: [three.js, css, z-index, ui, debugging]
---

## 뭘 했나

- CSS `body::before/::after` 오로라·별자리 배경을 걷어내고 **Three.js CosmicBackground로 교체**
- `globals.css`에서 **51줄 삭제**
- z-index 충돌 잡는 데만 **커밋 4개** 소모

## 어떻게 구현했나

Three.js 캔버스가 `position: fixed`로 붙어 있는데 화면에 아무것도 안 보이는 상태에서 시작했다. 원인이 3개였고, 하나씩 고쳐야 해서 커밋이 4개로 쪼개졌다.

### 1차: CSS reset이 canvas를 죽임

프롬프트: "캔버스는 있는데 왜 안 보이냐"

CSS reset의 `* { max-width: 100% }` 룰이 canvas 크기를 제한하고 있었다. canvas를 reset에서 제외해서 해결.

### 2차: body 배경색이 캔버스를 덮음

`body`에 불투명 navy(`#0a0b2a`)가 설정돼 있어서 캔버스가 뒤에 숨어버렸다. `html`에 기본 배경을 넘기고 `body`를 투명으로 전환. CSS aurora/star 코드 51줄도 이 시점에 일괄 삭제.

### 3차: z-index 음수가 html 아래로 떨어짐

가장 오래 걸린 문제. `CosmicBackground` 캔버스가 `z-index: -2/-1`이었는데, 이 값은 `html` 스택 컨텍스트 아래로 들어가서 결국 안 보였다.

> "z-index -2는 html 뒤로 간다. 0/1로 올리고 main/footer에 z-index: 2를 줘."

자기소개 페이지 CTA 버튼의 마그네틱 마우스 팔로우 효과도 이 커밋에서 제거 — 복잡도 대비 효과 없음.

### 4차: husky 타임아웃 조정

Claude CLI 빌드 로그 생성에 시간이 더 필요해서 pre-push 타임아웃을 60s → 180/240s로 증가.

## 커밋 로그

- `fcff7ec` fix(ui): exclude canvas from max-width reset to fix Three.js background
- `1ec4fcb` fix(ui): remove CSS aurora/star backgrounds and make header transparent
- `96a5555` fix(ui): make body transparent so Three.js canvas at z-index -2 is visible
- `052de6e` fix(ui): fix Three.js z-index stacking, add content z-index, remove magnetic CTA
- `2d71d3a` fix: increase hook timeout to 180/240s

## 결과

| | Before | After |
|---|---|---|
| 배경 구현 | CSS aurora + star (51줄) | Three.js CosmicBackground |
| z-index 디버깅 | — | 커밋 4개 (reset → body 배경 → z-index → 타임아웃) |
| husky timeout | 60s | 180s (pre-push) / 240s (fallback) |
