---
title: "Three.js 우주 배경 위 가독성 4연타 픽스 + 파비콘 추가"
project: "saju_global"
date: 2026-03-05
lang: ko
pair: "2026-03-05-cosmic-bg-ui-polish-en"
tags: [threejs, css, favicon, ui-polish]
---

Three.js 배경을 넣었더니 텍스트가 다 뭉개졌다. 4번 연속 고쳤다.

## 별자리 선부터 잘랐다

3개 별자리에 36줄 코드를 썼는데, 실제 화면에서 `opacity: 0.12`라 거의 안 보인다. 렌더링 부담만 주고 시각적 노이즈가 되길래 통째로 삭제했다.

Claude한테 "별자리 선이 너무 옅어서 시각적 노이즈가 되고 있다. 삭제해줘." 한 줄이면 끝.

> <span class="highlight">36줄 → 0줄</span>. 과감하게 잘라야 할 때가 있다.

## 카드가 투명했다

`--bg-card`, `--bg-card-glass`, `.glassCard` 배경색이 거의 투명이었다. CSS 변수를 처음 잡을 때 반투명으로 설계했는데, 3D 별빛 위에서는 텍스트가 읽히질 않았다.

CSS 변수 4개를 `rgba(13,11,20,0.72)` 계열로 올렸다.

<div class="callout-stats">
<div class="stat-grid">
<div class="stat-item">
<span class="stat-value">~10%</span>
<span class="stat-label">Before 불투명도</span>
</div>
<div class="stat-item">
<span class="stat-value">~72%</span>
<span class="stat-label">After 불투명도</span>
</div>
</div>
</div>

## 사주 테이블은 더 세밀했다

천간/지지 한자에 `text-shadow` glow를 넣고, 행 구분선을 추가하고, highlight 열 대비를 끌어올렸다. `globals.css` 한 파일에서 다 처리했는데, Claude한테 "이 파일에서 테이블 관련 CSS만 찾아서 수정"이라고 범위를 좁혀주니 정확히 잡았다.

## 파비콘 10줄

Next.js App Router가 `app/icon.svg`를 자동 인식하는 관례를 활용했다. 별 문자(☆)에 보라→시안 그라디언트를 적용한 SVG 10줄로 완성. 별도 설정 없이 배포 즉시 반영된다.

"Next.js App Router 방식으로 파비콘 추가해줘"라는 한 마디로 올바른 경로까지 안내받았다.

---

<div class="commit-log">
<div><span class="hash">cc721f1</span> fix(ui): remove constellation lines</div>
<div><span class="hash">4aec609</span> fix(ui): increase card background opacity</div>
<div><span class="hash">b5a348d</span> fix(ui): enhance Four Pillars table readability</div>
<div><span class="hash">ae7f7eb</span> feat(ui): add favicon (SVG star icon)</div>
</div>

비주얼 문제는 스크린샷을 붙이면 한 번에 정확히 잡힌다. 커밋 4개, 작업 시간 약 30분.
